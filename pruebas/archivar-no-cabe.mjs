/* Prueba en navegador de verdad de la fila 265 de docs/COLA.md
   (docs/ARCHIVAR-MIDE-ANTES-LA-RUTA.md): al archivar se mide antes la
   ruta que tendrá cada documento en el ARCHIVO; si alguno no cabe, el
   cuadro «No cabe en el archivo» deja acortarlo ahí mismo, y si archivar
   falla el aviso dice el paso y el fichero. Nombres inventados.

   Cuentas (Dropbox en `C:\Users\Usuario\Dropbox` = 25 con la barra; ARCHIVO
   = `ADMINISTRACIÓN/REGISTROS/ARCHIVO` = 32; ALUMNADO = 8; el tercero = 25):
   la ruta de un documento es 94 + largo del asunto + largo del documento,
   y a un fichero se le suman 7 (el temporal de Chrome). Tope: 259. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => { try { localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\Usuario\\Dropbox'); } catch (e) { /* sin almacén */ } });
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async () => {
  await Carpetas.guardarJson(App.E.gestor, 'rutas.json', { abiertos: 'ABIERTOS', archivo: 'ADMINISTRACIÓN/REGISTROS/ARCHIVO' });
  await RutaCarpetas.cargarComun();
});

const TERCERO = 'Perez Gomez, Juan 1234567';

/* Crea en Asuntos abiertos un asunto de `largo` caracteres con los ficheros
   dados ({ nombre, sub }), y lo deja en window.__a. */
async function crearAsunto(clave, largo, ficheros) {
  await pagina.evaluate(([clave, largo, ficheros, tercero]) => {
    const nombre = ('260928 A26-' + clave + ' ADMISION Perez Gomez').padEnd(largo, 'x');
    const carpeta = window.__disco.abiertos;
    return carpeta.getDirectoryHandle(nombre, { create: true }).then(async (d) => {
      for (const f of ficheros) {
        let dir = d;
        if (f.sub) dir = await d.getDirectoryHandle(f.sub, { create: true });
        dir._hijos.set(f.nombre, window.__disco.fich(f.nombre, 'contenido de ' + f.nombre));
      }
      window.__a = { nombre, ficha: { categoria: 'ALUMNADO', tercero }, leido: { categoria: 'ALUMNADO' }, handle: d };
    });
  }, [clave, largo, ficheros, TERCERO]);
}
/* «260928 INFORME qqqq… D26-0000N.pdf» de `largo` caracteres: el número va al final, como en la aplicación. */
const nombreDoc = (largo, numero) => ('260928 INFORME ').padEnd(largo - (' D26-' + numero + '.pdf').length, 'q') + ' D26-' + numero + '.pdf';
/* El mismo nombre con `quitar` letras de relleno menos (sin extensión). */
const sinRelleno = (nombre, quitar) => nombre.replace(/q{1}(q*) (D26-\d+)\.pdf$/, (m, resto, num) => 'q' + resto.slice(0, resto.length - quitar) + ' ' + num);

async function lanzar() {
  await pagina.evaluate(() => { window.__r = App.cerrarAsunto(window.__a).then(() => 'fin').catch((e) => 'ERROR ' + e.message); });
  await pagina.waitForSelector('#capa:not(.oculto)');
}
const titulo = () => pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent);
const resultado = () => pagina.evaluate(() => window.__r);
const enAbiertos = () => pagina.evaluate(async () => {
  const n = []; for await (const p of window.__disco.abiertos.entries()) if (p[0] === window.__a.nombre) n.push(p[0]);
  return n.length;
});
const ficherosEnArchivo = (sub) => pagina.evaluate(async (sub) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567');
  let d = await ter.getDirectoryHandle(window.__a.nombre);
  if (sub) d = await d.getDirectoryHandle(sub);
  const n = []; for await (const p of d.entries()) if (p[1].kind === 'file') n.push(p[0]);
  return n.sort();
}, sub || '');
const avisos = (clase) => pagina.evaluate((c) => Array.from(document.querySelectorAll('.mensaje.' + c)).map(e => e.textContent), clase);
const limpiarAvisos = () => pagina.evaluate(() => document.querySelectorAll('.mensaje').forEach(e => e.remove()));

