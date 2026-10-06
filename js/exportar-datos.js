/* ============================================================
   exportar-datos.js — los datos de «Exportar ▾» de Inicio (1-oct-2026,
   fila 241, docs/EXPORTAR-ASUNTOS.md).

   Aquí vive todo lo que NO es pantalla ni fichero:

     1. Leer lo que se ve en Inicio (los asuntos de la pestaña abierta,
        con los seis filtros y el buscador, en el orden de la tabla) y,
        si se pide, sumarle los archivados que cumplen los mismos
        filtros (por el índice del ARCHIVO).
     2. Una «fila» neutra por asunto (abierto o archivado) y el catálogo
        de columnas: las de la ficha y los campos propios de los tipos.
     3. La tabla ya masticada (`tabla`): columnas, celdas con su clase
        (texto, fecha o número), el número de asuntos y las sumas. La
        hoja de cálculo (js/exportar-hoja.js) y el informe
        (js/exportar-informe.js) solo la pintan.
     4. Las columnas elegidas, recordadas por ordenador.

   Una columna es «de cantidades» por su CONTENIDO, nunca por su nombre:
   lo es si todos sus valores no vacíos se leen como número («12»,
   «12,50», «12,50 €», «1.234,00»).

   Un asunto reservado sale sin el tercero, sin su identificador y sin
   el nombre de la carpeta: «Reservado» (sección 6 del documento).

   La parte pura (`leerNumero`, `formatoNumero`, `tabla`, …) se prueba
   sin navegador en pruebas/exportar-asuntos.mjs.
   ============================================================ */
