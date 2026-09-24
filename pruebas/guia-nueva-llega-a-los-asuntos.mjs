/* Prueba de la fila 118 (docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md), sin
   navegador, con `vm` (mismo patrón que pruebas/correo-enviar.mjs):
   se cargan js/util.js, js/hitos.js y js/hitos-sincronizar.js sobre un
   hitos.json de mentira en memoria.

   Lo que tiene que pasar:
     1. Paso nuevo al final de la guía → aparece al final, pendiente.
     2. Paso nuevo en medio → aparece detrás del anterior; los demás
        hitos, intactos (estado, notas, documentos).
     3. Paso nuevo dentro de una opción de una pregunta, y opción nueva
        entera.
     4. Paso quitado de la guía → el hito sigue en el asunto.
     5. Hito quitado a mano del asunto → no vuelve.
     6. Asunto sin `pasosConocidos` (de antes) → recibe solo los pasos
        que de verdad faltan.
     7. Llamarla dos veces seguidas → la segunda no añade nada.
     8. Al guardar la guía: una sola escritura de hitos.json, solo los
        asuntos abiertos de ese tipo que ya tienen hitos. */
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
const titulos = (lista) => lista.map((h) => h.origenGuia || h.titulo);

/* La guía de partida: a, b, c. */
const GUIA = [paso('a'), paso('b'), paso('c')];

console.log('--- 1. paso nuevo al final ---');
{
  const { Hitos } = nuevoContexto();
  const hitos = GUIA.map(Hitos.pasoAHito);
  const r = Hitos.pasosQueFaltan(hitos, GUIA.concat([paso('d')]), null);
  comprobar('1. se añade uno', r.anadidos, 1);
  comprobar('1. al final', titulos(r.hitos), ['a', 'b', 'c', 'd']);
  comprobar('1. pendiente', r.hitos[3].estado, 'pendiente');
  comprobar('1. no cambia la lista de entrada', hitos.length, 3);
}

console.log('--- 2. paso nuevo en medio; lo demás intacto ---');
{
  const { Hitos } = nuevoContexto();
  const hitos = GUIA.map(Hitos.pasoAHito);
  hitos[0].estado = 'hecho';
  hitos[0].notas = [{ texto: 'Llamé', quien: 'Francisco', cuando: '24-09' }];
  hitos[0].documentos = ['solicitud.pdf'];
  hitos[1].estado = 'encurso';
  const antes = JSON.stringify([hitos[0], hitos[1], hitos[2]]);
  const r = Hitos.pasosQueFaltan(hitos, [paso('a'), paso('x'), paso('b'), paso('c')], null);
  comprobar('2. detrás del anterior de la guía', titulos(r.hitos), ['a', 'x', 'b', 'c']);
  comprobar('2. los demás, intactos', JSON.stringify([r.hitos[0], r.hitos[2], r.hitos[3]]), antes);
  comprobar('2. el nuevo, pendiente (ya había uno en curso)', r.hitos[1].estado, 'pendiente');
  comprobar('2. no hay otro en curso', r.enCurso, null);
}

console.log('--- 3. dentro de una pregunta, y opción nueva entera ---');
{
  const { Hitos } = nuevoContexto();
  const pregunta = (opciones) => paso('p', { opciones });
  const guiaVieja = [paso('a'), pregunta([
    { id: 'o1', titulo: 'Sí', pasos: [paso('s1')] },
    { id: 'o2', titulo: 'No', pasos: [paso('n1')] }
  ])];
  const hitos = guiaVieja.map(Hitos.pasoAHito);
  hitos[1].elegida = 'o1';
  hitos[1].estado = 'hecho';
  const guiaNueva = [paso('a'), pregunta([
    { id: 'o1', titulo: 'Sí', pasos: [paso('s1'), paso('s2')] },
    { id: 'o3', titulo: 'A medias', pasos: [paso('m1'), paso('m2')] },
    { id: 'o2', titulo: 'No', pasos: [paso('n1')] }
  ])];
  const r = Hitos.pasosQueFaltan(hitos, guiaNueva, null);
  const p = r.hitos[1];
  comprobar('3. paso nuevo dentro de la opción', titulos(p.opciones[0].hitos), ['s1', 's2']);
  comprobar('3. opción nueva, en su sitio', p.opciones.map((o) => o.id), ['o1', 'o3', 'o2']);
  comprobar('3. opción nueva, entera', titulos(p.opciones[1].hitos), ['m1', 'm2']);
  comprobar('3. la respuesta elegida no cambia', p.elegida, 'o1');
  comprobar('3. cuenta el paso, la opción y sus dos pasos', r.anadidos, 4);
}

