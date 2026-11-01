import {cleanDraft,limits} from './common.js';
export const importFields=[['name','الاسم'],['headline','المسمى التعريفي'],['work','النبذة'],['education','التعليم'],['courses','الدورات'],['skills','المهارات'],['city','المدينة'],['email','بريد التواصل'],['phone','رقم التواصل'],['experiences','الخبرات']];
const normalize=s=>s.toLowerCase().replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/[：:|•]/g,' ').replace(/\s+/g,' ').trim();
const headings={work:['نبذة','نبذة عني','النبذة','النبذة المهنية','الملخص','الملخص المهني','الهدف المهني','summary','profile','professional summary','objective','about me'],experiences:['الخبرات','الخبرات العملية','الخبرة العملية','الخبرة المهنية','خبرات العمل','experience','work experience','professional experience','employment history'],education:['التعليم','المؤهلات العلمية','المؤهل العلمي','education','academic qualifications'],skills:['المهارات','المهارات الشخصية','المهارات التقنية','skills','technical skills','core skills'],courses:['الدورات','الدورات التدريبية','الشهادات والدورات','الشهادات','certifications','courses','training'],other:['التواصل','معلومات التواصل','البيانات الشخصية','المعلومات الشخصية','contact','contact information','personal information','languages','اللغات','references','المراجع','المشاريع','projects']};
function heading(s){const n=normalize(s);return Object.keys(headings).find(key=>headings[key].some(label=>normalize(label)===n))}
export function parseCvText(text){
 const raw=String(text||'').replace(/\r/g,'').replace(/[\u0000-\u0008]/g,'').slice(0,80000);
 const lines=raw.split('\n').map(s=>s.trim()).filter(Boolean),sections={};let current=null;
 for(const line of lines){const key=heading(line);if(key){current=key;sections[key]??=[]}else if(current)sections[current].push(line)}
 const proposed=cleanDraft({});
 for(const key of ['work','education','courses','skills'])proposed[key]=(sections[key]||[]).join('\n');
 const explicitName=lines.find(s=>/^(?:الاسم|الاسم الكامل|full name|name)\s*[:：]/i.test(s));
 const candidate=explicitName?.replace(/^[^:：]+[:：]\s*/,'')||lines[0]||'';
 if(candidate.length<=80&&!heading(candidate)&&!/[\d@/]/.test(candidate)&&!/(سيرة|curriculum|resume|curriculum vitae|مهندس|محاسب|specialist|engineer|manager)/i.test(candidate)&&(explicitName||candidate.split(/\s+/).length>=2)&&candidate.split(/\s+/).length<=6)proposed.name=candidate;
 const email=raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);if(email)proposed.email=email[0];
 const numberText=raw.replace(/[٠-٩]/g,n=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(n)));
 const phone=numberText.match(/(?:\+966[\s.-]*5(?:[\s.-]*\d){8}|\b05(?:[\s.-]*\d){8}\b)/);if(phone)proposed.phone=phone[0].replace(/[\s.-]/g,'');
 const city=lines.find(s=>/^(?:المدينة|city|location|الموقع)\s*[:：]/i.test(s));if(city)proposed.city=city.replace(/^[^:：]+[:：]\s*/,'');
 const title=lines.find(s=>/^(?:المسمى(?: الوظيفي)?|job title|headline)\s*[:：]/i.test(s));if(title)proposed.headline=title.replace(/^[^:：]+[:：]\s*/,'');
 if(sections.experiences?.length){const [role,...details]=sections.experiences;proposed.experiences=[{role,organization:'',period:'',description:details.join('\n')}]}
 // Keep the complete extracted text for review. Bound it only after the owner
 // has shortened or split the selected content, never by silently slicing it.
 return {raw,proposed,missing:importFields.filter(([k])=>k==='experiences'?!proposed[k].length:!proposed[k]).map(([,label])=>label)};
}
export function importLengthIssues(d,selected=importFields.map(([key])=>key)){
 const issues=[];
 for(const [key,label]of importFields){if(!selected.includes(key))continue;
  if(key==='experiences'){for(const [i,e]of (d.experiences||[]).entries())for(const [field,max]of Object.entries({role:120,organization:150,period:100,description:2000}))if(typeof e[field]==='string'&&e[field].length>max)issues.push({key,label:`${label} — التجربة ${i+1} — ${{role:"الدور",organization:"الجهة",period:"الفترة",description:"الوصف"}[field]}`,max,length:e[field].length})}
  else if(typeof d[key]==='string'&&d[key].length>limits[key])issues.push({key,label,max:limits[key],length:d[key].length});
 }
 return issues;
}
export function applyCvSelection(existing,incoming,selected,mode='append'){
 const issue=importLengthIssues(incoming,selected)[0];if(issue)throw Error(`${issue.label}: النص ${issue.length.toLocaleString('ar-SA')} حرفًا، والحد ${issue.max.toLocaleString('ar-SA')}. اختصره أو قسّم الخبرات قبل الإضافة؛ لم نغيّر مسودتك.`);
 const next=cleanDraft(existing),source=cleanDraft(incoming);
 for(const [key]of importFields)if(selected.includes(key)){
  if(key==='experiences'){const merged=mode==='replace'?source.experiences:[...next.experiences,...source.experiences];if(merged.length>10)throw Error('experience-limit');if(merged.some(e=>!e.role.trim()))throw Error('experience-role');next.experiences=merged}
  else next[key]=source[key];
 }
 return cleanDraft(next);
}
// Reject unexpectedly expanded archives before handing DOCX to its reader.
export function validateDocxArchive(buffer){const view=new DataView(buffer);let directory=-1;
 for(let n=buffer.byteLength-22;n>=Math.max(0,buffer.byteLength-65557);n--)if(view.getUint32(n,true)===0x06054b50){directory=n;break}
 if(directory<0)throw Error('invalid-docx');const count=view.getUint16(directory+10,true);let offset=view.getUint32(directory+16,true),total=0;
 if(count>2000)throw Error('archive-limit');
 for(let n=0;n<count;n++){if(offset+46>view.byteLength||view.getUint32(offset,true)!==0x02014b50)throw Error('invalid-docx');if(view.getUint16(offset+8,true)&1)throw Error('encrypted-docx');total+=view.getUint32(offset+24,true);if(total>25*1024*1024)throw Error('archive-limit');offset+=46+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true)}
}
