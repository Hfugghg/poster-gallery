import { mkdir, mkdtemp, readFile, writeFile, copyFile, readdir, lstat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const sourceNames=['PosterFrame.tsx','Scene.tsx','FrameModel.tsx','frameCatalog.ts','frameTextures.ts','performance.ts','loadPoster.ts','index.ts'];

async function clearGeneratedFiles(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(entry.isSymbolicLink())throw new Error('Refusing to clean linked release content.');
    const target=path.join(directory,entry.name);
    if(entry.isDirectory())await clearGeneratedFiles(target);
    else await rm(target,{force:true});
  }
}

export async function createLitePackage({staging=false}={}){
  const manifest=JSON.parse(await readFile(path.join(root,'package-kit/package.json'),'utf8'));
  if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version))throw new Error('Package version must be a valid, path-safe semantic version.');
  const releases=path.resolve(root,'releases');
  let parent=releases;
  if(staging){const scratch=path.resolve(root,'.package-check');await mkdir(scratch,{recursive:true});parent=await mkdtemp(path.join(scratch,'release-stage-'));}
  const output=path.resolve(parent,`poster-frame-lite-${manifest.version}`);
  if(path.dirname(output)!==parent)throw new Error('Release output must stay inside its generated parent.');
  const existing=await lstat(output).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
  if(existing?.isSymbolicLink())throw new Error('Refusing to replace a linked release directory.');
  // Windows can lock empty directories; remove only verified generated files.
  // Release archives use a fresh staging directory and never depend on this cleanup.
  if(existing)await clearGeneratedFiles(output);
  for(const directory of ['lib','types','src/poster-frame','examples'])await mkdir(path.join(output,directory),{recursive:true});
  await copyFile(path.join(root,'package-kit/lib/poster-frame.js'),path.join(output,'lib/poster-frame.js'));
  for(const name of sourceNames)await copyFile(path.join(root,'package-kit/src/poster-frame',name),path.join(output,'src/poster-frame',name));
  for(const entry of await readdir(path.join(root,'package-kit/types'),{withFileTypes:true})){
    if(entry.isSymbolicLink())throw new Error('Linked declaration files are not allowed in a release.');
    if(entry.isFile()&&entry.name.endsWith('.d.ts'))await copyFile(path.join(root,'package-kit/types',entry.name),path.join(output,'types',entry.name));
  }
  for(const name of ['Basic.tsx','Controlled.tsx'])await copyFile(path.join(root,'package-kit/examples',name),path.join(output,'examples',name));
  await copyFile(path.join(root,'package-kit/tsconfig.json'),path.join(output,'tsconfig.json'));
  for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])await copyFile(path.join(root,'package-kit',name),path.join(output,name));
  manifest.files=['lib/poster-frame.js','types','README.md','LICENSE','THIRD_PARTY_NOTICES.md'];
  await writeFile(path.join(output,'package.json'),JSON.stringify(manifest,null,2)+'\n');
  let readme=await readFile(path.join(root,'package-kit/README.md'),'utf8');
  const optionalStart=readme.indexOf('## 可选示例海报');
  if(optionalStart!==-1){const next=readme.indexOf('\n## ',optionalStart+4);readme=readme.slice(0,optionalStart)+(next===-1?'':readme.slice(next+1));}
  readme=readme.replace(/^# React 3D 海报展框组件包/m,'# React 3D 海报展框组件包 · 轻量版\n\n本包保留组件源码、类型声明、预构建代码和两个 React 接入示例，不附带 PNG 海报。请使用自己的图片；示例中的 `/posters/poster-1.png` 需自行替换。配套 `.tgz` 仅含运行代码、类型和说明，源码位于 ZIP 的 `src/poster-frame`。\n\nThree.js、React 及渲染相关依赖在安装时获取，未打入本压缩包；压缩包大小不等于依赖安装体积或网页首次加载体积。');
  readme=readme.replace(/^可将包中的 `examples\/posters`[^\n]*$/m,'轻量版不附带示例海报，请将自己的图片放在 `public/posters/poster-1.png`，或把 `posterSrc` 换成自己的图片地址。组件入口不加载演示素材，不要求复制原展厅页面或全局 CSS。');
  readme=readme.replace(/atelier-poster-frame-\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.tgz/g,`atelier-poster-frame-${manifest.version}.tgz`);
  await writeFile(path.join(output,'README.md'),readme);
  return output;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await createLitePackage());
