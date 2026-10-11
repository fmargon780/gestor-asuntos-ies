/* ============================================================
   base.js — las tablas para estadísticas y cruces: guardar y leer los
   apuntes (fila 334, docs/DATOS-2-TABLAS-PARA-INFORMES.md).

   Todo vive en `_GESTOR/base/` (siempre por `App.E.gestor`):
     base/<curso>/<AAAA-MM>-<ordenador>.jsonl   un fichero por curso, mes y ordenador
     base/personas-<ordenador>.jsonl            el diccionario de códigos y las equivalencias
     base/poniendo-al-dia-<ordenador>.json      la pasada completa en marcha
   Texto, una línea por apunte (un JSON entero sin saltos). Cada ordenador
   escribe solo sus ficheros y solo añadiendo líneas al final: no hay copias
   en conflicto. Es un duplicado que se rehace entero desde las carpetas: no
   entra en las copias de seguridad ni en la fusión.

   Tres clases de línea:
     { v, que: 'alta',     cuando, ordenador, clave, marca, asunto, hitos, personas, documentos }
     { v, que: 'baja',     cuando, ordenador, clave }
     { v, que: 'equivale', cuando, ordenador, de, a }
   Al leer gana la línea más reciente de cada `clave`; una `baja` más reciente
   que su `alta` la quita; una línea rota se salta.

   Las filas y el código de cada persona están en `js/base-filas.js`; poner al
   día lo archivado, en `js/base-poner-al-dia.js`; la tarjeta, en
   `js/base-pantalla.js`. Nadie lo usa todavía en pantalla: lo usarán los
   informes (para una estadística de lo archivado se usa `Base.leer`, no se
   abre carpeta por carpeta).
   ============================================================ */
