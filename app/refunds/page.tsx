import type {Metadata} from "next";
import {PolicyLayout} from "@/components/PolicyLayout";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Refund Policy · LOVORA"};
export default function RefundPolicyPage(){return <PolicyLayout eyebrow="CLEAR FROM THE START" title="Refund Policy">
 <section><h2>One-time digital reading</h2><p>The full LOVORA marriage reading is a digital report offered as a single ₹299 purchase. The product is created for the birth details provided and cannot be physically returned.</p></section>
 <section><h2>When to contact us</h2><p>If you were charged twice, the paid report did not unlock after payment confirmation, you received the wrong purchased report, or there was another technical or billing problem, contact support promptly using your checkout receipt email and transaction details (never send full card details).</p><p>Refund and remediation requests are reviewed in accordance with applicable consumer law, payment provider rules and the circumstances of the order. This policy does not remove mandatory legal rights. Refund eligibility is not decided by whether an astrology interpretation matched real-life events.</p></section>
 <section><h2>Refunds and access</h2><p>When a refund or payment reversal is confirmed by the payment provider, access to the related premium report may be revoked. If support is not yet configured, live checkout must remain disabled.</p></section>
 <section><h2>What happens before launch</h2><p>Merchant approval, operator contact details, documented response procedures, and a review of the final refund terms are required before real-money sales begin. Any refund status will ultimately be determined using verified payment-provider records.</p></section>
 </PolicyLayout>}
