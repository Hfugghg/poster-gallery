import * as THREE from 'three';

/** Center-crop any decodable image to a 3:4 sRGB poster texture. */
export function loadPoster(url:string):Promise<THREE.CanvasTexture>{
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.decoding='async';
    img.onload=()=>{
      try{
        if(!img.naturalWidth||!img.naturalHeight)throw new Error('图片尺寸无效。');
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;
        const ctx=canvas.getContext('2d');if(!ctx)throw new Error('浏览器无法创建图片纹理。');
        const ratio=Math.max(1200/img.naturalWidth,1600/img.naturalHeight);
        const width=img.naturalWidth*ratio,height=img.naturalHeight*ratio;
        ctx.drawImage(img,(1200-width)/2,(1600-height)/2,width,height);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
        resolve(texture);
      }catch(error){reject(error);}
    };
    img.onerror=()=>reject(new Error('图片无法加载。请检查地址、图片格式及跨域 CORS 设置。'));
    img.src=url;
  });
}
