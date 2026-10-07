/* ============================================================
   personas-del-grupo-ficha.js — «En asuntos de grupo», en «Sus asuntos» de la ficha de
   una persona (fila 293, docs/TRABAJO-EN-BLOQUE.md). Sustituye al bloque suelto
   «Relacionado con este asunto».

   Una línea por asunto y trabajo: «Certificado de matrícula · generado el 7-oct-2026 ·
   registrado 26SM0412 · enviado el 8-oct-2026 a familia@correo.es», y debajo, en pequeño,
   el nombre del asunto y «Abierto» o «Archivado». Un asunto donde es relacionada pero no
   se le ha hecho nada sale solo con su nombre.

   Los archivados los sabe el índice del ARCHIVO (`Relacionados.asuntosDondeEsRelacionado`);
   el detalle se lee de la ficha de la carpeta de cada uno de esos asuntos, solo de esos,
   y solo al abrir la ficha de la persona. Nunca se recorre el ARCHIVO entero.
   ============================================================ */
var PersonasDelGrupoFicha = (function () {

  function $(id) { return document.getElementById(id); }
  var extra = 0;   /* las líneas de este apartado, para el título de la tarjeta */

  function tituloAlDia() {
    var t = $('titulo-sus-asuntos');
    if (!t || t.dataset.propios === undefined || t.dataset.propios === '') return;
    var n = (parseInt(t.dataset.propios, 10) || 0) + extra;
    t.textContent = 'Sus asuntos' + (n ? ' (' + n + ')' : '');
  }

  function textoDeLinea(nombreTrabajo, h) {
    var partes = [nombreTrabajo];
    if (h.generado) partes.push('generado el ' + PersonasDelGrupo.fechaLarga(h.generado.fecha));
    if (h.registrado.length) partes.push('registrado ' + h.registrado.join(', '));
    if (h.enviado) partes.push('enviado el ' + PersonasDelGrupo.fechaLarga(h.enviado.fecha) + (h.enviado.correo ? ' a ' + h.enviado.correo : ''));
    return partes.join(' · ');
  }

  /* Lo que se le ha hecho a esta persona en un asunto: [{ trabajo, h }], sin efectos. */
  function lineasDe(ficha, ficheros, p, nombre) {
    var est = PersonasDelGrupo.estado({ nombre: '', ficha: ficha }, ficheros);
    var clave = p.categoria + '|' + U.normalizar(nombre);
    var persona = est.personas.filter(function (x) { return x.categoria + '|' + U.normalizar(x.nombre) === clave; })[0];
    if (!persona) return [];
    return est.trabajos.filter(function (t) { return persona.hechos[t.clave]; })
      .map(function (t) { return { trabajo: t, h: persona.hechos[t.clave] }; });
  }

  async function datosDe(x, p) {
    if (!x.archivado) {
      var abierto = (App.E.listaAbiertos || []).filter(function (a) { return a.nombre === x.nombre; })[0];
      var ficha = (App.E.registro.asuntos || {})[x.nombre] || {};
      var ficheros = [];
      if (abierto && abierto.handle) { try { ficheros = (await Carpetas.ficheros(abierto.handle)).map(function (f) { return f.nombre; }); } catch (e) { ficheros = []; } }
      return { ficha: ficha, ficheros: ficheros, asunto: abierto };
    }
    var objeto = window.OtrosDelTercero && x.categoria && x.tercero
      ? await OtrosDelTercero.montarArchivado(x.nombre, x.categoria, x.tercero) : null;
    if (!objeto) return { ficha: {}, ficheros: [], asunto: null };
    var nombres = [];
    try { nombres = (await Carpetas.ficheros(objeto.handle)).map(function (f) { return f.nombre; }); } catch (e2) { nombres = []; }
    return { ficha: objeto.ficha || {}, ficheros: nombres, asunto: objeto };
  }

  async function abrirAsunto(x, d, fichero) {
    if (!d.asunto) { U.aviso(x.archivado ? 'No he podido abrirlo: ya no está en el archivo.' : 'Ya no está abierto: puede que se haya archivado desde otro ordenador.', 'malo'); return; }
    App.abrirFicha(d.asunto, x.archivado ? 'archivado' : 'abierto');
    /* El documento, solo con el asunto abierto; archivado, la ficha. */
    if (fichero && !x.archivado && window.Visor) {
      try { Visor.abrir(await d.asunto.handle.getFileHandle(fichero), fichero, { asunto: d.asunto, carpeta: d.asunto.handle }); }
      catch (e) { U.aviso('Ya no está ese documento en la carpeta.', 'ambar'); }
    }
  }

  async function pintar(p, caja) {
    var destino = caja.querySelector('#asuntos-del-tercero');
    var previo = caja.querySelector('.ficha-grupo-de');
    if (previo) previo.remove();
    extra = 0;
    var titulo = $('titulo-sus-asuntos');
    if (titulo) titulo.dataset.propios = '';
    var nombre = App.textoTercero(p);
    var asuntos = await Relacionados.asuntosDondeEsRelacionado(p.categoria, nombre);
    if (!asuntos.length || !caja.isConnected) return;

    var plantillas = null;
    try { plantillas = window.Plantillas ? await Plantillas.cargar(App.E.gestor) : null; } catch (e) { plantillas = null; }
    var bloque = document.createElement('div');
    bloque.className = 'ficha-relacionado-de ficha-grupo-de';
    bloque.innerHTML = '<p class="nota"><strong>En asuntos de grupo</strong></p>';
    var lineas = 0;
    for (var i = 0; i < asuntos.length; i++) {
      var x = asuntos[i];
      var d = await datosDe(x, p);
      var que = lineasDe(d.ficha, d.ficheros, p, nombre);
      var pie = U.escapar(x.nombre) + ' · ' + (x.archivado ? 'Archivado' : 'Abierto');
      if (!que.length) {
        que = [null];
      }
      que.forEach(function (l) {
        var fila = document.createElement('div');
        fila.className = 'resultado' + (l ? ' pg-linea-persona' : '');
        var texto = l ? textoDeLinea(PersonasDelGrupo.nombreDeTrabajo({ clave: l.trabajo.clave, tipo: l.trabajo.tipo, fecha: '', aviso: l.trabajo.aviso }, plantillas), l.h) : x.nombre;
        fila.innerHTML = '<div>' + U.escapar(texto) + '</div><div class="resultado-pie">' + (l ? pie : (x.archivado ? 'Archivado' : 'Abierto')) + '</div>';
        /* Fila 295: con el correo ya enviado, la línea abre el PDF de ese correo; si no, su documento. */
        fila.onclick = function () { abrirAsunto(x, d, l ? ((l.h.enviado && l.h.enviado.pdf) || (l.h.generado && l.h.generado.fichero) || '') : ''); };
        bloque.appendChild(fila);
        if (l) lineas++;
      });
    }
    if (!caja.isConnected) return;
    var vivo = caja.querySelector('.ficha-grupo-de');
    if (vivo) vivo.remove();
    if (destino && destino.parentNode) destino.parentNode.insertBefore(bloque, destino); else caja.appendChild(bloque);
    extra = lineas;
    tituloAlDia();
  }

  if (window.App && App.trasPintarFicha) App.trasPintarFicha.push(function (p, caja) { pintar(p, caja); });

  return { pintar: pintar, tituloAlDia: tituloAlDia, _lineasDe: lineasDe };
})();
window.PersonasDelGrupoFicha = PersonasDelGrupoFicha;
