import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraPose} from '../camera-views.js';
test('side views look squarely across the flow with Y upright',()=>{
 const a=cameraPose('side',2),b=cameraPose('opposite',2);
 assert.deepEqual(a.position.slice(0,2),[0,0]);
 assert.equal(a.position[2],-b.position[2]);
 assert.deepEqual(a.up,[0,1,0]);
});
test('top view avoids the orbit pole singularity',()=>{
 const p=cameraPose('top',2);assert.equal(p.position[0],0);assert.ok(p.position[2]>0 && p.position[2]<p.position[1]*.001);
 assert.deepEqual(p.up,[0,1,0]);
});
test('framing accommodates large models and narrow viewports',()=>{
 const d=p=>Math.hypot(...p.position);
 assert.equal(d(cameraPose('front',20)),10*d(cameraPose('front',2)));
 assert.ok(d(cameraPose('side',2,.5))>d(cameraPose('side',2,1)));
});
test('initializing behind a reading view retains a finite camera pose',()=>{
 for(const aspect of [NaN,0])assert.ok(cameraPose('perspective',2,aspect).position.every(Number.isFinite));
});
