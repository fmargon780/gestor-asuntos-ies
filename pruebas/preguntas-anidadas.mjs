/* Prueba en navegador de verdad de la fila 95
   (docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md): preguntas dentro de las
   respuestas de la guía, sin límite de niveles.

   1. El modelo: una guía de tres niveles se normaliza sin perder nada
      (ni los campos de un paso de una opción), y un paso-pregunta de
      tercer nivel no admite requisitos. La vista de lectura pinta los
      tres niveles.
   2. Los hitos: elegir en cascada (una pregunta de dentro sin responder
      corta la lista entera), y cambiar una respuesta de arriba poda el
      subárbol sin perder lo trabajado (queda "no aplica", plegado).
   3. El editor: un paso de una opción se marca como pregunta y sale
      como una línea con «Entrar»; entrar dos niveles, escribir,
      volver, y al guardar sigue todo ahí.

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

/* p1 → q1 (¿Cómo se recibió?)
          a) En mano: a1, q2 (¿Viene completa?)
                            s) Sí: s1
                            n) No: q3 (¿Se puede pedir?) → x) Sí: x1 · y) No: y1
          b) Por correo: b1
      → p9 */
const GUIA = [
  { id: 'p1', titulo: 'Registrar' },
  { id: 'q1', titulo: '¿Cómo se recibió?', opciones: [
    { id: 'a', titulo: 'En mano', pasos: [
      { id: 'a1', titulo: 'Sellar', responsable: 'tercero', plazo: { dias: 3, desde: 'q2' } },
      { id: 'q2', titulo: '¿Viene completa?', requisitos: [{ texto: 'no debería quedarse' }], opciones: [
        { id: 's', titulo: 'Sí', pasos: [{ id: 's1', titulo: 'Archivar copia' }] },
        { id: 'n', titulo: 'No', pasos: [
          { id: 'q3', titulo: '¿Se puede pedir?', requisitos: [{ texto: 'tampoco' }], opciones: [
            { id: 'x', titulo: 'Sí', pasos: [{ id: 'x1', titulo: 'Pedir lo que falta', requisitos: [{ texto: 'DNI', clase: 'documento' }] }] },
            { id: 'y', titulo: 'No', pasos: [{ id: 'y1', titulo: 'Denegar' }] }
          ] }
        ] }
      ] }
    ] },
    { id: 'b', titulo: 'Por correo', pasos: [{ id: 'b1', titulo: 'Guardar el correo' }] }
  ] },
  { id: 'p9', titulo: 'Firma del director' }
];

/* ================= 1. el modelo ================= */
console.log('--- 1. el modelo ---');
const modelo = await pagina.evaluate((GUIA) => {
  const n = Guias.normalizar(GUIA);
  const q1 = n[1], a = q1.opciones[0], q2 = a.pasos[1], nn = q2.opciones[1], q3 = nn.pasos[0];
  const html = Guias.vista(n);
  return {
    ids: JSON.stringify(n).match(/"id":"[a-z0-9]+"/g).length,
    q3: q3.titulo, x1req: q3.opciones[0].pasos[0].requisitos.map(r => r.texto),
    a1: { responsable: a.pasos[0].responsable, plazo: a.pasos[0].plazo },
    reqPreguntas: [q2.requisitos.length, q3.requisitos.length],
    otraVez: JSON.stringify(Guias.normalizar(JSON.parse(JSON.stringify(n)))) === JSON.stringify(n),
    vistaTresNiveles: ['¿Cómo se recibió?', '¿Viene completa?', '¿Se puede pedir?', 'Pedir lo que falta']
      .every(t => html.indexOf(t) > -1)
  };
}, GUIA);
await comprobar('los tres niveles llegan enteros', Promise.resolve([modelo.q3, modelo.x1req]), ['¿Se puede pedir?', ['DNI']]);
await comprobar('un paso de una opción conserva su responsable y su plazo',
  Promise.resolve(modelo.a1), { responsable: 'tercero', plazo: { dias: 3, desde: 'q2', cuenta: 'habiles' } });   /* fila 131: hábiles si no dice */
await comprobar('una pregunta de segundo y de tercer nivel no admite requisitos', Promise.resolve(modelo.reqPreguntas), [0, 0]);
await comprobar('normalizar dos veces da lo mismo (se guarda y se relee igual)', Promise.resolve(modelo.otraVez), true);
await comprobar('la vista de lectura pinta los tres niveles', Promise.resolve(modelo.vistaTresNiveles), true);

