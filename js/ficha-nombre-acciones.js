/* ============================================================
   ficha-nombre-acciones.js — el menú de tres puntos del nombre del
   asunto (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 5).

   "Cambiar", "Borrar" y "Copiar nombre" vivían sueltos en la barra de
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

  /* Fila 637: el menú «⋯» lleva, por este orden, «Cambiar el asunto», «Índice del expediente», «Marcar como
     reservado», «Copiar» (Asunto, NIE o DNI/CIF y Nombre) y «Borrar el asunto». Antes, la fila de copiar de debajo del
     nombre. «Nombre» y el documento necesitan el fichero de datos del tercero, que tarda: salen ocultos y se enseñan
     cuando llega (si no hay dato, no salen). */
  function copiarTexto(texto) {
    return U.copiar(texto, null, { avisoFallo: 'No he podido copiarlo. Es ' + texto + '.' }).then(function (ok) {
      if (ok) U.aviso('Copiado: ' + texto, 'bueno');
    });
  }

  /* Fila 627 (docs/627-ASUNTO-Y-EXTRACTO.md): «Asunto» copia el asunto que compone la app (el general del centro, con el
     número del asunto), no el nombre de la carpeta; un asunto de antes, sin número, sigue copiando el nombre. Se compone al
     pulsar, así que el menú no cambia nada en la ficha al pintarse. */
  async function copiarAsunto(a) {
    var texto = a.nombre;
    if (window.AsuntoExtracto) {
      try { texto = await AsuntoExtracto.asunto(a); }
      catch (e) { U.aviso('No he podido componer el asunto: ' + U.mensajeDeError(e), 'malo'); return; }
    }
    await copiarTexto(texto);
  }

  function opcionesDeCopiar(a) {
    var lista = [{ raya: true }, { rotulo: 'Copiar' }];
    lista.push({ texto: 'Asunto', soloLectura: true, title: 'Copiar el asunto que compone la aplicación para los correos y mensajes de Séneca', alPulsar: function () { return copiarAsunto(a); } });
    var nie = window.Copiar ? Copiar.nieDeAsunto(a) : '';
    if (nie) lista.push({ texto: 'NIE', soloLectura: true, title: 'Copiar ' + nie + ', el Nº de identificación escolar', alPulsar: function () { return copiarTexto(nie); } });
    var esEmpresa = window.Copiar && Copiar.categoriaDe(a) === 'EMPRESAS';
    lista.push({ texto: esEmpresa ? 'CIF' : 'DNI', clave: 'documento', oculto: true, soloLectura: true, title: 'Copiar el ' + (esEmpresa ? 'CIF' : 'documento') + ' del tercero', alPulsar: function () { return copiarTexto(documentoDe[a.nombre] || ''); } });
    lista.push({ texto: 'Nombre', clave: 'nombre', oculto: true, soloLectura: true, title: 'Copiar el nombre del tercero', alPulsar: function () { return copiarTexto(nombreDe[a.nombre] || ''); } });
    return lista;
  }

  var nombreDe = {}, documentoDe = {};

  function opcionesDelMenu(a, abierto) {
    var lista = [];
    if (abierto) {
      lista.push({
        texto: 'Cambiar el asunto',
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
    /* Fila 137: «Índice del expediente», abierto o archivado. */
    if (window.IndiceExpediente) lista.push(IndiceExpediente.opcionDelMenu(a));
    /* Fila 135: «Marcar como reservado» / «Quitar la reserva». */
    if (abierto && window.Reservados) lista.push(Reservados.opcionDelMenu(a));
    if (window.Copiar) lista = lista.concat(opcionesDeCopiar(a));
    if (abierto && window.Papelera) {
      lista.push({ raya: true });
      lista.push({ texto: 'Borrar el asunto', clase: 'ficha-menu-peligro', alPulsar: borrarAsunto });
    }
    return lista;
  }

  function poner() {
    if (!viendo) return;
    var h2 = document.querySelector('.ficha-nombre');
    if (!h2) return;
    if (window.Reservados) Reservados.ponerCandado(h2, viendo);   /* fila 135 */

    if (!h2.querySelector('.ficha-nombre-menu-boton')) {
      var opciones = opcionesDelMenu(viendo, modoDelAsunto === 'abierto');
      if (opciones.length) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'ficha-nombre-menu-boton';
        boton.setAttribute('data-ayuda-clave', 'mas-acciones-sobre-el-asunto');
        boton.textContent = '⋯';
        h2.appendChild(boton);
        var menu = FichaMenus.montar(boton, opciones);
        revelarDatosDelTercero(viendo, menu);
      }
    }
  }

  /* «Nombre» y el documento aparecen cuando se sabe el dato; ninguno cambia nada en la ficha (el elemento ya está en el menú). */
  function revelarDatosDelTercero(a, menu) {
    if (!window.FichaTercero || typeof FichaTercero.datosBasicos !== 'function') return;
    FichaTercero.datosBasicos(a).then(function (r) {
      if (viendo !== a) return;
      var n = r && r.resumen && r.resumen.nombre;
      var d = r && r.resumen && r.resumen.documento && r.resumen.documento.valor;
      var bn = menu.item && menu.item('nombre'), bd = menu.item && menu.item('documento');
      if (n && bn) { nombreDe[a.nombre] = n; bn.hidden = false; }
      if (d && bd) { documentoDe[a.nombre] = d; bd.hidden = false; }
    });
  }

  var pantalla = document.getElementById('pantalla-asunto');
  if (pantalla && window.MutationObserver) {
    new MutationObserver(function () { poner(); })
      .observe(pantalla, { childList: true, subtree: true });
  }
})();
