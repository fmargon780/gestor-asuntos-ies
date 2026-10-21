/* Prueba en navegador de verdad de la fila 408
   (docs/CAMBIAR-TIPO-RENOMBRA-Y-TRAE-GUIA.md): cambiar el tipo de un asunto con número
   (`AAMMDD A26-NNNN TIPO Tercero`) desde «Cambiar el asunto» renombra la carpeta (solo cambia el
   tipo), la lista de Inicio sale con el tipo nuevo y sale la pregunta de la guía. Reutiliza el
   disco de mentira de pruebas/navegador.mjs. */
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
async function crearAsunto(nombre, tercero, numero) {
  await pagina.evaluate(async ([nombre, tercero, numero]) => {
    await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    await App.anotar(nombre, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO', numero: numero,
                               tercero: tercero, curso: '', grupo: '', descripcion: '', campos: {} });
    await App.verAbiertos();
  }, [nombre, tercero, numero]);
}

/* Abre «Cambiar el asunto» de `nombre`, cambia lo que diga `cambios`
   ({ tipo, descripcion }) y pulsa Guardar. No espera a nada más. */
async function editar(nombre, cambios) {
  await pagina.evaluate((nombre) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
    window.__editando = App.editarAsunto(a);
  }, nombre);
  await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo-cambiar');
  /* Fila 257: el tipo ya no es un desplegable: «Cambiar», escribir y elegir. */
  if (cambios.tipo) {
    await pagina.click('#ed-tipo-cambiar');
    await pagina.fill('#ed-tipo-buscar', cambios.tipo);
    await pagina.click('.tipo-resultado[data-tipo="' + cambios.tipo + '"]');
  }
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


console.log('--- asunto con número ---');
const N = '261020 A26-0465 MATRICULA Baute De Armas, Álvaro 1140233';
await crearAsunto(N, 'Baute De Armas, Álvaro 1140233', 'A26-0465');
await editar(N, { tipo: 'BECA' });
await comprobar('pregunta si traer la guía', salePregunta(), 'pregunta');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editando);
const Nb = '261020 A26-0465 BECA Baute De Armas, Álvaro 1140233';
await comprobar('la carpeta cambia solo el tipo: misma fecha, número y alumno',
  pagina.evaluate(() => App.E.listaAbiertos.map(x => x.nombre)), [Nb]);
await comprobar('Inicio muestra el tipo nuevo',
  pagina.evaluate(() => App.E.listaAbiertos[0].leido.tipo), 'BECA');
await comprobar('la ficha dice BECA',
  pagina.evaluate(() => App.E.listaAbiertos[0].ficha.tipo), 'BECA');
await comprobar('los hitos son los de la guía nueva',
  hitosDe(Nb).then(h => h.todos), ['Revisar la convocatoria:encurso', 'Enviar la documentación:pendiente']);


/* ---------- la puesta al día al entrar ---------- */
console.log('--- puesta al día: el tipo de la ficha manda ---');
await pagina.evaluate(() => TipoDelNombreAlDia._darPorHecho());   /* se lanza a mano, no sola */
/* Un asunto cuya ficha ya dice BECA pero cuya carpeta sigue diciendo MATRICULA. */
async function crearDesajustado(nombre, tercero, numero) {
  await crearAsunto(nombre, tercero, numero);
  await pagina.evaluate(async (n) => { await App.anotar(n, { tipo: 'BECA' }); await App.verAbiertos(); }, nombre);
}
const nombresAbiertos = () => pagina.evaluate(() => App.E.listaAbiertos.map(x => x.nombre).sort());
const D1 = '261020 A26-0470 MATRICULA Pérez Gil, Ana 1140234';
const D1b = '261020 A26-0470 BECA Pérez Gil, Ana 1140234';
const CHOCA = '261021 A26-0471 MATRICULA Ruiz Soto, Eva 1140235';
const CHOCAb = '261021 A26-0471 BECA Ruiz Soto, Eva 1140235';
await crearDesajustado(D1, 'Pérez Gil, Ana 1140234', 'A26-0470');
await crearDesajustado(CHOCA, 'Ruiz Soto, Eva 1140235', 'A26-0471');
await pagina.evaluate(async (n) => { await window.__disco.abiertos.getDirectoryHandle(n, { create: true }); await App.verAbiertos(); }, CHOCAb);
await comprobar('el desajuste se detecta (los dos asuntos de la ficha con otro tipo)',
  pagina.evaluate(() => TipoDelNombreAlDia.desajustados().map(a => a.nombre).sort()), [D1, CHOCA]);
