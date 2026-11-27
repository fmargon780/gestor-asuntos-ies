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
   `{campo:Quién recibe (nombre)}`, `(DNI)`, `(teléfono)`, `(correo)` y `(en calidad de)`.

   Fila 773 (docs/773-PERSONA-ELEGIDA-COMPLETA.md): esos campos hermanos valen
   solos, sin el campo entero (`hermano`, `resolverHermano`: la plantilla pregunta
   «¿Quién?» una vez), y «en calidad de» (padre, madre, alumna…) lo propone la app
   según de dónde sale la persona (`calidadPorClase`) y se cambia con el dato
   «En calidad de <campo>» (js/persona-del-asunto-calidad.js).

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

  /* Fila 773: «en calidad de» por defecto, según la clase de la persona y su sexo (`H`, `M` o nada). */
  function calidadPorClase(categoria, sexo) {
    var c = String(categoria || '').toUpperCase();
    if (c === 'ALUMNADO') return sexo === 'H' ? 'alumno' : (sexo === 'M' ? 'alumna' : 'alumno/a');
    if (c === 'TUTORES LEGALES') return sexo === 'H' ? 'padre' : (sexo === 'M' ? 'madre' : 'tutor/a legal');
    if (c === 'PERSONAL') return 'personal del centro';
    return '';
  }

  function sexoDe(v, quien) { return (v && v.sexos && v.sexos[quien]) || ''; }

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
      lista.push(Object.assign({ relacion: '', categoria: '', busca: '', dni: '', telefono: '', correo: '', custodia: false, calidad: '' }, p));
    }
    if (!esGrupo && (v.nombreNatural || v.nombre)) {
      poner({ nombre: v.nombreNatural || v.nombre, relacion: 'el tercero', categoria: categoria, dni: v.dni, telefono: v.telefono, correo: v.correo,
        calidad: calidadPorClase(categoria, sexoDe(v, 'tercero')) });
    }
    var d = f.loPide;
    if (d && d.nombre && norm(d.relacion) !== norm('El propio interesado')) {
      poner({ nombre: d.nombre, relacion: (d.relacion ? d.relacion + ', ' : '') + 'quien lo pide', categoria: d.categoria || '',
        telefono: d.telefono, correo: d.correo, calidad: String(d.relacion || '').trim().toLowerCase() || calidadPorClase(d.categoria || '', '') });
    }
    (f.relacionados || []).forEach(function (r) {
      if (r && r.nombre && norm(r.nombre) !== norm(f.tercero)) poner({ nombre: r.nombre, relacion: r.rol || r.relacion || '', categoria: r.categoria || '', calidad: calidadPorClase(r.categoria || '', '') });
    });
    if (categoria === 'ALUMNADO' && !esGrupo) {
      [1, 2].forEach(function (n) {
        var nombre = String(v['tutor' + n] || '').trim();
        if (!nombre) return;
        poner({ nombre: nombre, relacion: 'Tutor legal ' + n, categoria: 'TUTORES LEGALES', dni: v['tutor' + n + 'dni'],
          telefono: v['tutor' + n + 'telefono'], correo: v['tutor' + n + 'correo'],
          custodia: !!v.custodiaDeSeneca && norm(v.custodiaDeSeneca) === norm(nombre), calidad: calidadPorClase('TUTORES LEGALES', sexoDe(v, 'tutor' + n)) });
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
      valor: p.nombre, persona: { dni: c.dni, telefono: c.telefono, correo: c.correo, relacion: p.relacion, calidad: p.calidad },
      anadir: r.delAsunto ? undefined : r.entrada
    });
    /* Un DNI escrito a mano era de la persona de antes: al cambiar de persona se quita. */
    var campoNombre = Campos.nombreDeCampo(r.entrada, App.E.campos);
    if (anterior && norm(anterior) !== norm(p.nombre)) {
      try { await DatosDelAsunto.guardar(a, 'DNI de ' + campoNombre, ''); } catch (e) { /* no había */ }
      try { await DatosDelAsunto.guardar(a, 'En calidad de ' + campoNombre, ''); } catch (e) { /* no había */ }   /* fila 773 */
    }
    return { ok: true, valor: p.nombre, clave: clave, sinDni: !c.dni, sinCalidad: !p.calidad, paraDocumento: textoDe(p.nombre, c.dni),
      hermanos: { nombre: p.nombre, dni: c.dni, telefono: c.telefono, correo: c.correo, calidad: p.calidad } };
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
    var sinDni = {}, sinCalidad = {};
    Object.keys(salida.personas).forEach(function (nombre) {
      var g = salida.personas[nombre], pe = g.persona || {};
      var dni = pe.dni || limpiarDni(buscar(salida, 'DNI de ' + nombre));
      salida[nombre] = textoDe(g.valor, dni);
      salida[nombre + ' (nombre)'] = g.valor;
      salida[nombre + ' (DNI)'] = dni;
      salida[nombre + ' (teléfono)'] = pe.telefono || '';
      salida[nombre + ' (correo)'] = pe.correo || '';
      var calidad = buscar(salida, 'En calidad de ' + nombre) || pe.calidad || '';   /* lo escrito a mano manda (fila 773) */
      salida[nombre + ' (en calidad de)'] = calidad;
      if (!dni) sinDni[norm(nombre)] = nombre;
      if (!calidad) sinCalidad[norm(nombre)] = nombre;
    });
    Object.defineProperty(salida, 'sinDni', { value: sinDni, enumerable: false });
    Object.defineProperty(salida, 'sinCalidad', { value: sinCalidad, enumerable: false });
  }

  /* ---------- los campos hermanos sin el campo entero (fila 773) ---------- */

  var HERMANOS = ['nombre', 'dni', 'telefono', 'correo', 'en calidad de'];

  function esCampo(nombre) {
    return ((window.App && App.E && App.E.campos && App.E.campos.propios) || []).some(function (c) { return c.clase === CLASE && norm(c.nombre) === norm(nombre); });
  }

  /* `Quién recibe (DNI)` → { base: 'Quién recibe', sufijo: 'dni' } si la base es un campo «Una persona del asunto». */
  function hermano(nombreCampo) {
    var m = /^(.*\S)\s*\(([^()]+)\)\s*$/.exec(String(nombreCampo || '').trim());
    if (!m) return null;
    var sufijo = norm(m[2]);
    return HERMANOS.indexOf(sufijo) !== -1 && esCampo(m[1]) ? { base: m[1].trim(), sufijo: sufijo } : null;
  }

  function aManoDe(valores, nombre, aunVacio) {
    var aMano = (valores && valores.aMano) || {};
    var k = Object.keys(aMano).filter(function (x) { return norm(x) === norm(nombre) && (aunVacio || String(aMano[x]).trim()); })[0];
    return k === undefined ? null : String(aMano[k]).trim();
  }

  /* El valor de un campo hermano en `Plantillas.rellenar` (`valorCampo`: el que ya había). Con la persona sin elegir, pide la base
     (el desplegable de siempre, una sola vez); con ella elegida y sin DNI o sin «en calidad de», pide ese dato como el DNI de hoy.
     Devuelve el texto, o `null` si no hay nada especial que hacer. */
  function resolverHermano(h, valorCampo, nombreCampo, valores, faltan) {
    function pedir(t) { if (faltan.indexOf(t) === -1) faltan.push(t); return ''; }
    var campos = (valores && valores.campos) || {};
    var elegidas = campos.personas || {};
    var base = Object.keys(elegidas).filter(function (k) { return norm(k) === norm(h.base); })[0];
    var ahora = aManoDe(valores, h.base) !== null;   /* elegida en «Faltan datos», con este documento a medias */
    if (base === undefined && !ahora) {   /* sin elegir: el hermano se pide por su campo entero */
      return valorCampo || pedir(h.base);
    }
    if (valorCampo) return valorCampo;
    if (base === undefined) {   /* elegida ahora: sus hermanos van en `aMano` (`hermanosAMano`); «en calidad de» falta si no se escribió */
      var mano = aManoDe(valores, nombreCampo, true);
      if (mano !== null) return mano;
      base = h.base;
    }
    if (h.sufijo === 'dni') {
      var d = aManoDe(valores, 'DNI de ' + base);
      return d !== null ? limpiarDni(d) : pedir('DNI de ' + base);
    }
    if (h.sufijo === 'en calidad de') {
      var c = aManoDe(valores, 'En calidad de ' + base);
      return c !== null ? c : pedir('En calidad de ' + base);
    }
    return null;
  }

  /* Lo que se acaba de guardar de una persona recién elegida (`guardar().hermanos`), para `aMano`: el documento que se está
     generando aún lleva los valores de antes de elegir. */
  function hermanosAMano(aMano, campo, hm) {
    aMano[campo + ' (nombre)'] = hm.nombre || '';
    aMano[campo + ' (DNI)'] = hm.dni || '';
    aMano[campo + ' (teléfono)'] = hm.telefono || '';
    aMano[campo + ' (correo)'] = hm.correo || '';
    if (hm.calidad) aMano[campo + ' (en calidad de)'] = hm.calidad;   /* sin valor, no se pone: el documento lo pide aparte */
  }

  /* El cuadro que pide un dato de una persona recién elegida; lo guarda como «<dato> <campo>» en el asunto. */
  async function pedirDato(a, rotulo, nombreDato, limpiar) {
    var espera = U.preguntar(rotulo,
      '<label class="etiqueta" for="persona-dato">' + U.escapar(rotulo) + '</label>' +
      '<input id="persona-dato" class="campo" autocomplete="off">', 'Guardar');
    var caja = document.getElementById('persona-dato');
    if (caja) caja.focus();
    var aceptar = document.getElementById('cuadro-aceptar');
    var texto = '';
    function recoger() { texto = caja ? limpiar(caja.value) : ''; }
    if (aceptar) aceptar.addEventListener('click', recoger, true);
    var ok = await espera;
    if (aceptar) aceptar.removeEventListener('click', recoger, true);
    if (!ok || !texto) return '';
    var r = await DatosDelAsunto.guardar(a, nombreDato, texto);
    return r.ok ? texto : '';
  }

  /* El DNI de una persona recién elegida que no lo tiene. */
  function pedirDni(a, campo, nombre) {
    return pedirDato(a, 'DNI de ' + nombre + ' (para «' + campo + '»)', 'DNI de ' + campo, limpiarDni);
  }

  return { CLASE: CLASE, personas: personas, etiqueta: etiqueta, etiquetas: etiquetas, guardar: guardar, textoDe: textoDe,
    alDocumento: alDocumento, cerrar: cerrar, tutores: tutores, pedirDni: pedirDni, limpiarDni: limpiarDni,
    hermano: hermano, resolverHermano: resolverHermano, hermanosAMano: hermanosAMano, calidadPorClase: calidadPorClase, esCampo: esCampo };
})();
window.PersonaDelAsunto = PersonaDelAsunto;
