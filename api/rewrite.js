// External generation is disabled, including direct requests.
export default function handler(req,res){res.setHeader('Cache-Control','no-store');return res.status(410).json({code:'local_review_only',message:'المراجعة متاحة داخل المتصفح دون خدمة ذكاء اصطناعي خارجية.'})}
