import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { StudioDesign } from '../../types/studio';
// Deterministic canvas surfaces: no remote images or per-frame allocations.
export function studioTexture(finish: StudioDesign['finish'], colour: string, accent: string, bump=false) {
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Surface texture unavailable');
 ctx.fillStyle=bump?'#808080':colour;ctx.fillRect(0,0,512,512);
 let seed=27;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(finish==='Ombré'){const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,colour);g.addColorStop(1,accent);ctx.fillStyle=g;ctx.fillRect(0,0,512,512);}
 if(['Marble','Watercolour','Metallic accents'].includes(finish))for(let i=0;i<(finish==='Marble'?35:100);i++){ctx.strokeStyle=accent;ctx.globalAlpha=finish==='Metallic accents'?.9:.15+random()*.4;ctx.lineWidth=finish==='Marble'?1+random()*7:8+random()*35;ctx.beginPath();const x=random()*512,y=random()*512;ctx.moveTo(x,y);ctx.bezierCurveTo(x+80,y-40,x-40,y+130,x+30,y+220);ctx.stroke();}
 ctx.globalAlpha=1;
 if(['Textured buttercream','Rustic frosting'].includes(finish))for(let i=0;i<2500;i++){ctx.fillStyle=bump?(random()>.5?'#aaaaaa':'#555555'):accent;ctx.globalAlpha=bump?.5:.08;ctx.fillRect(random()*512,random()*512,finish==='Rustic frosting'?20:3,2+random()*5);}
 ctx.globalAlpha=1;
 if(['Vertical ridges','Horizontal grooves','Pleated','Ruffled'].includes(finish)){for(let i=0;i<512;i+=finish==='Pleated'?18:24){ctx.strokeStyle=bump?'#dddddd':accent;ctx.lineWidth=bump?6:2;ctx.globalAlpha=bump?1:.2;ctx.beginPath(); if(finish==='Horizontal grooves'||finish==='Ruffled'){ctx.moveTo(0,i);for(let x=0;x<=512;x+=8)ctx.lineTo(x,i+(finish==='Ruffled'?Math.sin(x*.09)*8:0));}else{ctx.moveTo(i,0);ctx.lineTo(i,512);}ctx.stroke();}}
 if(['Quilted fondant','Embossed'].includes(finish)){ctx.strokeStyle=bump?'#333333':accent;ctx.lineWidth=bump?5:2;ctx.globalAlpha=bump?1:.25;for(let i=-512;i<1024;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+512,512);ctx.moveTo(i,0);ctx.lineTo(i-512,512);ctx.stroke();}}
 ctx.globalAlpha=1;
 const texture=new CanvasTexture(canvas);if(!bump)texture.colorSpace=SRGBColorSpace;texture.wrapS=texture.wrapT=RepeatWrapping;return texture;
}
