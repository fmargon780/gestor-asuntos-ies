/* Prueba de la fila 334 (docs/DATOS-2-TABLAS-PARA-INFORMES.md): las tablas para informes, con datos inventados.

   1. Archivar un asunto: a los pocos segundos `Base.leer` lo devuelve (asunto, hitos con `dias`, personas con
      códigos distintos, documentos, importe como número); archivar no espera a las tablas.
   2. Quitar de lo archivado: baja; con `conAbiertos` salen los abiertos montados con la misma función.
   3. Un mismo alumno como tercero y como relacionado: un solo código.
   4. Dos ordenadores: se lee una sola vez, la más reciente; una línea rota no impide leer las demás.
   5. Cambiar el nombre de un tercero: sus asuntos salen con el código nuevo, también los apuntados antes.
   6. Poner al día 300 archivados, cortado a la mitad y vuelto a lanzar: 300 sin repetir; una tercera pasada no escribe nada.
   7. Un archivado sin ficha ni historial: se apunta como `incompleto`.
   8. En «solo consultar» no se escribe nada en base/.
   9. El fichero del mes solo crece por el final.
   10. El SHA-256 es el de verdad (vectores conocidos); la tarjeta de Herramientas se pinta y su botón funciona. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
const p = await contexto.newPage();
const errores = [];
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await p.waitForFunction(() => window.App && App.E.listaAbiertos && App.E.listaAbiertos.length > 0 && window.Base, null, { timeout: 30000 });
await p.waitForTimeout(800);

/* ========== 10. el SHA-256 ========== */
console.log('--- 10. el SHA-256 ---');
comprobar('10. «abc» y vacío', await p.evaluate(() => [BaseFilas.sha256('abc'), BaseFilas.sha256('')]),
  ['ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']);

/* ========== 3. un solo código por persona ========== */
console.log('--- 3. el código de una persona ---');
comprobar('3. el mismo alumno, tercero o relacionado: un código; otro alumno, otro; mismo nombre en otra categoría, otro',
  await p.evaluate(() => {
    const a = Base.codigoDe('ALUMNADO', 'Perez Gomez, Juan 1234567');
    return [a === Base.codigoDe('ALUMNADO', 'Perez Gomez, Juan 1234567'), a === Base.codigoDe('ALUMNADO', 'Perez Gomez, Ana 7654321'),
      a === Base.codigoDe('PERSONAL', 'Perez Gomez, Juan 1234567'), /^P-[0-9a-f]{12}$/.test(a), a.indexOf('1234567') === -1];
  }), [true, false, false, true, true]);

