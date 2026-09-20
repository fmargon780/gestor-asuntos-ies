/* ============================================================
   cargos-ajustes.js — el bloque "Cargos del centro" de Ajustes → El
   centro (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md, parte 1).

   Una tarjeta por cargo, en su orden, con su ocupante vigente en
   grande y un <details> con la lista completa de quién lo ha ocupado.
   Avisos en ámbar (cargo sin ocupante vigente, fechas que se
   solapan): nunca impiden guardar, solo avisan.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var datos = null;

  async function cargar() {
    if (!window.App || !App.E || !App.E.gestor) return null;
    datos = await Cargos.cargar(App.E.gestor);
    return datos;
  }

  async function guardar(mutar) {
    datos = await Cargos.guardar(App.E.gestor, mutar);
    return datos;
  }

  /* ---------- añadir/cerrar un ocupante ---------- */

  async function anadirOcupante(cargo) {
    var vigente = Cargos.enFecha(datos, cargo.id, U.hoyIso());
    var ok = await U.preguntar('Añadir persona a ' + cargo.nombre,
      '<label class="etiqueta">Nombre, tal como debe salir firmado</label>' +
      '<input id="cargo-persona-nueva" class="campo" placeholder="Nombre Apellido1 Apellido2">' +
      '<label class="etiqueta">Desde</label>' +
      '<input id="cargo-desde-nueva" type="date" class="campo" value="' + U.hoyIso() + '">' +
      (vigente
        ? '<p class="nota">Ya hay alguien en el cargo hoy (' + U.escapar(vigente.persona) +
          '). Si añades a esta persona con una fecha de hoy o después, conviene cerrar antes al ' +
          'ocupante anterior el día de antes, para que no se solapen.</p>'
        : ''), 'Añadir');
    if (!ok) return;
    var persona = $('cargo-persona-nueva').value.trim();
    var desde = $('cargo-desde-nueva').value;
    if (!persona || !desde) { U.aviso('Hace falta el nombre y la fecha de inicio.', 'malo'); return; }
    try {
      await guardar(function (actual) {
        var c = Cargos.deId(actual, cargo.id);
        c.ocupantes.push({ id: Cargos.idNuevoOcupante(), persona: persona, desde: desde, hasta: '' });
        return actual;
      });
      U.aviso('Persona añadida.', 'bueno');
      pintar();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  }

  async function cerrarOcupante(cargo, ocupante) {
    var ok = await U.preguntar('Cerrar a ' + ocupante.persona + ' en ' + cargo.nombre,
      '<label class="etiqueta">Hasta</label>' +
      '<input id="cargo-hasta-cierre" type="date" class="campo" value="' + U.hoyIso() + '">', 'Cerrar');
    if (!ok) return;
    var hasta = $('cargo-hasta-cierre').value;
    if (!hasta) return;
    try {
      await guardar(function (actual) {
        var c = Cargos.deId(actual, cargo.id);
        var o = c.ocupantes.filter(function (x) { return x.id === ocupante.id; })[0];
        if (o) o.hasta = hasta;
        return actual;
      });
      U.aviso('Cerrado.', 'bueno');
      pintar();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  }

  async function cambiarFechasOcupante(cargo, ocupante, desde, hasta) {
    try {
      await guardar(function (actual) {
        var c = Cargos.deId(actual, cargo.id);
        var o = c.ocupantes.filter(function (x) { return x.id === ocupante.id; })[0];
        if (o) { o.desde = desde; o.hasta = hasta; }
        return actual;
      });
      pintar();
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  }

  /* ---------- pintar ---------- */

  function tarjetaDeCargo(cargo) {
    var vigente = Cargos.enFecha(datos, cargo.id, U.hoyIso());
    var solapes = Cargos.solapes(cargo);

    var div = document.createElement('div');
    div.className = 'tarjeta-tipo';

    var linea = document.createElement('div');
    linea.className = 'tarjeta-tipo-linea';
    linea.innerHTML = '<span class="tarjeta-tipo-nombre">' + U.escapar(cargo.nombre) + '</span>' +
      '<span class="suave">' + U.escapar(cargo.tratamiento || '(sin tratamiento)') + '</span>';
    div.appendChild(linea);

    var ocupanteActual = document.createElement('div');
    ocupanteActual.className = 'tarjeta-tipo-sub';
    ocupanteActual.style.fontSize = '1.1em';
    ocupanteActual.textContent = vigente ? vigente.persona : '(sin ocupante vigente)';
    div.appendChild(ocupanteActual);

    if (!vigente) {
      var avisoSin = document.createElement('div');
      avisoSin.className = 'aviso-en-vivo malo';
      avisoSin.textContent = 'Nadie ocupa este cargo hoy: los documentos que lo necesiten se quedan sin firmante.';
      div.appendChild(avisoSin);
    }
    if (solapes.length) {
      var avisoSolape = document.createElement('div');
      avisoSolape.className = 'aviso-en-vivo malo';
      avisoSolape.textContent = solapes.length + (solapes.length === 1 ? ' fecha se solapa.' : ' fechas se solapan.');
      div.appendChild(avisoSolape);
    }

    var detalle = document.createElement('details');
    detalle.style.marginTop = '6px';
    var resumen = document.createElement('summary');
    resumen.textContent = 'Quién lo ha ocupado';
    detalle.appendChild(resumen);
    var cuerpo = document.createElement('div');
    cuerpo.className = 'bloque-cuerpo';

    var ocupantesOrden = cargo.ocupantes.slice().sort(function (a, b) { return a.desde < b.desde ? 1 : -1; });
    if (!ocupantesOrden.length) {
      cuerpo.innerHTML = '<div class="vacio">Todavía no hay nadie apuntado.</div>';
    }
    ocupantesOrden.forEach(function (o) {
      var fila = document.createElement('div');
      fila.className = 'fila-tipo';
      var nombre = document.createElement('span');
      nombre.className = 'nombre-tipo';
      nombre.textContent = o.persona;
      fila.appendChild(nombre);

      var desde = document.createElement('input');
      desde.type = 'date'; desde.className = 'campo campo-plazo'; desde.value = o.desde || '';
      desde.title = 'Desde';
      desde.onchange = function () { cambiarFechasOcupante(cargo, o, desde.value, hasta.value); };
      fila.appendChild(desde);

      var hasta = document.createElement('input');
      hasta.type = 'date'; hasta.className = 'campo campo-plazo'; hasta.value = o.hasta || '';
      hasta.title = 'Hasta (vacío = sigue en el cargo)';
      hasta.onchange = function () { cambiarFechasOcupante(cargo, o, desde.value, hasta.value); };
      fila.appendChild(hasta);

      if (!o.hasta) {
        var cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'boton';
        cerrar.textContent = 'Cerrar';
        cerrar.onclick = function () { cerrarOcupante(cargo, o); };
        fila.appendChild(cerrar);
      }
      cuerpo.appendChild(fila);
    });
    detalle.appendChild(cuerpo);
    div.appendChild(detalle);

    var anadir = document.createElement('button');
    anadir.type = 'button';
    anadir.className = 'boton';
    anadir.style.marginTop = '6px';
    anadir.textContent = 'Añadir persona';
    anadir.onclick = function () { anadirOcupante(cargo); };
    div.appendChild(anadir);

    return div;
  }

  function pintar() {
    var caja = $('tabla-cargos');
    if (!caja || !datos) return;
    caja.innerHTML = '';
    Cargos.ordenados(datos).forEach(function (cargo) { caja.appendChild(tarjetaDeCargo(cargo)); });
  }

  async function pintarConCarga() {
    await cargar();
    pintar();
  }

  window.CargosAjustes = { pintar: pintarConCarga };

})();
