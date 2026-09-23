/* Prueba de la fila 103 (docs/EL-HITO-MESA-DE-TRABAJO.md): el hito como
   mesa de trabajo, segunda tanda. Con la aplicación entera cargada en el
   navegador (para tener a la vez Hitos, Documentos, Correo y los dos
   ficheros nuevos), pero probando sobre todo funciones sueltas:

   1. La resta «ficheros nuevos» (antes/después, con repetidos y con un
      fichero que desaparece), las opciones del menú de un documento, y
      cómo sigue el cuadro de nombrar los documentos que ha guardado.
   2. Cuándo sale cada botón del hito: «Añadir documento» y «Comunicar»
      (pregunta, no aplica, normal; con y sin texto propio del paso).
   3. `adjuntosMarcados`: marca solo los que existen; sin él, nada.
   4. La línea del historial, con y sin documentos.
   5. En la ficha de verdad: el menú de «Añadir documento» (con «Por
      clasificar» apagado si no hay nada, y metiendo uno si lo hay), el
      menú de tres puntos de un documento del hito y «Quitar del hito».
   6. «Comunicar» sin texto propio abre el cuadro de Correo con los
      documentos del hito ya marcados.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

/* p1 sin texto de comunicación; p2 con texto solo de correo; p3 una pregunta. */
const GUIA = {
  MATRICULA: [
    { id: 'p1', titulo: 'Recoger la solicitud' },
    { id: 'p2', titulo: 'Avisar', comunicacion: { correo: { asunto: 'Aviso', cuerpo: 'Hola.' }, seneca: { asunto: '', cuerpo: '' } } },
    { id: 'p3', titulo: '¿Viene con beca?', opciones: [{ id: 'si', texto: 'Sí', pasos: [] }, { id: 'no', texto: 'No', pasos: [] }] }
  ]
};
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (GUIA) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(GUIA)); await w.close();
}, GUIA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ---------- 1. funciones puras ---------- */
console.log('--- 1. la resta de ficheros nuevos, el menú y lo que sigue el cuadro de nombrar ---');
await comprobar('lo que no estaba antes, sin repetir y en su orden',
  pagina.evaluate(() => HitosDocumentoMenu.nuevos(['a.pdf', 'b.pdf'], ['a.pdf', 'c.pdf', 'b.pdf', 'd.pdf', 'c.pdf'])),
  ['c.pdf', 'd.pdf']);
await comprobar('uno que desaparece no cuenta como nuevo',
  pagina.evaluate(() => HitosDocumentoMenu.nuevos(['a.pdf', 'b.pdf'], ['b.pdf', 'b (1).pdf'])), ['b (1).pdf']);
await comprobar('sin cambios, nada', pagina.evaluate(() => HitosDocumentoMenu.nuevos(['a'], ['a'])), []);
await comprobar('menú de un PDF sin registro: todo',
  pagina.evaluate(() => HitosDocumentoMenu.queOpciones({ pdf: true, ajustar: true })),
  ['registrar', 'separar', 'unir', 'sacar', 'ajustar', 'quitar']);
await comprobar('menú de un documento registrado que no es PDF: solo quitar',
  pagina.evaluate(() => HitosDocumentoMenu.queOpciones({ registrado: true })), ['quitar']);
await comprobar('menú de uno que ya no está: solo quitar',
  pagina.evaluate(() => HitosDocumentoMenu.queOpciones({ falta: true, pdf: true })), ['quitar']);
await comprobar('el cuadro de nombrar sigue lo añadido y lo renombrado',
  pagina.evaluate(() => {
    let l = Documentos.seguirGuardado(['viejo.pdf'], 'renombrar', 'viejo.pdf', '260923 SOLICITUD.pdf');
    l = Documentos.seguirGuardado(l, 'anadir', 'de fuera.pdf', '260923 DNI.pdf');
    l = Documentos.seguirGuardado(l, 'renombrar', 'otro de la carpeta.pdf', 'no se sigue.pdf');
    return l;
  }), ['260923 SOLICITUD.pdf', '260923 DNI.pdf']);

