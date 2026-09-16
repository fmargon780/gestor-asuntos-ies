/* ============================================================
   correo.js — el correo de un asunto, con los campos ya escritos.

   La aplicación no manda nada. Lo que hace es preparar las tres
   piezas de un correo —a quién va, el asunto y el cuerpo— sacándolas
   del propio asunto y de los ficheros de Séneca, y dejarlas listas
   para pegar o para abrir la ventana de redactar de Gmail.

     - PARA: los correos que trae el fichero del tercero. En el
       alumnado son los de los tutores legales, y salen con casilla
       para elegir a quién se le escribe.
     - ASUNTO: el nombre de la carpeta, que es la norma del centro,
       o una versión legible. Con un botón se cambia de uno a otro.
     - CUERPO: el saludo y la despedida hechos; el medio, en blanco.

   Los documentos del asunto tampoco se pueden enganchar desde aquí:
   Gmail no lo permite. Debajo del cuerpo sale el bloque de
   js/correo-adjuntos.js, que los enseña con casilla y encarga el
   borrador con todo adjuntado por la carpeta GESTOR-BANDEJA.

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
   ============================================================ */
(function () {

  /* Solo como último recurso, si por lo que sea js/plantillas.js no ha
     cargado: lo de siempre, tal cual estaba antes de las plantillas. */
  var CENTRO_POR_DEFECTO = 'IES Fuente Lucena';

  var viendo = null;         /* el asunto que se está mirando */
  var modoDelAsunto = 'abierto';
  var elegidos = {};         /* qué correos van marcados */
  var asuntoLargo = true;    /* true: nombre de la carpeta; false: versión legible */
  var yaApuntado = false;    /* la nota se escribe una vez por cuadro, no una por botón */
  var porSeneca = false;     /* true: el cuadro es el de la mensajería de Séneca */
  var personaActual = null;  /* la ficha del tercero, ya buscada en los CSV */
  var pasoSeneca = 0;        /* 0 el asunto, 1 el texto, 2 hecho */
  var algoCambiado = false;  /* al cerrar, la ficha se repinta si se ha tocado algo */

  /* ---------- plantillas de correo (docs/PLANTILLAS-DE-CORREO.md) ----------

     Se cargan una vez por apertura del cuadro, igual que `personaActual`.
     `plantillaId` es la que está elegida en el desplegable ('' es "Sin
     plantilla"). `cuerpoGeneradoPorCodigo` guarda el último texto que ha
     puesto el propio código: si al cambiar de plantilla el cuadro no
     coincide con eso, es que se ha escrito algo a mano, y hay que
     preguntar antes de pisarlo. */
  var plantillasDatos = null;    /* { firma, centro, lista }, de Plantillas.cargar */
  var plantillasDelTipo = [];    /* las plantillas del tipo/categoría de este asunto */
  var plantillaId = '';
  var cuerpoGeneradoPorCodigo = '';

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

  function tipoDe(a) {
    var f = a.ficha || {}, l = a.leido || {};
    return l.tipo || f.tipo || '';
  }

  /* Los campos propios del asunto (los de js/campos.js), como
     nombre -> valor, para que Plantillas.rellenar pueda resolver
     {campo:LO QUE SEA}. Es lo mismo que hace `filasDeCampos` en
     js/ficha-asunto.js, pero como objeto en vez de para pintar. */
  function camposDelAsunto(a) {
    if (!window.Campos) return {};
    var guardados = (a.ficha && a.ficha.campos) || {};
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipoDe(a)]) || [];
    var salida = {};
    config.forEach(function (cfg) {
      var g = guardados[Campos.claveDeCampo(cfg)];
      if (g && g.valor) salida[Campos.nombreDeCampo(cfg, App.E.campos)] = g.valor;
    });
    return salida;
  }

  /* Los valores para rellenar los huecos de una plantilla o de la
     firma (docs/PLANTILLAS-DE-CORREO.md, 2.2). */
  function valoresDePlantilla(a) {
    var f = a.ficha || {};
    var p = piezasDelNombre(a);
    return {
      nombre: soloElNombre(terceroDe(a)),
      grupo: p.grupo,
      curso: p.curso,
      tipo: tipoDe(a),
      hoy: U.fechaLegible(U.aAaMmDd(U.hoyIso())),
      limite: f.limite ? U.fechaLegible(U.aAaMmDd(f.limite)) : '',
      usuario: App.E.usuario || '',
      centro: (plantillasDatos && plantillasDatos.centro) || CENTRO_POR_DEFECTO,
      campos: camposDelAsunto(a)
    };
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

  /* Todas las direcciones que haya en la ficha de esa persona, vengan en
     la columna que vengan. Se buscan por la arroba, no por el título de
     la columna: Séneca las llama de maneras distintas según el informe. */
  function correosDe(persona) {
    var salida = [], vistos = {};
    if (!persona) return salida;
    Object.keys(persona.campos || {}).forEach(function (columna) {
      var trozos = String(persona.campos[columna] || '')
        .match(/[^\s,;<>()"]+@[^\s,;<>()"]+\.[A-Za-z]{2,}/g);
      if (!trozos) return;
      trozos.forEach(function (dir) {
        var clave = dir.toLowerCase();
        if (vistos[clave]) return;
        vistos[clave] = true;
        salida.push({ titulo: columna, dir: dir });
      });
    });
    return salida;
  }

  /* ---------- los tres campos ---------- */

  /* El grupo y el año académico salen de la ficha del asunto. Si la
     carpeta se creó a mano no hay ficha, así que se sacan del propio
     nombre, que es donde van escritos. */
  function piezasDelNombre(a) {
    var f = a.ficha || {}, l = a.leido || {};
    var resto = String(l.resto || '');
    var curso = f.curso || (resto.match(/\b(\d{2}[-\/]\d{2})\b/) || [])[1] || '';
    var grupo = f.grupo || (resto.match(/\b(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\b/i) || [])[1] || '';
    return { curso: curso, grupo: grupo };
  }

  function asuntoDelCorreo(a) {
    if (asuntoLargo) return a.nombre;
    var f = a.ficha || {}, l = a.leido || {};
    var p = piezasDelNombre(a);
    var trozos = [
      l.tipo || f.tipo || '',
      soloElNombre(terceroDe(a)),
      p.grupo,
      p.curso ? 'curso ' + p.curso : ''
    ];
    return trozos.filter(Boolean).join('  ·  ');
  }

  /* El cuerpo del correo (o del mensaje de Séneca, que comparte el
     mismo texto): el saludo, el medio y la firma. `idPlantilla` es la
     plantilla elegida en el desplegable ('' es "Sin plantilla"); se
     recibe aparte, y no se lee de `plantillaId`, para poder calcular
     "cómo quedaría" con otra plantilla sin tocar todavía la elegida
     de verdad (lo usa `cambiarPlantilla`, antes de preguntar).

     Si el tipo no tiene ninguna plantilla, o se ha elegido "Sin
     plantilla", el medio se queda en blanco, exactamente como antes
     de docs/PLANTILLAS-DE-CORREO.md. La firma, en cambio, sale
     siempre de `plantillas.json` (o de lo de siempre, si el fichero
     no existe todavía: `Plantillas.cargar` ya lo resuelve). */
  function cuerpoDelCorreo(a, idPlantilla) {
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

    if (!window.Plantillas) {
      /* Nunca debería pasar (index.html carga plantillas.js antes que
         correo.js), pero si pasara, que no rompa el cuadro. */
      var firmaVieja = ['Un saludo.', App.E.usuario || '', CENTRO_POR_DEFECTO].filter(Boolean).join('\n');
      return { texto: saludo + '\n\n\n\n' + firmaVieja, faltan: [] };
    }

    var valores = valoresDePlantilla(a);
    var faltan = [];
    var medio = '';
    var plantilla = plantillasDelTipo.filter(function (p) { return p.id === idPlantilla; })[0];
    if (plantilla) {
      var rMedio = Plantillas.rellenar(plantilla.texto, valores);
      medio = rMedio.texto;
      faltan = faltan.concat(rMedio.faltan);
    }

    var firmaPlantilla = (plantillasDatos && plantillasDatos.firma) || Plantillas.POR_DEFECTO_FIRMA;
    var rFirma = Plantillas.rellenar(firmaPlantilla, valores);
    faltan = faltan.concat(rFirma.faltan);

    var texto = plantilla
      ? saludo + '\n\n' + medio + '\n\n' + rFirma.texto
      : saludo + '\n\n\n\n' + rFirma.texto;

    var vistos = {};
    faltan = faltan.filter(function (x) { return x && !vistos[x] && (vistos[x] = true); });

    return { texto: texto, faltan: faltan };
  }

  function paraDelCuadro() {
    var lista = [];
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) {
      if (c.checked) lista.push(c.value);
    });
    var otro = $('correo-otro') ? $('correo-otro').value.trim() : '';
    if (otro) lista.push(otro);
    return lista.join(', ');
  }

  /* ---------- copiar y abrir ---------- */

  function copiar(texto, boton) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    var antes = boton.textContent;
    function bien() {
      boton.textContent = 'Copiado';
      setTimeout(function () { boton.textContent = antes; }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(bien).catch(function () {
        U.aviso('No he podido copiarlo.', 'malo');
      });
    } else {
      U.aviso('Este navegador no deja copiar solo.', 'malo');
    }
  }

  function abrirGmail() {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(paraDelCuadro()) +
      '&su=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.open(url, '_blank');
  }

  function abrirDelOrdenador() {
    var url = 'mailto:' + encodeURIComponent(paraDelCuadro()) +
      '?subject=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.location.href = url;
  }

  /* ---------- el rastro que queda en el asunto ----------

     Se escribe una sola vez por cada vez que se abre el cuadro: da
     igual que se copie el cuerpo y además se abra Gmail. En un asunto
     archivado no se escribe nada, porque sus notas ya no se tocan. */

  function textoDeLaNota() {
    var asunto = $('correo-asunto') ? $('correo-asunto').value : '';
    var cola = asunto ? ' — asunto: "' + asunto + '"' : '';
    if (porSeneca) {
      return 'Mensaje por Séneca a ' + (aQuien(viendo) || 'el tercero') + cola;
    }
    var para = paraDelCuadro();
    return 'Correo ' + (para ? 'a ' + para : 'preparado') + cola + losDocumentos();
  }

  /* Lo que se manda dentro del correo, cuando va algo. Sale de
     js/correo-adjuntos.js, que es quien lleva las casillas. */
  function losDocumentos() {
    if (porSeneca || !window.Envios) return '';
    var nombres = [];
    try { nombres = window.Envios.marcados(); } catch (e) { nombres = []; }
    if (!nombres.length) return '';
    return ' · con ' + nombres.length + ' documento' + (nombres.length === 1 ? '' : 's') +
           ': ' + nombres.join(', ');
  }

  /* A quién se le va a escribir, dicho en palabras. En Séneca no hay
     direcciones que enseñar: lo que ayuda es acordarse de a quién hay
     que marcar en su lista. */
  function aQuien(a) {
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
      await window.Notas.anadir(a, textoDeLaNota());
      algoCambiado = true;
      pintarRastro(a, 'Apuntado en las notas del asunto.');
    } catch (e) {
      pintarRastro(a, 'No he podido apuntarlo en el asunto: ' + e.message);
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
        U.aviso('No he podido cambiar el estado: ' + e.message, 'malo');
      }
    };
    sitio.appendChild(b);
  }

  /* ---------- el cuadro ---------- */

  async function abrirCuadro(a, deSeneca) {
    viendo = a;
    elegidos = {};
    porSeneca = !!deSeneca;
    pasoSeneca = 0;
    asuntoLargo = !porSeneca;   /* en Séneca manda la versión legible: el nombre de la carpeta no cabe */
    yaApuntado = false;
    algoCambiado = false;
    var esperar = U.preguntar(porSeneca ? 'Mensaje por Séneca' : 'Correo de este asunto',
      '<div id="correo-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var persona = null;
    try { persona = await buscarPersona(a); } catch (e) { persona = null; }
    personaActual = persona;

    plantillasDatos = null;
    try { if (window.Plantillas) plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { plantillasDatos = null; }
    plantillasDelTipo = (window.Plantillas && plantillasDatos)
      ? Plantillas.deTipo(plantillasDatos, categoriaDe(a), tipoDe(a)) : [];
    plantillaId = plantillasDelTipo.length ? plantillasDelTipo[0].id : '';

    pintarCuadro(a, persona);
    await esperar;
    /* Si se ha apuntado la nota o cambiado el estado, la ficha que hay
       detrás se ha quedado vieja: se vuelve a abrir. */
    if (algoCambiado) App.abrirFicha(a, modoDelAsunto);
  }

  function pintarCuadro(a, persona) {
    var caja = $('correo-caja');
    if (!caja) return;
    var correos = correosDe(persona);
    /* De partida van marcados todos: en el alumnado el correo suele ir a
       los dos tutores. Quitar una casilla es más rápido que ponerla. */
    correos.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });

    caja.innerHTML = porSeneca ? cuerpoDeSeneca(a) : cuerpoDeCorreo(a, correos);

    if (porSeneca) {
      engancharComunes(a);
      engancharSeneca(a);
      return;
    }
    engancharComunes(a);
    engancharCorreo(a);
  }

  /* ---------- el cuadro del correo ---------- */

  function cuerpoDeCorreo(a, correos) {
    return '<label class="etiqueta" style="margin-top:0">Para</label>' +
      (correos.length
        ? '<div id="correo-lista">' + correos.map(function (c) {
            return '<label class="correo-fila">' +
                     '<input type="checkbox" class="correo-marca" value="' + U.escapar(c.dir) + '"' +
                       (elegidos[c.dir] ? ' checked' : '') + '>' +
                     '<span><strong>' + U.escapar(c.dir) + '</strong>' +
                     '<span class="suave"> · ' + U.escapar(c.titulo) + '</span></span>' +
                   '</label>';
          }).join('') + '</div>'
        : '<p class="nota" style="margin-top:0">' +
          (personaActual
            ? 'En el fichero de Séneca no hay ningún correo de ' + U.escapar(terceroDe(a)) + '.'
            : 'No he encontrado a ' + U.escapar(terceroDe(a)) + ' en los ficheros de datos.') +
          ' Escríbelo aquí abajo.</p>') +
      '<input id="correo-otro" class="campo" placeholder="Otro correo, si hace falta" ' +
        'style="margin-top:8px">' +

      camposComunes(a) +

      /* Los documentos del asunto, con casilla, y el botón que deja el
         encargo del borrador en la bandeja (js/correo-adjuntos.js).
         Solo aquí: en el cuadro de Séneca no hay adjuntos. */
      '<div id="correo-adjuntos"></div>' +

      '<div class="correo-botones" style="margin-top:14px">' +
        '<button type="button" class="boton" id="correo-copiar-para">Copiar Para</button>' +
        '<button type="button" class="boton" id="correo-copiar-asunto">Copiar Asunto</button>' +
        '<button type="button" class="boton" id="correo-copiar-cuerpo">Copiar Cuerpo</button>' +
      '</div>' +
      '<div class="correo-botones" style="margin-top:8px">' +
        '<button type="button" class="boton boton-principal" id="correo-gmail">Abrir en Gmail</button>' +
        '<button type="button" class="boton" id="correo-ordenador">Abrir en el correo del ordenador</button>' +
      '</div>' +
      '<p class="nota">Se abre la ventana de redactar con todo puesto. Enviar, lo envías tú.</p>';
  }

  /* ---------- el cuadro de Séneca ----------

     Aquí no hay "Para": en Séneca los destinatarios se marcan en su
     propia lista. Lo que se recuerda es a quién hay que marcar. Y como
     el asunto y el texto son dos casillas distintas, y el portapapeles
     solo guarda una cosa a la vez, hay un solo botón que los va dando
     en el orden en que se pegan. */

  function cuerpoDeSeneca(a) {
    var quien = aQuien(a);
    return '<div class="aviso aviso-ambar" style="margin:0 0 4px">' +
             '<strong>En Séneca: Utilidades → Comunicaciones.</strong>' +
             '<p>Los destinatarios se marcan allí, en su lista' +
             (quien ? ': <strong>' + U.escapar(quien) + '</strong>' : '') + '.</p>' +
           '</div>' +
           camposComunes(a) +
           '<div class="correo-botones" style="margin-top:14px">' +
             '<button type="button" class="boton boton-principal" id="seneca-paso" ' +
               'style="flex:1">1. Copiar el asunto</button>' +
           '</div>' +
           '<p class="nota" id="seneca-explica">Pulsa, pega en Séneca, y vuelve a pulsar para el texto.</p>';
  }

  /* El desplegable "Plantilla" (docs/PLANTILLAS-DE-CORREO.md, 2.3): si
     el tipo no tiene ninguna, no se pinta nada. */
  function desplegableDePlantilla() {
    if (!plantillasDelTipo.length) return '';
    return '<label class="etiqueta">Plantilla</label>' +
      '<select id="correo-plantilla" class="campo">' +
        '<option value="">Sin plantilla</option>' +
        plantillasDelTipo.map(function (p) {
          return '<option value="' + U.escapar(p.id) + '"' + (p.id === plantillaId ? ' selected' : '') + '>' +
                   U.escapar(p.nombre) + '</option>';
        }).join('') +
      '</select>' +
      '<div id="correo-plantilla-confirmar"></div>';
  }

  function htmlDeFaltan(faltan) {
    return '<div id="correo-faltan-datos" class="' + (faltan.length ? 'aviso aviso-ambar' : 'oculto') + '">' +
      (faltan.length ? 'Faltan datos: ' + U.escapar(faltan.join(', ')) : '') +
    '</div>';
  }

  /* Los dos campos que comparten los dos cuadros. */
  function camposComunes(a) {
    var estado = cuerpoDelCorreo(a, plantillaId);
    cuerpoGeneradoPorCodigo = estado.texto;

    return '<label class="etiqueta">Asunto</label>' +
      '<input id="correo-asunto" class="campo" value="' + U.escapar(asuntoDelCorreo(a)) + '">' +
      '<div class="correo-botones" style="margin-top:6px">' +
        '<button type="button" class="boton" id="correo-nombre-carpeta">Nombre de la carpeta</button>' +
        '<button type="button" class="boton" id="correo-legible">Versión legible</button>' +
      '</div>' +

      desplegableDePlantilla() +
      htmlDeFaltan(estado.faltan) +

      '<label class="etiqueta">' + (porSeneca ? 'Texto del mensaje' : 'Cuerpo') + '</label>' +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' +
        U.escapar(estado.texto) + '</textarea>';
  }

  /* ---------- enganchar los botones ---------- */

  function engancharComunes(a) {
    var caja = $('correo-caja');
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-marca'), function (c) {
      c.onchange = function () { elegidos[c.value] = c.checked; };
    });

    function marcarBotonDelAsunto() {
      $('correo-nombre-carpeta').classList.toggle('boton-marcado', asuntoLargo);
      $('correo-legible').classList.toggle('boton-marcado', !asuntoLargo);
    }
    $('correo-nombre-carpeta').onclick = function () {
      asuntoLargo = true; $('correo-asunto').value = asuntoDelCorreo(a); marcarBotonDelAsunto();
    };
    $('correo-legible').onclick = function () {
      asuntoLargo = false; $('correo-asunto').value = asuntoDelCorreo(a); marcarBotonDelAsunto();
    };
    marcarBotonDelAsunto();

    var select = $('correo-plantilla');
    if (select) select.onchange = function () { cambiarPlantilla(a, select); };
  }

  function pintarFaltan(faltan) {
    var sitio = $('correo-faltan-datos');
    if (!sitio) return;
    if (faltan.length) {
      sitio.className = 'aviso aviso-ambar';
      sitio.textContent = 'Faltan datos: ' + faltan.join(', ');
    } else {
      sitio.className = 'oculto';
      sitio.textContent = '';
    }
  }

  /* Deja puesta la plantilla `nuevoId`, con el cuerpo ya calculado en
     `estado` (para no recalcularlo dos veces). */
  function aplicarPlantilla(nuevoId, estado) {
    plantillaId = nuevoId;
    var texto = $('correo-cuerpo-texto');
    if (texto) texto.value = estado.texto;
    cuerpoGeneradoPorCodigo = estado.texto;
    pintarFaltan(estado.faltan);
  }

  /* Al elegir otra plantilla del desplegable. Si lo que hay escrito en
     el cuadro es justo lo que había puesto el código la última vez, se
     cambia sin preguntar: no hay nada que perder. Si no, alguien lo ha
     tocado a mano, y hay que preguntar antes (docs/PLANTILLAS-DE-CORREO.md,
     2.3). Como ya hay un `U.preguntar` abierto con el propio cuadro de
     correo —solo puede haber uno en toda la aplicación—, la pregunta se
     pinta aquí mismo, dentro del cuadro, no en uno nuevo. */
  function cambiarPlantilla(a, select) {
    var nuevoId = select.value;
    var estado = cuerpoDelCorreo(a, nuevoId);
    var cuerpoActual = $('correo-cuerpo-texto') ? $('correo-cuerpo-texto').value : '';
    var confirmar = $('correo-plantilla-confirmar');

    if (cuerpoActual === cuerpoGeneradoPorCodigo) {
      aplicarPlantilla(nuevoId, estado);
      return;
    }
    if (!confirmar) { aplicarPlantilla(nuevoId, estado); return; }

    confirmar.innerHTML =
      '<div class="aviso aviso-ambar" style="margin-top:8px">' +
        '<p>Si cambias de plantilla se perderá lo que has escrito a mano.</p>' +
        '<div class="correo-botones" style="margin-top:6px">' +
          '<button type="button" class="boton" id="correo-plantilla-seguir">Seguir con lo escrito</button>' +
          '<button type="button" class="boton boton-principal" id="correo-plantilla-cambiar">Cambiar de todas formas</button>' +
        '</div>' +
      '</div>';
    $('correo-plantilla-seguir').onclick = function () {
      select.value = plantillaId;
      confirmar.innerHTML = '';
    };
    $('correo-plantilla-cambiar').onclick = function () {
      aplicarPlantilla(nuevoId, estado);
      confirmar.innerHTML = '';
    };
  }

  function engancharCorreo(a) {
    $('correo-copiar-para').onclick = function () { copiar(paraDelCuadro(), this); };
    $('correo-copiar-asunto').onclick = function () { copiar($('correo-asunto').value, this); };

    /* Estos tres son los que quieren decir "esto ya va para fuera", y
       por eso son los que dejan rastro en el asunto. */
    $('correo-copiar-cuerpo').onclick = function () {
      copiar($('correo-cuerpo-texto').value, this);
      apuntarElRastro(a);
    };
    $('correo-gmail').onclick = function () { abrirGmail(); apuntarElRastro(a); };
    $('correo-ordenador').onclick = function () { abrirDelOrdenador(); apuntarElRastro(a); };

    /* El bloque de documentos se pinta solo, desde su propio fichero.
       De aquí se lleva lo que hay escrito en el cuadro en ese momento y
       la manera de dejar el rastro, que es el mismo de siempre. */
    if (window.Envios) {
      window.Envios.pintarBloque({
        caja: $('correo-adjuntos'),
        asunto: a,
        para: paraDelCuadro,
        tema: function () { return $('correo-asunto') ? $('correo-asunto').value : ''; },
        cuerpo: function () { return $('correo-cuerpo-texto') ? $('correo-cuerpo-texto').value : ''; },
        rastro: function () { return apuntarElRastro(a); }
      });
    }
  }

  /* El botón que se va cambiando solo. Un gesto por casilla, que es el
     mínimo que deja el portapapeles. */
  function engancharSeneca(a) {
    var b = $('seneca-paso');
    var explica = $('seneca-explica');
    b.onclick = function () {
      if (pasoSeneca === 0) {
        copiarTexto($('correo-asunto').value);
        pasoSeneca = 1;
        b.textContent = '2. Ahora, copiar el texto';
        explica.textContent = 'Asunto copiado. Pégalo en Séneca y vuelve a pulsar.';
      } else if (pasoSeneca === 1) {
        /* Séneca no admite más de 4.000 letras en el mensaje: se
           recorta al pegarlo, y se avisa (docs/PLANTILLAS-DE-CORREO.md,
           2.3). El texto que se queda escrito en el cuadro no se toca:
           solo se recorta lo que se copia. */
        var TOPE_SENECA = 4000;
        var textoCompleto = $('correo-cuerpo-texto').value;
        var recortado = textoCompleto.length > TOPE_SENECA;
        copiarTexto(recortado ? textoCompleto.slice(0, TOPE_SENECA) : textoCompleto);
        pasoSeneca = 2;
        b.textContent = 'Copiado. Pégalo y envía';
        b.classList.remove('boton-principal');
        explica.textContent = recortado
          ? 'Texto copiado (recortado a 4.000 letras). Pégalo en Séneca y envía el mensaje.'
          : 'Texto copiado. Pégalo en Séneca y envía el mensaje.';
        apuntarElRastro(a);
      } else {
        pasoSeneca = 0;
        b.textContent = '1. Copiar el asunto';
        b.classList.add('boton-principal');
        explica.textContent = 'Pulsa, pega en Séneca, y vuelve a pulsar para el texto.';
      }
    };
  }

  /* Copiar sin tocar el botón: el de Séneca cambia de texto por su cuenta. */
  function copiarTexto(texto) {
    if (!texto) { U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).catch(function () {
        U.aviso('No he podido copiarlo.', 'malo');
      });
    }
  }

  /* ---------- los botones dentro de la ficha del asunto ---------- */

  (function () {
    var comoEra = App.abrirFicha;
    if (typeof comoEra !== 'function') return;
    var actual = null;

    App.abrirFicha = function (a, modo) {
      actual = a;
      modoDelAsunto = modo || 'abierto';
      comoEra(a, modo);
      poner();
    };

    function poner() {
      if (!actual) return;
      var caja = $('ficha-acciones');
      if (!caja || caja.querySelector('.boton-correo')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-correo';
      b.textContent = 'Correo';
      b.title = 'Preparar el correo de este asunto: a quién va, el asunto y el cuerpo';
      b.onclick = function () { abrirCuadro(actual, false); };
      caja.appendChild(b);

      var s = document.createElement('button');
      s.type = 'button';
      s.className = 'boton boton-seneca';
      s.textContent = 'Mensaje Séneca';
      s.title = 'Preparar el asunto y el texto para la mensajería de Séneca';
      s.onclick = function () { abrirCuadro(actual, true); };
      caja.appendChild(s);
    }

    var pantalla = $('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { poner(); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

})();
