/* ============================================================
   hitos-biblioteca.js — el modelo de la biblioteca de hitos del
   centro (20-sep-2026, fila 79, docs/BIBLIOTECA-DE-HITOS.md).

   Una colección de "hitos modelo", guardada una sola vez en
   _GESTOR/hitos-biblioteca.json (el decimosexto fichero compartido,
   ver js/copias.js), para no reescribir el mismo paso del trámite en
   cada Tipo de Asunto que lo necesite. Al escribir la guía de un tipo,
   un modelo se trae como COPIA: el paso que queda en guias.json lleva
   además `origenBiblioteca: { id, revision, divergido }`.

   Aquí solo vive el modelo (leer, escribir, crear/editar/borrar un
   modelo, comparar un paso con el suyo) y las dos funciones puras que
   pide el apartado 4.6 (si un hito traído nace "Solo informativo") y
   el 4.7 (el enlace de una referencia de normativa). La pintura — el
   panel de "traer", el botón "Guardar en la biblioteca", el cuadro de
   comparación y el bloque de Ajustes — vive en js/guias-biblioteca.js.

   Se carga después de js/guias.js, js/guias-requisitos.js y
   js/guias-comunicacion.js: reutiliza Guias.normalizarRequisitos,
   Guias.normalizarComunicacion y Guias.normalizarNormativa para que un
   modelo tenga exactamente la misma forma que un paso de guía, en los
   dos sentidos, sin inventar una forma nueva.
   ============================================================ */
