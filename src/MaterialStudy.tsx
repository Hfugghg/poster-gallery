import { Suspense, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import FrameModel from './FrameModel';

const names = ['CHAMPAGNE','GRAPHITE','BRUSHED SILVER','WALNUT','OAK','TRAVERTINE','WHITE MARBLE','ORNATE BRONZE'];
const swatches = ['#ac9874','#252a29','#b9bfbd','#64412a','#c4a57b','#c5b69b','#dedfd9','#897043'];

function FrameCorner({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = group.current;
    if (!root) return;
    root.updateWorldMatrix(true,true);
    const planes = [new THREE.Plane(new THREE.Vector3(1,0,0),-.64),new THREE.Plane(new THREE.Vector3(0,1,0),-1.14)]
      .map(plane => plane.applyMatrix4(root.matrixWorld));
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.clippingPlanes = planes;
        material.clipShadows = true;
        material.needsUpdate = true;
      }
    });
  },[]);
  return <group position={[(index-3.5)*.70,(index-3.5)*.32,index*.075]} rotation={[0,0,-.16]} scale={1.6}>
    <group position={[-1.715,-2.215,0]} ref={group}><FrameModel index={index}/></group>
  </group>;
}

function Studio() {
  const rendered = useRef(0);
  useFrame(() => { if (++rendered.current === 35) document.body.dataset.ready = 'true'; });
  return <>
    <color attach="background" args={['#e7e5df']}/>
    <ambientLight intensity={.8} color="#fffaf0"/>
    <directionalLight position={[-3,7,9]} intensity={2.8} color="#fff9ed" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={.1} shadow-camera-far={30} shadow-bias={-.00015} shadow-normalBias={.004} shadow-radius={5} shadow-blurSamples={12}/>
    <directionalLight position={[6,-2,5]} intensity={1.1} color="#e9f0ff"/>
    <Environment frames={1} resolution={512}>
      <Lightformer position={[-4,4,7]} scale={[5,7,1]} intensity={4} color="#fff9ef" target={[0,0,0]}/>
      <Lightformer position={[5,1,6]} scale={[2,5,1]} intensity={2.4} color="#e5edff" target={[0,0,0]}/>
      <Lightformer position={[0,-5,5]} scale={[7,2,1]} intensity={1.5} color="#ffffff" target={[0,0,0]}/>
    </Environment>
    <group position={[.65,.7,0]}>{names.map((_,index)=><FrameCorner key={index} index={index}/>)}</group>
    <mesh position={[0,0,-.65]} receiveShadow><planeGeometry args={[100,100]}/><shadowMaterial color="#625e50" opacity={.22}/></mesh>
    <EffectComposer multisampling={4}><N8AO aoRadius={.18} intensity={1.4} quality="high"/><SMAA/></EffectComposer>
  </>;
}

function MaterialStudy() {
  return <main>
    <style>{`
      *{box-sizing:border-box}html,body,#root,main{width:100%;height:100%;margin:0;overflow:hidden}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#e7e5df;color:#383a34;-webkit-font-smoothing:antialiased}
      .study-scene{position:absolute;inset:0}.study-header{position:absolute;top:64px;left:88px;right:88px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}
      .study-kicker{font-size:11px;letter-spacing:.22em;color:#787b70;margin-bottom:13px}.study-title{font-size:45px;letter-spacing:-.035em;font-weight:400;line-height:1;margin:0}
      .study-count{display:flex;align-items:baseline;gap:12px;padding-top:2px}.study-count strong{font-size:38px;font-weight:350;letter-spacing:-.04em}.study-count span{font-size:9px;letter-spacing:.18em;color:#7d8075}
      .study-bottom{position:absolute;bottom:58px;left:88px;right:88px;border-top:1px solid #3e443124;padding-top:22px;display:grid;grid-template-columns:repeat(8,1fr);gap:18px;pointer-events:none}
      .study-material{font-size:9px;letter-spacing:.08em;white-space:nowrap}.study-number{display:block;color:#909286;font-size:9px;margin-bottom:11px;letter-spacing:.13em}.study-material i{display:inline-block;width:7px;height:7px;margin-right:7px;border:1px solid #00000012;border-radius:50%}
    `}</style>
    <div className="study-scene"><Canvas orthographic shadows camera={{position:[2.2,3.5,16],zoom:190,near:.1,far:50}} gl={{antialias:false,alpha:false,preserveDrawingBuffer:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}} onCreated={({gl})=>{gl.localClippingEnabled=true;gl.shadowMap.type=THREE.VSMShadowMap;}}><Suspense fallback={null}><Studio/></Suspense></Canvas></div>
    <header className="study-header"><div><div className="study-kicker">MATERIAL & FORM STUDY</div><h1 className="study-title">Frame materials.</h1></div><div className="study-count"><strong>08</strong><span>FINISHES</span></div></header>
    <footer className="study-bottom">{names.map((name,index)=><div className="study-material" key={name}><span className="study-number">0{index+1}</span><i style={{background:swatches[index]}}/>{name}</div>)}</footer>
  </main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<MaterialStudy/>);
