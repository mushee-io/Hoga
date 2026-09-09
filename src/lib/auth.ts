import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createHash,randomBytes} from 'node:crypto';
import {db} from './db';
const digest=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function getUser(){
 const token=(await cookies()).get('hoga_session')?.value;
 if(!token) return null;
 const session=await db.session.findUnique({where:{id:digest(token)},include:{user:true}});
 return session && session.expiresAt>new Date() ? session.user : null;
}
export async function requireUser(){const user=await getUser();if(!user) redirect('/signin');return user;}
export async function createSession(userId:string){
 const token=randomBytes(32).toString('hex'), expiresAt=new Date(Date.now()+7*86400000);
 await db.session.create({data:{id:digest(token),userId,expiresAt}});
 (await cookies()).set('hoga_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:expiresAt});
}
export async function destroySession(){const jar=await cookies(),token=jar.get('hoga_session')?.value;if(token) await db.session.deleteMany({where:{id:digest(token)}});jar.delete('hoga_session');}
export async function rateLimit(key:string,limit=30){
 const now=new Date();
 const rows=await db.$queryRaw<{count:number}[]>`INSERT INTO "RateLimit" ("key","count","resetAt") VALUES (${key},1,${new Date(Date.now()+60000)}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count"+1 END, "resetAt"=CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${new Date(Date.now()+60000)} ELSE "RateLimit"."resetAt" END RETURNING "count"`;
 if(rows[0].count>limit) throw new Error('Too many requests. Please try again in a minute.');
}
