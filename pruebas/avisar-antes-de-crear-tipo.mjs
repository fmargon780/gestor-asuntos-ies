/* Prueba en navegador de la fila 279 de docs/COLA.md (docs/AVISAR-ANTES-DE-CREAR-UN-TIPO-REPETIDO.md):
   el cuadro común «¿Es otro tipo de verdad?» al crear un tipo de asunto o cambiarle el nombre, «Ya hay un tipo
   «Y»» con «Unir con él», las puertas calladas (biblioteca, papelera, ficha) y el punto 5 (dos ventanas: un
   nombre antiguo no vuelve). Disco de mentira; nombres inventados. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const TIPOS = [
  { tipo: 'ZZ TIPO DOS', categoria: 'ALUMNADO', alias: ['ZZ VIEJO'], nombreCorto: 'ZZ DOS' },
  { tipo: 'ZZ UNO SUELTO', categoria: 'ALUMNADO' },
  { tipo: 'ZZ OTRO SUELTO', categoria: 'ALUMNADO' },
  { tipo: 'YY BIBLIO', categoria: 'ALUMNADO', alias: ['YY ANTIGUO'] },
  { tipo: 'QQ PLAZO', categoria: 'ALUMNADO' }
];

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (tipos) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('tipos.json', { create: true }); const w = await h.createWritable(); await w.write(JSON.stringify(tipos)); await w.close();
}, TIPOS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
/* Que la pasada de la fila 277 no se meta por medio. */
await pagina.evaluate(() => { TiposParecidos._pasada = async () => 0; window.__avisos = []; const o = U.aviso; U.aviso = function (m, t) { window.__avisos.push(String(m) + '|' + t); return o.apply(this, arguments); }; });

const t = (n) => pagina.evaluate((x) => App.E.tipos.filter((y) => y.tipo === x).length, n);
const alias = (n) => pagina.evaluate((x) => { const y = App.E.tipos.filter((z) => z.tipo === x)[0]; return y ? (y.alias || []) : null; }, n);
const dialogo = async () => { await pagina.waitForSelector('#capa:not(.oculto)'); return { titulo: await pagina.locator('#cuadro-titulo').textContent(), cuerpo: await pagina.locator('#cuadro-cuerpo').textContent(), boton: await pagina.locator('#cuadro-aceptar').textContent() }; };
const distintos = () => pagina.evaluate(async () => JSON.stringify(await Carpetas.leerJson(App.E.gestor, 'tipos-distintos.json')));

console.log('--- 1. la pregunta común ---');
await comprobar('1. nombre antiguo', pagina.evaluate(() => TiposParecidos.paraNombreNuevo('zz viejo').map((x) => [x.tipo.tipo, x.motivo])), [['ZZ TIPO DOS', 'antiguo']]);
await comprobar('1. nombre corto cuenta como igual', pagina.evaluate(() => TiposParecidos.paraNombreNuevo('ZZ DOS').map((x) => [x.tipo.tipo, x.motivo, x.corto])), [['ZZ TIPO DOS', 'igual', true]]);
await comprobar('1. parecido', pagina.evaluate(() => TiposParecidos.paraNombreNuevo('ZZ TIPO DOS BIS').map((x) => [x.tipo.tipo, x.motivo])), [['ZZ TIPO DOS', 'parecido']]);
await comprobar('1. nada que ver', pagina.evaluate(() => TiposParecidos.paraNombreNuevo('QQ WWW XYZ').length), 0);
await comprobar('1. sus propios nombres antiguos no cuentan', pagina.evaluate(() => TiposParecidos.paraNombreNuevo('ZZ VIEJO', App.E.tipos.filter((x) => x.tipo === 'ZZ TIPO DOS')[0]).length), 0);

