/* ============================================================
   tarea-hecha-ventana.js — la ventana pequeña de las tareas «con ventana» (14-nov-2026, fila 671,
   docs/671-ACCIONES-QUE-HACEN-ALGO-1.md; pantalla de prueba docs/pantallas/665.html). Con el aspecto de la de llamadas
   (js/llamadas-ventana.js). Todos sus datos son opcionales: se puede guardar en blanco y la tarea queda hecha.

   - «Grabado»: los pasos de «Cómo se hace» con «Copiar los pasos» (sin pasos: «La guía no dice cómo se hace. Se puede
     escribir en «Cambiar».»), fecha (hoy) y nota.
   - «Entregado» / «Recogido»: «A quién se entrega» / «De quién se recoge» (de una lista), fecha (hoy) y nota.
   - «Falta algo» (Comprobar): «Qué falta o qué está mal».
   - Fila 672: «Publicado» (Publicado el, Expuesto hasta y nota), «Apuntar cobro o pago» (Cobro o Pago, importe en euros, forma —Efectivo,
     Tarjeta, Transferencia—, fecha y nota) y «Archivado» (Dónde queda el papel, de los sitios y zonas, con «Ver todos los sitios…»;
     detalle, fecha y nota).

   `abrir(a, h, g, modo)`: modo 'hecha' o 'falta'. Devuelve una promesa de { fecha, aQuien, nota } (hecha) o { texto } (falta),
   o null si se cancela. `opcionesDePersona(a)` es la lista de a quién se entrega o de quién se recoge.
   ============================================================ */
