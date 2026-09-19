/* Prueba en navegador de verdad de la fila 45 (docs/ARCHIVAR-ATASCOS.md):
   los errores del navegador al archivar/reabrir salen en castellano, los
   ficheros temporales de sincronización no se cuentan ni se copian, y la
   aplicación reconoce cuando la carpeta ya estaba archivada o reabierta
   en vez de fallar con un NotFoundError en inglés.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/tablon-no-se-borra.mjs. Los seis escenarios son los de la
   sección 6 del documento. Los que llaman a App.cerrarAsunto o
   App.reabrirAsunto pasan siempre por el cuadro de confirmación (sale
   siempre, tanto si el atasco está como si no): se lanza la llamada sin
   esperarla, se acepta el cuadro desde Playwright, y solo entonces se
   espera el resultado. */
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

/* Lanza `window.App[metodo](window[claveA])` sin esperarlo, acepta el
   cuadro de confirmación que sale siempre, y devuelve el resultado (o
   el mensaje de error, si lanza). */
async function pasarPorElCuadro(metodo, claveA, claveResultado) {
  await pagina.evaluate(([metodo, claveA, claveResultado]) => {
    window[claveResultado] = window.App[metodo](window[claveA])
      .then((v) => ({ ok: true, valor: v }))
      .catch((e) => ({ ok: false, mensaje: e.message }));
  }, [metodo, claveA, claveResultado]);
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.click('#cuadro-aceptar');
  return pagina.evaluate((claveResultado) => window[claveResultado], claveResultado);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

console.log('--- 1) archivar: la carpeta ya no está en Abiertos pero sí en el archivo ---');
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567', { create: true });
  const asunto = await ter.getDirectoryHandle('260101 MATRICULA 26-27 Perez Gomez, Juan 1234567', { create: true });
  asunto._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido'));
  window.__a1 = {
    nombre: '260101 MATRICULA 26-27 Perez Gomez, Juan 1234567',
    ficha: { categoria: 'ALUMNADO', tercero: 'Perez Gomez, Juan 1234567' },
    leido: { categoria: 'ALUMNADO' }
  };
});
const r1 = await pasarPorElCuadro('cerrarAsunto', '__a1', '__r1');
await comprobar('1. no lanza ningún error', r1.ok, true);
await comprobar('1. avisa en verde de que ya estaba archivado',
  pagina.locator('.mensaje.bueno').filter({ hasText: 'Este asunto ya estaba archivado' }).count(), 1);
/* Fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): la ficha de un
   asunto archivado ya no se queda en asuntos.json, ni siquiera en este
   camino de "ya estaba archivado" (js/ficha-archivo.js la baja a
   _ficha.json en cuanto ve el estado "cerrado"). Se lee de ahí. */
await comprobar('1. ya no queda en asuntos.json', pagina.evaluate(() =>
  !!window.App.E.registro.asuntos['260101 MATRICULA 26-27 Perez Gomez, Juan 1234567']), false);
await comprobar('1. la ficha queda cerrada, con la categoría, el tercero y los ficheros contados',
  pagina.evaluate(async () => {
    const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
    const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567');
    const asunto = await ter.getDirectoryHandle('260101 MATRICULA 26-27 Perez Gomez, Juan 1234567');
    const f = await window.FichaArchivo.leer(asunto);
    return { estado: f.estado, categoria: f.categoria, tercero: f.tercero, ficheros: f.ficheros };
  }), { estado: 'cerrado', categoria: 'ALUMNADO', tercero: 'Perez Gomez, Juan 1234567', ficheros: 1 });

console.log('--- 2) archivar: la carpeta no está ni en Abiertos ni en el archivo ---');
await pagina.evaluate(() => {
  window.__a2 = {
    nombre: 'Asunto Fantasma',
    ficha: { categoria: 'ALUMNADO', tercero: 'Nadie De Nadie 0000000' },
    leido: { categoria: 'ALUMNADO' }
  };
});
const r2 = await pasarPorElCuadro('cerrarAsunto', '__a2', '__r2');
await comprobar('2. no lanza ningún error', r2.ok, true);
await comprobar('2. avisa en ámbar, en castellano, sin nada de NotFoundError ni en inglés',
  pagina.locator('.mensaje.ambar').filter({
    hasText: 'No encuentro la carpeta de este asunto ni en Asuntos abiertos ni en el archivo'
  }).count(), 1);
await comprobar('2. no se ha anotado nada de ese asunto',
  pagina.evaluate(() => !!window.App.E.registro.asuntos['Asunto Fantasma']), false);

