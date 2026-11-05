/* ============================================================
   datos-del-asunto.js — los datos que piden las plantillas se escriben
   en el asunto (fila 530, 5-nov-2026, docs/530-DATOS-EN-EL-ASUNTO.md;
   tema 518, tercera parte).

   Un dato que falta al generar un documento, preparar un correo o un
   mensaje de Séneca se escribe ahí mismo y se guarda en el asunto
   (`ficha.campos`, por `App.guardarRegistroFresco`): un solo valor de cada
   dato por asunto, que ninguna otra plantilla vuelve a pedir y que sale en
   «Campos del asunto». Aquí:

     entradaDe(nombre, a)      el campo del asunto que lleva ese nombre
                               (o el de la lista única, o uno nuevo, de
                               texto); { entrada, delAsunto, clase, valores }
     guardar(a, nombre, texto) lo escribe en el asunto; { ok, valor } o
                               { ok: false, aviso } si no se entiende
     infoDe(nombre, a, valores) la clase y las opciones para pintar su control
     tutoresDe(valores)        los tutores del alumno
     completar(valores)        «Tutor con custodia»: con un solo tutor, cae solo

   Un campo que no es del tipo se añade a `ficha.camposPropiosDelAsunto`,
   como «solo aquí» (js/campo-desde-el-asunto-escribir.js).
   ============================================================ */
