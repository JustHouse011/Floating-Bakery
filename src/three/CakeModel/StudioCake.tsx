import { memo, useMemo, useEffect } from 'react';
import { RoundedBox } from '@react-three/drei/core/RoundedBox';
import type { StudioDesign } from '../../types/studio';
import { studioTierPositions } from '../../services/studioDesign';
import { studioTexture } from '../Materials/studioTexture';
import StudioOrnaments from '../Decorations/StudioOrnaments';
import { roundedCakeProfile } from '../cakeGeometry';
import { LatheGeometry } from 'three';
const Tier=memo(function Tier({tier,studio}:{tier:ReturnType<typeof studioTierPositions>[number];studio:StudioDesign}) {
 const texture=useMemo(()=>studioTexture(studio.finish,tier.colour,studio.secondaryColour),[studio.finish,tier.colour,studio.secondaryColour]);
 const bump=useMemo(()=>studioTexture(studio.finish,'#808080','#cccccc',true),[studio.finish]);
 const profile=useMemo(()=>roundedCakeProfile(tier.width/2,tier.height).map(p=>{p.x*=1-tier.taper*p.y/tier.height;return p;}),[tier.width,tier.height,tier.taper]);
 const roundGeometry=useMemo(()=>{const geometry=new LatheGeometry(profile,64);const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setY(i,position.getY(i)/tier.height);uv.needsUpdate=true;return geometry;},[profile,tier.height]);
 useEffect(()=>()=>roundGeometry.dispose(),[roundGeometry]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useEffect(()=>()=>bump.dispose(),[bump]);
 const material=<meshPhysicalMaterial map={texture} bumpMap={bump} bumpScale={['Smooth fondant','Smooth buttercream','Ombré','Marble'].includes(studio.finish)?.001:.035} roughness={studio.finish==='Smooth fondant'?.42:.7} metalness={studio.finish==='Metallic accents'?.35:0} clearcoat={studio.finish==='Smooth fondant'?.15:0}/>;
 return <group position={[tier.x,tier.bottom+tier.height/2,0]} name={`studio-tier-${tier.index}`}>{studio.shape==='Round'?<mesh position={[0,-tier.height/2,0]} geometry={roundGeometry}>{material}</mesh>:<group scale={[1,1,studio.shape==='Rectangular'?tier.depth/tier.width:1]}>{tier.taper>0?<mesh rotation={[0,Math.PI/4,0]}><cylinderGeometry args={[tier.width/Math.SQRT2*(1-tier.taper),tier.width/Math.SQRT2,tier.height,4,1]}/>{material}</mesh>:<RoundedBox args={[tier.width,tier.height,tier.width]} radius={.045} smoothness={3}>{material}</RoundedBox>}</group>}</group>;
});
export default memo(function StudioCake({studio,readOnly=false}:{studio:StudioDesign;readOnly?:boolean}) {
 const tiers=studioTierPositions(studio),base=tiers[0];
 const radius=Math.max(...tiers.map(t=>Math.abs(t.x)+Math.hypot(t.width,t.depth)/2))+.15;
 return <group name="advanced-studio-cake"><mesh position={[0,.4,0]}><cylinderGeometry args={[.4,.7,.8,32]}/><meshStandardMaterial color="#eee7e5" roughness={.5}/></mesh>{studio.board.visible&&<mesh position={[0,.785,0]}><cylinderGeometry args={[studio.shape==='Round'?base.width/2+.2:radius,studio.shape==='Round'?base.width/2+.2:radius,.07,64]}/><meshStandardMaterial color={studio.board.colour} metalness={studio.board.finish==='Matte'?0:.85} roughness={studio.board.finish==='Matte'?.6:.25}/></mesh>}{tiers.map(t=><Tier key={t.index} tier={t} studio={studio}/>)}<StudioOrnaments studio={studio} readOnly={readOnly}/></group>;
});
