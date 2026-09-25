/* Prueba en navegador de verdad de "plantillas de correo y de mensaje
   de Séneca" (docs/PLANTILLAS-DE-CORREO.md, 16-sep-2026, fila 14 de
   docs/COLA.md).

   Lo que tiene que pasar:
     1. Un asunto de un tipo con una plantilla abre el cuadro con el
        cuerpo ya escrito, y los huecos sustituidos por sus datos.
     2. Un hueco sin valor sale vacío y aparece el aviso "Faltan
        datos: …".
     3. Un tipo con dos plantillas enseña el desplegable, y cambiar de
        plantilla reescribe el cuerpo.
     4. Si el medio está escrito a mano, cambiar de plantilla pregunta
        antes de pisarlo.
     5. La firma sale de plantillas.json; si el fichero no existe, sale
        la de siempre y nada falla.
     6. Un tipo sin plantillas se comporta exactamente como hoy: sin
        desplegable.
     7. En el cuadro de Séneca, un texto de más de 4.000 letras se
        recorta y se avisa.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
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

const CON_PLANTILLA = '260910 SANCION 26-27 Perez Lopez, Ana 1234567';
const SIN_PLANTILLA = '260901 COMPRA 26-27 Suministros SL';

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ({ conPlantilla, sinPlantilla }) => {
  const abiertos = window.__disco.abiertos;
  const registro = { asuntos: {} };
  registro.asuntos[conPlantilla] = {
    estado: 'abierto', tipo: 'SANCION', categoria: 'ALUMNADO',
    tercero: 'Perez Lopez, Ana 1234567', grupo: '2ºA', curso: '26-27'
  };
  registro.asuntos[sinPlantilla] = {
    estado: 'abierto', tipo: 'COMPRA', categoria: 'EMPRESAS', tercero: 'Suministros SL'
  };
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('asuntos.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify(registro));
  await w.close();
  await abiertos.getDirectoryHandle(conPlantilla, { create: true });
  await abiertos.getDirectoryHandle(sinPlantilla, { create: true });
}, { conPlantilla: CON_PLANTILLA, sinPlantilla: SIN_PLANTILLA });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

async function abrirFichaDe(nombreAsunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: nombreAsunto }).click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
}

async function abrirCorreoDe(nombreAsunto) {
  await abrirFichaDe(nombreAsunto);
  /* "Correo" vive ahora dentro de "Comunicar" (18-sep-2026, fila 52,
     docs/CABECERA-DEL-ASUNTO.md). */
  /* Fila 154: con hitos, «Comunicar» de arriba va escondido (vive en la mesa del hito); su menú se pulsa por debajo. */
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#correo-cuerpo-texto');
}

async function cerrarCuadro() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#capa', { state: 'hidden' });
}

/* ========================================================
   5 (primera mitad) y 6 · sin plantillas.json todavía: ni desplegable,
   ni falla nada, y sale la firma de siempre.
   ======================================================== */
await abrirCorreoDe(CON_PLANTILLA);
await comprobar('sin plantillas.json no sale el desplegable',
  pagina.locator('#correo-plantilla').count(), 0);
await comprobar('sale la firma de siempre',
  pagina.locator('#correo-cuerpo-texto').inputValue()
    .then(t => t.indexOf('Un saludo.\nFrancisco\nIES Fuente Lucena') !== -1), true);
await cerrarCuadro();

/* ========================================================
   se crean las plantillas (como si se hubieran hecho en Ajustes)
   ======================================================== */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('plantillas.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify({
    firma: 'Atentamente,\n{usuario}\n{centro}',
    centro: 'Colegio de Pruebas',
    lista: [
      { id: 'pl-1', tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Aviso corto',
        texto: 'Le informamos a {nombre} ({grupo}) de una sanción. Fecha límite: {limite}.' },
      { id: 'pl-2', tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Aviso largo',
        texto: 'Estimados: comunicamos formalmente a {nombre} que debe presentarse cuanto antes.' }
    ]
  }));
  await w.close();
});

/* ========================================================
   1, 2 y 5 (segunda mitad) · la primera plantilla, con un hueco sin dato
   ======================================================== */
await abrirCorreoDe(CON_PLANTILLA);
await comprobar('el desplegable trae las dos plantillas más "Sin plantilla"',
  pagina.locator('#correo-plantilla option').count(), 3);
await comprobar('sale puesta la primera',
  pagina.locator('#correo-plantilla').inputValue(), 'pl-1');

const cuerpo1 = await pagina.locator('#correo-cuerpo-texto').inputValue();
await comprobar('el hueco del nombre está relleno', cuerpo1.indexOf('Perez Lopez, Ana') !== -1, true);
await comprobar('el hueco del grupo está relleno', cuerpo1.indexOf('2ºA') !== -1, true);
await comprobar('el hueco sin dato se queda vacío', cuerpo1.indexOf('{limite}') !== -1, false);
await comprobar('la firma sale de plantillas.json',
  cuerpo1.indexOf('Atentamente,\nFrancisco\nColegio de Pruebas') !== -1, true);

