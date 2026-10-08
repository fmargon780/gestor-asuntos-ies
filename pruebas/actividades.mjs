/* Fila 306 (docs/ACTIVIDADES-EXTRAESCOLARES.md): el registro de actividades extraescolares, el formulario «La actividad» y la
   tarjeta de la ficha. Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. La lógica, sin pantalla: `situacion` y `cuenta` (prevista, realizada desde el día siguiente al fin, anulada, en la
      papelera), `unidadesDe`, `fechasLegibles` de un día y de varios.
   2. «Nuevo asunto»: el botón «Apuntar la actividad» solo con el tipo marcado.
   3. El formulario: «Seguir» apagado; el nombre corto y la fecha de fin se rellenan solos; las unidades traen su alumnado
      marcado; «Desmarcar todos» y «Marcar todos»; el profesorado con «Organiza» o «Acompaña».
   4. «Seguir» vuelve a «Nuevo asunto» con el grupo y la fecha límite; «Cambiar» vuelve con todo lo puesto.
   5. Crear: la carpeta termina en `GRUPO <nombre corto>`, `ficha.actividad` y el registro quedan guardados.
   6. La tarjeta «La actividad»: resumen, abierta en grande, «Cambiar» añade y quita alumnado, la cuenta al día, anular y deshacer.
   7. La actividad realizada de la demostración; la plantilla vieja no se ofrece; papelera y vuelta; solo consulta. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });   /* la demostración tarda un poco en montarse */
await pagina.waitForTimeout(4000);

/* ================= 1. LA LÓGICA ================= */
console.log('--- 1. la lógica ---');
await comprobar('1. situacion y cuenta: prevista el mismo día del fin, realizada desde el día siguiente, anulada, en la papelera',
  pagina.evaluate(() => {
    const a = { inicio: '2026-10-14', fin: '2026-10-15' };
    return [Actividades.situacion(a, '2026-10-15'), Actividades.situacion(a, '2026-10-16'), Actividades.situacion(Object.assign({ anulada: true }, a), '2026-11-01'),
      Actividades.cuenta(a, '2026-10-15'), Actividades.cuenta(a, '2026-10-16'), Actividades.cuenta(Object.assign({ enPapelera: true }, a), '2026-10-16'),
      Actividades.cuenta(Object.assign({ anulada: true }, a), '2026-10-16'), Actividades.situacion({ inicio: '2026-10-15' }, '2026-10-16')];
  }), ['prevista', 'realizada', 'anulada', false, true, false, false, 'realizada']);
await comprobar('1. unidadesDe: van y de, ordenadas',
  pagina.evaluate(() => Actividades.unidadesDe([{ unidad: '3º A' }, { unidad: '2º B' }, { unidad: '2º B' }], [{ unidad: '2º B', matriculado: true }, { unidad: '2º B', matriculado: true }, { unidad: '2º B', matriculado: true }, { unidad: '3º A', matriculado: true }])),
  [{ unidad: '2º B', van: 2, de: 3 }, { unidad: '3º A', van: 1, de: 1 }]);
await comprobar('1. fechasLegibles: un día y varios días',
  pagina.evaluate(() => [Actividades.fechasLegibles({ inicio: '2026-10-15', fin: '2026-10-15' }), Actividades.fechasLegibles({ inicio: '2026-10-15', fin: '2026-10-17' }),
    Actividades.fechasLegibles({ inicio: '2026-10-30', fin: '2026-11-02' }), Actividades.fechasLegibles({ inicio: '2026-12-30', fin: '2027-01-02' })]),
  ['15 de octubre de 2026', 'del 15 al 17 de octubre de 2026', 'del 30 de octubre al 2 de noviembre de 2026', 'del 30 de diciembre de 2026 al 2 de enero de 2027']);
