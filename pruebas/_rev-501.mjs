import { chromium } from 'playwright';
const SC='/tmp/claude-0/-home-user-gestor-asuntos-ies/d202a742-6eb9-50b1-9b93-ca62271b33f9/scratchpad/rev/';
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await nav.newPage({ viewport: { width: 1500, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript("try{localStorage.setItem('gestor.novedadesVistas','todo')}catch(e){}");
await p.goto('http://localhost:8195/index.html?demo=1&auto=1&libros=1');
await p.waitForSelector('#aplicacion:not(.oculto)',{timeout:40000});
await p.waitForFunction(()=>window.Demo&&Demo.montando===false,null,{timeout:90000});
await p.waitForTimeout(3000);
// capture generated docx
await p.evaluate(()=>{ window.__docs=[]; const o=Docx.rellenar; Docx.rellenar=async function(){ const r=await o.apply(this,arguments); try{ const x=await Docx.leerEntradaDeTexto(new Uint8Array(await r.blob.arrayBuffer()),'word/document.xml'); window.__docs.push(x);}catch(e){} return r; }; });
const txt = () => p.evaluate(()=>window.__docs.map(xml=>{
  const par=(xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).map(x=>(x.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)||[]).map(t=>t.replace(/<[^>]+>/g,'')).join('')).filter(Boolean);
  return par.join(' / ');
}));
async function shot(n){ await p.screenshot({path:SC+n+'.png'}); }

async function crear(buscar, opts={}){
  await p.evaluate(()=>App.ir('nuevo'));
  await p.waitForSelector('#buscar-tercero',{state:'visible'});
  await p.evaluate(()=>App.elegirTipo(App.E.tipos.filter(t=>t.tipo==='FICHA ENTREGA LIBROS')[0]));
  await p.waitForTimeout(500);
  await p.fill('#buscar-tercero',buscar); await p.waitForTimeout(800);
  await p.click('#resultados-tercero .resultado >> nth=0'); await p.waitForTimeout(800);
}


async function escenario(nombre, buscar, dup, fecha){
  await crear(buscar);
  if (dup){ await p.selectOption('select.salto-cursor','Sí'); }
  if (fecha){ await p.fill('input[type=date] >> nth=-1', fecha); }
  await p.click('#btn-crear'); await p.waitForTimeout(1500);
  await p.click('text=Generar documento ▾'); await p.waitForTimeout(500);
  const antes = await p.evaluate(()=>window.__docs.length);
  const dis = await p.$eval('.mesa-plantilla-generar',b=>b.disabled);
  await p.click('.mesa-plantilla-generar'); await p.waitForTimeout(2500);
  const despues = await p.evaluate(()=>window.__docs.length);
  const toasts = await p.$$eval('.aviso, .toast, #avisos, [role=alert], .aviso-rojo, .mesa-aviso',e=>e.filter(x=>x.offsetParent).map(x=>x.textContent.trim().slice(0,300)));
  console.log('=== '+nombre+' boton deshabilitado:',dis,'docs nuevos:',despues-antes,'avisos:',JSON.stringify(toasts));
  await shot('20-'+nombre);
  const t = await txt();
  if (despues>antes) console.log(t[t.length-1]);
}
await escenario('marina','aguilar ponce');
await escenario('adrian','soler vega');
await escenario('dup','aguilar ponce',true,'2026-09-15');
await escenario('dupsin','aguilar ponce',true,'');
await escenario('ana','klein soto');
await escenario('ruben','fuentes calvo');
console.log('errs',errs);
await nav.close();
