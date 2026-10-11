/* Prueba de la fila 330 (docs/ENTREGAR-CARGOS-AL-CENTRO-DE-DATOS.md): el Gestor entrega también sus cargos al Centro de datos,
   por el camino de las filas 328 y 329 (js/centro-de-datos-entregar.js). Chromium real, con el disco de mentira de
   pruebas/navegador.mjs y una carpeta «CENTRO DE DATOS» de mentira, con todo inventado.

   1. Sin `recibe` de los cargos (aunque traiga otras), sin permiso de escribir o en solo consultar: no se escribe `ENTREGA cargos …`,
      no se avisa de nada y las otras listas se entregan como siempre.
   2. La forma del fichero: ocho campos con su dueño y cuatro registros (Dirección con dos, Vicedirección sin ninguno, Secretaría con uno).
   3. Los `id`.   4. El orden: por `orden`, y los ocupantes como están en el fichero.   5. Los datos vacíos no se escriben.
   6. Fechas que se pisan o al revés: se entregan tal cual.   7. El apunte (`cuenta` y `registros`), sin tocar los demás ni `tomado`.
   8. No se repite; un alta, un cierre, un cambio de nombre y un borrado dan entregas nuevas (tres seguidos, una sola).
   9. Por el otro ordenador.   10. Sin `cargos.json` no se entrega (no salen los seis de fábrica); de tener ocupantes a ninguno, no.
   11. Solo se escriben las entregas.   12. Quién firma no cambia.   13. La fila ámbar nombra las tres listas. */
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

const EMPRESAS = ['Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo', 'Papelería Inventada, S.L.;La Pluma Azul;B-00000000;Ana Prueba;600 000 000;pluma@example.com'].join('\r\n') + '\r\n';
const REGALUM = 'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\nPrimera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014\r\n';
/* Tres cargos inventados, escritos fuera de orden: por `orden`, Dirección, Vicedirección y Secretaría. */
const CARGOS = { version: 1, cargos: [
  { id: 'secretaria', nombre: 'Secretaría', orden: 3, tratamiento: 'El Secretario', ocupantes: [{ id: 'c-s1', persona: 'Fernando Reyes Palma', sexo: '', desde: '', hasta: '' }] },
  { id: 'vicedireccion', nombre: 'Vicedirección', orden: 2, tratamiento: 'El Vicedirector', ocupantes: [] },
  { id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'La Directora', ocupantes: [
    { id: 'c-d2', persona: 'Rosa Sellés Manzano', sexo: 'M', desde: '2025-07-01', hasta: '' },
    { id: 'c-d1', persona: 'Miguel Prado Soler', sexo: 'H', desde: '2019-07-01', hasta: '2025-06-30' }] }
] };
const FC = 'ENTREGA cargos gestor-asuntos-ies.json';
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
const escribirCargos = (obj) => pagina.evaluate(async (t) => { await Carpetas.escribirTexto(App.E.gestor, 'cargos.json', t); }, JSON.stringify(obj, null, 1));
const quitarCargos = () => pagina.evaluate(() => { App.E.gestor._hijos.delete('cargos.json'); });
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
const mirar = async () => { await pagina.waitForFunction(() => !ColaGuardado.hayGuardado(), null, { timeout: 15000 }); return mirarYa(); };
const mirarYa = () => pagina.evaluate(async () => { const r = await CentroDeDatosEntregar.mirar({}); return r.listas ? Object.fromEntries(Object.entries(r.listas).map(([k, v]) => [k, v.estado])) : r.estado; });
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
const avisosDeEntrega = () => pagina.evaluate(() => window.__avisos.filter(a => /entreg|cargos|empresas/i.test(a[0])).map(a => a[0]));
const esperarEntrega = (f) => pagina.waitForFunction((n) => (window.__entregas[n] || 0) >= 1, f, { timeout: 15000 });

await escribirEmpresas();
await escribirCargos(CARGOS);

/* ================= 1. NADA QUE ENTREGAR ================= */
console.log('--- 1. no se entrega ---');
const casos = [
  ['sin `recibe` de los cargos (las empresas sí)', { recibe: ['empresas', 'administraciones'] }, async () => {}, [FE]],
  ['sin permiso de escribir', { recibe: ['empresas', 'cargos'], escribir: false }, async () => {}, []],
  ['en solo consultar', { recibe: ['empresas', 'cargos'] }, async () => { await pagina.evaluate(() => { window.__soloAntes = SoloConsulta.activo; SoloConsulta.activo = () => true; }); }, []]
];
for (const [titulo, spec, antes, esperados] of casos) {
  await limpiar();
  await montar(spec);
  await antes();
  await mirar();
  await comprobar('1. ' + titulo + ': no se escribe `ENTREGA cargos`, no se avisa y las otras listas van como siempre',
    [(await entrada()).nombres, (await avisosDeEntrega())], [esperados, []]);
  if (titulo.startsWith('en solo')) await pagina.evaluate(() => { SoloConsulta.activo = window.__soloAntes; });
}

