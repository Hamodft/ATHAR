import {cloudReady} from '../server/cloudflare-editor.js';
export default function handler(req,res){const ready=cloudReady(process.env);res.setHeader('Cache-Control','no-store');return res.status(200).json({ready,localReview:true,externalGeneration:ready,reviewRequired:true,...(ready?{provider:'cloudflare',dailyAccountLimit:2,dailySiteLimit:50}: {})})}
