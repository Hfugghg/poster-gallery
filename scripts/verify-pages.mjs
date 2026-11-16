import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const target=process.env.POSTER_PAGES_URL??'http://127.0.0.1:5182/poster-gallery/';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
try{
  const response=await page.goto(target,{waitUntil:'networkidle'});
  if(response.status()!==200)throw new Error(`Page HTTP ${response.status()}`);
  await page.locator('.loading-screen').waitFor({state:'detached',timeout:90000});
  await page.locator('canvas').waitFor();
  await page.getByRole('button',{name:'选择边框样式'}).click();
  await page.getByRole('button',{name:'胡桃木',exact:true}).click();
  await page.getByRole('button',{name:'性能设置',exact:true}).click();
  await page.getByRole('button',{name:'流畅',exact:true}).click();
  await page.getByRole('button',{name:'关闭性能设置'}).click();
  await page.mouse.move(620,420);await page.mouse.down();await page.mouse.move(730,450,{steps:12});await page.mouse.up();
  await page.mouse.wheel(0,-150);await page.waitForTimeout(900);
  const zoom=Number(await page.locator('canvas').getAttribute('data-zoom'));
  if(zoom>7)throw new Error('Published viewer zoom did not respond');
  if(errors.length)throw new Error(errors.join('\n'));
  await mkdir('artifacts/pages',{recursive:true});
  await page.screenshot({path:'artifacts/pages/viewer.png'});
  await writeFile('artifacts/pages/verification.json',JSON.stringify({passed:true,url:target,httpStatus:response.status(),checks:['HTML and static assets load','WebGL starts','material selection','performance preset','drag and wheel zoom'],consoleErrors:errors},null,2));
  console.log(`PASS: deployed viewer and interactions at ${target}`);
}finally{await browser.close();}
