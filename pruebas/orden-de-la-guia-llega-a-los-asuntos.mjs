/* Prueba de la fila 300 (docs/ORDEN-DE-LA-GUIA-LLEGA-A-LOS-ASUNTOS.md), sin
   navegador, con `vm` (mismo patrón que pruebas/guia-nueva-llega-a-los-asuntos.mjs):
   el orden nuevo de la guía llega a los hitos sin hacer de los asuntos abiertos. */
import fs from 'node:fs';
import vm from 'node:vm';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const leerFuente = (r) => fs.readFileSync(new URL('../js/' + r, import.meta.url), 'utf8');

function nuevoContexto(opciones) {
  opciones = opciones || {};
  const disco = { hitos: opciones.hitosJson || null, escrituras: 0 };
  const ctx = {
    console, setTimeout, clearTimeout,
    document: { getElementById: () => null, readyState: 'complete', addEventListener: () => {} },
    App: {
      E: { usuario: 'Francisco', listaAbiertos: opciones.abiertos || [] },
      anotar: async () => {},
      tipoDeAsunto: (a) => a.leido.tipo
    },
    Gestor: {
      carpetaGestor: () => ({ nombre: '_GESTOR' }),
      asuntos: () => (opciones.abiertos || []).slice()
    },
    Guias: {
      esPregunta: (p) => !!(p && p.opciones && p.opciones.length),
      normalizarNormativa: (n) => (Array.isArray(n) ? n : [])
    },
    Carpetas: {
      leerJson: async () => (disco.hitos ? JSON.parse(JSON.stringify(disco.hitos)) : null)
    },
    Copias: {
      guardar: async (g, nombre, datos) => { disco.escrituras++; disco.hitos = JSON.parse(JSON.stringify(datos)); }
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leerFuente('util.js'), ctx, { filename: 'util.js' });
  for (const f of ['util-parecidos.js', 'util-pantalla.js']) vm.runInContext(leerFuente(f), ctx, { filename: f });
  vm.runInContext(leerFuente('hitos.js'), ctx, { filename: 'hitos.js' });
  vm.runInContext(leerFuente('hitos-sincronizar.js'), ctx, { filename: 'hitos-sincronizar.js' });
  return { ctx, disco, Hitos: ctx.Hitos };
}

const paso = (id, extra) => Object.assign({ id, titulo: 'Paso ' + id, cuerpo: '', opciones: [] }, extra || {});
const ids = (lista) => lista.map((h) => h.origenGuia || h.titulo);
const estados = (lista) => lista.map((h) => h.estado);
const guia = (...xs) => xs.map((x) => paso(x));
const ABCD = guia('a', 'b', 'c', 'd');
const ADBC = guia('a', 'd', 'b', 'c');

function asunto(Hitos, pasos, est) {
  const h = pasos.map(Hitos.pasoAHito);
  (est || []).forEach((e, i) => { if (e) h[i].estado = e; });
  return h;
}

console.log('--- 1. A(hecho) B(en curso) C D con la guía A D B C ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso']);
  const antes = JSON.stringify(h[0]);
  const r = Hitos.ordenDeLaGuia(h, ABCD, ADBC);
  comprobar('1. orden', ids(r.hitos), ['a', 'd', 'b', 'c']);
  comprobar('1. estados', estados(r.hitos), ['hecho', 'encurso', 'pendiente', 'pendiente']);
  comprobar('1. A sin tocar', JSON.stringify(r.hitos[0]), antes);
  comprobar('1. el actual es D', r.actual && r.actual.origenGuia, 'd');
  comprobar('1. D lleva «desde»', !!r.hitos[1].desde, true);
  comprobar('1. movidos', r.movidos, 3);
  comprobar('1. la lista de entrada no cambia', ids(h), ['a', 'b', 'c', 'd']);
}

console.log('--- 2. lo apuntado en B se queda en B ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso']);
  h[1].notas = [{ texto: 'Llamé', quien: 'F', cuando: '07-10' }];
  h[1].documentos = ['solicitud.pdf'];
  h[1].fecha = '2026-10-20';
  h[1].guion = [{ id: 't1', texto: 'Tarea', hecho: true }];
  const r = Hitos.ordenDeLaGuia(h, ABCD, ADBC);
  const b = r.hitos.filter((x) => x.origenGuia === 'b')[0];
  comprobar('2. estado pendiente', b.estado, 'pendiente');
  comprobar('2. notas', b.notas, h[1].notas);
  comprobar('2. documentos', b.documentos, ['solicitud.pdf']);
  comprobar('2. plazo', b.fecha, '2026-10-20');
  comprobar('2. tarea marcada', b.guion, h[1].guion);
}

