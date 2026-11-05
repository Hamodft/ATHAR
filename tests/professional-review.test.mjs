import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewItems,applyReviewed} from '../src/professional-review.js';
import disabledRewrite from '../api/rewrite.js';
import {reviewText,profilePrompts} from '../src/local-review.js';
import {cleanDraft} from '../src/common.js';
import {esc} from '../src/common.js';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
test('professional review sends only writing sections, not contact or identity data',()=>{
 const d=cleanDraft({name:'Private Name',work:'I tracked requests.',email:'private@example.invalid',phone:'0501234567',education:'Original qualification',experiences:[{role:'Original role',organization:'Private company',description:'I updated a log.'}]});
 const items=reviewItems(d);assert.deepEqual(items.map(x=>x.id),['work','experiences.0.description']);assert.ok(!JSON.stringify(items).includes(d.email));assert.ok(!JSON.stringify(items).includes(d.name));
 const next=applyReviewed(d,d,[{id:'work',suggestion:'I maintained the request log.'}]);assert.equal(d.work,'I tracked requests.');assert.equal(next.education,d.education);assert.equal(next.email,d.email);
 assert.throws(()=>applyReviewed({...d,work:'A newer edit'},d,[{id:'work',suggestion:'Suggestion'}]),/تغير النص/);
});
test('local guidance preserves facts and leaves missing outcomes as questions',()=>{
 const text='  تابعت  5 طلبات في Excel.\nتابعت  5 طلبات في Excel.  ';
 const r=reviewText(text);assert.equal(r.suggestion,'تابعت 5 طلبات في Excel.');assert.ok(r.changed);assert.ok(r.question);assert.equal(r.suggestion.includes('50'),false);
 const english=reviewText('I maintained the customer request log and documented the next action with the team.');assert.match(english.question,/What changed/);assert.equal(english.changed,false);
 assert.ok(profilePrompts(cleanDraft({work:'My work'})).length);assert.ok(profilePrompts(cleanDraft({work:'Same',moment:'Same'})).some(x=>x.includes('متطابقان')));
});
test('old rewrite endpoint cannot generate or spend even when called directly',()=>{
 let status;let payload;disabledRewrite({method:'POST'},{setHeader(){},status(v){status=v;return this},json(v){payload=v}});assert.equal(status,410);assert.equal(payload.code,'local_review_only');
});
test('local review works without fetch and applies only reviewed edits with undo',async()=>{
 const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only'});const w=dom.window;
 const source=(await readFile(new URL('../src/professional-review.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/export /g,'');
 let draft=cleanDraft({name:'Test Person',work:'  I  track requests.  '});w.fetch=()=>{throw Error('Network must not be used')};Object.assign(w,{esc,cleanDraft,reviewText,profilePrompts,createCloudEditor:()=>({offer(){},clear(){}})});w.eval(source);
 const review=w.createProfessionalReview({get:()=>draft,apply:next=>{draft=next}});review.offer(w.document.getElementById('root'));w.document.querySelector('[data-review-start]').click();
 assert.match(w.document.body.textContent,/ليست توليدًا/);assert.equal(draft.work,'  I  track requests.  ');
 w.document.querySelector('[data-review-text]').value='I track customer requests.';w.document.querySelector('[data-review-select]').checked=true;w.document.querySelector('[data-review-apply]').click();assert.equal(draft.work,'I track customer requests.');
 w.document.querySelector('[data-review-undo]').click();assert.equal(draft.work,'  I  track requests.  ');review.clear();assert.equal(w.document.getElementById('professional-review'),null);dom.window.close();
});
