import {db} from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {Heading} from '@/components/ui';
import {OrdersTable} from '@/components/orders-table';
export default async function Orders(){const u=await requireUser();const orders=await db.order.findMany({where:{customerId:u.id},include:{quote:true,payment:true},orderBy:{createdAt:'desc'}});return <main className="page-width content"><Heading eyebrow="YOUR WORK, IN ONE PLACE" title="Your orders" description="Every accepted scope, payment, and deliverable."/><OrdersTable orders={orders}/></main>;}
