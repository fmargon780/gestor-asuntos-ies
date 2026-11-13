/* Prueba en navegador de verdad de la fila 627 (docs/627-ASUNTO-Y-EXTRACTO.md): el asunto de correos y mensajes de Séneca
   y el extracto del registro los compone la app, no el nombre de la carpeta. Disco de mentira de pruebas/navegador.mjs.

   1. La composición (pura): el número del asunto al final, sin repetirse; sin separadores sueltos ni líneas vacías; varias
      líneas en el extracto; un asunto sin número sigue con el nombre de la carpeta.
   2. Ajustes → El centro → «Asunto y extracto»: los dos textos, «+ Campo variable» (el asunto no ofrece los campos del
      documento; el extracto, sí), «Así sale», y se guarda.
   3. Ajustes → Tipos de documento: «Extracto de este tipo», «Extracto propio» / «Extracto general».
   4. Plantilla de correo: campo «Asunto» debajo del nombre, con «Así sale» (vacío, el general).
   5. «Correo de este asunto» y «Mensaje de Séneca»: sin plantilla, el general; con plantilla con asunto, el suyo; cambia con la
      plantilla; se puede retocar; nunca el nombre de la carpeta. Un asunto de antes, sin número, sigue con el nombre.
   6. Ficha: «Asunto» copia el compuesto; «Extracto» junto a «Ruta» en «Documentos de la carpeta» y en el hito, con el de su
      tipo de documento o el general, sus líneas y el número del asunto al final; en el asunto de antes, el nombre de la carpeta.
   7. La bandeja: un correo con el número de un asunto en su asunto se propone para ese asunto; sin número, el nombre de la carpeta
      sigue valiendo.
   8. El control del registro: un apunte de Séneca con un extracto de varias líneas se une a su asunto por el número. */
import { chromium } from 'playwright';
import { abrirHito } from './apoyo/hito.mjs';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const NUEVO = '261023 A26-0003 CONVALIDACION Espejo Montes, Carla 2100006';
const VIEJO = '260918 CONVALIDACION 26-27 Pérez Ruiz, Ana 1150055';
const DOC_RESOLUCION = '261109 RESOLUCION D26-00008.pdf';
const DOC_FACTURA = '261110 FACTURA D26-00009.pdf';
const GUIAS = { CONVALIDACION: [{ id: 'h1', titulo: 'Tramitar', cuerpo: '', opciones: [], responsable: '' }] };

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const escribir = async (n, t) => { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(t); await w.close(); };
  await escribir('guias.json', JSON.stringify(guias));
  await escribir('rutas.json', JSON.stringify({ abiertos: 'IES/ASUNTOS ABIERTOS', archivo: 'ARCHIVO' }));
  localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\francisco\\Dropbox');
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([NUEVO, VIEJO, DOC_RESOLUCION, DOC_FACTURA]) => {
  async function fichero(dir, nombre) { const h = await dir.getFileHandle(nombre, { create: true }); const w = await h.createWritable(); await w.write('%PDF-1.4\n%%EOF'); await w.close(); }
  const nuevo = await window.__disco.abiertos.getDirectoryHandle(NUEVO, { create: true });
  await fichero(nuevo, DOC_RESOLUCION);
  await fichero(nuevo, DOC_FACTURA);
  const viejo = await window.__disco.abiertos.getDirectoryHandle(VIEJO, { create: true });
  await fichero(viejo, DOC_RESOLUCION);
  ['RESOLUCION', 'FACTURA'].forEach((t) => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.anotar(NUEVO, { tercero: 'Espejo Montes, Carla 2100006', categoria: 'ALUMNADO', tipo: 'CONVALIDACION', numero: 'A26-0003' });
  await App.anotar(VIEJO, { tercero: 'Pérez Ruiz, Ana 1150055', categoria: 'ALUMNADO', tipo: 'CONVALIDACION' });
  await App.cargarRegistro();
  await App.verAbiertos();
}, [NUEVO, VIEJO, DOC_RESOLUCION, DOC_FACTURA]);

