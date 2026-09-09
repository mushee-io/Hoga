import {timingSafeEqual} from 'node:crypto';
import {drainJobs} from '@/lib/fulfillment';
export const maxDuration=300;
export async function GET(request:Request){const expected=`Bearer ${process.env.CRON_SECRET}`,actual=request.headers.get('authorization')||'';if(!process.env.CRON_SECRET||actual.length!==expected.length||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return Response.json({error:'Unauthorized'},{status:401});return Response.json({processed:await drainJobs()});}
