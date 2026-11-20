/* Fila 722 (docs/722-DATOS-POR-PERSONA-EN-LA-LISTA.md): datos propios de cada persona, sacados de las columnas de la lista
   pegada para formar el grupo. Chromium real con la copia de pruebas (?demo=1&auto=1), en el asunto «GRUPO 2ºB».

   1. `ListaPegada.reconocer`: con cabecera saca las columnas (sin la que reconoce a la persona) y los datos de cada una;
      una columna repetida se ignora; sin cabecera no hay columnas; el cuadro lo dice.
   2. «+ Añadir personas» → «Pegar una lista» con cabecera: el cuadro nombra las columnas y, al añadir, quedan guardadas.
   3. Cada persona lleva su valor en `{campo:Columna}` (valores de persona y texto relleno); a quien le falta, queda vacío.
   4. El editor ofrece el grupo «De la lista del asunto» con las columnas del tipo.
   5. Volver a pegar con un valor cambiado: solo cambia el de esa persona; una persona que cambia de nombre conserva su dato;
      el asunto renombrado conserva sus columnas.
   6. La casilla «Estos documentos se registran en Séneca»: con un clic normal se desmarca y se queda desmarcada.
   7. Sin errores en la consola. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
const ordenado = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((c) => [c, v[c]])) : v));
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = ordenado(real) === ordenado(esperado);
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
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3500);

console.log('--- 1. reconocer ---');
const r1 = await pagina.evaluate(async () => {
  const por = { ALUMNADO: (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista };
  const a = por.ALUMNADO.filter((p) => p.matriculado)[0], b = por.ALUMNADO.filter((p) => p.matriculado)[1];
  const t = 'Nº escolar\tNombre\tNúmero título\tFecha de recogida\tnumero titulo\n' + a.id + '\t' + a.nombre + '\tT-1\t\tx\n' + b.id + '\t\tT-2\t5/12\t';
  const r = ListaPegada.reconocer(t, por, 'ALUMNADO');
  const s = ListaPegada.reconocer(a.id + '\n' + b.id, por, 'ALUMNADO');
  return { columnas: r.columnas, repetidas: r.repetidas, datos: r.encontradas.map((e) => e.datos), sinCabecera: s.columnas,
    textoCon: ListaPegada.textoDeColumnas({ cabecera: r.cabecera, columnas: r.columnas, repetidas: r.repetidas }),
    textoSin: ListaPegada.textoDeColumnas({ cabecera: '', columnas: [], repetidas: [] }) };
});
await comprobar('1. columnas de datos (sin la que reconoce) y la repetida aparte', Promise.resolve([r1.columnas, r1.repetidas]), [['Número título', 'Fecha de recogida'], ['numero titulo']]);
await comprobar('1. el valor de cada persona bajo su columna (lo vacío no cuenta)', Promise.resolve(r1.datos), [{ 'Número título': 'T-1' }, { 'Número título': 'T-2', 'Fecha de recogida': '5/12' }]);
await comprobar('1. sin cabecera no hay columnas', Promise.resolve(r1.sinCabecera), []);
await comprobar('1. el cuadro dice qué columnas se guardan', Promise.resolve(r1.textoCon), 'Se guardan estas columnas: Número título, Fecha de recogida. Repetida, se ignora: numero titulo.');
await comprobar('1. y que sin cabecera no se guardan', Promise.resolve(r1.textoSin), 'Sin cabecera no se guardan columnas.');

console.log('--- 2. pegar con cabecera en «+ Añadir personas» ---');
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1800);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-tabla');
const dos = await pagina.evaluate(async (n) => {
  const rel = App.E.registro.asuntos[n].relacionados;
  const nuevos = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista.filter((p) => p.matriculado && !rel.some((r) => r.nombre === App.textoTercero(p))).slice(0, 2);
  return { rel: rel.slice(0, 2).map((r) => r.nombre), nuevos: nuevos.map((p) => ({ id: p.id, nombre: App.textoTercero(p) })) };
}, demo);
const lista = 'Nº escolar\tTítulo nº\tRecogida\n' + dos.nuevos.map((p, i) => p.id + '\tT-' + (i + 1) + '\t' + (i ? '' : '5/12')).join('\n');
await pagina.click('.pg-anadir');
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', lista);
await pagina.click('#lp-reconocer');
await comprobar('2. el cuadro nombra las columnas', pagina.locator('.lp-columnas').textContent(), 'Se guardan estas columnas: Título nº, Recogida.');
await pagina.click('#lp-senalar');
await pagina.click('#rel-marcados-anadir');
await pagina.waitForTimeout(2000);
const guardado = () => pagina.evaluate(([n, c, nom]) => ({ columnas: DatosDeLista.columnasDe(n), datos: DatosDeLista.de(n, c, nom) }), [demo, 'ALUMNADO', dos.nuevos[0].nombre]);
await comprobar('2. quedan guardadas las columnas y el valor de la primera persona', guardado(), { columnas: ['Número de título', 'Título nº', 'Recogida'], datos: { 'Título nº': 'T-1', Recogida: '5/12' } });
await comprobar('2. la segunda no tiene «Recogida»', pagina.evaluate(([n, nom]) => DatosDeLista.de(n, 'ALUMNADO', nom), [demo, dos.nuevos[1].nombre]), { 'Título nº': 'T-2' });
await comprobar('2. el fichero de datos está en _GESTOR', pagina.evaluate(async () => !!(await Carpetas.leerJson(App.E.gestor, 'datos-de-lista.json'))), true);

console.log('--- 3. cada persona lleva el suyo ---');
const tres = await pagina.evaluate(async ([n, nom1, nom2, ya]) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
  const salida = {};
  for (const [k, nom] of [['p1', nom1], ['p2', nom2], ['ya', ya]]) {
    const v = await Plantillas.valoresDePersona(a, { categoria: 'ALUMNADO', nombre: nom }, { fecha: U.hoyIso() });
    salida[k] = Plantillas.rellenar('{campo:Título nº}|{campo:Recogida}', v).texto;
  }
  return salida;
}, [demo, dos.nuevos[0].nombre, dos.nuevos[1].nombre, dos.rel[0]]);
await comprobar('3. el texto sale con el valor de cada persona; a quien le falta, el hueco queda sin valor', Promise.resolve([tres.p1, tres.p2, tres.ya]), ['T-1|5/12', 'T-2|', '|']);
const demoCol = await pagina.evaluate((n) => { const f = App.E.registro.asuntos[n].relacionados; return [DatosDeLista.de(n, f[0].categoria, f[0].nombre), DatosDeLista.de(n, f[f.length - 1].categoria, f[f.length - 1].nombre)]; }, demo);
await comprobar('3. la demostración trae «Número de título» para todas menos Vera (la última)', Promise.resolve([demoCol[0]['Número de título'] || '', demoCol[1]['Número de título'] || '']), ['T-26-101', '']);

console.log('--- 4. el editor ---');
await comprobar('4. «De la lista del asunto» ofrece las columnas del tipo',
  pagina.evaluate((n) => {
    const tipo = App.E.registro.asuntos[n].tipo;
    return CamposLista.deLista(DatosDeLista.columnasDeTipo(tipo)).map((c) => c.grupo + ': ' + c.marca);
  }, demo), ['De la lista del asunto: {campo:Número de título}', 'De la lista del asunto: {campo:Título nº}', 'De la lista del asunto: {campo:Recogida}']);

console.log('--- 5. volver a pegar, cambiar de nombre ---');
await pagina.evaluate(async ([n, nuevos]) => {
  await DatosDeLista.poner(n, { columnas: ['Título nº'], personas: [{ categoria: 'ALUMNADO', nombre: nuevos[0].nombre, datos: { 'Título nº': 'T-9' } }] });
}, [demo, dos.nuevos]);
await comprobar('5. solo cambia el valor de esa persona (y lo suyo de otra columna sigue)', pagina.evaluate(([n, a, b]) => [DatosDeLista.de(n, 'ALUMNADO', a), DatosDeLista.de(n, 'ALUMNADO', b)], [demo, dos.nuevos[0].nombre, dos.nuevos[1].nombre]),
  [{ 'Título nº': 'T-9', Recogida: '5/12' }, { 'Título nº': 'T-2' }]);
await pagina.evaluate(async ([n, viejo]) => { await DatosDeLista.alRenombrarPersona(n, 'ALUMNADO', viejo, viejo + ' NUEVO'); }, [demo, dos.nuevos[0].nombre]);
await comprobar('5. una persona que cambia de nombre conserva su dato', pagina.evaluate(([n, a]) => [DatosDeLista.de(n, 'ALUMNADO', a), DatosDeLista.de(n, 'ALUMNADO', a + ' NUEVO')], [demo, dos.nuevos[0].nombre]),
  [{}, { 'Título nº': 'T-9', Recogida: '5/12' }]);
await pagina.evaluate(async (n) => { await DatosDeLista.alMoverAsunto(n, n + ' BIS'); }, demo);
await comprobar('5. el asunto renombrado conserva sus columnas', pagina.evaluate((n) => [DatosDeLista.columnasDe(n), DatosDeLista.columnasDe(n + ' BIS')], demo),
  [[], ['Número de título', 'Título nº', 'Recogida']]);

console.log('--- 5b. «Nuevo asunto» → grupo con la lista pegada ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(500);
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#rel-pegar');
await pagina.fill('#lp-texto', 'Alumno/a\tNota\nKlein Soto, Ana\t7\nJimenez Rubio, Mateo\t9\nLara Quintero, Bruno\t');
await pagina.click('#lp-reconocer');
await comprobar('5b. el cuadro nombra la columna', pagina.locator('.lp-columnas').textContent(), 'Se guardan estas columnas: Nota.');
await pagina.click('#lp-senalar');
await pagina.click('#rel-marcados-anadir');
await pagina.fill('#grupo-nombre', 'Los de la nota');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
const nuevo = await pagina.evaluate(async () => {
  const t = App.E.nuevo.tercero;
  for (const f of Gestor.alCrearAsunto) { try { await f('ASUNTO DE PRUEBA 722', {}, t); } catch (e) { /* los de otros módulos pueden no aplicar */ } }
  const n = 'ASUNTO DE PRUEBA 722';
  return { columnas: DatosDeLista.columnasDe(n), a: DatosDeLista.de(n, 'ALUMNADO', t.grupoDatos.marcados[0].nombre), c: DatosDeLista.de(n, 'ALUMNADO', t.grupoDatos.marcados[2].nombre) };
});
await comprobar('5b. al crear, quedan las columnas y cada persona con su valor (la que no trae, sin él)', Promise.resolve(nuevo), { columnas: ['Nota'], a: { Nota: '7' }, c: {} });

