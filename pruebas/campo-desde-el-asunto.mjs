/* Prueba en navegador de verdad de la fila 245 de docs/COLA.md
   (docs/CAMPO-DESDE-EL-ASUNTO.md), puesta al día en la fila 584 con lo que cambió la fila 530
   (docs/530-DATOS-EN-EL-ASUNTO.md, punto 8): «+ Añadir campo» ya no abre el panel de Ajustes con pestañas y
   «¿Dónde se guarda?», sino la ventana «Elegir un campo» con el desplegable «Para»
   (Solo este asunto · Los siguientes: pedirlo al crear · Los siguientes: en la parte general). El valor ya no se
   pide en la ventana: el campo sale en su sitio, con su caja para escribirlo.

   1. «+ Añadir campo» en «Campos del asunto» abre «Elegir un campo», con el desplegable «Para».
   2. «Los siguientes: pedirlo al crear»: el campo entra en el tipo, sin «Obligatorio» ni «Añadir al nombre»; el otro
      asunto del tipo lo trae, vacío (en «Cambiar el asunto»); aviso verde.
   3. «Solo este asunto»: marca «solo aquí»; el tipo y el otro asunto no cambian.
   4. «⋮» → «Pasar al tipo» y «Quitar».
   5. Cerrar la ventana no guarda nada.
   6. Sin tipo solo se ofrece «Solo este asunto».
   7. En el ARCHIVO y en modo consulta no sale «+ Añadir campo».
   8. Pulsar el botón no cambia de pestaña.
   9. Un fallo al guardar nunca se queda en silencio. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO_1 = '260915 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const ASUNTO_2 = '260916 CONVALIDACION 26-27 Sola Dos, Ana 9990202';
const CAMPOS = {
  propios: [
    { id: 'p1', nombre: 'Trimestre', clase: 'lista', valores: ['1º', '2º', '3º'] },
    { id: 'p2', nombre: 'Observaciones', clase: 'texto', valores: [] },
    { id: 'p3', nombre: 'Extra', clase: 'texto', valores: [] }
  ],
  porTipo: {}
};

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
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 637: «Campos de este asunto» es un recuadro del bloque «Datos»; esta prueba trabaja con ese bloque abierto (`abrirAlEntrar('tramite')` abre «Datos»). */
await pagina.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function (a) { FichaTarjetas.abrirAlEntrar('tramite'); return alEntrar(a); };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([campos, asunto1, asunto2]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('campos.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(campos)); await w.close();
  await window.__disco.abiertos.getDirectoryHandle(asunto1, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(asunto2, { create: true });
}, [CAMPOS, ASUNTO_1, ASUNTO_2]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([asunto1, asunto2]) => {
  await App.anotar(asunto1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Uno, Eva 9990201', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.anotar(asunto2, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Dos, Ana 9990202', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, [ASUNTO_1, ASUNTO_2]);

async function abrirFichaDe(nombreCorto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre, .nombre-pulsable', { hasText: nombreCorto }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-campo-anadir', { state: 'attached' });
  await pagina.waitForTimeout(300);
}
const filasDatos = () => pagina.evaluate(() => Array.prototype.map.call(
  document.querySelectorAll('#ficha-datos-tramite .ficha-dato:not(.oculto):not(.ficha-dato-anadir)'),
  (f) => f.textContent.replace(/\s+/g, ' ').trim()));
const configTipo = () => pagina.evaluate(async () =>
  ((await Carpetas.leerJson(App.E.gestor, 'campos.json')).porTipo || {}).CONVALIDACION || []);
const fichaDe = (nombre) => pagina.evaluate((n) => {
  const f = App.E.registro.asuntos[n] || {};
  return { campos: f.campos, solo: f.camposPropiosDelAsunto };
}, nombre);
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(
  document.querySelectorAll('#mensajes .mensaje'), (m) => m.firstChild.textContent));

/* Abre «Elegir un campo», va al grupo «Asunto», pone el «Para» y pulsa el campo `nombre`. */
async function abrirVentana() {
  await pagina.click('#ficha-campo-anadir');
  await pagina.waitForSelector('.capa-campos .campos-grupo');
  await pagina.locator('.campos-grupo', { hasText: 'Asunto' }).click();
  await pagina.waitForSelector('.capa-campos .campos-fila-campo');
}
async function elegirCampo(nombre, para) {
  await abrirVentana();
  if (para) await pagina.selectOption('#ce-para', para);
  await pagina.locator('.campos-fila-campo', { hasText: nombre }).first().click();
  await pagina.waitForTimeout(900);
}

/* 0. Las funciones puras. */
await comprobar('0. camposDeAsunto: los del tipo y detrás los «solo aquí», sin repetir',
  pagina.evaluate(() => Campos.camposDeAsunto(
    [{ origen: 'propio', id: 'a' }],
    { camposPropiosDelAsunto: [{ origen: 'propio', id: 'a' }, { origen: 'propio', id: 'b' }] })
    .map((c) => c.id + (c.soloAqui ? '*' : ''))), ['a', 'b*']);
await comprobar('0. el aviso de después',
  pagina.evaluate(() => [CampoDesdeElAsunto.textoAlTipo('CONV', 3), CampoDesdeElAsunto.textoAlTipo('CONV', 1), CampoDesdeElAsunto.textoAlTipo('CONV', 0)]),
  ['Campo añadido al tipo CONV y a 3 asuntos abiertos.', 'Campo añadido al tipo CONV y a 1 asunto abierto.', 'Campo añadido al tipo CONV.']);

/* 1. El botón y la ventana. */
await abrirFichaDe('Sola Uno');
/* Fila 637: «Campos del asunto» ya no es una tarjeta: es el recuadro «Campos de este asunto» del bloque «Datos», con el botón al pie. */
await comprobar('1. el recuadro «Campos de este asunto» lleva el botón (fila 254)',
  pagina.evaluate(() => ({ boton: document.getElementById('ficha-campo-anadir').textContent,
    enRecuadro: !!document.querySelector('#ficha-datos-bloque .datos-grupo.ancho #ficha-campo-anadir'),
    titulo: document.querySelector('#ficha-datos-bloque .datos-grupo.ancho > h4').textContent.trim(),
    viejo: document.body.textContent.indexOf('Datos del trámite') !== -1 })),
  { boton: '+ Añadir campo', enRecuadro: true, titulo: 'Campos de este asunto', viejo: false });
await abrirVentana();
await comprobar('1. sale «Elegir un campo», con los campos del grupo «Asunto» y el desplegable «Para»',
  pagina.evaluate(() => ({ titulo: document.querySelector('.capa-campos .campos-elegir-titulo h3').textContent,
    campos: Array.prototype.map.call(document.querySelectorAll('.campos-fila-campo .campos-fila-nombre'), (x) => x.textContent).slice(0, 3),
    para: Array.prototype.map.call(document.querySelectorAll('#ce-para option'), (o) => o.value) })),
  { titulo: 'Elegir un campo', campos: ['Trimestre', 'Observaciones', 'Extra'], para: ['aqui', 'crear', 'general'] });
await pagina.click('#ce-cerrar');
await comprobar('1. «Cerrar» cierra la ventana sin guardar nada',
  Promise.all([pagina.locator('.capa-campos').count(), configTipo().then((c) => c.length), fichaDe(ASUNTO_1).then((f) => Object.keys(f.campos || {}).length)]), [0, 0, 0]);

/* 2. Un campo al tipo («Los siguientes: pedirlo al crear»). */
await elegirCampo('Trimestre', 'crear');
await comprobar('2. aviso: está en la parte general y llega a los siguientes asuntos',
  avisos().then((a) => a.indexOf('«Trimestre»: la parte general, y se pide al crear el asunto, también en los siguientes asuntos.') !== -1), true);
await comprobar('2. el tipo lo lleva, al final, sin Obligatorio ni Añadir al nombre', configTipo(),
  [{ origen: 'propio', id: 'p1', obligatorio: false, enNombre: false }]);
await comprobar('2. no sale «solo aquí» en este asunto', fichaDe(ASUNTO_1).then((f) => f.solo), undefined);
await comprobar('2. «Cambiar el asunto» del otro asunto trae el campo, vacío',
  pagina.evaluate((n) => {
    const r = App.pintarCamposEditar('CONVALIDACION', {}, App.E.registro.asuntos[n] || {});
    return r.items.map((i) => ({ nombre: i.nombre, valor: i.valor, solo: i.soloAqui }));
  }, ASUNTO_2), [{ nombre: 'Trimestre', valor: '', solo: false }]);

/* 3. «Solo este asunto». */
await pagina.waitForTimeout(8500);   /* que caduque el aviso anterior */
await elegirCampo('Observaciones', 'aqui');
const soloAqui = (nombre) => pagina.evaluate((n) => Array.prototype.map.call(
  Array.prototype.filter.call(document.querySelectorAll('#ficha-datos-tramite .ficha-dato-aqui'), (f) => f.textContent.indexOf(n) !== -1),
  (f) => ({ campo: f.children[0].firstChild.textContent.trim(), marca: f.querySelector('.marca-solo-aqui').textContent, menu: !!f.querySelector('.campo-aqui-menu') })), nombre);
await comprobar('3. sale en la ficha con «solo aquí» y su «⋮»', soloAqui('Observaciones'),
  [{ campo: 'Observaciones', marca: 'solo aquí', menu: true }]);
await comprobar('3. el tipo no cambia', configTipo().then((c) => c.map((x) => x.id)), ['p1']);
await comprobar('3. en el otro asunto no está', fichaDe(ASUNTO_2).then((f) => f.solo), undefined);
await comprobar('3. aviso: solo en este asunto', avisos().then((a) => a.some((t) => /^«Observaciones» sale en .*, solo en este asunto\.$/.test(t))), true);
await comprobar('3. en «Cambiar el asunto» sale también, sin «Añadir al nombre»',
  pagina.evaluate((n) => {
    const r = App.pintarCamposEditar('CONVALIDACION', App.E.registro.asuntos[n].campos, App.E.registro.asuntos[n]);
    return { items: r.items.map((i) => i.nombre + ':' + i.soloAqui), sinCasilla: r.html.indexOf('ed-campo-1-en') === -1 };
  }, ASUNTO_1), { items: ['Trimestre:false', 'Observaciones:true'], sinCasilla: true });

/* 4. «⋮» → Pasar al tipo / Quitar. */
await pagina.waitForTimeout(8500);
await pagina.locator('.ficha-dato-aqui', { hasText: 'Observaciones' }).locator('.campo-aqui-menu').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Pasar al tipo' }).click();
await pagina.waitForTimeout(700);
await comprobar('4. «Pasar al tipo»: está en el tipo y pierde la marca',
  Promise.all([configTipo().then((c) => c.map((x) => x.id)), pagina.locator('.ficha-dato-aqui', { hasText: 'Observaciones' }).count(), fichaDe(ASUNTO_1).then((f) => f.solo)]),
  [['p1', 'p2'], 0, undefined]);
await pagina.waitForTimeout(8500);
await elegirCampo('Extra', 'aqui');
await pagina.locator('.ficha-dato-aqui', { hasText: 'Extra' }).locator('.campo-aqui-menu').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Quitar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('4. «Quitar» (con confirmación): desaparece de la ficha y no queda en el asunto',
  Promise.all([pagina.locator('.ficha-dato-aqui', { hasText: 'Extra' }).count(), fichaDe(ASUNTO_1).then((f) => f.solo)]), [0, undefined]);

/* 5. Cerrar con Escape no guarda nada. */
await pagina.waitForTimeout(8500);
await abrirVentana();
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);
await comprobar('5. Escape: ni el tipo ni la ficha cambian',
  Promise.all([pagina.locator('.capa-campos').count(), configTipo().then((c) => c.map((x) => x.id)), fichaDe(ASUNTO_1).then((f) => f.solo)]),
  [0, ['p1', 'p2'], undefined]);

