/* ============================================================
   ficha-persona.js — la ficha de una persona, en tarjetas plegables
   (fila 252, docs/FICHA-DE-PERSONA-EN-TARJETAS.md).

   Una cabecera de una o dos líneas y, debajo, tarjetas con su resumen
   en el título, en dos columnas cuando el ancho lo permite. La usan
   Personas y empresas (`App.verFicha`) y la ventana «Ver todo» del
   alumno (`FichaTerceroAlumno.ventana`).

   `FichaPersona.pintar(caja, persona, opciones)`:
     ventana: true         -> sin «Sus asuntos» ni sitio para los botones
     asunto                -> el asunto de la ficha (para «Correo a la familia»)
     resumen               -> `Datos.resumenDeTercero`, si ya se tiene
     alPedirCorreo         -> qué hacer al pulsar «Correo a la familia»
   Qué tarjeta lleva cada dato: js/ficha-persona-reparto.js.

   Lo abierto y lo cerrado se recuerda en este ordenador
   (`localStorage`, `gestor.fichaPersona.abiertas`, por categoría de
   persona y tarjeta); sin `localStorage` valen las de la tabla.
   ============================================================ */
var FichaPersona = (function () {

  var CLAVE = 'gestor.fichaPersona.abiertas';

  /* Las tarjetas del alumnado, en orden: [id, título, abierta al entrar]. */
  var TARJETAS_ALUMNADO = [
    ['familia', 'Familia y contacto', true], ['asuntos', 'Sus asuntos', true],
    ['matricula', 'Matrícula', false], ['materias', 'Materias', false],
    ['trayectoria', 'Trayectoria', false], ['procedencia', 'Procedencia y NEAE', false],
    ['datos', 'Datos personales', false], ['otros', 'Otros datos del fichero', false]
  ];

  function leerRecuerdo(categoria) {
    try {
      var t = window.localStorage.getItem(CLAVE);
      var o = t ? JSON.parse(t) : null;
      return (o && o[categoria] && typeof o[categoria] === 'object') ? o[categoria] : {};
    } catch (e) { return {}; }
  }

  function guardarRecuerdo(categoria, id, abierta) {
    try {
      var t = window.localStorage.getItem(CLAVE);
      var o = t ? JSON.parse(t) : {};
      if (!o || typeof o !== 'object') o = {};
      if (!o[categoria]) o[categoria] = {};
      o[categoria][id] = !!abierta;
      window.localStorage.setItem(CLAVE, JSON.stringify(o));
    } catch (e) { /* sin localStorage, valen las de la tabla */ }
  }

  function filasHtml(filas) {
    return '<div class="ficha-datos">' + filas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  function recortar(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  /* Una línea para el título de la tarjeta. */
  function resumenDe(id, entrada) {
    if (!entrada) return '';
    if (id === 'otros') return entrada.filas.length + (entrada.filas.length === 1 ? ' dato' : ' datos');
    if (id === 'materias' && entrada.tablas.length) {
      var n = entrada.tablas[0].n;
      return n + (n === 1 ? ' materia' : ' materias');
    }
    if (entrada.filas.length) {
      return entrada.filas.slice(0, 2).map(function (f) { return recortar(f.valor, 40); }).join(' · ');
    }
    return entrada.tablas.map(function (t) { return t.n + (t.n === 1 ? ' fila' : ' filas'); }).join(' · ');
  }

  function cuerpoDe(entrada, pie) {
    var d = document.createElement('div');
    d.innerHTML = (entrada.filas.length ? filasHtml(entrada.filas) : '') +
      entrada.tablas.map(function (t) {
        return '<div class="vt-bd-tabla-titulo">' + U.escapar(t.titulo) + '</div>' + t.html;
      }).join('') + (entrada.bd && pie ? pie : '');
    return d;
  }

  /* Una tarjeta plegable: { id, titulo, resumen, cuerpo (Node), abierta, tituloId, resumenId }. */
  function tarjeta(categoria, recuerdo, def) {
    var det = document.createElement('details');
    det.className = 'fp-tarjeta';
    det.dataset.tarjeta = def.id;
    det.open = recuerdo[def.id] !== undefined ? !!recuerdo[def.id] : !!def.abierta;
    var sum = document.createElement('summary');
    sum.innerHTML = '<span class="fp-titulo"' + (def.tituloId ? ' id="' + def.tituloId + '"' : '') + '>' + U.escapar(def.titulo) + '</span>' +
      '<span class="fp-resumen"' + (def.resumenId ? ' id="' + def.resumenId + '"' : '') + '>' + U.escapar(def.resumen || '') + '</span>';
    det.appendChild(sum);
    var cuerpo = document.createElement('div');
    cuerpo.className = 'fp-cuerpo';
    cuerpo.appendChild(def.cuerpo);
    det.appendChild(cuerpo);
    /* Solo cuando la persona la abre o la cierra (no al pintarla). */
    sum.addEventListener('click', function () { setTimeout(function () { guardarRecuerdo(categoria, def.id, det.open); }, 0); });
    return det;
  }

  function cabeceraSimple(p, sub, dni) {
    return '<div class="vt-cabecera fp-cabecera">' +
      '<div class="vt-cabecera-texto"><h4 class="vt-nombre">' + U.escapar(p.nombre) + '</h4>' +
      (sub ? '<div class="vt-sub">' + U.escapar(sub) + '</div>' : '') + '</div>' +
      '<div class="vt-etiquetas">' + (dni ? '<span class="vt-etq vt-etq-gris" id="vt-dni">DNI ' + U.escapar(dni) + ' </span>' : '') + '</div>' +
    '</div>';
  }

  function conCopiar(raiz, id, valor) {
    var el = raiz.querySelector(id);
    if (!el || !valor || el.querySelector('.dato-copiable')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dato-copiable'; b.title = 'Copiar ' + valor; b.textContent = '⧉';
    b.onclick = function (ev) {
      ev.stopPropagation(); ev.preventDefault();
      U.copiar(valor, null, { avisoFallo: 'No he podido copiarlo. Es ' + valor + '.' });
    };
    el.appendChild(b);
  }

  function tarjetaDeAsuntos() {
    var d = document.createElement('div');
    d.innerHTML = '<div id="asuntos-del-tercero"><p class="explica">Buscando…</p></div>';
    return d;
  }

  function pintarAlumno(caja, p, o, raiz, rejilla) {
    var resumen = o.resumen || Datos.resumenDeTercero(p, p.categoria);
    var cab = document.createElement('div');
    cab.innerHTML = FichaTerceroAlumno.cabeceraHtml(p, resumen);
    var cabecera = cab.firstChild;
    if (!o.ventana) {
      var ac = document.createElement('div');
      ac.id = 'ficha-persona-acciones'; ac.className = 'fp-acciones';
      cabecera.appendChild(ac);
    }
    raiz.insertBefore(cabecera, rejilla);
    FichaTerceroAlumno.montarCabecera(raiz, p);

    var recuerdo = leerRecuerdo(p.categoria);
    var reparto = FichaPersonaReparto.alumno(p);
    var pie = window.AlumnadoBD && p.bd
      ? '<p class="nota">Datos de la base de datos de alumnado del ' + U.escapar(AlumnadoBD.fechaLegible(p.bdGenerado)) + '</p>' : '';

    TARJETAS_ALUMNADO.forEach(function (t) {
      var id = t[0], def = { id: id, titulo: t[1], abierta: t[2] };
      if (id === 'familia') {
        var fam = FichaTerceroAlumno.familia(p, o.asunto, o.alPedirCorreo);
        if (fam.vacia) return;
        def.cuerpo = fam.nodo; def.resumen = fam.resumen;
      } else if (id === 'asuntos') {
        if (o.ventana) return;
        def.cuerpo = tarjetaDeAsuntos(); def.tituloId = 'titulo-sus-asuntos'; def.resumenId = 'fp-resumen-asuntos';
      } else {
        var e = reparto[id];
        if (!e || (!e.filas.length && !e.tablas.length)) return;
        def.cuerpo = cuerpoDe(e, pie); def.resumen = resumenDe(id, e);
        /* La cabecera ya dice el grupo y si está matriculado: el título, el curso. */
        if (id === 'matricula') {
          var fc = e.filas.filter(function (f) { return U.normalizar(f.titulo) === 'curso'; })[0];
          def.resumen = fc ? recortar(fc.valor, 40) : def.resumen;
        }
      }
      rejilla.appendChild(tarjeta(p.categoria, recuerdo, def));
    });
  }

  function pintarPersonal(p, o, raiz, rejilla) {
    var dp = Datos.destacadosPersona(p);
    var dni = p.documento || '';
    /* El puesto, la situación y el DNI ya están en la cabecera. */
    var puesto = dp.destacados.filter(function (f) { return ['DNI', 'Puesto', 'Situación'].indexOf(f.titulo) === -1; });
    var restoPersonal = dp.resto.filter(function (f) { return U.normalizar(f.valor) !== U.normalizar(p.nombre); });   /* el nombre ya está arriba */
    var cab = document.createElement('div');
    cab.innerHTML = cabeceraSimple(p, [p.puesto, p.enElCentro ? 'En el centro' : 'Ya no está en el centro'].filter(Boolean).join(' · '), dni);
    var cabecera = cab.firstChild;
    var ac = document.createElement('div'); ac.id = 'ficha-persona-acciones'; ac.className = 'fp-acciones';
    cabecera.appendChild(ac);
    raiz.insertBefore(cabecera, rejilla);
    conCopiar(raiz, '#vt-dni', dni);

    var recuerdo = leerRecuerdo(p.categoria);
    if (puesto.length) {
      rejilla.appendChild(tarjeta(p.categoria, recuerdo, { id: 'puesto', titulo: 'Puesto y contacto', abierta: true,
        resumen: puesto.slice(0, 2).map(function (f) { return recortar(f.valor, 40); }).join(' · '),
        cuerpo: cuerpoDe({ filas: puesto, tablas: [] }) }));
    }
    rejilla.appendChild(tarjeta(p.categoria, recuerdo, { id: 'asuntos', titulo: 'Sus asuntos', abierta: true,
      cuerpo: tarjetaDeAsuntos(), tituloId: 'titulo-sus-asuntos', resumenId: 'fp-resumen-asuntos' }));
    if (restoPersonal.length) {
      rejilla.appendChild(tarjeta(p.categoria, recuerdo, { id: 'otros', titulo: 'Otros datos del fichero', abierta: false,
        resumen: restoPersonal.length + (restoPersonal.length === 1 ? ' dato' : ' datos'),
        cuerpo: cuerpoDe({ filas: restoPersonal, tablas: [] }) }));
    }
  }

  function pintarOtra(p, o, raiz, rejilla) {
    var cab = document.createElement('div');
    /* Con ficha propia de la categoría (tutores, Administraciones), su NIF ya está en «Datos». */
    var nif = App.FICHAS_DE_CATEGORIA[p.categoria] ? '' : (p.nif || p.documento || '');
    cab.innerHTML = cabeceraSimple(p, '', nif);
    var cabecera = cab.firstChild;
    var ac = document.createElement('div'); ac.id = 'ficha-persona-acciones'; ac.className = 'fp-acciones';
    cabecera.appendChild(ac);
    raiz.insertBefore(cabecera, rejilla);
    conCopiar(raiz, '#vt-dni', nif);
    if (nif) { var chip = raiz.querySelector('#vt-dni'); if (chip) chip.firstChild.textContent = 'NIF ' + nif + ' '; }

    var recuerdo = leerRecuerdo(p.categoria);
    var cuerpo = document.createElement('div');
    var resumenDatos = '';
    if (App.FICHAS_DE_CATEGORIA[p.categoria]) {
      cuerpo.innerHTML = App.FICHAS_DE_CATEGORIA[p.categoria].html(p);
      /* El resumen: los dos primeros datos que no sean el nombre. */
      resumenDatos = Object.keys(p.campos || {}).map(function (c) { return String(p.campos[c] || ''); })
        .filter(function (v) { return v && U.normalizar(v) !== U.normalizar(p.nombre); })
        .slice(0, 2).map(function (v) { return recortar(v, 40); }).join(' · ') || p.nif || p.documento || '';
    } else {
      /* Sin repetir lo que ya dice la cabecera: el nombre y el NIF. */
      var filas = Object.keys(p.campos || {}).map(function (c) { return { titulo: c, valor: p.campos[c] }; })
        .filter(function (f) {
          var v = U.normalizar(f.valor);
          return v && v !== U.normalizar(p.nombre) && v !== U.normalizar(nif);
        });
      cuerpo.innerHTML = filasHtml(filas);
      resumenDatos = filas.slice(0, 2).map(function (f) { return recortar(f.valor, 40); }).join(' · ');
    }
    rejilla.appendChild(tarjeta(p.categoria, recuerdo, { id: 'datos', titulo: 'Datos', abierta: true,
      resumen: resumenDatos, cuerpo: cuerpo }));
    rejilla.appendChild(tarjeta(p.categoria, recuerdo, { id: 'asuntos', titulo: 'Sus asuntos', abierta: true,
      cuerpo: tarjetaDeAsuntos(), tituloId: 'titulo-sus-asuntos', resumenId: 'fp-resumen-asuntos' }));
  }

  function pintar(caja, p, o) {
    o = o || {};
    caja.innerHTML = '';
    var raiz = document.createElement('div');
    raiz.className = 'fp-raiz' + (o.ventana ? ' fp-ventana' : '');
    var rejilla = document.createElement('div');
    rejilla.className = 'fp-tarjetas';
    raiz.appendChild(rejilla);
    if (p.categoria === 'ALUMNADO') pintarAlumno(caja, p, o, raiz, rejilla);
    else if (p.categoria === 'PERSONAL') pintarPersonal(p, o, raiz, rejilla);
    else pintarOtra(p, o, raiz, rejilla);
    caja.appendChild(raiz);
  }

  return { pintar: pintar, TARJETAS_ALUMNADO: TARJETAS_ALUMNADO, CLAVE: CLAVE };
})();
window.FichaPersona = FichaPersona;
