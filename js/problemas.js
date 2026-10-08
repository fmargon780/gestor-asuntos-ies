/* ============================================================
   problemas.js — la pestaña «Problemas» de Ajustes: cada problema es una
   tarjeta con su solución (fila 291, docs/PROBLEMAS-CON-SU-SOLUCION.md).

   Cada módulo de aviso SIGUE DETECTANDO Y ARREGLANDO LO MISMO: solo deja
   de pintar su propia sección y le pasa a este módulo una descripción:

     Problemas.registrar(id, descripcion)    (null o false: quita la tarjeta)

   descripcion = {
     titulo, que, porque,           frases, sin palabras del código
     antes:     'texto',            línea suelta encima de la lista (opcional)
     bloque:    {...},              fila 303: un bloque encima de la lista, con una casilla marcada por fila y un solo
                                    botón «Enlazar los N»: { titulo, buscando, filas: [{ clave, nombre, carpeta, donde,
                                    avisos }], alEnlazar(claves, boton, progreso) }
     quien:     'texto',            «Esto lo hace quien montó la aplicación.»
     pasos:     ['…', '…'],         pasos numerados, escritos en pantalla
     acciones:  [{ texto, explica, alPulsar, normal, peligro, cambia, id }],
     elementos: [{ nombre, detalle, dato, acciones: [...], queCambia: { cuando, lineas, mas } }],
     elegir:    true,               casilla en cada elemento y «Elegir todos»;
                                    las acciones de la tarjeta reciben los
                                    índices elegidos
     detalle:   'texto',            «Ver el detalle», plegado
     soporte:   'frase',            añade «Avisar por Soporte» con el problema ya escrito
     urgente:   true                borde rojo
   }

   Cada acción lleva a su lado la frase que dice qué ocurre al pulsarla; la
   normal va la primera y lleva «(lo normal)». Con `cambia: false` (solo
   navega o mira) el botón se queda encendido en solo consulta.

   La tarjeta se vuelve a pintar solo si cambia lo que enseña (así no se
   pierden las casillas marcadas). Con alguna tarjeta: «Problemas (N)» en la
   pestaña, punto ámbar en la pestaña y en el botón «Ajustes» del menú, y el
   trozo «N problemas por resolver» del cuadro de avisos de Inicio. Sin
   ninguna: «Todo en orden. No hay nada que arreglar.»

   Los cálculos (`calculador`) los lanza `Problemas.calcular()`: al entrar,
   en cada refresco de Inicio y al abrir Ajustes. Nada se calcula con un
   guardado en marcha, y lo caro (`cada`) como mucho cada diez minutos.
   ============================================================ */
