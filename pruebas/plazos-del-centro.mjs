/* Prueba de la fila 284 (6-oct-2026, docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md), sin navegador:
   la pasada de js/plazos-del-centro.js con el contenido REAL de datos-biblioteca/biblioteca-centro.json
   y un disco de mentira en memoria.

   1. El contenido: versión 2, seis plazos, siete modelos nuevos, la tabla por tipo.
   2. Un modelo sin plazo lo recibe; uno que ya lo tiene, no se toca; los siete nuevos entran una vez.
   3. Los pasos: «Reclamación de calificaciones» cuenta desde el de la tabla (no desde el de arriba); b15 cuenta desde
      un paso distinto en cada una de sus dos guías; si el «desde» de la tabla ya no está, desde el de arriba; el primer
      paso se queda sin plazo; un plazo que ya estaba puesto no se pisa; los pasos de dentro de una pregunta, tampoco.
   4. La marca: la segunda pasada no cambia nada; con la marca puesta no corre sola; con `forzar` sí.
   5. Con solo consulta, o con un guardado en marcha, no escribe nada.
   6. Ninguna `revision` sube.
   7. Traer un modelo con plazo a una guía lo deja contando desde el de arriba (y sin «desde» si no hay ninguno encima).
   8. El editor de un modelo y la comparación: «Guardar en la biblioteca» no guarda el «desde»; la comparación lo ignora. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const datos = JSON.parse(fs.readFileSync(new URL('../datos-biblioteca/biblioteca-centro.json', import.meta.url), 'utf8'));
const dom = new JSDOM('');

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- el entorno ---------- */
const disco = {};                         /* nombre de fichero -> contenido */
const avisos = [];
let soloConsulta = false, guardando = false, escrituras = 0;
const contexto = { console, window: {}, document: dom.window.document, DOMParser: dom.window.DOMParser, setTimeout, clearTimeout };
vm.createContext(contexto);
contexto.App = contexto.window.App = {
  E: { usuario: 'Francisco', gestor: { nombre: 'gestor' } },
  leerFicheroDeLaApp: async () => JSON.parse(JSON.stringify(datos)),
  ir() {}
};
contexto.window.Gestor = contexto.Gestor = { carpetaGestor: () => contexto.App.E.gestor, alRefrescar: [] };
contexto.window.SoloConsulta = contexto.SoloConsulta = { activo: () => soloConsulta };
contexto.window.ColaGuardado = contexto.ColaGuardado = { hayGuardado: () => guardando };
contexto.window.Carpetas = contexto.Carpetas = {
  leerJson: async (g, n) => (disco[n] === undefined ? null : JSON.parse(JSON.stringify(disco[n])))
};
contexto.window.Copias = contexto.Copias = {
  guardar: async (g, n, d) => { escrituras++; disco[n] = JSON.parse(JSON.stringify(d)); }
};
contexto.window.GuiasDelCentro = contexto.GuiasDelCentro = {
  guardarPasos: async (tipo, pasos) => {
    const g = JSON.parse(JSON.stringify(disco['guias.json'] || {}));
    g[tipo] = pasos; escrituras++; disco['guias.json'] = g;
  }
};

contexto.window.Hitos = contexto.Hitos = undefined;
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'plazos.js', 'guias.js', 'hitos-biblioteca.js', 'plazos-del-centro.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto) || contexto[k] === undefined) contexto[k] = contexto.window[k]; });
}
contexto.U.aviso = (t, c) => avisos.push([t, c]);
contexto.U.accesorio = (t, e) => avisos.push(['ACCESORIO ' + t, String(e)]);
const { HitosBiblioteca, PlazosDelCentro, Plazos } = contexto;

function paso(id, origen, extra) {
  return Object.assign({ id, titulo: id, cuerpo: '', opciones: [], origenBiblioteca: origen ? { id: origen, revision: 1, divergido: false } : undefined }, extra || {});
}
const guiaTipo = (nombre) => (disco['guias.json'] || {})[nombre];
const plazoDe = (nombre, id) => guiaTipo(nombre).filter((p) => p.id === id)[0].plazo;

