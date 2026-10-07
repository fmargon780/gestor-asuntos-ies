/* ============================================================
   ajustes-buscador.js — «Buscar en Ajustes…» (fila 288,
   docs/AJUSTES-EN-CUATRO-PESTANAS.md).

   Una caja en la línea de las pestañas. Busca al escribir, sin acentos ni
   mayúsculas, por palabras sueltas en cualquier orden, en: el título de cada
   sección, su línea gris, los rótulos de los campos y botones que lleva dentro
   y una lista de «otras palabras» (la tabla de js/ajustes-reparto.js). También
   encuentra lo que no está en Ajustes pero se busca aquí: las secciones de la
   pantalla Herramientas y las de la pantalla de un tipo de asunto.

   Los resultados salen debajo de la caja (como mucho diez). Pulsar uno va a su
   pestaña, abre la sección y la resalta; Esc o borrar la caja los quita.
   No sustituye a los buscadores de tipos de asunto y de tipos de documento.
   ============================================================ */
var AjustesBuscador = (function () {

  var MAXIMO = 10;
  var DONDE = { dia: 'Lo de cada día', centro: 'El centro', ordenador: 'Este ordenador', problemas: 'Problemas', herramientas: 'Herramientas' };

  /* Lo de la pantalla Herramientas que no se reparte desde Ajustes. */
  var HERRAMIENTAS = [
    { titulo: 'Control del registro', sel: '#bloque-control-registro', otras: 'registro de entrada, registro de salida, Séneca, apuntes' },
    { titulo: 'Papelera', sel: '#bloque-papelera', otras: 'borrados, recuperar' },
    { titulo: 'Traer el alumnado', sel: '#bloque-traer-alumnado', otras: 'alumnado, Séneca, RegAlum, base de datos' },
    { titulo: 'Tablas de datos', sel: '#bloque-tablas-datos', otras: 'tablas, datos, CSV' },
    { titulo: 'Restaurar una copia de seguridad', sel: '#bloque-restaurar-copia', otras: 'copia, restaurar, recuperar' }
  ];

  /* Las secciones de la pantalla de un tipo de asunto. */
  var DENTRO_DEL_TIPO = [
    { titulo: 'Datos del tipo', otras: 'nombre, categoría, nombre corto, quién encarga' },
    { titulo: 'Plantillas de correo y de Séneca', otras: 'plantilla, correo, mensaje' },
    { titulo: 'Plantilla de documento de Word', otras: 'plantilla, Word, documento, certificado' },
    { titulo: 'Guía', otras: 'hitos, tareas, procedimiento' },
    { titulo: 'Campos', otras: 'campos propios, campo calculado, importe' },
    { titulo: 'Plazo', otras: 'días, vencimiento' },
    { titulo: 'Al terminar el asunto', otras: 'por liquidar, archivar, avisar' },
    { titulo: 'Se repite', otras: 'recurrente, cada año, cada mes' },
    { titulo: 'Palabras clave', otras: 'buscar, correos, reconocer' }
  ];

  var lista = [];      /* resultados a la vista */

  function $(id) { return document.getElementById(id); }
  function norm(t) { return U.normalizar(String(t || '')); }

  function textoDe(det) {
    var partes = [];
    var pie = det.querySelector(':scope > summary .bloque-pie');
    if (pie) partes.push(pie.textContent);
    Array.prototype.forEach.call(det.querySelectorAll('label, button, .explica, .nota'), function (n) {
      partes.push(n.textContent);
    });
    return partes.join(' ');
  }

  function tituloDe(det) {
    var t = det.querySelector(':scope > summary .bloque-titulo');
    return t ? t.textContent.trim() : '';
  }

  function elementos() {
    var salida = [];
    window.AjustesReparto.TABLA.forEach(function (e) {
      if (e.dentro) return;
      var det = $(e.id);
      if (!det) return;
      salida.push({ titulo: tituloDe(det), donde: DONDE[e.donde], sel: '#' + e.id,
        texto: tituloDe(det) + ' ' + textoDe(det) + ' ' + (e.otras || '') });
    });
    HERRAMIENTAS.forEach(function (h) {
      var det = document.querySelector(h.sel);
      salida.push({ titulo: h.titulo, donde: DONDE.herramientas, sel: h.sel, herramientas: true,
        texto: h.titulo + ' ' + (det ? textoDe(det) : '') + ' ' + h.otras });
    });
    DENTRO_DEL_TIPO.forEach(function (d) {
      salida.push({ titulo: d.titulo, donde: 'Dentro de cada tipo de asunto', dentroDelTipo: true,
        texto: d.titulo + ' ' + d.otras });
    });
    return salida;
  }

  function buscar(q) {
    var palabras = norm(q).split(/\s+/).filter(Boolean);
    if (!palabras.length) return [];
    var buenos = [];
    elementos().forEach(function (e, i) {
      var pajar = norm(e.texto);
      var titulo = norm(e.titulo);
      if (!palabras.every(function (p) { return pajar.indexOf(p) !== -1; })) return;
      var enTitulo = palabras.every(function (p) { return titulo.indexOf(p) !== -1; });
      buenos.push({ e: e, puntos: (enTitulo ? 0 : 1) * 1000 + i });
    });
    buenos.sort(function (a, b) { return a.puntos - b.puntos; });
    return buenos.slice(0, MAXIMO).map(function (b) { return b.e; });
  }

  function limpiarLinea() {
    var l = $('ajustes-linea-tipo');
    if (l) l.remove();
  }

  function ir(e) {
    var caja = $('ajustes-buscar');
    if (e.dentroDelTipo) {
      App.cambiarPestanaAjustes('dia');
      limpiarLinea();
      var dia = $('ajustes-tab-dia');
      if (dia) {
        var p = document.createElement('p');
        p.id = 'ajustes-linea-tipo';
        p.className = 'aviso aviso-ambar';
        p.dataset.fijo = '1';
        p.textContent = 'Se pone dentro de cada tipo: pulsa un tipo y busca «' + e.titulo + '».';
        dia.insertBefore(p, dia.firstChild);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.herramientas) {
      if (!App.ir) return;
      App.ir('herramientas');
      var intentos = 30;
      (function esperar() {
        if (AjustesReparto.irASeccion(e.sel)) return;
        if (--intentos > 0) setTimeout(esperar, 100);
      })();
    } else {
      AjustesReparto.irASeccion(e.sel);
    }
    quitar(false);
    if (caja) caja.value = '';
  }

  function quitar(borrarCaja) {
    lista = [];
    var r = $('ajustes-resultados');
    if (r) { r.innerHTML = ''; r.classList.add('oculto'); }
    if (borrarCaja && $('ajustes-buscar')) $('ajustes-buscar').value = '';
  }

  function pintar() {
    var q = $('ajustes-buscar').value;
    var r = $('ajustes-resultados');
    if (!norm(q).trim()) { quitar(false); return; }
    lista = buscar(q);
    r.innerHTML = '';
    r.classList.remove('oculto');
    if (!lista.length) {
      var vacio = document.createElement('div');
      vacio.className = 'vacio';
      vacio.textContent = 'Nada con ese nombre. Prueba con otra palabra.';
      r.appendChild(vacio);
      return;
    }
    lista.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ajustes-resultado';
      var t = document.createElement('strong');
      t.textContent = e.titulo;
      b.appendChild(t);
      b.appendChild(document.createTextNode(' · ' + e.donde));
      b.onclick = function () { ir(e); };
      r.appendChild(b);
    });
  }

  function alCambiarPestana() {
    /* La línea «Se pone dentro de cada tipo…» solo vale mientras se mira «Lo de cada día». */
    if (App.E && App.E.pestanaAjustes !== 'dia') limpiarLinea();
  }

  function arrancar() {
    var caja = $('ajustes-buscar');
    if (!caja) return;
    caja.addEventListener('input', pintar);
    caja.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { quitar(true); }
      else if (ev.key === 'Enter' && !ev.isComposing && lista.length) { ev.preventDefault(); ir(lista[0]); }
    });
  }
  arrancar();

  return { buscar: buscar, alCambiarPestana: alCambiarPestana, quitar: quitar };
})();
