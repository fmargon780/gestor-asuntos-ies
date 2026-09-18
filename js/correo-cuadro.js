/* ============================================================
   correo-cuadro.js — el cuadro de "Correo electrónico" de un asunto
   (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5),
   sacado de js/correo.js (que pasaba de las 800 líneas) para que se
   vea entero, igual que se hizo con Séneca en la fila 53
   (js/seneca-cuadro.js).

   El problema que resolvía la fila era que el cuadro salía muy alto y
   estrecho, y "Documentos de este asunto" (js/correo-adjuntos.js, que
   ya pintaba la lista desplegada, con su casilla y su tamaño) se
   quedaba fuera de la pantalla. Aquí no cambia ningún funcionamiento:
   el borrador se sigue dejando en Gmail o en el correo del ordenador,
   nunca se envía solo. Solo cambia la disposición y de qué fichero
   sale.

   Este fichero pasa a ser dueño de todo lo que solo usa el cuadro de
   Correo: a quién se escribe (`elegidos`), la copia oculta de los
   grupos (`cco`/`ccoSinCorreo`) y qué documentos se han adjuntado por
   última vez. Se reinicia entero cada vez que se llama a `cuerpoHtml`,
   igual que hace `SenecaCuadro.cuerpoHtml` con lo suyo. Lo que
   necesita de js/correo.js —el asunto del mensaje, el cuerpo con su
   plantilla, a quién se escribe en palabras, apuntar el rastro— se usa
   a través de `window.CorreoNucleo` (mismo patrón que ya usaba
   js/seneca-cuadro.js); lo que necesita ESTE fichero al revés —"Para"
   y la copia oculta, para el rastro y para js/correo-adjuntos.js— sale
   en `window.CorreoCuadro`.

   Va después de js/correo.js y de js/correo-adjuntos.js en
   index.html. */
