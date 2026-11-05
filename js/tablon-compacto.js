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
  var I = TablonCompactoNucleo;
  function reglaApertura() { return I.reglaApertura.apply(this, arguments); }
  function $() { return I.$.apply(this, arguments); }
  function cambiar() { return I.cambiar.apply(this, arguments); }
  function legible() { return I.legible.apply(this, arguments); }
  function cuandoTexto() { return I.cuandoTexto.apply(this, arguments); }
  function urgencia() { return I.urgencia.apply(this, arguments); }
  function ocupado() { return I.ocupado.apply(this, arguments); }
  function pintar() { return I.pintar.apply(this, arguments); }
  function casillaSoloParaMi() { return I.casillaSoloParaMi.apply(this, arguments); }
  function darPorAtendidoSiPasado() { return I.darPorAtendidoSiPasado.apply(this, arguments); }
  function marcarHecha() { return I.marcarHecha.apply(this, arguments); }
  function borrarNota() { return I.borrarNota.apply(this, arguments); }

  function papel(n) {
    var d = document.createElement('div');
    d.className = 'papel color-' + n.color + (n.hecha ? ' papel-hecha' : '');

    if (I.S.editando === n.id) {
      var campo = document.createElement('textarea');
      campo.className = 'campo';
      campo.rows = 3;
      campo.value = n.texto;
      d.appendChild(campo);

      var casilla = casillaSoloParaMi('papel-solo-mia', n.privada);
      d.appendChild(casilla);

      /* Fila 372: «Cambiar» también gana el día, la hora y la antelación. */
      var cambiaDia = document.createElement('input');
      cambiaDia.type = 'date';
      cambiaDia.id = 'papel-para';
      cambiaDia.className = 'campo tablon-fecha';
      cambiaDia.setAttribute('data-ayuda-clave', 'para-que-dia-es-si-tiene');
      cambiaDia.value = n.para;
      d.appendChild(cambiaDia);
      var cambiaHora = TablonHora.controles('papel-hora', 'papel-antes', n.hora, n.hora ? n.antes : null);
      cambiaHora.fijarFecha(n.para);
      cambiaDia.onchange = function () { cambiaHora.fijarFecha(cambiaDia.value); };
      d.appendChild(cambiaHora);

      var botones = document.createElement('div');
      botones.className = 'papel-botones';
      botones.appendChild(boton('Guardar', function () {
        var nuevo = (campo.value || '').trim();
        var privadaAhora = !!casilla.querySelector('input').checked;
        I.S.editando = '';
        if (!nuevo) { pintar(); return; }
        cambiar(function (lista) {
          lista.forEach(function (x) {
            if (x.id !== n.id) return;
            x.texto = nuevo;
            x.privada = privadaAhora;
            var antiguaClave = Tablon.claveAviso(x);
            x.para = cambiaDia.value || '';
            var v = cambiaHora.valores();
            x.hora = x.para ? v.hora : '';
            x.antes = x.hora ? v.antes : 0;
            /* Cambiar el día, la hora o la antelación vuelve a armar el aviso. */
            if (Tablon.claveAviso(x) !== antiguaClave) {
              x.atendido = [];
              darPorAtendidoSiPasado(x);
            }
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
      botones.appendChild(boton('Cancelar', function () { I.S.editando = ''; pintar(); }));
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
      if (n.hora) {
        marca.className = 'papel-fecha' + (TablonHora.pasada(n) ? ' tablon-pasada' : (u === 1 ? ' papel-hoy' : ''));
        marca.textContent = TablonHora.marcaLarga(n);
      }
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
      botones.appendChild(boton('Cambiar', function () { I.S.editando = n.id; pintar(); }));
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

  I.papel = papel;
  I.boton = boton;
  I.pasarAAsunto = pasarAAsunto;

  window.TablonVista = { pintar: pintar, ocupado: ocupado, reglaApertura: reglaApertura };

})();
