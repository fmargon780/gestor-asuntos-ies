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
vm.runInContext(fs.readFileSync(raiz + 'formularios-casillas.js', 'utf8'), ctx, { filename: 'formularios-casillas.js' });
vm.runInContext(fs.readFileSync(raiz + 'formularios-rellenar.js', 'utf8'), ctx, { filename: 'formularios-rellenar.js' });
const { FormulariosRellenar, FormulariosCasillas } = ctx;

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

/* ============================================================
   6-10. Fila 146 (docs/IMPRESOS-CASILLAS-LEGIBLES.md): nombres que se
   entienden, de quién es cada casilla, las repetidas y la parte XFA.
   Los nombres son los del Anexo III de verdad (formularios/O-III.pdf).
   ============================================================ */
console.log('--- 6. nombreLegible ---');
{
  const P = 'form1[0].#pageSet[0].';
  const casos = [
    [P + 'Página_2[0].CABECERA[0].datos[0].apellido1encab[0]', 'Página 2 · Primer apellido'],
    [P + 'Página_2[0].CABECERA[0].datos[0].apellido2enca[0]', 'Página 2 · Segundo apellido'],
    [P + 'Página_2[0].CABECERA[0].datos[0].nombreenc[0]', 'Página 2 · Nombre'],
    [P + 'Página_2[0].Numero_inscripcion[0]', 'Página 2 · Número inscripción'],
    [P + 'Página_1[0].Barras[0]', 'Página 1 · Barras'],
    [P + 'Page3[1].Numero_inscripcion[0]', 'Página 3 · Número inscripción'],
    ['form1[0].ANEXO[0].APARTADO_1[0].CUERPO[0].SOLICITANTE[0].LINEA[0].DNI-NIE-NIF[0]', 'DNI NIE NIF']
  ];
  casos.forEach(([nombre, esperado]) =>
    comprobar(nombre.replace(P, '…'), FormulariosCasillas.textoConPagina(FormulariosCasillas.nombreLegible(nombre)), esperado));
}

console.log('--- 7. clasificarCasilla ---');
{
  const casos = [
    ['form1[0].#pageSet[0].Página_2[0].CABECERA[0].datos[0].apellido1encab[0]', 'persona'],
    ['fecha_nacimiento', 'persona'],
    ['nombre_centro', 'centro'],
    ['codigo_centro', 'centro'],
    ['fecha', 'centro'],
    ['form1[0].#pageSet[0].Página_1[0].Barras[0]', 'otra'],
    ['form1[0].ANEXO[0].APARTADO_1[0].CUERPO[0].SOLICITANTE[0].LINEA[0].DOMICILIO[0].UNIDAD[0].FECHA_NAC[0]', 'persona'],
    ['form1[0].ANEXO[0].APARTADO_3[0].CUERPO[0].SOLICITANTE[0].LINEA[0].CENTROACTUAL[0]', 'persona']
  ];
  casos.forEach(([nombre, esperado]) => comprobar(nombre + ' -> ' + esperado, FormulariosCasillas.clasificarCasilla(nombre, {}), esperado));
  comprobar('una casilla con hueco guardado es del centro', FormulariosCasillas.clasificarCasilla('apellidos', { apellidos: '{{CENTRO}}' }), 'centro');
}

console.log('--- 8. proponerMapa ya no propone nada para la persona ---');
{
  const mapa = await ejecutar('return FormulariosRellenar.proponerMapa(["fecha_nacimiento", "domicilio", "domicilio_centro", "fecha"]);');
  comprobar('fecha_nacimiento, domicilio: nada; domicilio_centro y fecha, sí', mapa, { domicilio_centro: '{{DIRECCION CENTRO}}', fecha: '{{HOY}}' });
}

console.log('--- 9. las repetidas, en una sola fila ---');
{
  const g = FormulariosCasillas.agrupar([
    'form1[0].#pageSet[0].Página_2[0].CABECERA[0].datos[0].apellido1encab[0]',
    'form1[0].#pageSet[0].Página_2[1].CABECERA[0].datos[0].apellido1encab[0]',
    'form1[0].#pageSet[0].Página_3[0].CABECERA[0].datos[0].apellido1encab[0]',
    'form1[0].#pageSet[0].Página_1[0].Barras[0]'
  ]);
  comprobar('dos filas, la primera con las tres', g.map((x) => [x.etiqueta, x.nombres.length]),
    [['Primer apellido (en 3 páginas)', 3], ['Página 1 · Barras', 1]]);
}

console.log('--- 10. sin la parte XFA ---');
{
  const r = await ejecutar(
    'var doc = await PDFLib.PDFDocument.create();\n' +
    'var pagina = doc.addPage([300, 300]);\n' +
    'var form = doc.getForm();\n' +
    '["nombre_centro", "apellido1"].forEach(function (n) { form.createTextField(n).addToPage(pagina, { x: 10, y: 10, width: 100, height: 20 }); });\n' +
    'form.acroForm.dict.set(PDFLib.PDFName.of("XFA"), PDFLib.PDFString.of("xfa de mentira"));\n' +
    'var bytesPdf = await doc.save({ updateFieldAppearances: false });\n' +
    'var r = await FormulariosRellenar.rellenarPdf(bytesPdf, { nombre_centro: "{{CENTRO}}" }, { "{{CENTRO}}": "IES Inventado" });\n' +
    'var fin = await PDFLib.PDFDocument.load(r.bytes);\n' +
    'return { xfa: fin.catalog.lookup(PDFLib.PDFName.of("AcroForm")).has(PDFLib.PDFName.of("XFA")),\n' +
    '  centro: fin.getForm().getTextField("nombre_centro").getText(),\n' +
    '  apellidoEditable: !fin.getForm().getTextField("apellido1").isReadOnly(), casillas: fin.getForm().getFields().length };'
  );
  comprobar('tras rellenar no queda /XFA, y la de la persona sigue escribiéndose', r,
    { xfa: false, centro: 'IES Inventado', apellidoEditable: true, casillas: 2 });
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
