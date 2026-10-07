/* Prueba en navegador de verdad de la pestaña "Herramientas" (fila
   200, apartados 6 y 7 de docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md).

   Lo que comprueba:
     1. La pestaña "Herramientas" existe en el menú lateral, justo
        después de "Cuentas" y antes de la línea y de "Ajustes".
     2. Al entrar, se ven los cuatro bloques (Papelera, Traer el
        alumnado, Tablas de datos, Restaurar una copia de seguridad).
     3. Ajustes → Mantenimiento ya no los tiene.
     4. En El centro, "Días de aviso" (con #dias-dormido y
        #avisos-dias) y "Copias de seguridad" (con
        #dias-caducidad-copias) son cada una una sola sección.
     5. Los dos avisos de la franja de arriba (papelera vieja, alumnado
        desfasado) llevan a Herramientas, no a Ajustes.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. Antes de
   entrar se quita el RegAlum.csv de mentira (para que salga el aviso
   "falta el fichero de alumnado") y se deja una nota vieja en la
   papelera (para el aviso de papelera vieja). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

/* ---------- antes de entrar: quitar el RegAlum, dejar una nota vieja
   en la papelera ---------- */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  try {
    const d = await g.getDirectoryHandle('datos');
    await d.removeEntry('RegAlum.csv');
  } catch (e) { /* ya no estaba, mejor todavía */ }

  const hace85dias = new Date(Date.now() - 85 * 86400000).toISOString();
  const h = await g.getFileHandle('papelera.json', { create: true });
  await (await h.createWritable()).write(JSON.stringify({
    fichas: [{
      id: 'vieja1', clase: 'nota-tablon', nombre: 'Nota vieja para probar el aviso', carpeta: null,
      origen: null, datos: {
        id: 'vieja1', texto: 'Nota vieja para probar el aviso', color: 'amarillo',
        autor: 'Francisco', creado: hace85dias, para: '', privada: false, hecha: false, hechaPor: '', hechaEl: ''
      },
      quien: 'Francisco', cuando: hace85dias
    }]
  }));
});

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================================================================
   1. El menú: "Herramientas" después de "Cuentas", antes de la línea
      y de "Ajustes".
   ================================================================ */
console.log('--- 1. el menú lateral ---');

await comprobar('el orden de las pestañas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.lateral .pestana[data-pantalla]')).filter(b => b.offsetParent !== null).map(b => b.dataset.pantalla)),
  ['abiertos', 'nuevo', 'archivo', 'personas', 'formularios', 'cuentas', 'herramientas', 'ajustes']);
await comprobar('"Herramientas" se llama así', pagina.locator('.pestana[data-pantalla="herramientas"]').textContent(), 'Herramientas');

/* ================================================================
   2. Al entrar, los cuatro bloques.
   ================================================================ */
console.log('--- 2. los cuatro bloques de Herramientas ---');

await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.waitForSelector('#bloque-tablas-datos');
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-herramientas details').forEach((d) => { d.open = true; });
});
await comprobar('los cuatro títulos salen, en este orden',
  pagina.locator('#herramientas-lista > details .bloque-titulo, #herramientas-tablas-datos-hueco > details .bloque-titulo').allTextContents(),
  ['Control del registro', 'Papelera', 'Traer el alumnado', 'Tablas de datos', 'Restaurar una copia de seguridad']);
await comprobarQue('el botón de Séneca está dentro de "Traer el alumnado"',
  pagina.locator('#bloque-traer-alumnado #btn-traer-datos').count().then(n => n === 1));
await comprobarQue('el botón de la BD de alumnado está dentro de "Traer el alumnado"',
  pagina.locator('#bloque-traer-alumnado #alumnado-bd-traer').count().then(n => n === 1));
await comprobarQue('la lista para restaurar copias está aquí',
  pagina.locator('#tabla-copias').count().then(n => n === 1));
await comprobarQue('la papelera está aquí, con su buscador',
  pagina.locator('#bloque-papelera #buscar-papelera').count().then(n => n === 1));

/* ================================================================
   3. Ajustes → Mantenimiento ya no los tiene.
   ================================================================ */
