/* Prueba en navegador de verdad de la nueva disposición de la ficha de
   un asunto (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md). Es un
   cambio de disposición, no de funcionamiento: nada de lo que ya
   pintaba cada bloque cambia, solo dónde está y cuánto sitio ocupa.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, mismo patrón
   que pruebas/cabecera-fija.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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

const RICO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const MINIMO = '260906 CERTIFICADO Otro Alumno 5678';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([rico, minimo]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [rico]: {
        tercero: 'Pérez Ruiz, Ana 1234', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        curso: '26-27', descripcion: 'Matrícula ordinaria', abiertoPor: 'Francisco Marmolejo González',
        limite: '2026-09-20',
        campos: { 'Referencia expediente': { valor: 'REF-2026-01' } },
        via: 'CORREO', viaDato: 'tutor@correo.es',
        loPide: { nombre: 'Ana Ruiz (madre)', via: 'TELEFONO', fecha: '2026-09-01' },
        relacionados: [{ categoria: 'PERSONAL', nombre: 'Alguien Del Cole' }]
      },
      [minimo]: {
        tercero: 'Otro Alumno 5678', categoria: 'ALUMNADO', situacion: 'PENDIENTE'
      }
    }
  })));
  /* El asunto RICO se queda sin ningún documento dentro, para el
     escenario 7 (el bloque de Documentos, vacío). */
  await window.__disco.abiertos.getDirectoryHandle(rico, { create: true });
  const carpetaMinimo = await window.__disco.abiertos.getDirectoryHandle(minimo, { create: true });
  carpetaMinimo._hijos.set('Un papel cualquiera.pdf',
    window.__disco.fich('Un papel cualquiera.pdf', 'contenido'));
}, [RICO, MINIMO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombre + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(400);
}

/* ============================================================
   1, 2, 3, 5, 6, 7. EL ASUNTO RICO
   ============================================================ */
console.log('--- el asunto con de todo ---');
await abrirFicha(RICO);

/* Fila 107 (docs/FICHA-EN-TARJETAS.md): las tres columnas pasan a tarjetas; fila 425, pestañas; fila 637 (13-nov-2026): sin
   pestañas, hito a la izquierda y a la derecha cinco bloques plegables (`#ficha-plegables`), todos plegados al entrar. */
await comprobar('1. el orden de los bloques de la derecha',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-plegables > .ficha-plegable')).map((t) => t.dataset.tarjeta)),
  ['datos', 'relacionados', 'documentos', 'notas', 'otros']);
await comprobar('1. y sin pestañas de arriba',
  pagina.evaluate(() => [!!document.getElementById('ficha-tarjetas-pestanas'), document.querySelectorAll('.ficha-pestana').length]),
  [false, 0]);