/* 1. el contenido */
console.log('--- 1. el contenido ---');
const delContenido = Object.fromEntries(datos.modelos.map((m) => [m.id, m]));
comprobar('1. versión 2', datos.version, 2);
comprobar('1. seis plazos en modelos que ya estaban',
  ['b15', 'b32', 'b120', 'b121', 'b157'].map((i) => delContenido[i].plazo), [
    { dias: 2, cuenta: 'lectivos' }, { dias: 10, cuenta: 'habiles' }, { dias: 2, cuenta: 'habiles' },
    { dias: 3, cuenta: 'habiles' }, { dias: 1, cuenta: 'meses' }]);
comprobar('1. b114 se queda sin número', delContenido.b114.plazo, undefined);
comprobar('1. siete modelos comunes nuevos', datos.modelos.filter((m) => m.id.startsWith('b-comun-')).map((m) => m.id), [
  'b-comun-requerir', 'b-comun-esperar-solicitud', 'b-comun-audiencia', 'b-comun-esperar-alegaciones',
  'b-comun-pedir-informe', 'b-comun-esperar-informe', 'b-comun-esperar-alzada']);
comprobar('1. los de espera llevan plazo y los de hacer, no',
  datos.modelos.filter((m) => m.id.startsWith('b-comun-')).map((m) => !!m.plazo), [false, true, false, true, false, true, true]);
comprobar('1. «Esperar a que completen la solicitud» es del tercero', delContenido['b-comun-esperar-solicitud'].responsable, 'tercero');
comprobar('1. la tabla por tipo tiene b15 con dos «desde» distintos',
  [datos.plazosPorTipo['Corrección por conducta contraria a la convivencia'].b15, datos.plazosPorTipo['Medida disciplinaria por conducta gravemente perjudicial'].b15], ['b13', 'b21']);

/* 2. los modelos */
console.log('--- 2. los modelos ---');
disco['hitos-biblioteca.json'] = {
  version: 1, modelos: [
    { id: 'b15', nombre: 'Plazo de reclamación', titulo: 'Plazo de reclamación', revision: 3 },
    { id: 'b32', nombre: 'Notificar la resolución', titulo: 'Notificar la resolución', revision: 2, plazo: { dias: 7, desde: '', cuenta: 'naturales' } },
    { id: 'b120', nombre: 'Registrar', titulo: 'Registrar', revision: 1 },
    { id: 'b121', nombre: 'Remitir', titulo: 'Remitir', revision: 1 },
    { id: 'b157', nombre: 'Responder', titulo: 'Responder', revision: 1 }
  ]
};
disco['guias.json'] = {
  'Corrección por conducta contraria a la convivencia': [paso('c1', 'b13'), paso('c2', 'b14'), paso('c3', 'b15')],
  'Medida disciplinaria por conducta gravemente perjudicial': [paso('m1', 'b21'), paso('m2', 'b22'), paso('m3', 'b15')],
  'Expediente de cambio de centro docente': [paso('e1', 'b31'), paso('e2', 'b32')],
  'Reclamación de calificaciones': [paso('r1', 'b113'), paso('r2', 'b118'), paso('r3', 'b119'), paso('r4', 'b120'), paso('r5', 'b121')],
  'Solicitud de acceso a datos personales': [paso('a1', 'b154'), paso('a2', 'b155'), paso('a3', 'b157')],
  'Otra guía': [paso('o1', 'b120'), paso('o2', 'b15'),
    paso('o3', null, { opciones: [{ id: 'op', texto: 'Sí', pasos: [paso('d1', 'b155'), paso('d2', 'b120')] }] })],
  'Con plazo puesto': [paso('x1', 'b13'), paso('x2', 'b15', { plazo: { dias: 9, desde: 'x1', cuenta: 'naturales' } })]
};
const revisionesAntes = Object.fromEntries(disco['hitos-biblioteca.json'].modelos.map((m) => [m.id, m.revision]));
const pasoRevisiones = JSON.stringify(Object.values(disco['guias.json']).flat().map((p) => p.origenBiblioteca && p.origenBiblioteca.revision));