var TareaHechaVentana = (function () {

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  /* A quién se entrega o de quién se recoge: el tercero, la familia y los relacionados con su nombre (los mismos que «Apuntar llamada»),
     «Tutor/a» (sin nombre: la app no tiene aún el tutor de cada unidad), Dirección, Jefatura de Estudios y Secretaría.
     [{ id (la clave de «A quién» de la tarea), texto }], en ese orden. */
  var ORDEN = { tercero: 1, tutor: 2, relacionado: 3, tutorDocente: 4, direccion: 5, jefatura: 6, secretaria: 7 };
  async function opcionesDePersona(a) {
    var lista = [], vistos = {};
    function poner(id, texto) {
      var k = id + '|' + texto;
      if (!texto || vistos[k]) return;
      vistos[k] = true;
      lista.push({ id: id, texto: texto });
    }
    var personas = [];
    try { personas = window.LlamadasPersonas ? await LlamadasPersonas.personasDe(a) : []; } catch (e) { personas = []; }
    personas.forEach(function (p) {
      var papel = String(p.papel || '').replace(/^(el|la|los|las) /i, '');
      poner(p.grupo || 'relacionado', p.nombre + (papel ? ' (' + papel + ')' : ''));
    });
    if (!lista.some(function (x) { return x.id === 'tercero'; })) {
      var t = soloElNombre((a && a.ficha && a.ficha.tercero) || '');
      if (t) poner('tercero', t);
    }
    if (!lista.some(function (x) { return x.id === 'tutor'; })) poner('tutor', 'Familia');
    poner('tutorDocente', 'Tutor/a');
    poner('direccion', 'Dirección');
    poner('jefatura', 'Jefatura de Estudios');
    poner('secretaria', 'Secretaría');
    return lista.map(function (x, i) { return { x: x, i: i }; })
      .sort(function (p, q) { return (ORDEN[p.x.id] || 9) - (ORDEN[q.x.id] || 9) || p.i - q.i; })
      .map(function (p) { return p.x; });
  }

  /* La persona que propone la tarea: la primera de su grupo ('tutor': la que tiene la custodia, si hay, va primero en la lista). */
  function proponida(opciones, aQuien) {
    var i = -1;
    opciones.forEach(function (o, k) { if (i === -1 && o.id === aQuien) i = k; });
    return i;
  }

  function pasosDe(g) { return String((g && g.como) || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean); }

  async function abrir(a, h, g, modo) {
    var falta = modo === 'falta';
    var persona = !falta && (g.accion === 'entregar' || g.accion === 'recoger');
    var opciones = persona ? await opcionesDePersona(a) : [];
    var pasos = !falta && g.accion === 'seneca' ? pasosDe(g) : null;
    var rotuloPersona = g.accion === 'recoger' ? 'De quién se recoge' : 'A quién se entrega';
    var TITULO = { seneca: 'Grabado', entregar: 'Entregado', recoger: 'Recogido', publicar: 'Publicado', cobrar: 'Apuntar cobro o pago', archivar: 'Archivado' };
    var titulo = falta ? 'Falta algo · ' + g.texto : (TITULO[g.accion] || 'Hecho') + ' · ' + g.texto;
    var sitios = !falta && g.accion === 'archivar' ? true : false;
    var cobro = !falta && g.accion === 'cobrar', publica = !falta && g.accion === 'publicar';
    var dondeIni = sitios && window.Sitios ? Sitios.dondeDe(g) : null;
    var ini = proponida(opciones, g.aQuien);

    return new Promise(function (resolver) {
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'capa th-capa';
      capa.innerHTML = '<div class="cuadro th-cuadro" role="dialog" aria-modal="true" aria-labelledby="th-titulo">' +
        '<h3 id="th-titulo">' + esc(titulo) + '</h3><div class="th-cuerpo">' +
        (pasos ? '<div class="th-rotulo">Cómo se hace</div>' + (pasos.length
          ? '<ol class="th-pasos">' + pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
            '<button type="button" class="boton boton-chico" id="th-copiar">Copiar los pasos</button>'
          : '<p class="suave th-sin-pasos">La guía no dice cómo se hace. Se puede escribir en «Cambiar».</p>') : '') +
        (persona ? '<label class="th-rotulo" for="th-persona">' + rotuloPersona + '</label><select class="campo" id="th-persona"><option value="">Nadie en concreto</option>' +
          opciones.map(function (o, i) { return '<option value="' + i + '"' + (i === ini ? ' selected' : '') + '>' + esc(o.texto) + '</option>'; }).join('') + '</select>' : '') +
        (cobro ? '<div class="th-rotulo">Qué es</div><div class="th-dos"><label><input type="radio" name="th-cp" value="cobro" checked> Cobro</label>' +
          '<label><input type="radio" name="th-cp" value="pago"> Pago</label></div>' +
          '<label class="th-rotulo" for="th-importe">Importe en euros</label><input type="text" class="campo" id="th-importe" inputmode="decimal" placeholder="1,12" autocomplete="off">' +
          '<label class="th-rotulo" for="th-forma">Forma</label><select class="campo" id="th-forma"><option value="">Sin decir</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select>' : '') +
        (sitios ? '<label class="th-rotulo" for="th-donde">Dónde queda el papel</label><select class="campo" id="th-donde"></select>' +
          '<button type="button" class="enlace" id="th-ver-sitios">Ver todos los sitios…</button>' +
          '<label class="th-rotulo" for="th-detalle">Detalle</label><input type="text" class="campo" id="th-detalle" placeholder="Por ejemplo: caja 2025-26" autocomplete="off">' : '') +
        (falta ? '<label class="th-rotulo" for="th-nota">Qué falta o qué está mal</label><textarea class="campo" id="th-nota" rows="3" placeholder="Qué falta o qué está mal"></textarea>'
          : '<label class="th-rotulo" for="th-fecha">' + (publica ? 'Publicado el' : 'Fecha') + '</label><input type="date" class="campo" id="th-fecha">' +
            (publica ? '<label class="th-rotulo" for="th-hasta">Expuesto hasta</label><input type="date" class="campo" id="th-hasta">' : '') +
            '<label class="th-rotulo" for="th-nota">Nota</label><textarea class="campo" id="th-nota" rows="3" placeholder="Opcional"></textarea>') +
        '</div><div class="cuadro-botones"><button type="button" class="boton" id="th-no">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="th-ok">' + (falta ? 'Guardar' : 'Guardar y marcar hecha') + '</button></div></div>';
      document.body.appendChild(capa);
      function $(id) { return capa.querySelector('#' + id); }
      /* «Dónde queda el papel»: los sitios y sus zonas; sin elegir, el «Dónde se hace» de la tarea si lo tiene. */
      function pintarSitios(elegido) {
        var sel = $('th-donde');
        if (!sel) return;
        var ops = Sitios.opciones(Sitios.datos()), d = Sitios.normalizarDonde(elegido), cual = -1;
        ops.forEach(function (o, i) { if (cual === -1 && d && Sitios.igualDonde(o.donde, d)) cual = i; });
        sel.innerHTML = '<option value="">Sin decir</option>' + ops.map(function (o, i) { return '<option value="' + i + '"' + (i === cual ? ' selected' : '') + '>' + esc(o.texto) + '</option>'; }).join('');
        sel._ops = ops;
      }
      if (sitios) {
        if (window.SitiosGuardado) { try { SitiosGuardado.cargar(); } catch (e0) { /* con los que haya */ } }
        pintarSitios(dondeIni);
        $('th-ver-sitios').onclick = function () {
          if (!window.SitiosVentana) return;
          var sel = $('th-donde'), actual = sel.value !== '' && sel._ops ? sel._ops[+sel.value].donde : null, elegido = null;
          SitiosVentana.abrir({
            /* «Sitios» se cierra (y avisa a `alCerrar`) antes de llamar a `alElegir`: lo elegido se pone aquí al momento. */
            alElegir: function (donde) { elegido = donde; pintarSitios(donde); },
            alCerrar: function () { pintarSitios(elegido || actual); }
          });
        };
      }
      if ($('th-fecha')) $('th-fecha').value = (window.U && U.hoyIso && U.hoyIso()) || '';
      if (falta && g.faltaAlgo && $('th-nota')) $('th-nota').value = g.faltaAlgo.texto || '';
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
        if (ev.key !== 'Escape' || document.querySelector('.sitios-capa')) return;   /* con «Sitios» abierta, Escape es de esa ventana */
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        cerrar(null);
      }
      document.addEventListener('keydown', alTeclear, true);
      function aceptar() {
        if (falta) { cerrar({ texto: $('th-nota').value.trim() }); return; }
        var sel = $('th-persona'), o = sel && sel.value !== '' ? opciones[+sel.value] : null;
        var r = { fecha: $('th-fecha').value || '', aQuien: o ? o.texto : '', nota: $('th-nota').value.trim() };
        if (publica) r.hasta = $('th-hasta').value || '';
        if (cobro) {
          r.cobroPago = capa.querySelector('input[name="th-cp"]:checked').value;
          r.importe = TareaHecha.importeDe($('th-importe').value);
          r.forma = $('th-forma').value;
          if ($('th-importe').value.trim() && r.importe == null) { U.aviso('El importe no es un número: escríbelo como 1,12.', 'ambar'); $('th-importe').focus(); return; }
        }
        if (sitios) {
          var sd = $('th-donde');
          r.donde = sd.value !== '' && sd._ops ? sd._ops[+sd.value].donde : null;
          r.detalle = $('th-detalle').value.trim();
        }
        cerrar(r);
      }
      capa.addEventListener('click', function (ev) {
        var b = ev.target.closest('button');
        if (!b) return;
        if (b.id === 'th-copiar') { U.copiar(pasos.join('\n'), b, { avisoFallo: 'No he podido copiar los pasos.' }); return; }
        if (b.id === 'th-no') { cerrar(null); return; }
        if (b.id === 'th-ok') aceptar();
      });
      var primero = $('th-persona') || $('th-fecha') || $('th-nota');
      if (primero) primero.focus();
    });
  }

  return { abrir: abrir, opcionesDePersona: opcionesDePersona };
})();
window.TareaHechaVentana = TareaHechaVentana;