console.log('--- 2. crear con un nombre antiguo: un solo cuadro, crear de todas formas ---');
await pagina.evaluate(() => { App.crearTipoDesdeCaja('ZZ VIEJO'); });
let d = await dialogo();
await comprobar('2. título', d.titulo, '¿Es otro tipo de verdad?');
await comprobar('2. línea del nombre antiguo', d.cuerpo.indexOf('«ZZ VIEJO» es como se llamaba antes «ZZ TIPO DOS».') !== -1, true);
await comprobar('2. nota de las carpetas del archivo', d.cuerpo.indexOf('las carpetas del archivo que se llaman «ZZ VIEJO»') !== -1, true);
await comprobar('2. botón «Crear de todas formas» y botón «Verlo» en la fila', [d.boton, await pagina.locator('#cuadro-cuerpo li button').first().textContent()], ['Crear de todas formas', 'Verlo']);
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#bc-categoria');
await comprobar('2. después, solo la categoría (no otro cuadro de parecidos)', pagina.locator('#cuadro-titulo').textContent(), '¿En qué categoría?');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('2. se crea «ZZ VIEJO»', t('ZZ VIEJO'), 1);
await comprobar('2. sale del alias de «ZZ TIPO DOS»', alias('ZZ TIPO DOS'), []);
await comprobar('2. la pareja queda como «No son el mismo»', (await distintos()).indexOf('zz tipo dos') !== -1 && (await distintos()).indexOf('zz viejo') !== -1, true);
await comprobar('2. y está guardado en el disco', pagina.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'tipos.json')).filter((x) => x.tipo === 'ZZ TIPO DOS')[0].alias || []), []);

console.log('--- 3. igual (nombre corto): no se puede crear ---');
await pagina.evaluate(() => { App.crearTipoDesdeCaja('ZZ DOS'); });
await pagina.waitForTimeout(300);
await comprobar('3. sin cuadro', pagina.locator('#capa:not(.oculto)').count(), 0);
await comprobar('3. aviso rojo «Ya existe»', pagina.evaluate(() => window.__avisos.some((a) => /Ese tipo ya existe: ZZ TIPO DOS\.\|malo/.test(a))), true);
await comprobar('3. no se crea', t('ZZ DOS'), 0);

console.log('--- 4. «+ Crear tipo nuevo» de Nuevo asunto: aviso en vivo con «Usar este» ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#btn-crear-tipo-al-vuelo');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.evaluate(() => { App.E.tipos.filter((x) => x.tipo === 'YY BIBLIO')[0]; });
await pagina.fill('#tipo-al-vuelo-nombre', 'YY ANTIGUO');
await comprobar('4. aviso ámbar con la frase y «Usar este»', pagina.evaluate(() => { const a = document.getElementById('tipo-al-vuelo-aviso'); return [a.className.indexOf('ambar') !== -1, a.textContent.indexOf('YY ANTIGUO es como se llamaba antes YY BIBLIO.') !== -1, !!a.querySelector('[data-usar]')]; }), [true, true, true]);
await pagina.click('#tipo-al-vuelo-crear');
d = await dialogo();
await comprobar('4. al crear, el cuadro común con «Usar este»', [d.titulo, await pagina.locator('#cuadro-cuerpo li button').first().textContent()], ['¿Es otro tipo de verdad?', 'Usar este']);
await pagina.click('#cuadro-cuerpo li button');
await pagina.waitForSelector('#capa.oculto', { state: 'attached' });
await pagina.waitForTimeout(300);
await comprobar('4. «Usar este» deja elegido «YY BIBLIO» y no crea nada', pagina.evaluate(() => [App.E.nuevo.tipo, App.E.tipos.some((x) => x.tipo === 'YY ANTIGUO')]), ['YY BIBLIO', false]);