/* ================= 2 a 5. LA FORMA ================= */
console.log('--- 2 a 5. la forma ---');
await limpiar();
await montar({ recibe: ['empresas', 'cargos'] });
const foto0 = await instantanea();
await comprobar('2. con las dos recibidas, los dos ficheros', [await mirar(), (await entrada()).nombres], [{ empresas: 'entregado', administraciones: 'no-recibe', cargos: 'entregado' }, [FC, FE]]);
const e = (await entrada()).json[FC];
await comprobar('2. entrega, conjunto, origen y hechoCon', [e.entrega, e.conjunto, e.origen, e.hechoCon], [1, 'cargos', 'gestor-asuntos-ies', []]);
await comprobar('2. `generado` en hora de Madrid con su desfase', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(e.generado), true);
await comprobar('2. los ocho campos, con su dueño',
  e.campos.map(c => [c.clave, c.etiqueta, c.apartado, c.tipo, c.dueno]),
  [['cargo', 'Cargo (identificador)', 'Cargo', 'texto'], ['cargoNombre', 'Cargo', 'Cargo', 'texto'], ['tratamiento', 'Tratamiento', 'Cargo', 'texto'], ['orden', 'Orden', 'Cargo', 'numero'],
    ['persona', 'Persona', 'Ocupante', 'texto'], ['sexo', 'Sexo', 'Ocupante', 'texto'], ['desde', 'Desde', 'Ocupante', 'fecha'], ['hasta', 'Hasta', 'Ocupante', 'fecha']].map(c => c.concat('gestor-asuntos-ies')));
await comprobar('2. cuatro registros', e.registros.length, 4);
await comprobar('3. los id: `cargo/ocupante`, y el del cargo sin ocupantes, solo el del cargo', e.registros.map(r => r.id), ['direccion/c-d2', 'direccion/c-d1', 'vicedireccion', 'secretaria/c-s1']);
await comprobar('4. el orden: por `orden`, y los dos de Dirección como están en el fichero (el más nuevo primero)',
  e.registros.map(r => [r.datos.cargoNombre, r.datos.persona]), [['Dirección', 'Rosa Sellés Manzano'], ['Dirección', 'Miguel Prado Soler'], ['Vicedirección', undefined], ['Secretaría', 'Fernando Reyes Palma']]);
await comprobar('3. Vicedirección lleva solo los cuatro datos del cargo', e.registros[2].datos, { cargo: 'vicedireccion', cargoNombre: 'Vicedirección', tratamiento: 'El Vicedirector', orden: 2 });
await comprobar('5. un ocupante sin `hasta`, sin `sexo` o sin `desde` no los lleva; la persona, tal cual; `orden` es un número',
  [e.registros[0].datos, e.registros[3].datos],
  [{ cargo: 'direccion', cargoNombre: 'Dirección', tratamiento: 'La Directora', orden: 1, persona: 'Rosa Sellés Manzano', sexo: 'M', desde: '2025-07-01' },
    { cargo: 'secretaria', cargoNombre: 'Secretaría', tratamiento: 'El Secretario', orden: 3, persona: 'Fernando Reyes Palma' }]);
await comprobar('5. el segundo de Dirección lleva `hasta`', e.registros[1].datos.hasta, '2025-06-30');

/* ================= 7 y 11. EL APUNTE Y SOLO LAS ENTREGAS ================= */
console.log('--- 7 y 11. el apunte, y solo las entregas ---');
const ap = await apunte();
await comprobar('7. queda apuntado `entregado.cargos` (cuenta 3, registros 4) junto al de las empresas; `tomado` no cambia',
  [Object.keys(ap.entregado).sort(), ap.entregado.cargos.cuenta, ap.entregado.cargos.registros, ap.entregado.empresas.registros, ap.tomado], [['cargos', 'empresas'], 3, 4, 1, []]);
await comprobar('11. el resto de la carpeta es idéntico, byte a byte', JSON.stringify(await instantanea()) === JSON.stringify(foto0), true);

/* ================= 8. CAMBIOS ================= */
console.log('--- 8. no se repite, y los cambios ---');
await comprobar('8. entrar otra vez no escribe', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'no-recibe', cargos: 'nada-nuevo' }, { [FC]: 1, [FE]: 1 }]);
await vaciarEntrada();
await pagina.evaluate(async () => { await Cargos.anadirOcupante('vicedireccion', 'Lucía Prada Vega', '2026-01-01', 'M'); });
await esperarEntrega(FC);
await pagina.waitForTimeout(500);
await comprobar('8. añadir un ocupante entrega solo los cargos, con lo de ese momento', [await entregas(), (await entrada()).json[FC].registros.map(r => r.datos.persona)],
  [{ [FC]: 1 }, ['Rosa Sellés Manzano', 'Miguel Prado Soler', 'Lucía Prada Vega', 'Fernando Reyes Palma']]);
