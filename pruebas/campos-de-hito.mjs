/* Prueba en navegador de verdad de la fila 255 de docs/COLA.md
   (docs/CAMPOS-DE-UN-HITO.md): campos de un hito. Con los datos de demostración:
   el tipo FACTURA lleva «Fecha de la factura» en el hito «Tramitar el pago».

   1. La tarjeta «Campos de este hito» de la mesa, con «+ Añadir campo»; sin campos, pequeña.
   2. Rellenar en el sitio: se guarda solo, y sale en la ficha bajo el título de su hito.
   3. El otro asunto del tipo lo tiene, vacío.
   4. «+ Añadir campo» desde un hito: «Ya están en este asunto», «¿Dónde se guarda?» con su frase.
   5. «⋮» → «Quitar de este hito», y «Solo en este asunto».
   7. Borrar el paso de la guía: el campo pasa a ser del asunto, con su valor.
   Más: las funciones puras, y sin errores en la consola. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila', { timeout: 20000 });

/* 0. Las funciones puras. */
await comprobar('0. repartir: sin hito, por hito y el que ya no existe',
  pagina.evaluate(() => {
    const hitos = [{ id: 'h1', origenGuia: 'g1', titulo: 'Uno' }, { id: 'h2', origenGuia: null, titulo: 'Dos' }];
    const campos = [{ n: 'a' }, { n: 'b', hito: 'g1' }, { n: 'c', hito: 'h2' }, { n: 'd', hito: 'perdido' }, { n: 'e', hito: 'perdido' }];
    const r = CamposDeHito.repartir(campos, hitos, (c) => c.n === 'd');
    return { sin: r.sinHito.map((c) => c.n), por: r.porHito.map((g) => g.hito.titulo + ':' + g.campos.map((c) => c.n).join('')) };
  }), { sin: ['a', 'd'], por: ['Uno:b', 'Dos:c'] });
await comprobar('0. camposDeAsunto: el hito de la ficha se pone al campo del tipo; «hito: \'\'» lo quita',
  pagina.evaluate(() => {
    const tipo = [{ origen: 'propio', id: 'a' }, { origen: 'propio', id: 'b', hito: 'g' }];
    const f = { camposPropiosDelAsunto: [{ origen: 'propio', id: 'a', hito: 'x' }, { origen: 'propio', id: 'b', hito: '' }] };
    return Campos.camposDeAsunto(tipo, f).map((c) => c.id + ':' + (c.hito || '-'));
  }), ['a:x', 'b:-']);

/* Los dos asuntos FACTURA. */
const facturas = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => (a.ficha && a.ficha.tipo) === 'FACTURA' || (a.leido && a.leido.tipo) === 'FACTURA').map((a) => a.nombre));
const A1 = facturas[0], A2 = facturas[1];
const hitosDe = (n) => pagina.evaluate(async (x) => (await Hitos.hitosDe(x)).map((h) => ({ id: h.id, titulo: h.titulo, origen: h.origenGuia })), n);
const H = await hitosDe(A1);
const H2 = await hitosDe(A2);
const quitarAvisos = () => pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove()));
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'), (m) => m.firstChild.textContent));
const fichaDe = (n) => pagina.evaluate((x) => { const f = App.E.registro.asuntos[x] || {}; return { campos: f.campos, solo: f.camposPropiosDelAsunto }; }, n);
const configTipo = () => pagina.evaluate(async () => ((await Carpetas.leerJson(App.E.gestor, 'campos.json')).porTipo || {}).FACTURA || []);

async function abrirMesa(nombre, idHito) {
  await pagina.evaluate(() => { if (window.HitoMesa && HitoMesa.estaAbierta()) HitoMesa.cerrar(); });
  await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, nombre);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(500);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  await pagina.locator('#ficha-guia .hito[data-id="' + idHito + '"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]');
  await pagina.waitForTimeout(400);
}
const tarjeta = () => pagina.locator('#ficha-guia .hito-en-mesa .mesa-campos-hito');
const resumenTarjeta = () => pagina.evaluate(() => {
  const t = document.querySelector('#ficha-guia .hito-en-mesa .mesa-campos-hito');
  return t ? { titulo: t.querySelector('.mesa-bloque-titulo').textContent, boton: (t.querySelector('.mesa-campo-hito-anadir') || {}).textContent,
    campos: Array.prototype.map.call(t.querySelectorAll('.mesa-campo-hito > .etiqueta'), (e) => e.textContent.trim()) } : null;
});

