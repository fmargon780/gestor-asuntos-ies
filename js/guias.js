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

  /* ==========================================================
     ENSEÑAR LA GUÍA
     ========================================================== */

  /* La guía en modo lectura. Sin casillas sirve de recordatorio
     (por ejemplo, al crear el asunto); con casillas, de lista de
     control dentro del asunto. */
  function vista(lista, hechos, conCasillas, elegidas) {
    var pasos = normalizar(lista);
    if (!pasos.length) return '';
    var marcados = hechos || [];
    var elegido = elegidas || {};
    return '<ol class="guia-lectura">' + pasos.map(function (p, i) {
      return unPaso(p, i, marcados, elegido, conCasillas);
    }).join('') + '</ol>';
  }

  function unPaso(p, i, marcados, elegidas, conCasillas) {
    var pregunta = esPregunta(p);
    var cual = pregunta ? String(elegidas[p.id] || '') : '';
    /* Una pregunta cuenta como hecha en cuanto se elige una opción. */
    var hecho = pregunta ? !!cual : marcados.indexOf(p.id) !== -1;
    var conCuerpo = tieneTexto(p.cuerpo);

    var control;
    if (!conCasillas) control = '<span class="paso-numero">' + (i + 1) + '</span>';
    else if (pregunta) control = '<span class="paso-numero paso-marca-pregunta">?</span>';
    else control = '<input type="checkbox" class="paso-casilla" data-paso="' +
                   U.escapar(p.id) + '"' + (hecho ? ' checked' : '') + '>';

    /* Un paso marcado se pliega y se queda solo con su título tachado:
       con cuatro pasos explicados, la guía se comía la pantalla. El
       botoncito de la esquina lo vuelve a abrir para releerlo. Solo
       tiene sentido donde hay casillas, que es dentro de un asunto.
       En una pregunta no se pliega: hay que seguir viendo qué se
       preguntaba. */
    var verlo = (conCasillas && conCuerpo && !pregunta)
      ? '<button type="button" class="paso-ver" ' +
        'title="Ver o esconder la explicación de este paso">ver</button>'
      : '';

    var titulo = '<span class="paso-titulo-texto">' +
                 U.escapar(p.titulo || 'Paso ' + (i + 1)) +
                 (p.soloInformativo ? ' <span class="suave">(informativo)</span>' : '') + '</span>';
    /* La pregunta no lleva <label>: no hay casilla que marcar, y con
       label el clic en el título no haría nada. */
    var cabecera = pregunta
      ? '<div class="paso-linea">' + control + titulo + '</div>'
      : '<label class="paso-linea">' + control + titulo + '</label>';

    var ramas = '';
    if (pregunta) {
      /* Los botones de elegir, y debajo TODAS las ramas ya pintadas.
         Solo se ve la elegida: así elegir es enseñar y esconder, sin
         volver a pintar nada y sin perder lo que ya estuviera marcado
         en la otra rama. */
      ramas =
        '<div class="guia-opciones">' + p.opciones.map(function (o) {
          return '<button type="button" class="guia-opcion' +
                 (o.id === cual ? ' elegida' : '') + '" data-paso="' + U.escapar(p.id) +
                 '" data-opcion="' + U.escapar(o.id) + '">' +
                 U.escapar(o.titulo || 'Opción') + '</button>';
        }).join('') +
        /* El aviso se pinta siempre y se enseña o se esconde: si solo se
           pintara al haber respuesta, no aparecería al responder, que es
           justo cuando hace falta. */
        (conCasillas
          ? '<span class="guia-opcion-nota' + (cual ? '' : ' oculto') +
            '">Vuelve a pulsarla para cambiar la respuesta.</span>'
          : '') +
        '</div>' +
        '<div class="guia-ramas">' + p.opciones.map(function (o) {
          var dentro = o.pasos.length
            ? vista(o.pasos, marcados, conCasillas, elegidas)
            : '<p class="explica">Con elegir esta opción basta: no hay más pasos.</p>';
          return '<div class="guia-rama' + (o.id === cual ? ' rama-activa' : '') +
                 '" data-opcion="' + U.escapar(o.id) + '">' + dentro + '</div>';
        }).join('') + '</div>';
    }

    return '<li class="paso-lectura' + (hecho ? ' paso-hecho' : '') +
           (pregunta ? ' paso-pregunta' : '') + '">' +
           cabecera + verlo +
           (conCuerpo ? '<div class="paso-cuerpo-texto">' + limpiar(p.cuerpo) + '</div>' : '') +
           (window.HitosNormativa ? HitosNormativa.listaHTML(p.normativa) : '') +
           (window.Formularios ? Formularios.listaHTML(p.formularios) : '') +
           (window.GuiasDocumentos ? GuiasDocumentos.lineaHTML(p.plantillasDocumento) : '') +
           ramas +
           '</li>';
  }

  /* Quién se entera de que se ha elegido una opción, para guardarlo en
     la ficha del asunto. Solo hay una guía en pantalla a la vez, así
     que con un solo hueco basta; el cuadro de la guía se guarda el
     anterior y lo devuelve al cerrarse. */
  var alElegirOpcion = null;

  function cuandoSeElige(fn) {
    var antes = alElegirOpcion;
    alElegirOpcion = fn || null;
    return antes;
  }

  /* Los enganches de lo que se pulsa dentro de una guía: plegar un paso
     hecho y elegir una opción. Van una sola vez sobre el documento
     entero, y no en cada sitio que pinta una guía: la guía sale en la
     ficha del asunto y en su propio cuadro, y así los dos se comportan
     igual sin repetir código.

     Con `closest` basta: el clic puede caer en el botón o en algo de
     dentro. */
  function engancharLaGuia() {
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.paso-ver') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      b.textContent = li.classList.toggle('paso-abierto') ? 'esconder' : 'ver';
    });

    /* Elegir una opción de una pregunta. Se apaga la otra rama y se
       enciende la elegida, sin volver a pintar nada. Volver a pulsar la
       que ya estaba elegida deja la pregunta sin responder, que es como
       se cambia de idea. */
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.guia-opcion') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      var nueva = b.classList.contains('elegida') ? '' : String(b.dataset.opcion || '');

      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-opciones .guia-opcion'),
        function (x) { x.classList.toggle('elegida', !!nueva && x.dataset.opcion === nueva); });
      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-ramas > .guia-rama'),
        function (r) { r.classList.toggle('rama-activa', !!nueva && r.dataset.opcion === nueva); });
      li.classList.toggle('paso-hecho', !!nueva);

      var nota = li.querySelector(':scope > .guia-opciones .guia-opcion-nota');
      if (nota) nota.classList.toggle('oculto', !nueva);

      if (alElegirOpcion) alElegirOpcion(String(b.dataset.paso || ''), nueva);
    });

    /* Al desmarcar, el paso se abre solo otra vez: así el botón no se
       queda diciendo "esconder" sobre un paso que ya está abierto. */
    document.addEventListener('change', function (ev) {
      var c = ev.target;
      if (!c || !c.classList || !c.classList.contains('paso-casilla')) return;
      var li = c.closest ? c.closest('.paso-lectura') : null;
      if (!li) return;
      li.classList.remove('paso-abierto');
      var b = li.querySelector('.paso-ver');
      if (b) b.textContent = 'ver';
    });
  }
  engancharLaGuia();

  /* Cuántos pasos hay y cuántos están hechos, contando solo la rama
     elegida de cada pregunta: los pasos de la opción que no se ha
     elegido no se hacen, así que tampoco se cuentan. La pregunta en sí
     cuenta como un paso, hecho en cuanto se responde. */
  function cuenta(lista, hechos, elegidas) {
    var pasos = normalizar(lista);
    var marcados = hechos || [];
    var elegido = elegidas || {};
    var total = 0, n = 0;
    pasos.forEach(function (p) {
      total++;
      if (esPregunta(p)) {
        var cual = elegido[p.id];
        if (!cual) return;
        n++;
        var rama = p.opciones.filter(function (o) { return o.id === cual; })[0];
        if (!rama) return;
        var c = cuenta(rama.pasos, marcados, elegido);
        total += c.total;
        n += c.hechos;
        return;
      }
      if (marcados.indexOf(p.id) !== -1) n++;
    });
    return { hechos: n, total: total };
  }

  function hechosDe(lista, hechos, elegidas) {
    return cuenta(lista, hechos, elegidas).hechos;
  }

  /* La guía de un asunto, en su propio cuadro y con casillas.
     'alMarcar' recibe la lista completa de pasos marcados cada vez
     que se toca una casilla, para que la guarde quien la abrió. */
  async function abrir(titulo, lista, hechos, alMarcar, elegidas, alElegir) {
    var marcados = (hechos || []).slice();
    var elegido = Object.assign({}, elegidas || {});
    var pasos = normalizar(lista);
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');

    var esperar = U.preguntar(titulo,
      '<p class="explica" id="guia-cuenta"></p>' +
      '<div id="guia-cuerpo">' + vista(pasos, marcados, true, elegido) + '</div>',
      'Cerrar', true);

    function contar() {
      var c = cuenta(pasos, marcados, elegido);
      $('guia-cuenta').textContent =
        c.hechos + ' de ' + c.total + ' pasos hechos. ' +
        'Lo que marques aquí lo ve todo el que abra la aplicación.';
    }
    contar();

    Array.prototype.forEach.call(document.querySelectorAll('#guia-cuerpo .paso-casilla'),
      function (c) {
        c.onchange = function () {
          var id = c.dataset.paso;
          var i = marcados.indexOf(id);
          if (c.checked && i === -1) marcados.push(id);
          if (!c.checked && i !== -1) marcados.splice(i, 1);
          c.closest('.paso-lectura').classList.toggle('paso-hecho', c.checked);
          contar();
          if (alMarcar) alMarcar(marcados.slice());
        };
      });

    /* El hueco de las opciones se toma prestado mientras el cuadro está
       abierto y se devuelve al cerrarlo, para no dejar sin él a la
       ficha del asunto que hay debajo. */
    var antes = cuandoSeElige(function (idPaso, idOpcion) {
      if (idOpcion) elegido[idPaso] = idOpcion;
      else delete elegido[idPaso];
      contar();
      if (alElegir) alElegir(Object.assign({}, elegido));
    });

    await esperar;
    cuandoSeElige(antes);
    cuadro.classList.remove('cuadro-medio');
    return marcados;
  }

  /* ==========================================================
     ESCRIBIR LA GUÍA

     Un recuadro por paso, y una sola barra de formato arriba que
     actúa sobre el recuadro en el que se está escribiendo (desde la
     fila 122, en js/guias-barra.js).
     ========================================================== */

  /* 'listaResponsables' es [{id,nombre}], personas de Ajustes más los
     papeles fijos; 'listaEstados' es una lista de nombres de
     estados.json. Las dos son opcionales: sin ellas, los desplegables
     salen vacíos, pero el resto del cuadro funciona igual (una guía
     vieja no tiene por qué dejar de escribirse). */
  /* `opciones.irA` (fila 113): el id de un paso; el cuadro se abre ya en
     su nivel y con él desplegado (lo usa el mapa, js/guias-mapa.js). */
  function editar(nombreTipo, lista, listaResponsables, listaEstados, opciones) {
    var pasos = normalizar(lista);
    /* Fila 95 (docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md): el nivel que
       se ve (la guía entera, o los pasos de una opción de una pregunta
       de dentro) y el camino hasta él, como carpetas. Todo lo que
       pinta, recoge o añade trabaja sobre `nivel`; guardar, sobre
       `pasos`, la guía entera, esté donde esté Francisco. Cada paso del
       camino es { pregunta, opcion, lista } (lista: los pasos de esa
       opción, el mismo array que hay dentro del árbol). */
    var nivel = pasos;
    var opcionesResp = listaResponsables || [];
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');
    GuiasBarra.reiniciar();
    /* Qué `<details>` estaban abiertos antes del último pintar(): lo lee
       `restaurarAbierto`, más abajo, y lo usan tanto `pintar()` como
       `GuiasOpcionesEditor.caja()` (fila 60, ver la nota junto a detallesAbiertos). */
    var abiertos = {};
    /* El acordeón (fila 122, js/guias-plegado.js): un solo paso abierto. */
    var plegado = GuiasPlegado.crear({ nivel: function () { return nivel; }, recoger: recoger, responsables: opcionesResp });
    /* Lo que la caja de opciones (js/guias-opciones-editor.js) toma prestado. */
    var opcionesCtx = {
      nivel: function () { return nivel; }, recoger: recoger, pintar: pintar,
      entrar: function (p, op) { entrar(p, op); }, prepararRecuadro: prepararRecuadro,
      restaurar: function (det, pos, idSub) { restaurarAbierto(det, abiertos, pos, idSub); }, plegado: plegado
    };

    var esperar = U.preguntar('Guía de ' + nombreTipo,
      '<p class="explica">Los pasos que hay que dar en un asunto de este tipo. ' +
      'Van en el orden del trámite. Dentro de cada asunto salen con una casilla ' +
      'para ir marcando lo que ya está hecho.</p>' +
      '<div id="guia-camino" class="guia-camino"></div>' +
      GuiasBarra.html() +
      '<div id="guia-pasos"></div>' +
      '<div class="guia-anadir-fila">' +
        '<button type="button" class="boton boton-ancho" id="guia-anadir">Añadir un paso</button>' +
        (window.GuiasMapa ? '<button type="button" class="boton boton-ancho" id="guia-ver-mapa">Ver mapa</button>' : '') +
        (window.GuiasBiblioteca
          ? '<button type="button" class="boton boton-ancho" id="guia-traer-biblioteca">+ Traer de la biblioteca</button>' +
            GuiasBiblioteca.panelTraerHTML()
          : '') +
      '</div>' +
      (window.GuiasMapa ? GuiasMapa.panelHTML() : ''),
      'Guardar');

    if (window.GuiasBiblioteca) {
      GuiasBiblioteca.engancharPanelTraer(cuadro, $('guia-traer-biblioteca'), function (modelo) {
        recoger();
        nivel.push(HitosBiblioteca.modeloAPaso(modelo));
        plegado.abrir(nivel[nivel.length - 1].id);   /* fila 122: sale abierto */
        pintar();
        plegado.alTitulo(nivel[nivel.length - 1].id);
      });
    }

    GuiasBarra.enganchar();

    /* ---------- responsable, estado y plazo por defecto (sección 11) ----------

       "Desde qué paso" solo puede ser OTRO paso del mismo nivel (el
       que se está viendo: la guía entera o los pasos de una opción,
       fila 95). Se reconstruye en cada pintado, con los pasos tal y
       como están en ese momento. */
    function pasoExtraHTML(p, i) {
      var otros = nivel.filter(function (x, k) { return k !== i; });
      return '<details class="paso-extra">' +
        '<summary>Responsable, a quién le toca y plazo <span class="suave">(opcional)</span></summary>' +
        '<div class="paso-extra-cuerpo">' +
          '<label class="etiqueta">Responsable por defecto</label>' +
          '<select class="campo paso-responsable"><option value="">(sin responsable)</option>' +
          opcionesResp.map(function (r) {
            return '<option value="' + U.escapar(r.id) + '"' + (r.id === p.responsable ? ' selected' : '') +
              '>' + U.escapar(r.nombre) + '</option>';
          }).join('') + '</select>' +
          /* Fila 129: a quién le toca este paso (js/guias-toca.js). */
          (window.GuiasToca ? GuiasToca.html(p, opcionesResp) : '') +
          '<label class="etiqueta">Plazo</label>' +
          '<div class="paso-plazo-fila">' +
            '<input type="number" min="1" class="campo paso-plazo-dias" placeholder="días" value="' +
            (p.plazo ? p.plazo.dias : '') + '">' +
            (window.GuiasPlazo ? GuiasPlazo.html(p) : '<span class="suave">días</span>') +   /* fila 131 */
            '<span class="suave">desde</span>' +
            '<select class="campo paso-plazo-desde"><option value="">(sin plazo)</option>' +
            otros.map(function (o) {
              return '<option value="' + U.escapar(o.id) + '"' +
                (p.plazo && p.plazo.desde === o.id ? ' selected' : '') + '>' +
                U.escapar(o.titulo || 'Paso sin título') + '</option>';
            }).join('') + '</select>' +
          '</div>' +
        '</div>' +
      '</details>';
    }

    /* ---------- la lista de pasos ---------- */

    /* Se lee todo lo escrito antes de repintar o de guardar. Ojo con los
       selectores: los recuadros de las opciones están DENTRO del de su
       paso, así que hay que pedir solo los hijos directos (`:scope >`).
       Sin eso, el paso se leería a sí mismo y a sus opciones a la vez.

       Los identificadores viajan en el `data-id` del propio recuadro,
       no por su posición: si no, al mover o quitar una opción se
       perdería lo que ya estuviera marcado en un asunto. */
    function recoger() {
      Array.prototype.forEach.call($('guia-pasos').children, function (caja) {
        var i = parseInt(caja.dataset.pos, 10);
        if (isNaN(i) || !nivel[i]) return;
        nivel[i].titulo = caja.querySelector(':scope > .paso-cabecera .paso-titulo').value.trim();
        nivel[i].cuerpo = limpiar(caja.querySelector(':scope > .paso-cuerpo').innerHTML);

        /* Los tres campos nuevos (16-sep-2026, hitos), siempre en los
           mismos hijos directos, se lean o no lean las opciones. */
        var respSel = caja.querySelector(':scope > .paso-extra .paso-responsable');
        nivel[i].responsable = respSel ? respSel.value : '';
        if (window.GuiasToca) GuiasToca.leer(caja, nivel[i]);   /* fila 129 */
        var diasInp = caja.querySelector(':scope > .paso-extra .paso-plazo-dias');
        var desdeSel = caja.querySelector(':scope > .paso-extra .paso-plazo-desde');
        var dias = diasInp ? parseInt(diasInp.value, 10) : NaN;
        nivel[i].plazo = (!isNaN(dias) && dias > 0 && desdeSel && desdeSel.value)
          ? { dias: dias, desde: desdeSel.value, cuenta: window.GuiasPlazo ? GuiasPlazo.leer(caja) : 'habiles' } : null;

        /* "Lo que hay que reunir" (18-sep-2026, fila 59): solo en los
           pasos que no son pregunta (ver pintar()), así que un paso que
           SÍ lo sea se queda con lo que ya tuviera (vacío, si nunca lo
           tuvo). */
        if (window.GuiasRequisitos && caja.querySelector(':scope > .paso-requisitos')) {
          nivel[i].requisitos = GuiasRequisitos.leer(caja);
        }

        /* "Comunicación de este paso" (18-sep-2026, fila 60): mismo
           criterio que arriba, solo en los pasos que no son pregunta. */
        if (window.GuiasComunicacion && caja.querySelector(':scope > .paso-comunicacion')) {
          nivel[i].comunicacion = GuiasComunicacion.leer(caja, nivel[i].id);
        }
        if (window.GuiasDocumentos && caja.querySelector(':scope > .paso-documentos')) {
          nivel[i].plantillasDocumento = GuiasDocumentos.leer(caja);   /* fila 102 */
        }
        if (window.GuiasGuion && caja.querySelector(':scope > .paso-guion')) nivel[i].guion = GuiasGuion.leer(caja);   /* fila 109 */

        /* "Solo informativo" y "Normativa" (20-sep-2026, fila 79): igual,
           solo en los pasos que no son pregunta. */
        var soloInfEl = caja.querySelector(':scope > .paso-solo-informativo-fila .paso-solo-informativo');
        if (soloInfEl) nivel[i].soloInformativo = soloInfEl.checked;
        if (window.HitosNormativa && caja.querySelector(':scope > .paso-normativa')) {
          nivel[i].normativa = HitosNormativa.leer(caja);
        }
        /* Formularios oficiales (20-sep-2026, fila 82): el editor vive
           DENTRO del mismo `<details>` de normativa. */
        if (window.Formularios && caja.querySelector(':scope > .paso-normativa .formularios-editor')) {
          nivel[i].formularios = Formularios.leerEditor(
            caja.querySelector(':scope > .paso-normativa .formularios-editor'));
        }

        var marca = caja.querySelector(':scope > .paso-es-pregunta-fila .paso-es-pregunta');
        if (!marca || !marca.checked) { nivel[i].opciones = []; return; }

        /* Se actualizan los objetos que ya había (por su id), sin
           rehacerlos: un paso de una opción puede llevar más cosas de
           las que se ven aquí (su plazo, sus propias opciones si es una
           pregunta de dentro, fila 95), y rehacerlo las perdería. */
        var viejas = nivel[i].opciones || [];
        nivel[i].opciones = Array.prototype.slice.call(
          caja.querySelectorAll(':scope > .paso-opciones > .opcion-editor')
        ).map(function (oc) {
          var o = viejas.filter(function (x) { return x.id === oc.dataset.id; })[0] ||
            { id: oc.dataset.id || nuevoId(), titulo: '', pasos: [] };
          o.titulo = oc.querySelector(':scope > .opcion-cabecera > .opcion-titulo').value.trim();
          var viejos = o.pasos || [];
          o.pasos = Array.prototype.slice.call(
            oc.querySelectorAll(':scope > .opcion-pasos > .subpaso-editor')
          ).map(function (sc) {
            var sp = viejos.filter(function (x) { return x.id === sc.dataset.id; })[0] || subpasoNuevo(sc.dataset.id);
            sp.titulo = sc.querySelector(':scope > .paso-cabecera > .subpaso-titulo').value.trim();
            var cuerpoEl = sc.querySelector(':scope > .subpaso-cuerpo');
            if (cuerpoEl) sp.cuerpo = limpiar(cuerpoEl.innerHTML);
            if (window.GuiasRequisitos && sc.querySelector(':scope > .paso-requisitos')) sp.requisitos = GuiasRequisitos.leer(sc);
            if (window.GuiasComunicacion && sc.querySelector(':scope > .paso-comunicacion')) {
              sp.comunicacion = GuiasComunicacion.leer(sc, sp.id);
            }
            if (window.GuiasDocumentos && sc.querySelector(':scope > .paso-documentos')) {
              sp.plantillasDocumento = GuiasDocumentos.leer(sc);   /* fila 102 */
            }
            if (window.GuiasGuion && sc.querySelector(':scope > .paso-guion')) sp.guion = GuiasGuion.leer(sc);   /* fila 109 */
            var esPreg = sc.querySelector(':scope > .paso-es-pregunta-fila .subpaso-es-pregunta');
            if (esPreg && !esPreg.checked) sp.opciones = [];
            return sp;
          });
          return o;
        });
      });
    }

    function subpasoNuevo(id) {
      return { id: id || nuevoId(), titulo: '', cuerpo: '', opciones: [], requisitos: [], comunicacion: null };
    }

    /* ---------- entrar y salir de una pregunta de dentro (fila 95) ----------
       En js/guias-niveles.js desde la fila 113. */
    var niveles = GuiasNiveles.crear({ pasos: pasos, nombreTipo: nombreTipo, recoger: recoger, pintar: pintar,
      alCambiar: function (lista) { nivel = lista; abiertos = {}; plegado.alCambiarDeNivel(); } });
    var entrar = niveles.entrar, pintarCamino = niveles.pintarCamino;

    /* Qué secciones plegables (paso-extra, "Lo que hay que reunir",
       "Comunicación de este paso", de un paso o de un subpaso) estaban
       abiertas antes de repintar (18-sep-2026, fila 60: sin esto, "+
       Añadir"/quitar/mover una fila de cualquiera de las dos hace
       recoger()+pintar() del paso entero, que reconstruye el `<details>`
       desde cero y se cierra solo, llevándose por delante la fila que
       Francisco acaba de tocar). La clave es la posición del paso de
       arriba (estable dentro de un mismo repintado: nada más reordena
       los pasos aquí) más el id del subpaso, si lo hay. */
    function detallesAbiertos(caja) {
      var abiertos = {};
      Array.prototype.forEach.call(caja.querySelectorAll('details[open]'), function (det) {
        var pasoEditor = det.closest('.paso-editor');
        var subEditor = det.closest('.subpaso-editor');
        var clave = (pasoEditor ? pasoEditor.dataset.pos : '') + '|' +
          (subEditor ? subEditor.dataset.id : '') + '|' + det.className;
        abiertos[clave] = true;
      });
      return abiertos;
    }

    function restaurarAbierto(det, abiertos, pos, idSubpaso) {
      if (!det) return;
      var clave = pos + '|' + (idSubpaso || '') + '|' + det.className;
      if (abiertos[clave]) det.open = true;
    }

    function pintar() {
      var caja = $('guia-pasos');
      abiertos = detallesAbiertos(caja);
      caja.innerHTML = '';
      GuiasBarra.reiniciar();
      pintarCamino();
      if (!nivel.length) {
        caja.innerHTML = '<div class="vacio">Todavía no hay ningún paso. ' +
                         'Añade el primero aquí abajo.</div>';
        return;
      }
      nivel.forEach(function (p, i) {
        var d = document.createElement('div');
        d.className = 'paso-editor';
        d.dataset.pos = i;
        d.dataset.pasoId = p.id;   /* fila 122, js/guias-plegado.js */
        d.innerHTML =
          '<div class="paso-cabecera">' +
            '<span class="paso-numero">' + (i + 1) + '</span>' +
            '<input class="campo paso-titulo" value="' + U.escapar(p.titulo) + '" ' +
            'placeholder="Título corto del paso">' +
          '</div>' +
          '<div class="paso-cuerpo" contenteditable="true" ' +
          'data-vacio="Explicación del paso">' + limpiar(p.cuerpo) + '</div>';

        var mandos = document.createElement('div');
        mandos.className = 'paso-mandos';

        function boton(texto, titulo, hacer, clase) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'boton' + (clase ? ' ' + clase : '');
          b.textContent = texto;
          b.title = titulo;
          b.onclick = hacer;
          mandos.appendChild(b);
          return b;
        }

        boton('↑', 'Subir este paso', function () {
          recoger();
          if (i === 0) return;
          var x = nivel[i - 1]; nivel[i - 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i - 1].id);   /* fila 122: abierto o cerrado, como estaba */
        }).disabled = (i === 0);

        boton('↓', 'Bajar este paso', function () {
          recoger();
          if (i === nivel.length - 1) return;
          var x = nivel[i + 1]; nivel[i + 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i + 1].id);
        }).disabled = (i === nivel.length - 1);

        boton('Quitar', 'Quitar este paso', function () {
          recoger();
          nivel.splice(i, 1);
          pintar();
        }, 'boton-peligro');

        d.querySelector('.paso-cabecera').appendChild(mandos);

        var cuerpo = d.querySelector('.paso-cuerpo');
        prepararRecuadro(cuerpo);

        d.insertAdjacentHTML('beforeend', pasoExtraHTML(p, i));
        restaurarAbierto(d.querySelector(':scope > .paso-extra'), abiertos, i, '');

        /* "Lo que hay que reunir" (18-sep-2026, fila 59,
           docs/REQUISITOS-DE-HITO.md): solo en los pasos que no son
           pregunta. Una pregunta no se "da por hecha" con una casilla:
           se resuelve eligiendo una opción, y son SUS pasos (más abajo,
           cajaDeOpciones) los que pueden llevar requisitos. */
        var pregunta = esPregunta(p);
        if (!pregunta && window.GuiasRequisitos) {
          d.insertAdjacentHTML('beforeend', GuiasRequisitos.bloqueHTML(p.requisitos));
          restaurarAbierto(d.querySelector(':scope > .paso-requisitos'), abiertos, i, '');
          GuiasRequisitos.enganchar(d, function (mutador) {
            recoger();
            mutador(nivel[i].requisitos);
            pintar();
          });
        }

        /* "Comunicación de este paso" (18-sep-2026, fila 60,
           docs/COMUNICAR-DESDE-EL-HITO.md): mismo criterio, solo en los
           pasos que no son pregunta. A diferencia del bloque de arriba,
           son solo campos de texto: no hace falta recoger()+pintar() en
           cada tecla, basta con leerlos en recoger() como el título o
           el cuerpo del paso. */
        if (!pregunta && window.GuiasComunicacion) {
          d.insertAdjacentHTML('beforeend', GuiasComunicacion.bloqueHTML(p.id, p.comunicacion));
          restaurarAbierto(d.querySelector(':scope > .paso-comunicacion'), abiertos, i, '');
          GuiasComunicacion.enganchar(d, p.id);
        }

        /* «Documentos de este paso» (fila 102, js/guias-documentos.js):
           mismo criterio, solo en los pasos que no son pregunta. */
        if (!pregunta && window.GuiasDocumentos) {
          d.insertAdjacentHTML('beforeend', GuiasDocumentos.bloqueHTML(p.plantillasDocumento));
          restaurarAbierto(d.querySelector(':scope > .paso-documentos'), abiertos, i, '');
          GuiasDocumentos.enganchar(d);
        }
        /* «Guion de este paso» (fila 109, js/guias-guion.js). */
        if (!pregunta && window.GuiasGuion) {
          d.insertAdjacentHTML('beforeend', GuiasGuion.bloqueHTML(p.guion));
          restaurarAbierto(d.querySelector(':scope > .paso-guion'), abiertos, i, '');
          GuiasGuion.enganchar(d, function (mutador) { recoger(); mutador(nivel[i].guion = nivel[i].guion || []); pintar(); });
        }

        /* "Solo informativo" y "Normativa" (20-sep-2026, fila 79,
           apartados 4.6 y 4.7): mismo criterio que arriba, solo en los
           pasos que no son pregunta. */
        if (!pregunta) {
          var filaInf = document.createElement('label');
          filaInf.className = 'interruptor paso-solo-informativo-fila';
          filaInf.innerHTML = '<input type="checkbox" class="paso-solo-informativo"' +
            (p.soloInformativo ? ' checked' : '') + '>' +
            '<span>Solo informativo: se ve, pero no reclama trabajo</span>';
          d.appendChild(filaInf);

          if (window.HitosNormativa) {
            /* Formularios oficiales (20-sep-2026, fila 82,
               docs/FORMULARIOS-OFICIALES.md): el buscador se pinta
               dentro del mismo `<details>` de normativa, para no
               alargar más la pantalla del paso. */
            var formulariosHTML = window.Formularios ? Formularios.bloqueEmbebidoHTML(p.formularios) : '';
            d.insertAdjacentHTML('beforeend', HitosNormativa.bloqueHTML(p.normativa, formulariosHTML));
            restaurarAbierto(d.querySelector(':scope > .paso-normativa'), abiertos, i, '');
            HitosNormativa.enganchar(d, function (mutador) {
              recoger();
              mutador(nivel[i].normativa);
              pintar();
            });
            if (window.Formularios) Formularios.engancharEmbebido(d);
          }

          /* "Guardar en la biblioteca" (apartados 4.2 y 4.3): junto al
             resto de los mandos del paso. Sin nada que subir (paso al
             día con su modelo), el botón no se pinta. */
          if (window.GuiasBiblioteca && window.HitosBiblioteca) {
            (function (indice) {
              HitosBiblioteca.leer().then(function (biblioteca) {
                /* Puede que ya se haya vuelto a pintar (otra tecla, otro
                   paso movido) mientras se leía la biblioteca: `d` ya
                   no estaría en el documento, y tocarlo no serviría de
                   nada (o peor, duplicaría el botón en el sitio viejo). */
                if (!d.isConnected) return;
                var pasoActual = nivel[indice];
                if (!pasoActual || pasoActual.opciones.length) return;   /* se ha vuelto pregunta mientras leíamos */
                var modelo = pasoActual.origenBiblioteca ? HitosBiblioteca.buscar(biblioteca, pasoActual.origenBiblioteca.id) : null;
                var diffs = modelo ? HitosBiblioteca.diferencias(pasoActual, modelo) : [];
                /* Ya viene de la biblioteca: el botón solo sale si ha
                   cambiado y Francisco todavía no ha decidido "Solo en
                   este tipo" para este mismo cambio (apartado 4.2). */
                if (pasoActual.origenBiblioteca &&
                    (!modelo || pasoActual.origenBiblioteca.divergido || !diffs.length)) return;
                var mandosDelPaso = d.querySelector('.paso-mandos');
                if (!mandosDelPaso) return;
                mandosDelPaso.insertAdjacentHTML('beforeend', GuiasBiblioteca.botonHTML());
                GuiasBiblioteca.engancharBoton(d, pasoActual, modelo, diffs, function (origenNuevo) {
                  recoger();
                  nivel[indice].origenBiblioteca = origenNuevo;
                  pintar();
                });
              }).catch(function () { /* sin biblioteca legible, el botón simplemente no sale */ });
            })(i);
          }
        }

        /* ---- la casilla de "esto es una pregunta" ---- */
        var fila = document.createElement('label');
        fila.className = 'interruptor paso-es-pregunta-fila';
        fila.innerHTML = '<input type="checkbox" class="paso-es-pregunta"' +
          (pregunta ? ' checked' : '') + '>' +
          '<span>Este paso es una pregunta: el trámite sigue por un camino o por otro</span>';
        d.appendChild(fila);

        fila.querySelector('.paso-es-pregunta').onchange = function () {
          recoger();
          if (this.checked && !nivel[i].opciones.length) {
            nivel[i].opciones = [
              { id: nuevoId(), titulo: '', pasos: [] },
              { id: nuevoId(), titulo: '', pasos: [] }
            ];
          }
          pintar();
        };

        if (pregunta) d.appendChild(GuiasOpcionesEditor.caja(opcionesCtx, p, i));

        caja.appendChild(d);
      });
      plegado.aplicar();   /* fila 122: el paso abierto sigue abierto tras repintar */
    }

    /* Al pegar desde Word o desde una web, solo el texto: así no se
       cuela el formato de fuera. */
    function prepararRecuadro(cuerpo) {
      cuerpo.onfocus = function () { GuiasBarra.escribiendoEn(cuerpo); };
      cuerpo.onpaste = function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t);
      };
    }

    $('guia-anadir').onclick = function () {
      recoger();
      var nuevo = { id: nuevoId(), titulo: '', cuerpo: '', opciones: [] };
      nivel.push(nuevo);
      plegado.abrir(nuevo.id);   /* fila 122: el nuevo, abierto; los demás, cerrados */
      pintar();
      plegado.alTitulo(nuevo.id);
    };

    plegado.enganchar();
    pintar();

    /* El mapa (fila 113): panel dentro del mismo cuadro, dibujado con lo
       que hay en pantalla; pulsar un paso lleva a él. */
    if (window.GuiasMapa && $('guia-ver-mapa')) {
      $('guia-ver-mapa').onclick = function () {
        recoger();
        GuiasMapa.pintarEnPanel($('guia-mapa-panel'), pasos, irAPaso);
      };
    }
    /* Desde el mapa, el paso al que se va sale abierto (fila 122). */
    function irAPaso(id) {
      plegado.abrirAlLlegar(id);
      var ok = niveles.irAPaso(id);
      plegado.abrirAlLlegar(null);
      return ok;
    }
    if (opciones && opciones.irA) irAPaso(opciones.irA);

    return esperar.then(async function (ok) {
      if (ok) recoger();
      cuadro.classList.remove('cuadro-medio');
      GuiasBarra.reiniciar();
      if (!ok) return null;
      /* Apartado 4.3: el cuadro de la guía ya está cerrado (U.preguntar
         ha resuelto y ocultado #capa), así que aquí sí se puede volver
         a abrir un cuadro, uno por cada paso cambiado. */
      if (window.GuiasBiblioteca) {
        try { await GuiasBiblioteca.revisarAlGuardar(pasos); } catch (e) { /* no crítico: se guarda igual */ }
      }
      return normalizar(pasos);
    });
  }

  return {
    nuevoId: nuevoId, limpiar: limpiar, normalizar: normalizar,
    cuantos: cuantos, vista: vista, hechosDe: hechosDe, cuenta: cuenta,
    esPregunta: esPregunta, cuandoSeElige: cuandoSeElige,
    normalizarRequisitos: normalizarRequisitos, normalizarComunicacion: normalizarComunicacion,
    normalizarNormativa: normalizarNormativa, listaDeIds: listaDeIds,
    abrir: abrir, editar: editar
  };
})();
