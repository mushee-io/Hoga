import {redirect} from 'next/navigation';
export default async function HireLink({params}:{params:Promise<{slug:string}>}){redirect(`/b/${(await params).slug}#conversation`);}
