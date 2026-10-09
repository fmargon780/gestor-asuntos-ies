/* Fila 309 (docs/ACTIVIDADES-EXTRAESCOLARES-AVISO.md): el aviso al claustro de una actividad, con su informe en PDF.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. La lógica, sin pantalla: `datos` con dos unidades y quien no tiene unidad, `cambios`, `valores` y los huecos {{ACTIVIDAD…}}.
   2. La tarjeta «La actividad»: «Sin avisar al claustro» y «Avisar al claustro».
   3. El cuadro de Correo: el informe marcado, la plantilla, el texto sin huecos, el grupo en copia oculta y quién no tiene correo.
   4. El informe: su nombre, su tipo de documento y lo que dice.
   5. Enviar: «Aviso enviado el …».
   6. La lista cambia: aviso ámbar y «Volver a avisar», con su texto de sustitución.
   7. Ajustes → El centro: el grupo que lo recibe gana al que se llama «Profesorado»; sin grupo, la línea ámbar y su enlace.
   8. Actividad anulada y solo consulta: el botón apagado. */
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

async function abrirTarjeta(p, trozo) {
  const nombre = await p.evaluate((t) => Actividades.lista().filter((x) => new RegExp(t).test(x.nombre))[0].asunto.nombre, trozo);
  await p.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), nombre);
  await p.waitForSelector('#pantalla-asunto:not(.oculto)');
  await p.waitForTimeout(800);
  await p.evaluate(() => { if (window.HitoMesa && HitoMesa.cerrarSiAbierta) HitoMesa.cerrarSiAbierta(); FichaTarjetas.abrir('actividad'); });
  await p.waitForSelector('#act-avisar');
  await p.waitForTimeout(500);
  return nombre;
}
const textoPdf = (p, nombreAsunto, fichero) => p.evaluate(async ([asunto, f]) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === asunto)[0];
  const h = (await Carpetas.ficheros(a.handle)).filter((x) => x.nombre === f)[0];
  const bytes = new Uint8Array(await (await h.handle.getFile()).arrayBuffer());
  const doc = await (await App.cargarPdfJs()).getDocument({ data: bytes }).promise;
  let t = '';
  for (let n = 1; n <= doc.numPages; n++) t += (await (await doc.getPage(n)).getTextContent()).items.map((i) => i.str).join('\n') + '\n';
  return t;
}, [nombreAsunto, fichero]);
const informes = (p, nombreAsunto) => p.evaluate(async (asunto) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === asunto)[0];
  return (await Carpetas.ficheros(a.handle)).map((f) => f.nombre).filter((n) => / INFORME ACTIVIDAD /.test(n)).sort();
}, nombreAsunto);
async function cerrarCuadro(p) { await p.click('#cuadro-aceptar'); await p.waitForSelector('#capa', { state: 'hidden' }); }

/* ================= 1. LA LÓGICA ================= */
console.log('--- 1. la lógica ---');
await comprobar('1. cambios: quién entra y quién sale',
  pagina.evaluate(() => ActividadesInforme.cambios(['a', 'b', 'd', 'e'], { personas: ['a', 'b', 'c'] })), { mas: ['d', 'e'], menos: ['c'] });
await comprobar('1. el texto del aviso: «2 personas más, 1 menos»',
  pagina.evaluate(() => [ActividadesInforme.textoCambios({ mas: ['d', 'e'], menos: ['c'] }), ActividadesInforme.textoCambios({ mas: [], menos: ['c'] }), ActividadesInforme.textoCambios({ mas: ['x'], menos: [] }), ActividadesInforme.textoCambios({ mas: [], menos: [] })]),
  ['La lista ha cambiado desde el aviso: 2 personas más, 1 menos.', 'La lista ha cambiado desde el aviso: 1 menos.', 'La lista ha cambiado desde el aviso: 1 persona más.', '']);
