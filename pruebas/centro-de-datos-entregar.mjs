/* Prueba de la fila 328 (docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md): el Gestor entrega la lista de empresas
   al Centro de datos (js/centro-de-datos-entregar.js). Chromium real, con el disco de mentira de
   pruebas/navegador.mjs y una carpeta «CENTRO DE DATOS» de mentira, con todo inventado.

   1. Sin carpeta, sin `recibe` de las empresas, sin permiso de escribir o en solo consultar: nada se escribe, nada se avisa.
   2. Con todo en regla: al entrar aparece `entrada/ENTREGA empresas gestor-asuntos-ies.json` con la forma del acuerdo.
   3. Los `id`.   4. Solo razón social, y dos con el mismo NIF.   5. Un CSV antiguo, sin «Nombre comercial».
   6. Queda apuntado `entregado.empresas`, y `tomado` no cambia.   7. Entrar otra vez, o con `entrada/` vaciada, no escribe.
   8. Un alta, un cambio y una baja dan una entrega nueva (tres seguidos, una sola).   9. Un cambio que no pasó por la
   aplicación se entrega en la siguiente entrada.   10. De cuatro a ninguna: no se entrega, se dice, y el botón lo entrega;
   con el CSV ilegible, tampoco.   11. Si la escritura falla, no se apunta nada y la siguiente vez se reintenta.
   12. Solo se ha escrito ese fichero.   13. Con solo el permiso de leer, traer funciona y la carpeta cuenta como con permiso.
   14. La «Comprobación al entrar» saca la fila ámbar si falta el permiso de escribir. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const CAB = 'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo';
const EMPRESAS = [CAB,
  'Añil & Cía., S.L.;;;;;',
  'Papelería Inventada, S.L.;La Pluma Azul;B-00000000;Ana Prueba;600 000 000;pluma@example.com',
  'Reparaciones de Mentira;;;;;',
  'Tintas del Norte;;b00000000 ;;;'].join('\r\n') + '\r\n';
const ANTIGUO = ['Razón social;NIF;Contacto;Teléfono;Correo', 'Papelería Inventada, S.L.;B-00000000;Ana Prueba;600 000 000;pluma@example.com'].join('\r\n') + '\r\n';
const REGALUM = 'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\nPrimera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014\r\n';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (regalum) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));
}, REGALUM);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2500);
await pagina.evaluate(() => {
  window.__avisos = [];
  const original = U.aviso;
  U.aviso = function (texto, clase) { window.__avisos.push([texto, clase || '']); return original.apply(this, arguments); };
  CentroDeDatosEntregar._ajustar({ espera: 250 });
  /* Cuántas veces se escribe una entrega. */
  window.__entregas = 0;
  const t = Carpetas.escribirTexto;
  Carpetas.escribirTexto = async function (dir, nombre) { if (/^ENTREGA /.test(nombre)) window.__entregas++; return t.apply(this, arguments); };
});