console.log('--- 3) los ficheros temporales de sincronización no se cuentan ni se copian ---');
const r3 = await pagina.evaluate(async () => {
  const origen = await window.__disco.abiertos.getDirectoryHandle('_prueba3_origen', { create: true });
  origen._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido real'));
  origen._hijos.set('.tmp', window.__disco.fich('.tmp', 'basura de sincronización'));
  origen._hijos.set('.driveupload', window.__disco.fich('.driveupload', 'basura de sincronización'));
  origen._hijos.set('desktop.ini', window.__disco.fich('desktop.ini', 'basura de Windows'));
  const n = await window.Carpetas.trasladar(window.__disco.abiertos, '_prueba3_origen', window.__disco.abiertos, '_prueba3_destino');
  const destino = await window.__disco.abiertos.getDirectoryHandle('_prueba3_destino');
  const dentro = [];
  for await (const [nombre] of destino.entries()) dentro.push(nombre);
  return { n, dentro: dentro.sort(), origenSigue: window.__disco.abiertos._hijos.has('_prueba3_origen') };
});
await comprobar('3. solo cuenta el fichero real, no los temporales', r3.n, 1);
await comprobar('3. al destino solo ha llegado el fichero real', r3.dentro, ['papel.txt']);
await comprobar('3. el traslado ha terminado bien (el origen ha desaparecido)', r3.origenSigue, false);

console.log('--- 4) un fichero desaparece entre el recuento y la copia ---');
const r4 = await pagina.evaluate(async () => {
  const origen = await window.__disco.abiertos.getDirectoryHandle('_prueba4_origen', { create: true });
  const quedaBien = window.__disco.fich('quedaBien.txt', 'contenido bueno');
  const sePierde = window.__disco.fich('sePierde.txt', 'contenido perdido');
  sePierde.getFile = async () => { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; };
  origen._hijos.set('quedaBien.txt', quedaBien);
  origen._hijos.set('sePierde.txt', sePierde);
  var mensaje = null;
  try {
    await window.Carpetas.trasladar(window.__disco.abiertos, '_prueba4_origen', window.__disco.abiertos, '_prueba4_destino');
  } catch (e) { mensaje = e.message; }
  return {
    mensaje: mensaje,
    origenEntero: origen._hijos.has('quedaBien.txt') && origen._hijos.has('sePierde.txt'),
    destinoAMedias: window.__disco.abiertos._hijos.has('_prueba4_destino')
  };
});
await comprobar('4. el mensaje dice el nombre del fichero, en castellano',
  r4.mensaje.indexOf('No he podido copiar "sePierde.txt": ha desaparecido a mitad de la copia') === 0, true);
await comprobar('4. el origen sigue entero', r4.origenEntero, true);
await comprobar('4. el destino no se ha quedado a medias', r4.destinoAMedias, false);

console.log('--- 5) U.mensajeDeError traduce, y deja pasar tal cual un mensaje nuestro ---');
const r5 = await pagina.evaluate(() => {
  var deNavegador = new Error('A requested file or directory could not be found');
  deNavegador.name = 'NotFoundError';
  var nuestro = new Error('Ya hay una carpeta llamada "X" en el destino.');
  return { traducido: window.U.mensajeDeError(deNavegador), talCual: window.U.mensajeDeError(nuestro) };
});
await comprobar('5. NotFoundError sale en castellano', r5.traducido,
  'No encuentro la carpeta o el fichero. Puede que se haya movido o que lo esté sincronizando Dropbox en este momento.');
await comprobar('5. un error nuestro, ya en castellano, pasa tal cual', r5.talCual,
  'Ya hay una carpeta llamada "X" en el destino.');

console.log('--- 6) reabrir con un a.padre viejo que ya no vale ---');
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const terDeVerdad = await cat.getDirectoryHandle('Tercero De Verdad 1112223', { create: true });
  const asunto = await terDeVerdad.getDirectoryHandle('AsuntoSeis', { create: true });
  asunto._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido'));
  /* el manejador viejo: otra carpeta, que ya no tiene "AsuntoSeis" dentro */
  const padreViejo = await cat.getDirectoryHandle('Tercero De Verdad 1112223 (viejo)', { create: true });
  window.__a6 = {
    nombre: 'AsuntoSeis', padre: padreViejo,
    ficha: { categoria: 'ALUMNADO', tercero: 'Tercero De Verdad 1112223' }
  };
});
const r6 = await pasarPorElCuadro('reabrirAsunto', '__a6', '__r6');
await comprobar('6. no lanza ningún error: se ha recalculado el padre', r6.ok, true);
await comprobar('6. la carpeta ha llegado a Asuntos abiertos',
  pagina.evaluate(() => window.__disco.abiertos._hijos.has('AsuntoSeis')), true);
await comprobar('6. ha salido de donde estaba de verdad en el archivo', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Tercero De Verdad 1112223');
  return ter._hijos.has('AsuntoSeis');
}), false);
await comprobar('6. avisa en verde de que se ha reabierto',
  pagina.locator('.mensaje.bueno').filter({ hasText: 'Asunto reabierto' }).count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
