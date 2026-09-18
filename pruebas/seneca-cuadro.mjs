/* Prueba en navegador de verdad del cuadro ancho de "Mensaje de
   Séneca" (18-sep-2026, fila 53, docs/SENECA-CUADRO-ANCHO.md). Ningún
   cambio de funcionamiento respecto al cuadro viejo: mismos datos,
   misma disposición nueva.

   Lo que tiene que pasar (sección 5 del encargo):
     1. El cuadro ocupa el ancho, en dos columnas.
     2. El asunto se lee entero, sin cortarse, con su cuenta de
        caracteres debajo.
     3. Con un tipo sin plantilla de Séneca, sale el aviso en vez del
        hueco vacío.
     4. Los dos botones numerados copian lo suyo y dicen "Copiado".
     5. La explicación del ayudante está plegada.
     6. Estrechando la ventana a menos de 900px, todo cae en una
        columna y nada se sale.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, mismo
   patrón que pruebas/plantillas.mjs (que ya prueba el reparto de
   plantillas, compartido con el cuadro de Correo: aquí no se repite). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const CON_PLANTILLA = '260910 SANCION 26-27 Muy Larga Referencia Escolar Del Alumno, Pérez López García, Ana María 1234567';
const SIN_PLANTILLA = '260901 COMPRA 26-27 Suministros Generales SL';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ({ conPlantilla, sinPlantilla }) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [conPlantilla]: {
        tipo: 'SANCION', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        tercero: 'Pérez López García, Ana María 1234567', grupo: '2ºA', curso: '26-27'
      },
      [sinPlantilla]: {
        tipo: 'COMPRA', categoria: 'EMPRESAS', situacion: 'PENDIENTE', tercero: 'Suministros Generales SL'
      }
    }
  })));
  g._hijos.set('plantillas.json', window.__disco.fich('plantillas.json', JSON.stringify({
    lista: [
      { id: 'pl-1', tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Aviso corto',
        texto: 'Le informamos a {nombre} ({grupo}) de una sanción.' }
    ]
  })));
  await window.__disco.abiertos.getDirectoryHandle(conPlantilla, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(sinPlantilla, { create: true });
}, { conPlantilla: CON_PLANTILLA, sinPlantilla: SIN_PLANTILLA });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirSeneca(nombreAsunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: nombreAsunto }).click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('.boton-comunicar');
  await pagina.getByRole('button', { name: 'Mensaje de Séneca', exact: true }).click();
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#seneca-cuerpo-texto');
}

/* ============================================================
   1. EL CUADRO OCUPA EL ANCHO, EN DOS COLUMNAS
   ============================================================ */
console.log('--- 1. el cuadro, ancho y a dos columnas ---');
await abrirSeneca(CON_PLANTILLA);

await comprobarQue('1. el cuadro lleva la clase del ancho nuevo',
  pagina.evaluate(() => !!document.querySelector('#capa .cuadro.cuadro-seneca')));

async function columnas() {
  return pagina.evaluate(() =>
    getComputedStyle(document.querySelector('.seneca-grid')).gridTemplateColumns.trim().split(/\s+/).length);
}
await comprobar('1. a 1400px, dos columnas', columnas(), 2);

async function posiciones() {
  return pagina.evaluate(() => {
    const rect = (s) => document.querySelector(s).getBoundingClientRect();
    return { izq: rect('.seneca-col-izq'), der: rect('.seneca-col-der') };
  });
}
const p1400 = await posiciones();
await comprobarQue('1. las dos columnas van una al lado de la otra',
  Promise.resolve(p1400.der.left > p1400.izq.left && Math.abs(p1400.izq.top - p1400.der.top) < 3));

/* ============================================================
   2. EL ASUNTO SE LEE ENTERO, CON SU CUENTA DE CARACTERES
   ============================================================ */
console.log('--- 2. el asunto entero, con su cuenta de caracteres ---');
/* En Séneca manda de partida la versión legible (el nombre de la
   carpeta no cabe en el asunto de Séneca): mismo comportamiento de
   siempre, solo cambia la disposición. */
const legible = await pagina.locator('#seneca-asunto').inputValue();
await comprobarQue('2. de partida sale la versión legible (más corta que el nombre de la carpeta)',
  Promise.resolve(legible.length > 0 && legible !== CON_PLANTILLA));
await comprobarQue('2. no es un input de una línea: es un textarea',
  pagina.evaluate(() => document.getElementById('seneca-asunto').tagName === 'TEXTAREA'));
await comprobar('2. la cuenta de caracteres es la de lo que hay escrito',
  pagina.locator('#seneca-asunto-cuenta').textContent(), legible.length + ' caracteres');

await pagina.click('#seneca-nombre-carpeta');
await pagina.waitForTimeout(150);
await comprobar('2. "Nombre de la carpeta" trae el nombre entero, sin cortarse',
  pagina.locator('#seneca-asunto').inputValue(), CON_PLANTILLA);
