/* ============================================================
   documentos-sueltos-sugerencias.js — "Podría ir en...": sugerir un
   asunto ya existente a partir de lo que el lector ha reconocido en
   un documento suelto (21-sep-2026, fila 88, docs/POR-CLASIFICAR-
   ASUNTO-EXISTENTE.md).

   Solo entra en juego cuando js/documentos-sueltos-lector.js (fila
   41) ya ha reconocido un TERCERO en el PDF: sin tercero, no hay nada
   que sugerir. No envuelve nada nuevo (sección 3.3 de docs/CONTEXTO-
   CORTO.md): js/documentos-sueltos-lector.js llama aquí mismo, en el
   mismo paso en que procesa cada documento (la misma cola, de uno en
   uno), y guarda el resultado junto a la propuesta.

   Un asunto es "del mismo tercero" comparando primero por su
   documento —Nº de identificación escolar del alumnado, los cuatro
   últimos caracteres del documento del personal, el NIF de una
   empresa: lo mismo que va al final del nombre de la carpeta, ver
   js/nombres.js (terceroAlumno/terceroPersonal/terceroEmpresa)— y,
   cuando eso no se puede comparar, por el nombre
   (ElegirAsunto.terceroDentroDe, la misma pieza que ya usa "Meter en
   un asunto"). Los terceros relacionados de un asunto no cuentan:
   solo el tercero principal, `ficha.tercero`.

   Abiertos: se miran en App.E.listaAbiertos, que ya está en memoria,
   sin tocar el disco. Archivados: solo cuando no hay ningún abierto,
   y solo con el índice guardado del ARCHIVO
   (`_GESTOR/indice-archivo.json`, js/archivo-indice.js) — nunca se
   recorre el ARCHIVO carpeta a carpeta desde aquí. Sin índice (no
   hecho, roto, o de otra versión), sencillamente no se sugiere ningún
   archivado: es justo lo que ya pasa hoy si nunca se ha "Reconstruido
   el índice".
   ============================================================ */
