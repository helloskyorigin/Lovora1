import test from "node:test";
import assert from "node:assert/strict";
import {normalizeEmail,emailIndexKey,tokenKey,createRecoveryToken,recoveryLink,RECOVERY_TTL_SECONDS} from "../lib/recovery/token";
import {localizeReport} from "../lib/report/localize";
import {sampleReport} from "../lib/report/sample";

test("recovery validates emails, preserves privacy and normalizes case",()=>{
 assert.equal(normalizeEmail("  BUYER@Example.COM "),"buyer@example.com");
 assert.equal(normalizeEmail("missing-at-example.com"),null);
 assert.equal(normalizeEmail(""),null);
});
test("recovery token is a 256-bit opaque, fixed-length secret",()=>{
 const a=createRecoveryToken(),b=createRecoveryToken();
 assert.match(a,/^[A-Za-z0-9_-]{43}$/);
 assert.notEqual(a,b);
 assert.notEqual(tokenKey(a),tokenKey(b));
 assert.equal(tokenKey("bad"),null);
 assert.equal(RECOVERY_TTL_SECONDS,900);
});
test("email lookup key does not contain plaintext address",()=>{
 process.env.REPORT_ENCRYPTION_SECRET="a".repeat(64);
 const a=emailIndexKey("buyer@example.com"),b=emailIndexKey("other@example.com");
 assert.notEqual(a,b);
 assert.ok(!a.includes("@")&&!a.includes("buyer"));
 assert.equal(a,emailIndexKey("buyer@example.com"));
});
test("recovery links reject non-HTTPS production origins",()=>{
 const original=process.env.LOVORA_BASE_URL;
 try{
  process.env.LOVORA_BASE_URL="https://lovora.example";
  assert.equal(recoveryLink("A".repeat(43)),"https://lovora.example/recover/verify?token="+"A".repeat(43));
  process.env.LOVORA_BASE_URL="javascript:alert(1)";
  assert.throws(()=>recoveryLink("A".repeat(43)),/RECOVERY_ORIGIN_INVALID/);
 }finally{
  if(original===undefined)delete process.env.LOVORA_BASE_URL;else process.env.LOVORA_BASE_URL=original;
 }
});
test("all seven chapters, evidence and disclosures have Hindi versions",()=>{
 const source=sampleReport(),view=localizeReport(source,"hi");
 assert.equal(view.chapters.length,7);
 assert.equal(view.chart.rising,source.chart.rising);
 assert.equal(view.person.birthDate,source.person.birthDate);
 assert.equal(view.evidence.length,source.evidence.length);
 assert.equal(view.source.provider,"Prokerala");
 for(const ch of view.chapters){
  assert.ok(ch.paragraphs.length>=2);
  assert.ok(ch.paragraphs.every(p=>/[\u0900-\u097F]/.test(p)));
  assert.ok(/[\u0900-\u097F]/.test(ch.title));
 }
 assert.ok(/[\u0900-\u097F]/.test(view.disclaimer));
 assert.equal(localizeReport(source,"en"),source);
});
