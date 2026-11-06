/* Fila 553 (docs/553-PARTES-DEL-HITO.md): las partes del hito en recuadros, «Subir» y «Bajar» con su franja,
   «Cambiar la tarea» con «Qué se hace», «+ Añadir hito» al final de la tira con «Va detrás de» y «Hito ▾» sin «Crear».
   Copia de pruebas (demo), Chromium real: el disco es falso, nunca se tocan datos reales. */
import { chromium } from 'playwright';
import { abrirHito } from './apoyo/hito.mjs';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

/* Dos asuntos abiertos del mismo tipo, con el mismo hito de la guía; ese hito lleva cuatro tareas. */
const sitio = await p.evaluate(async () => {
  const por = {};
  for (const x of App.E.listaAbiertos) {
    const tipo = (x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo);
    for (const h of (await Hitos.hitosDe(x.nombre)).filter((k) => k.origenGuia && k.clase !== 'decision')) {
      const paso = Hitos.pasoDeGuia(x, h);
      if (paso && !(paso.opciones && paso.opciones.length)) (por[tipo + '|' + h.origenGuia] = por[tipo + '|' + h.origenGuia] || []).push({ nombre: x.nombre, hito: h.id, tipo, paso: h.origenGuia });
    }
  }
  const k = Object.keys(por).filter((c) => por[c].length >= 2)[0];
  return por[k].slice(0, 2);
});
const A = sitio[0], B = sitio[1];
console.log('(prueba con ' + A.tipo + ': ' + A.nombre + ' y ' + B.nombre + ')');
await p.evaluate(async ([tipo, paso]) => {
  await GuiasDelCentro.cambiarPasos(tipo, (pasos) => {
    const x = HitoMesaGuion.buscarPasoDeGuia(pasos, paso);
    x.guion = [
      { id: 'ta', texto: 'Tarea A', explicacion: '', accion: 'comunicar' },
      { id: 'tb', texto: 'Tarea B', explicacion: '', accion: 'pedir' },
      { id: 'tc', texto: 'Tarea C', explicacion: '', accion: '' },
      { id: 'td', texto: 'Tarea D', explicacion: '', accion: '' }
    ];
  }, { sinLlevar: true });
  window.__guiaTexto = () => JSON.stringify(GuiasDelCentro.pasosDe(tipo).filter((x) => x.id === paso)[0].guion.map((g) => g.id));
  window.__vista = async (nombre, idHito) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === nombre)[0];
    const h = (await Hitos.hitosDe(nombre)).filter((k) => k.id === idHito)[0];
    return Hitos.guionDe(a, h).map((g) => g.id);
  };
}, [A.tipo, A.paso]);

async function abrirMesaDe(asunto) {
  await p.evaluate((n) => { const t = [...document.querySelectorAll('.tarjeta')].find((c) => c.textContent.indexOf(n) !== -1); return t; }, asunto.nombre.slice(0, 20));
  await p.evaluate(async (nombre) => { await App.verAbiertos(); }, asunto.nombre);
  const corto = asunto.nombre.replace(/^\d+ (A\d+-\d+ )?/, '');
  await p.locator('.tarjeta-nombre', { hasText: corto.split(' ').slice(1, 2).join(' ') }).first().click();
  await p.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await p.evaluate(() => FichaTarjetas.abrir('hitos'));
  await p.waitForTimeout(300);
  if (!await p.locator('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + asunto.hito + '"]').count()) {
    await p.evaluate(() => { if (window.HitoMesa) HitoMesa.cerrar(); });
    await p.waitForTimeout(150);
    await abrirHito(p, asunto.hito);
  }
  await p.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + asunto.hito + '"] .guion-paso[data-id="ta"]');
  await p.waitForTimeout(300);
}
const ordenPantalla = () => p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].map((e) => e.dataset.id));
const franja = () => p.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-orden-cambiado'));
async function menuDe(id) { await p.locator('.hito-en-mesa .guion-paso[data-id="' + id + '"] .guion-tarea-menu-boton').click(); }
const opcionesAbiertas = () => p.evaluate(() => [...document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')].map((b) => b.textContent + (b.disabled ? '(apagado)' : '')));
async function elegir(texto) { await p.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: new RegExp('^' + texto + '$') }).first().click(); await p.waitForTimeout(700); }

console.log('--- 1. las cuatro partes, cada una en su recuadro ---');
await abrirMesaDe(A);
await comprobar('1a. títulos de los recuadros', p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .mesa-col-hito > .mesa-bloque:not(.mesa-normativa)')]
  .map((s) => (s.querySelector('.mesa-bloque-titulo, .mesa-grande-titulo').firstChild.textContent || '').trim())), ['Tareas', 'Campos', 'Documentos', 'Registro']);
