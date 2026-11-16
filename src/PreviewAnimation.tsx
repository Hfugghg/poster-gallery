import { Suspense, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { flushSync } from 'react-dom';
import ReactDOM from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { EffectComposer, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import FrameModel from './FrameModel';
import { frames } from './frameCatalog';
import { artworks } from './artworks';
import { loadPoster } from './loadPoster';

declare global {
  interface Window {
    posterPreview: { duration: number; setTime(seconds: number): Promise<void> };
  }
}

type PendingCapture = { frames: number; resolve(): void } | null;

function shotAt(seconds: number) {
  const t = THREE.MathUtils.clamp(seconds,0,16);
  const index = t >= 4 && t < 12.8 ? Math.min(7,Math.floor((t-4)/1.1)) : 7;
  const close = t < 2 ? 0 : t < 4 ? THREE.MathUtils.smoothstep(t,2,4) : t < 12.8 ? 1 : t < 15 ? 1-THREE.MathUtils.smoothstep(t,12.8,15) : 0;
  const stage = t < 2 || t >= 15 ? '全景' : t < 4 ? '边角细节' : t < 12.8 ? '材质切换' : '全景';
  return { t,index,close,stage };
}

function PreviewWorld({ time,pending }: { time: number; pending: MutableRefObject<PendingCapture> }) {
  const model = useRef<THREE.Group>(null);
  const [poster,setPoster] = useState<THREE.CanvasTexture>();
  const initialFrames = useRef(0);
  const { index } = shotAt(time);
  const corner = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const eye = useRef(new THREE.Vector3());
  useEffect(() => {
    let cancelled = false;
    let current: THREE.CanvasTexture | undefined;
    loadPoster(artworks[0].url).then(texture=>{
      if(cancelled){texture.dispose();return;}
      current=texture;
      setPoster(texture);
    }).catch(error=>console.error(error));
    return()=>{cancelled=true;current?.dispose();};
  },[]);
  useFrame(({ camera }) => {
    if (!model.current || !poster) return;
    const { t,close } = shotAt(time);
    const phase = 2*Math.PI*(t%16)/16;
    model.current.rotation.set(-.025+Math.sin(phase)*.042,-.095+Math.sin(phase)*.085,Math.sin(phase)*.008);
    model.current.updateMatrixWorld(true);
    // Transform the corner with the model, keeping it centred even as it turns.
    corner.current.set(1.46,1.96,.065).applyMatrix4(model.current.matrixWorld);
    target.current.set(0,.025,0).lerp(corner.current,close);
    eye.current.set(0,.08,9.4).lerp(corner.current.clone().add(new THREE.Vector3(.24,.12,2.1)),close);
    camera.position.copy(eye.current);
    camera.lookAt(target.current);
    camera.updateMatrixWorld();
    if (++initialFrames.current >= 25) document.body.dataset.previewReady='true';
    if (pending.current && --pending.current.frames <= 0) {
      const done = pending.current;
      pending.current=null;
      done.resolve();
    }
  });
  return <>
    <color attach="background" args={['#181b17']}/>
    <ambientLight intensity={.62} color="#e5ebdd"/>
    <spotLight position={[-3,5,6]} target-position={[0,0,0]} angle={.65} penumbra={1} intensity={80} color="#ffe8c6"/>
    <spotLight position={[5,2,5]} angle={.7} penumbra={1} intensity={42} color="#e1eaff"/>
    <Environment frames={1} resolution={256}>
      <Lightformer position={[-4,4,5]} scale={[3,6,1]} intensity={3.8} color="#fff1d9" target={[0,0,0]}/>
      <Lightformer position={[5,2,4]} scale={[2,5,1]} intensity={2.4} color="#e1eaff" target={[0,0,0]}/>
      <Lightformer position={[0,-4,5]} scale={[5,2,1]} intensity={1.3} color="#ffffff" target={[0,0,0]}/>
    </Environment>
    <group ref={model}>
      <RoundedBox args={[3.03,4.03,.13]} radius={.025} smoothness={4} position={[0,0,-.09]}><meshStandardMaterial color="#151713" roughness={.7}/></RoundedBox>
      <FrameModel index={index}/>
      <mesh position={[0,0,-.006]}><planeGeometry args={[3,4]}/><meshStandardMaterial color="#f4ecdb" roughness={.88}/></mesh>
      {poster && <mesh position={[0,0,.002]}><planeGeometry args={[3,4]}/><meshStandardMaterial map={poster} roughness={.82} envMapIntensity={.35}/></mesh>}
      <mesh position={[0,0,.052]}><boxGeometry args={[2.995,3.995,.012]}/><meshPhysicalMaterial transmission={1} thickness={.012} roughness={.025} ior={1.32} specularIntensity={.2} envMapIntensity={.42} color="#ffffff"/></mesh>
    </group>
    <mesh position={[0,0,-3]}><planeGeometry args={[100,100]}/><meshBasicMaterial color="#1e241b"/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.58,0]}><planeGeometry args={[100,100]}/><meshBasicMaterial color="#262d21"/></mesh>
    <EffectComposer multisampling={0}><SMAA/></EffectComposer>
  </>;
}

function PreviewAnimation() {
  const [time,setTime] = useState(0);
  const pending = useRef<PendingCapture>(null);
  const { index,stage } = shotAt(time);
  useEffect(() => {
    window.posterPreview = {
      duration:16,
      async setTime(seconds) {
        if(!Number.isFinite(seconds)) throw new Error('时间必须是有限数字。');
        if(pending.current) throw new Error('请等待上一帧完成后再设置时间。');
        const done = new Promise<void>(resolve=>{pending.current={frames:3,resolve};});
        flushSync(()=>setTime(THREE.MathUtils.clamp(seconds,0,16)));
        await done;
      },
    };
    return()=>{pending.current?.resolve();pending.current=null;};
  },[]);
  return <main>
    <style>{`*{box-sizing:border-box}html,body,#root,main{width:100%;height:100%;margin:0;overflow:hidden}body{background:#181b17;font-family:'Segoe UI','Microsoft YaHei',sans-serif;-webkit-font-smoothing:antialiased}.preview-stage{position:absolute;inset:0}.preview-label{position:absolute;top:25px;left:28px;display:flex;align-items:center;gap:11px;color:#c8d2bc;font-size:11px;letter-spacing:.04em;pointer-events:none}.preview-label span:first-child{color:#87967a;font-size:10px}.preview-label i{width:1px;height:11px;background:#a2b38b40}`}</style>
    <div className="preview-stage"><Canvas dpr={1.5} camera={{position:[0,.08,9.4],fov:36,near:.05,far:40}} gl={{antialias:false,alpha:false,preserveDrawingBuffer:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.12}}><Suspense fallback={null}><PreviewWorld time={time} pending={pending}/></Suspense></Canvas></div>
    <div className="preview-label"><span>{stage}</span><i/><span>{frames[index].label}</span></div>
  </main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<PreviewAnimation/>);
