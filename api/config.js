import {credentials} from './rewrite.js';
export default function handler(req,res){res.setHeader('Cache-Control','no-store');return res.status(200).json({ready:!!credentials(process.env,req.headers),provider:'OpenAI via Vercel AI Gateway',reviewRequired:true})}