const d = await pagina.evaluate(async () => {
  const act = Actividades.lista().filter((x) => /Alhambra/.test(x.nombre))[0];
  const todos = await Actividades.alumnadoMatriculado();
  const a = { ficha: { relacionados: App.E.registro.asuntos[act.asunto.nombre].relacionados.concat([{ categoria: 'ALUMNADO', nombre: 'Fantasma Nadie, Pepe 99999' }]) } };
  const r = ActividadesInforme.datos(a, act, todos);
  return { filas: r.filas.map((f) => f[0]), organiza: r.organiza, acompana: r.acompana, total: r.total, unidades: r.unidades.map((u) => [u.titulo, u.nombres.length]), sin: r.sinUnidad,
    ordenados: r.unidades.every((u) => u.nombres.every((n, i) => i === 0 || U.normalizar(u.nombres[i - 1]) <= U.normalizar(n))), natural: /^[A-Za-zÁÉÍÓÚáéíóúñÑ]+ /.test(r.organiza[0]) && r.organiza[0].indexOf(',') === -1 };
});
await comprobar('1. datos: fecha, salida, regreso, lugar y departamento', d.filas, ['Fecha', 'Salida', 'Regreso', 'Lugar', 'Departamento']);
await comprobar('1. datos: dos unidades con «van N de M», alfabéticas', [d.unidades, d.ordenados], [[['2º B · van 4 de 6', 4], ['3º A · van 4 de 4', 4]], true]);
await comprobar('1. datos: quien no está en ninguna unidad va en «Sin unidad», y el total las cuenta', [d.sin, d.total], [['Fantasma Nadie, Pepe'], 9]);
await comprobar('1. datos: «Organiza» (1) y «Acompaña» (2), en orden natural', [d.organiza.length, d.acompana.length, d.natural], [1, 2, true]);
await comprobar('1. los huecos {{ACTIVIDAD…}} se rellenan con la actividad',
  pagina.evaluate(async () => {
    const act = Actividades.lista().filter((x) => /Alhambra/.test(x.nombre))[0];
    const a = App.E.listaAbiertos.filter((x) => x.nombre === act.asunto.nombre)[0];
    const v = await Plantillas.valoresDeAsunto(a);
    const r = Plantillas.rellenar('{{ACTIVIDAD}}|{{ACTIVIDAD FECHAS}}|{{ACTIVIDAD LUGAR}}|{{ACTIVIDAD DEPARTAMENTO}}|{{ACTIVIDAD SALIDA}}|{{ACTIVIDAD REGRESO}}|{{ACTIVIDAD ALUMNADO}}|{{ACTIVIDAD PROFESORADO}}', v);
    return [r.texto.split('|').slice(0, 7), r.texto.split('|')[7].split(', ').length, r.faltan];
  }).then((r) => [r[0][0], /^\d+ de \w+ de \d{4}$/.test(r[0][1]), r[0][2], r[0][3], r[0][4], r[0][5], r[0][6], r[1], r[2]]),
  ['Visita a la Alhambra y al Albaicín', true, 'Granada', 'Geografía e Historia', '08:30', '15:00', '8', 3, []]);
await comprobar('1. sin actividad, los huecos se quedan como «lo que falta»',
  pagina.evaluate(async () => {
    const a = App.E.listaAbiertos.filter((x) => !(x.ficha && x.ficha.actividad))[0];
    return Plantillas.rellenar('{{ACTIVIDAD}}', await Plantillas.valoresDeAsunto(a)).faltan;
  }), ['Nombre de la actividad extraescolar']);

/* ================= 2. LA TARJETA ================= */
console.log('--- 2. la tarjeta ---');
const asunto = await abrirTarjeta(pagina, 'Alhambra');
await comprobar('2. dice «Sin avisar al claustro» y tiene el botón «Avisar al claustro»',
  pagina.evaluate(() => [document.querySelector('#ficha-actividad .act-aviso').textContent, document.getElementById('act-avisar').textContent, document.getElementById('act-avisar').disabled]),
  ['Sin avisar al claustro', 'Avisar al claustro', false]);

/* ================= 3. EL CUADRO DE CORREO ================= */
console.log('--- 3. el cuadro de Correo ---');
await pagina.click('#act-avisar');
await pagina.waitForSelector('#capa:not(.oculto) #correo-cuerpo-texto', { timeout: 30000 });
await pagina.waitForSelector('#adjuntos-lista .correo-fila');
await pagina.waitForTimeout(1500);
const informes1 = await informes(pagina, asunto);
await comprobar('3. hay un informe nuevo con el nombre de siempre (fecha, INFORME ACTIVIDAD, número)', [informes1.length, /^\d{6} INFORME ACTIVIDAD D26-\d+\.pdf$/.test(informes1[0] || '')], [1, true]);
await comprobar('3. el informe está entre los adjuntos y marcado',
  pagina.evaluate((f) => [...document.querySelectorAll('#adjuntos-lista .correo-fila')].filter((r) => r.textContent.indexOf(f) !== -1).map((r) => r.querySelector('.adjunto-marca').checked), informes1[0]), [true]);
