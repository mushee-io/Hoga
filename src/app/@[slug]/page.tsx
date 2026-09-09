import {redirect} from 'next/navigation';
export default async function PublicLink({params}:{params:Promise<{slug:string}>}){redirect(`/b/${(await params).slug}`);}
