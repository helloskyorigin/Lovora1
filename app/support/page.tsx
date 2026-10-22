import type {Metadata} from "next";
import Link from "next/link";
import {PolicyLayout} from "@/components/PolicyLayout";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Support · LOVORA"};
export default function SupportPage(){
 const email=process.env.LOVORA_SUPPORT_EMAIL;
 return <PolicyLayout eyebrow="WE'RE HERE TO HELP" title="Support">
 <section><h2>Need your purchased report?</h2><p>Use the secure email recovery flow first. Enter the same address you used at checkout. The recovery link expires after 15 minutes and can only be used once.</p><p><Link href="/recover">Recover My Story ↗</Link></p></section>
 <section><h2>Payment or technical question?</h2><p>Please include the email used at checkout, the approximate transaction date and the issue you encountered. Do not send your payment card number, bank password, API secrets or full birth details by email.</p>
 {email?<p>Contact: <a href={"mailto:"+email}>{email}</a></p>:<p>Support email has not been published yet. Payments must remain disabled until an operator-supported contact address is configured.</p>}</section>
 <section><h2>Understanding your report</h2><p>The report is based on traditional symbolic astrology. Its interpretations and Dasha associations do not guarantee real-life marriage outcomes or dates. Visit the Terms, Privacy and Refund pages for more information.</p></section>
 </PolicyLayout>;
}
