/* Fila 711, docs/711-DATOS-INVENTADOS-GRANDES.md: el juego GRANDE de datos inventados (`?demo=1&auto=1&grande=1`):
   hay los alumnos y asuntos esperados, cada caso raro de docs/CASOS-DE-PRUEBA.md se encuentra por su nombre, entra
   en pocos segundos, y sin `grande=1` todo sigue como hoy. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function entrar(query) {
  const pagina = await navegador.newPage();
  const errores = [];
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
  const t0 = Date.now();
  await pagina.goto(BASE + query);
  await pagina.waitForSelector('#franja-demo', { timeout: 120000 });
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 120000 });
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila', { timeout: 60000 });
  return { pagina, errores, segundos: (Date.now() - t0) / 1000 };
}

/* ---- con grande=1 ---- */
const g = await entrar('?demo=1&auto=1&grande=1');
const p = g.pagina;
const datos = await p.evaluate(async () => {
  const texto = await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv');
  return { alumnos: texto.split(/\r?\n/).filter(Boolean).length - 1, resumen: Demo.grande.resumen, regAlum: texto };
});
comprobar('hay unos 700 alumnos en RegAlum.csv', datos.alumnos >= 700, true);
comprobar('hay asuntos abiertos y cerrados del tamaño pedido', [datos.resumen.abiertos >= 40, datos.resumen.cerrados >= 400], [true, true]);
comprobar('entra en pocos segundos (menos de 40 s en la máquina de pruebas)', g.segundos < 40, true);
comprobar('Inicio muestra muchos asuntos abiertos', (await p.locator('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila').count()) >= 40, true);

/* Cada caso de personas de docs/CASOS-DE-PRUEBA.md está en el listado, por su nombre. */
const casos = readFileSync(new URL('../docs/CASOS-DE-PRUEBA.md', import.meta.url), 'utf8');
const nombres = ['Homónimo Primero, Antonio', 'de la Cruz del Río, Mª Carmen', 'del Valle y de la Peña, Íñigo', 'Muñoz Peña, Ñusta Núñez',
  'Caso Nombrelargo Dosapellidos', 'Sinnúmero Escolar, Aspirante', 'Cambiado de Grupo, Leo', 'Bajademediocurso Ruiz, Pilar',
  'Custodia Compartida, Hugo', 'Custodia Dudosa, Vera', 'Sin Custodia Dicha, Noa'];
for (const n of nombres) {
  comprobar('el caso «' + n + '» está en el listado y en CASOS-DE-PRUEBA.md', [datos.regAlum.indexOf(n) !== -1, casos.indexOf(n) !== -1], [true, true]);
}
comprobar('los dos homónimos son dos filas', datos.regAlum.split('Homónimo Primero, Antonio').length - 1, 2);

/* Los casos de asuntos y de terceros. */
const asuntos = await p.evaluate(async () => {
  const fichas = Object.values(App.E.registro.asuntos || {});
  const por = (t) => fichas.filter((f) => (f.descripcion || '') === t).length;
  const homonimo = fichas.filter((f) => (f.tercero || '').indexOf('Homónimo Primero') !== -1).length;
  const doc = Object.keys(App.E.registro.asuntos || {}).filter((k) => App.E.registro.asuntos[k].descripcion === 'CASO 50 DOCUMENTOS')[0];
  let docs = 0;
  if (doc) { const c = await App.E.abiertos.getDirectoryHandle(doc); for await (const [n] of c.entries()) if (/\.pdf$/.test(n)) docs++; }
  const empresas = await Carpetas.leerTexto(App.E.datos, 'empresas.csv');
  const tutores = await Carpetas.leerTexto(App.E.datos, 'tutores.csv');
  return { anterior: por('CASO CURSO ANTERIOR'), vencido: por('CASO VENCIDO'), homonimo, docs, nifRepetido: empresas.split('B20000001').length - 1,
    dni: tutores.indexOf('12345678Z') !== -1, nie: tutores.indexOf('X1234567L') !== -1, pasaporte: tutores.indexOf('PA1234567') !== -1 };
});
comprobar('hay un asunto del curso anterior y uno vencido', [asuntos.anterior, asuntos.vencido], [1, 1]);
comprobar('hay varios asuntos del mismo tercero (parada de duplicados)', asuntos.homonimo >= 8, true);
comprobar('hay un asunto con 50 documentos', asuntos.docs, 50);
comprobar('hay un NIF repetido entre dos empresas', asuntos.nifRepetido, 2);
comprobar('hay tutores con DNI, NIE y pasaporte', [asuntos.dni, asuntos.nie, asuntos.pasaporte], [true, true, true]);

/* El Archivo ofrece tres cursos con asuntos cerrados. */
await p.click('.pestana[data-pantalla="archivo"]');
await p.waitForSelector('#lista-archivo .tarjeta', { timeout: 60000 });
comprobar('el Archivo ofrece al menos tres cursos', (await p.locator('#selector-curso-archivo option').count()) >= 4, true);

/* Nuevo asunto: el buscador de personas responde con tanta gente. */
await p.click('.pestana[data-pantalla="nuevo"]');
await p.fill('#buscar-tercero', 'Homónimo');
await p.waitForSelector('#resultados-tercero .resultado', { timeout: 20000 });
comprobar('el buscador de personas encuentra los dos homónimos', (await p.locator('#resultados-tercero .resultado').count()) >= 2, true);
comprobar('sin errores de consola con grande=1', g.errores, []);
await p.close();

/* ---- sin grande=1: la demostración de siempre ---- */
const s = await entrar('?demo=1&auto=1');
const pequena = await s.pagina.evaluate(async () => ({
  grande: typeof Demo.grande,
  alumnos: (await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv')).split(/\r?\n/).filter(Boolean).length - 1
}));
comprobar('sin grande=1 no existe Demo.grande', pequena.grande, 'undefined');
comprobar('sin grande=1 el listado es el pequeño de siempre (menos de 40 alumnos)', pequena.alumnos < 40, true);
comprobar('sin errores de consola sin grande=1', s.errores, []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de demo-grande pasan.');
process.exit(fallos ? 1 : 0);
