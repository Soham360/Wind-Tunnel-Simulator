import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestSample} from '../chart-probe.js';
test('probe selects sampled values on irregular time intervals and clamps at either end', () => {
 const rows = [{x:0}, {x:0.2}, {x:0.8}];
 assert.equal(nearestSample(rows, 0.6), 2);
 assert.equal(nearestSample(rows, -1), 0);
 assert.equal(nearestSample(rows, 9), 2);
});
test('probe handles empty and single-point runs and negative pitch', () => {
 assert.equal(nearestSample([], 0), -1);
 assert.equal(nearestSample([{x:2}], 50), 0);
 assert.equal(nearestSample([{x:-30}, {x:-28}, {x:0}], -29.5), 0);
});