await comprobar('1. la demostración trae el tipo con la marca y el registro con tres actividades (prevista, realizada y anulada)',
  pagina.evaluate(async () => {
    await Actividades.releer();
    const hoy = U.hoyIso();
    return [Actividades.esTipoDeActividad('ACTIVIDAD EXTRAESCOLAR'), Actividades.tipoMarcado(), Actividades.lista().map((a) => Actividades.situacion(a, hoy)).sort()];
  }), [true, true, ['anulada', 'prevista', 'realizada']]);
await comprobar('1. la pasada única pone la marca al tipo que no la tiene y deja puesta la suya',
  pagina.evaluate(async () => {
    const t = App.E.tipos.filter((x) => x.tipo === 'ACTIVIDAD EXTRAESCOLAR')[0];
    t.actividades = false; await App.guardarTipos(); await Actividades.cambiar((d) => { d.tipoMarcado = false; });
    for (let i = 0; i < 40 && window.ColaGuardado && ColaGuardado.hayGuardado(); i++) await new Promise((r) => setTimeout(r, 100));
    const r = await Actividades.pasada();
    return [!!r, t.actividades === true, Actividades.tipoMarcado(), await Actividades.pasada()];
  }), [true, true, true, null]);
await comprobar('1. la prevista: dos unidades, ocho alumnos, tres profesores y uno «organiza»',
  pagina.evaluate(() => { const a = Actividades.lista().filter((x) => /Alhambra/.test(x.nombre))[0]; return [a.unidades.map((u) => u.unidad + ':' + u.van), a.alumnado, a.profesorado.length, a.profesorado.filter((p) => p.papel === 'organiza').length, !!a.asunto.nombre]; }),
  [['2º B:4', '3º A:4'], 8, 3, 1, true]);

