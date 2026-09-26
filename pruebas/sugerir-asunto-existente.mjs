/* Prueba en navegador de verdad de la fila 88 (21-sep-2026,
   docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md): sugerir un asunto ya
   existente, en "Por clasificar", a partir del tercero que el lector
   ha reconocido dentro del documento.

   Reutiliza el disco de mentira de pruebas/navegador.mjs y el PDF de
   mentira de pruebas/dar-de-alta-desde-documento.mjs (copiado aquí,
   igual que hace ese fichero con pruebas/registro.mjs, para no atar
   los ficheros de prueba entre sí).

   Los escenarios son los de la sección "Pruebas" del documento, con
   cuatro empresas distintas para no mezclar el estado de una con el
   de otra:
     - Bermejo Instalaciones, S.L. (B29123456): un asunto abierto, del
       mismo tipo que propone el lector.               [escenario 1, 6]
     - Delta Suministros, S.L. (C33445566): cuatro abiertos, dos del
       tipo propuesto y dos de otro.                    [escenario 2, 7]
     - Reformas Cordero, S.L. (A11223344): sin abiertos, con dos
       archivados del tipo propuesto y uno de otro.         [escenario 3]
     - Horizonte Climatización, S.L. (D77889911): un abierto y un
       archivado, los dos del tipo propuesto.               [escenario 4]
   Un quinto documento, sin ningún tercero reconocible, cubre el
   escenario 5 (la tarjeta se queda igual que antes de esta fila). */
import { chromium } from 'playwright';
import fs from 'fs';

function pdfConTexto(texto) {
  const escapado = String(texto).replace(/([()\\])/g, '\\$1');
  const stream = 'BT /F1 8 Tf 20 750 Td (' + escapado + ') Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objetos.length; i++) {
    offsets.push(pdf.length);
    pdf += (i + 1) + ' 0 obj\n' + objetos[i] + '\nendobj\n';
  }
  const inicioXref = pdf.length;
  let xref = 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += xref;
  pdf += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\n' +
         'startxref\n' + inicioXref + '\n%%EOF';
  return pdf;
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1700, height: 950 } });
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

/* ---------- los cuatro terceros y sus documentos ---------- */

const BERMEJO = { nombre: 'Bermejo Instalaciones, S.L.', nif: 'B29123456' };
const DELTA = { nombre: 'Delta Suministros, S.L.', nif: 'C33445566' };
const CORDERO = { nombre: 'Reformas Cordero, S.L.', nif: 'A11223344' };
const HORIZONTE = { nombre: 'Horizonte Climatización, S.L.', nif: 'D77889911' };

function textoDelDocumento(empresa) {
  return 'Se solicita presupuesto a ' + empresa.nombre + ' con NIF ' + empresa.nif +
    ' para el mantenimiento de la caldera de la calefacción del centro.';
}

const PDF_BERMEJO = 'Factura de Bermejo.pdf';
const PDF_DELTA = 'Factura de Delta.pdf';
const PDF_CORDERO = 'Factura de Cordero.pdf';
const PDF_HORIZONTE = 'Factura de Horizonte.pdf';
const PDF_SIN_TERCERO = 'Registro de entrada.pdf';

/* ---------- asuntos abiertos ---------- */

const ABIERTO_BERMEJO = '260801 MANTENIMIENTO Bermejo Instalaciones, S.L. B29123456';

const DELTA_1 = '260101 MANTENIMIENTO Delta Suministros, S.L. C33445566';   /* mismo tipo, viejo */
const DELTA_2 = '260301 MANTENIMIENTO Delta Suministros, S.L. C33445566';   /* mismo tipo, reciente */
const DELTA_3 = '260201 PRESUPUESTO Delta Suministros, S.L. C33445566';     /* otro tipo, medio */
const DELTA_4 = '260801 PRESUPUESTO Delta Suministros, S.L. C33445566';     /* otro tipo, el más reciente de todos */

const HORIZONTE_ABIERTO = '260401 MANTENIMIENTO Horizonte Climatización, S.L. D77889911';

/* ---------- asuntos archivados (índice + carpeta de verdad) ---------- */

