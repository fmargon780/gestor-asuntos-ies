/* Prueba de la fila 238 de docs/COLA.md (docs/CERTIFICADO-CONSEJO-ESCOLAR.md):
   la tabla CONSEJO ESCOLAR, el botón para subir los CSV, el hueco
   {{TABLA CONSEJO ESCOLAR}} y {{DNI}} con el campo de reserva. En navegador de
   verdad (hace falta Docx). Todo con nombres inventados.

     1. Leer un CSV de Séneca: columnas por su título (Cese antes que
        Nombramiento, HTML pegado), cargo del paréntesis del miembro y del
        sector, mayúsculas a tipo título.
     2. Unir ficheros: un nombramiento repetido es una sola fila, el cese del
        fichero más reciente, miembros natos con sus periodos y los tres avisos.
     3. Leer de la carpeta de datos (con prefijo de números) y unir a la persona
        por el nombre (Mª = María; dos personas parecidas no se mezclan).
     4. El Word: tabla de cuatro columnas, «Hasta la actualidad», cese que falta
        en amarillo y en «faltan», miembro nato, y persona sin ninguna fila.
     5. Subir ficheros con el botón: uno que no es del Consejo, aviso ámbar y no
        se copia; uno bueno se copia con su nombre limpio; repetido, pregunta.
     6. {{DNI}} sin documento en el tercero: el campo «DNI para el certificado». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Los ficheros de mentira. 2024-2025 trae Cese antes que Nombramiento. */
const F2425 = [
  'Sector;Miembro;Cese;"Nombramiento<font class=""asterisco""> *</font>"',
  'Profesorado;OTERO CAMPOS, MARÍA;;15/10/2022',
  'Profesorado;Reyes Palma, Fernando;30/06/2025;15/10/2021',
  'Equipo Directivo;Uceda Molina, Patricia (DIRECTOR/A);;',
  'Padres y madres;Ponce Duarte, Rocío (REPRESENTANTE DE LA A.M.P.A. MAYORITARIA);;01/11/2023',
  'Fomento Igualdad;Reyes Palma, Fernando (IMPULSOR DE MEDIDAS DE IGUALDAD);;01/10/2024',
  'Profesorado;Sellés Manzanares, Rosa Carmen;;01/10/2024', ''
].join('\r\n');
const F2526 = [
  'Sector;Miembros;"Nombramiento<font class=""asterisco""> *</font>";Cese',
  'Profesorado;Otero Campos, Mª;15/10/2022;',
  'Profesorado (Impulsor de medidas de Igualdad);Otero Campos, Mª;01/10/2025;',
  'Equipo Directivo;Uceda Molina, Patricia (DIRECTOR/A);;',
  'Profesorado;Selles Manzanares, Miguel Isidro;01/10/2025;', ''
].join('\r\n');

/* ---------- 1. leer un fichero ---------- */
console.log('--- 1. leer un CSV de Séneca ---');
const r1 = await pagina.evaluate(([t]) => TablasDatosConsejo.leerTexto(t, 'RegMieConEsc 2024-2025.csv'), [F2425]);
await comprobar('1. lo reconoce, con su periodo y seis filas', Promise.resolve([r1.ok, r1.periodo, r1.filas.length]), [true, '2024-2025', 6]);
await comprobar('1. fechas en su columna aunque Cese vaya antes; mayúsculas a tipo título',
  Promise.resolve(r1.filas.slice(0, 2)), [
    { apellidos: 'Otero Campos', nombre: 'María', sector: 'Profesorado', cargo: '', desde: '2022-10-15', hasta: '' },
    { apellidos: 'Reyes Palma', nombre: 'Fernando', sector: 'Profesorado', cargo: '', desde: '2021-10-15', hasta: '2025-06-30' }]);
await comprobar('1. el cargo, del paréntesis del miembro y en frase',
  Promise.resolve(r1.filas.slice(2, 5).map((f) => [f.sector, f.cargo])), [
    ['Equipo Directivo', 'Director/a'], ['Padres y madres', 'Representante de la a.m.p.a. mayoritaria'],
    ['Fomento Igualdad', 'Impulsor de medidas de igualdad']]);
