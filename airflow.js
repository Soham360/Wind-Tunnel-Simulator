// Illustrative paths displaced around the model's projected bounding ellipse.
// This deliberately does not claim to solve velocities or pressure in the fluid.
export function streamPoint(x,y,z,bounds){
 const rx=Math.max(.05,bounds.x),ry=Math.max(.025,bounds.y),rz=Math.max(.025,bounds.z);
 const cross=Math.hypot(y/ry,z/rz),edge=Math.max(0,Math.abs(x)/rx-1.05),fade=Math.exp(-edge*edge*3);
 if(cross<1.55){const target=1.55,c=Math.max(cross,.0001),push=(target/c-1)*fade;
  if(cross<.0001)return [x,ry*1.55*fade,z];
  return [x,y*(1+push),z*(1+push)];
 }
 return [x,y,z];
}
