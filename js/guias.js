/* ============================================================
   guias.js — la guía del procedimiento de cada tipo de asunto.

   Cada tipo de asunto (MATRICULA, COMPRA, SANCION...) puede llevar
   una lista de pasos. Cada paso tiene un título corto y una
   explicación debajo, con negrita, viñetas y enlaces.

   Un paso puede ser además una PREGUNTA con opciones: se elige una y
   el trámite sigue por los pasos de esa opción.

   Los pasos van en el orden del trámite, como los estados: se suben
   y se bajan con las flechas.

   Se guardan en _GESTOR/guias.json, dentro de la carpeta de asuntos
   abiertos, así que los ve todo el que abra la aplicación.

   En cada asunto abierto la guía se enseña con casillas, para ir
   marcando lo que ya está hecho. Lo marcado y lo elegido se guardan en
   la ficha del asunto, en asuntos.json.
   ============================================================ */
var Guias = (function () {

  function $(id) { return document.getElementById(id); }

  function nuevoId() { return U.nuevoId('p'); }

  /* ==========================================================
     LIMPIEZA DEL TEXTO CON FORMATO

     El cuerpo de un paso se escribe en un recuadro con formato, y
     se guarda como HTML en un fichero compartido. Antes de guardarlo
     y antes de enseñarlo se pasa por aquí: solo sobreviven las
     etiquetas de la lista, y de los enlaces solo los que llevan a
     una página web o a un correo. Todo lo demás se queda en texto.
     ========================================================== */

  var PERMITIDAS = {
    B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u',
    UL: 'ul', OL: 'ol', LI: 'li', BR: 'br', P: 'p', DIV: 'div', A: 'a'
  };

  function copiarNodos(origen, destino) {
    var hijos = origen.childNodes;
    for (var i = 0; i < hijos.length; i++) {
      var n = hijos[i];
      if (n.nodeType === 3) {
        destino.appendChild(document.createTextNode(n.nodeValue));
        continue;
      }
      if (n.nodeType !== 1) continue;

      var nueva = PERMITIDAS[n.tagName.toUpperCase()];
      if (!nueva) { copiarNodos(n, destino); continue; }

      if (nueva === 'a') {
        var href = n.getAttribute('href') || '';
        if (!/^(https?:\/\/|mailto:)/i.test(href)) { copiarNodos(n, destino); continue; }
        var enlace = document.createElement('a');
        enlace.setAttribute('href', href);
        enlace.setAttribute('target', '_blank');
        enlace.setAttribute('rel', 'noopener noreferrer');
        copiarNodos(n, enlace);
        destino.appendChild(enlace);
        continue;
      }

      var el = document.createElement(nueva);
      copiarNodos(n, el);
      destino.appendChild(el);
    }
  }

  function limpiar(html) {
    var doc = new DOMParser().parseFromString(
      '<div id="raiz">' + String(html === null || html === undefined ? '' : html) + '</div>',
      'text/html');
    var raiz = doc.getElementById('raiz');
    var destino = document.createElement('div');
    if (raiz) copiarNodos(raiz, destino);
    return destino.innerHTML;
  }

  /* ¿Este cuerpo dice algo, o son etiquetas vacías? */
  function tieneTexto(html) {
    var d = document.createElement('div');
    d.innerHTML = limpiar(html);
    if (d.querySelector('a')) return true;
    return d.textContent.replace(/\s+/g, '') !== '';
  }

  /* Los pasos, tal y como se guardan: id, título, cuerpo y, si el paso
     es una pregunta, sus opciones.

     Una PREGUNTA es un paso con `opciones`. Cada opción tiene su nombre
     y su propia lista de pasos. Al elegir una dentro de un asunto solo
     salen los pasos de esa opción; los de la otra ni se ven. Ejemplo
     suyo: "¿Cómo hemos recibido la factura?" → en mano (sello, firma,
     entregar a Fátima) o digitalmente (a la firma del director).

     Desde la fila 95 (23-sep-2026, docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md)
     un paso de una opción es un paso entero, con los mismos campos que
     uno de arriba, y puede ser a su vez una pregunta: sin límite de
     niveles. `normalizar()` ya es recursivo; aquí solo se le deja
     hacer. Las guías de antes siguen valiendo tal cual. */
  function normalizarOpciones(lista) {
    return (lista || []).map(function (o) {
      return {
        id: (o && o.id) || nuevoId(),
        titulo: String((o && o.titulo) || ''),
        pasos: normalizar((o && o.pasos) || [])
      };
    }).filter(function (o) { return o.titulo || o.pasos.length; });
  }

  /* Los tres campos de hitos (16-sep-2026, docs/HITOS.md sección 11):
     responsable por defecto, estado del asunto y plazo. Los tres son
     opcionales y van plegados en el editor; una guía vieja que no los
     traiga sigue funcionando igual, con los tres vacíos. Desde la fila
     95 existen a cualquier nivel, también en los pasos de una opción. */
  function listaDeIds(lista) {
    var vistos = {};
    return (Array.isArray(lista) ? lista : []).map(function (x) { return String(x || '').trim(); })
      .filter(function (x) { if (!x || vistos[x]) return false; vistos[x] = true; return true; });
  }

  function normalizarExtra(p) {
    return {
      responsable: String((p && p.responsable) || ''),
      estadoAsunto: (p && p.estadoAsunto) || null,
      /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md): «Nos toca» ('nos') o
         «Esperamos a…» ('espera', con `tocaA`: un responsable o papel).
         Vacío: se deduce del responsable (Hitos.esDeAdministracion). */
      toca: (p && (p.toca === 'nos' || p.toca === 'espera')) ? p.toca : '',
      tocaA: (p && p.toca === 'espera') ? String(p.tocaA || '') : '',
      /* Fila 131: `cuenta` (hábiles, lectivos o naturales); hábiles si no dice. */
      plazo: (p && p.plazo && p.plazo.dias)
        ? { dias: parseInt(p.plazo.dias, 10) || 0, desde: String(p.plazo.desde || ''),
            cuenta: (p.plazo.cuenta === 'lectivos' || p.plazo.cuenta === 'naturales') ? p.plazo.cuenta : 'habiles' } : null,
      /* 20-sep-2026, fila 79, apartados 4.6, 4.7 y 4.1
         (docs/BIBLIOTECA-DE-HITOS.md): igual que lo de arriba, solo
         existen en los pasos de arriba, nunca en una opción. */
      soloInformativo: !!(p && p.soloInformativo),
      normativa: normalizarNormativa(p && p.normativa),
      /* 20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md: claves del
         catálogo de `js/formularios.js`, igual que `normativa`. */
      formularios: Array.isArray(p && p.formularios) ? p.formularios.map(String) : [],
      /* 23-sep-2026, fila 102, docs/DOCUMENTOS-DESDE-EL-HITO.md: los `id`
         de las plantillas de documento (plantillas.json → documentos)
         unidas a este paso. Sin repetir; vacío si no es lista. */
      plantillasDocumento: listaDeIds(p && p.plantillasDocumento),
      origenBiblioteca: (p && p.origenBiblioteca && p.origenBiblioteca.id)
        ? { id: p.origenBiblioteca.id, revision: parseInt(p.origenBiblioteca.revision, 10) || 1,
            divergido: !!p.origenBiblioteca.divergido }
        : null
    };
  }

  /* "Normativa" de un paso (18-sep-2026 → 20-sep-2026, fila 79, apartado
     4.7): una lista de referencias, cada una con su cita (lo único
     obligatorio), y opcionalmente el bloque y la clave del sistema de
     normativa del centro, o un enlace propio. La clave se guarda
     siempre con guion, nunca con espacio (si Francisco escribe uno, se
     convierte al guardar, sin avisar). Sin cita, la referencia no
     sobrevive: mismo criterio que un requisito sin texto. */
  function normalizarReferenciaNormativa(r) {
    return {
      id: (r && r.id) || nuevoId(),
      cita: String((r && r.cita) || ''),
      bloque: String((r && r.bloque) || ''),
      clave: String((r && r.clave) || '').trim().replace(/\s+/g, '-'),
      url: String((r && r.url) || '')
    };
  }

  function normalizarNormativa(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarReferenciaNormativa)
      .filter(function (r) { return r.cita; });
  }

  function normalizar(lista) {
    return (lista || []).map(function (p) {
      if (typeof p === 'string') {
        return Object.assign({ id: nuevoId(), titulo: p, cuerpo: '', opciones: [], requisitos: [],
          comunicacion: normalizarComunicacion(null) }, normalizarExtra(null));
      }
      var salida = Object.assign({
        id: (p && p.id) || nuevoId(),
        titulo: String((p && p.titulo) || ''),
        cuerpo: limpiar((p && p.cuerpo) || ''),
        opciones: normalizarOpciones(p && p.opciones),
        requisitos: normalizarRequisitos(p && p.requisitos),
        comunicacion: normalizarComunicacion(p && p.comunicacion),
        /* El guion del hito (fila 109, js/guias-guion.js), a cualquier nivel. */
        guion: window.GuiasGuion ? GuiasGuion.normalizar(p && p.guion) : ((p && p.guion) || [])
      }, normalizarExtra(p));
      /* Un paso-pregunta se resuelve eligiendo una opción: no lleva
         requisitos, comunicación, normativa ni formularios, a ningún
         nivel (fila 95). El editor ya no los enseña; aquí se asegura. */
      if (salida.opciones.length) {
        salida.requisitos = [];
        salida.comunicacion = normalizarComunicacion(null);
        salida.normativa = [];
        salida.formularios = [];
        salida.plantillasDocumento = [];
        salida.guion = [];
        salida.soloInformativo = false;
      }
      return salida;
    }).filter(function (p) {
      return p.titulo || tieneTexto(p.cuerpo) || p.opciones.length;
    });
  }

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  /* "Lo que hay que reunir" de un paso (18-sep-2026, fila 59,
     docs/REQUISITOS-DE-HITO.md): una lista opcional de casillas, cada
     una un documento o un dato. Cualquier `clase` que no sea
     'documento' se normaliza a 'dato'. Un requisito sin texto no
     sobrevive: es el mismo criterio que un paso sin título. */
  function normalizarRequisito(r) {
    return {
      id: (r && r.id) || nuevoId(),
      texto: String((r && r.texto) || ''),
      clase: (r && r.clase) === 'documento' ? 'documento' : 'dato',
      obligatorio: !!(r && r.obligatorio)
    };
  }

  function normalizarRequisitos(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarRequisito)
      .filter(function (r) { return r.texto; });
  }

  /* "Comunicación de este paso" (18-sep-2026, fila 60,
     docs/COMUNICAR-DESDE-EL-HITO.md): un texto propio, para correo o
     para Séneca (o los dos), aparte de la plantilla general del tipo.
     Un canal cuenta como "con texto" solo si tiene cuerpo (sección 3:
     "vacía si el cuerpo está en blanco, aunque haya asunto"). */
  function normalizarCanalComunicacion(c) {
    return { asunto: String((c && c.asunto) || ''), cuerpo: String((c && c.cuerpo) || '') };
  }

  function normalizarComunicacion(c) {
    return { correo: normalizarCanalComunicacion(c && c.correo), seneca: normalizarCanalComunicacion(c && c.seneca) };
  }

  function cuantos(lista) { return (lista || []).length; }

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): este fichero se parte por
     temas, sin cambiar nada de lo que hace. Aquí queda el modelo (leer y
     normalizar una guía); enseñarla y marcarla vive en js/guias-vista.js,
     y escribirla en js/guias-editor.js (con js/guias-paso-bloques.js).
     Los dos se cuelgan de este mismo objeto `Guias` con sus nombres de
     siempre (vista, hechosDe, cuenta, cuandoSeElige, abrir, editar). */
  return {
    nuevoId: nuevoId, limpiar: limpiar, normalizar: normalizar, tieneTexto: tieneTexto,
    cuantos: cuantos,
    esPregunta: esPregunta,
    normalizarRequisitos: normalizarRequisitos, normalizarComunicacion: normalizarComunicacion,
    normalizarNormativa: normalizarNormativa, listaDeIds: listaDeIds
  };
})();