const CORDERO_AR_1 = '260110 MANTENIMIENTO Reformas Cordero, S.L. A11223344';   /* mismo tipo, viejo */
const CORDERO_AR_2 = '260305 MANTENIMIENTO Reformas Cordero, S.L. A11223344';   /* mismo tipo, reciente */
const CORDERO_AR_3 = '260210 PRESUPUESTO Reformas Cordero, S.L. A11223344';     /* otro tipo */
const HORIZONTE_AR = '260201 MANTENIMIENTO Horizonte Climatización, S.L. D77889911';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([bermejo, delta, cordero, horizonte,
                               abiertoBermejo, d1, d2, d3, d4, horizonteAbierto,
                               corderoAr1, corderoAr2, corderoAr3, horizonteAr, textos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });

  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify([
    { tipo: 'MANTENIMIENTO', categoria: 'EMPRESAS', palabrasClave: ['mantenimiento', 'caldera'] },
    { tipo: 'PRESUPUESTO', categoria: 'EMPRESAS', palabrasClave: ['presupuesto'] }
  ])));

  function ficha(tercero) {
    return { tercero: tercero.nombre + ' ' + tercero.nif, categoria: 'EMPRESAS', estado: 'abierto' };
  }
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [abiertoBermejo]: Object.assign(ficha(bermejo), { tipo: 'MANTENIMIENTO' }),
      [d1]: Object.assign(ficha(delta), { tipo: 'MANTENIMIENTO' }),
      [d2]: Object.assign(ficha(delta), { tipo: 'MANTENIMIENTO' }),
      [d3]: Object.assign(ficha(delta), { tipo: 'PRESUPUESTO' }),
      [d4]: Object.assign(ficha(delta), { tipo: 'PRESUPUESTO' }),
      [horizonteAbierto]: Object.assign(ficha(horizonte), { tipo: 'MANTENIMIENTO' })
    }
  })));

  g._hijos.set('indice-archivo.json', window.__disco.fich('indice-archivo.json', JSON.stringify({
    version: 3, hechoEl: '2026-09-20T10:00:00.000Z', hechoPor: 'Francisco', recuento: {},
    asuntos: [
      { nombre: corderoAr1, categoria: 'EMPRESAS', tercero: cordero.nombre + ' ' + cordero.nif,
        ruta: 'EMPRESAS / ' + cordero.nombre + ' ' + cordero.nif, fecha: '', tipo: 'MANTENIMIENTO',
        reconocido: true, curso: '', grupo: '', documentos: [], registros: [], sueltoEn: '',
        situacion: '', via: '', viaDato: '', loPideNombre: '', loPideCategoria: '', loPideRelacion: '',
        abiertoEl: '', cerradoEl: '2026-01-15T10:00:00.000Z', relacionados: [], camposTexto: '', notas: '' },
      { nombre: corderoAr2, categoria: 'EMPRESAS', tercero: cordero.nombre + ' ' + cordero.nif,
        ruta: 'EMPRESAS / ' + cordero.nombre + ' ' + cordero.nif, fecha: '', tipo: 'MANTENIMIENTO',
        reconocido: true, curso: '', grupo: '', documentos: [], registros: [], sueltoEn: '',
        situacion: '', via: '', viaDato: '', loPideNombre: '', loPideCategoria: '', loPideRelacion: '',
        abiertoEl: '', cerradoEl: '2026-03-10T10:00:00.000Z', relacionados: [], camposTexto: '', notas: '' },
      { nombre: corderoAr3, categoria: 'EMPRESAS', tercero: cordero.nombre + ' ' + cordero.nif,
        ruta: 'EMPRESAS / ' + cordero.nombre + ' ' + cordero.nif, fecha: '', tipo: 'PRESUPUESTO',
        reconocido: true, curso: '', grupo: '', documentos: [], registros: [], sueltoEn: '',
        situacion: '', via: '', viaDato: '', loPideNombre: '', loPideCategoria: '', loPideRelacion: '',
        abiertoEl: '', cerradoEl: '2026-02-15T10:00:00.000Z', relacionados: [], camposTexto: '', notas: '' },
      { nombre: horizonteAr, categoria: 'EMPRESAS', tercero: horizonte.nombre + ' ' + horizonte.nif,
        ruta: 'EMPRESAS / ' + horizonte.nombre + ' ' + horizonte.nif, fecha: '', tipo: 'MANTENIMIENTO',
        reconocido: true, curso: '', grupo: '', documentos: [], registros: [], sueltoEn: '',
        situacion: '', via: '', viaDato: '', loPideNombre: '', loPideCategoria: '', loPideRelacion: '',
        abiertoEl: '', cerradoEl: '2026-02-20T10:00:00.000Z', relacionados: [], camposTexto: '', notas: '' }
    ]
  })));

  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = [
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
    bermejo.nombre + ';;' + bermejo.nif + ';;;',
    delta.nombre + ';;' + delta.nif + ';;;',
    cordero.nombre + ';;' + cordero.nif + ';;;',
    horizonte.nombre + ';;' + horizonte.nif + ';;;'
  ].join('\r\n') + '\r\n';
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', csv));

  /* Las carpetas de verdad de los asuntos abiertos: sin ellas,
     App.E.listaAbiertos no las trae, aunque estén en asuntos.json. */
  for (const n of [abiertoBermejo, d1, d2, d3, d4, horizonteAbierto]) {
    await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
  }

  /* Las carpetas de verdad de los dos archivados de Cordero: el
     escenario 3 pulsa "Meter aquí" sobre el más reciente, y eso
     pregunta si reabrir, para lo que hace falta encontrar la carpeta
     de verdad dentro del ARCHIVO (categoría / tercero / asunto). */
  const catCordero = await window.__disco.archivo.getDirectoryHandle('EMPRESAS', { create: true });
  const terceroCordero = await catCordero.getDirectoryHandle(cordero.nombre + ' ' + cordero.nif, { create: true });
  await terceroCordero.getDirectoryHandle(corderoAr1, { create: true });
  await terceroCordero.getDirectoryHandle(corderoAr2, { create: true });

  /* Los cinco documentos sueltos, en la raíz de asuntos abiertos. El
     texto de cada PDF ya viene montado desde Node (el segundo
     argumento de este evaluate), porque pdfConTexto no existe dentro
     de la página. */
  const raiz = window.__disco.abiertos._hijos;
  function pdf(nombre, texto) {
    raiz.set(nombre, window.__disco.fich(nombre, texto, 'application/pdf'));
  }
  pdf('Factura de Bermejo.pdf', textos.bermejo);
  pdf('Factura de Delta.pdf', textos.delta);
  pdf('Factura de Cordero.pdf', textos.cordero);
  pdf('Factura de Horizonte.pdf', textos.horizonte);
  pdf('Registro de entrada.pdf', textos.sinTercero);
}, [BERMEJO, DELTA, CORDERO, HORIZONTE,
    ABIERTO_BERMEJO, DELTA_1, DELTA_2, DELTA_3, DELTA_4, HORIZONTE_ABIERTO,
    CORDERO_AR_1, CORDERO_AR_2, CORDERO_AR_3, HORIZONTE_AR,
    { bermejo: pdfConTexto(textoDelDocumento(BERMEJO)), delta: pdfConTexto(textoDelDocumento(DELTA)),
      cordero: pdfConTexto(textoDelDocumento(CORDERO)), horizonte: pdfConTexto(textoDelDocumento(HORIZONTE)),
      sinTercero: pdfConTexto(
        'Comunicado interno del centro. Se emite el 10 de septiembre de 2026, ' +
        'sin mas tramite asociado ni dato alguno de nadie en concreto.') }]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

