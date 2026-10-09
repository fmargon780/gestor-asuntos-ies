/* Prueba de la fila 312 (docs/BEBER-DEL-CENTRO-DE-DATOS.md): el gestor coge, de la carpeta
   «CENTRO DE DATOS» de Drive, los listados nuevos de Séneca (js/centro-de-datos.js,
   js/centro-de-datos-reparto.js, js/centro-de-datos-ver.js). Chromium real y una carpeta de mentira
   con todo inventado.

   1. Sin carpeta y sin apuntes, el gestor es el de siempre.
   2. Con carpeta: alumnado (byte a byte), personal, alumnado de la base de datos, tutorías y Consejo
      Escolar quedan copiados y apuntados, y sale un solo aviso verde.
   3. Entrar otra vez no copia ni avisa; la misma huella o un `subido` más viejo, tampoco; un RegAlum
      más reciente que el índice no se pisa.
   4. Solo consulta no escribe; con un guardado en marcha espera; `contrato: 2` no toca nada.
   5. El registro: sin «Revisar desde» no se toma y sale la línea; al ponerla, se toma.
   6. Un fichero que falla no impide los demás.
   7. Una carpeta que no es la del Centro de datos no se guarda; el bloque de Ajustes y el botón.
   8. El ordenador sin carpeta pero con apuntes: líneas grises y «bien» en la comprobación al entrar. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const ENTRADA = fs.readFileSync(new URL('./control-registro-entrada.csv', import.meta.url));
const SALIDA = fs.readFileSync(new URL('./control-registro-salida.csv', import.meta.url));

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

/* ---- los ficheros inventados ---- */
const REGALUM_LATIN1 = Array.from(Buffer.from([
  'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
  'Primera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014',
  'Otra, Marta;9990009;1º de E.S.O.;1º ESO A;2026;Matriculada;01/01/2014',
  'Antiguo, Pablo;9990002;4º de E.S.O.;4º ESO A;2026;Matriculado;05/06/2010',
  'Nuño Peña, Ñandú;9990004;2º de E.S.O.;2º ESO A;2026;Matriculado;05/06/2012'
].join('\r\n') + '\r\n', 'latin1'));
const PERSONAL = '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"\r\n' +
  '"Nuevo Docente, Ana","10203040A","Música P.E.S.","01/09/2026",""\r\n';
const BD = { acuerdo: 2, generado: new Date(Date.now() - 86400000).toISOString(), origen: 'bd-alumnado-ies', cursoAcademico: '2026-2027',
  campos: [{ clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' }],
  alumnos: [{ idEscolar: '9990001', matriculado: true, datos: { curso: '1º ESO' } }] };
const CONSEJO = 'Sector;Miembro;"Nombramiento<font class=""asterisco""> *</font>";Cese\r\n' +
  'Profesorado;Otero Campos, Marta;15/10/2022;\r\nEquipo Directivo;Uceda Molina, Patricia (DIRECTOR/A);;\r\n';
const TUTORIAS = Array.from(Buffer.from('%PDF-1.4 inventado\n', 'latin1'));

const MANANA = new Date(Date.now() + 86400000).toISOString();
const AYER = new Date(Date.now() - 86400000).toISOString();

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (regalum) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = 'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\n' +
    'Primera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
}, REGALUM_LATIN1);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2500);

/* Los avisos que salen en pantalla, para contarlos. */
await pagina.evaluate(() => {
  window.__avisos = [];
  const original = U.aviso;
  U.aviso = function (texto, clase) { window.__avisos.push([texto, clase || '']); return original.apply(this, arguments); };
});

