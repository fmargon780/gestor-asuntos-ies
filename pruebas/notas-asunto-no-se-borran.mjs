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
await pagina.waitForSelector('#ficha-nota-texto');
/* que la huella de la ficha quede apuntada antes de empezar */
await pagina.waitForTimeout(400);

console.log('--- 1 a 3. la nota del asunto ---');
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
await pagina.waitForSelector('#ficha-guia .hito');
await pagina.click('#ficha-guia .hito .hito-desplegar');
await pagina.waitForSelector('#ficha-guia .hito-nota-texto');

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

console.log('--- 7. la ficha nueva (fila 51, 18-sep-2026): orden de bloques y nota sin botón ---');
/* docs/FICHA-DISPOSICION.md, 6: tres columnas — izquierda Hitos; centro
   Documentos (hueco ancho); derecha Datos y contacto (el primero),
   después Notas, y plegados al final "Otros asuntos" y "Relacionados"
   (lo que casi nunca se mira). Sustituye a la comprobación de la fila
   37 (docs/FICHA-DEL-ASUNTO-NUEVA.md), que daba por hecho el reparto
   de columnas anterior. */
await comprobar('7. a la izquierda, solo Hitos',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-izquierda .ficha-titulo')).map((h) => h.textContent.trim())),
  ['Hitos']);

await comprobar('7. en el centro, Documentos de la carpeta',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-centro .ficha-titulo')).map((h) => {
    /* El título de "Documentos" lleva pegada la cuenta de documentos
       (`.ficha-cuenta`), dentro del mismo <h3>: se quita antes de leer
       el texto, que si no sale "Documentos de la carpeta2". */
    const cuenta = h.querySelector('.ficha-cuenta');
    return (cuenta ? h.textContent.slice(0, -cuenta.textContent.length) : h.textContent).trim();
  })),
  ['Documentos de la carpeta']);

await comprobar('7. a la derecha, "Datos y contacto" es el primer bloque',
  pagina.evaluate(() => {
    const primero = document.querySelector('.ficha-derecha > *');
    return primero && primero.id;
  }), 'ficha-contacto-caja');

await comprobar('7. y "Notas" va antes que los bloques plegados (Otros asuntos, Relacionados)',
  pagina.evaluate(() => {
    const titulos = Array.from(document.querySelectorAll('.ficha-derecha .ficha-titulo')).map((h) => h.textContent);
    return [titulos.indexOf('Notas') < titulos.indexOf('Otros asuntos de este tercero'),
            titulos.indexOf('Notas') < titulos.indexOf('Personas y entidades relacionadas')];
  }), [true, true]);

console.log('--- 8. la nota se guarda sola, sin "Añadir nota" ---');
comprobarQue('8. ya no hay botón "Añadir nota"',
  await pagina.evaluate(() => !document.getElementById('ficha-nota-anadir')));

await pagina.fill('#ficha-nota-texto', 'Autoguardado sin pulsar nada');
await comprobar('8. antes del segundo de espera, todavía no está en la lista',
  pagina.evaluate(() => document.getElementById('ficha-notas-lista').textContent.indexOf('Autoguardado sin pulsar nada') !== -1),
  false);
await pagina.waitForTimeout(1400);
await comprobar('8. pasado el segundo de espera, la nota ya está guardada y en la lista',
  pagina.evaluate(() => document.getElementById('ficha-notas-lista').textContent.indexOf('Autoguardado sin pulsar nada') !== -1),
  true);
await comprobar('8. lo escrito sigue en la caja (no se limpia sola)',
  pagina.inputValue('#ficha-nota-texto'), 'Autoguardado sin pulsar nada');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
