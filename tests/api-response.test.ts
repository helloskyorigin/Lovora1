import test from "node:test";
import assert from "node:assert/strict";
import {readApiJSON} from "../lib/api-response";
test("HTML fallback yields clear error instead of Unexpected token",async()=>{
 await assert.rejects(()=>readApiJSON(new Response("<!doctype html>",{status:500,headers:{"content-type":"text/html"}}),"City search API unavailable."),/City search API unavailable/);
});
test("valid JSON result is parsed normally",async()=>{
 const result=await readApiJSON<{results:string[]}>(Response.json({results:["Siwan"]}),"error");
 assert.deepEqual(result.results,["Siwan"]);
});

test("non-JSON POST error reports HTTP status instead of raw HTML",async()=>{
 const html=new Response("<html>internal failure</html>",{status:500,headers:{"content-type":"text/html"}});
 await assert.rejects(()=>readApiJSON(html,"Birth API unavailable"),/Birth API unavailable.*HTTP 500/);
});