await comprobar('avisa de que falta la fecha límite',
  pagina.locator('#correo-faltan-datos').textContent().then(t => t.indexOf('Fecha límite') !== -1), true);

/* ========================================================
   3 · cambiar de plantilla sin haber tocado nada
   ======================================================== */
await pagina.selectOption('#correo-plantilla', 'pl-2');
await pagina.waitForTimeout(200);
const cuerpo2 = await pagina.locator('#correo-cuerpo-texto').inputValue();
await comprobar('el cuerpo cambia con la segunda plantilla',
  cuerpo2.indexOf('comunicamos formalmente') !== -1, true);
await comprobar('ya no queda nada de la primera',
  cuerpo2.indexOf('de una sanción') !== -1, false);

/* ========================================================
   4 · con algo escrito a mano, cambiar de plantilla pregunta antes
   ======================================================== */
await pagina.fill('#correo-cuerpo-texto',
  (await pagina.locator('#correo-cuerpo-texto').inputValue()) + '\n\nAñadido a mano.');
await pagina.selectOption('#correo-plantilla', 'pl-1');
await pagina.waitForSelector('#correo-plantilla-confirmar:has-text("se perderá")');

await comprobar('lo escrito a mano no se pierde solo',
  pagina.locator('#correo-cuerpo-texto').inputValue().then(t => t.indexOf('Añadido a mano.') !== -1), true);

await pagina.click('#correo-plantilla-confirmar >> text=Seguir con lo escrito');
await comprobar('al no confirmar, el desplegable vuelve a la de antes',
  pagina.locator('#correo-plantilla').inputValue(), 'pl-2');
await comprobar('y el texto sigue siendo el escrito a mano',
  pagina.locator('#correo-cuerpo-texto').inputValue().then(t => t.indexOf('Añadido a mano.') !== -1), true);

await pagina.selectOption('#correo-plantilla', 'pl-1');
await pagina.waitForSelector('#correo-plantilla-confirmar:has-text("se perderá")');
await pagina.click('#correo-plantilla-confirmar >> text=Cambiar de todas formas');
await pagina.waitForTimeout(200);
await comprobar('confirmando, el cuerpo se reescribe con la nueva plantilla',
  pagina.locator('#correo-cuerpo-texto').inputValue()
    .then(t => t.indexOf('de una sanción') !== -1 && t.indexOf('Añadido a mano.') === -1), true);

await cerrarCuadro();

/* ========================================================
   6 · un tipo sin plantillas, exactamente como antes
   ======================================================== */
await abrirCorreoDe(SIN_PLANTILLA);
await comprobar('un tipo sin plantillas no trae desplegable',
  pagina.locator('#correo-plantilla').count(), 0);
await comprobar('el cuerpo sale en blanco, con el saludo y la firma de siempre',
  pagina.locator('#correo-cuerpo-texto').inputValue()
    .then(t => t.indexOf('Buenos días:') === 0 && t.indexOf('Atentamente,') !== -1), true);
await cerrarCuadro();

/* ========================================================
   7 · en Séneca, más de 4.000 letras se recorta al copiar
   ======================================================== */
await abrirFichaDe(CON_PLANTILLA);
/* "Mensaje Séneca" vive ahora dentro de "Comunicar" (18-sep-2026, fila 52,
   docs/CABECERA-DEL-ASUNTO.md). */
/* Fila 154: con hitos, «Comunicar» de arriba va escondido (vive en la mesa del hito); su menú se pulsa por debajo. */
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Mensaje de Séneca');
await pagina.waitForSelector('#capa:not(.oculto)');
/* El cuadro de Séneca es el de js/seneca-cuadro.js desde la fila 53
   (18-sep-2026, docs/SENECA-CUADRO-ANCHO.md): el texto va en
   #seneca-cuerpo-texto (no en #correo-asunto/#correo-cuerpo-texto,
   que ya no existen ahí), y los dos pasos son botones propios, no
   #seneca-paso. */
await pagina.waitForSelector('#seneca-cuerpo-texto');

const textoLargo = 'x'.repeat(5000);
await pagina.fill('#seneca-cuerpo-texto', textoLargo);
await pagina.click('#seneca-copiar-asunto');   /* 1. copiar el asunto */
await pagina.click('#seneca-copiar-texto');    /* 2. copiar el texto, recortado */
await pagina.waitForSelector('.mensaje.ambar:has-text("recortado a 4.000 letras")');

await comprobar('lo copiado no pasa de 4.000 letras',
  pagina.evaluate(() => navigator.clipboard.readText()).then(t => t.length),
  4000);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
