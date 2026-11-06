import {SUPABASE_URL,SUPABASE_KEY} from '../config.js';
import {cloudReady,validateSection,rewriteWithCloudflare} from '../server/cloudflare-editor.js';
export function createRewriteHandler({env=process.env,fetchImpl=globalThis.fetch}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
  const send=(status,code,message)=>res.status(status).json({code,message});
  if(!cloudReady(env))return send(410,'local_review_only','المراجعة متاحة داخل المتصفح دون خدمة ذكاء اصطناعي خارجية.');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,'method_not_allowed','استخدم طلب الصياغة من داخل أثر.');}
  if(req.headers?.origin!==(env.ATHAR_PUBLIC_ORIGIN||'https://athar-profile-topaz.vercel.app'))return send(403,'origin_rejected','افتح الصياغة من موقع أثر.');
  let source;try{source=validateSection(req.body)}catch(e){return send(400,e.code,e.message)}
  const auth=req.headers?.authorization;if(typeof auth!=='string'||!/^Bearer [^\s]+$/.test(auth)||auth.length>8192)return send(401,'login_required','سجّل دخولك لاستخدام الصياغة المهنية.');
  const headers={apikey:SUPABASE_KEY,Authorization:auth,'Content-Type':'application/json'};
  try{
   const verified=await fetchImpl(SUPABASE_URL+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});
   if(!verified.ok)return send(401,'login_required','انتهت جلستك. سجّل دخولك ثم حاول مجددًا.');
   const user=await verified.json();if(!user?.id||!user.email_confirmed_at)return send(401,'login_required','أكد بريدك وسجّل دخولك لاستخدام الصياغة.');
   const quota=await fetchImpl(SUPABASE_URL+'/rest/v1/rpc/claim_rewrite_quota',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(8000)});
   if(!quota.ok)return send(503,'quota_unavailable','تعذّر التحقق من الحصة المجانية. نصك محفوظ؛ جرّب المراجعة المحلية.');
   if(await quota.json()!==true)return send(429,'daily_limit','بلغت حد المحاولات المجانية اليوم. استخدم المراجعة المحلية أو حاول غدًا.');
   const result=await rewriteWithCloudflare(source,{env,fetchImpl});return res.status(200).json(result);
  }catch(e){const known=['quota_exhausted','provider_unavailable','invalid_response','unsupported_number'].includes(e?.code);return send(e?.code==='quota_exhausted'?429:503,known?e.code:'service_unavailable',known?e.message:'تعذّر إكمال الصياغة الآن. نصك الأصلي محفوظ؛ جرّب المراجعة المحلية.');}
 };
}
export default function handler(req,res){return createRewriteHandler()(req,res)}