/* Monta la carpeta «CENTRO DE DATOS» de mentira y la señala. `spec`: { contrato, listados: [{ clave, variante, fichero, ruta, texto|bytes, subido, huella, lastModified }] } */
async function montar(spec) {
  await pagina.evaluate(async (spec) => {
    const raiz = window.__disco.archivo;
    raiz._hijos.delete('CENTRO DE DATOS');
    const centro = await raiz.getDirectoryHandle('CENTRO DE DATOS', { create: true });
    const lista = [];
    for (const l of spec.listados) {
      const partes = l.ruta.split('/');
      let d = centro;
      for (let i = 0; i < partes.length - 1; i++) d = await d.getDirectoryHandle(partes[i], { create: true });
      const contenido = l.bytes ? new Uint8Array(l.bytes) : l.texto;
      const f = window.__disco.fich(partes[partes.length - 1], contenido);
      f.getFile = async () => new File([contenido], partes[partes.length - 1], { lastModified: l.lastModified || Date.now() });
      if (!l.sinFichero) d._hijos.set(partes[partes.length - 1], f);
      lista.push({ clave: l.clave, variante: l.variante || '', titulo: l.clave, fichero: l.fichero, ruta: l.ruta, tipo: 'csv',
        cursoEscolar: l.cursoEscolar || '', ambito: l.ambito || '', periodo: l.periodo || '', alumno: l.alumno || '', porAlumno: l.porAlumno || undefined,
        subido: l.subido, subidoPor: 'direccion@centro-inventado.es', resumen: l.resumen || '', huella: l.huella });
    }
    if (!spec.sinIndice) {
      centro._hijos.set('indice.json', window.__disco.fich('indice.json',
        JSON.stringify({ contrato: spec.contrato || 1, actualizado: new Date().toISOString(), cursoActual: spec.cursoActual, ocupado: spec.ocupado, web: 'https://script.google.com/inventado/exec', listados: lista })));
    }
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, centro);
  }, spec);
}

const leerDatos = (nombre) => pagina.evaluate(async (nombre) => {
  try { return await Carpetas.leerTexto(App.E.datos, nombre); } catch (e) { return null; }
}, nombre);
const apuntes = () => pagina.evaluate(async () => Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).sort());

/* ================= 1. SIN NADA ================= */
console.log('--- 1. sin carpeta ni apuntes ---');
await comprobar('sin carpeta señalada no hace nada',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.ok, r.motivo, r.tomados.length]; }), [false, 'sin carpeta', 0]);
await comprobar('sin apuntes: ninguna línea gris y ningún apunte',
  pagina.evaluate(async () => { await CentroDeDatosVer.pintar(); return [document.querySelectorAll('.centro-linea').length, Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).length]; }), [0, 0]);
await comprobar('Ajustes tiene el bloque «Carpeta del Centro de datos» en Este ordenador, con su explicación',
  pagina.evaluate(async () => {
    await App.pintarAjustes();
    await new Promise((r) => setTimeout(r, 400));
    const b = document.querySelector('#ajustes-tab-ordenador #bloque-centro-de-datos');
    return [!!b, b && b.querySelector('.bloque-titulo').textContent, document.getElementById('centro-de-datos-carpeta').textContent];
  }), [true, 'Carpeta del Centro de datos', 'Sin carpeta señalada en este ordenador: se usa lo que traiga el otro.']);

/* ================= 2. TOMAR ================= */
console.log('--- 2. tomar lo nuevo ---');
const TODO = [
  { clave: 'alumnado', fichero: 'RegAlum.csv', ruta: 'listados/alumnado/RegAlum.csv', bytes: REGALUM_LATIN1, subido: MANANA, huella: 'h-alu-1', resumen: '4 alumnos' },
  { clave: 'personal', variante: '26-27', fichero: 'RelPerCen 26-27.csv', ruta: 'listados/personal/26-27/RelPerCen 26-27.csv', texto: PERSONAL, subido: MANANA, huella: 'h-per-1', resumen: '1 empleado' },
  { clave: 'alumnado-bd', fichero: 'ALUMNADO-BD.json', ruta: 'listados/alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(BD), subido: MANANA, huella: 'h-bd-1', resumen: '1 alumno' },
  { clave: 'tutorias', fichero: 'Función Tutorial 2025-2026.pdf', ruta: 'listados/tutorias/Función Tutorial 2025-2026.pdf', bytes: TUTORIAS, subido: MANANA, huella: 'h-tut-1' },
  { clave: 'consejo-escolar', variante: '2025-2026', fichero: 'RegMieConEsc 2025-2026.csv', ruta: 'listados/consejo-escolar/2025-2026/RegMieConEsc 2025-2026.csv', texto: CONSEJO, subido: MANANA, huella: 'h-con-1' },
  { clave: 'matricula', fichero: 'otra.csv', ruta: 'listados/matricula/otra.csv', texto: 'a;b\r\n', subido: MANANA, huella: 'h-mat-1' }
];
await montar({ listados: TODO });
await comprobar('traer: se toman los cinco del gestor y no «matricula»',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({ avisar: false, pedir: true }); return [r.ok, r.tomados, r.fallos]; }),
  [true, ['alumnado', 'personal', 'alumnado-bd', 'tutorias', 'consejo-escolar'], []]);
