/* ============================================================
   documento-a-tarea.js — «¿De qué tarea es?» (13-nov-2026, fila 638,
   docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md; pantalla de prueba
   docs/pantallas/630.html).

   Un documento de la carpeta cuelga de una tarea. Aquí:

     - `preguntar(a, { nombre, tipo, colgar })`: la pregunta «¿De qué tarea es?», con el hito actual elegido y sus tareas
       que esperan un documento (las de «Añadir documento» sin hacer y sin documento); la última opción es «Tarea
       nueva: «<tipo>»». Se puede elegir otro hito. Devuelve { hitoId, tareaId } (tareaId null = tarea nueva) o null si
       se cancela. Sale de «+ Añadir documento» de «Documentos de la carpeta» (antes de guardar nada: «Cancelar» no añade
       nada) y de «Colgar de una tarea» (`colgar: true`, el botón dice «Colgar»).
     - `colgar(a, destino, nombre, tipo, { nuevo })`: apunta el documento al hito, lo cuelga de la tarea (creando la
       «Tarea nueva» «solo aquí» con «Añadir documento», que se llama como el tipo y queda hecha), marca la tarea hecha y
       lo apunta en el registro.
     - `colgarDeCarpeta(a, nombre)`: «Colgar de una tarea» de un documento que ya está en la carpeta; si su nombre no sigue
       la norma (sin fecha o sin tipo), antes se abre «Cambiar el nombre» y después la pregunta.
     - `sinTarea(hitos, nombre)`: el documento no cuelga de ninguna tarea de ningún hito (se calcula al pintar, no se guarda).

   El cuadro es el común (`.capa > .cuadro`), en una capa propia encima de la de siempre: la ventana de fichero y tipo
   sigue detrás. Lo llaman js/documentos-guardar.js y js/ficha-documentos-fila.js.
   ============================================================ */
