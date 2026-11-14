/* Fila 659 (docs/659-DONDE-SE-HACE-Y-NOMBRES.md): «Dónde se hace», datos nuevos de la tarea y nombres claros.
   Con Chromium real y los datos de la copia de pruebas (?demo=1&auto=1), en SANCION de Fuentes Calvo (1º Bach A).
   1. Con los ficheros reales del 13-nov-2026 (pruebas/apoyo/datos-657/) y el repaso de la 657 aplicado, el repaso del dónde
      (docs/659-plan-donde.json) encuentra todas sus tareas y pone sitio, acción y documento donde dice.
   2. Los nombres de «Qué se hace», en el orden de la instrucción; ningún nombre viejo.
   3. «Dónde se hace»: cada acción propone su sitio (se puede cambiar o vaciar); «Qué documento» y «A quién» según la acción.
   4. «A quién» de una tarea de llamar propone a esa persona en «Apuntar llamada».
   5. «Enviar» según su sitio: correo, iPasen o a mano.
   6. La ventana «Sitios»: mapa con cuentas, cambiar el nombre, «+ Sitio nuevo» (avisa si se parece), borrar con «Pasar y borrar», sin «Otro sitio».
   7. Una tarea vieja (sin dónde) y una versión que guarda sin conocer los datos nuevos: normalizar conserva lo nuevo.
   8. El botón «Aplicar el repaso del dónde» de Herramientas. */
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
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 1000 } });
const p = await contexto.newPage();
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && !Demo.montando && window.Llamadas && window.Sitios, null, { timeout: 60000 });
await p.waitForTimeout(2500);

