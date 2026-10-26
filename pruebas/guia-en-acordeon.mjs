/* Prueba en navegador de verdad del hito elegido del editor de la guía:
   fila 122 (docs/GUIA-EN-ACORDEON.md) lo hizo acordeón; desde la fila 463
   (docs/EDITOR-DE-LA-GUIA-CLARO.md, parte A) el hito se elige en la lista
   de la izquierda y solo el elegido se ve a la derecha.

   1. Al entrar, el primer hito elegido y la lista con título y línea gris.
   2. Pulsar otro hito de la lista lo elige; solo hay uno elegido.
   3. «+ Añadir un hito»: sale elegido, con el cursor en su título.
   4. Las flechas mueven el hito sin cambiar cuál está elegido.
   5. Un repintado (marcar «es una pregunta») deja el hito elegido.
   6. Un hito nuevo dentro de una opción: la pregunta que lo contiene sigue
      elegida y los hitos de dentro se ven siempre.
   7. Desde el mapa (`irA`), el hito sale elegido.
   8. «Tareas de este hito» siempre a la vista.
   9. Lo guardado no cambia: un hito no elegido conserva todo lo suyo.
   10. Los apartados con título y su resumen en gris.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const GUIA = [
  { id: 'p1', titulo: 'Registrar la entrada', responsable: 'r1',
    normativa: [{ cita: 'Decreto 1/2020, art. 3' }, { cita: 'Orden 2/2021' }],
    guion: [{ id: 'g1', texto: 'Sellar' }], plantillasDocumento: ['pd-x'] },
  { id: 'q1', titulo: '¿Cómo ha llegado?', opciones: [
    { id: 'a', titulo: 'En mano', pasos: [{ id: 'a1', titulo: 'Poner el sello' }] },
    { id: 'b', titulo: 'Por correo', pasos: [{ id: 'b1', titulo: 'Guardar el correo' }] }
  ] },
  { id: 'p3', titulo: 'Avisar a la familia', soloInformativo: true },
  { id: 'p4', titulo: 'Archivar' }
];
const RESP = [{ id: 'r1', nombre: 'Secretaría' }];

/* Qué hitos de arriba se ven a la derecha (los elegidos), por su título. */
const elegidos = () => pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos > .paso-editor'))
    .filter(el => !el.classList.contains('paso-plegado'))
    .map(el => el.querySelector(':scope > .paso-cabecera .paso-titulo').value));
const enLista = (pos) => pagina.click('#guia-lista .guia-lista-item:nth-child(' + (pos + 1) + ')');

async function abrirEditor(opciones) {
  await pagina.evaluate(([GUIA, RESP, opciones]) => {
    window.__guardada = Guias.editar('FACTURA', GUIA, RESP, [], opciones);
  }, [GUIA, RESP, opciones || null]);
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}

/* ================= 1 ================= */
console.log('--- 1. al entrar, el primero elegido ---');
await abrirEditor();
await comprobar('el primer hito, elegido', elegidos(), ['Registrar la entrada']);
await comprobar('la lista: título y línea gris de cada hito',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-lista .guia-lista-item'))
    .map(r => r.querySelector('.guia-lista-titulo').textContent + ' | ' + r.querySelector('.guia-lista-gris').textContent)),
  ['Registrar la entrada | Secretaría · 2 tareas · Normativa (2)', '¿Cómo ha llegado? | Pregunta',
   'Avisar a la familia | Solo informativo', 'Archivar | ']);
await comprobar('el elegido va resaltado en la lista',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-lista .guia-lista-item.elegido')).map(x => x.querySelector('.guia-lista-titulo').textContent)),
  ['Registrar la entrada']);
await comprobar('los demás hitos, escondidos (sus campos siguen en la página)',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="2"]');
    return [d.querySelector('.paso-titulo').offsetParent === null, !!d.querySelector('.paso-cuerpo')];
  }), [true, true]);
await comprobar('el elegido enseña ↑, ↓ y «Quitar»',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="0"] .paso-mandos > .boton').evaluateAll(b => b.slice(0, 3).map(x => x.offsetParent !== null && x.textContent)),
  ['↑', '↓', 'Quitar']);

/* ================= 2 ================= */
console.log('--- 2. elegir otro ---');
await enLista(2);
await comprobar('pulsar otro hito de la lista lo elige', elegidos(), ['Avisar a la familia']);
await enLista(0);
await enLista(2);
await comprobar('solo hay uno elegido a la vez', elegidos(), ['Avisar a la familia']);

/* ================= 3 ================= */
console.log('--- 3. añadir un hito ---');
await pagina.click('#guia-anadir');
await comprobar('el nuevo sale elegido y los demás, no', elegidos(), ['']);
await comprobar('con el cursor en su título',
  pagina.evaluate(() => document.activeElement === document.querySelector('#guia-pasos > .paso-editor[data-pos="4"] .paso-titulo')), true);
await pagina.keyboard.type('Pagar');
await comprobar('y en la lista, con lo que se escribe', pagina.locator('#guia-lista .guia-lista-item:nth-child(5) .guia-lista-titulo').textContent(), 'Pagar');