/* ================= 2. los hitos ================= */
console.log('--- 2. los hitos ---');
const CLAVE = '260920 MATRICULA Prueba, Ana 1150001';
await pagina.evaluate(async ([GUIA, CLAVE]) => {
  const lista = Guias.normalizar(GUIA).map(Hitos.pasoAHito);
  await Hitos.cambiar(d => { d.porAsunto[CLAVE] = { creados: U.hoyIso(), hitos: lista }; return d; });
}, [GUIA, CLAVE]);
const vis = () => pagina.evaluate(async (CLAVE) => Hitos.visibles(await Hitos.hitosDe(CLAVE)).map(h => h.id), CLAVE);
await comprobar('sin responder, la lista se corta en la primera pregunta', vis(), ['p1', 'q1']);
await pagina.evaluate((CLAVE) => Hitos.elegirOpcion(CLAVE, 'q1', 'a'), CLAVE);
await comprobar('al elegir «En mano», la pregunta de dentro corta la lista entera (no sale p9)', vis(), ['p1', 'q1', 'a1', 'q2']);
await pagina.evaluate((CLAVE) => Hitos.elegirOpcion(CLAVE, 'q2', 'n'), CLAVE);
await comprobar('en cascada: la de tercer nivel también corta', vis(), ['p1', 'q1', 'a1', 'q2', 'q3']);
await pagina.evaluate((CLAVE) => Hitos.elegirOpcion(CLAVE, 'q3', 'x'), CLAVE);
await comprobar('respondidas las tres, se ve hasta el final', vis(), ['p1', 'q1', 'a1', 'q2', 'q3', 'x1', 'p9']);

/* Algo trabajado en lo más hondo, y se cambia la respuesta de arriba. */
await pagina.evaluate(async (CLAVE) => {
  await Hitos.cambiar(d => { Hitos.buscar(d.porAsunto[CLAVE].hitos, 'x1').notas.push({ texto: 'Pedido por correo', quien: 'F', cuando: U.ahora() }); return d; });
  await Hitos.cambiarRama(CLAVE, 'q1', 'b');
}, CLAVE);
await comprobar('cambiar la respuesta de arriba enseña la rama nueva', vis(), ['p1', 'q1', 'b1', 'p9']);
const tras = await pagina.evaluate(async (CLAVE) => {
  const hs = await Hitos.hitosDe(CLAVE);
  const a = Hitos.buscar(hs, 'q1').opciones.filter(o => o.id === 'a')[0];
  return {
    huerfanos: Hitos.huerfanos(hs).map(h => h.id + ':' + h.estado),
    quedaEnLaRamaVieja: JSON.stringify(a.hitos).indexOf('Pedido por correo') > -1,
    a1Quitado: !Hitos.buscar(a.hitos, 'a1'),
    y1Quitado: !Hitos.buscar(hs, 'y1')
  };
}, CLAVE);
await comprobar('lo trabajado de lo más hondo queda «no aplica», plegado', Promise.resolve(tras.huerfanos), ['x1:noaplica']);
await comprobar('y no se pierde su nota', Promise.resolve(tras.quedaEnLaRamaVieja), true);
await comprobar('lo vacío de la rama vieja se quita, a cualquier nivel', Promise.resolve([tras.a1Quitado, tras.y1Quitado]), [true, true]);

/* ================= 3. el editor ================= */
console.log('--- 3. el editor: entrar y volver ---');
await pagina.evaluate((GUIA) => {
  window.__guardada = Guias.editar('TRASLADO', GUIA.slice(0, 2), [], []);
}, GUIA);
await pagina.waitForSelector('#guia-pasos .paso-editor');
await comprobar('arriba no hay camino', pagina.locator('#guia-camino').isVisible(), false);
await comprobar('la pregunta de dentro (q2) sale como una línea con «Entrar», sin su explicación',
  pagina.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('.subpaso-editor')).find(x => x.querySelector('.subpaso-titulo').value === '¿Viene completa?');
    return !!sc.querySelector('.subpaso-entrar') && !!sc.querySelector('.marca-pregunta') && !sc.querySelector('.subpaso-cuerpo');
  }), true);
await comprobar('un paso normal de una opción trae la casilla de pregunta',
  pagina.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('.subpaso-editor')).find(x => x.querySelector('.subpaso-titulo').value === 'Sellar');
    return !!sc.querySelector('.subpaso-es-pregunta') && !sc.querySelector('.subpaso-es-pregunta').checked;
  }), true);

