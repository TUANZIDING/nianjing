const scenes = {
  classroom: { title: '我的脑子先下课了', real: '灰淡的冗长课堂、桌面讲义和缓慢移动的时钟', drawn: '温暖手工纸上的彩色天空与自由飞行的纸飞机', bridge: '桌面的讲义越过不规则撕纸边缘，逐渐折成纸飞机', motion: '讲义缓缓翻动，纸飞机从写实区域轻快飞入手绘天空，镜头轻微跟随', mood: '幽默、轻讽刺、解压', music: '开头是单调重复的钢琴音型，随后转为俏皮轻盈的钢琴与拨弦' },
  canal: { title: '灯火入梦', real: '雨后的江南古镇、水面倒影、温暖灯笼与湿润石板路', drawn: '米白纸上的钢笔河道、纸船与少量金色水彩', bridge: '真实灯光的倒影流过撕纸边缘，变成纸上小船的金色河流', motion: '灯笼轻晃、水面泛起细小涟漪，金色线条延伸到纸船，镜头缓慢前移', mood: '温暖、安静、略带思念', music: '舒缓钢琴，稀疏柔和的弦乐，轻微雨声，温暖且不过度悲伤' },
  cabin: { title: '雪落有归', real: '雪山脚下的木屋、远处冷色山峰与一扇温暖亮灯的窗', drawn: '纸上的铅笔山脊、木屋轮廓与温暖的小径', bridge: '窗内的暖光沿积雪小径越过撕纸边缘，变成画纸上的金色线条', motion: '细雪慢慢落下，窗灯轻微闪动，手绘路径逐渐显现，镜头非常缓慢推近', mood: '宁静、有归属感', music: '稀疏钢琴与柔和弦乐，低动态、温暖、没有人声' },
  forest: { title: '秋光慢行', real: '午后秋日森林、透过树叶的阳光和落叶小径', drawn: '纸上的细密钢笔树影与淡金色水彩叶片', bridge: '一片真实秋叶飘过撕纸边缘后变成手绘的线条和水彩', motion: '树叶轻摆、秋叶缓慢下落，线条在纸上自然展开，固定构图、轻微运镜', mood: '松弛、温柔、日常的小快乐', music: '温柔钢琴与木质拨弦，轻巧节奏、留白充足、风声很轻' },
  ocean: { title: '落日成诗', real: '日落海边、金色海面与温柔潮汐', drawn: '手工纸上的钢笔海岸、小小人物与淡蓝水彩', bridge: '真实海浪流过撕纸边缘，延伸成纸上的蓝色水彩笔触', motion: '海浪轻轻起伏、金光流动，水彩随潮汐延伸，镜头保持舒缓且稳定', mood: '释然、安静、想透一口气', music: '温暖钢琴、柔和环境氛围、轻微海浪声，舒缓且没有人声' },
  dream: { title: '一念成景', real: '围绕用户原话展开的摄影风格场景，保留具体地点、物件和情绪', drawn: '同一场景在温暖手工纸上的钢笔与淡水彩延续', bridge: '选择原话中最有意义的物件，让其自然越过不规则撕纸边缘并成为绘画线条', motion: '围绕连接物件安排一个轻微而连贯的动作，保持稳定构图和克制运镜', mood: '忠实保留用户表达的情绪', music: '依照用户情绪组织配乐，柔和、清晰、适度留白，默认无歌词' }
};
function chooseScene(idea) {
  if (/课堂|上课|讲义|废话|开会|垃圾|走神/.test(idea)) return 'classroom';
  if (/古镇|江南|灯笼|小镇|水乡/.test(idea)) return 'canal';
  if (/雪山|木屋|雪落|冬天/.test(idea)) return 'cabin';
  if (/森林|秋天|秋日|落叶/.test(idea)) return 'forest';
  if (/海边|海浪|海岸|日落|夕阳/.test(idea)) return 'ocean';
  return 'dream';
}
export function direct(input = {}) {
  const idea = String(input.idea ?? '').trim();
  if (!idea || idea.length > 2000) throw new Error('请写下 1—2000 字的想法。');
  const key = chooseScene(idea), s = scenes[key];
  const duration = [5,10].includes(Number(input.duration)) ? Number(input.duration) : 10;
  const ratio = ['16:9','9:16','1:1'].includes(input.ratio) ? input.ratio : '16:9';
  const mood = String(input.mood || s.mood).slice(0,200);
  const music = String(input.music || s.music).slice(0,500);
  const changes = String(input.changes || '').slice(-1500);
  const orientation = input.layout === '左右' ? '左右' : '上下';
  const layout = orientation === '左右' ? '左半摄影风格、右半纸上绘画' : '上半摄影风格、下半纸上绘画';
  const drawing = String(input.drawing || '钢笔速写与淡水彩').slice(0,100);
  const image = `用户原话：${idea}\n创作一幅 ${ratio} 的虚实拼接影像。${layout}，比例接近一半。摄影区域：${s.real}。绘画区域：${s.drawn}；绘画材质采用${drawing}。连接处：${s.bridge}。情绪：${mood}。保留清晰的摄影与绘画材质区别，跨界物件连贯，画面精致、留白自然，不添加水印或文字。${changes ? '\n用户最新修改：'+changes : ''}`;
  const video = `将提供的拼接图片制作成 ${duration} 秒、${ratio} 的短片。保持原图中摄影与手绘的区域、构图、撕纸边缘及连接物件。动作设计：${s.motion}。情绪：${mood}。不要把整幅图统一转成同一种画法，不突然换景，不添加文字。配乐意图：${music}。音乐随连接物件的运动自然展开。${changes ? '\n用户最新修改：'+changes : ''}`;
  const audio = `${duration}秒短片的背景音乐。情绪：${mood}。用户音乐偏好：${music}。画面情节：${s.motion}。默认纯音乐，无人声、无歌词，音量舒适，开头和结尾自然收束。${changes ? '\n用户最新修改：'+changes : ''}`;
  return { version:'0.1.0', idea, scene:key, title:s.title, mood, music, duration, ratio, layout:orientation, drawing, changes, bridge:s.bridge, prompts:{image,video,audio}, director:'可编辑规则模板；未调用语言模型' };
}
export function revise(plan, change) {
  const text = String(change ?? '').trim();
  if (!text || text.length > 1000) throw new Error('请写下 1—1000 字的修改。');
  const musicOnly = /音乐|配乐|钢琴|古琴|小提琴|拨弦|节奏|无人声/.test(text) && !/画面|构图|摄影|插画|绘画|镜头|飞机|海浪/.test(text);
  const updates={};
  if(/左右/.test(text)) updates.layout='左右';
  else if(/上下/.test(text)) updates.layout='上下';
  const ratio=text.match(/16:9|9:16|1:1/);if(ratio)updates.ratio=ratio[0];
  const duration=text.match(/(?:改成|换成|时长|做成|变成)\s*(5|10)\s*秒/);if(duration)updates.duration=Number(duration[1]);
  return { layer:musicOnly ? 'audio' : 'all', plan:direct({...plan,...updates,music:musicOnly ? `${text}；原偏好（冲突时以最新修改为准）：${plan.music}` : plan.music, changes:`${plan.changes || ''}\n${text}`.trim()}) };
}
export const sceneKeys = Object.keys(scenes);
