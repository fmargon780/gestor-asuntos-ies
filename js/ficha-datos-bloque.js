/* ============================================================
   ficha-datos-bloque.js — el bloque «Datos» de la vista del asunto
   (13-nov-2026, fila 637, docs/637-VISTA-DEL-ASUNTO-CABECERA-Y-PANEL.md).
   Sustituye a la franja «Datos del asunto» (fila 426) y a las pestañas
   «Datos y contacto», «Campos del asunto» y al botón «El encargo».

   - Plegado (en la cabecera del bloque, `[data-resumen-bloque="datos"]`): la línea de los datos que se han
     elegido para ver ahí (`js/datos-favoritos.js`), cada uno con su ⧉. Sin ninguno elegido, los de uso diario
     de siempre (NIE, curso, unidad, teléfono y correo; NIF o DNI, teléfono y correo).
   - Abierto, tres recuadros: la persona (con «Ver todo» y «Elegir qué se ve plegado», que sustituye a «Elegir
     datos»), «Contacto» y «Campos de este asunto» (con «+ Añadir campo»). Al pie, «Abierto el… · quién».
   - Según la clase de tercero cambian el título y lo de dentro de los dos primeros: «La alumna» / «El alumno»,
     «La persona» (personal y tutor legal), «La empresa», «El organismo», «El grupo» (sin «Contacto»).
   - «Quién lo pide» y «Por qué vía» salen dentro de «Campos de este asunto» (js/ficha-bloques.js).
   Solo lee: las ventanas de «Ver todo», «Cambiar los datos», «Añadir campo» y «Cambiar» (el encargo) son las de siempre.
   ============================================================ */
