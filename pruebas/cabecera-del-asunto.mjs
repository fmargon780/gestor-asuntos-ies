/* Prueba en navegador de verdad de la cabecera reordenada de un asunto
   (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md). Es un cambio de
   disposición y de agrupación: ninguna acción desaparece ni cambia lo
   que hace, solo dónde vive y con quién va agrupada.

   Los 11 escenarios de la sección 15 del encargo, en el orden que
   conviene a la prueba (no el de la lista), reutilizando un mismo
   asunto "rico" para no montar el disco de mentira una vez por
   escenario. Mismo patrón que pruebas/ficha-disposicion.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1600, height: 720 } });
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

const RICO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1140233';
const MINIMO = '260906 CERTIFICADO Otro Proveedor SL 22222222Z';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([rico, minimo]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [rico]: {
        tercero: 'Pérez Ruiz, Ana 1140233', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        curso: '26-27', abiertoPor: 'Francisco Marmolejo González'
      },
      [minimo]: {
        tercero: 'Otro Proveedor SL 22222222Z', categoria: 'EMPRESAS', situacion: 'PENDIENTE'
      }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(rico, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(minimo, { create: true });
}, [RICO, MINIMO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: nombre }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(300);
}

function elementosDeAcciones() {
  return pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-acciones > *')).map((el) => {
    if (el.tagName === 'SELECT') return 'estado';
    if (el.classList.contains('boton-vencimiento')) return 'vencimiento';
    if (el.classList.contains('ficha-encargo')) return 'encargo';
    if (el.classList.contains('ficha-menu-envoltorio')) return 'comunicar';
    if (el.classList.contains('boton-principal')) return 'archivar';
    return 'desconocido:' + el.className;
  }));
}

/* ============================================================
   1 y 2. LA BARRA: CINCO ELEMENTOS, EN ORDEN, Y NADA DE LO VIEJO
   ============================================================ */
console.log('--- 1 y 2. la barra de acciones ---');
await abrirFicha(RICO);

await comprobar('1. exactamente cinco elementos, en este orden',
  elementosDeAcciones(), ['estado', 'vencimiento', 'encargo', 'comunicar', 'archivar']);

await comprobar('2. ya no hay ningún botón de los viejos',
  pagina.evaluate(() => {
    const viejos = ['Vía', 'Plazo', 'Lo pide', 'Editar', 'Copiar nombre',
      'Gestionar documentos', 'Borrar', 'Correo', 'Mensaje Séneca'];
    const textos = Array.from(document.querySelectorAll('#ficha-acciones button'))
      .map((b) => b.textContent.trim());
    return viejos.filter((v) => textos.indexOf(v) !== -1);
  }), []);

/* ============================================================
   3. LOS TRES PUNTOS DEL NOMBRE
   ============================================================ */
console.log('--- 3. el menú de tres puntos ---');
await pagina.click('.ficha-nombre-menu-boton');
await pagina.waitForTimeout(100);
/* "Copiar el nombre del asunto" ya no vive aquí desde la fila 58
   (docs/AJUSTES-DE-USO-2026-09-18.md, 1): es el botón "Asunto" de la
   fila de copiar, siempre a la vista (punto 4 de esta misma prueba). */
await comprobar('3. las dos opciones, en orden',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(),
  ['Editar el asunto', 'Borrar el asunto']);
await comprobarQue('3. "Borrar el asunto" se ve en rojo',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion'))
    .some((b) => b.textContent.trim() === 'Borrar el asunto' && b.classList.contains('ficha-menu-peligro'))));
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(100);
await comprobarQue('3. Escape lo cierra, sin echar de la ficha',
  pagina.evaluate(() => !document.querySelector('.ficha-menu:not(.oculto)') &&
    !!document.getElementById('pantalla-asunto') && !document.getElementById('pantalla-asunto').classList.contains('oculto')));

/* ============================================================
   4. LA FILA DE COPIAR DE UN GESTO (fila 58, docs/AJUSTES-DE-USO-
   2026-09-18.md, 1): reemplaza al icono de copiar el número que antes
   vivía pegado al `<h2>`. Los cuatro botones (Asunto, Nombre, NIE,
   DNI/CIF), con datos de verdad, se comprueban aparte en
   pruebas/copiar-fila.mjs; aquí solo el "Asunto", siempre presente, y
   el "NIE", que no depende de ningún fichero de datos (sale del
   propio nombre de la carpeta). */
console.log('--- 4. la fila de copiar de un gesto ---');
await comprobar('4. el botón "Asunto" siempre sale',
  pagina.locator('.ficha-copiar-fila .boton-copiar-fila', { hasText: 'Asunto' }).count(), 1);
await comprobar('4. el "NIE" sale en un asunto de alumnado con número',
  pagina.locator('.ficha-copiar-fila .boton-copiar-fila', { hasText: 'NIE' }).count(), 1);