var CorreoCuadro = (function () {

  var elegidos = {};             /* qué correos van marcados */
  var cco = {};                  /* direcciones en copia oculta, de los grupos */
  var ccoSinCorreo = [];         /* nombres de miembros de un grupo sin ningún correo */
  var documentosAdjuntados = []; /* los que ha llevado el último borrador preparado */
  var plantillaElegida = '';
  var textoProgramado = '';

  function $(id) { return document.getElementById(id); }
  function n() { return window.CorreoNucleo || {}; }

  /* ---------- de dónde salen los correos ---------- */

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

  /* ---------- el cuerpo del cuadro, en dos columnas ----------

     18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5: mismo
     patrón que `SenecaCuadro.cuerpoHtml` (fila 53) — ancho hasta
     1100px, y a partir de 900px, dos columnas: a la izquierda
     destinatarios, asunto y los documentos que se adjuntan; a la
     derecha el texto del correo. */
  function cuerpoHtml(a, persona, bloqueAdjuntos, opcionesGrupo) {
    elegidos = {};
    cco = {};
    ccoSinCorreo = [];
    documentosAdjuntados = [];
    plantillaElegida = '';

    var correos = correosDe(persona);
    var correoLoPide = window.LoPide ? LoPide.correoDe(a.ficha) : '';
    var otroInicial = '';
    if (window.LoPide) {
      var resultado = LoPide.elegirDestinatarios(correos, correoLoPide, elegidos);
      elegidos = resultado.elegidos;
      otroInicial = resultado.otro;
    } else {
      correos.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });
    }

    return '<div class="correo-grid">' +
             '<div class="correo-col-izq">' +
               bloqueDestinatarios(a, correos, persona, otroInicial, opcionesGrupo) +
               bloqueAsunto(a) +
               (bloqueAdjuntos || '') +
             '</div>' +
             '<div class="correo-col-der">' +
               '<div id="correo-comunes-der">' + bloqueCuerpo(a) + '</div>' +
             '</div>' +
           '</div>' +
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

  /* La línea gris de "Lo pidió...", encima de la lista de "Para"
     (docs/LO-PIDE.md, 6). */
  function avisoLoPideHtml(a) {
    if (!window.LoPide) return '';
    var d = a.ficha && a.ficha.loPide;
    if (!d || !d.nombre) return '';
    var texto = 'Lo pidió ' + d.nombre + (d.relacion ? ' (' + d.relacion + ')' : '') +
      (d.fecha ? ', el ' + U.fechaLegible(U.aAaMmDd(d.fecha)) : '') + '.';
    return '<p class="nota" style="margin-top:0">' + U.escapar(texto) + '</p>';
  }

  function bloqueDestinatarios(a, correos, persona, otroInicial, opcionesGrupo) {
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
          (persona
            ? 'En el fichero de Séneca no hay ningún correo de ' + U.escapar(n().terceroDe(a)) + '.'
            : 'No he encontrado a ' + U.escapar(n().terceroDe(a)) + ' en los ficheros de datos.') +
          ' Escríbelo aquí abajo.</p>') +
      '<input id="correo-otro" class="campo" value="' + U.escapar(otroInicial || '') + '" ' +
        'placeholder="Otro correo, si hace falta" style="margin-top:8px">' +

      (opcionesGrupo
        ? '<label class="etiqueta">Añadir un grupo</label>' +
          '<select id="correo-grupo" class="campo"><option value="">Elige…</option>' +
            opcionesGrupo + '</select>'
        : '') +
      '<div id="correo-cco-caja">' + contenidoCco() + '</div>';
  }

  /* El asunto del mensaje, siempre el nombre de la carpeta (fila 55,
     18-sep-2026, docs/ASUNTO-SIN-ELECCION.md). */
  function bloqueAsunto(a) {
    return '<label class="etiqueta">Asunto</label>' +
      '<input id="correo-asunto" class="campo" value="' + U.escapar(n().asuntoDelCorreo(a)) + '">';
  }

  /* La plantilla y el cuerpo del correo. */
  function bloqueCuerpo(a) {
    var opciones = (n().plantillasDelTipo && n().plantillasDelTipo(a)) || [];
    if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;
    if (plantillaElegida && !opciones.some(function (p) { return p.id === plantillaElegida; })) {
      plantillaElegida = '';
    }

    var cuerpo = n().cuerpoDelMedio(a, plantillaElegida);
    textoProgramado = cuerpo.texto;

    var desplegable = opciones.length
      ? '<label class="etiqueta" style="margin-top:0">Plantilla</label>' +
        '<select id="correo-plantilla" class="campo">' +
          '<option value="">Sin plantilla</option>' +
          opciones.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === plantillaElegida ? ' selected' : '') + '>' +
              U.escapar(p.nombre) + '</option>';
          }).join('') +
        '</select>' +
        '<div id="correo-plantilla-confirmar" class="oculto"></div>'
      : '';

    return desplegable +
      '<label class="etiqueta"' + (opciones.length ? '' : ' style="margin-top:0"') + '>Cuerpo</label>' +
      (cuerpo.faltan.length
        ? '<p class="aviso aviso-ambar" id="correo-faltan-datos">Faltan datos: ' +
          U.escapar(cuerpo.faltan.join(', ')) + '</p>'
        : '') +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' + U.escapar(cuerpo.texto) + '</textarea>';
  }

  /* ---------- enganchar ---------- */

  function enganchar(a) {
    var caja = $('correo-caja');
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-marca'), function (c) {
      c.onchange = function () { elegidos[c.value] = c.checked; };
    });

    engancharPlantilla(a);
    engancharCco();

    var selectorGrupo = $('correo-grupo');
    if (selectorGrupo) {
      selectorGrupo.onchange = async function () {
        var valor = selectorGrupo.value;
        selectorGrupo.value = '';
        if (!valor || !window.CorreoGrupos) return;
        var miembros;
        try { miembros = await CorreoGrupos.miembrosDeOpcion(valor); } catch (e) { miembros = []; }
        if (!miembros.length) return;
        var resueltos = await CorreoGrupos.resolverMiembros(miembros);
        var resultado = combinarCorreosDeGrupo(resueltos);
        resultado.direcciones.forEach(function (d) { cco[d] = true; });
        resultado.sinCorreo.forEach(function (nombre) {
          if (ccoSinCorreo.indexOf(nombre) === -1) ccoSinCorreo.push(nombre);
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
      if (n().apuntarElRastro) n().apuntarElRastro(a);
    };
    $('correo-gmail').onclick = function () { abrirGmail(); if (n().apuntarElRastro) n().apuntarElRastro(a); };
    $('correo-ordenador').onclick = function () { abrirDelOrdenador(); if (n().apuntarElRastro) n().apuntarElRastro(a); };

    if (window.CorreoAdjuntos) {
      CorreoAdjuntos.enganchar(a, function (nombres) {
        documentosAdjuntados = nombres;
        if (n().apuntarElRastro) n().apuntarElRastro(a);
      });
    }
  }

  function engancharPlantilla(a) {
    var desplegable = $('correo-plantilla');
    if (!desplegable) return;
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
    $('correo-comunes-der').innerHTML = bloqueCuerpo(a);
    engancharPlantilla(a);
  }

  /* ---------- lo que usa js/correo.js ----------

     `textoDeLaNota` (js/correo.js) necesita "a quién" y "con cuántos
     documentos" para el rastro que se apunta en las notas del asunto;
     js/correo-adjuntos.js sigue leyendo el DOM directamente para
     "Para" y la copia oculta (paraActual/ccoActual, sin depender de
     esto), como ya hacía antes de esta fila. */
  return {
    cuerpoHtml: cuerpoHtml,
    enganchar: enganchar,
    paraDelCuadro: paraDelCuadro,
    ccoDirecciones: function () { return Object.keys(cco); },
    documentosAdjuntados: function () { return documentosAdjuntados; }
  };
})();
window.CorreoCuadro = CorreoCuadro;
