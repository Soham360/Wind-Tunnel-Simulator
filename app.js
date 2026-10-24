import {createScene} from './scene.js';
import {createAirfoilEditor} from './airfoil-editor.js';
import {LESSONS} from './lessons.js';
import {solve} from './physics.js';
const $=id=>document.getElementById(id),defaults={speed:30,density:1.225,pitch:6,yaw:0,roll:0,length:2};let config={...defaults},mesh,running=true,elapsed=0,history=[],sweep=[],rows=[],view,resetSnapshot=null,currentResult,sweepVersion=0,editingAirfoil=false;
const specs=[['speed','Airspeed',0,100,1,'m/s'],['density','Air density',.2,1.5,.005,'kg/m³'],['pitch','Pitch / angle of attack',-90,90,1,'°'],['yaw','Yaw',-180,180,1,'°'],['roll','Roll',-180,180,1,'°']];
const airflow=document.createElement('fieldset'),orientation=document.createElement('fieldset');
airflow.innerHTML='<legend>Airflow</legend>';orientation.innerHTML='<legend>Model orientation</legend>';
$('controls').append(airflow,orientation);
for(const [id,label,min,max,step,unit] of specs){
 const div=document.createElement('div');div.className='control';
 div.innerHTML=`<div class="control-heading"><label for="${id}">${label}</label><div class="precision"><input id="${id}Exact" type="number" min="${min}" max="${max}" step="${step}" value="${config[id]}" aria-label="${label} exact value"><span>${unit}</span></div></div><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${config[id]}"><small><span>${min} ${unit}</span><span>${max} ${unit}</span></small>`;
 (['speed','density'].includes(id)?airflow:orientation).append(div);
 $(id).addEventListener('input',()=>{config[id]=Number($(id).value);$(id+'Exact').value=config[id];refresh()});
 $(id+'Exact').addEventListener('input',()=>{const input=$(id+'Exact');if(!input.validity.valid||input.value==='')return;config[id]=Number(input.value);$(id).value=config[id];refresh()});
 $(id+'Exact').addEventListener('change',()=>{$(id+'Exact').value=config[id]});
}

function chart(canvas,rows,xlabel){const dpr=Math.min(devicePixelRatio,2),w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,w,h);const left=43,right=w-12,top=14,bottom=h-27;let lo=Math.min(0,...rows.flatMap(r=>[r.lift,r.drag])),hi=Math.max(1,...rows.flatMap(r=>[r.lift,r.drag]));const pad=(hi-lo)*.12;lo-=pad;hi+=pad;const xmin=rows[0]?.x??0,xmax=rows.at(-1)?.x??30;const xp=x=>left+(x-xmin)/(xmax-xmin||1)*(right-left),yp=y=>bottom-(y-lo)/(hi-lo)*(bottom-top);c.font='11px system-ui';for(let i=0;i<5;i++){const y=lo+(hi-lo)*i/4,py=yp(y);c.strokeStyle='#e7ece5';c.beginPath();c.moveTo(left,py);c.lineTo(right,py);c.stroke();c.fillStyle='#526957';c.fillText(Math.abs(y)>999?y.toExponential(1):y.toFixed(Math.abs(y)<10?1:0),1,py+3)}for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4;c.fillStyle='#829086';c.fillText(x.toFixed(0),xp(x)-5,h-10)}for(const [key,color] of [['lift','#287d73'],['drag','#a9542c']]){c.strokeStyle=color;c.lineWidth=2;c.setLineDash(key==='drag'?[6,4]:[]);c.beginPath();rows.forEach((r,i)=>{i?c.lineTo(xp(r.x),yp(r[key])):c.moveTo(xp(r.x),yp(r[key]))});c.stroke()}canvas.setAttribute('aria-label',`${xlabel}. ${rows.length} samples. Lift range ${Math.min(...rows.map(r=>r.lift),0).toFixed(2)} to ${Math.max(...rows.map(r=>r.lift),0).toFixed(2)} newtons.`)}
function result(c=config){return solve(mesh.panels,{...c,area:mesh.area})}
const fmt=(v,d=2)=>Math.abs(v)>=10000?v.toExponential(2):v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
function refresh(){if(!mesh)return;view.update(config);const r=currentResult=result();for(const k of ['drag','lift','cd'])$(k).textContent=fmt(r[k],k==='cd'?3:2);$('re').textContent=r.re.toExponential(2);$('q').textContent=fmt(r.q,1)+' Pa';$('area').textContent=fmt(r.area,3)+' m²';$('surface').textContent=fmt(r.surface,3)+' m²';$('mach').textContent=fmt(r.mach,3);const version=++sweepVersion,settings={...config},next=[];$('sweep').setAttribute('aria-busy','true');
 const batch=()=>{if(version!==sweepVersion)return;for(let j=0;j<3&&next.length<31;j++){const x=-30+next.length*2;next.push({x,...result({...settings,pitch:x})})}sweep=next;chart($('sweep'),sweep,'Pitch sweep −30° to +30°');if(next.length<31)requestAnimationFrame(batch);else $('sweep').setAttribute('aria-busy','false')};requestAnimationFrame(batch);}

