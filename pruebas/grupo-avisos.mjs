/* Fila 295 (docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md, apartado 5): «Enviar un aviso…», un correo a cada persona del grupo
   sin documento. Chromium real, con la copia de pruebas (?demo=1&auto=1), en «GRUPO 2ºB» (ocho personas; Vera, sin correo).

   1. Sin asunto, o sin texto, «Enviar» está apagado. Se envía a las siete que tienen correo; Vera sale en «Sin correo (1)».
   2. Cada persona recibe su saludo, sin adjunto; un solo correo por persona con todas sus direcciones.
   3. Queda en `avisosEnBloque` y sus envíos llevan `aviso` (no `documento`); un solo PDF `CORREO`; una nota; la tarea una vez.
   4. En la tabla, «Qué se mira» lo ofrece («Aviso: <asunto> · hoy») con una sola columna, «Enviado», rellena.
   5. La ficha de la persona enseña su línea «Aviso: <asunto> · enviado el … a …».
   6. Otro aviso: es de nuevo para las siete (cada aviso es suyo). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });   /* fila 299: la demostración tarda un poco más en montarse */
await pagina.waitForTimeout(3500);
await pagina.evaluate(() => {
  window.__asunto = App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre;
  window.__env = []; window.__marcas = 0;
  CorreoEnviar.enviar = async (d) => { window.__env.push(d); return { ok: true, demo: true }; };
  const original = Hitos.marcarGuionPorAccion;
  Hitos.marcarGuionPorAccion = function (a, h, accion) { if (accion === 'comunicar') window.__marcas++; return original.apply(this, arguments); };
});
await pagina.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-aviso');
const antes = await pagina.evaluate(async () => (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(window.__asunto))).map((f) => f.nombre));

console.log('--- 1. el aviso ---');
await pagina.click('.pg-aviso');
await pagina.waitForSelector('#grupo-enviar .ge-asunto');
await comprobar('1. la pantalla de aviso: sin asunto ni texto, «Enviar» apagado; sin adjunto en la muestra',
  pagina.evaluate(() => [document.querySelector('.ge-titulo').textContent, document.querySelector('.ge-enviar').disabled, !!document.querySelector('.ge-m-adjunto'), document.querySelector('.ge-plantilla').value]),
  ['Enviar un aviso a las personas del grupo', true, false, '']);
await comprobar('1. se enviará a siete; «Sin correo (1)» es Vera',
  pagina.evaluate(() => [document.querySelector('.ge-se-envia').textContent, document.querySelector('.ge-ambar strong').textContent, document.querySelector('.ge-ambar .ge-nombres').textContent]),
  ['Se envía a 7 personas', 'Sin correo (1)', 'Gallardo Reyes, Vera']);
await pagina.fill('.ge-asunto', 'Reunión de familias');
await comprobar('1. con asunto pero sin texto, sigue apagado', pagina.evaluate(() => document.querySelector('.ge-enviar').disabled), true);
await pagina.fill('.ge-texto', 'Os esperamos el jueves a las 17:00, {{NOMBRE NATURAL}}.');
await comprobar('1. con asunto y texto, encendido: «Enviar a los 7»', pagina.evaluate(() => [document.querySelector('.ge-enviar').disabled, document.querySelector('.ge-enviar').textContent]), [false, 'Enviar a los 7']);
await comprobar('1. la muestra saluda a la primera por su nombre, con su asunto y su texto, y no lleva adjunto',
  pagina.evaluate(() => [document.querySelector('.ge-m-texto').textContent.split('\n')[0], /Os esperamos el jueves a las 17:00, Noa Castro Reina\./.test(document.querySelector('.ge-m-texto').textContent), document.querySelector('.ge-m-asunto').textContent, !!document.querySelector('.ge-m-adjunto')]),
  ['Hola, Noa Castro Reina:', true, 'Reunión de familias', false]);
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-hechos', { timeout: 40000 });
await comprobar('1. «7 enviados.»', pagina.locator('.ge-hechos').textContent(), '7 enviados.');

console.log('--- 2. lo que salió ---');
const env = await pagina.evaluate(() => window.__env.map((d) => ({ para: d.para, adj: d.adjuntos.length, asunto: d.asunto, hola: d.cuerpo.split('\n')[0], id: d.idEnvio })));
await comprobar('2. siete correos, uno por persona, sin adjunto, con el asunto del aviso y su saludo',
  [env.length, env.every((e) => e.adj === 0), env.every((e) => e.asunto === 'Reunión de familias'), env.map((e) => e.hola).sort(), new Set(env.map((e) => e.id)).size],
  [7, true, true, ['Hola, Bruno Lara Quintero:', 'Hola, Darío Ortega Paz:', 'Hola, Iker Delgado Prieto:', 'Hola, Lucía Navarro Gil:', 'Hola, Nerea Pardo Luna:', 'Hola, Noa Castro Reina:', 'Hola, Sara Ibarra Nieto:'], 7]);
