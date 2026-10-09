import http from 'node:http';
import {readFile,writeFile,mkdir,stat,rename,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {direct,revise,localizePlan} from './核心/创作导演v1.1.mjs';
import {loadConfig,readiness,createProvider,downloadResult} from './核心/生成接口v1.0.mjs';
import {normalizeLanguage,localizeMessage} from './核心/语言词典v1.0.mjs';
import {inspectMedia,compose} from './核心/合成引擎v1.0.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const names={image:'拼接画面v1.0.webp',video:'动态视频v1.0.mp4',audio:'配乐v1.0.mp3',final:'成片v1.0.mp4'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4','.ogg':'audio/ogg','.flac':'audio/flac','.json':'application/json; charset=utf-8'};
const validId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
function publicJob(job,language='zh') {
  return {...job,plan:localizePlan(job.plan,language),messageSource:job.message,message:localizeMessage(job.message,language),warnings:job.warnings.map(message=>localizeMessage(message,language)),assets:Object.fromEntries(Object.entries(job.assets).map(([kind,name])=>[kind,`/作品/${job.id}/${encodeURIComponent(name)}`]))};
}
async function body(req,limit) {
  if(Number(req.headers['content-length'])>limit) throw new Error('文件或请求超过大小限制。');
  const chunks=[];let size=0;
  for await(const chunk of req) {size+=chunk.length;if(size>limit) throw new Error('文件或请求超过大小限制。');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
async function jsonBody(req) {
  if(!req.headers['content-type']?.startsWith('application/json')) throw new Error('请使用 JSON 请求。');
  try {return JSON.parse((await body(req,64*1024)).toString());}catch(e){throw new Error(e.message.includes('限制')?e.message:'请求内容不是有效 JSON。');}
}
export async function createApp({workspace=root,store=path.join(workspace,'本地作品'),configPath=process.env.NIANJING_CONFIG || path.join(workspace,'私有','服务配置v1.0.json'),providerFactory=createProvider,download=downloadResult}={}) {
  await mkdir(store,{recursive:true});
  const jobs=new Map(),busy=new Set(),writes=new Map();
  const jobDir=id=>path.join(store,id);
  async function save(job) {
    const snapshot=JSON.stringify(job,null,2),target=path.join(jobDir(job.id),'作品构想v1.0.json');
    const pending=(writes.get(job.id) || Promise.resolve()).catch(()=>{}).then(async()=>{await writeFile(target+'.临时v1.0',snapshot);await rename(target+'.临时v1.0',target);});
    writes.set(job.id,pending);await pending;
  }
  async function getJob(id) {
    if(!validId(id)) throw new Error('作品不存在。');
    if(!jobs.has(id)) {
      let job;
      try {job=JSON.parse(await readFile(path.join(jobDir(id),'作品构想v1.0.json'),'utf8'));}catch{throw new Error('作品不存在。');}
      if(['generating','composing'].includes(job.state)) {job.state='interrupted';job.message='上次运行中断。请查看第三方任务记录，已有素材仍可导入并合成。';}
      jobs.set(id,job);
    }
    return jobs.get(id);
  }
  async function put(job,kind,bytes) {
    if(!bytes.length) throw new Error('文件为空。');
    const temp=path.join(jobDir(job.id),names[kind]+'.导入v1.0');
    try {
      await writeFile(temp,bytes);const info=await inspectMedia(temp,kind);
      const extension=kind==='image'?({png:'png',mjpeg:'jpg',webp:'webp'}[info.codec]):kind==='audio'?(info.format?.includes('wav')?'wav':info.format?.includes('ogg')?'ogg':info.format?.includes('flac')?'flac':info.format?.includes('mp3')?'mp3':'m4a'):'mp4';
      const name=names[kind].replace(/\.[^.]+$/,'.'+extension),target=path.join(jobDir(job.id),name);
      const old=job.assets[kind];await rename(temp,target);if(old && old!==name)await rm(path.join(jobDir(job.id),old),{force:true});
      job.assets[kind]=name;job.media[kind]=info;delete job.assets.final;await save(job);
    }
    finally{await rm(temp,{force:true});}
  }
  async function finish(job) {
    if(!job.assets.video) throw new Error('请先导入或生成视频。');
    job.state='composing';job.message='正在保留视频画面并合成音轨…';await save(job);
    const info=await compose(path.join(jobDir(job.id),job.assets.video),job.assets.audio?path.join(jobDir(job.id),job.assets.audio):null,path.join(jobDir(job.id),names.final));
    job.assets.final=names.final;job.media.final=info;job.state='complete';
    job.message=info.hasAudio?'成片已导出，包含音轨。':'成片已导出，当前没有音轨；可导入音乐后再次合成。';await save(job);
  }
  async function pipeline(job,config,audioOnly=false) {
    busy.add(job.id);
    try {
      const provider=providerFactory(config);const flags=readiness(config);
      job.state='generating';job.message=audioOnly?'正在生成新配乐…':'正在生成拼接图片…';await save(job);
      async function generate(kind,image) {
        const result=await provider.generate(kind,job.plan,{image,onTask:id=>{job.tasks[kind]={provider:config[`${kind}Provider`],id};void save(job).catch(()=>{});}});
        await save(job);
        await put(job,kind,await download(result,{limit:kind==='image'?15*1024*1024:100*1024*1024}));
      }
      if(!audioOnly) {
        await generate('image');
        const bytes=await readFile(path.join(jobDir(job.id),job.assets.image));
        const format=bytes.subarray(0,4).equals(Buffer.from('RIFF'))?'image/webp':bytes[0]===0x89?'image/png':'image/jpeg';
        const image=`data:${format};base64,${bytes.toString('base64')}`;
        job.message='图片已生成，正在生成动态视频和配乐…';await save(job);
        const results=await Promise.allSettled([generate('video',image),...(flags.hasIndependentAudio?[generate('audio')]:[])]);
        const errors=results.filter(r=>r.status==='rejected').map(r=>r.reason.message);
        job.warnings=errors;
        if(!job.assets.video) throw new Error(errors[0] || '视频生成未完成。');
      } else {await generate('audio');}
      await finish(job);
      if(job.warnings.length){job.message+=' 部分素材生成失败，可查看提示并补充导入。';await save(job);}
    } catch(e) {job.state='failed';job.message=e.message;await save(job);}
    finally{busy.delete(job.id);}
  }
  async function serveFile(req,res,file,download=false) {
    const info=await stat(file);if(!info.isFile()) throw new Error('文件不存在。');
    const headers={'Content-Type':types[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    if(download) {
      const english=new URL(req.url,'http://localhost').searchParams.get('lang')==='en';
      const filename=english?'Creative-filmv1.1'+path.extname(file):path.basename(file);
      headers['Content-Disposition']=`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
    }
    let start=0,end=info.size-1,status=200;
    if(req.headers.range) {
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match || (!match[1]&&!match[2])) {res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      if(!match[1]) start=Math.max(0,info.size-Number(match[2]));
      else {start=Number(match[1]);if(match[2]) end=Math.min(end,Number(match[2]));}
      if(start>end || start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }
  const server=http.createServer(async(req,res)=>{
    const language=normalizeLanguage(req.headers['x-nianjing-language'] || req.headers['accept-language']);
    function send(status,data) {if(res.headersSent)return;if(data.error)data={...data,errorSource:data.error,error:localizeMessage(data.error,language)};res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
    try {
      const host=req.headers.host || '';
      if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return send(403,{error:'只允许本机访问。'});
      const url=new URL(req.url,`http://${host}`),route=decodeURIComponent(url.pathname);
      res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; media-src 'self' blob:; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      res.setHeader('Referrer-Policy','no-referrer');
      if(req.method==='POST' && req.headers.origin!==`http://${host}`) return send(403,{error:'请求来源不匹配，请在本地创作桌操作。'});
      if(req.method==='GET' && route==='/api/settings') return send(200,readiness(await loadConfig(configPath)));
      if(req.method==='GET' && route==='/api/services') return send(200,JSON.parse(await readFile(path.join(workspace,'服务清单v1.0.json'),'utf8')));
      if(req.method==='GET' && route==='/api/examples') {
        const manifest=JSON.parse(await readFile(path.join(workspace,'示例','素材来源v1.0.json'),'utf8'));
        return send(200,manifest.entries.map(e=>({...e,image:`/示例/${encodeURIComponent(e.files.image.name)}`,video:`/示例/${encodeURIComponent(e.files.video.name)}`})));
      }
      if(req.method==='POST' && route==='/api/plan') return send(200,direct({...await jsonBody(req),language}));
      if(req.method==='POST' && route==='/api/jobs') {
        const input=await jsonBody(req),plan=direct({...input,language:input.language || language}),config=await loadConfig(configPath);
        if(input.mode==='api' && !readiness(config).canGenerate) throw new Error('图片和视频 API 尚未配置完成。可先使用外部创作与导入。');
        const job={id:randomUUID(),plan,state:'awaiting',message:'创作指令已备好。可复制到 Muse 等服务，然后导入视频与音乐。',assets:{},media:{},tasks:{},warnings:[],createdAt:new Date().toISOString()};
        await mkdir(jobDir(job.id),{recursive:true});jobs.set(job.id,job);await save(job);
        if(input.mode==='api') {job.state='generating';job.message='已提交本地生成流程。';void pipeline(job,config);}
        return send(201,publicJob(job,language));
      }
      const match=/^\/api\/jobs\/([^/]+)(?:\/(upload|compose|revise))?$/.exec(route);
      if(match) {
        const job=await getJob(match[1]),action=match[2];
        if(req.method==='GET' && !action) return send(200,publicJob(job,language));
        if(req.method!=='POST') return send(405,{error:'请求方法不支持。'});
        if(busy.has(job.id)) return send(409,{error:'当前作品正在处理，请稍候。'});
        if(action==='upload') {
          const kind=url.searchParams.get('kind');if(!['image','video','audio'].includes(kind)) throw new Error('素材类型不支持。');
          busy.add(job.id);
          try {await put(job,kind,await body(req,kind==='image'?15*1024*1024:100*1024*1024));job.state='awaiting';job.message='素材已验证并导入，可继续合成导出。';await save(job);}
          finally{busy.delete(job.id);}
          return send(200,publicJob(job,language));
        }
        if(action==='compose') {
          busy.add(job.id);
          try {await finish(job);}catch(e){job.state='failed';job.message=e.message;await save(job);throw e;}finally{busy.delete(job.id);}
          return send(200,publicJob(job,language));
        }
        if(action==='revise') {
          const input=await jsonBody(req),change=revise(localizePlan(job.plan,input.language || language),input.change);
          if(input.generate && (change.layer!=='audio' || !job.assets.video)) throw new Error('此入口只生成独立配乐；画面修改请使用新构想重新创作。');
          const config=await loadConfig(configPath);
          if(input.generate && !readiness(config).hasIndependentAudio) throw new Error('独立音乐 API 尚未配置。可复制音乐指令或导入音频。');
          job.plan=change.plan;job.message='指令已更新。现有画面与音轨尚未改变。';await save(job);
          if(input.generate) void pipeline(job,config,true);
          return send(200,{...publicJob(job,language),changedLayer:change.layer});
        }
        return send(404,{error:'入口不存在。'});
      }
      if(['GET','HEAD'].includes(req.method)) {
        const staticFiles={'/':'界面/创作桌v1.1.html','/纸上风格v1.1.css':'界面/纸上风格v1.1.css','/交互逻辑v1.1.js':'界面/交互逻辑v1.1.js','/语言词典v1.0.mjs':'核心/语言词典v1.0.mjs','/创作导演v1.1.mjs':'核心/创作导演v1.1.mjs'};
        if(staticFiles[route]) return await serveFile(req,res,path.join(workspace,staticFiles[route]));
        if(route.startsWith('/示例/')) {
          const name=route.slice(4),manifest=JSON.parse(await readFile(path.join(workspace,'示例','素材来源v1.0.json'),'utf8'));
          if(manifest.entries.some(e=>[e.files.image.name,e.files.video.name].includes(name))) return await serveFile(req,res,path.join(workspace,'示例',name),url.searchParams.has('download'));
        }
        const asset=/^\/作品\/([^/]+)\/([^/]+)$/.exec(route);
        if(asset) {const job=await getJob(asset[1]);if(Object.values(job.assets).includes(asset[2])) return await serveFile(req,res,path.join(jobDir(job.id),asset[2]),url.searchParams.has('download'));}
      }
      return send(404,{error:'入口不存在。'});
    }catch(e){return send(400,{error:e.code==='ENOENT'?'文件不存在。':e.message || '操作未完成。'});}
  });
  return {server,jobs};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.NIANJING_PORT || 8787);
  const {server}=await createApp();
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被占用，可设置 NIANJING_PORT。`:e.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`念景创作桌已启动：http://127.0.0.1:${port}`));
}
