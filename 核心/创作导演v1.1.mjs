import {normalizeLanguage} from './语言词典v1.0.mjs';
const scenes = {
  classroom: { title: '我的脑子先下课了', real: '灰淡的冗长课堂、桌面讲义和缓慢移动的时钟', drawn: '温暖手工纸上的彩色天空与自由飞行的纸飞机', bridge: '桌面的讲义越过不规则撕纸边缘，逐渐折成纸飞机', motion: '讲义缓缓翻动，纸飞机从写实区域轻快飞入手绘天空，镜头轻微跟随', mood: '幽默、轻讽刺、解压', music: '开头是单调重复的钢琴音型，随后转为俏皮轻盈的钢琴与拨弦' },
  canal: { title: '灯火入梦', real: '雨后的江南古镇、水面倒影、温暖灯笼与湿润石板路', drawn: '米白纸上的钢笔河道、纸船与少量金色水彩', bridge: '真实灯光的倒影流过撕纸边缘，变成纸上小船的金色河流', motion: '灯笼轻晃、水面泛起细小涟漪，金色线条延伸到纸船，镜头缓慢前移', mood: '温暖、安静、略带思念', music: '舒缓钢琴，稀疏柔和的弦乐，轻微雨声，温暖且不过度悲伤' },
  cabin: { title: '雪落有归', real: '雪山脚下的木屋、远处冷色山峰与一扇温暖亮灯的窗', drawn: '纸上的铅笔山脊、木屋轮廓与温暖的小径', bridge: '窗内的暖光沿积雪小径越过撕纸边缘，变成画纸上的金色线条', motion: '细雪慢慢落下，窗灯轻微闪动，手绘路径逐渐显现，镜头非常缓慢推近', mood: '宁静、有归属感', music: '稀疏钢琴与柔和弦乐，低动态、温暖、没有人声' },
  forest: { title: '秋光慢行', real: '午后秋日森林、透过树叶的阳光和落叶小径', drawn: '纸上的细密钢笔树影与淡金色水彩叶片', bridge: '一片真实秋叶飘过撕纸边缘后变成手绘的线条和水彩', motion: '树叶轻摆、秋叶缓慢下落，线条在纸上自然展开，固定构图、轻微运镜', mood: '松弛、温柔、日常的小快乐', music: '温柔钢琴与木质拨弦，轻巧节奏、留白充足、风声很轻' },
  ocean: { title: '落日成诗', real: '日落海边、金色海面与温柔潮汐', drawn: '手工纸上的钢笔海岸、小小人物与淡蓝水彩', bridge: '真实海浪流过撕纸边缘，延伸成纸上的蓝色水彩笔触', motion: '海浪轻轻起伏、金光流动，水彩随潮汐延伸，镜头保持舒缓且稳定', mood: '释然、安静、想透一口气', music: '温暖钢琴、柔和环境氛围、轻微海浪声，舒缓且没有人声' },
  dream: { title: '一念成景', real: '围绕用户原话展开的摄影风格场景，保留具体地点、物件和情绪', drawn: '同一场景在温暖手工纸上的钢笔与淡水彩延续', bridge: '选择原话中最有意义的物件，让其自然越过不规则撕纸边缘并成为绘画线条', motion: '围绕连接物件安排一个轻微而连贯的动作，保持稳定构图和克制运镜', mood: '忠实保留用户表达的情绪', music: '依照用户情绪组织配乐，柔和、清晰、适度留白，默认无歌词' }
};
const englishScenes={
  classroom:{title:'My Mind Left Class Early',real:'a muted, drawn-out lecture, notes on a desk and a slowly moving clock',drawn:'a colorful watercolor sky and free-flying paper planes on warm handmade paper',bridge:'a page of lecture notes crosses a torn-paper edge and gradually folds into a paper plane',motion:'the notes turn gently, then a paper plane glides from the photographic area into the drawn sky with a subtle following camera',mood:'playful, gently satirical, freeing',music:'a repetitive piano pattern at first, opening into light, playful piano and plucked strings'},
  canal:{title:'Lantern Reverie',real:'a lantern-lit canal town after rain, warm reflections and wet stone paths',drawn:'an ink-drawn river, a small paper boat and touches of golden watercolor on cream paper',bridge:'real lantern reflections cross the torn-paper edge and become a golden river carrying the drawn boat',motion:'lanterns sway gently, small ripples move on the canal, and a golden line flows toward the paper boat as the camera drifts forward',mood:'warm, quiet, a little wistful',music:'gentle piano, sparse soft strings and faint rain, warm rather than sorrowful'},
  cabin:{title:'A Light in the Snow',real:'a small cabin beneath snowy mountains, cool distant peaks and a warmly lit window',drawn:'pencil mountain ridges, a cabin outline and a welcoming path on handmade paper',bridge:'light from the window follows a snowy path over the torn-paper edge and becomes a golden drawn line',motion:'fine snow falls slowly, the window light flickers subtly and a drawn path emerges during a very slow push-in',mood:'peaceful, warm, a sense of belonging',music:'sparse piano and soft strings, low dynamics, warm and instrumental'},
  forest:{title:'An Autumn Pause',real:'an autumn forest in afternoon light, sun through leaves and a leaf-covered path',drawn:'fine ink tree shadows and pale gold watercolor leaves on paper',bridge:'one real leaf drifts across the torn-paper edge and becomes an ink outline filled with watercolor',motion:'leaves stir softly, a leaf drifts down and its drawn lines unfold on paper, with a steady composition and subtle camera movement',mood:'relaxed, gentle, a small everyday joy',music:'gentle piano and wooden plucked tones, a light rhythm, plenty of space and very faint wind'},
  ocean:{title:'A Tide of Quiet',real:'a sunset coast, a golden sea and gentle tides',drawn:'an ink coastline, a small figure and pale blue watercolor on handmade paper',bridge:'a real wave flows over the torn-paper edge and becomes a blue watercolor brushstroke',motion:'waves rise and fall gently, golden reflections move and watercolor extends with the tide, with a calm, steady camera',mood:'quiet, relieved, a moment to breathe',music:'warm piano, soft ambient textures and faint waves, calm and instrumental'},
  dream:{title:'A Thought Takes Shape',real:'a photographic scene based on the exact idea, retaining its specific places, objects and emotion',drawn:'the same scene continued in ink and light watercolor on warm handmade paper',bridge:'choose the most meaningful object in the idea and let it cross an irregular torn-paper edge into drawn lines',motion:'give the connecting object one small, continuous action, with a stable composition and restrained camera movement',mood:'faithful to the emotion in the original idea',music:'music shaped by the stated feeling, clear and spacious, instrumental by default'}
};
const drawings={
  'ink-watercolor':['钢笔速写与淡水彩','ink sketch and light watercolor'],
  pencil:['铅笔素描','pencil sketch'],
  'ink-wash':['浓淡水墨','ink wash'],
  pastel:['柔和粉彩','soft pastel']
};
function chooseScene(idea) {
  if (/课堂|上课|讲义|废话|开会|垃圾|走神|\b(class|classroom|lecture|meeting|bored|nonsense)\b/i.test(idea)) return 'classroom';
  if (/古镇|江南|灯笼|小镇|水乡|\b(canal|lantern|jiangnan|water town)\b/i.test(idea)) return 'canal';
  if (/雪山|木屋|雪落|冬天|\b(snow|snowy|cabin|winter)\b/i.test(idea)) return 'cabin';
  if (/森林|秋天|秋日|落叶|\b(forest|autumn|fall leaves)\b/i.test(idea)) return 'forest';
  if (/海边|海浪|海岸|日落|夕阳|\b(sea|ocean|coast|sunset|beach|waves)\b/i.test(idea)) return 'ocean';
  return 'dream';
}
export function direct(input = {}) {
  const idea = String(input.idea ?? '').trim();
  if (!idea || idea.length > 2000) throw new Error('请写下 1—2000 字的想法。');
  const language=normalizeLanguage(input.language),key=chooseScene(idea),s=language==='en'?englishScenes[key]:scenes[key];
  const duration = [5,10].includes(Number(input.duration)) ? Number(input.duration) : 10;
  const ratio = ['16:9','9:16','1:1'].includes(input.ratio) ? input.ratio : '16:9';
  const preferences={mood:String(input.preferences?.mood ?? input.mood ?? '').slice(0,200),music:String(input.preferences?.music ?? input.music ?? '').slice(0,500)};
  const mood=preferences.mood || s.mood,music=preferences.music || s.music;
  const changes = String(input.changes || '').slice(-1500);
  const orientation = input.layout === '左右' ? '左右' : '上下';
  const layout = orientation === '左右' ? '左半摄影风格、右半纸上绘画' : '上半摄影风格、下半纸上绘画';
  const requestedDrawing=String(input.drawingKey || input.drawing || 'ink-watercolor').slice(0,100);
  const drawingKey=Object.keys(drawings).find(key=>key===requestedDrawing || drawings[key].includes(requestedDrawing)) || requestedDrawing;
  const drawing=drawings[drawingKey]?.[language==='en'?1:0] || requestedDrawing;
  const image = `用户原话：${idea}\n创作一幅 ${ratio} 的虚实拼接影像。${layout}，比例接近一半。摄影区域：${s.real}。绘画区域：${s.drawn}；绘画材质采用${drawing}。连接处：${s.bridge}。情绪：${mood}。保留清晰的摄影与绘画材质区别，跨界物件连贯，画面精致、留白自然，不添加水印或文字。${changes ? '\n用户最新修改：'+changes : ''}`;
  const video = `将提供的拼接图片制作成 ${duration} 秒、${ratio} 的短片。保持原图中摄影与手绘的区域、构图、撕纸边缘及连接物件。动作设计：${s.motion}。情绪：${mood}。不要把整幅图统一转成同一种画法，不突然换景，不添加文字。配乐意图：${music}。音乐随连接物件的运动自然展开。${changes ? '\n用户最新修改：'+changes : ''}`;
  const audio = `${duration}秒短片的背景音乐。情绪：${mood}。用户音乐偏好：${music}。画面情节：${s.motion}。默认纯音乐，无人声、无歌词，音量舒适，开头和结尾自然收束。${changes ? '\n用户最新修改：'+changes : ''}`;
  const latest=changes?`\nLatest requested changes (take precedence where they conflict): ${changes}`:'';
  const englishPrompts={
    image:`Original idea: ${idea}\nCreate a ${ratio} collage: ${orientation==='左右'?'photography on the left and drawing on paper on the right':'photography on top and drawing on paper below'}, close to half and half. Photographic area: ${s.real}. Drawn area: ${s.drawn}, using ${drawing}. Connection: ${s.bridge}. Mood: ${mood}. Keep the two materials visibly distinct and the connecting object continuous. Refined composition, natural space, no added text or watermarks.${latest}`,
    video:`Animate the supplied collage into a ${duration}-second, ${ratio} film. Preserve its photographic and drawn areas, composition, torn-paper edge and connecting object. Motion: ${s.motion}. Mood: ${mood}. Keep the two styles distinct, avoid sudden scene changes and add no text. Music direction: ${music}. Let the music unfold naturally with the connecting motion.${latest}`,
    audio:`Background music for a ${duration}-second film. Mood: ${mood}. Music preference: ${music}. Visual story: ${s.motion}. Instrumental by default, no vocals or lyrics, comfortable volume and a natural opening and ending.${latest}`
  };
  return {version:'0.2.0',language,idea,scene:key,title:s.title,mood,music,preferences,duration,ratio,layout:orientation,drawing,drawingKey,changes,bridge:s.bridge,prompts:language==='en'?englishPrompts:{image,video,audio},director:language==='en'?'Editable rule-based templates; no language model called':'可编辑规则模板；未调用语言模型'};
}
export function localizePlan(plan,language){
  const preferences=plan.preferences || {mood:Object.values(scenes).some(s=>s.mood===plan.mood)?'':plan.mood,music:Object.values(scenes).some(s=>s.music===plan.music)?'':plan.music};
  return direct({...plan,language,preferences});
}
export function revise(plan, change) {
  const text = String(change ?? '').trim();
  if (!text || text.length > 1000) throw new Error('请写下 1—1000 字的修改。');
  const musicOnly = /音乐|配乐|钢琴|古琴|小提琴|拨弦|节奏|无人声|\b(music|soundtrack|piano|guqin|violin|strings|tempo|rhythm|vocals|instrumental)\b/i.test(text) && !/画面|构图|摄影|插画|绘画|镜头|飞机|海浪|\b(picture|image|layout|composition|photo|drawing|camera|plane|waves)\b/i.test(text);
  const updates={};
  if(/左右|side.by.side|left.and.right|horizontal/i.test(text)) updates.layout='左右';
  else if(/上下|top.and.bottom|vertical/i.test(text)) updates.layout='上下';
  const ratio=text.match(/16:9|9:16|1:1/);if(ratio)updates.ratio=ratio[0];
  const duration=text.match(/(?:改成|换成|时长|做成|变成)\s*(5|10)\s*秒|\b(5|10)[ -]?(?:seconds?|secs?|s)\b/i);if(duration)updates.duration=Number(duration[1] || duration[2]);
  const preferences=localizePlan(plan,plan.language).preferences;
  if(musicOnly)preferences.music=(normalizeLanguage(plan.language)==='en'?`${text}; previous preference (latest change takes precedence): ${plan.music}`:`${text}；原偏好（冲突时以最新修改为准）：${plan.music}`).slice(0,500);
  return {layer:musicOnly?'audio':'all',plan:direct({...plan,...updates,preferences,changes:`${plan.changes || ''}\n${text}`.trim()})};
}
export const sceneKeys = Object.keys(scenes);
