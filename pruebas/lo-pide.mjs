/* Prueba de lógica (jsdom, sin navegador de verdad) de "Lo pide"
   (docs/LO-PIDE.md, 17-sep-2026, fila 28 de docs/COLA.md).

   Mismo patrón que pruebas/plantillas-documento.mjs: se cargan los
   ficheros de verdad en una página jsdom y se llama a sus funciones
   públicas, sin Playwright ni Chromium.

   js/correo.js y js/ficha-asunto.js no exponen nada hacia fuera (son
   IIFE sin `window.Correo`/`window.FichaAsunto`): por eso, para poder
   probar sin navegador lo que pasa en el cuadro de Correo, la decisión
   de qué casilla se marca vive, pura, en `LoPide.elegirDestinatarios`
   (docs/LO-PIDE.md, 6), y js/correo.js solo la llama. Lo mismo con el
   rastro de App.anotar del escenario 7: se comprueba el mismo mecanismo
   que usa js/nucleo.js (Object.assign(antes, datos)), sin cargar todo
   `App`.

   Esta prueba falla sin el arreglo: antes del 17-sep-2026 no existía
   `js/lo-pide.js`, así que `win.LoPide` sale `undefined` y la primera
   llamada revienta con "LoPide is not defined" o "Cannot read
   properties of undefined".

   Los siete escenarios (docs/LO-PIDE.md, 10):
     1. Un asunto sin loPide: LoPide.texto/correoDe vacíos, y
        elegirDestinatarios se comporta como antes (todas marcadas).
     2. Crear un asunto con "Tutor legal 1" guarda loPide con su
        nombre y su correo (vía LoPide.opciones/controles, que es lo
        que monta js/asuntos-nuevo.js en el grupo "Lo pide").
     3. LoPide.texto monta la línea legible.
     4. Con solicitante conocido, elegirDestinatarios marca solo su
        casilla.
     5. Con un solicitante escrito a mano sin correo en la lista, va a
        "Otro correo" y ninguna casilla se marca.
     6. Los cuatro huecos nuevos, con y sin dato ("Faltan datos").
     7. "Quitar el dato" deja loPide a null, no a undefined. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));
const HOY_ISO = new Date().toISOString().slice(0, 10);   /* AAAA-MM-DD de hoy, nunca a mano */

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

/* ============================================================
   Montar la página: jsdom con document, y App mínimo (solo lo que
   lee LoPide.controles/Plantillas.valoresDeAsunto: App.E.usuario, sin
   datos ni gestor, para no tener que montar Carpetas/Datos).
   ============================================================ */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.App = { E: { usuario: 'Francisco' } };

