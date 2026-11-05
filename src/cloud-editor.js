import {esc,cleanDraft} from './common.js';
import {db} from './client.js';
const names={work:'النبذة المهنية',headline:'المسمى التعريفي',moment:'الموقف المهني',momentDetail:'دورك ومساهمتك'};
export function createCloudEditor(api,{reviewItems,applyReviewed},{fetchImpl=(...args)=>fetch(...args),getSession=()=>db.auth.getSession()}={}){
 let controller=null,revision=0;
 const title=id=>names[id]||`وصف الخبرة ${Number(id.split('.')[1])+1}`;
 function clear(){revision++;controller?.abort();controller=null;document.getElementById('cloud-editor')?.remove()}
 function offer(root){
  if(root.querySelector('#cloud-editor')||!reviewItems(api.get()).length)return;
  const node=document.createElement('section');node.id='cloud-editor';node.className='workspace-card rewrite';
  node.innerHTML=`<h2>صياغة مهنية، من كلامك أنت.</h2><p>اختر قسمًا لنقترح له صياغة أوضح بالذكاء الاصطناعي. راجع المعنى والحقائق قبل الاعتماد؛ قد يخطئ الاقتراح. تبقى نسختك الإنجليزية مستقلة.</p><label class="editor-field">القسم الذي تريد صياغته<select data-ai-section>${reviewItems(api.get()).map(item=>`<option value="${esc(item.id)}">${esc(title(item.id))}</option>`).join('')}</select></label><label class="choice"><input type="checkbox" data-ai-consent>أوافق على إرسال نص القسم المختار إلى Cloudflare للصياغة، وقد يتضمن معلومات شخصية.</label><p class="mini">محاولتان للحساب يوميًا ضمن حصة الموقع المجانية. المحاولة تُحتسب عند إرسالها ولو تعذّرت النتيجة. لا يوجد انتقال إلى خدمة مدفوعة.</p><button type="button" class="secondary" data-ai-start disabled>اقترح صياغة مهنية</button><p role="status" data-ai-status>نتحقق من إتاحة الصياغة… المراجعة المحلية متاحة دائمًا.</p><div data-ai-result></div>`;
  root.append(node);let ready=false;const button=node.querySelector('[data-ai-start]'),consent=node.querySelector('[data-ai-consent]'),select=node.querySelector('[data-ai-section]'),status=node.querySelector('[data-ai-status]');
  const version=revision;fetchImpl('/api/config',{signal:AbortSignal.timeout(6000)}).then(r=>r.ok?r.json():{}).then(c=>{if(!node.isConnected||version!==revision)return;ready=c.externalGeneration===true&&c.provider==='cloudflare';button.disabled=!ready||!consent.checked;status.textContent=ready?'الصياغة التجريبية متاحة بعد تسجيل الدخول. راجع كل اقتراح قبل استخدامه.':'الصياغة الخارجية غير متاحة حاليًا. يمكنك متابعة المراجعة المحلية أعلاه.';}).catch(()=>{if(node.isConnected)status.textContent='تعذّر التحقق من إتاحة الصياغة. المراجعة المحلية متاحة.'});
  consent.onchange=()=>{button.disabled=!ready||!consent.checked||!!controller};
  select.onchange=()=>{consent.checked=false;button.disabled=true;node.querySelector('[data-ai-result]').innerHTML=''};
  button.onclick=async()=>{
   if(controller||!ready||!consent.checked)return;
   const snapshot=cleanDraft(api.get()),id=select.value,item=reviewItems(snapshot).find(i=>i.id===id);if(!item)return;
   const resultNode=node.querySelector('[data-ai-result]');resultNode.innerHTML='';const request=new AbortController();controller=request;const active=revision;
   button.disabled=true;select.disabled=true;consent.disabled=true;status.textContent='نجهّز صياغة القسم المختار… نصك الأصلي محفوظ.';
   const timer=setTimeout(()=>request.abort(),35000);
   try{
    const {data,error}=await getSession();if(error||!data?.session?.access_token)throw Error('سجّل دخولك أولًا، ثم ارجع لطلب الصياغة.');
    if(controller!==request||active!==revision||!node.isConnected)return;
    const response=await fetchImpl('/api/rewrite',{method:'POST',signal:request.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({kind:id.startsWith('experiences.')?'experience':id,text:item.text,consent:true})});
    const result=await response.json();if(controller!==request||active!==revision||!node.isConnected)return;
    if(!response.ok)throw Error(typeof result.message==='string'?result.message:'تعذّرت الصياغة. نصك محفوظ؛ جرّب المراجعة المحلية.');
    if(result.original!==item.text||result.reviewRequired!==true||result.provider!=='cloudflare'||typeof result.suggestion!=='string'||!result.suggestion.trim()||result.suggestion.length>(id==='headline'?200:id==='momentDetail'?1500:id.startsWith('experiences.')?2000:3000))throw Error('تعذّر التحقق من الاقتراح. احتفظنا بنصك الأصلي.');
    resultNode.innerHTML=`<fieldset class="import-review-card"><legend>${esc(title(id))}</legend><p class="mini">النص الأصلي</p><p dir="auto">${esc(item.text)}</p><label class="editor-field">الصياغة المقترحة — يمكنك تعديلها<textarea data-ai-text dir="auto" rows="5">${esc(result.suggestion)}</textarea></label>${typeof result.reason==='string'?`<p dir="auto">${esc(result.reason)}</p>`:''}${typeof result.question==='string'&&result.question?`<p class="notice" dir="auto">${esc(result.question)}</p>`:''}<label class="choice"><input type="checkbox" data-ai-reviewed>راجعت الحقائق والمعنى وأريد اعتماد الصياغة</label><button type="button" class="primary" data-ai-apply disabled>اعتمد الصياغة في مسودتي</button></fieldset>`;
    status.textContent='الاقتراح جاهز للمراجعة. لم يتغير نصك ولم يُنشر شيء.';
    const apply=resultNode.querySelector('[data-ai-apply]');resultNode.querySelector('[data-ai-reviewed]').onchange=e=>{apply.disabled=!e.target.checked};
    apply.onclick=()=>{try{
     const before=cleanDraft(api.get()),suggestion=resultNode.querySelector('[data-ai-text]').value,next=applyReviewed(before,snapshot,[{id,suggestion}]);
     api.apply(next);resultNode.innerHTML='<p role="status">اعتمدنا الصياغة في مسودتك المحلية فقط. حفظ الحساب والنشر خطوتان منفصلتان.</p><button type="button" class="secondary" data-ai-undo>تراجع عن الصياغة</button>';
     resultNode.querySelector('[data-ai-undo]').onclick=()=>{try{api.apply(applyReviewed(api.get(),next,[{id,suggestion:item.text}],true));resultNode.innerHTML='<p role="status">استعدنا النص الأصلي. لم يُنشر أي تغيير.</p>'}catch(e){status.textContent=e.message}};
    }catch(e){status.textContent=e.message}};
   }catch(e){if(node.isConnected&&active===revision)status.textContent=e.name==='AbortError'?'انتهت مهلة الصياغة أو أُلغيت. نصك محفوظ؛ جرّب المراجعة المحلية.':e.message}
   finally{clearTimeout(timer);if(controller===request){controller=null;if(node.isConnected){select.disabled=false;consent.disabled=false;button.disabled=!ready||!consent.checked}}}
  };
 }
 return {offer,clear};
}
