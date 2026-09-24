/* Prueba en navegador de verdad de que las notas de dentro del asunto
   no se borran mientras se escriben (17-sep-2026, fila 34 de la cola,
   docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md).

   El fallo: la ficha del asunto se repinta sola cada 20 segundos
   (App.mirarLaCarpeta → App.verAbiertos → App.reengancharFicha, fila
   30) y rehacía con innerHTML el <textarea id="ficha-nota-texto"> de
   la nota del asunto y el <textarea class="hito-nota-texto"> de la
   nota de un hito. Lo escrito, el foco y el cursor se perdían.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/quedarse-en-el-asunto.mjs y pruebas/tablon-no-se-borra.mjs. */
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
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'notas';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';

/* Un par de repasos automáticos de la carpeta, que es lo que corre solo
   cada App.SEGUNDOS_ENTRE_MIRADAS. App.mirarLaCarpeta solo relee la
   lista entera si algo ha cambiado ahí fuera, así que cada pasada
   viene con un documento nuevo en "Por clasificar": es el caso de
   verdad, el que sufre Francisco: el otro ordenador deja un papel
   suelto en la carpeta compartida y a él, que está escribiendo una
   nota dentro de un asunto que no tiene nada que ver, se le borra.

   Se llama también a App.pintarAbiertos(), que es el otro repintado
   que corre solo (el de presencia, cada 10 s, fila 24). */
let sueltos = 0;
function repasosAutomaticos() {
  return pagina.evaluate(async (desde) => {
    for (let i = 0; i < 2; i++) {
      const nombre = 'suelto-' + (desde + i) + '.pdf';
      window.__disco.abiertos._hijos.set(nombre, window.__disco.fich(nombre, 'algo'));
      await window.App.mirarLaCarpeta();
      window.App.pintarAbiertos();
    }
  }, (sueltos += 2) - 2);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  carpeta._hijos.set('260911 FACTURA Referencia 123.pdf',
    window.__disco.fich('260911 FACTURA Referencia 123.pdf', 'la factura'));
}, NOMBRE_ASUNTO);

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.waitForSelector('#ficha-nota-texto');
/* que la huella de la ficha quede apuntada antes de empezar */
await pagina.waitForTimeout(400);

console.log('--- 1 a 3. la nota del asunto ---');
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.click('#ficha-nota-texto');
await pagina.keyboard.type('He llamado al proveedor y me devuelve la llamada', { delay: 5 });
/* el cursor se deja a mitad de frase, no al final */
await pagina.evaluate(() => document.getElementById('ficha-nota-texto').setSelectionRange(11, 11));

await repasosAutomaticos();
await pagina.waitForTimeout(200);

await comprobar('1. lo escrito en la nota del asunto sigue ahí',
  pagina.inputValue('#ficha-nota-texto'), 'He llamado al proveedor y me devuelve la llamada');
await comprobar('2. el campo de la nota sigue teniendo el foco',
  pagina.evaluate(() => document.activeElement === document.getElementById('ficha-nota-texto')), true);
await comprobar('3. el cursor sigue donde estaba',
  pagina.evaluate(() => {
    const c = document.getElementById('ficha-nota-texto');
    return [c.selectionStart, c.selectionEnd];
  }), [11, 11]);

console.log('--- 4. la nota de un hito desplegado ---');
/* Un hito a mano: este asunto no tiene tipo con guía, así que no se
   crea ninguno solo. */
await pagina.evaluate(async (asunto) => {
  await window.Hitos.anadirHito(asunto, 'Pedir presupuesto');
  window.HitosPanel.programarRepintado();
}, NOMBRE_ASUNTO);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForSelector('#ficha-guia .hito');
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.click('#ficha-guia .hito .hito-desplegar');
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForSelector('#ficha-guia .hito-nota-texto');

await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.click('#ficha-guia .hito-nota-texto');
await pagina.keyboard.type('Me lo mandan el lunes', { delay: 5 });
await pagina.evaluate(() => {
  document.querySelector('#ficha-guia .hito-nota-texto').setSelectionRange(6, 6);
});

await repasosAutomaticos();
await pagina.waitForTimeout(300);

await comprobar('4. lo escrito en la nota del hito sigue ahí',
  pagina.inputValue('#ficha-guia .hito-nota-texto'), 'Me lo mandan el lunes');
await comprobar('4. el campo de la nota del hito sigue teniendo el foco',
  pagina.evaluate(() => document.activeElement === document.querySelector('#ficha-guia .hito-nota-texto')), true);
await comprobar('4. el cursor de la nota del hito sigue donde estaba',
  pagina.evaluate(() => {
    const c = document.querySelector('#ficha-guia .hito-nota-texto');
    return [c.selectionStart, c.selectionEnd];
  }), [6, 6]);
await comprobar('4. el hito sigue desplegado',
  pagina.evaluate(() => !document.querySelector('#ficha-guia .hito-cuerpo').classList.contains('oculto')), true);

console.log('--- 5. sin cambios en la carpeta, la ficha no se vuelve a pintar ---');
await pagina.evaluate(() => document.getElementById('ficha-nota-texto').blur());
await pagina.evaluate(() => {
  window.__pintadas = 0;
  /* El repintado de la ficha rehace #ficha-asunto-cuerpo entero: se
     cuenta mirando si el <textarea> de la nota es el mismo nodo de
     antes, que es la forma de saberlo desde fuera. */
  window.__nodoNota = document.getElementById('ficha-nota-texto');
});
await pagina.evaluate(async () => {
  for (let i = 0; i < 3; i++) await window.App.reengancharFicha();
});
await pagina.waitForTimeout(200);
await comprobar('5. App.reengancharFicha no ha vuelto a pintar la ficha',
  pagina.evaluate(() => window.__nodoNota === document.getElementById('ficha-nota-texto')), true);

