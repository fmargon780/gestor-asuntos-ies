/* Prueba de la fila 351 (docs/REGISTRO-ORIGEN-Y-FECHA-REAL.md): «Control del registro» dice, por libro, de
   dónde viene el listado (Centro de datos o subido a mano), su fecha real, hasta qué día llega y quién lo subió.
   Chromium real y una carpeta de mentira, montada como en pruebas/centro-de-datos.mjs.

   1. Sin subir nada, con la fecha «Revisar desde» puesta, salen los apuntes de entrada y de salida.
   2. La línea de arriba dice «del Centro de datos», su fecha, «hasta el …» y quién lo soltó.
   3. Subido a mano un listado más nuevo (con `lastModified` posterior): la línea de ese libro cambia a «subido a mano».
   4. En Inicio salen los avisos de apuntes sin asunto, sin haber subido nada a mano. */
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


/* ================= 1. LOS APUNTES DEL CENTRO DE DATOS ================= */
console.log('--- 1. apuntes de entrada y de salida ---');
await montar({ listados: [
  { clave: 'registro-entrada', fichero: 'RegLibEntCen.csv', ruta: 'listados/registro-entrada/RegLibEntCen.csv', bytes: Array.from(ENTRADA), subido: MANANA, huella: 'o-ent-1', resumen: '6 apuntes' },
  { clave: 'registro-salida', fichero: 'RegLibSalCen.csv', ruta: 'listados/registro-salida/RegLibSalCen.csv', bytes: Array.from(SALIDA), subido: MANANA, huella: 'o-sal-1', resumen: '4 apuntes' }
] });
await pagina.evaluate(async () => { await ControlRegistro.ponerDesde('2026-09-01'); await CentroDeDatos.traer({}); });
await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.evaluate(() => ControlRegistroPantalla.abrir());
await pagina.waitForSelector('#cr-desde');
await pagina.waitForFunction(() => document.querySelectorAll('.cr-pestana').length === 2 && /sin asunto/.test(document.querySelector('.cr-pestana').textContent), null, { timeout: 15000 });
await comprobar('hay apuntes de los dos libros sin haber subido nada a mano',
  pagina.evaluate(async () => { const a = (await ControlRegistro.cargar()).apuntes; const k = Object.keys(a); return [k.length > 5, k.some((c) => /^26E/.test(c)), k.some((c) => /^26S/.test(c))]; }), [true, true, true]);

/* ================= 2. LA LÍNEA DE ARRIBA ================= */
console.log('--- 2. de dónde viene cada listado ---');
const lineas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('.cr-fila .suave')).map((x) => x.textContent));
const diaCD = await pagina.evaluate((m) => ControlRegistro.fechaLarga(ControlRegistro.diaEspana(m)), MANANA);
await comprobar('Entrada y Salida dicen «del Centro de datos», con su fecha real, «hasta» y quién lo soltó',
  lineas(), ['Entrada: del Centro de datos, ' + diaCD + ' · hasta el 02/10/2026 · lo soltó direccion@centro-inventado.es',
             'Salida: del Centro de datos, ' + diaCD + ' · hasta el 02/10/2026 · lo soltó direccion@centro-inventado.es']);

/* ================= 3. SUBIDO A MANO, MÁS NUEVO ================= */
console.log('--- 3. subido a mano, más nuevo ---');
const PASADO_MANANA = Date.now() + 2 * 86400000;
await pagina.evaluate(async ({ texto, modif }) => {
  const f = new File([texto], 'RegLibEntCen.csv', { lastModified: modif });
  const dt = new DataTransfer();
  dt.items.add(f);
  const entrada = document.getElementById('cr-ficheros');
  entrada.files = dt.files;
  entrada.dispatchEvent(new Event('change'));
}, { texto: ENTRADA.toString('latin1'), modif: PASADO_MANANA });
await pagina.waitForFunction(() => /subido a mano/.test(document.querySelector('.cr-fila').textContent), null, { timeout: 15000 });
const diaMano = await pagina.evaluate((m) => ControlRegistro.fechaLarga(ControlRegistro.diaEspana(new Date(m).toISOString())), PASADO_MANANA);
await comprobar('la línea de la entrada pasa a «subido a mano» con la fecha del fichero; la de salida sigue igual',
  lineas(), ['Entrada: subido a mano, ' + diaMano + ' · hasta el 02/10/2026 · por Francisco',
             'Salida: del Centro de datos, ' + diaCD + ' · hasta el 02/10/2026 · lo soltó direccion@centro-inventado.es']);
await comprobar('y se ven sus apuntes', pagina.evaluate(() => document.querySelectorAll('#cr-cuerpo tr[data-codigo]').length > 0), true);

/* ================= 4. AVISOS DE INICIO ================= */
console.log('--- 4. avisos de Inicio ---');
await pagina.evaluate(() => ControlRegistroPantalla.cerrar());
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.evaluate(() => ControlRegistroAvisos.calcular(true));
await pagina.waitForFunction(() => /de registro sin asunto/.test(document.body.innerText), null, { timeout: 15000 });
await comprobar('Inicio avisa de apuntes de registro sin asunto', pagina.evaluate(() => /apuntes? de registro sin asunto/.test(document.body.innerText)), true);

const deVerdad = errores.filter((e) => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