console.log('--- 6. la casilla del registro, con un clic ---');
await pagina.evaluate(async (n) => { await App.anotar(n + ' BIS', {}); }, demo).catch(() => {});
const nombreAsunto = demo;
await pagina.reload();
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3500);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), nombreAsunto);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1800);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-registro-por');
console.log('   (de partida, sin tocar: marcada = ' + (await pagina.locator('.pg-registro-por').isChecked()) + ', deshabilitada = ' + (await pagina.locator('.pg-registro-por').isDisabled()) + ')');
if (!(await pagina.locator('.pg-registro-por').isChecked())) { await pagina.locator('.pg-registro-por').click(); await pagina.waitForTimeout(1500); }
await comprobar('6. marcada', pagina.locator('.pg-registro-por').isChecked(), true);
const cuenta = async () => Number(((await pagina.locator('.pg-enviar').textContent()) || '').replace(/\D+/g, '') || 0);
const conRegistro = await cuenta();
await pagina.locator('.pg-registro-por').click();
await pagina.waitForTimeout(1500);
await comprobar('6. con un clic se desmarca y se queda desmarcada', pagina.locator('.pg-registro-por').isChecked(), false);
await pagina.waitForTimeout(2500);
await comprobar('6. y sigue desmarcada tras repintarse', pagina.locator('.pg-registro-por').isChecked(), false);
const sinRegistro = await cuenta();
await comprobar('6. «Enviar…» deja enviar al menos los mismos documentos, y está activo', Promise.resolve([sinRegistro >= conRegistro, sinRegistro > 0, await pagina.locator('.pg-enviar').isEnabled()]), [true, true, true]);
console.log('   (Enviar… con la casilla marcada: ' + conRegistro + '; desmarcada: ' + sinRegistro + ')');

await comprobar('7. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
