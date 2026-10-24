// Shared chordwise stations keep both surfaces ordered and prevent crossings.
export function defaultAirfoil(symmetric=false){
 return [
  [0,0,0],[.08,.055,-.028],[.25,.09,-.035],[.5,.075,-.024],
  [.75,.044,-.012],[.92,.016,-.004],[1,0,0],
 ].map(([x,upper,lower])=>({x,upper:symmetric?(upper-lower)/2:upper,lower:symmetric?-(upper-lower)/2:lower}));
}
export const cloneAirfoil=p=>p.map(s=>({...s}));
export function moveAirfoilPoint(profile,index,surface,x,y){
 const next=cloneAirfoil(profile);
 if(index<=0||index>=next.length-1||!['upper','lower'].includes(surface))return next;
 if(!Number.isFinite(x)||!Number.isFinite(y))return next;
 const s=next[index];s.x=Math.max(next[index-1].x+.025,Math.min(next[index+1].x-.025,x));
 s[surface]=surface==='upper'?Math.max(s.lower+.012,Math.min(.3,y)):Math.min(s.upper-.012,Math.max(-.3,y));
 return next;
}
// Shape-preserving cubic Hermite interpolation of camber and half thickness.
// Positive thickness at stations remains positive between stations.
function interpolator(xs,ys){
 const n=xs.length,h=xs.slice(1).map((x,i)=>x-xs[i]),d=h.map((v,i)=>(ys[i+1]-ys[i])/v),m=new Array(n).fill(0);
 for(let i=1;i<n-1;i++)if(d[i-1]*d[i]>0){const a=2*h[i]+h[i-1],b=h[i]+2*h[i-1];m[i]=(a+b)/(a/d[i-1]+b/d[i]);}
 function edge(h0,h1,d0,d1){let v=((2*h0+h1)*d0-h0*d1)/(h0+h1);if(v*d0<=0)v=0;else if(d0*d1<0&&Math.abs(v)>Math.abs(3*d0))v=3*d0;return v;}
 m[0]=edge(h[0],h[1],d[0],d[1]);m[n-1]=edge(h[n-2],h[n-3],d[n-2],d[n-3]);
 return x=>{let i=0;while(i<n-2&&x>xs[i+1])i++;const t=Math.max(0,Math.min(1,(x-xs[i])/h[i])),t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h[i]*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h[i]*m[i+1];};
}
export function sampleAirfoil(profile,count=100){
 const xs=profile.map(s=>s.x),camber=interpolator(xs,profile.map(s=>(s.upper+s.lower)/2)),thickness=interpolator(xs,profile.map(s=>(s.upper-s.lower)/2));
 const upper=[],lower=[];
 for(let i=0;i<=count;i++){const x=(1-Math.cos(i/count*Math.PI))/2,c=camber(x),t=Math.max(0,thickness(x));upper.push([x,c+t]);lower.push([x,c-t]);}
 return {upper,lower,outline:[...upper,...lower.slice(1,-1).reverse()]};
}
export function airfoilDat(profile){const {upper,lower}=sampleAirfoil(profile);return 'Flowlab custom airfoil (x/c y/c)\n'+[...upper].reverse().concat(lower.slice(1)).map(([x,y])=>`${x.toFixed(6)} ${y.toFixed(6)}`).join('\n')+'\n';}
