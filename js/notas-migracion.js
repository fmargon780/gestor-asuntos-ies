/* ============================================================
   notas-migracion.js — una sola libreta de notas por asunto (fila 139,
   25-sep-2026, docs/UNA-SOLA-LIBRETA-DE-NOTAS.md).

   Antes un asunto tenía sus notas y cada hito las suyas. Ahora hay una:
   las notas del asunto (`asuntos.json`), y la que se escribe desde un
   hito lleva `hito` (el id) y `hitoTitulo` (su título en ese momento).
   La historia automática del hito (lo que apunta la aplicación: marcado,
   generado, comunicado…) se queda en el hito (`h.notas`), bajo el título
   «Historia». El tablón no cambia.

   Aquí (NotasHito):
   - `etiquetaHtml(n)`: la etiqueta pequeña con el título del hito, en
     la lista de notas (js/notas.js). Pulsarla, dentro de la ficha, abre
     la mesa de ese hito.
   - `delHito(a, idHito)`: las notas del asunto escritas desde ese hito
     (la mesa enseña solo esas, js/hitos-panel-lista.js).
   - `anadirDesdeHito(a, h, texto)`: lo que se escribe en la mesa, como
     nota del asunto con su etiqueta.
   - `esAutomatica(texto)`: las de la aplicación tienen forma fija.
   - El paso de lo que ya había, UNA sola vez (marca
     `_GESTOR/notas-migrado.json`): las notas escritas a mano de cada
     hito de `hitos.json` (los de los asuntos abiertos) pasan a las de
     su asunto, con etiqueta y en su orden por fecha. Primero se escribe
     `asuntos.json` y después se quitan de `hitos.json`, cada uno en su
     fila de `ColaGuardado`. Repetirlo no duplica (texto, quién y cuándo).
     Los archivados no se tocan: al enseñarlos se leen las dos cosas.
   ============================================================ */
