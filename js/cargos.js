/* ============================================================
   cargos.js — los cargos del centro y quién los ha ocupado, con
   fechas (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md).

   Cada cargo (Dirección, Secretaría...) lleva una lista de
   "ocupantes", con la fecha en la que empezaron y la fecha en la que
   cesaron (vacía si siguen). Al generar un documento, la firma la
   pone quien ocupaba el cargo EN LA FECHA DEL DOCUMENTO, no quien lo
   ocupe hoy: así un documento antiguo sigue diciendo quién firmaba
   entonces, y no hay que corregir la firma a mano cada vez que cambia
   el equipo directivo.

   _GESTOR/cargos.json es el decimoséptimo fichero compartido (ver
   js/copias.js): pasa por Copias.guardar, se relee antes de escribir
   y entra en la comprobación de fichero roto y en el bloque de
   conflictos de Ajustes, como guias.json (cambia poco, no se fusiona
   solo).

   Se carga antes de js/plantillas.js (que usa Cargos.enFecha para los
   huecos {{FIRMANTE}} y compañía).
   ============================================================ */
var Cargos = (function () {

  var FICHERO = 'cargos.json';

  var DE_FABRICA = [
    { id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'El Director' },
    { id: 'vicedireccion', nombre: 'Vicedirección', orden: 2, tratamiento: 'El Vicedirector' },
    { id: 'jefatura-estudios', nombre: 'Jefatura de Estudios', orden: 3, tratamiento: 'El Jefe de Estudios' },
    { id: 'secretaria', nombre: 'Secretaría', orden: 4, tratamiento: 'El Secretario' },
    { id: 'administracion', nombre: 'Administración', orden: 5, tratamiento: 'El Auxiliar Administrativo' },
    { id: 'orientacion', nombre: 'Orientación', orden: 6, tratamiento: 'El Orientador' }
  ];

  function nuevoId() { return U.nuevoId('c'); }

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  function normalizarOcupante(o) {
    return {
      id: (o && o.id) || nuevoId(),
      persona: String((o && o.persona) || ''),
      sexo: (o && (o.sexo === 'H' || o.sexo === 'M')) ? o.sexo : '',   /* fila 111: 'H', 'M' o '' */
      desde: String((o && o.desde) || ''),
      hasta: String((o && o.hasta) || '')
    };
  }

  function normalizarCargo(c, ordenPorDefecto) {
    return {
      id: (c && c.id) || nuevoId(),
      nombre: String((c && c.nombre) || ''),
      orden: (c && typeof c.orden === 'number') ? c.orden : ordenPorDefecto,
      tratamiento: String((c && c.tratamiento) || ''),
      ocupantes: Array.isArray(c && c.ocupantes) ? c.ocupantes.map(normalizarOcupante) : []
    };
  }

  function cargosDeFabrica() {
    return DE_FABRICA.map(function (c) { return normalizarCargo(Object.assign({}, c), c.orden); });
  }

  function normalizar(leido) {
    if (!leido || !Array.isArray(leido.cargos)) return { version: 1, cargos: cargosDeFabrica() };
    return {
      version: 1,
      cargos: leido.cargos.map(function (c, i) { return normalizarCargo(c, i + 1); })
    };
  }

  function vacio() { return normalizar(null); }

  async function leer() {
    var g = gestor();
    if (!g) return vacio();
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Como todo fichero compartido: se relee justo antes de escribir. */
  async function cambiar(hacer) {
    var g = gestor();
    if (!g) return vacio();
    var actual = await leer();
    var nuevo = hacer(actual) || actual;
    await Copias.guardar(g, FICHERO, nuevo);
    return nuevo;
  }

  function buscar(datos, idCargo) {
    return (datos.cargos || []).filter(function (c) { return c.id === idCargo; })[0] || null;
  }

  function ordenados(datos) {
    return (datos.cargos || []).slice().sort(function (a, b) { return a.orden - b.orden; });
  }

  /* ----------------------------------------------------------
     QUIÉN OCUPA UN CARGO, EN UNA FECHA (AAAA-MM-DD, texto: sin
     objetos Date, para no arrastrar líos de huso horario)
     ---------------------------------------------------------- */

  function enFechaDeLista(ocupantes, fecha) {
    var f = String(fecha || '');
    var o = (ocupantes || []).filter(function (x) {
      return x.desde && x.desde <= f && (!x.hasta || f <= x.hasta);
    })[0];
    return o || null;
  }

  async function enFecha(idCargo, fecha) {
    var datos = await leer();
    var cargo = buscar(datos, idCargo);
    if (!cargo) return null;
    var o = enFechaDeLista(cargo.ocupantes, fecha);
    if (!o) return null;
    return { persona: o.persona, sexo: o.sexo, tratamiento: cargo.tratamiento, nombre: cargo.nombre };
  }

  async function vigente(idCargo) {
    return enFecha(idCargo, U.hoyIso());
  }

  /* Los pares de ocupantes de un cargo cuyas fechas se pisan. Función
     sin efectos, solo para avisar en pantalla; nunca impide guardar.
     Un ocupante sin `hasta` (sigue en el cargo) se trata como si
     llegara hasta siempre. */
  function solapes(cargo) {
    var ocupantes = (cargo && cargo.ocupantes) || [];
    var pares = [];
    for (var i = 0; i < ocupantes.length; i++) {
      for (var j = i + 1; j < ocupantes.length; j++) {
        var a = ocupantes[i], b = ocupantes[j];
        if (!a.desde || !b.desde) continue;
        var finA = a.hasta || '9999-99-99';
        var finB = b.hasta || '9999-99-99';
        if (a.desde <= finB && b.desde <= finA) pares.push([a, b]);
      }
    }
    return pares;
  }

  /* ----------------------------------------------------------
     ALTA, EDICIÓN Y BORRADO
     ---------------------------------------------------------- */

  async function guardar(hacer) { return cambiar(hacer); }

  async function crearCargo(nombre, tratamiento) {
    var creado = null;
    await cambiar(function (d) {
      var orden = d.cargos.reduce(function (m, c) { return Math.max(m, c.orden); }, 0) + 1;
      creado = normalizarCargo({ nombre: nombre, tratamiento: tratamiento || '' }, orden);
      d.cargos.push(creado);
      return d;
    });
    return creado;
  }

  async function renombrarCargo(idCargo, nombre, tratamiento) {
    await cambiar(function (d) {
      var c = buscar(d, idCargo);
      if (c) { c.nombre = nombre; c.tratamiento = tratamiento; }
      return d;
    });
  }

  async function borrarCargo(idCargo) {
    await cambiar(function (d) {
      d.cargos = d.cargos.filter(function (c) { return c.id !== idCargo; });
      return d;
    });
  }

  async function anadirOcupante(idCargo, persona, desde, sexo) {
    var creado = null;
    await cambiar(function (d) {
      var c = buscar(d, idCargo);
      if (!c) return d;
      creado = normalizarOcupante({ persona: persona, sexo: sexo, desde: desde, hasta: '' });
      c.ocupantes.push(creado);
      return d;
    });
    return creado;
  }

  async function cerrarOcupante(idCargo, idOcupante, hasta) {
    await cambiar(function (d) {
      var c = buscar(d, idCargo);
      if (!c) return d;
      var o = c.ocupantes.filter(function (x) { return x.id === idOcupante; })[0];
      if (o) o.hasta = hasta;
      return d;
    });
  }

  async function editarOcupante(idCargo, idOcupante, persona, desde, hasta, sexo) {
    await cambiar(function (d) {
      var c = buscar(d, idCargo);
      if (!c) return d;
      var o = c.ocupantes.filter(function (x) { return x.id === idOcupante; })[0];
      if (o) { o.persona = persona; o.desde = desde; o.hasta = hasta; if (sexo !== undefined) o.sexo = sexo; }
      return d;
    });
  }

  /* Como `enFecha`, pero sobre un cargo YA en memoria (para pintar sin
     tener que releer el fichero por cada tarjeta). */
  function vigenteDeCargo(cargo) {
    var o = enFechaDeLista(cargo.ocupantes, U.hoyIso());
    return o ? { persona: o.persona, tratamiento: cargo.tratamiento, nombre: cargo.nombre, hasta: o.hasta, id: o.id } : null;
  }

  return {
    FICHERO: FICHERO, DE_FABRICA: DE_FABRICA,
    leer: leer, guardar: guardar, buscar: buscar, ordenados: ordenados,
    enFecha: enFecha, vigente: vigente, solapes: solapes, vigenteDeCargo: vigenteDeCargo,
    crearCargo: crearCargo, renombrarCargo: renombrarCargo, borrarCargo: borrarCargo,
    anadirOcupante: anadirOcupante, cerrarOcupante: cerrarOcupante, editarOcupante: editarOcupante
  };
})();
window.Cargos = Cargos;

/* ============================================================
   La pantalla, en Ajustes → El centro, bloque "Cargos del centro"
   (index.html, id `cargos-lista`, `details` estático como "Datos del
   centro y firma"). Aparte del módulo de arriba, mismo patrón que
   js/recurrentes.js (`pintarEnContenedor`): el modelo y su pantalla en
   un solo fichero, sin repartirlo en un "-ajustes.js" que el encargo
   no pide.
   ============================================================ */
(function () {
  function $(id) { return document.getElementById(id); }

  function hoy() { return U.hoyIso(); }

  function filaOcupante(cargo, o, alGuardar) {
    var fila = document.createElement('div');
    fila.className = 'fila-tipo';
    var nombre = document.createElement('input');
    nombre.className = 'campo';
    nombre.style.flex = '1';
    nombre.value = o.persona;
    var desde = document.createElement('input');
    desde.type = 'date'; desde.className = 'campo campo-plazo'; desde.value = o.desde;
    var hasta = document.createElement('input');
    hasta.type = 'date'; hasta.className = 'campo campo-plazo'; hasta.value = o.hasta;
    hasta.title = 'Vacío: sigue en el cargo';
    var sexo = document.createElement('select');   /* fila 111: para «El/La Director/a» */
    sexo.className = 'campo'; sexo.title = 'Sexo, para las plantillas';
    sexo.innerHTML = '<option value="">Sexo…</option><option value="H">Hombre</option><option value="M">Mujer</option>';
    sexo.value = o.sexo || '';

    async function guardarCambio() {
      try {
        await Cargos.editarOcupante(cargo.id, o.id, nombre.value.trim(), desde.value, hasta.value, sexo.value);
        alGuardar();
      } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    }
    nombre.onchange = guardarCambio;
    desde.onchange = guardarCambio;
    hasta.onchange = guardarCambio;
    sexo.onchange = guardarCambio;

    fila.appendChild(nombre);
    fila.appendChild(sexo);
    fila.appendChild(desde);
    fila.appendChild(hasta);
    return fila;
  }

  function tarjetaDeCargo(cargo, alRefrescar) {
    var div = document.createElement('div');
    div.className = 'tarjeta-tipo';

    var ocupantesOrden = cargo.ocupantes.slice().sort(function (a, b) { return b.desde < a.desde ? -1 : 1; });
    var vigente = Cargos.vigenteDeCargo(cargo);

    var cabecera = document.createElement('div');
    cabecera.innerHTML = '<div class="nombre-tipo">' + U.escapar(cargo.nombre) + '</div>' +
      '<div class="suave">' + U.escapar(cargo.tratamiento || '(sin tratamiento)') + '</div>' +
      (vigente
        ? '<div style="margin-top:4px"><strong>' + U.escapar(vigente.persona) + '</strong></div>'
        : '<div class="aviso-en-vivo" style="margin-top:4px">Sin ocupante vigente</div>');
    div.appendChild(cabecera);

    var pares = Cargos.solapes(cargo);
    if (pares.length) {
      var avisoSolape = document.createElement('div');
      avisoSolape.className = 'aviso-en-vivo';
      avisoSolape.textContent = 'Hay fechas que se solapan entre ' +
        pares.map(function (p) { return p[0].persona + ' y ' + p[1].persona; }).join(', ') + '.';
      div.appendChild(avisoSolape);
    }

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.style.marginTop = '8px';

    var anadir = document.createElement('button');
    anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir persona';
    anadir.onclick = async function () {
      var cuerpo = '<label class="etiqueta">Nombre</label><input id="cargo-nueva-persona" class="campo">' +
        '<label class="etiqueta">Sexo</label><select id="cargo-nueva-sexo" class="campo"><option value="">Sin decir</option>' +
        '<option value="H">Hombre</option><option value="M">Mujer</option></select>' +
        '<label class="etiqueta">Desde</label><input id="cargo-nueva-desde" type="date" class="campo" value="' +
        U.escapar(vigente ? '' : hoy()) + '">';
      var ok = await U.preguntar('Añadir a ' + cargo.nombre, cuerpo, 'Añadir');
      if (!ok) return;
      var persona = $('cargo-nueva-persona').value.trim();
      var desde = $('cargo-nueva-desde').value;
      if (!persona || !desde) { U.aviso('Hace falta el nombre y la fecha de inicio.', 'malo'); return; }
      try {
        if (vigente && !vigente.hasta) {
          var ayer = new Date(desde); ayer.setDate(ayer.getDate() - 1);
          await Cargos.cerrarOcupante(cargo.id, vigente.id, ayer.toISOString().slice(0, 10));
        }
        await Cargos.anadirOcupante(cargo.id, persona, desde, $('cargo-nueva-sexo').value);
        U.aviso('Persona añadida.', 'bueno');
        alRefrescar();
      } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    };
    acciones.appendChild(anadir);

    if (vigente && !vigente.hasta) {
      var cerrar = document.createElement('button');
      cerrar.type = 'button'; cerrar.className = 'boton'; cerrar.textContent = 'Cerrar';
      cerrar.onclick = async function () {
        var cuerpo = '<label class="etiqueta">Fecha de cese</label><input id="cargo-fecha-cese" type="date" class="campo" value="' + hoy() + '">';
        var ok = await U.preguntar('Cerrar a ' + vigente.persona, cuerpo, 'Cerrar');
        if (!ok) return;
        try {
          await Cargos.cerrarOcupante(cargo.id, vigente.id, $('cargo-fecha-cese').value);
          U.aviso('Cerrado.', 'bueno');
          alRefrescar();
        } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      };
      acciones.appendChild(cerrar);
    }

    var editar = document.createElement('button');
    editar.type = 'button'; editar.className = 'boton'; editar.textContent = 'Nombre y tratamiento';
    editar.onclick = async function () {
      var cuerpo = '<label class="etiqueta">Nombre del cargo</label><input id="cargo-editar-nombre" class="campo" value="' +
        U.escapar(cargo.nombre) + '">' +
        '<label class="etiqueta">Tratamiento</label><input id="cargo-editar-tratamiento" class="campo" value="' +
        U.escapar(cargo.tratamiento) + '" placeholder="El Director, La Secretaria…">';
      var ok = await U.preguntar('Editar cargo', cuerpo, 'Guardar');
      if (!ok) return;
      try {
        await Cargos.renombrarCargo(cargo.id, $('cargo-editar-nombre').value.trim() || cargo.nombre,
          $('cargo-editar-tratamiento').value.trim());
        alRefrescar();
      } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    };
    acciones.appendChild(editar);

    if (window.Papelera) {
      acciones.appendChild(Papelera.botonBorrar(async function () {
        var ok = await Papelera.preguntarBorrar(cargo.nombre);
        if (!ok) return;
        try {
          await Papelera.mandarDato('cargo', cargo.nombre, {}, { cargo: cargo });
          await Cargos.borrarCargo(cargo.id);
          U.aviso('Cargo mandado a la papelera.', 'bueno');
          alRefrescar();
        } catch (e) { U.aviso('No he podido borrarlo: ' + U.mensajeDeError(e), 'malo'); }
      }));
    }
    div.appendChild(acciones);

    if (ocupantesOrden.length) {
      var detalle = document.createElement('details');
      detalle.style.marginTop = '8px';
      detalle.innerHTML = '<summary>Quién lo ha ocupado</summary>';
      var lista = document.createElement('div');
      lista.style.marginTop = '6px';
      ocupantesOrden.forEach(function (o) { lista.appendChild(filaOcupante(cargo, o, alRefrescar)); });
      detalle.appendChild(lista);
      div.appendChild(detalle);
    }

    return div;
  }

  async function pintarEnAjustes() {
    var caja = $('cargos-lista');
    if (!caja || !App.E.gestor) return;
    var datos = await Cargos.leer();
    caja.innerHTML = '';

    var nuevo = document.createElement('button');
    nuevo.type = 'button'; nuevo.className = 'boton'; nuevo.textContent = '+ Nuevo cargo';
    nuevo.style.marginBottom = '10px';
    nuevo.onclick = async function () {
      var cuerpo = '<label class="etiqueta">Nombre del cargo</label><input id="cargo-nuevo-nombre" class="campo">' +
        '<label class="etiqueta">Tratamiento</label><input id="cargo-nuevo-tratamiento" class="campo" placeholder="El Coordinador…">';
      var ok = await U.preguntar('Nuevo cargo', cuerpo, 'Crear');
      if (!ok) return;
      var nombre = $('cargo-nuevo-nombre').value.trim();
      if (!nombre) return;
      try {
        await Cargos.crearCargo(nombre, $('cargo-nuevo-tratamiento').value.trim());
        pintarEnAjustes();
      } catch (e) { U.aviso('No he podido crearlo: ' + U.mensajeDeError(e), 'malo'); }
    };
    caja.appendChild(nuevo);

    Cargos.ordenados(datos).forEach(function (c) { caja.appendChild(tarjetaDeCargo(c, pintarEnAjustes)); });
  }

  Cargos.pintarEnAjustes = pintarEnAjustes;
})();
