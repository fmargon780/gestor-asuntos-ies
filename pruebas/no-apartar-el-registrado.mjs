/* Prueba de la fila 566 (docs/566-NO-APARTAR-EL-REGISTRADO.md), con Chromium real y el disco de mentira:
   1. Registrar con el PDF sellado y el original siendo el MISMO fichero (con número de documento): el documento se queda en la
      carpeta con su nombre, la carpeta de versiones previas queda vacía y el registro se apunta en la ficha.
   2. Lo mismo con un documento sin número de documento (nombre con código de registro): el sellado se renombra y no se aparta nada.
   3. El caso normal sigue igual: sellado y original distintos -> el sellado ocupa el nombre y «SIN SELLAR» va a versiones previas.
   4. Si tras apartar el original el registrado no está en la carpeta, se devuelve lo apartado y se avisa. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Uno, Eva 9990001';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (a1) => {
  const d1 = await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  for (const n of ['261106 FACTURA D26-00416.pdf', '261107 INFORME D26-00417.pdf', '261107 INFORME D26-00417 copia.pdf',
                   '261108 INFORME.pdf', '261109 CERTIFICADO D26-00500.pdf', '261109 escaneado.pdf']) await d1.getFileHandle(n, { create: true });
}, ASUNTO);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.waitForTimeout(800);

const SELLO = { anio: '26', serie: 'M', tipo: 'E', numero: '0368', fecha: '10/11/2026' };
const asociar = (pdf, original) => pagina.evaluate(async ([a1, pdf, original, sello]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === a1)[0];
  window.__avisos = []; const aviso = U.aviso; U.aviso = function (t, c) { window.__avisos.push(t); return aviso.apply(this, arguments); };
  const r = await RegistroSellado.asociar(a, pdf, original, sello, { noMarcar: true });
  U.aviso = aviso;
  return r;
}, [ASUNTO, pdf, original, SELLO]);
const carpeta = () => pagina.evaluate(async (a1) => {
  const d1 = await window.__disco.abiertos.getDirectoryHandle(a1);
  const arriba = [], previas = [];
  for (const [n, h] of d1._hijos) {
    if (h.kind === 'directory') { for (const [m] of h._hijos) previas.push(m); } else arriba.push(n);
  }
  return [arriba.sort(), previas.sort()];
}, ASUNTO);

console.log('--- 1. el mismo fichero (con número de documento) ---');
const r1 = await asociar('261106 FACTURA D26-00416.pdf', '261106 FACTURA D26-00416.pdf');
const c1 = await carpeta();
await comprobar('1. devuelve su nombre', r1, '261106 FACTURA D26-00416.pdf');
await comprobar('1. el registrado sigue arriba, con su nombre', c1[0].indexOf('261106 FACTURA D26-00416.pdf') !== -1, true);
await comprobar('1. no hay ningún «SIN SELLAR» apartado ni en la carpeta', [c1[1].filter((n) => /SIN SELLAR/.test(n)).length, c1[0].filter((n) => /SIN SELLAR/.test(n)).length], [0, 0]);
await comprobar('1. el registro se apunta en la ficha', pagina.evaluate(async (a1) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === a1)[0];
  const d = DocumentosDatos.deFichero(a.ficha, '261106 FACTURA D26-00416.pdf');
  return !!d && JSON.stringify(d).indexOf('26EM0368') !== -1; }, ASUNTO), true);

console.log('--- 2. el mismo fichero, sin número de documento ---');
const r2 = await asociar('261108 INFORME.pdf', '261108 INFORME.pdf');
const c2 = await carpeta();
await comprobar('2. el documento sigue en la carpeta (con el código de registro en el nombre) y no se aparta nada', [typeof r2, c2[0].filter((n) => /^261108/.test(n)).length, c2[1].filter((n) => /SIN SELLAR/.test(n)).length], ['string', 1, 0]);

console.log('--- 3. el caso normal sigue igual ---');
const r3 = await asociar('261107 INFORME D26-00417 copia.pdf', '261107 INFORME D26-00417.pdf');
const c3 = await carpeta();
await comprobar('3. el sellado ocupa el nombre del original', [r3, c3[0].indexOf('261107 INFORME D26-00417.pdf') !== -1], ['261107 INFORME D26-00417.pdf', true]);
await comprobar('3. el original sin sellar va a versiones previas', c3[1].filter((n) => /INFORME D26-00417 SIN SELLAR/.test(n)).length, 1);

console.log('--- 4. si el registrado no queda, se devuelve lo apartado ---');
await pagina.evaluate(() => { window.__renombrar = Carpetas.renombrarFichero; });
const r4 = await pagina.evaluate(async ([a1, sello]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === a1)[0];
  const original = Carpetas.renombrarFichero;
  /* El segundo cambio de nombre (el del sellado) no hace nada: el registrado no llega a la carpeta. */
  let n = 0;
  Carpetas.renombrarFichero = async function (dir, de, a2) { n++; if (n === 2) return; return original.apply(this, arguments); };
  const r = await RegistroSellado.asociar(a, '261109 escaneado.pdf', '261109 CERTIFICADO D26-00500.pdf', sello, { noMarcar: true });
  Carpetas.renombrarFichero = original;
  return r;
}, [ASUNTO, SELLO]);
const c4 = await carpeta();
await comprobar('4. no da por bueno el registro', r4, false);
await comprobar('4. el original vuelve a la carpeta y no queda apartado', [c4[0].indexOf('261109 CERTIFICADO D26-00500 SIN SELLAR.pdf') !== -1 || c4[0].indexOf('261109 CERTIFICADO D26-00500.pdf') !== -1, c4[1].filter((n) => /CERTIFICADO/.test(n)).length], [true, 0]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