await comprobar('2. la cuenta de caracteres es la del asunto entero',
  pagina.locator('#seneca-asunto-cuenta').textContent(), CON_PLANTILLA.length + ' caracteres');
await pagina.click('#seneca-legible');
await pagina.waitForTimeout(150);
await comprobar('2. "Versión legible" lo devuelve a la versión corta',
  pagina.locator('#seneca-asunto').inputValue(), legible);

/* ============================================================
   4. LOS DOS BOTONES NUMERADOS
   ============================================================ */
console.log('--- 4. los dos botones numerados copian lo suyo ---');
await comprobarQue('4. "1. Copiar el asunto" empieza destacado',
  pagina.evaluate(() => document.getElementById('seneca-paso-asunto').classList.contains('boton-principal')));
await comprobarQue('4. "2. Copiar el texto" no, de entrada',
  pagina.evaluate(() => !document.getElementById('seneca-paso-texto').classList.contains('boton-principal')));

await pagina.click('#seneca-paso-asunto');
await pagina.waitForFunction(() => document.getElementById('seneca-paso-asunto').textContent.trim() === 'Copiado');
await comprobar('4. copia el asunto', pagina.evaluate(() => navigator.clipboard.readText()), legible);
await comprobarQue('4. tras copiar el asunto, se destaca "2. Copiar el texto"',
  pagina.evaluate(() => document.getElementById('seneca-paso-texto').classList.contains('boton-principal')));

const textoDelMensaje = await pagina.locator('#seneca-cuerpo-texto').inputValue();
await pagina.click('#seneca-paso-texto');
await pagina.waitForFunction(() => document.getElementById('seneca-paso-texto').textContent.trim() === 'Copiado');
await comprobar('4. copia el texto del mensaje',
  pagina.evaluate(() => navigator.clipboard.readText()), textoDelMensaje);

/* Se puede volver a copiar el asunto en cualquier momento, en cualquier orden. */
await pagina.click('#seneca-paso-asunto');
await pagina.waitForFunction(() => document.getElementById('seneca-paso-asunto').textContent.trim() === 'Copiado');
await comprobar('4. "1" se puede volver a pulsar después de "2", y sigue copiando el asunto',
  pagina.evaluate(() => navigator.clipboard.readText()), legible);

/* ============================================================
   5. EL AYUDANTE, PLEGADO
   ============================================================ */
console.log('--- 5. la explicación del ayudante está plegada ---');
await comprobarQue('5. hay un <details> cerrado de partida',
  pagina.evaluate(() => {
    const d = document.querySelector('#seneca-ayudante details');
    return !!d && !d.open;
  }));
await comprobarQue('5. el enlace de instalar está fuera, a la vista',
  pagina.evaluate(() => {
    const enlace = document.querySelector('#seneca-ayudante a');
    return !!enlace && enlace.textContent.indexOf('Instalar el ayudante de Séneca') !== -1 &&
      !enlace.closest('details');
  }));
await pagina.click('#seneca-ayudante summary');
await pagina.waitForTimeout(100);
await comprobarQue('5. al desplegarlo, sale el texto de siempre',
  pagina.evaluate(() => document.querySelector('#seneca-ayudante details').textContent
    .indexOf('barra de marcadores') !== -1));

/* ============================================================
   6. ESTRECHANDO LA VENTANA, UNA SOLA COLUMNA
   ============================================================ */
console.log('--- 6. por debajo de 900px, una sola columna ---');
await pagina.setViewportSize({ width: 800, height: 900 });
await pagina.waitForTimeout(200);
await comprobar('6. una sola columna', columnas(), 1);
const p800 = await posiciones();
await comprobarQue('6. la columna derecha va debajo de la izquierda',
  Promise.resolve(p800.der.top >= p800.izq.bottom - 3));
await comprobarQue('6. nada se sale del ancho de la ventana',
  pagina.evaluate(() => document.querySelector('.cuadro-seneca').scrollWidth <= document.querySelector('.cuadro-seneca').clientWidth + 2));
await pagina.setViewportSize({ width: 1400, height: 900 });

await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ============================================================
   3. SIN PLANTILLA DE SÉNECA, EL AVISO EN VEZ DEL HUECO VACÍO
   ============================================================ */
console.log('--- 3. sin plantilla, el aviso con el enlace ---');
await abrirSeneca(SIN_PLANTILLA);
await comprobar('3. no hay desplegable de plantilla (el tipo no tiene ninguna)',
  pagina.locator('#seneca-plantilla').count(), 0);
await comprobarQue('3. sale el aviso de que no hay plantilla, con el enlace',
  pagina.evaluate(() => {
    const aviso = document.getElementById('seneca-sin-plantilla');
    return !!aviso && aviso.textContent.indexOf('no tiene plantilla de mensaje de Séneca') !== -1 &&
      !!aviso.querySelector('#seneca-ir-a-plantilla');
  }));
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
