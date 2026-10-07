/* Fila 296 (docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md): formar un grupo pegando una lista.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. `ListaPegada.reconocer` (sin efectos): por Nº escolar; por DNI con y sin letra y con guiones (y con la letra cambiada no);
      por «Apellidos, Nombre» y «Nombre Apellidos», con tildes y mayúsculas; apellidos y nombre en dos columnas; tabuladores
      y punto y coma; cabecera saltada; dos tocayos a «Hay que elegir»; uno que no existe a «No encontradas»; repetido una vez;
      antiguo no matriculado a «Hay que elegir» diciéndolo; 600 líneas en menos de un segundo.
   2. Un CSV en Latin-1 y un Excel dan lo mismo que el texto pegado.
   3. El cuadro en el buscador de señalar varios: los tres apartados, elegir una dudosa, quitar una marca, «Señalar las N»,
      «Guardar también como grupo» (y sustituir uno que ya existe).
   4. Desde «Nuevo asunto» → «Es para un grupo de personas»: el grupo sale con origen «lista» y el nombre del grupo guardado.
   5. «+ Añadir personas» de un asunto de grupo ya creado: las personas nuevas entran en la tabla.
   6. Sin errores en la consola. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForTimeout(4000);

/* Reconoce en la página y deja solo lo que se compara: nombres de lo reconocido, líneas de lo dudoso y de lo no encontrado. */
const reconocer = (texto, categoria) => pagina.evaluate(async ([t, c]) => {
  const cats = c === 'TODAS' ? Nombres.CATEGORIAS : [c];
  const por = {};
  for (const k of cats) por[k] = (await Datos.cargar(App.E.datos, k)).lista;
  const r = ListaPegada.reconocer(t, por, c);
  return {
    enc: r.encontradas.map((e) => e.nombre),
    dud: r.dudosas.map((d) => ({ linea: d.linea, motivo: d.motivo, cand: d.candidatas.map((x) => x.nombre + ' | ' + x.unidad) })),
    no: r.noEncontradas, cabecera: r.cabecera
  };
}, [texto, categoria]);

console.log('--- 1. reconocer ---');
const marina = 'Aguilar Ponce, Marina (2100001)';
let r = await reconocer('2100001\n2100002', 'ALUMNADO');
await comprobar('1. por Nº de identificación escolar', Promise.resolve(r.enc.length + ' ' + r.no.length), '2 0');
const nombreMarina = r.enc[0];
r = await reconocer('Aguilar Ponce, Pablo\nMarina Aguilar Ponce\nbermudez ortiz, alvaro\nIKER DELGADO PRIETO', 'ALUMNADO');
await comprobar('1. «Apellidos, Nombre», «Nombre Apellidos», sin tildes y en mayúsculas: cuatro',
  Promise.resolve([r.enc.length, r.no.length, r.dud.length, r.enc[1] === nombreMarina]), [4, 0, 0, true]);