var FichaDatosBloque = (function () {

  var turno = 0;
  var datos = null;        /* lo último leído del tercero: { categoria, persona, resumen, aviso, fuente, sexo } */
  var asuntoClave = null;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t == null ? '' : String(t)); }

  /* ---------- la línea plegada ---------- */

  function primeroDe(persona, patron) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      if (patron.test(U.normalizar(claves[i])) && String(campos[claves[i]] || '').trim()) return String(campos[claves[i]]).trim();
    }
    return '';
  }

  /* Los de uso diario de siempre: [{ texto, copia, ayuda }]. */
  function datosDeUso(d) {
    var salida = [];
    if (!d || !d.persona) return salida;
    var p = d.persona, r = d.resumen || {};
    var telefono = '', correo = '', etiquetaTel = '';
    if (d.categoria === 'ALUMNADO') {
      if (p.id) salida.push({ texto: 'NIE ' + p.id, copia: p.id, ayuda: 'Copiar el NIE' });
      if (p.curso) salida.push({ texto: 'Curso ' + p.curso, copia: p.curso, ayuda: 'Copiar el curso' });
      if (p.unidad) salida.push({ texto: 'Unidad ' + p.unidad, copia: p.unidad, ayuda: 'Copiar la unidad' });
      var tutores = Datos.tutoresDe(p);
      var alumno = window.FichaTerceroAlumno && FichaTerceroAlumno.contactoDelAlumno ? FichaTerceroAlumno.contactoDelAlumno(p) : { telefonos: [], correos: [] };
      var deTutor = !!(r.telefono && r.telefono.etiqueta);
      telefono = (r.telefono && r.telefono.valor) || alumno.telefonos[0] || '';
      etiquetaTel = deTutor ? r.telefono.etiqueta : '';
      var delTutor = (tutores[0] && tutores[0].correos[0]) || '';
      correo = deTutor ? (delTutor || alumno.correos[0] || '') : (alumno.correos[0] || delTutor);
    } else {
      var doc = r.documento && r.documento.valor;
      if (doc) salida.push({ texto: (d.categoria === 'EMPRESAS' ? 'NIF ' : 'DNI ') + doc, copia: doc, ayuda: 'Copiar el ' + (d.categoria === 'EMPRESAS' ? 'NIF' : 'DNI') });
      telefono = (r.telefono && r.telefono.valor) || '';
      correo = primeroDe(p, /correo|e-?mail/);
    }
    if (telefono) {
      var legible = window.FichaTerceroAlumno ? FichaTerceroAlumno.telefonoLegible(telefono) : telefono;
      salida.push({ texto: 'Tel. ' + legible, copia: String(telefono).replace(/\s+/g, ''), ayuda: 'Copiar el teléfono' + (etiquetaTel ? ' (' + etiquetaTel + ')' : '') });
    }
    if (correo) salida.push({ texto: correo, copia: correo, ayuda: 'Copiar el correo' });
    return salida;
  }

  /* Lo elegido con «Elegir qué se ve plegado»; si no hay nada elegido que se vea, lo de uso diario. */
  function datosDeLaLinea(d) {
    if (!d || !d.persona) return [];
    var elegidos = window.DatosFavoritos ? DatosFavoritos.visibles(d.persona, d.categoria, d.fuente) : [];
    if (elegidos.length) {
      return elegidos.map(function (f) {
        var titulo = f.clave === 'nº id. escolar' ? 'NIE' : f.titulo;   /* en Séneca se llama «Nº Id. Escolar»; aquí, NIE */
        return { texto: titulo + ' ' + f.valor, copia: f.valor, ayuda: 'Copiar ' + titulo.toLowerCase() };
      });
    }
    return datosDeUso(d);
  }

  function pintarLinea() {
    var linea = document.querySelector('[data-resumen-bloque="datos"]');
    if (!linea) return;
    linea.innerHTML = '';
    var lista = datosDeLaLinea(datos);
    if (!lista.length) return;
    lista.forEach(function (x, i) {
      if (i) { var punto = document.createElement('span'); punto.className = 'tercero-punto'; punto.textContent = ' · '; linea.appendChild(punto); }
      var chip = FichaTercero.datoConCopiar(x.texto, x.copia, x.ayuda);
      chip.classList.add('datos-mano-dato');
      linea.appendChild(chip);
    });
  }

  /* ---------- los recuadros ---------- */

  function grupo(titulo, clase) {
    var g = document.createElement('div');
    g.className = 'datos-grupo' + (clase ? ' ' + clase : '');
    var h = document.createElement('h4');
    h.textContent = titulo;
    g.appendChild(h);
    return g;
  }

  /* filas: [{ rotulo, texto, copia, ayuda }] */
  function lista(filas) {
    var dl = document.createElement('dl');
    dl.className = 'datos-dl';
    filas.forEach(function (f) {
      if (!f.texto) return;
      var dt = document.createElement('dt'); dt.textContent = f.rotulo;
      var dd = document.createElement('dd');
      if (f.copia) dd.appendChild(FichaTercero.datoConCopiar(f.texto, f.copia, f.ayuda));
      else dd.textContent = f.texto;
      dl.appendChild(dt); dl.appendChild(dd);
    });
    return dl;
  }

  function boton(texto, ayuda, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-chico';
    b.textContent = texto;
    if (ayuda) b.title = ayuda;
    b.onclick = alPulsar;
    return b;
  }

  var TITULOS = {
    EMPRESAS: 'La empresa', ADMINISTRACIONES: 'El organismo', PERSONAL: 'La persona', 'TUTORES LEGALES': 'La persona'
  };

  function tituloDePersona(d, a) {
    if (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a)) return 'El grupo';
    if (d.categoria === 'ALUMNADO') return d.sexo === 'M' ? 'La alumna' : 'El alumno';
    return TITULOS[d.categoria] || 'El tercero';
  }

  /* El recuadro de la persona (o empresa, organismo, grupo). */
  function recuadroPersona(d, a, repintar) {
    var g = grupo(tituloDePersona(d, a));
    var p = d.persona, r = d.resumen || {};
    if (!p) {
      var aviso = document.createElement('p');
      aviso.className = 'explica';
      aviso.textContent = d.aviso || 'Sin datos del interesado.';
      g.appendChild(aviso);
      return g;
    }
    var filas = [];
    if (d.categoria === 'ALUMNADO') {
      filas.push({ rotulo: 'NIE', texto: p.id, copia: p.id, ayuda: 'Copiar el NIE' });
      filas.push({ rotulo: 'Curso', texto: p.curso, copia: p.curso, ayuda: 'Copiar el curso' });
      filas.push({ rotulo: 'Unidad', texto: p.unidad, copia: p.unidad, ayuda: 'Copiar la unidad' });
      if (r.edad) filas.push({ rotulo: 'Edad', texto: r.edad });
    } else if (d.categoria === 'EMPRESAS') {
      filas.push({ rotulo: 'Razón social', texto: r.nombre || p.nombre, copia: r.nombre || p.nombre, ayuda: 'Copiar la razón social' });
      filas.push({ rotulo: 'NIF', texto: p.nif, copia: p.nif, ayuda: 'Copiar el NIF' });
      filas.push({ rotulo: 'Nombre comercial', texto: p.comercial });
    } else if (d.categoria === 'ADMINISTRACIONES') {
      filas.push({ rotulo: 'Nombre', texto: r.nombre || p.nombre, copia: r.nombre || p.nombre, ayuda: 'Copiar el nombre' });
      filas.push({ rotulo: 'Referencia', texto: p.referencia, copia: p.referencia, ayuda: 'Copiar la referencia' });
    } else {
      var doc = (r.documento && r.documento.valor) || p.documento;
      filas.push({ rotulo: 'DNI', texto: doc, copia: doc, ayuda: 'Copiar el DNI' });
      filas.push({ rotulo: 'Puesto', texto: p.puesto });
    }
    g.appendChild(lista(filas));
    if (r.documento && r.documento.falta) {
      var falta = document.createElement('p');
      falta.className = 'datos-aviso';
      falta.textContent = 'Falta el DNI (' + r.documento.edad + ' años, ya debería tenerlo).';
      g.appendChild(falta);
    }
    if (r.grupo && r.grupo.detalle) {
      var det = document.createElement('p');
      det.className = 'tercero-detalle';
      det.textContent = r.grupo.detalle;
      g.appendChild(det);
    }
    var botones = document.createElement('div');
    botones.className = 'datos-botones';
    botones.appendChild(boton('Ver todo', 'Todos los datos de ' + (p.nombre || 'esta persona'), function () {
      FichaTercero.verTodo(p, d.categoria, r, a);
    })).setAttribute('data-solo-lectura', '');   /* fila 260: «Ver todo» solo mira */
    if (window.FichaDatosFavoritos && d.categoria) {
      botones.appendChild(boton('Elegir qué se ve plegado', 'Elige hasta 3 datos para verlos con el bloque plegado, en todos los asuntos de esta clase de tercero', function () {
        FichaDatosFavoritos.elegir(a);
      }));
    }
    if (FichaTercero.sePuedeCambiar(p, a)) {
      botones.appendChild(boton('Cambiar los datos', '', function (ev) { FichaTercero.cambiarDatos(p, a, ev.currentTarget); }));
    }
    g.appendChild(botones);
    /* Fila 110 (tablas de datos) y fila 111 (casilla Sexo): se cuelgan de este recuadro, como antes de «Datos y contacto». */
    var extra = document.createElement('div');
    extra.className = 'ficha-bloque dm-extra';
    g.appendChild(extra);
    if (window.TablasDatosPantalla) TablasDatosPantalla.pintarEnFicha(g, p);
    if (window.Genero) Genero.pintarEnFicha(g, p, d.categoria);
    return g;
  }

  /* «Contacto»: los tutores de un alumno, o el teléfono y el correo de los demás. */
  function recuadroContacto(d) {
    var p = d.persona;
    if (!p) return null;
    var g = grupo('Contacto');
    var filas = [];
    var legible = function (t) { return window.FichaTerceroAlumno ? FichaTerceroAlumno.telefonoLegible(t) : t; };
    if (d.categoria === 'ALUMNADO') {
      var tutores = Datos.tutoresDe(p);
      tutores.forEach(function (t) {
        var etiqueta = window.FichaTerceroAlumno ? FichaTerceroAlumno.etiquetaDeTutor(t) : ('Tutor legal ' + t.numero);
        filas.push({ rotulo: etiqueta, texto: t.nombre });
        t.telefonos.forEach(function (tel) { filas.push({ rotulo: 'Teléfono', texto: legible(tel), copia: String(tel).replace(/\s+/g, ''), ayuda: 'Copiar el teléfono' }); });
        t.correos.forEach(function (c) { filas.push({ rotulo: 'Correo', texto: c, copia: c, ayuda: 'Copiar el correo' }); });
      });
      var alumno = window.FichaTerceroAlumno ? FichaTerceroAlumno.contactoDelAlumno(p) : { telefonos: [], correos: [] };
      alumno.telefonos.forEach(function (tel) { filas.push({ rotulo: 'Teléfono del alumno', texto: legible(tel), copia: String(tel).replace(/\s+/g, ''), ayuda: 'Copiar el teléfono' }); });
      alumno.correos.forEach(function (c) { filas.push({ rotulo: 'Correo del alumno', texto: c, copia: c, ayuda: 'Copiar el correo' }); });
    }
    if (d.categoria !== 'ALUMNADO' || !filas.some(function (f) { return f.texto; })) {
      /* Los demás terceros (y un alumno sin tutores numerados): el teléfono y el correo que traiga el fichero. */
      var campos = p.campos || {};
      Object.keys(campos).forEach(function (k) {
        var v = String(campos[k] || '').trim();
        var t = U.normalizar(k);
        if (!v) return;
        if (/telefono|movil/.test(t)) filas.push({ rotulo: k, texto: legible(v), copia: v.replace(/\s+/g, ''), ayuda: 'Copiar el teléfono' });
        else if (/correo|e-?mail/.test(t)) filas.push({ rotulo: k, texto: v, copia: v, ayuda: 'Copiar el correo' });
      });
    }
    if (!filas.some(function (f) { return f.texto; })) {
      var vacio = document.createElement('p');
      vacio.className = 'explica';
      vacio.textContent = 'Sin contacto apuntado.';
      g.appendChild(vacio);
    } else g.appendChild(lista(filas));
    return g;
  }

  /* «Campos de este asunto», con «+ Añadir campo». */
  function recuadroCampos(a) {
    var tramite = window.FichaNucleo ? FichaNucleo.datosDelAsunto(a) : null;
    if (!tramite) return null;
    var g = grupo('Campos de este asunto', 'ancho');
    var cuerpo = document.createElement('div');
    cuerpo.innerHTML = tramite;
    while (cuerpo.firstChild) g.appendChild(cuerpo.firstChild);
    if (window.CampoDesdeElAsunto && FichaNucleo.modoActual === 'abierto') {
      var botones = document.createElement('div');
      botones.className = 'datos-botones';
      botones.innerHTML = CampoDesdeElAsunto.botonTituloHtml();
      var anadir = botones.querySelector('button');
      if (anadir) anadir.onclick = function () { CampoDesdeElAsunto.abrir(a); };
      g.appendChild(botones);
    }
    var cambiar = g.querySelectorAll('.encargo-cambiar');
    Array.prototype.forEach.call(cambiar, function (b) {
      b.onclick = async function () {
        try { await FichaNucleo.abrirLoPide(a, b); } finally { if (App.repintarAccionesFicha) App.repintarAccionesFicha(); pintar(a); }
      };
    });
    return g;
  }

  function pie(a) {
    var f = a.ficha || {};
    var trozos = [a.leido && a.leido.fecha ? 'Abierto el ' + U.fechaLegible(a.leido.fecha) : '', f.abiertoPor || ''].filter(Boolean);
    if (!trozos.length) return null;
    var p = document.createElement('p');
    p.className = 'datos-pie';
    p.textContent = trozos.join(' · ');
    return p;
  }

  /* ---------- pintar ---------- */

  function pintarCuerpo(a) {
    var caja = $('ficha-datos-bloque');
    if (!caja) return;
    caja.innerHTML = '';
    var grupos = document.createElement('div');
    grupos.className = 'datos-grupos';
    if (datos) {
      grupos.appendChild(recuadroPersona(datos, a));
      var esGrupo = window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a);
      var c = esGrupo ? null : recuadroContacto(datos);
      if (c) grupos.appendChild(c);
    } else {
      var leyendo = grupo('Leyendo…');
      grupos.appendChild(leyendo);
    }
    var campos = recuadroCampos(a);
    if (campos) grupos.appendChild(campos);
    caja.appendChild(grupos);
    var p = pie(a);
    if (p) caja.appendChild(p);
    /* Los campos del asunto necesitan sus enganches (el «⋮» de «solo aquí», los formularios, los datos de lista). */
    if (campos && window.CampoDesdeElAsunto) CampoDesdeElAsunto.alPintar(campos, a);
  }

  function pintar(a) {
    if (!a || !window.FichaTercero) return;
    if (asuntoClave !== a.nombre) { asuntoClave = a.nombre; datos = null; }
    pintarCuerpo(a);
    if (datos) pintarLinea();
    var mio = ++turno;
    var siempre = FichaTercero.datosBasicos(a).then(async function (d) {
      if (mio !== turno || !d.persona) return;
      var cargado = window.FichaDatosFavoritos ? await FichaDatosFavoritos.cargar(a) : { fuente: null };
      var sexo = '';
      if (d.persona && d.categoria === 'ALUMNADO') {
        try { sexo = window.Genero ? await Genero.sexoDe(d.persona, d.categoria) : ''; } catch (e) { sexo = ''; }
        if (!sexo && window.FichaTerceroAlumno && FichaTerceroAlumno.sexoDelAlumno) sexo = FichaTerceroAlumno.sexoDelAlumno(d.persona);
      }
      if (mio !== turno) return;
      datos = { categoria: d.categoria, persona: d.persona, resumen: d.resumen, fuente: cargado.fuente, sexo: sexo, aviso: '' };
      pintarLinea();
      pintarCuerpo(a);
    });
    /* Sin persona (grupo, sin tercero, sin fichero) se enseña el aviso de siempre. */
    siempre.catch(function () { /* accesorio: sin datos, queda lo que hay */ });
    if (window.FichaTercero._buscarPersona) {
      FichaTercero._buscarPersona(a).then(function (r) {
        if (mio !== turno || r.persona) return;
        datos = { categoria: r.categoria, persona: null, resumen: null, fuente: null, sexo: '', aviso: r.aviso || '' };
        pintarCuerpo(a);
      }).catch(function () { /* igual */ });
    }
  }

  return { pintar: pintar, _datosDeUso: datosDeUso, _datosDeLaLinea: datosDeLaLinea };
})();
window.FichaDatosBloque = FichaDatosBloque;