await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("NIE")');
await pagina.waitForFunction(() => {
  const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .find((x) => x.textContent.trim() === 'Copiado');
  return !!b;
});
await comprobar('4. copia de verdad el número, sin el nombre',
  pagina.evaluate(() => navigator.clipboard.readText()), '1140233');

await abrirFicha(MINIMO);
await comprobar('4. el "NIE" no sale en un asunto que no es de alumnado',
  pagina.locator('.ficha-copiar-fila .boton-copiar-fila', { hasText: 'NIE' }).count(), 0);
await comprobar('4. el icono viejo pegado al nombre ha desaparecido',
  pagina.locator('.ficha-nombre .boton-nie').count(), 0);

await abrirFicha(RICO);

/* ============================================================
   6. LA ETIQUETA DE VENCIMIENTO ABRE EL CUADRO DE SIEMPRE
   ============================================================ */
console.log('--- 6. pulsar el vencimiento abre el cuadro de plazo de siempre ---');
await pagina.click('.boton-vencimiento');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('6. el título del cuadro es el de siempre',
  pagina.locator('#cuadro-titulo').textContent(), 'Fecha límite del asunto');
await comprobarQue('6. trae el campo de fecha de siempre', pagina.locator('#plazo-fecha').count().then((n) => n === 1));
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   7. "COMUNICAR"
   ============================================================ */
console.log('--- 7. Comunicar abre Correo y Mensaje de Séneca ---');
await pagina.click('.boton-comunicar');
await pagina.waitForTimeout(100);
await comprobar('7. las dos opciones',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(),
  ['Correo electrónico', 'Mensaje de Séneca']);