/* ================= 2. NUEVO ASUNTO ================= */
console.log('--- 2. «Nuevo asunto» ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(600);
await comprobar('2. sin tipo elegido no sale «Apuntar la actividad»', pagina.locator('#btn-apuntar-actividad').count(), 0);
await pagina.click('#tipos-lista .tipo-boton:has-text("ACTIVIDAD EXTRAESCOLAR")');
await pagina.waitForSelector('#btn-apuntar-actividad');
await comprobar('2. con el tipo ACTIVIDAD EXTRAESCOLAR sale el botón «Apuntar la actividad»', pagina.locator('#btn-apuntar-actividad').textContent(), 'Apuntar la actividad');

/* ================= 3. EL FORMULARIO ================= */
console.log('--- 3. el formulario ---');
await pagina.click('#btn-apuntar-actividad');
await pagina.waitForSelector('#act-nombre');
await comprobar('3. la ventana trae todos los campos',
  pagina.evaluate(() => ['act-nombre', 'act-corto', 'act-inicio', 'act-fin', 'act-salida', 'act-regreso', 'act-lugar', 'act-depto', 'act-horas', 'act-unidades', 'act-profes'].every((i) => document.getElementById(i))), true);
await comprobar('3. «Seguir» está apagado', pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-aceptar').disabled]), ['Seguir', true]);
await pagina.fill('#act-nombre', 'Visita al Museo de la Ciencia');
await comprobar('3. escribir el nombre rellena el nombre corto', pagina.evaluate(() => [document.getElementById('act-corto').value, document.getElementById('act-corto').value === U.limpiarNombre('Visita al Museo de la Ciencia').slice(0, 40)]), ['Visita al Museo de la Ciencia', true]);
await pagina.fill('#act-inicio', '2026-11-20');
await comprobar('3. poner la fecha de inicio pone la de fin igual', pagina.inputValue('#act-fin'), '2026-11-20');
await pagina.fill('#act-lugar', 'Granada');
await pagina.fill('#act-depto', 'Ciencias');
await pagina.fill('#act-salida', '08:30');
await pagina.fill('#act-regreso', '15:00');
await pagina.fill('#act-horas', '6');
await pagina.click('.act-unidad[data-unidad="2º B"]');
await comprobar('3. señalar «2º B» saca su alumnado, todo marcado: «van 6 de 6»',
  pagina.evaluate(() => { const b = document.querySelector('.act-bloque'); return [b.querySelector('h4').textContent, b.querySelectorAll('.act-casilla:checked').length, b.querySelectorAll('.act-casilla').length]; }), ['2º B · van 6 de 6', 6, 6]);
await comprobar('3. la cuenta de abajo', pagina.locator('#act-cuenta').textContent(), 'Van 6 alumnos/as · 0 profesores/as');
await pagina.locator('.act-casilla').nth(0).uncheck();
await pagina.locator('.act-casilla').nth(1).uncheck();
await comprobar('3. desmarcar a dos: «van 4 de 6» y la cuenta baja en dos',
  Promise.all([pagina.locator('.act-bloque h4').textContent(), pagina.locator('#act-cuenta').textContent()]), ['2º B · van 4 de 6', 'Van 4 alumnos/as · 0 profesores/as']);
await pagina.click('#act-desmarcar-todos');
await comprobar('3. «Desmarcar todos»: nadie marcado y «Seguir» apagado',
  pagina.evaluate(() => [document.querySelectorAll('.act-casilla:checked').length, document.getElementById('cuadro-aceptar').disabled, document.querySelector('.act-bloque h4').textContent]), [0, true, '2º B · van 0 de 6']);
await pagina.click('#act-marcar-todos');
await comprobar('3. «Marcar todos»: todos vuelven', pagina.evaluate(() => [document.querySelectorAll('.act-casilla:checked').length, document.getElementById('cuadro-aceptar').disabled]), [6, false]);
await pagina.locator('.act-casilla').nth(0).uncheck();
await pagina.click('.act-unidad[data-unidad="3º A"]');
await comprobar('3. una segunda unidad saca un segundo bloque con su alumnado marcado',
  pagina.evaluate(() => [...document.querySelectorAll('.act-bloque h4')].map((h) => h.textContent)), ['2º B · van 5 de 6', '3º A · van 4 de 4']);
await comprobar('3. lo escrito no se ha perdido al marcar y señalar', pagina.evaluate(() => [document.getElementById('act-lugar').value, document.getElementById('act-depto').value, document.getElementById('act-horas').value]), ['Granada', 'Ciencias', '6']);

/* El profesorado. */
await pagina.click('#act-mas-profe');
await pagina.waitForSelector('#act-picker #rel-buscar');
await comprobar('3. el buscador del profesorado solo ofrece PERSONAL', pagina.$$eval('#act-picker .categoria-mini-boton', (b) => b.map((x) => x.textContent)), ['PERSONAL']);
for (const apellido of ['Otero', 'Reyes', 'Uceda']) {
  await pagina.fill('#act-picker #rel-buscar', apellido);
  await pagina.waitForFunction((t) => [...document.querySelectorAll('#act-picker #rel-resultados .resultado-marcable')].some((r) => r.textContent.indexOf(t) !== -1), apellido);
  await pagina.locator('#act-picker #rel-resultados .resultado-marcable', { hasText: apellido }).first().locator('input').check();
}
await pagina.click('#act-picker #rel-marcados-anadir');
await comprobar('3. tres profesores en la lista, cada uno con «Acompaña»',
  pagina.$$eval('.act-profe', (f) => f.map((x) => x.querySelector('.act-papel').value)), ['acompana', 'acompana', 'acompana']);
await pagina.locator('.act-profe').nth(0).locator('.act-papel').selectOption('organiza');
await comprobar('3. «Van 9 alumnos/as · 3 profesores/as»', pagina.locator('#act-cuenta').textContent(), 'Van 9 alumnos/as · 3 profesores/as');

/* ================= 4. SEGUIR Y CAMBIAR ================= */
console.log('--- 4. seguir y cambiar ---');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('4. «Nuevo asunto» dice «Grupo <nombre corto> · 9 personas»', pagina.locator('#tercero-elegido strong').textContent(), 'Grupo Visita al Museo de la Ciencia · 9 personas');
await comprobar('4. la fecha límite es la de la actividad', pagina.inputValue('#campo-limite'), '2026-11-20');
await comprobar('4. el tipo sigue elegido', pagina.evaluate(() => App.E.nuevo.tipo), 'ACTIVIDAD EXTRAESCOLAR');
await pagina.click('#btn-cambiar-tercero');
await pagina.waitForSelector('#act-nombre');
await comprobar('4. «Cambiar» vuelve al formulario con todo lo puesto',
  pagina.evaluate(() => [document.getElementById('act-nombre').value, document.getElementById('act-inicio').value, document.getElementById('act-lugar').value,
    document.getElementById('act-cuenta').textContent, [...document.querySelectorAll('.act-bloque h4')].map((h) => h.textContent), [...document.querySelectorAll('.act-papel')].map((s) => s.value)]),
  ['Visita al Museo de la Ciencia', '2026-11-20', 'Granada', 'Van 9 alumnos/as · 3 profesores/as', ['2º B · van 5 de 6', '3º A · van 4 de 4'], ['organiza', 'acompana', 'acompana']]);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);

/* ================= 5. CREAR ================= */
console.log('--- 5. crear ---');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 20000 });
await pagina.waitForTimeout(3000);
const nombre = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO Visita al Museo de la Ciencia$/.test(a.nombre))[0].nombre);
await comprobar('5. la carpeta se llama «… ACTIVIDAD EXTRAESCOLAR GRUPO <nombre corto>»', /^\d{6} A26-\d{4} ACTIVIDAD EXTRAESCOLAR GRUPO Visita al Museo de la Ciencia$/.test(nombre), true);
await comprobar('5. `ficha.actividad` y `ficha.grupo` guardados, con nueve relacionados',
  pagina.evaluate((n) => { const f = App.E.registro.asuntos[n]; return [Object.keys(f.actividad), !!f.actividad.id, f.grupo.origen, f.grupo.nombre, f.relacionados.length, f.categoria]; }, nombre),
  [['id'], true, 'actividad', 'Visita al Museo de la Ciencia', 9, 'OTROS']);
