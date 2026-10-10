/* Fila 311 (docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md): el certificado de actividades extraescolares del profesorado.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Sin pantalla: `filasDe` deja fuera la prevista, la anulada y la de la papelera; une por DNI y, sin DNI, por nombre;
      quien figura dos veces sale una vez y manda «Organización»; `entre` con las dos fechas, con una y con ninguna;
      la columna Horas solo si alguna fila las tiene; `periodoDe`.
   2. La tabla de datos y la ficha: sale en «Tablas de datos» y en la ficha del profesor.
   3. El Word generado: tabla con «Organización» y «Acompañante», orden por fecha, el periodo, persona sin actividades.
   4. La pasada crea el tipo con sus dos campos y su plantilla una sola vez. */
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

/* ================= 1. SIN PANTALLA ================= */
console.log('--- 1. filas, entre, columnas, periodo ---');
const p1 = await pagina.evaluate(() => {
  const hoy = '2026-10-10';
  const A = [
    { id: 'a', nombre: 'Viaje a Cádiz', inicio: '2025-03-10', fin: '2025-03-12', lugar: 'Cádiz', departamento: 'Historia', horas: 12.5, antigua: true,
      profesorado: [{ nombre: 'Otero Campos, Marta 344A', clave: '11223344', papel: 'organiza' }, { nombre: 'Salas Pérez, Rosario', clave: 'perez salas rosario', papel: 'acompana' }] },
    { id: 'b', nombre: 'Museo', inicio: '2026-09-20', fin: '2026-09-20', lugar: 'Madrid', departamento: 'Ciencias',
      profesorado: [{ nombre: 'Otero Campos, Marta 344A', clave: '11223344', papel: 'acompana' }, { nombre: 'Otero Campos, Marta 344A', clave: '11223344', papel: 'organiza' }] },
    { id: 'c', nombre: 'Prevista', inicio: '2026-10-20', fin: '2026-10-20', profesorado: [{ nombre: 'Otero Campos, Marta', clave: '11223344', papel: 'organiza' }] },
    { id: 'd', nombre: 'Anulada', inicio: '2026-09-01', fin: '2026-09-01', anulada: true, profesorado: [{ nombre: 'Otero Campos, Marta', clave: '11223344', papel: 'organiza' }] },
    { id: 'e', nombre: 'Papelera', inicio: '2026-09-02', fin: '2026-09-02', enPapelera: true, profesorado: [{ nombre: 'Otero Campos, Marta', clave: '11223344', papel: 'organiza' }] }
  ];
  const filas = ActividadesTabla.filasDe(A, hoy);
  const otero = filas.filter((f) => f.clave === '11223344');
  const ids = (x) => x.map((f) => f.actividad).join('|');
  return {
    quien: filas.map((f) => f.actividad + ':' + (f.clave || f.claveNombre)),
    oteroPapeles: otero.map((f) => f.actividad + ':' + f.papel),
    soloNombre: filas.filter((f) => f.soloNombre).map((f) => f.nombre),
    claveNombre: ActividadesTabla._nombreLimpio('Otero Campos, Marta 344A'),
    ambas: ids(ActividadesTabla.entre(filas, '2025-03-11', '2026-09-30')), desde: ids(ActividadesTabla.entre(filas, '2026-01-01', '')),
    hasta: ids(ActividadesTabla.entre(filas, '', '2025-12-31')), ninguna: ids(ActividadesTabla.entre(filas, '', '')),
    incluidas: ids(ActividadesTabla.entre(filas, '2025-03-10', '2026-09-20')),
    colsConHoras: ActividadesTabla.columnasPara(filas), colsSinHoras: ActividadesTabla.columnasPara(filas.filter((f) => f.actividad === 'Museo')),
    celdas: ActividadesTabla.celdas(filas[0], ['Fecha', 'Actividad', 'Lugar', 'Participación', 'Horas']),
    celdasMuseo: ActividadesTabla.celdas(filas.filter((f) => f.actividad === 'Museo')[0], ['Fecha', 'Participación', 'Horas']),
    p1: ActividadesTabla.periodoDe({ campos: { 'Actividades desde': '01/09/2021', 'Actividades hasta': '30/06/2026' } }),
    p2: ActividadesTabla.periodoDe({ campos: { 'Actividades desde': '2021-09-01' } }), p3: ActividadesTabla.periodoDe({ campos: { 'Actividades hasta': '30/06/2026' } }),
    p4: ActividadesTabla.periodoDe({ campos: {} })
  };
});
await comprobar('1. solo las que cuentan, una fila por profesor y actividad (por DNI y, sin DNI, por nombre)', p1.quien, ['Viaje a Cádiz:11223344', 'Viaje a Cádiz:perez rosario salas', 'Museo:11223344']);
await comprobar('1. quien figura dos veces sale una vez y manda «Organización»', p1.oteroPapeles, ['Viaje a Cádiz:organiza', 'Museo:organiza']);
await comprobar('1. solo la de sin DNI queda marcada «solo por el nombre»', p1.soloNombre, ['Salas Pérez, Rosario']);
await comprobar('1. el nombre sin el trozo del documento', p1.claveNombre, 'Otero Campos, Marta');
await comprobar('1. entre: dos fechas, una, ninguna, y las dos incluidas', [p1.ambas, p1.desde, p1.hasta, p1.ninguna, p1.incluidas],
  ['Museo', 'Museo', 'Viaje a Cádiz|Viaje a Cádiz', 'Viaje a Cádiz|Viaje a Cádiz|Museo', 'Viaje a Cádiz|Viaje a Cádiz|Museo']);
