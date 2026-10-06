/* Prueba en navegador de la fila 277 de docs/COLA.md (docs/TIPOS-QUE-SON-EL-MISMO.md):
   dos tipos de asunto que son el mismo, la unión sola, el aviso de Inicio y su cuadro.
   Disco de mentira, con tipos.json escrito a mano para montar cada caso. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const TIPOS = [
  /* 2: nombre antiguo, pero con algo propio -> no se unen */
  { tipo: 'BAJA NUEVA', categoria: 'ALUMNADO', alias: ['BAJA ANTIGUA'] },
  { tipo: 'BAJA ANTIGUA', categoria: 'ALUMNADO' },
  { tipo: 'PERMISO NUEVO', categoria: 'ALUMNADO', alias: ['PERMISO ANTIGUO'] },
  { tipo: 'PERMISO ANTIGUO', categoria: 'ALUMNADO' },
  { tipo: 'SOBRE NUEVO', categoria: 'ALUMNADO', alias: ['SOBRE ANTIGUO'] },
  { tipo: 'SOBRE ANTIGUO', categoria: 'ALUMNADO', reservado: true },
  /* 7: se parecen, para «Unir» desde el cuadro */
  { tipo: 'CERTIFICADO ESTUDIOS', categoria: 'ALUMNADO' },
  { tipo: 'CERTIFICADO ESTUDIO', categoria: 'ALUMNADO' }
];
const A1 = '260915 A26-0001 ANULACION Sola Uno, Eva 9990201';
const A2 = '260915 A26-0002 ANULACION Sola Dos, Ana 9990202';
const C1 = '260915 A26-0003 CERTIFICADO ESTUDIOS Sola Tres, Pia 9990203';

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([tipos, a1, a2, c1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const esc = async (n, o) => { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(JSON.stringify(o)); await w.close(); };
  await esc('tipos.json', tipos);
  /* «SOBRE ANTIGUO» no tiene guía; BAJA ANTIGUA sí; PERMISO ANTIGUO tiene una plantilla. */
  await esc('guias.json', { 'BAJA ANTIGUA': [{ id: 'g1', titulo: 'Un hito de verdad', cuerpo: '', opciones: [] }] });
  await esc('plantillas.json', { lista: [{ id: 'pl1', tipo: 'PERMISO ANTIGUO', categoria: 'ALUMNADO', nombre: 'Una', texto: 'Texto' }], documentos: [] });
  for (const n of [a1, a2, c1]) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [TIPOS, A1, A2, C1]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2, c1]) => {
  const f = (n, tipo, ter) => App.anotar(n, { abiertoEl: U.ahora(), tipo, categoria: 'ALUMNADO', tercero: ter, curso: '26-27', grupo: '', descripcion: '', campos: {}, numero: n.split(' ')[1] });
  /* 1: nombre antiguo y nada propio -> se unen solos (con dos asuntos abiertos del antiguo). */
  App.E.tipos.push({ tipo: 'ANULACION DE MATRICULA', categoria: 'ALUMNADO', alias: ['ANULACION'] }, { tipo: 'ANULACION', categoria: 'ALUMNADO' });
  await App.guardarTipos();
  await f(a1, 'ANULACION', 'Sola Uno, Eva 9990201');
  await f(a2, 'ANULACION', 'Sola Dos, Ana 9990202');
  await f(c1, 'CERTIFICADO ESTUDIOS', 'Sola Tres, Pia 9990203');
  await App.verAbiertos();
  window.__avisos = [];
  const o = U.aviso;
  U.aviso = function (m, t) { window.__avisos.push(String(m) + '|' + t); return o.apply(this, arguments); };
}, [A1, A2, C1]);
/* Para que mire la lista que acabamos de montar. */
await pagina.evaluate(() => { TiposParecidos._mirar(); });
await pagina.waitForTimeout(5000);

const nombresDeTipos = () => pagina.evaluate(() => App.E.tipos.map((t) => t.tipo).sort());
const avisos = () => pagina.evaluate(() => window.__avisos.slice());

console.log('--- 1. nombre antiguo y nada propio: se unen solos ---');
await comprobar('1. «ANULACION» ya no está, «ANULACION DE MATRICULA» sí', pagina.evaluate(() => [App.E.tipos.some((t) => t.tipo === 'ANULACION'), App.E.tipos.some((t) => t.tipo === 'ANULACION DE MATRICULA')]), [false, true]);
await comprobar('1. tiene lápida', pagina.evaluate(async () => JSON.stringify(await Carpetas.leerJson(App.E.gestor, 'borrados-listas.json')).indexOf('ANULACION') !== -1), true);
await comprobar('1. sus dos asuntos abiertos llevan el tipo nuevo, en la carpeta y en la ficha', pagina.evaluate(() => {
  const l = App.E.listaAbiertos.filter((a) => /A26-000[12]/.test(a.nombre));
  return l.map((a) => [/ANULACION DE MATRICULA/.test(a.nombre), a.ficha.tipo]).sort();
}), [[true, 'ANULACION DE MATRICULA'], [true, 'ANULACION DE MATRICULA']]);
await comprobar('1. aviso verde: era el nombre antiguo, los he unido, 2 asuntos abiertos', (await avisos()).filter((a) => /nombre antiguo/.test(a)),
  ['«ANULACION» era el nombre antiguo de «ANULACION DE MATRICULA». Los he unido. 2 asuntos abiertos pasan a «ANULACION DE MATRICULA».|bueno']);

