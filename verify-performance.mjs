import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
async function assertCanvas(){
  await page.waitForTimeout(700);
  const rendered=await page.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2');if(!gl)return false;const bytes=new Uint8Array(4);for(const x of [.4,.5,.6])for(const y of [.3,.5,.7]){gl.readPixels(Math.floor(canvas.width*x),Math.floor(canvas.height*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,bytes);if([...bytes].slice(0,3).some(v=>v>45))return true;}return false;});
  if(!rendered){await page.screenshot({path:'artifacts/performance-failure.png'});throw new Error(`Settings transition left canvas blank: ${errors.join('\n')}`);}
}
try{
  await mkdir('artifacts',{recursive:true});
  await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.locator('canvas').waitFor({timeout:60000});
  await page.locator('.loading-screen').waitFor({state:'detached',timeout:60000});
  await page.getByRole('button',{name:'性能设置',exact:true}).click();
  const panel=page.getByRole('region',{name:'性能设置'});
  if(await panel.locator('#render-antialias').inputValue()!=='fxaa')throw new Error('Default AA is not FXAA');
  for(const label of ['流畅','高清','均衡']){
    await panel.getByRole('button',{name:label,exact:true}).click();
    await assertCanvas();
    if(await panel.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed')!=='true')throw new Error('Preset selection failed');
  }
  for(const value of ['off','smaa','msaa','fxaa']){
    await panel.locator('#render-antialias').selectOption(value);
    await assertCanvas();
  }
  await panel.locator('#render-resolution').press('Home');
  await panel.locator('#render-resolution').press('ArrowRight');
  await panel.locator('#render-resolution').press('ArrowRight');
  await page.waitForTimeout(700);
  const size=await page.locator('canvas').evaluate(c=>({render:c.width,css:c.clientWidth}));
  if(Math.abs(size.render/size.css-1.25)>.02)throw new Error(`Resolution did not update: ${JSON.stringify(size)}`);
  for(const label of ['动态阴影','辉光后处理','玻璃透射']){await panel.getByLabel(label).click();await assertCanvas();}
  await panel.locator('#render-ao').selectOption('off');await assertCanvas();
  await panel.locator('#render-antialias').selectOption('off');
  await panel.getByLabel('辉光后处理').uncheck();
  await assertCanvas();
  await panel.locator('#render-antialias').selectOption('fxaa');
  await page.screenshot({path:'artifacts/performance-settings.png'});
  await page.reload({waitUntil:'networkidle'});
  await page.locator('canvas').waitFor({timeout:60000});
  await page.getByRole('button',{name:'性能设置',exact:true}).click();
  if(await panel.locator('#render-resolution').inputValue()!=='1.25')throw new Error('Settings persistence failed');
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(700);
  await page.screenshot({path:'artifacts/performance-mobile.png'});
  const rect=await panel.boundingBox();
  if(!rect||rect.x<0||rect.x+rect.width>390||rect.y<0||rect.y+rect.height>844)throw new Error('Mobile settings outside viewport');
  await panel.getByRole('button',{name:'恢复默认'}).click();
  await assertCanvas();
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile('artifacts/performance-verification.json',JSON.stringify({passed:true,checks:['three quality presets render','all four AA modes render','resolution changes backing buffer','AO/shadow/bloom/glass toggles render','settings survive reload','mobile panel fits viewport','reset defaults renders'],consoleErrors:errors},null,2));
  console.log('PASS: performance presets, all AA modes, resolution, effects, persistence and mobile settings.');
}finally{await browser.close();}