function setMesh(m,name,{preserveView=false}={}){resetSnapshot=null;$('undo').hidden=true;mesh=m;$('modelName').textContent=name;$('meshInfo').textContent=`${m.triangles.toLocaleString()} triangles · ${m.size.map(v=>v.toFixed(2)).join(' × ')} m`;history=[];rows=[];elapsed=0;refresh();if(!preserveView)view.setView('perspective');chart($('history'),history,'Force history');}
try{view=createScene($('scene'),name=>{document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));$('view-status').textContent=name?(document.querySelector('[data-view="'+name+'"]').textContent+' view · camera only'):'Free orbit · camera only'});setMesh(view.preset('wing'),'Demonstrator wing')}catch(e){$('status').textContent='3D initialization failed. Enable WebGL and reload. '+e.message;throw e}
$('preset').addEventListener('change',()=>{leaveAirfoil();setMesh(view.preset($('preset').value),$('preset').selectedOptions[0].textContent);$('status').dataset.kind='status';$('status').textContent='Preset loaded. Files stay on your device.'});
$('length').addEventListener('change',()=>{const n=Number($('length').value);if(!Number.isFinite(n)||n<.01||n>50){$('length').value=config.length;$('status').textContent='Enter a model length from 0.01 to 50 metres.';return}config.length=n;setMesh(view.rescale(n),$('modelName').textContent)});
let loading=false;async function upload(file){if(!file||loading)return;loading=true;$('file').disabled=true;$('preset').disabled=true;$('status').textContent='Reading geometry…';$('status').dataset.kind='status';$('drop').setAttribute('aria-busy','true');try{const m=await view.load(file);editingAirfoil=false;setMesh(m,file.name);$('preset').value='custom';$('status').textContent='Model loaded. Check scale and axis orientation before testing.'}catch(e){$('status').dataset.kind='error';$('status').textContent='Could not load model: '+e.message}finally{$('drop').setAttribute('aria-busy','false');loading=false;$('file').disabled=false;$('preset').disabled=false;$('file').value=''}}
$('file').addEventListener('change',e=>upload(e.target.files[0]));let depth=0;const drop=$('drop');drop.addEventListener('dragenter',e=>{e.preventDefault();depth++;drop.classList.add('dragging')});drop.addEventListener('dragover',e=>e.preventDefault());drop.addEventListener('dragleave',()=>{if(--depth<=0)drop.classList.remove('dragging')});drop.addEventListener('drop',e=>{e.preventDefault();depth=0;drop.classList.remove('dragging');upload(e.dataTransfer.files[0])});window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
$('pause').onclick=()=>{running=!running;view.setRunning(running);$('pause').textContent=running?'Pause flow':'Resume flow';$('state').textContent=running?'● FLOW RUNNING':'Ⅱ FLOW PAUSED'};
$('reset').onclick=()=>{const snapshot={config:{...config},history:[...history],rows:[...rows],elapsed};config={...defaults};syncInputs();setMesh(view.rescale(config.length),$('modelName').textContent);resetSnapshot=snapshot;$('undo').hidden=false;$('status').dataset.kind='status';$('status').textContent='Run reset. Undo reset restores your conditions and recorded data.'};
function syncInputs(){for(const [id] of specs){$(id).value=config[id];$(id+'Exact').value=config[id]}$('length').value=config.length;}
$('undo').onclick=()=>{if(!resetSnapshot)return;const saved=resetSnapshot;config={...saved.config};syncInputs();setMesh(view.rescale(config.length),$('modelName').textContent);history=saved.history;rows=saved.rows;elapsed=saved.elapsed;chart($('history'),history,'Force history');$('status').textContent='Reset undone. Conditions and recorded data restored.';$('reset').focus()};

$('camera').onclick=()=>view.resetCamera();for(const [id,method]of [['flow','setFlow'],['pressure','setPressure']])$(id).onclick=()=>{const value=$(id).getAttribute('aria-pressed')!=='true';$(id).setAttribute('aria-pressed',value);view[method](value)};
setInterval(()=>{if(running){elapsed+=.2;const r=currentResult;const row={x:elapsed,...r,...config};history.push(row);if(history.length>151)history.shift();rows.push(row);if(rows.length>18000)rows.shift();chart($('history'),history,'Force history, time in seconds')}},200);

$('export').onclick=()=>{const values=rows.length?rows:[{x:elapsed,...result(),...config}],header=['time_s','speed_m_s','density_kg_m3','pitch_deg','yaw_deg','roll_deg','length_m','reference_area_m2','drag_N','lift_N','side_N','Cd','Cl','Re','Mach'],body=values.map(r=>[r.x,r.speed,r.density,r.pitch,r.yaw,r.roll,r.length,r.area,r.drag,r.lift,r.side,r.cd,r.cl,r.re,r.mach].join(','));const blob=new Blob([header.join(',')+'\n'+body.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='flowlab-run.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent=`Exported ${values.length} samples (up to one hour retained).`};

new ResizeObserver(()=>{chart($('history'),history,'Force history');chart($('sweep'),sweep,'Pitch sweep')}).observe($('history').parentElement);



for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>view.setView(button.dataset.view));
for(const button of document.querySelectorAll('[data-lesson]'))button.addEventListener('click',()=>{
 const lesson=LESSONS[button.dataset.lesson];if(!lesson)return;
 leaveAirfoil();config={...lesson.config};syncInputs();view.update(config);setMesh(view.preset(lesson.shape),lesson.label);$('preset').value=lesson.shape;view.setView(lesson.view);
 if(!running)$('pause').click();
 $('status').dataset.kind='status';$('status').textContent=lesson.message;$('lesson-status').textContent=lesson.message;
 $('workspace').scrollIntoView({behavior:'instant',block:'start'});document.querySelector('[data-view="'+lesson.view+'"]').focus({preventScroll:true});
});

createAirfoilEditor($('airfoil-customizer'),(profile,span)=>{const keep=editingAirfoil;setMesh(view.airfoil(profile,span),'Custom airfoil',{preserveView:keep});if(!keep)view.setView('side');editingAirfoil=true;$('preset').value='airfoil';$('status').dataset.kind='status';$('status').textContent='Custom airfoil active. Shape changes update the model and start a new run.';});

function leaveAirfoil(){editingAirfoil=false;$('airfoil-message').textContent='Your editor profile is stored. Click Test this airfoil or move a point to reactivate it.';}