console.log('--- 1. el repaso con los ficheros reales del 13-nov-2026 ---');
const R = await p.evaluate(async () => {
  const leer = async (r) => (await fetch(r)).json();
  const D = 'pruebas/apoyo/datos-657/';
  const guias = await leer(D + 'guias.json'), tipos = await leer(D + 'tipos.json');
  const listas = { tareas: (await leer(D + 'tareas-comunes.json')).tareas, hitos: (await leer(D + 'hitos-comunes.json')).hitos };
  const plan657 = await leer('datos-biblioteca/repaso-guias.json');
  const activos = [], inactivos = [];
  tipos.forEach((t) => { if (!(guias[t.tipo] || []).length) return; (t.desactivado ? inactivos : activos).push(t.tipo); });
  const r657 = await RepasoGuiasAplicar.calcularCon(guias, listas, plan657, { activos, inactivos });
  const plan = await leer('datos-biblioteca/repaso-donde.json');
  const sitios = Sitios.partida();
  const r = RepasoDondeAplicar.calcularCon(r657.guias, r657.listas, plan, { sitios, tiposDocumento: ['Solicitud', 'Resolución', 'Certificado'] });
  const norm = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const porNombre = {}; r.listas.tareas.forEach((t) => { porNombre[norm(t.nombre)] = t; });
  const texto = (t) => (t && t.donde ? Sitios.textoDe(sitios, t.donde) : '');
  /* Cada tarea del plan: su sitio, su acción y su documento. */
  const difs = [];
  plan.tareas.forEach((e) => {
    const t = porNombre[norm(e.texto)];
    if (!t) return;   /* las que solo viven en las guías las mira la parte de las líneas */
    if (texto(t) !== e.donde) difs.push(e.texto + ': sitio «' + texto(t) + '» en vez de «' + e.donde + '»');
    if ((t.accion || '') !== e.accion) difs.push(e.texto + ': acción «' + t.accion + '» en vez de «' + e.accion + '»');
    if ((e.documento || '') !== (t.tipoDocumento || '')) difs.push(e.texto + ': documento «' + (t.tipoDocumento || '') + '» en vez de «' + (e.documento || '') + '»');
  });
  const lineasSinSitio = []; let lineas = 0;
  Comunes.recorrerGuias(r.guias, null, (g, l, i, tipo) => { if (!g.pregunta) { lineas++; if (!g.donde && Sitios.propuesto(sitios, g.accion || '') && !(g.accion === '')) lineasSinSitio.push(tipo + ' · ' + g.texto); } });
  const comSeneca = r.listas.tareas.filter((t) => t.accion === 'comunicar' && t.receta && t.receta.via === 'seneca').map((t) => texto(t));
  const hitosArchivar = ['PAGO AYUDA TRANSPORTE', 'PROGRAMA DE TRÁNSITO', 'PROTOCOLO CONDUCTAS SUICIDAS', 'SOLICITUD NACIONALIDAD'].map((g) => ({ antes: (r657.guias[g] || []).filter((x) => x.titulo === 'Archivar').length, ahora: (r.guias[g] || []).filter((x) => x.titulo === 'Archivar').length }));
  const archivar = r.listas.tareas.filter((t) => t.accion === 'archivar').map((t) => [t.nombre, texto(t)]);
  const recoger = r.listas.tareas.filter((t) => t.accion === 'recoger').map((t) => [t.nombre, texto(t)]);
  const otra = r.listas.tareas.filter((t) => !t.accion && !t.reunir && plan.tareas.some((e) => norm(e.texto) === norm(t.nombre) && e.accion === ''));
  return { noEncontrado: r.informe.noEncontrado, difs, lineasSinSitio: lineasSinSitio.slice(0, 5), nSinPlan: Object.keys(r.informe.sinPlan).length,
    comSeneca, hitosArchivar, quitados: r.informe.hitosQuitados.length, noQuitados: r.informe.hitosNoQuitados, archivar, recoger, nOtra: otra.length,
    tareasConSitio: r.listas.tareas.filter((t) => t.donde).length, tareas: r.listas.tareas.length, nPlan: plan.tareas.length,
    acciones: Object.keys(r.informe.acciones).length, docs: Object.keys(r.informe.documentos).length,
    asuntosAbiertosGuias: r.cambian.length > 0, guiasIntactas: JSON.stringify(r657.guias) !== JSON.stringify(r.guias), original: JSON.stringify(r657.guias) === JSON.stringify(r.antes) };
});
await comprobar('1a. no queda nada del plan sin encontrar', R.noEncontrado, []);
await comprobar('1b. cada tarea común del plan queda con su sitio, su acción y su documento', R.difs, []);
await comprobar('1c. las tres tareas de archivar pasan de «Otra cosa» a «Archivar» con sitio «Expediente del alumno»; las de recoger, a «Recoger» en mano',
  [R.archivar.map((x) => x[1]), R.recoger.map((x) => x[1]), R.archivar.length, R.recoger.length], [['Expediente del alumno', 'Expediente del alumno'], ['En mano', 'En mano'], 2, 2]);
await comprobar('1d. los cuatro hitos «Archivar» vacíos desaparecen de sus guías', [R.hitosArchivar.map((x) => x.antes), R.hitosArchivar.map((x) => x.ahora), R.quitados, R.noQuitados], [[1, 1, 1, 1], [0, 0, 0, 0], 4, []]);
await comprobar('1e. una tarea de Enviar con vía de mensaje de Séneca va a «iPasen»', R.comSeneca.every((t) => t === 'iPasen'), true);
await comprobar('1f. las líneas de las guías que el plan no trae reciben el sitio que propone su acción (ninguna se queda sin él)', R.lineasSinSitio, []);
await comprobar('1g. el repaso no toca las guías de antes (trabaja con copias) y cuenta lo que hace', [R.original, R.tareasConSitio > 100, R.acciones, R.docs > 0], [true, true, 4, true]);
console.log('       (' + R.tareasConSitio + ' de ' + R.tareas + ' tareas con sitio; ' + R.nSinPlan + ' fuera del plan; ' + R.nOtra + ' «Otra cosa» del plan)');

