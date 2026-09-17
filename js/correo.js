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

  var viendo = null;         /* el asunto que se está mirando */
  var modoDelAsunto = 'abierto';
  var elegidos = {};         /* qué correos van marcados */
  var cco = {};              /* direcciones en copia oculta, de los grupos (fila 21, 17-sep-2026) */
  var ccoSinCorreo = [];     /* nombres de miembros de un grupo sin ningún correo */
  var asuntoLargo = true;    /* true: nombre de la carpeta; false: versión legible */
  var yaApuntado = false;    /* la nota se escribe una vez por cuadro, no una por botón */
  var porSeneca = false;     /* true: el cuadro es el de la mensajería de Séneca */
  var personaActual = null;  /* la ficha del tercero, ya buscada en los CSV */
  var pasoSeneca = 0;        /* 0 el asunto, 1 el texto, 2 hecho */
  var algoCambiado = false;  /* al cerrar, la ficha se repinta si se ha tocado algo */
  var documentosAdjuntados = [];  /* los que ha llevado el último borrador preparado */

  var plantillasDatos = null;   /* _GESTOR/plantillas.json, ya leído */
  var valoresActuales = null;   /* Plantillas.valoresDeAsunto(a), calculado una vez por apertura
                                    (fila 17 de la cola: es la fuente única de los huecos, para
                                    que un documento de Word y un correo lean de un solo sitio) */
  var plantillaElegida = '';    /* el id de la elegida en el desplegable, o '' (Sin plantilla) */
  var textoProgramado = '';     /* lo último que ha escrito el propio cuadro, para saber si se ha tocado a mano */
  var MAXIMO_LETRAS_SENECA = 4000;

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
    var plantilla = idPlantilla && plantillasDatos
      ? plantillasDatos.lista.filter(function (p) { return p.id === idPlantilla; })[0]
      : null;
    if (plantilla) {
      var r = Plantillas.rellenar(plantilla.texto, valoresActuales || {});
      medio = r.texto;
      faltan = r.faltan;
    }

    var firma = textoDeLaFirma();
    var texto = medio ? (saludo + '\n\n' + medio + '\n\n' + firma) : (saludo + '\n\n\n\n' + firma);
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

  function ccoDelCuadro() {
    return Object.keys(cco).join(', ');
  }

  /* ---------- los grupos, para la copia oculta ----------

     17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md. Decisión de
     Francisco: los destinatarios que vienen de un grupo van SIEMPRE en
     copia oculta, nunca en Para, para que una familia no vea el correo
     de las demás. */

  /* De cada miembro se sacan TODOS los correos que tenga (un alumno
     puede traer el de los dos tutores); sin efectos, se puede probar
     sola. `persona` ya viene resuelta (o null si no se ha encontrado). */
  function combinarCorreosDeGrupo(miembrosConPersona) {
    var direcciones = [], vistos = {}, sinCorreo = [];
    miembrosConPersona.forEach(function (m) {
      var correos = correosDe(m.persona);
      if (!correos.length) { sinCorreo.push(m.nombre); return; }
      correos.forEach(function (c) {
        var clave = c.dir.toLowerCase();
        if (vistos[clave]) return;
        vistos[clave] = true;
        direcciones.push(c.dir);
      });
    });
    return { direcciones: direcciones, sinCorreo: sinCorreo };
  }

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

  function contenidoCco() {
    var direcciones = Object.keys(cco);
    if (!direcciones.length && !ccoSinCorreo.length) return '';
    return (direcciones.length
      ? '<label class="etiqueta">Copia oculta <span class="suave">(' + direcciones.length + ')</span></label>' +
        '<div class="marcados-lista">' + direcciones.map(function (d) {
          return '<span class="marcado-chip">' + U.escapar(d) +
            '<button type="button" class="cco-quitar" data-dir="' + U.escapar(d) + '" ' +
            'title="Quitarlo de la copia oculta">×</button></span>';
        }).join('') + '</div>'
      : '') +
      (ccoSinCorreo.length
        ? '<p class="nota aviso-en-linea">' + ccoSinCorreo.length +
          (ccoSinCorreo.length === 1 ? ' no tiene correo: ' : ' no tienen correo: ') +
          U.escapar(ccoSinCorreo.join(', ')) + '</p>'
        : '');
  }

  function engancharCco() {
    Array.prototype.forEach.call(document.querySelectorAll('.cco-quitar'), function (b) {
      b.onclick = function () { delete cco[b.dataset.dir]; refrescarCco(); };
    });
  }

  function refrescarCco() {
    var caja = $('correo-cco-caja');
    if (!caja) return;
    caja.innerHTML = contenidoCco();
    engancharCco();
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
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '') +
      '&su=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value);
    window.open(url, '_blank');
  }

  function abrirDelOrdenador() {
    var url = 'mailto:' + encodeURIComponent(paraDelCuadro()) +
      '?subject=' + encodeURIComponent($('correo-asunto').value) +
      '&body=' + encodeURIComponent($('correo-cuerpo-texto').value) +
      (ccoDelCuadro() ? '&bcc=' + encodeURIComponent(ccoDelCuadro()) : '');
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
    var base = 'Correo ' + (para ? 'a ' + para : 'preparado') + cola;
    var direccionesCco = Object.keys(cco);
    if (direccionesCco.length) {
      base += ' · en copia oculta a ' + direccionesCco.length +
        (direccionesCco.length === 1 ? ' persona' : ' personas');
    }
    if (documentosAdjuntados.length) {
      base += ' · con ' + documentosAdjuntados.length +
        ' documento' + (documentosAdjuntados.length === 1 ? '' : 's') +
        ': ' + documentosAdjuntados.join(', ');
    }
    return base;
  }

  /* A quién se le va a escribir, dicho en palabras. En Séneca no hay
     direcciones que enseñar: lo que ayuda es acordarse de a quién hay
     que marcar en su lista. Si el asunto trae "Lo pide" (17-sep-2026,
     fila 28), manda ese nombre: es a quien hay que contestar, y puede
     no ser el propio interesado. */
  function aQuien(a) {
    var deLoPide = window.LoPide && a && a.ficha && a.ficha.loPide && a.ficha.loPide.nombre;
    if (deLoPide) return deLoPide;
    var categoria = categoriaDe(a);
    var nombre = soloElNombre(terceroDe(a));
    if (!nombre) return '';
    if (categoria === 'ALUMNADO') return 'los tutores legales de ' + nombre;
    return nombre;
  }

  /* La línea gris de "Lo pidió...", encima de la lista de "Para"
     (docs/LO-PIDE.md, 6). Cadena vacía en Séneca (no hay lista de
     "Para" ahí) o si el asunto no tiene el dato. */
  function avisoLoPideHtml(a) {
    if (porSeneca || !window.LoPide) return '';
    var d = a.ficha && a.ficha.loPide;
    if (!d || !d.nombre) return '';
    var texto = 'Lo pidió ' + d.nombre + (d.relacion ? ' (' + d.relacion + ')' : '') +
      (d.fecha ? ', el ' + U.fechaLegible(U.aAaMmDd(d.fecha)) : '') + '.';
    return '<p class="nota" style="margin-top:0">' + U.escapar(texto) + '</p>';
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
    cco = {};
    ccoSinCorreo = [];
    porSeneca = !!deSeneca;
    pasoSeneca = 0;
    if (window.SenecaDestinatarios) SenecaDestinatarios.limpiar();
    asuntoLargo = !porSeneca;   /* en Séneca manda la versión legible: el nombre de la carpeta no cabe */
    yaApuntado = false;
    algoCambiado = false;
    documentosAdjuntados = [];
    plantillaElegida = '';
    var esperar = U.preguntar(porSeneca ? 'Mensaje por Séneca' : 'Correo de este asunto',
      '<div id="correo-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var persona = null;
    try { persona = await buscarPersona(a); } catch (e) { persona = null; }
    personaActual = persona;
    try { plantillasDatos = await Plantillas.cargar(App.E.gestor); } catch (e) { plantillasDatos = null; }
    try { valoresActuales = await Plantillas.valoresDeAsunto(a); } catch (e) { valoresActuales = null; }
    await pintarCuadro(a, persona);
    await esperar;
    /* Si se ha apuntado la nota o cambiado el estado, la ficha que hay
       detrás se ha quedado vieja: se vuelve a abrir. */
    if (algoCambiado) App.abrirFicha(a, modoDelAsunto);
  }

  async function pintarCuadro(a, persona) {
    var caja = $('correo-caja');
    if (!caja) return;
    var correos = correosDe(persona);

    /* De partida van marcados todos (en el alumnado el correo suele ir
       a los dos tutores), salvo que el asunto diga quién lo pide y se
       le conozca el correo: entonces manda ese, solo (docs/LO-PIDE.md,
       6). La decisión, pura, vive en LoPide.elegirDestinatarios. */
    var correoLoPide = (!porSeneca && window.LoPide) ? LoPide.correoDe(a.ficha) : '';
    var otroInicial = '';
    if (window.LoPide) {
      var resultado = LoPide.elegirDestinatarios(correos, correoLoPide, elegidos);
      elegidos = resultado.elegidos;
      otroInicial = resultado.otro;
    } else {
      correos.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });
    }

    /* Los documentos del asunto no van en el cuadro de Séneca: allí no
       hay adjuntos. El desplegable "Añadir un grupo" sí va en los dos
       cuadros (fila 47, docs/DESTINATARIOS-EN-SENECA.md): en Correo
       saca correos, en Séneca usuarios IdEA. */
    var bloqueAdjuntos = '';
    var opcionesGrupo = '';
    if (!porSeneca && window.CorreoAdjuntos) {
      try { bloqueAdjuntos = await CorreoAdjuntos.pintarBloque(a); } catch (e) { bloqueAdjuntos = ''; }
    }
    try { opcionesGrupo = await opcionesDeGrupo(); } catch (e) { opcionesGrupo = ''; }

    caja.innerHTML = porSeneca
      ? cuerpoDeSeneca(a, opcionesGrupo)
      : cuerpoDeCorreo(a, correos, bloqueAdjuntos, opcionesGrupo, otroInicial);

    if (porSeneca) {
      engancharComunes(a);
      engancharSeneca(a);
      if (window.SenecaDestinatarios) SenecaDestinatarios.enganchar();
      if (window.SenecaAyudante) SenecaAyudante.insertarEnlace($('seneca-ayudante'));
      return;
    }
    engancharComunes(a);
    engancharCorreo(a);
    if (bloqueAdjuntos && window.CorreoAdjuntos) {
      CorreoAdjuntos.enganchar(a, function (nombres) {
        documentosAdjuntados = nombres;
        apuntarElRastro(a);
      });
    }
  }

  /* ---------- el cuadro del correo ---------- */

  function cuerpoDeCorreo(a, correos, bloqueAdjuntos, opcionesGrupo, otroInicial) {
    return avisoLoPideHtml(a) +
      '<label class="etiqueta" style="margin-top:0">Para</label>' +
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
      '<input id="correo-otro" class="campo" value="' + U.escapar(otroInicial || '') + '" ' +
        'placeholder="Otro correo, si hace falta" style="margin-top:8px">' +

      (opcionesGrupo
        ? '<label class="etiqueta">Añadir un grupo</label>' +
          '<select id="correo-grupo" class="campo"><option value="">Elige…</option>' +
            opcionesGrupo + '</select>'
        : '') +
      '<div id="correo-cco-caja">' + contenidoCco() + '</div>' +

      camposComunes(a) +

      (bloqueAdjuntos || '') +

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

  function cuerpoDeSeneca(a, opcionesGrupo) {
    var quien = aQuien(a);
    return '<div class="aviso aviso-ambar" style="margin:0 0 4px">' +
             '<strong>En Séneca: Utilidades → Comunicaciones.</strong>' +
             '<p>Los destinatarios se marcan allí, en su lista' +
             (quien ? ': <strong>' + U.escapar(quien) + '</strong>' : '') + '.</p>' +
           '</div>' +
           (window.SenecaDestinatarios ? SenecaDestinatarios.bloqueHtml(opcionesGrupo) : '') +
           camposComunes(a) +
           '<div class="correo-botones" style="margin-top:14px">' +
             '<button type="button" class="boton boton-principal" id="seneca-paso" ' +
               'style="flex:1">1. Copiar el asunto</button>' +
           '</div>' +
           '<p class="nota" id="seneca-explica">Pulsa, pega en Séneca, y vuelve a pulsar para el texto.</p>' +
           '<div id="seneca-ayudante" style="margin-top:14px"></div>';
  }

  /* Las plantillas del tipo de este asunto. Con una sola, es la que
     sale puesta; con ninguna, el desplegable no se pinta. */
  function plantillasDelTipo(a) {
    if (!plantillasDatos) return [];
    var categoria = categoriaDe(a);
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    return Plantillas.deTipo(plantillasDatos, categoria, tipo);
  }

  /* Los dos campos que comparten los dos cuadros, con el desplegable
     de plantilla encima del cuerpo. Va en su propio contenedor para
     poder repintarse solo, sin tocar el resto del cuadro (el "Para",
     los documentos…), cuando se cambia de plantilla. */
  function camposComunes(a) {
    return '<div id="correo-comunes">' + interiorDeComunes(a) + '</div>';
  }

  function interiorDeComunes(a) {
    var opciones = plantillasDelTipo(a);
    /* Con una plantilla, sale puesta; con varias, sale la primera y el
       desplegable deja cambiar. */
    if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;
    if (plantillaElegida && !opciones.some(function (p) { return p.id === plantillaElegida; })) {
      plantillaElegida = '';
    }

    var cuerpo = cuerpoDelMedio(a, plantillaElegida);
    textoProgramado = cuerpo.texto;

    var desplegable = opciones.length
      ? '<label class="etiqueta">Plantilla</label>' +
        '<select id="correo-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<div id="correo-plantilla-confirmar" class="oculto"></div>'
      : '';

    return '<label class="etiqueta">Asunto</label>' +
      '<input id="correo-asunto" class="campo" value="' + U.escapar(asuntoDelCorreo(a)) + '">' +
      '<div class="correo-botones" style="margin-top:6px">' +
        '<button type="button" class="boton" id="correo-nombre-carpeta">Nombre de la carpeta</button>' +
        '<button type="button" class="boton" id="correo-legible">Versión legible</button>' +
      '</div>' +

      desplegable +

      '<label class="etiqueta">' + (porSeneca ? 'Texto del mensaje' : 'Cuerpo') + '</label>' +
      (cuerpo.faltan.length
        ? '<p class="aviso aviso-ambar" id="correo-faltan-datos">Faltan datos: ' +
          U.escapar(cuerpo.faltan.join(', ')) + '</p>'
        : '') +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' + U.escapar(cuerpo.texto) + '</textarea>';
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

    var desplegable = $('correo-plantilla');
    if (!desplegable) return;

    /* Cambiar de plantilla reescribe el cuadro entero de "Documentos
       de este asunto" para abajo no, solo #correo-comunes: no hay
       segundo cuadro de diálogo (solo hay uno, #capa, y ya está
       ocupado por este), así que la confirmación de "se pierde lo
       escrito" va en línea, dentro del propio cuadro. */
    desplegable.onchange = function () {
      var elegida = this.value;
      var escritoAMano = $('correo-cuerpo-texto').value !== textoProgramado;
      if (!escritoAMano) { cambiarDePlantilla(a, elegida); return; }

      var caja2 = $('correo-plantilla-confirmar');
      caja2.className = 'aviso aviso-ambar';
      caja2.innerHTML = '<p>Lo que hay escrito en el cuerpo se perderá.</p>';
      var seguir = document.createElement('button');
      seguir.type = 'button';
      seguir.className = 'boton boton-principal';
      seguir.textContent = 'Cambiar de todas formas';
      seguir.onclick = function () { cambiarDePlantilla(a, elegida); };
      var cancelar = document.createElement('button');
      cancelar.type = 'button';
      cancelar.className = 'boton';
      cancelar.textContent = 'Seguir con lo escrito';
      cancelar.style.marginLeft = '8px';
      cancelar.onclick = function () {
        desplegable.value = plantillaElegida;
        caja2.className = 'oculto';
        caja2.innerHTML = '';
      };
      caja2.appendChild(seguir);
      caja2.appendChild(cancelar);
    };
  }

  function cambiarDePlantilla(a, idElegida) {
    plantillaElegida = idElegida;
    $('correo-comunes').innerHTML = interiorDeComunes(a);
    engancharComunes(a);
  }

  function engancharCorreo(a) {
    engancharCco();
    var selectorGrupo = $('correo-grupo');
    if (selectorGrupo) {
      selectorGrupo.onchange = async function () {
        var valor = selectorGrupo.value;
        selectorGrupo.value = '';
        if (!valor) return;
        var miembros;
        try { miembros = await miembrosDeOpcionDeGrupo(valor); } catch (e) { miembros = []; }
        if (!miembros.length) return;
        var resueltos = await resolverMiembros(miembros);
        var resultado = combinarCorreosDeGrupo(resueltos);
        resultado.direcciones.forEach(function (d) { cco[d] = true; });
        resultado.sinCorreo.forEach(function (n) {
          if (ccoSinCorreo.indexOf(n) === -1) ccoSinCorreo.push(n);
        });
        refrescarCco();
      };
    }

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
        var texto = $('correo-cuerpo-texto').value;
        var recortado = texto.length > MAXIMO_LETRAS_SENECA;
        if (recortado) texto = texto.slice(0, MAXIMO_LETRAS_SENECA);
        copiarTexto(texto);
        pasoSeneca = 2;
        b.textContent = 'Copiado. Pégalo y envía';
        b.classList.remove('boton-principal');
        explica.textContent = 'Texto copiado' + (recortado ? ', recortado a 4.000 letras' : '') +
          '. Pégalo en Séneca y envía el mensaje.';
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