async function pegado(clic) {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await clic();
  /* El portapapeles se lee con sondeos desde aquí: el texto se compone al pulsar y tarda un momento. */
  let t = '(nada)';
  const limite = Date.now() + 20000;
  while (t === '(nada)' && Date.now() < limite) {
    await pagina.waitForTimeout(100);
    try { t = await pagina.evaluate(() => navigator.clipboard.readText()); } catch (e) { /* sin foco un instante */ }
  }
  await pagina.waitForTimeout(1300);
  return t;
}
const sale = (id) => pagina.evaluate((i) => document.querySelector('#' + i + '-sale .ae-resultado').textContent, id);

/* ================= 1. LA COMPOSICIÓN ================= */
console.log('--- 1. componer ---');
const M = { tipo: 'CONVALIDACION', nombre: 'Espejo Montes, Carla', grupo: '4º A', descripcion: '', 'numero del asunto': 'A26-0003',
  'tipo de documento': 'RESOLUCION', 'fecha del documento': '09/11/2026', campos: {} };
const comp = (modelo, una, valores, numero) => pagina.evaluate(([m, u, v, n]) => AsuntoExtracto.componer(m, v, n, u), [modelo, una, valores || M, numero === undefined ? 'A26-0003' : numero]);
await comprobar('1. el modelo de partida del asunto: tipo · tercero, y el número al final',
  comp(await pagina.evaluate(() => AsuntoExtracto.MODELO_ASUNTO), true), 'CONVALIDACION · Espejo Montes, Carla · A26-0003');
await comprobar('1. si el modelo ya lleva el número, no se repite (puede ir donde se quiera)',
  comp('{numero del asunto} {tipo}', true), 'A26-0003 CONVALIDACION');
await comprobar('1. un hueco sin dato no deja separadores sueltos',
  comp('{descripcion} · {tipo} · {descripcion} · {nombre}', true), 'CONVALIDACION · Espejo Montes, Carla · A26-0003');
await comprobar('1. el extracto de partida: dos líneas, y el número al final de la última',
  comp(await pagina.evaluate(() => AsuntoExtracto.MODELO_EXTRACTO), false), 'RESOLUCION · CONVALIDACION\nEspejo Montes, Carla · 4º A · A26-0003');
await comprobar('1. sin líneas vacías, y si una línea se queda sin datos desaparece',
  comp('Una\n\n{descripcion}\n{tipo}', false), 'Una\nCONVALIDACION · A26-0003');
await comprobar('1. el asunto de una sola línea aunque el modelo tenga varias',
  comp('Uno\n{tipo}', true), 'Uno CONVALIDACION · A26-0003');
await comprobar('1. un asunto de antes (sin número): el nombre de la carpeta, como asunto y como extracto',
  pagina.evaluate(async ([v]) => { const a = App.E.listaAbiertos.find((x) => x.nombre === v);
    return [await AsuntoExtracto.asunto(a), await AsuntoExtracto.extractoDeDocumento(a, '261109 RESOLUCION D26-00008.pdf')]; }, [VIEJO]), [VIEJO, VIEJO]);

