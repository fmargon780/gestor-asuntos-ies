/* Prueba de la fila 273 (docs/GUIA-SIEMPRE-AL-DIA.md), sin navegador, con `vm`
   (mismo patrón que pruebas/guia-nueva-llega-a-los-asuntos.mjs): se cargan
   js/util.js, js/guias-enganche.js, js/hitos.js y js/hitos-sincronizar.js sobre
   un disco de mentira con fechas de modificación de verdad.

   1. Sesión con la guía de 5 hitos en memoria y guias.json cambiado por fuera
      a 2: un asunto nuevo sale con 2.
   2. Asunto con 2 hitos y la guía vieja de 5 en memoria: al completarlo sigue
      con 2 y hitos.json no se escribe.
   3. Guía cambiada por fuera de 2 a 3 hitos: al completar un asunto abierto le
      llega el tercero.
   4. Sin cambios en el disco, varias llamadas seguidas no vuelven a leer el fichero.
   5. Con un guardado en marcha, ponerse al día no lee ni pisa nada.
   6. Si la lectura falla, se conserva la copia que había y no sale aviso.
   7. Dos llamadas a la vez comparten la misma lectura. */
import fs from 'node:fs';
import vm from 'node:vm';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const leerFuente = (r) => fs.readFileSync(new URL('../js/' + r, import.meta.url), 'utf8');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const paso = (id) => ({ id, titulo: 'Hito ' + id, cuerpo: '', opciones: [] });
const GUIA5 = ['uno', 'dos', 'tres', 'cuatro', 'cinco'].map(paso);
const GUIA2 = GUIA5.slice(0, 2);
const GUIA3 = GUIA5.slice(0, 3);

function montar() {
  const disco = {
    ficheros: { 'guias.json': { texto: JSON.stringify({ T: GUIA5 }), mod: 1 } },
    lecturas: { 'guias.json': 0, 'hitos.json': 0 }, escrituras: { 'hitos.json': 0, 'guias.json': 0 },
    fallaLeer: false, guardando: false, avisos: [], reloj: 1
  };
  const ctx = {
    console, setTimeout, clearTimeout,
    document: { getElementById: () => null, readyState: 'complete', addEventListener: () => {}, querySelector: () => null },
    App: { E: { usuario: 'Francisco', listaAbiertos: [], tipos: [] }, anotar: async () => {}, tipoDeAsunto: (a) => a.leido.tipo },
    Gestor: { carpetaGestor: () => ({ nombre: '_GESTOR' }), asuntos: () => [], tipos: () => [], alRefrescar: [], recargar: async () => {} },
    Guias: {
      esPregunta: (p) => !!(p && p.opciones && p.opciones.length), normalizarNormativa: (n) => (Array.isArray(n) ? n : []),
      normalizar: (x) => x, resumenDeTipo: () => ({ pasos: [], texto: '' })
    },
    ColaGuardado: { hayGuardado: () => disco.guardando, poner: (f, fn) => fn() },
    Carpetas: {
      leerJson: async (g, n) => {
        disco.lecturas[n] = (disco.lecturas[n] || 0) + 1;
        if (disco.fallaLeer) throw new Error('no se puede leer');
        const f = disco.ficheros[n];
        return f ? JSON.parse(f.texto) : null;
      },
      fechaFichero: async (g, n) => (disco.ficheros[n] ? disco.ficheros[n].mod : 0)
    },
    Copias: {
      guardar: async (g, n, datos) => {
        disco.escrituras[n] = (disco.escrituras[n] || 0) + 1;
        disco.ficheros[n] = { texto: JSON.stringify(datos), mod: ++disco.reloj };
      }
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'hitos.js', 'hitos-sincronizar.js', 'guias-enganche.js']) {
    vm.runInContext(leerFuente(f), ctx, { filename: f });
  }
  ctx.U.aviso = (m) => { disco.avisos.push(String(m)); };
  /* «Otra ventana» cambia guias.json por fuera. */
  const porFuera = (guia) => { disco.ficheros['guias.json'] = { texto: JSON.stringify({ T: guia }), mod: ++disco.reloj }; };
  return { ctx, disco, porFuera, Hitos: ctx.Hitos, Guias: ctx.GuiasDelCentro };
}
const titulos = (lista) => lista.map((h) => h.origenGuia || h.titulo);

console.log('--- 1. un asunto nuevo coge la guía guardada ---');
{
  const { disco, porFuera, Hitos, Guias } = montar();
  await Guias.recargar();   /* como al arrancar: la guía de 5 hitos en memoria */
  comprobar('1. la sesión parte con 5 hitos', Guias.pasosDe('T').length, 5);
  porFuera(GUIA2);
  const hitos = await Hitos.crearDesdeGuia('260101 T Uno, Ana', 'T');
  comprobar('1. el asunto nuevo sale con 2 hitos', hitos.length, 2);
  comprobar('1. y es la guía guardada', titulos(hitos), ['uno', 'dos']);
  comprobar('1. sin avisos', disco.avisos, []);
}

