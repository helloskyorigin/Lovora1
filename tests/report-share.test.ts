import test from "node:test";
import assert from "node:assert/strict";
import {buildShareCopy,STORY_PUBLIC_URL} from "../lib/report/share-copy";
test("default share stays private and links to public home, not paid report",()=>{
 const secret="My secret birth detail 13-Aug-2009 Siwan";
 const result=buildShareCopy({language:"en",includeTheme:false,theme:secret,demo:false});
 assert.equal(result.theme,"");
 assert.ok(!JSON.stringify(result).includes(secret));
 assert.equal(STORY_PUBLIC_URL,"https://lovora.ai.studio/");
 assert.ok(!STORY_PUBLIC_URL.includes("/report"));
});
test("user must opt in to including short reading theme, sample never reveals one",()=>{
 const secret="A symbolic reading theme";
 const included=buildShareCopy({language:"en",includeTheme:true,theme:secret,demo:false});
 assert.equal(included.theme,secret);
 const demo=buildShareCopy({language:"en",includeTheme:true,theme:secret,demo:true});
 assert.equal(demo.theme,"");
 assert.equal(demo.demo,true);
});
test("strips markup and limits optional share snippet",()=>{
 const result=buildShareCopy({language:"hi",includeTheme:true,theme:"<script>hello</script>\n"+"x".repeat(300),demo:false});
 assert.ok(!/[<>]/.test(result.theme));
 assert.ok(result.theme.length<=110);
 assert.equal(result.title,"मेरी प्रेम कहानी");
});
