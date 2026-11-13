/* Prueba en navegador de verdad de la fila 648 (docs/648-CARPETAS-ARCHIVADAS-MAS-CORTAS.md): la carpeta de un
   asunto con número pierde el nombre de la persona al archivar y lo recupera al reabrir; los asuntos sin número no
   cambian; y el botón de Herramientas «Acortar las carpetas del archivo» acorta las que ya estaban archivadas.
   Disco de mentira de pruebas/navegador.mjs.

   1. Las funciones de nombres (quitar y poner la persona, leer el nombre corto).
   2. Archivar con número: el cuadro enseña cómo se llamará; en el archivo queda sin la persona, con sus documentos y
      su ficha; el índice del ARCHIVO sigue dando la persona.
   3. Archivar sin número: nombre entero.
   4. Reabrir: vuelve a Asuntos abiertos con la persona al final, con su ficha.
   5. El botón de Herramientas: cuenta, acorta, repetir no hace nada, una que falla queda en la lista.
   6. «Solo consulta»: el botón lo dice y no toca nada. */
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

const T1 = 'Cordero Navas, Lucia 4010001';
const L1 = '260907 A26-0401 MATRICULA ' + T1;
const C1 = '260907 A26-0401 MATRICULA';
const T2 = 'Sin Numero, Ana 4020002';
const L2 = '260907 MATRICULA ' + T2;

console.log('--- 1. los nombres ---');
await comprobar('1. se quita la persona del final', pagina.evaluate(([l, t]) => window.Nombres.nombreEnArchivo(l, [t]), [L1, T1]), C1);
await comprobar('1. con la persona en forma larga o corta de la ficha también', pagina.evaluate(() => window.Nombres.nombreEnArchivo(
  '260907 A26-0401 MATRICULA Cordero Navas, Lucía María Josefa 4010001', ['Cordero Navas, Lucía María Josefa 4010001']).slice(-9)), 'MATRICULA');
await comprobar('1. sin número no se toca', pagina.evaluate(([l, t]) => window.Nombres.nombreEnArchivo(l, [t]), [L2, T2]), L2);
await comprobar('1. si ya es corto, tampoco', pagina.evaluate(([c, t]) => window.Nombres.nombreEnArchivo(c, [t]), [C1, T1]), C1);
await comprobar('1. se vuelve a poner la persona', pagina.evaluate(([c, t]) => window.Nombres.nombreAbierto(c, t), [C1, T1]), L1);
await comprobar('1. si ya la lleva, se queda igual', pagina.evaluate(([l, t]) => window.Nombres.nombreAbierto(l, t), [L1, T1]), L1);
await comprobar('1. el nombre corto se lee: tipo reconocido y la persona que se le pase',
  pagina.evaluate(([c, t]) => { const l = window.Nombres.leer(c, window.App.E.tipos, t); return [l.tipo, l.numero, l.resto, l.reconocido]; }, [C1, T1]),
  ['MATRICULA', 'A26-0401', T1, true]);
await comprobar('1. y sin pasarle la persona, el resto queda vacío',
  pagina.evaluate((c) => window.Nombres.leer(c, window.App.E.tipos).resto, C1), '');

await pagina.evaluate(async ([nombres, terceros]) => {
  for (let i = 0; i < nombres.length; i++) {
    const h = await window.__disco.abiertos.getDirectoryHandle(nombres[i], { create: true });
    h._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido ' + i));
    const actual = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json') || { asuntos: {} };
    actual.asuntos[nombres[i]] = { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: terceros[i], estado: 'abierto', notas: [] };
    await window.Carpetas.guardarJson(window.App.E.gestor, 'asuntos.json', actual);
  }
  await window.App.cargarRegistro();
  await window.App.verAbiertos();
  window.__avisos = [];
  const aviso = window.U.aviso;
  window.U.aviso = function (t, ...r) { window.__avisos.push(String(t)); return aviso.call(this, t, ...r); };
}, [[L1, L2], [T1, T2]]);