const r1b = await pagina.evaluate(([t]) => TablasDatosConsejo.leerTexto(t, 'x.csv'), [F2526]);
await comprobar('1. el cargo del sector, y «Miembros» también vale',
  Promise.resolve([r1b.ok, r1b.filas[1].sector, r1b.filas[1].cargo]), [true, 'Profesorado', 'Impulsor de medidas de Igualdad']);
await comprobar('1. un CSV de otra cosa no vale',
  pagina.evaluate(() => { const r = TablasDatosConsejo.leerTexto('Nombre;DNI\r\nAna;1\r\n', 'otro.csv'); return [r.ok, r.motivo]; }),
  [false, 'No trae las columnas Sector, Miembro, Nombramiento y Cese.']);
await comprobar('1. nombres de fichero: con prefijo, y el periodo',
  pagina.evaluate(() => [TablasDatosConsejo.esFicheroDelConsejo('1234_RegMieConEsc_2024-2025.csv'),
    TablasDatosConsejo.esFicheroDelConsejo('RegAlum.csv'), TablasDatosConsejo.periodoDe('1234567_RegMieConEsc_2024-2025.csv'),
    TablasDatosConsejo.nombreLimpio('1234_RegMieConEsc_2024-2025.csv')]),
  [true, false, '2024-2025', 'RegMieConEsc 2024-2025.csv']);

/* ---------- 2. unir ---------- */
console.log('--- 2. unir los ficheros ---');
const u = await pagina.evaluate(([a, b]) => {
  const x = TablasDatosConsejo.leerTexto(a, 'a'), y = TablasDatosConsejo.leerTexto(b, 'b');
  const r = TablasDatosConsejo.unir([{ fichero: 'RegMieConEsc 2025-2026.csv', periodo: '2025-2026', filas: y.filas },
    { fichero: 'RegMieConEsc 2024-2025.csv', periodo: '2024-2025', filas: x.filas }]);
  return { periodos: r.periodos, avisos: r.avisos,
    filas: r.filas.map((f) => [f.apellidos, f.sector, f.cargo, f.desde, f.hasta, f.periodos.join('+'), f.nato, f.reciente]) };
}, [F2425, F2526]);
await comprobar('2. periodos en orden', Promise.resolve(u.periodos), ['2024-2025', '2025-2026']);
await comprobar('2. el mismo nombramiento (María, 15/10/2022) en dos ficheros es una sola fila, en los dos periodos',
  Promise.resolve(u.filas.filter((f) => f[0] === 'Otero Campos' && f[3] === '2022-10-15')), [
    ['Otero Campos', 'Profesorado', '', '2022-10-15', '', '2024-2025+2025-2026', false, true]]);
await comprobar('2. el miembro nato, con sus periodos y sin fechas',
  Promise.resolve(u.filas.filter((f) => f[0] === 'Uceda Molina')), [
    ['Uceda Molina', 'Equipo Directivo', 'Director/a', '', '', '2024-2025+2025-2026', true, true]]);
await comprobar('2. un nombramiento antiguo sin cese: no es del Consejo más reciente',
  Promise.resolve(u.filas.filter((f) => f[0] === 'Ponce Duarte').map((f) => [f[4], f[7]])), [['', false]]);
await comprobar('2. ordenadas por fecha (los natos, por el primer curso)',
  Promise.resolve(u.filas.map((f) => f[3] || ('nato ' + f[5].slice(0, 4)))),
  ['2021-10-15', '2022-10-15', '2023-11-01', 'nato 2024', '2024-10-01', '2024-10-01', '2025-10-01', '2025-10-01']);