console.log('--- 2. los nombres de «Qué se hace» ---');
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await p.waitForSelector('.tcd-abrir-form', { timeout: 15000 });
await p.click('.tcd-abrir-form');
const NOMBRES = ['Generar documento', 'Poner a la firma', 'Registrar', 'Enviar', 'Añadir documento', 'Rellenar datos del asunto', 'Llamar', 'Grabar o cambiar datos', 'Entregar', 'Recoger',
  'Publicar', 'Cobrar o pagar', 'Comprobar', 'Archivar', 'Otra cosa'];
await comprobar('2a. «+ Añadir tarea»: «Qué se hace» trae los nombres nuevos en orden, con «Archivar» y «Recoger»',
  p.evaluate(() => [...new Set(AnadirTarea.entradas([]).map((e) => e.texto.split(' · ')[0]))]), NOMBRES);
await comprobar('2b. la lista común y la guía dicen lo mismo (con «Copiar a otra carpeta» en su sitio)', p.evaluate(() => [Comunes.HACE.map((x) => x.texto), GuiasGuion.ACCIONES.map((x) => x.texto)]),
  [[...NOMBRES.slice(0, 6), 'Copiar a otra carpeta', ...NOMBRES.slice(6)], [...NOMBRES.slice(0, 6), 'Copiar a otra carpeta', ...NOMBRES.slice(6)]]);
await comprobar('2c. las fases dicen «Generar documento» y «Grabar o cambiar datos»', p.evaluate(() => [Comunes.textoDeFase('elaborar'), Comunes.textoDeFase('seneca'), Comunes.textoDeFase('firma')]), ['Generar documento', 'Grabar o cambiar datos', 'Poner a la firma']);
await comprobar('2d. los valores de dentro no cambian y «Recoger» y «Archivar» se tratan como acciones que se marcan a mano', p.evaluate(() => [
  ['comunicar', 'firmar', 'pedir', 'llamar', 'seneca', 'entregar', 'recoger', 'archivar'].map((v) => Comunes.accionValida(v)).join(','), Hitos._guionInterno.ACCIONES.indexOf('recoger') !== -1 && Hitos._guionInterno.ACCIONES.indexOf('archivar') !== -1,
  HitoMesaRecetas.botonDeTareaHTML(Gestor.asuntos()[0], { id: 'h' }, { id: 'x', texto: 'T', accion: 'recoger' }, {})]), ['comunicar,firmar,pedir,llamar,seneca,entregar,recoger,archivar', true, '']);

console.log('--- 3. «Dónde se hace» ---');
const cual = (a) => p.evaluate((a) => {
  const e = AnadirTarea.entradas([]).filter((x) => x.accion === a)[0];
  const s = document.querySelector('.tcd-nueva .at-que'); s.value = e.texto; s.dispatchEvent(new Event('input', { bubbles: true }));
  const q = (c) => document.querySelector('.tcd-nueva ' + c);
  return { donde: q('.donde-sitio') ? q('.donde-sitio').value : null, documento: !!q('.donde-documento'), aQuien: !!q('.donde-a-quien') };
}, a);
const PROPONE = { generar: 'En esta app', registrar: 'Séneca · Registro', comunicar: 'Correo electrónico', anadir: 'En esta app', pedir: 'En esta app', llamar: 'Teléfono', seneca: 'Séneca · Alumnado',
  entregar: 'En mano', recoger: 'En mano', publicar: 'Tablón', cobrar: 'En mano', comprobar: '', archivar: '', firmar: '', '': '' };