const enArchivo = (t) => pagina.evaluate(async (ter) => {
  try {
    const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
    const d = await cat.getDirectoryHandle(ter);
    return [...d._hijos.keys()].sort();
  } catch (e) { return null; }
}, t);
const enAbiertos = () => pagina.evaluate(() => [...window.__disco.abiertos._hijos.keys()].filter((n) => n[0] !== '_').sort());
const archivar = async (nombre) => {
  await pagina.evaluate((n) => {
    const a = window.App.E.listaAbiertos.find((x) => x.nombre === n);
    window.__fin = 'esperando';
    window.ArchivarFondo.archivar(a).then(() => { window.__fin = 'liberado'; }, (e) => { window.__fin = 'error:' + e.message; });
  }, nombre);
  await pagina.waitForSelector('#capa:not(.oculto)');
};
const esperarArchivado = async () => {
  await pagina.waitForFunction(() => window.__fin === 'liberado', null, { timeout: 8000 });
  await pagina.waitForSelector('#archivando-fondo', { state: 'detached', timeout: 20000 });
};

console.log('--- 2. archivar con número ---');
await archivar(L1);
const cuadro = await pagina.locator('#cuadro-cuerpo').innerText();
await comprobar('2. el cuadro dice adónde va', cuadro.indexOf('ALUMNADO / ' + T1) !== -1, true);
await comprobar('2. y cómo se llamará allí, sin la persona', cuadro.indexOf('Allí se llamará:') !== -1 && cuadro.split('Allí se llamará:')[1].indexOf(C1) !== -1
  && cuadro.split('Allí se llamará:')[1].indexOf('Cordero') === -1, true);
await pagina.click('#cuadro-aceptar');
await esperarArchivado();
await comprobar('2. en el archivo la carpeta no lleva a la persona', enArchivo(T1), [C1]);
await comprobar('2. ya no está en Asuntos abiertos', enAbiertos(), [L2]);
await comprobar('2. sus documentos y su ficha han viajado con ella', pagina.evaluate(async ([t, c]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const d = await (await cat.getDirectoryHandle(t)).getDirectoryHandle(c);
  return [...d._hijos.keys()].filter((n) => n === 'papel.txt' || n === '_ficha.json').sort();
}, [T1, C1]), ['_ficha.json', 'papel.txt']);
await comprobar('2. el aviso verde de siempre', pagina.evaluate(() => window.__avisos.filter((t) => t === 'Asunto archivado.').length), 1);
await comprobar('2. el índice del ARCHIVO lo da con su persona', pagina.evaluate(async ([c, t]) => {
  await window.App.reconstruirIndiceArchivo();
  const r = await window.IndiceArchivo.leerDisco({ todos: true });
  const e = r.datos.asuntos.find((x) => x.nombre === c);
  return e ? [e.tercero, e.categoria, e.tipo, e.numero] : null;
}, [C1, T1]), [T1, 'ALUMNADO', 'MATRICULA', 'A26-0401']);

console.log('--- 3. archivar sin número ---');
await archivar(L2);
await comprobar('3. el cuadro no enseña nombre nuevo', pagina.locator('#cuadro-cuerpo').innerText().then((t) => t.indexOf('Allí se llamará') === -1), true);
await pagina.click('#cuadro-aceptar');
await esperarArchivado();
await comprobar('3. conserva su nombre entero', enArchivo(T2), [L2]);

