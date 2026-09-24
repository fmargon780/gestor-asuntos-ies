/* Prueba de js/formularios-rellenar.js (20-sep-2026, fila 84,
   docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md), sin navegador, con
   `vm`, como pruebas/separar-unir.mjs: se monta un PDF con formulario
   a mano con la propia pdf-lib (no hace falta un PDF de verdad), y se
   comprueba `proponerMapa` y `rellenarPdf` dentro del mismo contexto
   (los objetos de pdf-lib no cruzan bien entre "realms" distintos). */
import fs from 'node:fs';
import vm from 'node:vm';

/* Un `document` y un `App` de mentira, mínimos: solo para que cargar
   el fichero no reviente al enganchar App.abrirFicha y el bloque de
   Ajustes (nada de esto se ejecuta de verdad en esta prueba). Mismo
   patrón que pruebas/formularios.mjs. */
const documentoFalso = {
  readyState: 'complete',
  addEventListener: function () {},
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  getElementById: function () { return null; },
  createElement: function () { return { classList: { add: function () {} } }; }
};
const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console, document: documentoFalso, App: { E: {}, PANTALLAS: [] } };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(raiz + 'util.js', 'utf8'), ctx, { filename: 'util.js' });
for (const f of ['util-parecidos.js', 'util-pantalla.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), ctx, { filename: f });
vm.runInContext(fs.readFileSync(raiz + 'lib/pdf-lib.min.js', 'utf8'), ctx, { filename: 'pdf-lib.min.js' });
vm.runInContext(fs.readFileSync(raiz + 'pdf-herramientas.js', 'utf8'), ctx, { filename: 'pdf-herramientas.js' });
vm.runInContext(fs.readFileSync(raiz + 'formularios-rellenar.js', 'utf8'), ctx, { filename: 'formularios-rellenar.js' });
const { FormulariosRellenar } = ctx;

function ejecutar(cuerpoAsync) {
  return vm.runInContext('(async () => {\n' + cuerpoAsync + '\n})()', ctx);
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, cond, detalle) {
  if (!cond) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

/* ============================================================
   1. proponerMapa: las siete reglas, y una casilla sin regla
   ============================================================ */
console.log('--- 1. proponerMapa ---');
{
  const nombres = [
    'codigo_centro', 'nombre_del_centro', 'domicilio_centro', 'localidad',
    'provincia', 'curso_escolar', 'fecha_solicitud', 'apellidos'
  ];
  const mapa = await ejecutar('return FormulariosRellenar.proponerMapa(' + JSON.stringify(nombres) + ');');
  comprobar('codigo_centro -> {{CODIGO CENTRO}}', mapa.codigo_centro, '{{CODIGO CENTRO}}');
  comprobar('nombre_del_centro -> {{CENTRO}}', mapa.nombre_del_centro, '{{CENTRO}}');
  comprobar('domicilio_centro -> {{DIRECCION CENTRO}} (no {{CENTRO}})', mapa.domicilio_centro, '{{DIRECCION CENTRO}}');
  comprobar('localidad -> {{LOCALIDAD}}', mapa.localidad, '{{LOCALIDAD}}');
  comprobar('provincia -> {{PROVINCIA}}', mapa.provincia, '{{PROVINCIA}}');
  comprobar('curso_escolar -> {{CURSO}}', mapa.curso_escolar, '{{CURSO}}');
  comprobar('fecha_solicitud -> {{HOY}}', mapa.fecha_solicitud, '{{HOY}}');
  comprobarQue('apellidos: sin regla, no se propone nada', !('apellidos' in mapa), JSON.stringify(mapa));
  comprobar('ninguna casilla de más', Object.keys(mapa).length, 7);
}

console.log('--- 1b. variantes con tildes y "año académico" ---');
{
  const mapa = await ejecutar('return FormulariosRellenar.proponerMapa(["Código", "Municipio", "Año Académico"]);');
  comprobar('Código -> {{CODIGO CENTRO}}', mapa['Código'], '{{CODIGO CENTRO}}');
  comprobar('Municipio -> {{LOCALIDAD}}', mapa['Municipio'], '{{LOCALIDAD}}');
  comprobar('Año Académico -> {{CURSO}}', mapa['Año Académico'], '{{CURSO}}');
}

/* ============================================================
   2-4. rellenarPdf: monta un PDF con 4 casillas (dos en el mapa, dos
   no), rellena, y comprueba que solo cambian las del mapa y que esas
   quedan en solo lectura.
   ============================================================ */
console.log('--- 2-4. rellenarPdf ---');
{
  const resultado = await ejecutar(
    'var doc = await PDFLib.PDFDocument.create();\n' +
    'var pagina = doc.addPage([300, 300]);\n' +
    'var form = doc.getForm();\n' +
    '["nombre_centro", "codigo_centro", "domicilio_alumno", "telefono_alumno"].forEach(function (n) {\n' +
    '  var campo = form.createTextField(n);\n' +
    '  campo.addToPage(pagina, { x: 10, y: 10, width: 100, height: 20 });\n' +
    '});\n' +
    'var bytesPdf = await doc.save();\n' +
    'var mapa = { nombre_centro: "{{CENTRO}}", codigo_centro: "{{CODIGO CENTRO}}" };\n' +
    'var valores = { "{{CENTRO}}": "IES Fuente Lucena", "{{CODIGO CENTRO}}": "29700123" };\n' +
    'var r = await FormulariosRellenar.rellenarPdf(bytesPdf, mapa, valores);\n' +
    'var docFinal = await PDFLib.PDFDocument.load(r.bytes);\n' +
    'var formFinal = docFinal.getForm();\n' +
    'return {\n' +
    '  rellenable: r.rellenable,\n' +
    '  rellenas: r.rellenas.slice().sort(),\n' +
    '  centro: formFinal.getTextField("nombre_centro").getText(),\n' +
    '  codigo: formFinal.getTextField("codigo_centro").getText(),\n' +
    '  domicilio: formFinal.getTextField("domicilio_alumno").getText() || "",\n' +
    '  telefono: formFinal.getTextField("telefono_alumno").getText() || "",\n' +
    '  centroSoloLectura: formFinal.getTextField("nombre_centro").isReadOnly(),\n' +
    '  domicilioEditable: !formFinal.getTextField("domicilio_alumno").isReadOnly()\n' +
    '};'
  );
  comprobar('2. es rellenable', resultado.rellenable, true);
  comprobar('2. solo se rellenan las dos casillas del mapa', resultado.rellenas, ['codigo_centro', 'nombre_centro']);
  comprobar('3. el centro queda relleno', resultado.centro, 'IES Fuente Lucena');
  comprobar('3. el código queda relleno', resultado.codigo, '29700123');
  comprobarQue('3. las casillas de la persona NO se tocan (domicilio vacío)', resultado.domicilio === '', resultado.domicilio);
  comprobarQue('3. las casillas de la persona NO se tocan (teléfono vacío)', resultado.telefono === '', resultado.telefono);
  comprobar('4. la casilla rellenada queda en solo lectura', resultado.centroSoloLectura, true);
  comprobar('4. las demás casillas siguen escribiéndose', resultado.domicilioEditable, true);
}

/* ============================================================
   5. Un PDF sin formulario no rompe nada
   ============================================================ */
console.log('--- 5. un PDF sin formulario ---');
{
  const resultado = await ejecutar(
    'var doc = await PDFLib.PDFDocument.create();\n' +
    'doc.addPage([300, 300]);\n' +
    'var bytesPdf = await doc.save();\n' +
    'var r = await FormulariosRellenar.rellenarPdf(bytesPdf, { algo: "{{CENTRO}}" }, { "{{CENTRO}}": "IES" });\n' +
    'return { rellenable: r.rellenable, rellenas: r.rellenas, mismoTamano: r.bytes.length === bytesPdf.length };'
  );
  comprobar('5. no es rellenable', resultado.rellenable, false);
  comprobar('5. no rellena nada', resultado.rellenas, []);
  comprobarQue('5. no falla, devuelve los mismos bytes', resultado.mismoTamano, JSON.stringify(resultado));
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