console.log('--- 1) todo cabe: el cuadro de siempre ---');
await crearAsunto('0001', 60, [{ nombre: '260928 INFORME D26-00001.pdf' }]);
await lanzar();
await comprobar('1. sale «Archivar el asunto»', titulo(), 'Archivar el asunto');
await pagina.click('#cuadro-aceptar');
await comprobar('1. se archiva', resultado(), 'fin');
await comprobar('1. y el fichero está en el archivo', ficherosEnArchivo().then(l => l.filter(x => /^2609/.test(x))), ['260928 INFORME D26-00001.pdf']);

console.log('--- 2) un documento no cabe ---');
const largo90 = nombreDoc(90, '00002');
await crearAsunto('0002', 86, [{ nombre: largo90 }, { nombre: '260928 breve D26-00002.pdf' }]);
await lanzar();
await comprobar('2. sale «No cabe en el archivo»', titulo(), 'No cabe en el archivo');
await comprobar('2. con una sola línea', pagina.locator('.ac-fila').count(), 1);
await comprobar('2. dice «Sobran 18»', pagina.locator('.ac-estado').first().textContent(), 'Sobran 18');
await comprobar('2. «Acortar y archivar» apagado', pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-aceptar').disabled]), ['Acortar y archivar', true]);
await comprobar('2. la carpeta sigue entera en Asuntos abiertos', enAbiertos(), 1);
await comprobar('2. el cuadro es ancho', pagina.evaluate(() => document.querySelector('#capa .cuadro').classList.contains('cuadro-ancho')), true);

console.log('--- 3) acortar hasta que cabe ---');
const stem = largo90.replace(/\.pdf$/, '');
await pagina.fill('.ac-caja', sinRelleno(largo90, 17));
await comprobar('3. con 17 letras menos: «Sobran 1»', pagina.locator('.ac-estado').first().textContent(), 'Sobran 1');
await pagina.fill('.ac-caja', sinRelleno(largo90, 18));
await comprobar('3. con 18 menos: «Cabe» en verde', pagina.evaluate(() => { const e = document.querySelector('.ac-estado'); return [e.textContent, e.classList.contains('ac-cabe')]; }), ['Cabe', true]);
await comprobar('3. «Acortar y archivar» encendido', pagina.evaluate(() => document.getElementById('cuadro-aceptar').disabled), false);

console.log('--- 4) un nombre que ya tiene otro documento ---');
await pagina.fill('.ac-caja', '260928 breve D26-00002');
await comprobar('4. sale el motivo en rojo', pagina.locator('.ac-motivo').first().textContent(), 'Ya hay otro documento con ese nombre en la carpeta.');
await comprobar('4. y el botón se apaga', pagina.evaluate(() => document.getElementById('cuadro-aceptar').disabled), true);
await pagina.fill('.ac-caja', '');
await comprobar('4. vacío: «El nombre no puede quedar vacío.»', pagina.locator('.ac-motivo').first().textContent(), 'El nombre no puede quedar vacío.');
await pagina.fill('.ac-caja', 'a/b');
await comprobar('4. con una barra: no vale', pagina.evaluate(() => document.getElementById('cuadro-aceptar').disabled), true);
await pagina.fill('.ac-caja', stem.replace(' D26-00002', ' sin numero').slice(0, 60));
await comprobar('4. sin el número D26-…: tiene que conservarlo', pagina.locator('.ac-motivo').first().textContent(), 'Tiene que conservar el número D26-00002.');

console.log('--- 9) cancelar no toca nada ---');
await pagina.click('#cuadro-cancelar');
await comprobar('9. termina sin error', resultado(), 'fin');
await comprobar('9. la carpeta sigue en Asuntos abiertos con su nombre largo', pagina.evaluate(async () => {
  const d = await window.__disco.abiertos.getDirectoryHandle(window.__a.nombre);
  const n = []; for await (const p of d.entries()) n.push(p[0]); return n.sort();
}), [largo90, '260928 breve D26-00002.pdf'].sort());

console.log('--- 5) y 6) acortar y archivar, con el documento pendiente de registro y en un hito ---');
await pagina.evaluate(async () => {
  const nombre = window.__a.nombre;
  const doc = (await (async () => { const n = []; for await (const p of (await window.__disco.abiertos.getDirectoryHandle(nombre)).entries()) n.push(p[0]); return n; })()).filter(x => x.length > 80)[0];
  await App.anotar(nombre, { estado: 'abierto', tipo: 'ADMISION', categoria: 'ALUMNADO', tercero: 'Perez Gomez, Juan 1234567', pendientesRegistro: [doc] });
  await Hitos.cambiar((d) => {
    d.porAsunto[nombre] = { creados: '', hitos: [{ id: 'h1', titulo: 'Paso de prueba', documentos: [doc],
      requisitos: [{ id: 'r1', texto: 'Papel', clase: 'documento', hecho: true, documento: doc }] }] };
    return d;
  });
  window.__a.ficha = App.E.registro.asuntos[nombre];
  window.__doc = doc;
});
await lanzar();
const nuevoStem = sinRelleno(largo90, 20);
await pagina.fill('.ac-caja', nuevoStem);
await pagina.click('#cuadro-aceptar');
await comprobar('5. termina sin error', resultado(), 'fin');
await comprobar('5. el asunto ya no está en Asuntos abiertos', enAbiertos(), 0);
const losPdf = (l) => l.filter(x => /\.pdf$/.test(x) && !/^000 /.test(x));
await comprobar('5. en el archivo, el documento tiene su nombre corto y la misma extensión',
  ficherosEnArchivo().then(losPdf), ['260928 breve D26-00002.pdf', nuevoStem + '.pdf'].sort());
await comprobar('5. ningún aviso rojo', avisos('malo'), []);
await comprobar('6. sigue pendiente de registro, con el nombre nuevo', pagina.evaluate(async (nuevo) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567');
  const f = await FichaArchivo.leer(await ter.getDirectoryHandle(window.__a.nombre));
  return (f.pendientesRegistro || []).map(p => p.nombre || p);
}, nuevoStem + '.pdf'), [nuevoStem + '.pdf']);
await comprobar('6. el cambio de nombre pone al día también los hitos (documento y casilla)', pagina.evaluate(async () => {
  const nombre = 'Asunto con hito';
  const d = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  d._hijos.set('uno largo.pdf', window.__disco.fich('uno largo.pdf', 'x'));
  await Hitos.cambiar((datos) => {
    datos.porAsunto[nombre] = { creados: '', hitos: [{ id: 'h1', titulo: 'Paso de prueba', documentos: ['uno largo.pdf'],
      requisitos: [{ id: 'r1', texto: 'Papel', clase: 'documento', hecho: true, documento: 'uno largo.pdf' }] }] };
    return datos;
  });
  await DocumentoRenombrar.renombrar({ nombre, ficha: {} }, d, 'uno largo.pdf', 'uno.pdf');
  const h = (await Hitos.leer()).porAsunto[nombre].hitos[0];
  const n = []; for await (const p of d.entries()) n.push(p[0]);
  return [n, h.documentos, h.requisitos[0].documento];
}), [['uno.pdf'], ['uno.pdf'], 'uno.pdf']);