console.log('--- 4. reabrir ---');
await pagina.evaluate(async () => { await window.App.verArchivo(); });
await pagina.waitForFunction(() => window.App.E.listaArchivo && window.App.E.listaArchivo.length >= 2);
await pagina.evaluate(async (c) => {
  const a = window.App.E.listaArchivo.find((x) => x.nombre === c);
  window.__fin = 'esperando';
  /* Como lo pide el botón de la tarjeta del Archivo: tal cual sale de la lista del Archivo (sin la carpeta de la persona a mano). */
  window.App.reabrirAsunto(Object.assign({}, a)).then(() => { window.__fin = 'liberado'; });
}, C1);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__fin === 'liberado', null, { timeout: 8000 });
await comprobar('4. vuelve a Asuntos abiertos con la persona al final', enAbiertos(), [L1]);
await comprobar('4. ya no está en el archivo', enArchivo(T1), []);
await comprobar('4. su ficha está en el registro con el nombre entero', pagina.evaluate(([l, c]) => {
  const f = window.App.E.registro.asuntos[l];
  return [!!f && f.estado === 'abierto', !!window.App.E.registro.asuntos[c]];
}, [L1, C1]), [true, false]);
await comprobar('4. y el documento sigue dentro', pagina.evaluate(async (l) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(l);
  return d._hijos.has('papel.txt') && !d._hijos.has('_ficha.json');
}, L1), true);
await comprobar('4. sin avisos rojos', pagina.locator('.mensaje.malo').count(), 0);

console.log('--- 5. el botón de Herramientas ---');
const LARGOS = [
  ['ALUMNADO', 'Uno Largo, Ana 5000001', '260101 A26-0501 MATRICULA Uno Largo, Ana 5000001'],
  ['ALUMNADO', 'Dos Largo, Eva 5000002', '260102 A26-0502 MATRICULA Dos Largo, Eva 5000002'],
  ['ALUMNADO', 'Tres Largo, Luis 5000003', '260103 A26-0503 MATRICULA Tres Largo, Luis 5000003'],
  ['ALUMNADO', 'Cuatro Largo, Pia 5000004', '260104 MATRICULA Cuatro Largo, Pia 5000004'],   /* sin número: no se toca */
  ['ALUMNADO', 'Cinco Largo, Rai 5000005', '260105 A26-0505 MATRICULA']                     /* ya corta */
];
await pagina.evaluate(async (lista) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  for (const [, t, n] of lista) {
    const ter = await cat.getDirectoryHandle(t, { create: true });
    const h = await ter.getDirectoryHandle(n, { create: true });
    h._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'x ' + n));
  }
}, LARGOS);
await pagina.evaluate(() => window.App.ir('herramientas'));
await pagina.waitForSelector('#bloque-acortar-archivo');
await pagina.evaluate(() => { document.getElementById('bloque-acortar-archivo').open = true; });
await comprobar('5. el bloque tiene su botón', pagina.locator('#acortar-archivo-boton').innerText(), 'Acortar las carpetas del archivo');

/* «Solo consulta»: lo dice y no toca nada. */
await pagina.evaluate(() => { window.__activoAntes = window.SoloConsulta.activo; window.SoloConsulta.activo = () => true; window.__avisos.length = 0; });
await pagina.click('#acortar-archivo-boton');
await pagina.waitForTimeout(300);
await comprobar('6. en «solo consulta» lo dice', pagina.evaluate(() => window.__avisos.some((t) => t.indexOf('solo consulta') !== -1)), true);
await comprobar('6. y no sale ningún cuadro', pagina.locator('#capa:not(.oculto)').count(), 0);
await comprobar('6. ni cambia nada', enArchivo('Uno Largo, Ana 5000001'), ['260101 A26-0501 MATRICULA Uno Largo, Ana 5000001']);
await pagina.evaluate(() => { window.SoloConsulta.activo = window.__activoAntes; });

/* Una falla: se queda como estaba y sale en la lista con su persona. */
await pagina.evaluate(() => {
  const r = window.Carpetas.renombrar;
  window.Carpetas.renombrar = async function (padre, nombre, nuevo) {
    if (nombre.indexOf('A26-0502') !== -1) { const e = new Error('Dropbox tiene un fichero abierto'); e.name = 'InvalidStateError'; throw e; }
    return r.apply(this, arguments);
  };
  window.__renombrarReal = r;
});
await pagina.click('#acortar-archivo-boton');
await pagina.waitForSelector('#capa:not(.oculto)');
const aviso = await pagina.locator('#cuadro-cuerpo').innerText();
await comprobar('5. el cuadro cuenta cuántas son (las 3 con número y persona)', aviso.indexOf('3 carpetas archivadas') !== -1, true);
await comprobar('5. dice que la otra persona tiene que estar fuera de la app', aviso.indexOf('fuera de la aplicación') !== -1, true);
await comprobar('5. y que Drive tardará un rato', aviso.indexOf('Google Drive tardará') !== -1, true);
await comprobar('5. los botones son «Acortar las 3 carpetas» y «Cancelar»', pagina.evaluate(() => [
  document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]), ['Acortar las 3 carpetas', 'Cancelar']);
