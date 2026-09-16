/* ============================================================
   bandeja-enlace.js — elegir a mano el asunto de destino de un correo.

   La bandeja (js/bandeja-correos.js) adivina sola el asunto de dos
   maneras: por la huella del hilo, y por el texto del asunto. Cuando
   no acierta —o cuando acierta mal—, hasta ahora la única salida era
   crear un asunto nuevo, y acababan naciendo carpetas repetidas para
   la misma gestión.

   Aquí está el botón "Elegir asunto" de cada tarjeta. Abre un cuadro
   con dos partes:

     - "Podrían encajar": como mucho cinco asuntos, los que más puntos
       sacan en la puntuación de abajo. Si ninguno llega al mínimo,
       este bloque no se pinta.
     - "Todos los asuntos": la lista entera con buscador, los abiertos
       primero y los archivados después.

   CÓMO SE MIDE EL PARECIDO

     +50  el correo del remitente (o alguna dirección del hilo) es la
          de una persona que es el tercero del asunto, o uno de sus
          terceros relacionados.
     +40  el nombre del tercero del asunto (apellidos y nombre, en
          cualquier orden) aparece en el asunto del correo o en su texto.
     +10  por cada palabra de cuatro letras o más del asunto del correo
          que aparezca en el nombre del asunto.
     +15  el asunto está abierto.
     +10  el asunto se creó o se movió en los últimos 30 días.

   Se enseñan los que pasen de 40 puntos, de mayor a menor.

   Solo hay un cuadro de diálogo en toda la aplicación (U.preguntar,
   sobre #capa), así que aquí nunca se abre uno mientras otro espera:
   el de elegir se cierra antes de abrir el de reabrir.
   ============================================================ */