console.log('--- 2. con algo propio, no se unen ---');
await comprobar('2. siguen los seis tipos con nombre antiguo y salen en las parejas con su motivo', pagina.evaluate(async () => {
  const ps = await TiposParecidos.parejas();
  return ps.filter((p) => p.antiguo).map((p) => [p.antiguo.viejo.tipo, p.motivo]).sort();
}), [['BAJA ANTIGUA', 'tiene guía'], ['PERMISO ANTIGUO', 'tiene plantillas'], ['SOBRE ANTIGUO', 'es reservado']]);
await comprobar('2. y siguen existiendo', pagina.evaluate(() => ['BAJA ANTIGUA', 'PERMISO ANTIGUO', 'SOBRE ANTIGUO'].every((n) => App.E.tipos.some((t) => t.tipo === n))), true);

console.log('--- 3. solo consulta ---');
await pagina.evaluate(async () => { App.E.tipos.push({ tipo: 'FIN NUEVO', categoria: 'ALUMNADO', alias: ['FIN ANTIGUO'] }, { tipo: 'FIN ANTIGUO', categoria: 'ALUMNADO' }); await App.guardarTipos(); window.__sc = SoloConsulta.activo; SoloConsulta.activo = () => true; });
const antesAvisos = (await avisos()).length;
await pagina.evaluate(() => TiposParecidos._pasada());
await comprobar('3. en solo consulta no se une nada y no sale el trozo del aviso', pagina.evaluate(() => [App.E.tipos.some((t) => t.tipo === 'FIN ANTIGUO'), !!document.body.textContent.match(/tipos de asunto parecidos|Tipos de asunto parecidos/)]), [true, false]);
await pagina.evaluate(() => { SoloConsulta.activo = window.__sc; });

console.log('--- 4. con un guardado en marcha, espera ---');
await pagina.evaluate(() => { window.__hg = ColaGuardado.hayGuardado; ColaGuardado.hayGuardado = () => true; TiposParecidos._mirar(); });
await pagina.waitForTimeout(3500);
await comprobar('4. mientras hay un guardado, no se une', pagina.evaluate(() => App.E.tipos.some((t) => t.tipo === 'FIN ANTIGUO')), true);
await pagina.evaluate(() => { ColaGuardado.hayGuardado = window.__hg; });
await pagina.waitForTimeout(5000);
await comprobar('4. terminado el guardado, se une', pagina.evaluate(() => App.E.tipos.some((t) => t.tipo === 'FIN ANTIGUO')), false);

console.log('--- 5. cuándo se parecen ---');
await comprobar('5. los que sí, uno por regla', pagina.evaluate(() => [
  ['BAJA MÉDICA', 'MEDICA BAJAS'], ['ANULACIÓN MATRÍCULA', 'ANULACIÓN DE MATRÍCULA'], ['ANULACIÓN', 'ANULACIÓN DE MATRÍCULA'],
  ['PREMIO FINAL', 'PREMIO FINAI'], ['TUTORÍA', 'XXXXXX']
].map(([a, b], i) => TiposParecidos.seParecen({ tipo: a }, i === 4 ? { tipo: b, nombreCorto: 'TUTORÍA' } : { tipo: b }))),
  ['mismas palabras', 'mismas palabras', 'principio', 'una letra', 'nombre corto']);
await comprobar('5. los que no', pagina.evaluate(() => [
  ['MATRÍCULA', 'ANULACIÓN DE MATRÍCULA'], ['CERTIFICADO DE NOTAS', 'CERTIFICADO DE MATRÍCULA'], ['ACTA 1', 'ACTA 2'], ['ALTA', 'BAJA'], ['ACTA 12', 'ACTA 22']
].map(([a, b]) => TiposParecidos.seParecen({ tipo: a }, { tipo: b }))), ['', '', '', '', '']);

