/* Fila 295 (docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md): enviar a todas las personas del grupo de una vez. Chromium real, con
   la copia de pruebas (?demo=1&auto=1), en «GRUPO 2ºB»: Bruno y Sara con su PDF registrado y sin enviar, Vera igual pero sin
   ningún correo, Noa ya enviada, Iker con su Word sin registrar. `CorreoEnviar.enviar` se sustituye por uno que apunta
   las llamadas (y falla cuando la prueba lo pide).

   1. La lógica sin efectos (`GrupoEnviar.clasificar`): quién entra en «se envía», «sin correo», «ya enviado», «sin registrar»;
      «A quién» cambia las listas; el `idEnvio` es de la persona, no de la dirección.
   2. La pantalla: «Enviar… (2)», dos columnas, la muestra de la primera y de la segunda (◀ ▶), el texto cambia para todas,
      «A quién», «Sin correo (1)».
   3. Enviar: un correo por persona con todas sus direcciones en Para; el `idEnvio`; la barra; «2 enviados.»; la tabla; el botón
      a «(0)»; un solo PDF `CORREO`, que abre la fecha de la tabla; la nota; el apunte con `persona` y la tanda; la tarea de
      comunicar, una vez; la línea de la ficha de la persona.
   4. Un fallo suelto sigue con los demás y sale en la tabla y en «Reintentar».
   5. El tope de Google: la tanda se para, «Seguir enviando» y «N envíos por terminar» en Inicio; al seguir no se repite a nadie.
   6. Tres fallos seguidos paran la tanda; se guarda a los diez envíos.
   7. Solo consulta: los botones, apagados y nada sale. */
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
async function nuevaPagina(extra) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); " + (extra || '') + " } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForTimeout(3500);
  await p.evaluate(() => {
    window.__asunto = App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre;
    window.__env = []; window.__falla = null; window.__marcas = 0;
    CorreoEnviar.enviar = async (d) => {
      window.__env.push(d);
      const r = window.__falla && window.__falla(d, window.__env.length);
      return r || { ok: true, demo: true };
    };
    const original = Hitos.marcarGuionPorAccion;
    Hitos.marcarGuionPorAccion = function (a, h, accion) { if (accion === 'comunicar') window.__marcas++; return original.apply(this, arguments); };
  });
  return p;
}
async function abrirTarjeta(p) {
  await p.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
  await p.waitForSelector('#pantalla-asunto:not(.oculto)');
  await p.evaluate(() => FichaTarjetas.abrir('relacionados'));
  await p.waitForSelector('.pg-tabla');
  await p.waitForFunction(() => document.querySelector('.pg-enviar'), null, { timeout: 30000 });
}
const textoBoton = (p, c) => p.evaluate((s) => { const b = document.querySelector(s); return b ? [b.textContent.replace(/\s+/g, ' ').trim(), b.disabled] : null; }, c);
const carpeta = (p) => p.evaluate(async () => (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(window.__asunto))).map((f) => f.nombre).sort());
const ficha = (p) => p.evaluate(() => JSON.parse(JSON.stringify(App.E.registro.asuntos[window.__asunto])));
const celdas = (p, i) => p.locator('.pg-tabla tbody tr').nth(i).locator('td').allTextContents();

/* ================= 1. LA LÓGICA ================= */
console.log('--- 1. la lógica ---');
let pagina = await nuevaPagina();
const est = {
  trabajos: [{ clave: 'pl' }],
  personas: [
    { categoria: 'ALUMNADO', nombre: 'Ana 1', hechos: { pl: { generado: { fichero: 'a.pdf' }, registrado: ['26SM1'], enviado: null } } },
    { categoria: 'ALUMNADO', nombre: 'Beto 2', hechos: { pl: { generado: { fichero: 'b.pdf' }, registrado: ['26SM2'], enviado: null } } },
    { categoria: 'ALUMNADO', nombre: 'Cora 3', hechos: { pl: { generado: { fichero: 'c.pdf' }, registrado: [], enviado: null } } },
    { categoria: 'ALUMNADO', nombre: 'Dani 4', hechos: { pl: { generado: { fichero: 'd.pdf' }, registrado: ['26SM4'], enviado: { fecha: '2026-10-08' } } } },
    { categoria: 'ALUMNADO', nombre: 'Eva 5', hechos: {} }
  ]
};
const ctxDe = { 'ALUMNADO|Ana 1': { campos: { 'Correo del tutor': 't1@x.es', 'Correo del alumno': 'a1@x.es' } }, 'ALUMNADO|Beto 2': { campos: {} },
  'ALUMNADO|Cora 3': { campos: { 'Correo del tutor': 't3@x.es' } }, 'ALUMNADO|Dani 4': { campos: { 'Correo del tutor': 't4@x.es' } } };
