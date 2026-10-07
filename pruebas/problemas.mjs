/* Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): cada problema es una tarjeta con su solución.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Inicio avisa con «N problemas por resolver» (y no con «fichas sin carpeta»); el menú, con un punto ámbar.
   2. Pulsar el trozo lleva a Ajustes → «Problemas (N)», con N tarjetas.
   3. Cada tarjeta lleva, a la vista, título, «Qué pasa:», «Por qué:» y «Qué hacer:»; ningún texto prohibido
      (ni en las tarjetas que la demostración no trae: se registran aquí).
   4. Asuntos que han perdido su carpeta: dos botones por asunto, con su frase; «Buscar su carpeta» funciona.
   5. Los hitos de un asunto que ha perdido su carpeta no salen en la tarjeta de los hitos de asuntos que ya no existen.
   6. Lo guardado a la vez en dos ordenadores, dicho con palabras; el fichero de alumnado lleva a Herramientas.
   7. «Avisar por Soporte» abre el cuadro con el texto ya escrito.
   8. Solo consulta: las tarjetas se ven y los botones que cambian algo salen apagados.
   9. Sin tarjetas: «Todo en orden», la pestaña sin número, y desaparecen el trozo de Inicio y el punto del menú. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
async function nuevaPagina(extra) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); " + (extra || '') + " } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  /* Todas las tarjetas de la demostración, ya calculadas. */
  await pagina.waitForFunction(() => window.Problemas && ['alumnado', 'carpetas', 'hitos', 'conflictos', 'script', 'configurar'].every((id) => Problemas.ids().includes(id)), null, { timeout: 30000 });
  await pagina.waitForTimeout(1500);
  return pagina;
}

/* ================= 1 y 2. INICIO Y EL MENÚ ================= */

console.log('--- 1. Inicio y el menú ---');
const pagina = await nuevaPagina();
const n = await pagina.evaluate(() => Problemas.cuenta());
await comprobar('1. el trozo de Inicio dice «N problemas por resolver»',
  pagina.locator('[data-aviso="problemas"]').textContent(), n + ' problemas por resolver');
await comprobar('1. y no hay trozo de «fichas sin carpeta»',
  pagina.evaluate(() => /fichas? sin carpeta/i.test(document.getElementById('avisos-linea').textContent)), false);
await comprobar('1. el botón «Ajustes» del menú lleva el punto ámbar, con el número al pasar el ratón',
  pagina.locator('.pestana[data-pantalla="ajustes"] #punto-problemas').evaluate((p) => [!p.classList.contains('oculto'), p.title]), [true, n + ' problemas por resolver']);

console.log('--- 2. del trozo a la pestaña ---');
await pagina.click('[data-aviso="problemas"]');
await pagina.waitForTimeout(800);
await comprobar('2. abre Ajustes en la pestaña «Problemas (N)»',
  pagina.evaluate(() => [App.E.pestanaAjustes, document.querySelector('[data-ajustes-pestana="problemas"]').textContent.trim()]), ['problemas', 'Problemas (' + n + ')']);
await comprobar('2. con N tarjetas', pagina.locator('#ajustes-tab-problemas .problema').count(), n);
await comprobar('2. y no sale «Todo en orden»', pagina.locator('#problemas-todo-bien').isHidden(), true);

/* ================= 3. LAS CUATRO PARTES Y LAS PALABRAS ================= */

console.log('--- 3. cada tarjeta, con sus cuatro partes ---');
const PROHIBIDAS = /hu[eé]rfan|ficha sin carpeta|fichas sin carpeta|envoltura|json|\.(js|md|gs|csv)\b|docs\//i;
await comprobar('3. título, «Qué pasa:», «Por qué:» y «Qué hacer:» a la vista, sin abrir nada', pagina.evaluate(() =>
  [...document.querySelectorAll('#ajustes-tab-problemas .problema')].map((t) => {
    const visible = (e) => !!e && e.offsetParent !== null && !e.closest('details:not([open])');
    const lineas = [...t.querySelectorAll('.problema-linea')].map((l) => l.textContent);
    return visible(t.querySelector('.problema-titulo')) && t.querySelector('.problema-titulo').textContent.length > 5 &&
      lineas.some((l) => l.startsWith('Qué pasa: ')) && lineas.some((l) => l.startsWith('Por qué: ')) && lineas.some((l) => l.startsWith('Qué hacer:')) &&
      !t.closest('details');
  }).every(Boolean)), true);
