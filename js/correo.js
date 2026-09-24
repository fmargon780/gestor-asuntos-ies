/* ============================================================
   correo.js — el correo de un asunto, con los campos ya escritos.

   La aplicación no manda nada. Lo que hace es preparar las tres
   piezas de un correo —a quién va, el asunto y el cuerpo— sacándolas
   del propio asunto y de los ficheros de Séneca, y dejarlas listas
   para pegar o para abrir la ventana de redactar de Gmail.

     - PARA: los correos que trae el fichero del tercero. En el
       alumnado son los de los tutores legales, y salen con casilla
       para elegir a quién se le escribe.
     - ASUNTO: el nombre de la carpeta, siempre (fila 55, 18-sep-2026,
       docs/ASUNTO-SIN-ELECCION.md): es la pista que permite reconocer
       después a qué asunto pertenece cada mensaje del hilo.
     - CUERPO: el saludo y la despedida hechos; el medio, en blanco.

   Lo único que sí queda guardado es el rastro: en cuanto se copia el
   cuerpo o se abre la ventana de redactar, se apunta una nota en el
   asunto diciendo a quién se le ha escrito y qué día. Así el compañero
   ve lo que ya está hecho sin tener que preguntar. Debajo salen además
   el botón para dejar el asunto a la espera del tercero y el
   recordatorio de guardar el PDF del hilo en la carpeta.

   El mismo cuadro sirve para la MENSAJERÍA DE SÉNECA, con un cambio:
   allí el destinatario no se escribe, se elige de las listas del propio
   Séneca (Utilidades → Comunicaciones). Así que no hay "Para": solo el
   asunto y el texto, y un botón que los va dando de uno en uno, en el
   orden en que hay que pegarlos.

   El cuadro de Correo (con "Para", los grupos y los documentos que se
   adjuntan) vive en js/correo-cuadro.js desde la fila 58 (18-sep-2026,
   docs/AJUSTES-DE-USO-2026-09-18.md, 5): este fichero se había ido a
   más de 800 líneas. Aquí solo queda lo que comparten los dos cuadros
   (Correo y Séneca): el asunto y el cuerpo del mensaje, a quién se
   escribe en palabras, y el rastro que se apunta en las notas del
   asunto.
   ============================================================ */