const clasif = (aQuien, registro) => pagina.evaluate(([e, personas, q, r]) => {
  const c = GrupoEnviar.clasificar(e, 'pl', { personas, aQuien: q, registro: r });
  const n = (l) => l.map((x) => (x.persona || x).nombre);
  return { envian: c.envian.map((x) => [x.persona.nombre, x.correos]), sin: n(c.sinCorreo), ya: n(c.yaEnviado), sinReg: n(c.sinRegistrar) };
}, [est, ctxDe, aQuien, registro]);
await comprobar('1. con registro: Ana entra con sus dos direcciones; Beto, sin correo; Cora, sin registrar; Dani, ya enviado; Eva no tiene documento',
  clasif('todas', true), { envian: [['Ana 1', ['t1@x.es', 'a1@x.es']]], sin: ['Beto 2'], ya: ['Dani 4'], sinReg: ['Cora 3'] });
await comprobar('1. sin registro en el trabajo, Cora entra', clasif('todas', false).then((c) => c.envian.map((x) => x[0])), ['Ana 1', 'Cora 3']);
await comprobar('1. «A su familia»: solo la del tutor; «Al alumno»: solo la suya, y quien no la tiene pasa a «sin correo»',
  Promise.all([clasif('familia', false), clasif('alumno', false)]).then(([f, a]) => [f.envian, a.envian, a.sin]),
  [[['Ana 1', ['t1@x.es']], ['Cora 3', ['t3@x.es']]], [['Ana 1', ['a1@x.es']]], ['Beto 2', 'Cora 3']]);
await comprobar('1. el idEnvio es de la persona: no depende de la dirección y cambia con otra persona o otro documento',
  pagina.evaluate(() => { const a = { nombre: 'X' }, I = GrupoEnviar.idEnvioDe; return [I(a, 'd.pdf', 'ALUMNADO|Ana') === I(a, 'd.pdf', 'ALUMNADO|Ana'), I(a, 'd.pdf', 'ALUMNADO|Eva') !== I(a, 'd.pdf', 'ALUMNADO|Ana'), I(a, 'e.pdf', 'ALUMNADO|Ana') !== I(a, 'd.pdf', 'ALUMNADO|Ana')]; }), [true, true, true]);
await pagina.close();

/* ================= 2. LA PANTALLA ================= */
console.log('--- 2. la pantalla ---');
pagina = await nuevaPagina();
await abrirTarjeta(pagina);
await comprobar('2. el botón de la tarjeta: «Enviar… (2)», encendido; y «Enviar un aviso…»',
  Promise.all([textoBoton(pagina, '.pg-enviar'), textoBoton(pagina, '.pg-aviso')]), [['Enviar… (2)', false], ['Enviar un aviso…', false]]);
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await comprobar('2. a pantalla completa, en dos columnas que ocupan todo el ancho; el botón de enviar a la vista sin bajar',
  pagina.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), v = window.innerWidth, h = window.innerHeight;
    return [r('#grupo-enviar').width >= v - 1, r('.ge-izq').width > v * 0.4, r('.ge-der').width > v * 0.4, r('.ge-izq').left < 30, r('.ge-der').right > v - 30, r('.ge-enviar').bottom <= h]; }),
  [true, true, true, true, true, true]);
