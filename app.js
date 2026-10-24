import {renderChart} from './instrument-chart.js';
import {createLab} from './lab.js';
import {solveWing} from './wing-analysis.js';
import {setupWorkspace} from './workspace.js?v=20261023';
import {createScene} from './scene.js?v=features1';
import {createAirfoilEditor} from './airfoil-editor.js?v=features1';
import {LESSONS} from './lessons.js';
import {solve} from './physics.js';
setupWorkspace();
const $=id=>document.getElementById(id),defaults={speed:30,density:1.225,pitch:6,yaw:0,roll:0,length:2};let config={...defaults},mesh,running=true,elapsed=0,history=[],sweep=[],rows=[],view,resetSnapshot=null,currentResult,sweepVersion=0,editingAirfoil=false;
let lab=null,editor=null;let analysis={mode:'surface',efficiency:.8,cd0:.012};
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

function chart(canvas,data,xlabel){return renderChart(canvas,data,{label:xlabel,overlays:lab?.overlays(canvas.id)||[],onPick:canvas.id==='sweep'?point=>{config.pitch=point.x;syncInputs();refresh();lab?.changed();}:undefined});}
function result(c=config){if(analysis.mode==='wing'&&editingAirfoil&&editor){const design=editor.getDesign();const r=solveWing(design.profile,design.span,c,analysis);r.surface=mesh.panels.reduce((s,p)=>s+p.area,0);return r;}return {...solve(mesh.panels,{...c,area:mesh.area}),valid:true,reasons:[]};}
const fmt=(v,d=2)=>!Number.isFinite(v)?'—':Math.abs(v)>=10000?v.toExponential(2):v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
function refresh(){if(!mesh)return;view.update(config);const r=currentResult=result();lab?.resultChanged(r);for(const k of ['drag','lift','cd'])$(k).textContent=fmt(r[k],k==='cd'?3:2);$('re').textContent=r.re.toExponential(2);$('q').textContent=fmt(r.q,1)+' Pa';$('area').textContent=fmt(r.area,3)+' m²';$('surface').textContent=fmt(r.surface,3)+' m²';$('mach').textContent=fmt(r.mach,3);const version=++sweepVersion,settings={...config},next=[];$('sweep').setAttribute('aria-busy','true');
 const batch=()=>{if(version!==sweepVersion)return;for(let j=0;j<3&&next.length<31;j++){const x=-30+next.length*2;next.push({x,...result({...settings,pitch:x})})}sweep=next;chart($('sweep'),sweep,'Pitch sweep −30° to +30°');if(next.length<31)requestAnimationFrame(batch);else $('sweep').setAttribute('aria-busy','false')};requestAnimationFrame(batch);lab?.changed();}

function setMesh(m,name,{preserveView=false}={}){resetSnapshot=null;$('undo').hidden=true;mesh=m;$('modelName').textContent=name;$('meshInfo').textContent=`${m.triangles.toLocaleString()} triangles · ${m.size.map(v=>v.toFixed(2)).join(' × ')} m`;history=[];rows=[];elapsed=0;refresh();if(!preserveView)view.setView('perspective');chart($('history'),history,'Force history');lab?.sync();lab?.modelChanged();}
try{view=createScene($('scene'),name=>{document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));$('view-status').textContent=name?(document.querySelector('[data-view="'+name+'"]').textContent+' view · camera only'):'Free orbit · camera only'});setMesh(view.preset('wing'),'Demonstrator wing')}catch(e){$('status').textContent='3D initialization failed. Enable WebGL and reload. '+e.message;throw e}
$('preset').addEventListener('change',()=>{leaveAirfoil();setMesh(view.preset($('preset').value),$('preset').selectedOptions[0].textContent);$('status').dataset.kind='status';$('status').textContent='Preset loaded. Files stay on your device.'});
$('length').addEventListener('change',()=>{const n=Number($('length').value);if(!Number.isFinite(n)||n<.01||n>50){$('length').value=config.length;$('status').textContent='Enter a model length from 0.01 to 50 metres.';return}config.length=n;setMesh(view.rescale(n),$('modelName').textContent)});
let loading=false;async function upload(file){if(!file||loading)return;loading=true;$('file').disabled=true;$('preset').disabled=true;$('status').textContent='Reading geometry…';$('status').dataset.kind='status';$('drop').setAttribute('aria-busy','true');try{const m=await view.load(file);leaveAirfoil();setMesh(m,file.name);$('preset').value='custom';$('status').textContent='Model loaded. Checking geometry…';lab?.modelLoaded()}catch(e){$('status').dataset.kind='error';$('status').textContent='Could not load model: '+e.message}finally{$('drop').setAttribute('aria-busy','false');loading=false;$('file').disabled=false;$('preset').disabled=false;$('file').value=''}}
$('file').addEventListener('change',e=>upload(e.target.files[0]));let depth=0;const drop=$('drop');drop.addEventListener('dragenter',e=>{e.preventDefault();depth++;drop.classList.add('dragging')});drop.addEventListener('dragover',e=>e.preventDefault());drop.addEventListener('dragleave',()=>{if(--depth<=0)drop.classList.remove('dragging')});drop.addEventListener('drop',e=>{e.preventDefault();depth=0;drop.classList.remove('dragging');upload(e.dataTransfer.files[0])});window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
$('pause').onclick=()=>{running=!running;view.setRunning(running);$('pause').textContent=running?'Pause flow':'Resume flow';$('state').textContent=running?'● FLOW RUNNING':'Ⅱ FLOW PAUSED'};
$('reset').onclick=()=>{const snapshot={config:{...config},history:[...history],rows:[...rows],elapsed};config={...defaults};syncInputs();setMesh(view.rescale(config.length),$('modelName').textContent);resetSnapshot=snapshot;$('undo').hidden=false;$('status').dataset.kind='status';$('status').textContent='Run reset. Undo reset restores your conditions and recorded data.'};
function syncInputs(){for(const [id] of specs){$(id).value=config[id];$(id+'Exact').value=config[id]}$('length').value=config.length;}
$('undo').onclick=()=>{if(!resetSnapshot)return;const saved=resetSnapshot;config={...saved.config};syncInputs();setMesh(view.rescale(config.length),$('modelName').textContent);history=saved.history;rows=saved.rows;elapsed=saved.elapsed;chart($('history'),history,'Force history');$('status').textContent='Reset undone. Conditions and recorded data restored.';$('reset').focus()};

