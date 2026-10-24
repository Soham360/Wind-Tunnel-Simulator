import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaultAirfoil,moveAirfoilPoint,sampleAirfoil,airfoilDat} from '../airfoil.js';
test('drag constraints preserve ordering, fixed endpoints and positive thickness',()=>{
 const p=defaultAirfoil(),m=moveAirfoilPoint(p,2,'upper',1,-2);
 assert.ok(m[2].x<m[3].x);assert.ok(m[2].upper>=m[2].lower+.012);
 assert.deepEqual(moveAirfoilPoint(p,0,'upper',.3,.2),p);assert.deepEqual(p,defaultAirfoil());
});
test('smooth airfoil interpolates handles without crossing either surface',()=>{
 let p=defaultAirfoil();p=moveAirfoilPoint(p,3,'lower',.5,.06);
 const samples=sampleAirfoil(p,1000);for(let i=0;i<samples.upper.length;i++)assert.ok(samples.upper[i][1]>=samples.lower[i][1]);
 assert.deepEqual(samples.upper[0],[0,0]);assert.deepEqual(samples.lower.at(-1),[1,0]);
 for(const s of p){const nearest=sampleAirfoil(p,4000).upper.reduce((a,b)=>Math.abs(b[0]-s.x)<Math.abs(a[0]-s.x)?b:a);assert.ok(Math.abs(nearest[1]-s.upper)<.001);}
});
test('symmetric profile and DAT export retain normalized coordinates',()=>{
 const p=defaultAirfoil(true),s=sampleAirfoil(p);s.upper.forEach((v,i)=>assert.ok(Math.abs(v[1]+s.lower[i][1])<1e-12));
 assert.ok(airfoilDat(p).startsWith('Flowlab custom airfoil'));assert.ok(airfoilDat(p).includes('1.000000 0.000000'));
});
