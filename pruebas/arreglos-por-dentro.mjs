/* Prueba de la fila 132 (24-sep-2026, docs/ARREGLOS-POR-DENTRO.md), sin
   navegador:

   1. La caché de terceros se olvida cuando cambia la fecha de un CSV de
      _GESTOR/datos (la primera pasada solo apunta).
   2. No queda código de los estados escritos a mano.
   3. vercel.json lleva las tres cabeceras de seguridad.
   4. El lector de PDF es el 4.10.38.
   5. Los tres sitios que eligen destinatarios usan la misma regla
      (js/destinatarios.js), y da lo mismo para el mismo asunto. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../', import.meta.url).pathname;
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const leer = (f) => fs.readFileSync(raiz + f, 'utf8');

/* ---------- un disco de mentira, con fechas ---------- */
function fichero(nombre, texto, fecha) {
  return { kind: 'file', name: nombre, _texto: texto, _fecha: fecha,
    async getFile() { const t = this._texto, f = this._fecha; return { name: nombre, lastModified: f, size: t.length, async text() { return t; }, async arrayBuffer() { return new TextEncoder().encode(t).buffer; } }; },
    async createWritable() { const yo = this; let b = ''; return { async write(x) { b += x; }, async close() { yo._texto = b; yo._fecha = Date.now(); } }; } };
}
function carpeta(nombre) {
  const hijos = new Map();
  return { kind: 'directory', name: nombre, _hijos: hijos,
    async getFileHandle(n, o) { if (!hijos.has(n)) { if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; } hijos.set(n, fichero(n, '', Date.now())); } return hijos.get(n); },
    async getDirectoryHandle(n, o) { if (!hijos.has(n)) { if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; } hijos.set(n, carpeta(n)); } return hijos.get(n); },
    async removeEntry(n) { hijos.delete(n); },
    async *entries() { for (const [k, v] of hijos) yield [k, v]; } };
}

const contexto = { console, TextDecoder, Blob, window: {}, indexedDB: null, setTimeout, clearTimeout,
  document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'nombres.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'conflictos.js', 'conflictos-datos.js', 'destinatarios.js']) {
  vm.runInContext(leer('js/' + f), contexto, { filename: f });
  Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });
}
const { Datos, Conflictos, Destinatarios } = contexto;
contexto.window.Datos = Datos;

/* ---------- 1 ---------- */
console.log('--- 1. la caché se olvida cuando cambia el CSV ---');
comprobar('1. la primera pasada solo apunta', Conflictos.categoriasCambiadas(null, { 'empresas.csv': 1 }), []);
comprobar('1. un CSV de altas cambiado: su categoría',
  Conflictos.categoriasCambiadas({ 'empresas.csv': 1, 'personal.csv': 5 }, { 'empresas.csv': 2, 'personal.csv': 5 }), ['EMPRESAS']);
comprobar('1. un RegAlum nuevo: el alumnado',
  Conflictos.categoriasCambiadas({}, { 'RegAlum.csv': 3 }), ['ALUMNADO']);
comprobar('1. un fichero que no se sabe de quién es: todas', Conflictos.categoriasCambiadas({}, { 'raro.csv': 3 }), null);

const datos = carpeta('datos');
const cab = Datos.LISTAS.EMPRESAS.cabecera;
datos._hijos.set('empresas.csv', fichero('empresas.csv', Datos.aCsv(cab, [['Papeles del Sur SL', '', 'B1', '', '', '']]), 1000));
contexto.window.App = contexto.App = { E: { datos: datos } };
const antes = await Datos.cargar(datos, 'EMPRESAS');
await Conflictos.revisarFechasDatos();   /* primera pasada: solo apunta */
/* El compañero añade una empresa desde el otro ordenador. */
datos._hijos.set('empresas.csv', fichero('empresas.csv', Datos.aCsv(cab, [['Autocares Norte SA', '', 'A2', '', '', ''], ['Papeles del Sur SL', '', 'B1', '', '', '']]), 2000));
const sinRevisar = await Datos.cargar(datos, 'EMPRESAS');
await Conflictos.revisarFechasDatos();
const tras = await Datos.cargar(datos, 'EMPRESAS');
comprobar('1. sin la revisión, se sigue viendo lo de antes', [antes.lista.length, sinRevisar.lista.length], [1, 1]);
comprobar('1. tras la revisión, se relee y sale la nueva', tras.lista.map(p => p.nombre), ['Autocares Norte SA', 'Papeles del Sur SL']);

