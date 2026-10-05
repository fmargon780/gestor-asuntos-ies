/* Prueba en navegador de verdad de la fila 239 de docs/COLA.md
   (docs/NOMBRES-FIJOS-CON-NUMERO.md):

   1. La parte pura: formato y lectura de los números A26-0137 y
      D26-01234, y la estructura fija de los nombres.
   2. Nuevo asunto: la vista previa enseña `AAMMDD A26-NNNN TIPO Tercero`
      (sin año académico, grupo, campos ni texto libre) y es exactamente
      el nombre que se crea; dos asuntos iguales el mismo día no chocan.
   3. El contador: lo que ya está en una ficha o en el disco no se repite
      (otro ordenador a la vez) y los asuntos de antes no cambian.
   4. Documentos: `AAMMDD TIPO D26-NNNNN.ext`, con el registro, el texto y
      los campos en la ficha; el mismo fichero en dos asuntos lleva el
      mismo número.
   5. Registrar un documento con número: el original («SIN SELLAR») va a
      `_Previas` y el sellado se queda con el mismo nombre y número.
   6. `_Previas` para lo nuevo; una «Versiones previas» que ya existe se
      sigue usando.
   7. Nombres cortos de más de 25: «por configurar» en la comprobación,
      lista única para acortarlos, y se sigue pudiendo crear con ellos.
   8. Largo de las rutas: el margen, y rojo cuando no cabe (en Ajustes; en los asuntos solo ámbar, fila 263).
   9. Un asunto de antes se edita sin recibir número ni cambiar de nombre. */
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

const AA = String(new Date().getFullYear()).slice(2);
const A = (n) => 'A' + AA + '-' + String(n).padStart(4, '0');
const D = (n) => 'D' + AA + '-' + String(n).padStart(5, '0');

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

