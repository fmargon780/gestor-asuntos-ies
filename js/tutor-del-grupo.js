/* ============================================================
   tutor-del-grupo.js — quién es el tutor o tutora del grupo de un
   alumno (7-oct-2026, fila 299, docs/CORREO-AL-TUTOR-DEL-GRUPO.md).

   Una sola regla para todo el que necesite escribir «a la tutoría»:
   las casillas de «Comunicar ▾» (js/hito-mesa-comunicar.js), las tareas
   de comunicar con «Tutor/a del grupo» (js/hito-mesa-recetas.js,
   js/hacer-este-hito.js) y el cuadro de Correo, que lleva por `extra`
   lo que aquí se decide (js/hitos-comunicar.js).

   `decidir` es pura: de las filas de la tabla TUTORIAS (js/tablas-datos.js,
   `{ curso, grupo, nombre, dni, desde, hasta, clave }`), la unidad del
   alumno y la fecha de hoy, saca los tutores en vigor. `deAsunto` busca
   al alumno, su unidad, la tabla y el correo de cada tutor (su ficha de
   PERSONAL y, si no trae ninguno, el que alguien escribió a mano al
   enviar un correo: `_GESTOR/correos-a-mano.json`, que es de
   js/correos-a-mano.js).

   Sin saber quién es, `motivo` dice por qué (y todo sigue como antes,
   sin dirección y con el nombre «la tutoría»).
   ============================================================ */
var TutorDelGrupo = (function () {

  /* La unidad sin mayúsculas, tildes, espacios, puntos, guiones ni «º/ª»:
     «1º ESO A», «1ºESO-A» y «1 E.S.O. A» son la misma. */
  function claveDeUnidad(u) {
    return String(window.U ? U.normalizar(String(u || '')) : String(u || '').toLowerCase())
      .replace(/[\s.\-_º°ª]+/g, '');
  }

  /* El año en que empezó el curso al que pertenece una fecha (AAAA-MM-DD). */
  function anioDeCurso(iso) {
    var p = String(iso || '').split('-');
    var ano = parseInt(p[0], 10), mes = parseInt(p[1], 10);
    if (!ano || !mes) return NaN;
    return mes < 9 ? ano - 1 : ano;
  }

  function anioDeFila(curso) {
    var m = String(curso || '').match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  function enVigor(f, hoy) {
    return (!f.desde || f.desde <= hoy) && (!f.hasta || hoy <= f.hasta);
  }

  /* PURA. `datos`: { esAlumnado, esGrupo, unidad, hayTabla, filas, hoy,
     grupoAtencion, correosPorClave: { clave: [correos] },
     recordados: { clave: { correo, nombre, quien, cuando } } }.
     Devuelve { unidad, tutores: [{ nombre, clave, correos, aMano, cuando }], motivo }.
     `motivo`: '' | 'no-alumnado' | 'grupo' | 'sin-unidad' | 'sin-tabla' | 'sin-tutor'. */
  function decidir(datos) {
    var d = datos || {};
    var salida = { unidad: String(d.unidad || '').trim(), tutores: [], motivo: '' };
    if (d.esGrupo) { salida.motivo = 'grupo'; return salida; }
    if (!d.esAlumnado) { salida.motivo = 'no-alumnado'; return salida; }
    if (!salida.unidad) { salida.motivo = 'sin-unidad'; return salida; }
    if (!d.hayTabla) { salida.motivo = 'sin-tabla'; return salida; }
    var anio = anioDeCurso(d.hoy);
    var clave = claveDeUnidad(salida.unidad);
    var vistos = {};
    (d.filas || []).forEach(function (f) {
      if (!f || (d.grupoAtencion && f.grupo === d.grupoAtencion)) return;   /* el bloque de Pedagogía Terapéutica no cuenta */
      if (anioDeFila(f.curso) !== anio) return;
      if (claveDeUnidad(f.grupo) !== clave || !enVigor(f, d.hoy)) return;
      var k = f.clave || f.dni || f.nombre;
      if (vistos[k]) return;
      vistos[k] = true;
      var correos = ((d.correosPorClave || {})[f.clave] || []).slice();
      var aMano = false, cuando = '';
      var rec = (d.recordados || {})[f.clave];
      if (!correos.length && rec && rec.correo) { correos = [rec.correo]; aMano = true; cuando = rec.cuando || ''; }
      salida.tutores.push({ nombre: f.nombre, clave: f.clave, correos: correos, aMano: aMano, cuando: cuando });
    });
    if (!salida.tutores.length) salida.motivo = 'sin-tutor';
    return salida;
  }

  /* La línea ámbar de arriba del cuadro de Correo, o '' si no hace falta. */
  function textoDelMotivo(motivo, unidad) {
    if (motivo === 'sin-unidad') return 'Este alumno no tiene unidad este curso.';
    if (motivo === 'sin-tabla' || motivo === 'sin-tutor') {
      return 'No sé quién es el tutor o tutora de ' + unidad + '. Sube la relación de tutorías de Séneca en Herramientas → Tablas de datos.';
    }
    return '';
  }

  /* ---------- lo que hace falta leer ---------- */

  function categoriaDe(a) { return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || ''; }

  async function unidadDe(persona) {
    if (!persona || !window.DatosFavoritos) return '';
    var fila = DatosFavoritos.filas(persona, 'ALUMNADO', null).filter(function (f) { return f.clave === 'unidad'; })[0];
    return fila ? String(fila.valor || '').trim() : '';
  }

  async function correosDePersonal(claves) {
    var porClave = {};
    try {
      var fuente = await Datos.cargar(App.E.datos, 'PERSONAL');
      (fuente.lista || []).forEach(function (p) {
        var k = TablasDatosLeer.clave(p.documento);
        if (k && claves[k] && !porClave[k]) porClave[k] = Destinatarios.direccionesDe(p);
      });
    } catch (e) { /* sin ficha de personal: sin correo, y se pide */ }
    return porClave;
  }

  /* { tutores, unidad, motivo } de un asunto. Nunca lanza. */
  async function deAsunto(a) {
    var base = { unidad: '', tutores: [], motivo: '' };
    try {
      if (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a)) return decidir({ esGrupo: true });
      if (categoriaDe(a) !== 'ALUMNADO') return decidir({ esAlumnado: false });
      var persona = window.HitosComunicar ? await HitosComunicar.buscarPersonaDelAsunto(a) : null;
      var unidad = await unidadDe(persona);
      var tabla = null;
      if (unidad && window.TablasDatos) tabla = ((await TablasDatos.cargar()).tablas || {}).TUTORIAS || null;
      var filas = tabla ? tabla.filas : [];
      var claves = {};
      filas.forEach(function (f) { if (f.clave) claves[f.clave] = true; });
      var datos = {
        esAlumnado: true, unidad: unidad, hayTabla: !!tabla, filas: filas, hoy: U.hoyIso(),
        grupoAtencion: window.TablasDatosLeer ? TablasDatosLeer.GRUPO_ATENCION : '',
        correosPorClave: tabla ? await correosDePersonal(claves) : {},
        recordados: window.CorreosAMano ? await CorreosAMano.leerTodos() : {}
      };
      return decidir(datos);
    } catch (e) { return base; }
  }

  return { decidir: decidir, deAsunto: deAsunto, claveDeUnidad: claveDeUnidad, textoDelMotivo: textoDelMotivo };
})();
window.TutorDelGrupo = TutorDelGrupo;
