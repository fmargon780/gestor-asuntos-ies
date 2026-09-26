/* Prueba en navegador de verdad de la fila 101
   (docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md): tras guardar, se repinta solo
   lo que ha cambiado y está a la vista.

   1. Cambiar el estado con la ficha abierta hace, como mucho, la
      relectura de asuntos.json y su escritura: sin listar carpetas ni
      leer hitos.json ni plantillas.json. La lista, oculta, se queda
      pendiente y se pinta al volver a ella.
   2. Marcar un hito con estado asociado deja el desplegable de estado
      de la cabecera con el valor nuevo.
   3. El aviso de consulta (el compañero dentro) no sale repetido.

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
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'hitos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
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
await pagina.evaluate(async () => {
  /* Fila 138: el paso de «plo que hay que reunir» al guion ya está
     hecho (si no, al entrar lee guias.json y escribe su marca, justo en medio
     de lo que se mide aquí). */
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const marca of ['reunir-migrado.json', 'notas-migrado.json', 'responsable-migrado.json']) {   /* filas 138, 139 y 159 */
    const f = await g.getFileHandle(marca, { create: true });
    const w = await f.createWritable(); await w.write('{}'); await w.close();
  }
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const B = '260921 SOLICITUD Dos, Luis 1150002';
await pagina.evaluate(async (B) => {
  await window.__disco.abiertos.getDirectoryHandle(B, { create: true });
  await App.anotar(B, { tercero: 'Dos, Luis 1150002', categoria: 'ALUMNADO', situacion: 'PENDIENTE' });
  /* Un segundo guardado: la copia del día ya está hecha. */
  await App.anotar(B, { via: 'correo' });
  await Hitos.cambiar(d => {
    d.porAsunto[B] = { creados: U.hoyIso(), hitos: [
      Hitos.normalizarHito({ id: 'h1', titulo: 'Recoger', estado: 'encurso' }),
      Hitos.normalizarHito({ id: 'h2', titulo: 'Tramitar', estadoAsunto: 'EN TRÁMITE' })
    ] };
  });
  await App.verAbiertos();
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'abierto');
}, B);
await pagina.waitForSelector('#ficha-acciones .marca-hito');
await pagina.waitForSelector('#ficha-guia .hito');
await pagina.waitForTimeout(1200);

/* ---------- 1. «Esperando a…» ----------
   Desde la fila 129 (docs/EL-HITO-ES-EL-ESTADO.md) ya no hay desplegable
   de estado: lo que se toca en la cabecera es «Esperando a…», que solo
   mira la carpeta del asunto y escribe hitos.json. */
console.log('--- 1. «Esperando a…» con la ficha abierta ---');
const r1 = await pagina.evaluate(async (B) => {
  const cuenta = {};
  const apunta = (k) => { cuenta[k] = (cuenta[k] || 0) + 1; };
  const originales = {};
  ['leerTexto', 'leerJson', 'ficheros', 'subcarpetas', 'contenido', 'guardarJson', 'escribirTexto'].forEach(f => {
    originales[f] = Carpetas[f];
    Carpetas[f] = function (d, n) {
      apunta(f + (typeof n === 'string' ? ':' + n : ''));
      return originales[f].apply(this, arguments);
    };
  });
  await EstadoHito.ponerEsperando(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'tutor', '');
  await new Promise(r => setTimeout(r, 1500));
  Object.keys(originales).forEach(f => { Carpetas[f] = originales[f]; });
  return { cuenta, pendiente: App.E.listaPendiente };
}, B);
const permitidas = ['ficheros', 'leerJson:hitos.json', 'leerTexto:hitos.json', 'guardarJson:hitos.json', 'escribirTexto:hitos.json'];
await comprobar('solo mira la carpeta y relee y escribe hitos.json',
  Promise.resolve(Object.keys(r1.cuenta).filter(k => permitidas.indexOf(k) === -1 &&
    !/^(escribirTexto|guardarJson):hitos-\d{6}\.json$/.test(k) &&
    !/^leerTexto:hitos-\d{6}\.json$/.test(k))), []);   /* la copia del día de hitos.json, y su lectura
      de verificación (fila 178, docs/CORREO-VERSIONES-Y-LIMPIEZA.md, punto 5) */
await comprobar('como mucho una relectura', Promise.resolve((r1.cuenta['leerJson:hitos.json'] || 0) <= 1), true);
await comprobar('la lista, oculta detrás de la ficha, queda pendiente', Promise.resolve(r1.pendiente), true);
await comprobar('la cabecera lo enseña, sin repintar la ficha',
  pagina.locator('#ficha-acciones .marca-esperando').textContent().then(t => t.indexOf('Esperando a Familia') === 0), true);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('al volver a la lista se pinta, y el asunto ya va con los de terceros',
  pagina.evaluate((B) => [!App.E.listaPendiente, App.ladoDe(App.E.listaAbiertos.filter(x => x.nombre === B)[0]).lado], B),
  [true, 'terceros']);

/* ---------- 2. marcar un hito ---------- */
console.log('--- 2. marcar un hito cambia el paso de la cabecera ---');
await pagina.evaluate((B) => App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'abierto'), B);
await pagina.waitForSelector('#ficha-guia .hito[data-id="h1"] .hito-casilla');
await pagina.click('#ficha-guia .hito[data-id="h1"] .hito-casilla');
await pagina.waitForFunction(() => {
  const m = document.querySelector('#ficha-acciones .marca-hito');
  return m && m.textContent === 'Paso 2 de 2 · Tramitar';
}, null, { timeout: 5000 }).then(() => {}, () => {});
await comprobar('la cabecera pasa a «Paso 2 de 2 · Tramitar»',
  pagina.locator('#ficha-acciones .marca-hito').textContent(), 'Paso 2 de 2 · Tramitar');
await comprobar('y el «Esperando a…» del hito hecho se ha quitado solo',
  pagina.locator('#ficha-acciones .marca-esperando').count(), 0);

/* ---------- 3. el aviso de consulta, una sola vez ---------- */
console.log('--- 3. el aviso de consulta no se repite ---');
await comprobar('preparación: el compañero está dentro del asunto',
  pagina.evaluate(async (B) => {
    const g = App.E.gestor;
    const p = await Carpetas.crear(g, 'presencia');
    await Carpetas.guardarJson(p, U.hueso('Compañero') + '.json',
      { usuario: 'Compañero', asuntos: { [B]: { ultima: new Date().toISOString() } } });
    await Presencia.refrescarCache();
    Presencia.vigilar(B, function () {});
    await new Promise(r => setTimeout(r, 300));
    return 'ok';
  }, B), 'ok');
const r3 = await pagina.evaluate(async (B) => {
  /* El aviso real de la ficha: se vuelve a abrir (vigila con su propio onCambio). */
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'abierto');
  /* Presencia relee cada 10 s: antes, en cada vuelta volvía a avisar y
     la ficha pintaba el aviso otra vez debajo del anterior. */
  await new Promise(r => setTimeout(r, 11000));
  const caja = document.getElementById('ficha-presencia');
  return [caja.querySelectorAll('.boton-presencia-tomar').length, caja.querySelectorAll('strong').length];
}, B);
await comprobar('un solo botón «Tomar el mando» y un solo aviso', Promise.resolve(r3), [1, 1]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