await comprobar('2. sin avisos si todo cuadra', Promise.resolve(u.avisos), []);
await comprobar('2. dos ficheros de periodos distintos con el mismo contenido: un aviso (y las fechas que ya no caben en 2023-2024)',
  pagina.evaluate((a) => {
    const x = TablasDatosConsejo.leerTexto(a, 'a');
    return TablasDatosConsejo.unir([{ fichero: 'RegMieConEsc 2023-2024.csv', periodo: '2023-2024', filas: x.filas },
      { fichero: 'RegMieConEsc 2024-2025.csv', periodo: '2024-2025', filas: x.filas }]).avisos;
  }, F2425),
  ['«RegMieConEsc 2023-2024.csv»: 2 nombramientos tienen una fecha posterior al periodo 2023-2024.',
   '«RegMieConEsc 2024-2025.csv» tiene el mismo contenido que «RegMieConEsc 2023-2024.csv», de otro periodo.']);
await comprobar('2. un nombramiento posterior al periodo del fichero y ceses distintos según el fichero',
  pagina.evaluate(() => {
    const f = (d, h) => [{ apellidos: 'Pérez', nombre: 'Ana', sector: 'Profesorado', cargo: '', desde: d, hasta: h }];
    const r = TablasDatosConsejo.unir([{ fichero: 'a.csv', periodo: '2022-2023', filas: f('2022-10-01', '2023-06-01') },
      { fichero: 'b.csv', periodo: '2023-2024', filas: f('2022-10-01', '2023-07-01').concat(f('2024-09-15', '')) }]);
    return [r.filas.length, r.filas[0].hasta, r.avisos];
  }),
  [2, '2023-07-01', ['«b.csv»: 1 nombramiento tiene una fecha posterior al periodo 2023-2024.',
    'Un mismo nombramiento sale con ceses distintos según el fichero; vale el del más reciente.']]);

/* ---------- 3. de la carpeta de datos ---------- */
console.log('--- 3. leer de la carpeta de datos y unir a la persona ---');
await pagina.evaluate(async ([a, b]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const datos = await g.getDirectoryHandle('datos', { create: true });
  const tablas = await datos.getDirectoryHandle('Tablas', { create: true });
  async function poner(dir, n, t) { const h = await dir.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(new Blob([t])); await w.close(); }
  await poner(datos, '9912_RegMieConEsc_2024-2025.csv', a);   /* con prefijo, en la carpeta de datos */
  await poner(tablas, 'RegMieConEsc 2025-2026.csv', b);
}, [F2425, F2526]);
const l3 = await pagina.evaluate(async () => { TablasDatos.olvidar(); return await TablasDatos.lista(); });
await comprobar('3. una sola tabla, con los dos periodos y sus ficheros',
  Promise.resolve(l3.tablas.map((t) => [t.nombre, t.cursos, t.ficheros.length])), [['CONSEJO ESCOLAR', ['2024-2025', '2025-2026'], 2]]);
await comprobar('3. sin tabla suelta por el nombre del fichero y sin errores de lectura',
  Promise.resolve(l3.errores.filter((e) => e.fichero !== 'Consejo Escolar')), []);
const por = (nombre) => pagina.evaluate(async (n) => (await TablasDatos.filasDe('CONSEJO ESCOLAR', { nombre: n })).map((f) => f.sector + '|' + f.cargo), nombre);
await comprobar('3. «Otero Campos, María» (y «Mª») salen por el nombre, sin importar el orden',
  por('María Otero Campos'), ['Profesorado|', 'Profesorado|Impulsor de medidas de Igualdad']);
await comprobar('3. dos personas parecidas no se mezclan', Promise.all([por('Sellés Manzanares, Rosa Carmen'), por('Selles Manzanares, Miguel Isidro')]),
  [['Profesorado|'], ['Profesorado|']]);
await comprobar('3. una persona que no está, sin filas', por('Nadie Inventado, Pepe'), []);

