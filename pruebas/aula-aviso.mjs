/* Prueba de la fila 724 de docs/COLA.md (docs/724-CREAR-VARIOS-DESDE-EL-AVISO.md): «Crear varios desde una lista» en
   «Nuevo asunto» con el tipo «EXPULSIÓN AULA CONVICENCIA». Con Chromium real y los datos inventados (?demo=1&auto=1&aula=1). */

import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&aula=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForFunction(() => App.E.tipos.some((t) => t.tipo === 'EXPULSIÓN AULA CONVICENCIA' && t.sinHitos) && App.E.listaAbiertos.some((x) => /Lara Pardo/.test(x.nombre)), null, { timeout: 30000 });

const TIPO = 'EXPULSIÓN AULA CONVICENCIA';
const AVISO_1 = 'ALUMNADO PARA EL AULA DE CONVIVENCIA\nNavarro Gil, Lucía (2º B) 3 días, del 18 al 20 de noviembre.\nEnviado el 14/11/2026 06:31:02 por Apellidos, Nombre';
const AVISO_2 = 'ALUMNADO PARA EL AULA DE CONVIVENCIA\nOrtega Paz , Darío (2º B) 4 días, del martes 3 al viernes 6 de noviembre.\nPardo Luna, Nerea (2º B) 3 días, del martes 3 al viernes 5 de noviembre.\nEnviado el 27/10/2026 12:16:48 por Apellidos, Nombre';

async function nuevo(tipo) {
  await pagina.evaluate((t) => { App.nuevoAsuntoCon(t ? { tipo: t } : {}); }, tipo);
  await pagina.waitForTimeout(300);
}
async function leer(texto) {
  await pagina.fill('#aa-texto', texto);
  await pagina.click('#aa-leer');
  await pagina.waitForFunction(() => { const r = document.getElementById('aa-resultado'); return r && r.textContent.trim() && !/Leyendo…/.test(r.textContent); }, null, { timeout: 10000 });
}
const filas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('.aa-fila')).map((f) => ({
  quien: f.querySelector('.aa-quien strong').textContent, grupo: f.querySelector('.aa-quien small').textContent,
  desde: f.querySelector('.aa-desde').value, dias: f.querySelector('.aa-dias').value,
  amarilla: f.classList.contains('aa-amarilla'), gris: f.classList.contains('aa-gris'),
  marcada: f.querySelector('.aa-marca').checked, aviso: Array.from(f.querySelectorAll('.aa-aviso span')).map((s) => s.textContent).join(' | ') })));

console.log('--- 1. el botón ---');
await nuevo(null);
await comprobar('1. sin tipo, el botón no se ve', pagina.evaluate(() => !document.getElementById('aa-abrir') || document.getElementById('aula-aviso-sitio').classList.contains('oculto')), true);
await nuevo('BAJA MATRICULA');
await comprobar('1. con otro tipo, no se ve', pagina.evaluate(() => document.getElementById('aula-aviso-sitio') ? document.getElementById('aula-aviso-sitio').classList.contains('oculto') : true), true);
await nuevo(TIPO);
await comprobar('1. con «EXPULSIÓN AULA CONVICENCIA», se ve', pagina.evaluate(() => !document.getElementById('aula-aviso-sitio').classList.contains('oculto')), true);
await pagina.click('#aa-abrir');

console.log('--- 2. el primer aviso ---');
await leer(AVISO_1);
let f = await filas();
await comprobar('2. una fila, sin amarillo, marcada, con grupo, primer día y días', f.map((x) => [x.quien, x.grupo, x.desde, x.dias, x.amarilla, x.marcada]), [['Navarro Gil, Lucía', '2º B', '2026-11-18', '3', false, true]]);

