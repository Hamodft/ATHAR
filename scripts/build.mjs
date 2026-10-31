import {build} from 'esbuild';import {mkdir,rm,copyFile,cp} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/assets',{recursive:true});
for(const file of ['index.html','profile.html','styles.css','profile-renderer.js','cv.html','public-profile.html','favicon.svg'])await copyFile(file,'dist/'+file);
await cp('brand','dist/brand',{recursive:true});
await build({entryPoints:{platform:'src/platform.js',cv:'src/cv.js','public-profile':'src/public-profile.js'},bundle:true,outdir:'dist/assets',format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'none'});
console.log('Athar built: account journey, public pages and printable CV.');