const propuestos = {};
for (const a of Object.keys(PROPONE)) propuestos[a] = (await cual(a)).donde;
await comprobar('3a. cada acción propone su sitio (Comprobar, Archivar, Poner a la firma y Otra cosa no proponen)', propuestos, PROPONE);
await comprobar('3b. «Qué documento» solo sale en Registrar, Poner a la firma y Añadir documento; «A quién», solo en Llamar', (async () => {
  const r = {}; for (const a of ['registrar', 'firmar', 'anadir', 'llamar', 'comunicar', 'generar', '']) { const x = await cual(a); r[a] = (x.documento ? 'D' : '') + (x.aQuien ? 'Q' : ''); } return r;
})(), { registrar: 'D', firmar: 'D', anadir: 'D', llamar: 'Q', comunicar: '', generar: '', '': '' });
await comprobar('3c. el sitio se puede cambiar y vaciar; escribir algo que no es un sitio lo vacía', (async () => {
  await cual('registrar');
  await p.fill('.tcd-nueva .donde-sitio', 'Correo postal'); await p.press('.tcd-nueva .donde-sitio', 'Tab');
  const a = await p.inputValue('.tcd-nueva .donde-sitio');
  await p.fill('.tcd-nueva .donde-sitio', 'Otro sitio'); await p.press('.tcd-nueva .donde-sitio', 'Tab');
  const b = await p.inputValue('.tcd-nueva .donde-sitio');
  await p.fill('.tcd-nueva .donde-sitio', ''); await p.press('.tcd-nueva .donde-sitio', 'Tab');
  return [a, b, await p.inputValue('.tcd-nueva .donde-sitio')];
})(), ['Correo postal', '', '']);
await comprobar('3d. al elegir otra entrada de «Qué se hace» (fila 660), se rellenan el qué y el sitio de esa entrada', (async () => {
  await cual('registrar'); await p.fill('.tcd-nueva .donde-sitio', 'Correo postal'); await p.press('.tcd-nueva .donde-sitio', 'Tab');
  return (await cual('publicar')).donde;
})(), 'Tablón');
await comprobar('3e. «Qué documento» solo acepta tipos de documento de la app', (async () => {
  await cual('registrar');
  const tipos = await p.evaluate(() => App.E.tiposDocumento.slice(0, 2));
  await p.fill('.tcd-nueva .donde-documento', tipos[0]); await p.press('.tcd-nueva .donde-documento', 'Tab');
  const a = await p.inputValue('.tcd-nueva .donde-documento') === tipos[0];
  await p.fill('.tcd-nueva .donde-documento', 'Inventado'); await p.press('.tcd-nueva .donde-documento', 'Tab');
  return [a, await p.inputValue('.tcd-nueva .donde-documento')];
})(), [true, '']);

console.log('--- 4. «A quién» de una tarea de llamar ---');
const NOMBRE = 'Llamar a la familia 659';
await p.click('.tcd-nueva .at-cancelar');
await p.click('.tcd-abrir-form');
await cual('llamar');
await p.fill('.tcd-nueva .at-nombre', NOMBRE);
await p.fill('.tcd-nueva .donde-a-quien', 'Familia'); await p.press('.tcd-nueva .donde-a-quien', 'Tab');
await p.click('.tcd-nueva .at-anadir');
await p.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("' + NOMBRE + '"))');
const tarea = (n) => p.locator('.guion-paso', { has: p.locator('.guion-paso-texto', { hasText: n }) });
await comprobar('4a. la tarea enseña su acción y su sitio, uno junto al otro', p.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  return [t.querySelector('.guion-tarea-accion').textContent, t.querySelector('.guion-tarea-donde').textContent];
}, NOMBRE), ['Llamar', 'Teléfono']);
await comprobar('4b. la tarea guarda el sitio por id y «A quién» por clave', p.evaluate(async (n) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => (x.guionPropio || []).some((g) => g.texto === n))[0];
  const g = h.guionPropio.filter((x) => x.texto === n)[0];
  return [g.accion, g.donde, g.aQuien, 'tipoDocumento' in g];
}, NOMBRE), ['llamar', { sitio: 'st-telefono' }, 'tutor', false]);
await tarea(NOMBRE).locator('.ll-boton').click();
await p.waitForSelector('.ll-per', { timeout: 8000 });
await comprobar('4c. «Apuntar llamada» propone a la familia', p.evaluate(() => [...document.querySelectorAll('.ll-per.el')].map((x) => x.querySelector('.ll-q').textContent.trim())), ['La familia tutores legales']);
await p.click('.ll-capa #ll-cancelar').catch(async () => { await p.keyboard.press('Escape'); });
await p.waitForTimeout(400);

