import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {cleanDraft,esc} from '../src/common.js';
import {clearTransfers} from '../src/cv-transfer.js';
const source=(await readFile(new URL('../src/platform.js',import.meta.url),'utf8')).replace(/import\s+[^;]+;\s*/g,'').split('if(!data.accountId)window.render();panel();')[0];
function setup(query){
  const records=new Map(),elements=new Map();
  const context=vm.createContext({data:cleanDraft({}),step:0,cleanDraft,esc,clearTransfers,render(){},save(){},capture(){},go(){},
    localStorage:{get length(){return records.size},key:i=>[...records.keys()][i],getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)},
    document:{getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:''});return elements.get(id)},querySelectorAll:()=>[],querySelector:()=>null},
    db:{from(table){return {select(){return this},eq(key,id){this.id=id;return this},maybeSingle(){return query(table,this.id)}}}},
  });context.go=n=>{context.step=n};context.window=context;vm.runInContext(source,context);return context;
}
test('expired session clears the visible owned draft and pending CV without deleting its backup',async()=>{
  const c=setup(async()=>({data:null}));vm.runInContext("account.user={id:'owner'};data={...cleanDraft({name:'Private person'}),accountId:'owner'}",c);
  c.localStorage.setItem('athar-cv-transfer-test','private CV');await c.syncAccount(null);
  assert.equal(c.data.name,'');assert.equal(c.atharPhotoUrl,'');assert.equal(c.localStorage.getItem('athar-cv-transfer-test'),null);
  assert.equal(JSON.parse(c.localStorage.getItem('athar-draft-account-owner')).name,'Private person');
});
test('late response from an earlier account cannot replace the current account metadata',async()=>{
  let finish;const delayed=new Promise(resolve=>{finish=resolve});
  const c=setup(async(table,id)=>table==='athar_drafts'?(id==='first'?delayed:{data:{data:{name:'Second'},version:2}}):({data:{slug:'second-profile',is_published:false}}));
  const first=c.syncAccount({user:{id:'first'}});await c.syncAccount({user:{id:'second'}});
  finish({data:{data:{name:'First private'},version:99}});await first;
  assert.equal(vm.runInContext('account.user.id',c),'second');assert.equal(vm.runInContext('account.version',c),2);
  assert.equal(vm.runInContext('account.remote.name',c),'Second');
});