const r1 = await PlazosDelCentro.pasada();
const bib = disco['hitos-biblioteca.json'];
const m = Object.fromEntries(bib.modelos.map((x) => [x.id, x]));
comprobar('2. la pasada ha corrido', !!r1, true);
comprobar('2. entran los siete comunes', r1.modelosNuevos, 7);
comprobar('2. b15, b120, b121 y b157 reciben el plazo, sin «desde»',
  ['b15', 'b120', 'b121', 'b157'].map((i) => m[i].plazo), [
    { dias: 2, desde: '', cuenta: 'lectivos' }, { dias: 2, desde: '', cuenta: 'habiles' },
    { dias: 3, desde: '', cuenta: 'habiles' }, { dias: 1, desde: '', cuenta: 'meses' }]);
comprobar('2. el plazo que b32 ya tenía no se toca', m.b32.plazo, { dias: 7, desde: '', cuenta: 'naturales' });
comprobar('2. «Esperar el plazo de recurso de alzada»: 1 mes', Plazos.textoPlazo(m['b-comun-esperar-alzada'].plazo), '1 mes');
comprobar('2. «Esperar a que completen la solicitud»: 10 días hábiles', Plazos.textoPlazo(m['b-comun-esperar-solicitud'].plazo), '10 días hábiles');
comprobar('2. los nuevos llevan su revisión 1', bib.modelos.filter((x) => x.id.startsWith('b-comun-')).map((x) => x.revision), [1, 1, 1, 1, 1, 1, 1]);
comprobar('2. la marca queda puesta', bib.plazosDelCentro, 2);
comprobar('2. ninguna revisión de modelo sube', Object.fromEntries(['b15', 'b32', 'b120', 'b121', 'b157'].map((i) => [i, m[i].revision])), revisionesAntes);

/* 3. los pasos */
console.log('--- 3. los pasos ---');
comprobar('3. Reclamación: b120 cuenta desde b118 (no desde el de arriba)', plazoDe('Reclamación de calificaciones', 'r4'), { dias: 2, desde: 'r2', cuenta: 'habiles' });
comprobar('3. Reclamación: b121 cuenta desde b120', plazoDe('Reclamación de calificaciones', 'r5'), { dias: 3, desde: 'r4', cuenta: 'habiles' });
comprobar('3. b15 en la corrección: desde b13', plazoDe('Corrección por conducta contraria a la convivencia', 'c3'), { dias: 2, desde: 'c1', cuenta: 'lectivos' });
comprobar('3. b15 en la medida: desde b21 (otro paso distinto)', plazoDe('Medida disciplinaria por conducta gravemente perjudicial', 'm3'), { dias: 2, desde: 'm1', cuenta: 'lectivos' });
comprobar('3. cambio de centro: b32 desde b31', plazoDe('Expediente de cambio de centro docente', 'e2'), { dias: 10, desde: 'e1', cuenta: 'habiles' });
comprobar('3. acceso a datos: «1 mes» desde b154', plazoDe('Solicitud de acceso a datos personales', 'a3'), { dias: 1, desde: 'a1', cuenta: 'meses' });
comprobar('3. guía fuera de la tabla: desde el de arriba; el primero, sin plazo',
  [guiaTipo('Otra guía')[0].plazo || null, plazoDe('Otra guía', 'o2')], [null, { dias: 2, desde: 'o1', cuenta: 'lectivos' }]);
