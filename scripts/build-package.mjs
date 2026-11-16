import { mkdir, readFile, readdir, copyFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'package-kit/src/poster-frame');
await mkdir(source,{recursive:true});
for(const name of ['PosterFrame.tsx','Scene.tsx','FrameModel.tsx','frameCatalog.ts','frameTextures.ts','performance.ts','loadPoster.ts'])await copyFile(path.join(root,'src',name),path.join(source,name));
await copyFile(path.join(root,'src/library.ts'),path.join(source,'index.ts'));
for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])await copyFile(path.join(root,name),path.join(root,'package-kit',name));
const generator=await readFile(path.join(root,'src/artworks.ts'),'utf8');
await writeFile(path.join(root,'package-kit/examples/generatePosters.ts'),`// 可选示例，只能在浏览器中导入；不属于组件入口。\n${generator}`);
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.lib.config.ts'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.lib.json'],{cwd:root,stdio:'inherit'});
for(const name of await readdir(path.join(root,'package-kit/types'))){
  if(!name.endsWith('.d.ts'))continue;
  const file=path.join(root,'package-kit/types',name);
  const declaration=await readFile(file,'utf8');
  await writeFile(file,declaration.replace(/from (['"])(\.\/[^'"]+)(['"])/g,(_match,quote,target,end)=>`from ${quote}${target.endsWith('.js')?target:`${target}.js`}${end}`));
}
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','package-kit/tsconfig.json'],{cwd:root,stdio:'inherit'});
console.log('Reusable ESM, TypeScript declarations, copyable source and examples are ready in package-kit/.');
