/* Prueba en navegador de verdad de "Ajustes ágiles: encontrar y crear
   tipos sin scroll" (docs/AJUSTES-AGIL.md).

   Sin el arreglo esta prueba falla desde la primera comprobación: hoy
   `#tabla-tipos` pinta las cuatro categorías una detrás de otra, no
   hay pestañas (`#pestanas-tipos`), no hay buscador cruzado
   (`#buscar-tipos`), no hay aviso en vivo (`#aviso-nuevo-tipo`), los
   tipos van en filas sueltas (`.fila-tipo`) en vez de en una rejilla
   de tarjetas (`.tarjeta-tipo`), la pestaña Ajustes vive al fondo de
   `.lateral-pie` y la barra se desplaza con la página en vez de
   quedarse fija.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. Corre a
   1905 píxeles, el ancho del monitor del trabajo, como pruebas/
   tablon.mjs y pruebas/campos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La barra nace plegada: para llegar a la pestaña Ajustes (parte B2)
   hay que abrirla primero, como en pruebas/campos.mjs. */
await pagina.click('#btn-barra');
await pagina.click('.pestana[data-pantalla="ajustes"]');

/* Los once bloques, abiertos de una vez: no se vuelven a cerrar en el
   resto de la prueba (igual que en pruebas/navegador.mjs). Hay que
   abrirlos antes de que nada dentro pueda ser "visible". */
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');

const nombresVisibles = () => pagina.locator('#tabla-tipos .tarjeta-tipo-nombre').allTextContents();

/* ================================================================
   1. Con ALUMNADO en el desplegable, ningún tipo de PERSONAL.
   ================================================================ */
console.log('--- 1. la lista obedece a la categoría elegida ---');

await comprobar('el desplegable empieza en ALUMNADO', pagina.locator('#nueva-categoria').inputValue(), 'ALUMNADO');
await comprobar('se ve MATRICULA (ALUMNADO)', nombresVisibles().then(n => n.indexOf('MATRICULA') !== -1), true);
await comprobar('no se ve ningún tipo de PERSONAL', nombresVisibles().then(n => n.indexOf('TOMA POSESION') === -1), true);

/* ================================================================
   2. Cambiar el desplegable a PERSONAL: la lista cambia y la
      pestaña PERSONAL queda marcada.
   ================================================================ */
console.log('--- 2. cambiar el desplegable cambia la lista y la pestaña ---');

await pagina.selectOption('#nueva-categoria', 'PERSONAL');
await comprobar('ahora se ve TOMA POSESION (PERSONAL)', nombresVisibles().then(n => n.indexOf('TOMA POSESION') !== -1), true);
await comprobar('y ya no se ve MATRICULA', nombresVisibles().then(n => n.indexOf('MATRICULA') === -1), true);
await comprobar('la pestaña PERSONAL queda marcada',
  pagina.locator('.pestana-categoria.activa').textContent().then(t => t.indexOf('PERSONAL') !== -1), true);

/* ================================================================
   3. Pulsar la pestaña EMPRESAS: el desplegable pasa a EMPRESAS.
   ================================================================ */
console.log('--- 3. la pestaña manda también sobre el desplegable ---');

await pagina.locator('.pestana-categoria').filter({ hasText: 'EMPRESAS' }).click();
await comprobar('el desplegable pasa a EMPRESAS', pagina.locator('#nueva-categoria').inputValue(), 'EMPRESAS');
await comprobar('se ve COMPRA (EMPRESAS)', nombresVisibles().then(n => n.indexOf('COMPRA') !== -1), true);

/* ================================================================
   4. El buscador mira en las cuatro categorías a la vez.
      "be" solo está en BECA (ALUMNADO), y ahora mismo se está
      viendo EMPRESAS: si sale, es que el buscador no se ha quedado
      solo con la pestaña activa.
   ================================================================ */
console.log('--- 4. el buscador encuentra en otra categoría, con su etiqueta ---');

await pagina.fill('#buscar-tipos', 'be');
await pagina.waitForTimeout(150);
await comprobar('BECA aparece aunque se estaba viendo EMPRESAS', nombresVisibles().then(n => n.indexOf('BECA') !== -1), true);
await comprobar('BECA lleva su categoría al lado',
  pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'BECA' }).locator('.marca-categoria').textContent(),
  'ALUMNADO');
await comprobar('arriba dice que se está buscando en las cuatro',
  pagina.locator('#tipos-buscando-info').textContent().then(t => t.indexOf('todas las categorías') !== -1), true);
await comprobar('las pestañas se apagan mientras se busca',
  pagina.locator('#pestanas-tipos').evaluate(el => el.classList.contains('apagadas')), true);

await pagina.fill('#buscar-tipos', '');
await pagina.waitForTimeout(150);
await comprobar('al vaciar el buscador, vuelve la categoría marcada (EMPRESAS)',
  nombresVisibles().then(n => n.indexOf('COMPRA') !== -1 && n.indexOf('BECA') === -1), true);

/* ================================================================
   5. Escribir el nombre exacto de un tipo que ya existe: el botón
      Añadir se apaga y sale la línea roja con su categoría.
   ================================================================ */
console.log('--- 5. aviso en vivo: nombre exactamente igual ---');

