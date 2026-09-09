import {Prisma} from '@prisma/client';
import {db} from './db';
import {priceQuote} from './pricing';
import {aiAdapter} from './ai';
import {paymentAdapter} from './payments';
import {assertOwner,assertTransition} from './state';
import {businessInput,serviceInput} from './validation';
export async function serial<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 for(let i=0;i<4;i++){try{return await db.$transaction(fn,{isolationLevel:'Serializable',timeout:15000});}catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError && e.code==='P2034' && i<3) continue;throw e;}}
 throw new Error('Please retry');
}
export async function saveBusiness(userId:string,input:unknown){
 const {id,...data}=businessInput.parse(input);
 return serial(async tx=>{
 if(id){const b=await tx.business.findUniqueOrThrow({where:{id}});assertOwner(b.ownerId,userId);if(data.published && !(await tx.service.count({where:{businessId:id,active:true}}))) throw new Error('Add an active service before publishing');return tx.business.update({where:{id},data});}
 if(data.published) throw new Error('Save your business, add a service, then publish');
 return tx.business.create({data:{...data,ownerId:userId}});
 });
}
export async function saveService(userId:string,input:unknown){
 const {id,...data}=serviceInput.parse(input);priceQuote(data.price,data.minimum,data.maxDiscount,data.negotiation);
 return serial(async tx=>{const b=await tx.business.findUniqueOrThrow({where:{id:data.businessId}});assertOwner(b.ownerId,userId);
 if(id){const service=await tx.service.findUniqueOrThrow({where:{id}});if(service.businessId!==b.id) throw new Error('Service not found');if(b.published&&!data.active&&await tx.service.count({where:{businessId:b.id,active:true,id:{not:id}}})===0) throw new Error('Unpublish the business before disabling its last service');return tx.service.update({where:{id},data});}
 return tx.service.create({data});});
}
export async function createQuote(userId:string,input:{businessId:string;serviceId:string;message:string;conversationId?:string;offer?:string}){
 const b=await db.business.findFirstOrThrow({where:{id:input.businessId,published:true},include:{services:{where:{id:input.serviceId,active:true}}}});
 const service=b.services[0];if(!service) throw new Error('Service unavailable');
 if(input.conversationId){const c=await db.conversation.findFirst({where:{id:input.conversationId,customerId:userId,businessId:b.id}});if(!c) throw new Error('Conversation not found');}
 const previous=input.conversationId?await db.quote.findFirst({where:{conversationId:input.conversationId},orderBy:{version:'desc'}}):null;
 if(previous?.status==='ACCEPTED') throw new Error('This conversation has an accepted quote. Start a new conversation for another order.');
 const negotiating=!!input.offer && !!previous;
 if(input.offer && !previous) throw new Error('Request an initial quote before negotiating');
 if(negotiating && !previous.negotiation) throw new Error('Negotiation is disabled for this quote');
 const rules=negotiating?{price:previous.baseAmount.toString(),minimum:previous.floor.toString(),maxDiscount:previous.maxDiscount,negotiation:previous.negotiation}:{price:service.price.toString(),minimum:service.minimum.toString(),maxDiscount:service.maxDiscount,negotiation:service.negotiation};
 const pricing=priceQuote(rules.price,rules.minimum,rules.maxDiscount,rules.negotiation,input.offer);
 const ai=aiAdapter();const requirements=negotiating?previous.requirements:input.message;
 const scope=negotiating?previous.scope:await ai.scope({businessInstructions:b.instructions,service:service.name,serviceDescription:service.description,requirements,scope:'',fulfillmentInstructions:b.fulfillmentInstructions});
 return serial(async tx=>{
 const available=await tx.business.findFirst({where:{id:b.id,published:true}});if(!available) throw new Error('Business is no longer published');
 let c=input.conversationId?await tx.conversation.findFirstOrThrow({where:{id:input.conversationId,customerId:userId,businessId:b.id}}):null;
 if(!c)c=await tx.conversation.create({data:{businessId:b.id,customerId:userId}});
 const latest=await tx.quote.findFirst({where:{conversationId:c.id},orderBy:{version:'desc'}});
 if(latest?.status==='ACCEPTED' || (latest?.id??null)!==(previous?.id??null)) throw new Error('Conversation changed. Refresh and try again.');
 await tx.quote.updateMany({where:{conversationId:c.id,status:'OPEN'},data:{status:'SUPERSEDED'}});
 const quote=await tx.quote.create({data:{conversationId:c.id,version:(latest?.version??0)+1,serviceId:negotiating?previous.serviceId:service.id,serviceName:negotiating?previous.serviceName:service.name,requirements,scope,amount:pricing.amount,baseAmount:rules.price,floor:pricing.floor,maxDiscount:rules.maxDiscount,negotiation:rules.negotiation,currency:negotiating?previous.currency:b.currency,instructions:negotiating?previous.instructions:b.instructions,fulfillmentInstructions:negotiating?previous.fulfillmentInstructions:b.fulfillmentInstructions,serviceDescription:negotiating?previous.serviceDescription:service.description,demo:negotiating?previous.demo:ai.demo,expiresAt:new Date(Date.now()+86400000)}});
 await tx.message.createMany({data:[{conversationId:c.id,role:'customer',content:input.offer?`Offer: ${input.offer} ${quote.currency}. ${input.message}`:input.message},{conversationId:c.id,role:'assistant',content:`${scope}\n\nQuote v${quote.version}: ${quote.amount.toFixed(2)} ${quote.currency}${input.offer?' — price validated against the agreed limits.':''}`} ]});
 return {conversationId:c.id,quoteId:quote.id};
 });
}
export async function acceptQuote(userId:string,quoteId:string){
 return serial(async tx=>{
 const q=await tx.quote.findUniqueOrThrow({where:{id:quoteId},include:{conversation:{include:{business:true}},order:true}});
 if(q.conversation.customerId!==userId) throw new Error('Quote not found');
 if(q.order) return q.order;
 if(q.status!=='OPEN'||q.expiresAt<new Date())throw new Error('Quote is no longer available');
 if(!q.conversation.business.published)throw new Error('Business is no longer published');
 const expected=priceQuote(q.baseAmount.toString(),q.floor.toString(),q.maxDiscount,q.negotiation,q.amount.toString());
 if(!q.amount.equals(expected.amount))throw new Error('Invalid quote price');
 await tx.quote.update({where:{id:q.id},data:{status:'ACCEPTED'}});
 return tx.order.create({data:{quoteId:q.id,businessId:q.conversation.businessId,businessName:q.conversation.business.name,customerId:userId,amount:q.amount,currency:q.currency,state:'QUOTE_ACCEPTED',events:{create:{state:'QUOTE_ACCEPTED',detail:`Quote v${q.version} accepted; scope and price preserved.`}}}});
 });
}
export async function requestPayment(userId:string,orderId:string){
 const order=await db.order.findFirstOrThrow({where:{id:orderId,customerId:userId},include:{payment:true}});
 if(order.payment)return order.payment;
 if(order.state!=='QUOTE_ACCEPTED')throw new Error('Order is not payable');
 const link=await paymentAdapter().create({orderId,amount:order.amount.toString(),currency:order.currency});
 return serial(async tx=>{const o=await tx.order.findUniqueOrThrow({where:{id:orderId},include:{payment:true}});if(o.payment)return o.payment;assertTransition(o.state,'PAYMENT_PENDING');
 const payment=await tx.payment.create({data:{orderId,...link,amount:o.amount,currency:o.currency}});
 await tx.order.update({where:{id:orderId},data:{state:'PAYMENT_PENDING',events:{create:{state:'PAYMENT_PENDING',detail:link.mode==='demo'?'Demo payment requested — no real funds moved.':'Payment requested.'}}}});return payment;});
}
export async function confirmDemoPayment(userId:string,orderId:string){
 if(process.env.MOOVE_MODE!=='demo')throw new Error('Demo confirmation is unavailable in live mode');
 return serial(async tx=>{
 const order=await tx.order.findFirstOrThrow({where:{id:orderId,customerId:userId},include:{payment:true}});const p=order.payment;
 if(!p||p.mode!=='demo')throw new Error('Demo payment not found');if(p.status==='CONFIRMED') return order;
 if(p.status!=='PENDING'||!p.amount.equals(order.amount)||p.currency!==order.currency)throw new Error('Payment mismatch');
 assertTransition(order.state,'PAID');
 await tx.payment.update({where:{id:p.id},data:{status:'CONFIRMED',confirmedAt:new Date(),transactionReference:`demo_settlement_${p.id}`}});
 return tx.order.update({where:{id:orderId},data:{state:'PAID',events:{create:{state:'PAID',detail:'Demo payment confirmed — no real funds moved.'}},fulfillment:{create:{}}}});
 });
}