window.DocumentoATarea = (function () {

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }

  function todos(hitos, salida) {
    salida = salida || [];
    (hitos || []).forEach(function (h) { salida.push(h); (h.opciones || []).forEach(function (o) { todos(o && o.hitos, salida); }); });
    return salida;
  }

  /* El documento cuelga de alguna tarea de algún hito (se compara por la clave de gemelo: el Word y su PDF son el mismo). */
  function sinTarea(hitos, nombre) {
    var cuelga = false;
    if (!window.TareasConDocumento) return false;
    if (/^\d{6} (CORREO|HILO)(\s|\.)/.test(String(nombre || ''))) return false;   /* fila 661: el PDF del correo y el del hilo no cuelgan de ninguna tarea */
    TareasConDocumento.recorrer(hitos, function (h) {
      var m = h.guionDocumento || {};
      Object.keys(m).forEach(function (id) {
        if (m[id] && (TareasConDocumento.mismo(m[id].doc, nombre) || m[id].version === nombre)) cuelga = true;
      });
    });
    return !cuelga;
  }

  /* Los hitos a los que se puede colgar: los que se ven y no son una pregunta. */
  function hitosElegibles(hitos) {
    return Hitos.visibles(hitos).filter(function (x) { return x.clase !== 'decision' && x.estado !== 'noaplica' && !x.delTipoAnterior; });
  }

  /* Las tareas de ese hito que esperan un documento: «Añadir documento», sin hacer y sin documento colgado. */
  function tareasQueEsperan(a, h) {
    return Hitos.guionDe(a, h).filter(function (g) {
      if (g.pregunta || (g.accion || (g.reunir === 'documento' ? 'anadir' : '')) !== 'anadir' || g.hecho || g.noaplica) return false;
      var e = window.TareasConDocumento ? TareasConDocumento.de(h, g.id) : null;
      return !(e && e.doc);
    });
  }

  function extension(n) { return ((window.Nombres && Nombres.extensionDe(n)) || '').toUpperCase(); }

  /* ---------- la pregunta ---------- */

  async function preguntar(a, o) {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[a.nombre];
    var hitos = entrada ? entrada.hitos : [];
    var lista = hitosElegibles(hitos);
    if (!lista.length) { U.aviso('Para añadir un documento, crea antes el hito.', 'ambar'); return null; }
    var numerados = Hitos.numerados ? Hitos.numerados(hitos) : lista;
    var idActual = window.EstadoHito && EstadoHito.idActual ? EstadoHito.idActual(hitos, datos.ajustes) : null;
    var elegido = lista.filter(function (x) { return x.id === idActual; })[0] || lista[lista.length - 1];
    var tipo = o.tipo || 'Documento';
    var verbo = o.colgar ? 'Colgar' : 'Añadir';

    return new Promise(function (resolver) {
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'capa pt-capa';
      capa.innerHTML = '<div class="cuadro pt-cuadro" role="dialog" aria-modal="true" aria-labelledby="pt-titulo">' +
        '<h3 id="pt-titulo">¿De qué tarea es?</h3><div class="pt-cuerpo" id="pt-cuerpo"></div>' +
        '<div class="cuadro-botones"><button type="button" class="boton" id="pt-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="pt-ok">' + verbo + '</button></div></div>';
      document.body.appendChild(capa);
      function $(id) { return capa.querySelector('#' + id); }
      var cerrado = false;
      function cerrar(valor) {
        if (cerrado) return;
        cerrado = true;
        document.removeEventListener('keydown', alTeclear, true);
        if (capa.parentNode) capa.parentNode.removeChild(capa);
        try { if (previo && previo.focus && document.contains(previo)) previo.focus(); } catch (e) { /* sin foco que devolver */ }
        resolver(valor);
      }
      function alTeclear(ev) {
        if (ev.key !== 'Escape') return;
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        cerrar(null);
      }
      document.addEventListener('keydown', alTeclear, true);

      function pintar() {
        var esperan = tareasQueEsperan(a, elegido);
        var h = '<p class="pt-doc"><span class="pt-ext">' + esc(extension(o.nombre) || 'DOC') + '</span> <b>' + esc(o.nombre) + '</b></p>' +
          '<label class="etiqueta" for="pt-hito">Hito</label><select id="pt-hito" class="campo">' + lista.map(function (x) {
            var n = numerados.indexOf(x) + 1;
            return '<option value="' + esc(x.id) + '"' + (x.id === elegido.id ? ' selected' : '') + '>' + (n ? n + '. ' : '') + esc(x.titulo || 'Hito') +
              (x.id === idActual ? ' (el actual)' : '') + '</option>';
          }).join('') + '</select><div class="etiqueta">Tarea</div>';
        esperan.forEach(function (g, i) {
          h += '<label class="pt-op"><input type="radio" name="pt-tarea" value="' + esc(g.id) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(g.texto) +
            '<br><small>Espera un documento. Queda hecha.</small></span></label>';
        });
        h += '<label class="pt-op"><input type="radio" name="pt-tarea" value="" class="pt-nueva"' + (esperan.length ? '' : ' checked') + '><span>Tarea nueva: «' + esc(tipo) +
          '»<br><small>La app la crea en ese hito y la deja hecha.</small></span></label>';
        $('pt-cuerpo').innerHTML = h;
        $('pt-hito').onchange = function () {
          elegido = lista.filter(function (x) { return x.id === $('pt-hito').value; })[0] || elegido;
          pintar();
          $('pt-hito').focus();
        };
      }
      pintar();
      $('pt-cancelar').onclick = function () { cerrar(null); };
      $('pt-ok').onclick = function () {
        var r = capa.querySelector('input[name="pt-tarea"]:checked');
        cerrar({ hitoId: elegido.id, tareaId: r && r.value ? r.value : null });
      };
      $('pt-hito').focus();
    });
  }

  /* ---------- colgar ---------- */

  function repintar(a) {
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    if (window.FichaDocumentos && window.App && App.fichaAbierta && App.fichaAbierta() === a.nombre) {
      try { FichaDocumentos.pintar(a); } catch (e) { /* solo pintar */ }
    }
  }

  /* `destino`: { hitoId, tareaId } (tareaId null: tarea nueva con el nombre del tipo). `o.nuevo`: el documento acaba de
     entrar en la carpeta («Añadido»; si no, «Colgado»). `o.conMarca` (fila 661): la «Tarea nueva» obedece a la marca de la guía. Devuelve { hito, tareaId, texto }. */
  async function colgar(a, destino, nombre, tipo, o) {
    o = o || {};
    var hitos = await Hitos.hitosDe(a.nombre);
    var h = Hitos.buscar(hitos, destino.hitoId);
    if (!h) throw new Error('Ese hito ya no está.');
    /* El documento, apuntado a ese hito (si estaba en otro, pasa: queda solo en el destino). */
    if ((h.documentos || []).indexOf(nombre) === -1) {
      var enOtro = todos(hitos).some(function (x) { return x.id !== h.id && (x.documentos || []).indexOf(nombre) !== -1; });
      if (enOtro && window.HitosSacarDocumento) await HitosSacarDocumento.mover(a, [nombre], h);
      else await Hitos.anadirDocumento(a.nombre, h.id, nombre);
    }
    var tareaId = destino.tareaId, texto = '';
    if (tareaId) {
      var g = Hitos.guionDe(a, h).filter(function (x) { return x.id === tareaId; })[0];
      texto = g ? g.texto : '';
    } else if (o.conMarca && window.DondeSeGuardaTareas) {
      /* Fila 661: «Tarea nueva» de la bandeja: obedece a la marca de la guía (fila 660), con «Añadir documento» y «Qué documento» = el tipo. */
      texto = tipo || 'Documento';
      var extras = { accion: 'anadir' };
      if (tipo) extras.tipoDocumento = tipo;
      if (!(await DondeSeGuardaTareas.nueva(a, h, texto, null, extras))) throw new Error('No he podido crear la tarea.');
      h = Hitos.buscar(await Hitos.hitosDe(a.nombre), destino.hitoId) || h;
      var propias = Hitos.guionDe(a, h).filter(function (x) {
        return x.texto === texto && x.accion === 'anadir' && !x.hecho && !(window.TareasConDocumento && (TareasConDocumento.de(h, x.id) || {}).doc);
      });
      if (!propias.length) throw new Error('No he podido crear la tarea.');
      tareaId = propias[propias.length - 1].id;
    } else {
      texto = tipo || 'Documento';
      var nuevo = await Hitos.anadirGuionPropio(a.nombre, h.id, texto, { accion: 'anadir' });
      var ultima = nuevo && (nuevo.guionPropio || []).slice(-1)[0];
      if (!ultima) throw new Error('No he podido crear la tarea.');
      tareaId = ultima.id;
    }
    await TareasConDocumento.asignar(a.nombre, h.id, tareaId, nombre);
    await Hitos.marcarGuion(a.nombre, h.id, tareaId, { hecho: true });
    if (window.HitosRequisitos) {
      try { await HitosRequisitos.marcarPorDocumento(a.nombre, h.id, nombre); } catch (e) { /* accesorio */ }
    }
    if (window.RegistroAsunto) {
      await RegistroAsunto.auto(a, (o.nuevo ? 'Añadido' : 'Colgado') + ' «' + nombre + '» en la tarea «' + texto + '»', h);
    }
    U.aviso('El documento queda colgado de «' + texto + '», en el hito «' + (h.titulo || '') + '».', 'bueno');
    repintar(a);
    return { hito: h, tareaId: tareaId, texto: texto };
  }

  /* «Colgar de una tarea» de un documento que ya está en la carpeta. */
  async function colgarDeCarpeta(a, nombre) {
    var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(nombre) : {};
    if (!(leido && leido.fecha && leido.tipo)) {
      /* Sin tipo ni nombre según la norma: antes, «Cambiar el nombre»; la pregunta sale al guardarlo (js/documentos-guardar.js). */
      await App.verDocumentos(a, { ponerNombre: nombre, colgar: true });
      repintar(a);
      return;
    }
    var destino = await preguntar(a, { nombre: nombre, tipo: leido.tipo, colgar: true });
    if (!destino) return;
    try { await colgar(a, destino, nombre, leido.tipo, { nuevo: false }); }
    catch (e) { U.fallo('No he podido colgar el documento de la tarea', e); }
  }

  return { preguntar: preguntar, colgar: colgar, colgarDeCarpeta: colgarDeCarpeta, sinTarea: sinTarea,
           tareasQueEsperan: tareasQueEsperan, hitosElegibles: hitosElegibles };
})();