(function () {

  var viendo = null;         /* el asunto que se está mirando */
  var modoDelAsunto = 'abierto';
  var yaApuntado = false;    /* la nota se escribe una vez por cuadro, no una por botón */
  var porSeneca = false;     /* true: el cuadro es el de la mensajería de Séneca */
  var algoCambiado = false;  /* al cerrar, la ficha se repinta si se ha tocado algo */

  var plantillasDatos = null;   /* _GESTOR/plantillas.json, ya leído */
  var valoresActuales = null;   /* Plantillas.valoresDeAsunto(a), calculado una vez por apertura
                                    (fila 17 de la cola: es la fuente única de los huecos, para
                                    que un documento de Word y un correo lean de un solo sitio) */
  var MAXIMO_LETRAS_SENECA = 4000;

  /* "Pedir lo que falta" (18-sep-2026, fila 59, docs/REQUISITOS-DE-HITO.md,
     sección 7): el texto de las casillas sin marcar de un hito, cuando
     el cuadro se abre desde ese botón; vacío en cualquier otra
     apertura. Ver cuerpoDelMedio, más abajo. */
  var loQueFaltaActual = '';

  /* "Comunicar" desde un hito (18-sep-2026, fila 60,
     docs/COMUNICAR-DESDE-EL-HITO.md): cuando el cuadro se abre desde
     el botón de un hito, js/hitos-comunicar.js ya trae el asunto y el
     cuerpo del mensaje resueltos (con sus huecos sustituidos) y, si lo
     sabe, una dirección preferente; el cuadro los enseña tal cual, sin
     pasar por el desplegable de plantillas del tipo. `comunicarHitoActual`
     guarda a quién se ha creído que se escribe y qué hito lo pidió, para
     la constancia que deja `apuntarElRastro` (sección 5.3: una nota en
     el asunto y una línea en el historial del hito, una sola vez). */
  var asuntoListoActual = '';
  var medioListoActual = '';
  var correoPreferenteActual = '';
  var comunicarHitoActual = null;
  /* Documentos del hito ya marcados en "Documentos de este asunto"
     (23-sep-2026, fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección
     3): `extra.adjuntosMarcados`, una lista de nombres. Solo tiene
     efecto en Correo (en Séneca no hay adjuntos). */
  var adjuntosMarcadosActual = [];

  function $(id) { return document.getElementById(id); }

  /* ---------- de dónde salen los datos ---------- */

  function categoriaDe(a) {
    return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
  }

  function terceroDe(a) {
    var f = a.ficha || {}, l = a.leido || {};
    if (f.tercero) return f.tercero;
    if (l.resto) return Nombres.terceroDeResto(l.resto);
    return '';
  }

  /* El nombre de la persona, sin el número de identificación ni el NIF
     que lleva pegado detrás. Es lo que se escribe en el saludo. */
  function soloElNombre(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* Se busca en el mismo fichero que usa la pantalla de Personas. Si el
     nombre lleva pegado el número, se prueba también sin él. */
  async function buscarPersona(a) {
    var categoria = categoriaDe(a);
    var quien = terceroDe(a);
    if (!categoria || !quien || !App.E.datos) return null;
    var fuente = await Datos.cargar(App.E.datos, categoria);
    var lista = Datos.buscar(fuente.lista, quien, 1);
    if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
    if (!lista.length) lista = Datos.buscar(fuente.lista, soloElNombre(quien), 1);
    return lista.length ? lista[0] : null;
  }

  /* ---------- los tres campos ---------- */

  /* El asunto del mensaje es siempre el nombre de la carpeta (fila 55,
     18-sep-2026, docs/ASUNTO-SIN-ELECCION.md): es lo que permite
     reconocer después a qué asunto pertenece cada mensaje del hilo.
     Antes había una "versión legible" alternativa, con sus dos
     botones para elegir una u otra; se ha quitado, junto con la
     función que la fabricaba (`piezasDelNombre`, que ya no tiene para
     qué usarse) y el estado que guardaba cuál estaba elegida. */
  function asuntoDelCorreo(a) {
    return asuntoListoActual || a.nombre;
  }

  /* Desde la fila 17 de la cola, {firma} ya sale calculado dentro de
     Plantillas.valoresDeAsunto (con sus propios huecos sustituidos):
     un solo sitio que sepa cómo se monta. Si por lo que sea no se ha
     podido calcular (fallo de red, cuadro recién abierto), se cae en
     lo de siempre. */
  function textoDeLaFirma() {
    if (valoresActuales && valoresActuales.firma) return valoresActuales.firma;
    return Plantillas.rellenar(Plantillas.POR_DEFECTO_FIRMA, {
      usuario: App.E.usuario || '', centro: Plantillas.POR_DEFECTO_CENTRO
    }).texto;
  }

  /* El cuerpo entero: saludo, el medio (en blanco, o la plantilla
     elegida con sus huecos ya rellenos) y la firma. Devuelve también
     los huecos que se han quedado sin dato, para el aviso de arriba. */
  function cuerpoDelMedio(a, idPlantilla) {
    var categoria = categoriaDe(a);
    var nombre = soloElNombre(terceroDe(a));
    var saludo;
    if (categoria === 'ALUMNADO') {
      saludo = 'Estimados tutores legales de ' + nombre + ':';
    } else if (categoria === 'PERSONAL') {
      saludo = 'Hola' + (nombre ? ', ' + nombre : '') + ':';
    } else {
      saludo = 'Buenos días:';
    }

    var medio = '', faltan = [];

    /* "Comunicar" desde un hito (fila 60): el medio ya viene resuelto,
       sin pasar por ninguna plantilla del tipo ni por el hueco
       {{LO QUE FALTA}} (ese es cosa de la fila 59, para la plantilla
       general; aquí el texto es el propio del paso). */
    if (medioListoActual) {
      medio = medioListoActual;
    } else {
      var plantilla = idPlantilla && plantillasDatos
        ? plantillasDatos.lista.filter(function (p) { return p.id === idPlantilla; })[0]
        : null;
      if (plantilla) {
        var valoresConLoQueFalta = Object.assign({}, valoresActuales || {}, { loQueFalta: loQueFaltaActual });
        var r = Plantillas.rellenar(plantilla.texto, valoresConLoQueFalta);
        medio = r.texto;
        faltan = r.faltan;
      }

      /* Si "Pedir lo que falta" trae texto y la plantilla (o la falta de
         plantilla) no llevaba el hueco {{LO QUE FALTA}} de todas formas,
         se añade al final, separado por una línea en blanco (sección 7
         del encargo): el hueco, cuando existe en la plantilla, ya lo ha
         metido Plantillas.rellenar en su sitio. */
      if (loQueFaltaActual && !(plantilla && Plantillas.tieneLoQueFalta(plantilla.texto))) {
        medio = medio ? (medio + '\n\n' + loQueFaltaActual) : loQueFaltaActual;
      }
    }

    var firma = textoDeLaFirma();
    var texto = medio ? (saludo + '\n\n' + medio + '\n\n' + firma) : (saludo + '\n\n\n\n' + firma);
    return { texto: texto, faltan: faltan };
  }

  /* ---------- los grupos, para la copia oculta ----------

     17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md. Decisión de
     Francisco: los destinatarios que vienen de un grupo van SIEMPRE en
     copia oculta, nunca en Para, para que una familia no vea el correo
     de las demás. Combinar los correos de un grupo es cosa de
     js/correo-cuadro.js (fila 58): aquí solo queda resolver quiénes
     son los miembros, que también usa Séneca. */

  /* Busca la ficha de cada miembro que no la traiga ya puesta (los
     atajos de alumnado la traen; los miembros de un grupo guardado,
     no: solo se guarda { categoria, nombre }). Una sola lectura de
     Datos.cargar por categoría, no una por miembro. */
  async function resolverMiembros(miembros) {
    var porCategoria = {};
    miembros.forEach(function (m) {
      if (!porCategoria[m.categoria]) porCategoria[m.categoria] = [];
      porCategoria[m.categoria].push(m);
    });
    var resueltos = [];
    for (var categoria in porCategoria) {
      var fuente = null;
      if (!porCategoria[categoria].every(function (m) { return m.persona; })) {
        try { fuente = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null; }
        catch (e) { fuente = null; }
      }
      porCategoria[categoria].forEach(function (m) {
        var persona = m.persona ||
          (fuente ? fuente.lista.filter(function (p) { return App.textoTercero(p) === m.nombre; })[0] : null);
        resueltos.push({ nombre: m.nombre, persona: persona || null });
      });
    }
    return resueltos;
  }

  /* Los mismos tres filtros de js/relacionados.js (Relacionados.filtrarPorUnidad
     y compañía): ni el análisis de la unidad ni el filtro de matriculado
     se repiten aquí. */
  async function miembrosDeOpcionDeGrupo(valor) {
    if (valor.indexOf('grupo:') === 0) {
      var g = window.Grupos && Grupos.porId(valor.slice(6));
      return g ? g.miembros.slice() : [];
    }
    if (!App.E.datos || !window.Relacionados) return [];
    var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
    var lista;
    if (valor.indexOf('unidad:') === 0) lista = Relacionados.filtrarPorUnidad(fuente.lista, valor.slice(7));
    else if (valor.indexOf('nivel:') === 0) lista = Relacionados.filtrarPorNivel(fuente.lista, valor.slice(6));
    else if (valor.indexOf('ensenanza:') === 0) lista = Relacionados.filtrarPorEnsenanza(fuente.lista, valor.slice(10));
    else return [];
    return lista.map(function (al) { return { categoria: 'ALUMNADO', nombre: App.textoTercero(al), persona: al }; });
  }

  /* Las opciones del desplegable "Añadir un grupo": los grupos propios
     y, para el alumnado, los mismos atajos de unidad, nivel y
     enseñanza de "Añadir varios" en js/relacionados.js. Cadena vacía
     si no hay ni grupos ni alumnado cargado: entonces no sale el
     desplegable. */
  async function opcionesDeGrupo() {
    var partes = [];
    var grupos = (window.Grupos && Grupos.lista()) || [];
    if (grupos.length) {
      partes.push('<optgroup label="Grupos">' + grupos.map(function (g) {
        return '<option value="grupo:' + U.escapar(g.id) + '">' + U.escapar(g.nombre) + '</option>';
      }).join('') + '</optgroup>');
    }
    if (App.E.datos) {
      try {
        var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
        var unidades = Datos.unidadesDistintas(fuente.lista);
        if (unidades.length) {
          var niveles = {}, ensenanzas = {};
          unidades.forEach(function (u) {
            var p = Nombres.nivelYEnsenanza(u.unidad);
            if (p.nivel) niveles[p.nivel] = true;
            if (p.ensenanza) ensenanzas[p.ensenanza] = true;
          });
          partes.push('<optgroup label="Unidades">' + unidades.map(function (u) {
            return '<option value="unidad:' + U.escapar(u.unidad) + '">' + U.escapar(u.unidad) + '</option>';
          }).join('') + '</optgroup>');
          partes.push('<optgroup label="Niveles">' + Object.keys(niveles).sort().map(function (n) {
            return '<option value="nivel:' + U.escapar(n) + '">' + U.escapar(n) + '</option>';
          }).join('') + '</optgroup>');
          partes.push('<optgroup label="Enseñanzas">' + Object.keys(ensenanzas).sort().map(function (e) {
            return '<option value="ensenanza:' + U.escapar(e) + '">' + U.escapar(e) + '</option>';
          }).join('') + '</optgroup>');
        }
      } catch (e) { /* sin datos cargados, no pasa nada: el desplegable se queda sin esas opciones */ }
    }
    return partes.join('');
  }

  /* Las mismas piezas de "Añadir un grupo" las necesita también el
     cuadro de Séneca (fila 47, docs/DESTINATARIOS-EN-SENECA.md), que
     vive en su propio fichero (js/seneca-destinatarios.js) para no
     engordar más este. Se exponen sin tocar nada de lo de arriba. */
  window.CorreoGrupos = {
    opciones: opcionesDeGrupo,
    miembrosDeOpcion: miembrosDeOpcionDeGrupo,
    resolverMiembros: resolverMiembros
  };

  /* ---------- el rastro que queda en el asunto ----------

     Se escribe una sola vez por cada vez que se abre el cuadro: da
     igual que se copie el cuerpo y además se abra Gmail. En un asunto
     archivado no se escribe nada, porque sus notas ya no se tocan.
     "Para" y la copia oculta salen de js/correo-cuadro.js (fila 58, que
     ahora es dueño de esos dos datos), a través de `window.CorreoCuadro`. */

  /* "Comunicar" desde un hito (fila 60, sección 5.3 del encargo): la
     misma línea sirve para la nota del asunto y para el historial del
     hito (ver apuntarElRastro, más abajo). Pura, para poder probarla
     sin abrir ningún cuadro (`CorreoNucleo.textoDeComunicarHito`). */
  function textoDeComunicarHito(nombreDestinatario, esSeneca) {
    return 'Comunicado a ' + (nombreDestinatario || 'el tercero') + ' por ' +
      (esSeneca ? 'Séneca' : 'correo') + ' · ' + U.fechaLegible(U.aAaMmDd(U.hoyIso()));
  }

  /* "· con N documentos: a, b" (fila 103, sección 3): el mismo trozo
     para la nota de un correo normal y para la constancia de
     "Comunicar" desde un hito, pura para poder probarla sin abrir
     ningún cuadro (CorreoNucleo.sufijoDocumentos). Vacía sin nada que
     añadir, para no dejar puntos suspendidos de sobra. */
  function sufijoDocumentos(nombres) {
    if (!nombres || !nombres.length) return '';
    return ' · con ' + nombres.length + ' documento' + (nombres.length === 1 ? '' : 's') +
      ': ' + nombres.join(', ');
  }

  function textoDeLaNota() {
    if (comunicarHitoActual) {
      /* La constancia en el historial del hito incluye los documentos
         (fila 103, sección 3): mismo dato que ya lee "Documentos de
         este asunto" (window.CorreoCuadro.documentosAdjuntados), así
         que aparecen igual haya o no texto propio del paso. */
      var documentosDelHito = (!porSeneca && window.CorreoCuadro) ? CorreoCuadro.documentosAdjuntados() : [];
      return textoDeComunicarHito(comunicarHitoActual.nombreDestinatario, porSeneca) +
        sufijoDocumentos(documentosDelHito);
    }
    /* En Séneca el campo del asunto es #seneca-asunto (js/seneca-cuadro.js,
       fila 53): #correo-asunto ya no existe en ese cuadro. */
    var campoAsunto = $('correo-asunto') || $('seneca-asunto');
    var asunto = campoAsunto ? campoAsunto.value : '';
    var cola = asunto ? ' — asunto: "' + asunto + '"' : '';
    if (porSeneca) {
      return 'Mensaje por Séneca a ' + (aQuien(viendo) || 'el tercero') + cola;
    }
    var cc = window.CorreoCuadro;
    var para = cc ? cc.paraDelCuadro() : '';
    var base = 'Correo ' + (para ? 'a ' + para : 'preparado') + cola;
    var direccionesCco = cc ? cc.ccoDirecciones() : [];
    if (direccionesCco.length) {
      base += ' · en copia oculta a ' + direccionesCco.length +
        (direccionesCco.length === 1 ? ' persona' : ' personas');
    }
    return base + sufijoDocumentos(cc ? cc.documentosAdjuntados() : []);
  }

  /* A quién se le va a escribir, dicho en palabras. En Séneca no hay
     direcciones que enseñar: lo que ayuda es acordarse de a quién hay
     que marcar en su lista. Si el asunto trae "Lo pide" (17-sep-2026,
     fila 28), manda ese nombre: es a quien hay que contestar, y puede
     no ser el propio interesado. */
  function aQuien(a) {
    if (comunicarHitoActual && comunicarHitoActual.nombreDestinatario) return comunicarHitoActual.nombreDestinatario;
    var deLoPide = window.LoPide && a && a.ficha && a.ficha.loPide && a.ficha.loPide.nombre;
    if (deLoPide) return deLoPide;
    var categoria = categoriaDe(a);
    var nombre = soloElNombre(terceroDe(a));
    if (!nombre) return '';
    if (categoria === 'ALUMNADO') return 'los tutores legales de ' + nombre;
    return nombre;
  }

  /* El estado que toca después de escribir a alguien de fuera. La lista
     la pone el centro en Ajustes, así que no se da por hecho que exista
     uno llamado "A LA ESPERA DEL TERCERO": se busca entre los que están
     marcados como de espera, y de esos manda el que hable del tercero.
     "ENVIADO A FIRMA" también es de espera, pero no es lo que pasa
     cuando se manda un correo a una familia. */
  function estadoDeEspera() {
    var lista = ((App.E && App.E.estados) || []).filter(function (e) { return e.espera; });
    if (!lista.length) return '';
    var conTercero = lista.filter(function (e) {
      return U.normalizar(e.nombre).indexOf('tercero') !== -1;
    });
    if (conTercero.length) return conTercero[0].nombre;
    var conEspera = lista.filter(function (e) {
      return U.normalizar(e.nombre).indexOf('espera') !== -1;
    });
    if (conEspera.length) return conEspera[0].nombre;
    return lista[lista.length - 1].nombre;
  }

  async function apuntarElRastro(a) {
    if (yaApuntado) { pintarRastro(a, ''); return; }
    yaApuntado = true;

    if (modoDelAsunto === 'archivado' || !window.Notas) {
      pintarRastro(a, '');
      return;
    }
    try {
      var texto = textoDeLaNota();
      await window.Notas.anadir(a, texto);
      /* "Comunicar" desde un hito (fila 60, sección 5.3): la misma
         línea, además, en el historial del propio hito. No crítico: si
         falla, el mensaje ya se ha preparado y la nota ya ha quedado. */
      if (comunicarHitoActual && window.Hitos && typeof Hitos.anadirNota === 'function') {
        try {
          await Hitos.anadirNota(comunicarHitoActual.claveAsunto, comunicarHitoActual.idHito, texto);
          if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, comunicarHitoActual.idHito, 'comunicar');   /* fila 109 */
          if (window.HitosPanel) window.HitosPanel.programarRepintado();
        } catch (e) { /* no crítico */ }
      }
      algoCambiado = true;
      pintarRastro(a, 'Apuntado en las notas del asunto.');
    } catch (e) {
      pintarRastro(a, 'No he podido apuntarlo en el asunto: ' + U.mensajeDeError(e));
    }
  }

  function pintarRastro(a, aviso) {
    var caja = $('correo-caja');
    if (!caja) return;
    var sitio = $('correo-rastro');
    if (!sitio) {
      sitio = document.createElement('div');
      sitio.id = 'correo-rastro';
      sitio.className = 'aviso aviso-ambar';
      sitio.style.marginTop = '14px';
      caja.appendChild(sitio);
    }

    var espera = estadoDeEspera();
    var ahora = (a.ficha && a.ficha.situacion) || '';
    var puedeEsperar = modoDelAsunto !== 'archivado' && espera && ahora !== espera;

    sitio.innerHTML = '<strong>' + U.escapar(aviso || 'Rastro del correo') + '</strong>' +
      '<p>Acuérdate de guardar el PDF del hilo en la carpeta del asunto, ' +
      'con el botón "Gestionar documentos".</p>';

    if (!puedeEsperar) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.style.marginTop = '8px';
    b.textContent = 'Poner el asunto en ' + espera;
    b.onclick = async function () {
      b.disabled = true;
      try {
        await App.ponerEstado(a, espera);
        if (a.ficha) a.ficha.situacion = espera;
        algoCambiado = true;
        b.textContent = 'Hecho: ' + espera;
      } catch (e) {
        b.disabled = false;
        U.aviso('No he podido cambiar el estado: ' + U.mensajeDeError(e), 'malo');
      }
    };
    sitio.appendChild(b);
  }

  /* ---------- el cuadro ----------

     La disposición de los dos cuadros (Séneca, fila 53; Correo, fila
     58) es cosa de js/seneca-cuadro.js y js/correo-cuadro.js: aquí solo
     se decide cuál tocaba, se prepara lo que los dos necesitan
     (persona, plantillas, valores) y se llama al que toque. */

  async function abrirCuadro(a, deSeneca, extra) {
    viendo = a;
    porSeneca = !!deSeneca;
    loQueFaltaActual = (extra && extra.loQueFalta) || '';
    asuntoListoActual = (extra && extra.asuntoListo) || '';
    medioListoActual = (extra && extra.medioListo) || '';
    correoPreferenteActual = (extra && extra.correoPreferente) || '';
    comunicarHitoActual = (extra && extra.comunicarHito) || null;
    adjuntosMarcadosActual = (extra && extra.adjuntosMarcados) || [];
    if (window.SenecaDestinatarios) SenecaDestinatarios.limpiar();
    yaApuntado = false;
    algoCambiado = false;
    /* El cuadro de Séneca ocupa más ancho que el de Correo (fila 53,
       docs/SENECA-CUADRO-ANCHO.md): mismo patrón que .cuadro-ancho en
       js/documentos.js, con su propia clase y un tope menor. Correo
       usa `.cuadro-correo` (fila 58, docs/AJUSTES-DE-USO-2026-09-18.md,
       5), con el mismo ancho pero cabecera y botonera fijas. */
    var cuadroEl = document.querySelector('#capa .cuadro');
    if (cuadroEl) {
      cuadroEl.classList.toggle('cuadro-seneca', porSeneca);
      cuadroEl.classList.toggle('cuadro-correo', !porSeneca);
    }
    var esperar = U.preguntar(porSeneca ? 'Mensaje por Séneca' : 'Correo de este asunto',
      '<div id="correo-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var persona = null;
    try { persona = await buscarPersona(a); } catch (e) { persona = null; }
    try { plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { plantillasDatos = null; }
    try { valoresActuales = await Plantillas.valoresDeAsunto(a); } catch (e) { valoresActuales = null; }
    await pintarCuadro(a, persona);
    await esperar;
    if (cuadroEl) { cuadroEl.classList.remove('cuadro-seneca'); cuadroEl.classList.remove('cuadro-correo'); }
    /* Si se ha apuntado la nota o cambiado el estado, la ficha que hay
       detrás se ha quedado vieja: se vuelve a abrir. */
    if (algoCambiado) App.abrirFicha(a, modoDelAsunto);
  }

  async function pintarCuadro(a, persona) {
    var caja = $('correo-caja');
    if (!caja) return;

    /* Los documentos del asunto no van en el cuadro de Séneca: allí no
       hay adjuntos. El desplegable "Añadir un grupo" sí va en los dos
       cuadros (fila 47, docs/DESTINATARIOS-EN-SENECA.md): en Correo
       saca correos, en Séneca usuarios IdEA. */
    var bloqueAdjuntos = '';
    var opcionesGrupo = '';
    if (!porSeneca && window.CorreoAdjuntos) {
      try { bloqueAdjuntos = await CorreoAdjuntos.pintarBloque(a, adjuntosMarcadosActual); } catch (e) { bloqueAdjuntos = ''; }
    }
    try { opcionesGrupo = await opcionesDeGrupo(); } catch (e) { opcionesGrupo = ''; }

    if (porSeneca) {
      caja.innerHTML = window.SenecaCuadro ? SenecaCuadro.cuerpoHtml(a, opcionesGrupo) : '';
      if (window.SenecaCuadro) SenecaCuadro.enganchar(a);
      if (window.SenecaDestinatarios) SenecaDestinatarios.enganchar();
      return;
    }

    caja.innerHTML = window.CorreoCuadro ? CorreoCuadro.cuerpoHtml(a, persona, bloqueAdjuntos, opcionesGrupo) : '';
    if (window.CorreoCuadro) CorreoCuadro.enganchar(a);
  }

  /* El cuadro de Séneca vive en js/seneca-cuadro.js (fila 53) y el de
     Correo en js/correo-cuadro.js (fila 58): este fichero solo pone a
     su disposición, en `window.CorreoNucleo` (más abajo), las piezas
     que comparten los dos. */

  /* Las plantillas del tipo de este asunto. Con una sola, es la que
     sale puesta; con ninguna, el desplegable no se pinta. */
  function plantillasDelTipo(a) {
    if (!plantillasDatos) return [];
    var categoria = categoriaDe(a);
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    return Plantillas.deTipo(plantillasDatos, categoria, tipo);
  }

  /* ---------- lo que usa js/seneca-cuadro.js y js/correo-cuadro.js ----------

     Los dos cuadros viven aparte, pero comparten con este la forma de
     sacar el asunto, el cuerpo (con su plantilla) y el "a quién", y el
     rastro que se apunta en las notas del asunto. Se expone tal cual,
     sin copiar nada de esto en ninguno de los dos ficheros. */
  /* Las dos opciones del menú "Comunicar" (Correo electrónico / Mensaje
     de Séneca), reutilizadas tal cual por el botón "Pedir lo que falta"
     de un hito (js/hitos-requisitos.js, fila 59): `extra` es lo mismo
     que recibe abrirCuadro, con `loQueFalta` cuando toca. */
  function opcionesComunicar(a, extra) {
    return [
      { texto: 'Correo electrónico', alPulsar: function () { abrirCuadro(a, false, extra); } },
      { texto: 'Mensaje de Séneca', alPulsar: function () { abrirCuadro(a, true, extra); } }
    ];
  }

  window.CorreoNucleo = {
    categoriaDe: categoriaDe,
    terceroDe: terceroDe,
    soloElNombre: soloElNombre,
    aQuien: aQuien,
    asuntoDelCorreo: asuntoDelCorreo,
    plantillasDelTipo: plantillasDelTipo,
    cuerpoDelMedio: cuerpoDelMedio,
    apuntarElRastro: apuntarElRastro,
    MAXIMO_LETRAS_SENECA: MAXIMO_LETRAS_SENECA,
    /* Abrir un cuadro directamente, sin pasar por el menú "Comunicar":
       lo usa js/hitos-comunicar.js (fila 60) cuando el paso del hito
       solo tiene texto para un canal. */
    abrirCuadro: abrirCuadro,
    /* La dirección que haya propuesto un hito para este cuadro (fila
       60), si la hay: js/correo-cuadro.js la usa igual que ya usaba la
       de "Lo pide" (LoPide.correoDe). */
    destinatarioPreferente: function () { return correoPreferenteActual; },
    textoDeComunicarHito: textoDeComunicarHito,
    sufijoDocumentos: sufijoDocumentos,
    /* Monta sobre `boton` el mismo menú pequeño "Comunicar" (Correo /
       Séneca) que lleva la cabecera de la ficha, sin duplicar ese
       camino (fila 59, sección 7 del encargo). */
    montarBotonComunicar: function (boton, a, extra) {
      if (window.FichaMenus) FichaMenus.montar(boton, opcionesComunicar(a, extra));
    }
  };

  /* ---------- los botones dentro de la ficha del asunto ---------- */

  (function () {
    var actual = null;

    var nueva = U.envolver(App, 'App.abrirFicha', 'correo.js', function (comoEra) {
      return function (a, modo) {
        actual = a;
        modoDelAsunto = modo || 'abierto';
        comoEra(a, modo);
        poner();
      };
    });
    if (!nueva) return;

    /* "Correo" y "Mensaje Séneca" se juntan en un solo botón,
       "Comunicar" (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md,
       9): mismo menú pequeño que los tres puntos del nombre
       (js/ficha-menus.js). Entra ANTES del botón de Archivar/Reabrir
       (`.boton-principal`, siempre el último de la barra): este
       fichero pinta por su cuenta, en un `MutationObserver` que puede
       saltar después de que js/ficha-asunto.js ya haya puesto ese
       botón, así que no basta con `appendChild`. */
    function poner() {
      if (!actual) return;
      var caja = $('ficha-acciones');
      if (!caja || caja.querySelector('.boton-comunicar')) return;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-comunicar';
      b.textContent = 'Comunicar';
      b.title = 'Escribir un correo o un mensaje de Séneca de este asunto';

      var principal = caja.querySelector('.boton-principal');
      if (principal) caja.insertBefore(b, principal); else caja.appendChild(b);

      FichaMenus.montar(b, opcionesComunicar(actual));
    }

    var pantalla = $('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { poner(); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

})();
