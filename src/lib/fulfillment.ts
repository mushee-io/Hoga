import {db} from './db';
import {serial} from './commerce';
import {aiAdapter} from './ai';
export async function fulfillOrder(orderId:string){
 const claim=await serial(async tx=>{
 const o=await tx.order.findUnique({where:{id:orderId},include:{payment:true,fulfillment:true,quote:true}});
 if(!o||o.payment?.status!=='CONFIRMED'||!o.fulfillment)return null;
 const f=o.fulfillment;
 if(f.completedAt||f.attempts>=3||f.nextAttemptAt>new Date()||f.leaseUntil&&f.leaseUntil>new Date())return null;
 if(!['PAID','FAILED','FULFILLING','QUALITY_CHECK'].includes(o.state))return null;
 await tx.fulfillment.update({where:{id:f.id},data:{attempts:{increment:1},leaseUntil:new Date(Date.now()+180000),startedAt:f.startedAt??new Date(),error:null}});
 await tx.order.update({where:{id:o.id},data:{state:'FULFILLING',events:{create:{state:'FULFILLING',detail:'Work started automatically after payment confirmation.'}}}});
 return o;
 });
 if(!claim)return false;
 try{
 const ai=aiAdapter(),q=claim.quote;
 const content=await ai.fulfill({businessInstructions:q.instructions,service:q.serviceName,serviceDescription:q.serviceDescription,requirements:q.requirements,scope:q.scope,fulfillmentInstructions:q.fulfillmentInstructions});
 await db.order.update({where:{id:orderId},data:{state:'QUALITY_CHECK',events:{create:{state:'QUALITY_CHECK',detail:'Checking output presence, length, and demo provenance.'}}}});
 if(content.trim().length<150)throw new Error('Quality check failed: output is too short');
 if(ai.demo&&!content.includes('DEMO OUTPUT'))throw new Error('Quality check failed: demo provenance is missing');
 await serial(async tx=>{await tx.deliverable.upsert({where:{fulfillmentId:claim.fulfillment!.id},create:{fulfillmentId:claim.fulfillment!.id,content,demo:ai.demo,provider:ai.provider,model:ai.model},update:{content,demo:ai.demo,provider:ai.provider,model:ai.model}});
 await tx.fulfillment.update({where:{id:claim.fulfillment!.id},data:{completedAt:new Date(),leaseUntil:null,qualityResult:'Passed structural checks: non-empty output, minimum length, demo provenance. Factual accuracy is not independently verified.'}});
 await tx.order.update({where:{id:orderId},data:{state:'DELIVERED',events:{create:{state:'DELIVERED',detail:'Deliverable released to customer.'}}}});});return true;
 }catch(e){console.error('Fulfillment failed',{orderId,error:e instanceof Error?e.message:'Unknown error'});await serial(async tx=>{await tx.fulfillment.update({where:{orderId},data:{error:e instanceof Error?e.message:'Fulfillment failed',leaseUntil:null,nextAttemptAt:new Date(Date.now()+30000)}});await tx.order.update({where:{id:orderId},data:{state:'FAILED',events:{create:{state:'FAILED',detail:'Fulfillment failed. Automatic retry scheduled, up to three attempts.'}}}});});return false;}
}
export async function drainJobs(){const jobs=await db.fulfillment.findMany({where:{completedAt:null,attempts:{lt:3},nextAttemptAt:{lte:new Date()},OR:[{leaseUntil:null},{leaseUntil:{lt:new Date()}}]},take:5,orderBy:{nextAttemptAt:'asc'}});for(const job of jobs)await fulfillOrder(job.orderId);return jobs.length;}
