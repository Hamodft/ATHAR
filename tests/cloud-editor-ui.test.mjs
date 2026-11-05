import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {esc,cleanDraft} from '../src/common.js';
import {reviewItems,applyReviewed} from '../src/professional-review.js';
const source=(await readFile(new URL('../src/cloud-editor.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/export /g,'');
const tick=()=>new Promise(r=>setImmediate(r));
async function setup({loggedIn=true,reply,ready=true}={}){
 const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only'}),w=dom.window;Object.assign(w,{esc,cleanDraft,AbortController,AbortSignal});w.eval(source);
 let draft=cleanDraft({name:'Private Name',work:'  أتابع الطلبات في Excel.  ',email:'private@example.invalid'}),calls=[];
 const fetchImpl=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url==='/api/config'?{externalGeneration:ready,provider:'cloudflare'}:reply||{original:draft.work,suggestion:'أتابع طلبات العملاء باستخدام Excel.',reason:'توضيح الوصف.',question:'',reviewRequired:true,provider:'cloudflare'}}};
 const editor=w.createCloudEditor({get:()=>draft,apply:v=>{draft=v}},{reviewItems,applyReviewed},{fetchImpl,getSession:async()=>({data:{session:loggedIn?{access_token:'synthetic'}:null}})});editor.offer(w.document.getElementById('root'));await tick();
 return {w,dom,calls,editor,get:()=>draft,set:v=>{draft=v}};
}
test('nothing sends user text before consent and disabled config stays closed',async()=>{
 const t=await setup({ready:false});assert.equal(t.calls.length,1);assert.equal(t.calls[0].url,'/api/config');assert.equal(t.w.document.querySelector('[data-ai-start]').disabled,true);t.dom.window.close();
});
test('consent, explicit apply and exact undo preserve original and contact fields',async()=>{
 const t=await setup();const d=t.w.document,original=t.get().work;assert.equal(d.querySelector('[data-ai-start]').disabled,true);
 d.querySelector('[data-ai-consent]').click();d.querySelector('[data-ai-start]').click();await tick();
 assert.equal(t.get().work,original);assert.equal(t.calls.length,2);assert.ok(!t.calls[1].options.body.includes('Private Name'));assert.ok(!t.calls[1].options.body.includes('private@example'));
 assert.equal(d.querySelector('[data-ai-apply]').disabled,true);d.querySelector('[data-ai-reviewed]').click();d.querySelector('[data-ai-apply]').click();assert.equal(t.get().work,'أتابع طلبات العملاء باستخدام Excel.');
 d.querySelector('[data-ai-undo]').click();assert.equal(t.get().work,original);assert.equal(t.get().email,'private@example.invalid');t.dom.window.close();
});
test('unauthenticated request sends no text to server',async()=>{
 const t=await setup({loggedIn:false});const d=t.w.document;d.querySelector('[data-ai-consent]').click();d.querySelector('[data-ai-start]').click();await tick();assert.equal(t.calls.length,1);assert.match(d.querySelector('[data-ai-status]').textContent,/سجّل دخولك/);t.dom.window.close();
});
test('edits made after request are never overwritten by apply',async()=>{
 const t=await setup();const d=t.w.document;d.querySelector('[data-ai-consent]').click();d.querySelector('[data-ai-start]').click();await tick();t.set({...t.get(),work:'تعديل أحدث'});d.querySelector('[data-ai-reviewed]').click();d.querySelector('[data-ai-apply]').click();assert.equal(t.get().work,'تعديل أحدث');assert.match(d.querySelector('[data-ai-status]').textContent,/تغير النص/);t.dom.window.close();
});