const textoVisible = (pg) => pg.evaluate(() => [...document.querySelectorAll('#ajustes-tab-problemas .problema')].map((t) => {
  const c = t.cloneNode(true);
  c.querySelectorAll('.problema-detalle').forEach((d) => d.remove());
  return c.textContent;
}).join('\n'));
await comprobar('3. ni «huérfano», «ficha sin carpeta», «envoltura», «json» ni nombres de fichero', PROHIBIDAS.test(await textoVisible(pagina)), false);
await comprobar('3. cada acción lleva a su lado una frase que dice qué pasa al pulsarla', pagina.evaluate(() =>
  [...document.querySelectorAll('#ajustes-tab-problemas .problema-accion')].every((a) => a.querySelector('button') && a.querySelector('.problema-explica') && a.querySelector('.problema-explica').textContent.length > 10)), true);
await comprobar('3. la acción normal va la primera y lleva «(lo normal)»', pagina.evaluate(() =>
  [...document.querySelectorAll('#ajustes-tab-problemas .problema-acciones')].every((c) => {
    const bs = [...c.querySelectorAll('button')];
    return bs.every((b, i) => /\(lo normal\)/.test(b.textContent) ? i === 0 : true);
  })), true);

/* Las tarjetas que la demostración no trae: se registran aquí y se miran igual. */
await pagina.evaluate(() => {
  Problemas.registrar('envolturas', ProblemasTextos.envolturas('js/uno.js → algo: no se ha llegado a aplicar'));
  Problemas.registrar('bandeja', ProblemasTextos.bandeja(5));
  Problemas.registrar('rutas', ProblemasTextos.rutas({ margen: -3, masOcupa: { clave: 'tercero', texto: 'el tercero más largo' } }));
  Problemas.registrar('fichas-archivo', ProblemasTextos.fichasArchivo(2));
  Problemas.registrar('contacto', ProblemasTextos.contacto(3));
});
await pagina.waitForTimeout(300);
await comprobar('3. las demás tarjetas, igual: sin palabras prohibidas en lo que se ve', PROHIBIDAS.test(await textoVisible(pagina)), false);
await comprobar('3. el detalle técnico de «una parte no se ha cargado bien» está plegado',
  pagina.evaluate(() => { const d = document.querySelector('[data-problema="envolturas"] .problema-detalle'); return [!!d, d.open]; }), [true, false]);
await comprobar('3. (la demostración trae un script de Gmail anticuado) los pasos de «El envío de correo está anticuado» van numerados, con «Esto lo hace quien montó la aplicación.»',
  pagina.evaluate(() => { const t = document.querySelector('[data-problema="script"]'); return [t.querySelectorAll('ol.problema-pasos li').length, t.textContent.includes('Esto lo hace quien montó la aplicación.')]; }), [3, true]);
await comprobar('3. los pasos de «No llegan correos a la bandeja» van numerados y el título no lleva ruido',
  pagina.evaluate(() => { const t = document.querySelector('[data-problema="bandeja"]'); return [t.querySelectorAll('ol.problema-pasos li').length, t.querySelector('.problema-titulo').textContent]; }), [4, 'No llegan correos a la bandeja']);
await comprobar('3. orden de las tarjetas: el de la lista',
  pagina.evaluate(() => [...document.querySelectorAll('#ajustes-tab-problemas .problema')].map((t) => t.dataset.problema)),
  await pagina.evaluate(() => Problemas.ORDEN.filter((id) => !!document.querySelector('[data-problema="' + id + '"]'))));

/* ================= 7. «AVISAR POR SOPORTE» ================= */

console.log('--- 7. Avisar por Soporte ---');
await pagina.locator('[data-problema="envolturas"]').getByRole('button', { name: 'Avisar por Soporte' }).click();
await pagina.waitForSelector('#soporte-texto');
await comprobar('7. el cuadro de Soporte se abre con el problema ya escrito, y el detalle técnico viaja dentro',
  pagina.evaluate(() => { const t = document.getElementById('soporte-texto').value; return [t.includes('Una parte de la aplicación no se ha cargado bien'), t.includes('no se ha llegado a aplicar')]; }), [true, true]);
await pagina.click('#soporte-cancelar');
await pagina.waitForTimeout(300);
await pagina.locator('[data-problema="script"]').getByRole('button', { name: 'Avisar por Soporte' }).click();
await pagina.waitForSelector('#soporte-texto');
await comprobar('7. y en la tarjeta de la demostración (el envío de correo anticuado) también',
  pagina.evaluate(() => document.getElementById('soporte-texto').value.includes('El envío de correo está anticuado')), true);