await comprobar('1b. cada uno con borde y cabecera de fondo propio', p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .mesa-col-hito > .mesa-bloque:not(.mesa-normativa)')].map((s) => {
  const c = getComputedStyle(s), k = getComputedStyle(s.querySelector('.mesa-bloque-cabecera'));
  return c.borderTopWidth !== '0px' && k.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(getComputedStyle(s.querySelector('.mesa-bloque-titulo, .mesa-grande-titulo')).fontSize) >= 15;
})), [true, true, true, true]);
await comprobar('1c. la cuenta de Tareas', p.evaluate(() => document.querySelector('.hito-en-mesa .mesa-guion-cuenta').textContent), '0 de 4');
await comprobar('1d. «Normativa» sigue como era (sin recuadro)', p.evaluate(() => { const n = document.querySelector('.hito-en-mesa .mesa-normativa'); return !n || getComputedStyle(n).borderTopWidth === '0px' || n.classList.contains('oculto'); }), true);
await comprobar('1e. cada tarea con acción lleva su etiqueta', p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].map((e) => (e.querySelector('.guion-tarea-accion') || {}).textContent || '')), ['Comunicar', 'Pedir datos', '', '']);

console.log('--- 2. Subir y Bajar ---');
await menuDe('ta');
await comprobar('2a. la primera: Subir apagado', opcionesAbiertas().then((l) => l.slice(0, 3)), ['Subir(apagado)', 'Bajar', 'Anotar']);
await p.keyboard.press('Escape');
await menuDe('td');
await comprobar('2b. la última: Bajar apagado', opcionesAbiertas().then((l) => l.slice(0, 2)), ['Subir', 'Bajar(apagado)']);
await p.keyboard.press('Escape');
await comprobar('2c. sin movimientos, sin franja', franja(), false);
await menuDe('ta'); await elegir('Bajar');
await comprobar('2d. Bajar mueve la tarea al momento', ordenPantalla(), ['tb', 'ta', 'tc', 'td']);
await comprobar('2e. y sale la franja', franja(), true);
await comprobar('2f. los botones de la franja', p.evaluate(() => [...document.querySelectorAll('.guion-orden-cambiado button')].map((b) => b.textContent)), ['Guardar también en la guía', 'Solo en este asunto']);
await p.locator('.guion-orden-aqui').click(); await p.waitForTimeout(700);
await comprobar('2g. «Solo en este asunto»: se va la franja', franja(), false);
await comprobar('2h. y la guía no cambia', p.evaluate(() => window.__guiaTexto()), '["ta","tb","tc","td"]');
await comprobar('2i. el orden de aquí se queda', ordenPantalla(), ['tb', 'ta', 'tc', 'td']);
await menuDe('td'); await elegir('Subir');
await comprobar('2j. mover otra vez vuelve a preguntar', [await franja(), await ordenPantalla()], [true, ['tb', 'ta', 'td', 'tc']]);

console.log('--- 3. Guardar también en la guía ---');
await p.locator('.guion-orden-guia').click(); await p.waitForTimeout(1500);
await comprobar('3a. la guía guarda el orden de este asunto', p.evaluate(() => window.__guiaTexto()), '["tb","ta","td","tc"]');
await comprobar('3b. se va la franja', franja(), false);
await comprobar('3c. el otro asunto abierto sigue como estaba', p.evaluate(([n, h]) => window.__vista(n, h), [B.nombre, B.hito]), ['ta', 'tb', 'tc', 'td']);

console.log('--- 4. una tarea «solo aquí» se mueve sin franja ---');
await p.evaluate(async ([n, h]) => { await Hitos.anadirGuionPropio(n, h, 'Tarea propia', {}); HitosPanel.programarRepintado(); }, [A.nombre, A.hito]);
await p.waitForTimeout(900);
await comprobar('4a. la propia sale al final', ordenPantalla().then((l) => l.length), 5);
const idPropia = await p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].map((e) => e.dataset.id).pop());
await menuDe(idPropia); await elegir('Subir');
await comprobar('4b. se mueve', ordenPantalla().then((l) => l.indexOf(idPropia)), 3);
await comprobar('4c. y no hace salir la franja', franja(), false);

