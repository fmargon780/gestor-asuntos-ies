/* Prueba en navegador de verdad de la fila 94
   (docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md): al cambiar el tipo de un
   asunto abierto en «Editar el asunto», si tiene hitos y el tipo nuevo
   tiene guía, pregunta si traer la guía nueva.

   1. Hitos intactos (el primero solo "en curso", como queda al crear
      el asunto): se sustituyen todos por los de la guía nueva, y el
      primero nuevo queda en curso. Nota en el asunto.
   2. Un hito hecho y otro con una nota: los dos se quedan abajo, como
      "noaplica", fuera de la lista visible y dentro de los huérfanos.
   3. Diciendo que no: los hitos no cambian.
   4. Tipo nuevo sin guía: no pregunta, aviso de una línea.
   5. Cambiar otra cosa que no sea el tipo: no pregunta.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

/* Las guías se leen al entrar: se escriben antes del primer #btn-entrar
   (mismo motivo que en pruebas/hitos.mjs). */
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [] },
    { id: 'm2', titulo: 'Comprobar el expediente', cuerpo: '', opciones: [] },
    { id: 'm3', titulo: 'Grabar en Séneca', cuerpo: '', opciones: [] }
  ],
  BECA: [
    { id: 'b1', titulo: 'Revisar la convocatoria', cuerpo: '', opciones: [] },
    { id: 'b2', titulo: 'Enviar la documentación', cuerpo: '', opciones: [] }
  ]
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Un asunto de MATRICULA recién creado: App.anotar con abiertoEl y tipo
   crea sus hitos desde la guía (js/hitos.js). */
async function crearAsunto(nombre, tercero) {
  await pagina.evaluate(async ([nombre, tercero]) => {
    await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    await App.anotar(nombre, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
                               tercero: tercero, curso: '', grupo: '', descripcion: '', campos: {} });
    await App.verAbiertos();
  }, [nombre, tercero]);
}

/* Abre «Editar el asunto» de `nombre`, cambia lo que diga `cambios`
   ({ tipo, descripcion }) y pulsa Guardar. No espera a nada más. */
async function editar(nombre, cambios) {
  await pagina.evaluate((nombre) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
    window.__editando = App.editarAsunto(a);
  }, nombre);
  await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo');
  if (cambios.tipo) await pagina.selectOption('#ed-tipo', cambios.tipo);
  if (cambios.descripcion) await pagina.fill('#ed-descripcion', cambios.descripcion);
  await pagina.click('#cuadro-aceptar');
}

/* Espera a que salga la pregunta de la guía, o a que termine la edición sin ella. */
async function salePregunta() {
  const r = await Promise.race([
    pagina.waitForFunction(() => {
      const c = document.getElementById('capa');
      return !c.classList.contains('oculto') && document.getElementById('cuadro-titulo').textContent === 'El tipo ha cambiado';
    }, null, { timeout: 8000 }).then(() => 'pregunta'),
    pagina.evaluate(() => window.__editando).then(() => 'terminado')
  ]);
  return r;
}

function hitosDe(nombre) {
  return pagina.evaluate(async (nombre) => {
    const hs = await Hitos.hitosDe(nombre);
    return {
      todos: hs.map(h => h.titulo + ':' + h.estado + (h.delTipoAnterior ? ':del ' + h.delTipoAnterior : '')),
      visibles: Hitos.visibles(hs).map(h => h.titulo),
      huerfanos: Hitos.huerfanos(hs).map(h => h.titulo)
    };
  }, nombre);
}

/* ---------- 1. hitos intactos: se sustituyen todos ---------- */
console.log('--- 1. hitos intactos ---');
const N1 = '260901 MATRICULA Aguilar Ponce, Marina 1140233';
await crearAsunto(N1, 'Aguilar Ponce, Marina 1140233');
await comprobar('el asunto nace con los hitos de MATRICULA, el primero en curso',
  hitosDe(N1).then(h => h.todos),
  ['Recoger la solicitud:encurso', 'Comprobar el expediente:pendiente', 'Grabar en Séneca:pendiente']);
await editar(N1, { tipo: 'BECA' });
await comprobar('pregunta', salePregunta(), 'pregunta');
await comprobar('el texto nombra los dos tipos',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('MATRICULA') > -1 && t.indexOf('BECA') > -1), true);
await comprobar('el botón de cancelar dice qué hace',
  pagina.locator('#cuadro-cancelar').textContent(), 'Dejar los pasos como están');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editando);
const N1b = '260901 BECA Aguilar Ponce, Marina 1140233';
await comprobar('la carpeta se ha renombrado',
  pagina.evaluate((n) => App.E.listaAbiertos.some(x => x.nombre === n), N1b), true);