console.log('--- 3. un hito hecho en medio no se mueve ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso', 'hecho']);
  h[1].estado = 'pendiente'; h[0].estado = 'hecho';
  const r = Hitos.ordenDeLaGuia(h, ABCD, ADBC);
  comprobar('3. A(hecho) B C(hecho) D → A D C B', ids(r.hitos), ['a', 'd', 'c', 'b']);
  comprobar('3. C sigue hecho', r.hitos[2].estado, 'hecho');
}

console.log('--- 4. un hito solo de este asunto conserva su posición ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso']);
  h.splice(2, 0, Hitos.normalizarHito({ id: 'solo', titulo: 'Solo mío', estado: 'pendiente' }));
  const r = Hitos.ordenDeLaGuia(h, ABCD, ADBC);
  comprobar('4. el suyo sigue en la posición 2', r.hitos[2].titulo, 'Solo mío');
  comprobar('4. los demás, reparten los huecos', r.hitos.map((x) => x.origenGuia || 'solo'), ['a', 'd', 'solo', 'b', 'c']);
}

console.log('--- 5. mismo orden: no cambia nada ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso']);
  /* movido a mano: A B D C */
  const mano = [h[0], h[1], h[3], h[2]];
  const retitulada = ABCD.map((p) => Object.assign({}, p, { titulo: 'Otro ' + p.id }));
  const r = Hitos.ordenDeLaGuia(mano, ABCD, retitulada);
  comprobar('5. movidos 0', r.movidos, 0);
  comprobar('5. igual', JSON.stringify(r.hitos), JSON.stringify(mano));
  comprobar('5. sin actual nuevo', r.actual, null);
}

console.log('--- 6. dentro de una opción ---');
{
  const { Hitos } = nuevoContexto();
  const pregunta = (pasos) => paso('p', { opciones: [{ id: 'o1', titulo: 'Sí', pasos }, { id: 'o2', titulo: 'No', pasos: [paso('n1'), paso('n2')] }] });
  const antes = [paso('a'), pregunta(guia('s1', 's2', 's3'))];
  const ahora = [paso('a'), pregunta(guia('s3', 's1', 's2'))];
  const h = antes.map(Hitos.pasoAHito);
  h[0].estado = 'hecho'; h[1].estado = 'hecho'; h[1].elegida = 'o1';
  h[1].opciones[0].hitos[0].estado = 'encurso';
  const r = Hitos.ordenDeLaGuia(h, antes, ahora);
  comprobar('6. la opción elegida, recolocada', ids(r.hitos[1].opciones[0].hitos), ['s3', 's1', 's2']);
  comprobar('6. la otra opción, igual', ids(r.hitos[1].opciones[1].hitos), ['n1', 'n2']);
  comprobar('6. el nivel de fuera, igual', ids(r.hitos), ['a', 'p']);
  comprobar('6. el actual es s3', r.actual && r.actual.origenGuia, 's3');
}

console.log('--- 7. el hito en curso con cadena sigue siendo el actual ---');
{
  const { Hitos } = nuevoContexto();
  const h = asunto(Hitos, ABCD, ['hecho', 'encurso']);
  h[1].cadena = { estado: 'esperando-sello', tarea: 't' };
  const r = Hitos.ordenDeLaGuia(h, ABCD, ADBC);
  comprobar('7. orden nuevo', ids(r.hitos), ['a', 'd', 'b', 'c']);
  comprobar('7. B sigue en curso', r.hitos[2].estado, 'encurso');
  comprobar('7. D sigue pendiente', r.hitos[1].estado, 'pendiente');
  comprobar('7. no hay actual nuevo', r.actual, null);
}

const abierto = (nombre, tipo, extra) => Object.assign({ nombre, leido: { tipo } }, extra || {});