console.log('--- 7) un documento largo dentro de «Versiones previas» ---');
const largoPrevio = '260928 PREVIO '.padEnd(90 - 4, 'q') + '.pdf';
await crearAsunto('0003', 86, [{ nombre: largoPrevio, sub: 'Versiones previas' }, { nombre: '260928 breve.pdf' }]);
await lanzar();
await comprobar('7. sale con «Versiones previas» delante', pagina.locator('.ac-sub').first().textContent(), 'Versiones previas /');
const stemPrevio = largoPrevio.replace(/\.pdf$/, '');
await pagina.fill('.ac-caja', stemPrevio.slice(0, stemPrevio.length - 40));
await pagina.click('#cuadro-aceptar');
await comprobar('7. termina sin error', resultado(), 'fin');
await comprobar('7. cambia de nombre dentro de su subcarpeta', ficherosEnArchivo('Versiones previas'), [stemPrevio.slice(0, stemPrevio.length - 40) + '.pdf']);

console.log('--- 8) la carpeta del asunto ya no deja sitio ---');
await crearAsunto('0004', 140, [{ nombre: '260928 breve.pdf' }]);
await lanzar();
await comprobar('8. el cuadro no tiene cajas', pagina.locator('.ac-fila').count(), 0);
await comprobar('8. dice que la carpeta es demasiado larga, con cuántos le sobran', pagina.evaluate(() => document.getElementById('cuadro-cuerpo').textContent.indexOf(
  'El nombre de la carpeta de este asunto es demasiado largo para el archivo: le sobran 12 caracteres. Cámbialo y vuelve a archivar. No se ha movido nada.') >= 0), true);
