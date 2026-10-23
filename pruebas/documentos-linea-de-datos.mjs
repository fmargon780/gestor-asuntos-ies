/* Prueba de la fila 436 (23-oct-2026, docs/DOCUMENTOS-CON-PERSONA-Y-LINEA-DE-DATOS.md, parte B):
   la línea de datos «Nombre del campo: valor» bajo cada documento, en una sola función
   (DocumentosDatos.linea / lineaHTML) usada por todas las listas. Chromium real con la copia de pruebas.

   1. Un documento con campos anotados dice qué es cada dato; con una persona de las listas, su «visible».
   2. Un campo que ya no existe en el tipo se enseña solo con el valor.
   3. Un documento de una candidatura lleva «Candidato: …» aunque no tenga campos.
   4. Sin campos anotados ni candidatura, no hay línea (se ve igual que antes).
   5. `soloCampos` (hito) quita el registro y el texto; la línea completa los lleva.
   6. La lista para elegir adjuntos de un correo la pinta, con el texto entero en el title. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(2000);

const r = await pagina.evaluate(() => {
  const T = 'JUSTIFICANTE LINEA';
  const campos = { porTipoDocumento: {} };
  const guardados = App.E.campos;
  App.E.campos = Object.assign({}, guardados || {}, { porTipoDocumento: Object.assign({}, (guardados || {}).porTipoDocumento, {
    [T]: [{ id: 'c1', nombre: 'Alumno', clase: 'persona', valores: [], listas: ['ALUMNADO'] }, { id: 'c2', nombre: 'Motivo', clase: 'texto', valores: [] }]
  }) });
  const a = { nombre: 'ASUNTO X', ficha: {
    documentos: {
      'D26-00001': { tipo: T, registros: [{ ano: '26', sentido: 'E', modo: 'M', numero: '123', codigo: '26EM0123' }],
        campos: ['Amortegui, Nicolás', 'Autobús'], valores: { c1: { categoria: 'ALUMNADO', nombre: 'x', visible: 'Amortegui, Nicolás' }, c2: 'Autobús', c9: 'Viejo' }, texto: 'curso 1' },
      'D26-00002': { tipo: T, registros: [], campos: ['', ''], valores: {}, texto: '' }
    },
    candidaturas: [{ id: 'k1', persona: { categoria: 'ALUMNADO', nombre: 'Garrido', visible: 'Garrido Mérida, Francisco Manuel' }, sector: 'Alumnado', documentos: ['260101 SOLICITUD DE CANDIDATURA.pdf'] }]
  } };
  const D = DocumentosDatos;
  return {
    completa: D.linea(a, '260101 JUSTIFICANTE LINEA D26-00001.pdf'),
    soloCampos: D.linea(a, '260101 JUSTIFICANTE LINEA D26-00001.pdf', { soloCampos: true }),
    vacio: D.linea(a, '260101 JUSTIFICANTE LINEA D26-00002.pdf'),
    sinNumero: D.linea(a, 'documento antiguo.pdf'),
    candidato: D.linea(a, '260101 SOLICITUD DE CANDIDATURA.pdf'),
    html: D.lineaHTML(a, '260101 JUSTIFICANTE LINEA D26-00001.pdf'),
    htmlVacio: D.lineaHTML(a, 'documento antiguo.pdf'),
    asuntoJson: JSON.stringify(a)
  };
});

await comprobar('1+2. campos con su nombre, registro y texto; el campo que ya no existe, solo el valor',
  r.completa, 'Registro 26EM0123 · Alumno: Amortegui, Nicolás · Motivo: Autobús · Viejo · curso 1');
await comprobar('5. solo campos (hito): sin registro ni texto', r.soloCampos, 'Alumno: Amortegui, Nicolás · Motivo: Autobús · Viejo');
await comprobar('4. sin campos anotados no hay línea', [r.vacio, r.sinNumero, r.htmlVacio], ['', '', '']);
await comprobar('3. candidatura sin campos: Candidato', r.candidato, 'Candidato: Garrido Mérida, Francisco Manuel');
await comprobar('6. el HTML lleva la clase y el texto entero en el title', /class="doc-datos " title="Registro 26EM0123 · Alumno: Amortegui, Nicolás/.test(r.html), true);

/* Cortada con «…» en CSS */
const css = await pagina.evaluate(() => {
  document.body.insertAdjacentHTML('beforeend', '<div id="prueba-linea" style="width:120px">' + DocumentosDatos.lineaHTML({ ficha: { documentos: { 'D26-00009': { tipo: 'X', registros: [], campos: ['un valor muy largo que no cabe en la caja'], valores: null, texto: '' } } } }, '260101 X D26-00009.pdf') + '</div>');
  const e = document.querySelector('#prueba-linea .doc-datos'); const c = getComputedStyle(e);
  return [c.textOverflow, c.whiteSpace, c.overflow, e.scrollWidth > e.clientWidth];
});
const ancho = await pagina.evaluate(() => {
  const largo = 'Motivo: ' + 'muy largo '.repeat(20);
  document.body.insertAdjacentHTML('beforeend', '<div id="prueba-mesa" style="width:500px"><div class="hito-documento mesa-doc"><div class="mesa-doc-nombre"><span>nombre</span><div class="doc-datos">' + largo + '</div></div><span class="mesa-doc-acciones"><button>Abrir</button></span></div>' +
    '<div class="ficha-documentos" style="width:400px"><div class="ficha-documento-fila"><button class="ficha-documento"><span class="marca-ext">PDF</span><span class="ficha-documento-nombre">nombre.pdf</span></button><div class="doc-datos ficha-documento-datos">' + largo + '</div></div></div></div>');
  const f = document.querySelector('#prueba-mesa .mesa-doc'), b = document.querySelector('#prueba-mesa .ficha-documento-fila');
  const d = b.querySelector('.doc-datos'), n = b.querySelector('.ficha-documento-nombre');
  return [f.scrollWidth <= f.clientWidth, b.scrollWidth <= b.clientWidth, Math.abs(d.getBoundingClientRect().top - n.getBoundingClientRect().top) < 12];
});
await comprobar('5. una línea larga no ensancha la fila del hito y en la carpeta va en la misma línea que el nombre (fila 439)', ancho, [true, true, true]);
await comprobar('5. si es larga se corta con «…»', css, ['ellipsis', 'nowrap', 'hidden', true]);

/* La lista de adjuntos de un correo pinta la línea. */
const adj = await pagina.evaluate(async () => {
  const a = { handle: {}, ficha: { documentos: { 'D26-99999': { tipo: 'T', registros: [], campos: ['valor visible'], valores: null, texto: '' } } } };
  const real = Carpetas.ficheros;
  Carpetas.ficheros = async () => [{ nombre: '260101 T D26-99999.pdf', handle: { getFile: async () => ({ size: 10 }) } }];
  const html = await CorreoAdjuntos.pintarBloque(a);
  Carpetas.ficheros = real;
  return /doc-datos/.test(html) && /valor visible/.test(html);
});
await comprobar('6. la lista de adjuntos de un correo pinta la línea', adj, true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien');
