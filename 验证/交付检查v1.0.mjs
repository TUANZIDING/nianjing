import {readdir,readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),ignored=new Set(['.git','本地作品','私有','node_modules']);
const fixed=new Set(['README.md','LICENSE','.gitignore']);
const files=[];
async function walk(directory){for(const item of await readdir(directory,{withFileTypes:true})){if(ignored.has(item.name))continue;const file=path.join(directory,item.name);if(item.isDirectory())await walk(file);else files.push(file);}}
await walk(root);
const errors=[];let links=0;
for(const file of files){
  const name=path.basename(file),relative=path.relative(root,file);
  if(name.includes('_') || (!fixed.has(name) && !/v\d+\.\d+(?:\.\d+)?\.[^.]+$/.test(name)))errors.push('文件命名不合规：'+relative);
  if(file.endsWith('.json'))try{JSON.parse(await readFile(file,'utf8'));}catch{errors.push('JSON 格式错误：'+relative);}
  if(file.endsWith('.md')){
    const content=await readFile(file,'utf8');
    if(/\/Users\/|muse\.ai\/thread\//.test(content))errors.push('公开文档含私人路径或会话地址：'+relative);
    for(const match of content.matchAll(/\]\(([^\s)]+)\)/g)){
      const target=match[1];if(/^[a-z]+:|^#/.test(target))continue;
      links++;try{await stat(path.resolve(path.dirname(file),decodeURIComponent(target.split('#')[0])));}catch{errors.push('文档链接失效：'+relative+' → '+target);}
    }
  }
}
console.log(JSON.stringify({files:files.length,localLinks:links,errors},null,2));
if(errors.length)process.exitCode=1;
