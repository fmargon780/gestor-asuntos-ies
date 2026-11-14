/* Fila 657 (docs/657-REPASO-LISTA-COMUN.md): el repaso de la lista común de hitos y tareas.
   Parte 1: con copias de los ficheros reales del 13-nov-2026 (pruebas/apoyo/datos-657/, sin datos de personas) se calcula el repaso
   y se compara con docs/657-plan-guias.json. Parte 2: el botón de Herramientas, en la demostración (disco falso). */
import { chromium } from 'playwright';

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
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

console.log('--- 1. con los ficheros reales del 13-nov-2026 ---');
/* Calcula el repaso en la página con los datos de apoyo y devuelve lo que la prueba necesita (nada se escribe). */
const R = await p.evaluate(async () => {
  const leer = async (r) => (await fetch(r)).json();
  const D = 'pruebas/apoyo/datos-657/';
  const guias = await leer(D + 'guias.json'), tipos = await leer(D + 'tipos.json');
  const listas = { tareas: (await leer(D + 'tareas-comunes.json')).tareas, hitos: (await leer(D + 'hitos-comunes.json')).hitos };
  const plan = await leer('datos-biblioteca/repaso-guias.json');
  const activos = [], inactivos = [];
  tipos.forEach((t) => { if (!(guias[t.tipo] || []).length) return; (t.desactivado ? inactivos : activos).push(t.tipo); });
  const r = await RepasoGuiasAplicar.calcularCon(guias, listas, plan, { activos, inactivos });
  const FASES = Comunes.FASES;
  const ids = { t: new Set(r.listas.tareas.map((x) => x.id)), h: new Set(r.listas.hitos.map((x) => x.id)) };
  const malos = [];
  const solo = {}; Object.keys(plan.tipos).forEach((t) => { solo[t] = r.guias[t]; });
  Comunes.recorrerGuias(solo, (paso, l, i, tipo) => { if (paso.comun && !ids.h.has(paso.comun)) malos.push(tipo + ' · hito ' + paso.titulo); if ('__v' in paso || '__fase' in paso) malos.push('marca suelta en ' + paso.titulo); },
    (g, l, i, tipo) => { if (!g.pregunta && !ids.t.has(g.comun)) malos.push(tipo + ' · tarea ' + g.texto); if ('__v' in g) malos.push('marca suelta en ' + g.texto); });
  /* Lo que el plan dice, tipo a tipo: títulos, orden, tareas y acciones. */
  const difs = [];
  Object.keys(plan.tipos).forEach((tipo) => {
    const nuevos = r.guias[tipo], previstos = plan.tipos[tipo];
    if (JSON.stringify(nuevos.map((x) => x.titulo)) !== JSON.stringify(previstos.map((x) => x.titulo))) { difs.push(tipo + ': títulos'); return; }
    previstos.forEach((h, i) => {
      const reales = nuevos[i].guion;
      if (reales.length !== h.tareas.length) { difs.push(tipo + ' · ' + h.titulo + ': ' + reales.length + ' tareas en vez de ' + h.tareas.length); return; }
      h.tareas.forEach((t, j) => {
        const g = reales[j];
        if (t.tipo === null && (g.texto !== t.texto || (g.accion || '') !== t.accion)) difs.push(tipo + ' · ' + h.titulo + ': «' + g.texto + '» [' + (g.accion || '') + '] en vez de «' + t.texto + '» [' + t.accion + ']');
        if (t.tipo === 'reunir' && !g.reunir) difs.push(tipo + ' · ' + h.titulo + ': pierde «' + g.texto + '»');
        if (t.tipo === 'pregunta' && !g.pregunta) difs.push(tipo + ' · ' + h.titulo + ': pierde la pregunta');
      });
    });
  });
  const cuerpoMal = []; Object.keys(plan.tipos).forEach((tipo) => { const ant = guias[tipo]; r.guias[tipo].forEach((p) => { if (p.__v) return; const o = ant.filter((x) => x.titulo === p.titulo)[0]; if (o && o.cuerpo !== p.cuerpo && !plan.tipos[tipo].some((h) => h.titulo === p.titulo && h.de.length > 1)) cuerpoMal.push(tipo + ' · ' + p.titulo); }); });
  const tit = (t) => r.guias[t].map((x) => x.titulo);
  const lin = (t, h) => ((r.guias[t].filter((x) => x.titulo === h)[0] || {}).guion || []).map((g) => g.texto);
  return {
    cuerpoMal,
    nTipos: Object.keys(plan.tipos).length, hitos: r.listas.hitos.length, tareas: r.listas.tareas.length,
    hitosAntes: listas.hitos.length, tareasAntes: listas.tareas.length,
    sinFase: r.listas.hitos.filter((h) => FASES.indexOf(h.fase) === -1).map((h) => h.nombre),
    otraCosa: r.listas.tareas.filter((t) => !t.accion && !t.reunir).length, reunir: r.listas.tareas.filter((t) => t.reunir).length,
    idsSueltos: malos, difs, noEncontrado: r.plan.noEncontrado, saltadas: r.plan.saltadas,
    matricula: tit('MATRICULA'), certMatricula: tit('CERT. MATRICULA'), certMatriculaFin: lin('CERT. MATRICULA', 'Enviar el certificado'),
    ipasen: tit('IPASEN ALUMNADO'), conformidad: tit('CONFORMIDAD'), certCE: tit('CERTIFICADO C.E'),
    altaReunir: r.guias['Alta y actualización de datos'].map((p) => p.guion.filter((g) => g.reunir).map((g) => g.texto)),
    altaTodas: JSON.stringify(r.guias['Alta y actualización de datos']).indexOf('Recoger la cuenta corriente'),
    desactivadasIgual: inactivos.filter((t) => JSON.stringify(r.guias[t]) !== JSON.stringify(guias[t])),
    nTareas: r.listas.tareas.length,
    cambian: r.cambian.length,
    bajaPartes: r.guias['BAJA MEDICA'].map((x) => x.titulo),
    idsConservados: r.listas.hitos.filter((h) => listas.hitos.some((x) => x.id === h.id)).length,
    fasesUsadas: [...new Set(r.listas.hitos.map((h) => h.fase))].sort()
  };
});
await comprobar('1a. el plan trae 54 tipos con guía y no queda nada sin encontrar', [R.nTipos, R.noEncontrado, R.saltadas], [54, [], []]);
await comprobar('1b. 101 hitos comunes, todos con una de las once fases', [R.hitos, R.sinFase, R.fasesUsadas.length], [101, [], 11]);
await comprobar('1c. las guías de los tipos activos quedan como dice el plan (títulos, orden, tareas y acciones)', R.difs, []);
await comprobar('1d. cada hito y cada tarea de las guías tiene su marca en las listas', R.idsSueltos, []);
/* El plan cuenta 134 tareas (17 «Otra cosa»); a ellas se suman dos «Otra cosa» que viven dentro de las preguntas de las guías (se quedan como están). */
await comprobar('1e. las tareas comunes pasan de 122 a 134 más las de dentro de las preguntas y las líneas «Hay que reunirlo»; solo 17 del plan quedan como «Otra cosa»', [R.tareasAntes, R.tareas - R.reunir, R.otraCosa], [122, 136, 19]);
await comprobar('1f. MATRICULA queda con seis hitos, en este orden', R.matricula,
  ['Registro de entrada', 'Grabar en Séneca la unidad y las optativas', 'Preparar Ficha libros', 'Comunicar al equipo educativo y entregar el horario', 'Foto para Séneca', 'Abrir/Guardar en el Expediente']);