await comprobar('5. el registro tiene la actividad con su asunto, fechas, unidades y profesorado',
  pagina.evaluate(async (n) => { await Actividades.releer(); const a = Actividades.porAsunto(n); return [a.nombre, a.inicio, a.fin, a.salida, a.regreso, a.lugar, a.departamento, a.horas, a.alumnado, a.unidades.map((u) => u.unidad + ':' + u.van + '/' + u.de), a.profesorado.map((p) => p.papel), !!a.profesorado[0].clave, a.asunto.numero.length > 0]; }, nombre),
  ['Visita al Museo de la Ciencia', '2026-11-20', '2026-11-20', '08:30', '15:00', 'Granada', 'Ciencias', 6, 9, ['2º B:5/6', '3º A:4/4'], ['organiza', 'acompana', 'acompana'], true, true]);
await comprobar('5. el fichero del disco lleva la marca y la actividad', pagina.evaluate(async () => { const d = await Carpetas.leerJson(App.E.gestor, 'actividades.json'); return [d.tipoMarcado, d.actividades.length]; }), [true, 4]);

/* ================= 6. LA TARJETA ================= */
console.log('--- 6. la tarjeta «La actividad» ---');
await pagina.waitForSelector('.ficha-tarjeta[data-tarjeta="actividad"]', { state: 'attached' });
await pagina.evaluate(() => { if (window.HitoMesa && HitoMesa.cerrarSiAbierta) HitoMesa.cerrarSiAbierta(); FichaTarjetas.cerrar(); });
await pagina.waitForTimeout(500);
await comprobar('6. la tarjeta es la primera y se llama «La actividad»',
  pagina.evaluate(() => [document.querySelector('.ficha-tarjetas-rejilla .ficha-tarjeta').dataset.tarjeta, document.querySelector('.ficha-tarjeta[data-tarjeta="actividad"] .ficha-titulo').textContent.trim()]), ['actividad', 'La actividad']);
