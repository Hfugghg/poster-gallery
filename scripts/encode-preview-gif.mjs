import { execFileSync } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';

export async function encodePreviewGif({directory,output,sourceFps=12,ffmpeg='ffmpeg'}){
  const input=path.join(directory,'frame-%04d.png');
  const palette=path.join(directory,'palette.png');
  const variants=[{width:720,fps:12,colors:128},{width:640,fps:12,colors:112},{width:640,fps:10,colors:96}];
  for(const variant of variants){
    const filter=`fps=${variant.fps},scale=${variant.width}:-1:flags=lanczos`;
    execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate',String(sourceFps),'-i',input,'-vf',`${filter},palettegen=max_colors=${variant.colors}:stats_mode=diff`,'-frames:v','1',palette],{stdio:'inherit'});
    execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate',String(sourceFps),'-i',input,'-i',palette,'-filter_complex',`[0:v]${filter}[v];[v][1:v]paletteuse=dither=none:diff_mode=rectangle`,'-loop','0',output],{stdio:'inherit'});
    const {size}=await stat(output);
    console.log(`Encoded ${variant.width}px / ${variant.fps} fps / ${variant.colors} colors: ${(size/1024/1024).toFixed(2)} MiB`);
    if(size<=3*1024*1024||variant===variants.at(-1))return {...variant,bytes:size};
  }
}
