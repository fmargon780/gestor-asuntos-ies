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
await pagina.waitForSelector('#ficha-acciones select.campo-estado');
await pagina.waitForSelector('#ficha-guia .hito');
await pagina.waitForTimeout(1200);

/* ---------- 1. cambiar el estado ---------- */
console.log('--- 1. cambiar el estado con la ficha abierta ---');
const r1 = await pagina.evaluate(async () => {
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
  const sel = document.querySelector('#ficha-acciones select.campo-estado');
  const opcion = Array.from(sel.options).find(o => o.value && o.value !== sel.value);
  sel.value = opcion.value;
  sel.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 1500));
  Object.keys(originales).forEach(f => { Carpetas[f] = originales[f]; });
  return { cuenta, valor: opcion.value, pendiente: App.E.listaPendiente };
});
const lecturasPermitidas = ['leerJson:asuntos.json', 'leerTexto:asuntos.json', 'guardarJson:asuntos.json', 'escribirTexto:asuntos.json'];
await comprobar('solo relee y escribe asuntos.json',
  Promise.resolve(Object.keys(r1.cuenta).filter(k => lecturasPermitidas.indexOf(k) === -1)), []);
await comprobar('como mucho una relectura', Promise.resolve((r1.cuenta['leerJson:asuntos.json'] || 0) <= 1), true);
await comprobar('la lista, oculta detrás de la ficha, queda pendiente', Promise.resolve(r1.pendiente), true);
await comprobar('el desplegable enseña el estado nuevo',
  pagina.locator('#ficha-acciones select.campo-estado').inputValue(), r1.valor);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('al volver a la lista se pinta, con el estado nuevo',
  pagina.evaluate(([B, valor]) => {
    const t = Array.from(document.querySelectorAll('#lista-abiertos .tarjeta')).find(x => x.textContent.indexOf(B) > -1);
    return [!App.E.listaPendiente, !!t && t.textContent.indexOf(valor) > -1];
  }, [B, r1.valor]), [true, true]);

/* ---------- 2. marcar un hito con estado asociado ---------- */
console.log('--- 2. marcar un hito que cambia el estado ---');
await pagina.evaluate((B) => App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'abierto'), B);
await pagina.waitForSelector('#ficha-guia .hito[data-id="h1"] .hito-casilla');
await pagina.click('#ficha-guia .hito[data-id="h1"] .hito-casilla');
await pagina.waitForFunction(() => {
  const s = document.querySelector('#ficha-acciones select.campo-estado');
  return s && s.value === 'EN TRÁMITE';
}, null, { timeout: 5000 }).then(() => {}, () => {});
await comprobar('el desplegable de la cabecera pasa a EN TRÁMITE',
  pagina.locator('#ficha-acciones select.campo-estado').inputValue(), 'EN TRÁMITE');

/* ---------- 3. el aviso de consulta, una sola vez ---------- */
console.log('--- 3. el aviso de consulta no se repite ---');
await comprobar('preparación: el compañero está dentro del asunto',
  pagina.evaluate(async (B) => {
    const g = App.E.gestor;
    await Carpetas.guardarJson(g, 'presencia.json', { [B]: { usuario: 'Compañero', ultima: new Date().toISOString() } });
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