await comprobar('2. el correo de la primera: Para con su dirección, su saludo, y su PDF como adjunto',
  pagina.evaluate(() => [document.querySelector('.ge-m-para').textContent, document.querySelector('.ge-m-texto').textContent.split('\n')[0], /\.pdf$/.test(document.querySelector('.ge-m-adjunto').textContent), document.querySelector('.ge-nav-texto').textContent]),
  [await pagina.evaluate(() => document.querySelector('.ge-m-para').textContent), 'Hola, Bruno Lara Quintero:', true, '1 de 2']);
const primero = await pagina.evaluate(() => [document.querySelector('.ge-m-para').textContent, document.querySelector('.ge-m-adjunto').textContent]);
await comprobar('2. su dirección es la de su tutor', primero[0], 'tutor.bruno@correo-demo.es');
await comprobar('2. a la derecha: «Se envía a 2 personas», «Sin correo (1)» con Vera, y «Ya enviado (1)»',
  pagina.evaluate(() => [document.querySelector('.ge-se-envia').textContent, document.querySelector('.ge-ambar strong').textContent, document.querySelector('.ge-ambar .ge-nombres').textContent, document.querySelector('.ge-gris summary').textContent]),
  ['Se envía a 2 personas', 'Sin correo (1)', 'Gallardo Reyes, Vera', 'Ya enviado (1)']);
const muestraCon = (t) => pagina.waitForFunction((x) => document.querySelector('.ge-m-texto') && document.querySelector('.ge-m-texto').textContent.indexOf(x) !== -1, t, { timeout: 10000 });
await pagina.click('.ge-sig');
await muestraCon('Hola, Sara');
await comprobar('2. ▶ enseña el de la segunda: otro nombre y otro adjunto',
  pagina.evaluate(() => [document.querySelector('.ge-m-texto').textContent.split('\n')[0], document.querySelector('.ge-m-adjunto').textContent, document.querySelector('.ge-nav-texto').textContent]),
  ['Hola, Sara Ibarra Nieto:', await pagina.evaluate(() => document.querySelector('.ge-m-adjunto').textContent), '2 de 2']);
await comprobar('2. y su adjunto no es el de la primera', pagina.evaluate((p) => document.querySelector('.ge-m-adjunto').textContent !== p, primero[1]), true);
await pagina.fill('.ge-texto', 'Hola a todos. Adjunto va su certificado, {{NOMBRE NATURAL}}.');
await comprobar('2. cambiar el texto una vez: la muestra de la segunda cambia y los huecos se rellenan con su nombre',
  pagina.evaluate(() => /Adjunto va su certificado, Sara Ibarra Nieto\./.test(document.querySelector('.ge-m-texto').textContent)), true);
await pagina.click('.ge-ant');
await muestraCon('certificado, Bruno');
await comprobar('2. y la de la primera, igual, con el suyo', pagina.evaluate(() => /Adjunto va su certificado, Bruno Lara Quintero\./.test(document.querySelector('.ge-m-texto').textContent)), true);
await pagina.selectOption('.ge-aquien', 'familia');
await comprobar('2. «A su familia» deja solo la dirección del tutor de Sara; «A todas» las dos; «Al alumno» solo la suya (y Bruno pasa a «sin correo»)',
  (async () => {
    const lista = () => pagina.evaluate(() => [...document.querySelectorAll('.ge-lista li')].map((l) => l.textContent.replace(/\s+/g, ' ')));
    const a = await lista();
    await pagina.selectOption('.ge-aquien', 'todas'); const b = await lista();
    await pagina.selectOption('.ge-aquien', 'alumno'); const c = await lista(); const sin = await pagina.locator('.ge-ambar strong').textContent();
    await pagina.selectOption('.ge-aquien', 'todas');
    return [a, b, c, sin];
  })(),
  [['Lara Quintero, Bruno tutor.bruno@correo-demo.es', 'Ibarra Nieto, Sara tutor.sara@correo-demo.es'],
   ['Lara Quintero, Bruno tutor.bruno@correo-demo.es', 'Ibarra Nieto, Sara tutor.sara@correo-demo.es, sara.ibarra@correo-demo.es'],
   ['Ibarra Nieto, Sara sara.ibarra@correo-demo.es'], 'Sin correo (2)']);
