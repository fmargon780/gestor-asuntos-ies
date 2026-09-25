/* Prueba en navegador de verdad de la fila 167 (25-sep-2026,
   docs/ADMINISTRACIONES-COMO-TERCERO.md): las Administraciones como
   tercero. Datos inventados. Mismo disco de mentira que pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const T_OTROS = 'Ayuntamiento de Villaprueba P2999999X';
const ABIERTO_OTROS = '260920 CORRESPONDENCIA ' + T_OTROS;
const ARCHIVADO_OTROS = '250310 CONVENIO ' + T_OTROS;
const ABIERTO_DELEGACION = '260921 CORRESPONDENCIA Delegación Educación Málaga';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* Un tercero de OTROS dado de alta, con un asunto abierto (con hitos y
   una nota) y otro archivado (con su _ficha.json y una nota). */
await pagina.evaluate(async (d) => {
  const D = window.__disco;
  const g = await D.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const datos = await g.getDirectoryHandle('datos', { create: true });
  datos._hijos.set('otros.csv', D.fich('otros.csv', 'Nombre;Referencia;Teléfono;Correo\r\nAyuntamiento de Villaprueba;P2999999X;952000000;registro@villaprueba.es\r\n'));
  g._hijos.set('asuntos.json', D.fich('asuntos.json', JSON.stringify({ asuntos: {
    [d.abierto]: { tercero: d.t, categoria: 'OTROS', abiertoPor: 'Francisco',
      notas: [{ texto: 'Nota del abierto', quien: 'Francisco', cuando: '2026-09-20 10:00' }] }
  } })));
  g._hijos.set('hitos.json', D.fich('hitos.json', JSON.stringify({ ajustes: {}, porAsunto: {
    [d.abierto]: { creados: '2026-09-20', hitos: [{ id: 'h-prueba', titulo: 'Paso de prueba', clase: 'paso', estado: 'hecho' }] }
  } })));
  await D.abiertos.getDirectoryHandle(d.abierto, { create: true });
  const cat = await D.archivo.getDirectoryHandle('OTROS', { create: true });
  const ter = await cat.getDirectoryHandle(d.t, { create: true });
  const arch = await ter.getDirectoryHandle(d.archivado, { create: true });
  arch._hijos.set('_ficha.json', D.fich('_ficha.json', JSON.stringify({ estado: 'cerrado', categoria: 'OTROS', tercero: d.t,
    notas: [{ texto: 'Nota del archivado', quien: 'Francisco', cuando: '2025-03-10 10:00' }] })));
  arch._hijos.set('250310 CONVENIO.pdf', D.fich('250310 CONVENIO.pdf', 'pdf'));
}, { t: T_OTROS, abierto: ABIERTO_OTROS, archivado: ARCHIVADO_OTROS });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(400);

/* ---------- 1. Alta de un organismo (dos niveles) y de un centro ---------- */
console.log('--- 1. altas ---');
const r1 = await pagina.evaluate(async () => {
  const A = window.Administraciones;
  const del = await A.alta(App.E.datos, { clase: 'organismo', corto: 'Delegación Educación Málaga',
    oficial: 'Delegación Territorial de Pruebas en Málaga', superior: 'Consejería de Pruebas', correo: 'delegacion@ejemplo.es' });
  const serv = await A.anadirDepartamento(App.E.datos, del.id, null, { nombre: 'Servicio de Planificación' });
  const secc = await A.anadirDepartamento(App.E.datos, del.id, serv.id, { nombre: 'Sección de Escolarización', correo: 'escolarizacion@ejemplo.es' });
  const insp = await A.alta(App.E.datos, { clase: 'organismo', corto: 'Inspección Málaga', superior: 'Consejería de Pruebas' });
  const ies = await A.alta(App.E.datos, { clase: 'centro', corto: 'IES Ejemplo', codigoCentro: '29000000', oficial: 'Instituto de Ejemplo' });
  let repetido = '';
  try { await A.alta(App.E.datos, { clase: 'organismo', corto: 'Delegación Educación Málaga' }); } catch (e) { repetido = e.message; }
  const d = A.enMemoria();
  const o = A.organismoPorId(d, del.id);
  return {
    carpetas: [A.tercero(o), A.tercero(A.organismoPorId(d, ies.id))],
    arbol: A.aplanar(o).map((x) => x.nivel + ':' + x.nombre),
    centro: A.aplanar(A.organismoPorId(d, ies.id)).map((x) => x.nombre),
    repetido: repetido, ids: { del: del.id, insp: insp.id, secc: secc.id }
  };
});
await comprobar('1. los nombres de carpeta', r1.carpetas, ['Delegación Educación Málaga', 'IES Ejemplo 29000000']);
await comprobar('1. el organismo, con dos niveles de departamentos', r1.arbol, ['0:Servicio de Planificación', '1:Sección de Escolarización']);
await comprobar('1. el centro trae sus tres departamentos', r1.centro, ['Secretaría', 'Dirección', 'Jefatura de Estudios']);
await comprobar('1. dos con el mismo nombre corto, no', r1.repetido, 'Ya hay uno que se llama «Delegación Educación Málaga».');
await comprobar('1. se guarda en _GESTOR/datos/administraciones.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const datos = await g.getDirectoryHandle('datos');
  return JSON.parse(await (await datos._hijos.get('administraciones.json').getFile()).text()).organismos.length;
}), 3);