await pagina.evaluate(() => { window.__alDia = TipoDelNombreAlDia.ponerAlDia(); });
await pagina.waitForFunction(() => document.getElementById('cuadro-titulo') && document.getElementById('cuadro-titulo').textContent === 'El tipo ha cambiado'
  && !document.getElementById('capa').classList.contains('oculto'), null, { timeout: 8000 });
await pagina.click('#cuadro-aceptar');
await comprobar('termina: 1 renombrado, 1 pregunta', pagina.evaluate(() => window.__alDia), { renombrados: 1, preguntadas: 1, chocan: 1 });
await comprobar('la carpeta cambia solo el tipo; la que choca se queda como estaba',
  nombresAbiertos(), [Nb, D1b, CHOCA, CHOCAb].sort());
await comprobar('traída la guía de BECA', hitosDe(D1b).then(h => h.todos), ['Revisar la convocatoria:encurso', 'Enviar la documentación:pendiente']);
await comprobar('la marca de la pregunta se quita de la ficha',
  pagina.evaluate((n) => !App.E.registro.asuntos[n].guiaPorOfrecer, D1b), true);
await comprobar('avisa en ámbar de la que choca',
  pagina.locator('.mensaje', { hasText: 'ya hay otra carpeta' }).count().then(n => n > 0), true);
await comprobar('otra pasada no pregunta ni renombra nada de lo ya resuelto',
  pagina.evaluate(() => TipoDelNombreAlDia.ponerAlDia()).then(r => [r.renombrados, r.preguntadas]), [0, 0]);

console.log('--- puesta al día: contestar que no también la resuelve ---');
const D2 = '261022 A26-0472 MATRICULA Soto Vega, Luis 1140236';
const D2b = '261022 A26-0472 BECA Soto Vega, Luis 1140236';
await crearDesajustado(D2, 'Soto Vega, Luis 1140236', 'A26-0472');
await pagina.evaluate(() => { window.__alDia = TipoDelNombreAlDia.ponerAlDia(); });
await pagina.waitForFunction(() => document.getElementById('cuadro-titulo') && document.getElementById('cuadro-titulo').textContent === 'El tipo ha cambiado'
  && !document.getElementById('capa').classList.contains('oculto'), null, { timeout: 8000 });
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => window.__alDia);
await comprobar('carpeta con el tipo nuevo', pagina.evaluate((n) => App.E.listaAbiertos.some(x => x.nombre === n), D2b), true);
await comprobar('los hitos se quedan como estaban', hitosDe(D2b).then(h => h.todos.length), 3);
await comprobar('no se vuelve a preguntar', pagina.evaluate(() => TipoDelNombreAlDia.ponerAlDia()).then(r => r.preguntadas), 0);

console.log('--- puesta al día: en «solo consultar» no se toca nada ---');
const D3 = '261023 A26-0473 MATRICULA Gil Ruiz, Pablo 1140237';
await crearDesajustado(D3, 'Gil Ruiz, Pablo 1140237', 'A26-0473');
await pagina.evaluate(() => { window.SoloConsulta = Object.assign({}, window.SoloConsulta, { activo: () => true }); });
await comprobar('no renombra', pagina.evaluate(() => TipoDelNombreAlDia.ponerAlDia()).then(r => r.renombrados), 0);
await comprobar('la carpeta sigue igual', pagina.evaluate((n) => App.E.listaAbiertos.some(x => x.nombre === n), D3), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