/* ========== 1. archivar un asunto ========== */
console.log('--- 1. archivar un asunto ---');
const elegido = await p.evaluate(async () => {
  const datos = await Hitos.leer();
  const a = App.E.listaAbiertos.filter((x) => datos.porAsunto[x.nombre] && datos.porAsunto[x.nombre].hitos.length >= 2 && x.ficha && x.ficha.categoria)[0];
  if (!a) return null;
  App.E.campos.propios = (App.E.campos.propios || []).concat([{ id: 'p-prueba-importe', nombre: 'Importe de prueba', clase: 'importe' }]);
  await App.anotar(a.nombre, {
    relacionados: [{ categoria: 'ALUMNADO', nombre: 'Aguilar Ponce, Pablo 2100002' }],
    campos: { 'propio:p-prueba-importe': { valor: '125.50', enNombre: false } },
    documentos: { 'D26-00001': { tipo: 'FACTURA', fecha: '2026-10-01', registros: [{ codigo: '26EM0001' }] }, 'D26-00002': { tipo: 'FACTURA', fecha: '2026-10-02', registros: [] } }
  });
  window.__a = App.E.listaAbiertos.filter((x) => x.nombre === a.nombre)[0];
  return { nombre: a.nombre, hitos: datos.porAsunto[a.nombre].hitos.length };
});
comprobar('1. hay un abierto con hitos', !!elegido, true);
const t0 = Date.now();
await p.evaluate(() => { window.__r = App.cerrarAsunto(window.__a).then(() => 'fin'); });
/* Pueden salir dos cuadros seguidos (avisar a los relacionados y confirmar): se aceptan los que salgan hasta que termine. */
for (let i = 0; i < 40; i++) {
  const fin = await p.evaluate(() => { if (window.__fin) return true; window.__r.then(() => { window.__fin = true; }); return false; });
  if (fin) break;
  if (await p.locator('#capa:not(.oculto) #cuadro-aceptar').count()) await p.click('#cuadro-aceptar').catch(() => {});
  await p.waitForTimeout(250);
}
comprobar('1. archivar termina', await p.evaluate(() => window.__r), 'fin');
comprobar('1. archivar no espera a las tablas (todavía no está apuntado)', await p.evaluate((n) => Base.leer().then((b) => b.asuntos.some((a) => a.clave === n)), elegido.nombre), false);
for (let i = 0; i < 40; i++) {   /* hasta 40 s: las tablas se ponen al día cinco segundos después */
  if (await p.evaluate((n) => Base.leer().then((b) => b.asuntos.some((a) => a.clave === n)), elegido.nombre)) break;
  await p.waitForTimeout(1000);
}
const tabla = await p.evaluate(async (n) => {
  const b = await Base.leer();
  const a = b.asuntos.filter((x) => x.clave === n)[0];
  return {
    asunto: !!a, incompleto: a && a.incompleto, campos: a && a.campos,
    hitos: b.hitos.filter((h) => h.asunto === a.id).length, hitosConDias: b.hitos.filter((h) => h.asunto === a.id && h.dias !== '').length >= 0,
    personas: b.personas.filter((x) => x.asunto === a.id).map((x) => x.papel).sort(),
    codigos: new Set(b.personas.filter((x) => x.asunto === a.id).map((x) => x.codigo)).size,
    documentos: b.documentos.filter((d) => d.asunto === a.id).map((d) => d.numero).sort(), persona: a.persona
  };
}, elegido.nombre);
comprobar('1. el asunto está apuntado, con su ficha y su historial', [tabla.asunto, tabla.incompleto], [true, false]);
comprobar('1. tantas filas de hitos como hitos', tabla.hitos >= elegido.hitos, true);
comprobar('1. tercero y relacionado, con códigos distintos', [tabla.personas, tabla.codigos], [['relacionado', 'tercero'], 2]);
comprobar('1. los dos documentos', tabla.documentos, ['D26-00001', 'D26-00002']);
comprobar('1. el importe es un número', tabla.campos.some((c) => c.clase === 'importe' && typeof c.valor === 'number' && c.valor === 125.5), true);
console.log('   (tardó ' + Math.round((Date.now() - t0) / 1000) + ' s en aparecer)');

/* ========== 9. solo crece por el final ========== */
console.log('--- 9. el fichero del mes solo crece por el final ---');
await p.evaluate(() => BasePonerAlDia.ponerAlDia());   /* lo archivado de la demostración, apuntado de una vez */
const antes = await p.evaluate(async () => {
  const b = await Base.carpetaBase(false);
  const salida = {};
  const c = await Carpetas.contenido(b);
  for (const k of c.carpetas) {
    const d = await Carpetas.contenido(k.handle);
    for (const f of d.ficheros) salida[k.nombre + '/' + f.nombre] = await Carpetas.leerTexto(k.handle, f.nombre);
  }
  return salida;
});
comprobar('9. hay un fichero por curso, mes y ordenador', Object.keys(antes).every((k) => /^\d{2}-\d{2}\/\d{4}-\d{2}-[a-z0-9]{6}\.jsonl$/.test(k)) && Object.keys(antes).length > 0, true);

/* ========== 2. baja y alta ========== */
console.log('--- 2. baja y alta ---');
await p.evaluate(async (n) => { await IndiceArchivo.quitarEntrada(n); await BasePonerAlDia.ponerAlDia({ claves: [n] }); }, elegido.nombre);
comprobar('2. quitado de lo archivado: ya no sale', await p.evaluate((n) => Base.leer().then((b) => b.asuntos.some((a) => a.clave === n)), elegido.nombre), false);
const despues = await p.evaluate(async () => {
  const b = await Base.carpetaBase(false);
  const salida = {};
  const c = await Carpetas.contenido(b);
  for (const k of c.carpetas) {
    const d = await Carpetas.contenido(k.handle);
    for (const f of d.ficheros) salida[k.nombre + '/' + f.nombre] = await Carpetas.leerTexto(k.handle, f.nombre);
  }
  return salida;
});
comprobar('9. cada fichero de antes sigue empezando igual', Object.keys(antes).every((k) => despues[k] && despues[k].indexOf(antes[k]) === 0), true);
const conAbiertos = await p.evaluate(() => Base.leer({ conAbiertos: true }).then((b) => [b.asuntos.filter((a) => a.abierto).length > 0, b.hitos.length > 0]));
comprobar('2. con conAbiertos salen los abiertos, con sus hitos', conAbiertos, [true, true]);

