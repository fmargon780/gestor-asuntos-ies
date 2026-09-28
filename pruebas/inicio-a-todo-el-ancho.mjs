/* Prueba en navegador de verdad de la fila 212 (28-sep-2026,
   docs/INICIO-A-TODO-EL-ANCHO.md): Inicio, tercera versión, sobre la
   fila 209 (docs/INICIO-EN-PESTANAS.md). Lo que no se toca (pestañas,
   tabla, columnas, orden, filtrado por aviso) queda cubierto por
   pruebas/inicio.mjs; aquí solo lo que cambia esta fila:

     1. Sin "#inicio-lado": no existe #inicio-lado (pruebas/inicio.mjs
        ya lo comprueba).
     2. Una sola línea, con dos correos y dos documentos sueltos:
        "Ha llegado: 2 correos · 2 documentos por clasificar"; pulsar
        "2 correos" abre "Ver todo" sin la lista de documentos, y
        pulsar "2 documentos…" la abre sin la bandeja; el enlace
        "Ver también…" vuelve a las dos juntas.
     3. El cuadro de avisos no ocupa todo el ancho (más estrecho que la
        pantalla) y su ✕ lo oculta por hoy, sin tocar "Ha llegado".
     4. El tablón está dentro de la cabecera de Inicio (no en una
        columna aparte); se puede escribir una nota y no se pierde al
        repintar.
     5. El panel de Filtros está cerrado al entrar y, con un filtro
        puesto, el botón dice "Filtros (1)".

   Reutiliza el disco de mentira de pruebas/navegador.mjs; el correo de
   mentira, con el mismo montaje que pruebas/correos.mjs (una carpeta
   de "bandeja" señalada a mano). */
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

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

/* ================= ENTRAR, CON UN ASUNTO VENCIDO (para el cuadro de avisos) ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const CLAVE = '260901 TRASLADO 26-27 Uno Vencido, Ana 1111';
const FECHA_AYER = isoHaceDias(1);

await pagina.evaluate(async ({ CLAVE, FECHA_AYER }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE, { create: true });

  /* Dos documentos sueltos: "2 documentos por clasificar". */
  abiertos._hijos.set('260926 escaneo del director.pdf',
    window.__disco.fich('260926 escaneo del director.pdf', 'un papel'));
  abiertos._hijos.set('260927 otro escaneo.pdf',
    window.__disco.fich('260927 otro escaneo.pdf', 'otro papel'));

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }
  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' }]);
  await escribir('asuntos.json', { asuntos: {
    [CLAVE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Vencido, Ana 1111', abiertoPor: 'Francisco', limite: FECHA_AYER }
  } });
  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: { [CLAVE]: { creados: '2026-09-01', hitos: [
      { id: 'a1', titulo: 'Revisar el expediente', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }
    ] } }
  });

  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE, FECHA_AYER });

/* La bandeja de correos: una carpeta de mentira, como en pruebas/correos.mjs. */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});

function correoDeMentira(id, asunto) {
  return {
    id, asunto, fecha: '2026-09-09T10:00:00.000Z', fechaUltimo: '2026-09-09T10:00:00.000Z', mensajes: 1,
    de: { nombre: 'Alguien', correo: id + '@correo.es' }, correos: [id + '@correo.es'],
    enlace: 'https://mail.google.com/mail/u/0/#search/rfc822msgid:' + id,
    pdf: id + ' - hilo.pdf', adjuntos: []
  };
}
async function dejarElCorreo(datos) {
  await pagina.evaluate((d) => {
    const b = window.__bandeja;
    b._hijos.set(d.id + '.json', window.__disco.fich(d.id + '.json', JSON.stringify(d)));
    if (d.pdf) b._hijos.set(d.pdf, window.__disco.fich(d.pdf, 'el hilo en pdf'));
  }, datos);
}
await dejarElCorreo(correoDeMentira('hilo-uno', 'Primer correo'));
await dejarElCorreo(correoDeMentira('hilo-dos', 'Segundo correo'));

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);

/* Señalar la carpeta de la bandeja, como pide Ajustes › Mantenimiento. */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(600);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(400);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo');

/* ================= 1. LA LÍNEA "HA LLEGADO: 2 CORREOS · 2 DOCUMENTOS POR CLASIFICAR" ================= */

console.log('--- 1. "Ha llegado: 2 correos · 2 documentos por clasificar" ---');
await comprobar('el texto exacto de la línea',
  pagina.locator('#inicio-ha-llegado-linea').textContent().then(t => t.replace(/\s+/g, ' ').trim()),
  'Ha llegado: 2 correos · 2 documentos por clasificar');

/* ================= 2. "2 CORREOS" ABRE "VER TODO" SIN LA LISTA DE DOCUMENTOS ================= */

console.log('--- 2. pulsar "2 correos" abre "Ver todo" sin la lista de documentos ---');
await pagina.locator('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo').nth(0).click();
await pagina.waitForTimeout(400);
await comprobar('"Ver todo" está a la vista', pagina.locator('#zona-clasificar').isVisible(), true);
await comprobar('sin la lista de documentos sueltos', pagina.locator('#lista-sueltos').isVisible(), false);
await comprobar('con la bandeja de correos (desplegada de partida)',
  pagina.locator('#bandeja-correos').isVisible(), true);
