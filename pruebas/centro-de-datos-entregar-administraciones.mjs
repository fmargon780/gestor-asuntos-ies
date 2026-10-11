/* Prueba de la fila 329 (docs/ENTREGAR-ADMINISTRACIONES-AL-CENTRO-DE-DATOS.md): el Gestor entrega también su lista de
   Administraciones al Centro de datos, por el camino de la fila 328 (js/centro-de-datos-entregar.js). Chromium real, con el
   disco de mentira de pruebas/navegador.mjs y una carpeta «CENTRO DE DATOS» de mentira, con todo inventado.

   1. Sin carpeta, sin permiso de escribir, en solo consultar o con `recibe` sin ninguna de las dos listas: nada se escribe.
   2. Con `recibe` solo de las empresas: se entregan las empresas y NO las Administraciones; con las dos, los dos ficheros.
   3. La forma del fichero: catorce campos en su orden, con su dueño y las columnas de las tres tablas.
   4. El `id` es el del organismo.   5. El árbol de departamentos, aplanado.   6. Un centro y un organismo sin «Depende de».
   7. Tras cambiar el nombre oficial y el del superior, salen los nombres anteriores y el `id` no cambia.
   8. Solo con nombre corto: solo clase, tercero y nombreCorto.   9. El apunte, sin tocar el de las empresas ni `tomado`.
   10. No se repite; un cambio entrega solo las Administraciones; tres seguidos, una vez.   11. Por el otro ordenador.
   12. De tres a ninguna: no se entrega; sin fichero, ni se entrega ni se avisa.   13. Solo se escriben esos dos ficheros. */
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

const EMPRESAS = ['Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
  'Papelería Inventada, S.L.;La Pluma Azul;B-00000000;Ana Prueba;600 000 000;pluma@example.com', 'Reparaciones de Mentira;;;;;'].join('\r\n') + '\r\n';
const REGALUM = 'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\nPrimera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014\r\n';
/* Tres Administraciones inventadas (códigos que no existen, correos de example.com). Por nombre corto: Delegación, IES, Zona. */
const ADMIN = {
  superiores: [{ id: 'sup-t1', nombre: 'Consejería Inventada', antes: [{ nombre: 'Consejería de Antes', hasta: '2026-07-01' }] }],
  organismos: [
    { id: 'org-t3', clase: 'organismo', corto: 'Zona Sola', oficial: '', dir3: '', codigoCentro: '', superior: '', correo: '', telefono: '', direccion: '', antes: [], departamentos: [] },
    { id: 'org-t1', clase: 'organismo', corto: 'Delegación de Mentira', oficial: 'Delegación Territorial Inventada de Educación', dir3: 'A00000001', codigoCentro: '',
      superior: 'sup-t1', correo: 'delegacion@example.com', telefono: '600 000 001', direccion: 'Calle Falsa, 1', antes: [{ nombre: 'Delegación Provincial Inventada', hasta: '2026-09-25' }],
      departamentos: [{ id: 'dep-t1', nombre: 'Planificación', correo: 'planificacion@example.com', telefono: '', contacto: 'Ana Prueba', dir3: '',
        hijos: [{ id: 'dep-t2', nombre: 'Escolarización', correo: '', telefono: '600 000 002', contacto: '', dir3: '', hijos: [] }] }] },
    { id: 'org-t2', clase: 'centro', corto: 'IES Ejemplo', oficial: 'Instituto Ejemplo', dir3: '', codigoCentro: '29000000', superior: '', correo: '', telefono: '', direccion: '', antes: [],
      departamentos: [{ id: 'dep-t3', nombre: 'Secretaría', correo: '', telefono: '', contacto: '', dir3: '', hijos: [] }] }
  ]
};
const FA = 'ENTREGA administraciones gestor-asuntos-ies.json';
const FE = 'ENTREGA empresas gestor-asuntos-ies.json';

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
  window.__entregas = {};   /* cuántas veces se escribe cada fichero ENTREGA */
  const t = Carpetas.escribirTexto;
  Carpetas.escribirTexto = async function (dir, nombre) { if (/^ENTREGA /.test(nombre)) window.__entregas[nombre] = (window.__entregas[nombre] || 0) + 1; return t.apply(this, arguments); };
});

