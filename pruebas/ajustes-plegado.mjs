/* Prueba en navegador de verdad de "Ajustes plegado" (24-sep-2026,
   fila 105 de docs/COLA.md, docs/AJUSTES-PLEGADO.md).

   Lo que comprueba:
     1. Al abrir un tipo, las ocho secciones salen plegadas y cada título
        lleva su resumen (un tipo con 2 campos dice "2 campos"; uno sin
        plazo dice "sin plazo").
     2. Se despliega "Campos", se sale, se entra en otro tipo: "Campos"
        sale desplegada (se recuerda por sección, no por tipo).
     3. Se añade un campo y se guarda: el resumen pasa de 2 a 3 sin salir
        de la pantalla.
     4. Un paso desactualizado pone el aviso ámbar en el título de "Pasos
        del trámite", aun plegado.
     5. "El centro": bloques plegados, en el orden nuevo.
     6. "Mantenimiento": sin conflictos ni fichas sin carpeta, esos
        bloques no se ven; con una ficha sin carpeta de mentira, su
        bloque sale arriba y desplegado. Los botones sueltos, dentro de
        "Herramientas", al final.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [] },
    { id: 'm2', titulo: 'Comprobar el expediente', cuerpo: '', opciones: [] }
  ]
};

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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

function resumen(seccion) {
  return pagina.locator('#pantalla-tipo-asunto details[data-seccion="' + seccion + '"] > summary .bloque-resumen')
    .textContent().then((t) => (t || '').trim());
}

/* ---------- arranque, con una guía de dos pasos para MATRICULA ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(400);

/* MATRICULA, con dos campos puestos y sin plazo; y un segundo tipo. */
const otroTipo = await pagina.evaluate(async () => {
  const t = App.E.tipos.filter((x) => x.tipo === 'MATRICULA')[0];
  delete t.plazo;
  await App.guardarTipos();
  App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, 'MATRICULA', [
    { origen: 'fichero', columna: 'Unidad', obligatorio: false, enNombre: false },
    { origen: 'fichero', columna: 'Curso', obligatorio: false, enNombre: false }
  ]);
  return App.E.tipos.filter((x) => x.tipo !== 'MATRICULA')[0].tipo;
});

async function abrirTipo(nombre) {
  await pagina.evaluate((n) => {
    const t = App.E.tipos.filter((x) => x.tipo === n)[0];
    return App.abrirTipoDeAsunto(t);
  }, nombre);
  await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
  await pagina.waitForTimeout(400);
}

/* ================================================================
   1. Las ocho secciones, plegadas y con su resumen.
   ================================================================ */
console.log('--- 1. la pantalla de un tipo, plegada y con resúmenes ---');
await abrirTipo('MATRICULA');

await comprobar('hay ocho secciones plegables',
  pagina.locator('#pantalla-tipo-asunto details.bloque-ajustes').count(), 8);
await comprobar('ninguna sale desplegada la primera vez',
  pagina.locator('#pantalla-tipo-asunto details[open]').count(), 0);
await comprobar('"Campos" dice cuántos lleva', resumen('campos'), '2 campos');
await comprobar('"Plazo" dice "sin plazo"', resumen('plazo'), 'sin plazo');
await comprobar('"Pasos del trámite" dice cuántos pasos', resumen('pasos'), '2 pasos');
await comprobar('"Datos del tipo" dice la categoría', resumen('datos'), 'ALUMNADO');
await comprobar('"Palabras clave" dice "ninguna"', resumen('palabras'), 'ninguna');
await comprobar('"Se repite" dice "no"', resumen('repite'), 'no');
await comprobar('"Plantillas de correo y de Séneca" dice "ninguna"', resumen('correo'), 'ninguna');

/* ================================================================
   2. Lo abierto se recuerda por sección, no por tipo.
   ================================================================ */
console.log('--- 2. se recuerda lo que se dejó abierto ---');
await pagina.click('#pantalla-tipo-asunto details[data-seccion="campos"] > summary');
await comprobar('"Campos" queda desplegada',
  pagina.locator('#pantalla-tipo-asunto details[data-seccion="campos"]').evaluate((d) => d.open), true);
await pagina.evaluate(() => App.cerrarTipoDeAsunto());
await abrirTipo(otroTipo);
await comprobar('en otro tipo, "Campos" sale desplegada',
  pagina.locator('#pantalla-tipo-asunto details[data-seccion="campos"]').evaluate((d) => d.open), true);
await comprobar('y las demás, plegadas',
  pagina.locator('#pantalla-tipo-asunto details[open]').count(), 1);
await comprobar('se guarda en localStorage (gestor-ajustes-plegado)',
  pagina.evaluate(() => JSON.parse(localStorage.getItem('gestor-ajustes-plegado'))['tipo:campos']), true);

/* ================================================================
   3. Añadir un campo y guardar pone al día el resumen.
   ================================================================ */
console.log('--- 3. el resumen se pone al día al guardar ---');
await pagina.evaluate(() => App.cerrarTipoDeAsunto());
await abrirTipo('MATRICULA');
await pagina.click('#campos-btn-anadir');
await pagina.waitForTimeout(300);
/* Se añade el primer campo que ofrezca el catálogo, en su pestaña de
   calculados (el disco de mentira no trae columnas de fichero). */
