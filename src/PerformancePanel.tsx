import { X } from 'lucide-react';
import type { RenderSettings } from './performance';
import { qualityPresets } from './performance';
import './performance.css';

type Props={settings:RenderSettings;onChange:(settings:RenderSettings)=>void;onClose:()=>void};
export default function PerformancePanel({settings,onChange,onClose}:Props){
  const update=(patch:Partial<RenderSettings>)=>onChange({...settings,...patch});
  return <section className="performance-panel ui-layer" aria-label="性能设置" id="performance-settings">
    <div className="performance-header"><h2>画面与性能</h2><button className="icon-button" aria-label="关闭性能设置" onClick={onClose}><X size={16}/></button></div>
    <div className="performance-presets">{qualityPresets.map(p=>{const active=Object.entries(p.settings).every(([key,value])=>settings[key as keyof RenderSettings]===value);return <button key={p.id} className={active?'active':''} aria-pressed={active} onClick={()=>onChange({...p.settings})}>{p.label}</button>;})}</div>
    <div className="performance-row"><label htmlFor="render-resolution">渲染分辨率</label><output htmlFor="render-resolution">{settings.resolution.toFixed(2)}×</output><input id="render-resolution" aria-label="渲染分辨率" type="range" min="0.75" max="2" step="0.25" value={settings.resolution} onChange={e=>update({resolution:Number(e.target.value)})}/></div>
    <div className="performance-row"><label htmlFor="render-antialias">抗锯齿</label><select id="render-antialias" className="performance-select" value={settings.antialias} onChange={e=>update({antialias:e.target.value as RenderSettings['antialias']})}><option value="off">关闭 · 最低开销</option><option value="fxaa">FXAA · 轻量</option><option value="smaa">SMAA · 更清晰</option><option value="msaa">MSAA 4× · 较高开销</option></select></div>
    <div className="performance-row"><label htmlFor="render-ao">环境遮蔽</label><select id="render-ao" className="performance-select" value={settings.ao} onChange={e=>update({ao:e.target.value as RenderSettings['ao']})}><option value="off">关闭</option><option value="low">半分辨率 · 低开销</option><option value="high">全分辨率 · 高画质</option></select></div>
    <label className="performance-check"><input type="checkbox" checked={settings.shadows} onChange={e=>update({shadows:e.target.checked})}/><span>动态阴影</span></label>
    <label className="performance-check"><input type="checkbox" checked={settings.bloom} onChange={e=>update({bloom:e.target.checked})}/><span>辉光后处理</span></label>
    <label className="performance-check"><input type="checkbox" checked={settings.glass} onChange={e=>update({glass:e.target.checked})}/><span>玻璃透射</span></label>
    <p className="performance-note">调整立即生效，设置自动保存。<br/>卡顿时优先选择「流畅」或降低分辨率。</p>
    <button className="performance-reset" onClick={()=>onChange({...qualityPresets[1].settings})}>恢复默认</button>
  </section>;
}
