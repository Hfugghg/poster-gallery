import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { frames } from './frameCatalog';
import type { FrameId } from './frameCatalog';
import { makeFrameTextures } from './frameTextures';

type ProfilePoint = readonly [offset: number, z: number];

// Each closed section sweeps around four mitered rails. All sections start
// at the same 2.98 x 3.98 opening and stay within 3.44 x 4.44 x .38.
function profile(id: FrameId): ProfilePoint[] {
  // Solid timber: one broad, unbroken face with only small edge roundovers.
  if (id === 'walnut') return [[0,-.15],[0,.106],[.003,.112],[.008,.115],[.202,.115],[.207,.112],[.21,.106],[.21,-.142],[.202,-.15]];
  if (id === 'oak') return [[0,-.15],[0,.112],[.003,.12],[.009,.125],[.211,.125],[.217,.12],[.22,.112],[.22,-.141],[.211,-.15]];
  if (id === 'travertine') return [[0,-.16],[0,.065],[.016,.08],[.055,.08],[.055,.106],[.065,.115],[.19,.115],[.215,.09],[.22,.07],[.22,-.14],[.205,-.17]];
  if (id === 'marble') return [[0,-.16],[0,.065],[.014,.08],[.045,.108],[.08,.13],[.12,.145],[.155,.15],[.183,.143],[.204,.127],[.216,.105],[.22,.08],[.22,-.13],[.205,-.16]];
  if (id === 'bronze') return [[0,-.16],[0,.065],[.012,.082],[.03,.082],[.043,.068],[.058,.075],[.075,.11],[.092,.132],[.11,.14],[.127,.132],[.142,.11],[.15,.085],[.171,.085],[.179,.123],[.194,.14],[.208,.133],[.22,.11],[.225,.07],[.225,-.15],[.21,-.175]];
  return [[0,-.08],[0,.064],[.008,.082],[.02,.09],[.06,.09],[.075,.083],[.083,.067],[.083,-.07],[.07,-.09]];
}

