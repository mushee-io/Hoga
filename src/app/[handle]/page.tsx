import {notFound,redirect} from 'next/navigation';
export default async function PublicHandle({params}:{params:Promise<{handle:string}>}){const {handle}=await params;if(!handle.startsWith('@'))notFound();redirect(`/b/${handle.slice(1)}`);}
