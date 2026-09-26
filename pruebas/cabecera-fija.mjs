/* Prueba en navegador de verdad de la cabecera que se queda pegada
   arriba y se encoge al bajar (fila 46, docs/CABECERA-QUE-SE-QUEDA.md;
   sin temblor, fila 50, docs/CABECERA-NO-TIEMBLA.md).

   Comprueba: al entrar se ve entera; al bajar más de 120px se encoge
   (con histéresis, no se despliega hasta menos de 24px); el contenido
   de debajo no da un salto brusco al encogerse; al cambiar de
   pantalla la cabecera anterior queda limpia y la nueva funciona
   igual; el ancho sigue al de verdad de la zona de trabajo (con
   con-lector); el repintado de la ficha no pierde el estado encogido;
   en "Por clasificar", con un documento abierto, sale "Viendo: …" e
   "Ir a su fila"; y que js/barra.js sigue encontrando
   "#pantalla-abiertos .cabecera" para su botón de Nuevo asunto.
   Fila 50: en una pantalla corta, cruzar el umbral no deja el estado
   oscilando; y el candado de 400 ms bloquea el cambio contrario justo
   después de otro.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
/* Ancho del monitor del trabajo (como en pruebas/tablon.mjs, con el
   mismo motivo): con el tablón puesto al lado, por debajo de cierto
   ancho el buscador y los botones ya no caben en una sola línea con
   el título y la cabecera sale más alta por eso —cosa de siempre,
   nada que ver con esta fila—. Con sitio de sobra sí es una sola
   línea, como la vería Francisco en el monitor del trabajo. */
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 600 } });
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

function encogidaDe(selector) {
  return pagina.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? el.classList.contains('encogida') : null;
  }, selector);
}
function scroll(y) {
  return pagina.evaluate((v) => window.scrollTo(0, v), y);
}
/* 450 ms, no 200: más que el candado de 400 ms de la fila 50, para que
   una prueba que quiere ver un cambio de verdad nunca lo pille bloqueado
   por el cambio anterior. */
async function subirYEsperar(y) {
  await scroll(y);
  await pagina.waitForTimeout(450);
}

/* ---------- entrar, con 25 asuntos abiertos y un papel suelto ---------- */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const asuntos = {};
  for (let i = 0; i < 25; i++) {
    const nombre = '2609' + String(10 + i).padStart(2, '0') +
      ' PERMISO 26-27 Persona ' + String(i).padStart(2, '0') + ', Nombre ' + String(1000 + i);
    asuntos[nombre] = {
      tercero: 'Persona ' + String(i).padStart(2, '0') + ', Nombre',
      categoria: 'PERSONAL', situacion: 'EN EL DEPARTAMENTO'
    };
  }
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({ asuntos })));
  for (const nombre of Object.keys(asuntos)) {
    await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  }
  const raiz = window.__disco.abiertos._hijos;
  raiz.set('Escrito sin clasificar.pdf', window.__disco.fich('Escrito sin clasificar.pdf', 'un papel'));
  /* Rellenan la lista de "Por clasificar" para que también ahí haya
     sitio de sobra para bajar más de 80px. */
  for (let i = 0; i < 14; i++) {
    raiz.set('Papel suelto ' + i + '.pdf', window.__disco.fich('Papel suelto ' + i + '.pdf', 'contenido'));
  }
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

console.log('=== 1. Asuntos abiertos: se ve entera, se encoge, se despliega ===');

await comprobarQue('hay lista suficientemente larga para poder bajar más de 80px',
  pagina.evaluate(() => document.documentElement.scrollHeight - window.innerHeight > 120));

await comprobar('al entrar, la cabecera se ve entera (no encogida)',
  encogidaDe('#pantalla-abiertos header.cabecera'), false);

await subirYEsperar(200);
await comprobar('al bajar 200px, se encoge', encogidaDe('#pantalla-abiertos header.cabecera'), true);

console.log('--- que no dé un salto brusco al encogerse ---');
/* Vuelve arriba del todo, mide dónde está el primer asunto de la
   lista con la cabecera desplegada, baja 150px de golpe (cruzando el
   umbral de 120) y mide otra vez. Chrome tiene "scroll anchoring": si
   algo por encima de lo visible cambia de alto mientras se hace
   scroll, el navegador mismo corrige el scroll para que lo que se ve
   no salte — por eso lo que hay que comprobar no es que nada se mueva
   (algo se mueve siempre: se ha bajado 150px), sino que se mueve
   JUSTO esos 150px y ni uno más, señal de que el encogimiento no
   añade ningún brinco por su cuenta. */
await subirYEsperar(0);
const alturaCabeceraAntes = await pagina.evaluate(() =>
  document.querySelector('#pantalla-abiertos header.cabecera').getBoundingClientRect().height +
  parseFloat(getComputedStyle(document.querySelector('#pantalla-abiertos header.cabecera')).marginBottom));