async function clicTipo(nombre) {
  const boton = pagina.getByRole('button', { name: nombre, exact: true });
  if (!(await boton.isVisible())) {
    const ver = pagina.locator('#btn-ver-tipos');
    if (await ver.isVisible() && /^Ver todos/.test((await ver.textContent()).trim())) await ver.click();
  }
  await boton.click();
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013;600111222;tutor.marina@correo.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
  /* Un asunto «de antes», sin número, ya en la carpeta. */
  await window.__disco.abiertos.getDirectoryHandle('250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
/* Se pone la ficha del asunto de antes (sin número). */
await pagina.evaluate(async () => {
  await App.anotar('250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001', {
    abiertoEl: U.ahora(), tipo: 'CERTIFICADO', categoria: 'ALUMNADO', tercero: 'Antiguo Uno, Eva 9990001', curso: '25-26',
    grupo: '', descripcion: '', campos: {}, estado: 'abierto'
  });
  await App.verAbiertos();
});

console.log('--- 1. la parte pura ---');
await comprobar('formato y lectura de los números', pagina.evaluate(() => [
  Numeros.formato('asuntos', '26', 137), Numeros.formato('documentos', '26', 1234),
  Numeros.leer('A26-0137'), Numeros.leer('D26-01234'), Numeros.leer('A26-137'),
  Numeros.delNombreDeAsunto('260907 A26-0137 MATRICULA Cordero Navas, Lucía 1139877'),
  Numeros.delNombreDeDocumento('260907 SOLICITUD D26-01234.pdf')
]), ['A26-0137', 'D26-01234', { clase: 'asuntos', ano: '26', n: 137 }, { clase: 'documentos', ano: '26', n: 1234 }, null,
  'A26-0137', 'D26-01234']);
await comprobar('el año del número es el de la creación real (no el de la fecha del asunto)', pagina.evaluate(() =>
  [Numeros.anoDe(new Date(2027, 0, 1)), Numeros.anoDe('2025-03-04')]), ['27', '25']);
await comprobar('el contador vuelve a 1 cada año y salta lo ocupado', pagina.evaluate(async () => [
  Numeros.siguienteLibre('asuntos', '26', 136, []),
  Numeros.siguienteLibre('asuntos', '26', 3, ['A26-0010', 'A26-0002', 'D26-00099', 'A27-0500']),
  Numeros.siguienteLibre('documentos', '26', 0, ['D26-00005']),
  await Numeros.proximo('asuntos', '2031-01-01'),
  await Numeros.proximo('documentos', '2031-01-01')
]), [137, 11, 6, 'A31-0001', 'D31-00001']);
await comprobar('carpeta con número: fecha, número, tipo y tercero; sin recorte', pagina.evaluate(() => {
  const r = Nombres.montarAsunto({
    fecha: '2026-09-07', tipo: 'Matricula', curso: '26-27', grupo: '3ºA', campos: ['x'], descripcion: 'texto libre largo '.repeat(20),
    tercero: 'Cordero Navas, Lucía 1139877', numero: 'A26-0137'
  });
  return [r.nombre, r.recortado, r.noCabe];
}), ['260907 A26-0137 MATRICULA Cordero Navas, Lucía 1139877', false, false]);
await comprobar('carpeta sin número: la estructura de siempre', pagina.evaluate(() => Nombres.montar({
  fecha: '2026-09-07', tipo: 'MATRICULA', curso: '26-27', grupo: '', campos: [], descripcion: '', tercero: 'Cordero Navas, Lucía 1139877'
})), '260907 MATRICULA 26-27 Cordero Navas, Lucía 1139877');
await comprobar('documento con número: fecha, tipo y número', pagina.evaluate(() => Nombres.montarDocumento({
  fecha: '2026-09-07', tipo: 'solicitud', codigo: '26EM1234', curso: 'texto', campos: ['a'], extension: 'PDF', numeroDoc: 'D26-01234'
})), '260907 SOLICITUD D26-01234.pdf');
await comprobar('documento sin número: el de siempre', pagina.evaluate(() => Nombres.montarDocumento({
  fecha: '2026-09-07', tipo: 'SOLICITUD', codigo: '26EM1234', curso: '26-27', extension: 'pdf'
})), '260907 26EM1234 SOLICITUD 26-27.pdf');
await comprobar('leer el nombre de una carpeta nueva saca el número y el tipo', pagina.evaluate(() => {
  const l = Nombres.leer('260907 A26-0137 MATRICULA Cordero Navas, Lucía 1139877', App.E.tipos);
  return [l.fecha, l.numero, l.tipo, l.resto];
}), ['260907', 'A26-0137', 'MATRICULA', 'Cordero Navas, Lucía 1139877']);
await comprobar('leer el nombre de una carpeta de antes sigue igual', pagina.evaluate(() => {
  const l = Nombres.leer('250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001', App.E.tipos);
  return [l.fecha, l.numero, l.tipo];
}), ['250910', '', 'CERTIFICADO']);
await comprobar('leer el nombre de un documento con número', pagina.evaluate(() => {
  const l = Documentos.leerNombre('260907 SOLICITUD D26-01234.pdf');
  return [l.fecha, l.tipo, l.numero, l.registro];
}), ['2026-09-07', 'SOLICITUD', 'D26-01234', null]);
await comprobar('leer el nombre de un documento de antes sigue igual', pagina.evaluate(() => {
  const l = Documentos.leerNombre('260907 26EM1234 SOLICITUD 26-27.pdf');
  return [l.fecha, l.tipo, l.numero, l.curso, l.registro];
}), ['2026-09-07', 'SOLICITUD', '', '26-27', { ano: '26', sentido: 'E', modo: 'M', numero: '1234' }]);

console.log('--- 2. nuevo asunto ---');
async function nuevoAsunto(fecha, curso, descripcion) {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
  await clicTipo('MATRICULA');
  await pagina.fill('#buscar-tercero', 'marina');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', fecha);
  await pagina.fill('#campo-curso', curso || '');
  await pagina.fill('#campo-descripcion', descripcion || '');
  await pagina.waitForFunction(() => /^\d{6} A\d{2}-\d{4} /.test(document.getElementById('vista-nombre').textContent));
  return pagina.locator('#vista-nombre').textContent();
}
async function crearYVolver() {
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 15000 });
  await pagina.click('#ficha-volver');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
}
const NOMBRE_1 = '260907 ' + A(1) + ' MATRICULA Aguilar Ponce, Marina 1140233';
const NOMBRE_2 = '260907 ' + A(2) + ' MATRICULA Aguilar Ponce, Marina 1140233';
const vista1 = await nuevoAsunto('2026-09-07', '26-27', 'Cambio de optativa');
await comprobar('la vista previa enseña fecha, número, tipo y tercero; sin curso ni descripción', vista1, NOMBRE_1);
await crearYVolver();
await comprobar('la carpeta se llama exactamente como enseñaba la vista previa', pagina.evaluate(async () => {
  const n = []; for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
  return n.filter(x => x[0] !== '_' && /MATRICULA/.test(x));
}), [NOMBRE_1]);
await comprobar('la ficha guarda el número, y también lo que ya no va en el nombre', pagina.evaluate((n) => {
  const f = App.E.registro.asuntos[n];
  return [f.numero, f.curso, f.descripcion];
}, NOMBRE_1), [A(1), '26-27', 'Cambio de optativa']);

