import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {cleanDraft,esc,limits,publicContent} from '../src/common.js';
import {parseCvText,applyCvSelection,importFields} from '../src/cv-import-model.js';
const cvImporter=(await readFile(new URL('../src/cv-import.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/export /g,'');
const workspace=(await readFile(new URL('../src/workspace.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/export /g,'');
const renderer=await readFile(new URL('../profile-renderer.js',import.meta.url),'utf8');
async function fixture(path,{guest=false,admin=false}={}){
 const dom=new JSDOM('<!doctype html><body><header><button id="home">البداية</button></header><main id="app"></main><section id="account-draft"></section></body>',{url:'https://athar.test'+path,runScripts:'outside-only'});
 const win=dom.window;win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
 const state={account:{user:guest?null:{id:'user-one'},ready:true,busy:false,message:'جاهز',remote:null,version:0,profile:null},draft:cleanDraft({name:'سارة',work:'نبذة عن عملي وخبراتي',education:'إدارة الأعمال',skills:'التواصل، التنظيم',email:'private@example.invalid'}),photo:''};
 const calls={admin:0,saves:0,feedback:[]};const stats={users:3,drafts:2,published:1,suggestions:0};
 const db={async rpc(name){if(name==='athar_is_admin')return {data:admin,error:null};calls.admin++;return {data:{stats,users:[],profiles:[],suggestions:[]},error:null}},from(table){assert.equal(table,'athar_suggestions');return {select(){return this},eq(){return this},order(){return this},limit:async()=>({data:calls.feedback,error:null}),insert:async value=>{calls.feedback.push({id:'suggestion-one',...value,status:'new',reply:'',created_at:new Date().toISOString()});return {error:null}}}}};
 Object.assign(win,{cleanDraft,esc,limits,publicContent,db,parseCvText,applyCvSelection,importFields});win.eval(renderer);win.eval(cvImporter);win.eval(workspace);
 const api={state:()=>state,setDraft:d=>{state.draft=d},save:()=>true,capture(){},go(){},auth(){},signout(){},saveAccount:async()=>{calls.saves++;return true},loadAccount(){},publish(){},unpublish(){},exportCv(){},uploadPhoto(){},removePhoto(){}};
 win.render=()=>{};win.initWorkspace(api);await settle();return {win,doc:win.document,state,calls,close:()=>dom.window.close()};
}
async function settle(){for(let i=0;i<8;i++)await Promise.resolve()}
function click(f,selector){f.doc.querySelector(selector).click()}
test('editor changes survive navigation and save; layout preferences reach public output',async()=>{
 const f=await fixture('/edit');try{
 const name=f.doc.getElementById('edit-name');name.value='سارة المعدّلة';name.dispatchEvent(new f.win.Event('input',{bubbles:true}));assert.equal(f.state.draft.name,'سارة المعدّلة');
 click(f,'#add-experience');const role=f.doc.querySelector('[data-key="role"]');role.value='منسقة خدمة';role.dispatchEvent(new f.win.Event('input',{bubbles:true}));assert.equal(f.state.draft.experiences[0].role,'منسقة خدمة');
 f.doc.getElementById('editor-form').dispatchEvent(new f.win.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.equal(f.calls.saves,1);
 click(f,'a[href="/design"]');assert.equal(f.win.location.pathname,'/design');
 for(const [key,value] of [['layout','minimal'],['theme','navy'],['font','arial'],['density','compact'],['sectionOrder','story-first']]){const radio=f.doc.querySelector(`input[name="${key}"][value="${value}"]`);radio.checked=true;radio.dispatchEvent(new f.win.Event('change',{bubbles:true}));assert.equal(f.state.draft[key],value)}
 assert.ok(f.doc.querySelector('#design-live-preview .layout-minimal.font-arial.theme-navy.density-compact.order-story-first'));
 const published=publicContent(f.state.draft);assert.equal(published.layout,'minimal');assert.equal(published.font,'arial');assert.equal(published.email,undefined);
 click(f,'a[href="/edit"]');assert.equal(f.doc.getElementById('edit-name').value,'سارة المعدّلة');assert.equal(f.doc.querySelector('[data-key="role"]').value,'منسقة خدمة');
 }finally{f.close()}
});
test('guests cannot open editors or trigger admin data requests; login controls all work',async()=>{
 const f=await fixture('/admin',{guest:true});try{assert.equal(f.calls.admin,0);assert.equal(f.doc.getElementById('admin-content'),null);assert.equal(f.doc.getElementById('editor-form'),null);const buttons=[...f.doc.querySelectorAll('[data-action="workspace-login"]')];assert.equal(buttons.length,2);for(const b of buttons)assert.equal(typeof b.onclick,'function')}finally{f.close()}
});
test('ordinary account sees permission message and never requests admin data',async()=>{const f=await fixture('/admin');try{assert.match(f.doc.body.textContent,/لا يملك صلاحية الإدارة/);assert.equal(f.calls.admin,0)}finally{f.close()}});
test('admin dashboard uses real response shape and links to management',async()=>{const f=await fixture('/admin/overview',{admin:true});try{assert.equal(f.calls.admin,1);assert.equal(f.doc.querySelectorAll('.admin-stats article').length,4);click(f,'a[href="/admin"]');assert.ok(f.doc.getElementById('admin-search'));assert.equal(f.doc.querySelectorAll('#admin-users tr').length,1)}finally{f.close()}});
test('suggestion submission persists under account ID and renders private history',async()=>{const f=await fixture('/suggestions');try{f.doc.getElementById('feedback-message').value='أقترح تحسين ترتيب أقسام الصفحة';f.doc.getElementById('feedback-form').dispatchEvent(new f.win.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.equal(f.calls.feedback.length,1);assert.equal(f.calls.feedback[0].user_id,'user-one');assert.match(f.doc.getElementById('feedback-list').textContent,/تحسين ترتيب/);assert.match(f.doc.getElementById('feedback-status').textContent,/وصلتنا/)}finally{f.close()}});
test('presentation values cannot inject attributes and unsupported values fall back',()=>{const d=cleanDraft({layout:'"><script>',font:'comic',density:'bad',sectionOrder:'bad',headline:'عنوان مهني'});assert.equal(d.layout,'classic');assert.equal(d.font,'tahoma');assert.equal(d.density,'comfortable');assert.equal(d.sectionOrder,'experience-first');assert.equal(publicContent(d).headline,'عنوان مهني')});
test('CV import reviews fields and requires explicit consent before replacing existing information',async()=>{
 const f=await fixture('/import-cv');try{
 const text='الاسم: أحمد علي\nالنبذة\nأعمل على متابعة الطلبات وخدمة العملاء.\nالخبرات\nمنسق خدمة عملاء\nتابعت الطلبات اليومية مع الفريق\nالتعليم\nبكالوريوس إدارة\nالمهارات\nتنظيم، تواصل\nمعلومات التواصل\nnew@example.invalid\n0501234567';
 f.doc.getElementById('cv-paste').value=text;click(f,'#cv-parse-text');assert.ok(f.doc.getElementById('cv-review-form'));assert.equal(f.doc.querySelector('[data-import-select="name"]').checked,false);
 const name=f.doc.querySelector('[data-import-select="name"]');name.checked=true;name.dispatchEvent(new f.win.Event('change',{bubbles:true}));
 f.doc.getElementById('cv-review-form').dispatchEvent(new f.win.Event('submit',{bubbles:true,cancelable:true}));assert.equal(f.state.draft.name,'سارة');assert.match(f.doc.getElementById('cv-import-error').textContent,/موافقتك/);
 f.doc.getElementById('cv-overwrite').checked=true;f.doc.getElementById('cv-review-form').dispatchEvent(new f.win.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(f.state.draft.name,'أحمد علي');assert.equal(f.state.draft.email,'private@example.invalid');assert.equal(f.state.draft.phone,'0501234567');assert.equal(f.state.draft.experiences[0].role,'منسق خدمة عملاء');assert.match(f.doc.body.textContent,/لم تُنشر المعلومات/);
 }finally{f.close()}
});

test('guest can customize and restore a portfolio without opening account-only editors or publishing',async()=>{
 const f=await fixture('/design',{guest:true});try{
  assert.ok(f.doc.getElementById('design-live-preview'));assert.ok(f.doc.getElementById('design-save-local'));assert.equal(f.doc.getElementById('editor-form'),null);
  for(const [key,value]of [['layout','portfolio-light'],['theme','navy'],['density','compact'],['sectionOrder','story-first']]){
   const input=f.doc.querySelector(`input[name="${key}"][value="${value}"]`);assert.ok(input);input.checked=true;input.dispatchEvent(new f.win.Event('change',{bubbles:true}));assert.equal(f.state.draft[key],value);
  }
  assert.ok(f.doc.querySelector('.portfolio-page.layout-portfolio-light.theme-navy.density-compact'));click(f,'#design-save-local');assert.match(f.doc.getElementById('design-local-status').textContent,/لم تُنشر/);assert.equal(f.calls.saves,0);
  click(f,'a[href="/my-profile"]');assert.ok(f.doc.getElementById('workspace-publish'));assert.ok(f.doc.querySelector('.portfolio-page'));assert.equal(f.doc.querySelector('.guest-card'),null);
  click(f,'a[href="/design"]');assert.equal(f.doc.querySelector('input[name="layout"][value="portfolio-light"]').checked,true);
 }finally{f.close()}
});

test('English editor saves an independent translation and preserves it through design navigation',async()=>{
 const f=await fixture('/design',{guest:true});try{
  assert.ok(f.doc.getElementById('english-profile-form'));const arabicName=f.state.draft.name;
  const name=f.doc.getElementById('english-name');name.value='Sara Reviewed';name.dispatchEvent(new f.win.Event('input',{bubbles:true}));assert.equal(f.state.draft.english.name,'Sara Reviewed');assert.equal(f.state.draft.name,arabicName);
  click(f,'#add-english-experience');const role=f.doc.querySelector('[data-en-exp="0"][data-en-key="role"]');role.value='Operations Coordinator';role.dispatchEvent(new f.win.Event('input',{bubbles:true}));assert.equal(f.state.draft.english.experiences[0].role,'Operations Coordinator');assert.equal(f.state.draft.experiences.length,0);
  f.doc.getElementById('english-profile-form').dispatchEvent(new f.win.Event('submit',{bubbles:true,cancelable:true}));assert.match(f.doc.getElementById('english-save-status').textContent,/Nothing has been published/);assert.equal(f.calls.saves,0);
  click(f,'a[href="/my-profile"]');click(f,'a[href="/design"]');assert.equal(f.doc.getElementById('english-name').value,'Sara Reviewed');
 }finally{f.close()}
});