console.log('--- 8. paso nuevo y orden cambiado en una sola escritura ---');
{
  const c0 = nuevoContexto();
  const mk = () => asunto(c0.Hitos, ABCD, ['hecho', 'encurso']);
  const { Hitos, disco } = nuevoContexto({
    abiertos: [abierto('M1', 'MAT'), abierto('M2', 'MAT')],
    hitosJson: { ajustes: {}, porAsunto: { M1: { creados: '', hitos: mk() }, M2: { creados: '', hitos: mk() } } }
  });
  const ahora = guia('a', 'd', 'b', 'c', 'e');
  const r = await Hitos.llevarGuiaAAbiertos('MAT', ahora, ABCD);
  comprobar('8. los dos números', r, { llegados: 2, recolocados: 2 });
  comprobar('8. una sola escritura', disco.escrituras, 1);
  comprobar('8. orden y paso nuevo', ids(disco.hitos.porAsunto.M1.hitos), ['a', 'd', 'b', 'c', 'e']);
  comprobar('8. D en curso', estados(disco.hitos.porAsunto.M2.hitos), ['hecho', 'encurso', 'pendiente', 'pendiente', 'pendiente']);
}

console.log('--- 9. archivo, otro tipo, sin hitos, tipo unido: no cambian ---');
{
  const c0 = nuevoContexto();
  const mk = () => asunto(c0.Hitos, ABCD, ['hecho', 'encurso']);
  const { Hitos, disco, ctx } = nuevoContexto({
    abiertos: [abierto('M1', 'MAT'), abierto('B1', 'BECA'), abierto('M3 SIN', 'MAT'), abierto('UNIDO', 'MAT')],
    hitosJson: { ajustes: {}, porAsunto: {
      M1: { creados: '', hitos: mk() }, B1: { creados: '', hitos: mk() },
      UNIDO: { creados: '', hitos: mk() }, ARCHIVADO: { creados: '', hitos: mk() }
    } }
  });
  ctx.App.E.registro = { asuntos: { UNIDO: { tipoUnidoDe: 'OTRO' } } };
  const r = await Hitos.llevarGuiaAAbiertos('MAT', ADBC, ABCD);
  comprobar('9. solo recoloca uno', r, { llegados: 0, recolocados: 1 });
  comprobar('9. M1 recolocado', ids(disco.hitos.porAsunto.M1.hitos), ['a', 'd', 'b', 'c']);
  for (const k of ['B1', 'UNIDO', 'ARCHIVADO']) comprobar('9. ' + k + ' igual', ids(disco.hitos.porAsunto[k].hitos), ['a', 'b', 'c', 'd']);
  comprobar('9. el que no tenía hitos sigue sin ellos', disco.hitos.porAsunto['M3 SIN'], undefined);
}

console.log('--- 10. dos veces seguidas ---');
{
  const c0 = nuevoContexto();
  const { Hitos, disco } = nuevoContexto({
    abiertos: [abierto('M1', 'MAT')],
    hitosJson: { ajustes: {}, porAsunto: { M1: { creados: '', hitos: asunto(c0.Hitos, ABCD, ['hecho', 'encurso']) } } }
  });
  await Hitos.llevarGuiaAAbiertos('MAT', ADBC, ABCD);
  const despues = JSON.stringify(disco.hitos.porAsunto.M1.hitos);
  const r2 = await Hitos.llevarGuiaAAbiertos('MAT', ADBC, ABCD);
  comprobar('10. la segunda no recoloca', r2.recolocados, 0);
  comprobar('10. y no cambia nada', JSON.stringify(disco.hitos.porAsunto.M1.hitos), despues);
}

console.log('--- 11. sin pasosAntes (guardarPasos, red de seguridad) no recoloca ---');
{
  const c0 = nuevoContexto();
  const { Hitos, disco } = nuevoContexto({
    abiertos: [abierto('M1', 'MAT')],
    hitosJson: { ajustes: {}, porAsunto: { M1: { creados: '', hitos: asunto(c0.Hitos, ABCD, ['hecho', 'encurso']) } } }
  });
  const n = await Hitos.llevarGuiaAAbiertos('MAT', ADBC);
  comprobar('11. devuelve un número, como antes', n, 0);
  comprobar('11. el orden, igual', ids(disco.hitos.porAsunto.M1.hitos), ['a', 'b', 'c', 'd']);
  const entrada = disco.hitos.porAsunto.M1;
  const nuevo = await Hitos.completarAsuntoConGuia('M1', entrada, ADBC);
  comprobar('11. la red de seguridad no recoloca', nuevo, null);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
