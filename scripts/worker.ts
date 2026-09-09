import {drainJobs} from '../src/lib/fulfillment';
console.log('Hoga fulfillment worker running');
while(true){try{await drainJobs();}catch(error){console.error('Worker error',error);}await new Promise(resolve=>setTimeout(resolve,5000));}