/* ================= 2. AJUSTES → EL CENTRO ================= */
console.log('--- 2. Ajustes → El centro ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.waitForSelector('#bloque-asunto-extracto #ae-asunto-general', { state: 'attached' });
await pagina.evaluate(() => { document.getElementById('bloque-asunto-extracto').open = true; });
await comprobar('2. la tarjeta «Asunto y extracto» está en «El centro»',
  pagina.evaluate(() => [document.querySelector('#bloque-asunto-extracto .bloque-titulo').textContent, !!document.querySelector('#ajustes-tab-centro #bloque-asunto-extracto')]),
  ['Asunto y extracto', true]);
await comprobar('2. el asunto general vacío: «Así sale» enseña el de partida con el número al final',
  sale('ae-asunto-general'), 'BAJA MATRICULA · Espejo Montes, Carla · A26-0003');
await comprobar('2. el extracto general: admite varias líneas y «Así sale» las enseña, con el número al final de la última',
  (async () => { await pagina.fill('#ae-extracto-general', '{tipo de documento} · {tipo}\n{nombre}'); return sale('ae-extracto-general'); })(),
  'RESOLUCION · BAJA MATRICULA\nEspejo Montes, Carla · A26-0003');
await comprobar('2. con el campo del número dentro del modelo, no se repite',
  (async () => { await pagina.fill('#ae-asunto-general', '{numero del asunto} · {tipo}'); return sale('ae-asunto-general'); })(), 'A26-0003 · BAJA MATRICULA');
await comprobar('2. sin el número en el modelo, termina en « · » y el número',
  (async () => { await pagina.fill('#ae-asunto-general', '{tipo} · {nombre}'); return sale('ae-asunto-general'); })(), 'BAJA MATRICULA · Espejo Montes, Carla · A26-0003');
async function camposQueSeOfrecen(idBoton) {
  await pagina.click('#' + idBoton);
  await pagina.waitForSelector('.cuadro-campos #ce-buscar');
  const r = [];
  for (const n of ['Tipo de documento', 'Fecha del documento', 'Número del documento', 'Número del asunto', 'Nombre del tercero']) {
    await pagina.fill('.cuadro-campos #ce-buscar', n);
    await pagina.waitForTimeout(100);
    r.push(await pagina.evaluate((x) => [...document.querySelectorAll('.cuadro-campos .campos-fila-nombre')].some((e) => e.firstChild.textContent.trim() === x), n));
  }
  await pagina.click('.cuadro-campos #ce-cerrar');
  return r;
}
await comprobar('2. «+ Campo variable» del asunto: el número y el tercero sí; los campos del documento, no',
  camposQueSeOfrecen('ae-asunto-general-campo'), [false, false, false, true, true]);
await comprobar('2. «+ Campo variable» del extracto: también los del documento',
  camposQueSeOfrecen('ae-extracto-general-campo'), [true, true, true, true, true]);
await pagina.fill('#ae-asunto-general', '{tipo} · {nombre}');
await pagina.fill('#ae-extracto-general', '{tipo de documento} · {tipo}\n{nombre}');
await pagina.click('#ae-guardar');
await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#mensajes .mensaje.bueno')).some((m) => m.textContent.indexOf('Asunto y extracto guardados') === 0));
await comprobar('2. se guarda en los ajustes del centro',
  pagina.evaluate(async () => { const d = await Plantillas.cargar(App.E.gestor); return [d.asuntoGeneral, d.extractoGeneral]; }),
  ['{tipo} · {nombre}', '{tipo de documento} · {tipo}\n{nombre}']);

/* ================= 3. TIPOS DE DOCUMENTO ================= */
console.log('--- 3. tipos de documento ---');
await pagina.click('[data-ajustes-pestana="dia"]');
await pagina.evaluate(() => { document.getElementById('bloque-tipos-documento').open = true; App.pintarTiposDeDocumento(); });
const tarjeta = (t) => '#tabla-tipos-documento .tarjeta-tipo[data-tipo-doc="' + t + '"]';
async function abrirExtractoDeTipo(t) {
  await pagina.click(tarjeta(t) + ' .tarjeta-tipo-menu-btn');
  await pagina.locator(tarjeta(t) + ' .tarjeta-tipo-menu button', { hasText: 'Extracto de este tipo' }).click();
  await pagina.waitForSelector('#capa:not(.oculto) #ae-extracto-tipo');
}
await comprobar('3. la tarjeta de un tipo sin extracto propio dice «Extracto general»',
  pagina.evaluate((s) => document.querySelector(s + ' .tarjeta-tipo-extracto').textContent.trim(), tarjeta('RESOLUCION')), '· Extracto general');
await abrirExtractoDeTipo('RESOLUCION');
await comprobar('3. el cuadro «Extracto de RESOLUCION»: vacío, «Así sale» enseña el general y lo dice',
  pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('ae-extracto-tipo').value,
    document.querySelector('#ae-extracto-tipo-sale .ae-resultado').textContent, document.querySelector('#ae-extracto-tipo-sale .ae-de').textContent]),
  ['Extracto de RESOLUCION', '', 'RESOLUCION · BAJA MATRICULA\nEspejo Montes, Carla · A26-0003', '(el general del centro)']);
