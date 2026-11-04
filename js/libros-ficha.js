/* ============================================================
   libros-ficha.js — la FICHA ENTREGA LIBROS de un alumno y su duplicado por
   extravío (fila 501, docs/501-FICHA-ENTREGA-LIBROS.md).

   La plantilla `plantillas/ficha-entrega-libros.docx` trae estos huecos, que
   js/tablas-datos.js (`prepararDocumento`) pide aquí con `hueco`:
     {{DATO LIBROS: TITULO}}  {{DATO LIBROS: CURSO}}  {{DATO LIBROS: COMPROMISO}}
     {{TABLA LIBROS DUPLICADO}}  {{TABLA LIBROS ALUMNO}}  {{TABLA LIBROS}}  {{TABLA LIBROS FIRMAS}}
   Los libros salen de la matrícula del alumno cruzada con el listado de su
   nivel (js/libros-hecho.js). Ningún tutor sale impreso: la tabla de firmas va
   con dos líneas en blanco.

   - El tipo FICHA ENTREGA LIBROS lleva dos campos: «Duplicado por extravío»
     (lista con «Sí») y «Fecha de la entrega original» (fecha).
   - `bloqueo`: lo que impide generar la ficha de un alumno (rojo), o ''.
   - `pasada()`: una vez, al entrar, crea el tipo con sus dos campos, su guía
     de un solo hito («Generar la ficha») y su plantilla, si el centro no lo tiene.
   ============================================================ */