await comprobar('8. el botón es «Cambiar el asunto»', pagina.evaluate(() => document.getElementById('cuadro-aceptar').textContent), 'Cambiar el asunto');
await pagina.evaluate(() => { window.__cambiado = ''; App.editarAsunto = async (a) => { window.__cambiado = a.nombre; }; });
await pagina.click('#cuadro-aceptar');
await comprobar('8. lleva a «Cambiar el asunto» con este asunto', pagina.evaluate(() => window.__cambiado === window.__a.nombre), true);
await comprobar('8. y no se ha movido nada', enAbiertos(), 1);

console.log('--- 10) sin la ruta del archivo apuntada ---');
await pagina.evaluate(async () => {
  await Carpetas.guardarJson(App.E.gestor, 'rutas.json', { abiertos: 'ABIERTOS', archivo: '' });
  await RutaCarpetas.cargarComun();
});
await crearAsunto('0005', 86, [{ nombre: largo90 }, { nombre: '260928 breve.pdf' }]);
await lanzar();
await comprobar('10. sale el cuadro de siempre, sin medir', titulo(), 'Archivar el asunto');
await pagina.click('#cuadro-cancelar');
await resultado();
await pagina.evaluate(async () => {
  await Carpetas.guardarJson(App.E.gestor, 'rutas.json', { abiertos: 'ABIERTOS', archivo: 'ADMINISTRACIÓN/REGISTROS/ARCHIVO' });
  await RutaCarpetas.cargarComun();
});

console.log('--- 11) y 12) si archivar falla, el aviso dice el paso y el fichero ---');
await crearAsunto('0006', 60, [{ nombre: 'X.pdf' }, { nombre: 'Y.pdf' }]);
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567', { create: true });
  const original = ter.getDirectoryHandle.bind(ter);
  ter.getDirectoryHandle = async (n, o) => {
    const d = await original(n, o);
    if (n === window.__a.nombre && o && o.create && !d.__tocado) {
      d.__tocado = true;
      const fh = d.getFileHandle.bind(d);
      d.getFileHandle = async (m, p) => {
        if (m === 'X.pdf' && p && p.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
        return fh(m, p);
      };
    }
    return d;
  };
  window.__terOriginal = [ter, original];
});
await limpiarAvisos();
await lanzar();
await pagina.click('#cuadro-aceptar');
await comprobar('11. termina', resultado(), 'fin');
await comprobar('11. el aviso rojo dice el paso, el fichero y la causa, y que no se ha movido nada', avisos('malo'),
  ['No se ha podido archivar: ha fallado al copiar «X.pdf». Windows no deja crearlo ahí; suele ser porque la ruta sale demasiado larga o porque Dropbox está sincronizando esa carpeta. No se ha movido nada: la carpeta sigue en Asuntos abiertos.']);
await comprobar('11. la carpeta sigue entera en Asuntos abiertos', enAbiertos(), 1);
await comprobar('11. y no ha quedado copia a medias en el archivo', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567');
  return ter._hijos.has(window.__a.nombre);
}), false);

await pagina.evaluate(() => { const [ter, original] = window.__terOriginal; ter.getDirectoryHandle = original; });
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const original = cat.getDirectoryHandle.bind(cat);
  cat.getDirectoryHandle = async (n, o) => {
    if (n === 'Nuevo, Tercero 7654321' && o && o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
    return original(n, o);
  };
  window.__catOriginal = [cat, original];
  window.__a.ficha = { categoria: 'ALUMNADO', tercero: 'Nuevo, Tercero 7654321' };
});
await limpiarAvisos();
await lanzar();
await pagina.click('#cuadro-aceptar');
await comprobar('12. el aviso dice «ha fallado al preparar la carpeta del tercero en el archivo»', avisos('malo').then(l => l.length === 1 && l[0].indexOf('ha fallado al preparar la carpeta del tercero en el archivo') >= 0 && l[0].indexOf('No se ha movido nada') >= 0), true);
await pagina.evaluate(() => { const [cat, original] = window.__catOriginal; cat.getDirectoryHandle = original; });

