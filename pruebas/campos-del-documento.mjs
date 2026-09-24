/* Prueba de la fila 96 (docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md):
   los campos propios de un tipo de DOCUMENTO, que entran en el nombre
   entre el tipo y el texto adicional.

   Parte 1, sin navegador (el montaje del nombre): un tipo con dos
   campos, uno obligatorio; el orden; el obligatorio vacío; un tipo sin
   campos, como antes; un documento con registro, que conserva sus
   cuatro piezas; reconocer un valor de lista al renombrar; y que
   campos.json guarda y relee `porTipoDocumento` sin perder nada.

   Parte 2, en navegador de verdad: el cuadro de poner nombre enseña
   los campos del tipo, la vista previa los mete en su sitio, el
   obligatorio vacío no deja guardar, y al renombrar un documento se
   reconoce el valor de lista que ya llevaba. */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= PARTE 1: sin navegador ================= */
console.log('--- parte 1: el nombre ---');
const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'campos.js', 'documentos-campos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8') + (f === 'campos.js' ? '\nwindow.Campos = Campos;' : ''),
    ctx, { filename: f });
}
vm.runInContext('window.U = U; window.Nombres = Nombres;', ctx);
const { Nombres, Campos, DocCampos } = ctx;

const config = Campos.normalizar({
  porTipoDocumento: {
    FACTURA: [
      { id: 'd1', nombre: 'Proveedor', clase: 'lista', valores: ['Papelería Sur', 'Libros SL'], obligatorio: false },
      { id: 'd2', nombre: 'Trimestre', clase: 'texto', obligatorio: true },
      { nombre: '', clase: 'texto' }
    ]
  }
});
ctx.App = { E: { campos: config } };
const campos = DocCampos.campos('FACTURA');
comprobar('un campo sin nombre no sobrevive', campos.map(c => c.nombre), ['Proveedor', 'Trimestre']);
comprobar('un tipo sin campos no tiene ninguno', DocCampos.campos('SOLICITUD'), []);

const valores = { d1: 'Libros SL', d2: '2T' };
comprobar('el nombre, con los campos entre el tipo y el texto adicional, en su orden',
  Nombres.montarDocumento({ fecha: '2026-09-23', tipo: 'FACTURA', campos: DocCampos.enOrden(campos, valores),
                            curso: 'Ref 9', extension: 'pdf' }),
  '260923 FACTURA Libros SL 2T Ref 9.pdf');
comprobar('el obligatorio vacío se nombra', DocCampos.faltaObligatorio(campos, { d1: 'Libros SL', d2: ' ' }), 'Trimestre');
comprobar('relleno, no falta nada', DocCampos.faltaObligatorio(campos, valores), '');
comprobar('un tipo sin campos se monta como siempre',
  Nombres.montarDocumento({ fecha: '2026-09-23', tipo: 'SOLICITUD', campos: [], curso: 'Ref 9', extension: 'pdf' }),
  '260923 SOLICITUD Ref 9.pdf');
comprobar('con registro, conserva las cuatro piezas',
  Nombres.montarDocumento({ fecha: '2026-09-23', codigo: '26EM1234', tipo: 'FACTURA',
                            campos: DocCampos.enOrden(campos, valores), curso: 'Ref 9', extension: 'pdf' }),
  '260923 26EM1234 FACTURA Libros SL 2T Ref 9.pdf');
comprobar('una fecha entra como AAMMDD',
  DocCampos.enOrden([{ id: 'f', nombre: 'Vence', clase: 'fecha', valores: [] }], { f: '2026-10-01' }), ['261001']);
comprobar('al renombrar se reconoce el valor de lista del principio, y nada más',
  DocCampos.reconocer(campos, 'Papelería Sur 2T Ref 9'), { valores: { d1: 'Papelería Sur' }, resto: '2T Ref 9' });
comprobar('si no está tal cual, no se adivina',
  DocCampos.reconocer(campos, 'Papeleria Surtido Ref 9'), { valores: {}, resto: 'Papeleria Surtido Ref 9' });
comprobar('campos.json sin porTipoDocumento sigue igual que antes',
  Object.keys(Campos.normalizar({ propios: [], porTipo: {} })), ['propios', 'calculados', 'porTipo']);

/* guardarCamposDeDocumento relee, guarda y solo toca su trozo. */
let enDisco = { propios: [{ id: 'p1', nombre: 'Trimestre', clase: 'texto' }], porTipo: { SANCION: [] } };
ctx.Carpetas = { leerJson: async () => JSON.parse(JSON.stringify(enDisco)) };
ctx.Copias = { guardar: async (g, f, datos) => { enDisco = JSON.parse(JSON.stringify(datos)); } };
await Campos.guardarCamposDeDocumento({}, 'ACTA', [{ id: 'a1', nombre: 'Órgano', clase: 'lista', valores: ['Claustro', ' '] }]);
comprobar('se guarda el campo del tipo de documento',
  enDisco.porTipoDocumento, { ACTA: [{ id: 'a1', nombre: 'Órgano', clase: 'lista', valores: ['Claustro'], obligatorio: false }] });
comprobar('sin tocar los campos propios de asunto', enDisco.propios.map(p => p.id), ['p1']);
await Campos.guardarPropios({}, l => l);
comprobar('guardar otro trozo de campos.json no se lleva porTipoDocumento', Object.keys(enDisco.porTipoDocumento || {}), ['ACTA']);
await Campos.guardarCamposDeDocumento({}, 'ACTA', []);
comprobar('quitarlos todos borra la clave', 'porTipoDocumento' in enDisco, false);

