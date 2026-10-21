import {test} from 'node:test';import assert from 'node:assert/strict';import {LESSONS} from '../lessons.js';
test('speed experiment changes only airspeed and doubles it',()=>{
 const {speed:a,...restA}=LESSONS.speed20.config,{speed:b,...restB}=LESSONS.speed40.config;
 assert.equal(b,2*a);assert.deepEqual(restA,restB);assert.equal(LESSONS.speed20.shape,LESSONS.speed40.shape);
});
test('scale experiment changes only physical length',()=>{
 const {length:a,...restA}=LESSONS.scale1.config,{length:b,...restB}=LESSONS.scale2.config;
 assert.equal(b,2*a);assert.deepEqual(restA,restB);
});
test('shape experiment holds all tunnel conditions and dimensions fixed',()=>{
 assert.deepEqual(LESSONS.sphere.config,LESSONS.cube.config);
 assert.equal(LESSONS.cube.shape,'cube');
});