window.SugerenciasAsuntoExistente = (function () {

  var CUANTOS = 3;

  /* El código pegado al final de un texto de tercero ("Apellidos,
     Nombre CÓDIGO"): cuatro caracteres o más, letras y cifras. Mismo
     patrón que usa ElegirAsunto.trozosDelTercero para quitarlo antes
     de comparar apellidos y nombre. */
  function codigoFinal(texto) {
    var partes = String(texto || '').trim().split(/\s+/);
    var ultima = partes[partes.length - 1] || '';
    return /^[0-9A-Za-z]{4,}$/.test(ultima) ? ultima.toUpperCase() : '';
  }

  /* El documento de la persona leída, tal como queda al final del
     nombre de la carpeta para su categoría (mismo cálculo que
     js/nombres.js). Sin categoría reconocida no hay documento que
     comparar. */
  function documentoDeLaPersona(categoria, persona) {
    var p = persona || {};
    if (categoria === 'ALUMNADO') return String(p.id || '').toUpperCase();
    if (categoria === 'PERSONAL' || categoria === 'TUTORES LEGALES') {
      var doc = String(p.documento || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
      return doc.slice(-4);
    }
    if (categoria === 'EMPRESAS') return String(p.nif || '').toUpperCase();
    if (categoria === 'ADMINISTRACIONES') return String(p.codigoCentro || '');   /* fila 167: el de un centro */
    return '';
  }

  /* ¿El tercero de este candidato (su texto "Apellidos, Nombre
     CÓDIGO", tal cual va en el nombre de la carpeta) es la misma
     persona que se ha leído en el documento? Si los dos lados tienen
     documento, manda solo eso (sin caer al nombre, para no confundir
     a dos personas que solo se parecen en el apellido). */
  function esMismoTercero(documentoLeido, textoLeidoNormalizado, terceroCandidato) {
    if (!terceroCandidato) return false;
    if (documentoLeido) {
      var codigo = codigoFinal(terceroCandidato);
      if (codigo) return codigo === documentoLeido;
    }
    return ElegirAsunto.terceroDentroDe({ tercero: terceroCandidato }, textoLeidoNormalizado);
  }

  /* Cuándo se cerró una entrada del índice del ARCHIVO: su fecha de
     cierre si la tiene, o si no, la fecha AAMMDD de delante del
     nombre de la carpeta (mismo patrón que
     ElegirAsunto.cuandoSeMovio). */
  function cuandoSeCerro(entrada) {
    var cuando = 0;
    var c = new Date((entrada && entrada.cerradoEl) || '');
    if (!isNaN(c.getTime())) cuando = c.getTime();
    if (!cuando) {
      var m = String((entrada && entrada.nombre) || '').match(/^(\d{2})(\d{2})(\d{2})(\D|$)/);
      if (m) {
        var f = new Date(2000 + parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        if (!isNaN(f.getTime())) cuando = f.getTime();
      }
    }
    return cuando;
  }

  /* Hasta tres abiertos: primero los del tipo propuesto, después los
     demás (marcados "otro tipo"); dentro de cada grupo, el más
     reciente primero. Sin tipo propuesto, todos sin marca, por
     reciente. */
  function sugerenciasAbiertas(categoria, documentoLeido, textoLeido, tipoPropuesto) {
    var candidatos = (App.E.listaAbiertos || []).filter(function (a) {
      var ficha = a.ficha || {};
      return ficha.categoria === categoria &&
        esMismoTercero(documentoLeido, textoLeido, ficha.tercero);
    });
    if (!candidatos.length) return [];

    candidatos.sort(function (a, b) {
      var ta = !!(tipoPropuesto && a.ficha.tipo === tipoPropuesto);
      var tb = !!(tipoPropuesto && b.ficha.tipo === tipoPropuesto);
      if (ta !== tb) return ta ? -1 : 1;
      return ElegirAsunto.cuandoSeMovio(b.nombre, b.ficha) - ElegirAsunto.cuandoSeMovio(a.nombre, a.ficha);
    });

    return candidatos.slice(0, CUANTOS).map(function (a) {
      return {
        nombre: a.nombre, ficha: a.ficha, archivado: false,
        otroTipo: !!(tipoPropuesto && a.ficha.tipo !== tipoPropuesto)
      };
    });
  }

  /* Hasta tres archivados del tipo propuesto, el más reciente
     primero. Sin tipo propuesto no se sugiere ningún archivado: no
     hay con qué filtrar sin recorrer el ARCHIVO entero, y eso es
     justo lo que este módulo no hace. */
  async function sugerenciasArchivadas(categoria, documentoLeido, textoLeido, tipoPropuesto) {
    if (!tipoPropuesto || !window.IndiceArchivo) return [];
    var leido;
    /* Fila 177: un archivado del mismo tipo puede ser de cualquier curso. */
    try { leido = await IndiceArchivo.leerDisco({ todos: true }); } catch (e) { return []; }
    if (!leido || !leido.ok) return [];

    var candidatos = (leido.datos.asuntos || []).filter(function (e) {
      return e.categoria === categoria && e.tipo === tipoPropuesto &&
        esMismoTercero(documentoLeido, textoLeido, e.tercero);
    });
    if (!candidatos.length) return [];

    candidatos.sort(function (a, b) { return cuandoSeCerro(b) - cuandoSeCerro(a); });
    return candidatos.slice(0, CUANTOS).map(function (e) {
      return {
        nombre: e.nombre, archivado: true, otroTipo: false,
        ficha: { categoria: e.categoria, tercero: e.tercero, estado: 'cerrado' }
      };
    });
  }

  /* La lista de sugerencias para una propuesta ya leída (con
     `propuesta.tercero` puesto): como mucho tres, abiertas si las
     hay; si no, archivadas del mismo tipo. [] si no hay tercero
     reconocido, o si ninguna encaja. */
  async function calcular(propuesta) {
    var tercero = propuesta && propuesta.tercero;
    if (!tercero || !tercero.categoria) return [];

    var categoria = tercero.categoria;
    var documentoLeido = documentoDeLaPersona(categoria, tercero.persona);
    var textoLeido = U.normalizar(tercero.nombre || '');
    var tipoPropuesto = (propuesta.tipo && propuesta.tipo.tipo) || '';

    var abiertas = sugerenciasAbiertas(categoria, documentoLeido, textoLeido, tipoPropuesto);
    if (abiertas.length) return abiertas;

    return sugerenciasArchivadas(categoria, documentoLeido, textoLeido, tipoPropuesto);
  }

  /* Punto 8 del encargo: lo usa App.parecidoDelSuelto (js/documentos-
     sueltos.js) para saber, de un `tercero` ya leído ({categoria,
     nombre, persona}), si es el mismo que el texto de un asunto
     cualquiera (`x.ficha.tercero`). Mismo cálculo que usan las
     sugerencias de arriba, expuesto para no repetirlo. */
  function esDelMismoTercero(tercero, terceroCandidato) {
    if (!tercero) return false;
    var documentoLeido = documentoDeLaPersona(tercero.categoria, tercero.persona);
    var textoLeido = U.normalizar(tercero.nombre || '');
    return esMismoTercero(documentoLeido, textoLeido, terceroCandidato);
  }

  return { calcular: calcular, esDelMismoTercero: esDelMismoTercero };
})();
