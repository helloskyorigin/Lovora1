import Link from "next/link";
import type {ReactNode} from "react";
import "./policy.css";

export function PolicyLayout({title,eyebrow,children}:{title:string;eyebrow:string;children:ReactNode}){
 const support=process.env.LOVORA_SUPPORT_EMAIL;
 const operator=process.env.LOVORA_OPERATOR_NAME;
 return <main className="policy-page">
  <header className="policy-header"><div className="policy-wrap policy-header__row">
   <Link className="policy-logo" href="/"><span>✦</span> LOVORA</Link>
   <Link href="/recover" className="policy-return">Recover My Story ↗</Link>
  </div></header>
  <section className="policy-hero"><div className="policy-wrap">
   <p className="policy-kicker">✦ {eyebrow}</p><h1>{title}</h1>
   <p>LOVORA · Last reviewed 22 October 2026</p>
  </div></section>
  <div className="policy-wrap policy-body">
   {children}
   <section className="policy-operator">
    <h2>Contact and operator information</h2>
    <p>{operator||"The operating business name must be published before accepting live payments."}</p>
    {support?<p>Support: <a href={"mailto:"+support}>{support}</a></p>:
      <p>Support contact must be configured and published before accepting live payments.</p>}
   </section>
  </div>
  <footer className="policy-footer"><div className="policy-wrap">
    <Link href="/">✦ LOVORA</Link><nav aria-label="Policies">
     <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds</Link><Link href="/support">Support</Link>
    </nav>
   </div></footer>
 </main>;
}