await pagina.fill('#ae-extracto-tipo', 'Resolución de {tipo}\n{nombre} · {fecha del documento}');
await comprobar('3. con texto, «Así sale» lo enseña con sus líneas y dice que es el de este tipo',
  pagina.evaluate(() => [document.querySelector('#ae-extracto-tipo-sale .ae-resultado').textContent, document.querySelector('#ae-extracto-tipo-sale .ae-de').textContent]),
  ['Resolución de BAJA MATRICULA\nEspejo Montes, Carla · 09/11/2026 · A26-0003', '(el de este tipo)']);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForFunction(async () => !!((await Plantillas.cargar(App.E.gestor)).extractosPorTipo || {}).RESOLUCION);
await comprobar('3. guardado: la tarjeta dice «Extracto propio» y los ajustes lo llevan',
  pagina.evaluate(async (s) => [document.querySelector(s + ' .tarjeta-tipo-extracto').textContent.trim(), (await Plantillas.cargar(App.E.gestor)).extractosPorTipo],
    tarjeta('RESOLUCION')), ['· Extracto propio', { RESOLUCION: 'Resolución de {tipo}\n{nombre} · {fecha del documento}' }]);
await abrirExtractoDeTipo('FACTURA');
await pagina.fill('#ae-extracto-tipo', 'Factura de {nombre}');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForFunction(async () => !!((await Plantillas.cargar(App.E.gestor)).extractosPorTipo || {}).FACTURA);
await abrirExtractoDeTipo('FACTURA');
await pagina.fill('#ae-extracto-tipo', '');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForFunction(async () => !((await Plantillas.cargar(App.E.gestor)).extractosPorTipo || {}).FACTURA);
await comprobar('3. vaciado: la tarjeta vuelve a «Extracto general» y el tipo sale de los ajustes',
  pagina.evaluate(async (s) => [document.querySelector(s + ' .tarjeta-tipo-extracto').textContent.trim(), Object.keys((await Plantillas.cargar(App.E.gestor)).extractosPorTipo)],
    tarjeta('FACTURA')), ['· Extracto general', ['RESOLUCION']]);

/* ================= 4. LA PLANTILLA ================= */
console.log('--- 4. plantilla de correo ---');
await pagina.evaluate(() => PlantillasAjustes.abrirCuadroDePlantilla(null, { tipo: 'CONVALIDACION', categoria: 'ALUMNADO' }, function () {}));
await pagina.waitForSelector('#capa:not(.oculto) #pl-asunto');
await comprobar('4. el campo «Asunto» está justo debajo del nombre de la plantilla',
  pagina.evaluate(() => { const n = document.getElementById('pl-nombre'); const l = n.nextElementSibling;
    return [l.tagName, l.textContent.trim(), document.getElementById('pl-asunto').placeholder]; }),
  ['LABEL', 'Asunto', 'Vacío: sale el asunto general del centro']);
await comprobar('4. vacío, «Así sale» enseña el general y lo dice',
  pagina.evaluate(() => [document.querySelector('#pl-asunto-sale .ae-resultado').textContent, document.querySelector('#pl-asunto-sale .ae-de').textContent]),
  ['BAJA MATRICULA · Espejo Montes, Carla · A26-0003', '(el general del centro)']);
await pagina.fill('#pl-asunto', 'Resolución · {nombre}');
await comprobar('4. con asunto propio, «Así sale» enseña el suyo',
  pagina.evaluate(() => [document.querySelector('#pl-asunto-sale .ae-resultado').textContent, document.querySelector('#pl-asunto-sale .ae-de').textContent]),
  ['Resolución · Espejo Montes, Carla · A26-0003', '(el de esta plantilla)']);
