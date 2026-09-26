/* Prueba en navegador de verdad de la fila 44
   (docs/BUSCADOR-ARCHIVO-INDICE.md): el índice guardado del ARCHIVO y la
   búsqueda por palabras sueltas.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/archivar-atascos.mjs. Los nueve escenarios son los de la
   sección 9 del documento. */
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
   el mensaje de error, si lanza). Igual que en pruebas/archivar-atascos.mjs. */
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

async function explicaArchivo() {
  return pagina.evaluate(() => document.getElementById('explica-archivo').textContent);
}

async function nombresIndiceDeDisco() {
  return pagina.evaluate(async () => {
    var d = await window.Carpetas.leerJson(window.App.E.gestor, window.IndiceArchivo.FICHERO);
    return d ? d.asuntos.map(function (a) { return a.nombre; }).sort() : null;
  });
}

/* El texto entero de cada tarjeta (no solo el nombre): las marcas de
   tipo y de estado van pegadas delante, sin separador, dentro del
   mismo bloque `.tarjeta-nombre`. */
async function buscarEnArchivo(texto) {
  await pagina.fill('#buscar-archivo', texto);
  await pagina.waitForTimeout(50);
  return pagina.$$eval('#lista-archivo .tarjeta-asunto', (els) => els.map((e) => e.textContent));
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

/* ---------- el archivo de mentira: dos categorías, varios asuntos ---------- */
const NOMBRE_1 = '250915 MATRICULA 25-26 Perez Perez, Ana 1234567';
const NOMBRE_2 = '250801 CERTIFICADO 25-26 Otro Tercero 7654321';
const NOMBRE_3 = '250601 CONTRATO 25-26 Ruiz Soto, Pedro 1112';
const NOMBRE_SUELTO = '250501 BECA 25-26 Suelto Directo';

await pagina.evaluate(async ([n1, n2, n3, n4]) => {
  async function crearAsunto(categoria, tercero, nombreAsunto, documentos) {
    var cat = await window.__disco.archivo.getDirectoryHandle(categoria, { create: true });
    var padre = tercero ? await cat.getDirectoryHandle(tercero, { create: true }) : cat;
    var asunto = await padre.getDirectoryHandle(nombreAsunto, { create: true });
    (documentos || []).forEach(function (d) { asunto._hijos.set(d, window.__disco.fich(d, 'contenido')); });
    return asunto;
  }
  window.__crearAsunto = crearAsunto;

  await crearAsunto('ALUMNADO', 'Perez Perez, Ana 1234567', n1,
    ['250915 26EM1234 SOLICITUD.pdf', '250915 INFORME CURSO 2025.pdf']);
  var asuntoN2 = await crearAsunto('ALUMNADO', 'Otro Tercero 7654321', n2, ['250801 CERTIFICADO.pdf']);
  await crearAsunto('PERSONAL', 'Ruiz Soto, Pedro 1112', n3, ['250601 CONTRATO.pdf']);
  /* escenario 6: un asunto colocado directamente bajo la categoría */
  await crearAsunto('ALUMNADO', '', n4, ['250501 BECA.pdf']);

  /* escenario 4: un relacionado que solo vive en la ficha, no en el
     nombre de la carpeta. Desde la fila 64
     (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md) la ficha de un archivado
     vive en su propia carpeta, así que se deja como dejaría la
     aplicación de verdad al archivar con relacionados: _ficha.json
     dentro de la carpeta, nada en asuntos.json. */
  await window.FichaArchivo.escribir(asuntoN2, {
    estado: 'cerrado', categoria: 'ALUMNADO', tercero: 'Otro Tercero 7654321',
    relacionados: [{ categoria: 'PERSONAL', nombre: 'Gomez Ruiz, Maria 5556' }]
  });
}, [NOMBRE_1, NOMBRE_2, NOMBRE_3, NOMBRE_SUELTO]);

await pagina.click('.pestana[data-pantalla="archivo"]');

console.log('--- 7) sin fichero de índice: se enseña igual, y avisa de reconstruir ---');
/* La primera vez que se entra en el Archivo en la sesión ya carga
   sola (fila 175, punto 3): no hace falta pulsar "Actualizar". */
await pagina.waitForFunction(() => window.App.E.listaArchivo && window.App.E.listaArchivo.length > 0);
await comprobar('7. aparecen los 4 asuntos aunque no haya índice',
  pagina.evaluate(() => window.App.E.listaArchivo.length), 4);
await comprobar('7. la línea de estado avisa de que el índice no está hecho',
  explicaArchivo().then((t) => t.indexOf('El índice no está hecho') !== -1), true);

console.log('--- 1) reconstruir el índice: el fichero queda con todos ---');
await pagina.evaluate(async () => { await window.App.reconstruirIndiceArchivo(); });
await comprobar('1. el fichero del índice tiene los 4 asuntos', nombresIndiceDeDisco(),
  [NOMBRE_2, NOMBRE_3, NOMBRE_SUELTO, NOMBRE_1].sort());
await comprobar('1. el recuento guarda las dos categorías',
  pagina.evaluate(async () => {
    var d = await window.Carpetas.leerJson(window.App.E.gestor, window.IndiceArchivo.FICHERO);
    return d.recuento;
  }), { ALUMNADO: 2, PERSONAL: 1 });
await comprobar('1. la línea de estado ya no pide reconstruir',
  explicaArchivo().then((t) => t.indexOf('El índice no está hecho') === -1), true);

console.log('--- 6) el asunto colocado bajo la categoría sale, con su ruta ---');
await comprobar('6. sale en la lista, con tercero vacío y sueltoEn puesto',
  pagina.evaluate((n) => {
    var a = window.App.E.listaArchivo.find(function (x) { return x.nombre === n; });
    return a ? { sueltoEn: a.sueltoEn, ruta: a.ruta, tercero: a.tercero } : null;
  }, NOMBRE_SUELTO),
  { sueltoEn: 'bajo la categoría', ruta: 'ALUMNADO', tercero: '' });
await comprobar('6. la línea de estado avisa de los asuntos fuera de su sitio',
  explicaArchivo().then((t) => t.indexOf('fuera de su sitio') !== -1), true);

console.log('--- 2) "matricula 2025 perez": tres palabras en tres sitios distintos, en otro orden ---');
/* "matricula" está en el tipo, "2025" en el nombre de un documento
   (250915 INFORME CURSO 2025.pdf), "perez" en el tercero: ni están
   juntas ni en ese orden en ningún sitio del asunto. */
{
  const r = await buscarEnArchivo('matricula 2025 perez');
  await comprobar('2. encuentra justo un asunto', r.length, 1);
  await comprobar('2. es el asunto correcto', r[0].indexOf(NOMBRE_1) !== -1, true);
}

console.log('--- 3) "26EM1234": lo encuentra por el nombre de un documento ---');
{
  const r = await buscarEnArchivo('26EM1234');
  await comprobar('3. encuentra justo un asunto', r.length, 1);
  await comprobar('3. es el asunto con ese registro en un documento', r[0].indexOf(NOMBRE_1) !== -1, true);
}

console.log('--- 4) el nombre de un relacionado, que solo está en la ficha ---');
{
  const r = await buscarEnArchivo('gomez');
  await comprobar('4. encuentra justo un asunto', r.length, 1);
  await comprobar('4. es el asunto con ese relacionado, aunque no esté en el nombre de la carpeta',
    r[0].indexOf(NOMBRE_2) !== -1, true);
}

await pagina.fill('#buscar-archivo', '');
await pagina.waitForTimeout(50);

console.log('--- 8) recuento desfasado: se enseña el índice igual, y avisa, sin reconstruir sola ---');
await pagina.evaluate(async () => {
  var cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  await cat.getDirectoryHandle('Tercero Nuevo Sin Asuntos Todavia 0000', { create: true });
});
await pagina.click('#pantalla-archivo .acciones .fila-menu-btn');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForTimeout(50);
await comprobar('8. se sigue enseñando el índice de antes (4 asuntos, no 5)',
  pagina.evaluate(() => window.App.E.listaArchivo.length), 4);
await comprobar('8. avisa de que el índice puede no estar al día',
  explicaArchivo().then((t) => t.indexOf('El índice puede no estar al día') !== -1), true);
await comprobar('8. el fichero del índice no se ha tocado solo (nadie lo ha reconstruido)',
  nombresIndiceDeDisco(), [NOMBRE_2, NOMBRE_3, NOMBRE_SUELTO, NOMBRE_1].sort());

console.log('--- 5) archivar añade la entrada al índice; reabrir la quita ---');
const NOMBRE_5 = '250910 INFORME 25-26 Prueba Cinco 3334444';
await pagina.evaluate(async ([nombre]) => {
  var carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  carpeta._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido'));
  window.App.E.registro.asuntos[nombre] = {};
  window.__a5 = {
    nombre: nombre, ficha: { categoria: 'PERSONAL', tercero: 'Prueba Cinco 3334444' },
    leido: { categoria: 'PERSONAL' }
  };
}, [NOMBRE_5]);
const r5cerrar = await pasarPorElCuadro('cerrarAsunto', '__a5', '__r5cerrar');
await comprobar('5. cerrarAsunto no lanza ningún error', r5cerrar.ok, true);
await comprobar('5. archivar añade la entrada al índice, sin perder las que ya había',
  nombresIndiceDeDisco(), [NOMBRE_2, NOMBRE_3, NOMBRE_5, NOMBRE_SUELTO, NOMBRE_1].sort());

await pagina.evaluate(([nombre]) => {
  /* Fila 64: tras archivar, la ficha ya no está en
     App.E.registro.asuntos (vive en _ficha.json, dentro de la propia
     carpeta). Se reutiliza la misma categoría/tercero con la que se
     archivó, como haría la aplicación de verdad (la tarjeta del
     ARCHIVO los trae siempre, tomados del índice). */
  window.__a5b = { nombre: nombre, padre: null, ficha: window.__a5.ficha };
}, [NOMBRE_5]);
const r5reabrir = await pasarPorElCuadro('reabrirAsunto', '__a5b', '__r5reabrir');
await comprobar('5. reabrirAsunto no lanza ningún error', r5reabrir.ok, true);
await comprobar('5. reabrir quita la entrada del índice, sin tocar las demás',
  nombresIndiceDeDisco(), [NOMBRE_2, NOMBRE_3, NOMBRE_SUELTO, NOMBRE_1].sort());

console.log('--- 9) escribir el índice cuando el compañero ha añadido otro asunto no lo pierde ---');
const r9 = await pagina.evaluate(async () => {
  /* Lo que esta sesión tiene en la mano para guardar (una foto de lo
     que había justo antes de que el compañero escribiera). */
  var propio = JSON.parse(JSON.stringify(
    await window.Carpetas.leerJson(window.App.E.gestor, window.IndiceArchivo.FICHERO)));

  /* El compañero, desde el otro ordenador, archiva algo y lo añade
     directo al fichero mientras tanto. */
  await window.IndiceArchivo.anadirEntrada({
    nombre: 'DEL COMPAÑERO', categoria: 'OTROS', tercero: 'Nadie', ruta: 'OTROS / Nadie',
    fecha: '', tipo: '', curso: '', grupo: '', documentos: [], registros: [], sueltoEn: ''
  });

  /* Esta sesión guarda su propia foto, sin saber nada de eso. */
  await window.IndiceArchivo.guardar(propio);

  var final = await window.Carpetas.leerJson(window.App.E.gestor, window.IndiceArchivo.FICHERO);
  return {
    tieneLoDelCompanero: final.asuntos.some(function (a) { return a.nombre === 'DEL COMPAÑERO'; }),
    tieneLoDeAntes: propio.asuntos.every(function (p) {
      return final.asuntos.some(function (f) { return f.nombre === p.nombre; });
    })
  };
});
await comprobar('9. lo del compañero no se pierde al guardar', r9.tieneLoDelCompanero, true);
await comprobar('9. lo que ya había tampoco se pierde', r9.tieneLoDeAntes, true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
