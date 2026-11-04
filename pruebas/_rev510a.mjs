import { chromium } from 'playwright';
const BASE='http://localhost:8150/index.html';
const nav=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
const p=await nav.newPage({viewport:{width:1600,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript("try{localStorage.setItem('gestor.novedadesVistas','todo');const a={};['datos','campos','pasos','correo','word','plazo','palabras','repite'].forEach(s=>a['tipo:'+s]=true);localStorage.setItem('gestor-ajustes-plegado',JSON.stringify(a));}catch(e){}");
await p.goto(BASE+'?demo=1&auto=1');await p.waitForSelector('#franja-demo',{timeout:30000});await p.waitForTimeout(2500);
const scan=(etq)=>p.evaluate((etq)=>{const out=[];const re=/hueco/i;
 document.querySelectorAll('*').forEach(el=>{if(el.offsetParent===null&&getComputedStyle(el).position!=='fixed')return;
  for(const a of ['title','placeholder','aria-label','value','alt']){const v=el.getAttribute(a);if(v&&re.test(v)&&el.tagName!=='OPTION')out.push(a+': '+v.slice(0,100));}
  const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join(' ');if(re.test(own))out.push(el.tagName+'.'+el.className+': '+own.trim().slice(0,160));});
 return etq+' => '+JSON.stringify(out);},etq);
await p.evaluate(()=>{const c=App.E.campos=App.E.campos||{};c.propios=(c.propios||[]);c.propios.push({id:'p1',nombre:'Protocolo de absentismo iniciado',clase:'lista',valores:['Sí','No']});});
await p.click('.pestana[data-pantalla="ajustes"]');
await p.waitForSelector('#tabla-tipos .tarjeta-tipo');
console.log(await scan('ajustes'));
await p.locator('#tabla-tipos .tarjeta-tipo').first().locator('.tarjeta-tipo-nombre').click();
await p.waitForSelector('#tipo-plantillas-nueva');
console.log(await scan('pantalla tipo'));
await p.click('#tipo-plantillas-nueva');await p.waitForSelector('#pl-texto');
const tipo=await p.evaluate(()=>document.getElementById('pl-tipo').value);
await p.evaluate(t=>{App.E.campos.porTipo=App.E.campos.porTipo||{};App.E.campos.porTipo[t]=[{origen:'propio',id:'p1'}];},tipo);
console.log(await scan('editor plantilla correo'));
console.log(await p.evaluate(()=>document.querySelector('#capa .insertar-caja').outerHTML));
console.log(await p.evaluate(()=>document.querySelector('#capa').innerText.slice(0,2500)));
await p.screenshot({path:'/tmp/claude-0/-home-user-gestor-asuntos-ies/beae5bf2-43e0-550f-8b03-8e8d25716b39/scratchpad/ed.png'});
await p.click('#pl-insertar-hueco');await p.waitForSelector('#huecos-cuadro');console.log(await scan('buscador campo variable'));console.log(await p.evaluate(()=>document.getElementById('huecos-cuadro').innerText.slice(0,600)));await p.keyboard.press('Escape');
// vacío con solo "No hay campos?" 
await p.click('#pl-texto-condicional');await p.waitForSelector('#texto-cond-cuadro');console.log(await p.evaluate(()=>document.getElementById('texto-cond-cuadro').innerText));console.log(await scan('cuadro cond'));
await p.screenshot({path:'/tmp/claude-0/-home-user-gestor-asuntos-ies/beae5bf2-43e0-550f-8b03-8e8d25716b39/scratchpad/cuadro.png'});
await p.keyboard.press('Escape');
// plantilla tipo
await p.evaluate(()=>{document.getElementById('cuadro-cancelar')&&document.getElementById('cuadro-cancelar').click()});
await p.waitForTimeout(300);
// Ajustes del centro
await p.evaluate(()=>App.ir('ajustes'));await p.waitForTimeout(500);
console.log(await scan('ajustes centro'));
console.log('errores',errs);
await nav.close();
