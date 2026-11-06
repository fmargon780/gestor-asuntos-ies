import { chromium } from 'playwright';
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1200,height:1000}});
await page.goto('http://localhost:8151/index.html?demo=1&auto=1');
await page.waitForSelector('#aplicacion:not(.oculto)',{timeout:60000});
await page.waitForFunction('window.Demo && !Demo.montando',null,{timeout:60000});
await page.evaluate(async()=>{
 const l=(await Datos.cargar(App.E.datos,'ALUMNADO')).lista;
 for(const x of l){const c=x.campos; if(!/Jimenez Rubio/.test(JSON.stringify(c)))continue;
  c['Nombre Primer tutor']='Pedro';c['Primer apellido Primer tutor']='Jimenez';c['Correo Primer tutor']='pedro@x.es';c['Relación Primer tutor']='Padre';
  c['Nombre Segundo tutor']='Marta';c['Primer apellido Segundo tutor']='Rubio';c['Correo Segundo tutor']='marta@x.es';c['Relación Segundo tutor']='Madre';}
 const oc=DatosDelAsunto.camposDelAsunto; DatosDelAsunto.camposDelAsunto=function(a){const r=oc.apply(this,arguments).slice(); r.push({nombre:'Tutor con custodia',clave:'__cust'}); return r;};
 const ov=DatosDelAsunto.valorGuardado; DatosDelAsunto.valorGuardado=function(a,k){return k==='__cust'?'Marta Rubio':ov.apply(this,arguments)};
});
page.evaluate(()=>CorreoNucleo.abrirCuadro(Gestor.asuntos().filter(x=>x.nombre.indexOf('SANCION Jimenez Rubio')!==-1)[0],false,{}));
await page.waitForSelector('.cdest'); await page.waitForTimeout(800);
const st=()=>page.evaluate(()=>[...document.querySelectorAll('.cdest')].map(c=>c.querySelector('.cdest-rotulo').textContent+': '+[...c.querySelectorAll('.cdest-pastilla')].map(p=>p.textContent.replace(/\s+/g,' ').trim()).join('|')).join(' ; '));
const sel=()=>page.locator('select').filter({has:page.locator('option',{hasText:'Sin plantilla'})}).first();
console.log('inicial',await st());
await sel().selectOption({label:'Aviso de avance'}); await page.waitForTimeout(600); console.log('tras Aviso de avance',await st());
await sel().selectOption({label:'Sin plantilla'}); await page.waitForTimeout(400);
const i=page.locator('.cdest-escribir').first(); await i.click(); await i.type('madre',{delay:20}); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
console.log('madre',await st());
await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,0));});
await page.evaluate(()=>{window.__t=1});
await page.evaluate(()=>CorreoNucleo&&0);
await page.evaluate(()=>{});
await page.evaluate(()=>0);
// Ajustes nota
await page.evaluate(()=>{const c=document.getElementById('cuadro-aceptar'); c&&c.click();});
await page.waitForTimeout(500);
await page.evaluate(()=>App.abrirTipoDeAsunto('SANCION')); await page.waitForTimeout(1200);
await page.locator('summary',{hasText:/^Plantillas de correo/}).first().click(); await page.waitForTimeout(500);
console.log('nota:',await page.evaluate(()=>/se ponen solos/.test(document.querySelector('#pantalla-tipo-asunto').innerText)));
await b.close();
