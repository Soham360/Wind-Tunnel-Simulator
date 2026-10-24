export const CAMERA_VIEWS = {
  perspective: {direction:[6,3.4,6],up:[0,1,0]},
  side: {direction:[0,0,1],up:[0,1,0]},
  opposite: {direction:[0,0,-1],up:[0,1,0]},
  front: {direction:[-1,0,0],up:[0,1,0]},
  top: {direction:[0,1,.0001],up:[0,1,0]},
};

export function cameraPose(view, radius, aspect=1, fov=38) {
  // Reading views can initialize the simulation while its canvas is hidden.
  aspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
  const preset=CAMERA_VIEWS[view];
  if(!preset)throw new Error('Unknown camera view');
  const vertical=fov*Math.PI/180;
  const horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);
  const distance=Math.max(.1,radius)*1.15/Math.sin(Math.min(vertical,horizontal)/2);
  const norm=Math.hypot(...preset.direction);
  return {position:preset.direction.map(v=>v/norm*distance),up:[...preset.up]};
}
