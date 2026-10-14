import {BufferGeometry,Float32BufferAttribute} from 'three';
import type {StudioDesign,StudioTier} from '../../types/studio';
export function ribbonGeometry(shape:StudioDesign['shape'],tier:StudioTier,scale:number) {
 const count=shape==='Round'?64:4,vertices:number[]=[],indices:number[]=[];
 for(const y of [.14-.1*scale,.14+.1*scale]) {
  const factor=1-tier.taper*y/tier.height;
  const half=tier.width/2*factor+.012,depth=tier.depth/2*factor+.012;
  for(let i=0;i<=count;i++){const angle=i/count*Math.PI*2+Math.PI/4;const x=Math.sin(angle),z=Math.cos(angle),m=shape==='Round'?1:Math.max(Math.abs(x),Math.abs(z));vertices.push(x/m*half,y,z/m*depth);}
 }
 for(let i=0;i<count;i++){const a=i,b=i+count+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const result=new BufferGeometry();result.setAttribute('position',new Float32BufferAttribute(vertices,3));result.setIndex(indices);result.computeVertexNormals();return result;
}