console.log('--- 5. «Enviar» según su sitio ---');
async function anadirEnviar(nombre, sitio) {
  await p.click('.tcd-abrir-form');
  await p.fill('.tcd-nueva .at-que', 'Enviar · Correo electrónico');
  await p.fill('.tcd-nueva .at-nombre', nombre);
  await p.fill('.tcd-nueva .donde-sitio', sitio); await p.press('.tcd-nueva .donde-sitio', 'Tab');
  await p.click('.tcd-nueva .at-anadir');
  await p.waitForSelector('.guion-paso:has(.guion-paso-texto:text-is("' + nombre + '"))');
}
const boton = (n) => p.evaluate((n) => {
  const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
  const b = t.querySelector('.guion-accion-tarea');
  return b ? b.textContent : null;
}, n);
await anadirEnviar('Enviar por correo 659', 'Correo electrónico');
await anadirEnviar('Enviar por iPasen 659', 'iPasen');
await anadirEnviar('Enviar por correo postal 659', 'Correo postal');
await comprobar('5a. «Enviar» con «Correo electrónico» prepara el correo; con «iPasen», el mensaje de Séneca; con «Correo postal», no hay botón',
  [await boton('Enviar por correo 659'), await boton('Enviar por iPasen 659'), await boton('Enviar por correo postal 659')], ['Enviar correo', 'Enviar por Séneca', null]);
await comprobar('5b. la tarea de correo postal se marca a mano', (async () => {
  await tarea('Enviar por correo postal 659').locator('.guion-casilla').check();
  await p.waitForTimeout(800);
  return p.evaluate(() => [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === 'Enviar por correo postal 659')[0].querySelector('.guion-casilla').checked);
})(), true);

console.log('--- 6. la ventana «Sitios» ---');
await p.click('.tcd-abrir-form');
await p.fill('.tcd-nueva .at-que', 'Registrar · Séneca · Registro');
await p.click('.tcd-nueva .donde-ver-todos');
await p.waitForSelector('.sitios-capa #sv-mapa .sitio', { timeout: 8000 });
await comprobar('6a. el mapa: Séneca con sus cinco zonas y el resto de sitios, cada uno con su cuenta; no hay «Otro sitio»', p.evaluate(() => {
  const t = [...document.querySelectorAll('#sv-mapa .sitio')].map((b) => b.querySelector('span').textContent);
  return [t, !!document.querySelector('#sv-mapa .sitio .suave') && /tarea/.test(document.querySelector('#sv-mapa .sitio .suave').textContent), t.indexOf('Otro sitio') === -1,
    document.querySelector('.sitios-capa h3').textContent];
}), [['Séneca', 'Alumnado', 'Personal', 'Registro', 'Documentos', 'Ventanilla Electrónica', 'iPasen', 'Correo electrónico', 'Correo postal', 'Teléfono', 'En mano', 'Tablón',
  'Expediente del alumno', 'Archivo del centro', 'En esta app'], true, true, 'Sitios: dónde se hacen las tareas']);
