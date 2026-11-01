// Deterministic editing aids: no network, translation or invented professional claims.
export function reviewText(original,{kind='work'}={}){
 const text=String(original||'');const en=!/[\u0600-\u06ff]/.test(text);const findings=[];const seen=new Set();let repeated=0;
 const suggestion=text.split(/\r?\n/).map(line=>line.trim().replace(/[\t ]+/g,' ')).filter(line=>{if(!line)return true;if(seen.has(line)){repeated++;return false}seen.add(line);return true}).join('\n').replace(/\n{3,}/g,'\n\n').trim();
 const words=suggestion.split(/\s+/).filter(Boolean).length;
 if(repeated)findings.push(en?'Identical repeated lines were removed. Review the suggestion.':'وجدنا أسطرًا متطابقة متكررة. راجع حذف التكرار في الاقتراح.');
 if(/طموح|مجتهد|شغوف|hard.?working|passionate|highly motivated/i.test(suggestion))findings.push(en?'Support general descriptions with a specific example from your experience.':'الأوصاف العامة تحتاج مثالًا من تجربتك يوضحها.');
 if(words>80)findings.push(en?'Consider shorter paragraphs organized around your contribution.':'جرّب فقرات أقصر تتمحور حول مساهمتك، دون حذف حقائق مهمة.');
 let question='';if(words&&words<10)question=en?'What did you do yourself, and in what context? Add only real details.':'ما الذي نفذته أنت، وفي أي سياق؟ أضف تفاصيل حقيقية تستطيع شرحها.';
 else if(words&&kind!=='headline'&&!/نتيج|أدى|أدّى|أصبحت?|تحسن|تحسّن|انخفض|تقليل|وفّر|وفر|اكتمل|ساهم.*في|result|improv|reduc|saved|completed|outcome/i.test(suggestion))question=en?'What changed after your contribution? Describe an observable outcome if available; a number is not required.':'ما الذي تغيّر بعد مساهمتك؟ اذكر نتيجة يمكن وصفها إن توفرت؛ لا تحتاج رقمًا غير موثّق.';
 const changed=suggestion!==text;return {suggestion,changed,findings,question,reason:changed?(en?'Formatting only: normalized spaces and removed identical repeated lines. No new facts.':'تنسيق فقط: توحيد المسافات وحذف الأسطر المتطابقة المتكررة، دون إضافة معلومات.'):(en?'Your wording is preserved. Use the prompts to review it yourself.':'احتفظنا بكلامك كما هو. استخدم الإرشادات والأسئلة لمراجعته بنفسك.')};
}
export function profilePrompts(d){const prompts=[];
 if(!d.headline?.trim())prompts.push('أضف مسمى تعريفيًا يعكس دورك أو تخصصك الفعلي، إن رغبت.');
 if(!d.education?.trim())prompts.push('التعليم غير مضاف. أضفه إن كان مناسبًا لهدف صفحتك.');
 if(!d.skills?.trim())prompts.push('اذكر الأدوات والمهارات التي استخدمتها فعلًا، مع مثال عند الحاجة.');
 for(const [i,e]of(d.experiences||[]).entries())if(!e.organization?.trim()||!e.period?.trim())prompts.push(`راجع الجهة والفترة في الخبرة ${i+1}؛ بعض تفاصيلها غير مضافة.`);
 const norm=s=>String(s||'').replace(/\s+/g,' ').trim();if(d.work&&d.moment&&norm(d.work)===norm(d.moment))prompts.push('النبذة والموقف المهني متطابقان. يمكنك تخصيص الموقف لمثال يوضح دورك.');return prompts;
}
