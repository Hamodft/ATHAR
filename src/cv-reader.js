import {validateDocxArchive} from './cv-import-model.js';
export async function readCvFile(file,onProgress=()=>{}){
 if(file.size>10*1024*1024)throw Error('file-size');const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx'].includes(ext))throw Error('file-type');
 const bytes=await file.arrayBuffer();let text='';
 if(ext==='docx'){validateDocxArchive(bytes);onProgress('نقرأ النص من ملف Word…');const {default:mammoth}=await import('mammoth/mammoth.browser.js');const result=await mammoth.extractRawText({arrayBuffer:bytes});text=result.value}
 else{onProgress('نفتح ملف PDF…');const pdf=await import('pdfjs-dist/build/pdf.mjs');pdf.GlobalWorkerOptions.workerSrc='/assets/pdf.worker.mjs';const task=pdf.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,cMapUrl:'/assets/cmaps/',cMapPacked:true,standardFontDataUrl:'/assets/standard_fonts/'});let document;
 try{document=await task.promise;if(document.numPages>30)throw Error('page-limit');for(let i=1;i<=document.numPages;i++){onProgress(`نقرأ الصفحة ${i} من ${document.numPages}…`);const page=await document.getPage(i);const content=await page.getTextContent();let y=null;for(const item of content.items){if(!('str'in item))continue;const row=Math.round(item.transform[5]);if(y!==null&&Math.abs(y-row)>3)text+='\n';text+=item.str+(item.hasEOL?'\n':' ');y=item.hasEOL?null:row}text+='\n';page.cleanup();if(text.length>80000)throw Error('text-limit')}}finally{await task.destroy()}}
 if(text.length>80000)throw Error('text-limit');if(text.trim().length<30)throw Error('no-text');return text;
}