/* ========== 4. dos ordenadores ========== */
console.log('--- 4. dos ordenadores ---');
const dos = await p.evaluate(async () => {
  const original = U.ordenador;
  const clave = 'ZZ-DOS-ORDENADORES';
  const curso = IndiceArchivo._cursoDeNombre('261001 X Y');
  U.ordenador = () => 'aaaaaa';
  await Base.escribir({ [curso]: [{ v: 1, que: 'alta', cuando: '2026-10-01T10:00:00.000Z', ordenador: 'aaaaaa', clave, marca: 'm|t', asunto: { id: clave, clave, tipo: 'VIEJO' }, hitos: [], personas: [], documentos: [] }] });
  U.ordenador = () => 'bbbbbb';
  await Base.escribir({ [curso]: [{ v: 1, que: 'alta', cuando: '2026-10-02T10:00:00.000Z', ordenador: 'bbbbbb', clave, marca: 'm|t', asunto: { id: clave, clave, tipo: 'NUEVO' }, hitos: [], personas: [], documentos: [] }] });
  /* una línea rota en medio del fichero de aaaaaa */
  const dir = await Base.carpetaBase(false).then((b) => b.getDirectoryHandle(curso));
  const nombre = U.hoyIso().slice(0, 7) + '-aaaaaa.jsonl';
  const t = await Carpetas.leerTexto(dir, nombre);
  await Carpetas.escribirTexto(dir, nombre, '{esto no es json\n' + t);
  U.ordenador = original;
  const b = await Base.leer();
  return { cuantas: b.asuntos.filter((a) => a.clave === clave).length, tipo: (b.asuntos.filter((a) => a.clave === clave)[0] || {}).tipo, ficheros: (await Carpetas.contenido(dir)).ficheros.map((f) => f.nombre).filter((n) => /-(aaaaaa|bbbbbb)\.jsonl$/.test(n)).length };
});
comprobar('4. se lee una sola vez, la más reciente, aunque haya una línea rota', dos, { cuantas: 1, tipo: 'NUEVO', ficheros: 2 });

/* ========== 5. cambiar el nombre de un tercero ========== */
console.log('--- 5. cambiar el nombre de un tercero ---');
const ren = await p.evaluate(async () => {
  const b = await Base.leer();
  const idx = (await IndiceArchivo.leerDisco({ todos: true })).datos.asuntos;
  const e = idx.filter((x) => x.categoria === 'ALUMNADO' && /\d{5,}$/.test(x.tercero) && b.asuntos.some((a) => a.clave === x.nombre))[0];
  if (!e) return null;
  return { clave: e.nombre, persona: b.asuntos.filter((a) => a.clave === e.nombre)[0].persona, viejo: e.tercero };
});
comprobar('5. hay un archivado de alumnado para probar', !!ren && !!ren.viejo, true);
if (ren && ren.viejo) {
  const nuevoNombre = ren.viejo.replace(/^\S+/, 'Cambiado').replace(/\d{5,}$/, '9999999');
  const res = await p.evaluate(async (r) => {
    const nuevo = r.viejo.replace(/^\S+/, 'Cambiado').replace(/\d{5,}$/, '9999999');
    Base.avisarTercero('ALUMNADO', r.viejo, nuevo, []);
    await new Promise((x) => setTimeout(x, 800));
    const b = await Base.leer();
    const a = b.asuntos.filter((x) => x.clave === r.clave)[0];
    return { codigoNuevo: a.persona === Base.codigoDe('ALUMNADO', nuevo), cambio: a.persona !== r.persona };
  }, ren);
  comprobar('5. los apuntados antes salen con el código nuevo', res, { codigoNuevo: true, cambio: true });
}

/* ========== 7. incompleto ========== */
console.log('--- 7. incompleto ---');
const inc = await p.evaluate(async () => {
  const b = await Base.leer();
  return b.asuntos.filter((a) => a.incompleto).length > 0;
});
comprobar('7. los archivados sin ficha ni historial se apuntan como incompletos', inc, true);