await comprobar('el RegAlum queda copiado byte a byte',
  pagina.evaluate(async (bytes) => {
    const h = await App.E.datos.getFileHandle('RegAlum.csv');
    const mio = new Uint8Array(await (await h.getFile()).arrayBuffer());
    return mio.length === bytes.length && bytes.every((b, i) => b === mio[i]);
  }, REGALUM_LATIN1), true);
await comprobar('el personal conserva su nombre, el de la base de datos se valida y copia, la tutoría va tal cual',
  pagina.evaluate(async () => {
    const dentro = async (n) => { try { await App.E.datos.getFileHandle(n); return true; } catch (e) { return false; } };
    return [await dentro('RelPerCen 26-27.csv'), await dentro('ALUMNADO-BD.json'), await dentro('Función Tutorial 2025-2026.pdf')];
  }), [true, true, true]);
await comprobar('el Consejo Escolar va a Tablas con su nombre limpio',
  pagina.evaluate(async () => { const t = await App.E.datos.getDirectoryHandle('Tablas'); const n = []; for await (const [k] of t.entries()) n.push(k); return n; }),
  ['RegMieConEsc 2025-2026.csv']);
await comprobar('quedan apuntados por clave y variante',
  apuntes(), ['alumnado-bd|', 'alumnado|', 'consejo-escolar|2025-2026', 'personal|26-27', 'tutorias|']);
await comprobar('y sale un solo aviso verde con lo traído',
  pagina.evaluate(() => window.__avisos.filter((a) => /Traído del Centro de datos/.test(a[0])).map((a) => [a[0].replace(/\(\d+-\w+\)/g, '(F)'), a[1]])),
  [['Traído del Centro de datos: Alumnado (F), Personal (F), Alumnado de la base de datos (F), Función tutorial (F), Consejo Escolar (F).', 'bueno']]);
await comprobar('el alumnado nuevo ya se ve en la aplicación (sin recargar la página)',
  pagina.evaluate(async () => { await new Promise((r) => setTimeout(r, 1500)); const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); return f.lista.length; }), 4);

/* ================= 3. NO REPETIR NI RETROCEDER ================= */
console.log('--- 3. no repetir ni retroceder ---');
await pagina.evaluate(() => { window.__avisos.length = 0; });
await comprobar('entrar otra vez no copia nada ni avisa',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.ok, r.tomados.length, window.__avisos.length]; }), [true, 0, 0]);
await montar({ listados: [{ ...TODO[1], huella: 'h-per-1', subido: new Date(Date.now() + 2 * 86400000).toISOString() }] });
await comprobar('la misma huella, aunque el índice diga que es más nuevo, no se toma',
  pagina.evaluate(async () => (await CentroDeDatos.traer({})).tomados), []);
await montar({ listados: [{ ...TODO[1], huella: 'h-per-2', subido: AYER }] });
await comprobar('un listado con `subido` anterior al apuntado tampoco',
  pagina.evaluate(async () => (await CentroDeDatos.traer({})).tomados), []);