console.log('--- 5. «+ Añadir hito» y «Hito ▾» ---');
await comprobar('5a. bajo las tareas solo «+ Añadir tarea»', p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-comunes button')].map((b) => b.textContent).filter((t) => t.indexOf('Añadir') !== -1)), ['+ Añadir tarea']);
await comprobar('5b. «+ Añadir hito» es el último de la tira', p.evaluate(() => { const t = document.querySelector('.hito-en-mesa .mesa-tira, .mesa-tira'); const u = t.lastElementChild; return u.textContent; }), '+ Añadir hito');
await p.click('.mesa-tira-anadir');
await p.waitForSelector('.capa-campos #cv-detras');
await comprobar('5c. «Va detrás de», con el último marcado «(al final)»', p.evaluate(() => { const s = document.querySelector('#cv-detras'); return [s.options[s.selectedIndex].textContent.indexOf('(al final)') !== -1, s.selectedIndex === s.options.length - 1]; }), [true, true]);
await p.selectOption('#cv-para', 'aqui');
await p.selectOption('#cv-detras', { index: 0 });
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Hito de prueba 553');
await p.click('#cn-crear');
await p.waitForTimeout(1200);
await comprobar('5d. el hito nuevo entra detrás del elegido (el primero)', p.evaluate(async (n) => (await Hitos.hitosDe(n)).map((h) => h.titulo).indexOf('Hito de prueba 553'), A.nombre), 1);
await p.click('.hito-en-mesa .mesa-mas');
await p.waitForSelector('.ficha-menu:not(.oculto)');
await comprobar('5e. «Hito ▾» no tiene «Crear», sí «Cambiar» y «Borrar»', opcionesAbiertas().then((l) => [l.indexOf('Crear'), l.indexOf('Cambiar') !== -1, l.some((x) => x.indexOf('Borrar') === 0)]), [-1, true, true]);
await p.keyboard.press('Escape');

console.log('--- 6. «Cambiar la tarea» cambia también «Qué se hace» ---');
const tarea = await p.evaluate(async ([tipo, paso]) => {
  const t = await ComunesGuardado.anadir('tareas', { nombre: 'Tarea común 553', accion: '', receta: null });
  await GuiasDelCentro.cambiarPasos(tipo, (pasos) => {
    const x = HitoMesaGuion.buscarPasoDeGuia(pasos, paso);
    x.guion.push(Object.assign(Comunes.lineaDeTarea(t), { id: 'tz' }));
  }, { sinLlevar: true });
  HitosPanel.programarRepintado();
  return t.id;
}, [A.tipo, A.paso]);
await p.waitForTimeout(900);
await menuDe('tz'); await elegir('Cambiar la tarea');
await p.waitForSelector('#cc-hace');
await comprobar('6a. la ventana tiene Nombre y «Qué se hace»', p.evaluate(() => [!!document.querySelector('#cc-nombre'), document.querySelector('#cc-hace').value]), [true, '']);
await p.selectOption('#cc-hace', 'comunicar');
await comprobar('6b. al elegir comunicar sale la Plantilla, con «+ Plantilla nueva…»', p.evaluate(() => { const s = document.querySelector('#cc-pl'); return !!s && [...s.options].some((o) => o.textContent === '+ Plantilla nueva…'); }), true);
await p.selectOption('#cc-hace', 'firmar');
await comprobar('6c. con firmar ya no hay Plantilla', p.evaluate(() => !document.querySelector('#cc-pl')), true);
await p.selectOption('#cc-hace', 'comunicar');
await p.click('#cc-guardar');
await p.waitForTimeout(1500);
await comprobar('6d. la tarea de la lista común cambia de acción', p.evaluate(async (id) => (await ComunesGuardado.leer()).tareas.filter((t) => t.id === id)[0].accion, tarea), 'comunicar');
await comprobar('6e. la etiqueta de la tarea dice la acción nueva', p.evaluate(() => (document.querySelector('.hito-en-mesa .guion-paso[data-id="tz"] .guion-tarea-accion') || {}).textContent), 'Comunicar');
await comprobar('6f. y el otro asunto abierto conserva la acción vieja', p.evaluate(async ([n, h]) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
  const g = Hitos.guionDe(a, (await Hitos.hitosDe(n)).filter((k) => k.id === h)[0]).filter((x) => x.texto === 'Tarea común 553');
  return g.map((x) => x.accion);
}, [B.nombre, B.hito]), ['']);

console.log('--- 7. el menú ⋮ de la última tarea no se corta ---');
await p.setViewportSize({ width: 1500, height: 700 });
await p.evaluate(() => { const u = [...document.querySelectorAll('.hito-en-mesa .guion-paso')].pop(); u.scrollIntoView({ block: 'end' }); });
await p.waitForTimeout(300);
const ultima = await p.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].pop().dataset.id);
await menuDe(ultima);
await comprobar('7a. el menú abierto cabe entero en la pantalla', p.evaluate(() => { const m = document.querySelector('.ficha-menu:not(.oculto)').getBoundingClientRect(); return m.top >= 0 && m.bottom <= window.innerHeight; }), true);
await p.keyboard.press('Escape');

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
