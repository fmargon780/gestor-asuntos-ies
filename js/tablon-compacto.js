/* ============================================================
   tablon-compacto.js — la pantalla del tablón (28-sep-2026, fila 212,
   docs/INICIO-A-TODO-EL-ANCHO.md). Antes vivía en js/tablon.js
   (columna a la derecha de los asuntos abiertos, siempre desplegada);
   aquí queda todo lo que es DIBUJAR: la columna compacta que cuelga
   ahora de la cabecera de Inicio (js/tablon.js, `columna()`), cada
   fila y el papel entero, dentro del overlay que se abre con "y N
   más"/"Ver las hechas". Leer, guardar y quién ve cada nota se queda
   en js/tablon.js (window.Tablon), que este fichero solo usa.

   Se carga justo detrás de js/tablon.js.
   ============================================================ */
(function () {

  var COLORES = ['amarillo', 'azul', 'verde', 'rosa'];

  var verHechas = false;
  var editando = '';        /* el id de la nota que se está cambiando */
  var colorElegido = 'amarillo';
  var soloParaMi = false;   /* cómo nacerá la próxima nota */

  /* Lo que se lleva escrito en la nota nueva, guardado aquí (no solo
     en el DOM) para que sobreviva aunque algo de fuera destruya la
     columna entera antes de que se pegue la nota (fila 33,
     17-sep-2026). Se actualiza con cada tecla, no solo al repintar. */
  var borrador = '';
  var borradorFecha = '';

  function $(id) { return document.getElementById(id); }
  function cambiar(hacer) { return Tablon.cambiar(hacer); }

  /* ---------- fechas ---------- */

  function hoyIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function legible(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function cuandoTexto(n) {
    var trozos = [];
    if (n.autor) trozos.push(n.autor);
    if (n.creado) trozos.push(legible(n.creado));
    return trozos.join(' · ');
  }

  /* Una nota con fecha puede estar atrasada, ser de hoy, o de más
     adelante. Es lo único que cambia el orden: lo que corre, arriba. */
  function urgencia(n) {
    if (!n.para) return 2;
    if (n.para < hoyIso()) return 0;
    if (n.para === hoyIso()) return 1;
    return 3;
  }

  function ordenar(lista) {
    return lista.slice().sort(function (a, b) {
      var ua = urgencia(a), ub = urgencia(b);
      if (ua !== ub) return ua - ub;
      if (a.para && b.para && a.para !== b.para) return a.para < b.para ? -1 : 1;
      return (b.creado || '') < (a.creado || '') ? -1 : 1;
    });
  }

  /* ---------- la columna ---------- */

  /* Fila 212: el tablón cuelga de la propia cabecera de Inicio
     (#inicio-tablon-hueco, entre "+ Nuevo asunto" y el buscador),
     compacto; si por lo que fuera ese hueco no existiera todavía, se
     cuelga de #pantalla-abiertos como antes, para no romper nada. */
  function columna() {
    var c = $('tablon');
    if (c) return c;
    var padre = $('inicio-tablon-hueco') || $('pantalla-abiertos');
    if (!padre) return null;
    c = document.createElement('aside');
    c.id = 'tablon';
    padre.appendChild(c);
    return c;
  }

  /* Cuánto se ve plegado: como mucho tres notas pendientes, una por
     renglón, cortadas con «…» (apartado 3). El resto, y las hechas, se
     ven con "y N más" / "Ver las hechas", que despliegan
     `overlayTodas` por encima de la página (`verTodas`), sin empujar
     nada hacia abajo. */
  var TOPE_COMPACTO = 3;

  /* Si el campo de la nota nueva está abierto de verdad (con foco, o
     con algo ya escrito o con fecha puesta), o si se ha pulsado para
     abrirlo (`notaAbierta`): entonces se ven también el resto de
     opciones (colores, fecha, "Solo para mí", "Pegar la nota"). Cerrado,
     es solo el campo de una línea con su placeholder. */
  var notaAbierta = false;

  /* La lista entera, por encima de la página. */
  var verTodas = false;
  var cerrarOverlaySiFuera = null, cerrarOverlayConEscape = null;

  function alternarTodas() {
    verTodas = !verTodas;
    pintar();
    if (verTodas) {
      /* En un turno aparte, para que el propio click que ha abierto el
         overlay no lo cierre también por "fuera". */
      setTimeout(function () {
        if (!verTodas) return;
        document.addEventListener('mousedown', cerrarOverlaySiFuera, true);
        document.addEventListener('keydown', cerrarOverlayConEscape, true);
      }, 0);
    } else {
      document.removeEventListener('mousedown', cerrarOverlaySiFuera, true);
      document.removeEventListener('keydown', cerrarOverlayConEscape, true);
    }
  }
  cerrarOverlaySiFuera = function (e) {
    var ov = document.querySelector('.tablon-overlay');
    if (ov && !ov.contains(e.target)) alternarTodas();
  };
  cerrarOverlayConEscape = function (e) { if (e.key === 'Escape') alternarTodas(); };

  /* Lo consulta js/tablon.js antes de releer el fichero en cada vuelta
     de window.Gestor.alRefrescar: mientras se escribe o se edita, el
     repintado del refresco automático no debe quitarle el sitio al
     cursor. */
  function ocupado() {
    var campo = $('tablon-texto');
    if (campo && campo === document.activeElement) return true;
    return !!editando;
  }

  function pintar() {
    var c = columna();
    if (!c) return;

    /* Lo que se esté escribiendo no se pierde al repintar: si el campo
       ya no está en el DOM (la columna se ha destruido por fuera),
       se rellena del borrador guardado en estas variables. */
    var campoTexto = $('tablon-texto');
    var escrito = campoTexto ? campoTexto.value : borrador;
    var campoFecha = $('tablon-para');
    var fechaPuesta = campoFecha ? campoFecha.value : borradorFecha;

    /* Tampoco se pierde el foco ni el cursor: ni del campo de la nota
       nueva, ni del de una nota que se esté cambiando ahora mismo. */
    var activo = document.activeElement;
    var enNueva = activo === campoTexto;
    var enEdicion = !enNueva && !!activo && activo.tagName === 'TEXTAREA' && c.contains(activo);
    var cursorInicio = null, cursorFin = null;
    if (enNueva || enEdicion) {
      cursorInicio = activo.selectionStart;
      cursorFin = activo.selectionEnd;
    }

    /* Las notas privadas de otro no salen aquí. */
    var mias = Tablon.notas().filter(Tablon.laVeo);
    var pendientes = ordenar(mias.filter(function (n) { return !n.hecha; }));
    var hechas = mias.filter(function (n) { return n.hecha; });

    var abierta = notaAbierta || enNueva || !!escrito || !!fechaPuesta;

    c.className = 'tablon-compacto';
    c.innerHTML = '';
    c.appendChild(cabecera(pendientes.length));
    c.appendChild(formulario(escrito, fechaPuesta, abierta));

    var fallo = Tablon.fallo();
    if (fallo) {
      var malo = document.createElement('div');
      malo.className = 'tablon-vacio';
      malo.textContent = 'No he podido leer las notas: ' + fallo;
      c.appendChild(malo);
    } else if (!pendientes.length && !hechas.length) {
      var vacio = document.createElement('div');
      vacio.className = 'tablon-vacio';
      vacio.textContent = 'Sin notas. Lo que no es un asunto, aquí.';
      c.appendChild(vacio);
    } else {
      pendientes.slice(0, TOPE_COMPACTO).forEach(function (n) { c.appendChild(filaCompacta(n)); });
      var deMas = pendientes.length - TOPE_COMPACTO;
      if (deMas > 0 || hechas.length) {
        var verMas = document.createElement('button');
        verMas.type = 'button';
        verMas.className = 'enlace tablon-ver-mas';
        verMas.textContent = deMas > 0 ? 'y ' + deMas + ' más' : 'Ver las hechas (' + hechas.length + ')';
        verMas.onclick = alternarTodas;
        c.appendChild(verMas);
      }
    }

    if (verTodas) c.appendChild(overlayTodas(pendientes, hechas));

    /* Se devuelve el foco y el cursor a donde estaban. */
    if (enNueva) {
      var campoNuevo = $('tablon-texto');
      if (campoNuevo) {
        campoNuevo.focus();
        try { campoNuevo.setSelectionRange(cursorInicio, cursorFin); } catch (e) {}
      }
    } else if (enEdicion) {
      var editado = c.querySelector('.papel textarea.campo');
      if (editado) {
        editado.focus();
        try { editado.setSelectionRange(cursorInicio, cursorFin); } catch (e) {}
      }
    }
  }

  /* ---------- cada fila compacta ----------

     Una línea: color a la izquierda, texto cortado con «…»
     (css/tablon.css), y el menú de siempre (⋮) con las mismas cuatro
     acciones que llevaba cada "papel" entero. Pulsar la fila, fuera del
     menú, abre el mismo menú (no hay sitio para tenerlas siempre a la
     vista, como pide el encargo). */
  function filaCompacta(n) {
    var fila = document.createElement('div');
    fila.className = 'tablon-fila-compacta color-' + n.color;
    fila.dataset.nota = n.id;

    if (n.para) {
      var u = urgencia(n);
      var marca = document.createElement('span');
      marca.className = 'tablon-fila-compacta-fecha' + (u === 0 ? ' papel-atrasada' : (u === 1 ? ' papel-hoy' : ''));
      marca.textContent = u === 0 ? 'Atrasada' : (u === 1 ? 'Hoy' : legible(n.para));
      fila.appendChild(marca);
    }
    if (n.privada) {
      var candado = document.createElement('span');
      candado.className = 'tablon-fila-compacta-privada';
      candado.title = 'Solo para mí';
      candado.textContent = '🔒';
      fila.appendChild(candado);
    }

    var texto = document.createElement('span');
    texto.className = 'tablon-fila-compacta-texto';
    texto.textContent = n.texto;
    texto.title = n.texto;
    fila.appendChild(texto);

    var menu = U.menuDeAcciones([
      boton('Hecha', function () { marcarHecha(n); }, true),
      boton('Cambiar', function () { editando = n.id; alternarTodas(); }),
      boton('A asunto', function () { pasarAAsunto(n); }),
      boton('Borrar', function () { borrarNota(n); })
    ]);
    fila.appendChild(menu);

    fila.onclick = function (ev) {
      if (ev.target.closest('button, .fila-menu-envoltorio')) return;
      var btn = menu.querySelector('.fila-menu-btn');
      if (btn) btn.click();
    };
    return fila;
  }

  /* ---------- la lista entera, por encima de la página ---------- */

  function overlayTodas(pendientes, hechas) {
    var ov = document.createElement('div');
    ov.className = 'tablon-overlay';

    var cab = document.createElement('div');
    cab.className = 'tablon-overlay-cabecera';
    var titulo = document.createElement('span');
    titulo.className = 'tablon-titulo';
    titulo.textContent = 'Tablón';
    cab.appendChild(titulo);
    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'tablon-overlay-cerrar';
    cerrar.title = 'Cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '✕';
    cerrar.onclick = alternarTodas;
    cab.appendChild(cerrar);
    ov.appendChild(cab);

    if (!pendientes.length) {
      var vacio = document.createElement('div');
      vacio.className = 'tablon-vacio';
      vacio.textContent = 'Sin notas pendientes.';
      ov.appendChild(vacio);
    } else {
      pendientes.forEach(function (n) { ov.appendChild(papel(n)); });
    }

    if (hechas.length) {
      var ver = document.createElement('button');
      ver.type = 'button';
      ver.className = 'enlace tablon-ver-hechas';
      ver.textContent = verHechas
        ? 'Esconder las hechas (' + hechas.length + ')'
        : 'Ver las hechas (' + hechas.length + ')';
      ver.onclick = function () { verHechas = !verHechas; pintar(); };
      ov.appendChild(ver);
      if (verHechas) {
        hechas.slice().reverse().forEach(function (n) { ov.appendChild(papel(n)); });
      }
    }
    return ov;
  }

  function cabecera(cuantas) {
    var h = document.createElement('div');
    h.className = 'tablon-cabecera';
    h.innerHTML = '<span class="tablon-titulo">Tablón</span>' +
                  '<span class="cuenta-lista">' + cuantas + '</span>';
    return h;
  }

  /* ---------- escribir una nota ---------- */

  /* La casilla de "Solo para mí". Se usa en dos sitios: al escribir una
     nota nueva y al cambiar una que ya está puesta. */
  function casillaSoloParaMi(id, marcada, alCambiar) {
    var etiqueta = document.createElement('label');
    etiqueta.className = 'tablon-solo-mia';
    etiqueta.title = 'La verás solo tú, en este tablón';

    var casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.id = id;
    casilla.checked = !!marcada;
    if (alCambiar) casilla.onchange = function () { alCambiar(casilla.checked); };
    etiqueta.appendChild(casilla);

    var texto = document.createElement('span');
    texto.textContent = 'Solo para mí';
    etiqueta.appendChild(texto);
    return etiqueta;
  }

  /* `abierta`: con el campo cerrado, se ve solo la línea de "Escribir
     una nota…". Al pulsarlo (onfocus, más abajo) o si ya hay algo
     escrito o una fecha puesta, se abre y aparece el resto (colores,
     fecha, "Solo para mí", "Pegar la nota"), sin perder el propio
     campo (mismo id, mismo elemento lógico:
     pruebas/tablon-no-se-borra.mjs escribe directamente en
     #tablon-texto sin tener que abrir nada antes). */
  function formulario(escrito, fechaPuesta, abierta) {
    var caja = document.createElement('div');
    caja.className = 'tablon-nueva' + (abierta ? ' tablon-nueva-abierta' : '');

    /* Lo que haya ahora mismo pasa a ser el borrador: así, si algo de
       fuera destruye la columna sin avisar, el próximo pintado parte
       de aquí y no de un campo vacío (fila 33, 17-sep-2026). */
    borrador = escrito;
    borradorFecha = fechaPuesta;

    var texto = document.createElement('textarea');
    texto.id = 'tablon-texto';
    texto.className = 'campo';
    texto.rows = abierta ? 2 : 1;
    texto.placeholder = 'Escribir una nota…';
    texto.value = escrito;
    texto.oninput = function () { borrador = texto.value; };
    texto.onfocus = function () {
      if (notaAbierta) return;
      notaAbierta = true;
      pintar();
    };
    caja.appendChild(texto);

    if (!abierta) return caja;

    var fila = document.createElement('div');
    fila.className = 'tablon-fila';

    var colores = document.createElement('div');
    colores.className = 'tablon-colores';
    COLORES.forEach(function (col) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tablon-color color-' + col + (col === colorElegido ? ' elegido' : '');
      b.title = 'Nota de color ' + col;
      b.onclick = function () { colorElegido = col; pintar(); };
      colores.appendChild(b);
    });
    fila.appendChild(colores);

    var para = document.createElement('input');
    para.type = 'date';
    para.id = 'tablon-para';
    para.className = 'campo tablon-fecha';
    para.title = 'Para qué día es, si tiene día';
    para.value = fechaPuesta;
    para.onchange = function () { borradorFecha = para.value; };
    fila.appendChild(para);

    caja.appendChild(fila);

    caja.appendChild(casillaSoloParaMi('tablon-solo-mia', soloParaMi, function (valor) {
      soloParaMi = valor;
    }));

    var pegar = document.createElement('button');
    pegar.type = 'button';
    pegar.className = 'boton boton-principal tablon-pegar';
    pegar.textContent = 'Pegar la nota';
    pegar.onclick = function () { pegarNota(); };
    caja.appendChild(pegar);

    texto.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); pegarNota(); }
    };
    return caja;
  }

  function pegarNota() {
    var campo = $('tablon-texto');
    var texto = (campo.value || '').trim();
    if (!texto) { campo.focus(); return; }
    var campoFecha = $('tablon-para');
    var para = campoFecha ? (campoFecha.value || '') : '';
    var quien = Tablon.quienSoy();
    var privada = soloParaMi;
    campo.value = '';
    if (campoFecha) campoFecha.value = '';
    borrador = '';
    borradorFecha = '';
    notaAbierta = false;
    cambiar(function (lista) {
      lista.push({
        id: 'n' + Date.now() + Math.floor(Math.random() * 1000),
        texto: texto, color: colorElegido, autor: quien,
        creado: new Date().toISOString(), para: para, privada: privada,
        hecha: false, hechaPor: '', hechaEl: ''
      });
      return lista;
    });
  }

  /* ---------- marcar hecha y borrar: comunes al papel entero (dentro
     del overlay) y a la fila compacta ---------- */

  function marcarHecha(n) {
    var quien = Tablon.quienSoy();
    cambiar(function (lista) {
      lista.forEach(function (x) {
        if (x.id !== n.id) return;
        x.hecha = true; x.hechaPor = quien; x.hechaEl = new Date().toISOString();
      });
      return lista;
    });
  }

  /* Desde el 11-sep-2026 esto pasa por la papelera, igual que lo demás:
     se puede devolver desde Ajustes › Papelera. */
  async function borrarNota(n) {
    if (!window.Papelera) return;
    var ok = await window.Papelera.preguntarBorrar(n.texto);
    if (!ok) return;
    try {
      await window.Papelera.mandarDato('nota-tablon', n.texto, null, n);
      await cambiar(function (lista) {
        return lista.filter(function (x) { return x.id !== n.id; });
      });
    } catch (e) {
      U.aviso('No he podido mandarla a la papelera: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- cada papel (dentro del overlay) ---------- */

  function papel(n) {
    var d = document.createElement('div');
    d.className = 'papel color-' + n.color + (n.hecha ? ' papel-hecha' : '');

    if (editando === n.id) {
      var campo = document.createElement('textarea');
      campo.className = 'campo';
      campo.rows = 3;
      campo.value = n.texto;
      d.appendChild(campo);

      var casilla = casillaSoloParaMi('papel-solo-mia', n.privada);
      d.appendChild(casilla);

      var botones = document.createElement('div');
      botones.className = 'papel-botones';
      botones.appendChild(boton('Guardar', function () {
        var nuevo = (campo.value || '').trim();
        var privadaAhora = !!casilla.querySelector('input').checked;
        editando = '';
        if (!nuevo) { pintar(); return; }
        cambiar(function (lista) {
          lista.forEach(function (x) {
            if (x.id !== n.id) return;
            x.texto = nuevo;
            x.privada = privadaAhora;
            /* Una nota se hace privada para su autor. Si la escribió el
               compañero y la escondes tú, dejarías de verla sin poder
               volver atrás, así que pasa a ser tuya. */
            if (privadaAhora && U.normalizar(x.autor) !== U.normalizar(Tablon.quienSoy())) {
              x.autor = Tablon.quienSoy();
            }
          });
          return lista;
        });
      }, true));
      botones.appendChild(boton('Cancelar', function () { editando = ''; pintar(); }));
      d.appendChild(botones);
      return d;
    }

    if (n.privada) {
      var candado = document.createElement('span');
      candado.className = 'papel-privada';
      candado.textContent = 'Solo para mí';
      d.appendChild(candado);
    }

    if (n.para) {
      var marca = document.createElement('span');
      var u = urgencia(n);
      marca.className = 'papel-fecha' + (u === 0 ? ' papel-atrasada' : (u === 1 ? ' papel-hoy' : ''));
      marca.textContent = u === 0 ? 'Se pasó el ' + legible(n.para)
                        : (u === 1 ? 'Para hoy' : 'Para el ' + legible(n.para));
      d.appendChild(marca);
    }

    var texto = document.createElement('div');
    texto.className = 'papel-texto';
    texto.textContent = n.texto;
    d.appendChild(texto);

    var pie = document.createElement('div');
    pie.className = 'papel-pie';
    pie.textContent = n.hecha
      ? 'Hecha' + (n.hechaPor ? ' por ' + n.hechaPor : '') +
        (n.hechaEl ? ' el ' + legible(n.hechaEl) : '')
      : cuandoTexto(n);
    d.appendChild(pie);

    var botones = document.createElement('div');
    botones.className = 'papel-botones';

    if (!n.hecha) {
      botones.appendChild(boton('Hecha', function () { marcarHecha(n); }, true));
      botones.appendChild(boton('Cambiar', function () { editando = n.id; pintar(); }));
      botones.appendChild(boton('A asunto', function () { pasarAAsunto(n); }));
    } else {
      botones.appendChild(boton('Devolver', function () {
        cambiar(function (lista) {
          lista.forEach(function (x) {
            if (x.id !== n.id) return;
            x.hecha = false; x.hechaPor = ''; x.hechaEl = '';
          });
          return lista;
        });
      }));
    }

    botones.appendChild(boton('Borrar', function () { borrarNota(n); }));

    d.appendChild(botones);
    return d;
  }

  function boton(texto, alPulsar, principal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton papel-boton' + (principal ? ' boton-marcado' : '');
    b.textContent = texto;
    b.onclick = alPulsar;
    return b;
  }

  /* Una nota que al final sí era un asunto. Se lleva a la pantalla de
     crear, con el texto ya puesto en la descripción. La nota se queda
     en el tablón hasta que él la marque como hecha: así no desaparece
     si al final no crea nada. */
  function pasarAAsunto(n) {
    App.ir('nuevo');
    var campo = $('campo-descripcion');
    if (campo) campo.value = U.limpiarNombre(n.texto).slice(0, 40).trim();
    U.aviso('Elige categoría, tipo y tercero. La nota va en la descripción.', 'bueno');
  }

  window.TablonVista = { pintar: pintar, ocupado: ocupado };

})();
