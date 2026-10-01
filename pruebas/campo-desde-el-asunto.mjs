/* Prueba en navegador de verdad de la fila 245 de docs/COLA.md
   (docs/CAMPO-DESDE-EL-ASUNTO.md): añadir un campo desde un asunto abierto.

   1. «+ Añadir campo» en «Datos del trámite»: abre el panel de Ajustes.
   2. Elegir un campo, su valor, «¿Dónde se guarda?» («En el tipo …» marcada,
      «Llegará a N … vacío»), aviso verde con «Deshacer».
   3. El campo entra en el tipo, sin «Obligatorio» ni «Añadir al nombre».
   4. El otro asunto del tipo lo tiene, vacío (en «Cambiar el asunto»).
   5. «Solo en este asunto»: marca «solo aquí»; el tipo y el otro asunto no.
   6. «Deshacer»: el tipo vuelve atrás y en este asunto se queda «solo aquí».
   7. «⋮» → «Pasar al tipo» y «Quitar».
   8. Escape en «¿Dónde se guarda?»: no se guarda nada.
   9. Un campo propio nuevo, creado desde el panel, funciona igual.
   10. En el ARCHIVO y en modo consulta no sale «+ Añadir campo».
   Más: sin tipo no se pregunta dónde, y las funciones puras. */
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

/* Abre el panel, va a «Míos» y añade el campo propio `nombre`. */
async function elegirPropio(nombre) {
  await pagina.click('#ficha-campo-anadir');
  await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
  await pagina.click('#campos-catalogo-pestanas [data-pestana="mios"]');
  await pagina.waitForSelector('#campos-mios-lista .fila-tipo');
  await pagina.locator('#campos-mios-lista .fila-tipo', { hasText: nombre }).getByRole('button', { name: 'Añadir' }).click();
  await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
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

/* 1. El botón y el panel. */
await abrirFichaDe('Sola Uno');
await comprobar('1. el bloque «Datos del trámite» sale con solo el botón',
  pagina.evaluate(() => ({ boton: document.getElementById('ficha-campo-anadir').textContent,
    titulo: !!document.querySelector('.ficha-tarjeta[data-tarjeta="tramite"]') })), { boton: '+ Añadir campo', titulo: true });
await pagina.click('#ficha-campo-anadir');
await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
await comprobar('1. sale el mismo panel de Ajustes, con sus tres pestañas',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#campos-catalogo-pestanas .pestana-categoria'),
    (b) => b.dataset.pestana)), ['ficha', 'mios', 'calculados']);
await pagina.click('#campos-catalogo-pestanas [data-pestana="mios"]');
await pagina.waitForSelector('#campos-mios-lista .fila-tipo');
await comprobar('1. los campos propios, sin los que el asunto ya tiene',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#campos-mios-lista .nombre-tipo'), (x) => x.textContent)),
  ['Trimestre', 'Observaciones', 'Extra']);
