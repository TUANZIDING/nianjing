import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
const roots = {volcano:'https://ark.cn-beijing.volces.com/api/v3',vidu:'https://api.vidu.cn/ent/v2'};
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
export async function loadConfig(path, env=process.env) {
  let config={};
  try { config=JSON.parse(await readFile(path,'utf8')); }
  catch(e) { if(e.code!=='ENOENT') throw new Error('服务配置无法读取，请检查 JSON 格式。'); }
  config.volcano={...config.volcano,apiKey:env.VOLCENGINE_API_KEY || config.volcano?.apiKey || ''};
  config.vidu={...config.vidu,apiKey:env.VIDU_API_KEY || config.vidu?.apiKey || ''};
  return config;
}
export function readiness(config) {
  const layers={};
  for(const kind of ['image','video','audio']) {
    const provider=config[`${kind}Provider`] || 'external';
    const supported=provider==='vidu' || (provider==='volcano' && kind!=='audio');
    layers[kind]={provider,ready:!!(supported && config[provider]?.apiKey && config[provider]?.[`${kind}Model`])};
  }
  return {layers,canGenerate:layers.image.ready && layers.video.ready,hasIndependentAudio:layers.audio.ready,
    notice:'API 请求由你的第三方账户计费。适配器通过离线合同测试，尚未付费实测。'};
}
export function createProvider(config,{transport=fetch,sleep=pause,pollMs=3000,deadlineMs=20*60*1000}={}) {
  async function request(provider,path,body) {
    const key=config[provider]?.apiKey;
    if(!key) throw new Error('所选服务没有配置 API Key。');
    let response;
    try { response=await transport(roots[provider]+path,{
      method:body ? 'POST' : 'GET',headers:{'Content-Type':'application/json',Authorization:`${provider==='vidu'?'Token':'Bearer'} ${key}`},
      body:body ? JSON.stringify(body) : undefined,signal:AbortSignal.timeout(60000)
    }); } catch { throw new Error('生成服务连接超时或不可达。'); }
    if(!response.ok) throw new Error(`生成服务返回 HTTP ${response.status}。请在第三方控制台检查权限、模型和余额。`);
    let data;
    try { data=await response.json(); } catch { throw new Error('生成服务返回了无法解析的响应。'); }
    return data;
  }
  async function poll(provider,id,onTask) {
    if(!id || typeof id!=='string' || id.length>200) throw new Error('服务未返回有效任务 ID。');
    onTask?.(id);
    const start=Date.now();
    while(Date.now()-start < deadlineMs) {
      const data=await request(provider,provider==='vidu'?`/tasks/${encodeURIComponent(id)}/creations`:`/contents/generations/tasks/${encodeURIComponent(id)}`);
      const state=provider==='vidu'?data.state:data.status;
      if(state===(provider==='vidu'?'success':'succeeded')) {
        const url=provider==='vidu'?data.creations?.[0]?.url:data.content?.video_url;
        if(!url) throw new Error('任务显示成功，但没有返回生成物地址。');
        return {url};
      }
      if(['failed','cancelled'].includes(state)) throw new Error(`第三方生成任务${state==='cancelled'?'已取消':'失败'}。请查看第三方任务记录。`);
      if(!['created','queueing','processing','queued','running'].includes(state)) throw new Error('生成服务返回了未知的任务状态。');
      await sleep(pollMs);
    }
    throw new Error('等待生成超过 20 分钟。任务可能仍在第三方运行；请在控制台查看，避免重复提交。');
  }
  async function generate(kind,plan,{image,onTask}={}) {
    const provider=config[`${kind}Provider`],settings=config[provider];
    if(!readiness(config).layers[kind]?.ready) throw new Error(`${kind} 服务尚未配置完成。`);
    const model=settings[`${kind}Model`];
    let body,path;
    if(kind==='image' && provider==='volcano') {
      body={model,prompt:plan.prompts.image,size:settings.imageSize || '2K',response_format:'url'}; path='/images/generations';
      const data=await request(provider,path,body);
      const item=data.data?.[0];
      if(item?.url) return {url:item.url};
      if(item?.b64_json) return {bytes:Buffer.from(item.b64_json,'base64')};
      throw new Error('图片服务没有返回有效图片。');
    }
    if(kind==='image') {body={model,prompt:plan.prompts.image,aspect_ratio:plan.ratio,resolution:settings.imageResolution || '1080p'};path='/reference2image';}
    if(kind==='video') {
      if(!image) throw new Error('视频生成缺少首帧图片。');
      if(provider==='vidu') {
        body={model,images:[image],prompt:plan.prompts.video,duration:plan.duration,resolution:settings.videoResolution || '1080p',audio:!!settings.nativeAudio,off_peak:false};path='/img2video';
      } else {
        body={model,content:[{type:'text',text:plan.prompts.video},{type:'image_url',image_url:{url:image},role:'first_frame'}],duration:plan.duration,ratio:'adaptive',resolution:settings.videoResolution || '720p',generate_audio:!!settings.nativeAudio};path='/contents/generations/tasks';
      }
    }
    if(kind==='audio') {body={model,prompt:plan.prompts.audio,duration:plan.duration,seed:0};path='/text2audio';}
    const data=await request(provider,path,body);
    return poll(provider,provider==='vidu'?data.task_id:data.id,onTask);
  }
  return {generate};
}
function privateAddress(ip) {
  if(isIP(ip)===4) {
    const [a,b]=ip.split('.').map(Number);
    return a===0 || a===10 || a===127 || a>=224 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || (a===100&&b>=64&&b<=127) || (a===198&&(b===18||b===19));
  }
  const lower=ip.toLowerCase();
  return !lower.startsWith('2') && !lower.startsWith('3');
}
export async function downloadResult(result,{limit=100*1024*1024,transport=fetch,resolve=lookup}={}) {
  if(result.bytes) {if(!result.bytes.length) throw new Error('生成服务返回了空文件。');if(result.bytes.length>limit) throw new Error('生成文件过大。');return result.bytes;}
  let current=result.url;
  for(let redirects=0;redirects<4;redirects++) {
    const url=new URL(current);
    if(url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443')) throw new Error('生成物必须使用公开 HTTPS 地址。');
    const addresses=await resolve(url.hostname.replace(/^\[|\]$/g,''),{all:true});
    if(!addresses.length || addresses.some(a=>privateAddress(a.address))) throw new Error('拒绝从内部网络地址下载生成物。');
    const response=await transport(url,{redirect:'manual',signal:AbortSignal.timeout(120000)});
    if([301,302,303,307,308].includes(response.status)) {current=new URL(response.headers.get('location'),url).href;continue;}
    if(!response.ok) throw new Error(`生成物下载失败（HTTP ${response.status}）。`);
    if(Number(response.headers.get('content-length'))>limit) throw new Error('生成文件过大。');
    const chunks=[];let bytes=0;
    for await(const chunk of response.body) {bytes+=chunk.length;if(bytes>limit){await response.body.cancel?.().catch(()=>{});throw new Error('生成文件过大。');}chunks.push(chunk);}
    if(!bytes) throw new Error('生成服务返回了空文件。');
    return Buffer.concat(chunks);
  }
  throw new Error('生成物重定向次数过多。');
}
