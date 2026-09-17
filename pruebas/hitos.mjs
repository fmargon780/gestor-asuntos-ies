/* Prueba en navegador de verdad de los hitos de un asunto (16-sep-2026,
   docs/HITOS.md, sección 14; ajustada el 17-sep-2026, fila 26,
   docs/HITOS-SON-LA-GUIA.md: ya no hace falta ningún botón para
   crearlos, nacen solos al abrir la ficha). A 1905px, como pide el
   encargo. Nada de fechas escritas a mano: el plazo se cuenta desde
   hoy.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
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

/* ---------- una referencia INDEPENDIENTE de días hábiles, para no
   comparar la aplicación consigo misma en el escenario del plazo ---------- */
function sumarDiasHabilesRef(desde, dias, noLectivos) {
  const festivos = new Set(noLectivos);
  const d = new Date(desde.getTime());
  let contados = 0;
  while (contados < dias) {
    d.setDate(d.getDate() + 1);
    const diaSemana = d.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;
    const iso = isoDe(d);
    if (festivos.has(iso)) continue;
    contados++;
  }
  return isoDe(d);
}
function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function aammdd(d) {
  return String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}

/* ================= LA GUÍA DE PRUEBA =================

   p1 -> p2 (con estado del asunto) -> p3 (decisión: "en mano" [p3a1,
   p3a2] u "por email" [p3b]) -> p4 (responsable = el tercero, plazo
   de 10 días hábiles desde que p2 se completa).

   guías-enganche.js solo lee guias.json una vez, la primera vez que
   la aplicación entra con la carpeta ya señalada (arrancar()); a
   partir de ahí se queda con lo que tenía en memoria, aunque el
   fichero cambie en el disco (igual que si el compañero editara la
   guía desde el otro ordenador: hace falta volver a entrar para
   verla). Por eso este fichero de mentira, y el RegAlum, se escriben
   ANTES del primer #btn-entrar, no después. */
const GUIA = [
  { id: 'p1', titulo: 'Registrar la solicitud', cuerpo: '', opciones: [] },
  { id: 'p2', titulo: 'Notificación', cuerpo: '', estadoAsunto: 'EN TRÁMITE', opciones: [] },
  { id: 'p3', titulo: '¿Cómo se ha recibido la documentación?', cuerpo: '', opciones: [
    { id: 'o1', titulo: 'En mano', pasos: [
      { id: 'p3a1', titulo: 'Sellar la entrega', cuerpo: '' },
      { id: 'p3a2', titulo: 'Archivar copia', cuerpo: '' }
    ] },
    { id: 'o2', titulo: 'Por email', pasos: [
      { id: 'p3b', titulo: 'Guardar el correo', cuerpo: '' }
    ] }
  ] },
  { id: 'p4', titulo: 'Firma del director', cuerpo: '', responsable: 'tercero',
    plazo: { dias: 10, desde: 'p2' }, opciones: [] }
];

/* ================= ESCENARIO 10: hitos.json roto ================= */

console.log('--- escenario 10: hitos.json roto no deja entrar ---');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* Un RegAlum de mentira con un alumno, para el responsable "papel" y
   para crear el asunto. Se escribe aquí, junto con la guía, todo
   antes del primer #btn-entrar (ver el porqué arriba). */
await pagina.evaluate(async (guia) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csvH = await d.getFileHandle('RegAlum.csv', { create: true });
  const w1 = await csvH.createWritable(); await w1.write(csv); await w1.close();

  const guiaH = await g.getFileHandle('guias.json', { create: true });
  const w2 = await guiaH.createWritable();
  await w2.write(JSON.stringify({ MATRICULA: guia }));
  await w2.close();
}, GUIA);

