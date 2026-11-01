export default function handler(req,res){res.setHeader('Cache-Control','no-store');return res.status(200).json({ready:false,localReview:true,externalGeneration:false,reviewRequired:true})}
