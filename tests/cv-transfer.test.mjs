import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTransfer,consumeTransfer,clearTransfers} from '../src/cv-transfer.js';
const id='abcdefab-1234-1234-1234-abcdefabcdef';
function storage(){const m=new Map();return {get length(){return m.size},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
test('CV transfer is single use and leaves the original draft untouched',()=>{const s=storage();s.setItem('athar-draft-v1','original');assert.equal(prepareTransfer(s,{name:'اختبار'},id,100),'/cv#'+id);assert.equal(consumeTransfer(s,id,101).name,'اختبار');assert.throws(()=>consumeTransfer(s,id,102));assert.equal(s.getItem('athar-draft-v1'),'original')});
test('expired and malformed exports cannot reveal a previous CV',()=>{const s=storage();prepareTransfer(s,{name:'قديم'},id,100);assert.throws(()=>consumeTransfer(s,id,300101));assert.throws(()=>consumeTransfer(s,'bad'));assert.equal(s.length,0)});
test('logout removes pending and legacy CV transfers without deleting drafts',()=>{const s=storage();s.setItem('athar-draft-v1','draft');s.setItem('athar-cv-export-v1','old CV');prepareTransfer(s,{name:'خاص'},id);clearTransfers(s);assert.equal(s.length,1);assert.equal(s.getItem('athar-draft-v1'),'draft')});