const topAntes = await pagina.evaluate(() => document.querySelector('#lista-abiertos .tarjeta').getBoundingClientRect().top);

await subirYEsperar(150);
await pagina.waitForTimeout(300); /* deja terminar la transición CSS */
const alturaCabeceraDespues = await pagina.evaluate(() =>
  document.querySelector('#pantalla-abiertos header.cabecera').getBoundingClientRect().height +
  parseFloat(getComputedStyle(document.querySelector('#pantalla-abiertos header.cabecera')).marginBottom));
const topDespues = await pagina.evaluate(() => document.querySelector('#lista-abiertos .tarjeta').getBoundingClientRect().top);

await comprobarQue('la cabecera de verdad ha encogido de alto (hueco reservado más pequeño)',
  Promise.resolve(alturaCabeceraAntes - alturaCabeceraDespues > 5));
/* Se ha pedido bajar 150px (window.scrollTo(0, 150)): lo que tiene que
   cumplirse es que el contenido se mueva esos 150px pedidos y ni uno
   más — da igual en qué valor exacto termine "window.scrollY" (Chrome
   puede tocarlo por su cuenta, con "scroll anchoring", precisamente
   para que no se note el salto cuando algo de arriba cambia de alto a
   mitad del scroll: es la propia prueba de que no hay brinco). */
await comprobarQue('el contenido de debajo se mueve justo lo que se ha pedido bajar, sin ningún brinco de más',
  Promise.resolve(Math.abs((topAntes - topDespues) - 150) < 3));

console.log('--- histéresis: no se despliega hasta bajar de 24px ---');
await subirYEsperar(100);
await comprobar('a 100px (entre 24 y 120) sigue encogida', encogidaDe('#pantalla-abiertos header.cabecera'), true);
await subirYEsperar(30);
await comprobar('a 30px todavía sigue encogida', encogidaDe('#pantalla-abiertos header.cabecera'), true);
await subirYEsperar(20);
await comprobar('a 20px (menos de 24) se despliega', encogidaDe('#pantalla-abiertos header.cabecera'), false);

console.log('=== 1b. Fila 50: en una pantalla corta, cruzar el umbral no deja temblando ===');
/* Se mide el alto de verdad de esta misma lista de 25 asuntos (2217px
   con la ventana de 600 de alto: de sobra más que la ventana, así que
   la medida no la contamina el propio tamaño de la ventana) y se
   encoge la ventana justo a 200px menos que ese alto: así sobran 200px
   para bajar, más que el umbral de encoger (120) y menos que el margen
   de "pantalla corta" (400), justo el caso del defecto. */
const altoAbiertos = await pagina.evaluate(() => document.documentElement.scrollHeight);
await pagina.setViewportSize({ width: 1920, height: Math.round(altoAbiertos - 200) });
await subirYEsperar(0);
await comprobar('con la ventana recortada, al entrar la cabecera está desplegada',
  encogidaDe('#pantalla-abiertos header.cabecera'), false);

await subirYEsperar(150);
await comprobar('al cruzar el umbral (150 > 120), se encoge',
  encogidaDe('#pantalla-abiertos header.cabecera'), true);
/* Si temblara, en algún momento de este medio segundo se habría vuelto
   a desplegar sola (y quizá vuelto a encoger): se comprueba más de una
   vez, no solo justo después de cruzar el umbral. */
await pagina.waitForTimeout(300);
await comprobar('un instante después, sigue encogida: no ha temblado',
  encogidaDe('#pantalla-abiertos header.cabecera'), true);
await pagina.waitForTimeout(300);
await comprobar('y otro instante más tarde, también',
  encogidaDe('#pantalla-abiertos header.cabecera'), true);

await pagina.setViewportSize({ width: 1920, height: 600 });
await subirYEsperar(0);

console.log('=== 1c. Fila 50: el candado de 400 ms bloquea el cambio contrario ===');
/* Se maneja aquí `window.scrollY` y `CabeceraFija.evaluar()` a mano,
   en vez de `subirYEsperar`: así se controla el tiempo exacto entre
   los dos cambios, para probar el candado de verdad. Los dos primeros
   cambios (el que se admite y el contrario que hay que bloquear) se
   hacen dentro de un mismo `pagina.evaluate()`, uno detrás de otro sin
   ningún `await` de por medio: entre los dos pasan microsegundos de
   verdad, no lo que tarde el viaje de ida y vuelta hasta el
   navegador (que en una máquina de CI cargada puede acercarse él solo
   a los 400 ms y dejar la prueba en flaky). */