const vista2 = await nuevoAsunto('2026-09-07', '26-27', 'Cambio de optativa');
await comprobar('otro asunto del mismo tipo, tercero y día: el número siguiente', vista2, NOMBRE_2);
await pagina.click('#btn-crear');
await pagina.waitForTimeout(500);
/* Puede salir el aviso de «¿esto no lo hicimos ya?» (mismo tercero, tipo y curso): se crea igual. */
if (await pagina.locator('#capa:not(.oculto)').count()) {
  const crear = pagina.locator('#capa button').filter({ hasText: /Crear/ }).first();
  if (await crear.count()) await crear.click();
}
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 15000 });
await comprobar('y se crea sin ningún aviso de nombre repetido', pagina.evaluate(async () => {
  const n = []; for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
  return n.filter(x => x[0] !== '_' && /MATRICULA/.test(x)).sort();
}), [NOMBRE_1, NOMBRE_2]);
await comprobar('la cabecera de la ficha enseña el número', pagina.locator('#ficha-asunto-cuerpo .marca-numero').first().textContent(), A(2));
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('la tabla de Inicio enseña el número junto al tipo', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#inicio-tabla-cuerpo .marca-numero')).map(x => x.textContent).sort()), [A(1), A(2)]);

console.log('--- 3. el contador ---');
await comprobar('el contador del disco lleva lo dado', pagina.evaluate(async () => {
  const j = await Carpetas.leerJson(App.E.gestor, 'numeros.json');
  return j.asuntos[Numeros.anoDe()];
}), 2);
await comprobar('otro ordenador ha dado hasta el 10: el siguiente es el 11', pagina.evaluate(async () => {
  const ano = Numeros.anoDe();
  const j = await Carpetas.leerJson(App.E.gestor, 'numeros.json');
  j.asuntos[ano] = 10;
  await Carpetas.guardarJson(App.E.gestor, 'numeros.json', j);
  return Numeros.proximo('asuntos');
}), A(11));
await comprobar('y aunque el contador vaya por detrás, un número que ya está en una ficha no se repite', pagina.evaluate(async () => {
  const ano = Numeros.anoDe();
  await App.anotar('250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001', { numeroDePrueba: true });
  await App.guardarRegistroFresco(async (r) => { r.asuntos['carpeta de prueba'] = { numero: 'A' + ano + '-0015' }; });
  return Numeros.proximo('asuntos');
}), A(16));
await comprobar('reservar respeta el que se enseñó si sigue libre, y avisa si ya no lo está', pagina.evaluate(async () => {
  const libre = await Numeros.reservar('asuntos', 'A' + Numeros.anoDe() + '-0016');
  const ocupado = await Numeros.reservar('asuntos', 'A' + Numeros.anoDe() + '-0016');
  return [libre, ocupado];
}), [{ numero: A(16), cambio: false }, { numero: A(17), cambio: true }]);
await comprobar('un número gastado no se reutiliza aunque el asunto desaparezca', pagina.evaluate(async () => {
  await App.guardarRegistroFresco(async (r) => { delete r.asuntos['carpeta de prueba']; });
  return Numeros.proximo('asuntos');
}), A(18));

console.log('--- 4. documentos ---');
await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.ficha-documentos-anadir');
async function anadirElExterno(fecha, tipo, texto, conRegistro) {
  await pagina.click('.ficha-documentos-anadir');
  await pagina.waitForSelector('#doc-vista');
  await pagina.fill('#doc-fecha', fecha);
  await pagina.selectOption('#doc-tipo', tipo);
  await pagina.fill('#doc-curso', texto);
  if (conRegistro) {
    await pagina.check('#doc-hay-registro');
    await pagina.fill('#doc-ano', AA);
    await pagina.fill('#doc-numero', '1234');
  }
  await pagina.waitForTimeout(150);
  const vista = await pagina.locator('#doc-vista').textContent();
  await pagina.click('#doc-guardar');
  await pagina.waitForSelector('#doc-cuerpo .fila-documento');
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForTimeout(300);
  return vista;
}
const ASUNTO_ABIERTO = await pagina.locator('.ficha-nombre-texto').textContent();
const vistaDoc = await anadirElExterno('2026-09-07', 'SOLICITUD', 'Curso 26-27', true);
const NUM_DOC = 'D' + AA + '-00001';
await comprobar('el documento se llama AAMMDD TIPO D26-NNNNN.ext, sin registro ni texto', vistaDoc, '260907 SOLICITUD ' + NUM_DOC + '.pdf');
await comprobar('y es el que queda en la carpeta', pagina.evaluate(async (a) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  const n = []; for await (const p of c.entries()) n.push(p[0]);
  return n;
}, ASUNTO_ABIERTO), ['260907 SOLICITUD ' + NUM_DOC + '.pdf']);
await comprobar('la ficha guarda el registro, el texto y el tipo de ese documento', pagina.evaluate(([a, d]) => {
  const x = App.E.registro.asuntos[a].documentos[d];
  return [x.tipo, x.fecha, x.texto, x.registros.map(r => r.codigo)];
}, [ASUNTO_ABIERTO, NUM_DOC]), ['SOLICITUD', '2026-09-07', 'Curso 26-27', [AA + 'EM1234']]);
await comprobar('la fila del documento enseña el registro y el texto', pagina.locator('#ficha-documentos .ficha-documento-datos').first().textContent(),
  'Registro ' + AA + 'EM1234 · Curso 26-27');