await montar({ listados: [{ ...TODO[0], huella: 'h-alu-2', subido: new Date(Date.now() + 3 * 86400000).toISOString(), bytes: REGALUM_LATIN1.slice(0, 50) }] });
await pagina.evaluate(async () => {
  /* El RegAlum del gestor, más reciente que cualquier índice de esta tanda. */
  const h = await App.E.datos.getFileHandle('RegAlum.csv');
  const viejo = h.getFile;
  h.getFile = async () => { const f = await viejo.call(h); return new File([f], 'RegAlum.csv', { lastModified: Date.now() + 10 * 86400000 }); };
});
await comprobar('si el RegAlum del gestor es más reciente que el índice, no se pisa',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados, (await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv')).length > 100]; }), [[], true]);

/* ================= 4. SOLO CONSULTA, GUARDADO EN MARCHA, CONTRATO ================= */
console.log('--- 4. solo consulta, guardado, contrato ---');
await montar({ listados: [{ ...TODO[1], huella: 'h-per-9', subido: new Date(Date.now() + 4 * 86400000).toISOString() }] });
await comprobar('con «solo consultar» no escribe nada',
  pagina.evaluate(async () => {
    const original = SoloConsulta.activo;
    SoloConsulta.activo = () => true;
    try { const r = await CentroDeDatos.traer({ avisar: true }); return [r.ok, r.motivo, (await CentroDeDatos.leerApuntes(true)).tomado['personal|26-27'].huella]; }
    finally { SoloConsulta.activo = original; }
  }), [false, 'solo consulta', 'h-per-1']);
await comprobar('al entrar, con un guardado en marcha, espera y luego lo toma',
  pagina.evaluate(async () => {
    const original = ColaGuardado.hayGuardado;
    let veces = 0;
    ColaGuardado.hayGuardado = () => ++veces <= 2;
    CentroDeDatos._alEntrarDeNuevo();
    await new Promise((r) => setTimeout(r, 1700));
    const antes = (await CentroDeDatos.leerApuntes(true)).tomado['personal|26-27'].huella;
    await new Promise((r) => setTimeout(r, 5200));
    ColaGuardado.hayGuardado = original;
    return [antes, (await CentroDeDatos.leerApuntes(true)).tomado['personal|26-27'].huella, veces >= 3];
  }), ['h-per-1', 'h-per-9', true]);
await montar({ contrato: 3, listados: [{ ...TODO[1], huella: 'h-per-10', subido: new Date(Date.now() + 5 * 86400000).toISOString() }] });
await pagina.evaluate(() => { window.__avisos.length = 0; });
await comprobar('con contrato 3 no se toca nada y se dice',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados.length, r.motivo, window.__avisos.map((a) => a[0])]; }),
  [0, 'contrato', ['El Centro de datos es más nuevo que esta aplicación.']]);
await comprobar('la comprobación al entrar lo pone en ámbar',
  pagina.evaluate(async () => { const f = (await ComprobacionEntrada.revisar()).find((x) => x.id === 'centro-de-datos'); return [f.estado, f.ambar, f.frase]; }),
  ['falta', true, 'El Centro de datos es más nuevo que esta aplicación.']);

/* ================= 5. EL REGISTRO ================= */
console.log('--- 5. el registro ---');
await montar({ listados: [
  { clave: 'registro-entrada', fichero: 'RegLibEntCen.csv', ruta: 'listados/registro-entrada/RegLibEntCen.csv', bytes: Array.from(ENTRADA), subido: MANANA, huella: 'h-ent-1', resumen: '6 apuntes' },
  { clave: 'registro-salida', fichero: 'RegLibSalCen.csv', ruta: 'listados/registro-salida/RegLibSalCen.csv', bytes: Array.from(SALIDA), subido: MANANA, huella: 'h-sal-1', resumen: '4 apuntes' }
] });
await comprobar('sin «Revisar desde» los dos del registro no se toman',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados, r.esperaRegistro, Object.keys((await ControlRegistro.cargar()).apuntes).length]; }), [[], true, 0]);
await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.evaluate(() => ControlRegistroPantalla.abrir());
await pagina.waitForSelector('#cr-desde');
await pagina.waitForTimeout(800);
await comprobar('en «Control del registro» sale la línea de que hay listados nuevos',
  pagina.evaluate(() => { const a = document.querySelector('.centro-registro-aviso'); return a && a.textContent; }),
  'Hay listados nuevos del registro en el Centro de datos. Pon la fecha «Revisar desde» y se traerán solos.');
await pagina.fill('#cr-desde', '2026-09-01');
await pagina.dispatchEvent('#cr-desde', 'change');
await pagina.waitForFunction(() => !document.querySelector('.centro-registro-aviso'), null, { timeout: 15000 });
await pagina.waitForTimeout(1500);
await comprobar('al ponerla se toman en ese momento, como si se hubieran subido a mano',
  pagina.evaluate(async () => [Object.keys((await ControlRegistro.cargar()).apuntes).length > 5, (await CentroDeDatos.leerApuntes(true)).tomado['registro-entrada|'].huella]),
  [true, 'h-ent-1']);
await pagina.evaluate(() => ControlRegistroPantalla.cerrar());

/* ================= 6. UN FALLO NO IMPIDE LOS DEMÁS ================= */
console.log('--- 6. un fichero que falla ---');
await montar({ listados: [
  { ...TODO[1], huella: 'h-per-20', subido: new Date(Date.now() + 6 * 86400000).toISOString(), sinFichero: true },
  { ...TODO[2], huella: 'h-bd-20', texto: JSON.stringify({ ...BD, generado: new Date(Date.now() + 5 * 86400000).toISOString() }), subido: new Date(Date.now() + 6 * 86400000).toISOString() }
] });
await comprobar('el que falta sale en ámbar y el otro se toma',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados, r.fallos.length, r.fallos[0].indexOf('Personal') === 0]; }), [['alumnado-bd'], 1, true]);