/* 1. La tarjeta. */
await abrirMesa(A1, H[1].id);
await comprobar('1. «Tramitar el pago»: la tarjeta lleva «Fecha de la factura»',
  resumenTarjeta(), { titulo: 'Campos de este hito', boton: '+ Añadir campo', campos: ['Fecha de la factura'] });
await comprobar('1. el control es el de la clase Fecha', pagina.evaluate(() => document.querySelector('.mesa-campos-hito input').type), 'date');
await abrirMesa(A1, H[0].id);
await comprobar('1. «Revisar la factura»: sin campos, la tarjeta sale pequeña con el botón',
  pagina.evaluate(() => { const t = document.querySelector('#ficha-guia .hito-en-mesa .mesa-campos-hito');
    return { vacia: t.classList.contains('mesa-campos-hito-vacia'), boton: !!t.querySelector('.mesa-campo-hito-anadir'), filas: t.querySelectorAll('.mesa-campo-hito').length }; }),
  { vacia: true, boton: true, filas: 0 });

/* 2. Rellenar en el sitio. */
await abrirMesa(A1, H[1].id);
await quitarAvisos();
await pagina.fill('.mesa-campos-hito input[type="date"]', '2026-09-30');
await pagina.locator('.mesa-campos-hito input[type="date"]').dispatchEvent('change');
await pagina.waitForTimeout(800);
await comprobar('2. se guarda solo, con aviso verde', avisos().then((a) => a.some((t) => t.indexOf('«Fecha de la factura» guardado') === 0)), true);
await comprobar('2. el valor está en la ficha del asunto', fichaDe(A1).then((f) => f.campos['propio:p-fecha-factura'].valor), '2026-09-30');
await comprobar('2. en la ficha sale bajo el título de su hito',
  pagina.evaluate(() => {
    const filas = Array.prototype.map.call(document.querySelectorAll('#ficha-datos-tramite .ficha-dato:not(.oculto)'), (f) => f.textContent.replace(/\s+/g, ' ').trim());
    const i = filas.indexOf('Tramitar el pago');
    return i === -1 ? filas : filas.slice(i, i + 2);
  }), ['Tramitar el pago', 'Fecha de la factura30/09/2026']);
await comprobar('2. al repintar sigue en la caja', pagina.evaluate(() => document.querySelector('.mesa-campos-hito input[type="date"]').value), '2026-09-30');

/* 3. El otro asunto. */
await abrirMesa(A2, H2[1].id);
await comprobar('3. en el otro asunto está, vacío',
  pagina.evaluate(() => ({ campos: Array.prototype.map.call(document.querySelectorAll('.mesa-campos-hito .mesa-campo-hito > .etiqueta'), (e) => e.textContent.trim()),
    valor: document.querySelector('.mesa-campos-hito input[type="date"]').value })), { campos: ['Fecha de la factura'], valor: '' });
await comprobar('3. y la ficha no le pone rótulo (no tiene valor)',
  pagina.evaluate(() => document.querySelectorAll('#ficha-datos-tramite .ficha-dato-hito').length), 0);

