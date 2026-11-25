/* ============================================================
   persona-del-asunto.js — el campo de plantilla «Una persona del asunto»
   (fila 747, docs/747-CAMPO-UNA-PERSONA-DEL-ASUNTO.md; sale del tema 745).

   Es una clase de dato más de un campo propio (`CamposClases`: 'personaAsunto').
   Al generar un documento la app pregunta «¿Quién?» con ese nombre y ofrece las
   personas que ya están en el asunto, sin reglas de edad, de padre o madre ni de
   tutor: el tercero, quien lo pide, los terceros relacionados y, si el tercero es
   un alumno, sus tutores (con «Tutor legal 1/2» y «tiene la custodia»).

   La elección se guarda en el asunto (`ficha.campos[clave]`: `valor` es el nombre
   y `persona` lleva su DNI, teléfono y correo) y se cambia como cualquier otro
   dato (`DatosDelAsunto.guardar`, el «Cambiar» de la fila 738). El documento lleva
   «Nombre, con DNI X»; el resto queda en campos hermanos para otras plantillas:
   `{campo:Quién recibe (nombre)}`, `(DNI)`, `(teléfono)` y `(correo)`.

   De una persona sin DNI en los datos del centro (escrita a mano en «Quién lo
   pide»), el documento pide «DNI de <campo>» como cualquier dato que falta y lo
   guarda en el asunto.

     etiquetas(a, valores)        los textos del desplegable
     guardar(a, entrada, texto)   escribe la elegida en el asunto
     alDocumento / cerrar         lo que lleva el documento (js/plantillas-valores.js)
     tutores(valores, persona)    el DNI de cada tutor (js/plantillas-valores.js)
   ============================================================ */
