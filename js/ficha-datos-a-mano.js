/* ============================================================
   ficha-datos-a-mano.js — la franja «Datos del asunto» (23-oct-2026,
   fila 426, docs/FICHA-VISTA-DE-TRABAJO.md, parte B).

   Va arriba de la columna derecha de «Trabajo» (`#trabajo-der-arriba`,
   js/ficha-tarjetas.js), encima de la carpeta y del documento abierto.
   - Cerrada (al entrar): una línea con los datos de uso diario del
     tercero, cada uno con su ⧉: en alumnado NIE, curso, unidad, teléfono y
     correo del primer contacto; en otro tercero NIF o DNI, teléfono y
     correo. Si no cabe, se corta con «…» por el final.
   - Abierta (al pulsarla, fuera de un ⧉): debajo, lo mismo que «Ver
     todo» de «Datos y contacto» (js/ficha-tercero.js) y los campos del
     asunto (`FichaNucleo.datosDelAsunto`, el pintado de «Campos del
     asunto»). Se recuerda mientras se está en el asunto; en otro, cerrada.
   Solo lee: nada se guarda aquí.
   ============================================================ */
var FichaDatosAMano = (function () {

  var abierta = false;
  var asuntoClave = null;
  var turno = 0;
  var datos = null;   /* lo último leído del tercero: { categoria, persona, resumen } */

  function $(id) { return document.getElementById(id); }

  /* ---------- la línea de datos ---------- */

  function primeroDe(persona, patron) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      if (patron.test(U.normalizar(claves[i])) && String(campos[claves[i]] || '').trim()) return String(campos[claves[i]]).trim();
    }
    return '';
  }

  /* [{ texto, copia, ayuda }] en el orden de la línea. */
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

  function pintarLinea() {
    var linea = $('datos-mano-linea');
    if (!linea) return;
    linea.innerHTML = '';
    var lista = datosDeUso(datos);
    if (!lista.length) {
      linea.textContent = datos ? 'Sin datos del interesado' : '';
      linea.classList.toggle('vacia', !!datos);
      return;
    }
    linea.classList.remove('vacia');
    lista.forEach(function (x, i) {
      if (i) { var punto = document.createElement('span'); punto.className = 'tercero-punto'; punto.textContent = ' · '; linea.appendChild(punto); }
      var chip = FichaTercero.datoConCopiar(x.texto, x.copia, x.ayuda);
      chip.classList.add('datos-mano-dato');
      linea.appendChild(chip);
    });
  }

  /* ---------- lo de debajo, al abrirla ---------- */

  function pintarCuerpo(a) {
    var cuerpo = $('datos-mano-cuerpo');
    if (!cuerpo) return;
    cuerpo.innerHTML = '<div class="dm-seccion" id="dm-contacto"></div><div class="dm-seccion" id="dm-campos"></div>';
    var contacto = $('dm-contacto');
    if (datos && datos.persona) {
      var construido = FichaTercero.construirVerTodo(datos.persona, datos.categoria, datos.resumen, a, true);
      contacto.innerHTML = '<h4 class="dm-sub">Datos y contacto</h4>' + construido.html;
      if (construido.montar) construido.montar(contacto);
    } else {
      contacto.innerHTML = '<h4 class="dm-sub">Datos y contacto</h4><p class="explica">' +
        U.escapar((datos && datos.aviso) || 'Sin datos del interesado.') + '</p>';
    }
    var campos = $('dm-campos');
    var tramite = window.FichaNucleo ? FichaNucleo.datosDelAsunto(a) : null;
    if (tramite) {
      /* Los números de identificación de la pestaña «Campos del asunto» se quedan allí: aquí no se repiten. */
      tramite = tramite.replace(/ id="ficha-formularios-(fila|valor)"/g, '');
      var anadir = window.CampoDesdeElAsunto ? CampoDesdeElAsunto.botonTituloHtml().replace('id="ficha-campo-anadir"', 'id="dm-campo-anadir"') : '';
      campos.innerHTML = '<h4 class="dm-sub">Campos del asunto' + anadir + '</h4>' + tramite;
      var b = campos.querySelector('#dm-campo-anadir');
      if (b) b.onclick = function () { CampoDesdeElAsunto.abrir(a); };
      if (window.CampoDesdeElAsunto) CampoDesdeElAsunto.alPintar(campos, a);
    }
  }

  /* ---------- abrir y cerrar ---------- */

  function aplicar(a) {
    var raiz = $('datos-mano');
    if (!raiz) return;
    raiz.classList.toggle('abierta', abierta);
    var cabeza = $('datos-mano-cabeza');
    if (cabeza) cabeza.setAttribute('aria-expanded', abierta ? 'true' : 'false');
    var flecha = raiz.querySelector('.datos-mano-flecha');
    if (flecha) flecha.textContent = abierta ? '▾' : '▸';
    var cuerpo = $('datos-mano-cuerpo');
    if (cuerpo) cuerpo.classList.toggle('oculto', !abierta);
    if (abierta) pintarCuerpo(a);
    else if (cuerpo) cuerpo.innerHTML = '';
    if (window.FichaTarjetas && FichaTarjetas.ajustarAlto) FichaTarjetas.ajustarAlto();
  }

  function pintar(a) {
    var caja = $('trabajo-der-arriba');
    if (!caja || !a || !window.FichaTercero) return;
    if (asuntoClave !== a.nombre) { asuntoClave = a.nombre; abierta = false; datos = null; }
    caja.innerHTML =
      '<section class="ficha-bloque datos-mano" id="datos-mano">' +
        '<div class="datos-mano-cabeza" id="datos-mano-cabeza" role="button" tabindex="0" aria-expanded="false" data-ayuda-clave="datos-del-asunto-plegar">' +
          '<span class="datos-mano-flecha" aria-hidden="true">▸</span>' +
          '<span class="datos-mano-titulo">Datos del asunto</span>' +
          '<span class="datos-mano-linea" id="datos-mano-linea"></span>' +
        '</div>' +
        '<div class="datos-mano-cuerpo oculto" id="datos-mano-cuerpo"></div>' +
      '</section>';
    var cabeza = $('datos-mano-cabeza');
    function alternar(ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.dato-copiable')) return;
      abierta = !abierta;
      aplicar(a);
    }
    cabeza.onclick = alternar;
    cabeza.onkeydown = function (ev) {
      if (ev.target !== cabeza || (ev.key !== 'Enter' && ev.key !== ' ')) return;
      ev.preventDefault();
      alternar(ev);
    };
    if (datos) pintarLinea();
    aplicar(a);
    var mio = ++turno;
    FichaTercero.datosBasicos(a).then(function (d) {
      if (mio !== turno) return;
      datos = d;
      pintarLinea();
      if (abierta) pintarCuerpo(a);
    }).catch(function () { /* accesorio: sin datos, la línea queda vacía */ });
  }

  return { pintar: pintar, _datosDeUso: datosDeUso };
})();
window.FichaDatosAMano = FichaDatosAMano;