/* 6. Sin tipo solo se ofrece «Solo este asunto». */
await comprobar('6. sin tipo, el «Para» solo ofrece «Solo este asunto»; con tipo, las tres',
  pagina.evaluate((n) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
    const con = CampoElegirEnAsunto.opcionesPara(a).map((o) => o.valor);
    const tipoDe = DatosDelAsunto.tipoDe;
    DatosDelAsunto.tipoDe = () => '';
    const sin = CampoElegirEnAsunto.opcionesPara(a).map((o) => o.valor);
    DatosDelAsunto.tipoDe = tipoDe;
    return [sin, con];
  }, ASUNTO_1), [['aqui'], ['aqui', 'crear', 'general']]);

/* 7. El ARCHIVO y el modo consulta. */
await comprobar('7. en el ARCHIVO no sale «+ Añadir campo»',
  pagina.evaluate((n) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
    App.abrirFicha(a, 'archivado');
    return new Promise((r) => setTimeout(() => r(!document.getElementById('ficha-campo-anadir')), 500));
  }, ASUNTO_1), true);
await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, ASUNTO_1);
await pagina.waitForSelector('#ficha-campo-anadir');
await pagina.evaluate(() => { FichaNucleo.ocupacionActual = { usuario: 'Compañero' }; FichaNucleo.pintar(); });
await pagina.waitForTimeout(400);
await comprobar('7. en modo consulta el botón y los «⋮» no se ven',
  pagina.evaluate(() => ({
    boton: getComputedStyle(document.getElementById('ficha-campo-anadir')).display,
    menu: Array.prototype.every.call(document.querySelectorAll('.campo-aqui-menu'), (b) => getComputedStyle(b.closest('.ficha-menu-envoltorio') || b).display === 'none' || getComputedStyle(b).display === 'none')
  })), { boton: 'none', menu: true });