await comprobar('6. cerrada, su resumen',
  pagina.locator('.ficha-tarjeta[data-tarjeta="actividad"] .ficha-resumen-linea').allTextContents(),
  ['Visita al Museo de la Ciencia', '20-nov-2026 · Granada · 9 alumnos/as · 3 profesores/as · Prevista']);
await pagina.evaluate(() => FichaTarjetas.abrir('actividad'));
await pagina.waitForTimeout(500);
await comprobar('6. abierta: las unidades con «van N de M» y el profesorado separado',
  pagina.evaluate(() => { const c = document.getElementById('ficha-actividad'); const cols = c.querySelectorAll('.act-ficha-col'); return [c.textContent.indexOf('del 20 de noviembre') === -1 && c.textContent.indexOf('20 de noviembre de 2026') !== -1, [...cols[1].querySelectorAll('li')].map((l) => l.textContent), [...cols[2].querySelectorAll('li')].map((l) => l.textContent.length > 0), cols[2].querySelectorAll('h4')[0].textContent, cols[2].querySelectorAll('h4')[1].textContent, cols[2].querySelectorAll('ul')[0].children.length, cols[2].querySelectorAll('ul')[1].children.length, c.querySelector('.act-situacion').textContent]; }),
  [true, ['2º B · van 5 de 6', '3º A · van 4 de 4'], [true, true, true], 'Organiza', 'Acompaña', 1, 2, 'Prevista']);
await comprobar('6. ocupa todo el ancho de la rejilla',
  pagina.evaluate(() => { const t = document.querySelector('.ficha-tarjeta[data-tarjeta="actividad"]').getBoundingClientRect(), r = document.getElementById('ficha-tarjetas-rejilla').getBoundingClientRect(); return Math.abs(t.width - r.width) < 4; }), true);
await comprobar('6. «Personas del grupo (9)»', pagina.evaluate(() => document.querySelector('.ficha-tarjeta[data-tarjeta="relacionados"]').dataset.titulo), 'Personas del grupo (9)');

/* «Cambiar»: desmarcar a uno y guardar. */
await pagina.click('#act-cambiar');
await pagina.waitForSelector('#act-nombre');
await comprobar('6. «Cambiar» abre el mismo formulario con lo guardado',
  pagina.evaluate(() => [document.getElementById('act-nombre').value, document.getElementById('act-cuenta').textContent, document.getElementById('cuadro-aceptar').textContent]), ['Visita al Museo de la Ciencia', 'Van 9 alumnos/as · 3 profesores/as', 'Guardar']);
await pagina.locator('.act-bloque').nth(1).locator('.act-casilla').nth(0).uncheck();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('6. la tarjeta cuenta ocho y «Personas del grupo» también',
  pagina.evaluate((n) => [Actividades.porAsunto(n).alumnado, App.E.registro.asuntos[n].relacionados.length, document.querySelector('.ficha-tarjeta[data-tarjeta="relacionados"]').dataset.titulo, document.querySelector('.ficha-tarjeta[data-tarjeta="actividad"]').textContent.indexOf('8 alumnos/as') !== -1], nombre), [8, 8, 'Personas del grupo (8)', true]);