await pagina.fill('#nuevo-tipo', 'MATRICULA');
await pagina.waitForTimeout(120);
await comprobar('el botón Añadir se apaga', pagina.locator('#btn-anadir-tipo').isDisabled(), true);
await comprobar('la línea roja dice dónde está',
  pagina.locator('#aviso-nuevo-tipo').textContent().then(t =>
    t.indexOf('Ya existe') !== -1 && t.indexOf('MATRICULA') !== -1 && t.indexOf('ALUMNADO') !== -1), true);
await comprobar('el aviso es de los rojos',
  pagina.locator('#aviso-nuevo-tipo').evaluate(el => el.classList.contains('aviso-en-vivo-malo')), true);

/* ================================================================
   6. Un nombre parecido, no igual: línea ámbar, y el botón sigue
      encendido (es un aviso, no una prohibición).
   ================================================================ */
console.log('--- 6. aviso en vivo: nombre parecido ---');

await pagina.fill('#nuevo-tipo', 'MATRICLUA');
await pagina.waitForTimeout(120);
await comprobar('el botón Añadir sigue encendido', pagina.locator('#btn-anadir-tipo').isDisabled(), false);
await comprobar('la línea ámbar avisa del parecido',
  pagina.locator('#aviso-nuevo-tipo').textContent().then(t => t.indexOf('Se parece a') !== -1 && t.indexOf('MATRICULA') !== -1), true);
await comprobar('el aviso es de los ámbar',
  pagina.locator('#aviso-nuevo-tipo').evaluate(el => el.classList.contains('aviso-en-vivo-ambar')), true);

await pagina.fill('#nuevo-tipo', '');
await pagina.waitForTimeout(120);
await comprobar('con el campo vacío no sale ningún aviso',
  pagina.locator('#aviso-nuevo-tipo').textContent(), '');

/* ================================================================
   7. Con veinte tipos en una categoría, la rejilla saca al menos
      tres columnas: la primera, la segunda y la tercera tarjeta
      comparten la misma coordenada de arriba.
   ================================================================ */
console.log('--- 7. la rejilla saca varias columnas ---');

await pagina.evaluate(() => {
  for (let i = 1; i <= 20; i++) {
    App.E.tipos.push({ tipo: 'TIPO DE PRUEBA ' + i, categoria: 'OTROS' });
  }
  App.cambiarCategoriaAjustes('OTROS');
});
await pagina.waitForTimeout(150);
await comprobar('las veinte tarjetas de prueba están, más las de siempre',
  pagina.locator('#tabla-tipos .tarjeta-tipo').count().then(n => n >= 20), true);

const tapas = await pagina.locator('#tabla-tipos .tarjeta-tipo').evaluateAll(
  els => els.slice(0, 3).map(el => Math.round(el.getBoundingClientRect().top)));
await comprobar('las tres primeras tarjetas están en la misma fila (al menos 3 columnas)',
  tapas[0] === tapas[1] && tapas[1] === tapas[2], true);

/* ================================================================
   8. La pestaña Ajustes se ve sin desplazar la página, con los
      bloques abiertos: la barra se ha quedado fija (B1).

   Desde el 17-sep-2026 (fila 39, docs/AJUSTES-POR-TIPO.md) los once
   bloques de antes están repartidos en tres pestañas, así que para
   una página larga de verdad hace falta estar en la que más lleva:
   "Mantenimiento" (Avisos, Carpetas, Copias, Papelera, y los que se
   enganchan solos: bandeja, RegAlum viejo, conflictos, duplicados
   descartados, fichas huérfanas).
   ================================================================ */
console.log('--- 8. la barra queda fija, aunque la página sea larga ---');

await pagina.click('[data-ajustes-pestana="mantenimiento"]');
await pagina.waitForTimeout(150);
await pagina.evaluate(() => {
  document.querySelectorAll('#ajustes-tab-mantenimiento details').forEach((d) => { d.open = true; });
});
await comprobar('"Mantenimiento" trae al menos ocho bloques, todos abiertos',
  pagina.locator('#ajustes-tab-mantenimiento details.bloque-ajustes').count().then(n => n >= 8), true);

await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pagina.waitForTimeout(150);
await comprobar('la página sí se ha desplazado',
  pagina.evaluate(() => window.scrollY > 200), true);
await comprobar('la pestaña Ajustes sigue dentro de la ventana, sin más scroll',
  pagina.evaluate(() => {
    const r = document.querySelector('.pestana[data-pantalla="ajustes"]').getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  }), true);

await pagina.evaluate(() => window.scrollTo(0, 0));

/* ================================================================
   9. Con la barra plegada, el icono de la rueda dentada lleva a
      Ajustes sin tener que abrirla primero.
   ================================================================ */
console.log('--- 9. el icono de Ajustes, con la barra plegada ---');

/* Se abrió a mano al principio de la prueba (como en pruebas/campos.mjs),
   así que se recuerda "abierta" y ya no se pliega sola al cambiar de
   pantalla. Se pliega otra vez a propósito, para probar el icono. */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-barra');
await pagina.waitForTimeout(150);
await comprobar('la barra queda plegada: el icono de Ajustes se ve', pagina.locator('#btn-barra-ajustes').isVisible(), true);
await comprobar('y de plegada, la pestaña normal de Ajustes no se ve',
  pagina.locator('.pestana[data-pantalla="ajustes"]').isVisible(), false);

await pagina.click('#btn-barra-ajustes');
await pagina.waitForTimeout(150);
await comprobar('se llega a la pantalla de Ajustes', pagina.locator('#pantalla-ajustes').isHidden(), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
