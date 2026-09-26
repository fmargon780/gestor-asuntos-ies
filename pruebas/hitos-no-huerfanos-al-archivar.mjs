/* Prueba de la fila 178 (26-sep-2026, docs/CORREO-VERSIONES-Y-LIMPIEZA.md,
   punto 8): si falla la escritura del historial de hitos al archivar
   (js/hitos-archivo.js), los hitos del asunto no se quedan huérfanos
   en hitos.json. Se reintenta una vez; si sigue fallando, el aviso
   ámbar sigue saliendo, pero la entrada de hitos.json se quita
   igualmente. Si el reintento sale bien, ni aviso ni huérfanos.

   En navegador de verdad, con el disco de mentira de pruebas/navegador.mjs.
   La escritura del historial se hace fallar a propósito parcheando
   directamente `Carpetas.escribirTexto` (no el disco de mentira: ese
   nivel ya tiene su propio reintento transparente en
   js/reintentar-escritura.js para errores pasajeros de Dropbox, que
   complicaría contar aquí cuántas veces falla de verdad cada intento
   de hitos-archivo.js). El parche solo actúa para el nombre del
   historial; cualquier otro fichero se escribe tal cual. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
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

/* Una guía de un solo paso: basta con un hito para que
   App.cerrarAsunto llegue a intentar escribir el historial. */
const GUIA = [{ id: 'p1', titulo: 'Paso único', cuerpo: '', opciones: [] }];

console.log('--- preparación: alumnado de mentira y guía ---');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async (guia) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Ejemplo Prueba, Alumno Uno;9000001;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013',
    'Ejemplo Prueba, Alumno Dos;9000002;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csvH = await d.getFileHandle('RegAlum.csv', { create: true });
  const w1 = await csvH.createWritable(); await w1.write(csv); await w1.close();

  const guiaH = await g.getFileHandle('guias.json', { create: true });
  const w2 = await guiaH.createWritable();
  await w2.write(JSON.stringify({ MATRICULA: guia }));
  await w2.close();
}, GUIA);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

async function crearAsunto(buscarTexto, fecha) {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
  await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
  await pagina.fill('#buscar-tercero', buscarTexto);
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', fecha);
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('#ficha-volver');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
  await pagina.waitForTimeout(300);
}

async function abrirFichaYArchivar(clave) {
  await pagina.evaluate((clave) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === clave)[0];
    App.abrirFicha(a, 'abierto');
  }, clave);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).click();
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)', { timeout: 15000 });
}

/* Parchea Carpetas.escribirTexto para que, cuando se le pida escribir
   'HISTORIAL DE TRAMITACION.txt', falle las primeras `fallos` veces
   (una excepción normal, sin nombre de error "de sincronización": así
   no entra en el reintento transparente de Reintentar.escritura, y
   cada llamada de aquí corresponde exactamente a un intento de
   hitos-archivo.js, ni más ni menos) y luego escriba de verdad. */
async function hazQueFalleElHistorial(fallos) {
  await pagina.evaluate((fallos) => {
    let quedan = fallos;
    const deVerdad = Carpetas.escribirTexto;
    window.__llamadasHistorial = 0;
    Carpetas.escribirTexto = function (dir, nombre, texto) {
      if (nombre !== 'HISTORIAL DE TRAMITACION.txt') return deVerdad(dir, nombre, texto);
      window.__llamadasHistorial++;
      if (quedan > 0) {
        quedan--;
        return Promise.reject(new Error('Fallo de prueba, a propósito (fila 178)'));
      }
      return deVerdad(dir, nombre, texto);
    };
    window.__deshacerFalloHistorial = function () { Carpetas.escribirTexto = deVerdad; };
  }, fallos);
}

async function hitosDeSiguenAhi(clave) {
  return pagina.evaluate(async (clave) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    return !!j.porAsunto[clave];
  }, clave);
}

/* ================= 1. el historial falla las dos veces (nunca escribe) ================= */

console.log('--- 1. el historial no se puede guardar (ni con el reintento) ---');
await crearAsunto('uno', '2026-09-07');
const CLAVE1 = '260907 MATRICULA 26-27 Ejemplo Prueba, Alumno Uno 9000001';

await comprobar('el asunto nace con su hito', hitosDeSiguenAhi(CLAVE1), true);

/* El intento normal Y el único reintento de hitos-archivo.js fallan
   los dos (2 fallos seguidos). */
await hazQueFalleElHistorial(2);
await abrirFichaYArchivar(CLAVE1);

const avisoTras1 = await pagina.locator('#mensajes .mensaje.ambar').last().textContent().catch(() => '');
await comprobar('1. avisa en ámbar de que no se ha podido guardar el historial',
  Promise.resolve(String(avisoTras1 || '').indexOf('no he podido guardar el historial de hitos') !== -1), true);

await comprobar('1. aun así, los hitos NO se quedan huérfanos: han salido de hitos.json',
  hitosDeSiguenAhi(CLAVE1), false);

await comprobar('1. el asunto ha quedado archivado de todas formas', pagina.evaluate(async (clave) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Ejemplo Prueba, Alumno Uno 9000001');
  try { await ter.getDirectoryHandle(clave); return true; } catch (e) { return false; }
}, CLAVE1), true);

await comprobar('1. se han intentado exactamente dos escrituras (una y su reintento)',
  pagina.evaluate(() => window.__llamadasHistorial), 2);
await pagina.evaluate(() => window.__deshacerFalloHistorial());

/* ================= 2. el historial falla una vez y el reintento lo arregla ================= */

console.log('--- 2. un solo fallo: el reintento lo arregla ---');
await crearAsunto('dos', '2026-09-08');
const CLAVE2 = '260908 MATRICULA 26-27 Ejemplo Prueba, Alumno Dos 9000002';

/* El intento normal falla una vez; el reintento de hitos-archivo.js
   (la fila 178) ya no encuentra ningún fallo pendiente y sale bien. */
await hazQueFalleElHistorial(1);
await abrirFichaYArchivar(CLAVE2);

await comprobar('2. el historial se ha escrito de verdad, gracias al reintento', pagina.evaluate(async (clave) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Ejemplo Prueba, Alumno Dos 9000002');
  const asunto = await ter.getDirectoryHandle(clave);
  const h = await asunto.getFileHandle('HISTORIAL DE TRAMITACION.txt');
  const texto = await (await h.getFile()).text();
  return texto.indexOf('HISTORIAL DE TRAMITACI') !== -1 && texto.indexOf('Paso único') !== -1;
}, CLAVE2), true);

await comprobar('2. y también han salido de hitos.json', hitosDeSiguenAhi(CLAVE2), false);

await comprobar('2. se han intentado exactamente dos escrituras (una y su reintento)',
  pagina.evaluate(() => window.__llamadasHistorial), 2);
await pagina.evaluate(() => window.__deshacerFalloHistorial());

await comprobar('2. sin ningún aviso ámbar nuevo de historial', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#mensajes .mensaje.ambar'))
    .some((m) => m.textContent.indexOf('historial de hitos') !== -1)), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