/* Se escribe algo arriba antes de entrar: no se debe perder. */
/* Fila 122: los pasos nacen cerrados; se abre el primero pulsando su línea. */
await pagina.click('#guia-pasos .paso-editor[data-pos="0"] > .paso-cabecera > .paso-numero');
await pagina.fill('#guia-pasos .paso-editor[data-pos="0"] .paso-titulo', 'Registrar la solicitud');
await pagina.click('#guia-pasos .paso-editor[data-pos="1"] > .paso-cabecera > .paso-numero');   /* fila 122: abrir la pregunta */
await pagina.locator('.subpaso-editor', { has: pagina.locator('.subpaso-entrar') }).locator('.subpaso-entrar').click();
await comprobar('el camino dice dónde se está',
  pagina.locator('#guia-camino').innerText().then(t => t.replace(/\s+/g, ' ').trim()),
  '← Volver Guía de TRASLADO › ¿Cómo se recibió? › En mano');
await comprobar('dentro, la pregunta q2 sale entera, con sus opciones',
  pagina.locator('#guia-pasos .paso-editor .paso-titulo').evaluateAll(e => e.map(x => x.value)), ['Sellar', '¿Viene completa?']);

/* Segundo nivel: entrar en q3 (dentro de «No» de q2). */
await pagina.click('#guia-pasos .paso-editor[data-pos="1"] > .paso-cabecera > .paso-numero');   /* fila 122: abrir la pregunta */
await pagina.locator('.subpaso-editor', { has: pagina.locator('.subpaso-entrar') }).locator('.subpaso-entrar').click();
await comprobar('dos niveles dentro',
  pagina.locator('#guia-camino').innerText().then(t => t.replace(/\s+/g, ' ').trim()),
  '← Volver Guía de TRASLADO › ¿Cómo se recibió? › En mano › ¿Viene completa? › No');
/* Fila 122: los pasos nacen cerrados; se abre el primero pulsando su línea. */
await pagina.click('#guia-pasos .paso-editor[data-pos="0"] > .paso-cabecera > .paso-numero');
await pagina.fill('#guia-pasos .paso-editor[data-pos="0"] .paso-titulo', '¿Se puede pedir lo que falta?');
/* un paso nuevo en la opción «No» de q3 */
await pagina.locator('.opcion-editor').nth(1).locator('button', { hasText: '+ Añadir un paso a esta opción' }).click();
await pagina.locator('.opcion-editor').nth(1).locator('.subpaso-titulo').nth(1).fill('Avisar a la familia');

await pagina.click('#guia-volver');
await comprobar('Volver sube un nivel', pagina.locator('#guia-camino').innerText().then(t => t.replace(/\s+/g, ' ').trim()),
  '← Volver Guía de TRASLADO › ¿Cómo se recibió? › En mano');
await comprobar('lo escrito dentro sigue ahí al volver',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.subpaso-titulo')).map(x => x.value).indexOf('¿Se puede pedir lo que falta?') > -1), true);
await pagina.click('.guia-camino-trozo[data-nivel="0"]');
await comprobar('el primer trozo del camino lleva arriba del todo', pagina.locator('#guia-camino').isVisible(), false);
await comprobar('y lo escrito arriba antes de entrar sigue ahí',
  pagina.inputValue('#guia-pasos .paso-editor[data-pos="0"] .paso-titulo'), 'Registrar la solicitud');

/* Guardar desde dentro: se entra otra vez y se guarda ahí. */
await pagina.click('#guia-pasos .paso-editor[data-pos="1"] > .paso-cabecera > .paso-numero');   /* fila 122: abrir la pregunta */
await pagina.locator('.subpaso-entrar').first().click();
await pagina.click('#cuadro-aceptar');
const guardada = await pagina.evaluate(() => window.__guardada);
const q3 = guardada[1].opciones[0].pasos[1].opciones[1].pasos[0];
await comprobar('se guarda la guía entera, aunque se guarde desde dentro',
  Promise.resolve([guardada[0].titulo, q3.titulo, q3.opciones[1].pasos.map(p => p.titulo)]),
  ['Registrar la solicitud', '¿Se puede pedir lo que falta?', ['Denegar', 'Avisar a la familia']]);
await comprobar('el plazo del paso de una opción no se pierde al guardar',
  Promise.resolve(guardada[1].opciones[0].pasos[0].plazo), { dias: 3, desde: 'q2', cuenta: 'habiles' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
