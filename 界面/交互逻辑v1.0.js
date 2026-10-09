const $=id=>document.getElementById(id);
let job=null,kind='image',settings=null,watch=null,locked=false;
async function request(url,options={}) {
  const response=await fetch(url,options),data=await response.json();
  if(!response.ok) throw new Error(data.error || '操作没有完成。');return data;
}
const post=(url,data)=>request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
function inputs(){return {idea:$('idea').value,mood:$('mood').value,music:$('music').value,ratio:$('ratio').value,duration:$('duration').value,layout:$('layout').value,drawing:$('drawing').value};}
function applyPlan(plan){for(const name of ['idea','mood','music','ratio','duration','layout','drawing']) $(name).value=plan[name];}
function updateControls(){
  const processing=job && ['generating','composing'].includes(job.state);
  $('create-button').disabled=locked || processing;
  $('copy-prompt').disabled=!job || locked;
  $('save-plan').disabled=!job || locked;
  $('revise-button').disabled=!job || locked || processing;
  $('compose-button').disabled=!job || locked || processing || (!job.assets.video && !$('video-file').files.length);
  $('regenerate-audio').hidden=!settings?.hasIndependentAudio || !job?.assets.video;
  $('regenerate-audio').disabled=locked || processing;
  for(const name of ['video','audio','image']) $(`${name}-file`).disabled=locked || processing;
}
function setPrompt(){if(job){$('prompt').value=job.plan.prompts[kind];$('plan-title').textContent=job.plan.title;}}
function showMedia(video,image,label,final=null){
  $('placeholder').hidden=!!(video || image);$('preview').hidden=!video;$('image-preview').hidden=!!video || !image;
  $('preview').pause();
  if(video){if($('preview').getAttribute('src')!==video){$('preview').src=video;$('preview').load();}if(image)$('preview').poster=image;else $('preview').removeAttribute('poster');}
  else {$('preview').removeAttribute('src');$('preview').load();}
  if(image) $('image-preview').src=image;
  $('preview-label').textContent=label;$('export-link').hidden=!final;
  if(final)$('export-link').href=final+'?download=1';else $('export-link').removeAttribute('href');
}
function renderJob(next){
  job=next;setPrompt();
  try{localStorage.setItem('nianjing-last-job',job.id);}catch{}
  const stages={awaiting:'等待导入',generating:'正在生成',composing:'正在合成',complete:'成片已完成',failed:'流程未完成',interrupted:'运行已中断'};
  $('stage').textContent=stages[job.state] || '创作中';notice(job.message,job.state==='failed');
  const label=job.assets.final?'当前作品 · 本地合成成片':job.assets.video?'当前作品 · 已导入或生成的视频':job.assets.image?'当前作品 · 拼接图片':'当前没有新作品';
  showMedia(job.assets.final || job.assets.video,job.assets.image,label,job.assets.final);
  for(const name of ['video','audio','image']) if(job.assets[name]) $(`${name}-info`).textContent='已导入 / 生成 · '+(job.media[name]?.duration?job.media[name].duration.toFixed(1)+' 秒':'图片');
  updateControls();
}
function stopWatch(){if(watch)clearTimeout(watch);watch=null;}
function watchJob(id){
  stopWatch();watch=setTimeout(async()=>{
    try {const next=await request('/api/jobs/'+id);if(job?.id!==id)return;renderJob(next);if(['generating','composing'].includes(next.state)) watchJob(id);}
    catch(e){notice('暂时无法读取进度：'+e.message,true);updateControls();}
  },1800);
}
async function run(action){locked=true;updateControls();try{await action();}catch(e){notice(e.message,true);}finally{locked=false;updateControls();}}
$('idea-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
  stopWatch();try{localStorage.setItem('nianjing-draft',JSON.stringify(inputs()));}catch{}
  for(const name of ['video','audio','image']){$(`${name}-file`).value='';$(`${name}-info`).textContent=name==='audio'?'沿用视频原有音轨，或用新音乐替换':'尚未导入';}
  const next=await post('/api/jobs',{...inputs(),changes:job?.plan.idea===$('idea').value?job.plan.changes:'',mode:$('mode').value});renderJob(next);
  if(next.state==='generating')watchJob(next.id);else $('import-area').open=true;
  location.hash='studio';
});});
document.querySelectorAll('[role=tab]').forEach(tab=>{
  function select(){kind=tab.dataset.kind;document.querySelectorAll('[role=tab]').forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});$('prompt-panel').setAttribute('aria-labelledby',tab.id);setPrompt();}
  tab.addEventListener('click',select);
  tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[role=tab]')],i=tabs.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();}});
});
$('copy-prompt').addEventListener('click',()=>run(async()=>{try{await navigator.clipboard.writeText($('prompt').value);notice('这条创作指令已复制。');}catch{$('prompt').focus();$('prompt').select();notice('请用复制快捷键复制已选中的指令。');}}));
$('save-plan').addEventListener('click',()=>{const text=`# ${job.plan.title}\n\n原话：${job.plan.idea}\n\n${Object.entries(job.plan.prompts).map(([k,v])=>`## ${{image:'拼接画面',video:'动态短片',audio:'音乐'}[k]}\n\n${v}`).join('\n\n')}\n\n本版导演：${job.plan.director}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='创作构想v1.0.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
async function change(generate){const next=await post(`/api/jobs/${job.id}/revise`,{change:$('revision').value,generate});renderJob(next);applyPlan(next.plan);if(generate)watchJob(next.id);}
$('revision-form').addEventListener('submit',event=>{event.preventDefault();run(()=>change(false));});
$('regenerate-audio').addEventListener('click',()=>run(()=>change(true)));
for(const name of ['video','audio','image']) $(`${name}-file`).addEventListener('change',updateControls);
$('compose-button').addEventListener('click',()=>run(async()=>{
  for(const name of ['image','video','audio']) {
    const input=$(`${name}-file`),file=input.files[0];if(!file)continue;
    const limit=(name==='image'?15:100)*1024*1024;if(file.size>limit)throw new Error(`${name==='image'?'图片':'媒体文件'}超过大小限制。`);
    notice('正在导入并验证素材…');
    const next=await request(`/api/jobs/${job.id}/upload?kind=${name}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});renderJob(next);input.value='';
  }
  notice('正在合成，保留视频画面并整理音轨…');renderJob(await post(`/api/jobs/${job.id}/compose`,{}));
}));
function useIdea(idea){$('idea').value=idea;$('mood').value='';$('music').value='';location.hash='top';$('idea').focus();}
$('classroom-idea').addEventListener('click',()=>useIdea('一堂冗长的课还没结束，我的脑子先下课了。想让讲义变成纸飞机，飞进纸上的彩色天空。幽默、轻讽刺，给自己解解压。'));
async function init(){
  try {const draft=JSON.parse(localStorage.getItem('nianjing-draft') || 'null');if(draft)for(const name of Object.keys(inputs()))if(draft[name])$(name).value=draft[name];}catch{}
  const results=await Promise.allSettled([request('/api/settings'),request('/api/examples'),request('/api/services')]);
  if(results[0].status==='fulfilled'){
    settings=results[0].value;const option=$('mode').options[1];option.disabled=!settings.canGenerate;option.textContent=settings.canGenerate?'官方 API · 使用自己的账户':'官方 API · 待配置';
    $('service-status').textContent=settings.canGenerate?'图片与视频 API 已配置。模型权限与真实生成质量仍需在你的账户验证。':'当前使用外部创作与导入方式。图片与视频 API 就绪后，可启用直接生成。';
  }else {$('service-status').textContent='配置读取失败：'+results[0].reason.message;}
  if(results[1].status==='fulfilled') for(const [index,entry] of results[1].value.entries()){
    const button=document.createElement('button');button.className='scene';button.type='button';button.setAttribute('aria-label',`预览${entry.title}，Muse 既有示例`);
    const image=document.createElement('img');image.src=entry.image;image.alt=entry.scene+'的摄影与纸上绘画拼接';image.loading='lazy';image.width=2096;image.height=1184;
    const meta=document.createElement('div');meta.className='scene-meta';const h=document.createElement('h3');h.textContent=entry.title;const small=document.createElement('small');small.textContent=`0${index+1} / ${entry.duration} 秒`;meta.append(h,small);const p=document.createElement('p');p.textContent=entry.scene+' · 摄影与纸上绘画';button.append(image,meta,p);
    button.addEventListener('click',()=>{showMedia(entry.video,entry.image,'Muse 既有示例 · '+entry.title);$('idea').value=entry.idea;location.hash='studio';notice('正在预览已有 Muse 作品。上方已填入参考想法，可修改后开始自己的创作。');});$('gallery').append(button);
  }else {$('gallery').textContent='示例暂时无法加载。';}
  if(results[2].status==='fulfilled') for(const service of results[2].value){
    const item=document.createElement('div');item.className='service-item';const link=document.createElement('a');link.href=service.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=service.name+' ↗';const status=document.createElement('small');status.textContent=service.kind;const p=document.createElement('p');p.textContent=service.note;item.append(link,status,p);$('service-list').append(item);
  }else {$('service-list').textContent='服务清单暂时无法加载。';}
  try{const id=localStorage.getItem('nianjing-last-job');if(id){const previous=await request('/api/jobs/'+id);renderJob(previous);applyPlan(previous.plan);if(['generating','composing'].includes(previous.state))watchJob(id);}}
  catch(e){notice('上次作品暂时无法恢复：'+e.message,true);}
  updateControls();
}
init();
