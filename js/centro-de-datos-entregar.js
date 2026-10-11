/* ============================================================
   centro-de-datos-entregar.js — entregar listas del Gestor al Centro de
   datos (fila 328, docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md).

   El Gestor es el dueño de la lista de empresas (`empresas.csv`) y se la
   deja entera al Centro de datos para que cualquier otra aplicación la
   lea de allí. Es lo ÚNICO que el Gestor escribe en esa carpeta: un
   fichero, `entrada/ENTREGA <conjunto> gestor-asuntos-ies.json`.

   - Una tabla de listas (`LISTAS`): un dato nuevo es una línea; una lista
     nueva (Administraciones, cargos), otra entrada.
   - Se mira al entrar (después de `CentroDeDatos.traer`) y unos segundos
     después del último cambio de la lista (`Datos.alCambiarLista`).
   - Solo entrega el ordenador con la carpeta señalada y permiso de
     escribir, y solo si el índice dice que recibe ese conjunto
     (`recibe`). Sin eso, no hace nada ni avisa de nada.
   - Se entrega solo si la huella de los datos es distinta de la última
     apuntada (`entregado.<conjunto>` en `_GESTOR/centro-de-datos.json`,
     que comparten los dos ordenadores).
   - De tener empresas a no tener ninguna no se entrega sola.
   - Una entrega que sale bien no avisa de nada. Si falla, no se apunta
     nada, se dice una vez por sesión en ámbar y se reintenta al entrar.
   Lo que se ve, en js/centro-de-datos-ver.js (Ajustes › Este ordenador).
   ============================================================ */
