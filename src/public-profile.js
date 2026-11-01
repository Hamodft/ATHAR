import {db} from './client.js';
import {validSlug,cleanDraft} from './common.js';
const root=document.getElementById('public-profile');
const slug=location.pathname.split('/').filter(Boolean).pop()||'';
const initialLanguage=new URLSearchParams(location.search).get('lang')==='en'?'en':'ar';
function chrome(language,name=''){
 const en=language==='en';document.documentElement.lang=language;document.documentElement.dir=en?'ltr':'rtl';document.title=(name||'Athar')+(en?' — Athar':' — أثر');
 const create=document.querySelector('body>header>a.secondary');if(create)create.textContent=en?'Create your profile':'اصنع صفحتك';
 const labels=en?['My workspace','About Athar','Suggestions']:['لوحتي','من نحن','الاقتراحات'];document.querySelectorAll('body>footer>a').forEach((a,i)=>{a.textContent=labels[i]||a.textContent});
}
try{
 if(!validSlug(slug))throw Error();
 const {data:profile,error}=await db.from('athar_profiles').select('content,avatar_path').eq('slug',slug).eq('is_published',true).maybeSingle();if(error||!profile)throw Error();
 let photo='';if(profile.avatar_path){const {data}=await db.storage.from('athar-avatars').createSignedUrl(profile.avatar_path,120);photo=data?.signedUrl||''}
 const d=cleanDraft(profile.content);
 function changed(language){chrome(language,language==='en'&&d.english.name.trim()?d.english.name:d.name);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState({},'',url.pathname+url.search+url.hash)}
 root.innerHTML=window.AtharRenderer.render(d,photo,true,initialLanguage);window.AtharRenderer.bind(root,d,photo,true,changed);chrome(initialLanguage,initialLanguage==='en'&&d.english.name.trim()?d.english.name:d.name);
}catch{
 chrome(initialLanguage);root.innerHTML=initialLanguage==='en'?'<h1>Profile unavailable</h1><p>The owner may have unpublished this page, or the link may be incorrect.</p><a href="/">Back to Athar</a>':'<h1>الصفحة غير متاحة</h1><p>قد يكون صاحبها ألغى نشرها، أو أن الرابط غير صحيح.</p><a href="/">العودة لأثر</a>';
}