await pagina.click('#cuadro-cancelar');
await comprobar('5. cancelar no cambia nada', enArchivo('Uno Largo, Ana 5000001'), ['260101 A26-0501 MATRICULA Uno Largo, Ana 5000001']);
await pagina.click('#acortar-archivo-boton');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('cuadro-titulo').textContent === 'Acortar las carpetas del archivo'
  && document.getElementById('cuadro-cuerpo').innerText.indexOf('Se han acortado') !== -1, null, { timeout: 15000 });
const resultado = await pagina.locator('#cuadro-cuerpo').innerText();
await comprobar('5. dice cuántas ha cambiado', resultado.indexOf('Se han acortado 2 carpetas') !== -1, true);
await comprobar('5. y cuál no ha podido, con su persona y el motivo', resultado.indexOf('Dos Largo, Eva 5000002') !== -1 && resultado.indexOf('260102 A26-0502') !== -1, true);
await pagina.click('#cuadro-aceptar');
await comprobar('5. las que ha podido, cortas', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const sal = {};
  for (const t of ['Uno Largo, Ana 5000001', 'Dos Largo, Eva 5000002', 'Tres Largo, Luis 5000003', 'Cuatro Largo, Pia 5000004', 'Cinco Largo, Rai 5000005']) {
    sal[t] = [...(await cat.getDirectoryHandle(t))._hijos.keys()];
  }
  return sal;
}), {
  'Uno Largo, Ana 5000001': ['260101 A26-0501 MATRICULA'],
  'Dos Largo, Eva 5000002': ['260102 A26-0502 MATRICULA Dos Largo, Eva 5000002'],
  'Tres Largo, Luis 5000003': ['260103 A26-0503 MATRICULA'],
  'Cuatro Largo, Pia 5000004': ['260104 MATRICULA Cuatro Largo, Pia 5000004'],
  'Cinco Largo, Rai 5000005': ['260105 A26-0505 MATRICULA']
});
await comprobar('5. los documentos de dentro no cambian de nombre', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const d = await (await cat.getDirectoryHandle('Uno Largo, Ana 5000001')).getDirectoryHandle('260101 A26-0501 MATRICULA');
  return [...d._hijos.keys()];
}), ['papel.txt']);
await comprobar('5. el índice del ARCHIVO sigue dando a la persona', pagina.evaluate(async () => {
  const r = await window.IndiceArchivo.leerDisco({ todos: true });
  const e = r.datos.asuntos.find((x) => x.nombre === '260101 A26-0501 MATRICULA');
  return e ? e.tercero : null;
}), 'Uno Largo, Ana 5000001');

/* Se vuelve a pulsar: sigue con las que faltan. */
await pagina.evaluate(() => { window.Carpetas.renombrar = window.__renombrarReal; });
await pagina.click('#acortar-archivo-boton');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('5. al repetir, cuenta solo la que faltaba', pagina.locator('#cuadro-cuerpo').innerText().then((t) => t.indexOf('1 carpeta archivada') !== -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('cuadro-cuerpo').innerText.indexOf('Se ha acortado 1 carpeta') !== -1, null, { timeout: 15000 });
await pagina.click('#cuadro-aceptar');
await pagina.click('#acortar-archivo-boton');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('5. con todas ya cortas, dice que no queda ninguna', pagina.locator('#cuadro-cuerpo').innerText().then((t) => t.indexOf('No queda ninguna carpeta por acortar.') !== -1), true);
await comprobar('5. y solo tiene el botón de «Entendido»', pagina.evaluate(() => [
  document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').classList.contains('oculto')]), ['Entendido', true]);
await pagina.click('#cuadro-aceptar');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos.' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
