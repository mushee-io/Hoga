import type {Metadata} from 'next';
import Link from 'next/link';
import {getUser} from '@/lib/auth';
import {logout} from './actions';
import './globals.css';
import './hoga-site.css';

export const metadata:Metadata={
  title:{default:'HOGA — Market intelligence in motion.',template:'%s · HOGA'},
  description:'HOGA is a market intelligence and agentic workflow platform for discovery, signals, automation, and execution across web and Telegram.'
};

export const dynamic='force-dynamic';

export default async function RootLayout({children}:{children:React.ReactNode}){
  const user=await getUser();
  return <html lang="en">
    <body>
      <header className="topbar hoga-topbar">
        <Link href="/" aria-label="HOGA home" className="hoga-wordmark">HOGA</Link>
        <nav aria-label="Main navigation" className="hoga-nav">
          <Link href="/#product">Product</Link>
          <Link href="/#platform">Platform</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/marketplace">Ecosystem</Link>
          <Link href="/#community">Community</Link>
          <Link href="/#resources">Resources</Link>
        </nav>
        <div className="hoga-nav-actions">
          <a href="https://x.com" aria-label="HOGA on X" className="hoga-icon-link">𝕏</a>
          <a href="https://github.com/mushee-io/Hoga" aria-label="HOGA on GitHub" className="hoga-icon-link">GH</a>
          {user?<>
            <Link href="/dashboard" className="hoga-launch">OPEN HOGA</Link>
            <form action={logout}><button className="text-button">Sign out</button></form>
          </>:<Link href="/signin" className="hoga-launch">OPEN HOGA</Link>}
        </div>
      </header>
      {process.env.MOOVE_MODE==='demo'&&<div className="environment-banner"><span className="dot"/> Demo environment · Demo payment — no real funds moved.</div>}
      {children}
      <footer className="hoga-footer">
        <Link href="/" className="hoga-wordmark">HOGA</Link>
        <p>MARKET INTELLIGENCE. SIGNALS. AGENTIC WORKFLOWS.</p>
        <span>Built for markets in motion.</span>
      </footer>
    </body>
  </html>;
}
