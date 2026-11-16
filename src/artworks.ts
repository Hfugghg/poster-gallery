export type Artwork = { id: string; title: string; subtitle: string; year: string; url: string };

function makeArt(variant: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 1600;
  const c = canvas.getContext('2d')!;
  const palettes = [['#e7e1d3', '#b84e31', '#1f302c'], ['#deddd0', '#213c52', '#e9a35e'], ['#e9e2d4', '#767a4e', '#b7ad8b']];
  const [paper, accent, dark] = palettes[variant];
  c.fillStyle = paper; c.fillRect(0, 0, 1200, 1600);
  c.fillStyle = dark; c.font = '22px Arial'; c.fillText('A T E L I E R   /   S T U D I O   E D I T I O N S', 88, 100);
  c.textAlign = 'right'; c.fillText(`N° 00${variant + 1}`, 1112, 100); c.textAlign = 'left';
  c.save(); c.beginPath(); c.rect(85, 190, 1030, 1010); c.clip();
  if (variant === 0) {
    c.fillStyle = accent; c.beginPath(); c.arc(600, 695, 425, Math.PI, 0); c.lineTo(1025, 1200); c.lineTo(175, 1200); c.closePath(); c.fill();
    c.fillStyle = dark; c.beginPath(); c.arc(600, 1000, 290, Math.PI, 0); c.lineTo(890, 1200); c.lineTo(310, 1200); c.closePath(); c.fill();
    c.fillStyle = '#d3aa7c'; c.beginPath(); c.arc(600, 1040, 145, Math.PI, 0); c.lineTo(745, 1200); c.lineTo(455, 1200); c.closePath(); c.fill();
    c.strokeStyle = '#e9d8b9'; c.lineWidth = 2;
    for (let i=0; i<15; i++) { c.beginPath(); c.arc(600, 695, 425-i*11, Math.PI, Math.PI*1.57); c.stroke(); }
    c.fillStyle = '#d9a259'; c.beginPath(); c.arc(924, 335, 68, 0, Math.PI*2); c.fill();
  } else if (variant === 1) {
    c.fillStyle = accent; c.fillRect(85, 190, 1030, 1010);
    for (let i=0; i<9; i++) { c.strokeStyle = `rgba(219,225,216,${0.14+i*.045})`; c.lineWidth=36; c.beginPath(); c.ellipse(610,740,190+i*49,330+i*20,-.55,0,Math.PI*2); c.stroke(); }
    c.fillStyle=dark; c.beginPath(); c.arc(790,475,130,0,Math.PI*2); c.fill();
  } else {
    c.fillStyle='#d6cdb7'; c.fillRect(85,190,1030,1010);
    for(let i=0;i<7;i++){ c.fillStyle=i%2===0?accent:dark; c.beginPath(); c.ellipse(350+i*95,700,110,450,-.35,0,Math.PI*2);c.fill(); }
    c.fillStyle='#e9e2d4';c.beginPath();c.arc(850,370,110,0,Math.PI*2);c.fill();
  }
  c.restore();
  // A deterministic paper grain keeps the artwork tactile without external textures.
  let seed=71237;
  for(let i=0;i<100000;i++){ seed=(seed*16807)%2147483647; const x=seed%1200; seed=(seed*16807)%2147483647;const y=seed%1600;c.fillStyle=i%2?'rgba(255,255,255,.07)':'rgba(30,25,20,.04)';c.fillRect(x,y,1.3,1.3); }
  c.fillStyle=dark;c.font='108px Georgia';c.fillText(['Inner space.','Quiet tides.','Still life.'][variant],85,1360);
  c.font='23px Arial';c.fillText(['A STUDY OF FORM, LIGHT & SILENCE','IN THE RHYTHM OF THE UNSEEN','THE BEAUTY OF SIMPLY BEING'][variant],90,1430);
  c.strokeStyle=dark;c.lineWidth=1;c.beginPath();c.moveTo(90,1490);c.lineTo(1110,1490);c.stroke();
  c.font='18px Arial';c.fillText('ORIGINAL COMPOSITION',90,1530);c.textAlign='right';c.fillText('2026  /  03 : 04',1110,1530);
  return canvas.toDataURL('image/png');
}

export const artworks: Artwork[] = [
  {id:'inner',title:'内在之境',subtitle:'Inner space · 几何与静谧',year:'2026',url:makeArt(0)},
  {id:'tides',title:'无声潮汐',subtitle:'Quiet tides · 流动的秩序',year:'2026',url:makeArt(1)},
  {id:'still',title:'静物之间',subtitle:'Still life · 自然的形状',year:'2026',url:makeArt(2)},
];