/* ---------- 2. cuándo sale cada botón ---------- */
console.log('--- 2. cuándo sale cada botón del hito ---');
const r2 = await pagina.evaluate(() => {
  const a = { nombre: 'X', ficha: { tipo: 'MATRICULA' }, leido: { tipo: 'MATRICULA' } };
  const normal = { id: 'p1', clase: 'paso', estado: 'pendiente' };
  const conTexto = { id: 'p2', origenGuia: 'p2', clase: 'paso', estado: 'pendiente' };
  const pregunta = { id: 'p3', clase: 'decision', estado: 'pendiente' };
  const noAplica = { id: 'p4', clase: 'paso', estado: 'noaplica' };
  const sale = (html) => html.indexOf('<button') !== -1;
  return {
    anadir: [normal, pregunta, noAplica].map(h => sale(HitosAnadir.botonHTML(a, h))),
    comunicar: [normal, conTexto, pregunta, noAplica].map(h => sale(HitosComunicar.botonHTML(a, h))),
    canales: [HitosComunicar.canalesDe(a, normal), HitosComunicar.canalesDe(a, conTexto)]
  };
});
await comprobar('«Añadir documento»: en un hito normal sí; en una pregunta o un «no aplica», no',
  Promise.resolve(r2.anadir), [true, false, false]);
await comprobar('«Comunicar»: con y sin texto propio sí; en una pregunta o un «no aplica», no',
  Promise.resolve(r2.comunicar), [true, true, false, false]);
await comprobar('sin texto propio no hay canales (irá a los dos, con las plantillas del tipo)',
  Promise.resolve(r2.canales), [[], ['correo']]);

/* ---------- 3. adjuntos ya marcados ---------- */
console.log('--- 3. los documentos del hito, ya marcados ---');
await comprobar('solo los que siguen en la carpeta, sin repetir',
  pagina.evaluate(() => CorreoAdjuntos.marcadosQueExisten(['a.pdf', 'b.pdf'], ['b.pdf', 'ya no está.pdf', 'b.pdf'])), ['b.pdf']);
await comprobar('sin la lista, nada marcado',
  pagina.evaluate(() => CorreoAdjuntos.marcadosQueExisten(['a.pdf'], undefined)), []);

/* ---------- 4. la línea del historial ---------- */
console.log('--- 4. la constancia en el hito ---');
const hoy = await pagina.evaluate(() => U.fechaLegible(U.aAaMmDd(U.hoyIso())));
await comprobar('sin documentos, como siempre',
  pagina.evaluate(() => CorreoNucleo.textoDeComunicarHito('Uno, Ana', false)), 'Comunicado a Uno, Ana por correo · ' + hoy);
await comprobar('con documentos, termina en «· con N documentos: a, b»',
  pagina.evaluate(() => CorreoNucleo.textoDeComunicarHito('Uno, Ana', false, ['a.pdf', 'b.pdf'])),
  'Comunicado a Uno, Ana por correo · ' + hoy + ' · con 2 documentos: a.pdf, b.pdf');
await comprobar('con uno, en singular',
  pagina.evaluate(() => CorreoNucleo.textoDeComunicarHito('Uno, Ana', false, ['a.pdf'])),
  'Comunicado a Uno, Ana por correo · ' + hoy + ' · con 1 documento: a.pdf');

/* ---------- 5. en la ficha ---------- */
console.log('--- 5. en la ficha de verdad ---');
const A = '260920 MATRICULA Uno, Ana 1150001';
const DOC = '260920 SOLICITUD Uno.pdf';
const OTRO = '260920 DNI Uno.pdf';
await pagina.evaluate(async ([A, DOC, OTRO]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  c._hijos.set(DOC, window.__disco.fich(DOC, '%PDF-1.4 la solicitud'));
  c._hijos.set(OTRO, window.__disco.fich(OTRO, '%PDF-1.4 el dni'));
  await App.anotar(A, { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Uno, Ana 1150001', abiertoEl: U.ahora() });
  await App.verAbiertos();
  App.E.sueltos = [];
  await Hitos.hitosDe(A);
  await Hitos.anadirDocumento(A, 'p1', DOC);
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === A)[0], 'abierto');
}, [A, DOC, OTRO]);
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]');
await pagina.waitForTimeout(500);
const hito1 = pagina.locator('#ficha-guia .hito[data-id="p1"]');
await hito1.locator('.hito-titulo').click();

