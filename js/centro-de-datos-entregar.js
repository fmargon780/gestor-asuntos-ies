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

  var EMPRESAS = {
    conjunto: 'empresas', categoria: 'EMPRESAS', csv: 'empresas.csv', nombre: 'empresas',
    fichero: 'ENTREGA empresas ' + ORIGEN + '.json',
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
      var social = String(datos.razonSocial || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return 'sin-nif-' + social;
    }
  };
  var LISTAS = [EMPRESAS];

  var temporizador = null;
  var mirando = false;
  var avisadoFallo = {};
  var yaEntrado = false;
  var espera = ESPERA_MS;
  var ultimaVacia = { t: 0, v: false };

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

  /* Lee la lista del fichero, en este momento, dentro de la cola de guardado de su CSV. Devuelve
     { registros, campos, texto, huella } o { sinFichero: true }. Un fichero que no se puede leer lanza. */
  function montar(lista) {
    return ColaGuardado.poner(lista.csv, async function () {
      var texto = await Carpetas.leerTexto(datosDir(), lista.csv);
      if (texto === null) return { sinFichero: true };
      var t = Datos.aTabla(texto);
      var cab = (t.filas[0] || []).map(function (c) { return norma(String(c).trim()); });
      var columnas = lista.campos.map(function (c) { return { campo: c, i: cab.indexOf(norma(c.columna)) }; });
      var campos = lista.campos.filter(function (c, k) { return columnas[k].i !== -1; }).map(function (c) {
        return { clave: c.clave, etiqueta: c.etiqueta, apartado: c.apartado, tipo: c.tipo, dueno: ORIGEN };
      });
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

  /* Lo que hay que saber de la carpeta, sin pedir nada: { estado, dir?, indice? }. `estado`: 'ok' o el motivo. */
  async function mirarCarpeta(lista) {
    var C = window.CentroDeDatos;
    if (!C) return { estado: 'sin-carpeta' };
    var dir = await C.carpeta();
    if (!dir) return { estado: 'sin-carpeta' };
    if (!(await C.permiso(dir, false))) return { estado: 'sin-permiso-leer', dir: dir };
    var r = await C.leerIndice(dir);
    if (!r.ok) return { estado: 'sin-indice', dir: dir };
    if ((r.indice.contrato || 1) > C.CONTRATO) return { estado: 'contrato', dir: dir, indice: r.indice };
    if (r.indice.ocupado) return { estado: 'ocupado', dir: dir, indice: r.indice };
    if (!recibeEl(r.indice, lista)) return { estado: 'no-recibe', dir: dir, indice: r.indice };
    if (!(await C.permisoEscribir(dir, false))) return { estado: 'sin-permiso-escribir', dir: dir, indice: r.indice };
    return { estado: 'ok', dir: dir, indice: r.indice };
  }

  function sinGuardado() { return !(window.ColaGuardado && ColaGuardado.hayGuardado()); }

  /* Entrega una lista si hace falta. `op.vacia`: entregar aunque ahora esté vacía y antes no. Devuelve
     { estado, registros? }: 'entregado', 'nada-nuevo', 'vacia', o el motivo por el que no se hizo. */
  async function entregarLista(lista, op) {
    op = op || {};
    if (window.SoloConsulta && SoloConsulta.activo()) return { estado: 'solo-consulta' };
    if (!datosDir() || !gestor()) return { estado: 'sin-datos' };
    var c = await mirarCarpeta(lista);
    if (c.estado !== 'ok') return { estado: c.estado };
    ultimaVacia = { t: 0, v: false };
    var m = await montar(lista);
    if (m.sinFichero) return { estado: 'sin-fichero' };
    if (!m.huella) return { estado: 'sin-huella' };
    var apuntes = await CentroDeDatos.leerApuntes(true);
    var previo = apuntes.entregado && apuntes.entregado[lista.conjunto];
    if (previo && previo.huellaDatos === m.huella) return { estado: 'nada-nuevo', registros: m.registros.length };
    if (!m.registros.length && previo && previo.registros > 0 && !op.vacia) return { estado: 'vacia' };
    var entrega = entregaDe(lista, m);
    await escribirEntrega(c.dir, lista.fichero, JSON.stringify(entrega));
    await CentroDeDatos.apuntarEntregado(lista.conjunto, {
      huellaDatos: m.huella, registros: m.registros.length, generado: entrega.generado, entregadoEl: new Date().toISOString(), entregadoPor: quien()
    });
    if (window.CentroDeDatosVer) CentroDeDatosVer.pintar();
    return { estado: 'entregado', registros: m.registros.length };
  }

  /* Mira todas las listas. Con un guardado en marcha espera (hasta 10 veces); si falla, lo dice una vez por sesión. */
  async function mirar(op, intento) {
    if (mirando) return { estado: 'ya-mirando' };
    if (!sinGuardado()) {
      if ((intento || 0) < REINTENTOS_GUARDADO) { setTimeout(function () { mirar(op, (intento || 0) + 1); }, 1500); }
      return { estado: 'guardando' };
    }
    mirando = true;
    var salida = { estado: 'nada-nuevo', listas: {} };
    try {
      for (var i = 0; i < LISTAS.length; i++) {
        var l = LISTAS[i];
        try { salida.listas[l.conjunto] = await entregarLista(l, op); }
        catch (e) {
          salida.listas[l.conjunto] = { estado: 'error' };
          if (!avisadoFallo[l.conjunto]) { avisadoFallo[l.conjunto] = true; U.accesorio('No he podido entregar la lista de ' + l.nombre + ' al Centro de datos', e); }
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

  /* Unos segundos después del último cambio de la lista: tres cambios seguidos dan una sola entrega. */
  function programar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { temporizador = null; mirar({}).catch(function () { /* a la siguiente */ }); }, espera);
  }

  if (window.Datos && Datos.alCambiarLista) {
    Datos.alCambiarLista.push(function (categoria) {
      if (LISTAS.some(function (l) { return l.categoria === categoria; })) programar();
    });
  }

  /* El botón «Entregar ahora»: lo mismo que al entrar, pero contesta siempre. */
  async function entregarAhora(op) {
    var l = EMPRESAS;
    var r;
    try { r = await entregarLista(l, op); }
    catch (e) { U.accesorio('No he podido entregar la lista de ' + l.nombre + ' al Centro de datos', e); return { estado: 'error' }; }
    var frase = {
      'entregado': 'Entregadas ' + r.registros + (r.registros === 1 ? ' empresa' : ' empresas') + ' al Centro de datos.',
      'nada-nuevo': 'No hay nada nuevo que entregar.',
      'vacia': 'La lista de empresas está vacía y antes no lo estaba: no la he entregado.',
      'sin-carpeta': 'Primero señala la carpeta del Centro de datos en este ordenador.',
      'sin-permiso-leer': 'El navegador no da permiso a la carpeta del Centro de datos.',
      'sin-permiso-escribir': 'Falta el permiso para escribir en la carpeta del Centro de datos.',
      'no-recibe': 'El Centro de datos todavía no recibe las empresas.',
      'sin-fichero': 'Todavía no hay lista de empresas que entregar.',
      'sin-huella': 'Este navegador no puede preparar la entrega.',
      'solo-consulta': 'En este ordenador solo se puede consultar: no se entrega nada.'
    }[r.estado];
    if (frase) U.aviso(frase, r.estado === 'entregado' || r.estado === 'nada-nuevo' ? 'bueno' : 'ambar');
    return r;
  }

  /* ---------- lo que se ve en Ajustes ---------- */

  /* { texto, boton? } con lo que hay que decir de las empresas, o null si no hay nada que decir. `boton`: 'permiso' | 'vacia'.
     Solo mira: nunca pide permiso. */
  async function estadoParaAjustes() {
    var l = EMPRESAS;
    var apuntes = await CentroDeDatos.leerApuntes();
    var previo = apuntes.entregado && apuntes.entregado[l.conjunto];
    var fecha = previo ? CentroDeDatos.fechaCorta(previo.entregadoEl, true) : '';
    var c = await mirarCarpeta(l);
    if (c.estado === 'sin-carpeta') {
      return previo ? { texto: 'Las empresas las entrega el otro ordenador. Última entrega: ' + previo.registros + ', el ' + fecha + '.' } : null;
    }
    if (c.estado === 'no-recibe') return { texto: 'El Centro de datos todavía no recibe las empresas.' };
    if (c.estado === 'sin-permiso-escribir') return { texto: 'Falta el permiso para escribir en esta carpeta: las empresas no se entregan.', boton: 'permiso' };
    if (c.estado !== 'ok') return null;
    if (!(await huellaDe('x'))) return { texto: 'Este navegador no puede preparar la entrega de las empresas.' };
    var vacia = false;
    if (previo && previo.registros > 0) {   /* se repinta a menudo: lo caro (leer el CSV) se mira como mucho cada 15 s */
      if (Date.now() - ultimaVacia.t < 15000) vacia = ultimaVacia.v;
      else {
        try {
          var m = await montar(l);
          vacia = !m.sinFichero && !m.registros.length && previo.huellaDatos !== m.huella;
        } catch (e) { vacia = false; }
        ultimaVacia = { t: Date.now(), v: vacia };
      }
    }
    if (vacia) return { texto: 'La lista de empresas está vacía y antes no lo estaba: no la he entregado.', boton: 'vacia' };
    if (!previo) return { texto: 'Todavía no se han entregado las empresas al Centro de datos.' };
    return { texto: 'Empresas entregadas al Centro de datos: ' + previo.registros + ', el ' + fecha + (previo.entregadoPor ? ' (' + previo.entregadoPor + ')' : '') + '.' };
  }

  /* Para la «Comprobación al entrar»: el índice recibe las empresas y falta el permiso de escribir (sin pedirlo). */
  async function faltaPermisoDeEscribir() {
    try { return (await mirarCarpeta(EMPRESAS)).estado === 'sin-permiso-escribir'; } catch (e) { return false; }
  }

  return {
    LISTAS: LISTAS, entregarLista: entregarLista, mirar: mirar, alEntrar: alEntrar, entregarAhora: entregarAhora,
    estadoParaAjustes: estadoParaAjustes, faltaPermisoDeEscribir: faltaPermisoDeEscribir, generadoMadrid: generadoMadrid,
    _montar: function () { return montar(EMPRESAS); },
    _reiniciarEntrada: function () { yaEntrado = false; },   /* para las pruebas */
    _ajustar: function (o) { if (o && o.espera !== undefined) espera = o.espera; }   /* para las pruebas */
  };
})();
window.CentroDeDatosEntregar = CentroDeDatosEntregar;
