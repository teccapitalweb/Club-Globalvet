const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(base,'index.html'),'utf8');
const helpers = html.slice(html.indexOf('var _freePreviewCursoId=null;'),html.indexOf('function normalizeLibraryText('));

test('JavaScript del portal y recorrido compila', () => {
  let count=0;
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if(!match[2].trim()||/application\//.test(match[1]))continue;
    new vm.Script(match[2],{filename:'index.html:'+(++count)});
  }
  new vm.Script(fs.readFileSync(path.join(base,'membership-tour.js'),'utf8'));
  assert.ok(count>0);
});
for(const count of [0,1,2,8])test(`frontend catálogo de ${count} clases usa el único ID del servidor`,async()=>{
  const initial={id:'initial',clases:Array.from({length:count},(_,i)=>({titulo:'Clase '+(i+1)}))};
  const other={id:'other',clases:[{titulo:'Otro'}]};
  const context=vm.createContext({WEBHOOK_URL:'https://example.invalid',fetch:async()=>({ok:true,json:async()=>({initialCourseId:'initial',courses:[other,initial]})}),window:{},console});
  vm.runInContext(helpers,context);
  // Execute the exact predicates from the production document.
  vm.runInContext(html.match(/^function isFreePreviewCourse[^\r\n]+/m)[0]+'\n'+html.match(/^function canWatchFreePreview[^\r\n]+/m)[0],context);
  await vm.runInContext('getCourseSnapshot()',context);
  for(let index=-1;index<=count;index++)assert.equal(vm.runInContext(`Boolean(canWatchFreePreview('initial',${index}))`,context),index>=0&&index<count-1);
  assert.equal(vm.runInContext("Boolean(canWatchFreePreview('other',0))",context),false);
  assert.equal(vm.runInContext("Boolean(canWatchFreePreview('initial','0'))",context),false);
});
test('no existen rutas alternativas de catálogo o URL cruda de clase en el frontend',()=>{
  assert.doesNotMatch(html,/db\.collection\(['"]cursos['"]\)/);
  assert.doesNotMatch(html,/driveEmbed\(cl\.video\)|BUNNY_VIDEO_BY_DRIVE_ID/);
  assert.match(html,/requestCourseAccess\('course-playback'/);
  assert.match(html,/requestCourseAccess\('course-progress'/);
  assert.doesNotMatch(html,/primera clase gratis|1ª clase gratis|Ver primera clase/i);
  assert.doesNotMatch(html,/<div class="gvh-price">/);
  assert.match(html,/\$179 MXN \/ mes/);
});