/* 8. Fila 254: pulsar el botón no abre ni cierra el bloque. */
await pagina.evaluate((n) => { FichaNucleo.ocupacionActual = null; App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, ASUNTO_1);
await pagina.waitForSelector('#ficha-campo-anadir');
await pagina.waitForTimeout(400);
await pagina.click('#ficha-campo-anadir');
await pagina.waitForSelector('.capa-campos .campos-grupo');
await comprobar('8. el botón no pliega el bloque «Datos» (fila 637: ya no hay pestañas)',
  pagina.evaluate(() => !!document.querySelector('.ficha-plegable[data-tarjeta="datos"].abierto')), true);
await pagina.click('#ce-cerrar');

/* 9. Un fallo al guardar nunca se queda en silencio (aviso rojo, y el campo no sale). */
await pagina.evaluate(() => {
  window.__guardarOrig = Campos.guardarConfigDeTipo;
  Campos.guardarConfigDeTipo = async () => { throw new Error('disco roto'); };
  document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove());
});
await elegirCampo('Fecha de la entrega original', 'crear');
await comprobar('9. con el guardado roto sale un aviso rojo que dice qué ha fallado',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje.malo'), (m) => m.textContent.indexOf('No he podido añadir el campo') === 0)), [true]);
await comprobar('9. y el campo no entra en el tipo', configTipo().then((c) => c.length), 2);
await pagina.evaluate(() => { Campos.guardarConfigDeTipo = window.__guardarOrig; });

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