await comprobar('«Añadir documento» va con los botones del hito, y ya no está «Apuntar un documento»',
  pagina.evaluate(() => {
    const h = document.querySelector('#ficha-guia .hito[data-id="p1"]');
    return [!!h.querySelector('.hito-botones .hito-doc-anadir'), !!h.querySelector('.hito-doc-apuntar')];
  }), [true, false]);
await hito1.locator('.hito-doc-anadir').click();
await comprobar('el menú trae los tres caminos; «Por clasificar» apagado si no hay ninguno',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .hito[data-id="p1"] .ficha-menu:not(.oculto) .ficha-menu-opcion'))
    .map(b => [b.textContent, b.disabled])),
  [['Desde el ordenador', false], ['Desde «Por clasificar» (no hay ninguno)', true], ['Uno que ya está en la carpeta', false]]);
await pagina.keyboard.press('Escape');

/* El menú de tres puntos de un documento del hito. */
await comprobar('cada documento del hito lleva sus tres puntos, no la ✕',
  pagina.evaluate(() => {
    const h = document.querySelector('#ficha-guia .hito[data-id="p1"]');
    return [h.querySelectorAll('.hito-documento .hito-doc-menu').length, h.querySelectorAll('.hito-documento .hito-doc-quitar').length];
  }), [1, 0]);
await hito1.locator('.hito-doc-menu').click();
await comprobar('en un PDF sin registrar: Registrar, las del PDF y Quitar del hito',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .hito[data-id="p1"] .hito-documento .ficha-menu:not(.oculto) .ficha-menu-opcion'))
    .map(b => b.textContent)),
  ['Registrar', 'Separar', 'Unir', 'Sacar páginas', 'Ajustar tamaño', 'Quitar del hito']);
await pagina.keyboard.press('Escape');

/* Un suelto en «Por clasificar»: entra en la carpeta y queda apuntado. */
const SUELTO = 'escaneo 0001.pdf';
await pagina.evaluate(async ([A, SUELTO]) => {
  const f = window.__disco.fich(SUELTO, '%PDF-1.4 escaneado');
  window.__disco.abiertos._hijos.set(SUELTO, f);
  App.E.sueltos = [{ nombre: SUELTO, handle: f }];
  HitosPanel.desplegarAlAbrir(A, 'p1');
  HitosPanel.programarRepintado();
}, [A, SUELTO]);
await pagina.waitForTimeout(400);
await hito1.locator('.hito-doc-anadir').click();
await comprobar('con uno suelto, «Por clasificar» se enciende',
  hito1.locator('.hito-anadir-sueltos').isDisabled(), false);
