import {test} from 'node:test';import assert from 'node:assert/strict';import {streamPoint} from '../airflow.js';
test('streams stay finite at centerline and travel left to right',()=>{
 for(let x=-4;x<=4;x+=.1){const p=streamPoint(x,0,0,{x:1,y:.2,z:1.5});assert.ok(p.every(Number.isFinite));assert.equal(p[0],x);}
});
test('near-body streams bend outward, distant streams retain their path',()=>{
 const b={x:1,y:.2,z:1.5};assert.ok(streamPoint(0,.1,0,b)[1]>.2);assert.deepEqual(streamPoint(0,2,0,b),[0,2,0]);
 assert.ok(Math.abs(streamPoint(-8,.1,0,b)[1]-.1)<1e-8);
});
test('streams stay outside the conservative model box through its full length',()=>{
 const b={x:1,y:.5,z:1.5};
 for(const x of [-1,-.5,0,.5,1])for(const y of [-.4,-.1,.1,.4])for(const z of [-1,0,1]){
  const p=streamPoint(x,y,z,b);assert.ok(Math.abs(p[1])>b.y||Math.abs(p[2])>b.z);
 }
});
