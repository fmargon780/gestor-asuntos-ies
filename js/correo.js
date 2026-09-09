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

   Nada de esto se guarda: es un cuadro de usar y tirar.
   ============================================================ */
(function () {

  var CENTRO = 'IES Fuente Lucena';

  var viendo = null;         /* el asunto que se está mirando */
  var elegidos = {};         /* qué correos van marcados */
  var asuntoLargo = true;    /* true: nombre de la carpeta; false: versión legible */

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

  function cuerpoDelCorreo(a, persona) {
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
    var firma = ['Un saludo.', App.E.usuario || '', CENTRO]
      .filter(Boolean).join('\n');
    return saludo + '\n\n\n\n' + firma;
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

  /* ---------- el cuadro ---------- */

  async function abrirCuadro(a) {
    viendo = a;
    elegidos = {};
    asuntoLargo = true;
    var esperar = U.preguntar('Correo de este asunto',
      '<div id="correo-caja"><p class="explica">Preparando…</p></div>', 'Cerrar', true);
    var persona = null;
    try { persona = await buscarPersona(a); } catch (e) { persona = null; }
    pintarCuadro(a, persona);
    await esperar;
  }

  function pintarCuadro(a, persona) {
    var caja = $('correo-caja');
    if (!caja) return;
    var correos = correosDe(persona);
    /* De partida van marcados todos: en el alumnado el correo suele ir a
       los dos tutores. Quitar una casilla es más rápido que ponerla. */
    correos.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });

    caja.innerHTML =
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
            ? 'En el fichero de Séneca no hay ningún correo de ' + U.escapar(terceroDe(a)) + '.'
            : 'No he encontrado a ' + U.escapar(terceroDe(a)) + ' en los ficheros de datos.') +
          ' Escríbelo aquí abajo.</p>') +
      '<input id="correo-otro" class="campo" placeholder="Otro correo, si hace falta" ' +
        'style="margin-top:8px">' +

      '<label class="etiqueta">Asunto</label>' +
      '<input id="correo-asunto" class="campo" value="' + U.escapar(asuntoDelCorreo(a)) + '">' +
      '<div class="correo-botones" style="margin-top:6px">' +
        '<button type="button" class="boton" id="correo-nombre-carpeta">Nombre de la carpeta</button>' +
        '<button type="button" class="boton" id="correo-legible">Versión legible</button>' +
      '</div>' +

      '<label class="etiqueta">Cuerpo</label>' +
      '<textarea id="correo-cuerpo-texto" class="campo" rows="9">' +
        U.escapar(cuerpoDelCorreo(a, persona)) + '</textarea>' +

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

    $('correo-copiar-para').onclick = function () { copiar(paraDelCuadro(), this); };
    $('correo-copiar-asunto').onclick = function () { copiar($('correo-asunto').value, this); };
    $('correo-copiar-cuerpo').onclick = function () { copiar($('correo-cuerpo-texto').value, this); };
    $('correo-gmail').onclick = abrirGmail;
    $('correo-ordenador').onclick = abrirDelOrdenador;
  }

  /* ---------- el botón dentro de la ficha del asunto ---------- */

  (function () {
    var comoEra = App.abrirFicha;
    if (typeof comoEra !== 'function') return;
    var actual = null;

    App.abrirFicha = function (a, modo) {
      actual = a;
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
      b.onclick = function () { abrirCuadro(actual); };
      caja.appendChild(b);
    }

    var pantalla = $('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { poner(); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

})();