await pagina.click('#soporte-cancelar');
await pagina.waitForTimeout(300);
await pagina.evaluate(() => ['envolturas', 'bandeja', 'rutas', 'fichas-archivo', 'contacto'].forEach((id) => Problemas.registrar(id, null)));
await pagina.waitForTimeout(300);
await comprobar('7. quitadas las de prueba, vuelve la cuenta de la demostración', pagina.locator('#ajustes-tab-problemas .problema').count(), n);

/* ================= 4 y 5. LAS CARPETAS PERDIDAS Y LOS HITOS ================= */

console.log('--- 4. asuntos que han perdido su carpeta ---');
const carpetas = pagina.locator('[data-problema="carpetas"]');
await comprobar('4. el título lleva el número y sin palabras del código', carpetas.locator('.problema-titulo').textContent(), '1 asunto ha perdido su carpeta');
await comprobar('4. cada asunto: «Buscar su carpeta (lo normal)» y «El asunto ya no existe», cada uno con su frase',
  pagina.evaluate(() => [...document.querySelectorAll('[data-problema="carpetas"] .problema-elemento .problema-accion')].map((a) => [a.querySelector('button').textContent, a.querySelector('.problema-explica').textContent])),
  [['Buscar su carpeta (lo normal)', 'Eliges la carpeta que es ahora la suya. El asunto queda como estaba, con sus hitos y sus notas.'],
   ['El asunto ya no existe', 'Se quita de la lista. Queda en las copias de seguridad durante 90 días, por si era un error.']]);
const nombreAsunto = await pagina.locator('[data-problema="carpetas"] .problema-nombre').textContent();

console.log('--- 5. los hitos no salen dos veces ---');
await comprobar('5. los hitos del asunto sin carpeta existen en la demostración, pero no salen en la tarjeta de los hitos',
  pagina.evaluate(async (nombre) => {
    const d = await Hitos.leer();
    const nombres = [...document.querySelectorAll('[data-problema="hitos"] .problema-nombre')].map((e) => e.textContent);
    return [!!d.porAsunto[nombre], nombres.length, nombres.includes(nombre)];
  }, nombreAsunto), [true, 1, false]);

await pagina.locator('[data-problema="carpetas"]').getByRole('button', { name: 'Buscar su carpeta (lo normal)' }).click();
await pagina.waitForSelector('#huerfana-destino');
const destino = await pagina.evaluate(() => [...document.querySelectorAll('#huerfana-destino option')].map((o) => o.value)[0]);
await pagina.selectOption('#huerfana-destino', destino);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => !document.querySelector('[data-problema="carpetas"]'), null, { timeout: 15000 });
await pagina.waitForTimeout(800);
await comprobar('4. el asunto desaparece de la tarjeta, queda con sus hitos y el número baja en la pestaña, en Inicio y en el menú',
  pagina.evaluate(async (a) => {
    const d = await Hitos.leer();
    return [!!App.E.registro.asuntos[a.destino], !!d.porAsunto[a.destino] && !d.porAsunto[a.viejo],
      document.querySelector('[data-ajustes-pestana="problemas"]').textContent.trim(),
      document.querySelector('[data-aviso="problemas"]').textContent,
      document.getElementById('punto-problemas').title];
  }, { destino, viejo: nombreAsunto }),
  [true, true, 'Problemas (' + (n - 1) + ')', (n - 1) + ' problemas por resolver', (n - 1) + ' problemas por resolver']);
await comprobar('5. y la tarjeta de los hitos sigue con el de verdad perdido', pagina.locator('[data-problema="hitos"] .problema-nombre').count(), 1);

/* ================= 6. DOS ORDENADORES Y EL FICHERO DE ALUMNADO ================= */

console.log('--- 6. lo guardado a la vez, y el alumnado ---');
await comprobar('6. cada línea dice qué es con palabras, y sus dos botones llevan su frase',
  pagina.evaluate(() => [...document.querySelectorAll('[data-problema="conflictos"] .problema-elemento')].map((e) =>
    [e.querySelector('.problema-nombre').textContent, [...e.querySelectorAll('.problema-accion')].map((a) => [a.querySelector('button').textContent, a.querySelector('.problema-explica').textContent.length > 10])])),
  [['La lista de tipos de documento', [['Quedarse con el de este ordenador', true], ['Quedarse con el otro', true]]]]);