/* ================= 7. CARPETA QUE NO ES, AJUSTES, BOTÓN ================= */
console.log('--- 7. carpeta que no es, Ajustes y botón ---');
await comprobar('una carpeta sin `indice.json` no se guarda y se dice',
  pagina.evaluate(async () => {
    const actual = await CentroDeDatos.carpeta();
    window.showDirectoryPicker = async () => window.__disco.archivo.getDirectoryHandle('OTRA CARPETA', { create: true });
    window.__avisos.length = 0;
    await CentroDeDatos.senalarCarpeta();
    const ahora = await CentroDeDatos.carpeta();
    return [ahora === actual, window.__avisos.map((a) => a.join('|'))];
  }), [true, ['Esta carpeta no es la del Centro de datos.|ambar']]);
await montar({ listados: [{ ...TODO[1], huella: 'h-per-30', subido: new Date(Date.now() + 7 * 86400000).toISOString() }] });
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="ordenador"]');
await comprobar('Ajustes dice de cuándo es el índice, cuántos listados trae y enlaza al Centro de datos',
  pagina.evaluate(async () => {
    await CentroDeDatosVer.pintar();
    const b = document.getElementById('bloque-centro-de-datos');
    b.open = true;
    await new Promise((r) => setTimeout(r, 100));
    await CentroDeDatosVer.pintar();
    const p = document.getElementById('centro-de-datos-indice');
    return [document.getElementById('centro-de-datos-carpeta').textContent, /^Índice del \d+-\w+-\d{4} \d\d:\d\d · 1 listado para el gestor/.test(p.textContent), !!p.querySelector('a[href^="https://script.google.com"]')];
  }), ['Carpeta señalada: CENTRO DE DATOS.', true, true]);
await comprobar('el botón «Traer ahora del Centro de datos» está en Herramientas y contesta aunque no haya nada nuevo',
  pagina.evaluate(async () => {
    await CentroDeDatosVer.pintar();
    const b = document.querySelector('#herramientas-traer-seneca #btn-centro-traer');
    await CentroDeDatos.traer({ avisar: true });   /* trae el personal nuevo */
    window.__avisos.length = 0;
    await CentroDeDatos.traer({ avisar: true });
    return [b && b.textContent, window.__avisos.map((a) => a[0])];
  }), ['Traer ahora del Centro de datos', ['No hay nada nuevo en el Centro de datos.']]);

/* ================= 8. EL ORDENADOR SIN CARPETA, CON APUNTES ================= */
console.log('--- 8. sin carpeta pero con apuntes ---');
await pagina.evaluate(async () => { await CentroDeDatos.olvidarCarpeta(); await CentroDeDatosVer.pintar(); });
await comprobar('las líneas grises dicen de cuándo son los datos, en los tres sitios (fila 319: en «Traer el alumnado» ya no hay, lo dice la tabla)',
  pagina.evaluate(async () => {
    await CentroDeDatosVer.pintar();
    const t = (sel) => [...document.querySelectorAll(sel + ' .centro-linea')].map((x) => x.dataset.clave);
    return [t('[data-centro-lineas="seneca"]'), t('[data-centro-lineas="tablas"]')];
  }), [[], ['tutorias', 'consejo-escolar']]);
await comprobar('fila 319: lo del personal lo dice la tabla «Lo que tengo ahora»: del Centro de datos y quién lo subió',
  pagina.evaluate(async () => { const ap = (await DatosQueTengo.leerApuntes(true)).ficheros; const k = Object.keys(ap).find((n) => /^RelPerCen/.test(n)); return DatosQueTengo.porDondeLlego(ap[k]); }),   /* el disco de esta prueba no da fecha a los ficheros: se mira el apunte */
  'Del Centro de datos. Lo subió direccion.');
await comprobar('la comprobación al entrar da «bien» con lo que trae el otro',
  pagina.evaluate(async () => { const f = (await ComprobacionEntrada.revisar()).find((x) => x.id === 'centro-de-datos'); return [f.estado, /^Este ordenador usa lo que trae el otro\. Último: \d+-\w+-\d{4}\.$/.test(f.frase)]; }),
  ['bien', true]);
