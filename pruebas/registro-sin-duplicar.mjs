/* Prueba de docs/REGISTRO-SIN-DUPLICAR.md (fila 20, 17-sep-2026), la
   parte que se puede probar sin PDF y sin navegador. Mismo estilo que
   pruebas/logica.mjs y pruebas/verificacion.mjs: los ficheros se
   cargan tal cual en un contexto de Node con `vm`.

   Lo que necesita un PDF de verdad o el disco (leer el sello dentro
   del fichero, renombrar, mandar a la papelera) no se prueba aquí:
   se comprueba a mano, como dice el propio documento. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['util.js', 'nombres.js', 'documentos.js', 'registro-lector.js', 'registro-sellado.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Documentos, RegistroLector, RegistroSellado } = contexto;

Documentos.configurar({ tipos: function () { return ['SOLICITUD']; } });

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const SELLO_ESPERADO = { anio: '26', serie: 'M', tipo: 'E', numero: '0368', numeroLargo: false, fecha: '10/09/2026' };

/* 1. La normalización: pegado, con espacios de más y partido en varias
   líneas dan los tres el mismo número de registro. */
comprobar('1a. el sello pegado se reconoce',
  RegistroLector.buscarEnTexto('2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02'),
  SELLO_ESPERADO);
comprobar('1b. el sello con espacios de más se reconoce igual',
  RegistroLector.buscarEnTexto('2026 / 29700692 / M   000000000368   ENTRADA   Fecha:   10/09/2026 13:03:02'),
  SELLO_ESPERADO);
comprobar('1c. el sello partido en varias líneas se reconoce igual',
  RegistroLector.buscarEnTexto('2026/29700692/M000000000368\nENTRADA\nFecha: 10/09/2026 13:03:02'),
  SELLO_ESPERADO);

/* 2. Sin sello: null, sin reventar. */
comprobar('2. un texto sin sello da null y no lanza error',
  RegistroLector.buscarEnTexto('Esto es un documento cualquiera, sin ningún sello dentro.'),
  null);
comprobar('2b. tampoco revienta con texto vacío',
  RegistroLector.buscarEnTexto(''), null);

/* 3. Un nombre que ya cumple las reglas no se manda a leer. */
comprobar('3. un nombre ya puesto por la aplicación no se manda a leer',
  RegistroSellado.pendientesDeLeer(
    [{ nombre: '260907 SOLICITUD 26-27.pdf', tamano: 12345 }], {}),
  []);

/* 4. Un fichero ya mirado, sin sello, no se vuelve a leer. */
comprobar('4. un fichero ya mirado y sin sello no se vuelve a leer',
  RegistroSellado.pendientesDeLeer(
    [{ nombre: '29700692 - Fuente Lucena.pdf', tamano: 999 }],
    { '29700692 - Fuente Lucena.pdf|999': { sello: null, ignorado: false } }),
  []);
comprobar('4b. uno que no está en la memoria sí se manda a leer',
  RegistroSellado.pendientesDeLeer(
    [{ nombre: '29700692 - Fuente Lucena.pdf', tamano: 999 }], {}),
  [{ nombre: '29700692 - Fuente Lucena.pdf', tamano: 999 }]);

/* 5. El nombre nuevo es exactamente el que genera hoy el paso de
   Registrar, para el mismo documento y el mismo número de registro. */
comprobar('5. el nombre nuevo es el mismo que genera Registrar',
  RegistroSellado.nombreParaSello('260907 SOLICITUD 26-27.pdf', SELLO_ESPERADO),
  '260907 26EM0368 SOLICITUD 26-27.pdf');

/* Un documento sin fecha ni tipo reconocibles no propone nombre. */
comprobar('5b. sin fecha ni tipo reconocibles, no propone nombre',
  RegistroSellado.nombreParaSello('lo que sea.pdf', SELLO_ESPERADO), '');

/* 6. Si el nombre nuevo ya existe, se avisa y no se renombra. */
comprobar('6. hay colisión cuando el nombre ya existe en la carpeta',
  RegistroSellado.hayColision(
    ['260907 26EM0368 SOLICITUD 26-27.pdf', '260907 SOLICITUD 26-27.pdf'],
    '260907 26EM0368 SOLICITUD 26-27.pdf'),
  true);
comprobar('6b. sin colisión cuando el nombre no está',
  RegistroSellado.hayColision(['260907 SOLICITUD 26-27.pdf'], '260907 26EM0368 SOLICITUD 26-27.pdf'),
  false);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
