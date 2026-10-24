import {sampleAirfoil} from './airfoil.js';

// Numerical thin-airfoil camber integral (MIT Unified Engineering, F3).
export function airfoilCharacteristics(profile) {
 const {upper,lower}=sampleAirfoil(profile,400);
 let integral=0,thickness=0,camber=0;
 for(let i=0;i<upper.length;i++) {
  thickness=Math.max(thickness,upper[i][1]-lower[i][1]);
  camber=Math.max(camber,Math.abs((upper[i][1]+lower[i][1])/2));
  if(!i)continue;
  const x0=upper[i-1][0],x1=upper[i][0];
  const z0=(upper[i-1][1]+lower[i-1][1])/2,z1=(upper[i][1]+lower[i][1])/2;
  const t0=Math.acos(1-2*x0),t1=Math.acos(1-2*x1);
  integral+=(z1-z0)/(x1-x0)*((t1-t0)-(Math.sin(t1)-Math.sin(t0)));
 }
 return {alphaZero:integral/Math.PI,thickness,camber};
}
export function solveWing(profile,span,config,{efficiency=.8,cd0=.012}={}) {
 const {speed,density,pitch,yaw,roll,length}=config,shape=airfoilCharacteristics(profile);
 const area=length*length*span,q=.5*density*speed*speed,mach=speed/343;
 const reasons=[];
 if(Math.abs(pitch)>12)reasons.push('Pitch must be between −12° and +12°; stall is not modeled.');
 if(Math.abs(yaw)>.001||Math.abs(roll)>.001)reasons.push('Set yaw and roll to 0° for wing analysis.');
 if(mach>=.3)reasons.push('Mach must be below 0.3.');
 if(shape.thickness>.181||shape.camber>.081)reasons.push('Use a thin profile: thickness ≤18%, camber ≤8%.');
 const slope=2*Math.PI/(1+2/(efficiency*span));
 const theoreticalCl=slope*(pitch*Math.PI/180-shape.alphaZero);
 const cl=q?theoreticalCl:0,cd=q?cd0+cl*cl/(Math.PI*efficiency*span):0;
 return {valid:!reasons.length,reasons,alphaZero:shape.alphaZero*180/Math.PI,aspectRatio:span,
  lift:reasons.length?NaN:q*area*cl,drag:reasons.length?NaN:q*area*cd,side:0,
  cl:reasons.length?NaN:cl,cd:reasons.length?NaN:cd,q,re:density*speed*length/1.81e-5,mach,area,surface:2*area};
}
// NACA-style thickness distribution, fitted at the editor's shared stations.
export function parameterAirfoil({thickness=.12,camber=.02,camberPosition=.4,thicknessPosition=.3}={}) {
 return [0,.08,.25,.5,.75,.92,1].map(x=>{
  if(x===0||x===1)return {x,upper:0,lower:0};
  const u=x<thicknessPosition?.3*x/thicknessPosition:.3+.7*(x-thicknessPosition)/(1-thicknessPosition);
  const t=5*thickness*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4);
  const p=camberPosition,m=camber;
  const z=x<p?m/(p*p)*(2*p*x-x*x):m/((1-p)**2)*((1-2*p)+2*p*x-x*x);
  return {x,upper:z+t,lower:z-t};
 });
}