/* ---------- 4. el Word ---------- */
console.log('--- 4. {{TABLA CONSEJO ESCOLAR}} en el certificado ---');
const r4 = await pagina.evaluate(async () => {
  const buffer = new Uint8Array(await (await fetch('plantillas/certificado-miembro-consejo-escolar.docx')).arrayBuffer());
  async function generar(persona) {
    window.FichaTercero.datosBasicos = async () => ({ persona: persona, categoria: 'PERSONAL' });
    const valores = { centro: 'IES de Prueba' };
    const prep = await TablasDatos.prepararDocumento(buffer, { nombre: 'x', ficha: {} }, valores);
    let res = await Docx.rellenar(prep.buffer, valores);
    res = await TablasDatos.resaltarResultado(res, prep.faltan);
    const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
    return { xml, faltan: res.faltan };
  }
  const celdas = (xml) => ((xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/) || [''])[0].match(/<w:tr>[\s\S]*?<\/w:tr>/g) || []).map((tr) =>
    (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map((tc) => (tc.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
  const maria = await generar({ nombre: 'Otero Campos, María', documento: '11223344A' });
  const ponce = await generar({ nombre: 'Ponce Duarte, Rocío', documento: '' });
  const uceda = await generar({ nombre: 'Uceda Molina, Patricia', documento: '33445566C' });
  const nadie = await generar({ nombre: 'Nadie Inventado, Pepe', documento: '' });
  return {
    maria: celdas(maria.xml), mariaFaltan: maria.faltan,
    ponce: celdas(ponce.xml), ponceFaltan: ponce.faltan, ponceAmarillo: /<w:highlight w:val="yellow"\/><\/w:rPr><w:t xml:space="preserve">\[falta: Cese\]<\/w:t>/.test(ponce.xml),
    uceda: celdas(uceda.xml),
    nadieFaltan: nadie.faltan, nadieTexto: /\[falta: Consejo Escolar\]/.test(nadie.xml),
    textos: /C E R T I F I C A/.test(maria.xml) && /miembro del Consejo Escolar de este centro/.test(maria.xml),
    huecoQueda: /TABLA CONSEJO ESCOLAR/.test(maria.xml)
  };
});
await comprobar('4. el texto de la plantilla y el hueco resuelto', Promise.resolve([r4.textos, r4.huecoQueda]), [true, false]);
await comprobar('4. María: cabecera de cuatro columnas y una fila por nombramiento (el repetido, una vez)',
  Promise.resolve(r4.maria.slice(0, 3)), [['Sector', 'Cargo', 'Nombramiento', 'Cese'],
    ['Profesorado', '', '15/10/2022', 'Hasta la actualidad'],
    ['Profesorado', 'Impulsor de medidas de Igualdad', '01/10/2025', 'Hasta la actualidad']]);
await comprobar('4. nada falta en María', Promise.resolve(r4.mariaFaltan.filter((f) => f === 'Cese')), []);
await comprobar('4. un cese que falta en un Consejo antiguo: en amarillo y en «faltan»',
  Promise.resolve([r4.ponce[1], r4.ponceAmarillo, r4.ponceFaltan.indexOf('Cese') !== -1]),
  [['Padres y madres', 'Representante de la a.m.p.a. mayoritaria', '01/11/2023', '[falta: Cese]'], true, true]);
await comprobar('4. un miembro nato: «Cursos …» y sin cese',
  Promise.resolve(r4.uceda[1]), ['Equipo Directivo', 'Director/a', 'Cursos 2024-2025, 2025-2026', '']);
await comprobar('4. una persona sin ninguna fila: «[falta: Consejo Escolar]»', Promise.resolve([r4.nadieTexto, r4.nadieFaltan.indexOf('Consejo Escolar') !== -1]), [true, true]);

/* ---------- 5. subir ficheros con el botón ---------- */
console.log('--- 5. «Añadir ficheros del Consejo Escolar» ---');
await pagina.evaluate(async () => { App.ir('herramientas'); await TablasDatosPantalla.pintar(); document.getElementById('bloque-tablas-datos').open = true; });
await pagina.waitForSelector('#tablas-datos-consejo');
await comprobar('5. el botón está', pagina.locator('#tablas-datos-consejo').textContent(), 'Añadir ficheros del Consejo Escolar');
await pagina.setInputFiles('#tablas-datos-consejo-ficheros', [{ name: 'otro.csv', mimeType: 'text/csv', buffer: Buffer.from('Nombre;DNI\r\nAna;1\r\n') }]);
await pagina.waitForTimeout(500);
await comprobar('5. un fichero que no es del Consejo: aviso ámbar y no se copia',
  pagina.evaluate(async () => ({
    aviso: Array.prototype.some.call(document.querySelectorAll('#mensajes .mensaje.ambar'), (m) => /no parece del Consejo Escolar/.test(m.textContent)),
    copiado: await Carpetas.existeFichero(await App.E.datos.getDirectoryHandle('Tablas'), 'otro.csv')
  })), { aviso: true, copiado: false });
const nuevo = F2526.replace('15/10/2022', '15/10/2022');
await pagina.setInputFiles('#tablas-datos-consejo-ficheros', [{ name: '55_RegMieConEsc_2026-2027.csv', mimeType: 'text/csv', buffer: Buffer.from(nuevo, 'latin1') }]);
await pagina.waitForTimeout(700);
await comprobar('5. uno bueno se copia con su nombre limpio y se vuelve a leer',
  pagina.evaluate(async () => ({
    copiado: await Carpetas.existeFichero(await App.E.datos.getDirectoryHandle('Tablas'), 'RegMieConEsc 2026-2027.csv'),
    periodos: (await TablasDatos.lista()).tablas.filter((t) => t.nombre === 'CONSEJO ESCOLAR')[0].cursos
  })), { copiado: true, periodos: ['2024-2025', '2025-2026', '2026-2027'] });
await pagina.setInputFiles('#tablas-datos-consejo-ficheros', [{ name: 'RegMieConEsc 2026-2027.csv', mimeType: 'text/csv', buffer: Buffer.from(nuevo, 'latin1') }]);
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('5. repetido: pregunta antes de sustituir', pagina.locator('#cuadro-cuerpo').textContent(),
  'Ya hay «RegMieConEsc 2026-2027.csv». ¿Lo sustituyo por el nuevo?');
await pagina.click('#cuadro-cancelar');

/* ---------- 6. {{DNI}} con el campo de reserva ---------- */
console.log('--- 6. {{DNI}} sin documento: «DNI para el certificado» ---');
const r6 = await pagina.evaluate(async () => {
  const nombre = '261001 CertConsEsc Nadie Inventado, Pepe';
  await Carpetas.crear(App.E.abiertos, nombre);
  await Campos.guardarPropios(App.E.gestor, (l) => { l.push({ id: 'pdni', nombre: 'DNI para el certificado', clase: 'texto', valores: [] }); return l; });
  await Campos.guardarConfigDeTipo(App.E.gestor, 'CERTIFICADO MIEMBRO CONSEJO ESCOLAR', [{ origen: 'propio', id: 'pdni', obligatorio: false, enNombre: false }]);
  App.E.campos = await Campos.leer(App.E.gestor);
  const ficha = { tipo: 'CERTIFICADO MIEMBRO CONSEJO ESCOLAR', categoria: 'PERSONAL', tercero: 'Nadie Inventado, Pepe',
    campos: { 'propio:pdni': { valor: '12345678Z', enNombre: false } } };
  const v = await Plantillas.valoresDeAsunto({ nombre, ficha, leido: { tipo: ficha.tipo, categoria: 'PERSONAL' } });
  const vacio = await Plantillas.valoresDeAsunto({ nombre, ficha: Object.assign({}, ficha, { campos: {} }), leido: { tipo: ficha.tipo, categoria: 'PERSONAL' } });
  return [v.dni, vacio.dni];
});
await comprobar('6. con el campo, su valor; sin él, vacío (saldrá «falta»)', Promise.resolve(r6), ['12345678Z', '']);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
