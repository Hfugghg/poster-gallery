import { chromium } from '@playwright/test';
import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { encodePreviewGif } from './encode-preview-gif.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const base=process.env.POSTER_PREVIEW_URL??'http://127.0.0.1:5173';
const ffmpeg=process.env.FFMPEG_PATH??'ffmpeg';
const fps=12,width=720,height=540;
await mkdir(path.join(root,'artifacts'),{recursive:true});
await mkdir(path.join(root,'docs/images'),{recursive:true});
const directory=await mkdtemp(path.join(root,'artifacts/preview-frames-'));
const output=path.join(root,'docs/images/poster-preview.gif');
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const errors=[];
let count=0,duration=0;
try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(`${base}/preview-animation.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.body.dataset.previewReady==='true',null,{timeout:90000});
  duration=await page.evaluate(()=>window.posterPreview.duration);
  count=Math.round(duration*fps);
  for(let frame=0;frame<count;frame++){
    await page.evaluate(time=>window.posterPreview.setTime(time),frame/fps);
    await page.screenshot({path:path.join(directory,`frame-${String(frame).padStart(4,'0')}.png`),animations:'disabled'});
    if(frame%24===0)console.log(`Captured ${frame}/${count} (${(frame/fps).toFixed(1)}s)`);
  }
  if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}

const encoded=await encodePreviewGif({directory,output,sourceFps:fps,ffmpeg});
const info=await stat(output);
const report={output:path.relative(root,output),width:encoded.width,height:Math.round(height*encoded.width/width),fps:encoded.fps,frames:Math.round(duration*encoded.fps),duration,bytes:info.size,sourceFrames:path.relative(root,directory),consoleErrors:errors};
await writeFile(path.join(root,'artifacts/preview-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
