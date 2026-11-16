import { Check, X } from 'lucide-react';
import { frames } from './frameCatalog';
import './frames.css';

type Props={index:number;onSelect:(index:number)=>void;onClose:()=>void};
export default function FramePicker({index,onSelect,onClose}:Props){
  return <section className="frame-picker ui-layer" aria-label="边框样式" id="frame-style-picker">
    <div className="frame-picker-header"><h2>边框样式</h2><button className="icon-button" aria-label="关闭边框样式" onClick={onClose}><X size={16}/></button></div>
    <div className="frame-grid">{frames.map((frame,i)=><button key={frame.id} className={`frame-card ${index===i?'selected':''}`} aria-label={frame.label} aria-pressed={index===i} onClick={()=>onSelect(i)}>
      <span className={`frame-card-preview frame-preview-${frame.id}`}><span className="frame-miniature" style={{background:frame.preview??frame.color}}><span/></span>{index===i&&<span className="frame-selected"><Check size={13}/></span>}</span>
      <span className="frame-card-label">{frame.label}</span><span className="frame-card-description">{frame.description}</span>
    </button>)}</div>
  </section>;
}