r = await reconocer('Castro Reina\tNoa\nOrtega Paz;Darío\nNavarro Gil, Lucía', 'ALUMNADO');
await comprobar('1. apellidos y nombre en dos columnas (tabulador y punto y coma) y una con coma', Promise.resolve([r.enc.length, r.no.length]), [3, 0]);
r = await reconocer('11223344A\n22334455\n33.445.566-C\n44-556-677 D', 'PERSONAL');
await comprobar('1. DNI con letra, sin letra, con puntos y guiones, con espacios', Promise.resolve([r.enc.length, r.no.length]), [4, 0]);
r = await reconocer('11223344Z', 'PERSONAL');
await comprobar('1. un DNI con la letra cambiada no se «arregla»', Promise.resolve([r.enc.length, r.no]), [0, ['11223344Z']]);
r = await reconocer('55667788E', 'TUTORES LEGALES');
await comprobar('1. el DNI de un tutor legal, en su categoría', Promise.resolve(r.enc.length), 1);
r = await reconocer('Otero Campos, Marta\n11223344A', 'TODAS');
await comprobar('1. «En todas»: la misma persona por nombre y por DNI entra una sola vez', Promise.resolve(r.enc.length), 1);
r = await reconocer('Alumno/a\nSara Ibarra Nieto\nXx Yy Zz', 'ALUMNADO');
await comprobar('1. la cabecera «Alumno/a» no es persona ni «no encontrada»; el que no existe sí', Promise.resolve([r.enc.length, r.no, r.cabecera]), [1, ['Xx Yy Zz'], 'Alumno/a']);
r = await reconocer('Nº;Alumno/a;Unidad\n1;Klein Soto, Ana;1º C', 'ALUMNADO');
await comprobar('1. con cabecera de varias columnas y un número de orden delante', Promise.resolve([r.enc.length, r.no.length, r.cabecera]), [1, 0, 'Nº;Alumno/a;Unidad']);
r = await reconocer('Soler Vega, Adrián', 'ALUMNADO');
await comprobar('1. dos tocayos van a «Hay que elegir» con su unidad, nunca el primero',
  Promise.resolve([r.enc.length, r.dud.length, r.dud[0].cand.slice().sort()]), [0, 1, ['Soler Vega, Adrián 2100040 | 1º A', 'Soler Vega, Adrián 2100041 | 3º A']]);
r = await reconocer('Soler Vega\nSoler Vega, Adrián', 'ALUMNADO');
await comprobar('1. «Soler Vega» solo (sin el nombre entero) no elige a nadie ni a los dos', Promise.resolve([r.enc.length, r.dud.length, r.no]), [0, 1, ['Soler Vega']]);
r = await reconocer('Moya Santana, Elena', 'ALUMNADO');
await comprobar('1. un antiguo no matriculado va a «Hay que elegir» diciéndolo',
  Promise.resolve([r.enc.length, r.dud.length, r.dud[0] && r.dud[0].motivo]), [0, 1, 'No está matriculada este curso.']);
r = await reconocer('Aguilar Ponce, Pablo\n2100002\nPablo Aguilar Ponce', 'ALUMNADO');
await comprobar('1. una persona repetida en tres líneas entra una vez', Promise.resolve(r.enc.length), 1);
r = await reconocer('Perez Nadie, Juan', 'ALUMNADO');
await comprobar('1. uno que no existe va a «No encontradas»', Promise.resolve([r.enc.length, r.no]), [0, ['Perez Nadie, Juan']]);

const largo = await pagina.evaluate(() => {
  const lista = [];
  for (let i = 0; i < 700; i++) lista.push({ nombre: 'Apellidouno' + i + ' Apellidodos' + (i % 37) + ', Nombre' + (i % 11), id: String(5000000 + i), categoria: 'ALUMNADO', matriculado: true, unidad: '1º A', campos: {} });
  const filas = [];
  for (let i = 0; i < 600; i++) filas.push(i % 3 === 0 ? String(5000000 + i) : i % 3 === 1 ? 'Nombre' + (i % 11) + ' Apellidouno' + i + ' Apellidodos' + (i % 37) : 'Apellidouno' + i + ' Apellidodos' + (i % 37) + ', Nombre' + (i % 11));
  const t0 = performance.now();
  const r = ListaPegada.reconocer(filas.join('\n'), { ALUMNADO: lista }, 'ALUMNADO');
  return [r.encontradas.length, r.dudosas.length, r.noEncontradas.length, performance.now() - t0 < 1000];
});
await comprobar('1. 600 líneas, 700 alumnos: todas reconocidas en menos de un segundo', Promise.resolve(largo), [600, 0, 0, true]);