console.log('--- 5. «Cambiar el nombre» a uno que existe: unir ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => { App.renombrarTipo(App.E.tipos.filter((x) => x.tipo === 'ZZ UNO SUELTO')[0]); });
await dialogo();
await pagina.fill('#tipo-nuevo-nombre', 'zz otro suelto');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
d = await dialogo();
await comprobar('5. «Ya hay un tipo «ZZ OTRO SUELTO»»', [d.titulo, d.boton], ['Ya hay un tipo «ZZ OTRO SUELTO»', 'Unir con él']);
await comprobar('5. el resumen: desaparece, pasa, el ARCHIVO no se toca', d.cuerpo.indexOf('«ZZ UNO SUELTO» desaparece y todo pasa a «ZZ OTRO SUELTO»') !== -1 && d.cuerpo.indexOf('El ARCHIVO no se toca') !== -1, true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('5. unidos: «ZZ UNO SUELTO» ya no existe', [await t('ZZ UNO SUELTO'), await t('ZZ OTRO SUELTO')], [0, 1]);
await comprobar('5. aviso verde «Unidos.»', pagina.evaluate(() => window.__avisos.some((a) => /^Unidos\..*\|bueno$/.test(a))), true);

console.log('--- 6. «Cambiar el nombre» a un nombre antiguo de otro: cuadro común ---');
await pagina.evaluate(() => { App.renombrarTipo(App.E.tipos.filter((x) => x.tipo === 'ZZ OTRO SUELTO')[0]); });
await dialogo();
await pagina.fill('#tipo-nuevo-nombre', 'YY ANTIGUO');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
d = await dialogo();
await comprobar('6. título, botón de seguir y «Unir con él» en la fila', [d.titulo, d.boton, await pagina.locator('#cuadro-cuerpo li button').first().textContent()],
  ['¿Es otro tipo de verdad?', 'Cambiar el nombre de todas formas', 'Unir con él']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(300);
await comprobar('6. con «Cancelar» sigue llamándose igual', [await t('ZZ OTRO SUELTO'), await t('YY ANTIGUO')], [1, 0]);
await pagina.evaluate(() => { App.renombrarTipo(App.E.tipos.filter((x) => x.tipo === 'ZZ OTRO SUELTO')[0]); });
await dialogo();
await pagina.fill('#tipo-nuevo-nombre', 'YY ANTIGUO');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await dialogo();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('6. de todas formas: renombrado y sale del alias de «YY BIBLIO»', [await t('YY ANTIGUO'), await alias('YY BIBLIO'), await alias('YY ANTIGUO')], [1, [], ['ZZ UNO SUELTO', 'ZZ OTRO SUELTO']]);
await comprobar('6. pareja apuntada', (await distintos()).indexOf('yy biblio') !== -1, true);

console.log('--- 7. nada que ver: sin cuadro de parecidos ---');
await pagina.evaluate(() => { App.crearTipoDesdeCaja('ZZ QQ XYZ'); });
await pagina.waitForSelector('#bc-categoria');
await comprobar('7. solo pregunta la categoría', pagina.locator('#cuadro-titulo').textContent(), '¿En qué categoría?');
await pagina.click('#cuadro-cancelar');

console.log('--- 8. biblioteca del centro: un nombre antiguo es ese tipo ---');
await pagina.evaluate(async () => {
  App.E.tipos.push({ tipo: 'XX FINAL', categoria: 'ALUMNADO', alias: ['XX ANTES'] });
  /* Una sola carga: los datos se guardan la primera vez que se leen. */
  App.leerFicheroDeLaApp = async () => ({ tipos: [{ nombreLargo: 'XX ANTES', nombreCorto: '', categoria: 'ALUMNADO', nuevo: true }, { nombreLargo: 'XX DE CONTROL', nombreCorto: '', categoria: 'ALUMNADO', nuevo: true }],
    camposPorTipo: {}, modelos: [], guias: {}, guiasPorTipo: {} });
  try { await CargarBiblioteca.cargar(); } catch (e) { /* lo de después de los tipos no importa aquí */ }
});
await comprobar('8. no se crea «XX ANTES» (y el de control sí: la carga ha corrido)', [await t('XX ANTES'), await t('XX DE CONTROL')], [0, 1]);

console.log('--- 9. papelera: devolver un tipo que es nombre antiguo de otro ---');
await pagina.evaluate(() => { window.__devuelto = null; Papelera.devolver({ clase: 'tipo', nombre: 'XX ANTES', id: 'x1', datos: { tipo: { tipo: 'XX ANTES', categoria: 'ALUMNADO' } } }).then((r) => { window.__devuelto = r; }); });
d = await dialogo();
await comprobar('9. cuadro con la frase y «Devolverlo de todas formas»', [d.cuerpo.indexOf('Ya hay un tipo «XX FINAL» (antes se llamó «XX ANTES»). Si devuelves «XX ANTES», habrá dos.') !== -1, d.boton], [true, 'Devolverlo de todas formas']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(300);
await comprobar('9. cancelar no lo devuelve', [await t('XX ANTES'), await pagina.evaluate(() => window.__devuelto && window.__devuelto.ok)], [0, false]);
await pagina.evaluate(() => { Papelera.devolver({ clase: 'tipo', nombre: 'XX ANTES', id: 'x1', datos: { tipo: { tipo: 'XX ANTES', categoria: 'ALUMNADO' } } }); });
await dialogo();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('9. de todas formas lo devuelve y sale del alias', [await t('XX ANTES'), await alias('XX FINAL')], [1, []]);

console.log('--- 10. ficha: «Añadir X a la lista» con el cuadro común ---');
await pagina.evaluate(() => {
  App.E.tipos.push({ tipo: 'WW FINAL', categoria: 'ALUMNADO', alias: ['WW ANTES'] });
  const caja = document.createElement('div'); caja.id = 'ficha-aviso-tipo'; document.body.appendChild(caja);
  FichaNucleo.pintarAvisoDeTipo({ leido: { reconocido: false }, ficha: { categoria: 'ALUMNADO' } }, 'WW ANTES');
});
await pagina.click('#ficha-aviso-tipo .alta-tipo button');
d = await dialogo();
await comprobar('10. cuadro común con «Verlo»', [d.titulo, await pagina.locator('#cuadro-cuerpo li button').first().textContent()], ['¿Es otro tipo de verdad?', 'Verlo']);
await pagina.click('#cuadro-cancelar');

console.log('--- 11. punto 5: dos ventanas, el nombre antiguo no vuelve ---');
/* La «segunda ventana» es una copia de la lista tal como estaba antes de cambiar el nombre. */
await pagina.evaluate(async () => {
  window.__vieja = JSON.parse(JSON.stringify(App.E.tipos));
  const T = App.E.tipos.filter((x) => x.tipo === 'QQ PLAZO')[0];
  App.renombrarTipo(T);
});
await dialogo();
await pagina.fill('#tipo-nuevo-nombre', 'QQ PLAZO DOS');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await pagina.evaluate(async () => {
  App.E.tipos = window.__vieja;   /* la otra ventana, sin recargar, aún con «QQ PLAZO» */
  App.E.tipos.filter((x) => x.tipo === 'ZZ TIPO DOS')[0].plazo = 5;
  await App.guardarTipos();
});
await comprobar('11. al releer del disco, «QQ PLAZO» no está y «QQ PLAZO DOS» dice «antes: QQ PLAZO»',
  pagina.evaluate(async () => { const l = await Carpetas.leerJson(App.E.gestor, 'tipos.json'); const n = l.filter((x) => x.tipo === 'QQ PLAZO DOS')[0]; return [l.some((x) => x.tipo === 'QQ PLAZO'), n ? n.alias : null]; }), [false, ['QQ PLAZO']]);
/* Lo mismo con unir. */
await pagina.evaluate(async () => {
  App.E.tipos.push({ tipo: 'RR UNO', categoria: 'ALUMNADO' }, { tipo: 'RR DOS', categoria: 'ALUMNADO' });
  await App.guardarTipos();
  window.__vieja = JSON.parse(JSON.stringify(App.E.tipos));
  const r = await TiposUnir.unir(App.E.tipos.filter((x) => x.tipo === 'RR UNO')[0], App.E.tipos.filter((x) => x.tipo === 'RR DOS')[0]);
  App.E.tipos = window.__vieja;
  await App.guardarTipos();
});
await comprobar('11. unido: «RR UNO» no vuelve', pagina.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'tipos.json')).some((x) => x.tipo === 'RR UNO')), false);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? fallos + ' fallos' : 'todo bien');
process.exit(fallos ? 1 : 0);
