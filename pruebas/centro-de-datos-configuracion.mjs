/* Prueba de la fila 313 (docs/CONFIGURACION-DEL-CENTRO-DE-DATOS.md): los datos del centro y la firma,
   desde `configuracion.json` de la carpeta «CENTRO DE DATOS» (js/centro-de-datos-configuracion.js).

   1. Con todos los valores vacíos no se escribe nada en `plantillas.json` y Ajustes se ve como hoy.
   2. Con valores: se copian los que no están vacíos y son distintos; un valor vacío no cambia el del gestor;
      una sola escritura; el aviso verde dice «y los datos del centro».
   3. Entrar otra vez con el mismo `actualizado` no escribe nada.
   4. En Ajustes los campos que vienen de fuera no se pueden escribir y llevan su nota; los demás, sí.
   5. Con «solo consultar» o con `contrato: 2` no se toca nada.
   6. Un hueco de plantilla con el nombre del centro sale con el valor nuevo. */
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
        subido: l.subido, subidoPor: 'direccion@centro-inventado.es', resumen: l.resumen || '', huella: l.huella });
    }
    if (spec.configuracion) centro._hijos.set('configuracion.json', window.__disco.fich('configuracion.json', JSON.stringify(spec.configuracion)));
    if (!spec.sinIndice) {
      centro._hijos.set('indice.json', window.__disco.fich('indice.json',
        JSON.stringify({ contrato: spec.contrato || 1, actualizado: new Date().toISOString(), web: 'https://script.google.com/inventado/exec', listados: lista })));
    }
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, centro);
  }, spec);
}

const leerDatos = (nombre) => pagina.evaluate(async (nombre) => {
  try { return await Carpetas.leerTexto(App.E.datos, nombre); } catch (e) { return null; }
}, nombre);
const apuntes = () => pagina.evaluate(async () => Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).sort());

const conf = (extra, centro, correo) => ({ contrato: 1, actualizado: new Date(Date.now() + extra * 1000).toISOString(), actualizadoPor: 'direccion@centro-inventado.es',
  centro: Object.assign({ nombre: '', codigo: '', direccion: '', localidad: '', provincia: '', telefono: '' }, centro),
  correo: Object.assign({ direccionDelCentro: '', firma: '' }, correo) });
const plantillas = () => pagina.evaluate(async () => { const p = await Plantillas.cargar(App.E.gestor); return { centro: p.centro, codigo: p.codigo, localidad: p.localidad, firma: p.firma, direccion: p.direccion, provincia: p.provincia }; });
await pagina.evaluate(async () => {
  await Plantillas.guardar(App.E.gestor, (a) => { a.codigo = '29000000'; a.centro = 'IES Antiguo'; a.firma = 'Firma antigua'; a.cargo = 'Secretario'; return a; });
  window.__guardados = 0;
  const original = Plantillas.guardar;
  Plantillas.guardar = function () { window.__guardados++; return original.apply(this, arguments); };
});
const guardados = () => pagina.evaluate(() => window.__guardados);

/* ================= 1. VACÍOS ================= */
console.log('--- 1. todo vacío ---');
await montar({ listados: [], configuracion: conf(1) });
await comprobar('con todos los valores vacíos no se escribe nada en plantillas.json',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({ avisar: false, pedir: true }); return [r.ok, r.configuracion, window.__guardados]; }), [true, false, 0]);
await comprobar('y no hay campos de solo lectura en Ajustes',
  pagina.evaluate(async () => { await App.pintarAjustes(); await new Promise((r) => setTimeout(r, 400)); await CentroDeDatosConfiguracion.marcarCampos(); return [document.querySelectorAll('#centro-firma-cuerpo [readonly]').length, !!document.getElementById('centro-de-datos-configuracion-linea')]; }), [0, false]);

/* ================= 2. CON VALORES ================= */
console.log('--- 2. con valores ---');
await montar({ listados: [], configuracion: conf(2, { nombre: 'IES Inventado', codigo: '', localidad: 'Ciudad Inventada', telefono: '950000000' }, { firma: 'Saludos inventados', direccionDelCentro: 'centro@inventado.es' }) });
await comprobar('se copian nombre, localidad y firma; el código vacío no cambia el del gestor; una sola escritura',
  pagina.evaluate(async () => { const r = await CentroDeDatos.traer({ avisar: false, pedir: true }); return [r.configuracion, window.__guardados]; }), [true, 1]);
await comprobar('plantillas.json queda con lo nuevo y lo suyo',
  plantillas(), { centro: 'IES Inventado', codigo: '29000000', localidad: 'Ciudad Inventada', firma: 'Saludos inventados', direccion: '', provincia: '' });
await comprobar('el aviso verde dice «y los datos del centro»',
  pagina.evaluate(() => window.__avisos.filter((a) => /Traído del Centro de datos/.test(a[0]))), [['Traído del Centro de datos: los datos del centro.', 'bueno']]);
