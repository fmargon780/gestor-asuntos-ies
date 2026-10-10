/* ============================================================
   actividades-tabla.js — la tabla de datos ACTIVIDADES EXTRAESCOLARES y el
   certificado del profesorado (10-oct-2026, fila 311,
   docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md).

   Una tabla más de js/tablas-datos.js, pero no sale de ningún fichero de
   `datos/`: sale del registro de actividades (`_GESTOR/actividades.json`,
   js/actividades.js), una fila por profesor y actividad, solo de las que
   cuentan (`Actividades.cuenta`: realizada, no anulada, no en la papelera).
   La fila se une a la persona por su DNI (los dígitos) y, si la actividad
   antigua no lo trae, por el nombre.

       { clave, claveNombre, nombre, inicio, fin, actividad, lugar,
         departamento, papel, horas, orden, soloNombre }

   - `comoTabla(salida)`: la mete en la tabla de tablas (se vuelve a leer cada vez).
   - Los huecos {{TABLA ACTIVIDADES EXTRAESCOLARES}} y {{ACTIVIDADES PERIODO}}
     (js/tablas-datos.js los resuelve con `preparar`, `columnasPara`, `celdas` y
     `periodoDe`); «Actividades desde» y «Actividades hasta» son campos del asunto.
   - `pasada()`: una vez, al entrar, crea el tipo CERTIFICADO ACTIVIDADES
     EXTRAESCOLARES con sus dos campos y su plantilla si el centro no lo tiene.
   ============================================================ */
