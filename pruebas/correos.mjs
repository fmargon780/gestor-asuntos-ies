/* Prueba en navegador de verdad de lo que deja un correo dentro de un
   asunto: la nota corta con su botón, los adjuntos con nombre de la
   casa, que un correo no entre dos veces, y los documentos en dos
   grupos dentro de la ficha.

   Desde el 16-sep-2026 prueba también la huella del hilo (el campo
   `hilos` de asuntos.json y el fichero seguidos.json), el botón
   "Elegir asunto" y la puntuación de parecido de js/bandeja-enlace.js.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';
const OTRO = '260910 PERMISO 26-27 Ordóñez Gil, Rafael 677B';

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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* Dos asuntos ya existentes, con sus fichas en asuntos.json. Ninguno
   de los dos tiene `hilos`: son de los de antes del 16-sep-2026, y
   tienen que seguir funcionando igual (prueba 5 de la instrucción). */
await pagina.evaluate(async ([nombre, otro]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [nombre]: { tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL',
                  situacion: 'A LA ESPERA DEL TERCERO' },
      [otro]: { tercero: 'Ordóñez Gil, Rafael 677B', categoria: 'PERSONAL',
                situacion: 'EN EL DEPARTAMENTO' }
    }
  })));
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  carpeta._hijos.set('260903 26EA0412 SOLICITUD.pdf',
    window.__disco.fich('260903 26EA0412 SOLICITUD.pdf', 'la solicitud'));
  carpeta._hijos.set('Conciliación FL.pdf',
    window.__disco.fich('Conciliación FL.pdf', 'el impreso'));
  await window.__disco.abiertos.getDirectoryHandle(otro, { create: true });

  /* El personal del centro, para que la puntuación de parecido pueda
     saber de quién es una dirección de correo. */
  const d = await g.getDirectoryHandle('datos', { create: true });
  const per = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Cuenta Google/Microsoft"',
    '"Pacheco Pérez, Mercedes","12345019G","Lengua P.E.S.","01/09/2015","","mercedes@correo.es"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015","","rafael@correo.es"'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', per));
}, [ASUNTO, OTRO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La bandeja de correos: una carpeta de mentira, colgada de la raíz de
   mentira para que sea del mismo molde, y el selector de carpetas
   apañado para devolverla cuando la aplicación la pida. */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});

function correoDeMentira(cambios) {
  return Object.assign({
    id: 'hilo-123',
    asunto: 'Re: ' + ASUNTO,
    fecha: '2026-09-09T10:00:00.000Z',
    fechaUltimo: '2026-09-09T10:00:00.000Z',
    mensajes: 2,
    de: { nombre: 'Mercedes Pacheco', correo: 'mercedes@correo.es' },
    correos: ['mercedes@correo.es'],
    enlace: 'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123',
    pdf: 'hilo-123 - hilo.pdf',
    adjuntos: ['hilo-123 - LITNAC2026050413001031751487.pdf', 'hilo-123 - 1000082963.jpg']
  }, cambios || {});
}

async function dejarElCorreo(datos) {
  await pagina.evaluate((d) => {
    const b = window.__bandeja;
    b._hijos.set(d.id + '.json', window.__disco.fich(d.id + '.json', JSON.stringify(d)));
    if (d.pdf) b._hijos.set(d.pdf, window.__disco.fich(d.pdf, 'el hilo en pdf'));
    (d.adjuntos || []).forEach(a => b._hijos.set(a, window.__disco.fich(a, 'un adjunto')));
  }, datos);
}

/* La bandeja solo vuelve a mirar la carpeta cada 90 segundos. Volver a
   señalarla en Ajustes la obliga a mirar ahora mismo. */
async function mirarLaBandeja() {
  await pagina.evaluate(() => App.ir('ajustes'));
  await pagina.waitForSelector('#bloque-bandeja');
  await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
  await pagina.click('#botones-bandeja .boton');
  await pagina.waitForTimeout(600);
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(700);
}

async function fichaDelAsunto(nombre) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    return JSON.parse(await (await f.getFile()).text()).asuntos[n] || {};
  }, nombre);
}
async function textoDeAsuntosJson() {
  return pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    return (await (await f.getFile()).text());
  });
}
async function seguidos() {
  return pagina.evaluate(async () => {
    try {
      const f = await window.__bandeja.getFileHandle('seguidos.json');
      return JSON.parse(await (await f.getFile()).text());
    } catch (e) { return null; }
  });
}

/* --- 5. un asunto de los viejos, sin `hilos`, sigue igual que antes --- */
await comprobar('el asunto de partida no tiene huella de hilo',
  fichaDelAsunto(ASUNTO).then(f => f.hilos === undefined), true);

await dejarElCorreo(correoDeMentira());
await mirarLaBandeja();

await comprobar('el correo sale en la bandeja',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 1);
await comprobar('sin huella, lo reconoce por el texto del asunto',
  pagina.locator('#bandeja-correos .propuesta-correo').textContent(),
  'Respuesta de' + ASUNTO);

