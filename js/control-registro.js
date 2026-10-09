/* ============================================================
   control-registro.js — el control del registro de entrada y de salida
   (2-oct-2026, fila 259, docs/CONTROL-DEL-REGISTRO.md).

   Sin pantalla. Aquí viven: leer los dos listados CSV de Séneca, guardar
   los apuntes y las decisiones en `_GESTOR`, y emparejar cada apunte con
   un asunto (que se calcula cada vez, nunca se guarda).

   Qué se guarda (directo con `Carpetas`, como el índice del ARCHIVO:
   fuera de los dieciocho ficheros protegidos, con `ColaGuardado` y
   releyendo antes de escribir):
     - `_GESTOR/control-registro.json`: { _esquema, desde, subidas,
       decisiones, clasesSinAsunto }. Pequeño, se escribe con cada decisión.
     - `_GESTOR/control-registro/<año>.json`: { _esquema, apuntes }, un
       fichero por año de registro; solo se escribe al subir un listado.

   En pantalla la palabra es «apunte» (docs/VOCABULARIO.md).
   Las partes sin pantalla (`leerCsv`, `clasificar`, `huecos`,
   `sobrantes`, `resumenParaAvisos`) se prueban sin navegador.
   ============================================================ */
var ControlRegistro = (function () {

  var FICHERO = 'control-registro.json';
  var CARPETA = 'control-registro';
  var ESQUEMA = 1;
  var DIAS_POR_DEFECTO = 7;

  function gestor() { return window.Gestor && window.Gestor.carpetaGestor ? window.Gestor.carpetaGestor() : (window.App && App.E && App.E.gestor); }

  /* Sin mayúsculas, acentos ni espacios, puntos o signos: «Nº .Registro» y «Nº.Registro» salen iguales. */
  function hueso(t) {
    return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /* dd/mm/aaaa -> aaaa-mm-dd ('' si no es una fecha). */
  function fechaIso(t) {
    var m = String(t || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return '';
    return m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
  }

  function fechaLarga(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  function hoyIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ==========================================================
     LEER UN LISTADO DE SÉNECA
     ========================================================== */

  /* `2026/29700692/M000000000427` (o con la cola ` - ` / ` - N`) -> el código
     de la aplicación `26EM0427`. El libro (E/S) lo da el propio listado. */
  function codigoDeNumero(numeroSeneca, libro) {
    var m = String(numeroSeneca || '').match(/(\d{4})\/\d+\/([MA])\s*0*(\d+)/);
    if (!m) return null;
    var numero = String(parseInt(m[3], 10));
    var codigo = window.Nombres && Nombres.codigoRegistro
      ? Nombres.codigoRegistro({ ano: m[1], sentido: libro, modo: m[2], numero: numero })
      : m[1].slice(-2) + libro + m[2] + numero.padStart(4, '0');
    if (!codigo) return null;
    return { codigo: codigo, ano: m[1], serie: m[2], numero: parseInt(m[3], 10) };
  }

  /* Un CSV (ya como texto) -> { ok, libro, apuntes, total } o { ok:false, motivo }.
     El libro se sabe por los títulos de las columnas, nunca por el nombre del fichero. */
  function leerCsv(texto) {
    var NO = { ok: false, motivo: 'No parece un listado del registro de Séneca.' };
    var tabla;
    try { tabla = window.Datos.aTabla(texto).filas; } catch (e) { return NO; }
    if (!tabla || tabla.length < 1) return NO;
    var cab = tabla[0].map(hueso);
    function col(nombre) { return cab.indexOf(nombre); }
    var cNumero = col('nregistro');
    if (cNumero === -1) cNumero = col('numregistro');
    var cRemitente = col('remitente'), cDestinatario = col('destinatario');
    if (cNumero === -1 || (cRemitente === -1) === (cDestinatario === -1)) return NO;
    var libro = cRemitente !== -1 ? 'E' : 'S';
    var cParte = libro === 'E' ? cRemitente : cDestinatario;
    var cVia = libro === 'E' ? col('mododerecepcion') : col('mododeenvio');
    var cFecha = col('fechaderegistro'), cExtracto = col('extracto'), cClase = col('clasededocumento'), cEstado = col('estado');
    function dato(fila, c) { return c === -1 ? '' : String(fila[c] == null ? '' : fila[c]).trim(); }
    var apuntes = [];
    for (var i = 1; i < tabla.length; i++) {
      var fila = tabla[i];
      var c = codigoDeNumero(dato(fila, cNumero), libro);
      if (!c) continue;
      var estado = hueso(dato(fila, cEstado));
      apuntes.push({
        codigo: c.codigo, libro: libro, ano: c.ano, serie: c.serie, n: c.numero,
        fecha: fechaIso(dato(fila, cFecha)),
        extracto: dato(fila, cExtracto), clase: dato(fila, cClase),
        estado: estado === 'anulado' ? 'anulado' : (estado === 'incompleto' ? 'incompleto' : 'completo'),
        parte: dato(fila, cParte), via: dato(fila, cVia)
      });
    }
    if (!apuntes.length && tabla.length > 1) return NO;
    return { ok: true, libro: libro, apuntes: apuntes };
  }

  /* ==========================================================
     LEER Y ESCRIBIR EN _GESTOR
     ========================================================== */

  function vacio() {
    return { _esquema: ESQUEMA, desde: '', subidas: {}, decisiones: {}, clasesSinAsunto: { E: [], S: [] } };
  }

  /* Fila 314: la fecha «Revisar desde» solo vale como AAAA-MM-DD real, de 2000 a 2099. */
  function desdeValida(iso) {
    var v = String(iso || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var f = new Date(v + 'T12:00:00');
    return !isNaN(f.getTime()) && f.toISOString().slice(0, 10) === v && v >= '2000-01-01' && v <= '2099-12-31';
  }

  function normalizarControl(c) {
    var s = Object.assign(vacio(), c || {});
    if (s.desde && !desdeValida(s.desde)) s.desde = '';   /* solo en memoria: no se escribe nada por ello (p. ej. el 0020 de antes) */
    s.subidas = s.subidas || {};
    s.decisiones = s.decisiones || {};
    s.clasesSinAsunto = s.clasesSinAsunto || {};
    s.clasesSinAsunto.E = s.clasesSinAsunto.E || [];
    s.clasesSinAsunto.S = s.clasesSinAsunto.S || [];
    return s;
  }

  async function leerControlDisco() {
    var g = gestor();
    if (!g) return vacio();
    return normalizarControl(await Carpetas.leerJson(g, FICHERO));
  }

  async function carpetaApuntes(crear) {
    var g = gestor();
    if (!g) return null;
    if (crear) return Carpetas.crear(g, CARPETA);
    try { return await g.getDirectoryHandle(CARPETA); } catch (e) { return null; }
  }

  async function leerApuntesDeAno(ano) {
    var dir = await carpetaApuntes(false);
    if (!dir) return {};
    var j = await Carpetas.leerJson(dir, ano + '.json');
    return (j && j.apuntes) || {};
  }

  async function anosGuardados() {
    var dir = await carpetaApuntes(false);
    if (!dir) return [];
    var lista = await Carpetas.ficheros(dir);
    return lista.map(function (f) { return (String(f.nombre).match(/^(\d{4})\.json$/) || [])[1]; }).filter(Boolean);
  }

  /* Todo lo guardado: { control, apuntes: { codigo: apunte } }. */
  async function cargar() {
    var control = await leerControlDisco();
    var apuntes = {};
    var anos = await anosGuardados();
    for (var i = 0; i < anos.length; i++) {
      var porAno = await leerApuntesDeAno(anos[i]);
      Object.keys(porAno).forEach(function (k) { apuntes[k] = porAno[k]; });
    }
    return { control: control, apuntes: apuntes };
  }

  /* Leer, cambiar, escribir el fichero pequeño, de uno en uno y releyendo antes. */
  function cambiarControl(fn) {
    return ColaGuardado.poner(FICHERO, async function () {
      var g = gestor();
      var actual = await leerControlDisco();
      var resultado = fn(actual);
      actual._esquema = ESQUEMA;
      await Carpetas.guardarJson(g, FICHERO, actual);
      return resultado === undefined ? actual : resultado;
    });
  }

  /* Funde `nuevos` en el fichero de un año (por código: gana el nuevo). */
  function fundirAno(ano, nuevos) {
    return ColaGuardado.poner(CARPETA + '/' + ano, async function () {
      var dir = await carpetaApuntes(true);
      var actual = await leerApuntesDeAno(ano);
      Object.keys(nuevos).forEach(function (k) { actual[k] = nuevos[k]; });
      await Carpetas.guardarJson(dir, ano + '.json', { _esquema: ESQUEMA, apuntes: actual });
    });
  }

  function quitarDeAno(ano, deseado) {
    return ColaGuardado.poner(CARPETA + '/' + ano, async function () {
      var dir = await carpetaApuntes(false);
      if (!dir) return;
      var actual = await leerApuntesDeAno(ano);
      var nuevo = {};
      Object.keys(actual).forEach(function (k) { if (deseado(actual[k])) nuevo[k] = actual[k]; });
      await Carpetas.guardarJson(dir, ano + '.json', { _esquema: ESQUEMA, apuntes: nuevo });
    });
  }

  function quien() { return (window.App && App.E && App.E.usuario) || ''; }
  function ahora() { return window.U && U.ahora ? U.ahora() : new Date().toISOString(); }

  /* ==========================================================
     ACCIONES
     ========================================================== */

  /* «Revisar desde el día». Adelantarla quita lo anterior; atrasarla avisa de que hay que volver a subir. */
  async function ponerDesde(iso) {
    if (!desdeValida(iso)) throw new Error('La fecha tiene que ser un día real entre 2000 y 2099.');
    var antes = (await leerControlDisco()).desde;
    await cambiarControl(function (c) { c.desde = iso; });
    var quitados = 0;
    var anos = await anosGuardados();
    for (var i = 0; i < anos.length; i++) {
      await quitarDeAno(anos[i], function (a) { if (a.fecha >= iso) return true; quitados++; return false; });
    }
    return { atrasa: !!(antes && iso < antes), quitados: quitados };
  }

  /* Cuántos apuntes guardados se quitarían al poner esta fecha (no escribe nada). */
  async function cuantosQuitaria(iso) {
    var n = 0;
    var apuntes = (await cargar()).apuntes;
    Object.keys(apuntes).forEach(function (k) { if (!(apuntes[k].fecha >= iso)) n++; });
    return n;
  }

  /* Sube uno o varios listados: `ficheros` = [{ nombre, texto }]. Sin la fecha puesta no sube nada.
     Devuelve { ok, motivo?, porLibro: { E:{total,nuevos,fuera}, S:{…} }, rechazados:[{nombre,motivo}] }. */
  async function subir(ficheros) {
    var control = await leerControlDisco();
    if (!control.desde) return { ok: false, motivo: 'Pon antes la fecha «Revisar desde el día…».' };
    var existentes = (await cargar()).apuntes;
    var porLibro = {}, rechazados = [], nuevosPorAno = {};
    var hastaPorLibro = {};
    ficheros.forEach(function (f) {
      var r = leerCsv(f.texto);
      if (!r.ok) { rechazados.push({ nombre: f.nombre, motivo: r.motivo }); return; }
      var res = porLibro[r.libro] = porLibro[r.libro] || { total: 0, nuevos: 0, fuera: 0 };
      r.apuntes.forEach(function (a) {
        res.total++;
        if (a.fecha && a.fecha < control.desde) { res.fuera++; return; }
        if (!existentes[a.codigo] && !(nuevosPorAno[a.ano] && nuevosPorAno[a.ano][a.codigo])) res.nuevos++;
        (nuevosPorAno[a.ano] = nuevosPorAno[a.ano] || {})[a.codigo] = a;
        if (a.fecha && (!hastaPorLibro[r.libro] || a.fecha > hastaPorLibro[r.libro])) hastaPorLibro[r.libro] = a.fecha;
      });
    });
    var anos = Object.keys(nuevosPorAno);
    for (var i = 0; i < anos.length; i++) await fundirAno(anos[i], nuevosPorAno[anos[i]]);
    var libros = Object.keys(porLibro);
    if (libros.length) {
      await cambiarControl(function (c) {
        libros.forEach(function (l) {
          var previo = c.subidas[l] || {};
          var hasta = hastaPorLibro[l] || previo.hasta || '';
          if (previo.hasta && previo.hasta > hasta) hasta = previo.hasta;
          c.subidas[l] = { el: ahora(), por: quien(), hasta: hasta };
        });
      });
    }
    return { ok: true, porLibro: porLibro, rechazados: rechazados };
  }

  function decidir(codigo, decision) {
    return cambiarControl(function (c) {
      c.decisiones[codigo] = Object.assign({}, decision, { por: quien(), el: ahora() });
    });
  }

  function quitarDecision(codigo) {
    return cambiarControl(function (c) { delete c.decisiones[codigo]; });
  }

  function ponerClaseSinAsunto(libro, clase) {
    return cambiarControl(function (c) {
      if (c.clasesSinAsunto[libro].indexOf(clase) === -1) c.clasesSinAsunto[libro].push(clase);
    });
  }

  function quitarClaseSinAsunto(libro, clase) {
    return cambiarControl(function (c) {
      c.clasesSinAsunto[libro] = c.clasesSinAsunto[libro].filter(function (x) { return x !== clase; });
    });
  }

  /* ==========================================================
     EL CONTEXTO: LOS ASUNTOS CON LO QUE LLEVAN APUNTADO
     ========================================================== */

  /* Lista de { nombre, numero, abierto, tercero, categoria, reservado, registros:[códigos] }:
     los abiertos (asuntos.json) y los archivados (índice del ARCHIVO, todos los cursos). */
  async function contextoDeAsuntos() {
    var salida = [];
    var reg = (window.App && App.E && App.E.registro && App.E.registro.asuntos) || {};
    Object.keys(reg).forEach(function (nombre) {
      var f = reg[nombre] || {};
      var cerrado = String(f.estado || '') === 'cerrado';
      var codigos = [];
      Object.keys(f.documentos || {}).forEach(function (n) {
        ((f.documentos[n] && f.documentos[n].registros) || []).forEach(function (r) { if (r && r.codigo) codigos.push(r.codigo); });
      });
      salida.push({ nombre: nombre, numero: f.numero || '', abierto: !cerrado, tercero: f.tercero || '',
        categoria: f.categoria || '', reservado: f.reservado, tipo: f.tipo || '', ficha: f, registros: codigos });
    });
    if (window.IndiceArchivo && IndiceArchivo.leerDisco) {
      try {
        var r = await IndiceArchivo.leerDisco({ todos: true });
        if (r && r.ok) {
          var vistos = {};
          salida.forEach(function (a) { vistos[a.nombre] = true; });
          r.datos.asuntos.forEach(function (e) {
            if (vistos[e.nombre]) return;
            salida.push({ nombre: e.nombre, numero: e.numero || '', abierto: false, tercero: e.tercero || '',
              categoria: e.categoria || '', reservado: e.reservado, tipo: e.tipo || '', registros: (e.registros || []).slice() });
          });
        }
      } catch (e) { /* sin el índice solo se miran los abiertos */ }
    }
    return salida;
  }

  /* ==========================================================
     EMPAREJAR (sin pantalla)
     ========================================================== */

  var RE_NUMERO_ASUNTO = /\bA\d{2}-\d{4,}\b/i;

  /* estado = { control, apuntes }; asuntos = contextoDeAsuntos().
     Devuelve { E:{sin,con,no,anulados}, S:{…} }, lo más nuevo arriba. Cada elemento:
     { apunte, asunto, nota } (asunto null si no tiene; nota true = «el registro no está apuntado en el asunto»;
     por = 'clase' | 'decision' en «no»). */
  function clasificar(estado, asuntos) {
    var control = estado.control;
    var porCodigo = {}, porNumero = {}, porNombre = {};
    asuntos.forEach(function (a) {
      a.registros.forEach(function (c) { if (!porCodigo[c]) porCodigo[c] = a; });
      if (a.numero) porNumero[String(a.numero).toUpperCase()] = a;
      porNombre[hueso(a.nombre)] = a;
    });
    function deDecision(d) {
      if (!d || d.que !== 'asunto') return null;
      if (d.numero && porNumero[String(d.numero).toUpperCase()]) return porNumero[String(d.numero).toUpperCase()];
      if (d.carpeta && porNombre[hueso(d.carpeta)]) return porNombre[hueso(d.carpeta)];
      return null;
    }
    var salida = { E: { sin: [], con: [], no: [], anulados: [] }, S: { sin: [], con: [], no: [], anulados: [] } };
    Object.keys(estado.apuntes).forEach(function (k) {
      var a = estado.apuntes[k];
      var g = salida[a.libro];
      if (!g) return;
      if (a.estado === 'anulado') { g.anulados.push({ apunte: a }); return; }
      var d = control.decisiones[a.codigo];
      if (d && d.que === 'no-necesita') { g.no.push({ apunte: a, por: 'decision' }); return; }
      var asunto = porCodigo[a.codigo] || null, nota = false;
      if (!asunto) {
        var m = String(a.extracto || '').match(RE_NUMERO_ASUNTO);
        if (m && porNumero[m[0].toUpperCase()]) asunto = porNumero[m[0].toUpperCase()];
        if (!asunto && porNombre[hueso(a.extracto)] && hueso(a.extracto)) asunto = porNombre[hueso(a.extracto)];
        if (!asunto) asunto = deDecision(d);
        nota = !!asunto;
      }
      if (asunto) { g.con.push({ apunte: a, asunto: asunto, nota: nota }); return; }
      if (a.clase && (control.clasesSinAsunto[a.libro] || []).indexOf(a.clase) !== -1) { g.no.push({ apunte: a, por: 'clase' }); return; }
      g.sin.push({ apunte: a });
    });
    ['E', 'S'].forEach(function (l) {
      ['sin', 'con', 'no', 'anulados'].forEach(function (x) { salida[l][x].sort(masNuevoArriba); });
    });
    return salida;
  }

  function masNuevoArriba(x, y) {
    var a = x.apunte, b = y.apunte;
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    if (a.serie !== b.serie) return a.serie < b.serie ? 1 : -1;
    return b.n - a.n;
  }

  /* Cuántos apuntes sin asunto llevaría una clase al darla por «nunca lleva asunto». */
  function cuantosDeUnaClase(clasif, libro, clase) {
    return clasif[libro].sin.filter(function (x) { return x.apunte.clase === clase; }).length;
  }

  /* Huecos de numeración: por año, libro y serie, los números que faltan entre el más bajo y el más alto subidos. */
  function huecos(apuntes) {
    var series = {};
    Object.keys(apuntes).forEach(function (k) {
      var a = apuntes[k];
      var id = a.ano + '|' + a.libro + '|' + a.serie;
      var s = series[id] = series[id] || { ano: a.ano, libro: a.libro, serie: a.serie, numeros: {}, min: Infinity, max: -Infinity };
      s.numeros[a.n] = true;
      if (a.n < s.min) s.min = a.n;
      if (a.n > s.max) s.max = a.n;
    });
    var salida = [];
    Object.keys(series).forEach(function (id) {
      var s = series[id], faltan = 0;
      for (var n = s.min; n <= s.max; n++) if (!s.numeros[n]) faltan++;
      if (faltan) salida.push({ ano: s.ano, libro: s.libro, serie: s.serie, faltan: faltan, desde: s.min, hasta: s.max });
    });
    return salida;
  }

  function cuatro(n) { return String(n).padStart(4, '0'); }

  function textoHueco(h) {
    return 'Faltan ' + h.faltan + (h.faltan === 1 ? ' número' : ' números') + ' de ' + (h.libro === 'E' ? 'entrada' : 'salida') +
      ' (serie ' + (h.serie === 'M' ? 'manual' : 'automática') + ') entre el ' + cuatro(h.desde) + ' y el ' + cuatro(h.hasta) +
      ': ¿el listado está completo?';
  }

  /* «En la aplicación y no en Séneca»: registros de los asuntos, de ese libro, cuyo número cae entre el más bajo y el
     más alto subidos de su serie, y que no están en el listado. [{ codigo, libro, asunto }] */
  function sobrantes(apuntes, asuntos) {
    var rango = {};
    Object.keys(apuntes).forEach(function (k) {
      var a = apuntes[k], id = a.ano + a.libro + a.serie;
      var r = rango[id] = rango[id] || { min: Infinity, max: -Infinity };
      if (a.n < r.min) r.min = a.n;
      if (a.n > r.max) r.max = a.n;
    });
    var vistos = {}, salida = [];
    asuntos.forEach(function (as) {
      as.registros.forEach(function (c) {
        var m = String(c).match(/^(\d{2})([ES])([MA])(\d+)$/);
        if (!m || apuntes[c] || vistos[c]) return;
        var r = rango['20' + m[1] + m[2] + m[3]];
        var n = parseInt(m[4], 10);
        if (!r || n < r.min || n > r.max) return;
        vistos[c] = true;
        salida.push({ codigo: c, libro: m[2], asunto: as });
      });
    });
    salida.sort(function (a, b) { return a.codigo < b.codigo ? 1 : -1; });
    return salida;
  }

  /* Para los avisos de Inicio. Sin la fecha «Revisar desde» no hay ningún aviso.
     { activo, sinAsunto, atrasados:[{libro, desde (aaaa-mm-dd de la última subida)}] }. */
  function resumenParaAvisos(estado, clasif, dias, hoy) {
    if (!estado.control.desde) return { activo: false, sinAsunto: 0, atrasados: [] };
    var limite = new Date((hoy || hoyIso()) + 'T00:00:00');
    limite.setDate(limite.getDate() - dias);
    var atrasados = [];
    ['E', 'S'].forEach(function (l) {
      var s = estado.control.subidas[l];
      var cuando = s && s.el ? String(s.el).slice(0, 10) : '';
      var mas = !cuando || new Date(cuando + 'T00:00:00') < limite;
      if (mas) atrasados.push({ libro: l, desde: cuando });
    });
    return { activo: true, sinAsunto: clasif.E.sin.length + clasif.S.sin.length, atrasados: atrasados };
  }

  function diasDeAviso() {
    var n = window.App && App.E && App.E.registro && App.E.registro.ajustesAvisos && App.E.registro.ajustesAvisos.diasRegistro;
    return (typeof n === 'number' && n > 0) ? n : DIAS_POR_DEFECTO;
  }

  return {
    DIAS_POR_DEFECTO: DIAS_POR_DEFECTO,
    hueso: hueso, fechaIso: fechaIso, fechaLarga: fechaLarga, hoyIso: hoyIso, codigoDeNumero: codigoDeNumero,
    leerCsv: leerCsv, cargar: cargar, ponerDesde: ponerDesde, cuantosQuitaria: cuantosQuitaria, desdeValida: desdeValida, subir: subir,
    decidir: decidir, quitarDecision: quitarDecision,
    ponerClaseSinAsunto: ponerClaseSinAsunto, quitarClaseSinAsunto: quitarClaseSinAsunto,
    contextoDeAsuntos: contextoDeAsuntos, clasificar: clasificar, cuantosDeUnaClase: cuantosDeUnaClase,
    huecos: huecos, textoHueco: textoHueco, sobrantes: sobrantes,
    resumenParaAvisos: resumenParaAvisos, diasDeAviso: diasDeAviso
  };
})();
window.ControlRegistro = ControlRegistro;