/* La carpeta del Centro de datos de mentira. `spec`: { recibe: [conjuntos], escribir (por defecto sí), senalar (por defecto sí) } */
async function montar(spec) {
  await pagina.evaluate(async (spec) => {
    const raiz = window.__disco.archivo;
    raiz._hijos.delete('CENTRO DE DATOS');
    const centro = await raiz.getDirectoryHandle('CENTRO DE DATOS', { create: true });
    await centro.getDirectoryHandle('entrada', { create: true });
    const indice = { contrato: 2, ocupado: false, actualizado: new Date().toISOString(), cursoActual: U.cursoActual(), web: '', listados: [] };
    if (spec.recibe) indice.recibe = spec.recibe.map(c => ({ conjunto: c, de: 'gestor-asuntos-ies', entrega: 1, entero: true }));
    centro._hijos.set('indice.json', window.__disco.fich('indice.json', JSON.stringify(indice)));
    const escribible = spec.escribir !== false;
    centro.queryPermission = async (op) => (op && op.mode === 'readwrite' && !escribible ? 'prompt' : 'granted');
    centro.requestPermission = async () => 'granted';
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, spec.senalar === false ? null : centro);
  }, spec);
}
const escribirAdmin = (obj) => pagina.evaluate(async (t) => { await Carpetas.escribirTexto(App.E.datos, 'administraciones.json', t); Datos.olvidar(); }, obj === null ? null : JSON.stringify(obj, null, 1));
const quitarAdmin = () => pagina.evaluate(() => { App.E.datos._hijos.delete('administraciones.json'); Datos.olvidar(); });
const escribirEmpresas = () => pagina.evaluate(async (t) => { await Carpetas.escribirTexto(App.E.datos, 'empresas.csv', t); Datos.olvidar(); }, EMPRESAS);
async function limpiar() {
  await pagina.evaluate(async () => {
    App.E.gestor._hijos.delete('centro-de-datos.json');
    await CentroDeDatos.leerApuntes(true);
    window.__avisos.length = 0;
    window.__entregas = {};
    const centro = window.__disco.archivo._hijos.get('CENTRO DE DATOS');
    const e = centro && centro._hijos.get('entrada');
    if (e) e._hijos.clear();
  });
}
const vaciarEntrada = () => pagina.evaluate(() => { window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada')._hijos.clear(); window.__entregas = {}; });
const entrada = () => pagina.evaluate(async () => {
  const e = window.__disco.archivo._hijos.get('CENTRO DE DATOS')._hijos.get('entrada');
  const salida = { nombres: [...e._hijos.keys()].sort(), json: {} };
  for (const n of salida.nombres) salida.json[n] = JSON.parse(await Carpetas.leerTexto(e, n));
  return salida;
});
const mirar = () => pagina.evaluate(async () => { const r = await CentroDeDatosEntregar.mirar({}); return r.listas ? Object.fromEntries(Object.entries(r.listas).map(([k, v]) => [k, v.estado])) : r.estado; });
const entregas = () => pagina.evaluate(() => Object.fromEntries(Object.entries(window.__entregas).sort()));
const apunte = () => pagina.evaluate(async () => { const a = await CentroDeDatos.leerApuntes(true); return { entregado: a.entregado || null, tomado: Object.keys(a.tomado) }; });
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
const avisosDeEntrega = () => pagina.evaluate(() => window.__avisos.filter(a => /entreg|Administraciones|empresas/i.test(a[0])).map(a => a[0]));

await escribirEmpresas();
await escribirAdmin(ADMIN);

/* ================= 1. NADA QUE ENTREGAR ================= */
console.log('--- 1. no se entrega ---');
const casos = [
  ['sin carpeta señalada', { recibe: ['administraciones'], senalar: false }, async () => {}],
  ['con `recibe` de otra cosa', { recibe: ['cargos'] }, async () => {}],
  ['sin permiso de escribir', { recibe: ['empresas', 'administraciones'], escribir: false }, async () => {}],
  ['en solo consultar', { recibe: ['empresas', 'administraciones'] }, async () => { await pagina.evaluate(() => { window.__soloAntes = SoloConsulta.activo; SoloConsulta.activo = () => true; }); }]
];
for (const [titulo, spec, antes] of casos) {
  await limpiar();
  await montar(spec);
  const antesDeTodo = await instantanea();
  await antes();
  await mirar();
  await comprobar('1. ' + titulo + ': nada escrito, nada avisado, nada apuntado',
    [(await entrada()).nombres, await entregas(), await avisosDeEntrega(), (await apunte()).entregado, JSON.stringify(await instantanea()) === JSON.stringify(antesDeTodo)], [[], {}, [], null, true]);
  if (titulo.startsWith('en solo')) await pagina.evaluate(() => { SoloConsulta.activo = window.__soloAntes; });
}

/* ================= 2. CADA LISTA POR SEPARADO ================= */
console.log('--- 2. cada lista por separado ---');
await limpiar();
await montar({ recibe: ['empresas'] });
await comprobar('2. con `recibe` solo de las empresas se entregan ellas y no las Administraciones', [await mirar(), (await entrada()).nombres], [{ empresas: 'entregado', administraciones: 'no-recibe' }, [FE]]);
await limpiar();
await montar({ recibe: ['empresas', 'administraciones'] });
const foto0 = await instantanea();
await comprobar('2. con las dos aparecen los dos ficheros', [await mirar(), (await entrada()).nombres], [{ empresas: 'entregado', administraciones: 'entregado' }, [FA, FE]]);
const e2 = (await entrada()).json[FA];

/* ================= 3 a 6. LA FORMA ================= */
console.log('--- 3 a 6. la forma ---');
await comprobar('3. entrega, conjunto, origen y hechoCon', [e2.entrega, e2.conjunto, e2.origen, e2.hechoCon], [1, 'administraciones', 'gestor-asuntos-ies', []]);
await comprobar('3. `generado` en hora de Madrid con su desfase', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(e2.generado), true);
await comprobar('3. los catorce campos, en su orden y con su dueño',
  e2.campos.map(c => [c.clave, c.apartado, c.tipo, c.dueno]),
  [['clase', 'Administración', 'texto'], ['tercero', 'Administración', 'texto'], ['nombreCorto', 'Administración', 'texto'], ['nombreOficial', 'Administración', 'texto'],
    ['dir3', 'Administración', 'texto'], ['codigoCentro', 'Administración', 'texto'], ['dependeDe', 'Administración', 'texto'], ['dependeDeId', 'Administración', 'texto'],
    ['nombresAnteriores', 'Administración', 'tabla'], ['dependeDeAnteriores', 'Administración', 'tabla'], ['correo', 'Contacto', 'texto'], ['telefono', 'Contacto', 'texto'],
    ['direccion', 'Contacto', 'texto'], ['departamentos', 'Departamentos', 'tabla']].map(c => c.concat('gestor-asuntos-ies')));
await comprobar('3. las tres tablas llevan sus columnas',
  e2.campos.filter(c => c.tipo === 'tabla').map(c => [c.clave, c.columnas.map(x => x.clave + ':' + x.etiqueta).join(',')]),
  [['nombresAnteriores', 'nombre:Nombre,hasta:Hasta'], ['dependeDeAnteriores', 'nombre:Nombre,hasta:Hasta'],
    ['departamentos', 'id:Identificador,nombre:Nombre,nivel:Nivel,dependeDe:Depende de,correo:Correo electrónico,telefono:Teléfono,contacto:Persona de contacto,dir3:DIR3']]);
await comprobar('3. un registro por Administración, por nombre corto', e2.registros.map(r => r.datos.nombreCorto), ['Delegación de Mentira', 'IES Ejemplo', 'Zona Sola']);
await comprobar('4. el `id` de cada registro es el del organismo', e2.registros.map(r => r.id), ['org-t1', 'org-t2', 'org-t3']);
const org = e2.registros[0].datos;
await comprobar('5. el árbol, aplanado: nivel 0 sin «dependeDe», nivel 1 con el id del primero y la persona de contacto',
  org.departamentos, [{ id: 'dep-t1', nombre: 'Planificación', nivel: 0, correo: 'planificacion@example.com', contacto: 'Ana Prueba' },
    { id: 'dep-t2', nombre: 'Escolarización', nivel: 1, dependeDe: 'dep-t1', telefono: '600 000 002' }]);
await comprobar('5. los datos del organismo, con lo anterior',
  [org.clase, org.tercero, org.nombreOficial, org.dir3, org.dependeDe, org.dependeDeId, org.nombresAnteriores, org.dependeDeAnteriores, org.correo, org.telefono, org.direccion],
  ['organismo', 'Delegación de Mentira', 'Delegación Territorial Inventada de Educación', 'A00000001', 'Consejería Inventada', 'sup-t1',
    [{ nombre: 'Delegación Provincial Inventada', hasta: '2026-09-25' }], [{ nombre: 'Consejería de Antes', hasta: '2026-07-01' }], 'delegacion@example.com', '600 000 001', 'Calle Falsa, 1']);
const centro = e2.registros[1].datos;
await comprobar('6. un centro: clase, código de 8 cifras, tercero con el código y sin DIR3',
  [centro.clase, centro.codigoCentro, centro.tercero, 'dir3' in centro, centro.departamentos.length], ['centro', '29000000', 'IES Ejemplo 29000000', false, 1]);
await comprobar('6. un organismo sin «Depende de»: sin `dependeDe` ni `dependeDeId`', ['dependeDe' in e2.registros[2].datos, 'dependeDeId' in e2.registros[2].datos], [false, false]);
await comprobar('8. con solo nombre corto: solo clase, tercero y nombreCorto', e2.registros[2].datos, { clase: 'organismo', tercero: 'Zona Sola', nombreCorto: 'Zona Sola' });

/* ================= 9. EL APUNTE ================= */
console.log('--- 9 y 13. el apunte y solo esos ficheros ---');
const ap = await apunte();
await comprobar('9. queda apuntado `entregado.administraciones` (y el de las empresas); `tomado` no cambia',
  [Object.keys(ap.entregado).sort(), ap.entregado.administraciones.registros, ap.entregado.empresas.registros, ap.tomado], [['administraciones', 'empresas'], 3, 2, []]);
await comprobar('13. el resto de la carpeta es idéntico, byte a byte', JSON.stringify(await instantanea()) === JSON.stringify(foto0), true);

/* ================= 10. CAMBIOS ================= */
console.log('--- 10. no se repite, y los cambios ---');
await comprobar('10. entrar otra vez no escribe', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'nada-nuevo' }, { [FA]: 1, [FE]: 1 }]);
await vaciarEntrada();
await pagina.evaluate(async () => { await Administraciones.alta(App.E.datos, { clase: 'organismo', corto: 'Inspección Inventada', correo: 'insp@example.com' }); });
await pagina.waitForFunction((f) => (window.__entregas[f] || 0) >= 1, FA, { timeout: 15000 });
await pagina.waitForTimeout(500);
await comprobar('10. un alta entrega solo las Administraciones', [await entregas(), (await entrada()).json[FA].registros.map(r => r.datos.nombreCorto)],
  [{ [FA]: 1 }, ['Delegación de Mentira', 'IES Ejemplo', 'Inspección Inventada', 'Zona Sola']]);