/* La cuenta siempre es la verdadera: quitar a alguien por otro camino. */
await pagina.evaluate(async (n) => { const r = App.E.registro.asuntos[n].relacionados[0]; await App.anotarLista(n, 'relacionados', { quitar: [{ categoria: r.categoria, nombre: r.nombre }] }); App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, nombre);
await pagina.waitForTimeout(2500);
await comprobar('6. «Quitar del grupo» por otro camino: el registro se pone al día solo (7 y las unidades)',
  pagina.evaluate(async (n) => { await Actividades.releer(); const a = Actividades.porAsunto(n); return [a.alumnado, a.unidades.reduce((s, u) => s + u.van, 0)]; }, nombre), [7, 7]);

/* Anular y deshacer. */
await pagina.evaluate(() => FichaTarjetas.abrir('actividad'));
await pagina.waitForTimeout(400);
await pagina.click('#act-anular');
await pagina.waitForSelector('#cuadro-aceptar', { state: 'visible' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#act-deshacer-anulacion');
await comprobar('6. «Anular la actividad»: dice «Anulada» y ofrece «Deshacer la anulación»',
  pagina.evaluate(() => [document.querySelector('#ficha-actividad .act-situacion').textContent, document.getElementById('act-deshacer-anulacion').textContent, !!document.getElementById('act-anular')]), ['Anulada', 'Deshacer la anulación', false]);
await pagina.click('#act-deshacer-anulacion');
await pagina.waitForSelector('#act-anular');
await comprobar('6. «Deshacer la anulación»: vuelve a «Prevista»', pagina.locator('#ficha-actividad .act-situacion').textContent(), 'Prevista');

/* ================= 7. REALIZADA, PLANTILLA VIEJA, PAPELERA, UNIR ================= */
console.log('--- 7. realizada, plantilla vieja, papelera ---');
const realizada = await pagina.evaluate(() => Actividades.lista().filter((x) => /Parque de las Ciencias/.test(x.nombre))[0].asunto.nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), realizada);
await pagina.waitForSelector('.ficha-tarjeta[data-tarjeta="actividad"]');
await pagina.waitForTimeout(800);
await comprobar('7. la actividad de la demostración con la fecha ya pasada dice «Realizada»',
  pagina.locator('.ficha-tarjeta[data-tarjeta="actividad"] .ficha-resumen-linea').last().textContent().then((t) => /Realizada$/.test(t)), true);
const anulada = await pagina.evaluate(() => Actividades.lista().filter((x) => /Grazalema/.test(x.nombre))[0].asunto.nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), anulada);
await pagina.waitForSelector('.ficha-tarjeta[data-tarjeta="actividad"]');
await pagina.waitForTimeout(600);
await comprobar('7. y la anulada de la demostración, «Anulada»',
  pagina.locator('.ficha-tarjeta[data-tarjeta="actividad"] .ficha-resumen-linea').last().textContent().then((t) => /Anulada$/.test(t)), true);

await comprobar('7. la plantilla de participación del profesorado no se ofrece en un asunto de actividad, y otra plantilla sí',
  pagina.evaluate((n) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
    const vieja = { nombre: 'Participación del profesorado en actividad extraescolar', fichero: 'participacion-actividad.docx' };
    const otra = { nombre: 'Certificado de notas', fichero: 'certificado.docx' };
    return [GenerarParaRelacionados.botonHTML(a, vieja), GenerarParaRelacionados.botonHTML(a, otra).indexOf('para cada relacionado') !== -1];
  }, nombre), ['', true]);

await pagina.evaluate(async (n) => { await Papelera.mandarAsunto(Gestor.asuntos().filter((a) => a.nombre === n)[0]); await App.verAbiertos(); }, realizada);
await pagina.waitForTimeout(1500);
await comprobar('7. a la papelera: la actividad pasa a `enPapelera` y deja de contar',
  pagina.evaluate(async (n) => { await Actividades.releer(); const a = Actividades.porAsunto(n); return [a.enPapelera, Actividades.cuenta(a, U.hoyIso())]; }, realizada), [true, false]);
await pagina.evaluate(async () => { const f = (await Papelera.leer()).filter((x) => x.clase === 'asunto')[0]; await Papelera.devolver(f); await App.verAbiertos(); });
await pagina.waitForTimeout(1500);
await comprobar('7. recuperarlo: la actividad vuelve y cuenta',
  pagina.evaluate(async (n) => { await Actividades.releer(); const a = Actividades.porAsunto(n); return [a.enPapelera, Actividades.cuenta(a, U.hoyIso())]; }, realizada), [false, true]);

