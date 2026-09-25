/* ============================================================
   administraciones-traer.js — «Pasar a Administraciones», en Ajustes ›
   Mantenimiento (25-sep-2026, fila 167,
   docs/ADMINISTRACIONES-COMO-TERCERO.md, punto 7).

   Lista los terceros de OTROS y de EMPRESAS con asuntos o con alta.
   Francisco marca cuáles son organismos o centros y les pone nombre
   corto (se propone a partir del actual, sin el código del final). Por
   cada marcado:
     - lo da de alta en ADMINISTRACIONES;
     - renombra sus asuntos abiertos (carpeta y ficha, por
       AsuntoRenombrar: hitos, notas y presencia van con ellos);
     - traslada sus asuntos archivados a ARCHIVO/ADMINISTRACIONES/<nuevo>
       con el mismo copiar-comprobar-borrar de archivar
       (`Carpetas.trasladar`), y pone al día su `_ficha.json`;
     - quita su alta vieja de otros.csv o empresas.csv.
   Uno que falle no para al resto: al final se dice cuántos y cuáles no.
   Los tipos de asunto no se mueven solos: casillas para marcar cuáles
   pasan también a la categoría nueva.

   Carga después de js/administraciones.js y de js/ajustes-mantenimiento.js.
   ============================================================ */