await comprobar('el enlace dice "Ver también los documentos"',
  pagina.locator('#sueltos-ver-tambien').textContent(), 'Ver también los documentos');

console.log('--- "Ver también los documentos" vuelve a enseñar las dos ---');
await pagina.click('#sueltos-ver-tambien');
await pagina.waitForTimeout(200);
await comprobar('ahora si se ve la lista de documentos', pagina.locator('#lista-sueltos').isVisible(), true);
await comprobar('el enlace desaparece (ya no hay filtro)', pagina.locator('#sueltos-ver-tambien').isVisible(), false);

/* ================= 3. "2 DOCUMENTOS…" ABRE "VER TODO" SIN LA BANDEJA ================= */

console.log('--- 3. pulsar "2 documentos por clasificar" abre "Ver todo" sin la bandeja ---');
await pagina.evaluate(() => App.irVista('departamento'));
await pagina.waitForTimeout(200);
await pagina.locator('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo').nth(1).click();
await pagina.waitForTimeout(400);
await comprobar('con la lista de documentos', pagina.locator('#lista-sueltos').isVisible(), true);
await comprobar('sin la bandeja de correos', pagina.locator('#correos-sin-clasificar').isVisible(), false);
await comprobar('el enlace dice "Ver también los correos"',
  pagina.locator('#sueltos-ver-tambien').textContent(), 'Ver también los correos');

await pagina.click('#btn-ha-llegado-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(300);

/* ================= 4. EL CUADRO DE AVISOS, PEQUEÑO, CON SU ✕ ================= */

console.log('--- 4. el cuadro de avisos no ocupa todo el ancho, y su ✕ lo oculta sin tocar "Ha llegado" ---');
await pagina.waitForSelector('[data-aviso="vencidos"]');
const anchoPantalla = await pagina.evaluate(() => document.getElementById('pantalla-abiertos').clientWidth);
const anchoAvisos = await pagina.evaluate(() => document.getElementById('avisos-linea').getBoundingClientRect().width);
await comprobar('el cuadro de avisos es bastante más estrecho que la pantalla', anchoAvisos < anchoPantalla * 0.7, true);

await pagina.click('#avisos-linea-ocultar');
await pagina.waitForTimeout(200);
await comprobar('el cuadro de avisos se esconde', pagina.locator('#avisos-linea').isVisible(), false);
await comprobar('"Ha llegado" sigue exactamente igual',
  pagina.locator('#inicio-ha-llegado-linea').textContent().then(t => t.replace(/\s+/g, ' ').trim()),
  'Ha llegado: 2 correos · 2 documentos por clasificar');

/* ================= 5. EL TABLÓN, EN LA CABECERA, SIN PERDER LO ESCRITO ================= */

console.log('--- 5. el tablón está en la cabecera; se escribe una nota y no se pierde al repintar ---');
await comprobar('el tablón vive dentro de la cabecera de Inicio',
  pagina.evaluate(() => {
    const cabecera = document.querySelector('#pantalla-abiertos .cabecera');
    return !!(cabecera && cabecera.contains(document.getElementById('tablon')));
  }), true);

await pagina.click('#tablon-texto');
await pagina.keyboard.type('Llamar al director', { delay: 10 });
await pagina.evaluate(() => { window.App.pintarAbiertos(); window.App.pintarAbiertos(); });
await pagina.waitForTimeout(100);
await comprobar('lo escrito sigue ahí tras dos repintados seguidos',
  pagina.inputValue('#tablon-texto'), 'Llamar al director');

await pagina.click('.tablon-pegar');
await pagina.waitForTimeout(400);
await comprobar('la nota queda pegada, en la fila compacta',
  pagina.locator('#tablon .tablon-fila-compacta-texto').first().textContent(), 'Llamar al director');

/* ================= 6. "FILTROS" EMPIEZA CERRADO, Y DICE "FILTROS (N)" ================= */

console.log('--- 6. "Filtros" empieza cerrado, y con un filtro puesto dice "Filtros (1)" ---');
await comprobar('empieza cerrado', pagina.locator('#filtros-abiertos').isHidden(), true);
await comprobar('el botón dice solo "Filtros"', pagina.locator('#btn-filtros').textContent(), 'Filtros');

await pagina.click('#btn-filtros');
await pagina.selectOption('#filtro-plazo', 'vencidos');
await pagina.waitForTimeout(200);
await comprobar('con un filtro puesto, dice "Filtros (1)"', pagina.locator('#btn-filtros').textContent(), 'Filtros (1)');
await pagina.selectOption('#filtro-plazo', '');
await pagina.click('#btn-filtros');

console.log('--- saliendo de Inicio y volviendo, los filtros vuelven a estar cerrados ---');
await pagina.click('#btn-filtros');
await comprobar('quedan abiertos, de momento', pagina.locator('#filtros-abiertos').isVisible(), true);
await pagina.evaluate(() => App.ir('archivo'));
await pagina.waitForTimeout(200);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await comprobar('al volver a entrar en Inicio, cerrados otra vez', pagina.locator('#filtros-abiertos').isHidden(), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