await vaciarEntrada();
await pagina.evaluate(async () => {
  await Administraciones.cambiarDatos(App.E.datos, 'org-t1', { telefono: '611 111 111' });
  await Administraciones.anadirDepartamento(App.E.datos, 'org-t1', 'dep-t2', { nombre: 'Matrícula', contacto: 'Luis Prueba' });
  await Administraciones.quitar(App.E.datos, 'org-t3');
});
await pagina.waitForFunction((f) => (window.__entregas[f] || 0) >= 1, FA, { timeout: 15000 });
await pagina.waitForTimeout(1200);
const e10 = (await entrada()).json[FA];
await comprobar('10. un cambio de teléfono, un departamento nuevo y una baja seguidos dan una sola entrega, sin empresas',
  [await entregas(), e10.registros.find(r => r.id === 'org-t1').datos.telefono, e10.registros.find(r => r.id === 'org-t1').datos.departamentos.map(d => [d.nombre, d.nivel]), e10.registros.some(r => r.id === 'org-t3')],
  [{ [FA]: 1 }, '611 111 111', [['Planificación', 0], ['Escolarización', 1], ['Matrícula', 2]], false]);

/* ================= 7. NOMBRES ANTERIORES ================= */
console.log('--- 7. nombres anteriores ---');
await vaciarEntrada();
await pagina.evaluate(async () => {
  await Administraciones.cambiarDatos(App.E.datos, 'org-t1', { oficial: 'Delegación Territorial Nueva' });
  await Administraciones.renombrarSuperior(App.E.datos, 'sup-t1', 'Consejería Nueva');
});
await pagina.waitForFunction((f) => (window.__entregas[f] || 0) >= 1, FA, { timeout: 15000 });
await pagina.waitForTimeout(800);
const r7 = (await entrada()).json[FA].registros.find(r => r.id === 'org-t1');
const hoy = await pagina.evaluate(() => U.hoyIso());
await comprobar('7. el oficial nuevo, el viejo con su `hasta`, el superior nuevo con el viejo y el mismo id',
  [r7.id, r7.datos.nombreOficial, r7.datos.nombresAnteriores.map(n => n.nombre), r7.datos.nombresAnteriores.slice(-1)[0].hasta === hoy, r7.datos.dependeDe, r7.datos.dependeDeAnteriores.map(n => n.nombre)],
  ['org-t1', 'Delegación Territorial Nueva', ['Delegación Provincial Inventada', 'Delegación Territorial Inventada de Educación'], true, 'Consejería Nueva', ['Consejería de Antes', 'Consejería Inventada']]);