/* ---------- 2. Cambiar el nombre de la Consejería ---------- */
console.log('--- 2. «Depende de» ---');
await pagina.evaluate(async (d) => {
  await window.__disco.abiertos.getDirectoryHandle(d.abierto, { create: true });
  await App.anotar(d.abierto, { categoria: 'ADMINISTRACIONES', tercero: 'Delegación Educación Málaga',
    departamento: { id: d.secc, nombre: 'Sección de Escolarización', correo: 'escolarizacion@ejemplo.es' } });
  await App.verAbiertos();
}, { abierto: ABIERTO_DELEGACION, secc: r1.ids.secc });
const r2 = await pagina.evaluate(async (ids) => {
  const A = window.Administraciones;
  const antes = Array.from(window.__disco.abiertos._hijos.keys()).sort();
  const sup = A.organismoPorId(A.enMemoria(), ids.del).superior;
  await A.renombrarSuperior(App.E.datos, sup, 'Consejería de Pruebas y Ensayos');
  const f = await Datos.cargar(App.E.datos, 'ADMINISTRACIONES');
  const porViejo = Datos.buscar(f.lista, 'Consejería de Pruebas', 10).filter((p) => p.clase === 'organismo').map((p) => p.nombre).sort();
  return {
    superiores: f.lista.filter((p) => p.clase === 'organismo').map((p) => p.superior),
    antes: A.superiorPorId(A.enMemoria(), sup).antes.map((x) => x.nombre),
    porViejo: porViejo,
    grupos: A.agrupar(f.lista).map((g) => g.titulo),
    carpetasIguales: JSON.stringify(Array.from(window.__disco.abiertos._hijos.keys()).sort()) === JSON.stringify(antes)
  };
}, r1.ids);
await comprobar('2. cambia en los dos organismos', r2.superiores, ['Consejería de Pruebas y Ensayos', 'Consejería de Pruebas y Ensayos']);
await comprobar('2. el nombre de antes se guarda', r2.antes, ['Consejería de Pruebas']);
await comprobar('2. el buscador los encuentra por el nombre de antes', r2.porViejo, ['Delegación Educación Málaga', 'Inspección Málaga']);
await comprobar('2. agrupados por «Depende de», y los centros aparte', r2.grupos, ['Organismos · Consejería de Pruebas y Ensayos', 'Centros educativos']);
await comprobar('2. ninguna carpeta cambia', r2.carpetasIguales, true);