$('camera').onclick=()=>view.resetCamera();for(const [id,method]of [['flow','setFlow'],['pressure','setPressure']])$(id).onclick=()=>{const value=$(id).getAttribute('aria-pressed')!=='true';$(id).setAttribute('aria-pressed',value);view[method](value)};
setInterval(()=>{if(running){elapsed+=.2;const r=currentResult;const row={x:elapsed,...r,...config,analysisMethod:analysis.mode};history.push(row);if(history.length>151)history.shift();rows.push(row);if(rows.length>18000)rows.shift();chart($('history'),history,'Force history, time in seconds')}},200);

$('export').onclick=()=>{const values=rows.length?rows:[{x:elapsed,...result(),...config}],header=['analysis_method','valid','time_s','speed_m_s','density_kg_m3','pitch_deg','yaw_deg','roll_deg','length_m','reference_area_m2','drag_N','lift_N','side_N','Cd','Cl','Re','Mach'],body=values.map(r=>[r.analysisMethod||analysis.mode,r.valid!==false,r.x,r.speed,r.density,r.pitch,r.yaw,r.roll,r.length,r.area,r.drag,r.lift,r.side,r.cd,r.cl,r.re,r.mach].map(v=>typeof v==='number'&&!Number.isFinite(v)?'':v).join(','));const blob=new Blob([header.join(',')+'\n'+body.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='flowlab-run.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent=`Exported ${values.length} samples (up to one hour retained).`};

new ResizeObserver(()=>{chart($('history'),history,'Force history');chart($('sweep'),sweep,'Pitch sweep')}).observe($('history').parentElement);



for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>view.setView(button.dataset.view));
for(const button of document.querySelectorAll('[data-lesson]'))button.addEventListener('click',()=>{
 const lesson=LESSONS[button.dataset.lesson];if(!lesson)return;
 leaveAirfoil();config={...lesson.config};syncInputs();view.update(config);setMesh(view.preset(lesson.shape),lesson.label);$('preset').value=lesson.shape;view.setView(lesson.view);
 if(!running)$('pause').click();
 $('status').dataset.kind='status';$('status').textContent=lesson.message;$('lesson-status').textContent=lesson.message;
 $('workspace').scrollTop=0;document.querySelector('[data-view="'+lesson.view+'"]').focus({preventScroll:true});
});

editor=createAirfoilEditor($('airfoil-customizer'),(profile,span)=>{const keep=editingAirfoil;editingAirfoil=true;setMesh(view.airfoil(profile,span),'Custom airfoil',{preserveView:keep});if(!keep)view.setView('side');editingAirfoil=true;$('preset').value='airfoil';$('status').dataset.kind='status';$('status').textContent='Custom airfoil active. Shape changes update the model and start a new run.';});

function leaveAirfoil(){editingAirfoil=false;analysis.mode='surface';lab?.sync();$('airfoil-message').textContent='Your editor profile is stored. Click Test this airfoil or move a point to reactivate it.';}

lab=createLab({
 getState:()=>({config:{...config},design:editor.getDesign(),analysis:{...analysis},editingAirfoil,model:{kind:editingAirfoil?'airfoil':$('preset').value,name:$('modelName').textContent},mesh,history:[...history],recorded:rows.slice(-2000),sweep:[...sweep],elapsed,result:{...currentResult}}),
 geometry:()=>view.getGeometry(),
 applyAnalysis:value=>{analysis={...value};history=[];rows=[];elapsed=0;refresh();chart($('history'),history,'Force history');},
 setDesign:design=>editor.setDesign(design),
 setDisplay:value=>{view.setFlow(value.flow);view.setPressure(value.pressure);view.setStreamDensity(value.density);view.setArrows(value.arrows);view.setAxes(value.axes);for(const key of ['flow','pressure'])$(key).setAttribute('aria-pressed',String(value[key]));},
 transform:operation=>{leaveAirfoil();$('preset').value='custom';setMesh(view.reorient(operation),$('modelName').textContent.replace(/ · reoriented$/,'').slice(0,230)+' · reoriented');},
 redraw:()=>{chart($('history'),history,'Force history');chart($('sweep'),sweep,'Pitch sweep');},
 pickPitch:x=>{config.pitch=x;syncInputs();refresh();},
 restore:state=>{config={...state.config};syncInputs();analysis={...state.analysis};editor.setDesign(state.design,{notify:false,record:false});editingAirfoil=state.model.kind==='airfoil';view.update(config);const next=state.model.kind==='custom'?view.replaceGeometry(state.model.positions):editingAirfoil?view.airfoil(state.design.profile,state.design.span):view.preset(state.model.kind);$('preset').value=state.model.kind;setMesh(next,state.model.name);history=state.history||[];rows=state.recorded||[];elapsed=state.elapsed||0;chart($('history'),history,'Force history');},
});