/* ================= 11. POR EL OTRO ORDENADOR ================= */
console.log('--- 11. por el otro ordenador ---');
await vaciarEntrada();
await escribirAdmin(ADMIN);   /* sin pasar por Administraciones.cambiar: no avisa a nadie */
await pagina.waitForTimeout(800);
await comprobar('11. nada hasta que se mira', await entregas(), {});
await comprobar('11. en la siguiente entrada se entrega, solo las Administraciones', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'entregado' }, { [FA]: 1 }]);

/* ================= 12. VACÍA Y SIN FICHERO ================= */
console.log('--- 12. vacía y sin fichero ---');
await vaciarEntrada();
await escribirAdmin({ superiores: [], organismos: [] });
await comprobar('12. de tres a ninguna no se entrega sola', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'vacia' }, {}]);
await comprobar('12. Ajustes lo dice, con su botón',
  pagina.evaluate(async () => { const e = await CentroDeDatosEntregar.estadoParaAjustes('administraciones'); return [e.texto, e.boton]; }),
  ['La lista de Administraciones está vacía y antes no lo estaba: no la he entregado.', 'vacia']);
await comprobar('12. al pulsar su botón se entrega la lista vacía, y las empresas no se tocan',
  pagina.evaluate(async () => { const r = await CentroDeDatosEntregar.entregarAhora({ vacia: 'administraciones' }); return [r.estado, r.registros, r.listas.empresas.estado]; }), ['entregado', 0, 'nada-nuevo']);
await limpiar();
await quitarAdmin();
await comprobar('12. sin `administraciones.json` no se entrega y no se avisa de nada', [await mirar(), (await entrada()).nombres, await avisosDeEntrega()],
  [{ empresas: 'entregado', administraciones: 'sin-fichero' }, [FE], []]);

/* ================= LA COMPROBACIÓN AL ENTRAR ================= */
console.log('--- la comprobación al entrar ---');
await escribirAdmin(ADMIN);
await montar({ recibe: ['empresas', 'administraciones'], escribir: false });
const fila = () => pagina.evaluate(async () => { const f = (await ComprobacionEntrada.revisar()).find(x => x.id === 'centro-de-datos'); return f && [f.estado, f.ambar, f.frase]; });
await comprobar('la fila ámbar nombra las dos listas', await fila(), ['falta', true, 'Falta el permiso para escribir: las empresas y las Administraciones no se entregan al Centro de datos.']);
await montar({ recibe: ['empresas'], escribir: false });
await comprobar('si solo recibe una, nombra solo esa', await fila(), ['falta', true, 'Falta el permiso para escribir: las empresas no se entregan al Centro de datos.']);

const deVerdad = errores.filter(e => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
