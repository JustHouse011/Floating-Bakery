import { BufferGeometry, Float32BufferAttribute } from 'three';
// A curved petal sheet, shared by every rose instance. Local Y grows away from attachment.
export function rosePetalGeometry() {
 const vertices:number[]=[],indices:number[]=[],rows=5,columns=8;
 for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
  const v=row/rows,u=column/columns,angle=(u-.5)*Math.PI*.9;
  const radius=.03+v*.15;
  vertices.push(Math.sin(angle)*radius,.004+v*.16+Math.sin(u*Math.PI)*v*.025,Math.cos(angle)*radius);
 }
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){const a=row*(columns+1)+column,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