await vaciarEntrada();
await pagina.evaluate(async () => {
  await Cargos.cerrarOcupante('vicedireccion', (await Cargos.leer()).cargos.find(c => c.id === 'vicedireccion').ocupantes[0].id, '2026-06-30');
  await Cargos.renombrarCargo('secretaria', 'Secretaría General', 'La Secretaria');
  await Cargos.borrarCargo('vicedireccion');
});
await esperarEntrega(FC);
await pagina.waitForTimeout(1200);
const e8 = (await entrada()).json[FC];
await comprobar('8. un cierre, un cambio de nombre y un borrado seguidos dan una sola entrega, con el último estado',
  [await entregas(), e8.registros.map(r => [r.datos.cargoNombre, r.datos.tratamiento])], [{ [FC]: 1 }, [['Dirección', 'La Directora'], ['Dirección', 'La Directora'], ['Secretaría General', 'La Secretaria']]]);

/* ================= 6. FECHAS QUE SE PISAN ================= */
console.log('--- 6. fechas que se pisan ---');
await vaciarEntrada();
await escribirCargos({ cargos: [{ id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'La Directora', ocupantes: [
  { id: 'c-1', persona: 'Pisa Uno', sexo: 'H', desde: '2024-01-01', hasta: '2025-12-31' }, { id: 'c-2', persona: 'Pisa Dos', sexo: 'M', desde: '2025-06-01', hasta: '' },
  { id: 'c-3', persona: 'Al Revés', sexo: '', desde: '2030-01-01', hasta: '2029-01-01' }] }] });
await mirar();
await comprobar('6. dos que se pisan y uno con las fechas al revés se entregan los tres, tal cual',
  (await entrada()).json[FC].registros.map(r => [r.datos.persona, r.datos.desde, r.datos.hasta]),
  [['Pisa Uno', '2024-01-01', '2025-12-31'], ['Pisa Dos', '2025-06-01', undefined], ['Al Revés', '2030-01-01', '2029-01-01']]);

/* ================= 9. POR EL OTRO ORDENADOR ================= */
console.log('--- 9. por el otro ordenador ---');
await vaciarEntrada();
await escribirCargos(CARGOS);   /* sin pasar por Cargos.cambiar: no avisa a nadie */
await pagina.waitForTimeout(800);
await comprobar('9. nada hasta que se mira', await entregas(), {});
await comprobar('9. en la siguiente entrada se entrega, solo los cargos', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'no-recibe', cargos: 'entregado' }, { [FC]: 1 }]);

/* ================= 12. QUIÉN FIRMA ================= */
await comprobar('12. quién firma no cambia: Dirección el 1-ago-2025 es Rosa Sellés Manzano',
  pagina.evaluate(async () => { const f = await Cargos.enFecha('direccion', '2025-08-01'); return f && [f.persona, f.tratamiento]; }), ['Rosa Sellés Manzano', 'La Directora']);

/* ================= 10. SIN FICHERO Y VACÍOS ================= */
console.log('--- 10. sin fichero y vacíos ---');
await vaciarEntrada();
await quitarCargos();
await comprobar('10. sin `cargos.json` no se entrega (no salen los seis de fábrica) y no se avisa', [await mirar(), (await entrada()).nombres, await avisosDeEntrega()],
  [{ empresas: 'nada-nuevo', administraciones: 'no-recibe', cargos: 'sin-fichero' }, [], []]);
await escribirCargos({ cargos: [{ id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'La Directora', ocupantes: [] }] });
await comprobar('10. de tener ocupantes a no tener ninguno no se entrega sola', [await mirar(), await entregas()], [{ empresas: 'nada-nuevo', administraciones: 'no-recibe', cargos: 'vacia' }, {}]);
await comprobar('10. Ajustes lo dice, con su botón',
  pagina.evaluate(async () => { const x = await CentroDeDatosEntregar.estadoParaAjustes('cargos'); return [x.texto, x.boton]; }),
  ['Los cargos no tienen ningún ocupante y antes sí: no los he entregado.', 'vacia']);
await comprobar('10. al pulsar «Entregar de todos modos» se entrega', pagina.evaluate(async () => { const r = await CentroDeDatosEntregar.entregarAhora({ vacia: 'cargos' }); return [r.estado, r.cuenta]; }), ['entregado', 1]);

/* ================= LA COMPROBACIÓN AL ENTRAR ================= */
console.log('--- la comprobación al entrar ---');
const fila = () => pagina.evaluate(async () => { const f = (await ComprobacionEntrada.revisar()).find(x => x.id === 'centro-de-datos'); return f && [f.estado, f.ambar, f.frase]; });
await montar({ recibe: ['empresas', 'administraciones', 'cargos'], escribir: false });
await comprobar('13. la fila ámbar nombra las tres listas', await fila(), ['falta', true, 'Falta el permiso para escribir: las empresas, las Administraciones y los cargos no se entregan al Centro de datos.']);
await montar({ recibe: ['cargos'], escribir: false });
await comprobar('13. si solo recibe los cargos, nombra solo esos', await fila(), ['falta', true, 'Falta el permiso para escribir: los cargos no se entregan al Centro de datos.']);

const deVerdad = errores.filter(e => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