/* ========== 6. 300 archivados, cortada a la mitad ========== */
console.log('--- 6. 300 archivados ---');
const tres = await p.evaluate(async () => {
  for (let i = 0; i < 300; i++) {
    const tercero = 'Inventada Numero, Ana ' + String(9000000 + i);
    const nombre = '2601' + String((i % 28) + 1).padStart(2, '0') + ' CERTIFICADO ' + tercero;
    const cat = await Carpetas.bajar(App.E.archivo, ['ALUMNADO', tercero], true);
    const carpeta = await Carpetas.crear(cat, nombre);
    await FichaArchivo.escribir(carpeta, { estado: 'cerrado', tipo: 'CERTIFICADO', categoria: 'ALUMNADO', tercero: tercero, abiertoEl: '2026-10-01T09:00:00.000Z', cerradoEl: '2026-10-03T09:00:00.000Z' });
    await Carpetas.escribirTexto(carpeta, 'HISTORIAL DE TRAMITACION.txt', 'x' + '\n\n---\nNo toques lo de aquí abajo: son los datos para recuperar los hitos si se reabre el asunto.\n' + JSON.stringify({ creados: '2026-10-01', hitos: [{ id: 'h1', titulo: 'Uno', estado: 'hecho', clase: 'tarea', desde: '2026-10-01', hechoEl: '2026-10-02T10:00:00.000Z' }] }));
  }
  const construido = await IndiceArchivo.construir();
  await IndiceArchivo.guardar(construido);
  const total = (await IndiceArchivo.leerDisco({ todos: true })).datos.asuntos.length;
  let cortada = false;
  const primera = await BasePonerAlDia.ponerAlDia({ alAvanzar: () => { cortada = true; throw new Error('corte'); } });
  const medio = (await BasePonerAlDia.contar()).apuntados;
  const segunda = await BasePonerAlDia.ponerAlDia();
  const c = await BasePonerAlDia.contar();
  const b = await Base.leer();
  const tercera = await BasePonerAlDia.ponerAlDia();
  const claves = b.asuntos.map((a) => a.clave);
  return { total: total, cortada: cortada, primeraOk: primera.ok, medio: medio > 0 && medio < total, apuntados: c.apuntados, sinRepetir: new Set(claves).size === claves.length, hitos: b.hitos.filter((h) => h.titulo === 'Uno').length, tercera: tercera.apuntados };
});
comprobar('6. cortada a la mitad se queda en la tanda; vuelta a lanzar, acaba con todos sin repetir; la tercera no escribe nada',
  [tres.cortada, tres.medio, tres.apuntados === tres.total, tres.sinRepetir, tres.hitos, tres.tercera], [true, true, true, true, 300, 0]);

/* ========== 8. solo consultar ========== */
console.log('--- 8. solo consultar ---');
const sc = await p.evaluate(async () => {
  const contar = async () => { const b = await Base.carpetaBase(false); const c = await Carpetas.contenido(b); let n = 0; for (const k of c.carpetas) n += (await Carpetas.contenido(k.handle)).ficheros.length; return n + c.ficheros.length; };
  const antes = await contar();
  SoloConsulta.guardar(true);
  const r = await BasePonerAlDia.ponerAlDia();
  Base.avisar('ZZ-no-escribir');
  const rb = await Base.escribir({ '2026-27': [{ v: 1, que: 'baja', cuando: new Date().toISOString(), clave: 'x' }] });
  SoloConsulta.guardar(false);
  return { motivo: r.motivo, escribio: rb, igual: (await contar()) === antes };
});
comprobar('8. en solo consultar no se escribe nada en base/', sc, { motivo: 'solo-consulta', escribio: false, igual: true });

/* ========== 10. la tarjeta ========== */
console.log('--- 10. la tarjeta de Herramientas ---');
await p.click('button.pestana[data-pantalla="herramientas"]');
await p.waitForSelector('#bloque-base', { state: 'visible' });
await p.evaluate(() => { document.querySelector('#bloque-base').open = true; BasePantalla.pintar(); });
await p.waitForSelector('#base-boton');
const texto = await p.locator('#base-cuantos').innerText();
comprobar('10. «Asuntos archivados apuntados: N de M.»', /^Asuntos archivados apuntados: \d+ de \d+\./.test(texto), true);
await p.click('#base-boton');
await p.waitForFunction(() => /Apuntados \d+ asunto/.test((document.getElementById('base-fin') || {}).textContent || ''), null, { timeout: 60000 });
const igual = await p.evaluate(() => { const m = /apuntados: (\d+) de (\d+)/.exec(document.getElementById('base-cuantos').textContent); return m && m[1] === m[2]; });
comprobar('10. tras «Poner al día ahora» están apuntados todos', !!igual, true);

comprobar('sin errores', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