await comprobar('1g. CERT. MATRICULA termina en «Enviar el certificado», con el registro de salida y el envío', [R.certMatricula[R.certMatricula.length - 1], R.certMatriculaFin],
  ['Enviar el certificado', ['Registrar de salida el documento', 'Enviar el documento al solicitante por la vía acordada']]);
await comprobar('1h. IPASEN ALUMNADO sigue con «Tramitar · Esperar respuesta»; CONFORMIDAD y CERTIFICADO C.E ya no tienen «Tramitar»',
  [R.ipasen, R.conformidad.indexOf('Tramitar'), R.certCE.indexOf('Tramitar')], [['Tramitar', 'Esperar respuesta'], -1, -1]);
await comprobar('1i. las líneas «Hay que reunirlo» de «Alta y actualización de datos» siguen y «Recoger la cuenta corriente» ya no está', [R.altaReunir.some((l) => l.length > 0), R.altaTodas], [true, -1]);
await comprobar('1j. los tres partes de BAJA MEDICA siguen separados', R.bajaPartes.filter((t) => /^Parte/.test(t)).length, 3);
await comprobar('1m. un hito que no se junta con otro conserva el cuerpo de su guía (no se mezclan textos entre guías)', R.cuerpoMal, []);
await comprobar('1k. las guías de los tipos desactivados no cambian', R.desactivadasIgual, []);
await comprobar('1l. los hitos comunes conservan el id de hoy', R.idsConservados > 80, true);