console.log('--- 4. paso quitado de la guía ---');
{
  const { Hitos } = nuevoContexto();
  const hitos = GUIA.map(Hitos.pasoAHito);
  const r = Hitos.pasosQueFaltan(hitos, [paso('a'), paso('c')], null);
  comprobar('4. no se añade nada', r.anadidos, 0);
  comprobar('4. el hito sigue', titulos(r.hitos), ['a', 'b', 'c']);
}

console.log('--- 5 y 6. hito quitado a mano; asunto de antes sin pasosConocidos ---');
{
  /* Un hitos.json de antes de esta fila: sin pasosConocidos. */
  const c0 = nuevoContexto();
  const hitosViejos = GUIA.map(c0.Hitos.pasoAHito);
  const { Hitos, disco } = nuevoContexto({
    hitosJson: { ajustes: {}, porAsunto: { 'ASUNTO 1': { creados: '2026-09-20', hitos: hitosViejos } } }
  });
  const leido = await Hitos.leer();
  comprobar('6. al leerlo ya sabe qué pasos conoce', leido.porAsunto['ASUNTO 1'].pasosConocidos, ['a', 'b', 'c']);

  /* Quitar el hito "b" a mano, como Hitos.quitarHito. */
  await Hitos.cambiar((d) => {
    d.porAsunto['ASUNTO 1'].hitos = d.porAsunto['ASUNTO 1'].hitos.filter((h) => h.id !== 'b');
    return d;
  });
  comprobar('5. queda guardado que "b" ya pasó por el asunto', disco.hitos.porAsunto['ASUNTO 1'].pasosConocidos, ['a', 'b', 'c']);

  const otraVez = await Hitos.leer();
  const e = otraVez.porAsunto['ASUNTO 1'];
  const r = Hitos.pasosQueFaltan(e.hitos, GUIA.concat([paso('d')]), e.pasosConocidos);
  comprobar('5. el quitado a mano no vuelve', titulos(r.hitos), ['a', 'c', 'd']);
  comprobar('6. solo llega el que de verdad falta', r.anadidos, 1);
}

console.log('--- 7. dos veces seguidas ---');
{
  const { Hitos } = nuevoContexto();
  const hitos = GUIA.map(Hitos.pasoAHito);
  const guia = [paso('z'), paso('a'), paso('b'), paso('c')];
  const r1 = Hitos.pasosQueFaltan(hitos, guia, null);
  comprobar('7. la primera añade (al principio, sin paso anterior)', titulos(r1.hitos), ['z', 'a', 'b', 'c']);
  const r2 = Hitos.pasosQueFaltan(r1.hitos, guia, r1.conocidos);
  comprobar('7. la segunda no añade nada', r2.anadidos, 0);
  comprobar('7. y la lista es la misma', titulos(r2.hitos), ['z', 'a', 'b', 'c']);
}

console.log('--- 8. al guardar la guía: solo abiertos del tipo, con hitos, una escritura ---');
{
  const c0 = nuevoContexto();
  const h = () => GUIA.map(c0.Hitos.pasoAHito).map((x) => Object.assign(x, { estado: 'hecho' }));
  const abierto = (nombre, tipo) => ({ nombre, leido: { tipo } });
  const { Hitos, disco } = nuevoContexto({
    abiertos: [abierto('M1', 'MATRICULA'), abierto('M2', 'MATRICULA'), abierto('M3 SIN HITOS', 'MATRICULA'), abierto('B1', 'BECA')],
    hitosJson: { ajustes: {}, porAsunto: {
      M1: { creados: '', hitos: h() }, M2: { creados: '', hitos: h() },
      B1: { creados: '', hitos: h() }, ARCHIVADO: { creados: '', hitos: h() }
    } }
  });
  const llegados = await Hitos.llevarGuiaAAbiertos('MATRICULA', GUIA.concat([paso('d')]));
  comprobar('8. llega a los dos abiertos de ese tipo con hitos', llegados, 2);
  comprobar('8. una sola escritura de hitos.json', disco.escrituras, 1);
  comprobar('8. M1 tiene el paso nuevo', titulos(disco.hitos.porAsunto.M1.hitos), ['a', 'b', 'c', 'd']);
  comprobar('8. y como todo lo demás estaba hecho, queda en curso', disco.hitos.porAsunto.M1.hitos[3].estado, 'encurso');
  comprobar('8. el de otro tipo no cambia', titulos(disco.hitos.porAsunto.B1.hitos), ['a', 'b', 'c']);
  comprobar('8. el que no está en abiertos (archivado) no cambia', titulos(disco.hitos.porAsunto.ARCHIVADO.hitos), ['a', 'b', 'c']);
  comprobar('8. el que no tenía hitos sigue sin ellos', disco.hitos.porAsunto['M3 SIN HITOS'], undefined);

  const otra = await Hitos.llevarGuiaAAbiertos('MATRICULA', GUIA.concat([paso('d')]));
  comprobar('8. guardarla otra vez igual no llega a ninguno', otra, 0);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