/* ================= 4 ================= */
console.log('--- 4. las flechas ---');
await enLista(0);
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] .paso-mandos button[data-ayuda="Bajar este hito"]');
await comprobar('bajado, sigue elegido (ahora en el sitio 2)',
  pagina.evaluate(() => !document.querySelector('#guia-pasos > .paso-editor[data-pos="1"]').classList.contains('paso-plegado')), true);
await comprobar('y es el único elegido', elegidos(), ['Registrar la entrada']);
await comprobar('la lista sigue el orden nuevo',
  pagina.locator('#guia-lista .guia-lista-titulo').allTextContents(),
  ['¿Cómo ha llegado?', 'Registrar la entrada', 'Avisar a la familia', 'Archivar', 'Pagar']);
await pagina.click('#guia-pasos > .paso-editor[data-pos="1"] .paso-mandos button[data-ayuda="Subir este hito"]');
await comprobar('subido, sigue elegido', elegidos(), ['Registrar la entrada']);

/* ================= 5 ================= */
console.log('--- 5. tras repintar ---');
await enLista(3);
await pagina.click('#guia-pasos > .paso-editor[data-pos="3"] > .paso-apartado-cab[data-ap="otros"]');   /* «es una pregunta» va en «Otros» */
await pagina.locator('#guia-pasos > .paso-editor[data-pos="3"] > .paso-es-pregunta-fila .paso-es-pregunta').check();
await comprobar('marcar «es una pregunta» repinta y el hito sigue elegido', elegidos(), ['Archivar']);
await comprobar('(ya con sus dos opciones a la vista)',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="3"] .opcion-editor').evaluateAll(o => o.filter(x => x.offsetParent !== null).length), 2);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="3"] > .paso-es-pregunta-fila .paso-es-pregunta').uncheck();
await comprobar('y al desmarcarla, igual', elegidos(), ['Archivar']);

/* ================= 6 ================= */
console.log('--- 6. un hito dentro de una opción ---');
await enLista(1);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="1"] .opcion-editor').nth(0)
  .locator('button', { hasText: '+ Añadir un hito a esta opción' }).click();
await comprobar('la pregunta que lo contiene sigue elegida', elegidos(), ['¿Cómo ha llegado?']);
await comprobar('los hitos de dentro se ven siempre (el de antes y el nuevo)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos .opcion-editor')[0].querySelectorAll('.subpaso-editor'))
    .map(x => x.offsetParent !== null)), [true, true]);
await comprobar('con el cursor en su título',
  pagina.evaluate(() => document.activeElement === document.querySelectorAll('#guia-pasos .opcion-editor')[0].querySelectorAll('.subpaso-titulo')[1]), true);
await pagina.keyboard.type('Escanear');
await comprobar('cada uno con su rótulo «Título del hito» y sus «Tareas de este hito»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos .opcion-editor')[0].querySelectorAll('.subpaso-editor'))
    .map(x => [x.querySelector(':scope > .paso-cabecera .etiqueta').textContent, x.querySelector(':scope > .paso-guion > summary').textContent])),
  [['Título del hito', 'Tareas de este hito'], ['Título del hito', 'Tareas de este hito']]);
await enLista(0);
await comprobar('elegir uno de arriba cambia la derecha', elegidos(), ['Registrar la entrada']);

/* ================= 8 ================= */
console.log('--- 8. «Tareas de este hito» siempre a la vista ---');
await comprobar('sin desplegar nada, con su cuenta',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]');
    const g = d.querySelector(':scope > .paso-guion');
    return [g.open, g.offsetParent !== null, g.querySelector('summary').textContent, g.querySelectorAll('.guion-fila').length];
  }), [true, true, 'Tareas de este hito (2)', 2]);
