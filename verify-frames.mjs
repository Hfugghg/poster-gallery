import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  await mkdir('artifacts/frames',{recursive:true});
  await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.locator('.loading-screen').waitFor({state:'detached',timeout:60000});
  await page.mouse.move(700,440);await page.mouse.wheel(0,100);
  await page.mouse.down();await page.mouse.move(760,460,{steps:12});await page.mouse.up();
  await page.getByRole('button',{name:'选择边框样式'}).click();
  const names=await page.locator('.frame-card').evaluateAll(cards=>cards.map(c=>c.getAttribute('aria-label')));
  if(names.length!==8)throw new Error(`Expected 8 frame styles, got ${names.length}`);
  await page.screenshot({path:'artifacts/frames/style-picker.png'});
  await page.getByRole('button',{name:'关闭边框样式'}).click();
  const evidence=[];
  for(const name of names){
    await page.getByRole('button',{name:'选择边框样式'}).click();
    await page.getByRole('button',{name,exact:true}).click();
    await page.waitForTimeout(900);
    if(!(await page.getByRole('button',{name:'选择边框样式'}).textContent()).includes(name))throw new Error(`Selection not applied: ${name}`);
    const metrics=await page.evaluate(async()=>{
      const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const {Box3,Vector3}=await import('/node_modules/.vite/deps/three.js');
      const state=_roots.get(document.querySelector('canvas')).store.getState();
      const model=state.scene.getObjectByName('display-frame');
      const materials=[];let triangles=0;let minUV=Infinity,maxUV=-Infinity;
      model.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);if(!o.isInstancedMesh){for(const value of o.geometry.attributes.uv?.array??[]){minUV=Math.min(minUV,value);maxUV=Math.max(maxUV,value);}}for(const m of (Array.isArray(o.material)?o.material:[o.material]))materials.push({colorMap:!!m.map,bumpMap:!!m.bumpMap,normalMap:!!m.normalMap,roughnessMap:!!m.roughnessMap,wrapS:m.map?.wrapS,wrapT:m.map?.wrapT,textureWidth:m.map?.image.width});}});
      const size=new Box3().setFromObject(model).getSize(new Vector3());
      return {materials,triangles,size:size.toArray(),textures:state.gl.info.memory.textures,minUV,maxUV};
    });
    if(!metrics.materials.length||metrics.triangles>30000)throw new Error(`Missing or excessive geometry: ${name}`);
    if(names.indexOf(name)>=3&&!metrics.materials.some(m=>m.bumpMap||m.normalMap))throw new Error(`Missing relief texture: ${name}`);
    const maxTextureSize=name==='雕纹古铜'?1024:512;
    if(metrics.minUV<0||metrics.maxUV>1.0001||metrics.materials.some(m=>m.colorMap&&(m.wrapS!==1001||m.wrapT!==1001||m.textureWidth>maxTextureSize)))throw new Error(`Repeating texture or excessive texture resolution: ${name}`);
    evidence.push({name,...metrics});
    await page.screenshot({path:`artifacts/frames/style-${names.indexOf(name)}.png`});
  }
  if(Math.abs(evidence[0].size[0]-evidence[3].size[0])<.05)throw new Error('Wide and slim frames have identical shape');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'选择边框样式'}).click();
  await page.getByRole('button',{name:names.at(-1),exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/frames/style-picker-mobile.png'});
  const box=await page.getByRole('region',{name:'边框样式',exact:true}).boundingBox();
  if(!box||box.x<0||box.x+box.width>390||box.y<0||box.y+box.height>844)throw new Error('Mobile picker outside viewport');
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile('artifacts/frames/verification.json',JSON.stringify({passed:true,styles:evidence,consoleErrors:errors},null,2));
  console.log('PASS: 8 distinct frame styles, textured relief, bounded geometry, desktop/mobile picker.');
}finally{await browser.close();}