await pagina.click('#campos-catalogo-volver');
await comprobar('1. «← Volver» cierra el cuadro sin guardar nada',
  pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')), true);

/* 2. Un campo al tipo. */
await elegirPropio('Trimestre');
await pagina.selectOption('#cad-valor', '2º');
await comprobar('2. «En el tipo» marcada y la frase de a cuántos llega, vacío',
  pagina.evaluate(() => ({
    marcada: document.querySelector('input[name="dsg-donde"]:checked').value,
    opcion: document.querySelector('.dsg-opcion span').textContent,
    nota: (document.querySelector('.dsg-nota') || {}).textContent
  })), { marcada: 'guia', opcion: 'En el tipo CONVALIDACION', nota: 'Llegará a 1 asunto abierto de este tipo, vacío.' });
await pagina.press('#cad-valor', 'Enter');
await pagina.waitForTimeout(700);
await comprobar('2. aviso verde con «Deshacer»',
  pagina.evaluate(() => {
    const m = Array.prototype.filter.call(document.querySelectorAll('#mensajes .mensaje'), (x) => x.textContent.indexOf('Campo añadido') === 0)[0];
    return m ? { texto: m.firstChild.textContent, boton: m.querySelector('.mensaje-boton').textContent } : null;
  }), { texto: 'Campo añadido al tipo CONVALIDACION y a 1 asunto abierto.', boton: 'Deshacer' });
await comprobar('2. el campo sale en la ficha con su valor', filasDatos(), ['Trimestre2º']);
await comprobar('2. el valor está en la ficha del asunto, sin ir al nombre',
  fichaDe(ASUNTO_1).then((f) => ({ c: f.campos['propio:p1'], solo: f.solo })), { c: { valor: '2º', enNombre: false }, solo: undefined });

/* 3. Ajustes del tipo. */
await comprobar('3. el tipo lo lleva, al final, sin Obligatorio ni Añadir al nombre', configTipo(),
  [{ origen: 'propio', id: 'p1', obligatorio: false, enNombre: false }]);

/* 4. El otro asunto del tipo lo tiene, vacío. */
await comprobar('4. «Cambiar el asunto» del otro asunto trae el campo, vacío',
  pagina.evaluate((n) => {
    const r = App.pintarCamposEditar('CONVALIDACION', {}, App.E.registro.asuntos[n] || {});
    return r.items.map((i) => ({ nombre: i.nombre, valor: i.valor, solo: i.soloAqui }));
  }, ASUNTO_2), [{ nombre: 'Trimestre', valor: '', solo: false }]);

/* 5. «Solo en este asunto». */
await pagina.waitForTimeout(8500);   /* que caduque el aviso anterior */
await elegirPropio('Observaciones');
await pagina.fill('#cad-valor', 'Falta el sello');
await pagina.click('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
const soloAqui = (nombre) => pagina.evaluate((n) => Array.prototype.map.call(
  Array.prototype.filter.call(document.querySelectorAll('#ficha-datos-tramite .ficha-dato-aqui'), (f) => f.textContent.indexOf(n) !== -1),
  (f) => ({ campo: f.children[0].firstChild.textContent.trim(), marca: f.querySelector('.marca-solo-aqui').textContent,
    valor: f.children[1].firstChild.textContent.trim(), menu: !!f.querySelector('.campo-aqui-menu') })), nombre);
await comprobar('5. sale en la ficha con «solo aquí»', soloAqui('Observaciones'),
  [{ campo: 'Observaciones', marca: 'solo aquí', valor: 'Falta el sello', menu: true }]);
await comprobar('5. el tipo no cambia', configTipo().then((c) => c.map((x) => x.id)), ['p1']);
await comprobar('5. en el otro asunto no está',
  fichaDe(ASUNTO_2).then((f) => f.solo), undefined);
await comprobar('5. aviso: solo a este asunto', avisos().then((a) => a.indexOf('Campo añadido solo a este asunto.') !== -1), true);
await comprobar('5. en «Cambiar el asunto» sale también, sin «Añadir al nombre»',
  pagina.evaluate((n) => {
    const r = App.pintarCamposEditar('CONVALIDACION', App.E.registro.asuntos[n].campos, App.E.registro.asuntos[n]);
    return { items: r.items.map((i) => i.nombre + ':' + i.valor + ':' + i.soloAqui),
      sinCasilla: r.html.indexOf('ed-campo-1-en') === -1, conCasilla: r.html.indexOf('ed-campo-0-en') !== -1 };
  }, ASUNTO_1), { items: ['Trimestre:2º:false', 'Observaciones:Falta el sello:true'], sinCasilla: true, conCasilla: true });

/* 6. «Deshacer». */
await pagina.waitForTimeout(8500);
await elegirPropio('Extra');
await pagina.fill('#cad-valor', 'dato extra');
await pagina.press('#cad-valor', 'Enter');
await pagina.waitForTimeout(700);
await comprobar('6. ahora el tipo lo lleva', configTipo().then((c) => c.map((x) => x.id)), ['p1', 'p3']);
await pagina.click('#mensajes .mensaje-boton');
await pagina.waitForTimeout(800);
await comprobar('6. el tipo vuelve a como estaba', configTipo().then((c) => c.map((x) => x.id)), ['p1']);
await comprobar('6. en este asunto se queda «solo aquí», con su valor',
  fichaDe(ASUNTO_1).then((f) => ({ v: f.campos['propio:p3'].valor, solo: f.solo.map((c) => c.id) })), { v: 'dato extra', solo: ['p2', 'p3'] });
await comprobar('6. aviso de deshecho', avisos().then((a) => a.indexOf('Deshecho: se queda solo en este asunto.') !== -1), true);

/* 7. «⋮» → Pasar al tipo / Quitar. */
await pagina.waitForTimeout(8500);
await pagina.locator('.ficha-dato-aqui', { hasText: 'Observaciones' }).locator('.campo-aqui-menu').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Pasar al tipo' }).click();
await pagina.waitForTimeout(700);
await comprobar('7. «Pasar al tipo»: está en el tipo y pierde la marca',
  Promise.all([configTipo().then((c) => c.map((x) => x.id)),
    pagina.locator('.ficha-dato-aqui', { hasText: 'Observaciones' }).count(),
    fichaDe(ASUNTO_1).then((f) => f.campos['propio:p2'].valor)]), [['p1', 'p2'], 0, 'Falta el sello']);
await pagina.locator('.ficha-dato-aqui', { hasText: 'Extra' }).locator('.campo-aqui-menu').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Quitar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('7. «Quitar» (con confirmación): desaparece de la ficha y su valor también',
  Promise.all([pagina.locator('#ficha-datos-tramite .ficha-dato', { hasText: 'Extra' }).count(),
    fichaDe(ASUNTO_1).then((f) => ({ v: f.campos['propio:p3'], solo: f.solo }))]), [0, { v: undefined, solo: undefined }]);

/* 8. Escape no guarda nada. */
await pagina.waitForTimeout(8500);
await elegirPropio('Extra');
await pagina.fill('#cad-valor', 'no debe guardarse');
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(300);
await comprobar('8. Escape: ni el tipo ni la ficha cambian',
  Promise.all([configTipo().then((c) => c.map((x) => x.id)), fichaDe(ASUNTO_1).then((f) => Object.keys(f.campos)), fichaDe(ASUNTO_1).then((f) => f.solo)]),
  [['p1', 'p2'], ['propio:p1', 'propio:p2'], undefined]);

/* 9. Un campo propio nuevo, desde el panel. */
await pagina.click('#ficha-campo-anadir');
await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
await pagina.click('#campos-catalogo-pestanas [data-pestana="mios"]');
await pagina.click('#campos-mios-crear');
await pagina.fill('#propio-nombre', 'Fecha de entrega');
await pagina.click('#propio-crear');
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await pagina.fill('#cad-valor', 'mañana');
await pagina.click('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(700);
await comprobar('9. el campo nuevo existe y sale «solo aquí»',
  Promise.all([pagina.evaluate(() => App.E.campos.propios.map((p) => p.nombre)), soloAqui('Fecha de entrega')]),
  [['Trimestre', 'Observaciones', 'Extra', 'Fecha de entrega'],
   [{ campo: 'Fecha de entrega', marca: 'solo aquí', valor: 'mañana', menu: true }]]);

/* Sin tipo: no se pregunta dónde, se guarda solo en el asunto. */
await pagina.waitForTimeout(8500);
await pagina.evaluate(() => { window.__tipoDe = DondeSeGuarda.tipoDe; DondeSeGuarda.tipoDe = () => ''; });
await elegirPropio('Extra');
await comprobar('sin tipo: no sale «¿Dónde se guarda?»', pagina.evaluate(() => !document.querySelector('.dsg')), true);
await pagina.fill('#cad-valor', 'sin tipo');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('sin tipo: se guarda solo en el asunto, y el tipo no cambia',
  Promise.all([configTipo().then((c) => c.map((x) => x.id)),
    fichaDe(ASUNTO_1).then((f) => ({ solo: f.solo.map((c) => c.id).indexOf('p3') !== -1, v: f.campos['propio:p3'].valor }))]),
  [['p1', 'p2'], { solo: true, v: 'sin tipo' }]);
await pagina.evaluate(() => { DondeSeGuarda.tipoDe = window.__tipoDe; });

/* 10. El ARCHIVO y el modo consulta. */
await comprobar('10. en el ARCHIVO no sale «+ Añadir campo»',
  pagina.evaluate((n) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
    App.abrirFicha(a, 'archivado');
    return new Promise((r) => setTimeout(() => r(!document.getElementById('ficha-campo-anadir')), 500));
  }, ASUNTO_1), true);
await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, ASUNTO_1);
await pagina.waitForSelector('#ficha-campo-anadir');
await pagina.evaluate(() => { FichaNucleo.ocupacionActual = { usuario: 'Compañero' }; FichaNucleo.pintar(); });
await pagina.waitForTimeout(400);
await comprobar('10. en modo consulta el botón y los «⋮» no se ven',
  pagina.evaluate(() => ({
    boton: getComputedStyle(document.getElementById('ficha-campo-anadir').closest('.ficha-dato')).display,
    menu: Array.prototype.every.call(document.querySelectorAll('.campo-aqui-menu'), (b) => getComputedStyle(b.closest('.ficha-menu-envoltorio') || b).display === 'none' || getComputedStyle(b).display === 'none')
  })), { boton: 'none', menu: true });

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