await pagina.fill('#pl-nombre', 'Con asunto');
await pagina.fill('#pl-texto', 'Hola');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.evaluate(async () => {
  await Plantillas.guardar(App.E.gestor, (actual) => { actual.lista.unshift({ id: 'pl-sin', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', nombre: 'Sin asunto', texto: 'Hola' }); return actual; });
});
await comprobar('4. la plantilla guarda su asunto; la otra, sin asunto, no lleva la clave',
  pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.map((p) => [p.nombre, p.asunto])).then((l) => l.sort()),
  [['Con asunto', 'Resolución · {nombre}'], ['Sin asunto', undefined]]);
await comprobar('4. «Cambiar» la plantilla conserva su asunto',
  (async () => {
    await pagina.evaluate(async () => { const p = (await Plantillas.cargar(App.E.gestor)).lista.find((x) => x.nombre === 'Con asunto'); PlantillasAjustes.abrirCuadroDePlantilla(p, null, function () {}); });
    await pagina.waitForSelector('#capa:not(.oculto) #pl-asunto');
    const v = await pagina.locator('#pl-asunto').inputValue();
    await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
    await pagina.waitForSelector('#capa', { state: 'hidden' });
    return [v, await pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.find((x) => x.nombre === 'Con asunto').asunto)];
  })(), ['Resolución · {nombre}', 'Resolución · {nombre}']);

/* ================= 5. LOS CUADROS DE CORREO Y DE SÉNECA ================= */
console.log('--- 5. correo y Séneca ---');
const GENERAL = 'CONVALIDACION · Espejo Montes, Carla · A26-0003';
const PROPIO = 'Resolución · Espejo Montes, Carla · A26-0003';
async function abrir(nombre, seneca) {
  await pagina.evaluate(([n, s]) => { CorreoNucleo.abrirCuadro(App.E.listaAbiertos.find((x) => x.nombre === n), s); }, [nombre, seneca]);
  await pagina.waitForSelector(seneca ? '#seneca-asunto' : '#correo-asunto');
  await pagina.waitForTimeout(150);
}
async function cerrar() { await pagina.keyboard.press('Escape'); await pagina.waitForSelector('#capa', { state: 'hidden' }); }
for (const [seneca, id, plantilla] of [[false, '#correo-asunto', '#correo-plantilla'], [true, '#seneca-asunto', '#seneca-plantilla']]) {
  const que = seneca ? 'Séneca' : 'correo';
  await abrir(NUEVO, seneca);
  await comprobar('5. ' + que + ': con la plantilla sin asunto, sale el general (y no el nombre de la carpeta)', pagina.locator(id).inputValue(), GENERAL);
  await pagina.selectOption(plantilla, { label: 'Con asunto' });
  await comprobar('5. ' + que + ': al elegir una plantilla con asunto propio, cambia a ese', pagina.locator(id).inputValue(), PROPIO);
  await pagina.fill(id, 'Retocado a mano');
  await comprobar('5. ' + que + ': se puede retocar a mano', pagina.locator(id).inputValue(), 'Retocado a mano');
  await pagina.selectOption(plantilla, { value: '' });
  await comprobar('5. ' + que + ': sin plantilla, vuelve al general', pagina.locator(id).inputValue(), GENERAL);
  await cerrar();
  await abrir(VIEJO, seneca);
  await comprobar('5. ' + que + ': un asunto de antes, sin número, sigue con el nombre de la carpeta', pagina.locator(id).inputValue(), VIEJO);
  await cerrar();
}
await abrir(NUEVO, false);
await pagina.selectOption('#correo-plantilla', { label: 'Con asunto' });
await pagina.click('#correo-plantilla-editar');
await pagina.waitForSelector('#pl2-asunto');
await comprobar('5. el editor de la plantilla dentro del cuadro: «Asunto» debajo del nombre y «Así sale» con los datos de este asunto',
  pagina.evaluate(() => [document.getElementById('pl2-nombre').nextElementSibling.textContent.trim(), document.getElementById('pl2-asunto').value,
    document.querySelector('#pl2-asunto-sale .ae-resultado').textContent]),
  ['Asunto', 'Resolución · {nombre}', PROPIO]);
await pagina.click('#pl2-cancelar');
/* Tras guardar cambios en «Cambiar la plantilla», el asunto del cuadro se recompone con la plantilla guardada. */
for (const [seneca, id, plantilla, editar] of [[false, '#correo-asunto', '#correo-plantilla', '#correo-plantilla-editar'], [true, '#seneca-asunto', '#seneca-plantilla', '#seneca-plantilla-editar']]) {
  if (seneca) { await cerrar(); await abrir(NUEVO, true); await pagina.selectOption(plantilla, { label: 'Con asunto' }); }
  await pagina.click(editar);
  await pagina.waitForSelector('#pl2-asunto');
  await pagina.fill('#pl2-asunto', 'ASUNTO NUEVO {nombre}');
  await pagina.click('#pl2-guardar');
  await pagina.waitForSelector('#pl2-asunto', { state: 'hidden' });
  await comprobar('5. ' + (seneca ? 'Séneca' : 'correo') + ': tras guardar en «Cambiar la plantilla», el asunto del cuadro es el de la plantilla guardada',
    pagina.locator(id).inputValue(), 'ASUNTO NUEVO Espejo Montes, Carla · A26-0003');
}
await cerrar();
await comprobar('5. el asunto que pide un informe (`asuntoListo`) manda sobre todo',
  (async () => { await pagina.evaluate((n) => { CorreoNucleo.abrirCuadro(App.E.listaAbiertos.find((x) => x.nombre === n), false, { asuntoListo: 'Informe de la actividad' }); }, NUEVO);
    await pagina.waitForSelector('#correo-asunto'); const v = await pagina.locator('#correo-asunto').inputValue(); await cerrar(); return v; })(), 'Informe de la actividad');

/* (fila 637) «Asunto» ya no es un botón de la cabecera: es una opción de «Copiar» en el menú «⋯». */
const copiarDelMenu = async (rotulo) => {
  await pagina.click('.ficha-nombre-menu-boton');
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: new RegExp('^' + rotulo + '$') }).click();
};
/* ================= 6. LA FICHA ================= */
console.log('--- 6. la ficha ---');
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + NUEVO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('6. «Asunto» copia el asunto compuesto con el general, no el nombre de la carpeta',
  pegado(() => copiarDelMenu('Asunto')), GENERAL);
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila .extracto-documento');
await comprobar('6. «Extracto» sale junto a «Ruta», en todos los documentos de la carpeta',
  pagina.evaluate(() => [...document.querySelectorAll('.ficha-documento-fila')].map((f) => { const r = f.querySelector('.ruta-documento'); const e = r && r.nextElementSibling;
    return !!e && e.classList.contains('extracto-documento') && e.textContent.trim() === 'Extracto'; })), [true, true]);
