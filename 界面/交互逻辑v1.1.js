import {normalizeLanguage,t,exampleCopy,serviceCopy,localizeMessage} from '/语言词典v1.0.mjs';
import {localizePlan} from '/创作导演v1.1.mjs';
const $=id=>document.getElementById(id);
let language=normalizeLanguage(navigator.language);
try{language=normalizeLanguage(new URL(location.href).searchParams.get('lang') || localStorage.getItem('nianjing-language') || navigator.language);}catch{}
let job=null,kind='image',settings=null,watch=null,locked=false,examples=[],services=[],previewContext=null;
let noticeState={key:'initialNotice',error:false},configError=null,examplesError=false,servicesError=false;
const tr=key=>t(key,language);
async function request(url,options={}){
  const response=await fetch(url,{...options,headers:{...options.headers,'X-Nianjing-Language':language}}),data=await response.json();
  if(!response.ok)throw new Error(data.errorSource || data.error || '操作未完成。');
  return data;
}
const post=(url,data)=>request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function renderNotice(){const {key,raw,prefix,error}=noticeState;$('notice').textContent=(prefix?tr(prefix):'')+(key?tr(key):localizeMessage(raw,language));$('notice').classList.toggle('error',error);}
function notice(raw,error=false,prefix=null){noticeState={raw,error,prefix};renderNotice();}
function noticeKey(key,error=false){noticeState={key,error};renderNotice();}
function inputs(){return {language,idea:$('idea').value,mood:$('mood').value,music:$('music').value,ratio:$('ratio').value,duration:$('duration').value,layout:$('layout').value,drawing:$('drawing').value};}
function applyPlan(plan){
  const view=localizePlan(plan,language);
  for(const name of ['idea','ratio','duration','layout'])$(name).value=view[name];
  $('mood').value=view.preferences.mood;$('music').value=view.preferences.music;
  if([...$('drawing').options].some(option=>option.value===view.drawingKey))$('drawing').value=view.drawingKey;
}
function updateControls(){
  const processing=job && ['generating','composing'].includes(job.state);
  $('create-button').disabled=locked || processing;
  $('copy-prompt').disabled=!job || locked;$('save-plan').disabled=!job || locked;
  $('revise-button').disabled=!job || locked || processing;
  $('compose-button').disabled=!job || locked || processing || (!job.assets.video && !$('video-file').files.length);
  $('regenerate-audio').hidden=!settings?.hasIndependentAudio || !job?.assets.video;
  $('regenerate-audio').disabled=locked || processing;
  for(const name of ['video','audio','image'])$(`${name}-file`).disabled=locked || processing;
}
function setPrompt(){
  if(job){const view=localizePlan(job.plan,language);$('prompt').value=view.prompts[kind];$('plan-title').textContent=view.title;}
  else{$('prompt').value='';$('plan-title').textContent=tr('promptTitle');}
}
function exampleView(entry){return language==='en'?{...entry,...exampleCopy[entry.id]}:entry;}
function updatePreviewText(){
  let key='noWork',label;
  if(previewContext?.type==='example')label=tr('exampleLabel')+' · '+exampleView(previewContext.entry).title;
  else if(job && previewContext?.type==='job')key=job.assets.final?'finalLabel':job.assets.video?'videoLabel':job.assets.image?'imageLabel':'noWork';
  $('preview-label').textContent=label || tr(key);
  if(job?.assets.final && previewContext?.type==='job')$('export-link').href=job.assets.final+`?download=1&lang=${language}`;
}
function showMedia(video,image,context,final=null){
  previewContext=context;$('placeholder').hidden=!!(video || image);$('preview').hidden=!video;$('image-preview').hidden=!!video || !image;
  $('preview').pause();
  if(video){if($('preview').getAttribute('src')!==video){$('preview').src=video;$('preview').load();}if(image)$('preview').poster=image;else $('preview').removeAttribute('poster');}
  else{$('preview').removeAttribute('src');$('preview').load();}
  if(image)$('image-preview').src=image;
  $('export-link').hidden=!final;if(!final)$('export-link').removeAttribute('href');updatePreviewText();
}
function renderJobText(){
  $('stage').textContent=job?tr(['awaiting','generating','composing','complete','failed','interrupted'].includes(job.state)?job.state:'working'):tr('waitingIdea');
  for(const name of ['video','audio','image']){
    const info=job?.media[name];
    $(`${name}-info`).textContent=job?.assets[name]?tr('imported')+' · '+(info?.duration?info.duration.toFixed(1)+' '+tr('seconds'):tr('imageUnit')):tr(name==='audio'?'audioDefault':name==='image'?'imageOptional':'notImported');
  }
  setPrompt();updatePreviewText();
}
function renderJob(next){
  job=next;try{localStorage.setItem('nianjing-last-job',job.id);}catch{}
  notice(job.messageSource || job.message,job.state==='failed');
  showMedia(job.assets.final || job.assets.video,job.assets.image,{type:'job'},job.assets.final);
  renderJobText();updateControls();
}
function stopWatch(){if(watch)clearTimeout(watch);watch=null;}
function watchJob(id){
  stopWatch();watch=setTimeout(async()=>{
    try{const next=await request('/api/jobs/'+id);if(job?.id!==id)return;renderJob(next);if(['generating','composing'].includes(next.state))watchJob(id);}
    catch(e){notice(e.message,true,'progressFailed');updateControls();}
  },1800);
}
async function run(action){locked=true;updateControls();try{await action();}catch(e){notice(e.message,true);}finally{locked=false;updateControls();}}
function renderSettings(){
  const option=$('mode').options[1];option.disabled=!settings?.canGenerate;option.textContent=tr(settings?.canGenerate?'apiReady':'apiPending');
  $('service-status').textContent=configError?tr('configFailed')+localizeMessage(configError,language):tr(settings?.canGenerate?'configReady':'configPending');
}
function renderGallery(){
  $('gallery').replaceChildren();
  if(examplesError){$('gallery').textContent=tr('examplesFailed');return;}
  for(const [index,entry] of examples.entries()){
    const view=exampleView(entry),button=document.createElement('button');button.className='scene';button.type='button';button.setAttribute('aria-label',`${tr('previewExample')} ${view.title}, ${tr('exampleLabel')}`);
    const image=document.createElement('img');image.src=entry.image;image.alt=view.scene+' · '+tr('collageDescription');image.loading='lazy';image.width=2096;image.height=1184;
    const meta=document.createElement('div');meta.className='scene-meta';const h=document.createElement('h3');h.textContent=view.title;const small=document.createElement('small');small.textContent=`0${index+1} / ${entry.duration} ${tr('seconds')}`;meta.append(h,small);
    const p=document.createElement('p');p.textContent=view.scene+' · '+tr('collageDescription');button.append(image,meta,p);
    button.addEventListener('click',()=>{showMedia(entry.video,entry.image,{type:'example',entry});useIdea(exampleView(entry).idea,false);location.hash='studio';noticeKey('exampleNotice');});$('gallery').append(button);
  }
}
function renderServices(){
  $('service-list').replaceChildren();
  if(servicesError){$('service-list').textContent=tr('servicesFailed');return;}
  for(const service of services){const view=language==='en'?{...service,...serviceCopy[service.name]}:service;
    const item=document.createElement('div');item.className='service-item';const link=document.createElement('a');link.href=service.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=view.name+' ↗';
    const status=document.createElement('small');status.textContent=view.kind;const p=document.createElement('p');p.textContent=view.note;item.append(link,status,p);$('service-list').append(item);
  }
}
function setLanguage(value,persist=true){
  language=normalizeLanguage(value);document.documentElement.lang=language==='en'?'en':'zh-CN';document.title=tr('title');document.querySelector('meta[name=description]').content=tr('description');
  for(const element of document.querySelectorAll('[data-i18n]'))element.textContent=tr(element.dataset.i18n);
  for(const [attribute,key] of [['placeholder','i18nPlaceholder'],['aria-label','i18nAria'],['alt','i18nAlt']])for(const element of document.querySelectorAll(`[data-${key.replace(/[A-Z]/g,match=>'-'+match.toLowerCase())}]`))element.setAttribute(attribute,tr(element.dataset[key]));
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  if(persist)try{localStorage.setItem('nianjing-language',language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);}catch{}
  renderGallery();renderServices();renderSettings();renderJobText();renderNotice();updateControls();
}
for(const button of document.querySelectorAll('[data-language]'))button.addEventListener('click',()=>setLanguage(button.dataset.language));
$('idea-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
  stopWatch();try{localStorage.setItem('nianjing-draft',JSON.stringify(inputs()));}catch{}
  for(const name of ['video','audio','image'])$(`${name}-file`).value='';
  const next=await post('/api/jobs',{...inputs(),changes:job?.plan.idea===$('idea').value?job.plan.changes:'',mode:$('mode').value});renderJob(next);
  if(next.state==='generating')watchJob(next.id);else $('import-area').open=true;location.hash='studio';
});});
for(const tab of document.querySelectorAll('[role=tab]')){
  function select(){kind=tab.dataset.kind;document.querySelectorAll('[role=tab]').forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});$('prompt-panel').setAttribute('aria-labelledby',tab.id);setPrompt();}
  tab.addEventListener('click',select);
  tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[role=tab]')],i=tabs.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();}});
}
$('copy-prompt').addEventListener('click',()=>run(async()=>{try{await navigator.clipboard.writeText($('prompt').value);noticeKey('copied');}catch{$('prompt').focus();$('prompt').select();noticeKey('copyFallback');}}));
$('save-plan').addEventListener('click',()=>{
  const view=localizePlan(job.plan,language),text=`# ${view.title}\n\n${tr('originalIdea')}: ${view.idea}\n\n${Object.entries(view.prompts).map(([key,value])=>`## ${tr({image:'imageTab',video:'videoTab',audio:'audioTab'}[key])}\n\n${value}`).join('\n\n')}\n\n${tr('director')}: ${view.director}\n`;
  const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=tr('planFilename');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
async function change(generate){const next=await post(`/api/jobs/${job.id}/revise`,{language,change:$('revision').value,generate});renderJob(next);applyPlan(next.plan);if(generate)watchJob(next.id);}
$('revision-form').addEventListener('submit',event=>{event.preventDefault();run(()=>change(false));});
$('regenerate-audio').addEventListener('click',()=>run(()=>change(true)));
for(const name of ['video','audio','image'])$(`${name}-file`).addEventListener('change',updateControls);
$('compose-button').addEventListener('click',()=>run(async()=>{
  for(const name of ['image','video','audio']){
    const input=$(`${name}-file`),file=input.files[0];if(!file)continue;const limit=(name==='image'?15:100)*1024*1024;
    if(file.size>limit)throw new Error(t('fileTooLarge','zh'));noticeKey('uploading');
    const next=await request(`/api/jobs/${job.id}/upload?kind=${name}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});renderJob(next);input.value='';
  }
  noticeKey('composingNotice');renderJob(await post(`/api/jobs/${job.id}/compose`,{}));
}));
function useIdea(idea,focus=true){$('idea').value=idea;$('mood').value='';$('music').value='';if(focus){location.hash='top';$('idea').focus();}}
$('classroom-idea').addEventListener('click',()=>useIdea(tr('classroomIdea')));
async function init(){
  setLanguage(language,false);
  try{const draft=JSON.parse(localStorage.getItem('nianjing-draft') || 'null');if(draft?.idea)applyPlan(draft);}catch{}
  const results=await Promise.allSettled([request('/api/settings'),request('/api/examples'),request('/api/services')]);
  if(results[0].status==='fulfilled')settings=results[0].value;else configError=results[0].reason.message;
  if(results[1].status==='fulfilled')examples=results[1].value;else examplesError=true;renderGallery();
  if(results[2].status==='fulfilled')services=results[2].value;else servicesError=true;renderServices();
  renderSettings();
  try{const id=localStorage.getItem('nianjing-last-job');if(id){const previous=await request('/api/jobs/'+id);renderJob(previous);applyPlan(previous.plan);if(['generating','composing'].includes(previous.state))watchJob(id);}}
  catch(e){notice(e.message,true,'restoreFailed');}
  updateControls();
}
init();
