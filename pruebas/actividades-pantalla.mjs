/* Fila 310 (docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md): la pantalla «Actividades extraescolares» de Herramientas.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. `filtrar` por curso, profesor, unidad, situación y palabras (sin pantalla); la papelera no sale.
   2. El bloque de Herramientas y la tabla: la prevista, la realizada y la anulada, «(organiza)», la cuenta de abajo.
   3. Filtros: profesor/a, unidad, «Quitar», curso «Todos» (salen las dos antiguas), buscador.
   4. Pulsar una fila abre su ficha y «Volver» trae otra vez la tabla con los filtros.
   5. Apuntar una antigua (con alguien que ya no está), la repetida, cambiarla, borrarla y recuperarla de la papelera.
   6. La hoja de cálculo: sus dos pestañas y solo lo filtrado.
   7. «+ Nueva actividad» lleva a «Nuevo asunto» con el tipo puesto.
   8. Solo consulta: se ve, y los botones de crear, cambiar y borrar están apagados. */
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
async function nueva(extraInit) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (extraInit) await p.addInitScript(extraInit);
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });
  await p.waitForTimeout(4000);
  return p;
}

const pagina = await nueva();
const abrirPantalla = async (p) => {
  await p.evaluate(() => { App.ir('herramientas'); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById('bloque-actividades').open = true; });
  await p.click('#actividades-abrir');
  await p.waitForSelector('#actividades-vista #ap-cuerpo table', { timeout: 15000 });
};
const filas = (p) => p.evaluate(() => Array.from(document.querySelectorAll('#ap-cuerpo tbody tr')).map((tr) => tr.children[1].textContent.trim()));

/* ================= 1. FILTRAR ================= */
console.log('--- 1. filtrar ---');
const f = await pagina.evaluate(() => {
  const hoy = '2026-10-10';
  const L = [
    { id: 'a', nombre: 'Visita a Granada', inicio: '2026-10-18', fin: '2026-10-18', lugar: 'Granada', departamento: 'Historia', unidades: [{ unidad: '2º B' }], profesorado: [{ nombre: 'Otero Campos, Marta', papel: 'organiza' }], anulada: false },
    { id: 'b', nombre: 'Museo', inicio: '2026-09-20', fin: '2026-09-20', lugar: 'Madrid', departamento: 'Ciencias', unidades: [{ unidad: '3º A' }], profesorado: [{ nombre: 'Reyes Palma, Fernando', papel: 'organiza' }] },
    { id: 'c', nombre: 'Sierra', inicio: '2026-09-25', fin: '2026-09-25', lugar: 'Grazalema', departamento: 'Historia', unidades: [], profesorado: [{ nombre: 'Otero Campos, Marta', papel: 'acompana' }], anulada: true },
    { id: 'd', nombre: 'Viaje antiguo', inicio: '2025-05-02', fin: '2025-05-03', unidades: [], profesorado: [{ nombre: 'Otero Campos, Marta', papel: 'organiza' }], antigua: true },
    { id: 'e', nombre: 'En la papelera', inicio: '2026-09-21', fin: '2026-09-21', unidades: [], profesorado: [], enPapelera: true }
  ];
  const ids = (x) => ActividadesPantalla.filtrar(L, x, hoy).map((a) => a.id).join('');
  return {
    todas: ids({}), curso: ids({ curso: '26-27' }), antiguo: ids({ curso: '24-25' }), profe: ids({ curso: '26-27', profesor: 'otero campos, marta' }),
    unidad: ids({ unidad: '3º A' }), prevista: ids({ situacion: 'prevista' }), realizada: ids({ situacion: 'realizada' }), anulada: ids({ situacion: 'anulada' }),
    palabras: ids({ texto: 'granada visita' }), tildes: ids({ texto: 'GRAZALEMA' }), fecha1: ActividadesPantalla.fechaDeTabla(L[0]), fecha2: ActividadesPantalla.fechaDeTabla(L[3]),
    cuenta: ActividadesPantalla.lineaDeCuentas(ActividadesPantalla.cuentas(ActividadesPantalla.filtrar(L, { curso: '26-27' }, hoy), hoy))
  };
});
await comprobar('1. sin filtros salen todas menos la de la papelera', f.todas, 'abcd');
await comprobar('1. por curso', [f.curso, f.antiguo], ['abc', 'd']);
await comprobar('1. por profesor/a', f.profe, 'ac');
await comprobar('1. por unidad', f.unidad, 'b');
await comprobar('1. por situación', [f.prevista, f.realizada, f.anulada], ['a', 'bd', 'c']);
await comprobar('1. por palabras sueltas, sin tildes ni mayúsculas', [f.palabras, f.tildes], ['a', 'c']);
await comprobar('1. la fecha de la tabla', [f.fecha1, f.fecha2], ['18-oct-2026', '2 a 3-may-2025']);
await comprobar('1. la cuenta de abajo', f.cuenta, '3 actividades · 1 realizada · 1 prevista · 1 anulada');