var HitosBiblioteca = (function () {

  var FICHERO = 'hitos-biblioteca.json';

  function nuevoId() { return U.nuevoId('b'); }

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  /* ==========================================================
     LOS BLOQUES DEL SISTEMA DE NORMATIVA (apartado 4.7)
     ========================================================== */

  var BLOQUES_NORMATIVA = [
    { clave: 'escolarizacion', nombre: 'Escolarización' },
    { clave: 'convivencia', nombre: 'Convivencia' },
    { clave: 'matricula', nombre: 'Matrícula y expedientes' },
    { clave: 'evaluacion', nombre: 'Evaluación y titulación' },
    { clave: 'personal', nombre: 'Personal del centro' },
    { clave: 'economica', nombre: 'Gestión económica' },
    { clave: 'becas', nombre: 'Becas, transporte y comedor' },
    { clave: 'datos', nombre: 'Datos y administración electrónica' },
    { clave: 'opo', nombre: 'Temario C1.1000' }
  ];

  function nombreDeBloque(clave) {
    var b = BLOQUES_NORMATIVA.filter(function (x) { return x.clave === clave; })[0];
    return b ? b.nombre : clave;
  }

  /* El enlace de una referencia de normativa (función pura, apartado
     4.7, retocada la fila 87, docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md):
     con clave, se monta contra la vista de un solo artículo del sistema
     de normativa del centro, `<base>/norma#r=<clave>`; el bloque ya no
     interviene en el enlace, solo sigue guardado para saber dónde vive
     el artículo. Sin clave, con `url` si la lleva; sin nada, no hay
     enlace y la cita se ve como texto suelto. `direccionBase` puede
     venir vacía (Ajustes sin rellenar todavía): entonces tampoco hay
     enlace, aunque haya clave. */
  function enlaceDeNormativa(ref, direccionBase) {
    if (!ref) return '';
    if (ref.clave && direccionBase) {
      var base = direccionBase.replace(/\/$/, '').replace(/\/norma$/, '');
      return base + '/norma#r=' + encodeURIComponent(ref.clave);
    }
    if (!ref.clave && ref.url) return ref.url;
    return '';
  }

  /* ==========================================================
     LEER Y ESCRIBIR EL FICHERO
     ========================================================== */

  function normalizarModelo(m) {
    return {
      id: (m && m.id) || nuevoId(),
      nombre: String((m && m.nombre) || ''),
      revision: (m && parseInt(m.revision, 10)) || 1,
      titulo: String((m && m.titulo) || ''),
      explicacion: (window.Guias ? Guias.limpiar((m && m.explicacion) || '') : String((m && m.explicacion) || '')),
      responsable: String((m && m.responsable) || ''),
      estadoAsunto: (m && m.estadoAsunto) || null,
      plazo: (m && m.plazo && m.plazo.dias)
        ? { dias: parseInt(m.plazo.dias, 10) || 0, desde: String(m.plazo.desde || '') } : null,
      requisitos: window.Guias ? Guias.normalizarRequisitos(m && m.requisitos) : [],
      comunicacion: window.Guias ? Guias.normalizarComunicacion(m && m.comunicacion) : null,
      soloInformativo: !!(m && m.soloInformativo),
      normativa: window.Guias ? Guias.normalizarNormativa(m && m.normativa) : [],
      /* 20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md. */
      formularios: Array.isArray(m && m.formularios) ? m.formularios.map(String) : [],
      creadoEl: String((m && m.creadoEl) || U.hoyIso()),
      actualizadoEl: String((m && m.actualizadoEl) || U.hoyIso()),
      actualizadoPor: String((m && m.actualizadoPor) || '')
    };
  }

  function normalizar(leido) {
    var l = leido || {};
    return {
      version: 1,
      modelos: (Array.isArray(l.modelos) ? l.modelos : []).map(normalizarModelo)
    };
  }

  function vacio() { return normalizar(null); }

  async function leer() {
    var g = gestor();
    if (!g) return vacio();
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Como todo fichero compartido: se relee justo antes de escribir. */
  async function cambiar(hacer) {
    var g = gestor();
    if (!g) return vacio();
    var actual = await leer();
    var nuevo = hacer(actual) || actual;
    await Copias.guardar(g, FICHERO, nuevo);
    return nuevo;
  }

  function buscar(datos, id) {
    return (datos.modelos || []).filter(function (m) { return m.id === id; })[0] || null;
  }

  /* ==========================================================
     UN PASO DE GUÍA, EN LA FORMA DE UN MODELO (y al revés)
     ========================================================== */

  /* Un paso-pregunta no se puede guardar en la biblioteca (sección 2
     del encargo: "Un modelo es siempre un paso normal"). */
  function esPasoValido(paso) {
    return !!(paso && (!window.Guias || !Guias.esPregunta(paso)));
  }

  function pasoAModelo(paso, nombre, revisionPrevia, usuario) {
    return normalizarModelo({
      id: nuevoId(),
      nombre: nombre || paso.titulo || 'Sin nombre',
      revision: revisionPrevia || 1,
      titulo: paso.titulo, explicacion: paso.cuerpo,
      responsable: paso.responsable, estadoAsunto: paso.estadoAsunto, plazo: paso.plazo,
      requisitos: paso.requisitos, comunicacion: paso.comunicacion,
      soloInformativo: paso.soloInformativo, normativa: paso.normativa,
      formularios: paso.formularios,
      actualizadoPor: usuario || ''
    });
  }

  /* Un modelo, insertado como paso nuevo dentro de una guía (apartado
     4.1: "es una copia"). `origenBiblioteca` es lo único que lo
     distingue de un paso escrito a mano. */
  function modeloAPaso(modelo) {
    return {
      id: (window.Guias ? Guias.nuevoId() : nuevoId()),
      titulo: modelo.titulo, cuerpo: modelo.explicacion, opciones: [],
      responsable: modelo.responsable, estadoAsunto: modelo.estadoAsunto, plazo: modelo.plazo,
      requisitos: (modelo.requisitos || []).map(function (r) { return Object.assign({}, r); }),
      comunicacion: modelo.comunicacion ? Object.assign({}, modelo.comunicacion) : null,
      soloInformativo: modelo.soloInformativo,
      normativa: (modelo.normativa || []).map(function (n) { return Object.assign({}, n); }),
      formularios: (modelo.formularios || []).slice(),
      origenBiblioteca: { id: modelo.id, revision: modelo.revision, divergido: false }
    };
  }

  /* Los campos que se comparan entre un paso y su modelo (apartado 4.3
     y 4.4). `soloInformativo` queda fuera a propósito: "no cuenta como
     cambio del modelo" (es una decisión de cada tipo, no del modelo). */
  var CAMPOS_COMPARABLES = [
    { clave: 'titulo', etiqueta: 'Título' },
    { clave: 'cuerpo', modeloClave: 'explicacion', etiqueta: 'Explicación' },
    { clave: 'responsable', etiqueta: 'Responsable' },
    { clave: 'estadoAsunto', etiqueta: 'Estado del asunto' },
    { clave: 'plazo', etiqueta: 'Plazo' },
    { clave: 'requisitos', etiqueta: 'Lo que hay que reunir' },
    { clave: 'comunicacion', etiqueta: 'Comunicación de este paso' },
    { clave: 'normativa', etiqueta: 'Normativa' }
  ];

  function textoLegibleDe(clave, valor) {
    if (valor === null || valor === undefined || valor === '') return '(vacío)';
    if (clave === 'plazo') {
      return valor.dias ? (valor.dias + ' días desde otro paso') : '(vacío)';
    }
    if (clave === 'requisitos') {
      var lista = valor || [];
      return lista.length ? lista.map(function (r) { return r.texto; }).join('; ') : '(vacío)';
    }
    if (clave === 'comunicacion') {
      var c = valor || {};
      var canales = [];
      if (c.correo && c.correo.cuerpo) canales.push('correo');
      if (c.seneca && c.seneca.cuerpo) canales.push('Séneca');
      return canales.length ? canales.join(' y ') : '(vacío)';
    }
    if (clave === 'normativa') {
      var refs = valor || [];
      return refs.length ? refs.map(function (r) { return r.cita; }).join('; ') : '(vacío)';
    }
    return String(valor);
  }

  /* Compara `paso` (o el modelo mismo, para comparar dos modelos entre
     sí no hace falta aquí) contra `modelo`, campo a campo. Devuelve una
     lista de { campo, etiqueta, antes, despues }, vacía si son iguales
     en todo lo que cuenta. La comparación es por el texto que se le
     enseña a Francisco, no por igualdad estricta de objetos: dos
     `plazo` con el mismo número de días son iguales aunque sean dos
     objetos distintos en memoria. */
  function diferencias(paso, modelo) {
    if (!paso || !modelo) return [];
    var salida = [];
    CAMPOS_COMPARABLES.forEach(function (c) {
      var valorPaso = paso[c.clave];
      var valorModelo = modelo[c.modeloClave || c.clave];
      var antes = textoLegibleDe(c.clave, valorPaso);
      var despues = textoLegibleDe(c.clave, valorModelo);
      if (antes !== despues) salida.push({ campo: c.clave, etiqueta: c.etiqueta, antes: antes, despues: despues });
    });
    return salida;
  }

  /* ==========================================================
     CREAR, ACTUALIZAR Y BORRAR UN MODELO
     ========================================================== */

  async function crearDesdePaso(paso, nombre, usuario) {
    var modelo = pasoAModelo(paso, nombre, 1, usuario);
    await cambiar(function (d) { d.modelos.push(modelo); return d; });
    return modelo;
  }

  /* Sube la revisión del modelo con los campos nuevos del paso.
     Devuelve el modelo ya actualizado (con su revisión nueva), o null
     si el modelo ya no existe (se borró desde el otro ordenador). */
  async function actualizarDesdePaso(idModelo, paso, usuario) {
    var resultado = null;
    await cambiar(function (d) {
      var m = buscar(d, idModelo);
      if (!m) return d;
      var nuevo = pasoAModelo(paso, m.nombre, m.revision + 1, usuario);
      nuevo.id = m.id;
      nuevo.creadoEl = m.creadoEl;
      Object.assign(m, nuevo);
      resultado = m;
      return d;
    });
    return resultado;
  }

  async function crearDesdeCero(nombre, usuario) {
    var modelo = normalizarModelo({ nombre: nombre, titulo: nombre, revision: 1, actualizadoPor: usuario });
    await cambiar(function (d) { d.modelos.push(modelo); return d; });
    return modelo;
  }

  async function renombrar(idModelo, nombreNuevo) {
    await cambiar(function (d) {
      var m = buscar(d, idModelo);
      if (m) m.nombre = nombreNuevo;
      return d;
    });
  }

  /* Editar un modelo con el mismo editor de un paso (apartado 4.5):
     `paso` es lo que ese editor ha devuelto, ya normalizado como paso
     de guía. */
  async function editar(idModelo, paso, usuario) {
    return actualizarDesdePaso(idModelo, paso, usuario);
  }

  async function borrar(idModelo) {
    await cambiar(function (d) {
      d.modelos = d.modelos.filter(function (m) { return m.id !== idModelo; });
      return d;
    });
  }

  /* En qué tipos está en uso un modelo (para el aviso de "borrar uno
     que está en uso", apartado 4.5). `guiasPorTipo` es el objeto entero
     de guias.json ({ TIPO: [pasos] }); recorre también las opciones de
     una pregunta, por si un subpaso viene de la biblioteca. */
  function tiposQueUsan(idModelo, guiasPorTipo) {
    var tipos = [];
    Object.keys(guiasPorTipo || {}).forEach(function (tipo) {
      var usado = false;
      (function recorrer(pasos) {
        (pasos || []).forEach(function (p) {
          if (p.origenBiblioteca && p.origenBiblioteca.id === idModelo) usado = true;
          (p.opciones || []).forEach(function (o) { recorrer(o.pasos); });
        });
      })(guiasPorTipo[tipo]);
      if (usado) tipos.push(tipo);
    });
    return tipos;
  }

  /* ==========================================================
     APARTADO 4.6: ¿NACE MARCADO "SOLO INFORMATIVO"?

     Función pura: nace marcado cuando el responsable del hito NO es
     Administración/Secretaría. `idResponsableAdministracion` es el que
     Francisco tenga configurado como propio del puesto en Ajustes › El
     centro (`js/hitos-ajustes.js`); sin poder determinarlo, nace sin
     marcar (mejor de menos que reclamar trabajo de más por error).
     ========================================================== */
  function naceSoloInformativo(idResponsable, idResponsableAdministracion) {
    if (!idResponsable || !idResponsableAdministracion) return false;
    return idResponsable !== idResponsableAdministracion;
  }

  return {
    FICHERO: FICHERO, BLOQUES_NORMATIVA: BLOQUES_NORMATIVA, nombreDeBloque: nombreDeBloque,
    enlaceDeNormativa: enlaceDeNormativa,
    leer: leer, cambiar: cambiar, buscar: buscar,
    esPasoValido: esPasoValido, modeloAPaso: modeloAPaso,
    diferencias: diferencias,
    crearDesdePaso: crearDesdePaso, actualizarDesdePaso: actualizarDesdePaso,
    crearDesdeCero: crearDesdeCero, renombrar: renombrar, editar: editar, borrar: borrar,
    tiposQueUsan: tiposQueUsan, naceSoloInformativo: naceSoloInformativo,
    /* para las pruebas */
    _normalizarModelo: normalizarModelo, _pasoAModelo: pasoAModelo
  };
})();
window.HitosBiblioteca = HitosBiblioteca;
