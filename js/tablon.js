/* ============================================================
   tablon.js — el tablón de notas rápidas.

   No todo lo que llega es un asunto. "Llamar a fulano", "el director
   dice que el lunes hay claustro", "preguntar en Séneca por lo del
   transporte". Eso antes acababa en un papel encima de la mesa.

   Aquí va en una columna a la derecha de los asuntos abiertos: se
   escribe, se pega, y se quita cuando está hecho. Cada nota lleva
   quién la puso y cuándo, y se puede poner "para el día X" para las
   que tienen fecha.

   Las notas se guardan en _GESTOR/tablon.json, dentro de la carpeta de
   asuntos abiertos: las ve el compañero desde su ordenador, igual que
   los asuntos. Antes de escribir se vuelve a leer el fichero, para no
   pisar lo que él haya puesto mientras tanto.
   ============================================================ */
(function () {

  var FICHERO = 'tablon.json';

  var COLORES = ['amarillo', 'azul', 'verde', 'rosa'];

  var notas = [];
  var arrancado = false;
  var verHechas = false;
  var editando = '';        /* el id de la nota que se está cambiando */
  var colorElegido = 'amarillo';
  var fallo = '';           /* lo último que ha ido mal al leer o escribir */

  function $(id) { return document.getElementById(id); }

  /* ---------- leer y escribir ---------- */

  function normalizar(leido) {
    var lista = (leido && leido.notas) || [];
    return lista.filter(function (n) { return n && n.texto; }).map(function (n) {
      return {
        id: String(n.id || ''),
        texto: String(n.texto || ''),
        color: COLORES.indexOf(n.color) === -1 ? 'amarillo' : n.color,
        autor: String(n.autor || ''),
        creado: String(n.creado || ''),
        para: /^\d{4}-\d{2}-\d{2}$/.test(n.para || '') ? n.para : '',
        hecha: !!n.hecha,
        hechaPor: String(n.hechaPor || ''),
        hechaEl: String(n.hechaEl || '')
      };
    });
  }

  async function leer() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return [];
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Todo cambio pasa por aquí: se relee el fichero, se aplica el cambio
     sobre lo que hay ahora mismo, y se escribe. Así dos ordenadores no
     se borran las notas el uno al otro. */
  async function cambiar(hacer) {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      var lista = await leer();
      lista = hacer(lista) || lista;
      await Carpetas.guardarJson(g, FICHERO, { notas: lista });
      notas = lista;
      pintar();
    } catch (e) {
      U.aviso('No he podido guardar la nota: ' + e.message, 'malo');
    }
  }

  /* ---------- fechas ---------- */

  function hoyIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function legible(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function cuandoTexto(n) {
    var trozos = [];
    if (n.autor) trozos.push(n.autor);
    if (n.creado) trozos.push(legible(n.creado));
    return trozos.join(' · ');
  }

  /* Una nota con fecha puede estar atrasada, ser de hoy, o de más
     adelante. Es lo único que cambia el orden: lo que corre, arriba. */
  function urgencia(n) {
    if (!n.para) return 2;
    if (n.para < hoyIso()) return 0;
    if (n.para === hoyIso()) return 1;
    return 3;
  }

  function ordenar(lista) {
    return lista.slice().sort(function (a, b) {
      var ua = urgencia(a), ub = urgencia(b);
      if (ua !== ub) return ua - ub;
      if (a.para && b.para && a.para !== b.para) return a.para < b.para ? -1 : 1;
      return (b.creado || '') < (a.creado || '') ? -1 : 1;
    });
  }

  /* ---------- la columna ---------- */

  function columna() {
    var c = $('tablon');
    if (c) return c;
    var pantalla = $('pantalla-abiertos');
    if (!pantalla) return null;
    pantalla.classList.add('con-tablon');
    c = document.createElement('aside');
    c.id = 'tablon';
    pantalla.appendChild(c);
    return c;
  }

  function pintar() {
    var c = columna();
    if (!c) return;

    /* Lo que se esté escribiendo no se pierde al repintar. */
    var escrito = $('tablon-texto') ? $('tablon-texto').value : '';
    var fechaPuesta = $('tablon-para') ? $('tablon-para').value : '';

    var pendientes = ordenar(notas.filter(function (n) { return !n.hecha; }));
    var hechas = notas.filter(function (n) { return n.hecha; });

    c.innerHTML = '';
    c.appendChild(cabecera(pendientes.length));
    c.appendChild(formulario(escrito, fechaPuesta));

    if (fallo) {
      var malo = document.createElement('div');
      malo.className = 'tablon-vacio';
      malo.textContent = 'No he podido leer las notas: ' + fallo;
      c.appendChild(malo);
    } else if (!pendientes.length) {
      var vacio = document.createElement('div');
      vacio.className = 'tablon-vacio';
      vacio.textContent = 'Sin notas. Lo que no es un asunto, aquí.';
      c.appendChild(vacio);
    }
    pendientes.forEach(function (n) { c.appendChild(papel(n)); });

    if (hechas.length) {
      var ver = document.createElement('button');
      ver.type = 'button';
      ver.className = 'enlace tablon-ver-hechas';
      ver.textContent = verHechas
        ? 'Esconder las hechas (' + hechas.length + ')'
        : 'Ver las hechas (' + hechas.length + ')';
      ver.onclick = function () { verHechas = !verHechas; pintar(); };
      c.appendChild(ver);
      if (verHechas) {
        hechas.slice().reverse().forEach(function (n) { c.appendChild(papel(n)); });
      }
    }
  }

  function cabecera(cuantas) {
    var h = document.createElement('div');
    h.className = 'tablon-cabecera';
    h.innerHTML = '<span class="tablon-titulo">Tablón</span>' +
                  '<span class="cuenta-lista">' + cuantas + '</span>';
    return h;
  }

  /* ---------- escribir una nota ---------- */

  function formulario(escrito, fechaPuesta) {
    var caja = document.createElement('div');
    caja.className = 'tablon-nueva';

    var texto = document.createElement('textarea');
    texto.id = 'tablon-texto';
    texto.className = 'campo';
    texto.rows = 2;
    texto.placeholder = 'Llamar a…, el director dice que…';
    texto.value = escrito;
    caja.appendChild(texto);

    var fila = document.createElement('div');
    fila.className = 'tablon-fila';

    var colores = document.createElement('div');
    colores.className = 'tablon-colores';
    COLORES.forEach(function (col) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tablon-color color-' + col + (col === colorElegido ? ' elegido' : '');
      b.title = 'Nota de color ' + col;
      b.onclick = function () { colorElegido = col; pintar(); };
      colores.appendChild(b);
    });
    fila.appendChild(colores);

    var para = document.createElement('input');
    para.type = 'date';
    para.id = 'tablon-para';
    para.className = 'campo tablon-fecha';
    para.title = 'Para qué día es, si tiene día';
    para.value = fechaPuesta;
    fila.appendChild(para);

    caja.appendChild(fila);

    var pegar = document.createElement('button');
    pegar.type = 'button';
    pegar.className = 'boton boton-principal tablon-pegar';
    pegar.textContent = 'Pegar la nota';
    pegar.onclick = function () { pegarNota(); };
    caja.appendChild(pegar);

    texto.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); pegarNota(); }
    };
    return caja;
  }

  function pegarNota() {
    var campo = $('tablon-texto');
    var texto = (campo.value || '').trim();
    if (!texto) { campo.focus(); return; }
    var para = $('tablon-para').value || '';
    var quien = (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || '';
    campo.value = '';
    $('tablon-para').value = '';
    cambiar(function (lista) {
      lista.push({
        id: 'n' + Date.now() + Math.floor(Math.random() * 1000),
        texto: texto, color: colorElegido, autor: quien,
        creado: new Date().toISOString(), para: para,
        hecha: false, hechaPor: '', hechaEl: ''
      });
      return lista;
    });
  }

  /* ---------- cada papel ---------- */

  function papel(n) {
    var d = document.createElement('div');
    d.className = 'papel color-' + n.color + (n.hecha ? ' papel-hecha' : '');

    if (editando === n.id) {
      var campo = document.createElement('textarea');
      campo.className = 'campo';
      campo.rows = 3;
      campo.value = n.texto;
      d.appendChild(campo);

      var botones = document.createElement('div');
      botones.className = 'papel-botones';
      botones.appendChild(boton('Guardar', function () {
        var nuevo = (campo.value || '').trim();
        editando = '';
        if (!nuevo) { pintar(); return; }
        cambiar(function (lista) {
          lista.forEach(function (x) { if (x.id === n.id) x.texto = nuevo; });
          return lista;
        });
      }, true));
      botones.appendChild(boton('Dejarlo', function () { editando = ''; pintar(); }));
      d.appendChild(botones);
      return d;
    }

    if (n.para) {
      var marca = document.createElement('span');
      var u = urgencia(n);
      marca.className = 'papel-fecha' + (u === 0 ? ' papel-atrasada' : (u === 1 ? ' papel-hoy' : ''));
      marca.textContent = u === 0 ? 'Se pasó el ' + legible(n.para)
                        : (u === 1 ? 'Para hoy' : 'Para el ' + legible(n.para));
      d.appendChild(marca);
    }

    var texto = document.createElement('div');
    texto.className = 'papel-texto';
    texto.textContent = n.texto;
    d.appendChild(texto);

    var pie = document.createElement('div');
    pie.className = 'papel-pie';
    pie.textContent = n.hecha
      ? 'Hecha' + (n.hechaPor ? ' por ' + n.hechaPor : '') +
        (n.hechaEl ? ' el ' + legible(n.hechaEl) : '')
      : cuandoTexto(n);
    d.appendChild(pie);

    var botones = document.createElement('div');
    botones.className = 'papel-botones';

    if (!n.hecha) {
      botones.appendChild(boton('Hecha', function () {
        var quien = (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || '';
        cambiar(function (lista) {
          lista.forEach(function (x) {
            if (x.id !== n.id) return;
            x.hecha = true; x.hechaPor = quien; x.hechaEl = new Date().toISOString();
          });
          return lista;
        });
      }, true));
      botones.appendChild(boton('Cambiar', function () { editando = n.id; pintar(); }));
      botones.appendChild(boton('A asunto', function () { pasarAAsunto(n); }));
    } else {
      botones.appendChild(boton('Devolver', function () {
        cambiar(function (lista) {
          lista.forEach(function (x) {
            if (x.id !== n.id) return;
            x.hecha = false; x.hechaPor = ''; x.hechaEl = '';
          });
          return lista;
        });
      }));
    }

    botones.appendChild(boton('Borrar', async function () {
      var ok = await U.preguntar('Borrar la nota',
        '<p class="explica">' + U.escapar(n.texto) + '</p>' +
        '<p class="nota">Se borra para todos, y no se puede recuperar.</p>', 'Borrar');
      if (!ok) return;
      cambiar(function (lista) {
        return lista.filter(function (x) { return x.id !== n.id; });
      });
    }));

    d.appendChild(botones);
    return d;
  }

  function boton(texto, alPulsar, principal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton papel-boton' + (principal ? ' boton-marcado' : '');
    b.textContent = texto;
    b.onclick = alPulsar;
    return b;
  }

  /* Una nota que al final sí era un asunto. Se lleva a la pantalla de
     crear, con el texto ya puesto en la descripción. La nota se queda
     en el tablón hasta que él la marque como hecha: así no desaparece
     si al final no crea nada. */
  function pasarAAsunto(n) {
    App.ir('nuevo');
    var campo = $('campo-descripcion');
    if (campo) campo.value = U.limpiarNombre(n.texto).slice(0, 40).trim();
    U.aviso('Elige categoría, tipo y tercero. La nota va en la descripción.', 'bueno');
  }

  /* ---------- arranque ---------- */

  /* La columna se pinta ANTES de leer el fichero. Si la lectura falla,
     el tablón sigue estando ahí y lo dice, en vez de no aparecer y dejar
     a uno mirando la pantalla sin saber qué ha pasado. */
  async function refrescar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    pintar();
    try {
      notas = await leer();
      fallo = '';
      pintar();
    } catch (e) {
      fallo = e.message || 'no he podido leer las notas';
      pintar();
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!window.Gestor.carpetaGestor()) return;
      if (!arrancado) { arrancado = true; refrescar(); return; }
      /* Mientras se escribe una nota no se relee: el repintado no debe
         quitarle el sitio al cursor. */
      var campo = $('tablon-texto');
      if (campo && campo === document.activeElement) return;
      if (editando) return;
      refrescar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