await hito1.locator('.hito-anadir-sueltos').click();
await pagina.waitForSelector('#hitoanadir-sueltos');
await pagina.click('#cuadro-aceptar');
/* Se abre el cuadro de ponerle nombre; se cierra sin cambiarlo. */
await pagina.waitForSelector('#doc-cuerpo #doc-guardar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
const r5 = await pagina.evaluate(async ([A, SUELTO]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  const h = (await Hitos.hitosDe(A)).filter(x => x.id === 'p1')[0];
  return {
    enLaCarpeta: c._hijos.has(SUELTO),
    fueraDeLaRaiz: !window.__disco.abiertos._hijos.has(SUELTO),
    sueltos: App.E.sueltos.length,
    docs: h.documentos,
    sigueEnLaFicha: !document.getElementById('pantalla-asunto').classList.contains('oculto') &&
      document.getElementById('pantalla-abiertos').classList.contains('oculto')
  };
}, [A, SUELTO]);
await comprobar('el suelto ha entrado en la carpeta del asunto y ha salido de «Por clasificar»',
  Promise.resolve([r5.enLaCarpeta, r5.fueraDeLaRaiz, r5.sueltos]), [true, true, 0]);
await comprobar('y queda apuntado a ese hito, sin salir de la ficha',
  Promise.resolve([r5.docs, r5.sigueEnLaFicha]), [[DOC, SUELTO], true]);
await comprobar('el hito sigue desplegado',
  pagina.evaluate(() => !document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-cuerpo').classList.contains('oculto')), true);

/* Quitar del hito: solo lo desapunta. */
await hito1.locator('.hito-documento', { hasText: SUELTO }).locator('.hito-doc-menu').click();
await hito1.locator('.hito-documento', { hasText: SUELTO }).locator('.hito-doc-menu-quitar').click();
await pagina.waitForTimeout(500);
const r5b = await pagina.evaluate(async ([A, SUELTO]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  return [(await Hitos.hitosDe(A)).filter(x => x.id === 'p1')[0].documentos, c._hijos.has(SUELTO)];
}, [A, SUELTO]);
await comprobar('«Quitar del hito» lo desapunta y el fichero sigue en la carpeta', Promise.resolve(r5b), [[DOC], true]);

/* Registrar desde el menú: la copia sellada queda en el mismo hito. */
await hito1.locator('.hito-documento', { hasText: DOC }).locator('.hito-doc-menu').click();
await hito1.locator('.hito-documento', { hasText: DOC }).locator('.ficha-menu-opcion', { hasText: 'Registrar' }).click();
await pagina.waitForSelector('#reg-numero');
await pagina.fill('#reg-numero', '4321');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
const r5c = await pagina.evaluate(async ([A, DOC]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  const docs = (await Hitos.hitosDe(A)).filter(x => x.id === 'p1')[0].documentos;
  const nuevos = Array.from(c._hijos.keys()).filter(n => n.indexOf('4321') !== -1);
  return { nuevos: nuevos.length, original: docs.indexOf(DOC) !== -1, sellada: nuevos.length === 1 && docs.indexOf(nuevos[0]) !== -1 };
}, [A, DOC]);
await comprobar('«Registrar» desde el hito: la copia sellada queda apuntada, y el original sigue',
  Promise.resolve(r5c), { nuevos: 1, original: true, sellada: true });

/* ---------- 6. Comunicar sin texto propio ---------- */
console.log('--- 6. «Comunicar» sin texto propio, con los documentos del hito marcados ---');
await pagina.evaluate(() => { window.Bandeja = window.Bandeja || {}; });
await comprobar('después de quitar, el hito sigue desplegado',
  pagina.evaluate(() => !document.querySelector('#ficha-guia .hito[data-id="p1"] .hito-cuerpo').classList.contains('oculto')), true);
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"] .hito-comunicar-boton');
await hito1.locator('.hito-comunicar-boton').click();
await comprobar('sin texto propio, el menú trae los dos canales',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .hito[data-id="p1"] .hito-botones .ficha-menu:not(.oculto) .ficha-menu-opcion'))
    .map(b => b.textContent)), ['Correo electrónico', 'Mensaje de Séneca']);
await hito1.locator('.hito-botones .ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Correo electrónico' }).click();
await pagina.waitForSelector('#adjuntos-lista .adjunto-marca');
const selladaNombre = await pagina.evaluate(async (A) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  return Array.from(c._hijos.keys()).filter(n => n.indexOf('4321') !== -1)[0];
}, A);
function r5cNombre() { return selladaNombre; }
await comprobar('el documento del hito sale marcado, y el otro no',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#adjuntos-lista .adjunto-marca'))
    .map(c => [c.value, c.checked]).sort()),
  [[OTRO, false], [DOC, true], [SUELTO, false], [r5cNombre(), true]].sort());
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

if (errores.length) { fallos++; console.log('FALLA  errores en la consola:\n   ' + errores.join('\n   ')); }
else console.log('bien   sin errores en la consola');

await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
