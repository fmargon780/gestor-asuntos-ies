/* Prueba en navegador de verdad de la fila de copiar de un gesto
   (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 1): debajo
   del nombre del asunto, siempre a la vista, sin menú.

   Lo que tiene que pasar:
     - Asunto: siempre sale, y copia el nombre completo de la carpeta.
     - Nombre: sale cuando el tercero se encuentra en el fichero de
       datos, y copia `Apellidos, Nombre` (la razón social en empresas).
     - NIE: solo en alumnado, y solo si el nombre de la carpeta trae el
       número pegado.
     - DNI (o CIF en empresas): solo si el tercero tiene ese dato.
     - Un botón sin dato no se pone (alumno sin DNI en el fichero).

   pruebas/cabecera-del-asunto.mjs ya comprueba "Asunto" y "NIE" (que no
   necesitan ningún fichero de datos); esta prueba es la que monta
   RegAlum.csv, RelPerCen y empresas.csv para comprobar también "Nombre"
   y "DNI"/"CIF" con datos de verdad.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 850 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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

const ALUMNO_CON_DNI = '260918 SOLICITUD 26-27 Pérez Ruiz, Ana 1150055';
const ALUMNO_SIN_DNI = '260918 SOLICITUD 26-27 López Soto, Iván 1150066';
const PERSONAL = '260918 PERMISO Ordóñez Gil, Rafael';
const EMPRESA = '260918 COMPRA Suministros Escolares SL';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([alumnoConDni, alumnoSinDni, personal, empresa]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [alumnoConDni]: { tercero: 'Pérez Ruiz, Ana 1150055', categoria: 'ALUMNADO', situacion: 'PENDIENTE' },
      [alumnoSinDni]: { tercero: 'López Soto, Iván 1150066', categoria: 'ALUMNADO', situacion: 'PENDIENTE' },
      [personal]: { tercero: 'Ordóñez Gil, Rafael', categoria: 'PERSONAL', situacion: 'PENDIENTE' },
      [empresa]: { tercero: 'Suministros Escolares SL', categoria: 'EMPRESAS', situacion: 'PENDIENTE' }
    }
  })));
  for (const n of [alumnoConDni, alumnoSinDni, personal, empresa]) {
    await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
  }

  const d = await g.getDirectoryHandle('datos', { create: true });

  const regAlum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;DNI/Pasaporte',
    'Pérez Ruiz, Ana;1150055;2º de E.S.O.;2º A;2026;Matriculada;05/05/2012;12345678Z',
    'López Soto, Iván;1150066;2º de E.S.O.;2º B;2026;Matriculado;10/10/2012;'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regAlum));

  const relPerCen = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015",""'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', relPerCen));

  const empresas = [
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
    'Suministros Escolares SL;;B87654321;Marta;952111222;marta@suministros.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', empresas));
}, [ALUMNO_CON_DNI, ALUMNO_SIN_DNI, PERSONAL, EMPRESA]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(150);
  await pagina.locator('.tarjeta-nombre', { hasText: nombre }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.ficha-copiar-fila');
}

/* "Nombre" y DNI/CIF viven en el DOM desde el primer pintado, ocultos
   con `hidden` hasta que responde el fichero de datos (18-sep-2026,
   fila 58: así revelarlos no mete un nodo nuevo, y no le hace repintar
   de más al panel de hitos, js/hitos-panel.js). Por eso todo lo de
   aquí filtra `:not([hidden])`: un botón sin dato sigue en el DOM,
   pero no debe contar como "puesto". */
function etiquetas() {
  return pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'))
    .map((b) => b.textContent.trim()));
}

async function esperarBotones(n) {
  await pagina.waitForFunction((minimo) =>
    document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])').length >= minimo, n);
}

async function copiarYLeer(etiqueta) {
  await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("' + etiqueta + '")');
  await pagina.waitForFunction((et) => {
    const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
      .find((x) => x.textContent.trim() === 'Copiado');
    return !!b;
  }, etiqueta);
  return pagina.evaluate(() => navigator.clipboard.readText());
}

/* ============================================================
   1. ALUMNADO CON DNI: los cuatro botones
   ============================================================ */
console.log('--- 1. alumnado con DNI: los cuatro botones ---');
await abrirFicha(ALUMNO_CON_DNI);
await esperarBotones(4);
await comprobar('1. los cuatro botones, en orden',
  etiquetas(), ['Asunto', 'NIE', 'Nombre', 'DNI']);
await comprobar('1. "Asunto" copia el nombre completo de la carpeta',
  copiarYLeer('Asunto'), ALUMNO_CON_DNI);
await comprobar('1. "NIE" copia el número, sin el nombre',
  copiarYLeer('NIE'), '1150055');
await comprobar('1. "Nombre" copia Apellidos, Nombre del tercero',
  copiarYLeer('Nombre'), 'Pérez Ruiz, Ana');
await comprobar('1. "DNI" copia el documento del alumno',
  copiarYLeer('DNI'), '12345678Z');

/* ============================================================
   2. ALUMNADO SIN DNI: el botón DNI no se pone
   ============================================================ */
console.log('--- 2. alumnado sin DNI en el fichero: sin botón DNI ---');
await abrirFicha(ALUMNO_SIN_DNI);
await esperarBotones(3);
await pagina.waitForTimeout(300);   /* que no llegue un cuarto botón con retraso */
await comprobar('2. tres botones: Asunto, NIE y Nombre, sin DNI',
  etiquetas(), ['Asunto', 'NIE', 'Nombre']);

/* ============================================================
   3. PERSONAL: Nombre y DNI, nunca NIE
   ============================================================ */
console.log('--- 3. personal: Nombre y DNI, sin NIE ---');
await abrirFicha(PERSONAL);
await esperarBotones(3);
await comprobar('3. tres botones: Asunto, Nombre y DNI, sin NIE',
  etiquetas(), ['Asunto', 'Nombre', 'DNI']);
await comprobar('3. "DNI" copia el documento del empleado',
  copiarYLeer('DNI'), '44556677B');

/* ============================================================
   4. EMPRESAS: el botón del documento se llama CIF
   ============================================================ */
console.log('--- 4. empresas: el botón del documento se llama CIF ---');
await abrirFicha(EMPRESA);
await esperarBotones(3);
await comprobar('4. tres botones: Asunto, Nombre y CIF, sin NIE',
  etiquetas(), ['Asunto', 'Nombre', 'CIF']);
await comprobar('4. "Nombre" copia la razón social',
  copiarYLeer('Nombre'), 'Suministros Escolares SL');
await comprobar('4. "CIF" copia el NIF de la empresa',
  copiarYLeer('CIF'), 'B87654321');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