var LibrosFicha = (function () {

  var TIPO = 'FICHA ENTREGA LIBROS';
  var NOMBRE_CORTO = 'FichaLibros';
  var CAMPO_DUPLICADO = 'Duplicado por extravío';
  var CAMPO_FECHA = 'Fecha de la entrega original';
  var HITO = 'Generar la ficha';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var corriendo = false;

  function norm(t) { return U.normalizar(t); }
  function gestor() { return window.Gestor && Gestor.carpetaGestor(); }

  /* ---------- sin efectos ---------- */

  /* «Marín Soto, Lucía 1234» → «Lucía Marín Soto». */
  function nombreNatural(nombre) {
    var t = String(nombre || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
    var i = t.indexOf(',');
    return i === -1 ? t : (t.slice(i + 1).trim() + ' ' + t.slice(0, i).trim()).trim();
  }

  /* «26-27» → { larga: '2026/27', guion: '2026-27' }. */
  function cursoEn(curso) {
    var m = /^(\d{2})-(\d{2})$/.exec(String(curso || ''));
    return m ? { larga: '20' + m[1] + '/' + m[2], guion: '20' + m[1] + '-' + m[2] } : { larga: String(curso || ''), guion: String(curso || '') };
  }

  /* «1º ESO» → «FICHA ENTREGA LIBROS 1º DE ESO». */
  function tituloDe(nivelTexto) {
    return ('FICHA ENTREGA LIBROS ' + String(nivelTexto || '').replace(/^(\d.)\s*/, '$1 DE ')).toUpperCase();
  }

  /* «15/09/2026» o «2026-09-15» → «15 de septiembre de 2026»; lo que no se entienda, vacío. */
  function fechaLarga(t) {
    var s = String(t || '').trim(), m;
    var d, mes, a;
    if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +m[1]; mes = +m[2]; a = m[3]; }
    else if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) { d = +m[3]; mes = +m[2]; a = m[1]; }
    else return '';
    return mes >= 1 && mes <= 12 ? d + ' de ' + MESES[mes - 1] + ' de ' + a : '';
  }

  /* El texto de compromiso, con "ha recibido" o, si es un duplicado, "recibió el …" y la frase de la original extraviada. */
  function compromiso(o) {
    var base = 'Quien firma abajo como padre, madre o tutor/a legal del alumno: ' + o.nombre + ', matriculado/a en este centro en el curso de ' +
      o.nivelTexto + ', ';
    var fin = ' TODOS los libros correspondientes a su matrícula y se compromete a devolverlos en buen estado cuando finalice el curso académico ' +
      cursoEn(o.curso).guion + '.';
    return o.duplicado
      ? base + 'recibió el ' + o.fechaOriginal + fin + ' Esta ficha sustituye a la original, extraviada.'
      : base + 'ha recibido' + fin;
  }

  /* Los dos campos del asunto: { duplicado, fecha (texto del campo) }. */
  function opcionesDe(valores) {
    var campos = (valores && valores.campos) || {}, r = { duplicado: false, fecha: '' };
    Object.keys(campos).forEach(function (k) {
      if (norm(k) === norm(CAMPO_DUPLICADO)) r.duplicado = /^s[ií]/i.test(String(campos[k] || '').trim());
      if (norm(k) === norm(CAMPO_FECHA)) r.fecha = String(campos[k] || '').trim();
    });
    return r;
  }

  function esGrupoDe(a) { return !!(window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo && AsuntoDeGrupo.esGrupo(a)); }

  /* ---------- la ficha de un alumno ---------- */

  /* { ficha (LibrosHecho.fichaDe), opciones, curso, avisos } para esa persona y esos valores del asunto. */
  async function contexto(persona, valores, esGrupo) {
    var libros = await LibrosHecho.cargar();
    var o = opcionesDe(valores);
    if (esGrupo) o = { duplicado: false, fecha: '' };   /* el duplicado es solo para un alumno: en un grupo se ignora */
    var nombre = (persona && persona.nombre) || 'El alumno';
    var ficha;
    if (!libros.hay) {
      ficha = { ok: false, libros: [], nivelTexto: '', avisos: [nombre + ': todavía no tengo el listado de libros de texto del Centro de datos. No se puede generar la ficha.'] };
    } else ficha = LibrosHecho.fichaDe(persona, libros.registros);
    var avisos = ficha.avisos.slice();
    if (o.duplicado && !fechaLarga(o.fecha)) avisos.push('Escribe la fecha de la entrega original para generar el duplicado.');
    return { ficha: ficha, opciones: o, curso: libros.curso || U.cursoActual(), persona: persona, avisos: avisos };
  }

  /* Lo que pide un hueco de la plantilla: { tabla: { cabecera, filas } } o { texto }. null si no es de aquí. */
  function hueco(h, c) {
    var t = norm(h).replace(/\s+/g, ' ');
    var p = c.persona || {};
    if (t === 'tabla libros') return { tabla: { cabecera: ['LIBROS', 'Estado de conservación'], filas: c.ficha.libros.map(function (l) { return [l, '']; }) } };
    if (t === 'tabla libros alumno') return { tabla: { cabecera: [String(p.nombre || '').replace(/\s+\S*\d\S*\s*$/, '').trim(), p.unidad ? String(p.unidad) : ''], filas: [] } };
    if (t === 'tabla libros duplicado') return c.opciones.duplicado ? { tabla: { cabecera: ['DUPLICADO POR EXTRAVÍO'], filas: [] } } : { texto: '' };
    if (t === 'tabla libros firmas') return { tabla: { cabecera: ['Padre, madre o tutor/a legal', 'DNI', 'Firma'], filas: [['', '', ''], ['', '', '']] } };
    if (t === 'dato libros: titulo') return { texto: tituloDe(c.ficha.nivelTexto) };
    if (t === 'dato libros: curso') return { texto: cursoEn(c.curso).larga };
    if (t === 'dato libros: compromiso') {
      return { texto: compromiso({ nombre: nombreNatural(p.nombre), nivelTexto: c.ficha.nivelTexto, duplicado: c.opciones.duplicado,
        fechaOriginal: fechaLarga(c.opciones.fecha), curso: c.curso }) };
    }
    return null;
  }

  /* ¿Es esta la plantilla de la ficha? */
  function esPlantilla(p) { return !!p && p.tipo === TIPO && /ficha entrega libros/i.test(p.tipoDocumento || ''); }

  /* El alumno de un asunto (o de la copia de un asunto de grupo para un relacionado: `FichaTercero` no da persona a un
     asunto de grupo, así que se busca aquí por el tercero), como lo ve el listado de alumnado, o null. */
  async function personaDeAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    var categoria = f.categoria || l.categoria || '', quien = f.tercero || l.resto || '';
    if (categoria !== 'ALUMNADO' || !quien || !window.App || !App.E || !App.E.datos) return null;
    try {
      var lista = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista;
      var e = Datos.buscar(lista, quien, 1);
      if (!e.length) e = Datos.buscar(lista, quien.replace(/[\s\d]+$/, ''), 1);
      return e[0] || null;
    } catch (x) { return null; }
  }

  /* Para el botón de un grupo: { total, generables, avisos } con los relacionados que son alumnado. */
  async function contarGrupo(a, valores) {
    var rels = ((a && a.ficha && a.ficha.relacionados) || []).filter(function (r) { return r && r.nombre && r.categoria === 'ALUMNADO'; });
    var r = { total: rels.length, generables: 0, avisos: [] };
    for (var i = 0; i < rels.length; i++) {
      var persona = await personaDeAsunto(Plantillas.asuntoParaPersona(a, rels[i]));
      var c = await contexto(persona || { nombre: rels[i].nombre }, valores, true);
      if (c.avisos.length) c.avisos.forEach(function (x) { r.avisos.push(x); }); else r.generables++;
    }
    return r;
  }

  /* En la mesa del hito: los avisos rojos de quien no puede tener ficha y el botón del grupo, «Generar para N de M».
     `caja`: el `.mesa-plantillas` ya pintado; `plantillas`: las que ofrece. Asíncrono: si la mesa se repinta, no hace nada. */
  async function alPintarMesa(caja, a, plantillas) {
    var p = (plantillas || []).filter(esPlantilla)[0];
    if (!p || !caja) return;
    var fila = caja.querySelector('.mesa-plantilla[data-id="' + String(p.id).replace(/"/g, '') + '"]');
    if (!fila) return;
    var valores = await Plantillas.valoresDeAsunto(a, { fecha: U.hoyIso(), plantilla: p, hito: null });
    var avisos = [], boton = fila.querySelector('.mesa-plantilla-cada');
    var rels = ((a && a.ficha && a.ficha.relacionados) || []).filter(function (r) { return r && r.categoria === 'ALUMNADO'; });
    var cuenta = null;
    if (rels.length) cuenta = await contarGrupo(a, valores);
    else {
      var persona = await personaDeAsunto(a);
      avisos = (await contexto(persona || { nombre: 'El alumno' }, valores, esGrupoDe(a))).avisos;
    }
    if (!fila.isConnected) return;
    if (cuenta) {
      avisos = cuenta.avisos;
      if (boton) boton.textContent = cuenta.generables < cuenta.total ? 'Generar para ' + cuenta.generables + ' de ' + cuenta.total : 'Generar para todos (' + cuenta.total + ')';
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.libros-aviso'), function (x) { x.remove(); });
    var anterior = fila;
    avisos.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'aviso aviso-rojo libros-aviso';
      d.textContent = t;
      anterior.insertAdjacentElement('afterend', d);
      anterior = d;
    });
  }

  /* ---------- el tipo, sus campos, su guía y su plantilla ---------- */

  function tipoQueHay() {
    var objetivo = norm(TIPO);
    return (App.E.tipos || []).filter(function (t) { return norm(t.tipo) === objetivo; })[0] || null;
  }

  async function asegurarCampos() {
    await Campos.guardarPropios(App.E.gestor, function (lista) {
      [['p-libros-dup', CAMPO_DUPLICADO, 'lista', ['Sí']], ['p-libros-fecha', CAMPO_FECHA, 'fecha', []]].forEach(function (c) {
        if (!lista.some(function (x) { return x.id === c[0]; })) lista.push({ id: c[0], nombre: c[1], clase: c[2], valores: c[3] });
      });
      return lista;
    });
    await Campos.guardarConfigDeTipo(App.E.gestor, TIPO, [
      { origen: 'propio', id: 'p-libros-dup', obligatorio: false, enNombre: false },
      { origen: 'propio', id: 'p-libros-fecha', obligatorio: false, enNombre: false }]);
    App.E.campos = await Campos.leer(App.E.gestor);
  }

  async function asegurarGuia() {
    await GuiasDelCentro.guardarPasos(TIPO, Guias.normalizar([
      { titulo: HITO, cuerpo: '<p>Con la plantilla del tipo: la ficha lleva los libros de la matrícula de cada alumno. Para un duplicado por extravío, marca «' +
        CAMPO_DUPLICADO + '» y escribe «' + CAMPO_FECHA + '».</p>', responsable: 'yo' }]));
  }

  async function asegurarPlantilla() {
    var indice = await App.leerFicheroDeLaApp('plantillas/indice.json', 'json');
    var e = (indice || []).filter(function (x) { return x.tipo === TIPO && x.clase === 'documento'; })[0];
    if (!e) return false;
    var actual = await Plantillas.cargar(App.E.gestor);
    if ((actual.documentos || []).some(function (p) { return p.tipo === TIPO && p.nombre === e.nombre; })) return true;
    var bytes = await App.leerFicheroDeLaApp('plantillas/' + e.fichero, 'binario');
    var carpeta = await Carpetas.crear(App.E.gestor, 'PLANTILLAS');
    await Carpetas.escribirBytes(carpeta, e.fichero, bytes);
    await Plantillas.guardar(App.E.gestor, function (a) {
      a.documentos = (a.documentos || []).concat([{
        id: Plantillas.idNuevoDocumento(), tipo: e.tipo, categoria: e.categoria, nombre: e.nombre, fichero: e.fichero,
        tipoDocumento: e.tipoDocumento, texto: e.texto || '', firmante: e.firmante || '', vistoBueno: e.vistoBueno || '',
        conLogoCentro: false
      }]);
      return a;
    });
    return true;
  }

  /* Crea el tipo con sus campos, su guía y su plantilla (sin mirar si ya está). */
  async function crear() {
    var tipo = await App.crearTipo({ nombre: TIPO, categoria: 'ALUMNADO', nombreCorto: NOMBRE_CORTO });
    await asegurarCampos();
    await asegurarGuia();
    await asegurarPlantilla();
    return tipo;
  }

  /* Si el centro no tiene el tipo, lo crea con sus campos, su guía y su plantilla. Si ya lo tiene, no toca nada. */
  async function pasada() {
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!gestor() || !App.E || !App.E.tipos) return null;
    corriendo = true;
    try {
      if (tipoQueHay()) return null;
      return await crear();
    } finally {
      corriendo = false;
    }
  }

  var yaMirado = false;
  function alRefrescar() {
    if (yaMirado || !gestor() || !window.App || !App.E || !App.E.tipos || !App.E.tipos.length) return;
    if (window.Demo && (Demo.montando || !/[?&]libros=1/.test(location.search))) return;   /* en la copia de pruebas, solo con ?libros=1 */
    yaMirado = true;
    setTimeout(function () {
      pasada().catch(function (e) { U.accesorio('No he podido preparar el tipo de asunto de la ficha de entrega de libros', e); });
    }, 7000);
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  return {
    TIPO: TIPO, CAMPO_DUPLICADO: CAMPO_DUPLICADO, CAMPO_FECHA: CAMPO_FECHA, HITO: HITO,
    nombreNatural: nombreNatural, cursoEn: cursoEn, tituloDe: tituloDe, fechaLarga: fechaLarga, compromiso: compromiso, opcionesDe: opcionesDe,
    contexto: contexto, esGrupoDe: esGrupoDe, hueco: hueco, esPlantilla: esPlantilla, personaDeAsunto: personaDeAsunto, contarGrupo: contarGrupo, alPintarMesa: alPintarMesa,
    crear: crear, pasada: pasada, asegurarCampos: asegurarCampos, asegurarGuia: asegurarGuia, asegurarPlantilla: asegurarPlantilla, tipoQueHay: tipoQueHay
  };
})();
window.LibrosFicha = LibrosFicha;