await subirYEsperar(200); /* encogida, y ya ha pasado de sobra el candado de la prueba anterior */
const dosCambiosSeguidos = await pagina.evaluate(() => {
  window.scrollTo(0, 0);
  window.CabeceraFija.evaluar();
  const trasElPrimero = document.querySelector('#pantalla-abiertos header.cabecera').classList.contains('encogida');
  window.scrollTo(0, 300);
  window.CabeceraFija.evaluar();
  const trasElContrario = document.querySelector('#pantalla-abiertos header.cabecera').classList.contains('encogida');
  return { trasElPrimero, trasElContrario };
});
await comprobar('primer cambio: se despliega', Promise.resolve(dosCambiosSeguidos.trasElPrimero), false);
await comprobar('el cambio contrario, a los pocos microsegundos, queda bloqueado por el candado',
  Promise.resolve(dosCambiosSeguidos.trasElContrario), false);

await pagina.waitForTimeout(450);
await pagina.evaluate(() => { window.CabeceraFija.evaluar(); });
await comprobar('pasados los 400 ms del candado, el mismo cambio ya se aplica',
  encogidaDe('#pantalla-abiertos header.cabecera'), true);

await subirYEsperar(0);

console.log('=== 2. js/barra.js sigue encontrando "#pantalla-abiertos .cabecera" ===');
await comprobarQue('el botón grande de Nuevo asunto está puesto (lo pone barra.js dentro de la cabecera)',
  pagina.evaluate(() => !!document.getElementById('btn-nuevo-asunto')));
await comprobarQue('el selector que usa barra.js sigue encontrando la cabecera',
  pagina.evaluate(() => !!document.querySelector('#pantalla-abiertos .cabecera')));

console.log('=== 3. z-index por debajo de diálogos y mensajes ===');
await comprobar('la cabecera lleva z-index 20 (menos que .capa 50 y .mensajes 60)',
  pagina.evaluate(() => getComputedStyle(document.querySelector('#pantalla-abiertos header.cabecera')).zIndex), '20');

console.log('=== 4. El archivo: el ancho sigue al de verdad, con con-lector ===');
await pagina.evaluate(() => App.ir('archivo'));
await pagina.waitForTimeout(200);
const anchoNormal = await pagina.evaluate(() => [
  document.querySelector('#pantalla-archivo header.cabecera').getBoundingClientRect().width,
  document.querySelector('.contenido').getBoundingClientRect().width
]);
await comprobar('sin panel al lado, la cabecera mide igual que .contenido', anchoNormal[0], anchoNormal[1]);

await pagina.evaluate(() => document.body.classList.add('con-lector'));
await pagina.waitForTimeout(200);
const anchoConLector = await pagina.evaluate(() => [
  document.querySelector('#pantalla-archivo header.cabecera').getBoundingClientRect().width,
  document.querySelector('.contenido').getBoundingClientRect().width
]);
await comprobar('con el panel de lectura abierto, la cabecera se estrecha igual que .contenido',
  anchoConLector[0], anchoConLector[1]);
await comprobarQue('y de verdad es más estrecha que antes (sigue el ancho real, no el de la ventana)',
  Promise.resolve(anchoConLector[0] < anchoNormal[0]));
await pagina.evaluate(() => document.body.classList.remove('con-lector'));

console.log('=== 5. Cambiar de pantalla: la anterior queda limpia, la nueva funciona igual ===');
await pagina.evaluate(() => App.ir('abiertos'));
await subirYEsperar(200);
await comprobar('en abiertos, vuelve a encogerse al bajar', encogidaDe('#pantalla-abiertos header.cabecera'), true);

await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(200);
await comprobar('la cabecera de "abiertos", ya no visible, queda limpia (sin "encogida")',
  encogidaDe('#pantalla-abiertos header.cabecera'), false);

/* Ajustes tiene la rejilla de tipos en varias columnas: con el ancho
   del monitor grande cabrían casi todos en pocas filas y no quedaría
   sitio para bajar 80px. Una ventana más estrecha (siguen siendo
   más de 900px, así que no entra el CSS de pantalla pequeña) da menos
   columnas y más alto, sin que tenga nada que ver con esta fila. */
await pagina.setViewportSize({ width: 1100, height: 600 });
await pagina.waitForTimeout(200);
await subirYEsperar(0);
await comprobar('al entrar en Ajustes (arriba del todo), su cabecera no está encogida',
  encogidaDe('#pantalla-ajustes header.cabecera'), false);
await comprobarQue('hay sitio para bajar en Ajustes',
  pagina.evaluate(() => document.documentElement.scrollHeight - window.innerHeight > 120));
await subirYEsperar(200);
await comprobar('Ajustes funciona igual: se encoge también al bajar',
  encogidaDe('#pantalla-ajustes header.cabecera'), true);