await comprobar('1. la columna Horas solo si alguna fila las tiene', [p1.colsConHoras, p1.colsSinHoras],
  [['Fecha', 'Actividad', 'Lugar', 'Participación', 'Horas'], ['Fecha', 'Actividad', 'Lugar', 'Participación']]);
await comprobar('1. las celdas: fecha de varios días, participación y horas a la española', [p1.celdas, p1.celdasMuseo],
  [['10/03/2025 a 12/03/2025', 'Viaje a Cádiz', 'Cádiz', 'Organización', '12,5'], ['20/09/2026', 'Organización', '']]);
await comprobar('1. el periodo', [p1.p1, p1.p2, p1.p3, p1.p4], [', entre el 1 de septiembre de 2021 y el 30 de junio de 2026', ', desde el 1 de septiembre de 2021', ', hasta el 30 de junio de 2026', '']);

/* ================= 2. LA TABLA DE DATOS Y LA FICHA ================= */
console.log('--- 2. tablas de datos y ficha ---');
const l2 = await pagina.evaluate(async () => { TablasDatos.olvidar(); const l = await TablasDatos.lista(); return l.tablas.filter((t) => t.nombre === 'ACTIVIDADES EXTRAESCOLARES').map((t) => [t.nombre, t.filas > 0, t.origen]); });
await comprobar('2. sale en la lista de tablas, con filas y diciendo que viene del registro', l2, [['ACTIVIDADES EXTRAESCOLARES', true, 'actividades']]);
const pant = await pagina.evaluate(async () => { App.ir('herramientas'); await TablasDatosPantalla.pintar(); const t = document.getElementById('tablas-datos-lista').textContent; return [/ACTIVIDADES EXTRAESCOLARES/.test(t), /sale de las actividades extraescolares/.test(t)]; });
await comprobar('2. el bloque «Tablas de datos» la enseña y dice de dónde sale', pant, [true, true]);
const ficha = await pagina.evaluate(async () => {
  const personal = (await Datos.cargar(App.E.datos, 'PERSONAL')).lista.filter((x) => x.nombre.indexOf('Otero Campos') !== -1)[0];
  const caja = document.createElement('div'); caja.innerHTML = '<div class="ficha-bloque"></div>'; document.body.appendChild(caja);
  await TablasDatosPantalla.pintarEnFicha(caja, personal);
  const d = caja.querySelector('.tablas-en-ficha');
  const r = d ? Array.from(d.querySelectorAll('.tablas-ficha-tabla')).map((t) => [t.querySelector('.suave').textContent, t.querySelectorAll('tr').length - 1]) : null;
  caja.remove();
  return r;
});
await comprobar('2. la ficha del profesor lleva «Actividades extraescolares» con sus tres realizadas (no la prevista ni la anulada)', ficha && ficha.filter((x) => x[0] === 'Actividades extraescolares'), [['Actividades extraescolares', 3]]);