/* La carpeta del Centro de datos de mentira. `spec`: { recibe, escribir (por defecto sí), sinEntrada, listados } */
async function montar(spec) {
  await pagina.evaluate(async (spec) => {
    const raiz = window.__disco.archivo;
    raiz._hijos.delete('CENTRO DE DATOS');
    const centro = await raiz.getDirectoryHandle('CENTRO DE DATOS', { create: true });
    if (!spec.sinEntrada) await centro.getDirectoryHandle('entrada', { create: true });
    const lista = [];
    for (const l of spec.listados || []) {
      const partes = l.ruta.split('/');
      let d = centro;
      for (let i = 0; i < partes.length - 1; i++) d = await d.getDirectoryHandle(partes[i], { create: true });
      const f = window.__disco.fich(partes[partes.length - 1], l.texto);
      f.getFile = async () => new File([l.texto], partes[partes.length - 1], { lastModified: Date.now() });
      d._hijos.set(partes[partes.length - 1], f);
      lista.push({ clave: l.clave, variante: '', titulo: l.clave, fichero: l.fichero, ruta: l.ruta, tipo: 'csv', subido: l.subido, subidoPor: 'direccion@centro-inventado.es', resumen: '', huella: l.huella });
    }
    const indice = { contrato: 2, ocupado: false, actualizado: new Date().toISOString(), cursoActual: U.cursoActual(), web: '', listados: lista };
    if (spec.recibe) indice.recibe = [{ conjunto: 'empresas', de: 'gestor-asuntos-ies', entrega: 1, entero: true }];
    if (spec.recibeOtro) indice.recibe = [{ conjunto: 'cargos', de: 'gestor-asuntos-ies', entrega: 1, entero: true }];
    centro._hijos.set('indice.json', window.__disco.fich('indice.json', JSON.stringify(indice)));
    let escribible = spec.escribir !== false;
    centro.queryPermission = async (op) => (op && op.mode === 'readwrite' && !escribible ? 'prompt' : 'granted');
    centro.requestPermission = async (op) => { if (op && op.mode === 'readwrite') escribible = true; return 'granted'; };
    if (spec.senalar !== false) await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, centro); else await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, null);
  }, spec);
}
const escribirCsv = (texto) => pagina.evaluate(async (t) => { await Carpetas.escribirTexto(App.E.datos, 'empresas.csv', t); Datos.olvidar(); }, texto);
/* Lo de siempre entre pruebas: sin apuntes ni entregas anteriores ni entrada. */
async function limpiar() {
  await pagina.evaluate(async () => {
    App.E.gestor._hijos.delete('centro-de-datos.json');
    await CentroDeDatos.leerApuntes(true);
    window.__avisos.length = 0;
    window.__entregas = 0;
    const centro = window.__disco.archivo._hijos.get('CENTRO DE DATOS');
    const e = centro && centro._hijos.get('entrada');
    if (e) e._hijos.clear();
  });
}
const entrada = () => pagina.evaluate(async () => {
  const centro = window.__disco.archivo._hijos.get('CENTRO DE DATOS');
  const e = centro._hijos.get('entrada');
  const nombres = e ? [...e._hijos.keys()] : [];
  const texto = nombres.length ? await Carpetas.leerTexto(e, nombres[0]) : null;
  return { nombres, json: texto ? JSON.parse(texto) : null };
});
const mirar = (op = {}) => pagina.evaluate(async (op) => { const r = await CentroDeDatosEntregar.mirar(op); return r.listas ? r.listas.empresas.estado : r.estado; }, op);
const entregas = () => pagina.evaluate(() => window.__entregas);
const apunteEntregado = () => pagina.evaluate(async () => { const a = (await CentroDeDatos.leerApuntes(true)); return { entregado: a.entregado || null, tomado: Object.keys(a.tomado) }; });
/* La carpeta entera, para comparar antes y después (sin lo que está en `entrada/`). */
const instantanea = () => pagina.evaluate(async () => {
  const centro = window.__disco.archivo._hijos.get('CENTRO DE DATOS');
  const salida = {};
  async function andar(dir, ruta) {
    for (const [n, h] of dir._hijos) {
      if (h.kind === 'directory') { if (n !== 'entrada') await andar(h, ruta + n + '/'); }
      else salida[ruta + n] = typeof h._texto === 'string' ? h._texto : Array.from(h._texto || []).join(',');
    }
  }
  await andar(centro, '');
  return salida;
});
const avisosDeEntrega = () => pagina.evaluate(() => window.__avisos.filter(a => /entreg|empresas/i.test(a[0])).map(a => a[0]));

await escribirCsv(EMPRESAS);

/* ================= 1. NADA QUE ENTREGAR ================= */
console.log('--- 1. no se entrega ---');
const casos = [
  ['sin carpeta señalada', { recibe: true, senalar: false }, async () => {}],
  ['con `recibe` de otra cosa', { recibeOtro: true }, async () => {}],
  ['sin `recibe`', {}, async () => {}],
  ['sin permiso de escribir', { recibe: true, escribir: false }, async () => {}],
  ['en solo consultar', { recibe: true }, async () => { await pagina.evaluate(() => { window.__soloAntes = SoloConsulta.activo; SoloConsulta.activo = () => true; }); }]
];
for (const [titulo, spec, antes] of casos) {
  await limpiar();
  await montar(spec);
  const antesDeTodo = await instantanea();
  await antes();
  const r = await mirar();
  await comprobar('1. ' + titulo + ': nada escrito, nada avisado, nada apuntado',
    [(await entrada()).nombres, await entregas(), await avisosDeEntrega(), (await apunteEntregado()).entregado, JSON.stringify(await instantanea()) === JSON.stringify(antesDeTodo)], [[], 0, [], null, true]);
  if (titulo.startsWith('en solo')) await pagina.evaluate(() => { SoloConsulta.activo = window.__soloAntes; });
}

