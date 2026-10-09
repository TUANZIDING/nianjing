import {spawn} from 'node:child_process';
import {rename,rm} from 'node:fs/promises';
function run(command,args,timeout=120000) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});let out='',err='';
    const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('媒体处理超过时限。'));},timeout);
    child.stdout.on('data',chunk=>{out+=chunk;if(out.length>1024*1024){child.kill();reject(new Error('媒体信息过大。'));}});
    child.stderr.on('data',chunk=>{err=(err+chunk).slice(-4096);});
    child.on('error',()=>{clearTimeout(timer);reject(new Error('没有找到 FFmpeg / ffprobe，请先安装后再合成。'));});
    child.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error('媒体格式无法处理，请导入有效的视频或音频。'));});
  });
}
export async function inspectMedia(path,kind) {
  const data=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path]));
  const stream=data.streams?.find(s=>s.codec_type===(kind==='audio'?'audio':'video'));
  const duration=Number(data.format?.duration || stream?.duration);
  if(!stream || (kind!=='image' && (!Number.isFinite(duration) || duration<=0 || duration>180))) throw new Error('素材缺少有效媒体流，或时长超过 180 秒。');
  if(kind==='image' && !['png','mjpeg','webp'].includes(stream.codec_name)) throw new Error('请导入 PNG、JPEG 或 WebP 图片。');
  if(kind==='video' && (!['h264','hevc','vp9','av1','mpeg4'].includes(stream.codec_name) || !stream.width || !stream.height)) throw new Error('请导入常见编码的视频文件。');
  return {duration,codec:stream.codec_name,format:data.format?.format_name,width:stream.width,height:stream.height,hasAudio:!!data.streams?.some(s=>s.codec_type==='audio')};
}
export async function compose(video,audio,output) {
  const info=await inspectMedia(video,'video');
  if(audio) await inspectMedia(audio,'audio');
  const temporary=output.replace(/\.mp4$/,'.临时v1.0.mp4');
  const args=['-y','-v','error','-i',video];
  if(audio) args.push('-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-af',`apad,afade=t=in:d=0.25,afade=t=out:st=${Math.max(0,info.duration-.5)}:d=0.5`,'-t',String(info.duration));
  else args.push('-map','0:v:0','-map','0:a:0?','-c:v','copy','-c:a','aac');
  args.push('-movflags','+faststart',temporary);
  try {
    await run('ffmpeg',args);
    const result=await inspectMedia(temporary,'video');
    if(audio && !result.hasAudio) throw new Error('合成结果缺少音频。');
    await rename(temporary,output);return result;
  } finally {await rm(temporary,{force:true});}
}