/** Per-rail UVs keep wooden grain and brushing along the length of each rail. */
function makeGeometry(id: FrameId) {
  const section = profile(id);
  const distances = [0];
  for (let j = 0; j < section.length; j++) {
    const a = section[j], b = section[(j + 1) % section.length];
    distances.push(distances[j] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const circumference = distances[section.length];
  const positions: number[] = [], uvs: number[] = [];
  const railSegments = 20;
  function point(side: number, p: ProfilePoint, t: number) {
    const x = 1.49 + p[0], y = 1.99 + p[0];
    if (side === 0) return [-x + 2*x*t, y, p[1]];
    if (side === 1) return [x, y - 2*y*t, p[1]];
    if (side === 2) return [x - 2*x*t, -y, p[1]];
    return [-x, -y + 2*y*t, p[1]];
  }
  for (let side = 0; side < 4; side++) {
    for (let j = 0; j < section.length; j++) {
      const next = (j + 1) % section.length;
      for (let i = 0; i < railSegments; i++) {
        const t0 = i / railSegments, t1 = (i + 1) / railSegments;
        const points = [point(side,section[j],t0),point(side,section[j],t1),point(side,section[next],t1),point(side,section[next],t0)];
        // Four independent 512 x 128 rail strips share one atlas. Each whole
        // rail uses its strip once, including the front, bevels and sidewalls.
        // Three-pixel guards keep filtering inside each independent strip.
        const u0 = (3 + t0*506)/512;
        const u1 = (3 + t1*506)/512;
        const v0 = (side*128 + 3 + distances[j]/circumference*122)/512;
        const v1 = (side*128 + 3 + distances[j+1]/circumference*122)/512;
        const uv = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
        for (const k of [0,1,2,0,2,3]) { positions.push(...points[k]); uvs.push(...uv[k]); }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();
  // Smooth gentle changes in rounded sections. Exact position keys and unique
  // face directions avoid normal changes at the twenty rail subdivisions.
  const normals = geometry.getAttribute('normal');
  const directions = new Map<string,Map<string,THREE.Vector3>>();
  const keyAt = (i:number) => positions.slice(i*3,i*3+3).map(value=>value.toFixed(6)).join(',');
  for (let i = 0; i < normals.count; i++) {
    const key = keyAt(i);
    const normal = new THREE.Vector3().fromBufferAttribute(normals,i);
    const direction = normal.toArray().map(value=>value.toFixed(5)).join(',');
    if (!directions.has(key)) directions.set(key,new Map());
    directions.get(key)!.set(direction,normal);
  }
  const smoothed = new Float32Array(normals.count*3);
  for (let i = 0; i < normals.count; i++) {
    const current = new THREE.Vector3().fromBufferAttribute(normals,i);
    const sum = new THREE.Vector3();
    for (const normal of directions.get(keyAt(i))!.values()) {
      if (current.dot(normal) > .93) sum.add(normal);
    }
    sum.normalize().toArray(smoothed,i*3);
  }
  geometry.setAttribute('normal',new THREE.BufferAttribute(smoothed,3));
  geometry.computeBoundingBox();
  return geometry;
}

function BronzeBeads({ material }: { material: THREE.MeshStandardMaterial }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(.014,10,6),[]);
  const positions = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const x = 1.523, y = 2.023;
    for (let i = 0; i < 31; i++) {
      const t = (i + .5) / 31;
      points.push(new THREE.Vector3(-x+2*x*t,y,.083),new THREE.Vector3(x-2*x*t,-y,.083));
    }
    for (let i = 0; i < 41; i++) {
      const t = (i + .5) / 41;
      points.push(new THREE.Vector3(x,y-2*y*t,.083),new THREE.Vector3(-x,-y+2*y*t,.083));
    }
    return points;
  },[]);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    positions.forEach((position,i) => { matrix.makeTranslation(position); mesh.setMatrixAt(i,matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  },[positions]);
  useEffect(() => () => geometry.dispose(),[geometry]);
  return <instancedMesh ref={ref} args={[geometry,material,positions.length]} castShadow receiveShadow dispose={null}/>;
}

function BronzeLeaves({material}:{material:THREE.MeshStandardMaterial}) {
  const ref=useRef<THREE.InstancedMesh>(null);
  const geometry=useMemo(()=>{
    const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(.026,.025,.058,0);leaf.quadraticCurveTo(.025,-.016,0,0);
    return new THREE.ExtrudeGeometry(leaf,{depth:.004,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1,curveSegments:3,steps:1});
  },[]);
  const matrices=useMemo(()=>{
    const result:THREE.Matrix4[]=[];
    for(let side=0;side<4;side++){
      const count=side%2?23:17;
      for(let i=0;i<count;i++)for(const direction of [-1,1]){
        const t=(i+.5)/count;
        const x=side===0?-1.6+3.2*t:side===1?1.6:side===2?1.6-3.2*t:-1.6;
        const y=side===0?2.1:side===1?2.1-4.2*t:side===2?-2.1:-2.1+4.2*t;
        const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-side*Math.PI/2+direction*.52);
        const variation=.94+.08*Math.sin(i*2.39+side);
        result.push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,.14),rotation,new THREE.Vector3(variation,variation,1)));
      }
    }
    return result;
  },[]);
  useEffect(()=>{const mesh=ref.current;if(!mesh)return;matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();},[matrices]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <instancedMesh ref={ref} args={[geometry,material,matrices.length]} castShadow dispose={null}/>;
}

export default function FrameModel({ index }: { index: number }) {
  const definition = frames[index] ?? frames[0];
  const resources = useMemo(() => {
    const textures = makeFrameTextures(definition);
    const geometry = makeGeometry(definition.id);
    const material = new THREE.MeshStandardMaterial({
      map:textures.map, bumpMap:textures.bumpMap, roughnessMap:textures.roughnessMap,
      bumpScale: definition.id === 'bronze' ? .0038 : definition.id === 'walnut' || definition.id === 'oak' ? .0022 : definition.id === 'travertine' ? .01 : definition.id === 'marble' ? .0018 : definition.metalness > .5 ? .0016 : .003,
      metalness:definition.metalness, roughness:definition.id === 'bronze' ? .35 : definition.roughness,
      envMapIntensity:definition.metalness > .5 ? .8 : .48,
    });
    const ornamentMaterial=definition.id==='bronze'?new THREE.MeshStandardMaterial({color:'#b08c51',metalness:.86,roughness:.3,envMapIntensity:.85}):null;
    return { geometry,material,textures,ornamentMaterial };
  },[definition]);
  useEffect(() => () => { resources.geometry.dispose(); resources.material.dispose(); resources.ornamentMaterial?.dispose(); resources.textures.dispose(); },[resources]);
  return <group>
    <mesh geometry={resources.geometry} material={resources.material} castShadow receiveShadow dispose={null}/>
    {resources.ornamentMaterial && <><BronzeBeads material={resources.ornamentMaterial}/><BronzeLeaves material={resources.ornamentMaterial}/></>}
  </group>;
}
