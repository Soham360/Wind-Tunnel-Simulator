// Independent surface-element approximation; see README for validity limits.
export function rotation(p,pitch=0,yaw=0,roll=0){
 const [a,b,c]=[-pitch,yaw,roll].map(v=>v*Math.PI/180);let [x,y,z]=p;
 [y,z]=[y*Math.cos(c)-z*Math.sin(c),y*Math.sin(c)+z*Math.cos(c)];
 [x,z]=[x*Math.cos(b)+z*Math.sin(b),-x*Math.sin(b)+z*Math.cos(b)];
 return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z];
}
export function solve(panels,{speed=30,density=1.225,pitch=0,yaw=0,roll=0,length=2,area=1}={}){
 const q=.5*density*speed*speed,force=[0,0,0];let surface=0;
 for(const p of panels){const n=rotation(p.normal,pitch,yaw,roll),cp=2*Math.max(0,-n[0])**2;surface+=p.area;
 // Friction follows the freestream projected onto the local tangent plane.
 for(let j=0;j<3;j++)force[j]+=q*p.area*(-cp*n[j]+.006*((j===0?1:0)-n[0]*n[j]));}
 return {drag:force[0],lift:force[1],side:force[2],cd:q?force[0]/(q*area):0,cl:q?force[1]/(q*area):0,q,re:density*speed*length/1.81e-5,mach:speed/343,area,surface};
}