/* 4. «+ Añadir campo» desde «Revisar la factura». */
await abrirMesa(A1, H[0].id);
await quitarAvisos();
await pagina.click('.hito-en-mesa .mesa-campo-hito-anadir');
await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
await comprobar('4. la ventana trae el título del hito',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent), 'Añadir un campo al hito «Revisar la factura»');
await comprobar('4. «Ya están en este asunto»: los del asunto sin hito (no el de otro hito)',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#campos-catalogo-yaestan .nombre-tipo'), (e) => e.textContent)), ['Importe de la factura']);
await pagina.locator('#campos-catalogo-yaestan .fila-tipo', { hasText: 'Importe de la factura' }).getByRole('button', { name: 'Añadir' }).click();
await pagina.waitForSelector('#capa:not(.oculto) .dsg');
await comprobar('4. «¿Dónde se guarda?»: en el tipo, y la frase del hito',
  pagina.evaluate(() => ({ marcada: document.querySelector('input[name="dsg-donde"]:checked').value,
    nota: document.querySelector('.dsg-nota').textContent })),
  { marcada: 'guia', nota: 'El hito «Revisar la factura» lo tendrá en 2 asuntos abiertos de este tipo, vacío.' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(900);
await comprobar('4. aviso verde con «Deshacer»', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'),
  (m) => m.textContent).some((t) => t.indexOf('Campo añadido al tipo FACTURA') === 0 && t.indexOf('Deshacer') !== -1)), true);
await comprobar('4. el tipo lleva el campo con la marca del hito (el paso de la guía)',
  configTipo().then((c) => c.filter((x) => x.id === 'p-importe-factura').map((x) => x.hito === H[0].origen)), [true]);
await comprobar('4. la tarjeta del hito lo enseña, con su valor intacto',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.hito-en-mesa .mesa-campos-hito .mesa-campo-hito'),
    (f) => f.querySelector('.etiqueta').textContent.trim() + '=' + f.querySelector('input.campo').value)), ['Importe de la factura=' + (await pagina.evaluate((n) => (App.E.registro.asuntos[n].campos['propio:p-importe-factura'] || {}).valor || '', A1))]);

/* 5. «⋮» → «Quitar de este hito» (el del hito «Revisar»). */
await abrirMesa(A1, H[0].id);
await quitarAvisos();
await pagina.locator('.hito-en-mesa .mesa-campo-hito .campo-hito-menu').first().click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Quitar de este hito' }).click();
await pagina.waitForSelector('#capa:not(.oculto) .dsg');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(900);
await comprobar('6. el tipo ya no lleva la marca', configTipo().then((c) => c.filter((x) => x.id === 'p-importe-factura').map((x) => !x.hito)), [true]);
await comprobar('6. la tarjeta del hito vuelve a estar vacía', resumenTarjeta().then((r) => r.campos), []);

/* 6. Solo en este asunto: el campo va al hito solo aquí, y el tipo no cambia. */
await pagina.click('.hito-en-mesa .mesa-campo-hito-anadir');
await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-yaestan');
await pagina.locator('#campos-catalogo-yaestan .fila-tipo', { hasText: 'Importe de la factura' }).getByRole('button', { name: 'Añadir' }).click();
await pagina.waitForSelector('#capa:not(.oculto) .dsg');
await pagina.click('.dsg-opcion:nth-of-type(2)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(900);
await comprobar('7. la tarjeta del hito lo enseña', resumenTarjeta().then((r) => r.campos), ['Importe de la factura']);
await comprobar('7. el tipo no cambia (sin hito)', configTipo().then((c) => c.filter((x) => x.id === 'p-importe-factura').map((x) => !x.hito)), [true]);
await comprobar('7. el otro asunto no lo tiene en ese hito',
  (async () => { await abrirMesa(A2, H2[0].id); return resumenTarjeta().then((r) => r.campos); })(), []);

/* 7. Borrar el paso de la guía: el campo del tipo pasa a ser del asunto. */
await comprobar('8. «Fecha de la factura» sigue con hito antes de borrar el paso',
  configTipo().then((c) => c.filter((x) => x.id === 'p-fecha-factura').map((x) => !!x.hito)), [true]);
await pagina.evaluate(async () => {
  await GuiasDelCentro.cambiarPasos('FACTURA', (pasos) => { pasos.splice(1, 1); });
});
await pagina.waitForTimeout(800);
await comprobar('8. sin el paso, el campo pasa a ser del asunto',
  configTipo().then((c) => c.filter((x) => x.id === 'p-fecha-factura').map((x) => !x.hito)), [true]);
await comprobar('8. y el valor se conserva', fichaDe(A1).then((f) => f.campos['propio:p-fecha-factura'].valor), '2026-09-30');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