/* ================= 2. LA TABLA ================= */
console.log('--- 2. la tabla ---');
await pagina.evaluate(() => { try { localStorage.removeItem('gestor.actividades.filtros'); } catch (e) {} });
await pagina.evaluate(() => { App.ir('herramientas'); });
await pagina.waitForTimeout(1500);
await comprobar('2. el bloque dice cuántas hay este curso y cuántas previstas',
  pagina.evaluate(() => document.getElementById('actividades-resumen').textContent), '3 este curso · 1 prevista');
await abrirPantalla(pagina);
await comprobar('2. la lista de bloques se esconde y está el botón de volver',
  pagina.evaluate(() => [document.getElementById('herramientas-lista').classList.contains('oculto'), !!document.getElementById('ap-volver')]), [true, true]);
await comprobar('2. las columnas', pagina.evaluate(() => Array.from(document.querySelectorAll('#ap-cuerpo thead th')).map((t) => t.textContent.replace(/[▼▲]/g, '').trim())),
  ['Fecha', 'Actividad', 'Departamento', 'Lugar', 'Unidades', 'Alumnado', 'Profesorado', 'Situación', '']);
await comprobar('2. curso actual: la más reciente arriba', filas(pagina),
  ['Ruta por la Sierra de Grazalema', 'Visita a la Alhambra y al Albaicín', 'Visita al Parque de las Ciencias']);
await comprobar('2. situaciones', pagina.evaluate(() => Array.from(document.querySelectorAll('#ap-cuerpo tbody tr .ap-situacion')).map((t) => t.textContent.trim()).sort()), ['Anulada', 'Prevista', 'Realizada']);
await comprobar('2. quien organiza lleva «(organiza)»', pagina.evaluate(() => document.querySelector('#ap-cuerpo tbody tr td:nth-child(7)').textContent.indexOf('(organiza)') !== -1), true);
await comprobar('2. la línea de abajo', pagina.evaluate(() => document.getElementById('ap-cuenta').textContent), '3 actividades · 1 realizada · 1 prevista · 1 anulada');

/* ================= 3. FILTROS ================= */
console.log('--- 3. filtros ---');
await pagina.selectOption('#ap-profesor', { label: await pagina.evaluate(() => Array.from(document.querySelectorAll('#ap-profesor option')).map((o) => o.textContent).filter((t) => /Reyes/.test(t))[0]) });
await pagina.waitForTimeout(300);
await comprobar('3. un profesor: solo sus actividades y sale «Filtrado por»', pagina.evaluate(() => [document.querySelectorAll('#ap-cuerpo tbody tr').length, /Filtrado por:/.test(document.getElementById('ap-filtrado').textContent)]), [2, true]);
await pagina.click('#ap-quitar');
await pagina.waitForTimeout(300);
await comprobar('3. «Quitar»: vuelven todas', pagina.evaluate(() => [document.querySelectorAll('#ap-cuerpo tbody tr').length, document.getElementById('ap-filtrado').classList.contains('oculto')]), [3, true]);
await pagina.selectOption('#ap-unidad', '3º A');
await pagina.waitForTimeout(300);
await comprobar('3. una unidad: solo las de esa unidad', pagina.evaluate(() => Array.from(document.querySelectorAll('#ap-cuerpo tbody tr td:nth-child(5)')).map((t) => /3º A/.test(t.textContent))), [true, true]);
await pagina.click('#ap-quitar');
await pagina.selectOption('#ap-curso', '');
await pagina.waitForTimeout(300);
await comprobar('3. «Curso: Todos» saca las dos antiguas, con su marca y sin alumnado ni unidades',
  pagina.evaluate(() => { const t = Array.from(document.querySelectorAll('#ap-cuerpo tbody tr')).filter((tr) => /antigua/.test(tr.children[7].textContent)); return [document.querySelectorAll('#ap-cuerpo tbody tr').length, t.length, t.every((tr) => tr.children[4].textContent === '' && tr.children[5].textContent === '')]; }), [5, 2, true]);
await pagina.fill('#ap-buscar', 'alhambra granada');
await pagina.waitForTimeout(300);
await comprobar('3. el buscador, por palabras sueltas del nombre y del lugar', filas(pagina), ['Visita a la Alhambra y al Albaicín']);
await pagina.fill('#ap-buscar', 'granada');
await pagina.waitForTimeout(300);
await comprobar('3. el buscador por una palabra del lugar', pagina.evaluate(() => document.querySelectorAll('#ap-cuerpo tbody tr').length), 3);
await pagina.fill('#ap-buscar', '');

