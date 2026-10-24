import {createChartProbe} from './chart-probe.js?v=features1';
const charts=new WeakMap();
export function visibleSamples(rows,range){return rows.filter(r=>(!range||(r.x>=range[0]&&r.x<=range[1]))&&Number.isFinite(r.lift)&&Number.isFinite(r.drag));}
export function renderChart(canvas,rows,options={}){
 let state=charts.get(canvas);
 if(!state){state={rows,options};state.probeOptions={};state.probe=createChartProbe(canvas,()=>renderChart(canvas,state.rows,state.options),state.probeOptions);charts.set(canvas,state);}
 state.rows=rows;state.options=options;state.probeOptions.onPick=options.onPick;
 const w=canvas.clientWidth,h=canvas.clientHeight;if(w<60||h<45)return state.probe;
 const dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;
 const c=canvas.getContext('2d');c.scale(dpr,dpr);
 const left=43,right=w-12,top=14,bottom=h-27,range=options.range;
 const active=visibleSamples(rows,range),overlays=(options.overlays||[]).filter(o=>o.enabled!==false);
 const all=[...active,...overlays.flatMap(o=>visibleSamples(o.rows,range))];
 let lo=0,hi=1;for(const r of all){lo=Math.min(lo,r.lift,r.drag);hi=Math.max(hi,r.lift,r.drag);}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
 const xmin=range?.[0]??rows[0]?.x??0,xmax=range?.[1]??rows.at(-1)?.x??30;
 const xp=x=>left+(x-xmin)/(xmax-xmin||1)*(right-left),yp=y=>bottom-(y-lo)/(hi-lo)*(bottom-top);
 c.font='11px system-ui';const ticks=Math.max(1,Math.min(4,Math.floor((bottom-top)/20)));
 for(let i=0;i<=ticks;i++){const y=lo+(hi-lo)*i/ticks,py=yp(y);c.strokeStyle='#e7ece5';c.beginPath();c.moveTo(left,py);c.lineTo(right,py);c.stroke();c.fillStyle='#526957';c.fillText(Math.abs(y)>999?y.toExponential(1):y.toFixed(Math.abs(y)<10?1:0),1,py+3);}
 for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4;c.fillStyle='#607367';c.fillText(x.toFixed(xmax-xmin<5?1:0),xp(x)-5,h-10);}
 c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();
 const series=[...overlays.map(o=>({...o,alpha:.6})),{rows,color:null,alpha:1}];
 for(const line of series)for(const [key,color]of [['lift','#287d73'],['drag','#a9542c']]){
  c.strokeStyle=line.color||color;c.globalAlpha=line.alpha;c.lineWidth=line.color?1.5:2;c.setLineDash(key==='drag'?[6,4]:[]);c.beginPath();let started=false;
  for(const r of line.rows){if(!Number.isFinite(r[key])){started=false;continue;}if(!started)c.moveTo(xp(r.x),yp(r[key]));else c.lineTo(xp(r.x),yp(r[key]));started=true;}c.stroke();
 }
 c.restore();if(!active.length){c.fillStyle='#607367';c.font='10px system-ui';c.fillText('No supported current samples',left+4,top+14);}state.probe(c,active,{left,right,top,bottom,xp,yp});
 canvas.setAttribute('aria-label',`${options.label||'Force graph'}. ${active.length} valid samples. Lift and drag in newtons. ${overlays.length} saved comparisons.`);
 return state.probe;
}