await comprobar('y el documento cuenta como registrado: sin botón «Registrar»', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#ficha-documentos button')).some(b => b.textContent.trim() === 'Registrar')), false);

/* El mismo fichero, en otro asunto: el mismo número. */
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + NOMBRE_2 + '"] .nombre-pulsable, #inicio-tabla-cuerpo tr[data-asunto="' + NOMBRE_1 + '"] .nombre-pulsable').last().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.ficha-documentos-anadir');
const vistaOtro = await anadirElExterno('2026-09-08', 'SOLICITUD', '', false);
await comprobar('el mismo fichero en otro asunto lleva el mismo número de documento', vistaOtro, '260908 SOLICITUD ' + NUM_DOC + '.pdf');

console.log('--- 5. registrar un documento con número ---');
await pagina.evaluate(async ([a, d]) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(a);
  const nombre = '260908 SOLICITUD ' + d + '.pdf';
  window.__disco.externo = window.__disco.fich('sellado.pdf', 'el sellado');
  window.__cuadroRegistro = Registro.abrirCuadro(App.asuntoDeLaFicha(), nombre, function () {});   /* espera al cuadro: no se aguarda */
}, [await pagina.locator('.ficha-nombre-texto').textContent(), NUM_DOC]);
await pagina.waitForSelector('#capa:not(.oculto) #reg-numero');
await pagina.fill('#reg-ano', AA);
await pagina.fill('#reg-numero', '77');
await pagina.check('input[name="reg-sentido"][value="S"]');
await comprobar('la vista previa conserva el nombre (el registro va a la ficha)', pagina.locator('#reg-vista').textContent(),
  '260908 SOLICITUD ' + NUM_DOC + '.pdf');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
