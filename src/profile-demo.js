import {cleanDraft} from './common.js';

// Labelled fictional content; never copied to a visitor's own draft.
const sample=cleanDraft({
 name:'سارة عبدالله',headline:'تنسيق العمليات وتجربة العميل',city:'الرياض',
 work:'أعمل على تنظيم العمليات اليومية ومتابعة طلبات العملاء، وأهتم بأن تكون المعلومة واضحة والخطوة التالية معروفة للفريق والعميل. تجمع تجربتي بين خدمة العملاء وتنظيم العمل والتنسيق بين الأطراف المختلفة. أستخدم الجداول والتوثيق لمتابعة المهام، وأراجع الملاحظات المتكررة لتحسين طريقة العمل.',
 experiences:[
  {role:'منسقة عمليات',organization:'فريق خدمات — مثال توضيحي',period:'٢٠٢٤ — حتى الآن',description:'أتابع الطلبات المفتوحة وأرتب أولوياتها مع الفريق، وأحدث سجل المتابعة وأوضح ما يحتاج إلى إجراء.\nأراجع الطلبات التي تتطلب تنسيقًا بين أكثر من طرف، وأوثق الخطوة التالية والمسؤول عنها.\nأجمع الملاحظات المتكررة من خدمة العملاء وأشاركها مع الفريق لمراجعة الإجراءات، وأساعد الزملاء على استخدام ملفات المتابعة.'},
  {role:'ممثلة خدمة عملاء',organization:'مركز خدمة — مثال توضيحي',period:'٢٠٢٢ — ٢٠٢٤',description:'استقبلت الاستفسارات، وشرحت الخطوات للعملاء، وتابعت الطلبات مع الأقسام المعنية حتى تحديث العميل بنتيجتها.'}
 ],
 skills:'تنسيق العمليات، متابعة الطلبات، خدمة العملاء، توثيق الإجراءات، العمل ضمن فريق، Microsoft Excel',
 moment:'كانت تحديثات الطلب الواحد موزعة بين رسائل وملفات مختلفة، مما صعّب متابعة آخر إجراء.',
 momentDetail:'جمعت الخطوات في سجل متابعة واحد، ووضحت حالة الطلب والمسؤول عن الخطوة التالية، ثم شاركت طريقة استخدامه مع الفريق.',
 education:'بكالوريوس إدارة الأعمال\nجامعة افتراضية — بيانات لغرض العرض فقط',
 courses:'أساسيات إدارة العمليات — برنامج توضيحي\nاستخدام الجداول في متابعة العمل — تعلّم ذاتي',
 english:{
  name:'Sara Abdullah',headline:'Operations Coordination & Customer Experience',city:'Riyadh',
  work:'I coordinate daily operations and follow up on customer requests, making sure information is clear and the next step is known to both the team and the customer. My experience combines customer service, work organization and coordination across different teams. I use spreadsheets and documentation to track tasks, and review recurring feedback to improve how the work is done.',
  experiences:[
   {role:'Operations Coordinator',organization:'Services team — illustrative example',period:'2024 — Present',description:'I follow up on open requests, agree priorities with the team, and update the tracking log to make outstanding actions clear.\nI review requests involving more than one team and document the next step and its owner.\nI collect recurring customer-service feedback for the team to review procedures, and help colleagues use the tracking files.'},
   {role:'Customer Service Representative',organization:'Service centre — illustrative example',period:'2022 — 2024',description:'I handled enquiries, explained the process to customers, and followed up with the relevant teams until I could update the customer on the outcome.'}
  ],
  skills:'Operations coordination, Request follow-up, Customer service, Process documentation, Teamwork, Microsoft Excel',
  moment:'Updates for the same request were spread across messages and files, making it difficult to track the latest action.',
  momentDetail:'I brought the steps into a single tracking log, clarified each request’s status and the owner of its next step, and shared how to use it with the team.',
  education:'Bachelor of Business Administration\nFictional university — demonstration data only',
  courses:'Operations fundamentals — illustrative programme\nSpreadsheets for tracking work — self-directed learning'
 },
 layout:'portfolio',theme:'navy',font:'tahoma',density:'comfortable',sectionOrder:'experience-first'
});