await comprobar('2. cada uno a su dirección (Sara, a las dos)', env.map((e) => e.para).filter((p) => /sara|noa/.test(p)).sort(), ['tutor.noa@correo-demo.es', 'tutor.sara@correo-demo.es, sara.ibarra@correo-demo.es']);
await pagina.click('.ge-cancelar');
await pagina.waitForFunction(() => document.querySelector('.pg-trabajo-lista'), null, { timeout: 15000 });

console.log('--- 3. lo que queda ---');
const f = await pagina.evaluate(() => JSON.parse(JSON.stringify(App.E.registro.asuntos[window.__asunto])));
const avisos = f.avisosEnBloque || [];
await comprobar('3. queda en `avisosEnBloque` con su asunto, su fecha y quién', [avisos.length, avisos[0].asunto, !!avisos[0].cuando, !!avisos[0].id, 'quien' in avisos[0]], [1, 'Reunión de familias', true, true, true]);
const delAviso = f.enviosPorPersona.filter((e) => e.aviso);
await comprobar('3. sus envíos van con `aviso` y `persona`, sin `documento`', [delAviso.length, delAviso.every((e) => e.aviso === avisos[0].id && /^ALUMNADO\|/.test(e.persona) && e.documento === undefined)], [7, true]);
const despues = await pagina.evaluate(async () => (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(window.__asunto))).map((x) => x.nombre));
await comprobar('3. un solo PDF CORREO por tanda, con el asunto del aviso', despues.filter((n) => antes.indexOf(n) === -1 && /CORREO/.test(n)).length === 1 && despues.some((n) => /CORREO Reunión de familias\.pdf$/.test(n)), true);
await comprobar('3. una nota en el asunto, y la tarea de comunicar, una sola vez',
  [f.notas.filter((n) => /Aviso «Reunión de familias» enviado a 7 personas\./.test(n.texto)).length, await pagina.evaluate(() => window.__marcas)], [1, 1]);

console.log('--- 4. la tabla ---');
await comprobar('4. «Qué se mira» ofrece «Aviso: Reunión de familias · hoy» y sale elegido (es el último)',
  pagina.evaluate(() => { const s = document.querySelector('.pg-trabajo-lista'); return [[...s.options].map((o) => o.textContent.replace(/ · .*/, '')), s.options[s.selectedIndex].textContent.replace(/ · \d.*/, ''), /· \d+-\w+-\d{4}$/.test(s.options[s.selectedIndex].textContent)]; }),
  [['Certificado de notas', 'Aviso: Reunión de familias'], 'Aviso: Reunión de familias', true]);
await comprobar('4. una sola columna de trabajo, «Enviado»: Persona, Unidad, Enviado',
  pagina.locator('.pg-tabla thead th').allTextContents(), ['Persona', 'Unidad', 'Enviado', '']);
await comprobar('4. siete filas con fecha y dirección; Vera, vacía; el resumen cuenta los siete',
  pagina.evaluate(() => { const filas = [...document.querySelectorAll('.pg-tabla tbody tr')].map((r) => r.querySelector('.pg-enviado').textContent.trim()); return [filas.filter(Boolean).length, filas[7], document.querySelector('.pg-cuenta').textContent]; }),
  [7, '', '8 personas · 7 enviados']);
await comprobar('4. «Enviar…» ya no tiene a nadie (0)', pagina.evaluate(() => [document.querySelector('.pg-enviar').textContent.replace(/\s+/g, ' '), document.querySelector('.pg-enviar').disabled]), ['Enviar… (0)', true]);

console.log('--- 5. la ficha de la persona ---');
await pagina.evaluate(() => { App.ir('personas'); $('filtro-personas').value = 'ALUMNADO'; });
await pagina.fill('#buscar-personas', 'Navarro');
await pagina.waitForTimeout(600);
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#ficha-persona .ficha-grupo-de .pg-linea-persona', { timeout: 20000 });
await comprobar('5. su línea: «Aviso: Reunión de familias · enviado el … a …» y el nombre del asunto', pagina.evaluate(() => {
  const l = document.querySelector('.ficha-grupo-de .pg-linea-persona');
  return [/^Aviso: Reunión de familias · enviado el \d+-\w+-\d{4} a tutor\.lucia@correo-demo\.es$/.test(l.children[0].textContent.trim()), /Abierto$/.test(l.children[1].textContent)];
}), [true, true]);

console.log('--- 6. otro aviso ---');
await pagina.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-aviso');
await pagina.click('.pg-aviso');
await pagina.waitForSelector('#grupo-enviar .ge-asunto');
await comprobar('6. un aviso nuevo es de nuevo para las siete (no cuenta como enviado el de antes)', pagina.locator('.ge-se-envia').textContent(), 'Se envía a 7 personas');
await pagina.click('.ge-cancelar');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de grupo-avisos pasan.');
process.exit(fallos ? 1 : 0);