const ASUNTO_2 = await pagina.locator('.ficha-nombre-texto').textContent();
await comprobar('el sellado se queda con el mismo nombre; el original sin sellar, en «_Previas», con el mismo número', pagina.evaluate(async (a) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  const arriba = [], previas = [];
  for await (const p of c.entries()) if (p[1].kind === 'file') arriba.push(p[0]);
  for await (const p of (await c.getDirectoryHandle('_Previas')).entries()) previas.push(p[0]);
  return [arriba, previas];
}, ASUNTO_2), [['260908 SOLICITUD ' + NUM_DOC + '.pdf'], ['260908 SOLICITUD ' + NUM_DOC + ' SIN SELLAR.pdf']]);
await comprobar('la ficha suma el registro al documento', pagina.evaluate(([a, d]) =>
  App.E.registro.asuntos[a].documentos[d].registros.map(r => r.codigo), [ASUNTO_2, NUM_DOC]), [AA + 'SM0077']);

console.log('--- 6. «_Previas» y las «Versiones previas» de antes ---');
await comprobar('una carpeta sin previas: lo nuevo va a «_Previas»', pagina.evaluate(async () => {
  const c = await window.__disco.abiertos.getDirectoryHandle('prueba previas nueva', { create: true });
  c._hijos.set('uno.pdf', window.__disco.fich('uno.pdf', 'x'));
  await VersionesPrevias.mover(c, 'uno.pdf');
  return [Array.from(c._hijos.keys()).sort(), await VersionesPrevias.nombreDeCarpeta(c)];
}), [['_Previas'], '_Previas']);
await comprobar('una carpeta que ya tiene «Versiones previas»: lo nuevo va a esa misma, y se lee', pagina.evaluate(async () => {
  const c = await window.__disco.abiertos.getDirectoryHandle('prueba previas vieja', { create: true });
  const vieja = await c.getDirectoryHandle('Versiones previas', { create: true });
  vieja._hijos.set('antes.pdf', window.__disco.fich('antes.pdf', 'x'));
  c._hijos.set('dos.pdf', window.__disco.fich('dos.pdf', 'x'));
  await VersionesPrevias.mover(c, 'dos.pdf');
  const listadas = (await VersionesPrevias.listar(c)).map(f => f.nombre).sort();
  return [Array.from(c._hijos.keys()).sort(), Array.from(vieja._hijos.keys()).sort(), listadas];
}), [['Versiones previas'], ['antes.pdf', 'dos.pdf'], ['antes.pdf', 'dos.pdf']]);