await comprobar('7. cambiar el nombre de una persona del profesorado cambia el de sus actividades',
  pagina.evaluate(async () => {
    await Actividades.releer();
    const antes = Actividades.lista().filter((a) => /Alhambra/.test(a.nombre))[0].profesorado[0].nombre;
    await Actividades.alRenombrarPersona('PERSONAL', antes, antes + ' X');
    await Actividades.releer();
    return Actividades.lista().filter((a) => /Alhambra/.test(a.nombre))[0].profesorado[0].nombre === antes + ' X';
  }), true);

/* Unir dos actividades: la del asunto que se queda se queda, la otra va a la papelera. */
await comprobar('7. si se unen dos asuntos con actividad, la del que se va pasa a la papelera',
  pagina.evaluate(async ([queda, va]) => {
    await Actividades.alUnirAsuntos(queda, va);
    await Actividades.releer();
    return [Actividades.porAsunto(queda).enPapelera, Actividades.porAsunto(va).enPapelera];
  }, [nombre, anulada]), [false, true]);

/* Cambiar el nombre corto cambia el nombre del grupo y de la carpeta, por el camino de «Cambiar el asunto». */
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), nombre);
await pagina.waitForSelector('.ficha-tarjeta[data-tarjeta="actividad"]', { state: 'attached' });
await pagina.evaluate(() => { FichaTarjetas.cerrar(); FichaTarjetas.abrir('actividad'); });
await pagina.waitForSelector('#act-cambiar');
await pagina.click('#act-cambiar');
await pagina.waitForSelector('#act-corto');
await pagina.fill('#act-corto', 'Museo Ciencia');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(3000);
await comprobar('7. cambiar el nombre corto renombra la carpeta y el grupo, y el registro sigue al asunto',
  pagina.evaluate(async () => {
    await Actividades.releer();
    const a = Actividades.lista().filter((x) => /Museo de la Ciencia/.test(x.nombre))[0];
    const ficha = App.E.registro.asuntos[a.asunto.nombre] || {};
    return [/ACTIVIDAD EXTRAESCOLAR GRUPO Museo Ciencia$/.test(a.asunto.nombre), ficha.grupo && ficha.grupo.nombre, ficha.tercero, App.E.listaAbiertos.some((x) => x.nombre === a.asunto.nombre)];
  }), [true, 'Museo Ciencia', 'GRUPO Museo Ciencia', true]);

/* Un asunto normal después: nada de la actividad en «Nuevo asunto». */
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(500);
await comprobar('7. un «Nuevo asunto» después no guarda nada de la actividad',
  pagina.evaluate(() => [App.E.nuevo.tercero, App.E.nuevo.tipo, document.getElementById('actividad-nuevo-caja').classList.contains('oculto'), document.getElementById('tercero-elegido').classList.contains('oculto')]), [null, null, true, true]);
await pagina.click('#tipos-lista .tipo-boton:has-text("CERTIFICADO")');
await pagina.waitForTimeout(300);
await comprobar('7. y con otro tipo no sale «Apuntar la actividad»', pagina.locator('#btn-apuntar-actividad').count(), 0);

