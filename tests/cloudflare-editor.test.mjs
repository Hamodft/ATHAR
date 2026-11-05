import test from 'node:test';
import assert from 'node:assert/strict';
import {createRewriteHandler} from '../api/rewrite.js';
import {validateSection,parseSuggestion,rewriteWithCloudflare} from '../server/cloudflare-editor.js';
const env={ATHAR_CLOUDFLARE_REWRITE:'true',ATHAR_AI_FREE_ONLY_CONFIRMED:'true',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_AI_TOKEN:'synthetic-token'};
const body={kind:'work',text:'تابعت ٥ طلبات في Excel. لم أقد فريقًا.',consent:true};
const req={method:'POST',headers:{origin:'https://athar-profile-topaz.vercel.app',authorization:'Bearer synthetic-user'},body};
const ok=data=>({ok:true,json:async()=>data});
const generated=()=>ok({choices:[{finish_reason:'stop',message:{content:JSON.stringify({suggestion:'تابعت ٥ طلبات باستخدام Excel، دون قيادة فريق.',reason:'توضيح الدور.',question:'ما النتيجة؟'})}}]});
async function call(request=req,responses=[],settings=env){let calls=[];let status,payload;await createRewriteHandler({env:settings,fetchImpl:async(url,options)=>{calls.push({url,options});return responses.shift()}})(request,{setHeader(){},status(n){status=n;return this},json(v){payload=v;return this}});return {calls,status,payload};}
test('unconfigured or unconfirmed-free deployments make no outbound request',async()=>{
 for(const settings of [{},{...env,ATHAR_AI_FREE_ONLY_CONFIRMED:'false'},{...env,CLOUDFLARE_AI_TOKEN:''}]){const r=await call(req,[],settings);assert.equal(r.status,410);assert.equal(r.calls.length,0);}
});
test('origin, method, consent, fields and auth are checked before network',async()=>{
 for(const bad of [{...req,method:'GET'},{...req,headers:{...req.headers,origin:'https://other.invalid'}},{...req,body:{...body,consent:false}},{...req,body:{...body,kind:'email'}},{...req,body:{...body,text:'x'.repeat(3001)}},{...req,headers:{origin:req.headers.origin}}]){const r=await call(bad);assert.ok(r.status>=400);assert.equal(r.calls.length,0);}
});
test('expired or unconfirmed user never calls quota or inference',async()=>{
 for(const result of [{ok:false},ok({id:'user'})]){const r=await call(req,[result]);assert.equal(r.status,401);assert.equal(r.calls.length,1);}
});
test('quota denial or database failure cannot fall through to provider',async()=>{
 for(const quota of [ok(false),{ok:false}]){const r=await call(req,[ok({id:'user',email_confirmed_at:'date'}),quota]);assert.ok([429,503].includes(r.status));assert.equal(r.calls.length,2);}
});
test('authenticated request reserves quota then sends only selected section to fixed free model',async()=>{
 const r=await call({...req,body:{...body,name:'SECRET-NAME',phone:'SECRET-PHONE'}},[ok({id:'user',email_confirmed_at:'date'}),ok(true),generated()]);
 assert.equal(r.status,200);assert.equal(r.payload.original,body.text);assert.equal(r.payload.reviewRequired,true);assert.match(r.calls[1].url,/claim_rewrite_quota$/);assert.match(r.calls[2].url,/api.cloudflare.com/);
 const sent=JSON.parse(r.calls[2].options.body);assert.equal(sent.model,'@cf/qwen/qwen3-30b-a3b-fp8');assert.ok(!JSON.stringify(sent).includes('SECRET'));assert.ok(!JSON.stringify(sent).includes('synthetic-user'));
});
test('provider quota failure produces no retry or alternate provider',async()=>{
 const r=await call(req,[ok({id:'user',email_confirmed_at:'date'}),ok(true),{ok:false,status:429}]);assert.equal(r.status,429);assert.equal(r.calls.length,3);assert.equal(r.payload.code,'quota_exhausted');
});
test('malformed and invented numeric claims are rejected while source is preserved',()=>{
 const section=validateSection(body);assert.throws(()=>parseSuggestion('invalid',section));assert.throws(()=>parseSuggestion(JSON.stringify({suggestion:'زادت المبيعات 50٪',reason:'',question:''}),section),{code:'unsupported_number'});
 assert.equal(parseSuggestion(JSON.stringify({suggestion:'تابعت 5 طلبات في Excel دون قيادة فريق.',reason:'',question:''}),section).original,body.text);
});
test('network and truncated responses reveal no secret or raw provider error',async()=>{
 await assert.rejects(rewriteWithCloudflare(validateSection(body),{env,fetchImpl:async()=>{throw Error('synthetic-token raw response')}}),e=>!e.message.includes('synthetic-token'));
 await assert.rejects(rewriteWithCloudflare(validateSection(body),{env,fetchImpl:async()=>ok({choices:[{finish_reason:'length',message:{content:'{}'}}]})}),{code:'invalid_response'});
});