/* ================= 4. UNA FILA ABRE SU ASUNTO ================= */
console.log('--- 4. abrir la ficha ---');
await pagina.selectOption('#ap-curso', await pagina.evaluate(() => U.cursoActual()));
await pagina.selectOption('#ap-situacion', 'prevista');
await pagina.waitForTimeout(300);
await pagina.click('#ap-cuerpo tbody tr .ap-nombre');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 10000 });
await comprobar('4. se abre la ficha de su asunto', pagina.evaluate(() => /GRUPO Visita Granada|Visita Granada/.test(document.getElementById('pantalla-asunto').textContent)), true);
await pagina.evaluate(() => document.getElementById('btn-volver') ? document.getElementById('btn-volver').click() : Navegacion.volver('herramientas'));
await pagina.waitForSelector('#actividades-vista #ap-cuerpo table', { timeout: 15000 });
await comprobar('4. «Volver» trae otra vez la tabla con los filtros',
  pagina.evaluate(() => [document.getElementById('ap-situacion').value, document.querySelectorAll('#ap-cuerpo tbody tr').length]), ['prevista', 1]);
await pagina.selectOption('#ap-situacion', '');

/* ================= 5. APUNTAR UNA ANTIGUA ================= */
console.log('--- 5. una actividad antigua ---');
await pagina.click('#ap-antigua');
await pagina.waitForSelector('#ant-nombre');
await comprobar('5. «Guardar» está apagado sin nombre, sin fecha y sin profesorado', pagina.evaluate(() => document.getElementById('cuadro-aceptar').disabled), true);
await pagina.fill('#ant-nombre', 'Concierto didáctico');
await pagina.fill('#ant-inicio', '2025-03-12');
await pagina.fill('#ant-lugar', 'Córdoba');
await pagina.click('#ant-mas-fuera');
await pagina.fill('#ant-fuera-nombre', 'Salas Pérez, Rosario');
await pagina.fill('#ant-fuera-dni', '12345678Z');
await pagina.click('#ant-fuera-poner');
await comprobar('5. alguien que ya no está en el centro entra en la lista', pagina.evaluate(() => document.getElementById('ant-profes').textContent.indexOf('Salas Pérez, Rosario') !== -1), true);
await comprobar('5. con nombre, fecha y profesorado ya se puede guardar', pagina.evaluate(() => document.getElementById('cuadro-aceptar').disabled), false);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('5. queda en el registro como antigua, sin asunto, con su clave',
  pagina.evaluate(() => { const a = Actividades.lista().filter((x) => x.nombre === 'Concierto didáctico')[0]; return a && [a.antigua, a.asunto, a.alumnado, a.profesorado[0].clave, a.profesorado[0].papel]; }), [true, null, 0, '12345678', 'acompana']);
await pagina.selectOption('#ap-curso', '');
await pagina.waitForTimeout(300);
await comprobar('5. sale en la tabla como «Realizada · antigua» y su profesora en Profesorado',
  pagina.evaluate(() => { const tr = Array.from(document.querySelectorAll('#ap-cuerpo tbody tr')).filter((r) => /Concierto/.test(r.textContent))[0]; return tr && [/Realizada/.test(tr.children[7].textContent), /antigua/.test(tr.children[7].textContent), /Salas/.test(tr.children[6].textContent)]; }), [true, true, true]);