/* ================= 2. TODO EN REGLA, AL ENTRAR ================= */
console.log('--- 2. al entrar ---');
await limpiar();
await montar({ recibe: true });
const foto0 = await instantanea();
await pagina.evaluate(() => CentroDeDatos._alEntrarDeNuevo());
await pagina.waitForFunction(() => window.__entregas >= 1, null, { timeout: 15000 });
const e2 = await entrada();
await comprobar('2. aparece el fichero de la entrega, con su nombre', e2.nombres, ['ENTREGA empresas gestor-asuntos-ies.json']);
await comprobar('2. entrega, conjunto, origen y hechoCon', [e2.json.entrega, e2.json.conjunto, e2.json.origen, e2.json.hechoCon], [1, 'empresas', 'gestor-asuntos-ies', []]);
await comprobar('2. `generado` en hora de Madrid con su desfase', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(e2.json.generado), true);
await comprobar('2. los seis campos, con su dueño',
  e2.json.campos.map(c => [c.clave, c.etiqueta, c.apartado, c.tipo, c.dueno]),
  [['razonSocial', 'Razón social', 'Empresa', 'texto', 'gestor-asuntos-ies'], ['nombreComercial', 'Nombre comercial', 'Empresa', 'texto', 'gestor-asuntos-ies'],
    ['nif', 'NIF', 'Empresa', 'texto', 'gestor-asuntos-ies'], ['contacto', 'Persona de contacto', 'Contacto', 'texto', 'gestor-asuntos-ies'],
    ['telefono', 'Teléfono', 'Contacto', 'texto', 'gestor-asuntos-ies'], ['correo', 'Correo electrónico', 'Contacto', 'texto', 'gestor-asuntos-ies']]);
await comprobar('2. cuatro registros, en el orden de la lista', e2.json.registros.map(r => r.datos.razonSocial),
  ['Añil & Cía., S.L.', 'Papelería Inventada, S.L.', 'Reparaciones de Mentira', 'Tintas del Norte']);

/* ================= 3 y 4. LOS ID Y LOS DATOS ================= */
console.log('--- 3 y 4. los id y los datos ---');
await comprobar('3. los id: NIF limpio en mayúsculas, y `sin-nif-` con la razón social sin tildes ni signos',
  e2.json.registros.map(r => r.id), ['sin-nif-anil-cia-s-l', 'B00000000', 'sin-nif-reparaciones-de-mentira', 'B00000000']);
await comprobar('3. el `nif` de `datos` sale tal como está escrito', e2.json.registros.map(r => r.datos.nif), [undefined, 'B-00000000', undefined, 'b00000000']);
await comprobar('4. una empresa con solo razón social lleva solo `razonSocial`', e2.json.registros[2].datos, { razonSocial: 'Reparaciones de Mentira' });
await comprobar('4. los datos de la completa, tal cual', e2.json.registros[1].datos,
  { razonSocial: 'Papelería Inventada, S.L.', nombreComercial: 'La Pluma Azul', nif: 'B-00000000', contacto: 'Ana Prueba', telefono: '600 000 000', correo: 'pluma@example.com' });
await comprobar('4. las dos con el mismo NIF salen las dos, con el mismo id', e2.json.registros.filter(r => r.id === 'B00000000').length, 2);

/* ================= 6 y 12. APUNTE Y NADA MÁS ================= */
console.log('--- 6 y 12. el apunte, y solo ese fichero ---');
const ap = await apunteEntregado();
await comprobar('6. queda apuntado `entregado.empresas`, y `tomado` no cambia',
  [ap.entregado && Object.keys(ap.entregado), ap.entregado && ap.entregado.empresas.registros, ap.entregado && ap.entregado.empresas.entregadoPor, ap.tomado],
  [['empresas'], 4, 'Francisco', []]);
