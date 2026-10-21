import {test} from 'node:test';import assert from 'node:assert/strict';import {solve,rotation} from '../physics.js';
const plate=[{normal:[-1,0,0],area:1}];
test('stationary air produces zero aerodynamic force',()=>{const r=solve(plate,{speed:0});assert.equal(r.drag,0);assert.equal(r.lift,0);assert.equal(r.cd,0)});
test('windward panel pressure is 2qA and scales with velocity squared',()=>{const a=solve(plate,{speed:10}),b=solve(plate,{speed:20});assert.equal(a.drag,122.5);assert.equal(b.drag,4*a.drag)});
test('density and surface area scale force linearly',()=>{assert.equal(solve(plate,{density:2}).drag,2*solve(plate,{density:1}).drag);assert.equal(solve([{...plate[0],area:2}]).drag,2*solve(plate).drag)});
test('orientation changes force and preserves vector norm',()=>{const n=rotation([1,0,0],23,45,16);assert.ok(Math.abs(Math.hypot(...n)-1)<1e-12);assert.ok(solve(plate,{pitch:90}).drag<solve(plate).drag*.01);assert.ok(solve(plate,{pitch:30}).lift<0)});
test('mirrored pitch reverses lift on a symmetric closed plate',()=>{const p=[...plate,{normal:[1,0,0],area:1}],a=solve(p,{pitch:20}),b=solve(p,{pitch:-20});assert.ok(Math.abs(a.drag-b.drag)<1e-9);assert.ok(Math.abs(a.lift+b.lift)<1e-9)});
test('reference area only normalizes coefficients',()=>{const a=solve(plate,{area:1}),b=solve(plate,{area:2});assert.equal(a.drag,b.drag);assert.equal(a.cd,2*b.cd)});

