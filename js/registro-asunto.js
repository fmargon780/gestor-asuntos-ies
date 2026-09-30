/* ============================================================
   registro-asunto.js — el registro del asunto (fila 229, 30-sep-2026,
   docs/REGISTRO-DEL-ASUNTO.md).

   Una sola lista por fechas con lo que ha pasado en un asunto: lo que
   escribe la persona y lo que anota la aplicación sola. Es una VISTA:
   no cambia dónde se guarda nada.
   - Las notas a mano y las líneas automáticas «sin hito» viven en la
     libreta del asunto (`asuntos.json`, `ficha.notas`); las automáticas
     llevan `auto: true`.
   - Lo automático de cada hito vive en `h.notas` de `hitos.json`.
   Aquí (RegistroAsunto):
   - `lineas(a, { hito, hitos, notas })`: las dos fuentes fundidas, la más
     reciente arriba; con `hito`, solo las de ese hito.
   - `html(lineas, opciones)`: la lista pintada (ficha y mesa).
   - `auto(a, texto, hito)`: apunta una línea automática (accesorio:
     si falla, ámbar, nunca rojo).
   - «⋮» de cada línea escrita a mano: Cambiar y Borrar.
   ============================================================ */
var RegistroAsunto = (function () {

  /* Lo que ya se anotaba antes de tener la marca `auto`. */
  var AUTO_ANTIGUA = /^(Generado |Generados |PDF guardado|Preparado el impreso|Viene de |Reparto de |Cambiado el tipo|Correo enviado a |Comunicado a |Mensaje por Séneca a |Registrado|Dado por hecho|Marcado)|(mandó a la papelera|devolvió de la papelera)/;

  function notasDe(a) {
    var n = a && a.ficha && a.ficha.notas;
    return Array.isArray(n) ? n : [];
  }

  function esAuto(n) {
    return !!(n && (n.auto === true || n.correo || n.registroDeDocumento !== undefined ||
      (window.NotasHito && NotasHito.esAutomatica(n.texto)) || AUTO_ANTIGUA.test(String(n.texto || ''))));
  }

  /* Los hitos del asunto, aplanados (las ramas de una decisión también). */
  function aplanar(lista, salida) {
    (lista || []).forEach(function (h) {
      if (!h) return;
      salida.push(h);
      if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { aplanar(o && o.hitos, salida); });
    });
    return salida;
  }

  function hitosDe(clave) {
    var datos = window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var e = datos && datos.porAsunto && datos.porAsunto[clave];
    return aplanar(e && e.hitos, []);
  }

  function lineas(a, opciones) {
    opciones = opciones || {};
    var filtro = opciones.hito || '';
    var salida = [];
    (opciones.notas || notasDe(a)).forEach(function (n, i) {
      if (!n || !String(n.texto || '').trim()) return;
      if (filtro && n.hito !== filtro) return;
      salida.push({ texto: n.texto, quien: n.quien || '', cuando: n.cuando || '', hito: n.hito || '',
        hitoTitulo: n.hitoTitulo || '', enlace: n.enlace, enlaceTexto: n.enlaceTexto, auto: esAuto(n),
        propia: n, orden: i, fuente: 'asunto' });
    });
    var hitos = opciones.hitos || hitosDe(a && a.nombre);
    hitos.forEach(function (h, k) {
      if (filtro && h.id !== filtro) return;
      (h.notas || []).forEach(function (n, i) {
        if (!n || !String(n.texto || '').trim()) return;
        salida.push({ texto: n.texto, quien: n.quien || '', cuando: n.cuando || '', hito: h.id,
          hitoTitulo: h.titulo || '', auto: true, propia: null, orden: 100000 + k * 1000 + i, fuente: 'hito' });
      });
    });
    salida.sort(function (x, y) {
      if (x.cuando !== y.cuando) return x.cuando < y.cuando ? 1 : -1;
      return y.orden - x.orden;
    });
    return salida;
  }

  function idDe(n) { return String((n && n.cuando) || '') + '|' + String((n && n.texto) || ''); }

  function lineaHtml(l, o) {
    var editable = !!(o.editable && !l.auto && l.fuente === 'asunto');
    var hito = (o.conEtiqueta !== false && l.hito && window.NotasHito)
      ? NotasHito.etiquetaHtml({ hito: l.hito, hitoTitulo: l.hitoTitulo }) : '';
    var enlace = '';
    if (l.enlace && /^https?:\/\//i.test(String(l.enlace))) {
      enlace = '<div class="nota-botones"><a class="boton nota-boton" target="_blank" rel="noopener" href="' +
        U.escapar(l.enlace) + '">' + U.escapar(l.enlaceTexto || 'Abrir el enlace') + '</a></div>';
    }
    return '<div class="nota-fila registro-linea' + (l.auto ? ' registro-auto' : '') + (o.clase ? ' ' + o.clase : '') +
        (l.auto && o.clase ? ' hito-nota-auto' : '') + '"' +
        ' data-f="' + U.escapar(idDe(l)) + '"' + (editable ? ' data-id="' + U.escapar(idDe(l.propia)) + '"' : '') + '>' +
      '<div class="nota-cabeza">' +
        '<span class="nota-cuando">' + U.escapar(window.Notas ? Notas.cuando(l.cuando) : l.cuando) + '</span>' +
        (l.quien ? '<span class="nota-quien">' + U.escapar(l.quien) + '</span>' : '') + hito +
        (editable ? '<span class="registro-menu"><button type="button" class="registro-mas" title="Cambiar o borrar" aria-label="Cambiar o borrar esta línea">⋮</button>' +
          '<span class="registro-acciones oculto"><button type="button" class="boton registro-cambiar">Cambiar</button>' +
          '<button type="button" class="boton registro-borrar">Borrar</button></span></span>' : '') +
      '</div>' +
      '<div class="nota-texto">' + U.escapar(l.texto) + '</div>' + enlace +
    '</div>';
  }

  /* opciones: { editable, conEtiqueta, clase, vacio } */
  function html(ls, opciones) {
    var o = opciones || {};
    if (!ls.length) return '<div class="vacio">' + U.escapar(o.vacio || 'Sin nada todavía') + '</div>';
    return ls.map(function (l) { return lineaHtml(l, o); }).join('');
  }

  /* ---------- apuntar una línea automática ---------- */

  /* `hito` (opcional, el objeto o `{ id }`): la línea va a su historia; sin
     hito, a la libreta del asunto con `auto: true`. Accesorio: nunca tira
     la acción principal. */
  async function auto(a, texto, hito) {
    try {
      var t = String(texto || '').trim();
      if (!t || !a) return;
      if (hito && hito.id && window.Hitos && Hitos.anadirNota) await Hitos.anadirNota(a.nombre, hito.id, t);
      else if (window.Notas) await Notas.anadirAuto(a, t);
    } catch (e) {
      if (window.U && U.accesorio) U.accesorio('No he podido anotarlo en el registro', e);
    }
  }

  /* ---------- «⋮»: cambiar y borrar una línea escrita a mano ---------- */

  function asuntoDe(raiz) {
    var caja = raiz.closest('[data-clave]');
    var clave = caja && caja.dataset.clave;
    var a = window.FichaNucleo && FichaNucleo.actual;
    if (a && a.nombre === clave) return a;
    return clave ? { nombre: clave, ficha: (window.App && App.E.registro.asuntos[clave]) || {} } : null;
  }

  async function refrescar(a, lista) {
    if (a.ficha) a.ficha.notas = lista;
    if (window.FichaNucleo && FichaNucleo.pintarNotas && document.getElementById('ficha-notas')) {
      try { FichaNucleo.pintarNotas(a, true); } catch (e) { /* solo pintar */ }
    }
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
  }

  function buscarNota(a, id) {
    var lista = notasDe(a);
    for (var i = 0; i < lista.length; i++) if (idDe(lista[i]) === id) return lista[i];
    return null;
  }

  async function cambiar(a, fila) {
    var vieja = buscarNota(a, fila.dataset.id);
    if (!vieja) return;
    var caja = fila.querySelector('.nota-texto');
    var original = caja.textContent;
    caja.innerHTML = '<textarea class="campo registro-edicion" rows="3"></textarea>' +
      '<div class="nota-botonera"><button type="button" class="boton boton-principal registro-guardar">Guardar</button>' +
      '<button type="button" class="boton registro-cancelar">Cancelar</button></div>';
    var ta = caja.querySelector('textarea');
    ta.value = original;
    ta.focus();
    caja.querySelector('.registro-cancelar').onclick = function () { caja.textContent = original; };
    caja.querySelector('.registro-guardar').onclick = async function () {
      var texto = (ta.value || '').trim();
      if (!texto) { ta.focus(); return; }
      if (texto === original) { caja.textContent = original; return; }
      try {
        var nueva = Object.assign({}, vieja, { texto: texto });
        await window.Gestor.anotarLista(a.nombre, 'notas', { quitar: [vieja], anadir: [nueva] });
        await refrescar(a, await Notas.frescas(a));
      } catch (e) {
        U.aviso('No he podido cambiar la línea: ' + U.mensajeDeError(e), 'malo');
      }
    };
  }

  async function borrar(a, fila) {
    var vieja = buscarNota(a, fila.dataset.id);
    if (!vieja) return;
    var ok = await U.preguntar('Borrar esta línea del registro',
      '<p class="explica">' + U.escapar(String(vieja.texto).split('\n')[0]) + '</p>', 'Borrar');
    if (!ok) return;
    try {
      await window.Gestor.anotarLista(a.nombre, 'notas', { quitar: [vieja] });
      await refrescar(a, await Notas.frescas(a));
    } catch (e) {
      U.aviso('No he podido borrar la línea: ' + U.mensajeDeError(e), 'malo');
    }
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    var mas = t.closest('.registro-mas');
    if (mas) {
      var ac = mas.parentNode.querySelector('.registro-acciones');
      if (ac) ac.classList.toggle('oculto');
      return;
    }
    var bc = t.closest('.registro-cambiar'), bb = t.closest('.registro-borrar');
    if (!bc && !bb) return;
    var fila = t.closest('.registro-linea');
    var a = fila && asuntoDe(fila);
    if (!a) return;
    ev.preventDefault();
    if (bc) cambiar(a, fila); else borrar(a, fila);
  });

  /* Si los hitos cambian (una línea automática nueva), el registro de la
     ficha abierta se pinta de nuevo; `pintarNotas` conserva lo que se esté
     escribiendo. */
  function repintarFicha() {
    var a = window.FichaNucleo && FichaNucleo.actual;
    var caja = document.getElementById('ficha-notas-lista');
    if (!a || !caja) return;
    /* Solo si hay líneas distintas de las que se ven: sin cambios, la caja no se toca. */
    var nuevas = lineas(a).map(idDe);
    var vistas = Array.prototype.map.call(caja.querySelectorAll('.registro-linea'), function (x) { return x.dataset.f; });
    if (nuevas.join('\n') === vistas.join('\n')) return;
    try { FichaNucleo.pintarNotas(a, FichaNucleo.modoActual === 'abierto'); } catch (e) { /* solo pintar */ }
  }
  if (window.Hitos) {
    if (Hitos.alCambiar) Hitos.alCambiar.push(repintarFicha);
    if (Hitos.alLeer) Hitos.alLeer.push(repintarFicha);
  }

  /* La línea que deja dar un hito por hecho o reabrirlo ('' si no cambia eso). */
  function notaDeEstado(antes, despues) {
    if (despues === 'hecho' && antes !== 'hecho') return 'Dado por hecho';
    if (antes === 'hecho' && despues !== 'hecho') return 'Reabierto';
    return '';
  }

  return { notaDeEstado: notaDeEstado, aplanar: function (l) { return aplanar(l, []); }, lineas: lineas, html: html, auto: auto, esAuto: esAuto, hitosDe: hitosDe };
})();
window.RegistroAsunto = RegistroAsunto;
