export type FrameId = 'champagne' | 'graphite' | 'silver' | 'walnut' | 'oak' | 'travertine' | 'marble' | 'bronze';

export type FrameDefinition = {
  id: FrameId;
  label: string;
  color: string;
  description: string;
  preview: string;
  metalness: number;
  roughness: number;
};

export const frames: FrameDefinition[] = [
  { id: 'champagne', label: '香槟金', color: '#ac9874', description: '窄边倒角 · 细磨金属', preview: 'linear-gradient(135deg,#c5b28c,#8b7757 48%,#b7a581)', metalness: .87, roughness: .35 },
  { id: 'graphite', label: '曜石黑', color: '#252a29', description: '窄边倒角 · 石墨涂层', preview: 'linear-gradient(135deg,#3c4340,#1d2220 55%,#39413c)', metalness: .72, roughness: .32 },
  { id: 'silver', label: '雾银色', color: '#b9bfbd', description: '窄边倒角 · 拉丝铝', preview: 'repeating-linear-gradient(0deg,#aeb6b2 0px,#c6ccc9 1px,#b9bfbd 3px)', metalness: .92, roughness: .34 },
  { id: 'walnut', label: '胡桃木', color: '#64412a', description: '宽边斜切 · 深色木纹', preview: 'repeating-linear-gradient(8deg,#54351f 0px,#795237 4px,#5e3b24 7px)', metalness: 0, roughness: .57 },
  { id: 'oak', label: '浅橡木', color: '#c4a57b', description: '圆润宽框 · 浅色木纹', preview: 'repeating-linear-gradient(8deg,#b8986b 0px,#d3b88b 4px,#c1a175 7px)', metalness: 0, roughness: .62 },
  { id: 'travertine', label: '洞石', color: '#c5b69b', description: '阶梯宽框 · 天然孔隙', preview: 'repeating-linear-gradient(3deg,#b2a38a 0px,#d1c4ac 5px,#c2b298 8px)', metalness: 0, roughness: .79 },
  { id: 'marble', label: '白大理石', color: '#dedfd9', description: '圆弧宽框 · 灰白石纹', preview: 'repeating-linear-gradient(125deg,#e3e4de 0px,#d8dad4 9px,#9ca39d 11px,#e4e5df 13px,#e4e5df 35px)', metalness: 0, roughness: .24 },
  { id: 'bronze', label: '雕纹古铜', color: '#897043', description: '多层线脚 · 锤纹与珠饰', preview: 'linear-gradient(135deg,#ad955f,#65502f 35%,#9e8551 65%,#4f4c32)', metalness: .83, roughness: .48 },
];