await pagina.getByRole('button', { name: 'Correo electrónico', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('7. "Correo electrónico" abre el cuadro de Correo de siempre',
  pagina.locator('#cuadro-titulo').textContent(), 'Correo de este asunto');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

await pagina.click('.boton-comunicar');
await pagina.waitForTimeout(100);
await pagina.getByRole('button', { name: 'Mensaje de Séneca', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('7. "Mensaje de Séneca" abre el cuadro de Séneca de siempre',
  pagina.locator('#cuadro-titulo').textContent(), 'Mensaje por Séneca');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   8. "EL ENCARGO": QUIÉN LO PIDE Y LA VÍA, DE UNA VEZ
   ============================================================ */
console.log('--- 8. El encargo guarda quién lo pide y la vía juntos ---');
await pagina.click('.ficha-encargo button');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('8. el cuadro es "El encargo"', pagina.locator('#cuadro-titulo').textContent(), 'El encargo');

await pagina.selectOption('#lopide-caja-ficha .lopide-quien', 'otro');
await pagina.fill('#lopide-caja-ficha .lopide-otro-nombre', 'María López');
await pagina.fill('#lopide-caja-ficha .lopide-otro-relacion', 'Tutora');
await pagina.selectOption('#lopide-caja-ficha .lopide-via', 'CORREO');
await pagina.fill('#lopide-caja-ficha .lopide-via-dato', 'maria@correo.es');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(300);

await comprobar('8. quedan escritos donde estaban antes: loPide y via/viaDato',
  pagina.evaluate(async (rico) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    const f = j.asuntos[rico];
    return [f.loPide.nombre, f.loPide.via, f.via, f.viaDato];
  }, RICO), ['María López', 'CORREO', 'CORREO', 'maria@correo.es']);

/* Fila 106 (docs/LO-PIDE-EN-LA-CABECERA.md): quién lo pide sale una sola
   vez, arriba, con la relación en minúscula; debajo del botón, nada. */
await comprobar('8. la etiqueta de arriba lleva la relación entre paréntesis',
  pagina.locator('#pantalla-asunto .marca-lopide').textContent(), 'Lo pide: María López (tutora)');
await comprobar('8. debajo de "El encargo" ya no hay línea gris',
  pagina.locator('.ficha-encargo').evaluate((e) => e.children.length), 1);
await pagina.click('.ficha-encargo button');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#lopide-caja-ficha .lopide-via');
await comprobar('8. al volver a abrir "El encargo", la vía sale con lo guardado',
  pagina.locator('#lopide-caja-ficha .lopide-via').inputValue(), 'CORREO');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   9. "DOCUMENTOS ▾", EN EL BLOQUE, TAMBIÉN VACÍO
   ============================================================ */
console.log('--- 9. "Documentos ▾" en el bloque de documentos ---');
await comprobarQue('9. el bloque de Documentos está vacío (RICO no tiene ficheros)',
  pagina.evaluate(() => {
    const doc = document.getElementById('ficha-documentos');
    return !!(doc && doc.closest('.ficha-bloque') && doc.closest('.ficha-bloque').classList.contains('vacio'));
  }));
await pagina.click('.ficha-documentos-gestionar');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('9. abre exactamente lo mismo que abría "Gestionar documentos"',
  pagina.locator('#cuadro-titulo').textContent(), RICO);
await comprobarQue('9. trae el hueco de siempre de la lista de documentos',
  pagina.locator('#doc-cuerpo').count().then((n) => n === 1));
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   5. LOS TEXTOS Y COLORES DE LA ETIQUETA DE VENCIMIENTO
   ============================================================ */
console.log('--- 5. los textos y colores del vencimiento ---');
function isoEnDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
async function etiqueta(iso) {
  return pagina.evaluate((v) => Plazos.etiquetaVencimiento(v), iso);
}
await comprobar('5. dentro de 7 días', (await etiqueta(isoEnDias(7))).clase, '');
await comprobarQue('5. dentro de 7 días, "quedan 7 días"', (await etiqueta(isoEnDias(7))).texto.indexOf('quedan 7 día') !== -1);
await comprobar('5. quedan 2 días: ámbar', (await etiqueta(isoEnDias(2))).clase, 'vencimiento-cerca');
await comprobar('5. hoy: "Vence hoy", ámbar', await etiqueta(isoEnDias(0)), { texto: 'Vence hoy', clase: 'vencimiento-cerca' });
await comprobar('5. vencido hace 3 días: rojo', await etiqueta(isoEnDias(-3)),
  { texto: 'Venció hace 3 días', clase: 'vencimiento-vencido' });
await comprobar('5. sin fecha: "Sin plazo"', await etiqueta(''), { texto: 'Sin plazo', clase: 'vencimiento-sin' });

/* ============================================================
   10. MODO CONSULTA
   ============================================================ */
console.log('--- 10. modo consulta: el menú se abre, copiar funciona, editar y borrar apagados ---');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(200);
await pagina.evaluate(async (rico) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('presencia.json', window.__disco.fich('presencia.json', JSON.stringify({
    [rico]: { usuario: 'Juan', ultima: new Date().toISOString() }
  })));
}, RICO);
await pagina.locator('.tarjeta-nombre', { hasText: RICO }).first().click();
await pagina.waitForSelector('.aviso-presencia');

await pagina.click('.ficha-nombre-menu-boton');
await pagina.waitForTimeout(100);
await comprobarQue('10. el menú se abre igualmente',
  pagina.evaluate(() => !document.querySelector('.ficha-menu').classList.contains('oculto')));
await comprobar('10. "Editar el asunto" está apagado',
  pagina.getByRole('button', { name: 'Editar el asunto', exact: true }).isDisabled(), true);
await comprobar('10. "Borrar el asunto" está apagado',
  pagina.getByRole('button', { name: 'Borrar el asunto', exact: true }).isDisabled(), true);
/* "Copiar el nombre del asunto" ya no vive en el menú (fila 58): el
   botón "Asunto" de la fila de copiar es el que sigue activo en
   consulta (`esControlDeSoloLectura`, js/ficha-asunto.js). */
await pagina.keyboard.press('Escape');
await comprobar('10. el botón "Asunto" sigue activo en consulta',
  pagina.locator('.ficha-copiar-fila .boton-copiar-fila', { hasText: 'Asunto' }).isDisabled(), false);
await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Asunto")');
await pagina.waitForFunction(() => {
  const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .find((x) => x.textContent.trim() === 'Copiado');
  return !!b;
});
await comprobar('10. copiar de verdad funciona en consulta: el nombre entero, en el portapapeles',
  pagina.evaluate(() => navigator.clipboard.readText()), RICO);

/* ============================================================
   11. CABECERA ENCOGIDA: EL NOMBRE Y LA BARRA SIGUEN A LA VISTA
   ============================================================ */
console.log('--- 11. con la cabecera encogida, el nombre y la barra siguen visibles ---');
/* Fila 107: la cuadrícula de tarjetas cabe sin bajar; para tener por
   dónde bajar se abre una tarjeta en grande con contenido largo. */
await pagina.addStyleTag({ content: '#ficha-guia { min-height: 2000px; }' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(200);
await pagina.evaluate(() => window.scrollTo(0, 400));
await pagina.waitForTimeout(500);
await comprobarQue('11. la cabecera está encogida',
  pagina.evaluate(() => document.querySelector('.ficha-cabecera').classList.contains('encogida')));
/* La fila de copiar se esconde con la cabecera encogida (fila 58,
   igual que la línea gris de debajo del nombre): no hay sitio, y el
   nombre ya lleva los tres puntos. */
await comprobarQue('11. la fila de copiar se esconde, sin sitio en la cabecera encogida',
  pagina.evaluate(() => {
    const b = document.querySelector('.ficha-copiar-fila');
    return !!b && getComputedStyle(b).display === 'none';
  }));
await comprobarQue('11. los tres puntos siguen visibles',
  pagina.evaluate(() => {
    const b = document.querySelector('.ficha-nombre-menu-boton');
    return !!b && b.getBoundingClientRect().width > 0;
  }));
await comprobarQue('11. la barra de acciones sigue visible',
  pagina.evaluate(() => {
    const b = document.getElementById('ficha-acciones');
    return !!b && b.getBoundingClientRect().height > 0;
  }));
await pagina.evaluate(() => window.scrollTo(0, 0));

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