await comprobar('2. «Copiar los nombres» está', pagina.locator('.ge-copiar').count(), 1);
await comprobar('2. «Cancelar» cierra la pantalla sin enviar nada', (async () => { await pagina.click('.ge-cancelar'); return [await pagina.locator('#grupo-enviar').count(), (await pagina.evaluate(() => window.__env)).length]; })(), [0, 0]);
await pagina.close();

/* ================= 3. ENVIAR ================= */
console.log('--- 3. enviar ---');
pagina = await nuevaPagina();
await abrirTarjeta(pagina);
const antes = await carpeta(pagina);
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await pagina.fill('.ge-texto', 'Le enviamos adjunto el certificado de {{NOMBRE NATURAL}}.');
await pagina.selectOption('.ge-aquien', 'todas');
await comprobar('3. el botón dice «Enviar a los 2»', textoBoton(pagina, '.ge-enviar'), ['Enviar a los 2', false]);
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-hechos', { timeout: 30000 });
await comprobar('3. el resultado: «2 enviados.»', pagina.locator('.ge-hechos').textContent(), '2 enviados.');
const env = await pagina.evaluate(() => window.__env.map((d) => ({ para: d.para, cco: d.cco, asunto: d.asunto, adj: d.adjuntos.map((x) => x.nombre), id: d.idEnvio, hola: d.cuerpo.split('\n')[0], cuerpo: d.cuerpo })));
await comprobar('3. dos correos, uno por persona, con todas sus direcciones en Para y su adjunto',
  env.map((e) => [e.para, e.cco, e.adj.length, e.hola]), [['tutor.bruno@correo-demo.es', '', 1, 'Hola, Bruno Lara Quintero:'], ['tutor.sara@correo-demo.es, sara.ibarra@correo-demo.es', '', 1, 'Hola, Sara Ibarra Nieto:']]);
await comprobar('3. cada uno con su texto, su asunto de siempre y un idEnvio distinto y fijo',
  pagina.evaluate((e) => [/certificado de Bruno Lara Quintero\./.test(e[0].cuerpo), /certificado de Sara Ibarra Nieto\./.test(e[1].cuerpo), e[0].asunto === window.__asunto,
    e[0].id === GrupoEnviar.idEnvioDe({ nombre: window.__asunto }, e[0].adj[0], 'ALUMNADO|' + App.E.registro.asuntos[window.__asunto].relacionados[2].nombre.replace(/.*/, (n) => n)), e[0].id !== e[1].id], env),
  [true, true, true, true, true]);
await comprobar('3. «Enviar a los 0» queda apagado, y se puede cerrar', Promise.all([textoBoton(pagina, '.ge-enviar'), pagina.locator('.ge-cancelar').textContent()]), [['Enviar a los 0', true], 'Cerrar']);
await pagina.click('.ge-cancelar');
await pagina.waitForFunction(() => document.querySelector('.pg-enviar') && /\(0\)/.test(document.querySelector('.pg-enviar').textContent));
await comprobar('3. en la tarjeta, «Enviar… (0)» apagado', textoBoton(pagina, '.pg-enviar'), ['Enviar… (0)', true]);
await comprobar('3. en la tabla, Bruno y Sara tienen fecha y dirección en «Enviado»; Iker, Vera y los demás, no',
  Promise.all([2, 6, 1, 7].map((i) => celdas(pagina, i).then((c) => c[c.length - 2]))).then(([b, s, i, v]) => [/tutor\.bruno@correo-demo\.es/.test(b), /sara\.ibarra@correo-demo\.es/.test(s), i, v]), [true, true, '', '']);