await pagina.evaluate(() => {
  const pestana = Array.from(document.querySelectorAll('#pantalla-tipo-asunto details[data-seccion="campos"] button'))
    .filter((x) => /^Calculados/.test(x.textContent.trim()))[0];
  if (pestana) pestana.click();
});
await pagina.waitForTimeout(300);
const anadido = await pagina.evaluate(() => {
  const b = Array.from(document.querySelectorAll('#pantalla-tipo-asunto details[data-seccion="campos"] button'))
    .filter((x) => /^(\+ )?Añadir$/.test(x.textContent.trim()) && !x.disabled)[0];
  if (!b) return false;
  b.click();
  return true;
});
await comprobar('el catálogo deja añadir un campo', anadido, true);
await pagina.waitForTimeout(200);
await pagina.evaluate(() => {
  const volver = Array.from(document.querySelectorAll('#pantalla-tipo-asunto details[data-seccion="campos"] button'))
    .filter((x) => /Volver|Listo|Hecho/.test(x.textContent))[0];
  if (volver) volver.click();
});
await pagina.waitForSelector('#campos-guardar');
await comprobar('antes de guardar sigue diciendo 2', resumen('campos'), '2 campos');
await pagina.click('#campos-guardar');
await pagina.waitForTimeout(600);
await comprobar('al guardar pasa a 3, sin salir de la pantalla', resumen('campos'), '3 campos');
await comprobar('seguimos en la pantalla del tipo',
  pagina.locator('#pantalla-tipo-asunto').isVisible(), true);

/* ================================================================
   4. Un paso desactualizado avisa en el título, aun plegado.
   ================================================================ */
console.log('--- 4. el aviso de paso desactualizado, en el título ---');
await pagina.evaluate(() => {
  window.GuiasBiblioteca.pasosDesactualizados = async (pasos) =>
    pasos.length ? [{ modelo: { nombre: pasos[0].titulo }, paso: pasos[0] }] : [];
});
await pagina.evaluate(() => App.cerrarTipoDeAsunto());
await abrirTipo('MATRICULA');
await pagina.waitForTimeout(300);
await comprobar('"Pasos del trámite" sigue plegada',
  pagina.locator('#pantalla-tipo-asunto details[data-seccion="pasos"]').evaluate((d) => d.open), false);
await comprobar('su título avisa del paso desactualizado', resumen('pasos'), '2 pasos · ⚠ 1 paso desactualizado');
await comprobar('en ámbar',
  pagina.locator('#pantalla-tipo-asunto details[data-seccion="pasos"] .bloque-resumen')
    .evaluate((s) => s.classList.contains('bloque-resumen-ambar')), true);

/* ================================================================
   5. "El centro": plegado y en el orden nuevo.
   ================================================================ */
console.log('--- 5. El centro ---');
await pagina.evaluate(() => App.cerrarTipoDeAsunto());
await pagina.evaluate(() => App.cambiarPestanaAjustes('centro'));
await pagina.evaluate(() => App.pintarAjustes());
await pagina.waitForTimeout(400);
const titulosCentro = await pagina.locator('#ajustes-tab-centro > details.bloque-ajustes > summary .bloque-titulo').allTextContents();
await comprobar('los ocho primeros, en el orden nuevo', titulosCentro.slice(0, 8), [
  'Estados del asunto', 'Tipos de documento', 'Grupos de personas', 'Campos propios', 'Hitos',
  'Datos del centro y firma', 'Cómo se abrevia cada grupo', 'Ficheros de datos']);
await comprobar('todos plegados',
  pagina.locator('#ajustes-tab-centro details.bloque-ajustes[open]').count(), 0);
await comprobar('"Estados del asunto" dice cuántos hay',
  pagina.evaluate(() => {
    const t = document.querySelector('#ajustes-tab-centro > details.bloque-ajustes .bloque-resumen').textContent;
    return t === App.E.estados.length + ' estados';
  }), true);

/* ================================================================
   6. "Mantenimiento": los avisos de fallo, solo con fallo.
   ================================================================ */
console.log('--- 6. Mantenimiento ---');
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.evaluate(() => App.pintarAjustes());
await pagina.waitForTimeout(500);
await comprobar('sin fichas sin carpeta, su bloque no se ve',
  pagina.locator('#bloque-huerfanas').isVisible(), false);
await comprobar('sin conflictos, su bloque no se ve',
  pagina.locator('#bloque-conflictos').isVisible(), false);
await comprobar('"Herramientas" es el último bloque',
  pagina.evaluate(() => document.getElementById('ajustes-tab-mantenimiento').lastElementChild.id), 'bloque-herramientas');
await comprobar('y lleva dentro "Plantillas del centro"',
  pagina.evaluate(() => !!document.querySelector('#bloque-herramientas #bloque-plantillas-centro')), true);
await comprobar('"Carpetas de este ordenador" dice "2 señaladas"',
  pagina.locator('#ajustes-tab-mantenimiento details:has(#estado-carpetas) .bloque-resumen').textContent(), '2 señaladas');

await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const registro = await Carpetas.leerJson(g, 'asuntos.json') || { asuntos: {} };
  registro.asuntos = registro.asuntos || {};
  registro.asuntos['260901 MATRICULA 26-27 Nombre Viejo 111'] = { tipo: 'MATRICULA', situacion: 'PENDIENTE', notas: [] };
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify(registro)));
  await App.cargarRegistro();
  await App.pintarAjustes();
});
await pagina.waitForTimeout(600);
await comprobar('con una ficha sin carpeta, su bloque se ve',
  pagina.locator('#bloque-huerfanas').isVisible(), true);
await comprobar('arriba del todo',
  pagina.evaluate(() => document.getElementById('ajustes-tab-mantenimiento').firstElementChild.id), 'bloque-huerfanas');
await comprobar('y desplegado',
  pagina.locator('#bloque-huerfanas').evaluate((d) => d.open), true);

await comprobar('sin errores en la consola', errores, []);

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