await comprobar('12. el resto de la carpeta es idéntico, byte a byte', JSON.stringify(await instantanea()) === JSON.stringify(foto0), true);

/* ================= 7. NO SE REPITE ================= */
console.log('--- 7. no se repite ---');
await comprobar('7. entrar otra vez no escribe', [await mirar(), await entregas()], ['nada-nuevo', 1]);
await pagina.evaluate(() => { window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); });
await comprobar('7. con `entrada/` ya recogida (vaciada), tampoco', [await mirar(), await entregas(), (await entrada()).nombres], ['nada-nuevo', 1, []]);

/* ================= 8. CAMBIOS ================= */
console.log('--- 8. cambios ---');
await pagina.evaluate(async () => { await Datos.anadirALista(App.E.datos, 'EMPRESAS', { 'Razón social': 'Cerrajería Inventada', 'Teléfono': '611 111 111' }); });
await pagina.waitForFunction(() => window.__entregas >= 2, null, { timeout: 15000 });
await comprobar('8. un alta se entrega sola, a los pocos segundos, con la lista de ese momento', (await entrada()).json.registros.map(r => r.datos.razonSocial),
  ['Añil & Cía., S.L.', 'Cerrajería Inventada', 'Papelería Inventada, S.L.', 'Reparaciones de Mentira', 'Tintas del Norte']);
await pagina.evaluate(async () => { window.__entregas = 0; window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear();
  await Datos.guardarEnLista(App.E.datos, 'EMPRESAS', 'Cerrajería Inventada', { 'Razón social': 'Cerrajería Inventada', 'Teléfono': '622 222 222' });
  await Datos.guardarEnLista(App.E.datos, 'EMPRESAS', 'Cerrajería Inventada', { 'Razón social': 'Cerrajería Inventada', 'Teléfono': '633 333 333' });
  await Datos.quitarDeLista(App.E.datos, 'EMPRESAS', 'Añil & Cía., S.L.'); });
await pagina.waitForFunction(() => window.__entregas >= 1, null, { timeout: 15000 });
await pagina.waitForTimeout(1200);
await comprobar('8. tres cambios seguidos (dos cambios y una baja) dan una sola entrega, con el último estado',
  [await entregas(), (await entrada()).json.registros.map(r => [r.datos.razonSocial, r.datos.telefono])],
  [1, [['Cerrajería Inventada', '633 333 333'], ['Papelería Inventada, S.L.', '600 000 000'], ['Reparaciones de Mentira', undefined], ['Tintas del Norte', undefined]]]);

/* ================= 9. CAMBIO POR EL OTRO ORDENADOR ================= */
console.log('--- 9. por el otro ordenador ---');
await pagina.evaluate(() => { window.__entregas = 0; window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); });
await escribirCsv(EMPRESAS);   /* sin pasar por Datos.anadirALista: no avisa a nadie */
await pagina.waitForTimeout(800);
await comprobar('9. nada hasta que se mira', await entregas(), 0);
await comprobar('9. en la siguiente entrada se entrega', [await mirar(), (await entrada()).json.registros.length], ['entregado', 4]);

/* ================= 5. CSV ANTIGUO ================= */
console.log('--- 5. un CSV antiguo ---');
await pagina.evaluate(() => { window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); });
await escribirCsv(ANTIGUO);
await comprobar('5. se entrega bien y sin la clave «nombreComercial»', [await mirar(), (await entrada()).json.campos.map(c => c.clave), Object.keys((await entrada()).json.registros[0].datos)],
  ['entregado', ['razonSocial', 'nif', 'contacto', 'telefono', 'correo'], ['razonSocial', 'nif', 'contacto', 'telefono', 'correo']]);

/* ================= 10. VACÍA Y CSV ILEGIBLE ================= */
console.log('--- 10. vacía e ilegible ---');
await pagina.evaluate(() => { window.__entregas = 0; window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); });
await escribirCsv(EMPRESAS);
await mirar();
await pagina.evaluate(() => { window.__entregas = 0; window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); });
await escribirCsv(CAB + '\r\n');
await comprobar('10. de cuatro a ninguna no se entrega sola', [await mirar(), await entregas()], ['vacia', 0]);
await comprobar('10. Ajustes lo dice, con su botón',
  pagina.evaluate(async () => { const e = await CentroDeDatosEntregar.estadoParaAjustes(); return [e.texto, e.boton]; }),
  ['La lista de empresas está vacía y antes no lo estaba: no la he entregado.', 'vacia']);
