import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readCvFile} from '../src/cv-reader.js';
import {parseCvText,applyCvSelection} from '../src/cv-import-model.js';
const base=new URL('./fixtures/cv-audit/',import.meta.url);
const {cases}=JSON.parse(await readFile(new URL('cases.json',base),'utf8'));
for(const fixture of cases)test(`synthetic ${fixture.id} DOCX keeps source facts through extraction and review`,async()=>{
 const bytes=await readFile(new URL(fixture.id+'.docx',base));
 const text=await readCvFile(new File([bytes],fixture.id+'.docx'));
 const {proposed}=parseCvText(text);
 assert.equal(proposed.name,fixture.name);assert.equal(proposed.headline,fixture.title);
 assert.equal(proposed.work,fixture.summary);assert.equal(proposed.education,fixture.education);
 assert.equal(proposed.skills,fixture.skills);
 if(!fixture.role)assert.deepEqual(proposed.experiences,[]);
 else {assert.equal(proposed.experiences[0].role,fixture.role);assert.equal(proposed.experiences[0].description,fixture.detail)}
 if(fixture.id==='long-expert')assert.throws(()=>applyCvSelection({},proposed,['experiences']),/اختصره/);
});