await comprobar('3. la plantilla elegida es «Aviso de actividad extraescolar»',
  pagina.evaluate(() => document.getElementById('correo-plantilla').selectedOptions[0].textContent), 'Aviso de actividad extraescolar');
const cuerpo = await pagina.inputValue('#correo-cuerpo-texto');
await comprobar('3. el texto nombra la actividad, su fecha y su lugar, empieza por «Buenas:» y no deja huecos',
  [cuerpo.indexOf('Visita a la Alhambra y al Albaicín') !== -1, /celebra .*\d{4} en Granada/.test(cuerpo), /^Buenas:/.test(cuerpo), /[{}]/.test(cuerpo)], [true, true, true, false]);
await comprobar('3. el asunto del correo', pagina.inputValue('#correo-asunto').then((s) => /^Actividad extraescolar: Visita a la Alhambra y al Albaicín \(.*\d{4}\)$/.test(s)), true);
await comprobar('3. «Para» vacío, y el grupo «Profesorado» en la copia oculta (tres con correo)',
  pagina.evaluate(() => [document.getElementById('correo-otro') ? document.getElementById('correo-otro').value : '', document.getElementById('correo-cco-caja').textContent]).then((r) => [r[0], /motero@correo-demo\.es/.test(r[1]), /puceda@correo-demo\.es/.test(r[1])]),
  ['', true, true]);
await comprobar('3. avisa de la persona que no tiene correo', pagina.evaluate(() => /no tiene correo/.test(document.getElementById('correo-cco-caja').textContent)), true);
await comprobar('3. no hay línea ámbar de «sin grupo»', pagina.evaluate(() => /No hay ningún grupo/.test(document.getElementById('correo-caja').textContent)), false);

await comprobar('3. «Documentos de la carpeta» ya enseña el informe, sin salir de la ficha', pagina.evaluate(() => /INFORME ACTIVIDAD/.test(document.getElementById('ficha-documentos').textContent)), true);

/* ================= 4. EL INFORME ================= */
console.log('--- 4. el informe ---');
const t = await textoPdf(pagina, asunto, informes1[0]);
await comprobar('4. lleva título, actividad, datos, profesorado y alumnado por unidades',
  ['Actividad extraescolar', 'Visita a la Alhambra y al Albaicín', 'Fecha:', 'Lugar:', 'Granada', 'Departamento:', 'Organiza:', 'Acompaña:', 'Alumnado que va: 8', '2º B · van 4 de 6', '3º A · van 4 de 4', 'Página 1 de 1', 'Generado el'].map((x) => t.indexOf(x) !== -1),
  [true, true, true, true, true, true, true, true, true, true, true, true, true]);
await comprobar('4. el tipo de documento INFORME ACTIVIDAD existe y la ficha marca su origen',
  pagina.evaluate(([a, f]) => {
    const docs = App.E.registro.asuntos[a].documentos || {};
    const n = Object.keys(docs).filter((k) => f.indexOf(k) !== -1)[0];
    return [App.E.tiposDocumento.indexOf('INFORME ACTIVIDAD') !== -1, n && docs[n].generadoDe, n && docs[n].tipo];
  }, [asunto, informes1[0]]), [true, 'informe-actividad', 'INFORME ACTIVIDAD']);
await comprobar('4. la plantilla se ha creado una vez, colgada del tipo del asunto',
  pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.filter((p) => p.nombre === 'Aviso de actividad extraescolar').map((p) => p.tipo)), ['ACTIVIDAD EXTRAESCOLAR']);

/* ================= 5. ENVIAR ================= */
console.log('--- 5. enviar ---');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('.mensaje.bueno:has-text("Correo enviado a")');
await pagina.waitForTimeout(1200);
await cerrarCuadro(pagina);
await pagina.waitForTimeout(1200);
const hoyCorto = await pagina.evaluate(() => Actividades.fechaCorta(U.hoyIso()));
await comprobar('5. la tarjeta dice «Aviso enviado el …» con la fecha de hoy',
  pagina.evaluate(() => { const c = document.getElementById('ficha-actividad'); return c ? c.querySelector('.act-aviso').textContent : null; }), 'Aviso enviado el ' + hoyCorto);
