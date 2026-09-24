/* ============================================================
   ajustes-plegado.js — Ajustes plegado: ver solo lo que se está
   tocando (24-sep-2026, fila 105, docs/AJUSTES-PLEGADO.md).

   Sirve a las tres zonas de Ajustes que tienen bloques:

   - La pantalla de un tipo de asunto (js/ajustes-tipo.js): sus ocho
     secciones pasan a `<details class="bloque-ajustes">`, plegadas, con
     un resumen en el título (`seccion`, `resumirTipo`).
   - La pestaña "El centro": todos los bloques plegados, en el orden de
     más a menos uso, con su resumen (`ordenarCentro`).
   - La pestaña "Mantenimiento": los avisos de fallo (conflictos de
     Dropbox, fichas sin carpeta, hitos huérfanos, envolturas sin
     aplicar) solo se ven cuando hay un fallo, y entonces arriba del
     todo y desplegados; el RegAlum.csv viejo sube arriba y se despliega
     (su bloque es también donde se configuran las épocas, así que no se
     esconde nunca); los botones sueltos van dentro de "Herramientas",
     al final (`ordenarMantenimiento`).

   Todo nace plegado. Lo que se deja abierto se recuerda en este
   ordenador (`localStorage`, clave `gestor-ajustes-plegado`, un objeto
   `{ idDeSeccion: true }`). En la pantalla de un tipo se recuerda por
   sección, no por tipo.

   Los resúmenes salen de lo ya guardado (App.E, las guías) o, cuando el
   dato vive dentro de otro módulo, de lo que ese módulo ha pintado en
   el cuerpo del bloque. Se ponen al día solos: al repintarse el cuerpo
   de un bloque (MutationObserver sobre los cuerpos, nunca sobre el
   título, que es lo que se toca aquí) y después de cualquier cambio o
   clic dentro de la pantalla. Si un bloque no tiene forma sencilla de
   contar lo que lleva, se queda solo con el título.

   Nada de lógica de guardado: solo cambia cómo se enseña.
   ============================================================ */