/* ---------- 2 ---------- */
console.log('--- 2. fuera los estados escritos a mano ---');
const js = fs.readdirSync(raiz + 'js').filter(f => f.endsWith('.js'));
const quien = (re) => js.filter(f => re.test(leer('js/' + f)));
comprobar('2. nadie define ni llama a pintarTablaEstados', quien(/pintarTablaEstados/), []);
comprobar('2. ni a App.cargarEstados / App.guardarEstados / App.ponerEstado / App.colorEstado',
  quien(/App\.(cargarEstados|guardarEstados|ponerEstado|colorEstado|posDeEstado|esDeEspera)\b/), []);
comprobar('2. nadie lee App.E.estados', quien(/App\.E\.estados/), []);
comprobar('2. index.html ya no trae la rejilla', /tabla-estados/.test(leer('index.html')), false);

/* ---------- 3 ---------- */
console.log('--- 3. cabeceras de seguridad ---');
const cabeceras = {};
JSON.parse(leer('vercel.json')).headers.forEach(h => h.headers.forEach(x => { cabeceras[x.key] = x.value; }));
comprobar('3. nosniff', cabeceras['X-Content-Type-Options'], 'nosniff');
comprobar('3. sin referer', cabeceras['Referrer-Policy'], 'no-referrer');
comprobar('3. CSP sin marcos, objetos ni base ajena, y solo scripts propios', cabeceras['Content-Security-Policy'],
  "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; script-src 'self' blob:");
comprobar('3. y la de caché, como siempre', cabeceras['Cache-Control'], 'public, max-age=0, must-revalidate');

/* ---------- 4 ---------- */
console.log('--- 4. el lector de PDF ---');
comprobar('4. pdf.js y su trabajador, 4.10.38',
  [/"4\.10\.38"/.test(leer('js/lib/pdf.min.mjs')), /"4\.10\.38"/.test(leer('js/lib/pdf.worker.min.mjs'))], [true, true]);

/* ---------- 5 ---------- */
console.log('--- 5. una sola regla para los destinatarios ---');
const persona = { campos: { 'Correo tutor 1': 'madre@ejemplo.es', 'Correo tutor 2': 'padre@ejemplo.es; MADRE@ejemplo.es', 'Teléfono': '600' } };
comprobar('5. todas las direcciones de la ficha, sin repetir', Destinatarios.correosDe(persona).map(c => c.dir), ['madre@ejemplo.es', 'padre@ejemplo.es']);
comprobar('5. sin «Lo pide», todas marcadas de partida', Destinatarios.posibles(persona, '').lista.map(c => c.porDefecto), [true, true]);
const miembros = [{ nombre: 'Uno', persona: persona }, { nombre: 'Dos', persona: { campos: { Correo: 'dos@ejemplo.es' } } }, { nombre: 'Tres', persona: null }];
comprobar('5. un grupo: todas sus direcciones, y quién no tiene', Destinatarios.delGrupo(miembros),
  { direcciones: ['madre@ejemplo.es', 'padre@ejemplo.es', 'dos@ejemplo.es'], sinCorreo: ['Tres'] });
comprobar('5. «Comunicar» a un relacionado da las mismas direcciones que el grupo',
  Destinatarios.deHito('relacionado', { relacionados: [{ nombre: 'Uno' }, { nombre: 'Dos' }], relacionadosResueltos: miembros }).correoPreferente,
  Destinatarios.delGrupo(miembros).direcciones.join(', '));
comprobar('5. sin responsable de fuera: el tercero', Destinatarios.deHito('yo', { nombreTercero: 'Ana' }), { nombre: 'Ana', correoPreferente: '' });
const usan = {
  correo: leer('js/correo-cuadro.js'), hito: leer('js/hitos-comunicar.js'), seneca: leer('js/seneca-destinatarios.js')
};
comprobar('5. los tres usan la regla común',
  [/Destinatarios\.(correosDe|posibles|delGrupo|miembrosDeOpcion)/.test(usan.correo),
   /Destinatarios\.(deHito|direccionesDe)/.test(usan.hito),
   /Destinatarios\.miembrosDeOpcion/.test(usan.seneca)], [true, true, true]);
comprobar('5. y ninguno lleva ya su propia expresión para sacar correos',
  [usan.correo, usan.hito, usan.seneca].map(t => /\[\^\\s,;<>\(\)"\]\+@/.test(t)), [false, false, false]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