await pagina.evaluate(() => { document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-guion').open = false; });
await comprobar('no se pliega ni con el teclado',
  pagina.evaluate(() => new Promise(r => setTimeout(() => r(document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-guion').open), 100))), true);

/* ================= 9 ================= */
console.log('--- 9. guardar ---');
await pagina.click('#cuadro-aceptar');
const guardada = await pagina.evaluate(() => window.__guardada);
await comprobar('los hitos, en su orden nuevo', Promise.resolve(guardada.map(p => p.titulo)),
  ['Registrar la entrada', '¿Cómo ha llegado?', 'Avisar a la familia', 'Archivar', 'Pagar']);
await comprobar('lo de un hito no elegido no se pierde (tareas: las de siempre + la migrada de plantillasDocumento, fila 199)',
  Promise.resolve([guardada[0].normativa.length, guardada[0].guion.length, guardada[0].responsable, guardada[2].soloInformativo]),
  [2, 2, 'r1', true]);
await comprobar('el hito nuevo de la opción, guardado', Promise.resolve(guardada[1].opciones[0].pasos.map(p => p.titulo)),
  ['Poner el sello', 'Escanear']);

/* ================= 10 ================= */
console.log('--- 10. los apartados con título y su resumen ---');
await abrirEditor({});
await enLista(2);   /* «Avisar a la familia», solo informativo */
const visibles = (pos) => pagina.evaluate((pos) => {
  const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="' + pos + '"]');
  const v = (sel) => { const e = d.querySelector(sel); return !!e && e.offsetParent !== null; };
  return { titulo: v(':scope > .paso-cabecera .paso-titulo'), resp: v('.paso-responsable'), plazo: v('.paso-plazo-dias'),
    tareas: v(':scope > .paso-guion'), toca: v('.paso-toca'),
    explicacion: v(':scope > .paso-cuerpo'), normativa: v(':scope > .paso-normativa'), solo: v('.paso-solo-informativo'), varios: v('.paso-varios-documentos'),
    avisar: v('.paso-avisar-lopide'), textoDoc: v('.paso-texto-documentos') };
}, pos);
await comprobar('elegido: se ven título, responsable, a quién le toca, plazo y tareas; los apartados, plegados',
  visibles(2),
  { titulo: true, resp: true, plazo: true, tareas: true, toca: true, explicacion: false, normativa: false, solo: false, varios: false, avisar: false, textoDoc: false });
await comprobar('los cinco apartados, con su título, en su orden',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab .ap-titulo').allTextContents(),
  ['Explicación del hito', 'Al terminar este hito', 'Documentos de este hito', 'Normativa e impresos', 'Otros']);
await comprobar('«Datos del hito» y «Tareas de este hito» van antes que los apartados',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="2"]');
    const k = Array.from(d.children);
    const ix = (sel) => k.indexOf(d.querySelector(':scope > ' + sel));
    return [d.querySelector(':scope > .paso-datos-titulo').textContent, ix('.paso-datos-titulo') < ix('.paso-cabecera'),
            ix('.paso-extra') < ix('.paso-guion'), ix('.paso-guion') < ix('.paso-apartado-cab')];
  }), ['Datos del hito', true, true, true]);
await comprobar('cada desplegable del hito lleva su rótulo',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="2"] .dato > .etiqueta, #guia-pasos > .paso-editor[data-pos="2"] .dato .etiqueta'))
    .map(e => e.textContent)),
  ['Título del hito', 'Responsable', 'A quién le toca', 'Plazo (días)', 'Cómo se cuentan', 'Desde']);
await comprobar('el resumen de «Otros» dice «Solo informativo»; el de «Al terminar este hito», «no»',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab .ap-resumen').allTextContents(),
  ['', 'avisar a quien lo pide: no', '', '', 'Solo informativo']);
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab[data-ap="otros"]');
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab[data-ap="documentos"]');
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab[data-ap="aviso"]');
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab[data-ap="explicacion"]');
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab[data-ap="normativa"]');
await comprobar('abiertos los apartados: aparecen todos los ajustes',
  visibles(2),
  { titulo: true, resp: true, plazo: true, tareas: true, toca: true, explicacion: true, normativa: true, solo: true, varios: true, avisar: true, textoDoc: true });
await comprobar('la frase gris del aviso y la barra de formato encima de la explicación',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="2"]');
    return [d.querySelector(':scope > .paso-aviso-frase').textContent.indexOf('Para escribir a otras personas durante el hito, usa una tarea «Comunicar».') > -1,
            d.querySelector(':scope > .paso-cuerpo').previousElementSibling.id, d.querySelector(':scope > .paso-cuerpo').previousElementSibling.offsetParent !== null];
  }), [true, 'guia-barra-caja', true]);
await pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] .paso-varios-documentos').check();
await pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] .paso-avisar-lopide').check();
await comprobar('al activar algo dentro, el resumen lo dice en el momento',
  pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-apartado-cab .ap-resumen').allTextContents(),
  ['', 'avisar a quien lo pide: sí', 'Recibe varios documentos', '', 'Solo informativo']);
await enLista(0);
await comprobar('los apartados abiertos de un hito no se abren en otro',
  pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]').className.indexOf('abre-') > -1), false);
await enLista(2);
await comprobar('y al volver siguen como estaban',
  pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="2"]').classList.contains('abre-aviso')), true);
await pagina.click('#cuadro-aceptar');
const g2 = await pagina.evaluate(() => window.__guardada);
await comprobar('lo marcado dentro se guarda igual', Promise.resolve([g2[2].soloInformativo, g2[2].variosDocumentos, g2[2].avisarLoPide]), [true, true, true]);

/* ================= 7 ================= */
console.log('--- 7. desde el mapa ---');
await abrirEditor({ irA: 'p3' });
await comprobar('el hito al que se va, elegido; los demás, no', elegidos(), ['Avisar a la familia']);
await pagina.click('#cuadro-cancelar').catch(() => pagina.keyboard.press('Escape'));
await abrirEditor({ irA: 'b1' });
await comprobar('uno de dentro de una opción: su nivel, con él elegido', elegidos(), ['Guardar el correo']);
await pagina.keyboard.press('Escape');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