var AjustesPlegado = (function () {

  var CLAVE = 'gestor-ajustes-plegado';

  function leerAbiertos() {
    try { return JSON.parse(window.localStorage.getItem(CLAVE) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function apuntarAbierto(id, abierto) {
    var o = leerAbiertos();
    if (abierto) o[id] = true; else delete o[id];
    try { window.localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {}
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* Engancha un `<details>` a la memoria de lo abierto. Se puede llamar
     más de una vez sobre el mismo: solo se engancha la primera. Un
     bloque que se ha abierto solo por un aviso (`data-por-aviso`) no se
     apunta como abierto a mano. */
  function recordar(det, id) {
    if (!det) return;
    det.dataset.plegadoId = id;
    if (det.dataset.plegadoEnganchado) return;
    det.dataset.plegadoEnganchado = '1';
    det.open = !!leerAbiertos()[id];
    det.addEventListener('toggle', function () {
      if (det.dataset.porAviso) return;
      apuntarAbierto(id, det.open);
    });
  }

  /* El resumen va en su propio `<span class="bloque-resumen">`, justo
     detrás del título. Vacío, no se ve. `ambar` lo pinta de aviso. Solo
     se toca si cambia (así no despierta a ningún observador). */
  function ponerResumen(det, texto, ambar) {
    if (!det) return;
    var summary = det.querySelector(':scope > summary');
    if (!summary) return;
    var span = summary.querySelector(':scope > .bloque-resumen');
    if (!span) {
      span = document.createElement('span');
      span.className = 'bloque-resumen';
      var titulo = summary.querySelector(':scope > .bloque-titulo');
      if (titulo && titulo.nextSibling) summary.insertBefore(span, titulo.nextSibling);
      else summary.appendChild(span);
    }
    texto = texto || '';
    if (span.textContent !== texto) span.textContent = texto;
    var clase = 'bloque-resumen' + (ambar ? ' bloque-resumen-ambar' : '') + (texto ? '' : ' oculto');
    if (span.className !== clase) span.className = clase;
  }

  /* Cuántas filas de verdad hay en una lista pintada (sin la de
     "vacío"). */
  function filasDe(caja, selector) {
    if (!caja) return 0;
    var hijos = selector ? caja.querySelectorAll(selector) : caja.children;
    var n = 0;
    Array.prototype.forEach.call(hijos, function (h) {
      if (!h.classList.contains('vacio')) n++;
    });
    return n;
  }

  /* Pone al día los resúmenes al poco de un cambio o un clic, y otra vez
     un poco después (los guardados en Dropbox tardan). */
  function alCambiar(raiz, fn) {
    if (!raiz || raiz.dataset.plegadoEscucha) return;
    raiz.dataset.plegadoEscucha = '1';
    var t1 = null, t2 = null;
    function pronto() {
      clearTimeout(t1); clearTimeout(t2);
      t1 = setTimeout(fn, 250);
      t2 = setTimeout(fn, 1500);
    }
    raiz.addEventListener('change', pronto);
    raiz.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('summary')) return;
      pronto();
    });
    if (window.MutationObserver) {
      new MutationObserver(function (cambios) {
        /* Solo lo que pase dentro de los cuerpos: el título es nuestro. */
        var deVerdad = cambios.some(function (c) {
          return !(c.target.closest && c.target.closest('summary'));
        });
        if (deVerdad) pronto();
      }).observe(raiz, { childList: true, subtree: true });
    }
  }

  /* ==========================================================
     1. LA PANTALLA DE UN TIPO DE ASUNTO
     ========================================================== */

  /* Sustituye a la vieja `seccionDeTipo` de js/ajustes-tipo.js: mismo
     `{ sec, cuerpo }`, pero plegable. `id` es el de la sección (el mismo
     para todos los tipos: se recuerda por sección, no por tipo). */
  function seccion(id, titulo, pie) {
    var det = document.createElement('details');
    det.className = 'bloque-ajustes tipo-asunto-seccion';
    det.dataset.seccion = id;
    var summary = document.createElement('summary');
    var t = document.createElement('span');
    t.className = 'bloque-titulo';
    t.textContent = titulo;
    summary.appendChild(t);
    if (pie) {
      var p = document.createElement('span');
      p.className = 'bloque-pie';
      p.textContent = pie;
      summary.appendChild(p);
    }
    det.appendChild(summary);
    var cuerpo = document.createElement('div');
    cuerpo.className = 'bloque-cuerpo tipo-asunto-seccion-cuerpo';
    det.appendChild(cuerpo);
    recordar(det, 'tipo:' + id);
    return { sec: det, cuerpo: cuerpo };
  }

  function seccionDelTipo(id) {
    return document.querySelector('#pantalla-tipo-asunto details[data-seccion="' + id + '"]');
  }

  var turnoPasos = 0;

  function resumirTipo() {
    var tipo = App.E.tipoAjustesActual;
    if (!tipo) return;

    ponerResumen(seccionDelTipo('datos'),
      tipo.categoria + (tipo.nombreCorto ? ' · ' + tipo.nombreCorto : ''));

    var campos = ((App.E.campos && App.E.campos.porTipo) || {})[tipo.tipo] || [];
    ponerResumen(seccionDelTipo('campos'), campos.length ? plural(campos.length, 'campo', 'campos') : 'ninguno');

    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo.tipo)) || [];
    var textoPasos = pasos.length ? plural(pasos.length, 'paso', 'pasos') : 'sin guía';
    var secPasos = seccionDelTipo('pasos');
    var avisoYa = secPasos && secPasos.dataset.desactualizados;
    ponerResumen(secPasos, textoPasos + (avisoYa ? ' · ' + avisoYa : ''), !!avisoYa);
    if (secPasos && pasos.length && window.GuiasBiblioteca && GuiasBiblioteca.pasosDesactualizados) {
      var turno = ++turnoPasos;
      GuiasBiblioteca.pasosDesactualizados(pasos).then(function (lista) {
        if (turno !== turnoPasos) return;
        var n = (lista || []).length;
        secPasos.dataset.desactualizados = n ? '⚠ ' + plural(n, 'paso desactualizado', 'pasos desactualizados') : '';
        ponerResumen(secPasos, textoPasos + (n ? ' · ' + secPasos.dataset.desactualizados : ''), !!n);
      }, function () {});
    } else if (secPasos) {
      secPasos.dataset.desactualizados = '';
      ponerResumen(secPasos, textoPasos);
    }

    var secCorreo = seccionDelTipo('correo');
    if (secCorreo) {
      var nc = filasDe(secCorreo.querySelector('#tipo-plantillas-lista'), '.tarjeta-tipo');
      ponerResumen(secCorreo, nc ? String(nc) : 'ninguna');
    }
    var secWord = seccionDelTipo('word');
    if (secWord) {
      var nw = filasDe(secWord.querySelector('#tipo-pd-lista'), '.tarjeta-tipo');
      ponerResumen(secWord, nw ? String(nw) : 'ninguna');
    }

    ponerResumen(seccionDelTipo('plazo'), tipo.plazo ? plural(tipo.plazo, 'día', 'días') : 'sin plazo');

    var palabras = tipo.palabrasClave || [];
    ponerResumen(seccionDelTipo('palabras'), palabras.length ? String(palabras.length) : 'ninguna');

    var secRec = seccionDelTipo('repite');
    if (secRec) {
      var cadas = [];
      Array.prototype.forEach.call(secRec.querySelectorAll('.recurrente-pie'), function (p) {
        var cada = (p.textContent || '').split(',')[0].trim();
        if (cada && cadas.indexOf(cada) === -1) cadas.push(cada);
      });
      ponerResumen(secRec, cadas.length ? cadas.join(', ') : 'no');
    }
  }

  function engancharTipo() {
    alCambiar(document.getElementById('pantalla-tipo-asunto'), resumirTipo);
  }

  /* ==========================================================
     2. LA PESTAÑA "EL CENTRO"
     ========================================================== */

  /* Cada bloque se reconoce por algo que lleva dentro (así no hace falta
     ponerle un id en index.html). En este orden, de más a menos uso; el
     resto de bloques va detrás, en el orden en que ya estuvieran. */
  var CENTRO = [
    { id: 'tipos-documento', dentro: '#tabla-tipos-documento', resumen: function () {
      return [String((App.E.tiposDocumento || []).length)];
    } },
    { id: 'grupos-personas', dentro: '#tabla-grupos-personas', resumen: function (det) {
      var n = filasDe(det.querySelector('#tabla-grupos-personas'));
      return [n ? String(n) : 'ninguno'];
    } },
    { id: 'campos-propios', dentro: '#tabla-propios', resumen: function () {
      var n = ((App.E.campos && App.E.campos.propios) || []).length;
      return [n ? String(n) : 'ninguno'];
    } },
    { id: 'hitos', dentro: '#tabla-responsables', resumen: function (det) {
      var r = filasDe(det.querySelector('#tabla-responsables'));
      var campo = det.querySelector('#hitos-no-lectivos');
      var d = campo ? campo.value.split('\n').filter(function (l) { return l.trim(); }).length : 0;
      return [plural(r, 'responsable', 'responsables') + ' · ' + plural(d, 'día no lectivo', 'días no lectivos')];
    } },
    { id: 'datos-centro', dentro: '#centro-firma-cuerpo', resumen: function (det) {
      var ids = ['plantillas-firma', 'plantillas-centro', 'plantillas-cargo', 'plantillas-localidad',
        'plantillas-codigo', 'plantillas-provincia', 'plantillas-direccion'];
      var faltan = ids.filter(function (id) {
        var c = det.querySelector('#' + id);
        return c && !String(c.value || '').trim();
      }).length;
      return faltan ? ['faltan ' + faltan + (faltan === 1 ? ' dato' : ' datos'), true] : ['completos'];
    } },
    { id: 'abreviar-grupos', dentro: '#tabla-grupos', resumen: function (det) {
      var n = filasDe(det.querySelector('#tabla-grupos'));
      return [n ? String(n) : ''];
    } },
    { id: 'ficheros-datos', dentro: '#estado-datos', resumen: function (det) {
      var caja = det.querySelector('#estado-datos');
      if (!caja || !caja.children.length) return [''];
      var texto = caja.textContent || '';
      var faltan = [];
      if (/RegAlum\.csv \(alumnado\)\s*No está/.test(texto)) faltan.push('falta RegAlum.csv');
      if (/RelPerCen \(personal\)\s*No hay/.test(texto)) faltan.push('falta RelPerCen');
      if (faltan.length) return [faltan.join(' · '), true];
      var cargados = (texto.match(/RegAlum\.csv \(alumnado\)/) ? 1 : 0) +
        (texto.match(/RelPerCen/) ? 1 : 0);
      return [cargados ? cargados + ' cargados' : ''];
    } }
  ];

  function bloqueQueLleva(tab, selector) {
    var dentro = tab.querySelector(selector);
    return dentro ? dentro.closest('details.bloque-ajustes') : null;
  }

  function ordenarCentro() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab) return;
    var ancla = tab.firstElementChild;
    CENTRO.forEach(function (c) {
      var det = bloqueQueLleva(tab, c.dentro);
      if (!det || det.parentNode !== tab) return;
      /* Solo se mueve si no está ya en su sitio: mover un nodo, aunque
         sea al mismo sitio, despierta a los observadores. */
      if (det !== ancla) tab.insertBefore(det, ancla);
      ancla = det.nextElementSibling;
    });
    Array.prototype.forEach.call(tab.querySelectorAll(':scope > details.bloque-ajustes'), function (det, i) {
      var conocido = CENTRO.filter(function (c) { return bloqueQueLleva(tab, c.dentro) === det; })[0];
      recordar(det, 'centro:' + (conocido ? conocido.id : (det.id || tituloDe(det) || String(i))));
    });
    resumirCentro();
    alCambiar(tab, resumirCentro);
  }

  function resumirCentro() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab) return;
    CENTRO.forEach(function (c) {
      var det = bloqueQueLleva(tab, c.dentro);
      if (!det) return;
      var r;
      try { r = c.resumen(det) || ['']; } catch (e) { r = ['']; }
      ponerResumen(det, r[0], r[1]);
    });
  }

  function tituloDe(det) {
    var t = det.querySelector(':scope > summary .bloque-titulo');
    return t ? U.normalizar(t.textContent || '').replace(/\s+/g, '-') : '';
  }

  /* ==========================================================
     3. LA PESTAÑA "MANTENIMIENTO"
     ========================================================== */

  /* Los avisos de fallo: solo se ven si traen algo. `hay(det)` dice si
     hay fallo, mirando lo que su propio módulo ha pintado. */
  var FALLOS = [
    { id: 'bloque-conflictos', hay: function (det) {
      return filasDe(det.querySelector('#tabla-conflictos')) > 0;
    } },
    { id: 'bloque-huerfanas', hay: function (det) {
      return filasDe(det.querySelector('#tabla-huerfanas')) > 0;
    } },
    { id: 'bloque-hitos-huerfanos', hay: function (det) {
      var pie = det.querySelector('#hitos-huerfanos-pie');
      return !!(pie && /^\d/.test((pie.textContent || '').trim()));
    } },
    { id: 'bloque-envolturas', hay: function (det) {
      var pie = det.querySelector('#envolturas-pie');
      return !!(pie && /sin aplicar/.test(pie.textContent || ''));
    } }
  ];

  /* Los botones sueltos: van juntos dentro de "Herramientas". */
  var HERRAMIENTAS = ['bloque-cargar-biblioteca', 'bloque-plantillas-centro', 'bloque-fichas-archivo',
    'bloque-contacto-migracion', 'bloque-formularios'];

  /* El resto, en este orden, con su resumen. */
  var MANTENIMIENTO = [
    { id: 'carpetas', dentro: '#estado-carpetas', resumen: function () {
      var faltan = [];
      if (!App.E.abiertos) faltan.push('falta la de abiertos');
      if (!App.E.archivo) faltan.push('falta la del ARCHIVO');
      return faltan.length ? [faltan.join(' · '), true] : ['2 señaladas'];
    } },
    { id: 'bandeja', dentro: '#estado-bandeja', resumen: function (det) {
      var caja = det.querySelector('#estado-bandeja');
      if (!caja || !caja.children.length) return [''];
      return [/Sin señalar/.test(caja.textContent || '') ? 'sin señalar' : 'señalada'];
    } },
    { id: 'copias', dentro: '#tabla-copias', resumen: function () {
      var u = App.E.ultimaCopia;
      return [u ? 'la última, del ' + U.fechaLegible(u) : ''];
    } },
    { id: 'papelera', dentro: '#tabla-papelera', resumen: function (det) {
      var n = filasDe(det.querySelector('#tabla-papelera'), '.fila-tipo');
      var aviso = det.querySelector('#aviso-papelera-vieja');
      var viejas = 0;
      if (aviso && !aviso.classList.contains('oculto')) {
        var m = (aviso.textContent || '').match(/(\d+)/);
        viejas = m ? parseInt(m[1], 10) : 0;
      }
      if (viejas) return [plural(n, 'cosa', 'cosas') + ' · ' + viejas + ' de más de 30 días', true];
      return [n ? plural(n, 'cosa', 'cosas') : 'vacía'];
    } },
    { id: 'avisos', dentro: '#avisos-dias', resumen: function (det) {
      var c = det.querySelector('#avisos-dias');
      var v = c ? parseInt(c.value, 10) : NaN;
      return [isNaN(v) ? '' : 'con ' + plural(v, 'día', 'días') + ' de antelación'];
    } },
    { id: 'duplicados', dentro: '#tabla-duplicados-descartados', resumen: function (det) {
      var n = filasDe(det.querySelector('#tabla-duplicados-descartados'));
      return [n ? String(n) : 'ninguno'];
    } }
  ];

  function bloqueHerramientas(tab) {
    var ya = document.getElementById('bloque-herramientas');
    if (ya) return ya;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-herramientas';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Herramientas</span>' +
        '<span class="bloque-pie">Botones que se pulsan de vez en cuando: cargar la biblioteca y las ' +
        'plantillas del centro, poner en orden las fichas del ARCHIVO…</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo" id="herramientas-cuerpo"></div>';
    tab.appendChild(d);
    return d;
  }

  var ordenandoMantenimiento = false;

  function ordenarMantenimiento() {
    var tab = document.getElementById('ajustes-tab-mantenimiento');
    if (!tab || ordenandoMantenimiento) return;
    ordenandoMantenimiento = true;
    try {
      /* Herramientas, al final, con los botones sueltos dentro. */
      var herr = bloqueHerramientas(tab);
      var cuerpoHerr = herr.querySelector('#herramientas-cuerpo');
      HERRAMIENTAS.forEach(function (id) {
        var det = document.getElementById(id);
        if (det && det.parentNode !== cuerpoHerr) cuerpoHerr.appendChild(det);
        if (det) recordar(det, 'mantenimiento:' + id);
      });
      herr.classList.toggle('oculto', !cuerpoHerr.children.length);
      recordar(herr, 'mantenimiento:herramientas');

      /* Los normales, en su orden, delante de los demás que no se
         conocen (que se quedan detrás, en el orden que ya tuvieran), y
         Herramientas, la última. */
      var ancla = tab.firstElementChild;
      while (ancla && ancla.dataset.porAviso) ancla = ancla.nextElementSibling;
      MANTENIMIENTO.forEach(function (m) {
        var det = bloqueQueLleva(tab, m.dentro);
        if (!det || det.parentNode !== tab) return;
        if (det !== ancla) tab.insertBefore(det, ancla);
        ancla = det.nextElementSibling;
        recordar(det, 'mantenimiento:' + m.id);
      });
      Array.prototype.forEach.call(tab.querySelectorAll(':scope > details.bloque-ajustes'), function (det, i) {
        if (!det.dataset.plegadoId) recordar(det, 'mantenimiento:' + (det.id || tituloDe(det) || String(i)));
      });
      if (herr.parentNode === tab && herr !== tab.lastElementChild) tab.appendChild(herr);

      /* Los fallos: arriba del todo y desplegados si hay; si no, fuera
         de la vista. */
      var primero = tab.firstElementChild;
      FALLOS.forEach(function (f) {
        var det = document.getElementById(f.id);
        if (!det) return;
        var hay = false;
        try { hay = f.hay(det); } catch (e) { hay = false; }
        mostrarAviso(det, hay, tab, primero);
      });

      /* El RegAlum.csv viejo: su bloque es también el de las épocas, así
         que nunca se esconde; con aviso, sube arriba y se abre. */
      var fres = document.getElementById('bloque-frescura');
      if (fres) {
        var aviso = fres.dataset.aviso || '';
        if (aviso) {
          if (!fres.dataset.porAviso) {
            fres.dataset.porAviso = '1';
            tab.insertBefore(fres, tab.firstElementChild);
            fres.open = true;
          }
          fres.classList.add('bloque-con-fallo');
          ponerResumen(fres, '⚠ ' + (aviso === 'falta' ? 'no hay RegAlum.csv' : 'RegAlum.csv de hace ' + aviso), true);
        } else {
          fres.classList.remove('bloque-con-fallo');
          if (fres.dataset.porAviso) {
            delete fres.dataset.porAviso;
            var herrAhora = document.getElementById('bloque-herramientas');
            tab.insertBefore(fres, herrAhora && herrAhora.parentNode === tab ? herrAhora : null);
          }
          recordar(fres, 'mantenimiento:bloque-frescura');
          var epocas = filasDe(fres.querySelector('#tabla-frescura'), '.fila-tipo');
          ponerResumen(fres, epocas ? plural(epocas, 'época', 'épocas') : '');
        }
      }

      resumirMantenimiento();
    } finally {
      ordenandoMantenimiento = false;
    }
  }

  function mostrarAviso(det, hay, tab, primero) {
    if (hay) {
      det.classList.remove('oculto');
      det.classList.add('bloque-con-fallo');
      if (!det.dataset.porAviso) {
        det.dataset.porAviso = '1';
        if (primero && primero !== det) tab.insertBefore(det, primero);
        det.open = true;
      }
    } else {
      det.classList.add('oculto');
      det.classList.remove('bloque-con-fallo');
      delete det.dataset.porAviso;
    }
  }

  function resumirMantenimiento() {
    var tab = document.getElementById('ajustes-tab-mantenimiento');
    if (!tab) return;
    MANTENIMIENTO.forEach(function (m) {
      var det = bloqueQueLleva(tab, m.dentro);
      if (!det) return;
      var r;
      try { r = m.resumen(det) || ['']; } catch (e) { r = ['']; }
      ponerResumen(det, r[0], r[1]);
    });
  }

  /* Los módulos crean sus bloques cuando les toca (al entrar, al
     refrescar…): cada vez que aparece o se repinta uno, se vuelve a
     ordenar. */
  function engancharMantenimiento() {
    var tab = document.getElementById('ajustes-tab-mantenimiento');
    if (!tab || tab.dataset.plegadoEscucha) return;
    alCambiar(tab, ordenarMantenimiento);
  }

  function engancharCentro() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab || !window.MutationObserver || tab.dataset.plegadoHijos) return;
    tab.dataset.plegadoHijos = '1';
    /* Un bloque nuevo colgado directamente de la pestaña (los que crean
       otros módulos): se engancha a la memoria de lo abierto. */
    new MutationObserver(function (cambios) {
      var nuevo = cambios.some(function (c) {
        return c.target === tab && Array.prototype.some.call(c.addedNodes, function (n) {
          return n.nodeType === 1 && n.matches('details.bloque-ajustes') && !n.dataset.plegadoId;
        });
      });
      if (nuevo) ordenarCentro();
    }).observe(tab, { childList: true });
  }

  /* Arranque: los bloques que ya están en index.html quedan plegados y
     con la memoria puesta desde el primer momento. */
  function arrancar() {
    ordenarCentro();
    engancharCentro();
    ordenarMantenimiento();
    engancharMantenimiento();
    engancharTipo();
  }
  arrancar();

  return {
    seccion: seccion,
    resumirTipo: resumirTipo,
    ordenarCentro: ordenarCentro,
    ordenarMantenimiento: ordenarMantenimiento,
    ponerResumen: ponerResumen,
    CLAVE: CLAVE
  };
})();
