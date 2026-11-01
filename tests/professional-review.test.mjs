import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewItems,applyReviewed} from '../src/professional-review.js';
import {normalizeRequest,validateResult,credentials} from '../api/rewrite.js';
import {cleanDraft} from '../src/common.js';
test('professional review sends only writing sections, not contact or identity data',()=>{
 const d=cleanDraft({name:'Private Name',work:'I tracked requests.',email:'private@example.invalid',phone:'0501234567',education:'Original qualification',experiences:[{role:'Original role',organization:'Private company',description:'I updated a log.'}]});
 const items=reviewItems(d);assert.deepEqual(items.map(x=>x.id),['work','experiences.0.description']);assert.ok(!JSON.stringify(items).includes(d.email));assert.ok(!JSON.stringify(items).includes(d.name));
 const next=applyReviewed(d,d,[{id:'work',suggestion:'I maintained the request log.'}]);assert.equal(d.work,'I tracked requests.');assert.equal(next.education,d.education);assert.equal(next.email,d.email);
 assert.throws(()=>applyReviewed({...d,work:'A newer edit'},d,[{id:'work',suggestion:'Suggestion'}]),/تغير النص/);
});
test('rewrite API bounds inputs and rejects identity fields, duplicates and invented numbers',()=>{
 assert.throws(()=>normalizeRequest({items:[{id:'email',text:'private'}]}),/invalid_input/);
 assert.throws(()=>normalizeRequest({items:[{id:'work',text:'ok'},{id:'work',text:'again'}]}),/invalid_input/);
 const items=normalizeRequest({field:'work',original:'I tracked 5 requests.'});
 assert.throws(()=>validateResult({items:[{id:'work',suggestion:'I tracked 50 requests.',reason:'Clearer',question:''}]},items),/invalid_output/);
 assert.equal(validateResult({items:[{id:'work',suggestion:'I maintained a log of 5 requests.',reason:'Clearer',question:''}]},items).length,1);
 assert.equal(credentials({VERCEL_OIDC_TOKEN:'test'}).model,'openai/gpt-4.1-mini');assert.equal(credentials({}),null);assert.equal(credentials({}, {'x-vercel-oidc-token':'request-scoped-test-token'}).model,'openai/gpt-4.1-mini');
});
