import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {cleanDraft,cleanEnglish,localizedDraft,publicContent,esc} from '../src/common.js';
import {prepareTransfer,consumeTransfer} from '../src/cv-transfer.js';
const renderer=await readFile(new URL('../profile-renderer.js',import.meta.url),'utf8');
const cvCode=(await readFile(new URL('../src/cv.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const base={name:'اسم عربي',work:'نبذة عربية',headline:'مسمى عربي',skills:'تنظيم، تواصل',email:'private@example.invalid',phone:'0500000000',experiences:[{role:'دور عربي',description:'وصف عربي'}],english:{name:'English Name',work:'An English summary',headline:'Operations Coordinator',skills:'Organization, Communication',experiences:[{role:'English role',description:'English contribution'}],email:'hidden@example.invalid',phone:'12345',publishEmail:true}};

test('English content is bounded, sanitized, and cannot introduce contact or publication choices',()=>{
 const d=cleanDraft({...base,english:{...base.english,work:'x'.repeat(4000),unknown:'hidden'}});
 assert.equal(d.english.work.length,3000);assert.equal(d.english.email,undefined);assert.equal(d.english.phone,undefined);assert.equal(d.english.publishEmail,undefined);assert.equal(d.english.unknown,undefined);
 const p=publicContent(d);assert.equal(p.email,undefined);assert.equal(p.phone,undefined);assert.equal(p.english.email,undefined);assert.equal(p.english.name,'English Name');
 const en=localizedDraft(d,'en');assert.equal(en.name,'English Name');assert.equal(en.experiences[0].role,'English role');assert.equal(d.name,'اسم عربي');assert.equal(localizedDraft(d,'ar').work,'نبذة عربية');
 assert.equal(cleanEnglish(null).name,'');assert.equal(publicContent(cleanDraft({})).english,undefined);
});

test('all five templates switch both content and reading direction, and switch back without changing source',()=>{
 const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only'});try{
  dom.window.eval(renderer);const root=dom.window.document.getElementById('root');const before=JSON.stringify(base);
  for(const layout of ['portfolio','portfolio-light','classic','minimal','sidebar']){
   const d=cleanDraft({...base,layout});root.innerHTML=dom.window.AtharRenderer.render(d);dom.window.AtharRenderer.bind(root,d);
   root.querySelector('[data-profile-lang="en"]').click();assert.equal(root.querySelector('article').dir,'ltr');assert.equal(root.querySelector('article').lang,'en');assert.match(root.textContent,/An English summary/);assert.doesNotMatch(root.textContent,/نبذة عربية/);assert.match(root.textContent,/English role/);assert.match(root.textContent,/Experience/);assert.equal(root.querySelector('[data-profile-lang="en"]').getAttribute('aria-pressed'),'true');
   root.querySelector('[data-profile-lang="ar"]').click();assert.equal(root.querySelector('article').dir,'rtl');assert.match(root.textContent,/نبذة عربية/);assert.doesNotMatch(root.textContent,/An English summary/);
  }
  assert.equal(JSON.stringify(base),before);
 }finally{dom.window.close()}
});

test('missing translations are disclosed and hostile translated content remains escaped',()=>{
 const dom=new JSDOM('<main id="root"></main>',{runScripts:'outside-only'});try{
  dom.window.eval(renderer);const root=dom.window.document.getElementById('root');
  const d=cleanDraft({name:'اسم',work:'نبذة أصلية',layout:'portfolio',english:{name:'<img src=x onerror=alert(1)>'}});root.innerHTML=dom.window.AtharRenderer.render(d,'',true,'en');
  assert.ok(root.querySelector('.profile-translation-notice'));assert.match(root.textContent,/نبذة أصلية/);assert.equal(root.querySelector('[onerror]'),null);assert.equal(root.querySelector('.portfolio-introduction p').lang,'ar');assert.equal(root.querySelector('a[href^="mailto:"]'),null);
 }finally{dom.window.close()}
});

test('English print CV uses the reviewed translation and language controls cannot restore it after logout',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 const dom=new JSDOM('<button id="cv-print"></button><button id="cv-lang-ar"></button><button id="cv-lang-en"></button><a id="cv-back"></a><span id="cv-help"></span><main id="cv"></main>',{url:'https://athar.test/cv#'+id,runScripts:'outside-only'});
 try{
  const win=dom.window;Object.assign(win,{esc,cleanDraft,localizedDraft,consumeTransfer});prepareTransfer(win.localStorage,cleanDraft({...base,email:'',phone:''}),id);win.eval(cvCode);
  win.document.getElementById('cv-lang-en').click();assert.equal(win.document.documentElement.dir,'ltr');assert.match(win.document.getElementById('cv').textContent,/English Name|English contribution/);assert.doesNotMatch(win.document.getElementById('cv').textContent,/hidden@example.invalid|نبذة عربية/);
  win.dispatchEvent(new win.StorageEvent('storage',{key:'athar-session-ended'}));win.document.getElementById('cv-lang-ar').click();assert.doesNotMatch(win.document.getElementById('cv').textContent,/English Name|اسم عربي/);assert.equal(win.document.getElementById('cv-lang-en').disabled,true);
 }finally{dom.window.close()}
});

test('a blank English experience still discloses fallback in the print CV',()=>{
 const id='22222222-2222-4222-8222-222222222222';
 const dom=new JSDOM('<button id="cv-print"></button><button id="cv-lang-ar"></button><button id="cv-lang-en"></button><a id="cv-back"></a><span id="cv-help"></span><main id="cv"></main>',{url:'https://athar.test/cv#'+id,runScripts:'outside-only'});
 try{const win=dom.window;Object.assign(win,{esc,cleanDraft,localizedDraft,consumeTransfer});const d=cleanDraft({...base,email:'',phone:'',english:{...base.english,experiences:[{role:'',organization:'',period:'',description:''}]}});prepareTransfer(win.localStorage,d,id);win.eval(cvCode);win.document.getElementById('cv-lang-en').click();assert.match(win.document.getElementById('cv-help').textContent,/not been added/);assert.match(win.document.getElementById('cv').textContent,/دور عربي/)}finally{dom.window.close()}
});