var Base = (function () {

  var CARPETA = 'base';
  var V = 1;
  var CINCO_SEGUNDOS = 5000;

  var claves = {};          /* claves avisadas, a la espera de los cinco segundos */
  var temporizador = null;
  var equivalencias = [];   /* líneas `equivale` por escribir */

  function gestor() { return window.App && App.E && App.E.gestor; }
  function ordenador() { return (window.U && U.ordenador) ? U.ordenador() : 'sin-ordenador'; }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function mesActual() { return U.hoyIso().slice(0, 7); }
  function ahora() { return new Date().toISOString(); }
  function cursoDe(clave) { return IndiceArchivo._cursoDeNombre(clave); }

  /* ---------- las carpetas ---------- */

  async function carpetaBase(crear) {
    var g = gestor();
    if (!g) return null;
    try { return await g.getDirectoryHandle(CARPETA, { create: !!crear }); } catch (e) { return null; }
  }

  async function carpetaCurso(curso, crear) {
    var b = await carpetaBase(crear);
    if (!b) return null;
    try { return await b.getDirectoryHandle(curso, { create: !!crear }); } catch (e) { return null; }
  }

  /* ---------- escribir (siempre añadiendo al final, en la cola de ese fichero) ---------- */

  async function anadirTexto(dir, nombre, lineas) {
    var previo = (await Carpetas.leerTexto(dir, nombre)) || '';
    if (previo && previo.charAt(previo.length - 1) !== '\n') previo += '\n';
    await Carpetas.escribirTexto(dir, nombre, previo + lineas.join('\n') + '\n');
  }

  function enCola(clave, fn) { return window.ColaGuardado ? ColaGuardado.poner(clave, fn) : fn(); }

  /* `porCurso`: { '2026-27': [líneas, …] }. Añade al fichero del mes de ESTE ordenador. */
  async function escribir(porCurso) {
    if (soloConsulta()) return false;
    var nombre = mesActual() + '-' + ordenador() + '.jsonl';
    var cursos = Object.keys(porCurso);
    for (var i = 0; i < cursos.length; i++) {
      var curso = cursos[i];
      var lineas = porCurso[curso].map(function (l) { return JSON.stringify(l); });
      if (!lineas.length) continue;
      await enCola('base/' + curso + '/' + nombre, async function () {
        var dir = await carpetaCurso(curso, true);
        if (!dir) throw new Error('sin-carpeta-base');
        await anadirTexto(dir, nombre, lineas);
      });
    }
    return true;
  }

  async function escribirPersonas(lineas) {
    if (soloConsulta() || !lineas.length) return false;
    var nombre = 'personas-' + ordenador() + '.jsonl';
    await enCola('base/' + nombre, async function () {
      var dir = await carpetaBase(true);
      if (!dir) throw new Error('sin-carpeta-base');
      await anadirTexto(dir, nombre, lineas.map(function (l) { return JSON.stringify(l); }));
    });
    return true;
  }

  function lineaAlta(clave, marca, filas) {
    return { v: V, que: 'alta', cuando: ahora(), ordenador: ordenador(), clave: clave, marca: marca,
      asunto: filas.asunto, hitos: filas.hitos, personas: filas.personas, documentos: filas.documentos };
  }
  function lineaBaja(clave) { return { v: V, que: 'baja', cuando: ahora(), ordenador: ordenador(), clave: clave }; }
  function lineaEquivale(de, a) { return { v: V, que: 'equivale', cuando: ahora(), ordenador: ordenador(), de: de, a: a }; }

  /* ---------- leer ---------- */

  async function leerLineas(dir, nombre) {
    var texto;
    try { texto = await Carpetas.leerTexto(dir, nombre); } catch (e) { return []; }
    if (!texto) return [];
    var salida = [];
    texto.split('\n').forEach(function (t) {
      if (!t) return;
      try { var o = JSON.parse(t); if (o && typeof o === 'object') salida.push(o); } catch (e) { /* línea rota: se salta */ }
    });
    return salida;
  }

  function esJsonl(nombre) { return /\.jsonl$/i.test(nombre); }

  /* Lo apuntado: { porClave: clave -> línea más reciente (alta o baja), equivale: viejo -> nuevo, gente: codigo -> {…} }.
     `cursos`: una lista, o sin ella todos los que haya. */
  async function cargar(cursos) {
    var porClave = {}, equivale = {}, gente = {};
    var b = await carpetaBase(false);
    if (!b) return { porClave: porClave, equivale: equivale, gente: gente };
    var contenido = await Carpetas.contenido(b);

    function lineaNueva(l) {
      if (l.que === 'equivale') { if (l.de && l.a) equivale[l.de] = l.a; return; }
      if (l.que === 'persona' || (l.codigo && l.nombre !== undefined)) {
        var previa = gente[l.codigo];
        if (!previa || String(l.cuando || '') >= String(previa.cuando || '')) gente[l.codigo] = { categoria: l.categoria, nombre: l.nombre, clase: l.clase, cuando: l.cuando };
        return;
      }
      if (!l.clave || (l.que !== 'alta' && l.que !== 'baja')) return;
      var p = porClave[l.clave];
      if (!p || String(l.cuando || '') >= String(p.cuando || '')) porClave[l.clave] = l;
    }

    for (var i = 0; i < contenido.ficheros.length; i++) {
      var f = contenido.ficheros[i];
      if (!esJsonl(f.nombre)) continue;
      (await leerLineas(b, f.nombre)).forEach(lineaNueva);
    }
    for (var j = 0; j < contenido.carpetas.length; j++) {
      var c = contenido.carpetas[j];
      if (cursos && cursos !== 'todos' && cursos.indexOf(c.nombre) === -1) continue;
      var dentro = await Carpetas.contenido(c.handle);
      for (var k = 0; k < dentro.ficheros.length; k++) {
        if (!esJsonl(dentro.ficheros[k].nombre)) continue;
        (await leerLineas(c.handle, dentro.ficheros[k].nombre)).forEach(lineaNueva);
      }
    }
    return { porClave: porClave, equivale: equivale, gente: gente };
  }

  function nuevoCodigo(codigo, equivale) {
    var n = 0;
    while (equivale[codigo] && n++ < 10) codigo = equivale[codigo];
    return codigo;
  }

  /* { asuntos, hitos, personas, documentos, gente }: cuatro listas planas y el diccionario de códigos. */
  async function leer(opciones) {
    opciones = opciones || {};
    var apuntado = await cargar(opciones.cursos || 'todos');
    var salida = { asuntos: [], hitos: [], personas: [], documentos: [], gente: {} };
    var gente = apuntado.gente;
    Object.keys(apuntado.porClave).sort().forEach(function (clave) {
      var l = apuntado.porClave[clave];
      if (l.que !== 'alta') return;
      if (Array.isArray(opciones.cursos) && opciones.cursos.indexOf(l.asunto && l.asunto.curso) === -1 && opciones.cursos.indexOf(cursoDe(clave)) === -1) return;
      salida.asuntos.push(l.asunto);
      (l.hitos || []).forEach(function (h) { salida.hitos.push(h); });
      (l.personas || []).forEach(function (p) { salida.personas.push(p); });
      (l.documentos || []).forEach(function (d) { salida.documentos.push(d); });
    });
    /* Los códigos viejos pasan al nuevo en todas las filas. */
    salida.asuntos.forEach(function (a) { if (a.persona) a.persona = nuevoCodigo(a.persona, apuntado.equivale); });
    salida.personas.forEach(function (p) { p.codigo = nuevoCodigo(p.codigo, apuntado.equivale); });
    Object.keys(gente).forEach(function (c) { salida.gente[nuevoCodigo(c, apuntado.equivale)] = gente[c]; });

    if (opciones.conAbiertos) {
      var reg = (window.App && App.E && App.E.registro && App.E.registro.asuntos) || {};
      var datosHitos = null;
      try { datosHitos = window.Hitos ? await Hitos.leer() : null; } catch (e) { /* sin hitos */ }
      (App.E.listaAbiertos || []).forEach(function (a) {
        var ficha = reg[a.nombre] || a.ficha || {};
        var hitos = datosHitos && datosHitos.porAsunto && datosHitos.porAsunto[a.nombre] ? datosHitos.porAsunto[a.nombre].hitos : [];
        var f = BaseFilas.filasDe(ficha, hitos, entradaDeAbierto(a.nombre, ficha));
        f.asunto.abierto = true;
        salida.asuntos.push(f.asunto);
        f.hitos.forEach(function (h) { salida.hitos.push(h); });
        f.personas.forEach(function (p) { salida.personas.push(p); });
        f.documentos.forEach(function (d) { salida.documentos.push(d); });
        Object.keys(f.gente).forEach(function (c) { if (!salida.gente[c]) salida.gente[c] = f.gente[c]; });
      });
    }
    return salida;
  }

  /* La entrada que haría el índice del ARCHIVO, montada con lo que hay en memoria de un asunto abierto. */
  function entradaDeAbierto(nombre, ficha) {
    var leido = (window.Nombres && App.E.tipos) ? Nombres.leer(nombre, App.E.tipos) : {};
    var cg = (window.Nombres && leido.resto !== undefined) ? Nombres.cursoYGrupoDeResto(leido.resto) : {};
    return {
      nombre: nombre, categoria: ficha.categoria || '', tercero: ficha.tercero || '', tipo: leido.tipo || ficha.tipo || '',
      curso: cg.curso || ficha.curso || '', grupo: cg.grupo || '', numero: ficha.numero || leido.numero || '',
      documentos: [], relacionados: ficha.relacionados || []
    };
  }

  /* ---------- avisar de que algo cambió (suelto: nunca hace esperar ni fallar a quien archiva) ---------- */

  function avisar(clave) {
    try {
      if (!clave) return;
      claves[clave] = true;
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        temporizador = null;
        var lista = Object.keys(claves);
        claves = {};
        try { if (window.BasePonerAlDia && lista.length) BasePonerAlDia.ponerAlDia({ claves: lista }).catch(function () {}); } catch (e) { /* nada */ }
      }, CINCO_SEGUNDOS);
    } catch (e) { /* nada */ }
  }

  /* El tercero cambió de nombre: su código nuevo equivale al viejo, y sus asuntos se vuelven a apuntar. */
  function avisarTercero(categoria, viejo, nuevo, clavesTocadas) {
    try {
      var de = BaseFilas.codigoDe(categoria, viejo), a = BaseFilas.codigoDe(categoria, nuevo);
      if (de !== a) {
        var cv = BaseFilas.claseYValor(categoria, nuevo);
        escribirPersonas([lineaEquivale(de, a),
          { v: V, cuando: ahora(), codigo: a, categoria: String(categoria || ''), nombre: String(nuevo), clase: cv.clase }]).catch(function () {});
      }
      (clavesTocadas || []).forEach(avisar);
    } catch (e) { /* nada */ }
  }

  return {
    CARPETA: CARPETA, V: V,
    escribir: escribir, escribirPersonas: escribirPersonas, cargar: cargar, leer: leer,
    lineaAlta: lineaAlta, lineaBaja: lineaBaja, lineaEquivale: lineaEquivale,
    avisar: avisar, avisarTercero: avisarTercero, entradaDeAbierto: entradaDeAbierto,
    carpetaBase: carpetaBase, soloConsulta: soloConsulta, ordenador: ordenador,
    codigoDe: function (c, n) { return BaseFilas.codigoDe(c, n); },
    filasDe: function (f, h, e, o) { return BaseFilas.filasDe(f, h, e, o); },
    _cursoDe: cursoDe
  };
})();
window.Base = Base;