function tarjetaDe(nombre) {
  return pagina.locator('#lista-sueltos .tarjeta-suelto').filter({ hasText: nombre });
}
function sugerenciasDe(nombre) {
  return tarjetaDe(nombre).locator('.tarjeta-propuesta .tarjeta-pie').filter({ hasText: 'Podría ir en:' });
}
async function esperarLeido(nombre, contiene) {
  await pagina.waitForFunction(([n, c]) => {
    const els = Array.from(document.querySelectorAll('.tarjeta-suelto'));
    const fila = els.find((e) => e.textContent.indexOf(n) !== -1);
    if (!fila) return false;
    const prop = fila.querySelector('.tarjeta-propuesta');
    return !!(prop && prop.textContent.indexOf(c) !== -1);
  }, [nombre, contiene], { timeout: 20000 });
}

/* ============================================================
   ESCENARIO 5. SIN TERCERO RECONOCIDO: LA TARJETA, IGUAL QUE HOY
   ============================================================ */
await esperarLeido(PDF_SIN_TERCERO, '10-sep-2026');
await comprobar('5. sin tercero: no hay ninguna sugerencia',
  sugerenciasDe(PDF_SIN_TERCERO).count(), 0);
await comprobar('y tampoco sale ningún botón (ni tipo, ni tercero, ni alta)',
  tarjetaDe(PDF_SIN_TERCERO).locator('.tarjeta-propuesta button').count(), 0);

