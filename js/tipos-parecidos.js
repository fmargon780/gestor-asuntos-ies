/* ============================================================
   tipos-parecidos.js — dos tipos de asunto que son el mismo (fila 277,
   docs/TIPOS-QUE-SON-EL-MISMO.md).

   1. Si un tipo A es el nombre antiguo de otro B (el nombre de A está en
      `B.alias`) y A no tiene nada propio, la app los une sola
      (`TiposUnir.unir`) y lo dice en una línea. Si A tiene algo propio, no
      se toca: sale en el aviso del punto 2 con su motivo.
   2. Si dos tipos solo se parecen (`seParecen`), un trozo del cuadro de
      avisos de Inicio, con un cuadro para «Unir» o «No son el mismo»
      (js/tipos-parecidos-cuadro.js). «No son el mismo» se apunta para todo
      el centro en `_GESTOR/tipos-distintos.json`.

   Se engancha por `Gestor.alRefrescar`, sin envolver nada, y la pasada se
   hace en segundo plano: nunca con un guardado en marcha, nunca en solo
   consulta, nunca dos a la vez. `seParecen` y `nadaPropio` son la regla; el
   resto, el recorrido.
   ============================================================ */
var TiposParecidos = (function () {

  var FICHERO = 'tipos-distintos.json';
  var ENLACE = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'a', 'en', 'por', 'para', 'con'];

  function n(t) { return (window.TiposNombre && TiposNombre.n) ? TiposNombre.n(t) : U.normalizar(String(t || '')).trim(); }

  /* ---------- cuándo se parecen dos nombres ---------- */

  function palabras(nombre) {
    return n(nombre).split(/[^\p{L}\p{N}]+/u).filter(function (w) { return w && ENLACE.indexOf(w) === -1; });
  }

  /* Iguales, o una es la otra más «s» o «es» («CLASE» y «CLASES»). */
  function mismaPalabra(a, b) {
    return a === b || a + 's' === b || b + 's' === a || a + 'es' === b || b + 'es' === a;
  }

  function mismasPalabras(wa, wb) {
    if (!wa.length || wa.length !== wb.length) return false;
    var usadas = {};
    return wa.every(function (x) {
      for (var i = 0; i < wb.length; i++) {
        if (!usadas[i] && mismaPalabra(x, wb[i])) { usadas[i] = true; return true; }
      }
      return false;
    });
  }

  /* Las palabras del corto son el principio de las del largo, en orden, con una de 4 letras o más. */
  function esPrincipio(corto, largo) {
    if (!corto.length || corto.length >= largo.length) return false;
    if (!corto.some(function (w) { return w.length >= 4; })) return false;
    return corto.every(function (w, i) { return mismaPalabra(w, largo[i]); });
  }

  /* A distancia 1 (una letra cambiada, puesta o quitada) y la letra no es un número. */
  function unaLetra(a, b) {
    var ha = U.hueso ? U.hueso(a) : a, hb = U.hueso ? U.hueso(b) : b;
    if (ha.length < 6 || hb.length < 6 || ha === hb) return false;
    if (Math.abs(ha.length - hb.length) > 1) return false;
    var i = 0;
    while (i < ha.length && i < hb.length && ha.charAt(i) === hb.charAt(i)) i++;
    var larga = ha.length >= hb.length ? ha : hb, corta = ha.length >= hb.length ? hb : ha;
    var letra;
    if (ha.length === hb.length) {
      if (ha.slice(i + 1) !== hb.slice(i + 1)) return false;
      if (/\d/.test(ha.charAt(i)) || /\d/.test(hb.charAt(i))) return false;
      return true;
    }
    if (larga.slice(i + 1) !== corta.slice(i)) return false;
    letra = larga.charAt(i);
    return !/\d/.test(letra);
  }

  /* '' si no se parecen; si sí, la regla que lo dice. Tipos con `tipo` y, opcional, `nombreCorto`. */
  function seParecen(a, b) {
    var wa = palabras(a.tipo), wb = palabras(b.tipo);
    if (mismasPalabras(wa, wb)) return 'mismas palabras';
    if (esPrincipio(wa, wb) || esPrincipio(wb, wa)) return 'principio';
    if (unaLetra(a.tipo, b.tipo)) return 'una letra';
    if ((a.nombreCorto && n(a.nombreCorto) === n(b.tipo)) || (b.nombreCorto && n(b.nombreCorto) === n(a.tipo))) return 'nombre corto';
    return '';
  }

  function claveDePareja(a, b) { return [n(a.tipo || a), n(b.tipo || b)].sort().join('||'); }

  /* ---------- «No son el mismo»: un fichero para todo el centro ---------- */

  var distintos = [];   /* [{ a, b, por, el }] */

  function normalizarDistintos(leido) {
    var lista = (leido && leido.distintos) || [];
    return lista.filter(function (d) { return d && d.a && d.b; }).map(function (d) {
      return { a: String(d.a), b: String(d.b), por: String(d.por || ''), el: String(d.el || '') };
    });
  }

  async function leerDistintos() {
    if (!App.E || !App.E.gestor) return;
    try { distintos = normalizarDistintos(await Carpetas.leerJson(App.E.gestor, FICHERO)); }
    catch (e) { /* se queda lo que había */ }
  }

  function esDistinto(a, b) {
    var k = claveDePareja(a, b);
    return distintos.some(function (d) { return [d.a, d.b].sort().join('||') === k; });
  }

  /* Se relee antes de escribir y se funde por pareja, para que dos ordenadores no se pisen. */
  async function apuntarDistinto(a, b) {
    var k = claveDePareja(a, b);
    await App.enFila(FICHERO, async function () {
      var actual = [];
      try { actual = normalizarDistintos(await Carpetas.leerJson(App.E.gestor, FICHERO)); } catch (e) { actual = distintos.slice(); }
      if (!actual.some(function (d) { return [d.a, d.b].sort().join('||') === k; })) {
        var par = [n(a.tipo), n(b.tipo)].sort();
        actual.push({ a: par[0], b: par[1], por: (App.E.usuario || ''), el: U.ahora ? U.ahora() : new Date().toISOString() });
      }
      await Carpetas.guardarJson(App.E.gestor, FICHERO, { distintos: actual });
      distintos = actual;
    });
  }

  /* ---------- lo que tiene un tipo de propio ---------- */

  /* '' si no tiene nada propio; si no, qué tiene. `otro` es el tipo que se quedaría. */
  async function nadaPropio(t, otro) {
    var g = App.E.gestor;
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(t.tipo)) || [];
    if (pasos.length && !(window.EstadoHito && EstadoHito.esGuiaMinima(pasos))) return 'tiene guía';
    var campos = ((App.E.campos && App.E.campos.porTipo) || {})[t.tipo] || [];
    if (campos.length) return 'tiene campos';
    if (window.Plantillas) {
      var k = n(t.tipo), datos = null;
      try { datos = await Plantillas.cargar(g); } catch (e) { datos = null; }
      if (datos && (datos.lista || []).concat(datos.documentos || []).some(function (p) { return n(p.tipo) === k; })) return 'tiene plantillas';
    }
    var rec = null;
    try { rec = await Carpetas.leerJson(g, 'recurrentes.json'); } catch (e) { rec = null; }
    if (Array.isArray(rec) && rec.some(function (x) { return x && x.tipo === t.tipo; })) return 'tiene asuntos recurrentes';
    if ((t.formularios || []).length) return 'tiene impresos';
    if ((t.palabrasClave || []).length) return 'tiene palabras clave';
    if (otro) {
      if (t.reservado === true && otro.reservado !== true) return 'es reservado';
      if (t.liquidar === true && otro.liquidar !== true) return 'hay que liquidarlo';
    }
    return '';
  }

  function alguienDentro(t) {
    if (!window.Presencia || !Presencia.ocupantePor) return false;
    return (App.E.listaAbiertos || []).some(function (a) { return App.tipoDeAsunto(a) === t.tipo && Presencia.ocupantePor(a.nombre); });
  }

  /* ---------- las parejas ---------- */

  function tipos() { return (App.E && App.E.tipos) || []; }

  /* Los tipos A que son el nombre antiguo de otro: [{ viejo, nuevo, razon }] (`razon` solo si no pueden unirse solos por el nombre). */
  function antiguos() {
    var salida = [];
    tipos().forEach(function (a) {
      var ka = n(a.tipo);
      var duenos = tipos().filter(function (b) { return b !== a && (b.alias || []).some(function (x) { return n(x) === ka; }); });
      if (!duenos.length) return;
      if (duenos.length > 1) { salida.push({ viejo: a, nuevo: duenos[0], razon: 'es el nombre antiguo de dos tipos' }); return; }
      var b = duenos[0];
      if ((a.alias || []).some(function (x) { return n(x) === n(b.tipo); })) { salida.push({ viejo: a, nuevo: b, razon: 'los dos son el nombre antiguo del otro' }); return; }
      salida.push({ viejo: a, nuevo: b, razon: '' });
    });
    return salida;
  }

  var fallidas = {};   /* parejas que no se han podido unir solas en esta sesión */

  /* Las parejas que hay ahora para avisar: [{ a, b, antiguo: { viejo, nuevo } | null, motivo }]. */
  async function parejas() {
    await leerDistintos();
    var lista = [], vistas = {};
    function meter(a, b, antiguo, motivo) {
      var k = claveDePareja(a, b);
      if (vistas[k] || esDistinto(a, b)) return;
      vistas[k] = true;
      lista.push({ a: a, b: b, antiguo: antiguo, motivo: motivo || '' });
    }
    for (var i = 0; i < antiguos().length; i++) {
      var x = antiguos()[i];
      var motivo = x.razon || (fallidas[claveDePareja(x.viejo, x.nuevo)] ? 'no he podido unirlos solo' : await nadaPropio(x.viejo, x.nuevo));
      meter(x.viejo, x.nuevo, { viejo: x.viejo, nuevo: x.nuevo }, motivo);
    }
    var ts = tipos();
    for (var p = 0; p < ts.length; p++) {
      for (var q = p + 1; q < ts.length; q++) {
        if (seParecen(ts[p], ts[q])) meter(ts[p], ts[q], null, '');
      }
    }
    return lista;
  }

  /* ---------- la unión sola ---------- */

  var trabajando = false;

  async function unirSolos() {
    var unidas = 0;
    var candidatos = antiguos().filter(function (x) { return !x.razon && !fallidas[claveDePareja(x.viejo, x.nuevo)] && !esDistinto(x.viejo, x.nuevo); });
    for (var i = 0; i < candidatos.length; i++) {
      var x = candidatos[i], A = x.viejo, B = x.nuevo;
      /* Siguen existiendo los dos (la lista pudo cambiar con una unión anterior de esta misma pasada). */
      if (tipos().indexOf(A) === -1 || tipos().indexOf(B) === -1) continue;
      if (await nadaPropio(A, B)) continue;
      if (alguienDentro(A)) continue;   /* se deja para la pasada siguiente, sin aviso */
      /* Se relee la lista del disco: el otro ordenador pudo haberlo hecho ya. */
      var enDisco = null;
      try { enDisco = await Carpetas.leerJson(App.E.gestor, App.FICHERO_TIPOS); } catch (e) { enDisco = null; }
      if (Array.isArray(enDisco) && !enDisco.some(function (t) { return t && t.tipo === A.tipo; })) continue;
      try {
        var resultado = await TiposUnir.unir(A, B);
        await TiposUnir.despuesDeUnir(A, B);
        var pasados = resultado.asuntos.pasados, saltados = resultado.asuntos.saltados || [];
        var texto = '«' + A.tipo + '» era el nombre antiguo de «' + B.tipo + '». Los he unido.' +
          (pasados ? ' ' + pasados + (pasados === 1 ? ' asunto abierto pasa' : ' asuntos abiertos pasan') + ' a «' + B.tipo + '».' : '');
        if (saltados.length) U.aviso(texto + ' No se han podido cambiar: ' + saltados.join('; '), 'ambar');
        else U.aviso(texto, 'bueno');
        unidas++;
      } catch (e) {
        fallidas[claveDePareja(A, B)] = true;
        U.accesorio('No he podido unir «' + A.tipo + '» con «' + B.tipo + '»', e);
      }
    }
    return unidas;
  }

  /* ---------- fila 279: un nombre que se quiere poner (docs/AVISAR-ANTES-DE-CREAR-UN-TIPO-REPETIDO.md) ----------
     Para crear un tipo o cambiarle el nombre a uno (`salvo`: ese tipo no cuenta). Devuelve los tipos que
     tienen que ver con el nombre: [{ tipo, motivo: 'igual' | 'antiguo' | 'parecido', corto }], los más
     fuertes primero. 'igual' no se puede crear (mismo nombre, o es el nombre corto de otro). */
  function paraNombreNuevo(nombre, salvo) {
    var k = n(nombre);
    var otros = tipos().filter(function (t) { return t !== salvo; });
    var nombres = otros.map(function (t) { return t.tipo; });
    var cerca = U.parecidos(nombre, nombres), iguales = cerca.filter(function (p) { return p.igual; }).map(function (p) { return p.nombre; });
    var cercanos = (window.BuscarOCrear && BuscarOCrear.cercanos) ? BuscarOCrear.cercanos(nombre, nombres) : [];
    var salida = [];
    otros.forEach(function (t) {
      var motivo = '', corto = false;
      if (n(t.tipo) === k || iguales.indexOf(t.tipo) !== -1) motivo = 'igual';
      else if (t.nombreCorto && n(t.nombreCorto) === k) { motivo = 'igual'; corto = true; }
      else if ((t.alias || []).some(function (x) { return n(x) === k; })) motivo = 'antiguo';
      else if (seParecen({ tipo: nombre }, t) || cerca.some(function (p) { return p.nombre === t.tipo; }) || cercanos.indexOf(t.tipo) !== -1) motivo = 'parecido';
      if (motivo) salida.push({ tipo: t, motivo: motivo, corto: corto });
    });
    var peso = { igual: 0, antiguo: 1, parecido: 2 };
    return salida.sort(function (a, b) { return peso[a.motivo] - peso[b.motivo]; });
  }

  /* El nombre deja de ser el nombre antiguo de los tipos que lo llevaban (se llama antes de guardar los tipos). */
  function quitarComoAntiguo(nombre, lista) {
    var k = n(nombre);
    (lista || []).forEach(function (x) {
      if (x.motivo === 'antiguo') x.tipo.alias = (x.tipo.alias || []).filter(function (a) { return n(a) !== k; });
    });
  }

  /* «No son el mismo» para el nombre y cada tipo que se enseñó (quien lo crea acaba de decir que es otro). */
  async function apuntarParejas(nombre, lista) {
    for (var i = 0; i < (lista || []).length; i++) {
      try { await apuntarDistinto({ tipo: nombre }, { tipo: lista[i].tipo.tipo }); }
      catch (e) { U.accesorio('No he podido apuntar que «' + nombre + '» y «' + lista[i].tipo.tipo + '» no son el mismo', e); }
    }
  }

  /* La pregunta común de las puertas. Devuelve null si se deja (o si el nombre ya existe), o la lista de lo que se
     enseñó (puede ir vacía) para que la puerta la pase a `App.crearTipo` / `App.renombrarTipo`. `o`:
     { boton: 'Usar este' | 'Verlo' | 'Unir con él', seguir, verbo, alPulsar(tipo) }. */
  async function confirmarNombre(nombre, o) {
    var lista = paraNombreNuevo(nombre, o.salvo);
    var igual = lista.filter(function (x) { return x.motivo === 'igual'; })[0];
    if (igual) { U.aviso('Ese tipo ya existe: ' + igual.tipo.tipo + '.', 'malo'); return null; }
    if (!lista.length) return [];
    var sigue = await BuscarOCrear.confirmarTipo(nombre, lista, o);
    return sigue ? lista.slice(0, 4) : null;
  }

  /* Lo que se hace al crear de todas formas: el nombre sale del `alias` de los que lo llevaban (el guardado
     de tipos lo hace quien llama) y las parejas se apuntan después. */
  function alCrearNombre(nombre, lista) { quitarComoAntiguo(nombre, lista); }

  /* En solo consulta, también con la marca puesta pero pausada (la copia de pruebas la pausa mientras monta sus datos). */
  function soloConsulta() {
    if (window.SoloConsulta && SoloConsulta.activo()) return true;
    try { return window.localStorage.getItem('gestor.soloConsulta') === '1'; } catch (e) { return false; }
  }

  /* ---------- el aviso de Inicio ---------- */

  var ultimas = [];

  async function pintarAviso() {
    if (!window.AvisosLinea) return;
    var texto = '';
    ultimas = [];
    if (!soloConsulta()) {
      try { ultimas = await parejas(); } catch (e) { ultimas = []; }
      if (ultimas.length) texto = ultimas.length === 1 ? '2 tipos de asunto parecidos' : 'Tipos de asunto parecidos: ' + ultimas.length + ' parejas';
    }
    AvisosLinea.registrar('tipos-parecidos', texto, false, function () { if (window.TiposParecidosCuadro) TiposParecidosCuadro.abrir(); });
  }

  /* ---------- cuándo se mira ---------- */

  function firma() {
    return tipos().map(function (t) { return n(t.tipo) + '~' + (t.alias || []).map(n).join(',') + '~' + n(t.nombreCorto); }).join('|');
  }

  var ultimaFirma = null;
  var esperando = false;

  function mirar() {
    if (!window.App || !App.E || !App.E.gestor || !App.E.tipos) return;
    var f = firma();
    if (f === ultimaFirma || esperando) return;
    ultimaFirma = f;
    esperando = true;
    var intentos = 0;
    (function turno() {
      setTimeout(async function () {
        if (window.ColaGuardado && ColaGuardado.hayGuardado() && ++intentos < 10) return turno();
        esperando = false;
        await hacerPasada();
      }, 1200);
    })();
  }

  /* Una pasada entera: unir los que se pueden y repintar el aviso. Nunca dos a la vez ni en solo consulta. */
  async function hacerPasada() {
    if (trabajando) { ultimaFirma = null; return 0; }   /* se volverá a mirar en el próximo refresco */
    trabajando = true;
    var unidas = 0;
    try {
      if (!soloConsulta()) {
        unidas = await unirSolos();
        if (unidas) ultimaFirma = firma();
      }
      await pintarAviso();
    } catch (e) { U.accesorio('No he podido mirar si hay tipos de asunto repetidos', e); }
    finally { trabajando = false; }
    return unidas;
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(mirar);

  return {
    seParecen: seParecen, palabras: palabras, claveDePareja: claveDePareja,
    parejas: parejas, antiguos: antiguos, nadaPropio: nadaPropio, apuntarDistinto: apuntarDistinto,
    paraNombreNuevo: paraNombreNuevo, confirmarNombre: confirmarNombre, alCrearNombre: alCrearNombre, apuntarParejas: apuntarParejas,
    esDistinto: esDistinto, repintarAviso: pintarAviso, ultimas: function () { return ultimas.slice(); },
    /* para las pruebas */
    _pasada: hacerPasada, _mirar: function () { ultimaFirma = null; esperando = false; mirar(); },
    _olvidarFallos: function () { fallidas = {}; }
  };
})();
window.TiposParecidos = TiposParecidos;