/* ================= PARTE 2: en el navegador ================= */
console.log('--- parte 2: el cuadro de poner nombre ---');
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
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const ASUNTO = '260901 COMPRA Libros SL B12345678';
const DOC = '260911 FACTURA Papelería Sur Ref 9.pdf';
await pagina.evaluate(async ([ASUNTO, DOC]) => {
  if (App.E.tiposDocumento.indexOf('FACTURA') === -1) App.E.tiposDocumento.push('FACTURA');
  App.E.campos = await Campos.guardarCamposDeDocumento(App.E.gestor, 'FACTURA', [
    { id: 'd1', nombre: 'Proveedor', clase: 'lista', valores: ['Papelería Sur', 'Libros SL'] },
    { id: 'd2', nombre: 'Trimestre', clase: 'texto', obligatorio: true }
  ]);
  const c = await window.__disco.abiertos.getDirectoryHandle(ASUNTO, { create: true });
  const h = await c.getFileHandle(DOC, { create: true });
  const w = await h.createWritable(); await w.write('%PDF-1.4'); await w.close();
  await App.verAbiertos();
  const a = App.E.listaAbiertos.filter(x => x.nombre === ASUNTO)[0];
  window.__doc = Documentos.abrir(a);
}, [ASUNTO, DOC]);
await pagina.waitForSelector('#doc-cuerpo [data-renombrar]');
await pagina.click('#doc-cuerpo [data-renombrar]');
await pagina.waitForSelector('#doc-vista');
await pagina.waitForTimeout(200);

comprobar('salen los dos campos del tipo',
  await pagina.locator('#doc-campos-tipo .etiqueta').allTextContents(), ['Proveedor (opcional)', 'Trimestre *']);
comprobar('el proveedor que ya llevaba el nombre se reconoce',
  await pagina.locator('#doc-campos-tipo [data-doc-campo="d1"]').inputValue(), 'Papelería Sur');
comprobar('y sale del texto adicional', await pagina.inputValue('#doc-curso'), 'Ref 9');
comprobar('la vista previa no cambia el nombre de partida',
  await pagina.locator('#doc-vista').textContent(), DOC);

await pagina.click('#doc-guardar');
await pagina.waitForTimeout(300);
comprobar('con el obligatorio vacío no se guarda, y lo dice',
  await pagina.locator('.mensaje', { hasText: 'Hace falta rellenar "Trimestre"' }).count() > 0, true);
comprobar('el cuadro sigue en el formulario', await pagina.locator('#doc-vista').count(), 1);

await pagina.selectOption('#doc-campos-tipo [data-doc-campo="d1"]', 'Libros SL');
await pagina.fill('#doc-campos-tipo [data-doc-campo="d2"]', '2T');
await pagina.waitForTimeout(100);
comprobar('la vista previa mete los campos entre el tipo y el texto adicional',
  await pagina.locator('#doc-vista').textContent(), '260911 FACTURA Libros SL 2T Ref 9.pdf');
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
comprobar('el documento queda con su nombre nuevo', await pagina.evaluate(async (ASUNTO) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(ASUNTO);
  const n = []; for await (const p of c.entries()) n.push(p[0]); return n;
}, ASUNTO), ['260911 FACTURA Libros SL 2T Ref 9.pdf']);

/* Cambiar a un tipo sin campos los quita. */
await pagina.click('#doc-cuerpo [data-renombrar]');
await pagina.waitForSelector('#doc-vista');
await pagina.selectOption('#doc-tipo', 'SOLICITUD');
await pagina.waitForTimeout(100);
comprobar('un tipo sin campos no enseña ninguno', await pagina.locator('#doc-campos-tipo [data-doc-campo]').count(), 0);

/* El editor de Ajustes: añadir un campo, subirlo y guardarlo. */
console.log('--- el editor de Ajustes ---');
await pagina.click('#doc-volver');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => { window.__editor = DocCampos.editar('FACTURA'); });
await pagina.waitForSelector('#doccampos-lista .doccampos-fila');
comprobar('el editor trae los dos campos', await pagina.locator('#doccampos-lista .doccampos-nombre').evaluateAll(e => e.map(x => x.value)),
  ['Proveedor', 'Trimestre']);
comprobar('el de lista enseña sus valores', await pagina.inputValue('#doccampos-lista .doccampos-valores'), 'Papelería Sur, Libros SL');
await pagina.click('#doccampos-anadir');
await pagina.fill('#doccampos-lista [data-i="2"] .doccampos-nombre', 'Expediente');
await pagina.click('#doccampos-lista [data-subir="2"]');
await pagina.click('#doccampos-lista [data-quitar="0"]');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editor);
comprobar('se guarda en campos.json, en el orden nuevo', await pagina.evaluate(async () =>
  (await Campos.leer(App.E.gestor)).porTipoDocumento.FACTURA.map(c => c.nombre + (c.obligatorio ? '*' : ''))),
  ['Expediente', 'Trimestre*']);
comprobar('la tarjeta de Ajustes lo cuenta', await pagina.evaluate(() => {
  App.pintarTiposDeDocumento();
  const t = document.querySelector('#tabla-tipos-documento [data-tipo-doc="FACTURA"]');
  return t ? t.textContent.indexOf('Expediente, Trimestre *') > -1 : 'sin tarjeta';
}), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
