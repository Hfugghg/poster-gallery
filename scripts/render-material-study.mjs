import { chromium } from '@playwright/test';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../',import.meta.url));
const output = path.join(root,'docs/images/material-study.png');
const base = process.env.MATERIAL_STUDY_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({channel:'msedge',headless:true});
const errors = [];
try {
  const page = await browser.newPage({viewport:{width:1800,height:1200},deviceScaleFactor:1,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(`${base}/material-study.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
  await page.waitForTimeout(1200);
  if(errors.length) throw new Error(errors.join('\n'));
  await mkdir(path.dirname(output),{recursive:true});
  await page.screenshot({path:output,type:'png'});
  const info=await stat(output);
  console.log(`Rendered ${output} (${Math.round(info.size/1024)} KiB, 1800x1200)`);
} finally { await browser.close(); }
