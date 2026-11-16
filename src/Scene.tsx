import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer, FXAA, N8AO, SMAA } from '@react-three/postprocessing';
import { SMAAPreset } from 'postprocessing';
import * as THREE from 'three';
import { loadPoster } from './loadPoster';
import type { RenderSettings } from './performance';
import FrameModel from './FrameModel';
type Props = { poster: string; finish: number; warm: boolean; resetKey: number; reducedMotion: boolean; settings:RenderSettings; onReady: () => void; onError: (message: string) => void; canvasRef: React.RefObject<HTMLCanvasElement | null> };

function Frame({poster,finish,resetKey,reducedMotion,settings,onError,onReady}: Omit<Props,'canvasRef'|'warm'>) {
  const group=useRef<THREE.Group>(null);
  const [texture,setTexture]=useState<THREE.CanvasTexture>();
  const { viewport,gl,camera }=useThree();
  const resetUntil=useRef(0);
  const rotation=useRef({x:0,y:0});
  const zoom=useRef(7.65);
  const drag=useRef<{id:number;x:number;y:number}|null>(null);
  useEffect(()=>{resetUntil.current=performance.now()+1200;rotation.current={x:0,y:0};zoom.current=7.65;},[resetKey]);
  useEffect(()=>{
    const canvas=gl.domElement;
    canvas.style.cursor='grab';canvas.style.touchAction='none';
    const down=(e:PointerEvent)=>{if(e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};
    const move=(e:PointerEvent)=>{const active=drag.current;if(!active||active.id!==e.pointerId)return;rotation.current.y=THREE.MathUtils.clamp(rotation.current.y+(e.clientX-active.x)*.007,-1.2,1.2);rotation.current.x=THREE.MathUtils.clamp(rotation.current.x+(e.clientY-active.y)*.006,-.65,.65);active.x=e.clientX;active.y=e.clientY;};
    const up=(e:PointerEvent)=>{if(drag.current?.id!==e.pointerId)return;drag.current=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);canvas.style.cursor='grab';};
    const wheel=(e:WheelEvent)=>{e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);zoom.current=THREE.MathUtils.clamp(zoom.current+pixels*.006,4.9,12.5);};
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('wheel',wheel,{passive:false});
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('wheel',wheel);};
  },[gl]);
  useEffect(()=>{
    let canceled=false;let current:THREE.CanvasTexture|undefined;
    loadPoster(poster).then(t=>{ if(canceled){t.dispose();return;} current=t;setTexture(t);onReady(); }).catch(e=>{if(!canceled)onError(e.message);});
    return()=>{canceled=true;current?.dispose();};
  },[poster,onError,onReady]);
  useEffect(()=>{ const target=gl.domElement;const lost=(e:Event)=>{e.preventDefault();onError('图形上下文已丢失，请刷新页面重新进入展厅。');};target.addEventListener('webglcontextlost',lost);return()=>target.removeEventListener('webglcontextlost',lost);},[gl,onError]);
  useFrame(({pointer},delta)=>{
    if(!group.current)return;
    const neutral=reducedMotion||!!drag.current||performance.now()<resetUntil.current;
    group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,rotation.current.y-.065+(neutral?0:pointer.x*.105),6,delta);
    group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,rotation.current.x+(neutral?0:-pointer.y*.055),6,delta);
    camera.position.z=THREE.MathUtils.damp(camera.position.z,zoom.current,7,delta);
    // Expose read-only interaction telemetry for reproducible browser checks.
    gl.domElement.dataset.rotation=`${group.current.rotation.x.toFixed(3)},${group.current.rotation.y.toFixed(3)}`;
    gl.domElement.dataset.zoom=camera.position.z.toFixed(3);
  });
  const mobile=viewport.width<5.8;
  return <group position={[0,mobile?0.12:0.25,0]} scale={mobile?Math.min(.82,viewport.width/3.85):1}>
    <group ref={group} rotation={[0,-.065,0]}>
      <RoundedBox args={[3.03,4.03,.13]} radius={.025} smoothness={4} position={[0,0,-.09]} castShadow receiveShadow><meshStandardMaterial color="#161714" roughness={.7}/></RoundedBox>
      <group name="display-frame"><FrameModel index={finish}/></group>
      <mesh position={[0,0,-.006]} receiveShadow><planeGeometry args={[3,4]}/><meshStandardMaterial color="#f4ecdb" roughness={.88}/></mesh>
      {texture&&<mesh position={[0,0,.002]}><planeGeometry args={[3,4]}/><meshStandardMaterial map={texture} roughness={.82} metalness={0} envMapIntensity={.35}/></mesh>}
      {settings.glass&&<mesh position={[0,0,.052]}><boxGeometry args={[2.995,3.995,.012]}/><meshPhysicalMaterial transmission={1} thickness={.012} roughness={.025} ior={1.32} specularIntensity={.22} envMapIntensity={.48} metalness={0} color="#ffffff"/></mesh>}
    </group>
  </group>;
}