await comprobar('los hitos son solo los de BECA, el primero en curso',
  hitosDe(N1b).then(h => h.todos), ['Revisar la convocatoria:encurso', 'Enviar la documentación:pendiente']);
await comprobar('nota en el asunto con el cambio',
  pagina.evaluate((n) => (App.E.registro.asuntos[n].notas || []).some(x => x.texto.indexOf('Cambiado el tipo de MATRICULA a BECA') === 0), N1b), true);
await comprobar('el texto de Cancelar vuelve a ser el de siempre',
  pagina.locator('#cuadro-cancelar').textContent().then(t => t !== 'Dejar los pasos como están'), true);

/* ---------- 2. uno hecho y otro con una nota: se quedan abajo ---------- */
console.log('--- 2. con trabajo hecho ---');
const N2 = '260902 MATRICULA Bermúdez Ortiz, Álvaro 1140501';
await crearAsunto(N2, 'Bermúdez Ortiz, Álvaro 1140501');
await pagina.evaluate(async (n) => {
  await Hitos.marcar(n, 'm1', 'hecho');
  await Hitos.cambiar(d => { Hitos.buscar(d.porAsunto[n].hitos, 'm3').notas.push({ texto: 'Llamar el lunes', quien: 'Francisco', cuando: U.ahora() }); return d; });
}, N2);
await editar(N2, { tipo: 'BECA' });
await comprobar('pregunta', salePregunta(), 'pregunta');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editando);
const N2b = '260902 BECA Bermúdez Ortiz, Álvaro 1140501';
const h2 = await hitosDe(N2b);
await comprobar('primero los de BECA, y abajo el hecho y el de la nota como "no aplica"', Promise.resolve(h2.todos),
  ['Revisar la convocatoria:encurso', 'Enviar la documentación:pendiente',
   'Recoger la solicitud:noaplica:del MATRICULA', 'Grabar en Séneca:noaplica:del MATRICULA']);
await comprobar('la lista visible solo tiene los de BECA', Promise.resolve(h2.visibles),
  ['Revisar la convocatoria', 'Enviar la documentación']);
await comprobar('los viejos salen plegados, con los huérfanos', Promise.resolve(h2.huerfanos),
  ['Recoger la solicitud', 'Grabar en Séneca']);
await comprobar('la nota del hito viejo sigue ahí',
  pagina.evaluate(async (n) => (await Hitos.hitosDe(n)).filter(h => h.titulo === 'Grabar en Séneca')[0].notas.length, N2b), 1);

/* ---------- 3. diciendo que no ---------- */
console.log('--- 3. diciendo que no ---');
const N3 = '260903 MATRICULA Trujillo Sanz, Hugo 1120044';
await crearAsunto(N3, 'Trujillo Sanz, Hugo 1120044');
await editar(N3, { tipo: 'BECA' });
await comprobar('pregunta', salePregunta(), 'pregunta');
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => window.__editando);
await comprobar('los hitos siguen siendo los de MATRICULA',
  hitosDe('260903 BECA Trujillo Sanz, Hugo 1120044').then(h => h.todos),
  ['Recoger la solicitud:encurso', 'Comprobar el expediente:pendiente', 'Grabar en Séneca:pendiente']);

/* ---------- 4. el tipo nuevo no tiene guía ---------- */
console.log('--- 4. tipo nuevo sin guía ---');
const N4 = '260904 MATRICULA Ruiz Gil, Ana 1130001';
await crearAsunto(N4, 'Ruiz Gil, Ana 1130001');
await editar(N4, { tipo: 'CERTIFICADO' });
await comprobar('no pregunta', salePregunta(), 'terminado');
await comprobar('avisa de que no hay guía',
  pagina.locator('.mensaje', { hasText: 'no tiene guía escrita' }).count().then(n => n > 0), true);
await comprobar('los hitos no cambian',
  hitosDe('260904 CERTIFICADO Ruiz Gil, Ana 1130001').then(h => h.todos.length), 3);

/* ---------- 5. cambiar otra cosa que no sea el tipo ---------- */
console.log('--- 5. sin cambiar el tipo ---');
const N5 = '260905 MATRICULA Soto Vega, Luis 1130002';
await crearAsunto(N5, 'Soto Vega, Luis 1130002');
await editar(N5, { descripcion: 'urgente' });
await comprobar('no pregunta', salePregunta(), 'terminado');
await comprobar('los hitos no cambian',
  hitosDe('260905 MATRICULA urgente Soto Vega, Luis 1130002').then(h => h.todos.length), 3);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