const despues = await carpeta(pagina);
const nuevos = despues.filter((n) => antes.indexOf(n) === -1 && /CORREO/.test(n));
await comprobar('3. en la carpeta, un solo PDF CORREO nuevo (no dos)', nuevos.length, 1);
await comprobar('3. y dentro están el texto de muestra y las dos personas, con su dirección y su fecha',
  pagina.evaluate(async (n) => {
    const f = await (await (await App.E.abiertos.getDirectoryHandle(window.__asunto)).getFileHandle(n)).getFile();
    const t = (await RegistroLector.textoDe(f, 5)).replace(/\s+/g, ' ');
    const hoy = new Date(), dd = String(hoy.getDate()).padStart(2, '0') + '/' + String(hoy.getMonth() + 1).padStart(2, '0') + '/' + hoy.getFullYear();
    return [/certificado de Bruno Lara Quintero\./.test(t), /Enviado a 2 personas/.test(t), /Lara Quintero, Bruno — tutor\.bruno@correo-demo\.es — /.test(t),
      /Ibarra Nieto, Sara — tutor\.sara@correo-demo\.es, sara\.ibarra@correo-demo\.es — /.test(t), t.split(dd).length - 1 >= 3];
  }, nuevos[0]), [true, true, true, true, true]);
const f1 = await ficha(pagina);
await comprobar('3. los apuntes llevan `persona`, el documento y la tanda (sin `aviso`); hay una tanda con su PDF y una sola nota',
  [f1.enviosPorPersona.slice(-2).map((e) => [/^ALUMNADO\|/.test(e.persona), /\.pdf$/.test(e.documento), !!e.tanda, e.aviso === undefined]), f1.tandasDeEnvio.length, f1.tandasDeEnvio[0].pdf === nuevos[0],
    f1.notas.filter((n) => /Enviado a 2 personas, cada una con su documento\./.test(n.texto)).length],
  [[[true, true, true, true], [true, true, true, true]], 1, true, 1]);
await comprobar('3. la tarea de comunicar del hito actual, marcada una sola vez', pagina.evaluate(() => window.__marcas), 1);
await comprobar('3. la columna «Enviado» de Bruno abre el PDF de esa tanda', (async () => {
  const b = pagina.locator('.pg-tabla tbody tr').nth(2).locator('.pg-enviado .pg-abrir');
  const ficheroDelBoton = await b.getAttribute('data-fichero');
  return [ficheroDelBoton === nuevos[0]];
})(), [true]);
await pagina.locator('.pg-tabla tbody tr').nth(2).locator('.pg-enviado .pg-abrir').click();
await pagina.waitForTimeout(2500);
await comprobar('3. y se abre en el visor', pagina.evaluate(() => !!document.querySelector('#lector:not(.oculto), #visor-lateral:not(.oculto), .lector:not(.oculto)') || document.body.className), true);
await pagina.close();

/* ================= 3b. LA FICHA DE LA PERSONA ================= */
console.log('--- 3b. la ficha de Sara ---');
pagina = await nuevaPagina();
await pagina.evaluate(() => { App.ir('personas'); $('filtro-personas').value = 'ALUMNADO'; });
await pagina.fill('#buscar-personas', 'Ibarra');
await pagina.waitForTimeout(600);
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#ficha-persona .ficha-grupo-de .pg-linea-persona', { timeout: 20000 });
await comprobar('3b. su línea: generado y registrado (todavía sin enviar)', pagina.locator('.ficha-grupo-de .pg-linea-persona > div').first().textContent().then((t) => /generado el .* · registrado 26SM0431|registrado 26SM0430/.test(t) && !/enviado/.test(t)), true);
await pagina.close();

/* ================= 4. UN FALLO SUELTO ================= */
console.log('--- 4. un fallo suelto ---');
pagina = await nuevaPagina();
await abrirTarjeta(pagina);
await pagina.evaluate(() => { window.__falla = (d) => /bruno/.test(d.para) ? { ok: false, motivo: 'La dirección no existe' } : null; });
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-reintentar', { timeout: 30000 });
await comprobar('4. sigue con la otra: «1 enviado. 1 no ha salido:» con su nombre y su motivo, y «Reintentar los 1»',
  pagina.evaluate(() => [document.querySelector('.ge-hechos').textContent.replace(/\s+/g, ' ').trim(), document.querySelector('.ge-fallos').textContent, document.querySelector('.ge-reintentar').textContent, window.__env.length]),
  ['1 enviado. 1 no ha salido:', 'Lara Quintero, Bruno: La dirección no existe', 'Reintentar los 1', 2]);