var Problemas = (function () {

  /* El orden de las tarjetas. */
  var ORDEN = ['alumnado', 'carpetas', 'hitos', 'conflictos', 'conservacion', 'envolturas',
    'bandeja', 'script', 'rutas', 'configurar', 'fichas-archivo', 'contacto'];

  var tarjetas = {};        /* id -> { desc, firma, el } */
  var calculadores = [];    /* { id, calcular, cada, ultimo } */
  var enCurso = null;       /* la promesa del cálculo en marcha */
  var pendiente = false;    /* se saltó un cálculo por haber un guardado en marcha */
  var ultimoTrozo = null;   /* lo último que se le dio al cuadro de avisos de Inicio */
  var repetir = '';         /* se pidió otro cálculo mientras había uno en marcha ('normal' o 'forzar') */

  function $(id) { return document.getElementById(id); }

  function firmaDe(d) {
    try { return JSON.stringify(d, function (k, v) { return typeof v === 'function' ? undefined : v; }); }
    catch (e) { return String(Math.random()); }
  }

  function el(etiqueta, clase, texto) {
    var e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }

  function parrafo(rotulo, texto) {
    var p = el('p', 'problema-linea');
    p.appendChild(el('strong', null, rotulo + ' '));
    p.appendChild(document.createTextNode(texto));
    return p;
  }

  function actual(id) { return tarjetas[id] && tarjetas[id].desc; }

  /* El texto que viaja en «Avisar por Soporte». */
  function textoDeSoporte(d) {
    var t = 'Problema en la aplicación: ' + d.titulo + '\nQué pasa: ' + d.que + '\nPor qué: ' + (d.porque || '');
    if (d.detalle) t += '\nDetalle: ' + d.detalle;
    return t;
  }

  /* ---------- una acción: el botón y, a su lado, lo que hace ---------- */

  function botonDe(a, alPulsar) {
    var fila = el('div', 'problema-accion');
    var b = el('button', 'boton' + (a.normal ? ' boton-principal' : '') + (a.peligro ? ' boton-peligro' : ''),
      a.texto + (a.normal ? ' (lo normal)' : ''));
    b.type = 'button';
    if (a.id) b.id = a.id;
    if (a.cambia === false) b.setAttribute('data-solo-lectura', '1');
    if (a.apagada) { b.disabled = true; if (a.motivo) b.title = a.motivo; }
    b.onclick = function () { alPulsar(b); };
    fila.appendChild(b);
    if (a.explica) fila.appendChild(el('span', 'problema-explica suave', a.explica));
    return fila;
  }

  function accionesDe(contenedor, lista, hacer) {
    (lista || []).forEach(function (a, i) {
      contenedor.appendChild(botonDe(a, function (b) { hacer(i, b); }));
    });
  }

  function correr(f, arg, boton) {
    try {
      var r = f(arg, boton);
      if (r && typeof r.catch === 'function') r.catch(function (e) { U.fallo('No he podido hacerlo', e); });
    } catch (e) { U.fallo('No he podido hacerlo', e); }
  }

  /* ---------- fila 303: un bloque de filas marcadas con un solo botón ---------- */

  function bloqueDe(id, b) {
    var caja = el('div', 'problema-bloque');
    var titulo = el('p', 'problema-linea problema-bloque-titulo');
    titulo.appendChild(el('strong', null, b.titulo));
    caja.appendChild(titulo);
    if (b.buscando || !(b.filas || []).length) return caja;

    var ul = el('ul', 'problema-bloque-lista');
    b.filas.forEach(function (f) {
      var li = el('li', 'problema-bloque-fila');
      var etiqueta = el('label', 'problema-bloque-nombre');
      var x = document.createElement('input');
      x.type = 'checkbox';
      x.checked = true;
      x.className = 'problema-bloque-casilla';
      x.dataset.clave = f.clave;
      etiqueta.appendChild(x);
      etiqueta.appendChild(document.createTextNode(' '));
      etiqueta.appendChild(el('strong', null, f.nombre));
      li.appendChild(etiqueta);
      var carpeta = el('div', 'problema-bloque-carpeta');
      carpeta.appendChild(el('span', 'suave', 'Su carpeta: '));
      carpeta.appendChild(document.createTextNode(f.carpeta));
      li.appendChild(carpeta);
      li.appendChild(el('div', 'suave', f.donde));
      (f.avisos || []).forEach(function (a) { li.appendChild(el('div', 'problema-bloque-aviso', a)); });
      ul.appendChild(li);
    });
    caja.appendChild(ul);

    var progreso = el('progress', 'problema-bloque-progreso');
    progreso.hidden = true;
    var boton = el('button', 'boton boton-principal');
    boton.type = 'button';
    boton.id = 'problema-' + id + '-enlazar-todos';

    function marcadas() {
      return Array.prototype.filter.call(caja.querySelectorAll('.problema-bloque-casilla'), function (c) { return c.checked; })
        .map(function (c) { return c.dataset.clave; });
    }
    function actualizar() {
      var n = marcadas().length;
      boton.textContent = n === 1 ? 'Enlazar 1' : 'Enlazar los ' + n;
      boton.disabled = n === 0 || !!(window.SoloConsulta && SoloConsulta.activo());
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.problema-bloque-casilla'), function (c) { c.onchange = actualizar; });
    boton.onclick = function () {
      var vivo = actual(id);
      var f = vivo && vivo.bloque && vivo.bloque.alEnlazar;
      if (!f) return;
      correr(function () {
        return f(marcadas(), boton, function (hecho, total) {
          progreso.hidden = total <= 5;
          progreso.max = total;
          progreso.value = hecho;
        });
      });
    };
    actualizar();
    caja.appendChild(boton);
    caja.appendChild(progreso);
    return caja;
  }

  /* ---------- la tarjeta ---------- */

  function construir(id, d) {
    var t = el('section', 'problema' + (d.urgente ? ' problema-roja' : ''));
    t.dataset.problema = id;
    t.appendChild(el('h3', 'problema-titulo', d.titulo));
    t.appendChild(parrafo('Qué pasa:', d.que));
    t.appendChild(parrafo('Por qué:', d.porque || 'No se sabe por qué; no es por nada que hayas hecho.'));

    var hacer = el('div', 'problema-hacer');
    var rotuloHacer = el('p', 'problema-linea problema-hacer-rotulo');
    rotuloHacer.appendChild(el('strong', null, 'Qué hacer:'));
    hacer.appendChild(rotuloHacer);
    if (d.quien) hacer.appendChild(el('p', 'problema-quien', d.quien));
    if (d.pasos && d.pasos.length) {
      var ol = el('ol', 'problema-pasos');
      d.pasos.forEach(function (p) { ol.appendChild(el('li', null, p)); });
      hacer.appendChild(ol);
    }
    if (d.bloque) hacer.appendChild(bloqueDe(id, d.bloque));
    if (d.antes) hacer.appendChild(el('p', 'problema-antes', d.antes));

    var acciones = (d.acciones || []).slice();
    if (d.soporte) {
      acciones.push({ texto: 'Avisar por Soporte', explica: d.soporte, cambia: false,
        alPulsar: function () { if (window.Soporte) Soporte.abrir(textoDeSoporte(actual(id) || d)); } });
    }
    var hechas = (d.acciones || []).length;
    var caja = el('div', 'problema-acciones');
    acciones.forEach(function (a, i) {
      caja.appendChild(botonDe(a, function (b) {
        var vivo = actual(id);
        var f = i < hechas ? (vivo && vivo.acciones[i] && vivo.acciones[i].alPulsar) : a.alPulsar;
        if (!f) return;
        correr(f, d.elegir ? elegidos(t) : undefined, b);
      }));
    });
    if (acciones.length) hacer.appendChild(caja);

    if (d.elementos && d.elementos.length) {
      if (d.elegir) {
        var todos = el('label', 'problema-todos');
        var c = document.createElement('input');
        c.type = 'checkbox';
        c.className = 'problema-todos-casilla';
        c.onchange = function () {
          Array.prototype.forEach.call(t.querySelectorAll('.problema-elegir'), function (x) { x.checked = c.checked; });
        };
        todos.appendChild(c);
        todos.appendChild(document.createTextNode(' Elegir todos'));
        hacer.appendChild(todos);
      }
      var ul = el('ul', 'problema-lista');
      d.elementos.forEach(function (e, j) {
        var li = el('li', 'problema-elemento');
        var cab = el('div', 'problema-elemento-cab');
        if (d.elegir) {
          var x = document.createElement('input');
          x.type = 'checkbox';
          x.className = 'problema-elegir';
          if (e.dato) x.dataset.nombre = e.dato;
          cab.appendChild(x);
        }
        cab.appendChild(el('span', 'problema-nombre', e.nombre));
        if (e.detalle) cab.appendChild(el('span', 'problema-elemento-detalle suave', e.detalle));
        li.appendChild(cab);
        if (e.queCambia) {   /* fila 292: «Qué cambia», solo leído */
          var det = el('details', 'problema-cambia');
          det.open = true;
          det.appendChild(el('summary', null, 'Qué cambia'));
          var ulc = el('ul', 'problema-cambia-lista');
          (e.queCambia.cuando || []).concat(e.queCambia.lineas || []).forEach(function (l) { ulc.appendChild(el('li', null, l)); });
          if (e.queCambia.mas) ulc.appendChild(el('li', null, 'y ' + e.queCambia.mas + ' más'));
          det.appendChild(ulc);
          li.appendChild(det);
        }
        var accs = el('div', 'problema-acciones');
        accionesDe(accs, e.acciones, function (i, b) {
          var vivo = actual(id);
          var f = vivo && vivo.elementos[j] && vivo.elementos[j].acciones[i] && vivo.elementos[j].acciones[i].alPulsar;
          if (f) correr(f, undefined, b);
        });
        if (e.acciones && e.acciones.length) li.appendChild(accs);
        ul.appendChild(li);
      });
      hacer.appendChild(ul);
    }
    t.appendChild(hacer);

    if (d.detalle) {
      var det = el('details', 'problema-detalle');
      det.appendChild(el('summary', null, 'Ver el detalle'));
      det.appendChild(el('pre', null, d.detalle));
      t.appendChild(det);
    }
    return t;
  }

  function elegidos(t) {
    var salida = [];
    Array.prototype.forEach.call(t.querySelectorAll('.problema-elegir'), function (x, i) { if (x.checked) salida.push(i); });
    return salida;
  }

  /* ---------- registrar y pintar ---------- */

  function registrar(id, desc) {
    if (!desc) {
      if (!tarjetas[id]) return;
      if (tarjetas[id].el && tarjetas[id].el.parentNode) tarjetas[id].el.parentNode.removeChild(tarjetas[id].el);
      delete tarjetas[id];
      pintar();
      return;
    }
    var firma = firmaDe(desc);
    var previa = tarjetas[id];
    if (previa && previa.firma === firma) { previa.desc = desc; return; }   /* lo mismo: ni se toca */
    tarjetas[id] = { desc: desc, firma: firma, el: previa ? previa.el : null };   /* si ya estaba, se cambia en su sitio */
    pintar();
  }

  function ids() { return ORDEN.filter(function (id) { return !!tarjetas[id]; }); }
  function cuenta() { return ids().length; }

  function textoCuenta(n) { return n + (n === 1 ? ' problema por resolver' : ' problemas por resolver'); }

  function irAProblemas() {
    if (App.irASeccionDeAjustes && App.irASeccionDeAjustes('#ajustes-tab-problemas')) return;
    if (App.ir) App.ir('ajustes');
    if (App.cambiarPestanaAjustes) App.cambiarPestanaAjustes('problemas');
  }

  /* Lleva a Ajustes → Problemas, y a la tarjeta si se dice cuál. */
  function ir(id) {
    irAProblemas();
    if (!id) return;
    setTimeout(function () {
      var t = tarjetas[id] && tarjetas[id].el;
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  function puntoDelMenu() {
    var boton = document.querySelector('.pestana[data-pantalla="ajustes"]');
    if (!boton) return null;
    var punto = boton.querySelector('#punto-problemas');
    if (punto) return punto;
    punto = document.createElement('span');
    punto.id = 'punto-problemas';
    punto.className = 'punto-ambar oculto';
    boton.appendChild(punto);
    return punto;
  }

  function pintar() {
    var cont = $('ajustes-tab-problemas');
    var lista = ids();
    var n = lista.length;
    if (cont) {
      /* Cada tarjeta, en su sitio, detrás de lo fijo. */
      var previo = null;
      lista.forEach(function (id) {
        var t = tarjetas[id];
        if (!t.el) t.el = construir(id, t.desc);
        else if (t.el.dataset.firma !== t.firma) {   /* cambió lo que enseña */
          var nueva = construir(id, t.desc);
          if (t.el.parentNode) t.el.parentNode.replaceChild(nueva, t.el);
          t.el = nueva;
        }
        t.el.dataset.firma = t.firma;
        var esperado = previo ? previo.nextElementSibling : cont.firstElementChild;
        while (!previo && esperado && esperado.dataset.fijo) esperado = esperado.nextElementSibling;
        if (t.el !== esperado) cont.insertBefore(t.el, esperado);
        previo = t.el;
      });
      var bien = $('problemas-todo-bien');
      if (bien) bien.classList.toggle('oculto', n > 0);
    }

    var pestana = document.querySelector('[data-ajustes-pestana="problemas"]');
    if (pestana && pestana.firstChild && pestana.firstChild.nodeType === 3) {
      var rotulo = n ? 'Problemas (' + n + ')' : 'Problemas';
      if (pestana.firstChild.nodeValue !== rotulo) pestana.firstChild.nodeValue = rotulo;
    }
    var p1 = $('problemas-punto');
    if (p1) p1.classList.toggle('oculto', !n);
    var p2 = puntoDelMenu();
    if (p2) { p2.classList.toggle('oculto', !n); p2.title = n ? textoCuenta(n) : ''; }

    if (window.AvisosLinea) {
      var texto = n ? textoCuenta(n) : '';
      if (texto !== ultimoTrozo) {   /* solo si cambia: el cuadro de Inicio no se repinta de más */
        ultimoTrozo = texto;
        AvisosLinea.registrar('problemas', texto, false, function () { ir(); });
      }
    }
  }

  /* ---------- los cálculos ---------- */

  /* `calcular(forzar)` lo hace cada módulo y llama a `registrar`. `cada`: milisegundos mínimos
     entre dos cálculos (lo caro). */
  function calculador(id, calcular, cada) {
    calculadores = calculadores.filter(function (c) { return c.id !== id; });
    calculadores.push({ id: id, calcular: calcular, cada: cada || 0, ultimo: 0 });
  }

  function calcular(opciones) {
    var forzar = !!(opciones && opciones.forzar);
    if (enCurso) {   /* ya hay uno en marcha: se repite al acabar, y quien lo pide espera a ese repetido */
      repetir = repetir === 'forzar' || forzar ? 'forzar' : 'normal';
      return enCurso;
    }
    if (!forzar && window.ColaGuardado && ColaGuardado.hayGuardado()) {   /* con un guardado en marcha, en el siguiente refresco */
      pendiente = true;
      return Promise.resolve();
    }
    pendiente = false;
    enCurso = (async function () {
      try {
        await correrTodo(forzar);
        while (repetir) { var como = repetir; repetir = ''; await correrTodo(como === 'forzar'); }
      } finally { enCurso = null; }
    })();
    return enCurso;
  }

  async function correrTodo(forzar) {
    var ahora = Date.now();
    var lista = calculadores.slice();
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (!forzar && c.cada && c.ultimo && ahora - c.ultimo < c.cada) continue;
      c.ultimo = ahora;
      try { await c.calcular(forzar); } catch (e) { /* un cálculo roto no tumba a los demás */ }
    }
  }

  /* Vuelve a calcular uno solo (tras arreglarlo). */
  async function recalcular(id) {
    for (var i = 0; i < calculadores.length; i++) {
      if (calculadores[i].id === id) {
        calculadores[i].ultimo = Date.now();
        try { await calculadores[i].calcular(true); } catch (e) { /* idem */ }
      }
    }
  }

  function arrancar() {
    pintar();
    if (window.Gestor && Gestor.alRefrescar) {
      Gestor.alRefrescar.push(function () {
        if (pendiente && !(window.ColaGuardado && ColaGuardado.hayGuardado())) calcular();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  return {
    ORDEN: ORDEN, registrar: registrar, cuenta: cuenta, ir: ir, calculador: calculador, calcular: calcular,
    recalcular: recalcular, textoCuenta: textoCuenta, textoDeSoporte: textoDeSoporte, pintar: pintar,
    ids: ids
  };
})();
window.Problemas = Problemas;