console.log('--- 6. cuando sí cambia algo se repinta, y la nota sobrevive al repintado ---');
/* Aquí la ficha se rehace de verdad (llega un documento a la carpeta
   DEL ASUNTO): es U.conservandoLoEscrito quien tiene que salvar la
   nota, el foco y el cursor, no el atajo de no repintar. */
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.click('#ficha-nota-texto');
await pagina.evaluate(() => document.getElementById('ficha-nota-texto').setSelectionRange(11, 11));
await pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
  carpeta._hijos.set('260911 PRESUPUESTO Referencia 123.pdf',
    window.__disco.fich('260911 PRESUPUESTO Referencia 123.pdf', 'el presupuesto'));
  await window.App.verAbiertos();
}, NOMBRE_ASUNTO);
await pagina.waitForTimeout(300);
await comprobar('6. un documento nuevo en la carpeta sí repinta la ficha',
  pagina.evaluate(() => window.__nodoNota !== document.getElementById('ficha-nota-texto')), true);
await comprobar('6. y el documento nuevo se ve en la ficha',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento'))
    .some((b) => b.textContent.indexOf('PRESUPUESTO') !== -1)), true);
await comprobar('6. lo escrito sobrevive a ese repintado de verdad',
  pagina.inputValue('#ficha-nota-texto'), 'He llamado al proveedor y me devuelve la llamada');
await comprobar('6. y el foco y el cursor también',
  pagina.evaluate(() => {
    const c = document.getElementById('ficha-nota-texto');
    return [document.activeElement === c, c.selectionStart, c.selectionEnd];
  }), [true, 11, 11]);

console.log('--- 7. la ficha en tarjetas (fila 107, 24-sep-2026): el orden ---');
/* docs/FICHA-EN-TARJETAS.md, 1: arriba Hitos, Documentos, Datos y
   contacto; abajo Notas, Otros asuntos, Personas. Sustituye a la
   comprobación de las tres columnas de la fila 51. */
await comprobar('7. el orden de las tarjetas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-tarjetas .ficha-tarjeta')).map((t) => t.dataset.tarjeta)),
  ['hitos', 'documentos', 'contacto', 'notas', 'otros', 'relacionados']);

console.log('--- 8. la nota ya no se guarda sola mientras se escribe (fila 58) ---');
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.fill('#ficha-nota-texto', 'No se guarda mientras se escribe');
await pagina.waitForTimeout(1400);
await comprobar('8. pasado más de un segundo, sigue sin estar en la lista',
  pagina.evaluate(() => document.getElementById('ficha-notas-lista').textContent.indexOf('No se guarda mientras se escribe') !== -1),
  false);

await pagina.click('#ficha-nota-guardar');
await pagina.waitForFunction(() =>
  document.getElementById('ficha-notas-lista').textContent.indexOf('No se guarda mientras se escribe') !== -1);
await comprobar('8. al pulsar "Guardar" sí queda guardada',
  pagina.evaluate(() => document.getElementById('ficha-notas-lista').textContent.indexOf('No se guarda mientras se escribe') !== -1),
  true);
await comprobar('8. lo escrito sigue en la caja (no se limpia sola)',
  pagina.inputValue('#ficha-nota-texto'), 'No se guarda mientras se escribe');

console.log('--- 9. perder el foco con algo escrito también guarda ---');
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.fill('#ficha-nota-texto', 'Se guarda al salir del recuadro');
await pagina.evaluate(() => document.getElementById('ficha-nota-texto').blur());
await pagina.waitForFunction(() =>
  document.getElementById('ficha-notas-lista').textContent.indexOf('Se guarda al salir del recuadro') !== -1);
await comprobar('9. al perder el foco con texto, se guarda sola',
  pagina.evaluate(() => document.getElementById('ficha-notas-lista').textContent.indexOf('Se guarda al salir del recuadro') !== -1),
  true);

console.log('--- 10. salir de la ficha con una nota sin guardar avisa ---');
/* Un clic de verdad en "Volver" ya deja la nota guardada solo con
   perder el foco (punto 9): el aviso de este punto se ve de verdad
   con Escape, que pulsa el mismo botón por dentro (js/usabilidad.js)
   sin que el campo llegue a perder el foco antes (no hay blur real,
   solo el evento "click" sintético). */
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.fill('#ficha-nota-texto', 'Nota sin guardar de verdad');
/* Con la tarjeta de Notas abierta, el primer Escape vuelve a la
   cuadrícula (fila 107); el segundo es el que sale de la ficha. */
await pagina.keyboard.press('Escape');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('10. el aviso es el que toca',
  pagina.locator('#cuadro-titulo').textContent(), 'Tienes una nota sin guardar');
await comprobar('10. sigue en la ficha, no se ha ido a la lista',
  pagina.evaluate(() => !document.getElementById('pantalla-asunto').classList.contains('oculto')), true);
await pagina.click('#cuadro-aceptar');
/* "#capa" se oculta al momento, en el propio clic (U.preguntar,
   js/util.js): eso NO quiere decir que el guardado ya haya terminado.
   Con la nota disparada también por el foco perdido al abrirse este
   mismo aviso (punto 9), "Guardar y salir" espera a ese guardado
   antes de volver a la lista (js/notas.js, `guardarBorrador`
   encadenada) — lo que hay que esperar de verdad es la pantalla de
   destino, no el cuadro. */
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('10. "Guardar y salir" ha guardado la nota en el fichero compartido',
  pagina.evaluate(async (asunto) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    const notas = (j.asuntos[asunto] && j.asuntos[asunto].notas) || [];
    return notas.some((n) => n.texto === 'Nota sin guardar de verdad');
  }, NOMBRE_ASUNTO),
  true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
