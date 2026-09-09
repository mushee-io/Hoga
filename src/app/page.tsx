import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Check,Code2,Globe2,MessageCircle,Radio,Search,Workflow} from 'lucide-react';
import {db} from '@/lib/db';

const capabilities=[
  ['MARKET INTELLIGENCE','Track the signals, narratives, and activity that matter from one focused surface.',Search],
  ['LIVE SIGNALS','Surface meaningful movement quickly with clear context and less noise.',Radio],
  ['DISCOVERY','Move from broad market scanning to specific opportunities without changing tools.',Globe2],
  ['AGENTIC WORKFLOWS','Turn repeatable research and market tasks into structured autonomous workflows.',Workflow],
  ['TELEGRAM ACCESS','Bring HOGA into the places users already spend time, with web and Telegram connected.',MessageCircle],
  ['EXECUTION','Move from insight to action through one coherent workflow and interface.',ArrowUpRight],
] as const;

const flow=['DISCOVER','ANALYZE','SIGNAL','ACT'];

export default async function Home(){
  const businesses=await db.business.findMany({where:{published:true},include:{services:{where:{active:true},orderBy:{price:'asc'}}},take:6,orderBy:{createdAt:'asc'}});
  return <main className="hoga-home">
    <section className="hoga-hero hoga-shell">
      <div className="hoga-hero-copy">
        <p className="hoga-kicker">MARKET INTELLIGENCE</p>
        <h1>MARKETS.<br/>SIGNALS.<br/>ACTION.</h1>
        <p className="hoga-lede">The intelligence layer for modern markets.</p>
        <p className="hoga-subcopy">Discover opportunities, surface live signals, and move from insight to action across web, agents, and Telegram.</p>
        <div className="hoga-cta-row">
          <Link href="/dashboard" className="hoga-primary-cta">OPEN HOGA <ArrowUpRight size={18}/></Link>
          <Link href="/marketplace" className="hoga-secondary-cta">EXPLORE PLATFORM <ArrowRight size={18}/></Link>
        </div>
      </div>

      <div className="hoga-orbit-stage" aria-label="HOGA market intelligence motion graphic">
        <div className="hoga-orbit hoga-orbit-a">{Array.from({length:36}).map((_,i)=><i key={`a-${i}`} style={{'--i':i} as React.CSSProperties}/>)}</div>
        <div className="hoga-orbit hoga-orbit-b">{Array.from({length:24}).map((_,i)=><i key={`b-${i}`} style={{'--i':i} as React.CSSProperties}/>)}</div>
        <div className="hoga-orbit-core"><span>HOGA</span><small>LIVE INTELLIGENCE</small></div>
      </div>
    </section>

    <section className="hoga-trust-strip hoga-shell" id="platform">
      <span>WEB</span><span>TELEGRAM</span><span>AGENTS</span><span>MARKETPLACES</span><span>AUTOMATION</span><span>MOOVE-READY</span>
    </section>

    <section className="hoga-section hoga-shell" id="product">
      <div className="hoga-section-head">
        <div><p className="hoga-kicker">WHAT HOGA DOES</p><h2>One market surface.<br/>Multiple ways to act.</h2></div>
        <p>HOGA connects discovery, live intelligence, agentic workflows, and user action into one premium market interface.</p>
      </div>
      <div className="hoga-capability-grid">
        {capabilities.map(([title,copy,Icon],i)=><article key={title} className="hoga-capability-card">
          <div className="hoga-card-index">0{i+1}</div><Icon size={22}/><h3>{title}</h3><p>{copy}</p>
        </article>)}
      </div>
    </section>

    <section className="hoga-section hoga-shell hoga-activity-section">
      <div className="hoga-section-head compact"><div><p className="hoga-kicker">LIVE ACTIVITY</p><h2>Markets in motion.</h2></div><p>Designed around live operational signals rather than decorative dashboards.</p></div>
      <div className="hoga-metric-grid">
        {[['LIVE','MARKET SIGNALS'],['CONNECTED','WEB + TELEGRAM'],['AUTONOMOUS','AGENTIC WORKFLOWS'],['ACTIVE','DISCOVERY LAYER']].map(([big,label],idx)=><div className="hoga-metric-card" key={label}>
          <div className={`metric-accent metric-accent-${idx+1}`}/><strong>{big}</strong><span>{label}</span><div className="hoga-bars">{Array.from({length:18}).map((_,i)=><i key={i} style={{height:`${24+((i*13+idx*11)%68)}%`}}/>)}</div>
        </div>)}
      </div>
    </section>

    <section className="hoga-section hoga-shell hoga-flow-section">
      <div className="hoga-section-head"><div><p className="hoga-kicker">WEB + TELEGRAM</p><h2>Discover once.<br/>Act from anywhere.</h2></div><p>Use HOGA on the web, bring it into Telegram, and route repeatable tasks through agentic workflows.</p></div>
      <div className="hoga-flow">
        {flow.map((item,i)=><div key={item}><span>0{i+1}</span><strong>{item}</strong>{i<flow.length-1&&<ArrowRight size={18}/>}</div>)}
      </div>
    </section>

    <section className="hoga-terminal-section" id="resources">
      <div className="hoga-shell hoga-terminal-wrap">
        <div className="hoga-section-head light"><div><p className="hoga-kicker">HOGA TERMINAL</p><h2>Signal density without interface noise.</h2></div><p>A serious working surface for watchlists, market panels, signal cards, agent actions, and active workflows.</p></div>
        <div className="hoga-terminal">
          <aside><div className="terminal-brand">HOGA</div>{['Overview','Signals','Markets','Agents','Workflows','Telegram'].map((x,i)=><div key={x} className={i===0?'active':''}>{x}</div>)}</aside>
          <div className="terminal-main">
            <div className="terminal-top"><span>MARKET OVERVIEW</span><span>LIVE · 14:32:08</span></div>
            <div className="terminal-grid">
              <div className="terminal-panel wide"><p>OPPORTUNITY FEED</p>{['BTC momentum expands','Prediction volume accelerating','AI sector rotation detected','Telegram community spike'].map((x,i)=><div className="terminal-signal" key={x}><b>0{i+1}</b><span>{x}</span><small>{['HIGH','MED','HIGH','MED'][i]}</small></div>)}</div>
              <div className="terminal-panel"><p>AGENT STATUS</p><strong>4 ACTIVE</strong><span>Research · Signals · Routing · Alerts</span></div>
              <div className="terminal-panel"><p>WORKFLOWS</p><strong>12</strong><span>8 running · 4 ready</span></div>
              <div className="terminal-panel chart"><p>MARKET ACTIVITY</p><div className="terminal-chart">{Array.from({length:30}).map((_,i)=><i key={i} style={{height:`${18+((i*17)%76)}%`}}/>)}</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="hoga-section hoga-shell" id="community">
      <div className="hoga-section-head"><div><p className="hoga-kicker">ECOSYSTEM</p><h2>Independent businesses.<br/>Ready to work.</h2></div><p>HOGA already supports published AI businesses and autonomous service flows across the existing product.</p></div>
      <div className="hoga-business-grid">
        {businesses.length?businesses.map(b=><Link href={`/b/${b.slug}`} className="hoga-business-card" key={b.id}><span>{b.category||'AI BUSINESS'}</span><h3>{b.name}</h3><p>{b.shortDescription||b.description}</p><div><small>{b.services.length?`${b.services.length} active service${b.services.length>1?'s':''}`:'Published business'}</small><ArrowUpRight size={18}/></div></Link>):<div className="hoga-empty-businesses">No published businesses yet.</div>}
      </div>
    </section>

    <section className="hoga-developer-section hoga-shell">
      <div className="hoga-section-head"><div><p className="hoga-kicker"><Code2 size={15}/> DEVELOPERS</p><h2>Simple integration.<br/>Built for automation.</h2></div><p>Connect APIs, agents, and workflows without rebuilding your entire stack.</p></div>
      <div className="hoga-code-card"><div className="hoga-code-tabs"><b>QUICK START</b><span>API</span><span>AGENTS</span><span>WORKFLOWS</span></div><pre><code>{`const hoga = new Hoga({ apiKey: process.env.HOGA_API_KEY });\n\nconst signal = await hoga.signals.discover({\n  market: "prediction-markets",\n  mode: "live",\n});\n\nawait hoga.workflows.run(signal);`}</code></pre></div>
    </section>

    <section className="hoga-final-cta hoga-shell">
      <p className="hoga-kicker">HOGA</p><h2>DISCOVER SIGNALS FASTER.<br/>MOVE WITH CONTEXT.</h2><p>Market intelligence, agentic workflows, and connected execution from one interface.</p><div className="hoga-cta-row"><Link href="/dashboard" className="hoga-primary-cta">START USING HOGA <ArrowUpRight size={18}/></Link><Link href="/marketplace" className="hoga-secondary-cta">EXPLORE ECOSYSTEM</Link></div>
    </section>
  </main>;
}
