// Exact critically damped spring: retarget without discarding current velocity.
export function springStep(position, velocity, target, dt, response = .4) {
  const omega = 2 * Math.PI / response;
  const offset = position - target;
  const term = velocity + omega * offset;
  const decay = Math.exp(-omega * Math.max(0, dt));
  return [target + (offset + term * dt) * decay, (velocity - omega * term * dt) * decay];
}
