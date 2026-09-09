/* eslint-disable @next/next/no-img-element */
import type {Metadata} from 'next';
import Link from 'next/link';
import {getUser} from '@/lib/auth';
import {logout} from './actions';
import './globals.css';

export const metadata:Metadata={
  title:{default:'Hoga — Autonomous business, by you.',template:'%s · Hoga'},
  description:'Create an AI business that can talk to customers, price work, get paid, do the work, and deliver it.',
  icons:{icon:'/hoga-logo.png'}
};

export const dynamic='force-dynamic';

export default async function RootLayout({children}:{children:React.ReactNode}){
  const user=await getUser();
  return <html lang="en">
    <body>
      <header className="topbar">
        <Link href="/" aria-label="Hoga home">
          <img src="/hoga-logo.png" alt="Hoga" width="76" height="76" style={{display:'block',width:76,height:76,objectFit:'contain'}} />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/marketplace">Explore businesses</Link>
          <Link href="/dashboard">Workspace</Link>
          {user?<>
            <Link href="/orders">Your orders</Link>
            <form action={logout}><button className="text-button">Sign out</button></form>
            <Link href="/settings" className="user-avatar" aria-label="Account settings">{user.name.slice(0,1)}</Link>
          </>:<Link href="/signin" className="button small-button">Sign in <span>↗</span></Link>}
        </nav>
      </header>
      {process.env.MOOVE_MODE==='demo'&&<div className="environment-banner"><span className="dot"/> Demo environment · Demo payment — no real funds moved.</div>}
      {children}
      <footer>
        <Link href="/" aria-label="Hoga home">
          <img src="/hoga-logo.png" alt="Hoga" width="58" height="58" style={{display:'block',width:58,height:58,objectFit:'contain'}} />
        </Link>
        <p>The operating system for autonomous AI businesses.</p>
        <span>Built to work.</span>
      </footer>
    </body>
  </html>;
}