/* Un asunto de actividad sin los datos apuntados (de antes de esta fila). */
const sinDatos = await pagina.evaluate(async () => {
  const tipo = App.E.tipos.filter((t) => t.tipo === 'ACTIVIDAD EXTRAESCOLAR')[0];
  const alumnos = (await Actividades.alumnadoMatriculado()).filter((p) => ['2100006', '2100011'].indexOf(String(p.id)) !== -1);
  const montado = Nombres.montarAsunto({ fecha: U.hoyIso(), tipo: Nombres.tipoParaCarpeta(tipo), categoria: 'OTROS', curso: '', grupo: '', campos: [], descripcion: '', tercero: 'GRUPO Antiguo', numero: 'A26-0990' });
  await Carpetas.crear(App.E.abiertos, montado.nombre);
  await App.anotar(montado.nombre, { estado: 'abierto', tipo: tipo.tipo, categoria: 'OTROS', tercero: 'GRUPO Antiguo', numero: 'A26-0990', abiertoEl: U.ahora(), abiertoPor: 'Revisor',
    grupo: { nombre: 'Antiguo', origen: 'mano', creado: U.ahora() }, relacionados: alumnos.map((p) => ({ categoria: 'ALUMNADO', nombre: App.textoTercero(p) })).concat([{ categoria: 'PERSONAL', nombre: 'Otero Campos, Marta' }]) });
  await App.verAbiertos();
  return montado.nombre;
});
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), sinDatos);
await pagina.waitForSelector('.ficha-tarjeta[data-tarjeta="actividad"]', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.cerrar());
await pagina.waitForTimeout(500);
await comprobar('7. cerrada, la tarjeta de ese asunto dice que falta apuntar y ofrece el botón',
  pagina.locator('.ficha-tarjeta[data-tarjeta="actividad"] .ficha-resumen-linea').allTextContents(), ['Sin apuntar todavía', 'Apuntar los datos de la actividad']);
await pagina.evaluate(() => FichaTarjetas.abrir('actividad'));
await pagina.waitForSelector('#act-apuntar-datos');
await comprobar('7. un asunto de ese tipo sin actividad ofrece «Apuntar los datos de la actividad»', pagina.locator('#act-apuntar-datos').textContent(), 'Apuntar los datos de la actividad');
await pagina.click('#act-apuntar-datos');
await pagina.waitForSelector('#act-nombre');
await comprobar('7. el formulario trae su alumnado marcado y su profesorado como «Acompaña»',
  pagina.evaluate(() => [document.getElementById('act-cuenta').textContent, [...document.querySelectorAll('.act-bloque h4')].map((h) => h.textContent), [...document.querySelectorAll('.act-papel')].map((s) => s.value)]),
  ['Van 2 alumnos/as · 1 profesores/as', ['4º A · van 2 de 4'], ['acompana']].map((x, i) => i === 0 ? 'Van 2 alumnos/as · 1 profesor/a' : x));
await pagina.fill('#act-nombre', 'Charla de prueba');
await pagina.fill('#act-inicio', '2026-12-01');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('7. al guardar, la actividad queda apuntada y no se quita a nadie',
  pagina.evaluate((n) => { const f = App.E.registro.asuntos[n]; return [!!f.actividad.id, f.relacionados.length, f.grupo.origen, Actividades.porAsunto(n).nombre]; }, sinDatos), [true, 3, 'mano', 'Charla de prueba']);

/* ================= 8. SOLO CONSULTA ================= */
console.log('--- 8. solo consulta ---');
const consulta = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
consulta.on('pageerror', (e) => errores.push('EXCEPCIÓN (consulta): ' + e.message));
await consulta.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); } } catch (e) {}");
await consulta.goto(DIRECCION);
await consulta.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await consulta.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
await consulta.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });
await consulta.waitForTimeout(5000);
const prevista = await consulta.evaluate(() => Actividades.lista().filter((x) => /Alhambra/.test(x.nombre))[0].asunto.nombre);
await consulta.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), prevista);
await consulta.waitForSelector('#pantalla-asunto:not(.oculto)');
await consulta.waitForTimeout(1000);
await consulta.evaluate(() => FichaTarjetas.abrir('actividad'));
await consulta.waitForSelector('#act-cambiar');
await consulta.waitForTimeout(800);
await comprobar('8. en solo consulta la tarjeta se ve y sus botones están apagados',
  consulta.evaluate(() => [document.getElementById('act-cambiar').disabled, document.getElementById('act-anular').disabled, document.getElementById('ficha-actividad').textContent.indexOf('Alhambra') !== -1]), [true, true, true]);
await comprobar('8. y nada ha escrito', consulta.evaluate(() => Demo.escrituras()), 0);
await consulta.close();

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' COMPROBACIONES FALLAN'); process.exit(1); }
console.log('\nTodas las comprobaciones de actividades pasan.');