function World(props:Props) {
  return <>
    <color attach="background" args={['#171915']}/><fog attach="fog" args={['#171915',10,24]}/>
    <ambientLight intensity={.33} color={props.warm?'#f7e4c6':'#dbe6ff'}/>
    <spotLight key={props.settings.shadows?'shadows':'no-shadows'} position={[-3,6,5]} angle={.55} penumbra={1} intensity={props.warm?65:53} color={props.warm?'#ffe5bb':'#e2eeff'} castShadow={props.settings.shadows} shadow-mapSize={[1024,1024]} shadow-bias={-.0001}/>
    <spotLight position={[5,3,2]} angle={.7} penumbra={1} intensity={23} color="#d9e3d5"/>
    <Environment resolution={256} frames={1}>
      <group position={[-4,4,5]} scale={[2,5,1]}><Lightformer intensity={3} color="#ffebd1" target={[0,0,0]}/></group>
      <group position={[5,1,3]} scale={[1,4,1]}><Lightformer intensity={1.2} color="#dce8ff" target={[0,0,0]}/></group>
      <group position={[0,6,0]} rotation={[Math.PI/2,0,0]} scale={[5,2,1]}><Lightformer intensity={1} color="#ffffff"/></group>
    </Environment>
    <Frame {...props}/>
    <mesh position={[0,0,-4.5]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#272922" roughness={.96}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.95,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#252720" roughness={.65} metalness={.12}/></mesh>
    {props.settings.shadows&&<ContactShadows position={[0,-2.935,0]} opacity={.65} scale={10} blur={2.7} far={5} resolution={256} color="#080a07"/>}
    <EffectComposer multisampling={props.settings.antialias==='msaa'?4:0}>
      {props.settings.ao!=='off'&&<N8AO key={props.settings.ao} aoRadius={.2} intensity={.9} quality={props.settings.ao==='high'?'medium':'low'} halfRes={props.settings.ao!=='high'}/>}
      {props.settings.bloom&&<Bloom luminanceThreshold={1.4} intensity={.12} mipmapBlur/>}
      {props.settings.antialias==='fxaa'&&<FXAA/>}
      {props.settings.antialias==='smaa'&&<SMAA preset={SMAAPreset.HIGH}/>}
    </EffectComposer>
  </>;
}

export default function Scene(props:Props) {
  return <Canvas shadows={props.settings.shadows} dpr={props.settings.resolution} camera={{position:[0,.15,7.65],fov:40,near:.1,far:40}} gl={{antialias:false,alpha:false,preserveDrawingBuffer:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.13}} onCreated={({gl})=>{props.canvasRef.current=gl.domElement;}} fallback={<div className="error-panel">此浏览器暂不支持 WebGL。请使用开启硬件加速的 Chrome 或 Edge。</div>}><World {...props}/></Canvas>;
}