/* ---------- 3. Un asunto con departamento ---------- */
console.log('--- 3. el departamento en el asunto ---');
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await pagina.locator('.tarjeta-nombre', { hasText: ABIERTO_DELEGACION }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(500);
await comprobar('3. sale en «Datos del trámite»', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#pantalla-asunto .ficha-dato')).some((f) => /Departamento/.test(f.textContent) && /Sección de Escolarización/.test(f.textContent))), true);
await comprobar('3. y en «Datos y contacto»', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('.tercero-detalle')).some((p) => /Departamento: Sección de Escolarización/.test(p.textContent))), true);
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#correo-otro');
await comprobar('3. en Correo se propone el correo del departamento', pagina.locator('#correo-otro').inputValue(), 'escolarizacion@ejemplo.es');
await comprobar('3. y el del organismo no va marcado', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('.correo-marca')).filter((c) => c.checked).map((c) => c.value)), []);
await comprobar('3. los huecos nuevos', pagina.evaluate(async (n) => {
  const a = App.E.listaAbiertos.find((x) => x.nombre === n);
  const v = await Plantillas.valoresDeAsunto(a);
  return [v.departamento, v.departamentocorreo, v.organismooficial];
}, ABIERTO_DELEGACION), ['Sección de Escolarización', 'escolarizacion@ejemplo.es', 'Delegación Territorial de Pruebas en Málaga']);
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* El desplegable de Nuevo asunto, con el árbol. */
await comprobar('3. al elegir el organismo en Nuevo asunto sale el desplegable con el árbol', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ADMINISTRACIONES');
  App.E.nuevo.categoria = 'ADMINISTRACIONES';
  App.fijarTercero(f.lista.find((p) => p.nombre === 'Delegación Educación Málaga'));
  const sel = document.getElementById('nuevo-departamento');
  return sel ? Array.from(sel.options).map((o) => o.textContent) : null;
}), ['Sin departamento', 'Servicio de Planificación', '— Sección de Escolarización']);

/* ---------- 4. «Pasar a Administraciones» ---------- */
console.log('--- 4. pasar lo de OTROS ---');
const r4 = await pagina.evaluate(async (d) => {
  const T = window.AdministracionesTraer;
  const lista = await T.candidatos();
  const c = lista.find((x) => x.tercero === d.t);
  const vistos = c ? [c.categoria, c.abiertos, c.archivados, !!c.persona] : null;
  const propuesta = T.propuesta(d.t);
  const r = await T.pasar([{ candidato: c, elegido: { clase: 'organismo', corto: 'Ayuntamiento Villaprueba', codigo: '' } }]);
  const nuevoAbierto = '260920 CORRESPONDENCIA Ayuntamiento Villaprueba';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const asuntos = JSON.parse(await (await g._hijos.get('asuntos.json').getFile()).text()).asuntos;
  const hitos = JSON.parse(await (await g._hijos.get('hitos.json').getFile()).text()).porAsunto;
  const archAdm = window.__disco.archivo._hijos.get('ADMINISTRACIONES');
  const terNuevo = archAdm && archAdm._hijos.get('Ayuntamiento Villaprueba');
  const archNuevo = terNuevo && terNuevo._hijos.get('250310 CONVENIO Ayuntamiento Villaprueba');
  const fichaArch = archNuevo ? JSON.parse(await (await archNuevo._hijos.get('_ficha.json').getFile()).text()) : null;
  const datos = await g.getDirectoryHandle('datos');
  return {
    vistos: vistos, propuesta: propuesta, hechos: r.hechos.length, fallidos: r.fallidos,
    carpetaAbierta: window.__disco.abiertos._hijos.has(nuevoAbierto) && !window.__disco.abiertos._hijos.has(d.abierto),
    ficha: asuntos[nuevoAbierto] ? [asuntos[nuevoAbierto].categoria, asuntos[nuevoAbierto].tercero, asuntos[nuevoAbierto].notas.map((n) => n.texto).join('|')] : null,
    hitos: hitos[nuevoAbierto] ? hitos[nuevoAbierto].hitos.some((h) => h.id === 'h-prueba') : false,
    hitosViejos: !!hitos[d.abierto],
    archivado: fichaArch ? [fichaArch.categoria, fichaArch.tercero, fichaArch.notas[0].texto, archNuevo._hijos.has('250310 CONVENIO.pdf')] : null,
    otrosVacio: !window.__disco.archivo._hijos.get('OTROS')._hijos.has(d.t),
    altaVieja: /Villaprueba/.test(await (await datos._hijos.get('otros.csv').getFile()).text()),
    enLaLista: (await Datos.cargar(App.E.datos, 'ADMINISTRACIONES')).lista.some((p) => p.nombre === 'Ayuntamiento Villaprueba')
  };
}, { t: T_OTROS, abierto: ABIERTO_OTROS });
await comprobar('4. sale en la lista, con su abierto, su archivado y su alta', r4.vistos, ['OTROS', 1, 1, true]);
await comprobar('4. nombre corto propuesto sin el código', r4.propuesta, { clase: 'organismo', corto: 'Ayuntamiento de Villaprueba', codigo: '' });
await comprobar('4. pasado sin fallos', [r4.hechos, r4.fallidos], [1, []]);
await comprobar('4. el abierto, renombrado', r4.carpetaAbierta, true);
await comprobar('4. su ficha en la categoría nueva, con su nota', r4.ficha, ['ADMINISTRACIONES', 'Ayuntamiento Villaprueba', 'Nota del abierto']);
await comprobar('4. con sus hitos, que ya no están con el nombre viejo', [r4.hitos, r4.hitosViejos], [true, false]);
await comprobar('4. el archivado, en ARCHIVO/ADMINISTRACIONES, con su ficha, su nota y su documento', r4.archivado,
  ['ADMINISTRACIONES', 'Ayuntamiento Villaprueba', 'Nota del archivado', true]);