console.log('--- reabrir dice también el paso y el fichero ---');
await pagina.evaluate(async () => {
  const nombre = 'Asunto para reabrir';
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Perez Gomez, Juan 1234567');
  const d = await ter.getDirectoryHandle(nombre, { create: true });
  d._hijos.set('X.pdf', window.__disco.fich('X.pdf', 'contenido'));
  const fh = window.__disco.abiertos.getDirectoryHandle.bind(window.__disco.abiertos);
  window.__abOriginal = fh;
  window.__disco.abiertos.getDirectoryHandle = async (n, o) => {
    const dd = await fh(n, o);
    if (n === nombre && o && o.create && !dd.__tocado) {
      dd.__tocado = true;
      const gf = dd.getFileHandle.bind(dd);
      dd.getFileHandle = async (m, p) => {
        if (m === 'X.pdf' && p && p.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
        return gf(m, p);
      };
    }
    return dd;
  };
  window.__b = { nombre, ficha: { categoria: 'ALUMNADO', tercero: 'Perez Gomez, Juan 1234567', estado: 'cerrado' }, padre: ter };
});
await limpiarAvisos();
await pagina.evaluate(() => { window.__rb = App.reabrirAsunto(window.__b).then(() => 'fin'); });
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await comprobar('reabrir: termina', pagina.evaluate(() => window.__rb), 'fin');
await comprobar('reabrir: dice el paso, el fichero y que la carpeta sigue en el archivo', avisos('malo'),
  ['No se ha podido reabrir: ha fallado al copiar «X.pdf». Windows no deja crearlo ahí; suele ser porque la ruta sale demasiado larga o porque Dropbox está sincronizando esa carpeta. No se ha movido nada: la carpeta sigue en el archivo.']);
await pagina.evaluate(() => { window.__disco.abiertos.getDirectoryHandle = window.__abOriginal; });

console.log('--- 13) archivar varios de golpe ---');
await limpiarAvisos();
const lote = await pagina.evaluate(async (tercero) => {
  const crear = async (clave, largo, ficheros) => {
    const nombre = ('260928 A26-' + clave + ' ADMISION Perez Gomez').padEnd(largo, 'x');
    const d = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    ficheros.forEach(f => d._hijos.set(f, window.__disco.fich(f, 'contenido')));
    return { nombre, ficha: { categoria: 'ALUMNADO', tercero }, leido: { categoria: 'ALUMNADO' }, handle: d };
  };
  const asuntos = [await crear('0101', 60, ['a.pdf']), await crear('0102', 86, ['260928 INFORME '.padEnd(86, 'q') + '.pdf']), await crear('0103', 60, ['b.pdf'])];
  ArchivarCabe.empezarLote();
  for (const a of asuntos) {
    App.E.archivarSinPreguntar = true;
    try { await App.cerrarAsunto(a); } finally { App.E.archivarSinPreguntar = false; }
  }
  const quedan = [];
  for await (const p of window.__disco.abiertos.entries()) if (/A26-010[123]/.test(p[0])) quedan.push(p[0].slice(7, 15));
  ArchivarCabe.avisarLote();
  return quedan;
}, TERCERO);
await comprobar('13. se archivan dos y el que no cabe se queda en Asuntos abiertos', lote, ['A26-0102']);
await comprobar('13. sale un solo aviso ámbar', avisos('ambar'),
  ['1 asunto(s) no se han archivado porque algún documento no cabe en el archivo: archívalos uno a uno desde su ⋮.']);
await comprobar('13. y ningún cuadro se queda abierto', pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')), true);

console.log('--- 14) ningún fichero pasa de 600 líneas ---');
await comprobar('14. los de esta fila', pagina.evaluate(async () => {
  const r = {};
  for (const f of ['js/carpetas.js', 'js/archivar-cabe.js', 'js/documento-renombrar.js', 'js/asuntos-archivar.js', 'js/nombres-topes.js']) {
    r[f] = (await (await fetch(f)).text()).split('\n').length <= 601;
  }
  return r;
}), { 'js/carpetas.js': true, 'js/archivar-cabe.js': true, 'js/documento-renombrar.js': true, 'js/asuntos-archivar.js': true, 'js/nombres-topes.js': true });

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