await comprobar('5. el aviso queda apuntado: quién, el informe y las ocho personas',
  pagina.evaluate((a) => { const l = App.E.registro.asuntos[a].avisosActividad || []; return [l.length, l[0] && l[0].personas.length, l[0] && / INFORME ACTIVIDAD /.test(l[0].documento), l[0] && !!l[0].quien]; }, asunto), [1, 8, true, true]);
await comprobar('5. sin cambios, el botón sigue siendo «Avisar al claustro» y no hay ámbar',
  pagina.evaluate(() => [document.getElementById('act-avisar').textContent, !!document.querySelector('#ficha-actividad .act-aviso-cambio')]), ['Avisar al claustro', false]);

/* ================= 6. LA LISTA CAMBIA ================= */
console.log('--- 6. la lista cambia ---');
await pagina.evaluate(async (n) => {
  const r = App.E.registro.asuntos[n].relacionados.filter((x) => x.categoria === 'ALUMNADO')[0];
  await App.anotarLista(n, 'relacionados', { quitar: [{ categoria: r.categoria, nombre: r.nombre }] });
  App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto');
}, asunto);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => FichaTarjetas.abrir('actividad'));
await pagina.waitForSelector('#act-avisar');
await pagina.waitForTimeout(800);
await comprobar('6. aviso ámbar «La lista ha cambiado desde el aviso: 1 menos.» y el botón «Volver a avisar»',
  pagina.evaluate(() => [document.querySelector('#ficha-actividad .act-aviso-cambio').textContent, document.getElementById('act-avisar').textContent, document.querySelector('#ficha-actividad .act-aviso-cambio').classList.contains('aviso-ambar')]),
  ['La lista ha cambiado desde el aviso: 1 menos.', 'Volver a avisar', true]);
await pagina.click('#act-avisar');
await pagina.waitForSelector('#capa:not(.oculto) #correo-cuerpo-texto', { timeout: 30000 });
await pagina.waitForSelector('#adjuntos-lista .correo-fila');
await pagina.waitForTimeout(1200);
const informes2 = await informes(pagina, asunto);
const nuevoInforme = informes2.filter((n) => informes1.indexOf(n) === -1);
const cuerpo2 = await pagina.inputValue('#correo-cuerpo-texto');
await comprobar('6. el texto empieza por «Este aviso sustituye al enviado el …»', cuerpo2.indexOf('Este aviso sustituye al enviado el ' + hoyCorto + '.') === 0, true);
await comprobar('6. el informe marcado es uno nuevo, sin la persona que ya no va',
  Promise.all([pagina.evaluate((f) => [...document.querySelectorAll('#adjuntos-lista .correo-fila')].filter((r) => r.querySelector('.adjunto-marca').checked).map((r) => r.textContent.indexOf(f) !== -1), nuevoInforme[0]), nuevoInforme.length, textoPdf(pagina, asunto, nuevoInforme[0]).then((x) => x.indexOf('Alumnado que va: 7') !== -1)]),
  [[true], 1, true]);
await cerrarCuadro(pagina);

/* ================= 7. AJUSTES Y SIN GRUPO ================= */
console.log('--- 7. el grupo que lo recibe ---');
await pagina.evaluate(() => { App.ir('ajustes'); if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('centro'); });
await pagina.waitForSelector('#bloque-aviso-actividades');
await pagina.evaluate(() => { document.getElementById('bloque-aviso-actividades').open = true; });
await comprobar('7. Ajustes → El centro tiene la sección y el desplegable «Grupo que lo recibe»',
  pagina.evaluate(() => [document.querySelector('#bloque-aviso-actividades .bloque-titulo').textContent, document.querySelector('label[for="grupo-aviso-actividades"]').textContent, [...document.querySelectorAll('#grupo-aviso-actividades option')].map((o) => o.textContent).filter((x) => x === 'Profesorado').length]),
  ['Aviso de actividades extraescolares', 'Grupo que lo recibe', 1]);