var DatosDelAsunto = (function () {

  var TUTOR_CON_CUSTODIA = 'Tutor con custodia';

  function norm(t) { return U.normalizar(String(t === undefined || t === null ? '' : t).trim()); }
  function esTutorConCustodia(nombre) { return norm(nombre) === norm(TUTOR_CON_CUSTODIA); }

  function fichaDe(a) {
    if (!a) return {};
    return (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || (a && a.ficha) || {};
  }

  function tipoDe(a) { return window.DondeSeGuarda ? DondeSeGuarda.tipoDe(a) : ((a && a.leido && a.leido.tipo) || ''); }

  /* Los campos del asunto (los del tipo y los «solo aquí»), cada uno con su nombre. */
  function camposDelAsunto(a) {
    if (!a) return [];
    var tipo = tipoDe(a);
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    return Campos.camposDeAsunto(config, fichaDe(a)).map(function (cfg) {
      return { cfg: cfg, nombre: Campos.nombreDeCampo(cfg, App.E.campos), clave: Campos.claveDeCampo(cfg) };
    });
  }

  function valorGuardado(a, clave) {
    var c = fichaDe(a).campos;
    var g = c && !Array.isArray(c) ? c[clave] : null;
    return g && g.valor !== undefined && g.valor !== null ? String(g.valor) : '';
  }

  /* ---------- tutores ---------- */

  function tutoresDe(valores) {
    return [valores && valores.tutor1, valores && valores.tutor2].map(function (t) { return String(t || '').trim(); }).filter(Boolean);
  }

  /* «Tutor con custodia»: con un solo tutor, cae solo (sin escribirlo en el asunto); con dos, se elige una vez. */
  function completar(valores) {
    if (!valores) return valores;
    var campos = valores.campos = valores.campos || {};
    var ya = Object.keys(campos).some(function (k) { return esTutorConCustodia(k) && String(campos[k] || '').trim(); });
    var t = tutoresDe(valores);
    if (!ya && t.length === 1) campos[TUTOR_CON_CUSTODIA] = t[0];
    return valores;
  }

  /* ---------- la clase y las opciones de un dato ---------- */

  function propioPorNombre(nombre) {
    return ((App.E.campos && App.E.campos.propios) || []).filter(function (p) { return norm(p.nombre) === norm(nombre); })[0] || null;
  }

  /* { clase, valores, clave, guardado, delAsunto }: lo que hace falta para pintar el control de un dato. */
  function infoDe(nombre, a, valores) {
    var info = { clase: 'texto', valores: null, clave: '', guardado: false, delAsunto: false };
    var propio = null;
    var delAsunto = camposDelAsunto(a).filter(function (c) { return norm(c.nombre) === norm(nombre); })[0];
    if (delAsunto) {
      info.delAsunto = true;
      info.clave = delAsunto.clave;
      info.guardado = !!valorGuardado(a, delAsunto.clave);
      if (delAsunto.cfg.origen === 'propio') propio = Campos.propioDe(delAsunto.cfg.id, App.E.campos);
      info.clase = Campos.claseDeCampo(delAsunto.cfg, App.E.campos);
    } else {
      propio = propioPorNombre(nombre);
      if (propio) info.clase = propio.clase || 'texto';
    }
    if (propio && propio.clase === 'lista') info.valores = (propio.valores || []).slice();
    if (esTutorConCustodia(nombre)) { info.clase = 'lista'; info.valores = tutoresDe(valores); }
    if (!info.valores && window.TextoCondicional) {
      var ops = TextoCondicional.opcionesDeFalta(nombre);
      var delTipo = valores && valores.camposLista ? valores.camposLista[Object.keys(valores.camposLista).filter(function (k) { return norm(k) === norm(nombre); })[0]] : null;
      var o = ops || delTipo;
      if (o && o.length) { info.clase = 'lista'; info.valores = o.slice(); }
    }
    return info;
  }

  /* ---------- el campo que lleva ese nombre ---------- */

  function entradaLimpia(c) {
    return c.origen === 'fichero' ? { origen: 'fichero', columna: c.columna } : { origen: c.origen, id: c.id };
  }

  /* Crea un campo propio de texto con ese nombre (o de lista, si se sabe que lo es) en `campos.json`. */
  async function crearPropio(nombre, opciones) {
    var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000), nombre: nombre, clase: opciones && opciones.length ? 'lista' : 'texto',
      valores: opciones && opciones.length ? opciones.slice() : [], grupo: 'Asunto' };
    App.E.campos = await App.enFila('campos.json', function () {
      return Campos.guardarPropios(App.E.gestor, function (propios) { return propios.concat([nuevo]); });
    });
    return nuevo;
  }

  /* { entrada, delAsunto } del campo con ese nombre: el que el asunto ya tiene; si no, el de la lista única
     de campos (de un fichero, calculado o propio); si no hay ninguno (un dato de una plantilla que no es
     de ningún campo), uno propio nuevo, de texto. */
  async function entradaDe(nombre, a, opciones) {
    var propio = camposDelAsunto(a).filter(function (c) { return norm(c.nombre) === norm(nombre); })[0];
    if (propio) return { entrada: entradaLimpia(propio.cfg), delAsunto: true };
    var p = propioPorNombre(nombre);
    if (p) return { entrada: { origen: 'propio', id: p.id }, delAsunto: false };
    var lista = [];
    try { lista = await CamposListaDatos.lista(); } catch (e) { lista = []; }
    var c = lista.filter(function (x) { return norm(x.nombre) === norm(nombre); })[0];
    if (c && c.calculadoId) return { entrada: { origen: 'calculado', id: c.calculadoId }, delAsunto: false };
    if (c && c.id.indexOf('f:') === 0) return { entrada: { origen: 'fichero', columna: c.columna }, delAsunto: false };
    var nuevo = await crearPropio(nombre, esTutorConCustodia(nombre) ? [] : opciones);
    return { entrada: { origen: 'propio', id: nuevo.id }, delAsunto: false };
  }

  /* La entrada de `porTipo` de un campo elegido en la ventana de elegir (js/campos-elegir.js): el de un
     fichero, el calculado o el propio tal cual; lo demás (un hueco, una tabla de datos, un {campo:…} sin
     campo) se vuelve un campo propio de texto con su nombre. */
  async function entradaDeCampoDeLista(c, a) {
    if (c.propioId) return { origen: 'propio', id: c.propioId };
    if (c.calculadoId) return { origen: 'calculado', id: c.calculadoId };
    if (c.id && c.id.indexOf('f:') === 0) return { origen: 'fichero', columna: c.columna };
    return (await entradaDe(c.nombre, a, c.opciones)).entrada;
  }

  /* ---------- guardar en el asunto ---------- */

  /* Escribe `texto` como valor de ese dato en el asunto. Un texto que no encaja con la clase (un importe,
     una fecha) no se guarda: { ok: false, aviso }. Un valor vacío quita el que hubiera. */
  async function guardar(a, nombre, texto, opciones) {
    var info = infoDe(nombre, a, null);
    var r = await entradaDe(nombre, a, opciones);
    var clase = Campos.claseDeCampo(r.entrada, App.E.campos);
    var leido = CamposClases.leer(clase, texto);
    if (!leido.ok) return { ok: false, aviso: 'Revisa «' + nombre + '»: ' + CamposClases.avisoDeAmbar(clase) + '.' };
    var clave = Campos.claveDeCampo(r.entrada);
    if (!leido.valor && !valorGuardado(a, clave)) return { ok: true, valor: '', sinCambio: true };
    await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: leido.valor, anadir: r.delAsunto ? undefined : r.entrada });
    return { ok: true, valor: leido.valor, clave: clave, nuevo: !r.delAsunto && !info.delAsunto };
  }

  return { TUTOR_CON_CUSTODIA: TUTOR_CON_CUSTODIA, esTutorConCustodia: esTutorConCustodia, entradaDe: entradaDe, guardar: guardar,
    entradaDeCampoDeLista: entradaDeCampoDeLista, infoDe: infoDe, tutoresDe: tutoresDe, completar: completar, camposDelAsunto: camposDelAsunto, valorGuardado: valorGuardado,
    fichaDe: fichaDe, tipoDe: tipoDe, norm: norm };
})();
window.DatosDelAsunto = DatosDelAsunto;
