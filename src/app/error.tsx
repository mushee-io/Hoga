'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="page-width content"><h1>Something interrupted the work.</h1><p>Please try again. If this continues, check the application and database connection.</p><button className="button" onClick={reset}>Try again</button></main>;}