await comprobar('se apunta qué viene de fuera, el teléfono y la dirección del centro de correo, sin copiarlos a ninguna parte',
  pagina.evaluate(async () => { const c = (await CentroDeDatos.leerApuntes(true)).configuracion; return [c.vienen, c.telefono, c.direccionDelCentro, c.actualizadoPor]; }),
  [['centro', 'localidad', 'firma'], '950000000', 'centro@inventado.es', 'direccion@centro-inventado.es']);

/* ================= 3. MISMO actualizado ================= */
console.log('--- 3. el mismo actualizado ---');
await comprobar('entrar otra vez con el mismo `actualizado` no escribe nada ni avisa',
  pagina.evaluate(async () => { window.__avisos.length = 0; const g = window.__guardados; const r = await CentroDeDatos.traer({}); return [r.configuracion, window.__guardados - g, window.__avisos.length]; }), [false, 0, 0]);

/* ================= 4. AJUSTES ================= */
console.log('--- 4. Ajustes ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="centro"]');
await comprobar('los campos que vienen de fuera no se pueden escribir y llevan su nota; los demás sí',
  pagina.evaluate(async () => {
    await App.pintarAjustes();
    await new Promise((r) => setTimeout(r, 700));
    const ro = (id) => document.getElementById(id).readOnly;
    const nota = (id) => { const n = document.getElementById(id + '-nota-centro'); return n ? n.textContent : null; };
    return [ro('plantillas-centro'), ro('plantillas-localidad'), ro('plantillas-firma'), ro('plantillas-codigo'), ro('plantillas-cargo'), ro('plantillas-direccion'),
      nota('plantillas-centro'), nota('plantillas-codigo'), document.getElementById('plantillas-centro').value, document.getElementById('plantillas-firma').value];
  }), [true, true, true, false, false, false, 'Se cambia en el Centro de datos', null, 'IES Inventado', 'Saludos inventados']);
await comprobar('arriba del bloque, la línea de que vienen del Centro de datos, con quién y cuándo, y el enlace',
  pagina.evaluate(() => { const l = document.getElementById('centro-de-datos-configuracion-linea'); return [l.textContent.replace(/\d+-\w+-\d{4}/, 'FECHA'), !!l.querySelector('a[href^="https://script.google.com"]'), l === document.getElementById('centro-firma-cuerpo').firstElementChild]; }),
  ['Estos datos vienen del Centro de datos (cambiados el FECHA por direccion). Abrir el Centro de datos', true, true]);
await comprobar('guardar firma y centro desde Ajustes no estropea lo que vino de fuera',
  pagina.evaluate(async () => { document.getElementById('plantillas-cargo').value = 'Director'; document.getElementById('plantillas-guardar-firma').click(); await new Promise((r) => setTimeout(r, 800)); const p = await Plantillas.cargar(App.E.gestor); return [p.centro, p.cargo, p.firma]; }),
  ['IES Inventado', 'Director', 'Saludos inventados']);

/* ================= 5. SOLO CONSULTA Y CONTRATO ================= */
console.log('--- 5. solo consulta y contrato ---');
await montar({ listados: [], configuracion: conf(3, { nombre: 'IES Otro' }) });
await comprobar('con «solo consultar» no se toca nada',
  pagina.evaluate(async () => { const o = SoloConsulta.activo; SoloConsulta.activo = () => true; try { const g = window.__guardados; await CentroDeDatos.traer({}); return [window.__guardados - g, (await Plantillas.cargar(App.E.gestor)).centro]; } finally { SoloConsulta.activo = o; } }), [0, 'IES Inventado']);
await montar({ listados: [], configuracion: Object.assign(conf(4, { nombre: 'IES Dos' }), { contrato: 2 }) });
await comprobar('con configuracion.json de contrato 2 no se toca nada',
  pagina.evaluate(async () => { const g = window.__guardados; const r = await CentroDeDatos.traer({}); return [r.configuracion, window.__guardados - g, (await Plantillas.cargar(App.E.gestor)).centro]; }), [false, 0, 'IES Inventado']);
await montar({ contrato: 2, listados: [], configuracion: conf(5, { nombre: 'IES Tres' }) });
await comprobar('y con el índice de contrato 2 tampoco',
  pagina.evaluate(async () => { const g = window.__guardados; await CentroDeDatos.traer({}); return [window.__guardados - g, (await Plantillas.cargar(App.E.gestor)).centro]; }), [0, 'IES Inventado']);

/* ================= 6. LA PLANTILLA ================= */
console.log('--- 6. la plantilla ---');
await montar({ listados: [], configuracion: conf(6, { nombre: 'IES Nuevo de Verdad' }) });
await comprobar('un hueco con el nombre del centro sale con el valor nuevo',
  pagina.evaluate(async () => { await CentroDeDatos.traer({}); const p = await Plantillas.cargar(App.E.gestor); return Plantillas.rellenar('Del {centro}.', { centro: p.centro }).texto; }), 'Del IES Nuevo de Verdad.');

const deVerdad = errores.filter((e) => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
