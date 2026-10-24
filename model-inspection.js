export function inspectGeometry(positions) {
 const edges=new Map();let volume=0,degenerate=0;
 const key=v=>v.map(n=>Math.round(n*1e6)).join(',');
 for(let i=0;i<positions.length;i+=9){
  const a=positions.slice(i,i+3),b=positions.slice(i+3,i+6),c=positions.slice(i+6,i+9);
  const cross=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];
  if(Math.hypot(...cross)<1e-12)degenerate++;
  volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  for(const [v,w] of [[a,b],[b,c],[c,a]]) {const ka=key(v),kb=key(w),forward=ka<kb,k=forward?ka+'|'+kb:kb+'|'+ka;
   const edge=edges.get(k)||{count:0,balance:0};edge.count++;edge.balance+=forward?1:-1;edges.set(k,edge);}
 }
 let open=0,nonmanifold=0,inconsistent=0;
 for(const e of edges.values()){if(e.count===1)open++;if(e.count>2)nonmanifold++;if(e.count===2&&e.balance!==0)inconsistent++;}
 return {triangles:positions.length/9,open,nonmanifold,inconsistent,degenerate,volume,inward:!open&&!nonmanifold&&volume<0};
}
export function reorientGeometry(positions,operation){
 const out=Array.from(positions),swap=operation==='swapXY'?[0,1]:operation==='swapXZ'?[0,2]:operation==='swapYZ'?[1,2]:null;
 for(let i=0;i<out.length;i+=3){
  if(swap)[out[i+swap[0]],out[i+swap[1]]]=[out[i+swap[1]],out[i+swap[0]]];
  if(operation==='turn') {out[i]*=-1;out[i+2]*=-1;}
 }
 if(swap||operation==='normals')for(let i=0;i<out.length;i+=9)for(let j=0;j<3;j++)[out[i+3+j],out[i+6+j]]=[out[i+6+j],out[i+3+j]];
 return out;
}
