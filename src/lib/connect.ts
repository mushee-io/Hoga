import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {db} from './db';
export const hashSecret=(s:string)=>createHash('sha256').update(s).digest('hex');
export function newApiKey(){const secret=randomBytes(32).toString('base64url');return {plain:`hoga_live_${secret}`,prefix:`hoga_live_${secret.slice(0,8)}`,hash:hashSecret(`hoga_live_${secret}`)};}
export function newWebhookSecret(){return `whsec_${randomBytes(24).toString('base64url')}`;}
export async function apiBusiness(request:Request){const value=request.headers.get('authorization')||'';const key=value.startsWith('Bearer ')?value.slice(7):'';if(!key.startsWith('hoga_live_'))throw new Error('Unauthorized');const prefix=key.slice(0,18);const record=await db.apiKey.findFirst({where:{prefix,revokedAt:null},include:{business:true}});if(!record||!timingSafeEqual(Buffer.from(record.secretHash),Buffer.from(hashSecret(key))))throw new Error('Unauthorized');await db.apiKey.update({where:{id:record.id},data:{lastUsedAt:new Date()}});return record.business;}
export async function emitWebhook(businessId:string,event:string,data:Record<string,unknown>){const endpoints=await db.webhookEndpoint.findMany({where:{businessId,active:true,events:{has:event}}});await db.webhookDelivery.createMany({data:endpoints.map(e=>({endpointId:e.id,event,payload:{event,data} as object}))});}
export function signature(secret:string,payload:string){return createHmac('sha256',secret).update(payload).digest('hex');}