(function () {

  var MINIMO = 40;
  var CUANTOS = 5;
  var DIAS_RECIENTE = 30;

  /* Palabras que no dicen nada de qué va el correo. Sin esto,
     "Solicitud para el alumno" puntuaría por "para". */
  var VACIAS = ['para', 'sobre', 'desde', 'con', 'los', 'las', 'del', 'que',
                'una', 'uno', 'por', 'como', 'este', 'esta', 'esto', 'esos',
                'pero', 'mas', 'sus', 'nos', 'ante', 'tras', 'hacia', 'entre',
                'cuando', 'porque', 'asunto', 'correo', 'buenos', 'buenas',
                'dias', 'tardes', 'hola', 'gracias', 'saludos', 'adjunto',
                'envio', 'respuesta', 'mensaje', 'cordial', 'atentamente'];

  function $(id) { return document.getElementById(id); }

  function sinElRe(texto) {
    return (window.Bandeja && window.Bandeja.sinElRe)
      ? window.Bandeja.sinElRe(texto)
      : String(texto || '');
  }

  function estaArchivado(ficha) {
    return String((ficha && ficha.estado) || '') === 'cerrado';
  }

  /* ==========================================================
     LA PUNTUACIÓN
     ========================================================== */

  /* "Pacheco Pérez, Mercedes 019G" -> apellidos y nombre por separado,
     sin el código pegado al final (el Nº de identificación escolar, o
     las cuatro cifras del documento del personal). */
  function trozosDelTercero(tercero) {
    var t = String(tercero || '').trim();
    if (!t) return null;
    var coma = t.indexOf(',');
    if (coma === -1) return { apellidos: U.normalizar(t), nombre: '' };
    var apellidos = U.normalizar(t.slice(0, coma));
    var resto = t.slice(coma + 1).trim().split(/\s+/).filter(Boolean);
    var ultima = resto[resto.length - 1] || '';
    if (resto.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) resto.pop();
    return { apellidos: apellidos, nombre: U.normalizar(resto.join(' ')) };
  }

  function palabrasDelCorreo(d) {
    return U.normalizar(sinElRe((d && d.asunto) || ''))
      .split(/[^a-z0-9ñ]+/)
      .filter(function (p) { return p.length >= 4 && VACIAS.indexOf(p) === -1; });
  }

  /* Cuándo se creó o se movió por última vez. La fecha de creación va
     delante del nombre de la carpeta, en AAMMDD; la del último
     movimiento, en la ficha, cuando hay notas. */
  function cuandoSeMovio(nombre, ficha) {
    var cuando = 0;
    var m = String(nombre || '').match(/^(\d{2})(\d{2})(\d{2})(\D|$)/);
    if (m) {
      var f = new Date(2000 + parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      if (!isNaN(f.getTime())) cuando = f.getTime();
    }
    var nota = new Date((ficha && ficha.notaEl) || '');
    if (!isNaN(nota.getTime()) && nota.getTime() > cuando) cuando = nota.getTime();
    return cuando;
  }

  function esReciente(nombre, ficha) {
    var cuando = cuandoSeMovio(nombre, ficha);
    if (!cuando) return false;
    return (Date.now() - cuando) <= DIAS_RECIENTE * 86400000;
  }

  /* Los nombres de tercero que salen de las direcciones del correo. */
  async function tercerosDelCorreo(d) {
    var salida = [];
    try {
      var personas = await window.Bandeja.personasDelCorreo(d);
      personas.forEach(function (p) {
        var n = U.normalizar(App.textoTercero(p));
        if (n && salida.indexOf(n) === -1) salida.push(n);
      });
    } catch (e) { /* sin CSV se puntúa igual, solo que sin el +50 */ }
    return salida;
  }

  function puntuarUno(nombre, ficha, d, palabras, texto, suyos) {
    var puntos = 0;

    /* +50: la dirección del correo es la del tercero del asunto, o la
       de alguno de sus relacionados. */
    if (suyos.length) {
      var candidatos = [U.normalizar(ficha.tercero || '')];
      (ficha.relacionados || []).forEach(function (r) {
        candidatos.push(U.normalizar((r && r.nombre) || ''));
      });
      var acierta = candidatos.some(function (c) {
        return c && suyos.indexOf(c) !== -1;
      });
      if (acierta) puntos += 50;
    }

    /* +40: el nombre del tercero, escrito dentro del correo. */
    var trozos = trozosDelTercero(ficha.tercero);
    if (trozos && trozos.apellidos && texto.indexOf(trozos.apellidos) !== -1 &&
        (!trozos.nombre || texto.indexOf(trozos.nombre) !== -1)) {
      puntos += 40;
    }

    /* +10 por palabra del asunto del correo que esté en el nombre. */
    var enElNombre = U.normalizar(nombre);
    palabras.forEach(function (p) {
      if (enElNombre.indexOf(p) !== -1) puntos += 10;
    });

    if (!estaArchivado(ficha)) puntos += 15;
    if (esReciente(nombre, ficha)) puntos += 10;

    return puntos;
  }

  async function podrianEncajar(d) {
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var palabras = palabrasDelCorreo(d);
    var texto = U.normalizar((d.asunto || '') + ' ' + (d.texto || ''));
    var suyos = await tercerosDelCorreo(d);

    var lista = Object.keys(registro).map(function (nombre) {
      var ficha = registro[nombre] || {};
      return { nombre: nombre, ficha: ficha,
               puntos: puntuarUno(nombre, ficha, d, palabras, texto, suyos) };
    });

    lista = lista.filter(function (x) { return x.puntos > MINIMO; });
    lista.sort(function (a, b) {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return a.nombre < b.nombre ? -1 : 1;
    });
    return lista.slice(0, CUANTOS);
  }

  /* ==========================================================
     EL CUADRO

     Se monta sobre #capa, igual que hace js/relacionados.js: se
     esconde el botón de Aceptar, porque aquí se elige pulsando en la
     fila, y Cancelar es el de siempre.
     ========================================================== */

  function todosLosAsuntos() {
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var lista = Object.keys(registro).map(function (nombre) {
      return { nombre: nombre, ficha: registro[nombre] || {} };
    });
    lista.sort(function (a, b) {
      var ca = estaArchivado(a.ficha) ? 1 : 0;
      var cb = estaArchivado(b.ficha) ? 1 : 0;
      if (ca !== cb) return ca - cb;           /* abiertos primero */
      return a.nombre < b.nombre ? -1 : 1;
    });
    return lista;
  }

  function filaDeAsunto(x, puntos) {
    var pie = [
      (x.ficha.tercero || ''),
      (estaArchivado(x.ficha) ? 'Archivado' : 'Abierto')
    ].filter(Boolean).join('  ·  ');
    return '<button type="button" class="resultado enlace-asunto" data-nombre="' +
             U.escapar(x.nombre) + '">' +
             (estaArchivado(x.ficha)
               ? '<span class="marca-tipo enlace-archivado">Archivado</span>' : '') +
             U.escapar(x.nombre) +
             '<span class="resultado-pie">' + U.escapar(pie) +
             (puntos ? '  ·  ' + puntos + ' puntos' : '') + '</span>' +
           '</button>';
  }

  function elegirDeLaLista(d, sugeridos) {
    return new Promise(function (resolver) {
      var resuelto = false;
      function unaVez(v) { if (!resuelto) { resuelto = true; resolver(v); } }

      var todos = todosLosAsuntos();
      var capa = $('capa');
      var cuadro = document.querySelector('#capa .cuadro');
      if (cuadro) cuadro.classList.add('cuadro-medio');

      $('cuadro-titulo').textContent = 'Elegir el asunto de este correo';
      $('cuadro-cuerpo').innerHTML =
        '<p class="explica">' + U.escapar(sinElRe(d.asunto || '(sin asunto)')) +
        '<br><span class="suave">de ' +
        U.escapar((d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido') +
        '</span></p>' +
        (sugeridos.length
          ? '<div class="enlace-bloque"><div class="etiqueta">Podrían encajar</div>' +
            '<div class="lista enlace-lista">' +
            sugeridos.map(function (x) { return filaDeAsunto(x, x.puntos); }).join('') +
            '</div></div>'
          : '') +
        '<div class="enlace-bloque"><div class="etiqueta">Todos los asuntos</div>' +
        '<input id="enlace-buscar" class="campo" placeholder="Buscar por nombre o tercero">' +
        '<div class="lista enlace-lista" id="enlace-todos"></div></div>';

      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
        if (cuadro) cuadro.classList.remove('cuadro-medio');
      }

      $('cuadro-cancelar').onclick = function () { cerrar(); unaVez(null); };

      function engancharFilas(caja) {
        Array.prototype.forEach.call(caja.querySelectorAll('.enlace-asunto'), function (b) {
          b.onclick = function () {
            var nombre = b.dataset.nombre;
            cerrar();
            unaVez({ nombre: nombre, ficha: (App.E.registro.asuntos || {})[nombre] || {} });
          };
        });
      }

      function pintarTodos() {
        var busca = U.normalizar(($('enlace-buscar') || {}).value || '');
        var caja = $('enlace-todos');
        var vistos = todos.filter(function (x) {
          if (!busca) return true;
          return U.normalizar(x.nombre + ' ' + (x.ficha.tercero || '')).indexOf(busca) !== -1;
        });
        caja.innerHTML = vistos.length
          ? vistos.slice(0, 200).map(function (x) { return filaDeAsunto(x, 0); }).join('')
          : '<div class="vacio">Ningún asunto con eso.</div>';
        engancharFilas(caja);
      }

      engancharFilas($('cuadro-cuerpo'));
      pintarTodos();
      var buscador = $('enlace-buscar');
      if (buscador) {
        buscador.oninput = pintarTodos;
        try { buscador.focus(); } catch (e) {}
      }
    });
  }

  /* El asunto elegido está archivado: se pregunta qué hacer con él.
     Este cuadro se abre cuando el otro ya está cerrado, nunca encima. */
  function preguntarSiReabrir(elAsunto) {
    return new Promise(function (resolver) {
      var resuelto = false;
      function unaVez(v) { if (!resuelto) { resuelto = true; resolver(v); } }

      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Ese asunto está archivado';
      $('cuadro-cuerpo').innerHTML =
        '<p class="explica">' + U.escapar(elAsunto.nombre) + '</p>' +
        '<p>Una respuesta casi siempre quiere decir que la gestión ha vuelto a moverse.</p>' +
        '<div class="alta-tipo">' +
          '<button type="button" id="enlace-reabrir" class="boton boton-principal">' +
            'Reabrir y guardar aquí</button>' +
          '<button type="button" id="enlace-sin-reabrir" class="boton">' +
            'Guardar sin reabrir</button>' +
        '</div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }

      $('cuadro-cancelar').onclick = function () { cerrar(); unaVez(null); };
      $('enlace-reabrir').onclick = function () { cerrar(); unaVez('reabrir'); };
      $('enlace-sin-reabrir').onclick = function () { cerrar(); unaVez('guardar'); };
    });
  }

  /* ==========================================================
     LO QUE LLAMA LA TARJETA
     ========================================================== */

  App.elegirAsuntoDelCorreo = async function (item) {
    var d = item.datos;
    var sugeridos = [];
    try { sugeridos = await podrianEncajar(d); } catch (e) { sugeridos = []; }

    var elegido = await elegirDeLaLista(d, sugeridos);
    if (!elegido) return;

    if (!estaArchivado(elegido.ficha)) {
      await window.Bandeja.guardarEnAsunto(item, elegido);
      return;
    }

    var que = await preguntarSiReabrir(elegido);
    if (que === 'reabrir') await window.Bandeja.reabrirYGuardar(item, elegido);
    else if (que === 'guardar') await window.Bandeja.guardarEnAsunto(item, elegido);
  };

  /* Para las pruebas: la puntuación se puede mirar sin abrir nada. */
  App.parecidoDelCorreo = podrianEncajar;

})();
