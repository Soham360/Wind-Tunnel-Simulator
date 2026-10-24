import {defaultAirfoil,cloneAirfoil,moveAirfoilPoint,sampleAirfoil,airfoilDat} from './airfoil.js';

export function createAirfoilEditor(root,onChange){
 let profile=defaultAirfoil(),selected={index:2,surface:'upper'},undo=[],drag=null,span=1.5,pending=false;
 const $=id=>root.querySelector('#'+id),svg=$('airfoil-svg'),NS='http://www.w3.org/2000/svg';
 const px=x=>80+x*640,py=y=>250-y*640;
 const saved=()=>({profile:cloneAirfoil(profile),span});
 const remember=()=>{undo.push(saved());if(undo.length>40)undo.shift();};
 function emit(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;onChange(cloneAirfoil(profile),span);});}
 const handles=[];
 for(const surface of ['upper','lower'])for(let i=1;i<profile.length-1;i++){
  const g=document.createElementNS(NS,'g'),hit=document.createElementNS(NS,'circle'),dot=document.createElementNS(NS,'circle');
  g.setAttribute('tabindex','0');g.setAttribute('role','button');g.dataset.point=surface+'-'+i;
  hit.setAttribute('r','18');hit.setAttribute('class','point-hit');dot.setAttribute('r','7');dot.setAttribute('class','point-dot');g.append(hit,dot);svg.append(g);handles.push({g,hit,dot,i,surface});
  g.addEventListener('focus',()=>{selected={index:i,surface};render()});
  g.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();g.focus();selected={index:i,surface};const pos=coordinates(e);drag={id:e.pointerId,g,start:saved(),offsetX:profile[i].x-pos.x,offsetY:profile[i][surface]-pos.y,moved:false};g.setPointerCapture(e.pointerId);render()});
  g.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=coordinates(e);if(!drag.moved){remember();drag.moved=true;}profile=moveAirfoilPoint(profile,i,surface,p.x+drag.offsetX,p.y+drag.offsetY);render();emit()});
  g.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;drag=null;if(g.hasPointerCapture(e.pointerId))g.releasePointerCapture(e.pointerId);$('airfoil-message').textContent='Shape updated in the tunnel. Undo shape restores your last edit.'});
  g.addEventListener('pointercancel',()=>{if(!drag)return;profile=drag.start.profile;span=drag.start.span;if(drag.moved)undo.pop();drag=null;render();emit()});
  g.addEventListener('keydown',e=>{const steps={ArrowLeft:[-.005,0],ArrowRight:[.005,0],ArrowUp:[0,.005],ArrowDown:[0,-.005]};if(!steps[e.key])return;e.preventDefault();remember();const [dx,dy]=steps[e.key],mult=e.shiftKey?5:1;profile=moveAirfoilPoint(profile,i,surface,profile[i].x+dx*mult,profile[i][surface]+dy*mult);render();emit();});
 }
 function coordinates(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return {x:(q.x-80)/640,y:(250-q.y)/640};}
 function render(force=false){
  const {outline}=sampleAirfoil(profile);$('airfoil-outline').setAttribute('d',outline.map(([x,y],i)=>(i?'L':'M')+px(x).toFixed(2)+' '+py(y).toFixed(2)).join(' ')+' Z');
  for(const h of handles){const s=profile[h.i];h.hit.setAttribute('r',Math.min(18,(s.upper-s.lower)*640*.46));for(const c of [h.hit,h.dot]){c.setAttribute('cx',px(s.x));c.setAttribute('cy',py(s[h.surface]));}h.g.setAttribute('aria-label',`${h.surface} point ${h.i}, x ${s.x.toFixed(3)}, y ${s[h.surface].toFixed(3)}. Arrow keys move; Shift makes larger steps.`);h.g.classList.toggle('selected',selected.index===h.i&&selected.surface===h.surface);}
  const s=profile[selected.index];$('airfoil-point').value=selected.surface+'-'+selected.index;
  if(force||document.activeElement!==$('airfoil-x'))$('airfoil-x').value=s.x.toFixed(3);
  if(force||document.activeElement!==$('airfoil-y'))$('airfoil-y').value=s[selected.surface].toFixed(3);
  if(force||document.activeElement!==$('airfoil-span'))$('airfoil-span').value=span;$('airfoil-undo').disabled=undo.length===0;
  const samples=sampleAirfoil(profile);const maxThickness=Math.max(...samples.upper.map((v,i)=>v[1]-samples.lower[i][1]));$('airfoil-summary').textContent=`Maximum thickness ${(maxThickness*100).toFixed(1)}% of chord · span/chord ${span.toFixed(2)} · 10 movable points`;
 }
 $('airfoil-point').addEventListener('change',e=>{const [surface,index]=e.target.value.split('-');selected={surface,index:Number(index)};render()});
 for(const axis of ['x','y']){const input=$('airfoil-'+axis);let started=false;
 input.addEventListener('focus',()=>{started=false;});
 input.addEventListener('input',()=>{if($('airfoil-x').value===''||$('airfoil-y').value==='')return;const x=Number($('airfoil-x').value),y=Number($('airfoil-y').value);if(!Number.isFinite(x)||!Number.isFinite(y))return;if(!started){remember();started=true;}profile=moveAirfoilPoint(profile,selected.index,selected.surface,x,y);render();emit();});
 input.addEventListener('change',()=>render(true));input.addEventListener('blur',()=>render(true));
 }
 let spanStarted=false;$('airfoil-span').addEventListener('focus',()=>{spanStarted=false;});
 $('airfoil-span').addEventListener('input',e=>{const v=Number(e.target.value);if(e.target.value===''||v<.5||v>4||!Number.isFinite(v))return;if(!spanStarted){remember();spanStarted=true;}span=v;render();emit();});
 $('airfoil-span').addEventListener('change',()=>render(true));$('airfoil-span').addEventListener('blur',()=>render(true));
 $('airfoil-use').onclick=()=>{emit();$('airfoil-message').textContent='Custom airfoil active. Drag a point to update the test model.'};
 $('airfoil-reset').onclick=()=>{remember();profile=defaultAirfoil();span=1.5;render();emit();};
 $('airfoil-symmetric').onclick=()=>{remember();profile=defaultAirfoil(true);render();emit();};
 $('airfoil-undo').onclick=()=>{if(!undo.length)return;const state=undo.pop();profile=state.profile;span=state.span;render();emit();};
 $('airfoil-download').onclick=()=>{const url=URL.createObjectURL(new Blob([airfoilDat(profile)],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='flowlab-airfoil.dat';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 render();return {getProfile:()=>cloneAirfoil(profile)};
}
