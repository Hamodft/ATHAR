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
 layout:'portfolio',theme:'navy',font:'tahoma',density:'comfortable',sectionOrder:'experience-first'
});

const root=document.getElementById('portfolio-demo');
document.querySelector('.demo-controls').addEventListener('submit',event=>event.preventDefault());
function render(){root.innerHTML=window.AtharRenderer.render(sample,'',false)}
for(const [id,key]of [['layout','layout'],['theme','theme'],['font','font'],['density','density'],['order','sectionOrder']]){
 const input=document.getElementById('demo-'+id);
 input.addEventListener('change',()=>{sample[key]=input.value;render();document.getElementById('demo-status').textContent='تحدّث المثال. هذه معاينة فقط؛ مسودتك وصفحتك المنشورة لم تتغيرا.'});
}
render();