await comprobar('4. ya no queda en ARCHIVO/OTROS', r4.otrosVacio, true);
await comprobar('4. el alta vieja desaparece de otros.csv', r4.altaVieja, false);
await comprobar('4. y está en Administraciones', r4.enLaLista, true);

await comprobar('los tipos marcados pasan a la categoría nueva', pagina.evaluate(async () => {
  await window.AdministracionesTraer.moverTipos(['INSPECCION']);
  return App.E.tipos.find((t) => t.tipo === 'INSPECCION').categoria;
}), 'ADMINISTRACIONES');

/* La ficha en Personas y empresas: el árbol y los nombres de antes. */
await pagina.evaluate(async () => {
  App.ir('personas');
  document.getElementById('filtro-personas').value = 'ADMINISTRACIONES';
  await App.pintarPersonas();
});
await pagina.waitForTimeout(200);
await comprobar('Personas: los grupos', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#lista-personas .personas-bloque-titulo')).map((x) => x.textContent)),
  ['Organismos · Consejería de Pruebas y Ensayos (2)', 'Organismos · Otros organismos (1)', 'Centros educativos (1)']);
await pagina.locator('#lista-personas .resultado', { hasText: 'Delegación Educación Málaga' }).first().click();
await pagina.waitForTimeout(200);
await comprobar('Personas: la ficha trae el árbol y «Antes»', pagina.evaluate(() => {
  const f = document.getElementById('ficha-persona');
  return [f.querySelectorAll('.adm-dep').length, /Antes/.test(f.textContent) && /Consejería de Pruebas/.test(f.textContent),
    !!f.querySelector('#adm-dep-nuevo')];
}), [2, true, true]);

/* El alta a mano y «+ Departamento», pulsando de verdad. */
await pagina.getByRole('button', { name: '+ Dar de alta uno nuevo' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #adm-corto');
await pagina.check('input[name="adm-clase"][value="centro"]');
await pagina.fill('#adm-corto', 'CEIP Inventado');
await pagina.fill('#adm-codigo', '29111111');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('alta a mano de un centro desde Personas', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ADMINISTRACIONES');
  const p = f.lista.find((x) => x.nombre === 'CEIP Inventado');
  return p ? [App.textoTercero(p), p.clase] : null;
}), ['CEIP Inventado 29111111', 'centro']);
await pagina.locator('#lista-personas .resultado', { hasText: 'Inspección Málaga' }).first().click();
await pagina.waitForTimeout(200);
await pagina.click('#adm-dep-nuevo');
await pagina.waitForSelector('#capa:not(.oculto) #adm-dep-nombre');
await pagina.fill('#adm-dep-nombre', 'Equipo de Zona');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('«+ Departamento» lo añade y la ficha se repinta', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#ficha-persona .adm-dep strong')).map((x) => x.textContent)), ['Equipo de Zona']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
