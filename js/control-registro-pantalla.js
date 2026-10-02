/* ============================================================
   control-registro-pantalla.js — la pantalla «Control del registro»
   (2-oct-2026, fila 259, docs/CONTROL-DEL-REGISTRO.md).

   Vive dentro de Herramientas: un bloque con el botón «Abrir el control
   del registro» (js/herramientas.js lo pinta) y una vista a todo el
   ancho que sustituye a la lista de bloques, con «← Volver». Los datos y
   el emparejado están en js/control-registro.js.
   ============================================================ */
var ControlRegistroPantalla = (function () {

  var E = { estado: null, asuntos: [], clasif: null, pestana: 'E', abierta: false, avisoSubida: '', avisoDesde: '' };

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  function decodificar(bytes) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (e) { return new TextDecoder('windows-1252').decode(bytes); }
  }

  /* ---------- abrir y cerrar ---------- */

  async function abrir() {
    E.abierta = true;
    var lista = $('herramientas-lista'), vista = $('control-registro-vista');
    if (!vista) return;
    if (lista) lista.classList.add('oculto');
    vista.classList.remove('oculto');
    await recargar();
  }

  function cerrar() {
    E.abierta = false;
    var lista = $('herramientas-lista'), vista = $('control-registro-vista');
    if (lista) lista.classList.remove('oculto');
    if (vista) vista.classList.add('oculto');
  }

  async function recargar() {
    var vista = $('control-registro-vista');
    try {
      E.estado = await ControlRegistro.cargar();
      E.asuntos = await ControlRegistro.contextoDeAsuntos();
      E.clasif = ControlRegistro.clasificar(E.estado, E.asuntos);
    } catch (e) {
      if (vista) vista.innerHTML = '<div class="aviso aviso-rojo">No he podido leer el control del registro: ' + esc(U.mensajeDeError(e)) + '</div>';
      return;
    }
    pintar();
    if (window.ControlRegistroAvisos) ControlRegistroAvisos.calcular(true);
  }

  /* ---------- pintar ---------- */

  function textoSubida(libro) {
    var s = E.estado.control.subidas[libro];
    var nombre = libro === 'E' ? 'Entrada' : 'Salida';
    if (!s) return nombre + ': sin subir todavía';
    return nombre + ': hasta el ' + ControlRegistro.fechaLarga(s.hasta) + ' · subido el ' +
      esc(ControlRegistro.fechaLarga(String(s.el).slice(0, 10))) + (s.por ? ' por ' + esc(s.por) : '');
  }

  function celdaAsunto(x) {
    var a = x.asunto;
    var nombre = (window.Reservados ? Reservados.candadoHtml(a) + esc(Reservados.nombreParaVer(a)) : esc(a.nombre));
    return '<button type="button" class="enlace cr-asunto" data-accion="abrir-asunto" data-solo-lectura data-nombre="' + esc(a.nombre) + '">' + nombre + '</button>' +
      (a.abierto ? '' : ' <span class="suave">(archivado)</span>') +
      (x.nota ? '<div class="cr-nota">el registro no está apuntado en el asunto</div>' : '');
  }

  function filaBase(x, extra) {
    var a = x.apunte;
    return '<tr data-codigo="' + esc(a.codigo) + '"><td class="cr-cod">' + esc(a.codigo) + '</td>' +
      '<td>' + esc(ControlRegistro.fechaLarga(a.fecha)) + '</td>' +
      '<td class="cr-extracto">' + esc(a.extracto) + (a.estado === 'incompleto' ? ' <span class="cr-incompleto">Incompleto</span>' : '') + '</td>' +
      '<td>' + esc(a.clase) + '</td><td>' + esc(a.parte) + '</td><td>' + esc(a.via) + '</td>' + (extra || '') + '</tr>';
  }

  function cabecera(libro, extra) {
    return '<thead><tr><th>Registro</th><th>Fecha</th><th>Extracto</th><th>Clase de documento</th><th>' +
      (libro === 'E' ? 'Remitente' : 'Destinatario') + '</th><th>' + (libro === 'E' ? 'Modo de recepción' : 'Modo de envío') + '</th>' +
      (extra || '') + '</tr></thead>';
  }

  function tablaSin(libro, lista) {
    if (!lista.length) return '<div class="vacio">Ningún apunte sin asunto.</div>';
    var off = soloConsulta() ? ' disabled' : '';
    return '<table class="cr-tabla">' + cabecera(libro, '<th></th>') + '<tbody>' + lista.map(function (x) {
      return filaBase(x, '<td class="cr-acciones">' +
        '<button type="button" class="boton" data-accion="crear"' + off + '>Crear asunto</button> ' +
        '<button type="button" class="boton" data-accion="no-necesita"' + off + '>No necesita asunto</button> ' +
        '<details class="cr-mas"><summary title="Más">⋮</summary><div class="cr-menu">' +
        '<button type="button" class="boton" data-accion="es-de"' + off + '>Es de este asunto…</button>' +
        (x.apunte.clase ? '<button type="button" class="boton" data-accion="clase"' + off + '>Esta clase nunca lleva asunto</button>' : '') +
        '</div></details></td>');
    }).join('') + '</tbody></table>';
  }

  function plegado(titulo, n, cuerpo) {
    return '<details class="cr-plegado"><summary>' + esc(titulo) + ' (' + n + ')</summary>' + cuerpo + '</details>';
  }

  function tablaCon(libro, lista) {
    if (!lista.length) return '<div class="vacio">Ninguno.</div>';
    return '<table class="cr-tabla">' + cabecera(libro, '<th>Asunto</th>') + '<tbody>' +
      lista.map(function (x) { return filaBase(x, '<td>' + celdaAsunto(x) + '</td>'); }).join('') + '</tbody></table>';
  }

  function tablaAnulados(libro, lista) {
    if (!lista.length) return '<div class="vacio">Ninguno.</div>';
    return '<table class="cr-tabla">' + cabecera(libro) + '<tbody>' + lista.map(function (x) { return filaBase(x); }).join('') + '</tbody></table>';
  }

  function cuerpoNo(libro, lista) {
    var off = soloConsulta() ? ' disabled' : '';
    var clases = E.estado.control.clasesSinAsunto[libro] || [];
    var arriba = clases.length
      ? '<div class="cr-clases">Clases que nunca llevan asunto: ' + clases.map(function (c) {
          return '<span class="cr-clase">' + esc(c) + ' <button type="button" class="enlace" data-accion="quitar-clase" data-clase="' + esc(c) + '"' + off + '>✕ Quitar</button></span>';
        }).join(' ') + '</div>'
      : '';
    if (!lista.length) return arriba + '<div class="vacio">Ninguno.</div>';
    return arriba + '<table class="cr-tabla">' + cabecera(libro, '<th></th>') + '<tbody>' + lista.map(function (x) {
      return filaBase(x, '<td>' + (x.por === 'clase' ? '<span class="suave">por su clase</span> ' : '') +
        (x.por === 'decision' ? '<button type="button" class="boton" data-accion="si-necesita"' + off + '>Sí necesita asunto</button>' : '') + '</td>');
    }).join('') + '</tbody></table>';
  }

  function cuerpoSobrantes(libro) {
    var lista = ControlRegistro.sobrantes(E.estado.apuntes, E.asuntos).filter(function (x) { return x.libro === libro; });
    if (!lista.length) return plegado('En la aplicación y no en Séneca', 0, '<div class="vacio">Ninguno.</div>');
    return plegado('En la aplicación y no en Séneca', lista.length, '<table class="cr-tabla"><thead><tr><th>Registro</th><th>Asunto</th></tr></thead><tbody>' +
      lista.map(function (x) {
        return '<tr><td class="cr-cod">' + esc(x.codigo) + '</td><td>' + celdaAsunto({ asunto: x.asunto }) + '</td></tr>';
      }).join('') + '</tbody></table>');
  }

  function pintar() {
    var vista = $('control-registro-vista');
    if (!vista || !E.estado) return;
    var c = E.estado.control, cl = E.clasif, off = soloConsulta() ? ' disabled' : '';
    var huecos = ControlRegistro.huecos(E.estado.apuntes);
    var g = cl[E.pestana];
    var abiertos = Array.prototype.map.call(vista.querySelectorAll('.cr-plegado[open] > summary'), function (x) { return x.textContent.replace(/ \(\d+\)$/, ''); });
    vista.innerHTML =
      '<div class="cr-barra"><button type="button" class="boton" data-accion="volver" data-solo-lectura>← Volver</button>' +
        '<h3 class="cr-titulo">Control del registro</h3></div>' +
      '<div class="cr-fila">' +
        '<button type="button" class="boton boton-principal" data-accion="subir"' + off + '>Subir listados de Séneca</button>' +
        '<input type="file" id="cr-ficheros" accept=".csv,text/csv" multiple class="oculto">' +
        '<label class="cr-desde">Revisar desde el día <input type="date" id="cr-desde" class="campo" value="' + esc(c.desde) + '"' + off + '></label>' +
        '<span class="suave">' + textoSubida('E') + '</span><span class="suave">' + textoSubida('S') + '</span>' +
      '</div>' +
      (E.avisoSubida ? '<div class="aviso aviso-verde cr-aviso" id="cr-aviso-subida">' + E.avisoSubida + '</div>' : '') +
      (E.avisoDesde ? '<div class="aviso aviso-ambar cr-aviso">' + esc(E.avisoDesde) + '</div>' : '') +
      (!c.desde ? '<div class="aviso aviso-ambar cr-aviso">Pon la fecha «Revisar desde el día…» para poder subir los listados.</div>' : '') +
      huecos.map(function (h) { return '<div class="aviso aviso-ambar cr-aviso cr-hueco">' + esc(ControlRegistro.textoHueco(h)) + '</div>'; }).join('') +
      '<div class="cr-pestanas">' +
        ['E', 'S'].map(function (l) {
          return '<button type="button" class="cr-pestana' + (l === E.pestana ? ' activa' : '') + '" data-accion="pestana" data-solo-lectura data-libro="' + l + '">' +
            (l === 'E' ? 'Entrada' : 'Salida') + ' (' + cl[l].sin.length + ' sin asunto)</button>';
        }).join('') +
      '</div>' +
      '<div class="cr-cuerpo" id="cr-cuerpo">' +
        '<h4>Sin asunto</h4>' + tablaSin(E.pestana, g.sin) +
        plegado('Con asunto', g.con.length, tablaCon(E.pestana, g.con)) +
        plegado('No necesitan asunto', g.no.length, cuerpoNo(E.pestana, g.no)) +
        plegado('Anulados', g.anulados.length, tablaAnulados(E.pestana, g.anulados)) +
        cuerpoSobrantes(E.pestana) +
      '</div>';
    Array.prototype.forEach.call(vista.querySelectorAll('.cr-plegado'), function (d) {
      if (abiertos.indexOf(d.firstChild.textContent.replace(/ \(\d+\)$/, '')) !== -1) d.open = true;
    });
    var f = $('cr-ficheros');
    if (f) f.onchange = function (ev) {
      var elegidos = Array.prototype.slice.call(ev.target.files || []);
      ev.target.value = '';
      if (elegidos.length) subirFicheros(elegidos);
    };
    var d = $('cr-desde');
    if (d) d.onchange = function () { cambiarDesde(d.value); };
  }

  /* ---------- acciones ---------- */

  async function hacer(fn) {
    try { await fn(); } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    await recargar();
  }

  async function cambiarDesde(valor) {
    if (!valor) return;
    await hacer(async function () {
      var r = await ControlRegistro.ponerDesde(valor);
      E.avisoDesde = r.atrasa ? 'Vuelve a subir los listados para revisar esos días.' : '';
      if (r.quitados) U.aviso('Se han quitado ' + r.quitados + ' apuntes anteriores a esa fecha.', 'bueno');
    });
  }

  async function subirFicheros(archivos) {
    if (soloConsulta()) return;
    var c = E.estado.control;
    if (!c.desde) {
      var propuesta = ControlRegistro.hoyIso();
      var ok = await U.preguntar('Revisar desde el día…',
        '<p>Antes de subir hay que decir desde qué día se revisa: lo registrado antes no se mira ni avisa.</p>' +
        '<p><input type="date" id="cr-desde-propuesta" class="campo" value="' + propuesta + '"></p>', 'Poner esta fecha y subir');
      if (!ok) return;
      var v = ($('cr-desde-propuesta') || {}).value;
      if (!v) { U.aviso('Pon una fecha para poder subir.', 'ambar'); return; }
      await ControlRegistro.ponerDesde(v);
    }
    await hacer(async function () {
      var ficheros = [];
      for (var i = 0; i < archivos.length; i++) {
        ficheros.push({ nombre: archivos[i].name, texto: decodificar(await archivos[i].arrayBuffer()) });
      }
      var r = await ControlRegistro.subir(ficheros);
      if (!r.ok) { U.aviso(r.motivo, 'ambar'); return; }
      var partes = [];
      ['E', 'S'].forEach(function (l) {
        var x = r.porLibro[l];
        if (!x) return;
        partes.push((l === 'E' ? 'Entrada' : 'Salida') + ': ' + x.total + (x.total === 1 ? ' apunte, ' : ' apuntes, ') + x.nuevos + (x.nuevos === 1 ? ' nuevo' : ' nuevos') +
          (x.fuera ? ' (' + x.fuera + ' anteriores a la fecha, dejados fuera)' : '') + '.');
      });
      E.avisoSubida = esc(partes.join(' '));
      r.rechazados.forEach(function (x) { U.aviso(x.nombre + ': ' + x.motivo, 'ambar'); });
      if (!partes.length) E.avisoSubida = '';
    });
  }

  function apunteDe(el) {
    var tr = el.closest('tr');
    var cod = tr && tr.dataset.codigo;
    return cod ? E.estado.apuntes[cod] : null;
  }

  /* Un tercero ya conocido que encaje con el remitente o destinatario (en cualquier categoría), si hay uno solo. */
  async function terceroQueEncaja(parte) {
    var h = ControlRegistro.hueso(parte);
    if (!h || !window.Datos || !App.E.datos) return null;
    var hallados = [];
    var categorias = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS'];
    for (var i = 0; i < categorias.length; i++) {
      try {
        var f = await Datos.cargar(App.E.datos, categorias[i]);
        ((f && f.lista) || []).forEach(function (p) { if (p && p.nombre && ControlRegistro.hueso(p.nombre) === h) hallados.push(p); });
      } catch (e) { /* esa categoría no se puede leer: se sigue con las demás */ }
    }
    return hallados.length === 1 ? hallados[0] : null;
  }

  async function crearAsunto(a) {
    var opciones = { fecha: a.fecha };
    var t = await terceroQueEncaja(a.parte);
    if (t) opciones.tercero = t;
    cerrar();
    App.nuevoAsuntoCon(opciones);
    if (App.E && App.E.nuevo) App.E.nuevo.controlRegistro = a.codigo;
  }

  function deshacer(texto, fn) {
    U.aviso(texto, 'bueno', { boton: 'Deshacer', alPulsar: function () { hacer(fn); } });
  }

  async function esDeEsteAsunto(a) {
    var elegido = await elegirAsunto();
    if (!elegido) return;
    await hacer(function () {
      return ControlRegistro.decidir(a.codigo, { que: 'asunto', numero: elegido.numero || '', carpeta: elegido.nombre });
    });
  }

  function elegirAsunto() {
    return new Promise(function (resolver) {
      var elegido = null;
      U.preguntar('Es de este asunto',
        '<input id="cr-buscar" class="campo" placeholder="Buscar por nombre o tercero">' +
        '<div class="lista" id="cr-lista-asuntos"></div>', 'Elegir').then(function () {
          var ac = $('cuadro-aceptar');
          if (ac) ac.classList.remove('oculto');
          resolver(elegido);
        });
      var ac = $('cuadro-aceptar');
      if (ac) ac.classList.add('oculto');
      function pintarLista() {
        var q = U.normalizar(($('cr-buscar') || {}).value || '');
        var lista = E.asuntos.filter(function (x) { return !q || U.normalizar(x.nombre + ' ' + x.tercero).indexOf(q) !== -1; }).slice(0, 100);
        $('cr-lista-asuntos').innerHTML = lista.length ? lista.map(function (x, i) {
          return '<button type="button" class="resultado" data-i="' + E.asuntos.indexOf(x) + '">' +
            (window.Reservados ? Reservados.candadoHtml(x) + esc(Reservados.nombreParaVer(x)) : esc(x.nombre)) +
            '<span class="resultado-pie">' + (x.abierto ? 'Abierto' : 'Archivado') + '</span></button>';
        }).join('') : '<div class="vacio">Ningún asunto con eso.</div>';
        Array.prototype.forEach.call($('cr-lista-asuntos').querySelectorAll('.resultado'), function (b) {
          b.onclick = function () { elegido = E.asuntos[parseInt(b.dataset.i, 10)]; document.getElementById('cuadro-aceptar').click(); };
        });
      }
      pintarLista();
      $('cr-buscar').oninput = pintarLista;
      try { $('cr-buscar').focus(); } catch (e) { /* sin foco */ }
    });
  }

  async function claveNunca(a) {
    var n = ControlRegistro.cuantosDeUnaClase(E.clasif, a.libro, a.clase);
    var ok = await U.preguntar('Esta clase nunca lleva asunto',
      '<p>La clase «' + esc(a.clase) + '» pasará a «No necesitan asunto». Afecta a ' + n + ' apuntes sin asunto.</p>', 'Aceptar');
    if (!ok) return;
    await hacer(function () { return ControlRegistro.ponerClaseSinAsunto(a.libro, a.clase); });
    deshacer('Clase «' + a.clase + '» pasada a «No necesitan asunto».', function () { return ControlRegistro.quitarClaseSinAsunto(a.libro, a.clase); });
  }

  async function alPulsar(ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    var accion = b.dataset.accion;
    if (accion === 'volver') return cerrar();
    if (accion === 'subir') { var f = $('cr-ficheros'); if (f) f.click(); return; }
    if (accion === 'pestana') { E.pestana = b.dataset.libro; pintar(); return; }
    if (accion === 'abrir-asunto') return abrirAsunto(b.dataset.nombre);
    if (accion === 'quitar-clase') {
      var cl = b.dataset.clase;
      return hacer(function () { return ControlRegistro.quitarClaseSinAsunto(E.pestana, cl); });
    }
    var a = apunteDe(b);
    if (!a) return;
    if (accion === 'crear') return crearAsunto(a);
    if (accion === 'no-necesita') {
      await hacer(function () { return ControlRegistro.decidir(a.codigo, { que: 'no-necesita' }); });
      return deshacer('Apunte ' + a.codigo + ' pasado a «No necesitan asunto».', function () { return ControlRegistro.quitarDecision(a.codigo); });
    }
    if (accion === 'si-necesita') return hacer(function () { return ControlRegistro.quitarDecision(a.codigo); });
    if (accion === 'es-de') return esDeEsteAsunto(a);
    if (accion === 'clase') return claveNunca(a);
  }

  async function abrirAsunto(nombre) {
    var x = E.asuntos.filter(function (a) { return a.nombre === nombre; })[0];
    if (!x) return;
    if (x.abierto) {
      var ab = (App.E.listaAbiertos || []).filter(function (a) { return a.nombre === nombre; })[0];
      if (ab) { App.abrirFicha(ab, 'abierto'); return; }
      U.aviso('Ya no está abierto: puede que se haya archivado desde otro ordenador.', 'malo');
      return;
    }
    try {
      var objeto = window.OtrosDelTercero ? await OtrosDelTercero.montarArchivado(nombre, x.categoria, x.tercero) : null;
      if (objeto) { App.abrirFicha(objeto, 'archivado'); return; }
    } catch (e) { /* aviso de abajo */ }
    U.aviso('No he podido abrir «' + nombre + '»: ya no está en el archivo.', 'malo');
  }

  /* Soltar ficheros encima de la vista. */
  function engancharArrastre(vista) {
    vista.addEventListener('dragover', function (ev) { ev.preventDefault(); });
    vista.addEventListener('drop', function (ev) {
      ev.preventDefault();
      var f = Array.prototype.slice.call((ev.dataTransfer && ev.dataTransfer.files) || []);
      if (f.length) subirFicheros(f);
    });
  }

  function enganchar() {
    var vista = $('control-registro-vista');
    if (vista) { vista.addEventListener('click', alPulsar); engancharArrastre(vista); }
    var abrirBtn = $('control-registro-abrir');
    if (abrirBtn) abrirBtn.onclick = abrir;
    /* Al crear un asunto desde un apunte, queda la decisión «asunto» de ese apunte. */
    if (window.Gestor && Gestor.alCrearAsunto) {
      Gestor.alCrearAsunto.push(async function (nombre, datos) {
        var codigo = App.E && App.E.nuevo && App.E.nuevo.controlRegistro;
        if (!codigo) return;
        await ControlRegistro.decidir(codigo, { que: 'asunto', numero: (datos && datos.numero) || '', carpeta: nombre });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { abrir: abrir, cerrar: cerrar, recargar: recargar, _estado: E };
})();
window.ControlRegistroPantalla = ControlRegistroPantalla;
