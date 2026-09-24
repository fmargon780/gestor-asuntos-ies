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
  await pagina.locator('.tarjeta-nombre', { hasText: nombre }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(400);
}

/* ============================================================
   1, 2, 3, 5, 6, 7. EL ASUNTO RICO
   ============================================================ */
console.log('--- el asunto con de todo ---');
await abrirFicha(RICO);

/* Fila 107 (docs/FICHA-EN-TARJETAS.md): las tres columnas pasan a una
   cuadrícula de tarjetas; con "Datos del trámite", cuatro arriba. */
await comprobar('1. el orden de las tarjetas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-tarjetas .ficha-tarjeta')).map((t) => t.dataset.tarjeta)),
  ['hitos', 'documentos', 'contacto', 'tramite', 'notas', 'otros', 'relacionados']);

await comprobarQue('2. #ficha-notas está antes que #ficha-otros en el documento',
  pagina.evaluate(() => {
    const notas = document.getElementById('ficha-notas');
    const otros = document.getElementById('ficha-otros');
    return !!(notas && otros && (notas.compareDocumentPosition(otros) & Node.DOCUMENT_POSITION_FOLLOWING));
  }));

const subtitulo = await pagina.locator('.ficha-subtitulo').textContent();
await comprobarQue('3. la línea trae la fecha de apertura', Promise.resolve(subtitulo.indexOf('05/09/2026') !== -1));
await comprobarQue('3. la categoría', Promise.resolve(subtitulo.indexOf('ALUMNADO') !== -1));
await comprobarQue('3. el año académico', Promise.resolve(subtitulo.indexOf('26-27') !== -1));
await comprobarQue('3. quién lo abrió', Promise.resolve(subtitulo.indexOf('Francisco Marmolejo González') !== -1));
await comprobarQue('3. no trae el tipo', Promise.resolve(subtitulo.indexOf('MATRICULA') === -1));
await comprobarQue('3. no trae el estado', Promise.resolve(subtitulo.indexOf('PENDIENTE') === -1));
await comprobarQue('3. no trae la fecha límite', Promise.resolve(subtitulo.indexOf('20-sep') === -1));

await comprobar('4. "Datos del asunto" ya no existe',
  pagina.locator('.ficha-bloque .ficha-titulo', { hasText: 'Datos del asunto' }).count(), 0);

await comprobar('5. "Datos del trámite" sale, con la referencia del campo propio',
  /* Solo las que se ven: la fila «Formularios» nace oculta y solo se
     enseña si hay alguno (fila 101). */
  pagina.locator('.ficha-bloque', { hasText: 'Datos del trámite' }).locator('.ficha-dato:not(.oculto)').allTextContents(),
  ['Referencia expedienteREF-2026-01', 'Vía de comunicaciónCorreo electrónico: tutor@correo.es',
   'Lo pideAna Ruiz (madre) · por teléfono · 1-sep-2026']);
await comprobarQue('5. no trae Tipo, Tercero, Estado ni Fecha límite',
  pagina.evaluate(() => {
    const texto = Array.from(document.querySelectorAll('.ficha-bloque'))
      .filter((b) => b.querySelector('.ficha-titulo') && b.querySelector('.ficha-titulo').textContent.indexOf('Datos del trámite') !== -1)
      .map((b) => b.textContent).join(' ');
    return ['Tipo', 'Tercero', 'Estado', 'Fecha límite'].every((t) => texto.indexOf(t) === -1);
  }));

console.log('--- 6. "Otros asuntos" y "Personas", ahora tarjetas con su resumen ---');
await comprobar('6. el resumen de "Otros asuntos" (es el único de ese tercero)',
  pagina.locator('.ficha-tarjeta[data-tarjeta="otros"] .ficha-tarjeta-resumen').textContent(), 'ninguno todavía');
await comprobar('6. el resumen de "Relacionados" trae la cuenta y el nombre',
  pagina.locator('.ficha-tarjeta[data-tarjeta="relacionados"] .ficha-tarjeta-resumen').textContent(), '1 personaAlguien Del Cole');

