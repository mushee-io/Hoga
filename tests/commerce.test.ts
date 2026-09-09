import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db} from '../src/lib/db';
import {saveBusiness,saveService,createQuote,acceptQuote,requestPayment,confirmDemoPayment} from '../src/lib/commerce';
import {fulfillOrder} from '../src/lib/fulfillment';
import {paymentAdapter} from '../src/lib/payments';
after(async()=>{await db.$disconnect();});
test('database happy path, access isolation, immutable quote and idempotent settlement',async()=>{
 const tag=randomUUID().slice(0,8);const u=await db.user.create({data:{name:'Integration test',email:`test-${tag}@hoga.invalid`,passwordHash:'not-a-login'}});const intruder=await db.user.create({data:{name:'Unauthorized test',email:`intruder-${tag}@hoga.invalid`,passwordHash:'not-a-login'}});
 let businessId='';
 try{
 const input={name:`Test ${tag}`,slug:`test-${tag}`,logo:'T',category:'Research',shortDescription:'Clearly identified integration test business',description:'Temporary business created by automated integration tests.',agentName:'Test Agent',personality:'Clear',instructions:'Scope work without inventing facts or sources.',fulfillmentInstructions:'Return a structured output with explicit limitations.',currency:'USDC',published:false};
 const b=await saveBusiness(u.id,input);businessId=b.id;
 await assert.rejects(saveBusiness(intruder.id,{...input,id:b.id,published:true}));
 await assert.rejects(saveBusiness(u.id,{...input,id:b.id,published:true}));
 const service=await saveService(u.id,{businessId:b.id,name:'Competitive analysis',description:'Compare five competitors with evidence limitations.',price:'12',minimum:'8',maxDiscount:20,negotiation:true,startingPrice:false,active:true});
 await assert.rejects(createQuote(u.id,{businessId:b.id,serviceId:service.id,message:'Analyze prediction markets.'}));
 await saveBusiness(u.id,{...input,id:b.id,published:true});
 const first=await createQuote(u.id,{businessId:b.id,serviceId:service.id,message:'Analyze five prediction markets.'});
 await assert.rejects(createQuote(intruder.id,{businessId:b.id,serviceId:service.id,conversationId:first.conversationId,message:'Take over this conversation'}));
 const revised=await createQuote(u.id,{businessId:b.id,serviceId:service.id,conversationId:first.conversationId,message:'Can you do nine?',offer:'9'});
 const quote=await db.quote.findUniqueOrThrow({where:{id:revised.quoteId}});assert.equal(quote.amount.toFixed(2),'9.60');assert.equal(quote.version,2);
 await assert.rejects(acceptQuote(intruder.id,quote.id));
 await assert.rejects(acceptQuote(u.id,first.quoteId));
 const accepted=await Promise.all([acceptQuote(u.id,quote.id),acceptQuote(u.id,quote.id)]);assert.equal(accepted[0].id,accepted[1].id);const order=accepted[0];
 assert.equal(await fulfillOrder(order.id),false);
 await saveService(u.id,{businessId:b.id,id:service.id,name:'Renamed service',description:'A different service description after order acceptance.',price:'30',minimum:'20',maxDiscount:10,negotiation:false,startingPrice:false,active:true});
 const historic=await db.order.findUniqueOrThrow({where:{id:order.id},include:{quote:true}});assert.equal(historic.quote.serviceName,'Competitive analysis');assert.equal(historic.amount.toFixed(2),'9.60');
 const p=await requestPayment(u.id,order.id);assert.equal(p.mode,'demo');assert.equal((await requestPayment(u.id,order.id)).id,p.id);
 await assert.rejects(confirmDemoPayment(intruder.id,order.id));
 await Promise.all([confirmDemoPayment(u.id,order.id),confirmDemoPayment(u.id,order.id)]);
 assert.equal(await db.fulfillment.count({where:{orderId:order.id}}),1);
 await Promise.all([fulfillOrder(order.id),fulfillOrder(order.id)]);
 const done=await db.order.findUniqueOrThrow({where:{id:order.id},include:{fulfillment:{include:{deliverable:true}},payment:true}});assert.equal(done.state,'DELIVERED');assert.ok(done.fulfillment?.deliverable?.demo);assert.ok(done.fulfillment?.deliverable?.content.includes('DEMO OUTPUT'));assert.equal(done.payment?.status,'CONFIRMED');assert.equal(done.fulfillment?.attempts,1);
 await saveBusiness(u.id,{...input,id:b.id,published:false});await assert.rejects(createQuote(u.id,{businessId:b.id,serviceId:service.id,message:'Try unpublished business'}));
 const original=process.env.MOOVE_MODE;process.env.MOOVE_MODE='live';try{await assert.rejects(confirmDemoPayment(u.id,order.id));await assert.rejects(paymentAdapter().create({orderId:order.id,amount:'9.60',currency:'USDC'}));}finally{process.env.MOOVE_MODE=original;}
 }finally{if(businessId){const os=await db.order.findMany({where:{businessId}}),ids=os.map(o=>o.id);await db.deliverable.deleteMany({where:{fulfillment:{orderId:{in:ids}}}});await db.fulfillment.deleteMany({where:{orderId:{in:ids}}});await db.orderEvent.deleteMany({where:{orderId:{in:ids}}});await db.payment.deleteMany({where:{orderId:{in:ids}}});await db.order.deleteMany({where:{businessId}});await db.quote.deleteMany({where:{conversation:{businessId}}});await db.message.deleteMany({where:{conversation:{businessId}}});await db.conversation.deleteMany({where:{businessId}});await db.service.deleteMany({where:{businessId}});await db.business.delete({where:{id:businessId}});}await db.user.deleteMany({where:{id:{in:[u.id,intruder.id]}}});}
});