const nombreCopia = 'hitos-' + aammdd(new Date()) + '.json';
await pagina.evaluate(async (nombreCopia) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const roto = await g.getFileHandle('hitos.json', { create: true });
  const w1 = await roto.createWritable();
  await w1.write('{ESTO NO ES JSON');
  await w1.close();
  const copias = await g.getDirectoryHandle('copias', { create: true });
  const buena = await copias.getFileHandle(nombreCopia, { create: true });
  const w2 = await buena.createWritable();
  await w2.write(JSON.stringify({ ajustes: { responsables: [], noLectivos: [] }, porAsunto: {} }));
  await w2.close();
}, nombreCopia);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aviso-roto:not(.oculto)');
await comprobar('el aviso rojo dice que hitos.json no se puede leer',
  pagina.locator('#aviso-roto').textContent().then(t => t.indexOf('hitos.json') !== -1), true);
await comprobar('no ha entrado en la aplicación',
  pagina.locator('#aplicacion').isVisible(), false);

await pagina.getByRole('button', { name: 'Restaurar la última copia' }).click();
await pagina.waitForTimeout(300);
await comprobar('avisa de que se ha restaurado',
  pagina.locator('#aviso-roto').textContent().then(t => t.indexOf('restaurado') !== -1), true);

await pagina.getByRole('button', { name: 'Volver a intentar entrar' }).click();
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await comprobar('ahora sí entra', pagina.locator('#lista-abiertos').isVisible(), true);
await pagina.click('#btn-barra');

/* ================= ESCENARIO 1: asunto nuevo, primer hito en curso ================= */

console.log('--- escenario 1: un asunto nuevo nace con sus hitos ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'marina');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-07');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(400);

const CLAVE = '260907 MATRICULA 26-27 Aguilar Ponce, Marina 1140233';

async function abrirFicha(clave) {
  await pagina.evaluate((clave) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === clave)[0];
    App.abrirFicha(a, 'abierto');
  }, clave);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .hito').length > 0);
  await pagina.waitForTimeout(400);
}

async function leerHitosDeDisco(clave) {
  return pagina.evaluate(async (clave) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    return (j.porAsunto && j.porAsunto[clave]) || null;
  }, clave);
}

await comprobar('el asunto ha nacido con hitos', leerHitosDeDisco(CLAVE).then(e => !!(e && e.hitos.length)), true);

await abrirFicha(CLAVE);
await comprobar('salen los hitos de arriba (p1, p2, p3): p4 queda cortado por la decisión',
  pagina.locator('#ficha-guia .hito').count(), 3);
await comprobar('el primero está en curso',
  pagina.locator('#ficha-guia .hito[data-id="p1"]').getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);

/* ================= ESCENARIO 2: asunto viejo, hitos automáticos ================= */

console.log('--- escenario 2: un asunto viejo crea sus hitos solo, importando lo ya marcado ---');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
const CLAVE_VIEJA = '260601 MATRICULA Asunto Viejo, Nadie 0000';
await pagina.evaluate(async (clave) => {
  await window.__disco.abiertos.getDirectoryHandle(clave, { create: true });
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await f.getFile()).text());
  j.asuntos[clave] = {
    estado: 'abierto', tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Asunto Viejo, Nadie 0000',
    abiertoPor: 'Francisco', pasosHechos: ['p1'], pasosElegidos: { p3: 'o1' }
  };
  const w = await f.createWritable();
  await w.write(JSON.stringify(j));
  await w.close();
  /* #btn-recargar solo vuelve a leer la carpeta, no asuntos.json (eso
     solo pasa al entrar, editar o desde ciertas pantallas): sin esto,
     App.E.registro se quedaría con la copia vieja, sin pasosHechos ni
     pasosElegidos. */
  await App.cargarRegistro();
}, CLAVE_VIEJA);
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);

await abrirFicha(CLAVE_VIEJA);

await comprobar('no sale ningún botón de "Crear los hitos": se han creado solos',
  pagina.getByRole('button', { name: 'Crear los hitos de la guía' }).count(), 0);
await comprobar('la guía ya no se ve como texto con casillas',
  pagina.locator('#ficha-guia .paso-casilla').count(), 0);