await comprobar('sin carpeta, traer no hace nada y el aviso del botón manda a Ajustes',
  pagina.evaluate(async () => { window.__avisos.length = 0; const r = await CentroDeDatos.traer({ avisar: true }); return [r.motivo, window.__avisos.length]; }), ['sin carpeta', 1]);

/* ================= 9. EL CONTRATO 2 (fila 317) ================= */
console.log('--- 9. contrato 2: elegir qué se coge ---');
const limpiar = () => pagina.evaluate(async () => { await Carpetas.guardarJson(App.E.gestor, 'centro-de-datos.json', { _esquema: 1, tomado: {} }); await CentroDeDatos.leerApuntes(true); window.__avisos.length = 0; });
const nombresEnDatos = (prefijo) => pagina.evaluate(async (prefijo) => { const n = []; for await (const [k] of App.E.datos.entries()) if (k.indexOf(prefijo) === 0) n.push(k); return n.sort(); }, prefijo);
const persona = (nombre, dni) => '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"\r\n"' + nombre + '","' + dni + '","Música P.E.S.","01/09/2026",""\r\n';
const ent = (clave, variante, fich, texto, extra) => ({ clave, variante, fichero: fich, ruta: 'listados/' + clave + '/' + variante.replace(/[\/]/g, '-') + '/' + fich, texto, subido: MANANA, huella: 'c2-' + clave + variante + fich, ...extra });
const CURSO = '26-27';

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, ocupado: false, listados: [
  ent('personal', CURSO + '/docentes', 'RelPerCen 26-27.csv', persona('Docente Uno, Ana', '11111111A'), { cursoEscolar: CURSO, ambito: 'docentes' }),
  ent('personal', CURSO + '/no-docentes', 'RelPerCenNodocente 26-27.csv', persona('No Docente Dos, Luis', '22222222B'), { cursoEscolar: CURSO, ambito: 'no-docentes' }),
  ent('personal', '25-26/docentes', 'RelPerCen 25-26.csv', persona('Antiguo Tres, Eva', '33333333C'), { cursoEscolar: '25-26', ambito: 'docentes' })
] });
await comprobar('contrato 2: ya no sale «es más nuevo», se toma lo que toca y quedan tres ficheros de personal',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({ avisar: false, pedir: true }); return [r.ok, r.motivo || '', r.tomados.length, window.__avisos.some((a) => /más nuevo/.test(a[0]))]; }), [true, '', 3, false]);
await comprobar('en `_GESTOR/datos` están los tres y `Datos` ve a las personas de los tres',
  pagina.evaluate(async () => { const n = []; for await (const [k] of App.E.datos.entries()) if (/^RelPerCen/.test(k)) n.push(k); await new Promise((r) => setTimeout(r, 1500)); const p = await Datos.cargar(App.E.datos, 'PERSONAL'); const nombres = p.lista.map((x) => x.nombre); return [n.sort().filter((k) => /26-27|25-26/.test(k)), ['Docente Uno, Ana', 'No Docente Dos, Luis', 'Antiguo Tres, Eva'].map((x) => nombres.indexOf(x) !== -1)]; }),
  [['RelPerCen 25-26.csv', 'RelPerCen 26-27.csv', 'RelPerCenNodocente 26-27.csv'], [true, true, true]]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  ent('personal', CURSO + '/docentes', 'RelPerCen.csv', persona('Mismo Cuatro, Pepe', '44444444D'), { cursoEscolar: CURSO, ambito: 'docentes' }),
  ent('personal', CURSO, 'RelPerCen.csv', persona('Mismo Cinco, Rosa', '55555555E'), { cursoEscolar: CURSO, ambito: '' })
] });
await comprobar('dos de personal con el mismo `fichero` y distinto ámbito: ninguno pisa al otro',
  pagina.evaluate(async () => { await CentroDeDatos.traer({}); const n = []; for await (const [k] of App.E.datos.entries()) if (/^RelPerCen(Todo)? 26-27/.test(k)) n.push(k); return n.sort(); }), ['RelPerCen 26-27.csv', 'RelPerCenTodo 26-27.csv']);