await pagina.click('.ge-cancelar');
await pagina.waitForFunction(() => document.querySelector('.pg-enviar') && /\(1\)/.test(document.querySelector('.pg-enviar').textContent));
await comprobar('4. en la tabla, esa fila dice «No ha salido: …» y la otra tiene su fecha; el botón sigue en (1)',
  Promise.all([celdas(pagina, 2).then((c) => c[c.length - 2]), celdas(pagina, 6).then((c) => /sara\.ibarra/.test(c[c.length - 2])), textoBoton(pagina, '.pg-enviar')]),
  ['No ha salido: La dirección no existe', true, ['Enviar… (1)', false]]);
await comprobar('4. y en rojo', pagina.evaluate(() => getComputedStyle(document.querySelector('.pg-fallo')).color !== getComputedStyle(document.body).color), true);
await pagina.evaluate(() => { window.__falla = null; });
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-hechos');
await comprobar('4. al repetir, solo sale para Bruno (Sara no se repite)', pagina.evaluate(() => [window.__env.length, window.__env[2].para, document.querySelector('.ge-hechos').textContent]), [3, 'tutor.bruno@correo-demo.es', '1 enviado.']);
await comprobar('4. y se marcó la tarea una sola vez, al terminar todos', pagina.evaluate(() => window.__marcas), 1);
await pagina.close();

/* ================= 5. EL TOPE DE GOOGLE ================= */
console.log('--- 5. el tope diario ---');
pagina = await nuevaPagina();
await abrirTarjeta(pagina);
await pagina.evaluate(() => { window.__falla = (d, n) => n >= 2 ? { ok: false, motivo: 'Service invoked too many times per day: email.' } : null; });
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-tope', { timeout: 30000 });
await comprobar('5. la tanda se para sola y lo dice', pagina.evaluate(() => [document.querySelector('.ge-tope').textContent, window.__env.length, !!document.querySelector('.ge-reintentar')]),
  ['Google no deja enviar más por hoy. Quedan 1 por enviar. Mañana, pulsa «Seguir enviando».', 2, false]);
const fp = await ficha(pagina);
await comprobar('5. en la ficha queda `envioPendiente` y el primero ya constaba', [fp.envioPendiente && fp.envioPendiente.cuantos, !!fp.envioPendiente.trabajo, fp.enviosPorPersona.length], [1, true, 2]);
await pagina.click('.ge-cancelar');
await pagina.waitForFunction(() => document.querySelector('.pg-enviar') && /Seguir enviando/.test(document.querySelector('.pg-enviar').textContent));
await comprobar('5. el botón pasa a «Seguir enviando (1)»; la que falta, «Pendiente de enviar» en la tabla',
  Promise.all([textoBoton(pagina, '.pg-enviar'), celdas(pagina, 6).then((c) => c[c.length - 2])]), [['Seguir enviando (1)', false], 'Pendiente de enviar']);
await comprobar('5. en Inicio, el aviso «1 envío por terminar»', (async () => {
  await pagina.evaluate(() => { GrupoEnviar.avisar(); App.ir('abiertos'); });
  await pagina.waitForSelector('[data-aviso="envios-pendientes"]', { timeout: 10000 });
  return pagina.locator('[data-aviso="envios-pendientes"]').textContent();
})(), '1 envío por terminar');
await pagina.evaluate(() => { window.__falla = null; window.__env.length = 0; });
await pagina.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-enviar');
await pagina.click('.pg-enviar');
await pagina.waitForSelector('#grupo-enviar .ge-m-para');
await pagina.click('.ge-enviar');
await pagina.waitForSelector('.ge-hechos');
await comprobar('5. «Seguir enviando» manda solo a la que faltaba (nadie se repite) y quita el envío pendiente',
  Promise.all([pagina.evaluate(() => window.__env.map((d) => d.para)), ficha(pagina).then((f) => [f.envioPendiente === undefined, f.enviosPorPersona.length])]), [['tutor.sara@correo-demo.es, sara.ibarra@correo-demo.es'], [true, 3]]);