await comprobar('p1 nace hecho (venía en pasosHechos)',
  pagina.locator('#ficha-guia .hito[data-id="p1"]').getAttribute('class').then(c => c.indexOf('hito-hecho') !== -1), true);
await comprobar('p3 nace con su rama ya elegida (o1, pasosElegidos)',
  pagina.locator('#ficha-guia .hito[data-id="p3a1"]').count(), 1);
await comprobar('y p2, el siguiente pendiente, pasa a estar en curso',
  pagina.locator('#ficha-guia .hito[data-id="p2"]').getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);

console.log('--- abrir la misma ficha dos veces seguidas no duplica los hitos ---');
const antesDeReabrir = await leerHitosDeDisco(CLAVE_VIEJA);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await abrirFicha(CLAVE_VIEJA);
const despuesDeReabrir = await leerHitosDeDisco(CLAVE_VIEJA);
await comprobar('sigue habiendo los mismos hitos, ni uno más',
  despuesDeReabrir.hitos.length, antesDeReabrir.hitos.length);
await comprobar('y con el mismo contenido exacto: no se han vuelto a crear',
  JSON.stringify(despuesDeReabrir), JSON.stringify(antesDeReabrir));

/* ================= AJUSTES › HITOS: un día no lectivo (para el escenario 7) ================= */

console.log('--- Ajustes › Hitos: días no lectivos ---');
const hoy = new Date();
const noLectivo = new Date(hoy.getTime());
{ /* el 5º día hábil desde hoy: cae dentro de la ventana de 10 del escenario 7 */
  let contados = 0;
  while (contados < 5) {
    noLectivo.setDate(noLectivo.getDate() + 1);
    if (noLectivo.getDay() !== 0 && noLectivo.getDay() !== 6) contados++;
  }
}
const noLectivoLegible = String(noLectivo.getDate()).padStart(2, '0') + '/' +
  String(noLectivo.getMonth() + 1).padStart(2, '0') + '/' + noLectivo.getFullYear();

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#hitos-no-lectivos');
await pagina.fill('#hitos-no-lectivos', noLectivoLegible);
await pagina.click('#btn-guardar-no-lectivos');
await pagina.waitForTimeout(400);
await comprobar('el día no lectivo se ha guardado en hitos.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('hitos.json');
  const j = JSON.parse(await (await f.getFile()).text());
  return j.ajustes.noLectivos.length;
}), 1);

/* ================= ESCENARIOS 3, 6, 4, 7 y 8: el hilo del primer asunto ================= */