const hoy = await pagina.evaluate(() => U.cursoActual());
await limpiar();
await montar({ contrato: 2, cursoActual: hoy, listados: [ent('personal', hoy, 'RelPerCen.csv', persona('Sin Curso Seis, Ana', '66666666F'), { cursoEscolar: hoy, ambito: 'docentes' })] });
await comprobar('`RelPerCen.csv` del curso de hoy se guarda como `RelPerCen <curso>.csv`',
  pagina.evaluate(async (hoy) => { await CentroDeDatos.traer({}); try { await App.E.datos.getFileHandle('RelPerCen.csv'); return false; } catch (e) { /* no está */ } try { await App.E.datos.getFileHandle('RelPerCen ' + hoy + '.csv'); return true; } catch (e) { return false; } }, hoy), true);
await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [ent('personal', '25-26/docentes', 'RelPerCen.csv', persona('Viejo Siete, Juan', '77777777G'), { cursoEscolar: '25-26', ambito: 'docentes' })] });
await comprobar('`RelPerCen.csv` de 25-26 se guarda como `RelPerCen 25-26.csv` y `Datos` lo lee como de 25-26',
  pagina.evaluate(async () => { await CentroDeDatos.traer({}); await new Promise((r) => setTimeout(r, 1200)); const p = await Datos.cargar(App.E.datos, 'PERSONAL'); return [Datos.cursoDelFichero('RelPerCen 25-26.csv'), p.ficheros.filter((f) => f.fichero === 'RelPerCen 25-26.csv').map((f) => f.curso)]; }), ['25-26', ['25-26']]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  ent('tutorias', '25-26', 'Función Tutorial 2035-2036.pdf', 'pdf viejo', { cursoEscolar: '25-26' }),
  ent('tutorias', CURSO, 'Función Tutorial 2036-2037.pdf', 'pdf nuevo', { cursoEscolar: CURSO })
] });
await comprobar('tutorías de dos cursos: solo se copia la de este',
  pagina.evaluate(async () => { await CentroDeDatos.traer({}); const dentro = async (n) => { try { await App.E.datos.getFileHandle(n); return true; } catch (e) { return false; } }; return [await dentro('Función Tutorial 2035-2036.pdf'), await dentro('Función Tutorial 2036-2037.pdf')]; }), [false, true]);
await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [ent('tutorias', '24-25', 'Función Tutorial 2024-2025.pdf', 'pdf viejo', { cursoEscolar: '24-25' })] });
await comprobar('con solo la tutoría de un curso viejo no se copia ninguna',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); let hay = true; try { await App.E.datos.getFileHandle('Función Tutorial 2024-2025.pdf'); } catch (e) { hay = false; } return [r.tomados.length, hay]; }), [0, false]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  ent('consejo-escolar', '2022-2024', 'RegMieConEsc 2022-2024.csv', CONSEJO, { periodo: '2022-2024' }),
  ent('consejo-escolar', '2024-2026', 'RegMieConEsc 2024-2026.csv', CONSEJO, { periodo: '2024-2026' })
] });
await comprobar('Consejo Escolar de dos periodos: entran los dos, cada uno en su fichero',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); const t = await App.E.datos.getDirectoryHandle('Tablas'); const n = []; for await (const [k] of t.entries()) n.push(k); return [r.tomados.length, n.sort().filter((k) => /2022-2024|2024-2026/.test(k))]; }), [2, ['RegMieConEsc 2022-2024.csv', 'RegMieConEsc 2024-2026.csv']]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  { ...ent('registro-entrada', '25-26', 'RegLibEntCen.csv', '', { cursoEscolar: '25-26', huella: 'c2-ent-viejo' }), bytes: Array.from(ENTRADA) },
  { ...ent('registro-entrada', CURSO, 'RegLibEntCen.csv', '', { cursoEscolar: CURSO, huella: 'c2-ent-nuevo' }), bytes: Array.from(ENTRADA) }
] });
await comprobar('registro de entrada de dos cursos: solo se sube el de este',
  pagina.evaluate(async () => { await ControlRegistro.ponerDesde('2026-09-01'); const r = await CentroDeDatos.traer({}); return [r.tomados, Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).filter((k) => /^registro-entrada/.test(k))]; }), [['registro-entrada'], ['registro-entrada|26-27']]);