var ExportarAsuntos = (function () {

  var CLAVE_COLUMNAS = 'gestor-exportar-columnas-';
  var RESERVADO = 'Reservado';

  /* ==========================================================
     NÚMEROS Y FECHAS
     ========================================================== */

  /* «12», «12,50», «12,50 €», «1.234,00», «1234.5» → número; si no
     parece un número, null. */
  function leerNumero(texto) {
    var t = String(texto === null || texto === undefined ? '' : texto)
      .replace(/€|euros?/gi, '').replace(/\s+/g, '');
    if (!t) return null;
    var n;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) n = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d+(,\d+)?$/.test(t)) n = t.replace(',', '.');
    else if (/^-?\d+(\.\d+)?$/.test(t)) n = t;
    else return null;
    var v = parseFloat(n);
    return isFinite(v) ? v : null;
  }

  /* 1234.5 → «1.234,50» (coma decimal, punto de miles). */
  function formatoNumero(n) {
    var negativo = n < 0;
    var partes = Math.abs(n).toFixed(2).split('.');
    var entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negativo ? '-' : '') + entero + ',' + partes[1];
  }

  /* 'AAAA-MM-DD' → 'dd-mm-aaaa'. */
  function fechaLegible(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }

  /* ==========================================================
     LAS COLUMNAS
     ========================================================== */

  var TEXTO_ESTADO = { pendiente: 'Pendiente', encurso: 'En curso', hecho: 'Hecho', noaplica: 'No aplica' };

  /* `clase`: cómo se escribe la celda. `defecto`: marcada la primera vez
     (las de la tabla de Inicio). `oculta`: para un asunto reservado, qué
     se pone en su lugar (RESERVADO o ''). */
  var COLUMNAS = [
    { id: 'limite', titulo: 'Plazo', clase: 'fecha', defecto: true, valor: function (r) { return r.limite; } },
    { id: 'tercero', titulo: 'Tercero', clase: 'texto', defecto: true, oculta: RESERVADO, valor: function (r) { return r.tercero; } },
    { id: 'tipo', titulo: 'Tipo', clase: 'texto', defecto: true, valor: function (r) { return r.tipoCorto; } },
    { id: 'hitoActual', titulo: 'Hito actual', clase: 'texto', defecto: true, valor: function (r) { return r.hitoActual; } },
    { id: 'leToca', titulo: 'Le toca a', clase: 'texto', defecto: true, valor: function (r) { return r.leToca; } },
    { id: 'inicio', titulo: 'Inicio', clase: 'fecha', defecto: true, valor: function (r) { return r.inicio; } },
    { id: 'situacion', titulo: 'Situación (abierto o archivado)', clase: 'texto', valor: function (r) { return r.situacion; } },
    { id: 'porLiquidarDesde', titulo: 'Por liquidar desde', clase: 'fecha', valor: function (r) { return r.porLiquidarDesde || ''; } },   /* fila 249 */
    { id: 'numero', titulo: 'Número de asunto', clase: 'texto', valor: function (r) { return r.numero; } },
    { id: 'tipoLargo', titulo: 'Tipo (nombre completo)', clase: 'texto', valor: function (r) { return r.tipo; } },
    { id: 'organo', titulo: 'Lo encarga', clase: 'texto', valor: function (r) { return r.organo; } },
    { id: 'categoria', titulo: 'Categoría del tercero', clase: 'texto', valor: function (r) { return r.categoria; } },
    { id: 'loPide', titulo: 'Quién lo pide', clase: 'texto', oculta: RESERVADO, valor: function (r) { return r.loPide; } },
    { id: 'via', titulo: 'Vía de comunicación', clase: 'texto', valor: function (r) { return r.via; } },
    { id: 'reservado', titulo: 'Reservado', clase: 'texto', valor: function (r) { return r.reservado ? 'Sí' : 'No'; } },
    { id: 'archivadoEl', titulo: 'Fecha de archivo', clase: 'fecha', valor: function (r) { return r.archivadoEl; } },
    { id: 'carpeta', titulo: 'Nombre de la carpeta', clase: 'texto', oculta: RESERVADO, valor: function (r) { return r.carpeta; } },
    { id: 'nDocumentos', titulo: 'Número de documentos', clase: 'numero', valor: function (r) { return r.nDocumentos; } },
    { id: 'notas', titulo: 'Notas', clase: 'texto', oculta: '', valor: function (r) { return r.notas; } }
  ];

  var PREFIJO_CAMPO = 'campo:';

  function columnaPorId(id, extra) {
    var todas = COLUMNAS.concat(extra || []);
    for (var i = 0; i < todas.length; i++) if (todas[i].id === id) return todas[i];
    return null;
  }

  function columnasPorDefecto() {
    return COLUMNAS.filter(function (c) { return c.defecto; }).map(function (c) { return c.id; });
  }

  /* ---------- la última elección, por ordenador y por destino ---------- */

  function columnasGuardadas(destino) {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_COLUMNAS + destino) || 'null');
      if (Array.isArray(v)) return v.map(String);
    } catch (e) { /* sin guardado: las de siempre */ }
    return null;
  }

  function guardarColumnas(destino, ids) {
    try { window.localStorage.setItem(CLAVE_COLUMNAS + destino, JSON.stringify(ids)); } catch (e) { /* no pasa nada */ }
  }

  /* ==========================================================
     LA FILA NEUTRA DE UN ASUNTO
     ========================================================== */

  function nombreDeClaveDeCampo(clave) {
    var i = String(clave).indexOf(':');
    if (i === -1) return String(clave);
    var origen = clave.slice(0, i), resto = clave.slice(i + 1);
    var cfg = origen === 'fichero' ? { origen: origen, columna: resto } : { origen: origen, id: resto };
    var nombre = '';
    try { nombre = window.Campos ? Campos.nombreDeCampo(cfg, (App.E && App.E.campos) || {}) : ''; } catch (e) { nombre = ''; }
    return nombre || resto;
  }

  /* Los valores guardados de la ficha (`ficha.campos`), por NOMBRE de
     campo. Un asunto reservado no deja salir los que vienen de la
     persona (fichero) ni los calculados con ella. */
  function camposDeFicha(ficha, reservado) {
    var salida = {};
    var guardados = (ficha && ficha.campos) || {};
    Object.keys(guardados).forEach(function (clave) {
      var g = guardados[clave];
      var valor = g && g.valor !== undefined ? String(g.valor) : '';
      if (!valor) return;
      var origen = clave.split(':')[0];
      if (reservado && origen !== 'propio') return;
      salida[nombreDeClaveDeCampo(clave)] = valor;
    });
    return salida;
  }

  function textoDeOrgano(tipo) {
    if (!window.TiposOrgano || !tipo) return '';
    var o = TiposOrgano.deNombre(tipo);
    return o ? TiposOrgano.texto(o) : '';
  }

  function textoDeVia(ficha) {
    if (!ficha || !ficha.via) return '';
    var v = window.Nombres && Nombres.via ? Nombres.via(ficha.via) : null;
    var n = v ? v.texto : ficha.via;
    return ficha.viaDato ? n + ': ' + ficha.viaDato : n;
  }

  function nombreDeResponsable(id, ajustes) {
    if (!id) return '';
    if (window.Hitos && Hitos.nombreDeEspera) { try { return Hitos.nombreDeEspera(id, ajustes) || id; } catch (e) { return id; } }
    return id;
  }

  /* Los hitos que se escriben en la hoja «Hitos» y bajo cada asunto del
     informe: título, estado, responsable, plazo y fecha en que se
     terminó. `lista` es la de hitos.json (o la del historial). */
  function hitosParaSacar(lista, ajustes) {
    var visibles = [];
    try { visibles = window.Hitos ? Hitos.visibles(lista || []) : (lista || []); } catch (e) { visibles = lista || []; }
    return visibles.map(function (h, i) {
      return {
        n: i + 1, titulo: h.titulo || '', estado: (h.estado === 'hecho' && h.sinRespuesta ? 'Hecho · sin respuesta' : TEXTO_ESTADO[h.estado]) || h.estado || '',
        responsable: nombreDeResponsable(h.responsable, ajustes),
        plazo: /^\d{4}-\d{2}-\d{2}/.test(h.fecha || '') ? String(h.fecha).slice(0, 10) : '',
        terminado: /^\d{4}-\d{2}-\d{2}/.test(h.hechoEl || '') ? String(h.hechoEl).slice(0, 10) : ''
      };
    });
  }

  /* Un asunto ABIERTO de la lista de Inicio. */
  function registroDeAbierto(a, hitos, ajustes) {
    var ficha = a.ficha || {};
    var leido = a.leido || {};
    var tipo = leido.tipo || ficha.tipo || '';
    var reservado = window.Reservados ? Reservados.es(a) : false;
    var hito = null, lado = null;
    try { hito = window.Hitos && Hitos.hitoActualDeAsunto ? Hitos.hitoActualDeAsunto(a) : null; } catch (e) { hito = null; }
    try { lado = App.ladoDe(a); } catch (e2) { lado = null; }
    var hitoActual = hito ? hito.titulo : (lado && lado.texto) || '';
    return {
      abierto: true, situacion: 'Abierto', nombre: a.nombre, carpeta: a.nombre,
      numero: ficha.numero || leido.numero || '',
      tipo: tipo, tipoCorto: tipo && window.Nombres ? Nombres.tipoParaVer(tipo, App.E.tipos) : tipo,
      organo: textoDeOrgano(tipo),
      tercero: window.QueMeToca ? QueMeToca.terceroDe(a) : (ficha.tercero || leido.resto || ''),
      categoria: ficha.categoria || leido.categoria || '',
      inicio: App.fechaIsoDeNombre(leido.fecha),
      limite: /^\d{4}-\d{2}-\d{2}/.test(ficha.limite || '') ? String(ficha.limite).slice(0, 10) : '',
      hitoActual: hitoActual, leToca: lado ? App.textoLeTocaA(a, lado) : '',
      loPide: (ficha.loPide && ficha.loPide.nombre) || '',
      via: textoDeVia(ficha), reservado: reservado,
      archivadoEl: '', nDocumentos: null,
      porLiquidarDesde: (ficha.porLiquidar && /^\d{4}-\d{2}-\d{2}/.test(ficha.porLiquidar.desde || '')) ? ficha.porLiquidar.desde.slice(0, 10) : '',
      notas: window.Notas && Notas.textoParaBuscar ? Notas.textoParaBuscar(ficha) : '',
      campos: camposDeFicha(ficha, reservado),
      hitos: hitosParaSacar(hitos, ajustes)
    };
  }

  /* Un asunto ARCHIVADO: su entrada del índice más lo que se lea de su
     carpeta (`ficha` de _ficha.json y `hitos` del historial; pueden
     faltar). */
  function registroDeArchivado(e, ficha, hitos, ajustes) {
    ficha = ficha || {};
    var propio = typeof ficha.reservado === 'boolean' ? ficha.reservado : e.reservado;
    var reservado = window.Reservados
      ? Reservados.es({ nombre: e.nombre, leido: { tipo: e.tipo }, ficha: { reservado: propio } }) : !!propio;
    var cerrado = ficha.cerradoEl || e.cerradoEl || '';
    return {
      abierto: false, situacion: 'Archivado', nombre: e.nombre, carpeta: e.nombre,
      numero: e.numero || ficha.numero || '',
      tipo: e.tipo || '', tipoCorto: e.tipo && window.Nombres ? Nombres.tipoParaVer(e.tipo, App.E.tipos) : (e.tipo || ''),
      organo: textoDeOrgano(e.tipo),
      tercero: e.tercero || '', categoria: e.categoria || '',
      inicio: App.fechaIsoDeNombre(e.fecha),
      limite: /^\d{4}-\d{2}-\d{2}/.test(ficha.limite || '') ? String(ficha.limite).slice(0, 10) : '',
      hitoActual: e.terminado ? 'Terminado' : (e.seQuedoEn || ''), leToca: '',
      loPide: e.loPideNombre || '',
      via: textoDeVia({ via: e.via || ficha.via, viaDato: e.viaDato || ficha.viaDato }), reservado: reservado,
      archivadoEl: e.archivadoEl || (cerrado ? String(cerrado).slice(0, 10) : ''),
      nDocumentos: (e.documentos || []).length,
      notas: e.notas || '',
      campos: camposDeFicha(ficha, reservado),
      hitos: hitosParaSacar(hitos, ajustes)
    };
  }

  /* ==========================================================
     LA TABLA YA MASTICADA (sin pantalla ni ficheros)
     ========================================================== */

  /* El valor en bruto de una columna para una fila, con lo reservado ya
     tapado. */
  function valorBruto(col, r) {
    if (r.reservado && col.id !== undefined && col.oculta !== undefined) return col.oculta;
    if (col.esCampo) return (r.campos && r.campos[col.nombreCampo]) || '';
    return col.valor(r);
  }

  /* ¿Todos los valores no vacíos de esta columna se leen como número? */
  function esDeCantidades(col, registros) {
    if (col.esCampo) {
      var vistos = 0;
      for (var i = 0; i < registros.length; i++) {
        var v = valorBruto(col, registros[i]);
        if (v === '' || v === null || v === undefined) continue;
        if (leerNumero(v) === null) return false;
        vistos++;
      }
      return vistos > 0;
    }
    return col.clase === 'numero';
  }

  function sufijoDeMoneda(col, registros) {
    if (!col.esCampo) return '';
    if (/import|precio|cobr|cuota|euro|€/i.test(col.titulo)) return ' €';
    for (var i = 0; i < registros.length; i++) {
      if (/€|euros?/i.test(String(valorBruto(col, registros[i]) || ''))) return ' €';
    }
    return '';
  }

  /* Fila 244: la clase que Francisco le puso a un campo propio (importe, numero, fecha), por su
     nombre; '' si es texto, lista o no es un campo propio. */
  function claseDeclaradaDe(nombre) {
    var propios = (window.App && App.E && App.E.campos && App.E.campos.propios) || [];
    var p = propios.filter(function (x) { return x.nombre === nombre; })[0];
    return (p && (p.clase === 'importe' || p.clase === 'numero' || p.clase === 'fecha')) ? p.clase : '';
  }

  /* Las columnas que lleva cada campo propio de los tipos que salen. */
  function columnasDeCampos(registros, tipos) {
    var nombres = [];
    function meter(n) { if (n && nombres.indexOf(n) === -1) nombres.push(n); }
    (tipos || []).forEach(function (tipo) {
      var cfg = (window.App && App.E && App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
      cfg.forEach(function (c) {
        if (!window.Campos) return;
        meter(Campos.nombreDeCampo(c, App.E.campos));
      });
    });
    (registros || []).forEach(function (r) { Object.keys(r.campos || {}).forEach(meter); });
    return nombres.map(function (n) {
      return { id: PREFIJO_CAMPO + n, titulo: n, clase: 'texto', esCampo: true, nombreCampo: n, oculta: undefined, claseDeclarada: claseDeclaradaDe(n) };
    });
  }

  /* `registros`: las filas neutras en el orden de salida; `columnas`: los
     objetos de columna ya elegidos (con las de campos). Devuelve:
       { columnas: [{ id, titulo, clase, sufijo }],
         filas: [[ { k: 'texto'|'fecha'|'numero', v, raw } … ]],
         total: N, sumas: { <posición de columna>: número } } */
  function tabla(registros, columnas) {
    var cols = columnas.map(function (c) {
      var clase = c.clase;
      var sufijo;
      if (c.esCampo && c.claseDeclarada) {
        /* Fila 244: la clase declarada manda, no la que se adivina por el contenido. */
        clase = c.claseDeclarada === 'fecha' ? 'fecha' : 'numero';
        sufijo = c.claseDeclarada === 'importe' ? ' €' : '';
      } else {
        if (c.esCampo) clase = esDeCantidades(c, registros) ? 'numero' : 'texto';
        sufijo = clase === 'numero' ? sufijoDeMoneda(c, registros) : '';
      }
      return { id: c.id, titulo: c.titulo, clase: clase, sufijo: sufijo, _c: c };
    });
    var sumas = {};
    var filas = registros.map(function (r) {
      return cols.map(function (c, i) {
        var bruto = valorBruto(c._c, r);
        if (c.clase === 'numero') {
          var n = (bruto === '' || bruto === null || bruto === undefined) ? null : leerNumero(bruto);
          if (n === null) return { k: 'texto', v: (bruto === null || bruto === undefined) ? '' : String(bruto) };
          sumas[i] = (sumas[i] || 0) + n;
          return { k: 'numero', v: n };
        }
        if (c.clase === 'fecha') {
          var iso = String(bruto || '');
          /* Fila 244: una fecha de campo que no encaja sale como texto en su celda (no se pierde). */
          return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? { k: 'fecha', v: iso } : { k: 'texto', v: bruto === RESERVADO ? RESERVADO : (c._c.esCampo ? iso : '') };
        }
        return { k: 'texto', v: bruto === null || bruto === undefined ? '' : String(bruto) };
      });
    });
    cols.forEach(function (c) { delete c._c; });
    /* Sin la cola de decimales de sumar en coma flotante (5,6000000000000005). */
    cols.forEach(function (c, i) { if (c.clase === 'numero') sumas[i] = sumas[i] === undefined ? 0 : Number(sumas[i].toFixed(8)); });
    return { columnas: cols, filas: filas, total: registros.length, sumas: sumas };
  }

  /* El texto de una celda tal como se lee en el informe. */
  function textoDeCelda(celda, columna) {
    if (celda.k === 'fecha') return fechaLegible(celda.v);
    if (celda.k === 'numero') return formatoNumero(celda.v) + (columna && columna.sufijo ? columna.sufijo : '');
    return celda.v;
  }

  function textoDeTotal(t, i) {
    return 'Total ' + t.columnas[i].titulo + ': ' + formatoNumero(t.sumas[i]) + (t.columnas[i].sufijo || '');
  }

  function textoDeNumeroDeAsuntos(n) { return n + (n === 1 ? ' asunto' : ' asuntos'); }

  /* Las filas de la hoja «Hitos» (y los hitos de cada asunto en el
     informe): una por hito de cada asunto exportado. */
  function filasDeHitos(registros) {
    var salida = [];
    registros.forEach(function (r) {
      r.hitos.forEach(function (h) {
        salida.push({
          numero: r.numero, tercero: r.reservado ? RESERVADO : r.tercero, tipo: r.tipoCorto,
          n: h.n, titulo: h.titulo, estado: h.estado, responsable: h.responsable, plazo: h.plazo, terminado: h.terminado
        });
      });
    });
    return salida;
  }

  /* ==========================================================
     LO QUE SE VE EN INICIO
     ========================================================== */

  function $(id) { return document.getElementById(id); }

  function textoDelSelect(id) {
    var s = $(id);
    if (!s || !s.value) return '';
    var op = s.options[s.selectedIndex];
    return op ? op.textContent : s.value;
  }

  var PESTANAS = { adm: 'En Administración', esp: 'En espera', todos: 'Todos los abiertos', dorm: 'Dormidos' };

  /* Los filtros puestos ahora mismo, en valores y en palabras. */
  function filtrosActuales() {
    var fechas = App.fechasDelFiltro();
    var pestana = (window.InicioTabla && InicioTabla._pestanaActual && InicioTabla._pestanaActual()) || 'todos';
    var campoBuscar = $('buscar-abiertos');
    var f = {
      pestana: pestana, pestanaTexto: PESTANAS[pestana] || '',
      texto: campoBuscar ? campoBuscar.value.trim() : '',
      tipo: $('filtro-tipo-asunto') ? $('filtro-tipo-asunto').value : '',
      organo: $('filtro-organo') ? $('filtro-organo').value : '',
      responsable: window.QueMeToca ? QueMeToca.leerFiltroResponsable() : '',
      desde: fechas.desde, hasta: fechas.hasta, palabras: []
    };
    if (f.responsable) f.palabras.push('Responsable: ' + textoDelSelect('inicio-me-toca-responsable'));
    if ($('filtro-estado') && $('filtro-estado').value) f.palabras.push('Situación: ' + textoDelSelect('filtro-estado'));
    if ($('filtro-plazo') && $('filtro-plazo').value) f.palabras.push('Plazo: ' + textoDelSelect('filtro-plazo'));
    if (f.organo) f.palabras.push('Lo encarga: ' + textoDelSelect('filtro-organo'));
    if (f.tipo) f.palabras.push('Tipo: ' + textoDelSelect('filtro-tipo-asunto'));
    if (f.desde || f.hasta) f.palabras.push('Fechas: ' + App.textoDeFechas(f.desde, f.hasta));
    if (f.texto) f.palabras.push('Busca: «' + f.texto + '»');
    return f;
  }

  /* Los asuntos abiertos que se ven AHORA en la tabla, en su orden. */
  function abiertosDeLaVista() {
    var porNombre = {};
    (App.E.listaAbiertos || []).forEach(function (a) { porNombre[a.nombre] = a; });
    var filas = document.querySelectorAll('#inicio-tabla-cuerpo tr.inicio-tabla-fila');
    var salida = [];
    Array.prototype.forEach.call(filas, function (tr) {
      var a = porNombre[tr.dataset.asunto];
      if (a) salida.push(a);
    });
    return salida;
  }

  async function ficherosDe(handle) {
    try {
      var lista = await Carpetas.ficheros(handle);
      return lista.filter(function (f) { return App.esDocumentoDeTrabajo(f.nombre); }).length;
    } catch (e) { return null; }
  }

  async function registrosDeAbiertos(lista, op) {
    var datos = null;
    try { datos = window.Hitos ? await Hitos.leer() : null; } catch (e) { datos = (window.Hitos && Hitos.ultimosLeidos()) || null; }
    var ajustes = datos && datos.ajustes;
    var salida = [];
    for (var i = 0; i < lista.length; i++) {
      var a = lista[i];
      var entrada = datos && datos.porAsunto && datos.porAsunto[a.nombre];
      var r = registroDeAbierto(a, entrada ? entrada.hitos : [], ajustes);
      if (op && op.conDocumentos && a.handle) r.nDocumentos = await ficherosDe(a.handle);
      salida.push(r);
    }
    return salida;
  }

  /* ==========================================================
     LOS ARCHIVADOS (por el índice del ARCHIVO)
     ========================================================== */

  /* ¿Este curso ('2025-26') toca el rango de fechas? */
  function cursoTocaElRango(curso, desde, hasta) {
    var m = String(curso).match(/^(\d{4})/);
    if (!m) return true;
    var y = parseInt(m[1], 10);
    var ini = y + '-09-01', fin = (y + 1) + '-08-31';
    if (hasta && ini > hasta) return false;
    if (desde && fin < desde) return false;
    return true;
  }

  function pasaArchivado(e, f) {
    if (f.tipo && f.tipo !== (e.tipo || App.SIN_TIPO)) return false;
    if (f.organo && window.TiposOrgano && !TiposOrgano.pasaFiltro(e.tipo || '', f.organo)) return false;
    if (!App.pasaFiltroFechas(App.fechaIsoDeNombre(e.fecha), f.desde, f.hasta)) return false;
    /* Un asunto archivado ya no tiene hito actual: con un responsable
       elegido no pasa, igual que un asunto abierto sin hito actual. */
    if (f.responsable) return false;
    if (f.texto) {
      var texto = U.normalizar(f.texto);
      var pseudo = { nombre: e.nombre, leido: { tipo: e.tipo }, ficha: { reservado: e.reservado } };
      var buscado = (window.Reservados && Reservados.tapar(pseudo))
        ? Reservados.textoDeBusqueda(pseudo)
        : U.normalizar([e.nombre, e.tipo, e.tercero].filter(Boolean).join(' '));
      if (buscado.indexOf(texto) === -1) return false;
    }
    return true;
  }

  /* Las entradas del índice que cumplen los filtros. Si el índice no
     existe todavía, se hace en este momento (con `alEsperar` para avisar
     de que va a tardar). */
  async function entradasDeArchivados(f, alEsperar) {
    if (!window.IndiceArchivo) return [];
    var r = await IndiceArchivo.leerDisco();
    if (!r.ok && r.motivo === 'no-existe' && IndiceArchivo.construir) {
      if (alEsperar) alEsperar('Preparando el índice del archivo… puede tardar un poco.');
      var hecho = await IndiceArchivo.construir();
      await IndiceArchivo.guardar(hecho);
      r = await IndiceArchivo.leerDisco();
    }
    if (!r.ok) return [];
    var cursos = (r.datos.cursos || []).filter(function (c) { return cursoTocaElRango(c, f.desde, f.hasta); });
    var salida = [];
    for (var i = 0; i < cursos.length; i++) {
      var d = await IndiceArchivo.leerDisco({ curso: cursos[i] });
      if (d.ok) salida = salida.concat(d.datos.asuntos || []);
    }
    return salida.filter(function (e) { return pasaArchivado(e, f); });
  }

  /* De cada archivado que cumple, además, su ficha y (si se piden) sus
     hitos, leídos de su carpeta. */
  async function registrosDeArchivados(entradas, op, alAvanzar) {
    var ajustes = null;
    try { ajustes = window.Hitos && Hitos.ultimosLeidos() ? Hitos.ultimosLeidos().ajustes : null; } catch (e) { ajustes = null; }
    var salida = [];
    for (var i = 0; i < entradas.length; i++) {
      var e = entradas[i];
      var ficha = null, hitos = [];
      var cual = await IndiceArchivo.resolverHandle(e);
      if (cual && cual.handle) {
        if (window.FichaArchivo) { try { ficha = await FichaArchivo.leer(cual.handle); } catch (e1) { ficha = null; } }
        if (op && op.conHitos && window.Hitos && Hitos.NOMBRE_HISTORIAL) {
          try {
            var texto = await Carpetas.leerTexto(cual.handle, Hitos.NOMBRE_HISTORIAL);
            var leidos = texto ? Hitos._leerHitosDeHistorial(texto) : null;
            hitos = leidos ? leidos.hitos : [];
          } catch (e2) { hitos = []; }
        }
      }
      salida.push(registroDeArchivado(e, ficha, hitos, ajustes));
      if (alAvanzar && (i + 1) % 25 === 0) alAvanzar(i + 1, entradas.length);
    }
    return salida;
  }

  /* El orden de la pantalla para los abiertos, y después los archivados
     del más antiguo al más reciente (por fecha de inicio). */
  function ordenarArchivados(lista) {
    return lista.slice().sort(function (a, b) {
      var ka = App.claveDeFecha(a.fecha), kb = App.claveDeFecha(b.fecha);
      return ka === kb ? 0 : (ka < kb ? -1 : 1);
    });
  }

  return {
    RESERVADO: RESERVADO, COLUMNAS: COLUMNAS, PREFIJO_CAMPO: PREFIJO_CAMPO,
    leerNumero: leerNumero, formatoNumero: formatoNumero, fechaLegible: fechaLegible,
    columnaPorId: columnaPorId, columnasPorDefecto: columnasPorDefecto,
    columnasGuardadas: columnasGuardadas, guardarColumnas: guardarColumnas,
    columnasDeCampos: columnasDeCampos,
    registroDeAbierto: registroDeAbierto, registroDeArchivado: registroDeArchivado,
    tabla: tabla, textoDeCelda: textoDeCelda, textoDeTotal: textoDeTotal,
    textoDeNumeroDeAsuntos: textoDeNumeroDeAsuntos, filasDeHitos: filasDeHitos,
    filtrosActuales: filtrosActuales, abiertosDeLaVista: abiertosDeLaVista,
    registrosDeAbiertos: registrosDeAbiertos,
    cursoTocaElRango: cursoTocaElRango, pasaArchivado: pasaArchivado,
    entradasDeArchivados: entradasDeArchivados, registrosDeArchivados: registrosDeArchivados,
    ordenarArchivados: ordenarArchivados
  };
})();
window.ExportarAsuntos = ExportarAsuntos;