const root=document.getElementById('portfolio-demo');
document.querySelector('.demo-controls').addEventListener('submit',event=>event.preventDefault());
let language=new URLSearchParams(location.search).get('lang')==='en'?'en':'ar';
function syncUi(){
 const en=language==='en';document.documentElement.lang=language;document.documentElement.dir=en?'ltr':'rtl';document.title=en?'Try your professional profile — Athar':'جرّب شكل صفحتك المهنية — أثر';
 document.querySelector('.demo-intro h1').textContent=en?'A professional presence. In your own style.':'حضور مهني، بتصميم تختاره.';
 document.querySelector('.demo-intro p').textContent=en?'This is a demonstration with fictional content. Try the template, colours and typography. Your own page will show the information you review and approve.':'هذا مثال توضيحي بشخصية ومعلومات افتراضية. جرّب القالب واللون والخط؛ صفحتك ستعرض معلوماتك التي تراجعها وتعتمدها.';
 document.querySelector('.demo-intro>a').textContent=en?'Build your own profile':'ابنِ صفحتك بمعلوماتك';document.querySelector('body>header>a.secondary').textContent=en?'Start your profile':'ابدأ صفحتك';
 const groups={layout:[en?'Template':'القالب',en?['Professional · Dark','Professional · Light','Classic','Minimal','Sidebar']:['حضور مهني · داكن','حضور مهني · فاتح','الكلاسيكي','البسيط','الجانبي']],theme:[en?'Colour':'اللون',en?['Navy & gold','Forest & gold','Warm earth']:['كحلي وذهبي','أخضر وذهبي','ترابي ودافئ']],font:[en?'Typeface':'الخط',en?['Clear · Tahoma','Simple · Arial','Traditional · Serif']:['واضح · Tahoma','بسيط · Arial','تقليدي · Serif']],density:[en?'Spacing':'المسافات',en?['Comfortable','Compact']:['مساحات مريحة','تنسيق متقارب']],order:[en?'Section order':'ترتيب الأقسام',en?['Experience, then contribution','Contribution, then experience']:['الخبرات ثم المساهمة','المساهمة ثم الخبرات']]};
 for(const [id,[label,options]]of Object.entries(groups)){const node=document.getElementById('demo-'+id);node.parentElement.firstChild.textContent=label;[...node.options].forEach((option,i)=>option.textContent=options[i])}
 const links=en?['Start with questions','Import your CV','Edit your draft design']:['ابدأ بالأسئلة','استورد سيرتك الجاهزة','عدّل تصميم مسودتك'];document.querySelectorAll('.demo-toolbar a').forEach((a,i)=>a.textContent=links[i]);
 document.querySelector('.demo-controls').setAttribute('aria-label',en?'Try the design options':'تجربة تعديل التصميم');document.getElementById('demo-status').textContent=en?'Demo changes are for preview only. They do not change your draft or a published profile.':'تغييرات هذا المثال للمعاينة فقط؛ لا تغيّر مسودتك أو أي صفحة منشورة.';
}
function render(){root.innerHTML=window.AtharRenderer.render(sample,'',false,language);window.AtharRenderer.bind(root,sample,'',false,value=>{language=value;syncUi();const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url.pathname+url.search+url.hash)});syncUi()}
for(const [id,key]of [['layout','layout'],['theme','theme'],['font','font'],['density','density'],['order','sectionOrder']]){
 const input=document.getElementById('demo-'+id);
 input.addEventListener('change',()=>{sample[key]=input.value;render();document.getElementById('demo-status').textContent=language==='en'?'Preview updated. Your own draft and published page have not changed.':'تحدّث المثال. هذه معاينة فقط؛ مسودتك وصفحتك المنشورة لم تتغيرا.'});
}
render();