for (const f of ['util.js', 'nombres.js', 'lo-pide.js', 'plantillas.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { LoPide, Plantillas } = win;

comprobarQue('el módulo LoPide existe (si esto falla, falta js/lo-pide.js)', typeof LoPide === 'object');

/* ============================================================
   1. Un asunto sin `loPide` se pinta igual que antes: ni fila
   (LoPide.texto vacío), ni marca, ni línea en el correo
   (LoPide.correoDe vacío), y elegirDestinatarios se comporta como
   siempre (todas las casillas marcadas de partida).
   ============================================================ */
{
  const fichaSinDato = { tipo: 'CERTIFICADO' };
  comprobar('1. LoPide.texto vacío sin dato', LoPide.texto(fichaSinDato), '');
  comprobar('1. LoPide.correoDe vacío sin dato', LoPide.correoDe(fichaSinDato), '');

  const correos = [{ dir: 'ana@ejemplo.es', titulo: 'Correo' }];
  const r = LoPide.elegirDestinatarios(correos, '', {});
  comprobar('1. sin dato, se marcan todas como antes', r.elegidos, { 'ana@ejemplo.es': true });
  comprobar('1. sin dato, "Otro correo" se queda vacío', r.otro, '');
}

/* ============================================================
   2. Crear un asunto con "Tutor legal 1": LoPide.opciones lo ofrece
   (reutilizando datosDeTutor, sacada de js/plantillas.js) y
   LoPide.controles, con esa opción elegida, guarda su nombre y su
   correo. Es exactamente lo que monta el grupo "Lo pide (opcional)"
   de js/asuntos-nuevo.js.
   ============================================================ */
{
  const personaAlumna = {
    nombre: 'Pérez López, Ana', categoria: 'ALUMNADO', id: '1234567',
    campos: {
      'Tutor/a legal 1': 'López García, María',
      'Teléfono tutor legal 1': '600111222',
      'Correo tutor legal 1': 'maria@ejemplo.es'
    }
  };

  const opciones = LoPide.opciones(personaAlumna);
  const tutor1 = opciones.filter((o) => o.valor === 'tutor1')[0];
  comprobarQue('2. LoPide.opciones ofrece "Tutor legal 1"', !!tutor1, JSON.stringify(opciones));
  comprobar('2. con el nombre del tutor en el texto', tutor1 && tutor1.texto, 'Tutor legal 1 · López García, María');
  comprobarQue('2. no ofrece "Tutor legal 2" (sin nombre en los datos)',
    !opciones.some((o) => o.valor === 'tutor2'));

  const caja = win.document.createElement('div');
  const ctrl = LoPide.controles(caja, personaAlumna, null);
  caja.querySelector('.lopide-quien').value = 'tutor1';
  caja.querySelector('.lopide-via').value = 'TELEFONO';
  caja.querySelector('.lopide-fecha').value = '2026-09-10';
  const datos = ctrl.leer();

  comprobar('2. guarda el nombre del tutor', datos && datos.nombre, 'López García, María');
  comprobar('2. guarda su correo', datos && datos.correo, 'maria@ejemplo.es');
  comprobar('2. guarda la relación', datos && datos.relacion, 'Tutor legal 1');
  comprobar('2. guarda la vía elegida', datos && datos.via, 'TELEFONO');
  comprobar('2. guarda quien lo apuntó', datos && datos.apuntadoPor, 'Francisco');

  /* Dejarlo en blanco (opción "— sin apuntar —") es válido: no hay
     nombre que guardar, así que App.datosDelFormulario no añade
     `loPide` (docs/LO-PIDE.md, 3). */
  caja.querySelector('.lopide-quien').value = '';
  comprobar('2. en blanco, leer() devuelve null', ctrl.leer(), null);
}

/* ============================================================
   3. LoPide.texto monta la línea legible: nombre, relación, vía y
   fecha, contados desde hoy (nunca a mano).
   ============================================================ */
{
  const ficha = {
    loPide: {
      nombre: 'María López', categoria: 'ALUMNADO', relacion: 'Tutor legal 1',
      correo: '', telefono: '', via: 'TELEFONO', fecha: HOY_ISO, apuntadoPor: 'Francisco'
    }
  };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const [ano, mes, dia] = HOY_ISO.split('-');
  const fechaCorta = String(parseInt(dia, 10)) + '-' + MESES[parseInt(mes, 10) - 1] + '-' + ano;

  comprobar('3. la línea legible completa', LoPide.texto(ficha),
    'María López (Tutor legal 1) · por teléfono · ' + fechaCorta);

  comprobar('3. sin vía ni fecha, solo el nombre y la relación',
    LoPide.texto({ loPide: { nombre: 'Juan', relacion: 'El propio interesado' } }),
    'Juan (El propio interesado)');
}

/* ============================================================
   4 y 5. En el cuadro de Correo: con el correo de quien lo pide en la
   lista, se marca ella sola; si no está, ninguna casilla se marca y
   la dirección va a "Otro correo".
   ============================================================ */
{
  const correos = [
    { dir: 'ana@ejemplo.es', titulo: 'Correo' },
    { dir: 'maria@ejemplo.es', titulo: 'Correo tutor 1' }
  ];

  const r4 = LoPide.elegirDestinatarios(correos, 'maria@ejemplo.es', {});
  comprobar('4. solo la casilla de quien lo pide queda marcada',
    r4.elegidos, { 'ana@ejemplo.es': false, 'maria@ejemplo.es': true });
  comprobar('4. "Otro correo" se queda vacío cuando ya está en la lista', r4.otro, '');

  const r5 = LoPide.elegirDestinatarios(correos, 'otro@fuera.es', {});
  comprobar('5. ninguna casilla queda marcada', r5.elegidos, { 'ana@ejemplo.es': false, 'maria@ejemplo.es': false });
  comprobar('5. la dirección de fuera va a "Otro correo"', r5.otro, 'otro@fuera.es');
}

/* ============================================================
   6. Los cuatro huecos nuevos de js/plantillas.js: rellenos con el
   dato, y vacíos (en "Faltan datos") sin él.
   ============================================================ */
{
  const asuntoConDato = {
    ficha: {
      tercero: 'Pérez López, Ana 1234567', categoria: 'ALUMNADO', tipo: 'CERTIFICADO',
      loPide: {
        nombre: 'María López García', categoria: 'ALUMNADO', relacion: 'Tutor legal 1',
        correo: 'maria@ejemplo.es', telefono: '', via: 'TELEFONO', fecha: '2026-09-15', apuntadoPor: 'Francisco'
      }
    },
    leido: { tipo: 'CERTIFICADO', categoria: 'ALUMNADO', resto: 'Pérez López, Ana 1234567' }
  };
  const valores = await Plantillas.valoresDeAsunto(asuntoConDato);
  comprobar('6. {quienlopide}', valores.quienlopide, 'María López García');
  comprobar('6. {quienlopiderelacion}', valores.quienlopiderelacion, 'Tutor legal 1');
  comprobar('6. {quienlopidevia}', valores.quienlopidevia, 'Teléfono');
  comprobar('6. {quienlopidefecha}', valores.quienlopidefecha, '15/09/2026');

  const asuntoSinDato = {
    ficha: { tercero: 'Suministros SL', categoria: 'EMPRESAS', tipo: 'COMPRA' },
    leido: { tipo: 'COMPRA', categoria: 'EMPRESAS', resto: 'Suministros SL' }
  };
  const valoresSinDato = await Plantillas.valoresDeAsunto(asuntoSinDato);
  comprobar('6. sin loPide, {quienlopide} vacío', valoresSinDato.quienlopide, '');

  const plantilla = '{quienlopide} / {quienlopiderelacion} / {quienlopidevia} / {quienlopidefecha}';
  const r = Plantillas.rellenar(plantilla, valoresSinDato);
  comprobar('6. la plantilla sale con los cuatro huecos vacíos', r.texto, ' /  /  / ');
  ['Quien lo pide', 'Quien lo pide: qué es del interesado',
   'Quien lo pide: por dónde lo pidió', 'Quien lo pide: fecha'].forEach((etiqueta) => {
    comprobarQue('6. "' + etiqueta + '" sale en Faltan datos', r.faltan.includes(etiqueta), JSON.stringify(r.faltan));
  });
}

/* ============================================================
   7. "Quitar el dato" (botón de js/ficha-asunto.js) guarda
   `App.anotar(a.nombre, { loPide: null })`: se prueba el mismo
   mecanismo de App.anotar (js/nucleo.js), Object.assign(antes,
   datos), sobre una ficha que ya traía el dato.
   ============================================================ */
{
  const antes = { tipo: 'CERTIFICADO', loPide: { nombre: 'María López', relacion: 'Tutor legal 1' } };
  const despues = Object.assign(antes, { loPide: null });
  comprobar('7. loPide queda a null', despues.loPide, null);
  comprobarQue('7. la clave existe, no es undefined', 'loPide' in despues && despues.loPide !== undefined);
  comprobar('7. LoPide.texto ya no enseña nada', LoPide.texto(despues), '');
  comprobar('7. LoPide.correoDe ya no enseña nada', LoPide.correoDe(despues), '');
}

/* ============================================================
   8. El nombre del tutor, no un número (17-sep-2026, fila 38,
   docs/LO-PIDE-NOMBRE-DEL-TUTOR.md): con documento, teléfono y correo
   del tutor 1 a la vez, la columna del nombre gana, no la del número.
   ============================================================ */
{
  const conDocumento = {
    campos: {
      'Nº identificación tutor 1': '12345678', 'Nombre tutor 1': 'María López Ruiz',
      'Teléfono tutor 1': '600111222', 'Correo tutor 1': 'm@x.es'
    }
  };
  comprobar('8. el nombre gana al número de identificación',
    LoPide.datosDeTutor(conDocumento.campos, 1).nombre, 'María López Ruiz');
}

/* ---------- 8b. Apellidos y nombre en columnas distintas ---------- */
{
  const separado = { campos: { 'Apellidos tutor 1': 'López Ruiz', 'Nombre tutor 1': 'María' } };
  comprobar('8b. apellidos y nombre se juntan con una coma',
    LoPide.datosDeTutor(separado.campos, 1).nombre, 'López Ruiz, María');
}

/* ---------- 8c. Solo la columna del número: nombre vacío ---------- */
{
  const soloNumero = { campos: { 'DNI tutor 1': '12345678A' } };
  comprobar('8c. solo el número, nombre vacío',
    LoPide.datosDeTutor(soloNumero.campos, 1).nombre, '');
}

/* ---------- 8d. Ninguna columna del tutor 2: los tres campos vacíos, y la opción no aparece ---------- */
{
  const soloTutor1 = {
    nombre: 'Ruiz Soto, Iker', categoria: 'ALUMNADO',
    campos: { 'Nombre tutor 1': 'Ana Ruiz' }
  };
  const t2 = LoPide.datosDeTutor(soloTutor1.campos, 2);
  comprobar('8d. sin columnas del tutor 2, los tres campos vacíos',
    t2, { nombre: '', telefono: '', correo: '' });
  comprobarQue('8d. la opción "Tutor legal 2" no aparece',
    !LoPide.opciones(soloTutor1).some((o) => o.valor === 'tutor2'));
}

/* ---------- 8e. {tutor1} de js/plantillas.js sigue funcionando y ahora trae el nombre ---------- */
{
  comprobar('8e. plantillas: {tutor1} usa datosDeTutor, con el nombre',
    LoPide.datosDeTutor({ 'Tutor 1 - Nombre': 'Carlos Vidal', 'Tutor 1 - DNI': '11112222B' }, 1).nombre,
    'Carlos Vidal');
}

/* ---------- 8f. sin nombre pero con teléfono: la opción se ofrece igual, a secas ---------- */
{
  const soloTelefono = {
    nombre: 'Soto Cano, Nora', categoria: 'ALUMNADO',
    campos: { 'DNI tutor 1': '12345678A', 'Teléfono tutor 1': '600999888' }
  };
  const opcionesSoloTelefono = LoPide.opciones(soloTelefono);
  const tutor1SinNombre = opcionesSoloTelefono.filter((o) => o.valor === 'tutor1')[0];
  comprobarQue('8f. la opción se ofrece aunque no haya nombre', !!tutor1SinNombre);
  comprobar('8f. el texto es "Tutor legal 1" a secas', tutor1SinNombre && tutor1SinNombre.texto, 'Tutor legal 1');
  comprobar('8f. el teléfono se guarda igual', tutor1SinNombre && tutor1SinNombre.datos.telefono, '600999888');
  comprobar('8f. la relación se queda vacía', tutor1SinNombre && tutor1SinNombre.datos.relacion, '');
  comprobar('8f. el nombre guardado es "Tutor legal 1"', tutor1SinNombre && tutor1SinNombre.datos.nombre, 'Tutor legal 1');
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