console.log('--- escenario 3: marcar un hito hecho pone el siguiente en curso ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await abrirFicha(CLAVE);
await pagina.locator('#ficha-guia .hito[data-id="p1"] .hito-casilla').check();
await pagina.waitForTimeout(500);
await comprobar('p1 queda hecho',
  pagina.locator('#ficha-guia .hito[data-id="p1"]').getAttribute('class').then(c => c.indexOf('hito-hecho') !== -1), true);
await comprobar('p2 pasa a estar en curso',
  pagina.locator('#ficha-guia .hito[data-id="p2"]').getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);

console.log('--- escenario 6: el estado del asunto cambia con el hito en curso ---');
await comprobar('el estado del asunto ya es EN TRÁMITE', pagina.evaluate((clave) => {
  return App.E.registro.asuntos[clave].situacion;
}, CLAVE), 'EN TRÁMITE');

console.log('--- escenario 4: la lista se corta en la decisión, y al elegir aparece la rama ---');
await pagina.locator('#ficha-guia .hito[data-id="p2"] .hito-casilla').check();
await pagina.waitForTimeout(500);
await comprobar('sigue sin verse nada de después de la decisión',
  pagina.locator('#ficha-guia .hito[data-id="p4"]').count(), 0);
await comprobar('la decisión pasa a estar en curso',
  pagina.locator('#ficha-guia .hito[data-id="p3"]').getAttribute('class').then(c => c.indexOf('hito-encurso') !== -1), true);

console.log('--- escenario 7: el plazo, en días hábiles con un no lectivo por medio ---');
const esperado7 = sumarDiasHabilesRef(new Date(), 10, [isoDe(noLectivo)]);
await pagina.getByRole('button', { name: 'En mano', exact: true }).click();
await pagina.waitForTimeout(500);
await comprobar('aparecen los hitos de la rama elegida',
  pagina.locator('#ficha-guia .hito[data-id="p3a1"]').count(), 1);
await comprobar('y el que viene después de la decisión, p4, también',
  pagina.locator('#ficha-guia .hito[data-id="p4"]').count(), 1);
await comprobar('el plazo de p4 (10 días hábiles desde p2, con un no lectivo por medio) es el correcto',
  leerHitosDeDisco(CLAVE).then(e => (e.hitos.find(h => h.id === 'p4') || {}).fecha), esperado7);

console.log('--- escenario 8: el responsable "papel" se resuelve con el tercero ---');
await comprobar('p4 enseña el tercero del asunto como responsable',
  pagina.locator('#ficha-guia .hito[data-id="p4"] .hito-resp').textContent(), 'Aguilar Ponce, Marina 1140233');

/* ================= ESCENARIO 5: cambiar de rama ================= */

console.log('--- escenario 5: cambiar de rama ---');
await pagina.locator('#ficha-guia .hito[data-id="p3a1"] .hito-titulo').click();
await pagina.fill('#ficha-guia .hito[data-id="p3a1"] .hito-nota-texto', 'Entregado en mano el lunes');
await pagina.locator('#ficha-guia .hito[data-id="p3a1"] .hito-nota-anadir').click();
await pagina.waitForTimeout(400);
await comprobar('la nota se ha guardado',
  leerHitosDeDisco(CLAVE).then(e => {
    const h = e.hitos.find(x => x.id === 'p3').opciones.find(o => o.id === 'o1').hitos.find(x => x.id === 'p3a1');
    return h.notas.length;
  }), 1);

await pagina.locator('#ficha-guia .hito[data-id="p3"] .hito-titulo').click();
await pagina.locator('#ficha-guia .hito[data-id="p3"] .hito-cambiar-rama').click();
await pagina.locator('#ficha-guia .hito[data-id="p3"] .hito-cuerpo .hito-opcion', { hasText: 'Por email' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el aviso solo nombra el hito con notas',
  pagina.locator('#cuadro-cuerpo').textContent().then(t =>
    t.indexOf('Sellar la entrega') !== -1 && t.indexOf('Archivar copia') === -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);

await comprobar('el hito vacío de la rama vieja ha desaparecido del todo',
  pagina.locator('#ficha-guia .hito[data-id="p3a2"]').count(), 0);
await comprobar('el que tenía la nota se queda, marcado "no aplica"',
  pagina.locator('.hitos-huerfanos .hito[data-id="p3a1"]').count(), 1);
await comprobar('la rama nueva aparece',
  pagina.locator('#ficha-guia .hito[data-id="p3b"]').count(), 1);

/* ================= ESCENARIO 9: al archivar ================= */

console.log('--- escenario 9: al archivar, historial de tramitación ---');
await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);

await comprobar('los hitos han salido de hitos.json', pagina.evaluate(async (clave) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('hitos.json');
  const j = JSON.parse(await (await f.getFile()).text());
  return !!j.porAsunto[clave];
}, CLAVE), false);

await comprobar('aparece HISTORIAL DE TRAMITACION.txt en la carpeta archivada', pagina.evaluate(async (clave) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Aguilar Ponce, Marina 1140233');
  const asunto = await ter.getDirectoryHandle(clave);
  const h = await asunto.getFileHandle('HISTORIAL DE TRAMITACION.txt');
  const texto = await (await h.getFile()).text();
  return texto.indexOf('HISTORIAL DE TRAMITACI') !== -1 && texto.indexOf('Registrar la solicitud') !== -1;
}, CLAVE), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