console.log('--- guardando el correo en el asunto ---');
await pagina.getByRole('button', { name: 'Guardar en ese asunto' }).click();
await pagina.waitForTimeout(1200);

async function ficherosDelAsunto(nombre) {
  return pagina.evaluate(async (n) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(n);
    return Array.from(c._hijos.keys()).sort();
  }, nombre || ASUNTO);
}
async function notasDelAsunto() {
  return fichaDelAsunto(ASUNTO).then(f => f.notas || []);
}

const HILO_PDF = '260909 HILO 260903 FLEXIBILIDAD 26-27 Pacheco.pdf';

await comprobar('los ficheros que hay ahora en la carpeta', ficherosDelAsunto(), [
  '260903 26EA0412 SOLICITUD.pdf',
  '260909 ADJUNTO 1000082963.jpg',
  '260909 ADJUNTO LITNAC2026050413001031751487.pdf',
  HILO_PDF,
  'Conciliación FL.pdf'
].sort());

const notas = await notasDelAsunto();
await comprobar('hay una sola nota', notas.length, 1);
await comprobar('el texto de la nota', notas[0] && notas[0].texto,
  'Correo de Mercedes Pacheco · 09/09/2026\nRe: ' + ASUNTO);
await comprobar('la nota no lleva la dirección escrita',
  (notas[0] && notas[0].texto || '').indexOf('http'), -1);
await comprobar('la nota guarda el enlace aparte', notas[0] && notas[0].enlace,
  'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123');
await comprobar('y de qué correo viene', notas[0] && notas[0].correo, 'hilo-123');

/* --- 2 (primera mitad). Al guardar queda la huella del hilo --- */
await comprobar('al guardar queda apuntada la huella del hilo',
  fichaDelAsunto(ASUNTO).then(f => (f.hilos || []).map(h => ({ id: h.id, asunto: h.asunto, visto: h.visto, matriculas: h.matriculas }))),
  [{ id: 'hilo-123', asunto: '260903 flexibilidad 26-27 pacheco pérez, mercedes 019g', visto: 2, matriculas: [] }]);
await comprobar('y con quién la metió y cuándo (fila 18)',
  fichaDelAsunto(ASUNTO).then(f => { const h = (f.hilos || [])[0] || {}; return h.metidoPor === 'Francisco' && !!h.metidoEl; }), true);
await comprobar('y el hilo entra en seguidos.json',
  seguidos().then(s => s && s.hilos.map(h => [h.id, h.visto])), [['hilo-123', 2]]);

console.log('--- el mismo correo otra vez ---');
await dejarElCorreo(correoDeMentira());
await mirarLaBandeja();
await pagina.getByRole('button', { name: 'Guardar en ese asunto' }).click();
await pagina.waitForTimeout(1000);

await comprobar('no se repiten los ficheros', ficherosDelAsunto(), [
  '260903 26EA0412 SOLICITUD.pdf',
  '260909 ADJUNTO 1000082963.jpg',
  '260909 ADJUNTO LITNAC2026050413001031751487.pdf',
  HILO_PDF,
  'Conciliación FL.pdf'
].sort());
await comprobar('ni la nota', (await notasDelAsunto()).length, 1);

console.log('--- la ficha del asunto ---');
await pagina.evaluate(() => { App.verAbiertos(); });
await pagina.waitForTimeout(700);
/* El asunto está "A LA ESPERA DEL TERCERO", así que vive en esa tarjeta. */
await pagina.click('.panel[data-vista="espera"]');
await pagina.waitForTimeout(300);
await pagina.click('#lista-abiertos .tarjeta-nombre');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(700);

await comprobar('los documentos salen en dos grupos',
  pagina.locator('#ficha-documentos .ficha-grupo-docs').allTextContents(),
  ['Del expediente  (2)', 'Llegados por correo  (3)']);
await comprobar('y en este orden',
  pagina.locator('#ficha-documentos .ficha-documento').allTextContents(),
  ['PDF260903 26EA0412 SOLICITUD.pdf', 'PDFConciliación FL.pdf',
   'JPG260909 ADJUNTO 1000082963.jpg',
   'PDF260909 ADJUNTO LITNAC2026050413001031751487.pdf',
   'PDF' + HILO_PDF]);

await comprobar('la nota enseña un botón para abrir el correo',
  pagina.locator('#ficha-notas .nota-boton').textContent(), 'Abrir en Gmail');
await comprobar('y el botón lleva a Gmail',
  pagina.locator('#ficha-notas .nota-boton').getAttribute('href'),
  'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123');

/* ============================================================
   1, 3 y 6. LA HUELLA DEL HILO MANDA SOBRE EL TEXTO
   ============================================================ */
console.log('--- la huella del hilo ---');
await pagina.evaluate(() => { App.ir('abiertos'); App.verAbiertos(); });
await pagina.waitForTimeout(500);

const antesDePintar = await textoDeAsuntosJson();

