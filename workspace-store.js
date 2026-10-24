const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validateWorkspace(value){
 if(!value||value.version!==1)throw Error('This is not a supported Flowlab experiment file.');
 const v=structuredClone(value),bounds={speed:[0,100],density:[.2,1.5],pitch:[-90,90],yaw:[-180,180],roll:[-180,180],length:[.01,50]};
 for(const [key,[min,max]]of Object.entries(bounds))if(!finite(v.config?.[key],min,max))throw Error('Invalid tunnel setting: '+key);
 if(!Array.isArray(v.design?.profile)||v.design.profile.length!==7||!finite(v.design.span,.5,4))throw Error('Invalid airfoil design.');
 const p=v.design.profile;
 p.forEach((s,i)=>{if(!finite(s.x,0,1)||!finite(s.upper,-.3,.3)||!finite(s.lower,-.3,.3)||s.upper<s.lower||(i&&s.x-p[i-1].x<.024))throw Error('Invalid airfoil control points.');});
 if(p[0].x!==0||p[6].x!==1||p[0].upper!==0||p[0].lower!==0||p[6].upper!==0||p[6].lower!==0)throw Error('Airfoil endpoints must be fixed.');
 if(!['wing','sphere','box','cube','custom','airfoil'].includes(v.model?.kind))throw Error('Unknown model type.');
 if(typeof v.model.name!=='string'||v.model.name.length>256)throw Error('Invalid model name.');
 if(v.model.kind==='custom'){
  const a=v.model.positions;if(!Array.isArray(a)||a.length<9||a.length>1350000||a.length%9||!a.every(n=>finite(n,-10000,10000)))throw Error('Invalid or oversized model geometry.');
  for(let axis=0;axis<3;axis++){let lo=Infinity,hi=-Infinity;for(let i=axis;i<a.length;i+=3){lo=Math.min(lo,a[i]);hi=Math.max(hi,a[i]);}if(hi-lo<1e-8)throw Error('Model must have three nonzero dimensions.');}
 }
 if(v.analysis?.mode==='wing'&&v.model.kind!=='airfoil')throw Error('Wing analysis needs an editor airfoil.');
 if(!['surface','wing'].includes(v.analysis?.mode)||!finite(v.analysis.efficiency,.5,1)||!finite(v.analysis.cd0,0,.1))throw Error('Invalid analysis settings.');
 if(!v.display||!['sparse','normal','dense'].includes(v.display.density)||['flow','pressure','arrows','axes'].some(k=>typeof v.display[k]!=='boolean'))throw Error('Invalid display settings.');
 const validRows=rows=>Array.isArray(rows)&&rows.length<=2000&&rows.every(r=>r&&finite(r.x,-1e7,1e7)&&['lift','drag'].every(k=>r[k]===null||finite(r[k],-1e14,1e14)));
 if(!validRows(v.history||[])||!validRows(v.recorded||[])||!finite(v.elapsed??0,0,1e7))throw Error('Invalid recorded data.');
 if(!Array.isArray(v.experiments)||v.experiments.length>6)throw Error('A workspace can contain up to six comparisons.');
 for(const e of v.experiments){
  if(!e||typeof e.name!=='string'||e.name.length>80||!validRows(e.history)||!validRows(e.sweep)||!['surface','wing'].includes(e.mode)||!e.config||!Object.entries(bounds).every(([k,[lo,hi]])=>finite(e.config[k],lo,hi))||!e.result||!['lift','drag','cl','cd'].every(k=>finite(e.result[k],-1e14,1e14)))throw Error('Invalid saved comparison.');
 }
 return v;
}
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('flowlab-workspaces',1);request.onupgradeneeded=()=>request.result.createObjectStore('workspace');request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});}
export async function saveWorkspace(value){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export async function loadWorkspace(){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('workspace').objectStore('workspace').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
