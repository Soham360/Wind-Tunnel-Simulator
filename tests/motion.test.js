import {test} from 'node:test';
import assert from 'node:assert/strict';
import {springStep} from '../motion.js';
test('camera spring settles without overshooting from rest',()=>{
 let p=8,v=0;for(let i=0;i<120;i++){[p,v]=springStep(p,v,2,1/60);assert.ok(p>=2)}
 assert.ok(Math.abs(p-2)<1e-8);
});
test('retargeting preserves continuity and converges to the new destination',()=>{
 let [p,v]=springStep(8,0,2,.1);const before=p;
 [p,v]=springStep(p,v,10,1/10000);assert.ok(Math.abs(p-before)<.01);
 for(let i=0;i<120;i++)[p,v]=springStep(p,v,10,1/60);
 assert.ok(Math.abs(p-10)<1e-8);
});
test('spring is independent of frame subdivision',()=>{
 const whole=springStep(8,-2,1,.1);let half=springStep(8,-2,1,.05);half=springStep(...half,1,.05);
 assert.ok(Math.abs(whole[0]-half[0])<1e-12);assert.ok(Math.abs(whole[1]-half[1])<1e-12);
});
