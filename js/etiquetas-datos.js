/* ============================================================
   etiquetas-datos.js — qué datos puede llevar una etiqueta y de dónde salen (fila 344, docs/ETIQUETAS.md).

   Sin efectos y sin pintar: recibe personas (las de `Datos.cargar`) y devuelve textos.
   - CAMPOS: los datos que se pueden elegir en un renglón (y para qué clase de persona valen).
   - valores(persona, clase, ctx) → { clave: texto } de una persona. `ctx`: { centro, curso }.
   - direccion(persona) → { domicilio, cp, localidad, provincia }.
   - familias(personas, indice) → grupos de hermanos (misma persona tutora y misma dirección), cada uno
     en el sitio de su primer miembro; con `indice` = PersonasFamilias.indice(lista).
   - valoresDeFamilia(grupo, ctx) → los valores de una etiqueta «por familia».
   ============================================================ */
var EtiquetasDatos = (function () {

  var CAMPOS = [
    { clave: 'apellidosNombre', texto: 'Apellidos, nombre', para: 'ambos' },
    { clave: 'nombreCompleto', texto: 'Nombre y apellidos', para: 'ambos' },
    { clave: 'nombre', texto: 'Nombre', para: 'ambos' },
    { clave: 'apellidos', texto: 'Apellidos', para: 'ambos' },
    { clave: 'familia', texto: 'Familia de… (nombres y apellidos)', para: 'alumnado' },
    { clave: 'unidad', texto: 'Unidad', para: 'alumnado' },
    { clave: 'nivel', texto: 'Nivel', para: 'alumnado' },
    { clave: 'ensenanza', texto: 'Enseñanza', para: 'alumnado' },
    { clave: 'escolar', texto: 'Nº de identificación escolar', para: 'alumnado' },
    { clave: 'nacimiento', texto: 'Fecha de nacimiento', para: 'alumnado' },
    { clave: 'tutores', texto: 'Tutores legales', para: 'alumnado' },
    { clave: 'direccion', texto: 'Dirección (en un renglón)', para: 'alumnado' },
    { clave: 'domicilio', texto: 'Calle y número', para: 'alumnado' },
    { clave: 'cpLocalidad', texto: 'Código postal y localidad', para: 'alumnado' },
    { clave: 'provincia', texto: 'Provincia', para: 'alumnado' },
    { clave: 'departamento', texto: 'Departamento (o puesto)', para: 'personal' },
    { clave: 'puesto', texto: 'Puesto', para: 'personal' },
    { clave: 'dni', texto: 'DNI', para: 'ambos' },
    { clave: 'telefono', texto: 'Teléfono', para: 'ambos' },
    { clave: 'correo', texto: 'Correo', para: 'ambos' },
    { clave: 'curso', texto: 'Curso académico', para: 'ambos' },
    { clave: 'centro', texto: 'Nombre del centro', para: 'ambos' }
  ];

  function nor(t) { return U.normalizar(String(t || '')); }

  /* «Pérez García, Ana» -> { apellidos: 'Pérez García', pila: 'Ana' }. Sin coma, todo es el nombre. */
  function partes(nombre) {
    var s = String(nombre || '').trim(), i = s.indexOf(',');
    if (i === -1) return { apellidos: '', pila: s };
    return { apellidos: s.slice(0, i).trim(), pila: s.slice(i + 1).trim() };
  }

  function entero(p) {
    var x = partes(p.nombre);
    return (x.pila + ' ' + x.apellidos).trim();
  }

  /* El primer valor no vacío de `campos` cuya columna cumple `quiere` y no cumple `noquiere`. */
  function buscar(campos, quiere, noquiere, sinTutor) {
    var claves = Object.keys(campos || {});
    for (var pasada = 0; pasada < (sinTutor ? 1 : 2); pasada++) {
      for (var i = 0; i < claves.length; i++) {
        var k = nor(claves[i]);
        if (pasada === 0 && /tutor|padre|madre|responsable/.test(k)) continue;
        if (!quiere.test(k) || (noquiere && noquiere.test(k))) continue;
        var v = String(campos[claves[i]] || '').trim();
        if (v) return v;
      }
    }
    return '';
  }

  function direccion(p) {
    var c = (p && p.campos) || {};
    var raro = /nacim|correo|mail|centro|proced|web/;
    return {
      domicilio: buscar(c, /domicilio|direccion/, raro),
      cp: buscar(c, /codigo postal|^cp$|^c\.? ?p\.?$|postal/, raro),
      localidad: buscar(c, /localidad|municipio/, raro),
      provincia: buscar(c, /provincia/, raro)
    };
  }

  function cpLocalidad(d) { return [d.cp, d.localidad].filter(Boolean).join(' '); }

  function documento(p) {
    try { return (window.Dni && Dni.de ? Dni.de(p) : '') || p.documento || ''; } catch (e) { return p.documento || ''; }
  }

  function tutoresTexto(p) {
    try { return Datos.tutoresDe(p).map(function (t) { return t.nombre; }).filter(Boolean).join(' y '); } catch (e) { return ''; }
  }

  function departamento(p) {
    var c = p.campos || {};
    return c['Departamento'] || c['Especialidad'] || p.puesto || c['Puesto'] || '';
  }

  /* Los valores de una persona. `clase`: 'alumnado' | 'personal'. */
  function valores(p, clase, ctx) {
    ctx = ctx || {};
    var x = partes(p.nombre), d = direccion(p), c = p.campos || {};
    var ne = clase === 'alumnado' && window.Nombres ? Nombres.nivelYEnsenanza(p.unidad || '') : { nivel: '', ensenanza: '' };
    var tut = clase === 'alumnado' ? (function () { try { return Datos.tutoresDe(p); } catch (e) { return []; } })() : [];
    var tel = buscar(c, /telefono|movil/, /fax/) || (tut[0] && tut[0].telefonos[0]) || '';
    var mail = buscar(c, /correo|e-?mail/, null) || (tut[0] && tut[0].correos[0]) || '';
    var v = {
      apellidosNombre: p.nombre || '', nombreCompleto: entero(p), nombre: x.pila, apellidos: x.apellidos,
      familia: clase === 'alumnado' ? 'Familia de ' + entero(p) : '',
      unidad: p.unidad || '', nivel: ne.nivel, ensenanza: ne.ensenanza, escolar: p.id || '',
      nacimiento: p.fechaNac || '', tutores: tutoresTexto(p),
      direccion: [d.domicilio, cpLocalidad(d), d.provincia].filter(Boolean).join(' · '),
      domicilio: d.domicilio, cpLocalidad: cpLocalidad(d), provincia: d.provincia,
      departamento: departamento(p), puesto: p.puesto || c['Puesto'] || '',
      dni: documento(p), telefono: tel, correo: mail, curso: ctx.curso || '', centro: ctx.centro || ''
    };
    v._sinDireccion = clase === 'alumnado' && !(d.domicilio || d.cp || d.localidad);
    return v;
  }

  /* ---------- las familias ---------- */

  function claveDireccion(p) {
    var d = direccion(p);
    return nor([d.domicilio, d.cp, d.localidad, d.provincia].join('|')).replace(/\s+/g, ' ');
  }

  /* `personas` ya en el orden de la lista. Dos son de la misma familia si comparten al menos un tutor
     (PersonasFamilias.hermanosDe) y la misma dirección. Cada grupo sale en el sitio de su primer miembro. */
  function familias(personas, indice) {
    var padre = personas.map(function (_, i) { return i; });
    function raiz(i) { while (padre[i] !== i) { padre[i] = padre[padre[i]]; i = padre[i]; } return i; }
    var sitio = {};
    personas.forEach(function (p, i) { sitio[PersonasFamilias.claveAlumno(p)] = i; });
    personas.forEach(function (p, i) {
      PersonasFamilias.hermanosDe(indice, p).forEach(function (h) {
        var j = sitio[PersonasFamilias.claveAlumno(h)];
        if (j === undefined || j === i) return;
        if (claveDireccion(personas[j]) !== claveDireccion(p)) return;
        var a = raiz(i), b = raiz(j);
        if (a !== b) padre[Math.max(a, b)] = Math.min(a, b);
      });
    });
    var grupos = [], porRaiz = {};
    personas.forEach(function (p, i) {
      var r = raiz(i);
      if (porRaiz[r] === undefined) { porRaiz[r] = grupos.length; grupos.push([]); }
      grupos[porRaiz[r]].push(p);
    });
    return grupos;
  }

  function unir(nombres) {
    if (nombres.length <= 1) return nombres.join('');
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  /* «Familia de Ana y Luis Pérez García»; con apellidos distintos, cada uno con los suyos. */
  function textoFamilia(grupo) {
    var xs = grupo.map(function (p) { return partes(p.nombre); });
    var iguales = xs.every(function (x) { return nor(x.apellidos) === nor(xs[0].apellidos); });
    if (iguales) return 'Familia de ' + unir(xs.map(function (x) { return x.pila; })) + (xs[0].apellidos ? ' ' + xs[0].apellidos : '');
    return 'Familia de ' + unir(xs.map(function (x) { return (x.pila + ' ' + x.apellidos).trim(); }));
  }

  /* Los valores de una etiqueta por familia: los de la primera persona, con el nombre de toda la familia. */
  function valoresDeFamilia(grupo, clase, ctx) {
    var v = valores(grupo[0], clase, ctx);
    if (grupo.length > 1) {
      v.familia = textoFamilia(grupo);
      v.nombre = unir(grupo.map(function (p) { return partes(p.nombre).pila; }));
      v.nombreCompleto = unir(grupo.map(entero));
      v.apellidosNombre = grupo.map(function (p) { return p.nombre; }).join(' / ');
      v.escolar = grupo.map(function (p) { return p.id; }).filter(Boolean).join(' / ');
      v.unidad = grupo.map(function (p) { return p.unidad; }).filter(function (u, i, a) { return u && a.indexOf(u) === i; }).join(' / ');
    }
    return v;
  }

  return {
    CAMPOS: CAMPOS, partes: partes, direccion: direccion, valores: valores, familias: familias,
    textoFamilia: textoFamilia, valoresDeFamilia: valoresDeFamilia
  };
})();
window.EtiquetasDatos = EtiquetasDatos;