console.log('--- las pestañas de Ajustes se quedan pegadas justo debajo ---');
const posicionPestanas = await pagina.evaluate(() => {
  const cabecera = document.querySelector('#pantalla-ajustes header.cabecera');
  const pestanas = document.getElementById('pestanas-ajustes');
  return {
    posicion: getComputedStyle(pestanas).position,
    huecoEntreMedias: pestanas.getBoundingClientRect().top - cabecera.getBoundingClientRect().bottom
  };
});
await comprobar('las pestañas de Ajustes son sticky', posicionPestanas.posicion, 'sticky');
await comprobarQue('quedan pegadas justo debajo de la cabecera, sin hueco ni solape',
  Promise.resolve(Math.abs(posicionPestanas.huecoEntreMedias) < 2));

await subirYEsperar(0);

console.log('=== 6. La ficha de un asunto: se encoge, y el repintado no pierde el estado ===');
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(300);

/* Fila 107: la cuadrícula de tarjetas cabe sin bajar; para tener por
   dónde bajar se abre una tarjeta en grande con contenido largo. */
await pagina.addStyleTag({ content: '#ficha-guia { min-height: 2000px; }' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(200);
await comprobarQue('la ficha tiene sitio de sobra para bajar más de 80px',
  pagina.evaluate(() => document.documentElement.scrollHeight - window.innerHeight > 150));
await comprobar('al entrar en la ficha, su cabecera se ve entera', encogidaDe('header.ficha-cabecera'), false);
await subirYEsperar(200);
await comprobar('al bajar, la cabecera de la ficha se encoge', encogidaDe('header.ficha-cabecera'), true);

console.log('--- un cambio en la ficha la repinta entera: no debe perder el "encogida" ---');
/* Desde la fila 129 no hay desplegable de estado: se cambia la ficha por
   debajo y se deja que la ficha se reenganche sola, como con un cambio
   del otro ordenador (la huella cambia → pintar(), <header> nuevo). */
await pagina.evaluate(async () => {
  document.querySelector('header.ficha-cabecera').dataset.viejo = '1';
  await App.anotar(App.fichaAbierta(), { descripcion: 'Cambiada para la prueba' });
  await App.reengancharFicha();
});
await pagina.waitForTimeout(500);
await comprobar('tras el repintado (nuevo <header> de verdad), sigue encogida sin haber vuelto a hacer scroll',
  encogidaDe('header.ficha-cabecera'), true);
await comprobar('y el repintado sí ha llegado (el <header> es otro)',
  pagina.evaluate(() => !document.querySelector('header.ficha-cabecera').dataset.viejo), true);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await subirYEsperar(0);

console.log('=== 7. "Por clasificar": Viendo… + Ir a su fila ===');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await comprobar('sin nada abierto, la cabecera encogida no lleva "Viendo…"',
  pagina.evaluate(() => !!document.querySelector('.cabecera-viendo-nombre')), false);

await pagina.click('#lista-sueltos .fila-menu-btn');
await pagina.locator('#lista-sueltos .fila-menu').getByRole('button', { name: 'Abrir', exact: true }).click();
await pagina.waitForTimeout(600);
await comprobarQue('el documento queda marcado como abierto en su tarjeta',
  pagina.evaluate(() => !!document.querySelector('.tarjeta-abierta')));

await subirYEsperar(200);
await comprobar('encogida, con el documento abierto', encogidaDe('#pantalla-abiertos header.cabecera'), true);
await comprobar('"Viendo: …" dice el nombre del documento abierto',
  pagina.locator('.cabecera-viendo-nombre').textContent(), 'Viendo: Escrito sin clasificar.pdf');

const antesDeIr = await pagina.evaluate(() => document.querySelector('.tarjeta-abierta').getBoundingClientRect().top);
await pagina.click('.cabecera-viendo-ir');
await pagina.waitForTimeout(600);
const posicionTarjeta = await pagina.evaluate(() => {
  const t = document.querySelector('.tarjeta-abierta').getBoundingClientRect();
  const c = document.querySelector('#pantalla-abiertos header.cabecera').getBoundingClientRect();
  return { top: t.top, debajoDeLaCabecera: t.top >= c.bottom - 1, dentroDeLaVentana: t.top < window.innerHeight };
});
await comprobarQue('"Ir a su fila" mueve el scroll (la tarjeta cambia de sitio en la ventana)',
  Promise.resolve(Math.abs(posicionTarjeta.top - antesDeIr) > 5));
await comprobarQue('"Ir a su fila" deja la tarjeta visible, no tapada por la cabecera pegada',
  Promise.resolve(posicionTarjeta.debajoDeLaCabecera && posicionTarjeta.dentroDeLaVentana));

await pagina.click('#visor-cerrar').catch(() => {});
await pagina.waitForTimeout(300);
await comprobar('al cerrar el documento, "Viendo…" desaparece',
  pagina.evaluate(() => !!document.querySelector('.cabecera-viendo-nombre')), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