console.log('--- 7. nombres cortos de más de 25 ---');
const LARGO_ASUNTO = 'INSPECCION EDUCATIVA DE ZONA Y DISTRITO';
await comprobar('crear un tipo con un nombre corto de más de 25 no se deja', pagina.evaluate(async () => {
  const c = document.getElementById('tipo-al-vuelo-corto');
  return !!c && c.maxLength === 25;
}), true);
await pagina.evaluate(async (nombre) => {
  await App.crearTipo({ nombre: nombre, categoria: 'OTROS' });
  App.E.tiposDocumento.push('CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO');
}, LARGO_ASUNTO);
await comprobar('la lista de tipos largos trae el de asunto y el de documento', pagina.evaluate(() =>
  TiposLargos.lista().map(t => [t.clase, t.nombre, t.largo > 25])), [['asunto', LARGO_ASUNTO, true], ['documento', 'CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO', true]]);
await comprobar('mientras tanto se puede montar el nombre de un asunto de ese tipo (con su nombre entero)', pagina.evaluate((n) =>
  Nombres.montarAsunto({ fecha: '2026-09-07', tipo: n, tercero: 'Uno, Eva', numero: 'A26-0001' }).nombre, LARGO_ASUNTO),
  '260907 A26-0001 ' + LARGO_ASUNTO + ' Uno, Eva');
await comprobar('la comprobación al entrar dice «falta» en los nombres cortos', pagina.evaluate(async () => {
  const filas = await ComprobacionEntrada.revisar();
  const f = filas.filter(x => x.id === 'tipos-largos')[0];
  return [f.estado, /2 tipos pasan de 25/.test(f.frase)];
}), ['falta', true]);
await pagina.evaluate(() => { TiposLargos.abrir(); });
await pagina.waitForSelector('#tipos-largos-lista .tipo-largo-corto');
await comprobar('«Arreglarlo» abre UNA lista con los dos, cada uno con su casilla y su contador',
  pagina.evaluate(() => [document.querySelectorAll('.tipo-largo-fila').length, document.querySelector('.tipo-largo-cuenta').textContent]),
  [2, '0 de 25 caracteres']);
await pagina.locator('.tipo-largo-corto').nth(0).fill('INSPECCION DE ZONA');
await pagina.locator('.tipo-largo-corto').nth(1).fill('CERT ESCOLARIDAD OTRO CENTRO');   /* 28: no cabe en el maxlength */
await pagina.locator('.tipo-largo-corto').nth(0).blur();
await pagina.locator('.tipo-largo-corto').nth(1).blur();
await pagina.waitForTimeout(400);
await comprobar('al acortar se guarda al momento (sin botón «Guardar»); la casilla corta a 25 y no deja pasarse', pagina.evaluate(() => {
  const t = App.E.tipos.filter(x => x.tipo === 'INSPECCION EDUCATIVA DE ZONA Y DISTRITO')[0];
  return [t.nombreCorto, TiposLargos.lista().length, document.querySelector('.tipo-largo-corto').maxLength];
}), ['INSPECCION DE ZONA', 0, 25]);
await pagina.locator('.tipo-largo-corto').nth(1).fill('CERT ESCOLARIDAD OTRO');
await pagina.locator('.tipo-largo-corto').nth(1).blur();
await pagina.waitForTimeout(400);
await comprobar('y el de documento también, y el nombre corto queda en _GESTOR', pagina.evaluate(async () => {
  const j = await Carpetas.leerJson(App.E.gestor, 'tipos-documento-cortos.json');
  return [TiposLargos.lista().length, j.cortos['CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO']];
}), [0, 'CERT ESCOLARIDAD OTRO']);
await comprobar('el nombre de un documento de ese tipo usa el corto, y se reconoce al leerlo', pagina.evaluate(() => {
  const n = Nombres.montarDocumento({ fecha: '2026-09-07', tipo: 'CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO', extension: 'pdf', numeroDoc: 'D26-00009' });
  return [n, Documentos.leerNombre(n).tipo];
}), ['260907 CERT ESCOLARIDAD OTRO D26-00009.pdf', 'CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO']);
await pagina.click('#cuadro-aceptar');