var NotasHito = (function () {

  var MARCA = 'notas-migrado.json';
  var AUTOMATICA = /^(Comunicado a |Correo enviado a |Mensaje por Séneca a |Dado por hecho|Generado «|Registrado|Marcado)/;
  var hecho = false, corriendo = false;

  function esAutomatica(texto) { return AUTOMATICA.test(String(texto || '')); }

  function notasDe(a) {
    var n = a && a.ficha && a.ficha.notas;
    return Array.isArray(n) ? n : [];
  }

  function delHito(a, idHito) {
    return notasDe(a).filter(function (n) { return n && n.hito === idHito; });
  }

  function etiquetaHtml(n) {
    if (!n || !n.hito) return '';
    return '<button type="button" class="nota-hito" data-hito="' + U.escapar(n.hito) + '" title="Abrir la mesa de este hito">⚑ ' +
      U.escapar(n.hitoTitulo || 'Hito') + '</button>';
  }

  /* Qué hitos de ese asunto tienen notas suyas en el asunto: al cambiar
     de rama o de tipo, un hito con notas no se quita (antes se miraba
     `h.notas`; ahora esas notas viven en el asunto). { id: true }. */
  function idsConNotas(claveAsunto) {
    var f = (window.App && App.E && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[claveAsunto]) || {};
    var salida = {};
    (Array.isArray(f.notas) ? f.notas : []).forEach(function (n) { if (n && n.hito) salida[n.hito] = true; });
    return salida;
  }

  async function anadirDesdeHito(a, h, texto) {
    var t = String(texto || '').trim();
    if (!t || !window.Notas) return null;
    var lista = await Notas.anadir(a, t, { hito: h.id, hitoTitulo: h.titulo || '' });
    if (a.ficha) a.ficha.notas = lista;
    /* La lista de notas de la ficha, al día (la mesa va encima de ella). */
    if (window.FichaNucleo && FichaNucleo.pintarNotas && document.getElementById('ficha-notas')) {
      try { FichaNucleo.pintarNotas(a, true); } catch (e) { /* solo pintar */ }
    }
    return lista;
  }

  /* La etiqueta, dentro de la ficha, abre la mesa de su hito. */
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('.nota-hito') : null;
    if (!b || !b.closest('#pantalla-asunto')) return;
    var a = window.FichaNucleo && FichaNucleo.actual;
    if (!a || !window.HitoMesa) return;
    ev.preventDefault();
    HitoMesa.abrir(a, b.dataset.hito);
  });

  /* ---------- el paso de lo que ya había ---------- */

  function recorrerHitos(hitos, fn) {
    (hitos || []).forEach(function (h) {
      if (!h) return;
      fn(h);
      if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrerHitos(o && o.hitos, fn); });
    });
  }

  function clave(n) { return String(n.texto || '') + '\u0001' + String(n.quien || '') + '\u0001' + String(n.cuando || ''); }

  /* Puro: de `porAsunto` (hitos.json), las notas escritas a mano, por asunto. */
  function aMano(porAsunto) {
    var salida = {};
    Object.keys(porAsunto || {}).forEach(function (c) {
      recorrerHitos((porAsunto[c] || {}).hitos, function (h) {
        (h.notas || []).forEach(function (n) {
          if (!n || !String(n.texto || '').trim() || esAutomatica(n.texto)) return;
          (salida[c] = salida[c] || []).push({ texto: n.texto, quien: n.quien || '', cuando: n.cuando || '',
                                              hito: h.id, hitoTitulo: h.titulo || '' });
        });
      });
    });
    return salida;
  }

  /* Puro: añade a `notas` (del asunto) las que no estén ya, y las deja por fecha. */
  function juntar(notas, nuevas) {
    var lista = Array.isArray(notas) ? notas.slice() : [];
    var ya = {};
    lista.forEach(function (n) { if (n) ya[clave(n)] = true; });
    var puestas = 0;
    (nuevas || []).forEach(function (n) {
      if (ya[clave(n)]) return;
      lista.push(n);
      ya[clave(n)] = true;
      puestas++;
    });
    if (puestas) {
      lista = lista.map(function (n, i) { return { n: n, i: i }; })
        .sort(function (x, y) {
          var cx = String((x.n && x.n.cuando) || ''), cy = String((y.n && y.n.cuando) || '');
          if (cx && cy && cx !== cy) return cx < cy ? -1 : 1;
          return x.i - y.i;
        }).map(function (x) { return x.n; });
    }
    return { lista: lista, puestas: puestas };
  }

  async function hacer() {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g || !window.Hitos) return null;
    if (await Carpetas.existeFichero(g, MARCA)) { hecho = true; return null; }
    var datos = await Hitos.leer();
    var porAsunto = aMano(datos.porAsunto);
    var cuenta = { asuntos: 0, notas: 0 };
    var claves = Object.keys(porAsunto);

    if (claves.length) {
      /* 1. Primero, a las notas del asunto. */
      await App.guardarRegistroFresco(function (registro) {
        registro.asuntos = registro.asuntos || {};
        claves.forEach(function (c) {
          var f = registro.asuntos[c] || (registro.asuntos[c] = {});
          var r = juntar(f.notas, porAsunto[c]);
          f.notas = r.lista;
          if (r.puestas) { cuenta.asuntos++; cuenta.notas += r.puestas; }
        });
      });
      /* 2. Después, fuera del hito: solo las que ya están en el asunto. */
      var enAsunto = {};
      claves.forEach(function (c) {
        var f = (App.E.registro.asuntos || {})[c] || {};
        (f.notas || []).forEach(function (n) { if (n) enAsunto[c + '\u0002' + clave(n)] = true; });
      });
      await Hitos.cambiar(function (d) {
        claves.forEach(function (c) {
          recorrerHitos((d.porAsunto[c] || {}).hitos, function (h) {
            h.notas = (h.notas || []).filter(function (n) {
              return esAutomatica(n.texto) || !enAsunto[c + '\u0002' + clave(n)];
            });
          });
        });
        return d;
      });
    }

    await Carpetas.guardarJson(g, MARCA, { hechoEl: U.ahora(), hechoPor: (App.E && App.E.usuario) || '',
      asuntos: cuenta.asuntos, notas: cuenta.notas });
    hecho = true;
    if (cuenta.notas && window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    return cuenta;
  }

  function intentar() {
    if (hecho || corriendo) return;
    if (!window.Gestor || !Gestor.carpetaGestor() || !App.E || !App.E.listaAbiertos) return;
    corriendo = true;
    setTimeout(function () {
      hacer().catch(function (e) {
        U.accesorio('No he podido pasar las notas de los hitos a las del asunto (se intentará al volver a entrar)', e);
        hecho = true;
      }).then(function () { corriendo = false; });
    }, 2500);
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(intentar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { MARCA: MARCA, esAutomatica: esAutomatica, delHito: delHito, etiquetaHtml: etiquetaHtml, idsConNotas: idsConNotas,
           anadirDesdeHito: anadirDesdeHito, aMano: aMano, juntar: juntar, hacer: hacer };
})();
window.NotasHito = NotasHito;