console.log('--- 2. ficheros ---');
const TEXTO = 'Nº;Alumno/a;Unidad\r\n1;Aguilar Ponce, Marina;1º A\r\n2;Bermúdez Ortiz, Álvaro;1º C\r\n3;Klein Soto, Ana;1º C\r\n4;Soler Vega, Adrián;1º A\r\n5;Nadie Nada, Pepe;1º A\r\n';
const ficheros = await pagina.evaluate(async (texto) => {
  const por = { ALUMNADO: (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista };
  const resumen = (t) => { const r = ListaPegada.reconocer(t, por, 'ALUMNADO'); return [r.encontradas.map((e) => e.nombre), r.dudosas.length, r.noEncontradas.length, r.cabecera ? 1 : 0]; };
  const pegado = resumen(texto);
  /* Latin-1 de verdad: un byte por letra. */
  const latin1 = new Uint8Array(Array.from(texto).map((c) => c.charCodeAt(0)));
  const deCsv = resumen(await ListaPegada.textoDeFichero('listado.csv', latin1));
  /* El mismo contenido, en un .xlsx mínimo (ZIP sin comprimir, como en pruebas/tablas-datos.mjs). */
  const filas = texto.trim().split('\r\n').map((l) => l.split(';'));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const col = (i) => String.fromCharCode(65 + i);
  const hoja = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    filas.map((f, n) => '<row r="' + (n + 1) + '">' + f.map((c, i) => '<c r="' + col(i) + (n + 1) + '" t="inlineStr"><is><t>' + esc(c) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData></worksheet>';
  const I = Docx.interno;
  const entradas = [['xl/worksheets/sheet1.xml', hoja]];
  const partes = [], centrales = [];
  let offset = 0;
  for (const [n, t] of entradas) {
    const d = new TextEncoder().encode(t), nb = new TextEncoder().encode(n), crc = I.crc32(d);
    const local = I.cabeceraLocal({ crc, tam: d.length, nombreBytes: nb, tiempoDos: 0, fechaDos: 0 });
    partes.push(local, d);
    centrales.push(I.entradaCentral({ crc, tam: d.length, nombreBytes: nb, tiempoDos: 0, fechaDos: 0, atributosExternos: 0, offset }));
    offset += local.length + d.length;
  }
  const dir = I.concatenar(centrales);
  const xlsx = I.concatenar(partes.concat([dir, I.finDeDirectorio(entradas.length, dir.length, offset)]));
  const deXlsx = resumen(await ListaPegada.textoDeFichero('listado.xlsx', xlsx));
  return { pegado, deCsv, deXlsx };
}, TEXTO);
await comprobar('2. lo pegado: tres reconocidas, un tocayo, uno que no existe y la cabecera', Promise.resolve([ficheros.pegado[0].length, ficheros.pegado[1], ficheros.pegado[2], ficheros.pegado[3]]), [3, 1, 1, 1]);
await comprobar('2. un CSV en Latin-1 da lo mismo que lo pegado', Promise.resolve(ficheros.deCsv), ficheros.pegado);
await comprobar('2. un Excel da lo mismo que lo pegado', Promise.resolve(ficheros.deXlsx), ficheros.pegado);

/* ================= 3. EL CUADRO ================= */
console.log('--- 3. el cuadro ---');
await pagina.evaluate(() => { window.__marcados = null; Relacionados.elegirVarios({ titulo: 'Prueba' }).then((m) => { window.__marcados = m; }); });
await pagina.waitForSelector('#rel-pegar');
await comprobar('3. junto a los atajos hay «Pegar una lista»', pagina.locator('#rel-pegar').textContent(), 'Pegar una lista');
await pagina.click('#rel-pegar');
await comprobar('3. el cuadro dice qué pegar y ofrece el fichero',
  pagina.evaluate(() => [document.querySelector('label[for=lp-texto]').textContent, document.querySelector('label[for=lp-fichero]').textContent, document.getElementById('lp-categoria').value]),
  ['Pega aquí la lista: una persona por línea.', 'o elige un fichero', 'ALUMNADO']);
const cuatro = 'Alumno/a\nAguilar Ponce, Marina\nPablo Aguilar Ponce\nbermudez ortiz, alvaro\nKlein Soto Ana';
await pagina.fill('#lp-texto', cuatro);
await pagina.click('#lp-reconocer');
await comprobar('3. cuatro alumnos: «Reconocidas (4)», sin dudosas ni no encontradas',
  pagina.evaluate(() => [Array.from(document.querySelectorAll('.lp-apartado h4')).map((h) => h.textContent)]), [['Reconocidas (4)']]);
await pagina.fill('#lp-texto', cuatro + '\nPerez Nadie, Juan\nSoler Vega, Adrián');
await pagina.click('#lp-reconocer');
await comprobar('3. con uno que no existe y los tocayos: los tres apartados con su cuenta',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.lp-apartado h4')).map((h) => h.textContent)), ['Reconocidas (4)', 'Hay que elegir (1)', 'No encontradas (1)']);
await comprobar('3. «No encontradas» con «Copiar», y «Hay que elegir» con los dos y «Ninguna»',
  pagina.evaluate(() => [!!document.getElementById('lp-copiar'), document.querySelectorAll('.lp-candidata').length, document.querySelector('.lp-ninguna').textContent,
    getComputedStyle(document.querySelector('.lp-no')).borderTopColor !== getComputedStyle(document.querySelector('.lp-dudosas')).borderTopColor]), [true, 2, 'Ninguna', true]);
await comprobar('3. el botón avisa de la que queda sin elegir', pagina.evaluate(() => [document.getElementById('lp-senalar').textContent, document.querySelector('.lp-pie .nota').textContent]), ['Señalar las 4', 'Una sin elegir se queda fuera.']);
await pagina.click('.lp-candidata:nth-of-type(1)');
await comprobar('3. pulsar un tocayo lo pasa a «Reconocidas (5)»', pagina.evaluate(() => Array.from(document.querySelectorAll('.lp-apartado h4')).map((h) => h.textContent)), ['Reconocidas (5)', 'No encontradas (1)']);
await pagina.click('.lp-marca >> nth=0');
await comprobar('3. se puede quitar la marca a una: «Señalar las 4»', pagina.locator('#lp-senalar').textContent(), 'Señalar las 4');
await pagina.click('#lp-senalar');
await comprobar('3. el cuadro se cierra y están señaladas, con su chip',
  pagina.evaluate(() => [!document.querySelector('.lp-cuadro'), document.querySelectorAll('.marcado-chip').length, document.querySelector('.marcados-cuenta').textContent]), [true, 4, '4 señalados']);
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Ibarra Nieto, Sara\nAguilar Ponce, Pablo');
await pagina.click('#lp-reconocer');
await pagina.click('#lp-senalar');
await comprobar('3. se suman a las que ya había (una repetida no cuenta dos veces)', pagina.locator('.marcados-cuenta').textContent(), '5 señalados');
await comprobar('3. «Usar los N señalados» sigue como siempre', pagina.locator('#rel-marcados-anadir').textContent(), 'Añadir los 5 señalados');

/* Guardar como grupo. */
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Klein Soto, Ana\nJimenez Rubio, Mateo');
await pagina.click('#lp-reconocer');
await comprobar('3. «Guardar también como grupo» sale sin marcar y con el nombre apagado',
  pagina.evaluate(() => [document.getElementById('lp-guardar-si').checked, document.getElementById('lp-guardar-nombre').disabled]), [false, true]);
await pagina.check('#lp-guardar-si');
await pagina.fill('#lp-guardar-nombre', 'Transporte de prueba');
await pagina.click('.lp-marca >> nth=1');   /* repintar no pierde el nombre del grupo */
await comprobar('3. el nombre del grupo sobrevive a repintar', pagina.inputValue('#lp-guardar-nombre'), 'Transporte de prueba');
await pagina.click('.lp-marca >> nth=1');
await pagina.click('#lp-senalar');
await pagina.waitForTimeout(400);
await comprobar('3. se crea un grupo propio con esas personas',
  pagina.evaluate(() => Grupos.lista().filter((g) => g.nombre === 'Transporte de prueba').map((g) => g.miembros.map((m) => m.categoria + '|' + m.nombre.replace(/ \d+$/, '')))),
  [['ALUMNADO|Klein Soto, Ana', 'ALUMNADO|Jimenez Rubio, Mateo']]);
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Lara Quintero, Bruno');
await pagina.click('#lp-reconocer');
await pagina.check('#lp-guardar-si');
await pagina.fill('#lp-guardar-nombre', 'transporte de prueba');
await pagina.click('#lp-senalar');
await comprobar('3. con un nombre que ya existe, pregunta si lo sustituye y no cierra', pagina.evaluate(() => [!!document.querySelector('.lp-cuadro'), document.querySelector('#lp-sustituir').textContent.indexOf('Ya hay un grupo') === 0]), [true, true]);
await pagina.click('#lp-sustituir-si');
await pagina.waitForTimeout(400);
await comprobar('3. al sustituirlo queda un solo grupo con ese nombre y sus miembros nuevos',
  pagina.evaluate(() => Grupos.lista().filter((g) => g.nombre === 'Transporte de prueba').map((g) => g.miembros.length)), [1]);
await pagina.click('#cuadro-cancelar');

/* ================= 4. NUEVO ASUNTO ================= */
console.log('--- 4. «Nuevo asunto» ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(500);
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Klein Soto, Ana\nJimenez Rubio, Mateo\nLara Quintero, Bruno');
await pagina.click('#lp-reconocer');
await pagina.check('#lp-guardar-si');
await pagina.fill('#lp-guardar-nombre', 'Los de la actividad');
await pagina.click('#lp-senalar');
await pagina.waitForTimeout(400);
await comprobar('4. «Usar los 3 señalados»', pagina.locator('#rel-marcados-anadir').textContent(), 'Usar los 3 señalados');
await pagina.click('#rel-marcados-anadir');
await comprobar('4. el nombre del grupo sale relleno con el del grupo guardado', pagina.inputValue('#grupo-nombre'), 'Los de la actividad');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('4. origen «lista»',
  pagina.evaluate(() => [App.E.nuevo.tercero.grupoDatos.origen, App.E.nuevo.tercero.grupoDatos.nombre, App.E.nuevo.tercero.grupoDatos.marcados.length]), ['lista', 'Los de la actividad', 3]);
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(400);
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Klein Soto, Ana\nJimenez Rubio, Mateo');
await pagina.click('#lp-reconocer');
await pagina.click('#lp-senalar');
await pagina.click('#rel-marcados-anadir');
await comprobar('4. sin guardar el grupo, el nombre sale vacío y es obligatorio', pagina.evaluate(() => [document.getElementById('grupo-nombre').value, document.getElementById('cuadro-aceptar').disabled]), ['', true]);
await pagina.click('#cuadro-cancelar');

/* ================= 5. + AÑADIR PERSONAS ================= */
console.log('--- 5. «+ Añadir personas» ---');
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1800);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-tabla');
const filasAntes = await pagina.locator('.pg-tabla tbody tr').count();
await pagina.click('.pg-anadir');
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Klein Soto, Ana\nLara Quintero, Bruno\nOrtega Paz, Darío');
await pagina.click('#lp-reconocer');
await comprobar('5. «+ Añadir personas» → «Pegar una lista»: tres reconocidas', pagina.locator('.lp-ok h4').textContent(), 'Reconocidas (3)');
await pagina.click('#lp-senalar');
await pagina.click('#rel-marcados-anadir');
await pagina.waitForTimeout(1500);
await comprobar('5. las que no estaban entran en la tabla (Ortega ya estaba)',
  pagina.evaluate(() => document.querySelectorAll('.pg-tabla tbody tr').length), filasAntes + 1);

await comprobar('6. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
