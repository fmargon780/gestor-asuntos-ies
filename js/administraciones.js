/* ============================================================
   administraciones.js — las Administraciones Públicas, un tipo de
   tercero propio (25-sep-2026, fila 167,
   docs/ADMINISTRACIONES-COMO-TERCERO.md). Los datos y su lógica; la
   ficha, el alta y el árbol de departamentos están en
   js/administraciones-ficha.js, y «Pasar a Administraciones» en
   js/administraciones-traer.js.

   Dos clases: `organismo` (Delegaciones, Ayuntamiento, Inspección…),
   agrupados por «Depende de», y `centro` (institutos y colegios).

   `_GESTOR/datos/administraciones.json`:
     { superiores: [{ id, nombre, antes: [{ nombre, hasta }] }],
       organismos: [{ id, clase, corto, oficial, dir3, codigoCentro,
                      superior, correo, telefono, direccion,
                      antes: [{ nombre, hasta }],
                      departamentos: [{ id, nombre, correo, telefono,
                                        contacto, dir3, hijos: [...] }] }] }
   «Depende de» se guarda aparte (`superiores`) y se enlaza por `id`:
   cambiar el nombre de una Consejería lo cambia en todos sus organismos.
   Cambiar el nombre oficial, el DIR3 o «Depende de» nunca renombra
   carpetas; el nombre corto sí (es el nombre del tercero).

   Escrito siempre por `ColaGuardado`, releyendo dentro de la cola, con
   una copia del día en `_GESTOR/copias` antes de escribir. Dos
   ordenadores: js/conflictos.js lo une por `id` (`unirDatos`, aquí).
   ============================================================ */