comprobar('3. dentro de una pregunta no se toca', guiaTipo('Otra guía')[2].opciones[0].pasos.map((p) => p.plazo || null), [null, null]);
comprobar('3. un plazo ya puesto no se pisa', plazoDe('Con plazo puesto', 'x2'), { dias: 9, desde: 'x1', cuenta: 'naturales' });
comprobar('3. el resumen cuenta los pasos y las guías', [r1.pasos, r1.guias], [7, 6]);
comprobar('3. el aviso verde, con los números', PlazosDelCentro.textoDelAviso(r1), 'Plazos legales puestos en 7 hitos de 6 guías. La biblioteca tiene 7 hitos comunes nuevos.');
comprobar('3. sin plazos, solo la segunda frase', PlazosDelCentro.textoDelAviso({ pasos: 0, guias: 0, modelosNuevos: 7 }), 'La biblioteca tiene 7 hitos comunes nuevos.');
comprobar('3. sin nada, no sale', PlazosDelCentro.textoDelAviso({ pasos: 0, guias: 0, modelosNuevos: 0 }), '');
comprobar('3. ninguna revisión de paso cambia', JSON.stringify(Object.values(disco['guias.json']).flat().map((p) => p.origenBiblioteca && p.origenBiblioteca.revision)), pasoRevisiones);

/* el «desde» de la tabla ya no está en la guía: cuenta desde el de arriba */
const sinB118 = { 'Reclamación de calificaciones': [paso('s1', 'b113'), paso('s2', 'b119'), paso('s3', 'b120')] };
PlazosDelCentro._completarGuias(sinB118, datos);
comprobar('3. si el paso de la tabla ya no está, desde el de arriba', sinB118['Reclamación de calificaciones'][2].plazo, { dias: 2, desde: 's2', cuenta: 'habiles' });
const solo = { 'Otra': [paso('u1', 'b120')] };
PlazosDelCentro._completarGuias(solo, datos);
comprobar('3. el primer paso de una guía fuera de la tabla, sin plazo', solo.Otra[0].plazo, undefined);

/* 4. la marca */
console.log('--- 4. la marca ---');
const guiasTras = JSON.stringify(disco['guias.json']), bibTras = JSON.stringify(disco['hitos-biblioteca.json']);
escrituras = 0;
comprobar('4. con la marca puesta no corre sola', await PlazosDelCentro.pasada(), null);
comprobar('4. y no escribe nada', escrituras, 0);
const r2 = await PlazosDelCentro.pasada({ forzar: true });
comprobar('4. a mano, corre y no cambia nada: 0 plazos, 0 nuevos', [r2.pasos, r2.modelosConPlazo, r2.modelosNuevos], [0, 0, 0]);
comprobar('4. la segunda pasada deja los ficheros igual', [JSON.stringify(disco['guias.json']), JSON.stringify(disco['hitos-biblioteca.json'])], [guiasTras, bibTras]);
comprobar('4. los siete no se duplican', disco['hitos-biblioteca.json'].modelos.filter((x) => x.id.startsWith('b-comun-')).length, 7);

/* si alguien quita un plazo a propósito, no vuelve solo */
disco['hitos-biblioteca.json'].modelos.filter((x) => x.id === 'b157')[0].plazo = null;
comprobar('4. quitar un plazo a propósito: no vuelve solo', await PlazosDelCentro.pasada(), null);
const r3 = await PlazosDelCentro.pasada({ forzar: true });
comprobar('4. pero a mano sí rellena lo vacío', r3.modelosConPlazo, 1);

/* 5. solo consulta y guardado en marcha */
console.log('--- 5. solo consulta ---');
disco['hitos-biblioteca.json'].plazosDelCentro = 0;
disco['hitos-biblioteca.json'].modelos = disco['hitos-biblioteca.json'].modelos.filter((x) => !x.id.startsWith('b-comun-'));
escrituras = 0; soloConsulta = true;
comprobar('5. con solo consultar no corre', await PlazosDelCentro.pasada(), null);
soloConsulta = false; guardando = true;
comprobar('5. con un guardado en marcha no corre', await PlazosDelCentro.pasada(), null);
comprobar('5. y no escribe nada', escrituras, 0);
guardando = false;
const r4 = await PlazosDelCentro.pasada();
comprobar('5. sin eso, corre y trae los siete otra vez', r4.modelosNuevos, 7);