console.log('--- 2. un asunto con 2 hitos no recibe los 3 que ya no están ---');
{
  const { disco, porFuera, Hitos, Guias } = montar();
  porFuera(GUIA2);
  const hitos2 = await Hitos.crearDesdeGuia('260101 T Uno, Ana', 'T');   /* ya con 2 */
  /* Otra sesión que arrancó con la guía vieja de 5. */
  const vieja = montar();
  vieja.disco.ficheros['guias.json'] = { texto: JSON.stringify({ T: GUIA5 }), mod: 1 };
  await vieja.Guias.recargar();
  vieja.disco.ficheros['hitos.json'] = disco.ficheros['hitos.json'];
  vieja.disco.ficheros['guias.json'] = disco.ficheros['guias.json'];   /* el disco es el mismo: 2 hitos */
  const antes = vieja.disco.escrituras['hitos.json'];
  await vieja.Guias.ponerAlDia();
  const datos = await vieja.Hitos.leer();
  const r = await vieja.Hitos.completarAsuntoConGuia('260101 T Uno, Ana', datos.porAsunto['260101 T Uno, Ana'], vieja.Guias.pasosDe('T'));
  comprobar('2. sigue con 2 hitos', hitos2.length, 2);
  comprobar('2. no se le añade ninguno', (r || []).length || 0, 0);
  comprobar('2. hitos.json no se escribe', vieja.disco.escrituras['hitos.json'] - antes, 0);
}

console.log('--- 3. la guía crece por fuera: el tercero llega ---');
{
  const { disco, porFuera, Hitos, Guias } = montar();
  porFuera(GUIA2);
  await Guias.recargar();
  await Hitos.crearDesdeGuia('260101 T Uno, Ana', 'T');
  porFuera(GUIA3);
  await Guias.ponerAlDia();
  const datos = await Hitos.leer();
  const r = await Hitos.completarAsuntoConGuia('260101 T Uno, Ana', datos.porAsunto['260101 T Uno, Ana'], Guias.pasosDe('T'));
  comprobar('3. el asunto abierto tiene ya 3 hitos', titulos((await Hitos.leer()).porAsunto['260101 T Uno, Ana'].hitos), ['uno', 'dos', 'tres']);
}

console.log('--- 4. sin cambios, no se lee otra vez ---');
{
  const { disco, porFuera, Guias } = montar();
  await Guias.recargar();
  const antes = disco.lecturas['guias.json'];
  const r1 = await Guias.ponerAlDia(), r2 = await Guias.ponerAlDia(), r3 = await Guias.ponerAlDia();
  comprobar('4. ninguna lectura más', disco.lecturas['guias.json'] - antes, 0);
  comprobar('4. y dice que no ha cambiado nada', [r1, r2, r3], [false, false, false]);
  porFuera(GUIA3);
  comprobar('4. cambiado por fuera: una lectura y dice que sí ha cambiado', [await Guias.ponerAlDia(), disco.lecturas['guias.json'] - antes], [true, 1]);
  comprobar('4. y la copia en memoria es la del disco', Guias.pasosDe('T').length, 3);
}

console.log('--- 5. con un guardado en marcha, no lee ---');
{
  const { disco, porFuera, Guias } = montar();
  await Guias.recargar();
  porFuera(GUIA2);
  disco.guardando = true;
  const antes = disco.lecturas['guias.json'];
  const r = await Guias.ponerAlDia();
  comprobar('5. no lee y no cambia nada', [r, disco.lecturas['guias.json'] - antes, Guias.pasosDe('T').length], [false, 0, 5]);
  disco.guardando = false;
  comprobar('5. terminado el guardado, sí', [await Guias.ponerAlDia(), Guias.pasosDe('T').length], [true, 2]);
}

console.log('--- 6. si la lectura falla, se queda la copia y no hay aviso ---');
{
  const { disco, porFuera, Guias } = montar();
  await Guias.recargar();
  porFuera(GUIA2);
  disco.fallaLeer = true;
  const r = await Guias.ponerAlDia();
  comprobar('6. devuelve falso, conserva los 5 y no avisa', [r, Guias.pasosDe('T').length, disco.avisos], [false, 5, []]);
}

console.log('--- 7. dos llamadas a la vez, una sola lectura ---');
{
  const { disco, porFuera, Guias } = montar();
  await Guias.recargar();
  porFuera(GUIA3);
  const antes = disco.lecturas['guias.json'];
  const [a, b] = await Promise.all([Guias.ponerAlDia(), Guias.ponerAlDia()]);
  comprobar('7. una sola lectura y las dos dicen lo mismo', [disco.lecturas['guias.json'] - antes, a, b], [1, true, true]);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
