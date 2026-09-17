/* Prueba de LectorDocumentos.analizar (17-sep-2026, fila 41,
   docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md), sección 8. Sin pdf.js y sin
   navegador, con textos de mentira: mismo estilo que
   pruebas/registro-sin-duplicar.mjs y pruebas/verificacion.mjs, el
   fichero se carga tal cual en un contexto de Node con `vm`. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['registro-lector.js', 'lector-documentos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { LectorDocumentos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* 1. Un texto con sello de Séneca: salen registro, fecha y
   entrada/salida (la fecha del análisis es la del sello, no otra). */
{
  const r = LectorDocumentos.analizar(
    '29700692 - Fuente Lucena\n' +
    '2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02\n' +
    'Resto del documento, sin más datos.', {});
  comprobar('1. sello de Séneca: registro completo',
    r.registro, { anio: '26', serie: 'M', tipo: 'E', numero: '0368', numeroLargo: false, fecha: '10/09/2026' });
  comprobar('1b. sello de Séneca: la fecha del análisis es la del sello', r.fecha, '10/09/2026');
}

/* 2. Un texto con el DNI de un alumno de la lista: sale ese alumno.
   12345678Z es un DNI válido de verdad (letra Z para ese número). */
{
  const anaGarcia = { nombre: 'García Pérez, Ana', categoria: 'ALUMNADO', id: '1139877' };
  const contextoConAna = {
    alumnado: [{ nombre: 'García Pérez, Ana', documento: '12345678Z', persona: anaGarcia }],
    personal: [], empresas: [], tipos: []
  };
  const r = LectorDocumentos.analizar(
    'Solicitud presentada, con documento nacional de identidad 12345678Z, sin más señas.',
    contextoConAna);
  comprobar('2. DNI de un alumno de la lista: sale ese alumno',
    r.tercero, { categoria: 'ALUMNADO', nombre: 'García Pérez, Ana', persona: anaGarcia, por: 'documento' });
}

/* 3. Un texto con dos alumnos distintos (su DNI de cada uno): no sale
   ninguno. 87654321X es también un DNI válido de verdad. */
{
  const contextoConDos = {
    alumnado: [
      { nombre: 'García Pérez, Ana', documento: '12345678Z', persona: { nombre: 'García Pérez, Ana' } },
      { nombre: 'Ruiz Soler, Juan', documento: '87654321X', persona: { nombre: 'Ruiz Soler, Juan' } }
    ],
    personal: [], empresas: [], tipos: []
  };
  const r = LectorDocumentos.analizar(
    'Documento que menciona a 12345678Z y también a 87654321X, los dos.', contextoConDos);
  comprobar('3. dos alumnos distintos: no sale ninguno', r.tercero, null);
}

/* 4. Un texto donde dos tipos empatan en palabras clave: no sale tipo.
   Ninguno de los dos nombres de tipo aparece en el texto, así que el
   empate viene solo de las palabras clave (dos cada uno). */
{
  const contextoTipos = {
    tipos: [
      { tipo: 'BAJA MEDICA', categoria: 'PERSONAL', palabrasClave: ['enfermo', 'reposo'] },
      { tipo: 'PERMISO', categoria: 'PERSONAL', palabrasClave: ['enfermo', 'reposo'] }
    ],
    alumnado: [], personal: [], empresas: []
  };
  const r = LectorDocumentos.analizar(
    'El interesado se encuentra enfermo y necesita reposo durante unos días.', contextoTipos);
  comprobar('4. dos tipos empatados en palabras clave: no sale tipo', r.tipo, null);
}

/* 4b. Sin empate, el que más coincidencias tiene sí se propone (y
   "baja" no dispara con "trabaja": palabras enteras, no trozos). */
{
  const contextoTipos = {
    tipos: [
      { tipo: 'BAJA', categoria: 'PERSONAL', palabrasClave: ['enfermo', 'reposo', 'medico'] },
      { tipo: 'PERMISO', categoria: 'PERSONAL', palabrasClave: ['enfermo'] }
    ],
    alumnado: [], personal: [], empresas: []
  };
  const r = LectorDocumentos.analizar(
    'Trabaja en el centro y se encuentra enfermo, con reposo dado por el medico.', contextoTipos);
  comprobar('4b. sin empate, gana el de más coincidencias (y "baja" no dispara con "trabaja")',
    r.tipo, { tipo: 'BAJA', categoria: 'PERSONAL' });
}

/* 5. Un DNI con la letra mal no se da por bueno: ni entra en
   "documentos", ni propone el tercero al que correspondería la letra
   buena. */
{
  const contextoConAna = {
    alumnado: [{ nombre: 'García Pérez, Ana', documento: '12345678Z', persona: { nombre: 'García Pérez, Ana' } }],
    personal: [], empresas: [], tipos: []
  };
  const r = LectorDocumentos.analizar('Documento con el número 12345678A, letra que no cuadra.', contextoConAna);
  comprobar('5. DNI con la letra mal: no entra en "documentos"', r.documentos, []);
  comprobar('5b. DNI con la letra mal: no propone tercero', r.tercero, null);
}

/* 6. Un texto vacío: no sale nada y no se rompe (tampoco con
   undefined, ni sin contexto). */
{
  const vacio = LectorDocumentos.analizar('', {});
  comprobar('6. texto vacío: nada de registro, fecha, documentos, tercero ni tipo',
    vacio, { registro: null, fecha: '', documentos: [], tercero: null, tipo: null });
  comprobar('6b. sin texto y sin contexto no revienta',
    LectorDocumentos.analizar(undefined, undefined),
    { registro: null, fecha: '', documentos: [], tercero: null, tipo: null });
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
