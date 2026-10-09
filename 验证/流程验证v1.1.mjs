import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {direct,revise,localizePlan} from '../核心/创作导演v1.1.mjs';
import {createProvider,readiness,downloadResult} from '../核心/生成接口v1.0.mjs';
import {compose,inspectMedia} from '../核心/合成引擎v1.0.mjs';
import {createApp} from '../创作服务v1.1.mjs';
import {copy,t,exampleCopy,serviceCopy,localizeMessage} from '../核心/语言词典v1.0.mjs';
const workspace=path.dirname(path.dirname(fileURLToPath(import.meta.url))),exec=promisify(execFile);
const plan=direct({idea:'课堂太长，我的脑子先下课了。'});
const config={imageProvider:'vidu',videoProvider:'vidu',audioProvider:'vidu',vidu:{apiKey:'test-secret',imageModel:'image-test',videoModel:'video-test',audioModel:'audio-test'},volcano:{apiKey:'test-secret',imageModel:'image-test',videoModel:'video-test'}};
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
test('保留负面表达、上下拼接和音乐独立修改',()=>{
  assert.equal(plan.scene,'classroom');assert.match(plan.prompts.image,/课堂太长/);assert.match(plan.mood,/轻讽刺/);
  assert.equal(direct({idea:'海边',layout:'unknown',duration:99}).layout,'上下');
  const change=revise(plan,'音乐换成古琴，不要人声');assert.equal(change.layer,'audio');assert.equal(change.plan.idea,plan.idea);assert.match(change.plan.prompts.audio,/古琴/);
  assert.equal(revise(plan,'镜头跟随纸飞机').layer,'all');
  const layout=revise(plan,'改成左右拼接，9:16，时长5秒');assert.equal(layout.plan.layout,'左右');assert.equal(layout.plan.ratio,'9:16');assert.equal(layout.plan.duration,5);
  assert.match(revise({...plan,music:'音'.repeat(500)},'音乐换成古琴').plan.music,/古琴/);
  assert.throws(()=>direct({idea:''}));assert.throws(()=>direct({idea:'字'.repeat(2001)}));
});
test('Vidu 合同：零参考图、单图视频、独立音频、异步查询字段',async()=>{
  const calls=[];
  const transport=async(url,opts)=>{calls.push({url,opts,body:opts.body&&JSON.parse(opts.body)});return json(url.includes('/tasks/')?{state:'success',creations:[{url:'https://media.example/result'}]}:{task_id:'test-task'});};
  const provider=createProvider(config,{transport,sleep:async()=>{}});
  for(const kind of ['image','video','audio'])assert.equal((await provider.generate(kind,plan,{image:'data:image/webp;base64,AAAA'})).url,'https://media.example/result');
  const creates=calls.filter(c=>c.body);assert.equal(creates.length,3);assert.equal(creates[0].body.images,undefined);assert.equal(creates[0].body.aspect_ratio,'16:9');
  assert.equal(creates[1].body.images.length,1);assert.equal(creates[1].body.audio,false);assert.equal(creates[1].body.duration,10);
  assert.equal(creates[2].body.duration,10);assert.equal(creates[2].opts.headers.Authorization,'Token test-secret');
});
test('方舟合同：图片 URL / Base64 和首帧 adaptive',async()=>{
  const calls=[];const c={...config,imageProvider:'volcano',videoProvider:'volcano',audioProvider:'external'};
  const provider=createProvider(c,{transport:async(url,opts)=>{calls.push({url,body:opts.body&&JSON.parse(opts.body)});return json(url.endsWith('/images/generations')?{data:[{b64_json:'aGk='}]}:opts.method==='POST'?{id:'ark-task'}:{status:'succeeded',content:{video_url:'https://media.example/video'}});}});
  assert.equal((await provider.generate('image',plan)).bytes.toString(),'hi');
  await provider.generate('video',plan,{image:'https://media.example/image'});
  const body=calls[1].body;assert.equal(body.ratio,'adaptive');assert.equal(body.content[1].role,'first_frame');assert.equal(body.generate_audio,false);
  assert.equal(readiness(c).hasIndependentAudio,false);assert.equal(JSON.stringify(readiness(c)).includes('test-secret'),false);
});
test('失败、取消、缺少 URL 和未知状态不能成为成功结果',async()=>{
  for(const state of ['failed','cancelled','unrecognized','succeeded']) {
    const c={...config,videoProvider:'volcano'};
    const provider=createProvider(c,{transport:async(url,opts)=>json(opts.method==='POST'?{id:'task'}:{status:state,content:{}}),sleep:async()=>{}});
    await assert.rejects(()=>provider.generate('video',plan,{image:'https://media.example/a'}));
  }
  const provider=createProvider(config,{transport:async()=>new Response('not json',{status:401})});
  await assert.rejects(()=>provider.generate('image',plan),/HTTP 401/);
});
test('下载拒绝内部网络、空文件和超限文件',async()=>{
  await assert.rejects(()=>downloadResult({url:'http://example.com/a'}),/HTTPS/);
  await assert.rejects(()=>downloadResult({url:'https://localhost/a'},{resolve:async()=>[{address:'127.0.0.1'}]}),/内部网络/);
  const options={resolve:async()=>[{address:'8.8.8.8'}],transport:async()=>new Response(Buffer.alloc(16))};
  await assert.rejects(()=>downloadResult({url:'https://example.com/a'},{...options,limit:8}),/过大/);
  assert.equal((await downloadResult({url:'https://example.com/a'},options)).length,16);
});
test('Muse 示例哈希与音视频流一致',async()=>{
  const manifest=JSON.parse(await readFile(path.join(workspace,'示例','素材来源v1.0.json')));
  for(const entry of manifest.entries){
    for(const file of Object.values(entry.files)){const bytes=await readFile(path.join(workspace,'示例',file.name));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);}
    const info=await inspectMedia(path.join(workspace,'示例',entry.files.video.name),'video');assert.ok(Math.abs(info.duration-10)<.2);assert.ok(info.hasAudio);
  }
});
test('替换配乐：真实 FFmpeg 合成保留视频流，输出音频并收尾',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'nianjing-media-'));
  try {
    const video=path.join(workspace,'示例','灯笼古镇v1.0.mp4'),audio=path.join(temp,'验证音频v1.0.wav'),final=path.join(temp,'验证成片v1.0.mp4');
    await exec('ffmpeg',['-y','-v','error','-f','lavfi','-i','sine=frequency=440:duration=3',audio]);
    const info=await compose(video,audio,final);assert.ok(info.hasAudio);assert.ok(Math.abs(info.duration-10)<.2);
    const hash=async file=>(await exec('ffmpeg',['-v','error','-i',file,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'])).stdout.trim();
    assert.equal(await hash(video),await hash(final));
    await writeFile(path.join(temp,'无效视频v1.0.mp4'),'not media');await assert.rejects(()=>inspectMedia(path.join(temp,'无效视频v1.0.mp4'),'video'));
  } finally {await rm(temp,{recursive:true,force:true});}
});
test('HTTP 全流程：构想、导入、合成、Range、拒绝越界和跨来源请求',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'nianjing-server-'));
  const {server}=await createApp({workspace,store:path.join(temp,'作品'),configPath:path.join(temp,'服务配置v1.0.json')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  const post=async(route,data)=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(data)});
  try {
    assert.equal((await fetch(base+'/api/settings')).status,200);
    assert.equal((await post('/api/jobs',{idea:'雪山',mode:'api'})).status,400);
    const response=await post('/api/jobs',{idea:'让雪山走进画纸'});assert.equal(response.status,201);const job=await response.json();
    assert.equal(job.state,'awaiting');assert.deepEqual(job.assets,{});
    const bytes=await readFile(path.join(workspace,'示例','雪山木屋v1.0.mp4'));
    const upload=await fetch(`${base}/api/jobs/${job.id}/upload?kind=video`,{method:'POST',headers:{Origin:base,'Content-Type':'application/octet-stream'},body:bytes});assert.equal(upload.status,200);
    const final=await (await post(`/api/jobs/${job.id}/compose`,{})).json();assert.equal(final.state,'complete');assert.ok(final.media.final.hasAudio);
    const range=await fetch(base+final.assets.final,{headers:{Range:'bytes=0-31'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,32);
    assert.equal((await fetch(base+'/服务配置示例v1.0.json')).status,404);
    assert.equal((await fetch(base+'/api/jobs/no-id')).status,400);
    assert.equal((await fetch(base+'/api/jobs',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
    assert.equal((await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
test('API 编排离线全流程：先图片、再视频和音频，真实媒体校验与合成',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'nianjing-pipeline-')),events=[];
  await writeFile(path.join(temp,'服务配置v1.0.json'),JSON.stringify(config));
  const image=await readFile(path.join(workspace,'示例','灯笼古镇v1.0.webp')),video=await readFile(path.join(workspace,'示例','灯笼古镇v1.0.mp4'));
  const audioFile=path.join(temp,'测试配乐v1.0.wav');await exec('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=330:duration=10',audioFile]);const audio=await readFile(audioFile);
  const {server}=await createApp({workspace,store:path.join(temp,'作品'),configPath:path.join(temp,'服务配置v1.0.json'),providerFactory:()=>({generate:async(kind,plan,{image:first,onTask})=>{events.push(kind);if(kind==='video')assert.match(first,/^data:image\/webp;base64,/);onTask?.('offline-test-'+kind);return {bytes:{image,video,audio}[kind]};}})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const settings=await (await fetch(base+'/api/settings')).json();assert.equal(settings.canGenerate,true);assert.equal(JSON.stringify(settings).includes('test-secret'),false);
    const job=await (await fetch(base+'/api/jobs',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({idea:'古镇',mode:'api'})})).json();
    let next;
    for(let tries=0;tries<100;tries++){next=await (await fetch(`${base}/api/jobs/${job.id}`)).json();if(!['generating','composing'].includes(next.state))break;await new Promise(r=>setTimeout(r,20));}
    assert.equal(next.state,'complete',next.message);assert.deepEqual(events,['image','video','audio']);assert.ok(next.assets.image);assert.match(next.assets.audio,/\.wav$/);assert.ok(next.media.final.hasAudio);assert.equal(next.tasks.video.id,'offline-test-video');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
test('中英文词典完整，界面翻译标记均有对应文案',async()=>{
  for(const [key,pair] of Object.entries(copy)){assert.equal(pair.length,2);assert.ok(pair.every(value=>typeof value==='string' && value.trim()));assert.equal(t(key,'en'),pair[1]);}
  const html=await readFile(path.join(workspace,'界面','创作桌v1.1.html'),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-placeholder|-aria|-alt)?="([^"]+)"/g))assert.ok(copy[match[1]],`Missing: ${match[1]}`);
  for(const key of ['export','savePlan','compose','backTop','regenerateAudio'])assert.ok(html.includes(`data-i18n="${key}"`));
  assert.equal(Object.keys(exampleCopy).length,4);assert.equal(Object.keys(serviceCopy).length,6);
});
test('英文想法生成三类英文指令，并支持英文音乐、布局与时长修改',()=>{
  const original='My mind left class early. Let my notes become paper planes.';
  const english=direct({language:'en',idea:original});assert.equal(english.scene,'classroom');assert.equal(english.idea,original);
  for(const prompt of Object.values(english.prompts))assert.equal(/[\u3400-\u9fff]/.test(prompt),false);
  const audio=revise(english,'Make the music gentle piano, no vocals');assert.equal(audio.layer,'audio');assert.match(audio.plan.prompts.audio,/gentle piano/);
  const visual=revise(english,'Use a side-by-side layout, 9:16, for 5 seconds');assert.equal(visual.layer,'all');assert.equal(visual.plan.layout,'左右');assert.equal(visual.plan.duration,5);assert.equal(visual.plan.ratio,'9:16');
  assert.equal(direct({language:'en',idea:'a snowy cabin'}).scene,'cabin');assert.equal(direct({language:'en',idea:'a forest in autumn'}).scene,'forest');assert.equal(direct({language:'en',idea:'waves on the beach'}).scene,'ocean');
});
test('切换语言保留原话与自定偏好，旧作品可以生成另一语言的指令',()=>{
  const original='有点累，想在海边坐一会。',music='Guqin, very quiet';
  const zh=direct({idea:original,music}),en=localizePlan(zh,'en'),back=localizePlan(en,'zh');
  assert.equal(en.idea,original);assert.equal(en.preferences.music,music);assert.equal(back.idea,original);assert.equal(back.preferences.music,music);
  assert.match(en.prompts.image,/Original idea:/);assert.match(back.prompts.image,/用户原话/);
  const legacy={...zh,version:'0.1.0',preferences:undefined,mood:'释然、安静、想透一口气'};assert.equal(localizePlan(legacy,'en').idea,original);
});
test('英文 HTTP 流程与错误：生成指令、修改、读取旧任务及静态模块',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'nianjing-language-'));
  const {server}=await createApp({workspace,store:path.join(temp,'作品'),configPath:path.join(temp,'服务配置v1.0.json')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  const post=async(route,data)=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Nianjing-Language':'en'},body:JSON.stringify(data)});
  try{
    const error=await (await post('/api/jobs',{idea:'quiet waves',mode:'api'})).json();assert.match(error.error,/not ready/);assert.equal(/[\u3400-\u9fff]/.test(error.error),false);
    const job=await (await post('/api/jobs',{idea:'quiet waves'})).json();assert.equal(job.plan.language,'en');assert.match(job.message,/Your prompts are ready/);
    const change=await (await post(`/api/jobs/${job.id}/revise`,{change:'Music should be soft piano'})).json();assert.equal(change.changedLayer,'audio');assert.match(change.message,/Prompts updated/);
    const chinese=await (await fetch(`${base}/api/jobs/${job.id}`,{headers:{'X-Nianjing-Language':'zh'}})).json();assert.match(chinese.plan.prompts.image,/用户原话/);assert.equal(chinese.plan.idea,'quiet waves');
    const module=await fetch(base+'/语言词典v1.0.mjs');assert.equal(module.status,200);assert.match(module.headers.get('content-type'),/javascript/);
    assert.equal(localizeMessage('成片已导出，包含音轨。','en'),'Film exported with an audio track.');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