var PersonaDelAsunto = (function () {

  var CLASE = 'personaAsunto';
  var RE_DOC = /documento|dni|nif|nie|pasaporte|identificacion/;
  var RE_TEL = /telefono|movil/;
  var RE_COR = /correo|e-?mail/;

  function norm(t) { return U.normalizar(String(t === undefined || t === null ? '' : t).trim()); }

  function limpiarDni(t) {
    var d = String(t || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    return d.length > 4 ? d : '';
  }

  /* El primer valor de `campos` cuya columna case con el patrón. */
  function primero(campos, patron, excluye) {
    var ks = Object.keys(campos || {});
    for (var i = 0; i < ks.length; i++) {
      var k = U.normalizar(ks[i]);
      if (patron.test(k) && !(excluye && excluye.test(k)) && String(campos[ks[i]] || '').trim()) return String(campos[ks[i]]).trim();
    }
    return '';
  }

  /* El documento de un tutor: la columna que habla de «documento»/«DNI» y de ese tutor. */
  function dniDeTutor(campos, n) {
    var reN = n === 1 ? /tutor.*\b0*1\b|\b0*1\b.*tutor|primer\s*tutor/ : /tutor.*\b0*2\b|\b0*2\b.*tutor|segundo\s*tutor/;
    var dni = '';
    Object.keys(campos || {}).forEach(function (k) {
      var t = U.normalizar(k);
      if (!dni && reN.test(t) && RE_DOC.test(t)) dni = limpiarDni(campos[k]);
    });
    return dni;
  }

  /* Fila 747: el DNI de cada tutor, para `personas` (lo llama js/plantillas-valores.js). */
  function tutores(valores, persona) {
    [1, 2].forEach(function (n) { valores['tutor' + n + 'dni'] = persona ? dniDeTutor(persona.campos, n) : ''; });
  }

  function fichaDe(a) { return (window.DatosDelAsunto ? DatosDelAsunto.fichaDe(a) : (a && a.ficha)) || {}; }

  /* Las personas del asunto, en este orden: el tercero, quien lo pide, los relacionados y los tutores.
     `valores`: los del asunto (`Plantillas.valoresDeAsunto`); sin ellos, sin tercero ni tutores. */
  function personas(a, valores) {
    var f = fichaDe(a), v = valores || {}, lista = [];
    var categoria = f.categoria || (a && a.leido && a.leido.categoria) || '';
    var esGrupo = !!(window.AsuntoDeGrupo && a && AsuntoDeGrupo.esGrupo(a));
    /* El nombre va como el del tercero: nombre y apellidos, sin el código pegado (`Plantillas.nombreNaturalDe`).
       `busca` guarda el de los datos del centro, para encontrar su DNI. */
    function poner(p) {
      if (p.nombre && window.Plantillas && Plantillas.nombreNaturalDe) { p.busca = p.nombre; p.nombre = Plantillas.nombreNaturalDe(p.nombre, p.categoria); }
      if (!p.nombre || lista.some(function (x) { return norm(x.nombre) === norm(p.nombre); })) return;
      lista.push(Object.assign({ relacion: '', categoria: '', busca: '', dni: '', telefono: '', correo: '', custodia: false }, p));
    }
    if (!esGrupo && (v.nombreNatural || v.nombre)) {
      poner({ nombre: v.nombreNatural || v.nombre, relacion: 'el tercero', categoria: categoria, dni: v.dni, telefono: v.telefono, correo: v.correo });
    }
    var d = f.loPide;
    if (d && d.nombre && norm(d.relacion) !== norm('El propio interesado')) {
      poner({ nombre: d.nombre, relacion: (d.relacion ? d.relacion + ', ' : '') + 'quien lo pide', categoria: d.categoria || '',
        telefono: d.telefono, correo: d.correo });
    }
    (f.relacionados || []).forEach(function (r) {
      if (r && r.nombre && norm(r.nombre) !== norm(f.tercero)) poner({ nombre: r.nombre, relacion: r.rol || r.relacion || '', categoria: r.categoria || '' });
    });
    if (categoria === 'ALUMNADO' && !esGrupo) {
      [1, 2].forEach(function (n) {
        var nombre = String(v['tutor' + n] || '').trim();
        if (!nombre) return;
        poner({ nombre: nombre, relacion: 'Tutor legal ' + n, categoria: 'TUTORES LEGALES', dni: v['tutor' + n + 'dni'],
          telefono: v['tutor' + n + 'telefono'], correo: v['tutor' + n + 'correo'],
          custodia: !!v.custodiaDeSeneca && norm(v.custodiaDeSeneca) === norm(nombre) });
      });
    }
    return lista;
  }

  function etiqueta(p) {
    return p.nombre + (p.relacion ? ' · ' + p.relacion : '') + (p.custodia ? ' · tiene la custodia' : '');
  }

  function etiquetas(a, valores) { return personas(a, valores).map(etiqueta); }

  /* El DNI, el teléfono y el correo que tengan los datos del centro de una persona con categoría. */
  async function delCentro(p) {
    var r = { dni: p.dni || '', telefono: p.telefono || '', correo: p.correo || '' };
    if ((r.dni && r.telefono && r.correo) || !p.categoria || !window.Datos || !App.E.datos) return r;
    try {
      var fuente = await Datos.cargar(App.E.datos, p.categoria);
      var busca = p.busca || p.nombre;
      var l = Datos.buscar(fuente.lista, busca, 1);
      if (!l.length) l = Datos.buscar(fuente.lista, busca.replace(/[\s\d]+$/, ''), 1);
      if (!l.length && busca !== p.nombre) l = Datos.buscar(fuente.lista, p.nombre, 1);
      var x = l[0];
      if (!x) return r;
      if (!r.dni) r.dni = (p.categoria === 'ALUMNADO' && window.Dni ? (Dni.de(x) || '') : limpiarDni(x.documento));
      if (!r.telefono) r.telefono = primero(x.campos, RE_TEL);
      if (!r.correo) r.correo = primero(x.campos, RE_COR);
    } catch (e) { /* sin datos del centro: se queda lo que había */ }
    return r;
  }

  /* Lo que lleva el documento por esa persona. */
  function textoDe(nombre, dni) { return nombre + (dni ? ', con DNI ' + dni : ''); }

  /* Escribe la persona elegida (`texto`: una de las `etiquetas`) en el asunto. `r`: { entrada, delAsunto } de `DatosDelAsunto.entradaDe`. */
  async function guardar(a, r, texto) {
    var clave = Campos.claveDeCampo(r.entrada);
    var anterior = window.DatosDelAsunto ? DatosDelAsunto.valorGuardado(a, clave) : '';
    var t = String(texto || '').trim();
    if (!t) {
      if (!anterior) return { ok: true, valor: '', sinCambio: true };
      await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: '', anadir: r.delAsunto ? undefined : r.entrada });
      return { ok: true, valor: '', clave: clave };
    }
    var valores = await Plantillas.valoresDeAsunto(a);
    var lista = personas(a, valores);
    var p = lista.filter(function (x) { return etiqueta(x) === t; })[0] || lista.filter(function (x) { return norm(x.nombre) === norm(t); })[0];
    if (!p) return { ok: false, aviso: 'Elige una de las personas de la lista.' };
    var c = await delCentro(p);
    await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, {
      valor: p.nombre, persona: { dni: c.dni, telefono: c.telefono, correo: c.correo, relacion: p.relacion },
      anadir: r.delAsunto ? undefined : r.entrada
    });
    /* Un DNI escrito a mano era de la persona de antes: al cambiar de persona se quita. */
    var campoNombre = Campos.nombreDeCampo(r.entrada, App.E.campos);
    if (anterior && norm(anterior) !== norm(p.nombre)) {
      try { await DatosDelAsunto.guardar(a, 'DNI de ' + campoNombre, ''); } catch (e) { /* no había */ }
    }
    return { ok: true, valor: p.nombre, clave: clave, sinDni: !c.dni, paraDocumento: textoDe(p.nombre, c.dni) };
  }

  /* ---------- lo que lleva el documento (js/plantillas-valores.js, `camposDelAsuntoDe`) ---------- */

  function alDocumento(salida, nombre, g) {
    if (!salida.personas) Object.defineProperty(salida, 'personas', { value: {}, enumerable: false });
    salida.personas[nombre] = g;
  }

  function buscar(salida, nombre) {
    var k = Object.keys(salida).filter(function (x) { return norm(x) === norm(nombre); })[0];
    return k === undefined ? '' : String(salida[k] || '').trim();
  }

  /* Con todos los campos ya puestos: el nombre con su DNI, los campos hermanos y la lista de los que no tienen DNI
     (`salida.sinDni`, que el documento usa para pedir «DNI de …»). */
  function cerrar(salida) {
    if (!salida.personas) return;
    var sinDni = {};
    Object.keys(salida.personas).forEach(function (nombre) {
      var g = salida.personas[nombre], pe = g.persona || {};
      var dni = pe.dni || limpiarDni(buscar(salida, 'DNI de ' + nombre));
      salida[nombre] = textoDe(g.valor, dni);
      salida[nombre + ' (nombre)'] = g.valor;
      salida[nombre + ' (DNI)'] = dni;
      salida[nombre + ' (teléfono)'] = pe.telefono || '';
      salida[nombre + ' (correo)'] = pe.correo || '';
      if (!dni) sinDni[norm(nombre)] = nombre;
    });
    Object.defineProperty(salida, 'sinDni', { value: sinDni, enumerable: false });
  }

  /* El cuadro que pide el DNI de una persona recién elegida que no lo tiene; lo guarda como «DNI de <campo>» en el asunto. */
  async function pedirDni(a, campo, nombre) {
    var espera = U.preguntar('DNI de ' + nombre,
      '<label class="etiqueta" for="persona-dni">DNI de ' + U.escapar(nombre) + ' (para «' + U.escapar(campo) + '»)</label>' +
      '<input id="persona-dni" class="campo" autocomplete="off">', 'Guardar');
    var caja = document.getElementById('persona-dni');
    if (caja) caja.focus();
    var aceptar = document.getElementById('cuadro-aceptar');
    var dni = '';
    function recoger() { dni = caja ? limpiarDni(caja.value) : ''; }
    if (aceptar) aceptar.addEventListener('click', recoger, true);
    var ok = await espera;
    if (aceptar) aceptar.removeEventListener('click', recoger, true);
    if (!ok || !dni) return '';
    var r = await DatosDelAsunto.guardar(a, 'DNI de ' + campo, dni);
    return r.ok ? dni : '';
  }

  return { CLASE: CLASE, personas: personas, etiqueta: etiqueta, etiquetas: etiquetas, guardar: guardar, textoDe: textoDe,
    alDocumento: alDocumento, cerrar: cerrar, tutores: tutores, pedirDni: pedirDni, limpiarDni: limpiarDni };
})();
window.PersonaDelAsunto = PersonaDelAsunto;