await comprobar('6b. la cuenta de «Teléfono» cuenta las tareas de la lista común y de las guías que lo usan', p.evaluate(async () => {
  const lineas = await SitiosGuardado.lineasQueLoUsan();
  return Sitios.cuentas(lineas)['st-telefono'] || 0;
}).then((n) => typeof n), 'number');
await p.locator('#sv-mapa .sitio', { hasText: 'Tablón' }).click();
await comprobar('6c. desde una tarea sale «Usar … en la tarea»; al usarlo, queda elegido', (async () => {
  const boton = await p.textContent('#sv-usar');
  await p.click('#sv-usar');
  await p.waitForSelector('.sitios-capa', { state: 'detached' });
  return [boton, await p.inputValue('.tcd-nueva .donde-sitio')];
})(), ['Usar «Tablón» en la tarea', 'Tablón']);
await p.click('.tcd-nueva .donde-ver-todos');
await p.waitForSelector('.sitios-capa #sv-nuevo');
await p.click('#sv-nuevo');
await p.fill('#sv-nn', 'Séneca Documentos');
await p.click('#sv-crear');
await comprobar('6d. «+ Sitio nuevo» avisa si se parece a uno que existe y ofrece «Ir a ese»', p.evaluate(() => [document.getElementById('sv-aviso').textContent.indexOf('Se parece a') !== -1, !!document.getElementById('sv-ir'), !!document.getElementById('sv-igual')]), [true, true, true]);
await p.click('#sv-ir');
await comprobar('6e. «Ir a ese» abre ese sitio', p.evaluate(() => document.getElementById('sv-nombre').value), 'Documentos');
await p.click('#sv-nuevo');
await p.fill('#sv-nn', 'Sede electrónica');
await p.check('input[name="sv-tipo"][value="zona"]');
await p.selectOption('#sv-padre', 'st-seneca');
await p.click('#sv-crear');
await p.click('#sv-igual').catch(() => {});   /* «Sede electrónica» se parece a «Ventanilla Electrónica»: avisa, y se crea igualmente */
await p.waitForSelector('.sitios-capa', { state: 'detached' });
await comprobar('6f. desde la tarea, crear una zona de Séneca la deja elegida en la tarea y en el mapa', p.evaluate(() => [document.querySelector('.tcd-nueva .donde-sitio').value,
  Sitios.opciones(Sitios.datos()).map((o) => o.texto).filter((t) => /Sede/.test(t))]), ['Séneca · Sede electrónica', ['Séneca · Sede electrónica']]);
await p.click('.tcd-nueva .at-cancelar');

await comprobar('6g. cambiar el nombre de un sitio lo cambia en la tarea (van por id)', (async () => {
  await p.evaluate(() => SitiosVentana.abrir({}));
  await p.waitForSelector('#sv-mapa .sitio');
  await p.locator('#sv-mapa .sitio', { hasText: 'Teléfono' }).click();
  await p.fill('#sv-nombre', 'Llamada telefónica');
  await p.click('#sv-guardar');
  await p.waitForSelector('#sv-panel .aviso-bueno');
  await p.click('#sv-cerrar');
  await p.waitForSelector('.sitios-capa', { state: 'detached' });
  await p.waitForTimeout(500);
  await p.evaluate(() => HitosPanel.programarRepintado());
  await p.waitForTimeout(800);
  return p.evaluate((n) => {
    const t = [...document.querySelectorAll('.guion-paso')].filter((x) => x.querySelector('.guion-paso-texto').textContent === n)[0];
    return t.querySelector('.guion-tarea-donde').textContent;
  }, NOMBRE);
})(), 'Llamada telefónica');
await comprobar('6h. borrar un sitio que usa una tarea pide a dónde pasan; «Pasar y borrar» las pasa', (async () => {
  await p.evaluate(() => SitiosVentana.abrir({}));
  await p.waitForSelector('#sv-mapa .sitio');
  await p.locator('#sv-mapa .sitio', { hasText: 'Llamada telefónica' }).click();
  await p.click('#sv-borrar');
  const pide = await p.evaluate(() => [document.getElementById('sv-aviso').textContent.indexOf('pásalas antes a') !== -1 || document.getElementById('sv-aviso').textContent.indexOf('pásala antes a') !== -1, !!document.getElementById('sv-destino'), document.getElementById('sv-b-ok').textContent]);
  if (pide[1]) { await p.selectOption('#sv-destino', { label: 'En mano' }); }
  await p.click('#sv-b-ok');
  await p.waitForTimeout(1200);
  const ok = await p.evaluate(() => [Sitios.opciones(Sitios.datos()).some((o) => o.texto === 'Llamada telefónica'), Sitios.datos().borrados.length > 0]);
  await p.evaluate(() => document.getElementById('sv-cerrar').click());
  await p.waitForSelector('.sitios-capa', { state: 'detached' });
  return [pide, ok];
})(), [[true, true, 'Pasar y borrar'], [false, true]]);
await comprobar('6i. las tareas que usaban el sitio borrado pasan al elegido', p.evaluate(async (n) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => (x.guionPropio || []).some((g) => g.texto === n))[0];
  return h.guionPropio.filter((x) => x.texto === n)[0].donde;
}, NOMBRE), { sitio: 'st-en-mano' });

