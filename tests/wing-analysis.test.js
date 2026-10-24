import test from 'node:test';import assert from 'node:assert/strict';
import {parameterAirfoil,airfoilCharacteristics,solveWing} from '../wing-analysis.js';
const config={speed:30,density:1.225,pitch:6,yaw:0,roll:0,length:2};
test('symmetric wing has zero lift at zero incidence and odd signed lift',()=>{
 const p=parameterAirfoil({camber:0});assert.ok(Math.abs(airfoilCharacteristics(p).alphaZero)<1e-10);
 assert.equal(solveWing(p,4,{...config,pitch:0}).lift,0);
 const a=solveWing(p,4,config),b=solveWing(p,4,{...config,pitch:-6});assert.ok(Math.abs(a.lift+b.lift)<1e-9);assert.ok(Math.abs(a.drag-b.drag)<1e-9);
});
test('camber moves the zero lift angle negative and zero lift occurs there',()=>{
 const p=parameterAirfoil({camber:.02}),alpha=airfoilCharacteristics(p).alphaZero;assert.ok(alpha<0);assert.ok(Math.abs(solveWing(p,4,{...config,pitch:alpha*180/Math.PI}).lift)<1e-8);
});
test('finite span reduces lift slope; induced drag obeys selected efficiency and force scales with V squared',()=>{
 const p=parameterAirfoil({camber:0}),a=solveWing(p,4,config),b=solveWing(p,4,{...config,speed:60});
 assert.ok(a.cl<2*Math.PI*6*Math.PI/180);assert.ok(Math.abs(a.cd-(.012+a.cl*a.cl/(Math.PI*.8*4)))<1e-12);assert.ok(Math.abs(b.lift/a.lift-4)<1e-10);assert.ok(solveWing(p,2,config).cl<a.cl);
});
test('unsupported conditions yield invalid data instead of false stall curves',()=>{
 const p=parameterAirfoil();for(const change of [{pitch:14},{yaw:5},{roll:5}]){const r=solveWing(p,4,{...config,...change});assert.equal(r.valid,false);assert.ok(Number.isNaN(r.lift));}
 const r=solveWing(p,4,{...config,speed:0});assert.equal(r.lift,0);assert.equal(r.drag,0);assert.equal(r.cl,0);
});