await comprobar('7. el buscador de Ajustes la encuentra con «actividades»',
  pagina.evaluate(async () => {
    const c = document.getElementById('ajustes-buscar') || document.querySelector('.ajustes-buscador input');
    if (!c) return 'sin buscador';
    c.value = 'actividades'; c.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    return [...document.querySelectorAll('.ajustes-resultado')].some((x) => /Aviso de actividades extraescolares/.test(x.textContent));
  }), true);
await pagina.evaluate(async () => { const c = document.getElementById('ajustes-buscar') || document.querySelector('.ajustes-buscador input'); if (c) { c.value = ''; c.dispatchEvent(new Event('input', { bubbles: true })); } });
const otro = await pagina.evaluate(async () => {
  const g = await Grupos.crear('Equipo de pruebas', [{ categoria: 'PERSONAL', nombre: Grupos.lista().filter((x) => x.nombre === 'Profesorado')[0].miembros[0].nombre }]);
  const id = (g && g.id) || Grupos.lista().filter((x) => x.nombre === 'Equipo de pruebas')[0].id;
  App.pintarAjustesCentro && await App.pintarAjustesCentro();
  return id;
});
await pagina.selectOption('#grupo-aviso-actividades', otro);
await pagina.waitForFunction((id) => App.E.registro.ajustesAvisos && App.E.registro.ajustesAvisos.grupoActividades === id, otro, { timeout: 10000 });
await comprobar('7. el grupo elegido gana al que se llama «Profesorado»', pagina.evaluate(() => ActividadesInforme.grupoDeAviso().nombre), 'Equipo de pruebas');
await pagina.evaluate(async () => { await App.guardarRegistroFresco((r) => { r.ajustesAvisos.grupoActividades = ''; }); });
await comprobar('7. sin elegir, vale «Profesorado»', pagina.evaluate(() => ActividadesInforme.grupoDeAviso().nombre), 'Profesorado');
await pagina.evaluate(async () => { await Copias.guardar(App.E.gestor, 'grupos.json', { grupos: [] }); await Grupos.cargar(); });   /* sin ningún grupo (Grupos.borrar no basta: guardar() vuelve a sumar lo que queda en el disco) */
await abrirTarjeta(pagina, 'Alhambra');
await pagina.click('#act-avisar');
await pagina.waitForSelector('#capa:not(.oculto) #correo-cuerpo-texto', { timeout: 30000 });
await pagina.waitForTimeout(1200);
await comprobar('7. sin grupo: línea ámbar con su enlace y la copia oculta vacía',
  pagina.evaluate(() => { const l = document.querySelector('#correo-caja .aviso-ambar'); return [l && l.textContent.indexOf('No hay ningún grupo con el profesorado. Créalo en Ajustes → Grupos de personas.') === 0, l && l.querySelector('button.enlace') && l.querySelector('button.enlace').textContent, document.getElementById('correo-cco-caja').textContent.trim()]; }),
  [true, 'Ir a Grupos de personas', '']);
await pagina.click('#correo-caja .aviso-ambar button.enlace');
await pagina.waitForTimeout(800);
await comprobar('7. el enlace cierra el cuadro y lleva a Ajustes con «Grupos de personas» a la vista',
  pagina.evaluate(() => [document.getElementById('capa').classList.contains('oculto'), !document.getElementById('pantalla-ajustes').classList.contains('oculto')]), [true, true]);

/* ================= 8. ANULADA Y SOLO CONSULTA ================= */
console.log('--- 8. anulada y solo consulta ---');
await abrirTarjeta(pagina, 'Sierra');
await comprobar('8. en la actividad anulada, el botón está apagado', pagina.evaluate(() => document.getElementById('act-avisar').disabled), true);
const consulta = await nueva("try { if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); } } catch (e) {}");
await consulta.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
await consulta.waitForTimeout(3000);
await abrirTarjeta(consulta, 'Alhambra');
await comprobar('8. en solo consulta el botón está apagado y no se ha escrito nada', consulta.evaluate(() => [document.getElementById('act-avisar').disabled, Demo.escrituras()]), [true, 0]);
await consulta.close();

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' COMPROBACIONES FALLAN'); process.exit(1); }
console.log('\nTodas las pruebas del aviso al claustro pasan.');