/* ================= 3. EL WORD ================= */
console.log('--- 3. el Word generado ---');
const r3 = await pagina.evaluate(async () => {
  const buffer = new Uint8Array(await (await fetch('plantillas/certificado-actividades-extraescolares.docx')).arrayBuffer());
  const original = window.FichaTercero.datosBasicos;
  async function generar(persona, campos) {
    window.FichaTercero.datosBasicos = async () => ({ persona: persona, categoria: 'PERSONAL' });
    const valores = { centro: 'IES de Prueba', campos: campos || {} };
    const prep = await TablasDatos.prepararDocumento(buffer, { nombre: 'x', ficha: {} }, valores);
    let res = await Docx.rellenar(prep.buffer, valores);
    res = await TablasDatos.resaltarResultado(res, prep.faltan);
    const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
    return { xml, faltan: res.faltan };
  }
  const celdas = (xml) => ((xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/) || [''])[0].match(/<w:tr>[\s\S]*?<\/w:tr>/g) || []).map((tr) =>
    (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map((tc) => (tc.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
  const personal = (await Datos.cargar(App.E.datos, 'PERSONAL')).lista;
  const otero = personal.filter((x) => x.nombre.indexOf('Otero Campos') !== -1)[0];
  const todas = await generar(otero);
  const hoy = U.hoyIso();
  const desde = await generar(otero, { 'Actividades desde': '01/01/2026' });
  const entre = await generar(otero, { 'Actividades desde': '01/01/2026', 'Actividades hasta': '31/12/2026' });
  const nadie = await generar({ nombre: 'Nadie Inventado, Pepe', documento: '' });
  /* Sin horas apuntadas en ninguna. */
  const guardadas = Actividades.lista().map((a) => [a.id, a.horas]);
  await Actividades.cambiar((d) => { d.actividades.forEach((a) => { a.horas = null; }); });
  const sinHoras = await generar(otero);
  await Actividades.cambiar((d) => { d.actividades.forEach((a) => { const g = guardadas.filter((x) => x[0] === a.id)[0]; if (g) a.horas = g[1]; }); });
  window.FichaTercero.datosBasicos = original;
  return {
    todas: celdas(todas.xml), desde: celdas(desde.xml), entre: celdas(entre.xml), sinHoras: celdas(sinHoras.xml),
    textoTodas: /C E R T I F I C A/.test(todas.xml) && /actividades complementarias y extraescolares organizadas por este centro:/.test(todas.xml.replace(/<[^>]+>/g, '')),
    textoDesde: /organizadas por este centro, desde el 1 de enero de 2026:/.test(desde.xml.replace(/<[^>]+>/g, '')),
    textoEntre: /organizadas por este centro, entre el 1 de enero de 2026 y el 31 de diciembre de 2026:/.test(entre.xml.replace(/<[^>]+>/g, '')),
    huecos: /TABLA ACTIVIDADES|ACTIVIDADES PERIODO/.test(todas.xml),
    nadieFaltan: nadie.faltan, nadieTexto: /\[falta: Actividades extraescolares\]/.test(nadie.xml), nadieAmarillo: /<w:highlight w:val="yellow"\/>/.test(nadie.xml)
  };
});
await comprobar('3. el texto de la plantilla, sin huecos sin resolver y sin periodo', [r3.textoTodas, r3.huecos], [true, false]);
await comprobar('3. cabecera (con Horas, porque la demostración las trae) y solo lo realizado, de la más antigua a la más reciente',
  r3.todas.map((f, i) => i === 0 ? f : [f[1], f[3], f[4]]),
  [['Fecha', 'Actividad', 'Lugar', 'Participación', 'Horas'], ['Taller de robótica en el CEIP', 'Acompañante', '4'], ['Viaje a Cádiz de 4º de ESO', 'Organización', '12'], ['Visita al Parque de las Ciencias', 'Acompañante', '6']]);
await comprobar('3. de la más antigua a la más reciente', r3.todas.slice(1).map((f) => f[0]), r3.todas.slice(1).map((f) => f[0]).slice().sort((a, b) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join(''))));
await comprobar('3. ni la prevista ni la anulada', r3.todas.some((f) => /Alhambra|Grazalema/.test(f.join(' '))), false);
await comprobar('3. «Actividades desde»: la antigua ya no sale y el texto dice «desde el …»', [r3.desde.length - 1, r3.desde.slice(1).some((f) => /Cádiz|robótica/.test(f.join(' '))), r3.textoDesde], [1, false, true]);
await comprobar('3. «desde» y «hasta»: «entre el … y el …»', [r3.entre.length - 1, r3.textoEntre], [1, true]);
await comprobar('3. si ninguna fila tiene horas, la tabla no lleva la columna Horas', [r3.sinHoras[0].length, r3.sinHoras[0].indexOf('Horas')], [4, -1]);
await comprobar('3. una persona sin actividades: «[falta: Actividades extraescolares]» en amarillo y en «faltan»', [r3.nadieTexto, r3.nadieAmarillo, r3.nadieFaltan.indexOf('Actividades extraescolares') !== -1], [true, true, true]);

/* ================= 4. LA PASADA DEL TIPO ================= */
console.log('--- 4. la pasada crea el tipo una sola vez ---');
const r4 = await pagina.evaluate(async () => {
  const T = ActividadesTabla.TIPO;
  App.E.tipos.splice(0, App.E.tipos.length, ...App.E.tipos.filter((t) => t.tipo !== T));
  await App.guardarTipos();
  await Actividades.cambiar((d) => { d.certMarcado = false; });
  const antes = (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.tipo === T).length;
  const uno = await ActividadesTabla.pasada();
  const tipos1 = App.E.tipos.filter((t) => t.tipo === T).length;
  const campos = ((App.E.campos.porTipo || {})[T] || []).map((c) => Campos.nombreDeCampo(c, App.E.campos));
  const clases = ((App.E.campos.porTipo || {})[T] || []).map((c) => Campos.claseDeCampo(c, App.E.campos));
  const dos = await ActividadesTabla.pasada();
  const despues = (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.tipo === T);
  return { creado: !!uno, tipos1, categoria: uno && uno.categoria, corto: uno && uno.nombreCorto, campos, clases, segunda: dos, tipos2: App.E.tipos.filter((t) => t.tipo === T).length,
    plantillasAntes: antes, plantillasDespues: despues.length, plantilla: despues[0] && [despues[0].nombre, despues[0].tipoDocumento, despues[0].firmante, despues[0].vistoBueno], marcado: Actividades.certMarcado() };
});
await comprobar('4. crea el tipo (PERSONAL, nombre corto CertActExtra) con sus dos campos de clase Fecha', [r4.creado, r4.tipos1, r4.categoria, r4.corto, r4.campos, r4.clases],
  [true, 1, 'PERSONAL', 'CertActExtra', ['Actividades desde', 'Actividades hasta'], ['fecha', 'fecha']]);
await comprobar('4. cuelga su plantilla, de Secretaría con el V.º B.º de Dirección', [r4.plantillasDespues, r4.plantilla], [1, ['Certificado de actividades extraescolares', 'CERTIFICADO', 'secretaria', 'direccion']]);
await comprobar('4. una segunda pasada no hace nada', [r4.segunda, r4.tipos2, r4.marcado], [null, 1, true]);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' COMPROBACIONES FALLAN'); process.exit(1); }
console.log('\nTodas las comprobaciones del certificado de actividades pasan.');