await comprobar('10. al pulsar «Entregar la lista vacía» se entrega, con cero registros',
  pagina.evaluate(async () => { const r = await CentroDeDatosEntregar.entregarAhora({ vacia: true }); return [r.estado, r.registros]; }), ['entregado', 0]);
await escribirCsv(EMPRESAS);
await mirar();
await pagina.evaluate(() => { window.__entregas = 0; const o = Carpetas.leerTexto; window.__leerAntes = o; Carpetas.leerTexto = async function (d, n) { if (n === 'empresas.csv') throw new Error('no se puede leer'); return o.apply(this, arguments); }; });
await escribirCsv(EMPRESAS + 'Otra, S.L.;;;;;\r\n').catch(() => {});
await comprobar('10. con un `empresas.csv` que no se puede leer no se entrega', [await mirar(), await entregas()], ['error', 0]);
await pagina.evaluate(() => { Carpetas.leerTexto = window.__leerAntes; });

/* ================= 11. FALLA LA ESCRITURA ================= */
console.log('--- 11. falla la escritura ---');
await limpiar();
await montar({ recibe: true, sinEntrada: true });
await escribirCsv(EMPRESAS);
await comprobar('11. sin `entrada/` falla, no se apunta nada y se entra con normalidad', [await mirar(), (await apunteEntregado()).entregado, await entregas()], ['error', null, 0]);
await comprobar('11. el fallo sale una sola vez, en ámbar (no rojo)', pagina.evaluate(() => window.__avisos.filter(a => /entregar/i.test(a[0])).map(a => a[1])).then(l => l.length <= 1 && l.every(c => c !== 'malo')), true);
await pagina.evaluate(async () => { await window.__disco.archivo._hijos.get('CENTRO DE DATOS').getDirectoryHandle('entrada', { create: true }); });
await comprobar('11. la siguiente vez lo reintenta y entrega', [await mirar(), await entregas()], ['entregado', 1]);

/* ================= 13. SOLO EL PERMISO DE LEER ================= */
console.log('--- 13. solo leer ---');
await limpiar();
await montar({ recibe: true, escribir: false, listados: [{ clave: 'alumnado', fichero: 'RegAlum.csv', ruta: 'listados/alumnado/RegAlum.csv', texto: REGALUM.replace('Primera, Lucía', 'Segunda, Pilar'), subido: new Date(Date.now() + 86400000).toISOString(), huella: 'inv-1' }] });
await comprobar('13. con solo el de leer, traer trae el listado como antes', pagina.evaluate(async () => { const r = await CentroDeDatos.traer({ avisar: false, pedir: false }); return [r.ok, r.tomados.includes('alumnado'), r.fallos]; }), [true, true, []]);
await comprobar('13. y la carpeta sigue contando como «con permiso»', pagina.evaluate(() => PermisosCarpetas.estado('centro-de-datos')), 'con-permiso');
await comprobar('13. sin escribir nada en `entrada/`', (await entrada()).nombres, []);

/* ================= 14. LA COMPROBACIÓN AL ENTRAR ================= */
console.log('--- 14. comprobación al entrar ---');
const fila = () => pagina.evaluate(async () => { const f = (await ComprobacionEntrada.revisar()).find(x => x.id === 'centro-de-datos'); return f && [f.estado, f.ambar, f.frase, f.boton || '']; });
await comprobar('14. con `recibe` y sin permiso de escribir: fila ámbar con su frase y «Arreglarlo»', await fila(),
  ['falta', true, 'Falta el permiso para escribir: las empresas no se entregan al Centro de datos.', 'Arreglarlo']);
await pagina.evaluate(async () => { const d = await CentroDeDatos.carpeta(); await CentroDeDatos.pedirPermisos(d); });
await comprobar('14. dando el permiso, la fila vuelve a «bien»', (await fila())[0], 'bien');
await montar({});
await comprobar('14. sin `recibe`, la fila es la de siempre (bien)', (await fila())[0], 'bien');

const deVerdad = errores.filter(e => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