await comprobar('6. el título del fichero de alumnado', pagina.locator('[data-problema="alumnado"] .problema-titulo').textContent(), 'El fichero de alumnado tiene 90 días');
await pagina.locator('[data-problema="alumnado"]').getByRole('button', { name: 'Traer el alumnado (lo normal)' }).click();
await pagina.waitForTimeout(800);
await comprobar('6. «Traer el alumnado» abre Herramientas en esa sección',
  pagina.evaluate(() => [!document.getElementById('pantalla-herramientas').classList.contains('oculto'), document.getElementById('bloque-traer-alumnado').open]), [true, true]);

/* ================= 9. TODO EN ORDEN ================= */

console.log('--- 9. sin tarjetas ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => App.cambiarPestanaAjustes('problemas'));
await pagina.locator('[data-problema="hitos"]').getByRole('button', { name: 'Quitar' }).click();
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => !document.querySelector('[data-problema="hitos"]'), null, { timeout: 15000 });
await pagina.locator('[data-problema="conflictos"]').getByRole('button', { name: 'Quedarse con el de este ordenador' }).click();
await pagina.waitForFunction(() => !document.querySelector('[data-problema="conflictos"]'), null, { timeout: 15000 });
await pagina.evaluate(async () => {   /* el fichero de alumnado, bajado de nuevo */
  const h = await App.E.datos.getFileHandle('RegAlum.csv');   /* «Traer el alumnado» de Séneca: copia el fichero encima */
  await Carpetas.copiarFicheroEn(App.E.datos, h, 'RegAlum.csv');
});
await pagina.locator('[data-problema="alumnado"]').getByRole('button', { name: 'Ya lo he bajado, vuelve a mirar' }).click();
await pagina.waitForFunction(() => !document.querySelector('[data-problema="alumnado"]'), null, { timeout: 15000 });
await pagina.evaluate(() => CorreoEnviar.probar());   /* «Probar» el envío, en la demostración, deja el script al día */
await pagina.waitForFunction(() => !document.querySelector('[data-problema="script"]'), null, { timeout: 15000 });
await pagina.evaluate(async () => {   /* lo que falta por configurar: «No lo uso en este ordenador» */
  ComprobacionEntrada.filas().filter((f) => f.estado === 'falta' || f.estado === 'sin-comprobar').forEach((f) => ComprobacionEntrada.omitir(f.id));
  await ComprobacionEntrada.comprobar();
});
await pagina.waitForTimeout(800);
await comprobar('9. no queda ninguna tarjeta', pagina.evaluate(() => [Problemas.cuenta(), document.querySelectorAll('#ajustes-tab-problemas .problema').length]), [0, 0]);
await comprobar('9. «Todo en orden. No hay nada que arreglar.»', pagina.locator('#problemas-todo-bien').evaluate((p) => [!p.classList.contains('oculto'), p.textContent.trim()]), [true, 'Todo en orden. No hay nada que arreglar.']);
await comprobar('9. la pestaña se llama «Problemas», sin número, y sin punto ámbar',
  pagina.evaluate(() => [document.querySelector('[data-ajustes-pestana="problemas"]').textContent.trim(), document.getElementById('problemas-punto').classList.contains('oculto')]), ['Problemas', true]);
await comprobar('9. desaparecen el trozo de Inicio y el punto del menú',
  pagina.evaluate(() => [!!document.querySelector('[data-aviso="problemas"]'), document.getElementById('punto-problemas').classList.contains('oculto')]), [false, true]);
await pagina.close();

/* ================= 8. SOLO CONSULTA ================= */

console.log('--- 8. solo consulta ---');
const consulta = await nuevaPagina("localStorage.setItem('gestor.soloConsulta', '1');");
await consulta.evaluate(() => { App.ir('ajustes'); App.cambiarPestanaAjustes('problemas'); });
await consulta.waitForTimeout(1500);
await comprobar('8. las tarjetas se ven', consulta.evaluate(() => document.querySelectorAll('#ajustes-tab-problemas .problema').length > 0), true);
await comprobar('8. los botones que cambian algo salen apagados; los que solo llevan a un sitio, no',
  consulta.evaluate(() => {
    const bs = [...document.querySelectorAll('#ajustes-tab-problemas .problema button')];
    const cambian = bs.filter((b) => !b.hasAttribute('data-solo-lectura'));
    const miran = bs.filter((b) => b.hasAttribute('data-solo-lectura'));
    return [cambian.length > 0 && cambian.every((b) => b.disabled), miran.length > 0 && miran.every((b) => !b.disabled)];
  }), [true, true]);
await consulta.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
