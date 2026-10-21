const base={speed:30,density:1.225,pitch:0,yaw:0,roll:0,length:2};
export const LESSONS={
  speed20:{shape:'sphere',label:'Sphere',config:{...base,speed:20},view:'perspective',message:'Sphere at 20 m/s. Note drag and dynamic pressure, then compare at 40 m/s.'},
  speed40:{shape:'sphere',label:'Sphere',config:{...base,speed:40},view:'perspective',message:'Sphere at 40 m/s. Modeled drag is four times the 20 m/s case.'},
  pitch0:{shape:'wing',label:'Demonstrator wing',config:{...base},view:'side',message:'Wing at 0° in Side view. Compare with 15° to see normal projection change.'},
  pitch15:{shape:'wing',label:'Demonstrator wing',config:{...base,pitch:15},view:'side',message:'Wing at 15° in Side view. These forces omit circulation and stall.'},
  scale1:{shape:'sphere',label:'Sphere',config:{...base,length:1},view:'perspective',message:'Sphere with 1 m X length. Compare with 2 m at the same airspeed.'},
  scale2:{shape:'sphere',label:'Sphere',config:{...base,length:2},view:'perspective',message:'Sphere with 2 m X length. Its area and modeled drag are four times the 1 m case.'},
  sphere:{shape:'sphere',label:'Sphere',config:{...base},view:'front',message:'Sphere at 30 m/s, with a 4 m² bounding reference area. Compare with the cube.'},
  cube:{shape:'cube',label:'Cube',config:{...base},view:'front',message:'Cube at 30 m/s, with the same 4 m² bounding reference area as the sphere.'},
};
