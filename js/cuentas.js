/* ============================================================
   cuentas.js — pantalla "Cuentas" (19-sep-2026, fila 74,
   docs/CUENTAS-DE-FIN-DE-CURSO.md).

   Para la memoria de fin de curso: cuántos asuntos de cada tipo, por
   mes, por quién los pidió, y cuánto se tarda en tramitarlos. Todo de
   sitios que ya existen (el índice del ARCHIVO y la lista de asuntos
   abiertos en memoria): **nunca** se recorre el ARCHIVO entero para
   contar, para eso está el índice (`js/archivo-indice.js`, fila 44).

   Vive entera en su propio fichero, con el mismo patrón que "Qué me
   toca" (js/que-me-toca.js): no está en index.html más que su
   <script> y su <link>, se registra con App.PANTALLAS.push y la
   sección se crea a mano, ya al cargar el script.

   La lógica de contar (`_entradaAbierta`, `_entradaArchivada`,
   `_porTipo`, `_porMes`, `_porQuienLoPide`, `_tiempoDeTramite`) es
   pura, sin DOM ni disco: se comprueba sin navegador en
   pruebas/cuentas.mjs. Solo `pintar`/`cargar` tocan `document`,
   `App.E` y `window.Gestor`/`IndiceArchivo`.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     EL CURSO ACADÉMICO DE UNA FECHA AAMMDD
     ========================================================== */

  function isoDeAammdd(aammdd) {
    if (!/^\d{6}$/.test(aammdd || '')) return '';
    return '20' + aammdd.slice(0, 2) + '-' + aammdd.slice(2, 4) + '-' + aammdd.slice(4, 6);
  }

  /* Se calcula desde la FECHA DE APERTURA (no del año académico que
     algunos tipos llevan en el nombre, un campo opcional que muchos
     tipos no traen: EMPRESAS, por ejemplo, nunca lo lleva): así ningún
     asunto se queda fuera de todos los cursos solo por su tipo. */
  function cursoDeAammdd(aammdd) {
    return U.cursoDeFecha(isoDeAammdd(aammdd));
  }

  /* ==========================================================
     QUIÉN LO PIDIÓ, AGRUPADO (2.1 del encargo: familia, alumnado,
     del propio centro, de una empresa)
     ========================================================== */

  function grupoLoPide(categoria, relacion) {
    if (U.normalizar(relacion || '').indexOf('tutor legal') !== -1) return 'Familia';
    if (categoria === 'TUTORES LEGALES') return 'Familia';   /* fila 166 */
    if (categoria === 'ALUMNADO') return 'Alumnado';
    if (categoria === 'PERSONAL') return 'Centro';
    if (categoria === 'EMPRESAS') return 'Empresa';
    return 'Otros';
  }

  /* ==========================================================
     NORMALIZAR UNA ENTRADA, ABIERTA O ARCHIVADA, A LA MISMA FORMA
     ========================================================== */

  /* Fila 135: un asunto reservado se cuenta, pero en «quién lo pide»
     sale como «Reservado» (js/reservados.js decide cuál lo es). */
  function esReservado(a) {
    return typeof Reservados !== 'undefined' ? Reservados.es(a) : false;
  }

  /* `a` es lo que trae `window.Gestor.asuntos()`: {nombre, ficha, ...}. */
  function entradaAbierta(a, tipos) {
    var leido = Nombres.leer(a.nombre, tipos || []);
    var ficha = a.ficha || {};
    var loPide = ficha.loPide || null;
    var reservado = esReservado({ leido: leido, ficha: ficha });
    return {
      abierta: true, fecha: leido.fecha || '',
      categoria: leido.reconocido ? leido.categoria : '', tipo: leido.reconocido ? leido.tipo : '',
      tieneLoPide: reservado || !!(loPide && loPide.nombre),
      loPide: reservado ? 'Reservado' : (loPide ? grupoLoPide(loPide.categoria, loPide.relacion) : ''),
      abiertoEl: ficha.abiertoEl || '', cerradoEl: ''
    };
  }

  /* `e` es una entrada del índice del ARCHIVO (js/archivo-indice.js,
     `entradaDe`, con los campos añadidos en esta misma fila). */
  function entradaArchivada(e) {
    var reservado = esReservado({ tipo: e.tipo, reservado: e.reservado });
    return {
      abierta: false, fecha: e.fecha || '',
      categoria: e.reconocido ? e.categoria : '', tipo: e.reconocido ? e.tipo : '',
      tieneLoPide: reservado || !!e.loPideNombre,
      loPide: reservado ? 'Reservado' : (e.loPideNombre ? grupoLoPide(e.loPideCategoria, e.loPideRelacion) : ''),
      abiertoEl: e.abiertoEl || '', cerradoEl: e.cerradoEl || ''
    };
  }

  /* ==========================================================
     LOS CURSOS QUE DE VERDAD HAY
     ========================================================== */

  function cursosDeEntradas(entradas) {
    var vistos = {};
    entradas.forEach(function (e) {
      var c = cursoDeAammdd(e.fecha);
      if (c) vistos[c] = true;
    });
    return Object.keys(vistos).sort().reverse();
  }

  /* ==========================================================
     LAS CUATRO CUENTAS (2.1 del encargo)
     ========================================================== */

  function filtradasPorCurso(entradas, curso) {
    if (!curso) return entradas;
    return entradas.filter(function (e) { return cursoDeAammdd(e.fecha) === curso; });
  }

  /* Categoría → tipo → cuántos, abiertos, archivados. Un asunto sin
     tipo reconocible (nombre que no encaja con ningún tipo de
     Ajustes) se cuenta aparte, en "Sin clasificar": no se pierde, solo
     no se sabe de qué es (3.3 del encargo). Ordenada por categoría y,
     dentro, de más a menos. */
  function porTipo(entradas, curso) {
    var mapa = {};
    filtradasPorCurso(entradas, curso).forEach(function (e) {
      var categoria = e.categoria || 'Sin clasificar';
      var tipo = e.categoria ? e.tipo : '—';
      var clave = categoria + '\u0001' + tipo;
      if (!mapa[clave]) mapa[clave] = { categoria: categoria, tipo: tipo, cuantos: 0, abiertos: 0, archivados: 0 };
      mapa[clave].cuantos++;
      if (e.abierta) mapa[clave].abiertos++; else mapa[clave].archivados++;
    });
    var filas = Object.keys(mapa).map(function (k) { return mapa[k]; });
    filas.sort(function (a, b) {
      if (a.categoria !== b.categoria) return a.categoria < b.categoria ? -1 : 1;
      return b.cuantos - a.cuantos;
    });
    return filas;
  }

  /* Cuántos asuntos se abrieron cada mes del curso elegido (o de
     todos, sin curso elegido). "AAMM" tal cual sale de la fecha de la
     carpeta: quien pinta le pone el nombre del mes. */
  /* Por quién lo encarga (fila 134, js/tipos-organo.js): el órgano de
     su tipo, en el orden de siempre (Secretaría, Dirección, Jefatura,
     Varios, Sin asignar); un asunto sin tipo reconocible va a «Sin
     asignar». `organoDe(tipo)` da el órgano de un nombre de tipo. */
  function porOrgano(entradas, curso, organoDe) {
    var organos = (window.TiposOrgano && TiposOrgano.ORGANOS) ||
      [{ valor: '', texto: 'Sin asignar' }];
    var mapa = {};
    filtradasPorCurso(entradas, curso).forEach(function (e) {
      var o = (e.tipo && organoDe) ? (organoDe(e.tipo) || '') : '';
      if (!mapa[o]) mapa[o] = { cuantos: 0, abiertos: 0, archivados: 0 };
      mapa[o].cuantos++;
      if (e.abierta) mapa[o].abiertos++; else mapa[o].archivados++;
    });
    return organos.filter(function (o) { return mapa[o.valor]; }).map(function (o) {
      var m = mapa[o.valor];
      return { organo: o.texto, cuantos: m.cuantos, abiertos: m.abiertos, archivados: m.archivados };
    });
  }

  function porMes(entradas, curso) {
    var mapa = {};
    filtradasPorCurso(entradas, curso).forEach(function (e) {
      if (!/^\d{6}$/.test(e.fecha)) return;
      var clave = e.fecha.slice(0, 4);
      mapa[clave] = (mapa[clave] || 0) + 1;
    });
    return Object.keys(mapa).sort().map(function (k) { return { mes: k, cuantos: mapa[k] }; });
  }

  /* Cuántos asuntos vienen de familia, de alumnado, del propio centro
     o de una empresa; los que no tienen "Quién lo pide" apuntado van
     aparte, en "Sin apuntar" (no se cuentan como si fueran de nadie). */
  function porQuienLoPide(entradas, curso) {
    var mapa = {};
    filtradasPorCurso(entradas, curso).forEach(function (e) {
      var grupo = e.tieneLoPide ? e.loPide : 'Sin apuntar';
      mapa[grupo] = (mapa[grupo] || 0) + 1;
    });
    return Object.keys(mapa).map(function (k) { return { grupo: k, cuantos: mapa[k] }; })
      .sort(function (a, b) { return b.cuantos - a.cuantos; });
  }

  function diasEntre(iso1, iso2) {
    var d1 = new Date(iso1).getTime(), d2 = new Date(iso2).getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.round((d2 - d1) / 86400000);
  }

  /* Solo de los archivados con las dos fechas (los de antes de la
     fila 74, o los que vinieran sin ellas por lo que sea, no entran:
     no se inventa una duración). Media y el que más tardó, en días. */
  function tiempoDeTramite(entradas, curso) {
    var dias = filtradasPorCurso(entradas, curso)
      .filter(function (e) { return !e.abierta && e.abiertoEl && e.cerradoEl; })
      .map(function (e) { return diasEntre(e.abiertoEl, e.cerradoEl); })
      .filter(function (d) { return d !== null && d >= 0; });
    if (!dias.length) return { cuantos: 0, media: 0, maximo: 0 };
    var suma = dias.reduce(function (a, b) { return a + b; }, 0);
    return { cuantos: dias.length, media: Math.round(suma / dias.length), maximo: Math.max.apply(null, dias) };
  }

  /* Texto separado por tabuladores, listo para pegar en un documento o
     en una hoja de cálculo (2.3 del encargo). */
  function textoParaCopiar(cabecera, filas) {
    return [cabecera].concat(filas).map(function (f) { return f.join('\t'); }).join('\n');
  }

  /* ==========================================================
     LA PANTALLA
     ========================================================== */

  App.PANTALLAS.push('cuentas');

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function textoDeMes(aamm) {
    var mes = parseInt(aamm.slice(2, 4), 10);
    if (!mes || mes < 1 || mes > 12) return aamm;
    return MESES_CORTOS[mes - 1] + '-20' + aamm.slice(0, 2);
  }

  var construida = false;

  function construirPantalla() {
    if (construida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-cuentas';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera">' +
        '<h2>Cuentas</h2>' +
        '<div class="acciones">' +
          '<label class="etiqueta-en-linea" for="cuentas-curso">Curso</label>' +
          '<select id="cuentas-curso" class="campo"><option value="">Todos</option></select>' +
          '<button type="button" id="cuentas-copiar" class="boton">Copiar la tabla</button>' +
          '<button type="button" id="cuentas-volver" class="boton boton-volver">← Volver</button>' +
        '</div>' +
      '</header>' +
      '<p class="explica">Para la memoria de fin de curso: cuántos asuntos de cada tipo, por mes, ' +
        'por quién los pidió, y cuánto se tarda en tramitarlos. De los datos que ya hay, sin ' +
        'recorrer el ARCHIVO.</p>' +
      '<div id="cuentas-cuerpo"><div class="vacio">Cargando…</div></div>';
    contenido.appendChild(seccion);
    $('cuentas-volver').onclick = function () { App.ir('abiertos'); };
    $('cuentas-curso').onchange = function () { pintar(); };
    $('cuentas-copiar').onclick = function () { copiarTabla(); };
    construida = true;
  }
  if (typeof document !== 'undefined' && document.querySelector) construirPantalla();

  var ultimo = null;   /* { entradas, indiceOk }, lo último cargado */

  async function cargar() {
    var tipos = (window.App && App.E && App.E.tipos) || [];
    var abiertas = (window.Gestor ? window.Gestor.asuntos() : [])
      .map(function (a) { return entradaAbierta(a, tipos); });
    /* Fila 177: Cuentas ya tiene su propio selector de curso (más abajo,
       sobre lo ya cargado), así que aquí hace falta el índice entero. */
    var resultado = window.IndiceArchivo ? await IndiceArchivo.leerDisco({ todos: true }) : { ok: false };
    var archivadas = resultado.ok ? resultado.datos.asuntos.map(entradaArchivada) : [];
    return { entradas: abiertas.concat(archivadas), indiceOk: resultado.ok };
  }

  function pintarSelectorDeCurso(entradas) {
    var sel = $('cuentas-curso');
    if (!sel) return;
    var actual = sel.value;
    var cursos = cursosDeEntradas(entradas);
    sel.innerHTML = ['<option value="">Todos</option>'].concat(
      cursos.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; })
    ).join('');
    sel.value = cursos.indexOf(actual) !== -1 ? actual
      : (cursos.indexOf(U.cursoActual()) !== -1 ? U.cursoActual() : '');
  }

  function tablaPorTipo(filas) {
    var conTiempos = !!window.CuentasTiempos;   /* fila 140: media y máximo por tipo */
    var total = filas.reduce(function (a, f) { return a + f.cuantos; }, 0);
    var totalAbiertos = filas.reduce(function (a, f) { return a + f.abiertos; }, 0);
    var totalArchivados = filas.reduce(function (a, f) { return a + f.archivados; }, 0);
    if (!filas.length) return '<div class="vacio">No hay ningún asunto en ese curso.</div>';
    var cuerpo = filas.map(function (f) {
      return '<tr><td>' + U.escapar(f.categoria) + '</td><td>' + U.escapar(f.tipo) + '</td>' +
        '<td>' + U.escapar(textoOrgano(f.tipo)) + '</td>' +
        '<td>' + f.cuantos + '</td><td>' + f.abiertos + '</td><td>' + f.archivados + '</td>' +
        (conTiempos ? '<td>' + CuentasTiempos.celda(f.media) + '</td><td>' + CuentasTiempos.celda(f.maximo) + '</td>' : '') + '</tr>';
    }).join('');
    return '<table class="cuentas-tabla"><thead><tr><th>Categoría</th><th>Tipo de asunto</th><th>Lo encarga</th>' +
      '<th>Cuántos</th><th>Abiertos</th><th>Archivados</th>' +
      (conTiempos ? '<th>Media (días)</th><th>Máximo (días)</th>' : '') + '</tr></thead><tbody>' + cuerpo +
      '<tr class="cuentas-total"><td colspan="3">Total</td><td>' + total + '</td><td>' +
      totalAbiertos + '</td><td>' + totalArchivados + '</td>' + (conTiempos ? '<td></td><td></td>' : '') + '</tr></tbody></table>';
  }

  function textoOrgano(tipo) {
    if (!window.TiposOrgano || !tipo || tipo === '—') return '';
    return TiposOrgano.texto(TiposOrgano.deNombre(tipo));
  }

  function bloquePorOrgano(filas) {
    if (!filas.length) return '';
    var cuerpo = filas.map(function (f) {
      return '<tr><td>' + U.escapar(f.organo) + '</td><td>' + f.abiertos + '</td><td>' + f.archivados +
        '</td><td>' + f.cuantos + '</td></tr>';
    }).join('');
    return '<h3 class="cuentas-subtitulo">Por quién lo encarga</h3>' +
      '<table class="cuentas-tabla cuentas-tabla-pequena"><thead><tr><th></th><th>Abiertos</th>' +
      '<th>Archivados</th><th>Total</th></tr></thead><tbody>' + cuerpo + '</tbody></table>';
  }

  function bloquePorMes(filas) {
    if (!filas.length) return '';
    var cuerpo = filas.map(function (f) {
      return '<tr><td>' + U.escapar(textoDeMes(f.mes)) + '</td><td>' + f.cuantos + '</td></tr>';
    }).join('');
    return '<h3 class="cuentas-subtitulo">Por mes</h3>' +
      '<table class="cuentas-tabla cuentas-tabla-pequena"><tbody>' + cuerpo + '</tbody></table>';
  }

  function bloquePorQuienLoPide(filas) {
    if (!filas.length) return '';
    var cuerpo = filas.map(function (f) {
      return '<tr><td>' + U.escapar(f.grupo) + '</td><td>' + f.cuantos + '</td></tr>';
    }).join('');
    return '<h3 class="cuentas-subtitulo">Por quién lo pidió</h3>' +
      '<table class="cuentas-tabla cuentas-tabla-pequena"><tbody>' + cuerpo + '</tbody></table>';
  }

  function bloqueTiempo(t) {
    if (!t.cuantos) return '';
    return '<h3 class="cuentas-subtitulo">Cuánto se tarda</h3>' +
      '<p class="explica">De ' + t.cuantos + ' asunto' + (t.cuantos === 1 ? '' : 's') + ' archivado' +
      (t.cuantos === 1 ? '' : 's') + ' con fecha de apertura y de cierre: una media de ' + t.media +
      ' día' + (t.media === 1 ? '' : 's') + ', y el que más tardó, ' + t.maximo + ' día' +
      (t.maximo === 1 ? '' : 's') + '.</p>';
  }

  async function pintar() {
    var caja = $('cuentas-cuerpo');
    if (!caja) return;
    /* El desplegable solo se rellena (y se le pone el curso actual por
       defecto) la primera vez: si se vuelve a montar en cada pintado,
       elegir "Todos" (value = "") lo deshace solo, porque "" no es
       ningún curso de la lista y cae en el valor por defecto. */
    var esPrimeraVez = !ultimo;
    if (!ultimo) ultimo = await cargar();
    if (esPrimeraVez) pintarSelectorDeCurso(ultimo.entradas);
    var curso = $('cuentas-curso') ? $('cuentas-curso').value : '';

    if (!ultimo.indiceOk) {
      caja.innerHTML = '<div class="vacio">El índice del ARCHIVO no está hecho: los asuntos ' +
        'archivados no entran en las cuentas todavía. Ve a ARCHIVO y pulsa "Reconstruir el ' +
        'índice".</div>';
      return;
    }

    var filas = porTipo(ultimo.entradas, curso);
    /* Fila 140 (js/cuentas-tiempos.js): tiempos por tipo y los abiertos más antiguos. */
    var antiguos = window.CuentasTiempos ? CuentasTiempos.abiertosAntiguos(window.Gestor ? Gestor.asuntos() : [], curso) : null;
    if (window.CuentasTiempos) CuentasTiempos.anadirTiempos(filas, ultimo.entradas, curso);
    caja.innerHTML = (antiguos ? CuentasTiempos.numeroArribaHTML(antiguos) : '') + tablaPorTipo(filas) +
      bloquePorOrgano(porOrgano(ultimo.entradas, curso, window.TiposOrgano && TiposOrgano.deNombre)) +
      bloquePorMes(porMes(ultimo.entradas, curso)) +
      bloquePorQuienLoPide(porQuienLoPide(ultimo.entradas, curso)) +
      bloqueTiempo(tiempoDeTramite(ultimo.entradas, curso)) +
      (antiguos ? CuentasTiempos.tablaAntiguosHTML(antiguos) : '');
    if (antiguos) CuentasTiempos.enganchar(caja, antiguos);
  }

  function copiarTabla() {
    if (!ultimo) return;
    var curso = $('cuentas-curso') ? $('cuentas-curso').value : '';
    var filas = porTipo(ultimo.entradas, curso);
    var t = window.CuentasTiempos && CuentasTiempos.anadirTiempos(filas, ultimo.entradas, curso);   /* fila 140 */
    var texto = textoParaCopiar(['Categoría', 'Tipo de asunto', 'Lo encarga', 'Cuántos', 'Abiertos', 'Archivados']
      .concat(t ? ['Media (días)', 'Máximo (días)'] : []), filas.map(function (f) {
      return [f.categoria, f.tipo, textoOrgano(f.tipo), f.cuantos, f.abiertos, f.archivados]
        .concat(t ? [CuentasTiempos.celda(f.media), CuentasTiempos.celda(f.maximo)] : []);
    }));
    U.copiar(texto, $('cuentas-copiar'));
  }

  async function abrir() {
    construirPantalla();
    ultimo = null;   /* siempre se recarga al entrar: puede haber cambiado desde la última vez */
    App.ir('cuentas');
    await pintar();
  }

  window.Cuentas = {
    abrir: abrir,
    /* para las pruebas (sin DOM ni disco: pruebas/cuentas.mjs) */
    _entradaAbierta: entradaAbierta, _entradaArchivada: entradaArchivada,
    _cursosDeEntradas: cursosDeEntradas, _porTipo: porTipo, _porMes: porMes,
    _porQuienLoPide: porQuienLoPide, _porOrgano: porOrgano, _tiempoDeTramite: tiempoDeTramite,
    _textoParaCopiar: textoParaCopiar
  };

})();