await comprobar('1. todos plegados al entrar',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-plegables > .ficha-plegable.abierto')).length), 0);

await comprobarQue('2. #ficha-notas está antes que #ficha-otros en el documento',
  pagina.evaluate(() => {
    const notas = document.getElementById('ficha-notas');
    const otros = document.getElementById('ficha-otros');
    return !!(notas && otros && (notas.compareDocumentPosition(otros) & Node.DOCUMENT_POSITION_FOLLOWING));
  }));

/* La línea gris de la cabecera (`.ficha-subtitulo`) ya no existe: «Abierto el … · quién» pasó al pie del bloque «Datos». */
await comprobar('3. ya no hay línea gris bajo el nombre', pagina.locator('.ficha-subtitulo, .ficha-apertura').count(), 0);
await pagina.evaluate(() => FichaTarjetas.abrir('datos'));
const subtitulo = await pagina.locator('#ficha-datos-bloque .datos-pie').textContent();
await comprobarQue('3. el pie del bloque «Datos» trae la fecha de apertura', Promise.resolve(subtitulo.indexOf('05/09/2026') !== -1 || /5-sep-2026|5 sep/i.test(subtitulo)));
await comprobarQue('3. quién lo abrió', Promise.resolve(subtitulo.indexOf('Francisco Marmolejo González') !== -1));
await comprobarQue('3. no trae el tipo', Promise.resolve(subtitulo.indexOf('MATRICULA') === -1));
await comprobarQue('3. no trae el estado', Promise.resolve(subtitulo.indexOf('PENDIENTE') === -1));
await comprobarQue('3. no trae la fecha límite', Promise.resolve(subtitulo.indexOf('20-sep') === -1));

await comprobar('4. "Datos del asunto" ya no existe',
  pagina.locator('.ficha-bloque .ficha-titulo, .plegable-titulo', { hasText: 'Datos del asunto' }).count(), 0);

await pagina.evaluate(() => FichaTarjetas.abrir('tramite'));   /* 'tramite' abre el bloque Datos */
await comprobar('5. «Campos de este asunto» sale, con la referencia del campo propio',
  /* Solo las que se ven: la fila «Formularios» nace oculta y solo se enseña si hay alguno (fila 101). Fila 637: «Lo pide» y
     «Vía de comunicación» se llaman «Quién lo pide» y «Por qué vía». */
  pagina.locator('#ficha-datos-tramite .ficha-dato:not(.oculto)').allTextContents(),
  ['Referencia expedienteREF-2026-01', 'Quién lo pideAna Ruiz (madre) · por teléfono · 1-sep-2026 Cambiar',
   'Por qué víaCorreo electrónico: tutor@correo.es Cambiar']);   /* «Cambiar» abre el cuadro «El encargo» */
await comprobarQue('5. no trae Tipo, Tercero, Estado ni Fecha límite',
  pagina.evaluate(() => {
    const texto = document.getElementById('ficha-datos-tramite').textContent;
    return ['Tipo', 'Tercero', 'Estado', 'Fecha límite'].every((t) => texto.indexOf(t) === -1);
  }));

console.log('--- 6. "Otros asuntos" y "Personas", con su número en la cabecera del bloque ---');
await comprobar('6. «Otros asuntos» no lleva número (es el único de ese tercero)',
  pagina.locator('.plegable-cab .ficha-cuenta[data-cuenta-tarjeta="otros"]').textContent(), '');
await comprobar('6. «Personas y entidades relacionadas» lleva el 1',
  pagina.locator('.plegable-cab .ficha-cuenta[data-cuenta-tarjeta="relacionados"]').textContent(), '1');

await pagina.locator('#ficha-plegables .plegable-cab', { hasText: 'Personas' }).click();
await pagina.waitForTimeout(150);
await comprobar('se abre al pulsar su cabecera',
  pagina.evaluate(() => FichaTarjetas.estaAbierto('relacionados')), true);
await comprobar('y enseña a la persona',
  pagina.locator('#ficha-relacionados').textContent().then((t) => t.indexOf('Alguien Del Cole') !== -1), true);

/* Forzar un repintado de la ficha entera (un cambio en la ficha por
   debajo, como en pruebas/cabecera-fija.mjs, escenario 6; desde la fila
   129 ya no hay desplegable de estado): no debe cerrar el bloque. */
await pagina.evaluate(async () => {
  const n = App.fichaAbierta();
  window.__descripcionAntes = (App.E.registro.asuntos[n] || {}).descripcion || '';
  await App.anotar(n, { descripcion: 'Cambiada para la prueba' });
  await App.reengancharFicha();
});
await pagina.waitForTimeout(500);
await comprobar('sigue abierto tras el repintado',
  pagina.evaluate(() => FichaTarjetas.estaAbierto('relacionados')), true);
await pagina.evaluate(() => FichaTarjetas.plegar('relacionados'));

/* Se deja la ficha como estaba, para no complicar los escenarios de
   más abajo (que vuelven a abrir este mismo asunto desde la lista). */
await pagina.evaluate(async () => {
  await App.anotar(App.fichaAbierta(), { descripcion: window.__descripcionAntes });
  await App.reengancharFicha();
});
await pagina.waitForTimeout(500);

console.log('--- 7. el bloque de Documentos, vacío ---');
/* Fila 637: «Documentos» es un bloque plegable (cerrado, una sola línea); el aviso de carpeta vacía y la cuenta (sin número)
   son lo que distingue un bloque vacío. */
await comprobar('el bloque de Documentos, sin documentos: carpeta vacía y sin cuenta',
  pagina.evaluate(() => [document.getElementById('ficha-documentos').textContent.trim(), document.getElementById('ficha-cuenta-docs').textContent.trim(),
    document.querySelectorAll('#ficha-documentos .ficha-documento-fila').length]),
  ['La carpeta todavía está vacía.', '', 0]);

/* ============================================================
   4. EL ASUNTO SIN CAMPOS PROPIOS, SIN VÍA Y SIN LO PIDE
   ============================================================ */
console.log('--- 4. sin campos propios, sin vía y sin lo pide: "Campos del asunto" solo con el botón ---');
await abrirFicha(MINIMO);
/* Fila 254: en un asunto abierto «Campos de este asunto» sale siempre, sin filas y con «+ Añadir campo» (fila 637: dentro del
   bloque «Datos»). */
await pagina.evaluate(() => FichaTarjetas.abrir('datos'));
await comprobar('"Campos de este asunto" sale sin filas y con «+ Añadir campo»',
  pagina.evaluate(() => {
    const t = document.getElementById('ficha-datos-tramite');
    return t ? { filas: t.querySelectorAll('.ficha-dato:not(.oculto)').length,
      boton: (document.querySelector('#ficha-datos-bloque #ficha-campo-anadir') || {}).textContent } : null;
  }), { filas: 0, boton: '+ Añadir campo' });
await comprobar('con un documento dentro, el bloque de Documentos lo cuenta y lo enseña',
  pagina.evaluate(() => { FichaTarjetas.abrir('documentos');
    return [document.getElementById('ficha-cuenta-docs').textContent.trim(), document.querySelectorAll('#ficha-documentos .ficha-documento-fila').length]; }),
  ['1', 1]);

/* ============================================================
   8. «TRABAJO», SEGÚN EL ANCHO (fila 425; antes, la cuadrícula de la fila 107)
   ============================================================ */
console.log('--- 8. «Trabajo», según el ancho ---');
await abrirFicha(RICO);

async function columnas() {
  return pagina.evaluate(() =>
    getComputedStyle(document.getElementById('trabajo-columnas')).gridTemplateColumns.trim().split(/\s+/).length);
}

await pagina.setViewportSize({ width: 1600, height: 900 });
await pagina.waitForTimeout(200);
await comprobar('a 1600px, dos columnas', columnas(), 2);
await pagina.setViewportSize({ width: 1000, height: 900 });
await pagina.waitForTimeout(200);
await comprobar('por debajo de 1100px, una columna', columnas(), 1);
await pagina.setViewportSize({ width: 1600, height: 900 });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
