export type RenderSettings = {
  resolution: number;
  antialias: 'off' | 'fxaa' | 'smaa' | 'msaa';
  ao: 'off' | 'low' | 'high';
  shadows: boolean;
  bloom: boolean;
  glass: boolean;
};

export const qualityPresets: {id:string;label:string;settings:RenderSettings}[] = [
  {id:'fast',label:'流畅',settings:{resolution:1,antialias:'fxaa',ao:'off',shadows:false,bloom:false,glass:false}},
  {id:'balanced',label:'均衡',settings:{resolution:1,antialias:'fxaa',ao:'low',shadows:true,bloom:false,glass:true}},
  {id:'quality',label:'高清',settings:{resolution:1.5,antialias:'smaa',ao:'high',shadows:true,bloom:true,glass:true}},
];

const storageKey='poster-gallery-render-settings-v1';
export function readRenderSettings():RenderSettings {
  try{
    const value=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(value&&typeof value.resolution==='number'&&Number.isFinite(value.resolution)&&value.resolution>=.75&&value.resolution<=2&&['off','fxaa','smaa','msaa'].includes(value.antialias)&&['off','low','high'].includes(value.ao)&&['shadows','bloom','glass'].every(k=>typeof value[k]==='boolean'))return value;
  }catch{ /* Storage can be unavailable in private browsing. */ }
  return {...qualityPresets[1].settings};
}
export function saveRenderSettings(settings:RenderSettings){try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{ /* Settings remain usable for this session. */ }}