const filaDe = (n) => '.ficha-documento-fila[data-doc="' + n + '"] .extracto-documento';
await comprobar('6. copia el extracto propio de su tipo de documento, con los datos del documento, sus líneas y el número al final',
  pegado(() => pagina.click(filaDe(DOC_RESOLUCION))), 'Resolución de CONVALIDACION\nEspejo Montes, Carla · 09/11/2026 · A26-0003');
await comprobar('6. sale el aviso «Extracto copiado»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#mensajes .mensaje.bueno')).map((m) => m.textContent).some((t) => t.indexOf('Extracto copiado') === 0)), true);
await comprobar('6. un tipo sin extracto propio copia el general',
  pegado(() => pagina.click(filaDe(DOC_FACTURA))), 'FACTURA · CONVALIDACION\nEspejo Montes, Carla · A26-0003');
await pagina.evaluate(async ([N, D1, D2]) => { await Hitos.anadirDocumento(N, 'h1', D1); await Hitos.anadirDocumento(N, 'h1', D2); }, [NUEVO, DOC_RESOLUCION, DOC_FACTURA]);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.evaluate(() => HitosPanel.programarRepintado());
await pagina.waitForTimeout(800);
await abrirHito(pagina, 'h1');
await pagina.waitForSelector('.hito-en-mesa .mesa-doc .extracto-documento >> visible=true');
await comprobar('6. «Extracto» también sale junto a «Ruta» en los documentos del hito',
  pagina.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .mesa-doc .mesa-doc-nombre')].map((f) => { const r = f.querySelector('.ruta-documento-lugar'); const e = r && r.nextElementSibling;
    return !!r && !!r.querySelector('.ruta-documento') && !!e && !!e.querySelector('.extracto-documento'); })), [true, true]);
