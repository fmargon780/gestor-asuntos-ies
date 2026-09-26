/* Prueba en navegador de verdad de "Nuevo asunto, sin repetir nada"
   (fila 173, docs/NUEVO-ASUNTO-SIN-REPETIR.md).

   Sin el arreglo esta prueba falla desde el punto (a): cambiar de tipo
   borra el tercero elegido, dar de alta relanza la búsqueda sin fijar a
   nadie, el formulario sigue preguntando la vía dos veces (con
   `#campo-via` suelto) y "Marcar como hecho" no lleva a ningún sitio.

   (a) Nuevo asunto: elegir tipo, tercero, y cambiar a otro tipo de la
       misma categoría: el tercero sigue puesto.
   (b) Dar de alta un tercero: queda elegido sin pulsar nada más.
   (c) El formulario tiene una sola pregunta de vía (dentro de "Quién lo
       pide y por qué vía"), y el asunto creado guarda `ficha.via`.
   (d) En la mesa, "Marcar como hecho" deja abierta la mesa del hito
       siguiente. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'AVISO', categoria: 'PERSONAL' },
  { tipo: 'RECLAMACION', categoria: 'PERSONAL' },
  { tipo: 'TRAMITE', categoria: 'PERSONAL' }
];
const GUIAS = {
  TRAMITE: [
    { id: 'm1', titulo: 'Primer paso', cuerpo: '', opciones: [], guion: [] },
    { id: 'm2', titulo: 'Segundo paso', cuerpo: '', opciones: [], guion: [] }
  ]
};
const ASUNTO_TRAMITE = '260920 TRAMITE Núñez Soto, Pilar';

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

async function leerJson(nombreFichero) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombreFichero);
}

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([tipos, guias]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('guias.json', window.__disco.fich('guias.json', JSON.stringify(guias)));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = [
    'Nombre;Documento;Puesto;Teléfono;Correo',
    'López García, Marta;12345678A;Conserje;600111222;marta@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('personal.csv', window.__disco.fich('personal.csv', csv));
}, [TIPOS, GUIAS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================================================================
   (a) Cambiar de tipo no borra el tercero.
   ================================================================ */
console.log('--- (a) cambiar de tipo, de la misma categoría, conserva el tercero ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="PERSONAL"]');
await pagina.getByRole('button', { name: 'AVISO', exact: true }).click();
await pagina.fill('#buscar-tercero', 'lopez');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('el tercero queda fijado', pagina.locator('#tercero-elegido').textContent().then(t => t.indexOf('López García, Marta') !== -1), true);

await pagina.getByRole('button', { name: 'RECLAMACION', exact: true }).click();
await pagina.waitForTimeout(200);
await comprobar('tras cambiar a otro tipo de la misma categoría, el tercero sigue puesto',
  pagina.locator('#tercero-elegido').isHidden().then(oculto => !oculto &&
    pagina.locator('#tercero-elegido').textContent().then(t => t.indexOf('López García, Marta') !== -1)), true);

/* ================================================================
   (b) Dar de alta un tercero: queda elegido sin pulsar nada más.
   ================================================================ */
console.log('--- (b) dar de alta un tercero deja elegido, sin pulsar nada ---');

await pagina.fill('#buscar-tercero', 'Gómez Prado, Iván');
await pagina.waitForTimeout(300);
await pagina.getByRole('button', { name: '+ Dar de alta uno nuevo' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el nombre llega ya escrito en el cuadro de alta',
  pagina.locator('.alta-campo[data-campo="Nombre"]').inputValue(), 'Gómez Prado, Iván');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(300);
await comprobar('el recién dado de alta queda elegido, sin pulsar nada más',
  pagina.locator('#tercero-elegido').isVisible().then(v => v &&
    pagina.locator('#tercero-elegido').textContent().then(t => t.indexOf('Gómez Prado, Iván') !== -1)), true);

/* ================================================================
   (c) Una sola pregunta de vía, dentro de "Quién lo pide y por qué
       vía"; el asunto creado guarda ficha.via.
   ================================================================ */
console.log('--- (c) una sola pregunta de vía, guardada en ficha.via ---');

await comprobar('no queda ningún "#campo-via" suelto', pagina.evaluate(() => !document.getElementById('campo-via') && !document.getElementById('campo-via-dato')), true);
await comprobar('solo hay una pregunta de "por qué vía", dentro de Lo pide',
  pagina.locator('#pantalla-nuevo select.lopide-via').count(), 1);
await comprobar('el grupo se llama "Quién lo pide y por qué vía"',
  pagina.locator('#grupo-lopide .etiqueta').first().textContent().then(t => t.indexOf('Quién lo pide y por qué vía') !== -1), true);

await pagina.selectOption('#lopide-caja-nuevo .lopide-via', 'TELEFONO');
await pagina.fill('#lopide-caja-nuevo .lopide-via-dato', '600999888');
await pagina.fill('#campo-fecha', '2026-09-20');
await pagina.fill('#campo-descripcion', 'Aviso de prueba');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await Promise.race([
  pagina.waitForSelector('#pantalla-asunto:not(.oculto)'),
  pagina.waitForSelector('#capa:not(.oculto)')
]);
if (await pagina.locator('#capa:not(.oculto)').isVisible().catch(() => false)) await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');

const creado = await pagina.evaluate(() => App.E.registro && Object.keys(App.E.registro.asuntos)
  .filter(n => n.indexOf('Gómez Prado, Iván') !== -1)[0]);
await comprobar('se ha creado el asunto', !!creado, true);
const fichaCreada = await leerJson('asuntos.json').then(j => j.asuntos[creado]);
await comprobar('ficha.via guarda la vía elegida en Lo pide', fichaCreada && fichaCreada.via, 'TELEFONO');
await comprobar('ficha.viaDato guarda el dato', fichaCreada && fichaCreada.viaDato, '600999888');

/* ================================================================
   (d) En la mesa, "Marcar como hecho" deja abierta la mesa del hito
       siguiente.
   ================================================================ */
console.log('--- (d) "Marcar como hecho" abre el hito siguiente ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.evaluate(async (asunto) => {
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'TRAMITE', categoria: 'PERSONAL',
    tercero: 'Núñez Soto, Pilar', curso: '', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO_TRAMITE);
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await pagina.locator('.tarjeta-asunto', { hasText: 'TRAMITE' }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);
await pagina.locator('#ficha-guia .hito[data-id="m1"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="m1"]');
await pagina.waitForTimeout(300);

await pagina.locator('.hito-en-mesa .mesa-marcar-hecho').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="m2"]', { timeout: 8000 });
await pagina.waitForTimeout(300);
await comprobar('la mesa ha pasado sola al hito siguiente', pagina.locator('.hito-en-mesa[data-id="m2"]').isVisible(), true);
const m1Estado = await pagina.evaluate(async (asunto) => {
  const d = await Hitos.leer();
  return Hitos.buscar(d.porAsunto[asunto].hitos, 'm1').estado;
}, ASUNTO_TRAMITE);
await comprobar('el primer hito ha quedado marcado como hecho', m1Estado, 'hecho');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