await pagina.click('.ficha-tarjeta[data-tarjeta="relacionados"] .ficha-tarjeta-resumen');
await pagina.waitForTimeout(150);
await comprobar('se abre en grande al pulsar',
  pagina.evaluate(() => document.getElementById('ficha-tarjetas').dataset.abierta), 'relacionados');

/* Forzar un repintado de la ficha entera (un cambio en la ficha por
   debajo, como en pruebas/cabecera-fija.mjs, escenario 6; desde la fila
   129 ya no hay desplegable de estado): no debe cerrar la tarjeta. */
await pagina.evaluate(async () => {
  const n = App.fichaAbierta();
  window.__descripcionAntes = (App.E.registro.asuntos[n] || {}).descripcion || '';
  await App.anotar(n, { descripcion: 'Cambiada para la prueba' });
  await App.reengancharFicha();
});
await pagina.waitForTimeout(500);
await comprobar('sigue abierta tras el repintado',
  pagina.evaluate(() => document.getElementById('ficha-tarjetas').dataset.abierta), 'relacionados');
await pagina.evaluate(() => FichaTarjetas.cerrar());

/* Se deja la ficha como estaba, para no complicar los escenarios de
   más abajo (que vuelven a abrir este mismo asunto desde la lista). */
await pagina.evaluate(async () => {
  await App.anotar(App.fichaAbierta(), { descripcion: window.__descripcionAntes });
  await App.reengancharFicha();
});
await pagina.waitForTimeout(500);

console.log('--- 7. el bloque de Documentos, vacío ---');
await comprobarQue('el bloque de Documentos lleva la clase "vacio"',
  pagina.evaluate(() => {
    const doc = document.getElementById('ficha-documentos');
    return !!(doc && doc.closest('.ficha-bloque') && doc.closest('.ficha-bloque').classList.contains('vacio'));
  }));

/* ============================================================
   4. EL ASUNTO SIN CAMPOS PROPIOS, SIN VÍA Y SIN LO PIDE
   ============================================================ */
console.log('--- 4. sin campos propios, sin vía y sin lo pide: sin "Datos del trámite" ---');
await abrirFicha(MINIMO);
await comprobar('no sale "Datos del trámite"',
  pagina.locator('.ficha-bloque .ficha-titulo', { hasText: 'Datos del trámite' }).count(), 0);
await comprobarQue('con un documento dentro, el bloque de Documentos no lleva "vacio"',
  pagina.evaluate(() => {
    const doc = document.getElementById('ficha-documentos');
    return !!(doc && doc.closest('.ficha-bloque') && !doc.closest('.ficha-bloque').classList.contains('vacio'));
  }));

/* ============================================================
   8. LA CUADRÍCULA, SEGÚN EL ANCHO (fila 107)
   ============================================================ */
console.log('--- 8. la cuadrícula, según el ancho ---');
await abrirFicha(RICO);

async function columnas() {
  return pagina.evaluate(() =>
    getComputedStyle(document.querySelector('.ficha-tarjetas-rejilla')).gridTemplateColumns.trim().split(/\s+/).length);
}

await pagina.setViewportSize({ width: 1600, height: 900 });
await pagina.waitForTimeout(200);
await comprobar('a 1600px, con "Datos del trámite", cuatro columnas', columnas(), 4);
await pagina.setViewportSize({ width: 1000, height: 900 });
await pagina.waitForTimeout(200);
await comprobar('por debajo de 1100px, dos columnas', columnas(), 2);
await pagina.setViewportSize({ width: 1600, height: 900 });
await pagina.evaluate(() => document.body.classList.add('con-lector'));
await pagina.waitForTimeout(200);
await comprobar('con el lector abierto, dos columnas', columnas(), 2);
await pagina.evaluate(() => document.body.classList.remove('con-lector'));

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
