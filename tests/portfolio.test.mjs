import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {cleanDraft,publicContent} from '../src/common.js';

const renderer=await readFile(new URL('../profile-renderer.js',import.meta.url),'utf8');
function fixture(){const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only',url:'https://athar.test'});dom.window.eval(renderer);return dom}

test('portfolio publishes approved contact only, preserves settings, and every navigation target exists',()=>{
 const dom=fixture();try{
  const draft=cleanDraft({name:'شخص تجريبي',headline:'تنسيق العمليات',work:'نبذة حقيقية',layout:'portfolio-light',theme:'navy',font:'arial',density:'compact',sectionOrder:'story-first',email:'private@example.invalid',phone:'0500000000',publishEmail:true,experiences:[{role:'دور تجريبي',organization:'جهة',period:'٢٠٢٥',description:'وصف'}],skills:'Excel، التنظيم',education:'تعليم',courses:'دورة',moment:'موقف'});
  const output=publicContent(draft);dom.window.document.body.innerHTML=dom.window.AtharRenderer.render(output,'',true);
  const doc=dom.window.document;assert.ok(doc.querySelector('.portfolio-page.layout-portfolio-light.theme-navy.font-arial.density-compact'));
  assert.ok(doc.querySelector('a[href="mailto:private%40example.invalid"]'));assert.doesNotMatch(doc.body.textContent,/0500000000/);
  assert.ok(doc.body.innerHTML.indexOf('id="profile-story"')<doc.body.innerHTML.indexOf('id="profile-experience"'));
  for(const a of doc.querySelectorAll('a[href^="#"]'))assert.ok(doc.getElementById(a.getAttribute('href').slice(1)),a.outerHTML);
 }finally{dom.window.close()}
});

test('portfolio escapes hostile text, hides empty sections, and never promotes a goal or role into the headline',()=>{
 const dom=fixture();try{
  const d=cleanDraft({name:'<img src=x onerror=alert(1)>',work:'نص <script>bad()</script>',goal:'ألقى فرصة عمل',layout:'portfolio',experiences:[{role:'دور قديم',description:'وصف'}]});
  dom.window.document.body.innerHTML=dom.window.AtharRenderer.render(d,'',true);const doc=dom.window.document;
  assert.equal(doc.querySelector('script'),null);assert.equal(doc.querySelector('[onerror]'),null);assert.equal(doc.querySelector('.portfolio-headline'),null);assert.equal(doc.querySelector('#profile-contact'),null);assert.equal(doc.querySelector('#profile-skills'),null);assert.doesNotMatch(doc.querySelector('.portfolio-hero').textContent,/ألقى فرصة عمل|دور قديم/);
 }finally{dom.window.close()}
});

test('long experience details work with native disclosure; existing layouts and exports remain supported',()=>{
 const dom=fixture();try{
  const text='تابعت مهام الفريق وراجعت المعلومات. '.repeat(20);
  const d=cleanDraft({name:'تجربة',layout:'portfolio',work:'نبذة',experiences:[{role:'منسقة',description:text}]});
  dom.window.document.body.innerHTML=dom.window.AtharRenderer.render(d);const details=dom.window.document.querySelector('details');assert.ok(details);assert.equal(details.querySelector('.portfolio-detail p').textContent,text);assert.equal(details.open,false);details.open=true;assert.equal(details.open,true);
  for(const layout of ['classic','minimal','sidebar','portfolio','portfolio-light'])assert.equal(publicContent(cleanDraft({...d,layout})).layout,layout);
  assert.equal(cleanDraft({layout:'invalid'}).layout,'classic');assert.equal(cleanDraft({}).layout,'portfolio');
 }finally{dom.window.close()}
});

test('private preview explicitly labels contact and exposes no contact actions',()=>{
 const dom=fixture();try{const d=cleanDraft({layout:'portfolio',email:'private@example.invalid',phone:'0500000000'});dom.window.document.body.innerHTML=dom.window.AtharRenderer.render(d,'',false);assert.ok(dom.window.document.querySelector('.portfolio-private'));assert.equal(dom.window.document.querySelector('a[href^="mailto:"]'),null);assert.equal(dom.window.document.querySelector('#profile-contact'),null)}finally{dom.window.close()}
});