var ActividadesTabla = (function () {

  var NOMBRE = 'ACTIVIDADES EXTRAESCOLARES';
  var TIPO = 'CERTIFICADO ACTIVIDADES EXTRAESCOLARES';
  var NOMBRE_CORTO = 'CertActExtra';
  var COLUMNAS = ['Fecha', 'Actividad', 'Lugar', 'Participación'];
  var CAMPO_DESDE = 'Actividades desde', CAMPO_HASTA = 'Actividades hasta';
  var AVISO_SOLO_NOMBRE = 'Hay actividades antiguas apuntadas solo por el nombre';
  var corriendo = false;

  function norm(t) { return U.normalizar(String(t || '')); }
  function fechaLegible(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  function gestor() { return window.Gestor && Gestor.carpetaGestor(); }

  /* ---------- sin efectos ---------- */

  /* El nombre sin el trozo del documento que añade el texto del tercero («Otero Campos, Marta 344A»). */
  function nombreLimpio(n) { return String(n || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  /* Los dígitos del documento, si la clave de la actividad lo es (si no, es el nombre normalizado). */
  function claveDeDocumento(c) { return /^\d+$/.test(String(c || '')) ? String(c) : ''; }

  /* PURA. Una fila por profesor y actividad que cuenta; quien figura dos veces en la misma, una sola (manda «organiza»). */
  function filasDe(actividades, hoyIso) {
    var filas = [];
    (actividades || []).forEach(function (a) {
      if (!Actividades.cuenta(a, hoyIso)) return;
      var vistos = {};
      (a.profesorado || []).forEach(function (p) {
        var clave = claveDeDocumento(p.clave);
        var hueso = window.TablasDatosConsejo ? TablasDatosConsejo.claveNombre(nombreLimpio(p.nombre)) : norm(nombreLimpio(p.nombre));
        var k = clave || 'n:' + hueso;
        if (vistos[k]) { if (p.papel === 'organiza') vistos[k].papel = 'organiza'; return; }
        vistos[k] = {
          clave: clave, claveNombre: clave ? '' : hueso, nombre: p.nombre, inicio: a.inicio, fin: a.fin || a.inicio,
          actividad: a.nombre, lugar: a.lugar, departamento: a.departamento, papel: p.papel === 'organiza' ? 'organiza' : 'acompana',
          horas: a.horas, orden: a.inicio, soloNombre: !clave
        };
        filas.push(vistos[k]);
      });
    });
    return filas;
  }

  /* PURA. Solo las que empiezan entre las dos fechas (AAAA-MM-DD), las dos incluidas; vacías, todas. */
  function entre(filas, desdeIso, hastaIso) {
    return (filas || []).filter(function (f) {
      if (desdeIso && String(f.inicio) < desdeIso) return false;
      if (hastaIso && String(f.inicio) > hastaIso) return false;
      return true;
    });
  }

  /* «15/10/2026» o «15/10/2026 a 17/10/2026». */
  function fechaDeFila(f) {
    var i = fechaLegible(f.inicio);
    return f.fin && f.fin !== f.inicio ? i + ' a ' + fechaLegible(f.fin) : i;
  }

  function horasEspanolas(h) { return h === null || h === undefined || h === '' || !isFinite(Number(h)) ? '' : String(Number(h)).replace('.', ','); }

  /* Fecha, Actividad, Lugar, Participación y, solo si alguna fila tiene horas, Horas. */
  function columnasPara(filas) {
    return COLUMNAS.concat((filas || []).some(function (f) { return horasEspanolas(f.horas) !== ''; }) ? ['Horas'] : []);
  }

  function celdas(fila, columnas) {
    var mapa = {
      'fecha': fechaDeFila(fila), 'fecha de fin': fechaLegible(fila.fin), 'actividad': fila.actividad, 'lugar': fila.lugar,
      'departamento': fila.departamento, 'participacion': fila.papel === 'organiza' ? 'Organización' : 'Acompañante',
      'horas': horasEspanolas(fila.horas)
    };
    return columnas.map(function (c) { return mapa[norm(c)] || ''; });
  }

  /* «15/10/2026» o «2026-10-15» -> «2026-10-15»; lo que no se entienda, vacío. */
  function isoDe(t) {
    var s = String(t || '').trim(), m;
    if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + '-' + m[2] + '-' + m[3];
    return '';
  }

  /* Los dos campos del asunto: { desde, hasta } en AAAA-MM-DD. */
  function fechasDe(valores) {
    var campos = (valores && valores.campos) || {}, r = { desde: '', hasta: '' };
    Object.keys(campos).forEach(function (k) {
      if (norm(k) === norm(CAMPO_DESDE)) r.desde = isoDe(campos[k]);
      if (norm(k) === norm(CAMPO_HASTA)) r.hasta = isoDe(campos[k]);
    });
    return r;
  }

  function largo(iso) { return Actividades.fechasLegibles({ inicio: iso }); }

  /* «, entre el 1 de septiembre de 2021 y el 30 de junio de 2026», «, desde el …», «, hasta el …» o nada. */
  function periodoDe(valores) {
    var f = fechasDe(valores);
    if (f.desde && f.hasta) return ', entre el ' + largo(f.desde) + ' y el ' + largo(f.hasta);
    if (f.desde) return ', desde el ' + largo(f.desde);
    if (f.hasta) return ', hasta el ' + largo(f.hasta);
    return '';
  }

  /* Para el documento: las filas de la persona, entre las dos fechas del asunto, y el aviso de las que solo tienen nombre. */
  function preparar(filas, valores, faltan) {
    var f = fechasDe(valores);
    var salida = entre(filas, f.desde, f.hasta);
    if (salida.some(function (x) { return x.soloNombre; }) && faltan && faltan.indexOf(AVISO_SOLO_NOMBRE) === -1) faltan.push(AVISO_SOLO_NOMBRE);
    return salida;
  }

  /* ---------- la tabla de datos ---------- */

  async function comoTabla(salida) {
    if (!window.Actividades) return;
    try { await Actividades.releer(); } catch (e) { /* se queda con lo que hay en memoria */ }
    if (!Actividades.lista().length) return;
    salida.tablas[NOMBRE] = { nombre: NOMBRE, ficheros: [Actividades.FICHERO], cursos: [], cabecera: COLUMNAS,
      filas: filasDe(Actividades.lista(), U.hoyIso()), origen: 'actividades' };
  }

  /* ---------- el tipo de asunto, sus campos y su plantilla ---------- */

  function tipoQueHay() {
    var objetivo = norm(TIPO);
    return (App.E.tipos || []).filter(function (t) { return norm(t.tipo) === objetivo; })[0] ||
      (App.E.tipos || []).filter(function (t) { return (t.alias || []).some(function (x) { return norm(x) === objetivo; }); })[0] || null;
  }

  /* Los dos campos «Actividades desde» y «Actividades hasta» (clase Fecha), sin obligar ni entrar en el nombre. */
  async function asegurarCampos() {
    await Campos.guardarPropios(App.E.gestor, function (lista) {
      [['p-act-desde', CAMPO_DESDE], ['p-act-hasta', CAMPO_HASTA]].forEach(function (c) {
        if (!lista.some(function (x) { return x.id === c[0]; })) lista.push({ id: c[0], nombre: c[1], clase: 'fecha', valores: [] });
      });
      return lista;
    });
    await Campos.guardarConfigDeTipo(App.E.gestor, TIPO, [
      { origen: 'propio', id: 'p-act-desde', obligatorio: false, enNombre: false },
      { origen: 'propio', id: 'p-act-hasta', obligatorio: false, enNombre: false }]);
    App.E.campos = await Campos.leer(App.E.gestor);
  }

  /* Cuelga del tipo su plantilla (la del índice de plantillas del centro), sin duplicarla. Devuelve si queda puesta. */
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
        tipoDocumento: e.tipoDocumento, texto: e.texto || '', firmante: e.firmante || '', vistoBueno: e.vistoBueno || ''
      }]);
      return a;
    });
    return true;
  }

  /* La pasada única: si el centro no tiene el tipo, lo crea con sus campos y su plantilla. Si ya lo tiene, no toca nada. */
  async function pasada() {
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!gestor() || !App.E || !App.E.tipos) return null;
    corriendo = true;
    try {
      await Actividades.releer();
      if (Actividades.certMarcado()) return null;
      var tipo = tipoQueHay();
      if (!tipo) {
        tipo = await App.crearTipo({ nombre: TIPO, categoria: 'PERSONAL', nombreCorto: NOMBRE_CORTO });
        await asegurarCampos();
        await asegurarPlantilla();
      }
      await Actividades.cambiar(function (d) { d.certMarcado = true; });
      return tipo;
    } finally {
      corriendo = false;
    }
  }

  var yaMirado = false;
  function alRefrescar() {
    if (yaMirado || !gestor() || !window.App || !App.E || !App.E.tipos || !App.E.tipos.length) return;
    if (window.Demo && Demo.montando) return;
    yaMirado = true;
    setTimeout(function () {
      pasada().catch(function (e) { U.accesorio('No he podido preparar el tipo de asunto del certificado de actividades extraescolares', e); });
    }, 6000);
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  return {
    NOMBRE: NOMBRE, TIPO: TIPO, COLUMNAS: COLUMNAS,
    filasDe: filasDe, entre: entre, celdas: celdas, columnasPara: columnasPara, fechasDe: fechasDe, periodoDe: periodoDe, preparar: preparar,
    comoTabla: comoTabla, pasada: pasada, asegurarCampos: asegurarCampos, asegurarPlantilla: asegurarPlantilla, tipoQueHay: tipoQueHay,
    _nombreLimpio: nombreLimpio
  };
})();
window.ActividadesTabla = ActividadesTabla;