console.log('--- 8. largo de las rutas ---');
await comprobar('sin la ruta del ARCHIVO apuntada todavía, no se sabe y no bloquea', pagina.evaluate(async () => {
  const m = await Nombres.medidor();
  return [m.conocido, Nombres.cabeEnRuta('260907 A26-0001 MATRICULA Uno, Eva', 'Uno, Eva', 'ALUMNADO').cabe];
}), [false, true]);
await pagina.evaluate(async () => {
  /* Sin los tipos largos de la prueba de más arriba: el peor caso sale con los tipos de fábrica. */
  App.E.tipos = App.E.tipos.filter(t => t.tipo !== 'INSPECCION EDUCATIVA DE ZONA Y DISTRITO');
  App.E.tiposDocumento = App.E.tiposDocumento.filter(t => t !== 'CERTIFICADO DE ESCOLARIDAD EN OTRO CENTRO');
  await Carpetas.guardarJson(App.E.gestor, 'rutas.json', { abiertos: 'ABIERTOS', archivo: 'ARCHIVO' });
  await RutaCarpetas.cargarComun();
});
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('.pestana-ajustes[data-ajustes-pestana="centro"]');
await pagina.evaluate(() => { document.getElementById('bloque-largo-rutas').open = true; });
await pagina.waitForFunction(() => /margen/.test(document.getElementById('largo-rutas-margen').textContent));
await comprobar('Ajustes → El centro enseña «Largo de las rutas» con el margen en verde', pagina.evaluate(() => {
  const el = document.getElementById('largo-rutas-margen');
  return [/^Quedan \d+ caracteres de margen\.$/.test(el.textContent), el.classList.contains('largo-rutas-verde')];
}), [true, true]);
await comprobar('el veredicto: verde, ámbar por debajo de 20, rojo si no cabe', pagina.evaluate(() => [
  LargoDeRutas.veredicto({ conocido: true, margen: 80, masOcupa: { texto: 'x' } }).clase,
  LargoDeRutas.veredicto({ conocido: true, margen: 19, masOcupa: { texto: 'x' } }).clase,
  LargoDeRutas.veredicto({ conocido: true, margen: -3, masOcupa: { texto: 'el tercero más largo' } }).frase
]), ['verde', 'ambar', 'La ruta más larga no cabe: se pasa 3 caracteres. Lo que más ocupa es el tercero más largo.']);
await comprobar('con un tercero larguísimo, la cuenta sigue diciendo que no cabe (la pantalla solo avisa en ámbar: fila 263)', pagina.evaluate(() => {
  const r = Nombres.montarAsunto({ fecha: '2026-09-07', tipo: 'MATRICULA', tercero: 'X'.repeat(150), numero: 'A26-0001', categoria: 'ALUMNADO' });
  return [r.noCabe, r.margen < 0];
}), [true, true]);

console.log('--- 9. un asunto de antes ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await comprobar('sigue sin número y con su nombre', pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter(x => /Antiguo Uno/.test(x.nombre))[0];
  return [a.nombre, !!(a.ficha && a.ficha.numero), a.leido.numero];
}), ['250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001', false, '']);
await comprobar('«Cambiar el asunto» de uno antiguo no le pone número ni cambia su estructura', pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter(x => /Antiguo Uno/.test(x.nombre))[0];
  const p = App.piezasDelAsunto(a);
  return [p.numero, Nombres.montarAsunto(Object.assign({}, p, { campos: [] })).nombre];
}), ['', '250910 CERTIFICADO 25-26 Antiguo Uno, Eva 9990001']);
await comprobar('«Cambiar el asunto» de uno con número conserva el suyo', pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter(x => /A\d{2}-0001 MATRICULA/.test(x.nombre))[0];
  const p = App.piezasDelAsunto(a);
  return [p.numero, Nombres.montarAsunto(Object.assign({}, p, { campos: [], fecha: '2026-09-09' })).nombre];
}), [A(1), '260909 ' + A(1) + ' MATRICULA Aguilar Ponce, Marina 1140233']);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
