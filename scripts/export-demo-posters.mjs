import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('package-kit/examples/posters',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
  const posters=await page.locator('.poster-thumb img').evaluateAll(images=>images.map(image=>image.src));
  if(posters.length!==3)throw new Error('Expected exactly three generated posters.');
  for(let i=0;i<posters.length;i++)await writeFile(`package-kit/examples/posters/poster-${i+1}.png`,Buffer.from(posters[i].split(',')[1],'base64'));
  console.log('Exported 3 optional Canvas-generated PNG examples.');
}finally{await browser.close();}
