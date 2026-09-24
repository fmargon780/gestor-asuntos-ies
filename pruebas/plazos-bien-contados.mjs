/* Prueba de la fila 131 (24-sep-2026, docs/PLAZOS-BIEN-CONTADOS.md),
   sin navegador: cada plazo dice cómo se cuenta.

   1. 10 días hábiles desde el 18-dic-2026, con el 25-dic, el 1-ene y el
      6-ene festivos y del 23-dic al 7-ene no lectivos: el 5-ene-2027 (las
      vacaciones cuentan).
   2. Lo mismo en días lectivos: después del 7-ene.
   3. 15 días naturales que caen en domingo: al lunes; si el lunes es
      festivo, al martes.
   4. Un plazo viejo sin `cuenta` se calcula como hábiles; el hito copia la
      cuenta de su paso; al marcar hecho, el plazo dependiente usa su modo.
   5. Los textos: «10 días hábiles», «1 día lectivo», «quedan N días…». */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const dom = new JSDOM('');
const contexto = { console, window: {}, document: dom.window.document, DOMParser: dom.window.DOMParser };
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: { usuario: 'Francisco' } };
for (const f of ['util.js', 'plazos.js', 'guias.js', 'hitos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });
}
const { Plazos, Guias, Hitos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const festivos = ['2026-12-25', '2027-01-01', '2027-01-06'];
const noLectivos = [];
for (let d = new Date(2026, 11, 23); d <= new Date(2027, 0, 7); d.setDate(d.getDate() + 1)) noLectivos.push(iso(d));

/* 1 y 2 */
comprobar('1. 10 días hábiles: las vacaciones cuentan', Plazos.sumarPlazo('2026-12-18', 10, 'habiles', festivos, noLectivos), '2027-01-05');
const lectivos = Plazos.sumarPlazo('2026-12-18', 10, 'lectivos', festivos, noLectivos);
comprobar('2. 10 días lectivos: después del 7-ene', [lectivos > '2027-01-07', lectivos], [true, '2027-01-19']);

/* 3: del 1-oct-2026 (jueves) + 15 = 16-oct (viernes); + 17 = 18-oct (domingo) */
comprobar('3. naturales que caen en domingo: al lunes', Plazos.sumarPlazo('2026-10-01', 17, 'naturales', [], []), '2026-10-19');
comprobar('3. y si el lunes es festivo, al martes', Plazos.sumarPlazo('2026-10-01', 17, 'naturales', ['2026-10-19'], []), '2026-10-20');
comprobar('3. naturales que caen en día hábil, tal cual', Plazos.sumarPlazo('2026-10-01', 15, 'naturales', [], []), '2026-10-16');

/* 4 */
comprobar('4. un plazo sin cuenta, como hábiles',
  Plazos.sumarPlazo('2026-12-18', 10, undefined, festivos, noLectivos), '2027-01-05');
comprobar('4. la guía lee un plazo viejo como hábiles',
  Guias.normalizar([{ id: 'p', titulo: 'x', plazo: { dias: 5, desde: 'q' } }])[0].plazo.cuenta, 'habiles');
comprobar('4. y guarda el modo que se le diga',
  Guias.normalizar([{ id: 'p', titulo: 'x', plazo: { dias: 5, desde: 'q', cuenta: 'lectivos' } }])[0].plazo.cuenta, 'lectivos');
const pasos = Guias.normalizar([
  { id: 'p1', titulo: 'Notificar' },
  { id: 'p2', titulo: 'Reclamación', plazo: { dias: 2, desde: 'p1', cuenta: 'lectivos' } }
]);
const hitos = pasos.map(Hitos.pasoAHito);
comprobar('4. el hito copia la cuenta de su paso', hitos[1].plazo, { dias: 2, desde: 'p1', cuenta: 'lectivos' });
comprobar('4. un hito viejo sin cuenta, hábiles', Hitos.normalizarHito({ id: 'h', titulo: 'x', plazo: { dias: 3, desde: 'p' } }).plazo.cuenta, 'habiles');
const hoy = U_hoy();
function U_hoy() { return contexto.U.hoyIso(); }
const ajustes = Hitos.normalizarAjustes({ festivos: ['2099-01-01', 'mal'], noLectivos: [] });
comprobar('4. los ajustes guardan los festivos (y descartan lo que no es fecha)', ajustes.festivos, ['2099-01-01']);
Hitos.aplicarPlazosDependientes(hitos, 'p1', { festivos: [], noLectivos: [] });
comprobar('4. al hacerse el paso del que depende, su fecha se cuenta en su modo',
  hitos[1].fecha, Plazos.sumarPlazo(hoy, 2, 'lectivos', [], []));

/* 5 */
comprobar('5. «10 días hábiles»', Plazos.textoPlazo({ dias: 10 }), '10 días hábiles');
comprobar('5. «1 día lectivo»', Plazos.textoPlazo({ dias: 1, cuenta: 'lectivos' }), '1 día lectivo');
comprobar('5. «3 días naturales»', Plazos.textoPlazo({ dias: 3, cuenta: 'naturales' }), '3 días naturales');
comprobar('5. «0 días hábiles» (quedan)', Plazos.textoDias(0, 'habiles'), '0 días hábiles');
comprobar('5. quedan, en lectivos, saltando los no lectivos',
  Plazos.diasQueQuedan('2026-12-18', '2027-01-11', 'lectivos', festivos, noLectivos), 4);
comprobar('5. quedan, en hábiles, contando las vacaciones',
  Plazos.diasQueQuedan('2026-12-18', '2027-01-05', 'habiles', festivos, noLectivos), 10);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