await limpiar();
await pagina.evaluate(async () => {
  const d = await CentroDeDatos.leerApuntes(true);
  d.tomado['registro-entrada|'] = { huella: 'hh1', subido: new Date(Date.now() + 86400000).toISOString() };
  d.tomado['personal|26-27'] = { huella: 'hp1', subido: new Date(Date.now() + 86400000).toISOString() };
  await Carpetas.guardarJson(App.E.gestor, 'centro-de-datos.json', d);
  await CentroDeDatos.leerApuntes(true);
});
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  { ...ent('registro-entrada', CURSO, 'RegLibEntCen.csv', '', { cursoEscolar: CURSO, huella: 'hh1', subido: new Date(Date.now() + 2 * 86400000).toISOString() }), bytes: Array.from(ENTRADA) },
  ent('personal', CURSO + '/docentes', 'RelPerCen 26-27.csv', persona('Otra, Ana', '88888888H'), { cursoEscolar: CURSO, ambito: 'docentes', huella: 'hp1', subido: new Date(Date.now() + 2 * 86400000).toISOString() })
] });
await comprobar('con apuntes de la fila 312 y las mismas huellas con otra `variante`: no se toma nada y no sale ningún aviso verde',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados.length, window.__avisos.filter((a) => /Traído/.test(a[0])).length]; }), [0, 0]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  ent('alumnado', '', 'RegAlum.csv', 'a;b\r\n', { huella: 'c2-alu-1' }),
  ent('alumnado', '2', 'RegAlum2.csv', 'a;b\r\n', { huella: 'c2-alu-2' })
] });
await comprobar('dos de alumnado: no se copia ninguna y sale el aviso ámbar',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.tomados.length, window.__avisos.filter((a) => a[1] === 'ambar').map((a) => a[0])]; }), [0, ['En el Centro de datos hay más de un listado de alumnado. No he traído ninguno.']]);

await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, listados: [
  { clave: 'expediente-secundaria', variante: '', fichero: '', ruta: '', texto: '', subido: MANANA, huella: 'c2-exp', porAlumno: true },
  ent('censo-neae', '', 'censo.csv', 'a;b\r\n', { huella: 'c2-neae' }),
  ent('personal', CURSO + '/docentes', 'RelPerCen 26-27.csv', persona('Con Alumno, Ana', '99999990J'), { cursoEscolar: CURSO, ambito: 'docentes', alumno: '2100001', huella: 'c2-conalumno' })
] });
await comprobar('una entrada `porAlumno`, una clave que no es del gestor y una con `alumno`: no hacen nada y no dan error',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); return [r.ok, r.tomados.length, r.fallos.length]; }), [true, 0, 0]);

/* el índice ocupado */
await limpiar();
await montar({ contrato: 2, cursoActual: CURSO, ocupado: true, listados: [ent('personal', CURSO + '/docentes', 'RelPerCen 26-27.csv', persona('Ocupado Ocho, Ana', '12121212K'), { cursoEscolar: CURSO, ambito: 'docentes', huella: 'c2-ocupado' })] });
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="ordenador"]');
await comprobar('con `ocupado: true`: no se copia nada, no hay aviso ámbar, el bloque dice la frase en gris y el botón contesta eso',
  pagina.evaluate(async () => {
    window.__avisos.length = 0;
    const r = await CentroDeDatos.traer({ avisar: true });
    CentroDeDatosVer.pintar();
    for (let i = 0; i < 40 && !document.getElementById('centro-de-datos-ocupado').textContent; i++) await new Promise((x) => setTimeout(x, 100));
    const p = document.getElementById('centro-de-datos-ocupado');
    return [r.motivo, r.tomados.length, window.__avisos.filter((a) => a[1] === 'ambar').length, window.__avisos.map((a) => a[0]), p.textContent, p.classList.contains('oculto')];
  }), ['ocupado', 0, 0, ['El Centro de datos está recolocando sus ficheros. Lo traeré más tarde.'], 'El Centro de datos está recolocando sus ficheros. Lo traeré más tarde.', false]);
await montar({ contrato: 2, cursoActual: CURSO, ocupado: false, listados: [ent('personal', CURSO + '/docentes', 'RelPerCen 26-27.csv', persona('Ocupado Ocho, Ana', '12121212K'), { cursoEscolar: CURSO, ambito: 'docentes', huella: 'c2-ocupado' })] });
await comprobar('al pasar a `ocupado: false`, se toma',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({}); CentroDeDatosVer.pintar(); for (let i = 0; i < 40 && !document.getElementById('centro-de-datos-ocupado').classList.contains('oculto'); i++) await new Promise((x) => setTimeout(x, 100)); return [r.tomados, document.getElementById('centro-de-datos-ocupado').classList.contains('oculto')]; }), [['personal'], true]);

const deVerdad = errores.filter((e) => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
