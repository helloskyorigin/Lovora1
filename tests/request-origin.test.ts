import test from "node:test";
import assert from "node:assert/strict";
import {isSameOriginRequest} from "../lib/request-origin";
const req=(url:string,headers:Record<string,string>)=>new Request(url,{headers});
test("same-origin calls remain accepted",()=>{assert.equal(isSameOriginRequest(req("https://lovora.ai.studio/api/birth-details",{origin:"https://lovora.ai.studio"})),true);});
test("proxy forwarded browser host remains valid",()=>{assert.equal(isSameOriginRequest(req("http://localhost:3000/api/birth-details",{origin:"https://aistudio.google.com",host:"localhost:3000","x-forwarded-host":"aistudio.google.com"})),true);});
test("local IPv4 loopback alias stays valid",()=>{assert.equal(isSameOriginRequest(req("http://localhost:3000/api/birth-details",{origin:"http://127.0.0.1:3000",host:"localhost:3000"})),true);});
test("reject cross-site, malformed and spoofed origin",()=>{const url="https://lovora.ai.studio/api/birth-details";for(const h of [{origin:"https://attacker.example",host:"lovora.ai.studio"},{origin:"https://attacker.example",host:"lovora.ai.studio","sec-fetch-site":"cross-site"},{origin:"null",host:"lovora.ai.studio"},{origin:"https://lovora.ai.studio.evil.test",host:"lovora.ai.studio"},{origin:"https://attacker.example",host:"lovora.ai.studio","x-forwarded-host":"attacker.example,evil.test"}])assert.equal(isSameOriginRequest(req(url,h)),false,JSON.stringify(h));});