console.log('--- 2. el botón de Herramientas (demostración) ---');
const guiasAntes = await p.evaluate(() => JSON.stringify(GuiasDelCentro.todas()));
await p.evaluate(() => App.ir('herramientas'));
await p.waitForSelector('#bloque-repaso-lista', { state: 'attached' });
await comprobar('2a. «Aplicar el repaso de la lista común» sale en Herramientas', p.evaluate(() => !!document.getElementById('bloque-repaso-lista').closest('#pantalla-herramientas')), true);
await comprobar('2b. antes de abrirlo no hay informe', p.evaluate(() => !!document.getElementById('btn-repaso-lista-aplicar')), false);
await p.evaluate(() => { document.getElementById('bloque-repaso-lista').open = true; });
await p.waitForSelector('#btn-repaso-lista-aplicar');
const informe = await p.evaluate(() => document.getElementById('repaso-lista-salida').textContent);
await comprobar('2c. dice que todavía no se ha cambiado nada y enseña las listas, las guías y lo que no encuentra',
  ['todavía no se ha cambiado nada', 'En las listas comunes', 'En las guías', 'Guía por guía', 'No encontrado'].map((t) => informe.indexOf(t) !== -1), [true, true, true, true, true]);
await comprobar('2d. mirar no cambia ninguna guía ni ninguna lista', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, (await ComunesGuardado.leer()).hitos.length, RepasoGuiasAplicar.aplicado()], guiasAntes), [true, 0, false]);
await p.click('#btn-repaso-lista-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('2e. «Aplicar» pide confirmación y dice qué hace', p.evaluate(() => document.querySelector('#capa').textContent.indexOf('copia de las guías y de las dos listas') !== -1), true);
await p.evaluate(() => document.getElementById('cuadro-cancelar') && document.getElementById('cuadro-cancelar').click());
await p.waitForTimeout(400);
await comprobar('2f. cancelar no cambia nada', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, RepasoGuiasAplicar.aplicado()], guiasAntes), [true, false]);
await p.click('#btn-repaso-lista-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => RepasoGuiasAplicar.aplicado(), null, { timeout: 30000 });
await p.waitForTimeout(500);
await comprobar('2g. al aplicar queda la marca y existen las copias de las guías y de las listas', p.evaluate(async () => {
  const g = Gestor.carpetaGestor(), nombres = [];
  for await (const [n] of g.entries()) nombres.push(n);
  return [nombres.some((n) => /^guias-antes-del-repaso-/.test(n)), nombres.some((n) => /^listas-comunes-antes-del-repaso-/.test(n)), nombres.indexOf('repaso-lista-aplicado.json') !== -1];
}), [true, true, true]);
await comprobar('2h. el botón ya no está', p.evaluate(() => { App.ir('herramientas'); return !document.getElementById('bloque-repaso-lista') || getComputedStyle(document.getElementById('bloque-repaso-lista')).display === 'none'; }), true);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