await comprobar('6. y copia lo mismo',
  pegado(() => pagina.click('.hito-en-mesa .mesa-doc[data-doc="' + DOC_RESOLUCION + '"] .extracto-documento')), 'Resolución de CONVALIDACION\nEspejo Montes, Carla · 09/11/2026 · A26-0003');
/* El asunto de antes. */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + VIEJO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('6. un asunto de antes: «Asunto» copia el nombre de la carpeta',
  pegado(() => copiarDelMenu('Asunto')), VIEJO);
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila .extracto-documento');
await comprobar('6. un asunto de antes: «Extracto» copia el nombre de la carpeta',
  pegado(() => pagina.click('.ficha-documento-fila .extracto-documento')), VIEJO);

/* ================= 7. LA BANDEJA ================= */
console.log('--- 7. la bandeja ---');
const propuesta = (asunto) => pagina.evaluate((a) => { const r = Bandeja.asuntoDeEsteCorreo({ id: 'x-' + Math.random(), asunto: a }); return r ? r.nombre : null; }, asunto);
await comprobar('7. un correo con el número del asunto en su asunto (cambiado el principio) se propone para ese asunto',
  propuesta('RV: Otra cosa distinta · A26-0003'), NUEVO);
await comprobar('7. también contestado desde fuera, con «Re:» y el número en mitad',
  propuesta('Re: Sobre la matrícula (A26-0003) gracias'), NUEVO);
await comprobar('7. un número que no es de ningún asunto abierto no propone nada',
  propuesta('Re: Otra cosa distinta · A26-0099'), null);
await comprobar('7. el número tiene que estar entero: A26-00031 no es A26-0003',
  propuesta('Re: Otra cosa distinta · A26-00031'), null);
await comprobar('7. sin número, el nombre de la carpeta dentro del asunto sigue valiendo (como hoy)',
  propuesta('Re: ' + VIEJO), VIEJO);

/* ================= 8. EL CONTROL DEL REGISTRO ================= */
console.log('--- 8. control del registro ---');
await comprobar('8. un apunte con un extracto de varias líneas se lee entero y se une al asunto por el número',
  pagina.evaluate(([N]) => {
    const csv = '"Nº.Registro","Fecha de trabajo","Fecha de registro","Extracto","Clase de documento","Estado","Tipo de remitente","Remitente","Procedencia","Modo de recepción","Doc. Adjunta"\r\n' +
      '"2026/29700692/M000000000431","09/11/2026","09/11/2026","RESOLUCION · CONVALIDACION\r\nEspejo Montes, Carla · A26-0003","Resoluciones","Completo","Familia","Espejo Montes, Carla","","Registro presencial","S"\r\n' +
      '"2026/29700692/M000000000432","09/11/2026","09/11/2026","Otra cosa","Resoluciones","Completo","Familia","Otra","","Registro presencial","S"\r\n';
    const r = ControlRegistro.leerCsv(csv);
    const apuntes = {}; r.apuntes.forEach((a) => { apuntes[a.codigo] = a; });
    const c = ControlRegistro.clasificar({ control: { decisiones: {}, clasesSinAsunto: { E: [], S: [] } }, apuntes: apuntes },
      [{ nombre: N, numero: 'A26-0003', registros: [] }]);
    return [r.ok, r.apuntes.length, r.apuntes[0].extracto, c.E.con.map((x) => x.asunto.nombre), c.E.sin.length];
  }, [NUEVO]), [true, 2, 'RESOLUCION · CONVALIDACION\nEspejo Montes, Carla · A26-0003', [NUEVO], 1]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
