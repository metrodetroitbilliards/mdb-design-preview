import fs from 'node:fs/promises';
// Compile the existing public rendering logic as a module; no runtime eval.
let source=await fs.readFile('launch-preview/app.js','utf8');
source=source.replace('let D=window.MDB_CONTENT;','').replace('const page=document.body.dataset.page;','');
await fs.mkdir('editor-lib',{recursive:true});
await fs.writeFile('editor-lib/site-renderer.js',`// Generated from launch-preview/app.js by scripts/prepare-renderer.mjs.\nimport {parseHTML} from 'linkedom';\nexport function renderPage(D,page,html){\nconst {document,window}=parseHTML(html);\nconst location={hash:''};\n${source}\nreturn document.toString();\n}\n`);
