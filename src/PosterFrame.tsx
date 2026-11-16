'use client';

import { Component, Suspense, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, ErrorInfo, ReactNode } from 'react';
import Scene from './Scene';
import { frames } from './frameCatalog';
import type { FrameId } from './frameCatalog';
import { qualityPresets } from './performance';
import type { RenderSettings } from './performance';

export type QualityPreset='fast'|'balanced'|'quality';
export type PosterFrameHandle={
  resetView:()=>void;
  getCanvas:()=>HTMLCanvasElement|null;
  exportPng:()=>Promise<Blob>;
};
export type PosterFrameProps={
  posterSrc:string;
  frame?:FrameId;
  defaultFrame?:FrameId;
  quality?:QualityPreset;
  defaultQuality?:QualityPreset;
  settings?:Partial<RenderSettings>;
  warm?:boolean;
  reducedMotion?:boolean;
  showControls?:boolean;
  className?:string;
  style?:CSSProperties;
  onReady?:()=>void;
  onError?:(error:Error)=>void;
  onFrameChange?:(frame:FrameId)=>void;
  onQualityChange?:(quality:QualityPreset)=>void;
  onSettingsChange?:(settings:RenderSettings)=>void;
};

class RenderBoundary extends Component<{children:ReactNode;onError:(error:Error)=>void;resetKey:string},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error,_info:ErrorInfo){this.props.onError(error);}
  componentDidUpdate(previous:Readonly<{children:ReactNode;onError:(error:Error)=>void;resetKey:string}>){if(previous.resetKey!==this.props.resetKey&&this.state.failed)this.setState({failed:false});}
  render(){return this.state.failed?null:this.props.children;}
}

const controlStyle:CSSProperties={font:'inherit',fontSize:12,color:'#e2e7dc',background:'#282e24',border:'1px solid #76826766',borderRadius:5,padding:'7px 9px',maxWidth:'100%'};

/** Self-contained React viewer. No global styles, image assets or storage writes. */
export const PosterFrame=forwardRef<PosterFrameHandle,PosterFrameProps>(function PosterFrame({
  posterSrc,frame,defaultFrame='champagne',quality,defaultQuality='balanced',settings,
  warm=true,reducedMotion,showControls=false,className,style,
  onReady,onError,onFrameChange,onQualityChange,onSettingsChange,
},ref){
  const [mounted,setMounted]=useState(false);
  const [systemReducedMotion,setSystemReducedMotion]=useState(false);
  const [localFrame,setLocalFrame]=useState<FrameId>(defaultFrame);
  const [localQuality,setLocalQuality]=useState<QualityPreset>(defaultQuality);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [resetKey,setResetKey]=useState(0);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const callbacks=useRef({onReady,onError});
  useEffect(()=>{callbacks.current={onReady,onError};},[onReady,onError]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setSystemReducedMotion(media.matches);update();setMounted(true);
    media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{setReady(false);setError(null);},[posterSrc]);
  const handleReady=useCallback(()=>{setReady(true);setError(null);callbacks.current.onReady?.();},[]);
  const handleError=useCallback((reason:Error|string)=>{const cause=reason instanceof Error?reason:new Error(reason);setError(cause.message);callbacks.current.onError?.(cause);},[]);
  const activeFrame=frame??localFrame;
  const activeQuality=quality??localQuality;
  const preset=qualityPresets.find(p=>p.id===activeQuality)??qualityPresets[1];
  const renderSettings:RenderSettings={...preset.settings,...settings};
  renderSettings.resolution=Number.isFinite(renderSettings.resolution)?Math.min(2,Math.max(.75,renderSettings.resolution)):1;
  const frameIndex=Math.max(0,frames.findIndex(item=>item.id===activeFrame));
  const resetView=useCallback(()=>setResetKey(key=>key+1),[]);
  useImperativeHandle(ref,()=>({
    resetView,
    getCanvas:()=>canvasRef.current,
    exportPng:()=>new Promise((resolve,reject)=>{
      const canvas=canvasRef.current;
      if(!canvas||!ready){reject(new Error('3D 展框尚未准备完成。'));return;}
      try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 导出失败。')),'image/png');}catch(cause){reject(cause);}
    }),
  }),[ready,resetView]);
  const chooseFrame=(id:FrameId)=>{if(frame===undefined)setLocalFrame(id);onFrameChange?.(id);};
  const chooseQuality=(id:QualityPreset)=>{
    if(quality===undefined)setLocalQuality(id);onQualityChange?.(id);
    const chosen=qualityPresets.find(p=>p.id===id)!;onSettingsChange?.({...chosen.settings});
  };
  return <div className={className} role="region" aria-label="3D 海报展框" style={{position:'relative',width:'100%',height:600,overflow:'hidden',isolation:'isolate',background:'#171915',...style}}>
    {mounted&&<RenderBoundary resetKey={posterSrc} onError={handleError}><Suspense fallback={null}><Scene poster={posterSrc} finish={frameIndex} warm={warm} resetKey={resetKey} reducedMotion={reducedMotion??systemReducedMotion} settings={renderSettings} onReady={handleReady} onError={handleError} canvasRef={canvasRef}/></Suspense></RenderBoundary>}
    {(!ready||error)&&<div role={error?'alert':'status'} style={{position:'absolute',inset:0,display:'grid',placeItems:'center',padding:24,textAlign:'center',color:'#cbd3c1',fontSize:13,pointerEvents:'none',background:error?'#171915':undefined}}>{error??'正在加载 3D 展框…'}</div>}
    {showControls&&<div aria-label="展框控件" style={{position:'absolute',zIndex:2,left:12,right:12,bottom:12,display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',fontFamily:'system-ui, sans-serif',fontSize:12,color:'#cbd3c1'}}>
      <label style={{display:'flex',gap:6,alignItems:'center'}}>边框<select aria-label="边框材质" value={frames[frameIndex].id} onChange={event=>chooseFrame(event.target.value as FrameId)} style={controlStyle}>{frames.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label style={{display:'flex',gap:6,alignItems:'center'}}>画质<select aria-label="画质预设" value={activeQuality} onChange={event=>chooseQuality(event.target.value as QualityPreset)} style={controlStyle}>{qualityPresets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <button type="button" onClick={resetView} style={{...controlStyle,cursor:'pointer'}}>重置视角</button>
    </div>}
  </div>;
});