console.log('--- 3. el segundo aviso ---');
await leer(AVISO_2);
f = await filas();
await comprobar('3. dos filas', f.length, 2);
await comprobar('3. el espacio antes de la coma no impide reconocer al alumno; sin amarillo, 3 de noviembre y 4 días', [f[0].quien, f[0].desde, f[0].dias, f[0].amarilla, f[0].marcada], ['Ortega Paz, Darío', '2026-11-03', '4', false, true]);
await comprobar('3. la segunda, en amarillo, sin marcar, dice que no cuadra', [f[1].amarilla, f[1].marcada, /viernes 5/.test(f[1].aviso), /jueves/.test(f[1].aviso)], [true, false, true, true]);
await pagina.click('.aa-fila[data-i="1"] .aa-opcion >> nth=0');
f = await filas();
await comprobar('3. al elegir «jueves 5» (3 días) deja de ser amarilla y queda marcada', [f[1].amarilla, f[1].marcada, f[1].dias], [false, true, '3']);

console.log('--- 4. líneas raras ---');
await leer('Sin sentido ninguno\nNoExiste Nadie, Pepe (2º B) 2 días, del 18 al 19 de noviembre.\nEnviado el 14/11/2026 06:31:02 por X');
f = await filas();
await comprobar('4. una línea sin sentido sale en amarillo y sin marcar', [f[0].amarilla, f[0].marcada], [true, false]);
await comprobar('4. un alumno que no existe sale en amarillo y sin marcar', [f[1].amarilla, f[1].marcada, /No encuentro a este alumno/.test(f[1].aviso)], [true, false, true]);
await leer('Navarro Gil, Lucía (2º B) 3 días, del 18 al 20 de noviembre.');
f = await filas();
await comprobar('4. sin la línea «Enviado el…», pide el año y no se marca', [f[0].amarilla, f[0].marcada, /año/.test(f[0].aviso)], [true, false, true]);
await pagina.fill('.aa-anio', '2026');
await pagina.dispatchEvent('.aa-anio', 'change');
await pagina.waitForFunction(() => !document.querySelector('.aa-fila.aa-amarilla'), null, { timeout: 5000 });
f = await filas();
await comprobar('4. con el año escrito, se lee y queda marcada', [f[0].desde, f[0].marcada], ['2026-11-18', true]);

console.log('--- 5. crear ---');
await leer(AVISO_2);
await pagina.click('.aa-fila[data-i="1"] .aa-opcion >> nth=0');
await comprobar('5. antes de pulsar «Crear» no hay ningún asunto nuevo', pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /Ortega Paz|Pardo Luna/.test(a.nombre)).length), 0);
await comprobar('5. el botón dice «Crear 2 asuntos»', pagina.textContent('#aa-crear'), 'Crear 2 asuntos');
await pagina.click('#aa-crear');
await pagina.waitForFunction(() => App.E.listaAbiertos.filter((a) => /Ortega Paz|Pardo Luna/.test(a.nombre)).length === 2, null, { timeout: 40000 });
const creados = await pagina.evaluate(async () => {
  const campos = await Campos.leer(App.E.gestor);
  const id = (n) => (campos.propios.filter((p) => p.nombre === n)[0] || {}).id;
  const k1 = Campos.claveDeCampo({ origen: 'propio', id: id('Primer día') }), k2 = Campos.claveDeCampo({ origen: 'propio', id: id('Días lectivos') });
  return App.E.listaAbiertos.filter((a) => /Ortega Paz|Pardo Luna/.test(a.nombre)).map((a) => [/Ortega/.test(a.nombre) ? 'O' : 'P', a.ficha.campos[k1].valor, a.ficha.campos[k2].valor, a.ficha.tipo]).sort();
});
await comprobar('5. un asunto por fila marcada, cada uno con su primer día y sus días', creados, [['O', '2026-11-03', '4', TIPO], ['P', '2026-11-03', '3', TIPO]]);

console.log('--- 6. volver a pegar el mismo aviso ---');
await nuevo(TIPO);
await pagina.click('#aa-abrir');
await leer(AVISO_2);
f = await filas();
await comprobar('6. las dos salen en gris, «Ya existe», sin marcar', f.map((x) => [x.gris, x.marcada]), [[true, false], [true, false]]);

console.log('--- 7. «Nuevo asunto» sin el botón ---');
await nuevo('BAJA MATRICULA');
await comprobar('7. otro tipo, sin botón', pagina.evaluate(() => document.getElementById('aula-aviso-sitio').classList.contains('oculto')), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\nFALLAN ' + fallos : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