var CentroDeDatosEntregar = (function () {

  var ORIGEN = 'gestor-asuntos-ies';
  var SUFIJO = ' ' + ORIGEN + '.json';
  var ESPERA_MS = 5000;
  var REINTENTOS_GUARDADO = 10;

  /* La tabla de listas que se entregan. Una lista sale de un CSV (cada dato, de la columna de su título) o de un JSON de
     `_GESTOR/datos` (`json`: la función que, con lo ya leído, da los registros). Un dato nuevo es una línea de `campos`. */
  var EMPRESAS = {
    conjunto: 'empresas', categoria: 'EMPRESAS', csv: 'empresas.csv',
    fichero: 'ENTREGA empresas ' + ORIGEN + '.json',
    titulo: 'Empresas', frase: 'las empresas', loEntrega: 'las', entregadas: 'Entregadas', listaDe: 'La lista de empresas', unidad: ['empresa', 'empresas'],
    campos: [
      { clave: 'razonSocial', etiqueta: 'Razón social', apartado: 'Empresa', tipo: 'texto', columna: 'Razón social' },
      { clave: 'nombreComercial', etiqueta: 'Nombre comercial', apartado: 'Empresa', tipo: 'texto', columna: 'Nombre comercial' },
      { clave: 'nif', etiqueta: 'NIF', apartado: 'Empresa', tipo: 'texto', columna: 'NIF' },
      { clave: 'contacto', etiqueta: 'Persona de contacto', apartado: 'Contacto', tipo: 'texto', columna: 'Contacto' },
      { clave: 'telefono', etiqueta: 'Teléfono', apartado: 'Contacto', tipo: 'texto', columna: 'Teléfono' },
      { clave: 'correo', etiqueta: 'Correo electrónico', apartado: 'Contacto', tipo: 'texto', columna: 'Correo' }
    ],
    /* El `id`: el NIF en mayúsculas y solo letras y cifras; sin NIF, `sin-nif-` y la razón social en minúsculas, sin
       tildes y con guiones. */
    idDe: function (datos) {
      var nif = String(datos.nif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (nif) return nif;
      var social = String(datos.razonSocial || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return 'sin-nif-' + social;
    }
  };

  var NOMBRES_ANTERIORES = [{ clave: 'nombre', etiqueta: 'Nombre' }, { clave: 'hasta', etiqueta: 'Hasta' }];
  var ADMINISTRACIONES = {
    conjunto: 'administraciones', categoria: 'ADMINISTRACIONES', archivo: 'administraciones.json',
    fichero: 'ENTREGA administraciones ' + ORIGEN + '.json',
    titulo: 'Administraciones', frase: 'las Administraciones', loEntrega: 'las', entregadas: 'Entregadas', listaDe: 'La lista de Administraciones', unidad: ['Administración', 'Administraciones'],
    campos: [
      { clave: 'clase', etiqueta: 'Clase', apartado: 'Administración', tipo: 'texto' },
      { clave: 'tercero', etiqueta: 'Nombre en el Gestor', apartado: 'Administración', tipo: 'texto' },
      { clave: 'nombreCorto', etiqueta: 'Nombre corto', apartado: 'Administración', tipo: 'texto' },
      { clave: 'nombreOficial', etiqueta: 'Nombre oficial', apartado: 'Administración', tipo: 'texto' },
      { clave: 'dir3', etiqueta: 'DIR3', apartado: 'Administración', tipo: 'texto' },
      { clave: 'codigoCentro', etiqueta: 'Código de centro', apartado: 'Administración', tipo: 'texto' },
      { clave: 'dependeDe', etiqueta: 'Depende de', apartado: 'Administración', tipo: 'texto' },
      { clave: 'dependeDeId', etiqueta: 'Depende de (identificador)', apartado: 'Administración', tipo: 'texto' },
      { clave: 'nombresAnteriores', etiqueta: 'Nombres anteriores', apartado: 'Administración', tipo: 'tabla', columnas: NOMBRES_ANTERIORES },
      { clave: 'dependeDeAnteriores', etiqueta: 'Nombres anteriores de «Depende de»', apartado: 'Administración', tipo: 'tabla', columnas: NOMBRES_ANTERIORES },
      { clave: 'correo', etiqueta: 'Correo electrónico', apartado: 'Contacto', tipo: 'texto' },
      { clave: 'telefono', etiqueta: 'Teléfono', apartado: 'Contacto', tipo: 'texto' },
      { clave: 'direccion', etiqueta: 'Dirección', apartado: 'Contacto', tipo: 'texto' },
      { clave: 'departamentos', etiqueta: 'Departamentos', apartado: 'Departamentos', tipo: 'tabla', columnas: [
        { clave: 'id', etiqueta: 'Identificador' }, { clave: 'nombre', etiqueta: 'Nombre' }, { clave: 'nivel', etiqueta: 'Nivel' },
        { clave: 'dependeDe', etiqueta: 'Depende de' }, { clave: 'correo', etiqueta: 'Correo electrónico' }, { clave: 'telefono', etiqueta: 'Teléfono' },
        { clave: 'contacto', etiqueta: 'Persona de contacto' }, { clave: 'dir3', etiqueta: 'DIR3' }] }
    ],
    /* Los registros los da quien conoce el árbol (js/administraciones.js). */
    json: function (leido) { return Administraciones.paraEntregar(leido); }
  };

  /* Los cargos: `cargos.json` está en `_GESTOR` (no en `_GESTOR/datos`); un registro por cargo y ocupante. Se cuenta por cargos
     distintos, y «vacía» es que ningún cargo tiene ocupante. */
  var CARGOS = {
    conjunto: 'cargos', categoria: 'CARGOS', archivo: 'cargos.json', enGestor: true,
    fichero: 'ENTREGA cargos ' + ORIGEN + '.json',
    titulo: 'Cargos', frase: 'los cargos', loEntrega: 'los', entregadas: 'Entregados', unidad: ['cargo', 'cargos'],
    textoVacia: 'Los cargos no tienen ningún ocupante y antes sí: no los he entregado.', botonVacia: 'Entregar de todos modos',
    campos: [
      { clave: 'cargo', etiqueta: 'Cargo (identificador)', apartado: 'Cargo', tipo: 'texto' },
      { clave: 'cargoNombre', etiqueta: 'Cargo', apartado: 'Cargo', tipo: 'texto' },
      { clave: 'tratamiento', etiqueta: 'Tratamiento', apartado: 'Cargo', tipo: 'texto' },
      { clave: 'orden', etiqueta: 'Orden', apartado: 'Cargo', tipo: 'numero' },
      { clave: 'persona', etiqueta: 'Persona', apartado: 'Ocupante', tipo: 'texto' },
      { clave: 'sexo', etiqueta: 'Sexo', apartado: 'Ocupante', tipo: 'texto' },
      { clave: 'desde', etiqueta: 'Desde', apartado: 'Ocupante', tipo: 'fecha' },
      { clave: 'hasta', etiqueta: 'Hasta', apartado: 'Ocupante', tipo: 'fecha' }
    ],
    json: function (leido) { return Cargos.paraEntregar(leido); },
    cuenta: function (registros) {
      var v = {};
      registros.forEach(function (r) { v[r.datos.cargo || r.datos.cargoNombre || ''] = true; });
      return Object.keys(v).length;
    },
    sinDatos: function (registros) { return !registros.some(function (r) { return r.datos.persona; }); }
  };
  var LISTAS = [EMPRESAS, ADMINISTRACIONES, CARGOS];

  function cuentaDe(lista, registros) { return lista.cuenta ? lista.cuenta(registros) : registros.length; }
  function sinDatosDe(lista, registros) { return lista.sinDatos ? lista.sinDatos(registros) : !registros.length; }
  function dirDe(lista) { return lista.enGestor ? gestor() : datosDir(); }

  var temporizador = null;
  var mirando = false;
  var avisadoFallo = {};
  var yaEntrado = false;
  var espera = ESPERA_MS;
  var ultimaVacia = {};   /* por lista: { t, v } */

  function norma(t) { return window.U && U.normalizar ? U.normalizar(t) : String(t || '').toLowerCase(); }
  function ms(v) { var t = new Date(v || '').getTime(); return isNaN(t) ? 0 : t; }
  function gestor() { return window.App && App.E && App.E.gestor; }
  function datosDir() { return window.App && App.E && App.E.datos; }
  function quien() { return (window.App && App.E && App.E.usuario) || ''; }

  function laLista(conjunto) { return LISTAS.filter(function (l) { return l.conjunto === conjunto; })[0] || null; }

  /* La hora de Madrid con su desfase: 2026-10-11T09:30:00+02:00. */
  function generadoMadrid(fecha) {
    var f = fecha || new Date();
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(f).forEach(function (x) { p[x.type] = x.value; });
    var comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    var desfase = Math.round((comoUtc - Math.floor(f.getTime() / 1000) * 1000) / 60000);
    var signo = desfase < 0 ? '-' : '+';
    var abs = Math.abs(desfase);
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute + ':' + p.second + signo + dos(Math.floor(abs / 60)) + ':' + dos(abs % 60);
  }

  /* El SHA-256 de un texto, o null si este navegador no tiene con qué hacerlo. */
  async function huellaDe(texto) {
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) return null;
    var h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
    return Array.prototype.map.call(h, function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  /* ---------- qué se entrega ---------- */

  function nombreDeFichero(lista) { return lista.csv || lista.archivo; }

  /* Lee la lista del fichero, en este momento, dentro de la cola de guardado de ese fichero. Devuelve
     { registros, campos, huella } o { sinFichero: true }. Un fichero que no se puede leer lanza. */
  function montar(lista) {
    return ColaGuardado.poner(nombreDeFichero(lista), async function () {
      var texto = await Carpetas.leerTexto(dirDe(lista), nombreDeFichero(lista));
      if (texto === null) return { sinFichero: true };
      if (lista.json) {   /* un JSON de `_GESTOR/datos`: los campos son todos los de la tabla */
        var leido;
        try { leido = JSON.parse(texto); } catch (e) { throw new Error('el fichero ' + lista.archivo + ' no se puede leer'); }
        return { registros: lista.json(leido), campos: lista.campos.map(campoDe) };
      }
      var t = Datos.aTabla(texto);
      var cab = (t.filas[0] || []).map(function (c) { return norma(String(c).trim()); });
      var columnas = lista.campos.map(function (c) { return { campo: c, i: cab.indexOf(norma(c.columna)) }; });
      var campos = lista.campos.filter(function (c, k) { return columnas[k].i !== -1; }).map(campoDe);
      var registros = [];
      t.filas.slice(1).forEach(function (fila) {
        var datos = {};
        columnas.forEach(function (c) {
          if (c.i === -1) return;
          var v = String(fila[c.i] === undefined ? '' : fila[c.i]).trim();
          if (v) datos[c.campo.clave] = v;
        });
        if (!datos[lista.campos[0].clave]) return;   /* sin su dato principal no es una fila */
        registros.push({ id: lista.idDe(datos), datos: datos });
      });
      return { registros: registros, campos: campos };
    }).then(async function (r) {
      if (r.sinFichero) return r;
      r.huella = await huellaDe(JSON.stringify({ campos: r.campos, registros: r.registros }));
      return r;
    });
  }

  function campoDe(c) {
    var campo = { clave: c.clave, etiqueta: c.etiqueta, apartado: c.apartado, tipo: c.tipo };
    if (c.columnas) campo.columnas = c.columnas;
    campo.dueno = ORIGEN;
    return campo;
  }

  function entregaDe(lista, m) {
    return { entrega: 1, conjunto: lista.conjunto, origen: ORIGEN, generado: generadoMadrid(), hechoCon: [], campos: m.campos, registros: m.registros };
  }

  /* ---------- escribir (la única puerta) ---------- */

  /* Solo escribe en `entrada/` un fichero `ENTREGA … gestor-asuntos-ies.json`. No crea `entrada/`. */
  async function escribirEntrega(dir, nombre, texto) {
    if (nombre.indexOf('ENTREGA ') !== 0 || nombre.slice(-SUFIJO.length) !== SUFIJO || /[\/\\]/.test(nombre)) {
      throw new Error('este nombre de fichero no es una entrega del Gestor');
    }
    var entrada;
    try { entrada = await dir.getDirectoryHandle('entrada'); }
    catch (e) { throw new Error('la carpeta del Centro de datos no tiene «entrada»'); }
    await Carpetas.escribirTexto(entrada, nombre, texto);
  }

  /* ---------- cuándo y si se entrega ---------- */

  function recibeEl(indice, lista) {
    return ((indice && indice.recibe) || []).some(function (r) { return r && r.conjunto === lista.conjunto && r.de === ORIGEN && Number(r.entrega) === 1; });
  }

  /* Lo que se sabe de la carpeta, UNA vez para todas las listas y sin pedir nada: { estado, dir?, indice? }.
     `estado`: 'ok' o el motivo. */
  async function leerCarpeta() {
    var C = window.CentroDeDatos;
    if (!C) return { estado: 'sin-carpeta' };
    var dir = await C.carpeta();
    if (!dir) return { estado: 'sin-carpeta' };
    if (!(await C.permiso(dir, false))) return { estado: 'sin-permiso-leer', dir: dir };
    var r = await C.leerIndice(dir);
    if (!r.ok) return { estado: 'sin-indice', dir: dir };
    if ((r.indice.contrato || 1) > C.CONTRATO) return { estado: 'contrato', dir: dir, indice: r.indice };
    if (r.indice.ocupado) return { estado: 'ocupado', dir: dir, indice: r.indice };
    return { estado: 'ok', dir: dir, indice: r.indice, puedeEscribir: await C.permisoEscribir(dir, false) };
  }

  /* El estado de la carpeta para UNA lista: lo de `leerCarpeta` más si el índice la recibe y si se puede escribir. */
  function paraLista(base, lista) {
    if (base.estado !== 'ok') return base;
    if (!recibeEl(base.indice, lista)) return { estado: 'no-recibe', dir: base.dir, indice: base.indice };
    if (!base.puedeEscribir) return { estado: 'sin-permiso-escribir', dir: base.dir, indice: base.indice };
    return base;
  }

  function mirarCarpeta(lista) { return leerCarpeta().then(function (b) { return paraLista(b, lista); }); }

  /* ¿Lo último entregado de esa lista tenía datos? (Los apuntes de antes de la fila 330 no lo dicen: se mira por los registros.) */
  function tuvoDatos(previo) { return !!previo && (previo.conDatos !== undefined ? !!previo.conDatos : previo.registros > 0); }

  function sinGuardado() { return !(window.ColaGuardado && ColaGuardado.hayGuardado()); }

  /* Entrega una lista si hace falta. `base`: lo de `leerCarpeta` (si no, se lee). `op.vacia`: entregar aunque ahora esté
     vacía y antes no (`true`, o el conjunto al que se refiere). Devuelve { estado, registros? }: 'entregado', 'nada-nuevo', 'vacia', o el motivo por el que no se hizo. */
  async function entregarLista(lista, op, base) {
    op = op || {};
    if (window.SoloConsulta && SoloConsulta.activo()) return { estado: 'solo-consulta' };
    if (!datosDir() || !gestor()) return { estado: 'sin-datos' };
    var c = paraLista(base || await leerCarpeta(), lista);
    if (c.estado !== 'ok') return { estado: c.estado };
    ultimaVacia[lista.conjunto] = { t: 0, v: false };
    var m = await montar(lista);
    if (m.sinFichero) return { estado: 'sin-fichero' };
    if (!m.huella) return { estado: 'sin-huella' };
    var apuntes = await CentroDeDatos.leerApuntes(true);
    var previo = apuntes.entregado && apuntes.entregado[lista.conjunto];
    if (previo && previo.huellaDatos === m.huella) return { estado: 'nada-nuevo', registros: m.registros.length };
    if (sinDatosDe(lista, m.registros) && tuvoDatos(previo) && !(op.vacia === true || op.vacia === lista.conjunto)) return { estado: 'vacia' };
    var entrega = entregaDe(lista, m);
    await escribirEntrega(c.dir, lista.fichero, JSON.stringify(entrega));
    await CentroDeDatos.apuntarEntregado(lista.conjunto, {
      huellaDatos: m.huella, registros: m.registros.length, cuenta: cuentaDe(lista, m.registros), conDatos: !sinDatosDe(lista, m.registros),
      generado: entrega.generado, entregadoEl: new Date().toISOString(), entregadoPor: quien()
    });
    if (window.CentroDeDatosVer) CentroDeDatosVer.pintar();
    return { estado: 'entregado', registros: m.registros.length, cuenta: cuentaDe(lista, m.registros) };
  }

  /* Mira todas las listas, cada una por separado y con el índice leído una sola vez. Con un guardado en marcha espera
     (hasta 10 veces); si una falla, lo dice una vez por sesión y las demás siguen. */
  async function mirar(op, intento) {
    if (mirando) return { estado: 'ya-mirando' };
    if (!sinGuardado()) {
      if ((intento || 0) < REINTENTOS_GUARDADO) { setTimeout(function () { mirar(op, (intento || 0) + 1); }, 1500); }
      return { estado: 'guardando' };
    }
    mirando = true;
    var salida = { estado: 'nada-nuevo', listas: {} };
    try {
      var base = null;
      try { base = await leerCarpeta(); } catch (e) { base = { estado: 'sin-indice' }; }
      for (var i = 0; i < LISTAS.length; i++) {
        var l = LISTAS[i];
        try { salida.listas[l.conjunto] = await entregarLista(l, op, base); }
        catch (e) {
          salida.listas[l.conjunto] = { estado: 'error' };
          if (!avisadoFallo[l.conjunto]) { avisadoFallo[l.conjunto] = true; U.accesorio('No he podido entregar la lista de ' + l.titulo.toLowerCase() + ' al Centro de datos', e); }
        }
      }
    } finally { mirando = false; }
    return salida;
  }

  /* Al entrar: una vez por sesión, después de traer. */
  function alEntrar() {
    if (yaEntrado) return;
    yaEntrado = true;
    mirar({}).catch(function () { /* a la siguiente entrada */ });
  }

  /* Unos segundos después del último cambio de una lista: varios cambios seguidos dan una sola pasada. */
  function programar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { temporizador = null; mirar({}).catch(function () { /* a la siguiente */ }); }, espera);
  }

  if (window.Datos && Datos.alCambiarLista) {
    Datos.alCambiarLista.push(function (categoria) {
      if (LISTAS.some(function (l) { return l.categoria === categoria; })) programar();
    });
  }

  var FRASES_DE_ESTADO = {
    'vacia': function (l) { return l.textoVacia || (l.listaDe + ' está vacía y antes no lo estaba: no la he entregado.'); },
    'sin-carpeta': function () { return 'Primero señala la carpeta del Centro de datos en este ordenador.'; },
    'sin-permiso-leer': function () { return 'El navegador no da permiso a la carpeta del Centro de datos.'; },
    'sin-permiso-escribir': function () { return 'Falta el permiso para escribir en la carpeta del Centro de datos.'; },
    'no-recibe': function (l) { return 'El Centro de datos todavía no recibe ' + l.frase + '.'; },
    'sin-fichero': function (l) { return 'Todavía no hay lista de ' + l.titulo.toLowerCase() + ' que entregar.'; },
    'sin-huella': function () { return 'Este navegador no puede preparar la entrega.'; },
    'solo-consulta': function () { return 'En este ordenador solo se puede consultar: no se entrega nada.'; }
  };

  /* El botón «Entregar ahora»: lo mismo que al entrar, pero contesta siempre, con una frase por lista. Devuelve
     { estado, registros, listas }: `estado` y `registros` son los de la primera lista entregada o, si ninguna, la primera
     que no estaba al día. */
  async function entregarAhora(op) {
    var base = null;
    try { base = await leerCarpeta(); } catch (e) { base = { estado: 'sin-indice' }; }
    var listas = {};
    for (var i = 0; i < LISTAS.length; i++) {
      var l = LISTAS[i];
      try { listas[l.conjunto] = await entregarLista(l, op, base); }
      catch (e) { U.accesorio('No he podido entregar la lista de ' + l.titulo.toLowerCase() + ' al Centro de datos', e); listas[l.conjunto] = { estado: 'error' }; }
    }
    var estados = LISTAS.map(function (l) { return listas[l.conjunto]; });
    var entregadas = LISTAS.filter(function (l) { return listas[l.conjunto].estado === 'entregado'; });
    var frases = [];
    if (entregadas.length) {
      LISTAS.forEach(function (l) {
        var r = listas[l.conjunto];
        if (r.estado === 'entregado') frases.push(l.entregadas + ' ' + r.cuenta + ' ' + l.unidad[r.cuenta === 1 ? 0 : 1] + '.');
        else if (r.estado === 'nada-nuevo') frases.push('No hay nada nuevo de ' + l.frase + '.');
      });
    } else if (estados.every(function (r) { return r.estado === 'nada-nuevo'; })) frases.push('No hay nada nuevo que entregar.');
    else {
      LISTAS.forEach(function (l) {
        var r = listas[l.conjunto];
        var f = FRASES_DE_ESTADO[r.estado];
        if (f) frases.push(f(l)); else if (r.estado === 'nada-nuevo') frases.push('No hay nada nuevo de ' + l.frase + '.');
      });
    }
    var buena = entregadas.length > 0 || estados.every(function (r) { return r.estado === 'nada-nuevo'; });
    if (frases.length) U.aviso(frases.join(' '), buena ? 'bueno' : 'ambar');
    var primera = entregadas[0] || LISTAS.filter(function (l) { return listas[l.conjunto].estado !== 'nada-nuevo'; })[0] || LISTAS[0];
    return { estado: listas[primera.conjunto].estado, registros: listas[primera.conjunto].registros, cuenta: listas[primera.conjunto].cuenta, listas: listas };
  }

  /* ---------- lo que se ve en Ajustes ---------- */

  /* { texto, boton? } con lo que hay que decir de UNA lista, o null si no hay nada que decir. `boton`: 'permiso' |
     'vacia'. Solo mira: nunca pide permiso. `base`: lo de `leerCarpeta`. */
  async function estadoDeLista(lista, base, apuntes) {
    var previo = apuntes.entregado && apuntes.entregado[lista.conjunto];
    var fecha = previo ? CentroDeDatos.fechaCorta(previo.entregadoEl, true) : '';
    var c = paraLista(base, lista);
    if (c.estado === 'sin-carpeta') {
      return previo ? { texto: lista.frase.charAt(0).toUpperCase() + lista.frase.slice(1) + ' ' + lista.loEntrega + ' entrega el otro ordenador. Última entrega: ' + cuentaPrevia(previo) + ', el ' + fecha + '.' } : null;
    }
    if (c.estado === 'no-recibe') return { texto: 'El Centro de datos todavía no recibe ' + lista.frase + '.' };
    if (c.estado === 'sin-permiso-escribir') return { texto: 'Falta el permiso para escribir en esta carpeta: ' + lista.frase + ' no se entregan.', boton: 'permiso' };
    if (c.estado !== 'ok') return null;
    if (!(await huellaDe('x'))) return { texto: 'Este navegador no puede preparar la entrega de ' + lista.frase + '.' };
    var vacia = false;
    if (tuvoDatos(previo)) {   /* se repinta a menudo: lo caro (leer el fichero) se mira como mucho cada 15 s */
      var u = ultimaVacia[lista.conjunto] || { t: 0, v: false };
      if (Date.now() - u.t < 15000) vacia = u.v;
      else {
        try {
          var m = await montar(lista);
          vacia = !m.sinFichero && sinDatosDe(lista, m.registros) && previo.huellaDatos !== m.huella;
        } catch (e) { vacia = false; }
        ultimaVacia[lista.conjunto] = { t: Date.now(), v: vacia };
      }
    }
    if (vacia) return { texto: lista.textoVacia || (lista.listaDe + ' está vacía y antes no lo estaba: no la he entregado.'), boton: 'vacia' };
    if (!previo) return { texto: 'Todavía no se han entregado ' + lista.frase + ' al Centro de datos.' };
    return { texto: lista.titulo + ' ' + lista.entregadas.toLowerCase() + ' al Centro de datos: ' + cuentaPrevia(previo) + ', el ' + fecha + (previo.entregadoPor ? ' (' + previo.entregadoPor + ')' : '') + '.' };
  }

  function cuentaPrevia(previo) { return previo.cuenta !== undefined ? previo.cuenta : previo.registros; }

  /* Una por lista: { <conjunto>: { texto, boton? } | null }. */
  async function estadosParaAjustes() {
    var base = await leerCarpeta();
    var apuntes = await CentroDeDatos.leerApuntes();
    var salida = {};
    for (var i = 0; i < LISTAS.length; i++) salida[LISTAS[i].conjunto] = await estadoDeLista(LISTAS[i], base, apuntes);
    return salida;
  }

  async function estadoParaAjustes(conjunto) { return (await estadosParaAjustes())[conjunto || 'empresas']; }

  /* Para la «Comprobación al entrar»: las listas que el índice recibe y no se pueden entregar por falta del permiso de
     escribir (sin pedirlo). Devuelve sus frases: «las empresas», «las Administraciones». */
  async function listasSinPermisoDeEscribir() {
    try {
      var base = await leerCarpeta();
      return LISTAS.filter(function (l) { return paraLista(base, l).estado === 'sin-permiso-escribir'; }).map(function (l) { return l.frase; });
    } catch (e) { return []; }
  }
  async function faltaPermisoDeEscribir() { return (await listasSinPermisoDeEscribir()).length > 0; }

  return {
    LISTAS: LISTAS, entregarLista: entregarLista, mirar: mirar, alEntrar: alEntrar, entregarAhora: entregarAhora,
    estadosParaAjustes: estadosParaAjustes, estadoParaAjustes: estadoParaAjustes, faltaPermisoDeEscribir: faltaPermisoDeEscribir,
    listasSinPermisoDeEscribir: listasSinPermisoDeEscribir, generadoMadrid: generadoMadrid,
    _montar: function (conjunto) { return montar(laLista(conjunto || 'empresas')); },
    _reiniciarEntrada: function () { yaEntrado = false; },   /* para las pruebas */
    _ajustar: function (o) { if (o && o.espera !== undefined) espera = o.espera; }   /* para las pruebas */
  };
})();
window.CentroDeDatosEntregar = CentroDeDatosEntregar;
