import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCvText,applyCvSelection,validateDocxArchive} from '../src/cv-import-model.js';
import {cleanDraft} from '../src/common.js';
test('Arabic headings with diacritics and explicit contact values are extracted without inventing fields',()=>{
 const result=parseCvText('الاسم: أحمد علي\nالنُّبذة\nمتابعة الطلبات وخدمة العملاء.\nالمهارات\nتنظيم\nتواصل\nمعلومات التواصل\nالمدينة: الرياض\nالبريد: user@example.com\n٠٥٠١٢٣٤٥٦٧');
 assert.equal(result.proposed.name,'أحمد علي');assert.equal(result.proposed.work,'متابعة الطلبات وخدمة العملاء.');assert.equal(result.proposed.skills,'تنظيم\nتواصل');assert.equal(result.proposed.email,'user@example.com');assert.equal(result.proposed.phone,'0501234567');assert.equal(result.proposed.city,'الرياض');assert.deepEqual(result.proposed.experiences,[]);assert.equal(result.proposed.education,'');
});
test('selection keeps all other fields and privacy preferences; experiences append unless replaced',()=>{
 const existing=cleanDraft({name:'Old name',theme:'navy',layout:'minimal',publishEmail:false,email:'private@example.com',experiences:[{role:'Original'}]});const incoming=cleanDraft({name:'New name',email:'other@example.com',experiences:[{role:'Imported'}]});
 const next=applyCvSelection(existing,incoming,['name','experiences']);assert.equal(next.name,'New name');assert.equal(next.email,existing.email);assert.equal(next.publishEmail,false);assert.equal(next.theme,'navy');assert.equal(next.layout,'minimal');assert.equal(next.experiences.length,2);assert.equal(existing.experiences.length,1);assert.equal(applyCvSelection(existing,incoming,['experiences'],'replace').experiences[0].role,'Imported');
});
test('too many imported experiences are rejected rather than silently discarding existing roles',()=>{const existing=cleanDraft({experiences:Array.from({length:10},()=>({role:'Role'}))});assert.throws(()=>applyCvSelection(existing,{experiences:[{role:'New'}]},['experiences']),/experience-limit/)});
test('arbitrary text is kept as source without fabricating a professional summary or education',()=>{const text='This is arbitrary text without CV headings, qualifications or a name.';const result=parseCvText(text);assert.equal(result.raw,text);assert.equal(result.proposed.work,'');assert.equal(result.proposed.education,'');assert.equal(result.proposed.name,'')});
test('malformed and oversized DOCX archives are rejected before expansion',()=>{assert.throws(()=>validateDocxArchive(new ArrayBuffer(40)),/invalid-docx/);const buf=new ArrayBuffer(68),v=new DataView(buf);v.setUint32(0,0x02014b50,true);v.setUint32(24,30*1024*1024,true);v.setUint32(46,0x06054b50,true);v.setUint16(56,1,true);v.setUint32(62,0,true);assert.throws(()=>validateDocxArchive(buf),/archive-limit/)});