console.log('--- 6 y 7. el aviso y el cuadro ---');
await pagina.evaluate(async () => { await App.verAbiertos(); App.ir('abiertos'); await TiposParecidos.repintarAviso(); });
await pagina.waitForTimeout(500);
await comprobar('6. el trozo del aviso sale en Inicio', pagina.evaluate(() => /tipos de asunto parecidos|Tipos de asunto parecidos: \d+ parejas/i.test(document.body.textContent)), true);
await pagina.evaluate(() => { TiposParecidosCuadro.abrir(); });
await pagina.waitForSelector('#capa:not(.oculto) #tp-lista .tp-fila');
await comprobar('6. el cuadro, con «Unir» y «No son el mismo» en cada fila y la línea gris del nombre antiguo', pagina.evaluate(() => {
  const filas = Array.from(document.querySelectorAll('#tp-lista .tp-fila'));
  return [document.getElementById('cuadro-titulo').textContent, filas.length >= 4,
    filas.every((f) => f.querySelector('[data-accion="unir"]') && f.querySelector('[data-accion="distintos"]')),
    filas.some((f) => /es el nombre antiguo de/.test(f.textContent))];
}), ['Tipos de asunto parecidos', true, true, true]);
const filasAntes = await pagina.locator('#tp-lista .tp-fila').count();
/* «No son el mismo» en la pareja de nombre antiguo con palabras clave. */
await pagina.evaluate(() => { App.E.tipos.filter((t) => t.tipo === 'SOBRE ANTIGUO')[0].reservado = false; });
await pagina.locator('#tp-lista .tp-fila', { hasText: 'SOBRE ANTIGUO' }).locator('[data-accion="distintos"]').click();
await pagina.waitForTimeout(800);
await comprobar('6. la fila se va y el cuadro sigue abierto', [await pagina.locator('#tp-lista .tp-fila').count(), await pagina.locator('#capa:not(.oculto)').count()], [filasAntes - 1, 1]);
await comprobar('6. queda apuntado en _GESTOR y el nombre sale del alias', pagina.evaluate(async () => {
  const j = await Carpetas.leerJson(App.E.gestor, 'tipos-distintos.json');
  const nuevo = App.E.tipos.filter((t) => t.tipo === 'SOBRE NUEVO')[0];
  return [j.distintos.length, (nuevo.alias || []).length];
}), [1, 0]);
await comprobar('6. la pasada siguiente no los une, y la pareja no vuelve', pagina.evaluate(async () => {
  await TiposParecidos._pasada();
  const ps = await TiposParecidos.parejas();
  return [App.E.tipos.some((t) => t.tipo === 'SOBRE ANTIGUO'), ps.some((p) => /SOBRE/.test(p.a.tipo) && /SOBRE/.test(p.b.tipo))];
}), [true, false]);

/* «Unir» eligiendo el que no venía marcado. */
await pagina.locator('#tp-lista .tp-fila', { hasText: 'CERTIFICADO ESTUDIOS' }).locator('[data-accion="unir"]').click();
await pagina.waitForSelector('#tp-lista .tp-uniendo');
const quePartida = await pagina.evaluate(() => document.querySelector('#tp-lista .tp-uniendo input:checked').parentNode.textContent.trim());
await comprobar('7. sin otro cuadro encima, pregunta «¿Con cuál te quedas?», con una marcada y el resumen', pagina.evaluate(() => [
  document.querySelectorAll('#capa').length, /¿Con cuál te quedas\?/.test(document.querySelector('#tp-lista .tp-uniendo').textContent),
  /desaparece y todo pasa a/.test(document.querySelector('#tp-lista .tp-resumen').textContent),
  /El ARCHIVO no se toca/.test(document.querySelector('#tp-lista .tp-resumen').textContent)]), [1, true, true, true]);
const otra = quePartida === 'CERTIFICADO ESTUDIOS' ? 'CERTIFICADO ESTUDIO' : 'CERTIFICADO ESTUDIOS';
await pagina.locator('#tp-lista .tp-uniendo .tp-opcion', { hasText: new RegExp('^\\s*' + otra + '\\s*$') }).locator('input').check();
await pagina.waitForTimeout(200);
await comprobar('7. al cambiar la opción, el resumen cambia', pagina.evaluate((o) => document.querySelector('#tp-lista .tp-resumen').textContent.indexOf('pasa a «' + o + '»') !== -1, otra), true);
await pagina.click('#tp-lista [data-accion="confirmar"]');
await pagina.waitForTimeout(1500);
const sobrevive = await pagina.evaluate((o) => App.E.tipos.some((t) => t.tipo === o), otra);
await comprobar('7. se queda el que se eligió y el otro desaparece', [sobrevive, await pagina.evaluate((q) => App.E.tipos.some((t) => t.tipo === q), quePartida)], [true, false]);
await comprobar('7. aviso «Unidos. …»', (await avisos()).some((a) => /^Unidos\. /.test(a)), true);
await pagina.keyboard.press('Escape').catch(() => {});

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