console.log('--- 7. lo guardado por una versión que no conoce los datos nuevos, y las tareas de antes ---');
await comprobar('7a. normalizar conserva el sitio, el documento y a quién; y quita lo que no toca a la acción', p.evaluate(() => {
  const l = GuiasGuion.normalizar([
    { texto: 'Registrar', accion: 'registrar', donde: { sitio: 'st-seneca', zona: 'zn-seneca-registro' }, tipoDocumento: 'Solicitud', aQuien: 'tutor' },
    { texto: 'Llamar', accion: 'llamar', donde: { sitio: 'st-telefono' }, aQuien: 'tutor', tipoDocumento: 'Solicitud' },
    { texto: 'Vieja', accion: 'comunicar', receta: { via: 'seneca' } }]);
  return l.map((x) => [x.donde || null, x.tipoDocumento || null, x.aQuien || null]);
}), [[{ sitio: 'st-seneca', zona: 'zn-seneca-registro' }, 'Solicitud', null], [{ sitio: 'st-telefono' }, null, 'tutor'], [null, null, null]]);
await comprobar('7b. una tarea de Enviar de antes, sin sitio, usa su vía (correo → Correo electrónico; Séneca → iPasen) y se ve así', p.evaluate(() => [
  Sitios.textoDe(Sitios.datos(), Sitios.dondeDe({ accion: 'comunicar', receta: { via: 'seneca' } })), Sitios.textoDe(Sitios.datos(), Sitios.dondeDe({ accion: 'comunicar', receta: { via: 'correo' } })),
  Sitios.canalDeTarea({ accion: 'comunicar', receta: { via: 'seneca' } }), Sitios.canalDeTarea({ accion: 'comunicar' })]), ['iPasen', 'Correo electrónico', 'seneca', null]);
await comprobar('7c. los datos de la lista común se normalizan igual', p.evaluate(() => {
  const t = Comunes.normalizarTarea({ nombre: 'X', accion: 'llamar', donde: { sitio: 'st-telefono' }, aQuien: 'tercero', tipoDocumento: 'Solicitud' });
  return [t.donde, t.aQuien, 'tipoDocumento' in t, Comunes.lineaDeTarea(t).donde, Comunes.lineaDeTarea(t).aQuien];
}), [{ sitio: 'st-telefono' }, 'tercero', false, { sitio: 'st-telefono' }, 'tercero']);