/* ============================================================
   ESCENARIO 3. SIN ABIERTOS, CON ARCHIVADOS DEL MISMO TIPO:
   SALEN CON LA MARCA "ARCHIVADO", Y "METER AQUÍ" PREGUNTA SI REABRIR

   Va antes que el escenario 1 a propósito: el cuadro de "ponerle
   nombre" que abre el escenario 1 (App.verDocumentos) se abre sin
   botón Cancelar, y dentro del elemento único de diálogo de la
   aplicación (#capa) ese botón se queda oculto hasta que otro cuadro
   con Cancelar lo vuelve a enseñar. Mejor no depender de eso: se
   prueba primero lo que necesita Cancelar.
   ============================================================ */
await esperarLeido(PDF_CORDERO, 'Reformas Cordero');
await comprobar('3. salen los dos archivados del mismo tipo, ninguno más',
  sugerenciasDe(PDF_CORDERO).count(), 2);
await comprobar('los dos llevan la marca "archivado"',
  sugerenciasDe(PDF_CORDERO).allTextContents().then((t) => t.every((x) => x.indexOf('archivado') !== -1)), true);
await comprobar('el de otro tipo (CORDERO_AR_3) no sale',
  sugerenciasDe(PDF_CORDERO).allTextContents().then((t) => t.some((x) => x.indexOf(CORDERO_AR_3) !== -1)), false);
await comprobar('el más reciente (CORDERO_AR_2) sale primero',
  sugerenciasDe(PDF_CORDERO).first().textContent().then((t) => t.indexOf(CORDERO_AR_2) !== -1), true);

await sugerenciasDe(PDF_CORDERO).first().locator('button').first().click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('"Meter aquí" en un archivado pregunta si reabrir',
  pagina.locator('#cuadro-titulo').textContent(), 'Ese asunto está archivado');
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(200);
await comprobar('cancelado, el documento sigue en "Por clasificar"',
  tarjetaDe(PDF_CORDERO).count(), 1);

/* ============================================================
   ESCENARIO 1 y 6. UN ABIERTO DEL MISMO TIPO: SIN MARCA, Y
   "CREAR ASUNTO CON ÉL" PASA A SECUNDARIO (fila 174, punto 4: un
   solo botón, siempre en su sitio de siempre; con sugerencias a la
   vista deja de ser el principal, como hacía "Aceptar")
   ============================================================ */
await esperarLeido(PDF_BERMEJO, 'Bermejo Instalaciones');
await comprobar('1. una sola sugerencia, sin marca',
  sugerenciasDe(PDF_BERMEJO).count(), 1);
await comprobar('la sugerencia es el asunto abierto de Bermejo',
  sugerenciasDe(PDF_BERMEJO).first().textContent()
    .then((t) => t.indexOf(ABIERTO_BERMEJO) !== -1 && t.indexOf('otro tipo') === -1 &&
                 t.indexOf('archivado') === -1), true);
await comprobar('6. sigue habiendo un solo botón, "Crear asunto con él"',
  tarjetaDe(PDF_BERMEJO).locator('[data-accion-suelto="crear"]').textContent(),
  'Crear asunto con él');
