import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ArrowDownToLine, Check, ChevronUp, Expand, HelpCircle, Maximize, Moon, RotateCcw, Settings2, Sun, Upload, X } from 'lucide-react';
import Scene from './Scene';
import { frames } from './frameCatalog';
import FramePicker from './FramePicker';
import { artworks } from './artworks';
import type { Artwork } from './artworks';
import PerformancePanel from './PerformancePanel';
import { readRenderSettings, saveRenderSettings } from './performance';

class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error('3D scene error',error,info);}
  render(){return this.state.failed?<div className="error-panel"><p>3D 展厅暂时无法启动</p><p>请开启浏览器硬件加速后刷新页面。</p><button className="text-button" onClick={()=>location.reload()}>重新加载</button></div>:this.props.children;}
}

export default function App(){
  const [selected,setSelected]=useState<Artwork>(artworks[0]);
  const [finish,setFinish]=useState(0);
  const [warm,setWarm]=useState(true);
  const [focus,setFocus]=useState(false);
  const [help,setHelp]=useState(false);
  const [performanceOpen,setPerformanceOpen]=useState(false);
  const [framePickerOpen,setFramePickerOpen]=useState(false);
  const [settings,setSettings]=useState(readRenderSettings);
  const [ready,setReady]=useState(false);
  const [resetKey,setResetKey]=useState(0);
  const [toast,setToast]=useState('');
  const [reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const inputRef=useRef<HTMLInputElement>(null);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const helpTrigger=useRef<HTMLButtonElement>(null);
  const uploadedUrl=useRef<string|null>(null);
  const notify=useCallback((message:string)=>setToast(message),[]);
  const onReady=useCallback(()=>setReady(true),[]);
  useEffect(()=>saveRenderSettings(settings),[settings]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3800);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const handler=()=>setReducedMotion(media.matches);media.addEventListener('change',handler);return()=>media.removeEventListener('change',handler);},[]);
  useEffect(()=>()=>{if(uploadedUrl.current)URL.revokeObjectURL(uploadedUrl.current);},[]);
  useEffect(()=>{if(help)dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();},[help]);
  const closeHelp=useCallback(()=>{setHelp(false);helpTrigger.current?.focus();},[]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(help)closeHelp();setFocus(false);setPerformanceOpen(false);setFramePickerOpen(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[help,closeHelp]);
  async function upload(file?:File){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('请选择 JPG、PNG 或 WebP 图片。');return;}
    if(file.size>20*1024*1024){notify('图片需小于 20 MB。');return;}
    const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();if(img.width>16000||img.height>16000)throw new Error('size');if(uploadedUrl.current)URL.revokeObjectURL(uploadedUrl.current);uploadedUrl.current=url;setSelected({id:'custom',title:file.name.replace(/\.[^.]+$/,''),subtitle:'私人收藏 · 你的原创作品',year:'2026',url});notify(Math.abs(img.width/img.height-.75)>.01?'海报已置入，已按 3:4 居中裁切。':'你的海报已置入展框。');}catch{URL.revokeObjectURL(url);notify('图片无法读取或尺寸过大，请换一张图片。');}
  }
  function download(){const canvas=canvasRef.current;if(!canvas||!ready){notify('展厅正在准备，请稍候。');return;}canvas.toBlob(blob=>{if(!blob){notify('暂时无法导出，请重试。');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ATELIER-${selected.id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('展厅画面已导出。');},'image/png');}
  return <div className={`app ${focus?'focus-mode':''}`}>
    <header className="header ui-layer"><span className="brand">3D 展框</span><div className="header-right"><button ref={helpTrigger} className="icon-button" aria-label="使用说明" title="使用说明" onClick={()=>setHelp(true)}><HelpCircle size={18}/></button></div></header>
    <main className="gallery" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(e.dataTransfer.files[0]);}}>
      <div className="scene-wrap" aria-label="可随鼠标移动的 3D 海报展框"><SceneBoundary><Suspense fallback={null}><Scene poster={selected.url} finish={finish} warm={warm} resetKey={resetKey} reducedMotion={reducedMotion} settings={settings} onReady={onReady} onError={notify} canvasRef={canvasRef}/></Suspense></SceneBoundary></div>
      {!ready&&<div className="loading-screen"><span className="loading-ring"/><span>正在点亮展厅</span></div>}
      <div className="view-tools ui-layer"><button className="icon-button" aria-label="性能设置" title="画面与性能" aria-expanded={performanceOpen} aria-controls="performance-settings" onClick={()=>setPerformanceOpen(v=>!v)}><Settings2 size={18}/></button><span className="tools-line"/><button className="icon-button" aria-label={warm?'切换冷色光照':'切换暖色光照'} title="切换光照" onClick={()=>setWarm(v=>!v)}>{warm?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button" aria-label="重置视角" title="重置视角" onClick={()=>{setResetKey(v=>v+1);notify('已恢复初始视角。');}}><RotateCcw size={17}/></button><button className="icon-button" aria-label="进入沉浸模式" title="沉浸模式" onClick={()=>setFocus(true)}><Expand size={18}/></button><span className="tools-line"/><button className="icon-button" aria-label="导出展厅图片" title="导出图片" onClick={download}><ArrowDownToLine size={18}/></button></div>
      {performanceOpen&&<PerformancePanel settings={settings} onChange={setSettings} onClose={()=>setPerformanceOpen(false)}/>}
    </main>
    <section className="bottom-panel ui-layer" aria-label="展框和海报设置">
      <div className="panel-group"><div className="panel-label">边框</div><button className="frame-picker-trigger" aria-label="选择边框样式" aria-expanded={framePickerOpen} aria-controls="frame-style-picker" onClick={()=>{setFramePickerOpen(v=>!v);setPerformanceOpen(false);}}><span className="material-swatch" style={{background:frames[finish].preview??frames[finish].color}}/><span>{frames[finish].label}</span><ChevronUp size={14}/></button></div>
      <div className="panel-divider"/>
      <div className="panel-group"><div className="panel-label">海报</div><div className="poster-options">{artworks.map(a=><button key={a.id} className={`poster-thumb ${selected.id===a.id?'selected':''}`} aria-label={`展示${a.title}`} aria-pressed={selected.id===a.id} onClick={()=>setSelected(a)}><img src={a.url} alt={a.title}/></button>)}</div></div>
      <div className="panel-divider"/>
      <div className="panel-group upload-group"><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/><button className="upload-button" onClick={()=>inputRef.current?.click()}><Upload size={17}/>上传海报</button><div className="upload-note">3:4 · JPG / PNG / WebP</div></div>
    </section>
    {framePickerOpen&&<FramePicker index={finish} onClose={()=>setFramePickerOpen(false)} onSelect={index=>{setFinish(index);setFramePickerOpen(false);}}/>}
    {focus&&<button className="focus-exit text-button" onClick={()=>setFocus(false)}><Maximize size={16}/>退出沉浸模式 <span>ESC</span></button>}
    <div className="toast" role="status" aria-live="polite" data-visible={!!toast}>{toast&&<><Check size={16}/>{toast}</>}</div>
    {help&&<div className="help-modal-backdrop" onClick={closeHelp}><div ref={dialogRef} className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();dialogRef.current?.querySelector('button')?.focus();}}}><div className="modal-header"><h2 id="help-title">使用说明</h2><button className="modal-close icon-button" onClick={closeHelp} aria-label="关闭说明"><X size={20}/></button></div><div className="help-row"><HelpCircle size={18}/><span>按住鼠标左键拖动可大角度旋转，滚轮缩放。底部切换边框材质和海报。</span></div><div className="help-row"><Upload size={18}/><span>上传或拖入不超过 20 MB 的图片，按 3:4 居中裁切。图片仅在本地处理。</span></div><div className="help-row"><Sun size={18}/><span>右侧可切换光照、重置角度和缩放、进入沉浸模式或导出 PNG。按 ESC 退出沉浸模式。</span></div></div></div>}
  </div>;
}