/* 7. traer un modelo con plazo a una guía */
console.log('--- 7. traer un modelo ---');
const modeloConPlazo = HitosBiblioteca._normalizarModelo(delContenido['b-comun-esperar-solicitud']);
comprobar('7. el modelo guarda días y cuenta, y el «desde» vacío', modeloConPlazo.plazo, { dias: 10, desde: '', cuenta: 'habiles' });
const traido = HitosBiblioteca.modeloAPaso(modeloConPlazo, 'arriba1');
comprobar('7. llega contando desde el de arriba', traido.plazo, { dias: 10, desde: 'arriba1', cuenta: 'habiles' });
comprobar('7. sin ninguno encima, llega sin plazo', HitosBiblioteca.modeloAPaso(modeloConPlazo, '').plazo, null);
comprobar('7. y sin decir nada, también', HitosBiblioteca.modeloAPaso(modeloConPlazo).plazo, null);
comprobar('7. un modelo sin plazo no inventa uno', HitosBiblioteca.modeloAPaso(HitosBiblioteca._normalizarModelo(delContenido['b-comun-audiencia']), 'x').plazo, null);
const alzada = HitosBiblioteca.modeloAPaso(HitosBiblioteca._normalizarModelo(delContenido['b-comun-esperar-alzada']), 'q');
comprobar('7. «1 mes» llega como meses', alzada.plazo, { dias: 1, desde: 'q', cuenta: 'meses' });

/* 8. guardar en la biblioteca y comparar */
console.log('--- 8. guardar y comparar ---');
const desdePaso = HitosBiblioteca._pasoAModelo(traido, 'Mi espera', 1, 'Francisco');
comprobar('8. «Guardar en la biblioteca» deja el «desde» vacío', desdePaso.plazo, { dias: 10, desde: '', cuenta: 'habiles' });
comprobar('8. la comparación no mira el «desde»', HitosBiblioteca.diferencias(traido, modeloConPlazo), []);
const otro = JSON.parse(JSON.stringify(traido)); otro.plazo.desde = 'otraGuia';
comprobar('8. ni aunque cada guía cuente desde un hito distinto', HitosBiblioteca.diferencias(otro, modeloConPlazo), []);
const distinto = JSON.parse(JSON.stringify(traido)); distinto.plazo.dias = 15;
comprobar('8. sí mira los días', HitosBiblioteca.diferencias(distinto, modeloConPlazo).map((d) => d.campo), ['plazo']);
const enMeses = JSON.parse(JSON.stringify(traido)); enMeses.plazo.cuenta = 'meses';
comprobar('8. y cómo se cuentan', HitosBiblioteca.diferencias(enMeses, modeloConPlazo).map((d) => d.campo), ['plazo']);

/* 9. un centro sin biblioteca, y los festivos */
console.log('--- 9. sin biblioteca y festivos ---');
disco['hitos-biblioteca.json'] = { version: 1, modelos: [] };
escrituras = 0;
comprobar('9. un centro que nunca cargó su biblioteca: no corre sola ni escribe', [await PlazosDelCentro.pasada(), escrituras], [null, 0]);
let festivos = [];
contexto.Hitos = { leer: async () => ({ ajustes: { festivos } }) };
avisos.length = 0;
await PlazosDelCentro.avisar({ pasos: 1, guias: 1, modelosNuevos: 0 });
comprobar('9. sin festivos: verde y, debajo, ámbar con «Ponerlos»', avisos.map((a) => [a[0], a[1]]),
  [['Plazos legales puestos en 1 hito de 1 guía.', 'bueno'], ['Faltan los festivos: sin ellos los días hábiles se cuentan mal.', 'ambar']]);
festivos = ['2026-12-25'];
avisos.length = 0;
await PlazosDelCentro.avisar({ pasos: 1, guias: 1, modelosNuevos: 0 });
comprobar('9. con festivos: solo el verde', avisos.map((a) => a[1]), ['bueno']);
avisos.length = 0;
await PlazosDelCentro.avisar({ pasos: 0, guias: 0, modelosNuevos: 0 });
comprobar('9. si no se añadió nada, no sale ningún aviso', avisos.length, 0);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
