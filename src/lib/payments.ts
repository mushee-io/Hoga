import {randomUUID} from 'node:crypto';
export type PaymentRequest={orderId:string;amount:string;currency:string};
export type PaymentLink={reference:string;url:string;mode:'demo'|'live'};
export interface PaymentAdapter {create(input:PaymentRequest):Promise<PaymentLink>;verify(reference:string):Promise<{settled:boolean;amount:string;currency:string;transactionReference:string}>;}
class DemoMoove implements PaymentAdapter {
 async create(input:PaymentRequest):Promise<PaymentLink>{return {reference:`demo_${randomUUID()}`,url:`/orders/${input.orderId}/payment`,mode:'demo'};}
 async verify():Promise<never>{throw new Error('Demo payments must use the authenticated demo confirmation action');}
}
class LiveMoove implements PaymentAdapter {
 async create():Promise<never>{throw new Error('Moove live integration unavailable: verified API documentation, merchant credentials, create-payment and settlement-verification contracts are required. No payment was sent.');}
 async verify():Promise<never>{throw new Error('Moove settlement verification is not configured.');}
}
export function paymentAdapter():PaymentAdapter {
 if(process.env.MOOVE_MODE==='demo') return new DemoMoove();
 if(process.env.MOOVE_MODE==='live') return new LiveMoove();
 throw new Error('Set MOOVE_MODE explicitly to demo or live');
}
