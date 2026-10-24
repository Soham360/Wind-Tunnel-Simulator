// Reuse the existing instruments and controls; switching pages never resets a run.
export function setupWorkspace(){
 const $=s=>document.querySelector(s),main=$('main'),layout=$('.layout'),aside=layout.querySelector('aside');
 const controls=document.createElement('aside');controls.className='controls-pane';controls.setAttribute('aria-label','Model and tunnel controls');
 const cards=[...aside.children];cards.forEach(c=>controls.append(c));
 const actions=cards[1].querySelector('.actions'),exportButton=$('#export'),telemetry=cards[1].querySelector('dl'),notice=cards[1].querySelector('.notice');
 const shell=document.createElement('section');shell.className='app-shell';shell.setAttribute('aria-label','Simulation workspace');
 const bar=document.createElement('div');bar.className='workspace-bar';bar.innerHTML='<div class="workspace-title"><strong>Wind tunnel</strong><span>Educational aerodynamics</span></div><div class="compact-tabs" role="group" aria-label="Workspace panels"><button data-panel="simulation">View & data</button><button data-panel="controls">Controls</button><button data-panel="airfoil">Airfoil</button></div><div class="run-actions"></div>';
 const runActions=bar.querySelector('.run-actions');[...actions.children].forEach(b=>runActions.append(b));runActions.append(exportButton);actions.remove();
 const dashboard=document.createElement('div');dashboard.className='dashboard';
 const center=document.createElement('section');center.className='simulation-pane';center.setAttribute('aria-label','Wind tunnel and live data');
 const viewport=$('.viewport'),camera=$('.camera-toolbar'),legend=$('.legend'),metrics=$('.metrics'),charts=$('.charts'),editor=$('.airfoil-editor');
 const viewer=document.createElement('div');viewer.className='viewer';viewer.append(viewport,legend);
 center.append(viewer,camera,metrics,telemetry,charts);telemetry.classList.add('telemetry');
 dashboard.append(controls,center,editor);shell.append(bar,dashboard);main.prepend(shell);
 layout.remove();$('.intro').remove();notice.remove();
 cards[0].querySelector('h2').textContent='Model';cards[1].querySelector('h2').textContent='Tunnel conditions';
 for(const [id,label] of [['drag','Drag / N'],['lift','Lift / N'],['cd','Drag coefficient'],['re','Reynolds number']])$('#'+id).previousElementSibling.textContent=label;
 const chartKey=document.createElement('span');chartKey.className='chart-key';chartKey.innerHTML='<span>━ Lift</span><span>┄ Drag</span>';bar.querySelector('.workspace-title').append(chartKey);
 const info=document.createElement('p');info.className='workspace-help';info.textContent='Drag to orbit · Scroll to zoom · Shape edits begin a new run · Export to keep your data';shell.append(info);
 let panel=matchMedia('(max-width:760px)').matches?'simulation':'controls';
 function setPanel(value){panel=value;document.body.dataset.toolPanel=value;bar.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.panel===value)));}
 function show(hash,update=false){const page=hash==='#theory'?'theory':hash==='#lessons'?'lessons':'simulation';
  shell.hidden=page!=='simulation';$('#theory').hidden=page!=='theory';$('#lessons').hidden=page!=='lessons';document.body.dataset.page=page;
  if(hash==='#airfoil-customizer')setPanel('airfoil');else if(page==='simulation'&&hash==='#workspace')setPanel(panel);
  main.scrollTop=0;if(update)history.pushState(null,'',hash);
  document.querySelectorAll('header nav a[href^="#"]').forEach(a=>{if(a.hash===(page==='simulation'?'#workspace':hash))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 }
 document.querySelectorAll('header nav a[href^="#"],header .brand').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();show(a.classList.contains('brand')?'#workspace':a.hash,true)}));
 bar.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>setPanel(b.dataset.panel)));
 document.addEventListener('click',e=>{if(e.target.closest('[data-lesson]')){setPanel(matchMedia('(max-width:760px)').matches?'simulation':'controls');show('#workspace',true)}},true);
 window.addEventListener('hashchange',()=>show(location.hash));window.addEventListener('popstate',()=>show(location.hash));
 setPanel(panel);show(location.hash);
 const mobile=matchMedia('(max-width:760px)');mobile.addEventListener('change',e=>{if(e.matches&&panel==='controls')setPanel('simulation');else if(!e.matches&&panel==='simulation')setPanel('controls')});
}

