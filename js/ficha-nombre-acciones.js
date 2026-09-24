/* ============================================================
   ficha-nombre-acciones.js — el menú de tres puntos del nombre del
   asunto (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 5).

   "Editar", "Borrar" y "Copiar nombre" vivían sueltos en la barra de
   acciones. Aquí se juntan bajo el nombre del asunto, en un menú
   pequeño (js/ficha-menus.js) anclado al `<h2 class="ficha-nombre">`,
   con las mismas llamadas de siempre: nada de esto cambia lo que hace
   cada acción, solo dónde vive.

   Mismo envoltorio de siempre para sobrevivir al repintado con
   `innerHTML` de la ficha (js/copiar.js, js/via-contacto.js): se
   envuelve `App.abrirFicha` para saber qué asunto y qué modo hay, y un
   `MutationObserver` sobre `#pantalla-asunto` vuelve a poner el botón
   cada vez que la ficha se rehace entera. */
(function () {

  var viendo = null;
  var modoDelAsunto = 'abierto';

  var nueva = U.envolver(App, 'App.abrirFicha', 'ficha-nombre-acciones.js', function (comoEra) {
    return function (a, modo) {
      viendo = a;
      modoDelAsunto = modo || 'abierto';
      comoEra(a, modo);
      poner();
    };
  });
  if (!nueva) return;

  async function borrarAsunto() {
    if (!window.Papelera || !viendo) return;
    var a = viendo;
    var docs = [];
    try { docs = await Carpetas.ficheros(a.handle); } catch (e) { docs = []; }
    var ok = await window.Papelera.preguntarBorrar(a.nombre,
      docs.length ? '<p class="nota">Se lleva ' + docs.length + ' documento' +
        (docs.length === 1 ? '' : 's') + '.</p>' : '');
    if (!ok) return;
    if (docs.length) {
      var seguro = await U.preguntar(a.nombre, '<p>¿Seguro?</p>', 'Sí, a la papelera');
      if (!seguro) return;
    }
    try {
      await App.conOcupado(a.nombre, function () { return Papelera.mandarAsunto(a); });
    } catch (e) {
      U.fallo('No he podido mandarlo a la papelera', e);
      return;
    }
    U.aviso('Asunto mandado a la papelera.', 'bueno');
    App.volverALaLista();
  }

  /* "Copiar el nombre del asunto" ya no vive aquí desde la fila 58
     (docs/AJUSTES-DE-USO-2026-09-18.md, 1): es el botón "Asunto" de la
     fila de copiar, siempre a la vista, sin menú. */
  function opcionesDelMenu(a, abierto) {
    var lista = [];
    if (abierto) {
      lista.push({
        texto: 'Editar el asunto',
        /* Fila 119: se queda en la ficha del asunto editado (con su
           nombre nuevo). Cancelado, en la misma ficha; si ya no está en
           abiertos, a la lista. */
        alPulsar: async function () {
          var nombre = await App.editarAsunto(a);
          if (nombre && window.Navegacion && Navegacion.abrirAbierto(nombre)) return;
          var sigue = (App.E.listaAbiertos || []).some(function (x) { return x.nombre === a.nombre; });
          if (!sigue) App.volverALaLista();
        }
      });
    }
    if (abierto && window.Papelera) {
      if (lista.length) lista.push({ raya: true });
      lista.push({ texto: 'Borrar el asunto', clase: 'ficha-menu-peligro', alPulsar: borrarAsunto });
    }
    return lista;
  }

  function poner() {
    if (!viendo) return;
    var h2 = document.querySelector('.ficha-nombre');
    if (!h2) return;

    if (!h2.querySelector('.ficha-nombre-menu-boton')) {
      var opciones = opcionesDelMenu(viendo, modoDelAsunto === 'abierto');
      if (opciones.length) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'ficha-nombre-menu-boton';
        boton.title = 'Más acciones sobre el asunto';
        boton.textContent = '⋯';
        h2.appendChild(boton);
        FichaMenus.montar(boton, opciones);
      }
    }

    ponerFilaDeCopiar(h2);
  }

  /* ==========================================================
     LA FILA DE COPIAR DE UN GESTO (18-sep-2026, fila 58,
     docs/AJUSTES-DE-USO-2026-09-18.md, 1)

     Debajo del nombre, siempre visible, sin menú: Asunto, Nombre, NIE
     y DNI/CIF. Un botón sin dato no se pone. Reutiliza `Copiar.boton`
     (js/copiar.js) para el copiado y el aviso "Copiado" de siempre.
     ========================================================== */

  function botonCopiarFila(etiqueta, texto, ayuda) {
    return Copiar.boton({ etiqueta: etiqueta, texto: texto, ayuda: ayuda, clase: 'boton-copiar-fila' });
  }

  /* "Nombre" y el documento necesitan el fichero de datos de la
     categoría (Datos.cargar), que tarda: no se sabe hasta entonces si
     hay algo que copiar. En vez de añadir el botón cuando por fin
     responde, se deja aquí mismo, oculto, desde el primer pintado, y
     "revelar" solo le cambia `hidden` y a qué copia el clic —nunca
     mete un nodo nuevo en el DOM. La diferencia importa: un botón
     añadido tarde es una mutación más dentro de `#ficha-asunto-cuerpo`,
     y js/hitos-panel.js vigila esa caja entera para saber cuándo
     repintarse; sin este cuidado, ese repintado de sobra le cerraba a
     Francisco un hito que acababa de desplegar para mirarlo, sin haber
     tocado nada todavía (solo se salva un hito a medias si tiene el
     foco o una nota sin guardar — uno abierto sin más se cierra en
     cualquier repintado, y antes de esto un repintado de sobra era
     justo lo que este botón causaba). */
  function botonPendiente(etiqueta, ayuda) {
    var b = botonCopiarFila(etiqueta, '', ayuda);
    b.hidden = true;
    return b;
  }

  function revelar(b, texto) {
    b.hidden = false;
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      Copiar.copiar(texto).then(function (ok) {
        if (!ok) { U.aviso('No he podido copiarlo. Es ' + texto + '.', 'malo'); return; }
        var antes = b.textContent;
        b.textContent = 'Copiado';
        b.classList.add('boton-marcado');
        setTimeout(function () {
          b.textContent = antes;
          b.classList.remove('boton-marcado');
        }, 1400);
      });
    };
  }

  function ponerFilaDeCopiar(h2) {
    var cabecera = h2.closest('.ficha-cabecera');
    if (!window.Copiar || (cabecera || h2.parentNode).querySelector('.ficha-copiar-fila')) return;
    var a = viendo;
    var fila = document.createElement('div');
    fila.className = 'ficha-copiar-fila';
    fila.appendChild(botonCopiarFila('Asunto', a.nombre, 'Copiar el nombre completo de la carpeta'));
    /* La ruta de la carpeta, con lo apuntado en Ajustes → El centro
       (fila 98, js/copiar-ruta.js). */
    if (window.RutaCarpetas) fila.appendChild(RutaCarpetas.boton(a, modoDelAsunto));

    var nie = Copiar.nieDeAsunto(a);
    if (nie) fila.appendChild(botonCopiarFila('NIE', nie, 'Copiar ' + nie + ', el Nº de identificación escolar'));

    /* La categoría (y con ella si el botón se llama DNI o CIF) ya se
       sabe sin esperar a nada: viene del propio asunto, no del
       fichero de datos. */
    var esEmpresa = Copiar.categoriaDe(a) === 'EMPRESAS';
    var botonNombre = botonPendiente('Nombre', 'Copiar el nombre del tercero');
    fila.appendChild(botonNombre);
    var botonDoc = botonPendiente(esEmpresa ? 'CIF' : 'DNI',
      'Copiar el ' + (esEmpresa ? 'CIF' : 'documento') + ' del tercero');
    fila.appendChild(botonDoc);

    /* Desde la fila 112, en la segunda línea, a la derecha, antes de la línea gris. */
    var datos = cabecera && cabecera.querySelector('.ficha-apertura');
    if (datos) datos.insertBefore(fila, datos.firstChild);
    else h2.parentNode.insertBefore(fila, h2.nextSibling);

    if (!window.FichaTercero || typeof FichaTercero.datosBasicos !== 'function') return;
    FichaTercero.datosBasicos(a).then(function (r) {
      if (viendo !== a || !fila.isConnected) return;
      if (r && r.resumen && r.resumen.nombre) revelar(botonNombre, r.resumen.nombre);
      if (r && r.resumen && r.resumen.documento && r.resumen.documento.valor) {
        revelar(botonDoc, r.resumen.documento.valor);
      }
    });
  }

  var pantalla = document.getElementById('pantalla-asunto');
  if (pantalla && window.MutationObserver) {
    new MutationObserver(function () { poner(); })
      .observe(pantalla, { childList: true, subtree: true });
  }
})();