console.log('--- 3. «Este ordenador» ya no tiene Papelera, Copias ni Tablas de datos ---');

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => App.cambiarPestanaAjustes('ordenador'));
await pagina.waitForTimeout(200);
await comprobar('ni Papelera, ni Copias de seguridad, ni Tablas de datos, pero sí Carpetas de este ordenador',
  pagina.locator('#ajustes-tab-ordenador').textContent().then((t) => ({
    papelera: t.indexOf('Papelera') !== -1,
    copias: t.indexOf('Copias de seguridad') !== -1,
    tablas: t.indexOf('Tablas de datos') !== -1,
    carpetas: t.indexOf('Carpetas de este ordenador') !== -1
  })), { papelera: false, copias: false, tablas: false, carpetas: true });
await comprobar('ni #tabla-papelera, ni #tabla-copias, ni #bloque-tablas-datos, dentro de «Este ordenador»',
  pagina.locator('#ajustes-tab-ordenador #tabla-papelera, #ajustes-tab-ordenador #tabla-copias, ' +
    '#ajustes-tab-ordenador #bloque-tablas-datos').count(), 0);

/* ================================================================
   4. El centro: "Días de aviso" y "Copias de seguridad", una sola
      sección cada una.
   ================================================================ */
console.log('--- 4. El centro: Días de aviso, y Copias de seguridad ---');

await pagina.evaluate(() => App.cambiarPestanaAjustes('centro'));
await pagina.evaluate(() => {
  document.querySelectorAll('#ajustes-tab-centro details').forEach((d) => { d.open = true; });
});
await comprobar('"Días de aviso" es una sola sección, con los dos campos dentro',
  pagina.evaluate(() => {
    const dormido = document.getElementById('dias-dormido');
    const avisos = document.getElementById('avisos-dias');
    const det1 = dormido && dormido.closest('details.bloque-ajustes');
    const det2 = avisos && avisos.closest('details.bloque-ajustes');
    return {
      unaSola: !!det1 && det1 === det2,
      titulo: det1 && det1.querySelector('.bloque-titulo').textContent
    };
  }), { unaSola: true, titulo: 'Días de aviso' });
await comprobar('"Copias de seguridad" es una sola sección, con la caducidad dentro, en El centro',
  pagina.evaluate(() => {
    const caducidad = document.getElementById('dias-caducidad-copias');
    const det = caducidad && caducidad.closest('details.bloque-ajustes');
    return {
      dentroDeCentro: !!det && det.closest('#ajustes-tab-centro') === document.getElementById('ajustes-tab-centro'),
      titulo: det && det.querySelector('.bloque-titulo').textContent,
      sinListaDeRestaurar: !det.querySelector('#tabla-copias')
    };
  }), { dentroDeCentro: true, titulo: 'Copias de seguridad', sinListaDeRestaurar: true });

/* ================================================================
   5. Los dos avisos de la franja de arriba llevan a Herramientas.
   ================================================================ */
console.log('--- 5. los avisos de la franja llevan a Herramientas ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('[data-aviso="papelera-vieja"]');
await pagina.waitForSelector('[data-aviso="frescura"]');

await pagina.click('[data-aviso="papelera-vieja"]');
await pagina.waitForTimeout(200);
await comprobar('el aviso de papelera vieja lleva a Herramientas, con Papelera abierta',
  pagina.evaluate(() => ({
    pantalla: document.querySelector('.pestana.activa').dataset.pantalla,
    papeleraAbierta: document.getElementById('bloque-papelera').open
  })), { pantalla: 'herramientas', papeleraAbierta: true });

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('[data-aviso="frescura"]');
await pagina.click('[data-aviso="frescura"]');
await pagina.waitForTimeout(200);
await comprobar('el aviso de alumnado desfasado lleva a Herramientas, con "Traer el alumnado" abierto',
  pagina.evaluate(() => ({
    pantalla: document.querySelector('.pestana.activa').dataset.pantalla,
    traerAbierto: document.getElementById('bloque-traer-alumnado').open
  })), { pantalla: 'herramientas', traerAbierto: true });

/* Los avisos ámbar/rojo del RegAlum que falta a propósito no son errores. */
const deVerdad = errores.filter((e) => e.indexOf('alumnado') === -1 && e.indexOf('RegAlum') === -1);
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