var AdministracionesTraer = (function () {

  var A = window.Administraciones;
  var CAT = 'ADMINISTRACIONES';
  var ORIGENES = ['OTROS', 'EMPRESAS'];

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(v); }

  /* «IES Ejemplo 29000000» -> centro, código 29000000, «IES Ejemplo»;
     «Ayuntamiento de Tal P2900700D» -> organismo, «Ayuntamiento de Tal». */
  function propuesta(texto) {
    var t = String(texto || '').trim();
    var m = t.match(/^(.*?)\s+(\d{8})$/);
    if (m) return { clase: 'centro', corto: m[1].trim(), codigo: m[2] };
    var sinCodigo = t.replace(/\s+\S*\d\S*$/, '').trim();
    return { clase: 'organismo', corto: sinCodigo || t, codigo: '' };
  }

  /* ---------- lo que hay ---------- */

  function terceroDeAbierto(a) {
    var f = a.ficha || {}, l = a.leido || {};
    return f.tercero || (l.resto ? Nombres.terceroDeResto(l.resto) : '');
  }
  function categoriaDeAbierto(a) {
    var f = a.ficha || {}, l = a.leido || {};
    return f.categoria || l.categoria || '';
  }

  async function candidatos() {
    var mapa = {}, orden = [];
    function poner(cat, tercero) {
      var k = cat + '|' + tercero;
      if (!mapa[k]) { mapa[k] = { categoria: cat, tercero: tercero, persona: null, abiertos: 0, archivados: 0 }; orden.push(k); }
      return mapa[k];
    }
    for (var i = 0; i < ORIGENES.length; i++) {
      var cat = ORIGENES[i];
      try {
        (await Datos.cargar(App.E.datos, cat)).lista.forEach(function (p) { poner(cat, App.textoTercero(p)).persona = p; });
      } catch (e) { /* sin su CSV, se sigue */ }
      (App.E.listaAbiertos || []).forEach(function (a) {
        if (categoriaDeAbierto(a) !== cat) return;
        var t = terceroDeAbierto(a);
        if (t) poner(cat, t).abiertos++;
      });
      try {
        var dirCat = await App.E.archivo.getDirectoryHandle(cat);
        var terceros = await Carpetas.subcarpetas(dirCat);
        for (var j = 0; j < terceros.length; j++) {
          var n = (await Carpetas.subcarpetas(terceros[j].handle)).length;
          if (n) poner(cat, terceros[j].nombre).archivados += n;
        }
      } catch (e) { /* sin esa carpeta en el ARCHIVO */ }
    }
    return orden.map(function (k) { return mapa[k]; })
      .filter(function (c) { return c.persona || c.abiertos || c.archivados; })
      .sort(function (a, b) { return U.normalizar(a.tercero) < U.normalizar(b.tercero) ? -1 : 1; });
  }

  /* ---------- pasar uno ---------- */

  function cambiarFinal(nombre, antes, despues) {
    return nombre.slice(-antes.length) === antes ? nombre.slice(0, nombre.length - antes.length) + despues : nombre;
  }

  function datoDe(persona, patron) {
    var campos = (persona && persona.campos) || {};
    var k = Object.keys(campos).filter(function (x) { return patron.test(U.normalizar(x)); })[0];
    return k ? campos[k] : '';
  }

  /* `c`, el candidato; `elegido`, { clase, corto, codigo }. Lanza si falla lo principal. */
  async function pasarUno(c, elegido) {
    var o = await A.alta(App.E.datos, {
      clase: elegido.clase, corto: elegido.corto, codigoCentro: elegido.codigo,
      oficial: c.persona ? c.persona.nombre : propuesta(c.tercero).corto,
      correo: datoDe(c.persona, /correo|e-?mail/), telefono: datoDe(c.persona, /telefono|movil/)
    });
    var antes = c.tercero, despues = A.tercero(o);

    /* Los abiertos: carpeta y ficha (con hitos, notas y presencia). */
    var abiertos = (App.E.listaAbiertos || []).filter(function (a) {
      return categoriaDeAbierto(a) === c.categoria && terceroDeAbierto(a) === antes;
    });
    for (var i = 0; i < abiertos.length; i++) {
      var viejo = abiertos[i].nombre, nuevo = cambiarFinal(viejo, antes, despues);
      if (nuevo !== viejo) {
        if (await Carpetas.existe(App.E.abiertos, nuevo)) throw new Error('Ya hay un asunto abierto que se llama «' + nuevo + '».');
        await Carpetas.renombrar(App.E.abiertos, viejo, nuevo);
      }
      await AsuntoRenombrar.mover(viejo, nuevo, { categoria: CAT, tercero: despues });
    }

    /* Los archivados: copiar, comprobar y borrar, como al archivar. */
    var movidosArchivo = 0;
    var dirCat = null, dirTer = null;
    try { dirCat = await App.E.archivo.getDirectoryHandle(c.categoria); dirTer = await dirCat.getDirectoryHandle(antes); }
    catch (e) { dirTer = null; }
    if (dirTer) {
      var destino = await Carpetas.bajar(App.E.archivo, [CAT, despues], true);
      var subs = await Carpetas.subcarpetas(dirTer);
      for (var j = 0; j < subs.length; j++) {
        var nombreNuevo = cambiarFinal(subs[j].nombre, antes, despues);
        await Carpetas.trasladar(dirTer, subs[j].nombre, destino, nombreNuevo);
        movidosArchivo++;
        try {
          var h = await destino.getDirectoryHandle(nombreNuevo);
          var ficha = window.FichaArchivo ? await FichaArchivo.leer(h) : null;
          if (ficha) await FichaArchivo.escribir(h, Object.assign(ficha, { categoria: CAT, tercero: despues }));
        } catch (e2) { /* la carpeta ya está en su sitio; la ficha se completa al abrirla */ }
      }
      try {
        var queda = await Carpetas.contenido(dirTer);
        if (!queda.carpetas.length && !queda.ficheros.length) await dirCat.removeEntry(antes);
      } catch (e3) { /* una carpeta vacía de más no estorba */ }
    }

    /* El alta vieja. */
    if (c.persona) await Datos.quitarDeLista(App.E.datos, c.categoria, c.persona.nombre);
    Datos.olvidar(c.categoria);
    Datos.olvidar(CAT);
    return { organismo: o, abiertos: abiertos.length, archivados: movidosArchivo };
  }

  /* Pasa todos los marcados; uno que falle no para al resto. */
  async function pasar(lista, alProgreso) {
    var hechos = [], fallidos = [];
    for (var i = 0; i < lista.length; i++) {
      if (alProgreso) alProgreso(i, lista.length);
      try { hechos.push(await pasarUno(lista[i].candidato, lista[i].elegido)); }
      catch (e) { fallidos.push({ tercero: lista[i].candidato.tercero, motivo: U.mensajeDeError(e) }); }
    }
    var archivados = hechos.reduce(function (n, h) { return n + h.archivados; }, 0);
    if (archivados && window.IndiceArchivo) {
      try { await IndiceArchivo.guardar(await IndiceArchivo.construir()); } catch (e) { /* se reconstruye a mano */ }
    }
    return { hechos: hechos, fallidos: fallidos };
  }

  /* Los tipos marcados pasan a la categoría nueva. */
  async function moverTipos(nombres) {
    if (!nombres.length) return 0;
    App.E.tipos.forEach(function (t) { if (nombres.indexOf(t.tipo) !== -1) t.categoria = CAT; });
    await App.guardarTipos();
    return nombres.length;
  }

  /* ---------- el bloque de Mantenimiento ---------- */

  function bloque() {
    var ya = $('bloque-pasar-administraciones');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-pasar-administraciones';
    d.innerHTML = '<summary><span class="bloque-titulo">Pasar a Administraciones</span>' +
      '<span class="bloque-pie">Organismos y centros que hoy están en OTROS o en EMPRESAS</span></summary>' +
      '<div class="bloque-cuerpo"><div id="pasar-adm-cuerpo" class="explica">Buscando…</div></div>';
    pantalla.appendChild(d);
    d.addEventListener('toggle', function () { if (d.open) pintar(); });
    return d;
  }

  var vistos = [];

  async function pintar() {
    var cuerpo = $('pasar-adm-cuerpo');
    if (!cuerpo) return;
    cuerpo.className = 'explica';
    cuerpo.textContent = 'Buscando…';
    vistos = await candidatos();
    var tipos = App.E.tipos.filter(function (t) { return ORIGENES.indexOf(t.categoria) !== -1; });
    cuerpo.className = '';
    cuerpo.innerHTML =
      '<p class="explica">Marca los que son organismos o centros educativos y ponles un nombre corto y estable ' +
      '(el de la carpeta). Sus asuntos abiertos y archivados pasan con ellos, con sus hitos y notas.</p>' +
      (vistos.length ? '<div class="adm-traer-lista">' + vistos.map(function (c, i) {
        var pr = propuesta(c.tercero);
        var cuantos = [c.abiertos ? c.abiertos + ' abierto' + (c.abiertos === 1 ? '' : 's') : '',
          c.archivados ? c.archivados + ' archivado' + (c.archivados === 1 ? '' : 's') : '',
          c.persona ? 'dado de alta' : ''].filter(Boolean).join(' · ');
        return '<div class="adm-traer-fila" data-i="' + i + '">' +
          '<label><input type="checkbox" class="adm-traer-marca"> <strong>' + esc(c.tercero) + '</strong> ' +
          '<span class="suave">(' + esc(c.categoria + (cuantos ? ' · ' + cuantos : '')) + ')</span></label>' +
          '<select class="campo adm-traer-clase"><option value="organismo"' + (pr.clase === 'organismo' ? ' selected' : '') + '>Organismo</option>' +
          '<option value="centro"' + (pr.clase === 'centro' ? ' selected' : '') + '>Centro educativo</option></select>' +
          '<input class="campo adm-traer-corto" value="' + esc(pr.corto) + '" placeholder="Nombre corto">' +
          '<input class="campo adm-traer-codigo" value="' + esc(pr.codigo) + '" placeholder="Código de centro">' +
          '</div>';
      }).join('') + '</div>' : '<div class="vacio">No hay ningún tercero en OTROS ni en EMPRESAS.</div>') +
      (tipos.length ? '<p class="explica" style="margin-top:12px">Tipos de asunto que pasan también a ADMINISTRACIONES:</p>' +
        '<div class="adm-traer-tipos">' + tipos.map(function (t) {
          return '<label><input type="checkbox" class="adm-traer-tipo" value="' + esc(t.tipo) + '"> ' + esc(t.tipo) +
            ' <span class="suave">(' + esc(t.categoria) + ')</span></label>';
        }).join('') + '</div>' : '') +
      '<p><button type="button" class="boton boton-principal" id="pasar-adm-boton">Pasar los marcados</button></p>' +
      '<div id="pasar-adm-progreso" class="explica oculto"></div>';
    $('pasar-adm-boton').onclick = function () { lanzar(this); };
  }

  async function lanzar(boton) {
    var marcados = [];
    Array.prototype.forEach.call(document.querySelectorAll('.adm-traer-fila'), function (f) {
      if (!f.querySelector('.adm-traer-marca').checked) return;
      marcados.push({ candidato: vistos[parseInt(f.dataset.i, 10)], elegido: {
        clase: f.querySelector('.adm-traer-clase').value, corto: f.querySelector('.adm-traer-corto').value.trim(),
        codigo: f.querySelector('.adm-traer-codigo').value.trim() } });
    });
    var tipos = Array.prototype.map.call(document.querySelectorAll('.adm-traer-tipo:checked'), function (x) { return x.value; });
    if (!marcados.length && !tipos.length) { U.aviso('No has marcado nada.', 'ambar'); return; }
    var ok = await U.preguntar('Pasar a Administraciones',
      '<p>Se van a pasar ' + marcados.length + ' tercero' + (marcados.length === 1 ? '' : 's') +
      (tipos.length ? ' y ' + tipos.length + ' tipo' + (tipos.length === 1 ? '' : 's') + ' de asunto' : '') +
      ' a ADMINISTRACIONES, con sus asuntos abiertos y archivados.</p>', 'Adelante');
    if (!ok) return;
    await U.mientrasGuarda(boton, async function () {
      var progreso = $('pasar-adm-progreso');
      progreso.classList.remove('oculto');
      var r = await pasar(marcados, function (i, n) { progreso.textContent = 'Pasando… ' + (i + 1) + ' de ' + n; });
      var nTipos = 0;
      try { nTipos = await moverTipos(tipos); } catch (e) { r.fallidos.push({ tercero: 'los tipos de asunto', motivo: U.mensajeDeError(e) }); }
      try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
      var texto = r.hechos.length + ' pasado' + (r.hechos.length === 1 ? '' : 's') + ' a Administraciones' +
        (nTipos ? ', y ' + nTipos + ' tipo' + (nTipos === 1 ? '' : 's') : '') + '.';
      if (r.fallidos.length) {
        U.aviso(texto + ' No he podido con: ' + r.fallidos.map(function (f) { return f.tercero + ' (' + f.motivo + ')'; }).join('; ') + '.', 'ambar');
      } else {
        U.aviso(texto, 'bueno');
      }
      await pintar();
    });
  }

  bloque();

  return { propuesta: propuesta, candidatos: candidatos, pasarUno: pasarUno, pasar: pasar, moverTipos: moverTipos, pintar: pintar };
})();
window.AdministracionesTraer = AdministracionesTraer;