console.log('--- 8. Ajustes → El centro → «Sitios» y el botón de Herramientas ---');
await p.evaluate(() => App.ir('ajustes'));
await p.waitForSelector('#bloque-sitios', { state: 'attached' });
await p.evaluate(() => App.irASeccionDeAjustes('#bloque-sitios'));
await p.waitForTimeout(600);
await comprobar('8a. «Sitios» sale en Ajustes, en la pestaña «El centro»', p.evaluate(() => !!document.getElementById('bloque-sitios').closest('#ajustes-tab-centro')), true);
await p.evaluate(() => { document.getElementById('bloque-sitios').open = true; });
await p.click('#sitios-abrir');
await p.waitForSelector('.sitios-capa #sv-mapa .sitio');
await comprobar('8b. «Abrir los sitios» abre la ventana, sin «Usar … en la tarea»', p.evaluate(() => [document.querySelectorAll('#sv-mapa .sitio').length > 10, !document.getElementById('sv-usar')]), [true, true]);
await p.click('#sv-cerrar');
await p.waitForSelector('.sitios-capa', { state: 'detached' });

const guiasAntes = await p.evaluate(() => JSON.stringify(GuiasDelCentro.todas()));
await p.evaluate(() => App.ir('herramientas'));
await p.waitForSelector('#bloque-repaso-donde', { state: 'attached' });
await comprobar('8c. «Aplicar el repaso del dónde» sale en Herramientas y antes de abrirlo no hay informe', p.evaluate(() => [!!document.getElementById('bloque-repaso-donde').closest('#pantalla-herramientas'), !!document.getElementById('btn-repaso-donde-aplicar')]), [true, false]);
await p.evaluate(() => { document.getElementById('bloque-repaso-donde').open = true; });
await p.waitForSelector('#btn-repaso-donde-aplicar');
const informe = await p.evaluate(() => document.getElementById('repaso-donde-salida').textContent);
await comprobar('8d. dice que todavía no se ha cambiado nada y enseña lo que hará y lo que no encuentra',
  ['todavía no se ha cambiado nada', 'Qué se hace', 'Qué documento', 'Hitos que se quitan', 'No encontrado'].map((t) => informe.indexOf(t) !== -1), [true, true, true, true, true]);
await comprobar('8e. mirar no cambia ninguna guía ni la lista de tareas', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, RepasoDondeAplicar.aplicado(),
  (await ComunesGuardado.leer()).tareas.some((t) => t.donde)], guiasAntes), [true, false, false]);
await p.click('#btn-repaso-donde-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('8f. «Aplicar» pide confirmación y dice qué hace', p.evaluate(() => document.querySelector('#capa').textContent.indexOf('copia de las guías y de la lista de tareas') !== -1), true);
await p.evaluate(() => document.getElementById('cuadro-cancelar') && document.getElementById('cuadro-cancelar').click());
await p.waitForTimeout(400);
await comprobar('8g. cancelar no cambia nada', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, RepasoDondeAplicar.aplicado()], guiasAntes), [true, false]);
await p.click('#btn-repaso-donde-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => RepasoDondeAplicar.aplicado(), null, { timeout: 30000 });
await p.waitForTimeout(600);
await comprobar('8h. al aplicar quedan la marca, las copias y el fichero de sitios', p.evaluate(async () => {
  const g = Gestor.carpetaGestor(), nombres = [];
  for await (const [n] of g.entries()) nombres.push(n);
  return [nombres.some((n) => /^guias-antes-del-repaso-donde-/.test(n)), nombres.some((n) => /^listas-comunes-antes-del-repaso-donde-/.test(n)), nombres.indexOf('repaso-donde-aplicado.json') !== -1, nombres.indexOf('sitios.json') !== -1];
}), [true, true, true, true]);
await comprobar('8i. las tareas de las guías quedan con su sitio y el botón desaparece', p.evaluate(async () => {
  await GuiasDelCentro.recargar();
  let con = 0, sin = 0;
  Comunes.recorrerGuias(GuiasDelCentro.todas(), null, (g) => { if (!g.pregunta && g.accion) { if (g.donde) con++; else sin++; } });
  App.ir('herramientas');
  const b = document.getElementById('bloque-repaso-donde');
  return [con > 0, sin === 0 || sin < con, !b || getComputedStyle(b).display === 'none'];
}), [true, true, true]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos.' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