await pagina.click('#ap-antigua');
await pagina.waitForSelector('#ant-nombre');
await pagina.fill('#ant-nombre', 'concierto DIDÁCTICO');
await pagina.fill('#ant-inicio', '2025-03-12');
await pagina.click('#ant-mas-fuera');
await pagina.fill('#ant-fuera-nombre', 'Otra Persona, Ana');
await pagina.click('#ant-fuera-poner');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => /Ya hay una actividad con ese nombre ese día/.test(document.getElementById('cuadro-cuerpo').textContent), null, { timeout: 8000 });
await comprobar('5. si ya hay una con ese nombre ese día, pregunta', pagina.evaluate(() => /¿Es otra distinta\?/.test(document.getElementById('cuadro-cuerpo').textContent)), true);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(500);
await comprobar('5. contestando que no, no se apunta', pagina.evaluate(() => Actividades.lista().filter((x) => /concierto/i.test(x.nombre)).length), 1);
/* Cambiar */
await pagina.evaluate(() => { Array.from(document.querySelectorAll('#ap-cuerpo tbody tr')).filter((r) => /Concierto/.test(r.textContent))[0].querySelector('[data-accion="cambiar"]').click(); });
await pagina.waitForSelector('#ant-nombre');
await pagina.fill('#ant-lugar', 'Granada');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1200);
await comprobar('5. «Cambiar» guarda el lugar nuevo', pagina.evaluate(() => Actividades.lista().filter((x) => x.nombre === 'Concierto didáctico')[0].lugar), 'Granada');
/* Borrar y recuperar */
await pagina.evaluate(() => { Array.from(document.querySelectorAll('#ap-cuerpo tbody tr')).filter((r) => /Concierto/.test(r.textContent))[0].querySelector('[data-accion="borrar"]').click(); });
await pagina.waitForSelector('#cuadro-aceptar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('5. «Borrar» la quita del registro', pagina.evaluate(() => !Actividades.lista().some((x) => x.nombre === 'Concierto didáctico')), true);
const enPapelera = await pagina.evaluate(async () => { const l = await Papelera.leer(); return l.filter((x) => x.clase === 'actividad' && x.nombre === 'Concierto didáctico').length; });
await comprobar('5. y la papelera la guarda', enPapelera, 1);
const devuelto = await pagina.evaluate(async () => { const l = await Papelera.leer(); const fi = l.filter((x) => x.clase === 'actividad')[0]; return (await Papelera.devolver(fi)).ok; });
await comprobar('5. se recupera de la papelera', [devuelto, await pagina.evaluate(() => Actividades.lista().some((x) => x.nombre === 'Concierto didáctico'))], [true, true]);

/* ================= 6. LA HOJA ================= */
console.log('--- 6. la hoja de cálculo ---');
const h = await pagina.evaluate(async () => {
  const hojas = ActividadesExportar.hojas(ActividadesPantalla.filtrar(Actividades.lista(), { curso: U.cursoActual(), situacion: 'prevista' }, U.hoyIso()), U.hoyIso());
  const bytes = await ExportarHoja.libro(hojas);
  const zip = await JSZip.loadAsync(bytes);
  return { pestanas: hojas.map((x) => x.nombre), filas: hojas.map((x) => x.filas.length), cab: hojas[1].filas[0].map((c) => c.v), nombre: ActividadesExportar.nombreDeFichero('26-27'), todas: ActividadesExportar.nombreDeFichero(''),
    ficheros: Object.keys(zip.files).filter((n) => /sheet\d/.test(n)).length };
});
await comprobar('6. dos pestañas', h.pestanas, ['Actividades', 'Profesorado']);
await comprobar('6. solo lo filtrado: la prevista y sus tres profesores', h.filas, [2, 4]);
await comprobar('6. columnas de Profesorado', h.cab, ['Profesor/a', 'DNI', 'Participación', 'Fecha', 'Actividad', 'Lugar', 'Horas']);
await comprobar('6. nombre del fichero', [h.nombre, h.todas], ['Actividades extraescolares 26-27.xlsx', 'Actividades extraescolares todas.xlsx']);
await comprobar('6. el .xlsx lleva sus dos hojas', h.ficheros, 2);

/* ================= 7. + NUEVA ACTIVIDAD ================= */
console.log('--- 7. nueva actividad ---');
await pagina.click('#ap-nueva');
await pagina.waitForSelector('#act-nombre');
await comprobar('7. se abre el formulario de la actividad', pagina.evaluate(() => !!document.getElementById('act-unidades')), true);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(500);

/* ================= 8. SOLO CONSULTA ================= */
console.log('--- 8. solo consulta ---');
const consulta = await nueva("try { if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); } } catch (e) {}");
await consulta.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
await consulta.waitForTimeout(3000);
await abrirPantalla(consulta);
await consulta.selectOption('#ap-curso', '');
await consulta.waitForTimeout(300);
await comprobar('8. se ve la tabla, pero crear está apagado', consulta.evaluate(() => [document.querySelectorAll('#ap-cuerpo tbody tr').length > 0, document.getElementById('ap-nueva').disabled, document.getElementById('ap-antigua').disabled]), [true, true, true]);
await comprobar('8. Cambiar y Borrar de una antigua, apagados', consulta.evaluate(() => Array.from(document.querySelectorAll('#ap-cuerpo [data-accion]')).every((b) => b.disabled) && document.querySelectorAll('#ap-cuerpo [data-accion]').length > 0), true);
await comprobar('8. «Exportar» sigue encendido y nada se ha escrito', consulta.evaluate(() => [document.getElementById('ap-hoja').disabled, Demo.escrituras()]), [false, 0]);
await consulta.close();

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' COMPROBACIONES FALLAN'); process.exit(1); }
console.log('\nTodas las comprobaciones de la pantalla de actividades pasan.');
