import { z } from 'zod';
import { db } from '@/lib/db';
import { apiBusiness } from '@/lib/connect';
import { createQuote, acceptQuote } from '@/lib/commerce';

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const business = await apiBusiness(request); const path = (await params).path;
    if (path[0] === 'business') { const services = await db.service.findMany({ where: { businessId: business.id, active: true }, select: { id: true, name: true, description: true, price: true, startingPrice: true, negotiation: true } }); return Response.json({ id: business.id, name: business.name, slug: business.slug, description: business.description, currency: business.currency, services }); }
    if (path[0] === 'conversations' && path[1]) { const conversation = await db.conversation.findFirst({ where: { id: path[1], businessId: business.id }, include: { messages: true, quotes: true } }); return conversation ? Response.json(conversation) : Response.json({ error: 'Not found' }, { status: 404 }); }
    if (path[0] === 'orders' && path[1]) { const order = await db.order.findFirst({ where: { id: path[1], businessId: business.id }, include: { payment: true, fulfillment: { include: { deliverable: true } } } }); return order ? Response.json(order) : Response.json({ error: 'Not found' }, { status: 404 }); }
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const business = await apiBusiness(request); const path = (await params).path; const body = await request.json();
    if (path[0] === 'sessions') { const { customerId } = z.object({ customerId: z.string() }).parse(body); if (!await db.user.findUnique({ where: { id: customerId } })) throw new Error('Unknown customer'); const conversation = await db.conversation.create({ data: { businessId: business.id, customerId, channel: 'api' } }); return Response.json({ id: conversation.id }, { status: 201 }); }
    if (path[0] === 'quotes' && path[1] === 'accept') { const input = z.object({ customerId: z.string(), quoteId: z.string() }).parse(body); return Response.json(await acceptQuote(input.customerId, input.quoteId)); }
    if (path[0] === 'quotes') { const input = z.object({ customerId: z.string(), serviceId: z.string(), message: z.string().min(3), conversationId: z.string().optional(), offer: z.string().optional() }).parse(body); const { customerId, ...quote } = input; return Response.json(await createQuote(customerId, { businessId: business.id, ...quote })); }
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 }); }
}