await comprobar('5. se marcó la tarea una vez', pagina.evaluate(() => window.__marcas), 1);
await pagina.close();

/* ================= 6. TRES SEGUIDOS Y LOS DIEZ ================= */
console.log('--- 6. tres fallos seguidos, y se guarda a los diez ---');
pagina = await nuevaPagina();
await abrirTarjeta(pagina);
const r6 = await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === window.__asunto)[0];
  const items = [];
  for (let i = 1; i <= 12; i++) items.push({ rel: { categoria: 'ALUMNADO', nombre: 'Prueba ' + i }, correos: ['p' + i + '@correo-demo.es'], nombreDoc: '' });
  /* a) a los diez, ya consta lo enviado */
  let guardadosAlOnce = -1;
  window.__falla = (d, n) => { if (n === 11) guardadosAlOnce = (App.E.registro.asuntos[window.__asunto].enviosPorPersona || []).filter((e) => e.aviso === 'av-prueba').length; return null; };
  const r1 = await GrupoEnviar.enviarTanda(a, { trabajo: 'aviso:av-prueba', aviso: 'av-prueba', asunto: 'x', texto: 'y', tanda: 't1', items: items }, { avanzar() {}, parado: () => false });
  const finales = (App.E.registro.asuntos[window.__asunto].enviosPorPersona || []).filter((e) => e.aviso === 'av-prueba').length;
  /* b) tres seguidos paran la tanda */
  window.__env.length = 0;
  window.__falla = () => ({ ok: false, motivo: 'No va' });
  const r2 = await GrupoEnviar.enviarTanda(a, { trabajo: 'aviso:av-otro', aviso: 'av-otro', asunto: 'x', texto: 'y', tanda: 't2', items: items }, { avanzar() {}, parado: () => false });
  return { guardadosAlOnce, finales, enviados1: r1.enviados.length, llamadas2: window.__env.length, tope2: r2.tope, fallos2: r2.fallos.length, quedan2: r2.quedan };
});
await comprobar('6. a los diez envíos ya constan en la ficha (al llegar al once); al terminar, los doce', [r6.guardadosAlOnce, r6.finales, r6.enviados1], [10, 12, 12]);
await comprobar('6. tres fallos seguidos paran la tanda: tres llamadas, no doce', [r6.llamadas2, r6.tope2, r6.fallos2, r6.quedan2], [3, 'seguidos', 3, 12]);
await comprobar('6. el texto de la parada dice cuántas quedan', pagina.evaluate(() => GrupoEnviar.textoDeParada({ tope: 'seguidos' }, 9)), 'Han fallado tres envíos seguidos y paro aquí. Quedan 9 por enviar. Cuando quieras, pulsa «Seguir enviando».');
await pagina.close();

/* ================= 7. SOLO CONSULTA ================= */
console.log('--- 7. solo consulta ---');
pagina = await nuevaPagina("localStorage.setItem('gestor.soloConsulta', '1');");
await abrirTarjeta(pagina);
await pagina.waitForTimeout(500);
await comprobar('7. «Enviar…» y «Enviar un aviso…» apagados, y no sale nada', Promise.all([textoBoton(pagina, '.pg-enviar'), textoBoton(pagina, '.pg-aviso'), pagina.evaluate(() => [window.__env.length, Demo.escrituras()])]),
  [['Enviar… (1)', true], ['Enviar un aviso…', true], [0, 0]]);   /* en solo consulta no se coloca el PDF sellado de Bruno: solo cuenta Sara */
await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de grupo-enviar pasan.');
process.exit(fallos ? 1 : 0);
