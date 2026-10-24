import {inspectGeometry} from './model-inspection.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,report:inspectGeometry(data.positions)});}catch(error){self.postMessage({id:data.id,error:error.message});}};
