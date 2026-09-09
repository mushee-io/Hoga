import type {OrderState} from '@prisma/client';
export const transitions: Record<OrderState,OrderState[]> = {
 DRAFT:['QUOTED','CANCELLED'], QUOTED:['QUOTE_ACCEPTED','CANCELLED'], QUOTE_ACCEPTED:['PAYMENT_PENDING','CANCELLED'], PAYMENT_PENDING:['PAID','CANCELLED'], PAID:['FULFILLING'], FULFILLING:['QUALITY_CHECK','FAILED'], QUALITY_CHECK:['DELIVERED','FAILED'], DELIVERED:['REFUNDED'], FAILED:['FULFILLING','REFUNDED'], CANCELLED:[], REFUNDED:[]
};
export function assertTransition(from: OrderState,to: OrderState){if(!transitions[from].includes(to)) throw new Error(`Invalid transition: ${from} → ${to}`);}
export function assertOwner(ownerId:string,userId:string){if(ownerId!==userId) throw new Error('Business not found');}
