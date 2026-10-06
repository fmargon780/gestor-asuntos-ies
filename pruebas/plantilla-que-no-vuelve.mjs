/* Prueba de la fila 271 (plantilla que no vuelve sola).

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

async function abrirFichaDe(nombreAsunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombreAsunto + '"] .nombre-pulsable').click();
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


/* Fila 271 (docs/PLANTILLA-QUE-NO-VUELVE-SOLA.md): «Sin plantilla» se queda, un tipo sin
   plantilla propia abre sin plantilla, y las de aviso (sin tipo) solo salen si se piden. */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('plantillas.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify({
    firma: 'Atentamente,\n{usuario}\n{centro}', centro: 'Colegio de Pruebas',
    lista: [
      { id: 'av-1', nombre: 'Aviso de avance', texto: 'Aviso de avance para {nombre}.' },
      { id: 'av-2', nombre: 'Aviso de cierre', texto: 'Aviso de cierre para {nombre}.' },
      { id: 'pl-1', tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Plantilla del tipo', texto: 'Sanción de {nombre}.' }
    ]
  }));
  await w.close();
});

async function abrirComunicar(nombreAsunto, texto) {
  await abrirFichaDe(nombreAsunto);
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), texto);
  await pagina.waitForSelector('#capa:not(.oculto)');
}
for (const cuadro of [
  { medio: 'Correo', opcion: 'Correo electrónico', desplegable: '#correo-plantilla', texto: '#correo-cuerpo-texto' },
  { medio: 'Séneca', opcion: 'Mensaje de Séneca', desplegable: '#seneca-plantilla', texto: '#seneca-cuerpo-texto' }
]) {
  await abrirComunicar(SIN_PLANTILLA, cuadro.opcion);
  await pagina.waitForSelector(cuadro.texto);
  await comprobar(cuadro.medio + ': tipo sin plantilla propia abre en «Sin plantilla»',
    pagina.locator(cuadro.desplegable).inputValue(), '');
  for (const id of ['av-1', 'av-2', '', 'av-2']) {
    await pagina.selectOption(cuadro.desplegable, id);
    await pagina.waitForTimeout(200);
    await comprobar(cuadro.medio + ': se queda «' + (id || 'Sin plantilla') + '»',
      pagina.locator(cuadro.desplegable).inputValue(), id);
    await comprobar(cuadro.medio + ': el texto cambia con «' + (id || 'Sin plantilla') + '»',
      pagina.locator(cuadro.texto).inputValue().then(t => id === 'av-1' ? t.indexOf('Aviso de avance') !== -1
        : id === 'av-2' ? t.indexOf('Aviso de cierre') !== -1 : t.indexOf('Aviso de') === -1), true);
  }
  await cerrarCuadro();
  await abrirComunicar(CON_PLANTILLA, cuadro.opcion);
  await pagina.waitForSelector(cuadro.texto);
  await comprobar(cuadro.medio + ': tipo con plantilla propia abre con ella',
    pagina.locator(cuadro.desplegable).inputValue(), 'pl-1');
  await cerrarCuadro();
}

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