/* El mismo hilo, pero con un asunto que no se parece en nada al
   nombre del asunto: sin la huella, la bandeja propondría crear uno
   nuevo. Y viene marcado como enviado por él. */
await dejarElCorreo(correoDeMentira({
  asunto: 'Papeleo varios',
  mensajes: 5,
  enviado: true,
  pdf: 'hilo-123 - hilo.pdf',
  adjuntos: []
}));
await mirarLaBandeja();

await comprobar('1. un hilo conocido se reconoce aunque el asunto no se parezca',
  pagina.locator('#bandeja-correos .propuesta-correo').textContent(),
  'Respuesta de' + ASUNTO);
await comprobar('y la tarjeta dice que lo enviaste tú',
  pagina.locator('#bandeja-correos .correo-enviado').textContent(), 'Lo enviaste tú');
await comprobar('el botón principal es guardar en ese asunto',
  pagina.locator('#bandeja-correos .tarjeta-correo .boton-principal').textContent(),
  'Guardar en ese asunto');

/* --- 6. nada se guarda sin pulsar --- */
await comprobar('6. pintar la bandeja no escribe en asuntos.json',
  textoDeAsuntosJson().then(t => t === antesDePintar), true);

/* --- 3. guardar dos veces el mismo hilo no duplica la entrada --- */
await pagina.getByRole('button', { name: 'Guardar en ese asunto' }).click();
await pagina.waitForTimeout(1100);
await comprobar('3. el hilo no se duplica: se actualiza `visto`',
  fichaDelAsunto(ASUNTO).then(f => (f.hilos || []).map(h => ({ id: h.id, asunto: h.asunto, visto: h.visto }))),
  [{ id: 'hilo-123', asunto: 'papeleo varios', visto: 5 }]);
await comprobar('y seguidos.json se reescribe con lo nuevo',
  seguidos().then(s => s && s.hilos.map(h => [h.id, h.visto])), [['hilo-123', 5]]);

/* ============================================================
   4. LA PUNTUACIÓN DE PARECIDO
   ============================================================ */
console.log('--- podrían encajar ---');
await comprobar('4. manda el asunto cuyo tercero tiene el correo del remitente',
  pagina.evaluate(() => App.parecidoDelCorreo({
    id: 'hilo-000',
    asunto: 'Consulta sobre el PERMISO de Ordóñez',
    texto: '',
    de: { nombre: 'Mercedes Pacheco', correo: 'mercedes@correo.es' },
    correos: ['mercedes@correo.es']
  }).then(l => l.length ? l[0].nombre : '')), ASUNTO);

/* ============================================================
   2. ELEGIR EL ASUNTO A MANO
   ============================================================ */
console.log('--- elegir asunto ---');
await dejarElCorreo({
  id: 'hilo-999',
  asunto: 'Un asunto que no se parece a nada de nada',
  fecha: '2026-09-12T09:00:00.000Z',
  fechaUltimo: '2026-09-12T09:00:00.000Z',
  mensajes: 1,
  de: { nombre: 'Alguien', correo: 'alguien@fuera.es' },
  correos: ['alguien@fuera.es'],
  enlace: 'https://mail.google.com/mail/u/0/#search/rfc822msgid:zzz999',
  pdfMensaje: 'hilo-999 - correo.pdf',
  adjuntos: []
});
await pagina.evaluate(() => {
  const b = window.__bandeja;
  b._hijos.set('hilo-999 - correo.pdf', window.__disco.fich('hilo-999 - correo.pdf', 'el correo'));
});
await mirarLaBandeja();

await comprobar('sin huella ni parecido, no propone ningún asunto',
  pagina.locator('#bandeja-correos .tarjeta-correo .boton-principal').textContent(),
  'Crear el asunto');

await pagina.getByRole('button', { name: 'Elegir asunto' }).click();
await pagina.waitForSelector('#enlace-todos');
await comprobar('el cuadro enseña todos los asuntos',
  pagina.locator('#enlace-todos .enlace-asunto').count(), 2);
await pagina.fill('#enlace-buscar', 'Ordóñez');
await pagina.waitForTimeout(300);
await comprobar('y el buscador filtra',
  pagina.locator('#enlace-todos .enlace-asunto').count(), 1);
await pagina.click('#enlace-todos .enlace-asunto');
await pagina.waitForTimeout(1200);

await comprobar('2. el asunto elegido a mano se queda con la huella',
  fichaDelAsunto(OTRO).then(f => (f.hilos || []).map(h => ({ id: h.id, asunto: h.asunto, visto: h.visto }))),
  [{ id: 'hilo-999', asunto: 'un asunto que no se parece a nada de nada', visto: 1 }]);
await comprobar('y los dos hilos están en seguidos.json',
  seguidos().then(s => s && s.hilos.map(h => h.id).sort()), ['hilo-123', 'hilo-999']);
await comprobar('el correo ha entrado en la carpeta del asunto elegido',
  ficherosDelAsunto(OTRO), ['260912 CORREO Un asunto que no se parece a nada de.pdf']);
await comprobar('y el correo ya no está en la bandeja',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
