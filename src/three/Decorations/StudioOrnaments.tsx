import { memo, useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace, DoubleSide, Color } from 'three';
import { RoundedBox } from '@react-three/drei/core/RoundedBox';
import InstancedDetail, { type DetailInstance } from './InstancedDetail';
import type { StudioDesign, StudioDecoration } from '../../types/studio';
import { decorationAnchor, decorationClearanceScale, studioTierPositions } from '../../services/studioDesign';
import { useCakeDesignerStore } from '../../store/cakeDesignerStore';
import { rosePetalGeometry } from './roseGeometry';
import { ribbonGeometry } from './ribbonGeometry';
const rosePetal=rosePetalGeometry();
function PerimeterDecoration({studio,item}:{studio:StudioDesign;item:StudioDecoration}) {
 const tier=studioTierPositions(studio)[item.tier];
 const count=item.kind==='Drip'?Math.round(8*item.density):32+item.density*8;
 const upper=item.kind==='Drip';
 const ribbon=useMemo(()=>item.kind==='Ribbon'?ribbonGeometry(studio.shape,{width:tier.width,depth:tier.depth,height:tier.height,taper:tier.taper,offset:0,colour:'#ffffff'},item.scale):null,[item.kind,item.scale,studio.shape,tier.width,tier.depth,tier.height,tier.taper]);
 useEffect(()=>()=>ribbon?.dispose(),[ribbon]);
 const points=useMemo(()=>Array.from({length:count},(_,i)=>{
  const a=i/count*Math.PI*2,length=(.07+(i%4)*.045)*item.scale;
  const y=upper?tier.height-length/2:.07,factor=1-tier.taper*y/tier.height;
  let x=Math.sin(a)*(tier.width/2*factor+.028*item.scale),z=Math.cos(a)*(tier.depth/2*factor+.028*item.scale);
  if(studio.shape!=='Round'){const m=Math.max(Math.abs(Math.sin(a)),Math.abs(Math.cos(a)));x/=m;z/=m;}
  return {position:[x,y,z],rotation:upper?[-Math.atan(tier.depth/2*tier.taper/tier.height)*Math.cos(a),0,Math.atan(tier.width/2*tier.taper/tier.height)*Math.sin(a)]:[0,0,0],scale:item.kind==='Drip'?[.025*item.scale,length/2,.025*item.scale]:[.035*item.scale,.035*item.scale,.035*item.scale]} as DetailInstance;
 }),[count,studio.shape,tier.width,tier.depth,tier.height,tier.taper,item.kind,item.scale,upper]);
 if(item.kind==='Ribbon'&&ribbon)return <mesh position={[tier.x,tier.bottom,0]} name={`decoration-${item.id}`} geometry={ribbon}><meshPhysicalMaterial color={item.colour} side={DoubleSide} roughness={.4}/></mesh>;
 return <group position={[tier.x,tier.bottom,0]} name={`decoration-${item.id}`}><InstancedDetail instances={points}><sphereGeometry args={[1,10,8]}/><meshPhysicalMaterial color={item.colour} roughness={item.kind==='Drip'?.22:.35}/></InstancedDetail></group>;
}
function Lettering({text,colour,width=1.05}: {text:string;colour:string;width?:number}) {
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d')!;x.fillStyle='#fff8ed';x.fillRect(0,0,1024,256);x.fillStyle=colour;x.textAlign='center';x.textBaseline='middle';let size=100;x.font=`${size}px Georgia`;while(x.measureText(text).width>950&&size>20){size-=2;x.font=`${size}px Georgia`;}x.fillText(text,512,128);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[text,colour]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={[0,.15,.039]}><planeGeometry args={[width,.28]}/><meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false}/></mesh>;
}
function Flower({colour,rose}: {colour:string;rose:boolean}) {
 const petals=useMemo(()=>Array.from({length:18},(_,i)=>{const ring=Math.floor(i/6),angle=(i%6)*Math.PI/3+ring*.4,scale=1-ring*.24;return {position:[0,ring*.018,0],rotation:[0,angle,0],scale:[scale,scale,scale]} as DetailInstance;}),[]);
 if(rose)return <group>{[0,1,2].map(ring=><InstancedDetail key={ring} instances={petals.slice(ring*6,ring*6+6)}><primitive object={rosePetal} attach="geometry"/><meshPhysicalMaterial color={new Color(colour).lerp(new Color(ring===2?'#18291c':'#ffffff'),ring===2?.14:.12)} roughness={.6} side={DoubleSide}/></InstancedDetail>)}<mesh position={[0,.13,0]}><sphereGeometry args={[.025,8,6]}/><meshStandardMaterial color={colour}/></mesh></group>;
 return <group>{Array.from({length:rose?12:5},(_,i)=>{const a=i*Math.PI*2/(rose?7:5),r=rose?(i<7?.085:.04):.095;return <mesh key={i} position={[Math.cos(a)*r,.03+(rose&&i>=7?.035:0),Math.sin(a)*r]} rotation={[0,a,rose?.6:0]} scale={rose?[.085,.045,.13]:[.08,.028,.105]}><sphereGeometry args={[1,10,6]}/><meshPhysicalMaterial color={colour} roughness={.62} side={DoubleSide}/></mesh>;})}<mesh position={[0,.055,0]}><sphereGeometry args={[.034,10,6]}/><meshStandardMaterial color={rose?colour:'#e5bc65'}/></mesh></group>;
}
const Ornament = memo(function Ornament({studio,item,selected,readOnly}: {studio:StudioDesign;item:StudioDecoration;selected:boolean;readOnly:boolean}) {
 const tier=studioTierPositions(studio)[item.tier];
 const anchor=decorationAnchor(studio,item);
 const colour=item.colour;
 const surfaceRotation: [number,number,number]=item.region==='Top'?[0,0,0]:item.region==='Front'?[Math.PI/2,0,0]:[Math.PI/2,0,item.region==='Left'?Math.PI/2:-Math.PI/2];
 const pearlInstances=useMemo(()=>Array.from({length:item.kind==='Beaded border'?64:item.density*8},(_,i)=>{const a=i*Math.PI*2/(item.kind==='Beaded border'?64:item.density*8);const r=item.kind==='Beaded border'?Math.min(tier.width,tier.depth)/2/item.scale:.23;return {position:[Math.cos(a)*r,.06,Math.sin(a)*r],scale:[.04,.04,.04]} as DetailInstance;}),[item.kind,item.density,item.scale,tier.width,tier.depth]);
 if(['Beaded border','Ribbon','Drip'].includes(item.kind))return <group onPointerDown={e=>{if(!readOnly){e.stopPropagation();useCakeDesignerStore.getState().selectDecoration(item.id);}}}><PerimeterDecoration studio={studio} item={item}/>{selected&&<mesh position={[tier.x,tier.bottom+.01,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[tier.width/2+.05,tier.width/2+.075,48]}/><meshBasicMaterial color="#63323d" side={DoubleSide} depthTest={false}/></mesh>}</group>;
 return <group name={`decoration-${item.id}`} position={anchor} onPointerDown={e=>{if(!readOnly){e.stopPropagation();useCakeDesignerStore.getState().selectDecoration(item.id);}}}>
 <group rotation={surfaceRotation}><group rotation={[0,item.rotation*Math.PI/180,0]} scale={decorationClearanceScale(studio,item)}>
 {['Rose cluster','Blossoms'].includes(item.kind)&&Array.from({length:item.density},(_,i)=>{const a=i*2.4,r=i===0?0:.19*Math.sqrt(i);return <group key={i} position={[Math.cos(a)*r,.045,Math.sin(a)*r]}><Flower colour={colour} rose={item.kind==='Rose cluster'}/></group>;})}
 {item.kind==='Leaves'&&Array.from({length:item.density},(_,i)=><mesh key={i} position={[(i-(item.density-1)/2)*.13,.04,0]} rotation={[0,i*.45,.15]} scale={[.08,.025,.2]}><sphereGeometry args={[1,10,6]}/><meshPhysicalMaterial color={colour} roughness={.65}/></mesh>)}
 {['Pearls','Beaded border'].includes(item.kind)&&<InstancedDetail instances={pearlInstances}><sphereGeometry args={[1,10,6]}/><meshPhysicalMaterial color={colour} roughness={.25}/></InstancedDetail>}
 {item.kind==='Gold leaf'&&Array.from({length:item.density*6},(_,i)=><mesh key={i} position={[Math.sin(i*7)*.35,.015+i*.0001,Math.cos(i*3)*.3]} rotation={[-Math.PI/2,0,i]}><circleGeometry args={[.022+(i%3)*.013,5]}/><meshStandardMaterial color={colour} metalness={.85} roughness={.25} side={DoubleSide}/></mesh>)}
 {item.kind==='Drip'&&Array.from({length:item.density*3},(_,i)=><mesh key={i} position={[(i-(item.density*3-1)/2)*.095,.015,0]} rotation={[0,0,0]}><capsuleGeometry args={[.025,.1+(i%3)*.07,3,8]}/><meshPhysicalMaterial color={colour} roughness={.24}/></mesh>)}
 {item.kind==='Ribbon'&&<RoundedBox args={[.95,.06,.26]} radius={.02} position={[0,.02,0]}><meshPhysicalMaterial color={colour} roughness={.35}/></RoundedBox>}
 {item.kind==='Bow'&&<group>{[-1,1].map(sign=><mesh key={sign} position={[sign*.17,.08,0]} rotation={[Math.PI/2,0,sign*.2]} scale={[1,.7,1]}><torusGeometry args={[.15,.04,8,20]}/><meshPhysicalMaterial color={colour} roughness={.35}/></mesh>)}<mesh position={[0,.09,0]}><boxGeometry args={[.12,.1,.15]}/><meshStandardMaterial color={colour}/></mesh></group>}
 {item.kind==='Geometric ornament'&&<mesh position={[0,.22,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.28,.015,6,6]}/><meshStandardMaterial color={colour} metalness={.75} roughness={.25}/></mesh>}
 {['Plaque','Print reference','Topper'].includes(item.kind)&&<group rotation={item.region==='Top'?[0,0,0]:[-Math.PI/2,0,0]}>{item.kind==='Topper'&&<mesh position={[0,.16,0]}><cylinderGeometry args={[.012,.012,.32,8]}/><meshStandardMaterial color={colour} metalness={.6}/></mesh>}<RoundedBox args={[1.12,.36,.07]} radius={.035} position={[0,item.kind==='Topper'?.45:.15,0]}><meshStandardMaterial color={colour} roughness={.5}/></RoundedBox><group position={[0,item.kind==='Topper'?.3:0,0]}><Lettering text={item.text||(item.kind==='Print reference'?'Print reference':item.kind==='Topper'?'Celebrate':'Your message')} colour={colour}/></group></group>}
 {selected&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.43,.46,40]}/><meshBasicMaterial color="#63323d" side={DoubleSide} depthTest={false}/></mesh>}
 </group></group></group>;
});
export default function StudioOrnaments({studio,readOnly=false}:{studio:StudioDesign;readOnly?:boolean}) {
 const selected=useCakeDesignerStore(s=>s.selectedDecoration);
 const top=studioTierPositions(studio).at(-1)!;
 const wording=[studio.personalisation.name,studio.personalisation.number,studio.personalisation.message].filter(Boolean).join(' · ').slice(0,100);
 return <group>{studio.decorations.map(item=><Ornament key={item.id} studio={studio} item={item} selected={!readOnly&&selected===item.id} readOnly={readOnly}/>)}{wording&&<group position={[top.x,top.bottom+top.height,.15]}><mesh position={[0,.25,0]}><cylinderGeometry args={[.014,.014,.5,8]}/><meshStandardMaterial color="#c4a45d"/></mesh><group position={[0,.42,0]}><Lettering text={wording} colour="#63323d" width={Math.min(1.4,top.width*.85)}/></group></group>}</group>;
}