var Administraciones = (function () {

  var CAT = 'ADMINISTRACIONES';
  var FICHERO = 'administraciones.json';
  var DEPARTAMENTOS_DE_CENTRO = ['Secretaría', 'Dirección', 'Jefatura de Estudios'];

  var cache = null;   /* lo último leído o escrito */

  function vacio() { return { superiores: [], organismos: [] }; }
  function limpio(d) {
    d = d && typeof d === 'object' ? d : {};
    return { superiores: Array.isArray(d.superiores) ? d.superiores : [],
             organismos: Array.isArray(d.organismos) ? d.organismos : [] };
  }
  function idNuevo(prefijo) { return prefijo + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function hoy() { return U.hoyIso(); }

  /* ---------- buscar dentro ---------- */

  function superiorPorId(d, id) { return (d.superiores || []).filter(function (s) { return s.id === id; })[0] || null; }
  function organismoPorId(d, id) { return (d.organismos || []).filter(function (o) { return o.id === id; })[0] || null; }

  /* Recorre el árbol: fn(dep, nivel, padre). */
  function recorrer(lista, fn, nivel, padre) {
    (lista || []).forEach(function (dep) {
      fn(dep, nivel || 0, padre || null);
      recorrer(dep.hijos, fn, (nivel || 0) + 1, dep);
    });
  }

  function departamentoPorId(o, id) {
    var hallado = null;
    recorrer(o && o.departamentos, function (dep) { if (!hallado && dep.id === id) hallado = dep; });
    return hallado;
  }

  /* El árbol en una lista, con su nivel (para el desplegable). */
  function aplanar(o) {
    var salida = [];
    recorrer(o && o.departamentos, function (dep, nivel) {
      salida.push({ id: dep.id, nombre: dep.nombre, nivel: nivel, correo: dep.correo || '' });
    });
    return salida;
  }

  function quitarDelArbol(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) {
      if (lista[i].id === id) return lista.splice(i, 1)[0];
      var r = quitarDelArbol(lista[i].hijos, id);
      if (r) return r;
    }
    return null;
  }

  /* ---------- el tercero ---------- */

  function tercero(o) { return Nombres.terceroAdministracion(o); }

  function nombresAnteriores(o, d) {
    var s = superiorPorId(d, o.superior);
    return (o.antes || []).map(function (x) { return x.nombre; })
      .concat(s ? (s.antes || []).map(function (x) { return x.nombre; }) : []);
  }

  function correosDe(o) {
    var correos = [o.correo];
    recorrer(o.departamentos, function (dep) { correos.push(dep.correo); });
    return correos.map(function (c) { return String(c || '').trim().toLowerCase(); }).filter(Boolean);
  }

  function dominiosDe(o) {
    var correos = correosDe(o);
    var salida = [];
    correos.forEach(function (c) {
      var m = String(c || '').toLowerCase().match(/@([^\s>]+)$/);
      if (m && salida.indexOf(m[1]) === -1) salida.push(m[1]);
    });
    return salida;
  }

  /* Una «persona» como las de las demás listas de Datos. */
  function persona(o, d) {
    var s = superiorPorId(d, o.superior);
    var campos = {};
    function poner(t, v) { if (v) campos[t] = v; }
    poner('Nombre oficial', o.oficial);
    if (o.clase === 'centro') poner('Código de centro', o.codigoCentro); else poner('DIR3', o.dir3);
    poner('Depende de', s && s.nombre);
    poner('Correo', o.correo);
    poner('Teléfono', o.telefono);
    poner('Dirección', o.direccion);
    var deps = [];
    recorrer(o.departamentos, function (dep) { deps.push(dep.nombre, dep.dir3 || ''); });
    return {
      nombre: o.corto || '', corto: o.corto || '', clase: o.clase === 'centro' ? 'centro' : 'organismo',
      codigoCentro: o.codigoCentro || '', dir3: o.dir3 || '', oficial: o.oficial || '',
      superior: s ? s.nombre : '', superiorId: o.superior || '', idOrganismo: o.id,
      documento: '', referencia: '', nif: '', comercial: '', puesto: '', fechaCese: '',
      categoria: CAT, deSeneca: true, enElCentro: true, campos: campos, dominios: dominiosDe(o), correosTodos: correosDe(o),
      busca: U.normalizar([o.corto, o.oficial, o.dir3, o.codigoCentro, s ? s.nombre : '', o.correo]
        .concat(nombresAnteriores(o, d), deps).join(' '))
    };
  }

  function porNombre(a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; }

  /* Los dos grupos (organismos por «Depende de», y centros), para pintar. */
  function agrupar(lista) {
    var grupos = {}, orden = [];
    var centros = [];
    (lista || []).forEach(function (p) {
      if (p.clase === 'centro') { centros.push(p); return; }
      var t = p.superior || 'Otros organismos';
      if (!grupos[t]) { grupos[t] = []; orden.push(t); }
      grupos[t].push(p);
    });
    orden.sort(function (a, b) {
      if (a === 'Otros organismos') return 1;
      if (b === 'Otros organismos') return -1;
      return U.normalizar(a) < U.normalizar(b) ? -1 : 1;
    });
    var salida = orden.map(function (t) { return { titulo: 'Organismos · ' + t, lista: grupos[t] }; });
    if (centros.length) salida.push({ titulo: 'Centros educativos', lista: centros });
    return salida;
  }

  function pie(p) {
    if (p.clase === 'centro') return ['Centro educativo', p.codigoCentro, p.oficial].filter(Boolean).join('  ·  ');
    return ['Organismo', p.superior ? 'depende de ' + p.superior : '', p.oficial].filter(Boolean).join('  ·  ');
  }

  /* ---------- leer y guardar ---------- */

  async function leer(dirDatos) {
    var d = null;
    try { d = await Carpetas.leerJson(dirDatos, FICHERO); }
    catch (e) { if (e && e.name === 'FicheroRoto') throw e; d = null; }
    cache = limpio(d);
    return cache;
  }

  function enMemoria() { return cache || vacio(); }

  /* La fuente de la categoría para `Datos.cargar`. */
  async function cargar(dirDatos) {
    var I = Datos._interno;
    if (I.CACHE[CAT]) return I.CACHE[CAT];
    var d = await leer(dirDatos);
    var lista = d.organismos.map(function (o) { return persona(o, d); }).sort(porNombre);
    I.CACHE[CAT] = { lista: lista, fichero: FICHERO, cabecera: [] };
    return I.CACHE[CAT];
  }

  function hoyAaMmDd() { return U.aAaMmDd(U.hoyIso()); }

  async function copiaDelDia(textoAntes) {
    var g = window.App && App.E && App.E.gestor;
    if (!g || !textoAntes) return;
    var copias = await Carpetas.crear(g, 'copias');
    var nombre = 'administraciones-' + hoyAaMmDd() + '.json';
    if (!(await Carpetas.existeFichero(copias, nombre))) await Carpetas.escribirTexto(copias, nombre, textoAntes);
  }

  /* Leer-cambiar-escribir, en fila. `fn(d)` cambia `d` y puede devolver
     algo (o lanzar un Error con un mensaje en castellano: no se escribe nada). */
  function cambiar(dirDatos, fn) {
    var hacer = async function () {
      var textoAntes = await Carpetas.leerTexto(dirDatos, FICHERO);
      var d = limpio(textoAntes ? JSON.parse(textoAntes) : null);
      var r = await fn(d);
      var texto = JSON.stringify(d, null, 1);
      if (texto !== textoAntes) {
        try { await copiaDelDia(textoAntes); } catch (e) { /* la copia no para el guardado */ }
        await Carpetas.escribirTexto(dirDatos, FICHERO, texto);
      }
      cache = d;
      delete Datos._interno.CACHE[CAT];
      return r;
    };
    return window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer();
  }

  /* ---------- lo que se puede hacer ---------- */

  function error(texto) { var e = new Error(texto); e.name = 'DatoNoValido'; return e; }

  function comprobarCorto(d, corto, clase, codigo, idPropio) {
    if (!U.limpiarNombre(corto)) throw error('Hace falta el nombre corto.');
    if (clase === 'centro' && !/^\d{8}$/.test(String(codigo || '').replace(/\D/g, ''))) {
      throw error('El código de centro son 8 cifras.');
    }
    var nuevo = tercero({ corto: corto, clase: clase, codigoCentro: codigo });
    d.organismos.forEach(function (o) {
      if (o.id === idPropio) return;
      if (U.normalizar(tercero(o)) === U.normalizar(nuevo) ||
          (clase !== 'centro' && o.clase !== 'centro' && U.normalizar(o.corto) === U.normalizar(corto))) {
        throw error('Ya hay uno que se llama «' + tercero(o) + '».');
      }
      if (clase === 'centro' && o.clase === 'centro' && String(o.codigoCentro) === String(codigo).replace(/\D/g, '')) {
        throw error('Ese código de centro ya es de «' + tercero(o) + '».');
      }
    });
  }

  /* El id de «Depende de» a partir de su nombre: el que ya exista con
     ese nombre (o con ese nombre de antes) o uno nuevo. */
  function superiorPorNombre(d, nombre) {
    var n = U.normalizar(nombre || '');
    if (!n) return '';
    var ya = d.superiores.filter(function (s) { return U.normalizar(s.nombre) === n; })[0];
    if (ya) return ya.id;
    var s = { id: idNuevo('sup'), nombre: String(nombre).trim(), antes: [] };
    d.superiores.push(s);
    return s.id;
  }

  function departamentoNuevo(datos) {
    return { id: idNuevo('dep'), nombre: String(datos.nombre || '').trim(), correo: datos.correo || '',
             telefono: datos.telefono || '', contacto: datos.contacto || '', dir3: datos.dir3 || '', hijos: [] };
  }

  /* Alta. `datos`: { clase, corto, oficial, dir3, codigoCentro,
     superior (nombre), correo, telefono, direccion }. Devuelve el organismo. */
  function alta(dirDatos, datos) {
    return cambiar(dirDatos, function (d) {
      var clase = datos.clase === 'centro' ? 'centro' : 'organismo';
      var codigo = String(datos.codigoCentro || '').replace(/\D/g, '');
      comprobarCorto(d, datos.corto, clase, codigo, null);
      var o = {
        id: idNuevo('org'), clase: clase, corto: U.limpiarNombre(datos.corto), oficial: datos.oficial || '',
        dir3: clase === 'centro' ? '' : (datos.dir3 || ''), codigoCentro: clase === 'centro' ? codigo : '',
        superior: superiorPorNombre(d, datos.superior), correo: datos.correo || '', telefono: datos.telefono || '',
        direccion: datos.direccion || '', antes: [], departamentos: []
      };
      if (clase === 'centro') {
        o.departamentos = DEPARTAMENTOS_DE_CENTRO.map(function (n) { return departamentoNuevo({ nombre: n }); });
      }
      d.organismos.push(o);
      return o;
    });
  }

  /* Cambiar los datos de uno. Guarda el nombre oficial de antes en
     «Antes», y el «Depende de» de antes si se cambia a otro. Devuelve
     { organismo, cortoAntes, terceroAntes, terceroDespues }. */
  function cambiarDatos(dirDatos, id, datos) {
    return cambiar(dirDatos, function (d) {
      var o = organismoPorId(d, id);
      if (!o) throw error('Ya no está en la lista.');
      var terceroAntes = tercero(o);
      var clase = o.clase;
      var codigo = datos.codigoCentro !== undefined ? String(datos.codigoCentro).replace(/\D/g, '') : o.codigoCentro;
      var corto = datos.corto !== undefined ? datos.corto : o.corto;
      comprobarCorto(d, corto, clase, codigo, o.id);
      if (datos.oficial !== undefined && datos.oficial !== o.oficial && o.oficial) {
        o.antes = o.antes || [];
        o.antes.push({ nombre: o.oficial, hasta: hoy() });
      }
      if (datos.superior !== undefined) {
        var nuevoSup = superiorPorNombre(d, datos.superior);
        if (nuevoSup !== (o.superior || '') && o.superior) {
          var viejo = superiorPorId(d, o.superior);
          if (viejo) { o.antes = o.antes || []; o.antes.push({ nombre: viejo.nombre, hasta: hoy() }); }
        }
        o.superior = nuevoSup;
      }
      ['oficial', 'dir3', 'correo', 'telefono', 'direccion'].forEach(function (k) {
        if (datos[k] !== undefined) o[k] = datos[k];
      });
      o.corto = U.limpiarNombre(corto);
      if (clase === 'centro') o.codigoCentro = codigo;
      return { organismo: o, terceroAntes: terceroAntes, terceroDespues: tercero(o) };
    });
  }

  /* Cambiar el nombre de un «Depende de»: cambia en todos sus organismos. */
  function renombrarSuperior(dirDatos, id, nombre) {
    return cambiar(dirDatos, function (d) {
      var s = superiorPorId(d, id);
      if (!s) throw error('Ya no está en la lista.');
      nombre = String(nombre || '').trim();
      if (!nombre || nombre === s.nombre) return s;
      s.antes = s.antes || [];
      s.antes.push({ nombre: s.nombre, hasta: hoy() });
      s.nombre = nombre;
      return s;
    });
  }

  /* El árbol: añadir (bajo `padreId`, o arriba del todo si es null), cambiar y quitar. */
  function anadirDepartamento(dirDatos, idOrg, padreId, datos) {
    return cambiar(dirDatos, function (d) {
      var o = organismoPorId(d, idOrg);
      if (!o) throw error('Ya no está en la lista.');
      if (!String(datos.nombre || '').trim()) throw error('Hace falta el nombre del departamento.');
      var dep = departamentoNuevo(datos);
      var padre = padreId ? departamentoPorId(o, padreId) : null;
      if (padreId && !padre) throw error('Ese departamento ya no está.');
      (padre ? (padre.hijos = padre.hijos || []) : (o.departamentos = o.departamentos || [])).push(dep);
      return dep;
    });
  }

  function cambiarDepartamento(dirDatos, idOrg, idDep, datos) {
    return cambiar(dirDatos, function (d) {
      var dep = departamentoPorId(organismoPorId(d, idOrg), idDep);
      if (!dep) throw error('Ese departamento ya no está.');
      ['nombre', 'correo', 'telefono', 'contacto', 'dir3'].forEach(function (k) {
        if (datos[k] !== undefined) dep[k] = String(datos[k]).trim();
      });
      if (!dep.nombre) throw error('Hace falta el nombre del departamento.');
      return dep;
    });
  }

  function quitarDepartamento(dirDatos, idOrg, idDep) {
    return cambiar(dirDatos, function (d) {
      var o = organismoPorId(d, idOrg);
      return o ? quitarDelArbol(o.departamentos, idDep) : null;
    });
  }

  /* Quita un organismo de la lista (no toca carpetas). */
  function quitar(dirDatos, id) {
    return cambiar(dirDatos, function (d) {
      d.organismos = d.organismos.filter(function (o) { return o.id !== id; });
    });
  }

  /* ---------- en un asunto ---------- */

  /* El organismo de un asunto, por su tercero (lo leído en memoria). */
  function organismoDelAsunto(a) {
    var f = (a && a.ficha) || {};
    var categoria = f.categoria || (a && a.leido && a.leido.categoria) || '';
    if (categoria !== CAT) return null;
    var t = f.tercero || '';
    var d = enMemoria();
    return d.organismos.filter(function (o) { return tercero(o) === t; })[0] || null;
  }

  /* El correo que se propone en Correo: el del departamento elegido y,
     si no tiene, el del organismo. */
  function correoDelAsunto(a) {
    var o = organismoDelAsunto(a);
    if (!o) return '';
    var dep = a.ficha && a.ficha.departamento;
    var vivo = dep && dep.id ? departamentoPorId(o, dep.id) : null;
    return (vivo && vivo.correo) || (dep && dep.correo) || o.correo || '';
  }

  /* Los huecos de plantilla nuevos: {departamento}, {departamentocorreo}, {organismooficial}. */
  function valoresDe(a) {
    var o = organismoDelAsunto(a);
    var dep = a && a.ficha && a.ficha.departamento;
    var vivo = o && dep && dep.id ? departamentoPorId(o, dep.id) : null;
    return {
      departamento: (vivo && vivo.nombre) || (dep && dep.nombre) || '',
      departamentocorreo: (vivo && vivo.correo) || (dep && dep.correo) || '',
      organismooficial: o ? (o.oficial || o.corto) : ''
    };
  }

  /* Lo que se guarda en la ficha del asunto: el nombre copiado, para
     que se lea aunque luego se quite del árbol. */
  function departamentoParaFicha(o, idDep) {
    var dep = idDep ? departamentoPorId(o, idDep) : null;
    return dep ? { id: dep.id, nombre: dep.nombre, correo: dep.correo || '' } : null;
  }

  /* El organismo de un correo (la bandeja de Gmail): primero, el que
     tenga esa misma dirección (la suya o la de un departamento); si no,
     el único cuyo dominio coincida (un dominio compartido por varios,
     como el de la Junta, no decide nada). */
  function porDominio(lista, correos) {
    var exactos = (correos || []).map(function (c) { return String(c || '').trim().toLowerCase(); }).filter(Boolean);
    var porCorreo = (lista || []).filter(function (p) {
      return (p.correosTodos || []).some(function (c) { return exactos.indexOf(c) !== -1; });
    });
    if (porCorreo.length === 1) return porCorreo[0];
    var dominios = (correos || []).map(function (c) {
      var m = String(c || '').toLowerCase().match(/@([^\s>]+)$/);
      return m ? m[1] : '';
    }).filter(Boolean);
    if (!dominios.length) return null;
    var hallados = (lista || []).filter(function (p) {
      return (p.dominios || []).some(function (dm) { return dominios.indexOf(dm) !== -1; });
    });
    return hallados.length === 1 ? hallados[0] : null;
  }

  /* ---------- dos ordenadores: la copia en conflicto ---------- */

  function unirPorIdSimple(a, b, unirUno) {
    var porId = {}, orden = [];
    (a || []).concat(b || []).forEach(function (x) {
      if (!x || !x.id) return;
      if (!porId[x.id]) { porId[x.id] = x; orden.push(x.id); return; }
      if (unirUno) porId[x.id] = unirUno(porId[x.id], x);
    });
    return orden.map(function (id) { return porId[id]; });
  }

  function unirAntes(a, b) {
    var vistos = {}, salida = [];
    (a || []).concat(b || []).forEach(function (x) {
      var k = x.nombre + '|' + x.hasta;
      if (!vistos[k]) { vistos[k] = true; salida.push(x); }
    });
    return salida;
  }

  function unirDeps(a, b) {
    return unirPorIdSimple(a, b, function (x, y) {
      return Object.assign({}, x, { hijos: unirDeps(x.hijos, y.hijos) });
    });
  }

  /* Función pura: une dos administraciones.json (el real manda en lo que
     choca; no se pierde ningún organismo, departamento ni nombre anterior). */
  function unirDatos(real, otro) {
    real = limpio(real); otro = limpio(otro);
    return {
      superiores: unirPorIdSimple(real.superiores, otro.superiores, function (x, y) {
        return Object.assign({}, x, { antes: unirAntes(x.antes, y.antes) });
      }),
      organismos: unirPorIdSimple(real.organismos, otro.organismos, function (x, y) {
        return Object.assign({}, x, { antes: unirAntes(x.antes, y.antes), departamentos: unirDeps(x.departamentos, y.departamentos) });
      })
    };
  }

  Datos.registrarFuente(CAT, cargar);

  /* Leído una vez al entrar, para lo que se pinta sin esperar (el
     desplegable del departamento al editar). Nunca con un guardado en marcha. */
  if (window.Gestor && Gestor.alRefrescar) {
    Gestor.alRefrescar.push(function () {
      if (cache || !window.App || !App.E || !App.E.datos) return;
      if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
      leer(App.E.datos).catch(function () { /* a la siguiente */ });
    });
  }

  return {
    CATEGORIA: CAT, FICHERO: FICHERO, DEPARTAMENTOS_DE_CENTRO: DEPARTAMENTOS_DE_CENTRO,
    leer: leer, enMemoria: enMemoria, cargar: cargar, cambiar: cambiar,
    alta: alta, cambiarDatos: cambiarDatos, renombrarSuperior: renombrarSuperior, quitar: quitar,
    anadirDepartamento: anadirDepartamento, cambiarDepartamento: cambiarDepartamento,
    quitarDepartamento: quitarDepartamento,
    tercero: tercero, persona: persona, agrupar: agrupar, pie: pie, aplanar: aplanar,
    organismoPorId: organismoPorId, superiorPorId: superiorPorId, departamentoPorId: departamentoPorId,
    organismoDelAsunto: organismoDelAsunto, correoDelAsunto: correoDelAsunto, valoresDe: valoresDe,
    departamentoParaFicha: departamentoParaFicha, porDominio: porDominio, unirDatos: unirDatos
  };
})();
window.Administraciones = Administraciones;
