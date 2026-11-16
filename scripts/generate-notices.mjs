import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const entries=[
  ['react','LICENSE'],['react-dom','LICENSE'],['three','LICENSE'],
  ['@react-three/fiber',null],['@react-three/drei','LICENSE'],
  ['@react-three/postprocessing','LICENSE'],['postprocessing','LICENSE.md'],
  ['lucide-react','LICENSE'],['n8ao','LICENSE'],
];
const packages=await Promise.all(entries.map(async([name,filename])=>{
  const directory=path.join(root,'node_modules',name);
  const manifest=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
  const text=filename?await readFile(path.join(directory,filename),'utf8'):null;
  const repository=typeof manifest.repository==='string'?manifest.repository:manifest.repository?.url;
  return {name,version:manifest.version,license:manifest.license,text,filename,url:repository?.replace(/^git\+/,'').replace(/\.git$/,'')};
}));
const lines=[
  '# Third-party notices','',
  '本项目的原创代码与演示素材采用 MIT 许可证，第三方依赖保留各自的版权和许可证。组件包将 React、Three.js 等运行依赖外置安装，不把它们重新授权为 MIT。','',
  '以下记录主要直接依赖及环境遮蔽依赖 N8AO 的实际安装版本和许可信息。完整依赖树见 package-lock.json；升级依赖后可运行 node scripts/generate-notices.mjs 更新本文件。','',
  '| 依赖 | 版本 | package.json 声明 | 包内许可文件 |','| --- | --- | --- | --- |',
  ...packages.map(p=>`| [${p.name}](${p.url}) | ${p.version} | ${p.license} | ${p.text?(p.name==='n8ao'?'CC0 1.0 Universal（见下方差异说明）':p.filename):'此安装包未附独立文件，声明为 MIT'} |`),'',
  'N8AO 2.0.2 的 package.json 声明为 ISC，但实际 LICENSE 文件与 README 采用 CC0 1.0 Universal。此处如实保留包内 CC0 正文及元数据差异，不将其归为 MIT；后续版本以对应发布包为准。','',
  'Lucide 的许可正文同时保留 Feather（Cole Bemis）部分和 Lucide Contributors 的版权说明。postprocessing 使用 Zlib 许可证。','',
  '用户自行提供或上传的海报保留其原有授权。本清单不包含用户上传内容。','',
];
for(const p of packages){
  lines.push(`## ${p.name} ${p.version}`,'');
  if(p.text)lines.push('以下正文原样摘自该安装包的许可文件。','','```text',p.text.trimEnd(),'```','');
  else lines.push(`安装包 package.json 声明为 ${p.license}；上游项目：${p.url}。此版本发布包内未发现独立 LICENSE 文件。`,'');
}
await writeFile(path.join(root,'THIRD_PARTY_NOTICES.md'),lines.join('\n'));
console.log('Updated THIRD_PARTY_NOTICES.md from installed package license files.');