await comprobar('y ya no es el botón destacado (pasa a discreto)',
  tarjetaDe(PDF_BERMEJO).locator('[data-accion-suelto="crear"]')
    .evaluate((b) => b.classList.contains('boton-principal')), false);
await comprobar('"Meter aquí" sí es el destacado de su línea',
  sugerenciasDe(PDF_BERMEJO).first().locator('button').first()
    .evaluate((b) => b.classList.contains('boton-principal')), true);

/* Pulsar "Meter aquí" mete el documento en ese asunto sin más cuadro
   (el asunto está abierto: no hace falta preguntar si reabrir), y abre
   directo el formulario de ponerle nombre (fila 174, punto 2), no la
   lista. */
await sugerenciasDe(PDF_BERMEJO).first().locator('button').first().click();
await pagina.waitForSelector('#doc-guardar');
await comprobar('"Meter aquí" ha llevado directo al cuadro de ponerle nombre',
  pagina.locator('#cuadro-titulo').textContent(), ABIERTO_BERMEJO);
/* Este cuadro (App.verDocumentos) no lleva botón Cancelar (se abre con
   sinCancelar=true): se cierra con el único que hay, "Cerrar". */
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('y el documento ha entrado en la carpeta del asunto',
  pagina.evaluate(async (n) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(n);
    const h = await c.getFileHandle('Factura de Bermejo.pdf').then(() => true).catch(() => false);
    return h;
  }, ABIERTO_BERMEJO), true);

/* ============================================================
   ESCENARIO 2. CUATRO ABIERTOS: 3 SALEN, MISMO TIPO PRIMERO,
   EL TERCERO CON "OTRO TIPO"
   ============================================================ */
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await esperarLeido(PDF_DELTA, 'Delta Suministros');
await comprobar('2. salen tres sugerencias, no más',
  sugerenciasDe(PDF_DELTA).count(), 3);
await comprobar('las dos primeras son las del mismo tipo, la más reciente antes',
  sugerenciasDe(PDF_DELTA).allTextContents().then((t) => t.slice(0, 2).map((x) => x.indexOf(DELTA_2) !== -1 || x.indexOf(DELTA_1) !== -1)),
  [true, true]);
await comprobar('la primera de las dos es la más reciente de su grupo (DELTA_2)',
  sugerenciasDe(PDF_DELTA).nth(0).textContent().then((t) => t.indexOf(DELTA_2) !== -1), true);
await comprobar('sin la marca "otro tipo" las dos del mismo tipo',
  sugerenciasDe(PDF_DELTA).allTextContents().then((t) => t.slice(0, 2).every((x) => x.indexOf('otro tipo') === -1)), true);
await comprobar('la tercera es la de otro tipo, y lleva la marca',
  sugerenciasDe(PDF_DELTA).nth(2).textContent()
    .then((t) => t.indexOf(DELTA_4) !== -1 && t.indexOf('otro tipo') !== -1), true);

/* ============================================================
   ESCENARIO 7. "METER EN UN ASUNTO" PONE ARRIBA LOS ASUNTOS DEL
   TERCERO LEÍDO
   ============================================================ */
await comprobar('7. "Meter en un asunto" pone un asunto de Delta el primero',
  pagina.evaluate(([n, deDelta]) => {
    const l = App.parecidoDelSuelto(n);
    return l.length ? deDelta.indexOf(l[0].nombre) !== -1 : false;
  }, [PDF_DELTA, [DELTA_1, DELTA_2, DELTA_3, DELTA_4]]), true);

/* ============================================================
   ESCENARIO 4. UN ABIERTO Y UN ARCHIVADO DEL MISMO TERCERO: SOLO
   SALE EL ABIERTO
   ============================================================ */
await esperarLeido(PDF_HORIZONTE, 'Horizonte Climatización');
await comprobar('4. con abierto y archivado del mismo tercero, solo sale el abierto',
  sugerenciasDe(PDF_HORIZONTE).count(), 1);
await comprobar('y es el abierto, sin la marca "archivado"',
  sugerenciasDe(PDF_HORIZONTE).first().textContent()
    .then((t) => t.indexOf(HORIZONTE_ABIERTO) !== -1 && t.indexOf('archivado') === -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
