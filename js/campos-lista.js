/* ============================================================
   campos-lista.js — la lista única de campos (fila 528, 5-nov-2026,
   docs/528-LISTA-DE-CAMPOS.md; tema 518).

   Hoy los datos que usan las plantillas viven en cuatro sitios: los
   huecos de `Plantillas.HUECOS`, el catálogo de `Campos` (columnas de
   los ficheros, calculados y propios), las tablas de datos
   ({DATO tabla: columna}) y los `{campo:Nombre}` escritos a mano. Aquí
   se reúnen en una sola lista, una línea por dato, con su grupo, de
   dónde sale (origen, tabla y columna) y dónde se usa. No mueve ningún
   dato ni cambia la forma de las marcas de las plantillas.

   `reunir(entrada)` es una función pura (sin disco ni pantalla):

     entrada = {
       huecos:   [{ clave, etiqueta }],          Plantillas.HUECOS
       bd:       [{ clave, etiqueta }],          AlumnadoBDVer.huecos()
       tablas:   [{ nombre, columnas: [..] }],   tablas de datos con sus columnas
       cabeceras:{ ALUMNADO: [..], PERSONAL: [..] },  columnas de los ficheros
       config:   Campos.leer(): propios, calculados, porTipo
       textos:   [{ donde, texto }],             textos de las plantillas
       ficheros: { ALUMNADO: 'RegAlum…csv' }     opcional
     }

   Cada campo: { id, nombre, grupo, origen, tabla, columna, marca,
   clases: ['ALUMNADO'…] ([] = vale para todos), clase, opciones,
   propioId, calculadoId, usos: [..], dondeSePide: [..] }.
   ============================================================ */
var CamposLista = (function () {

  var GRUPOS = ['Persona', 'Tutores', 'Asunto', 'Centro', 'Firmantes'];
  var ORIGENES = ['Centro de datos', 'El asunto', 'Ajustes del centro', 'Tabla de datos', 'Calculado', 'Manual'];
  var CLASES_PERSONA = { ALUMNADO: 'alumnado', PERSONAL: 'personal', EMPRESAS: 'empresas', OTROS: 'otros' };
  var AL = ['ALUMNADO'];

  /* Los huecos de siempre: [grupo, origen, tabla, columna, clases]. Sin entrada: «Asunto» · «El asunto». */
  var MAPA = {
    nombre: ['Persona', 'Centro de datos', 'RegAlum o RelPerCen', 'Alumno/a o Empleado/a'],
    nombreNatural: ['Persona', 'Centro de datos', 'RegAlum o RelPerCen', 'Alumno/a o Empleado/a'],
    grupo: ['Persona', 'Centro de datos', 'RegAlum', 'Unidad', AL],
    referencia: ['Persona', 'Centro de datos', 'RegAlum', 'Nº Id. Escolar', AL],
    dni: ['Persona', 'Centro de datos', 'RegAlum o RelPerCen', 'DNI/Pasaporte', ['ALUMNADO', 'PERSONAL']],
    telefono: ['Persona', 'Centro de datos', 'RegAlum o RelPerCen', 'Teléfono'],
    correo: ['Persona', 'Centro de datos', 'RegAlum o RelPerCen', 'Correo'],
    tutor1: ['Tutores', 'Centro de datos', 'RegAlum', 'Primer tutor', AL],
    tutor1telefono: ['Tutores', 'Centro de datos', 'RegAlum', 'Teléfono Primer tutor', AL],
    tutor1correo: ['Tutores', 'Centro de datos', 'RegAlum', 'Correo Primer tutor', AL],
    tutor2: ['Tutores', 'Centro de datos', 'RegAlum', 'Segundo tutor', AL],
    tutor2telefono: ['Tutores', 'Centro de datos', 'RegAlum', 'Teléfono Segundo tutor', AL],
    tutor2correo: ['Tutores', 'Centro de datos', 'RegAlum', 'Correo Segundo tutor', AL],
    firmante: ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Quien firma según el cargo'],
    'cargo firmante': ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Cargo'],
    'tratamiento firmante': ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Tratamiento'],
    'visto bueno': ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Quien da el visto bueno'],
    'cargo visto bueno': ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Cargo del visto bueno'],
    'tratamiento visto bueno': ['Firmantes', 'Ajustes del centro', 'Cargos del centro', 'Tratamiento del visto bueno'],
    especialidad: ['Persona', 'Centro de datos', 'RelPerCen', 'Puesto', ['PERSONAL']],
    'especialidad firmante': ['Firmantes', 'Centro de datos', 'RelPerCen', 'Puesto'],
    'especialidad visto bueno': ['Firmantes', 'Centro de datos', 'RelPerCen', 'Puesto'],
    consejeria: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Consejería'],
    usuario: ['Firmantes', 'Ajustes del centro', 'Ajustes del centro', 'Quien firma'],
    cargo: ['Firmantes', 'Ajustes del centro', 'Ajustes del centro', 'Cargo de quien firma'],
    firma: ['Firmantes', 'Ajustes del centro', 'Ajustes del centro', 'Firma'],
    centro: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Nombre del centro'],
    localidad: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Localidad'],
    provincia: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Provincia'],
    direccionCentro: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Dirección'],
    codigoCentro: ['Centro', 'Ajustes del centro', 'Ajustes del centro', 'Código del centro'],
    'telefono del centro': ['Centro', 'Centro de datos', 'Datos del centro', 'Teléfono'],
    'correo del centro': ['Centro', 'Centro de datos', 'Datos del centro', 'Correo común']
  };

  function norm(t) { return window.U && U.normalizar ? U.normalizar(String(t || '')) : String(t || '').toLowerCase(); }
  function marcaDeClave(clave) { return '{' + clave + '}'; }
  function marcaDeCampo(nombre) { return '{campo:' + nombre + '}'; }

  /* Estas dos no son un campo: son el modelo de cómo se escribe una marca a mano, y ya no se escribe a mano. */
  var MODELOS = ['{DATO tabla: columna}', '{TABLA tabla: columna | columna}'];

  function deHueco(h) {
    var m = MAPA[h.clave] || ['Asunto', 'El asunto', 'Ficha del asunto', h.etiqueta];
    return { id: 'h:' + h.clave, nombre: h.etiqueta, grupo: m[0], origen: m[1], tabla: m[2], columna: m[3],
      marca: marcaDeClave(h.clave), clases: m[4] || [] };
  }

  /* Los {DATO tabla: columna} y {TABLA tabla}: del Centro de datos o de las tablas de datos. */
  function deDato(h) {
    var m = /^\{?(DATO|TABLA)\s+(.+?)(?::\s*(.*))?\}?$/.exec(String(h.clave).replace(/^\{|\}$/g, ''));
    var tabla = m ? m[2] : '', columna = m && m[3] ? m[3] : '';
    var esTabla = m && m[1] === 'TABLA';
    return { id: 'd:' + h.clave, nombre: h.etiqueta, grupo: 'Persona', origen: 'Tabla de datos', tabla: tabla, columna: columna || (esTabla ? '(tabla entera)' : ''),
      marca: marcaDeClave(h.clave), clases: AL };
  }

  function deColumna(categoria, columna, fichero) {
    return { id: 'f:' + categoria + ':' + columna, nombre: columna, grupo: 'Persona', origen: 'Centro de datos',
      tabla: categoria === 'ALUMNADO' ? 'RegAlum' : (categoria === 'PERSONAL' ? 'RelPerCen' : categoria), columna: columna,
      marca: marcaDeCampo(columna), clases: [categoria], fichero: fichero || '' };
  }

  function grupoDeCalculado(c) {
    if (c.grupo && GRUPOS.indexOf(c.grupo) !== -1) return c.grupo;   /* fila 529: el que se eligió al crearlo */
    return (c.categorias || []).some(function (x) { return x === 'ALUMNADO' || x === 'PERSONAL'; }) ? 'Persona' : 'Asunto';
  }

  /* Los {campo:Nombre} de las plantillas que no son de ningún campo conocido: entran en la lista tal cual. */
  function camposEscritosAMano(textos, conocidos) {
    var vistos = {}, salida = [];
    (textos || []).forEach(function (t) {
      var re = /\{campo:([^}]+)\}/g, m;
      while ((m = re.exec(String(t.texto || '')))) {
        var n = m[1].trim(), k = norm(n);
        if (conocidos[k] || vistos[k]) continue;
        vistos[k] = true;
        salida.push({ id: 'a:' + k, nombre: n, grupo: 'Asunto', origen: 'Manual', tabla: 'Se escribe a mano', columna: '',
          marca: marcaDeCampo(n), clases: [], clase: 'texto', escritoAMano: true });
      }
    });
    return salida;
  }

  function usosDe(campo, textos, todos) {
    var usos = [];
    var marca = norm(campo.marca);
    (textos || []).forEach(function (t) { if (norm(t.texto).indexOf(marca) !== -1) usos.push(t.donde); });
    return usos;
  }

  /* [{ tipo, donde: 'crear' | 'general' | 'hito', hito: marca }]: una línea por tipo que usa el campo. */
  function detalleDeDonde(config, campo) {
    var salida = [];
    Object.keys(config.porTipo || {}).forEach(function (tipo) {
      (config.porTipo[tipo] || []).forEach(function (x) {
        var es = (campo.propioId && x.origen === 'propio' && x.id === campo.propioId) || (campo.calculadoId && x.origen === 'calculado' && x.id === campo.calculadoId);
        if (es) salida.push({ tipo: tipo, donde: x.hito ? 'hito' : (x.sinPedirAlCrear ? 'general' : 'crear'), hito: x.hito || '' });
      });
    });
    return salida;
  }

  /* La frase de una línea de `dondeDetalle`; `tituloDeHito`: el título del hito, si se sabe. */
  function textoDonde(d, tituloDeHito) {
    if (d.donde === 'hito') return d.tipo + ': hito «' + (tituloDeHito || 'del tipo') + '»';
    return d.tipo + ': ' + (d.donde === 'general' ? 'en la parte general, sin pedirlo al crear' : 'al crear el asunto');
  }

  function reunir(e) {
    e = e || {};
    var config = e.config || {};
    var lista = [], conocidos = {};
    function anadir(c) { lista.push(c); conocidos[norm(c.nombre)] = true; }

    (e.huecos || []).forEach(function (h) {
      if (MODELOS.indexOf(h.clave) !== -1) return;
      var c = /^\{(DATO|TABLA) /.test(h.clave) ? deDato(h) : deHueco(h);
      if (c.origen === 'Tabla de datos') c.clases = [];
      anadir(c);
    });
    (e.bd || []).forEach(function (h) { anadir(deDato(h)); });
    (e.tablas || []).forEach(function (t) {
      (t.columnas || []).forEach(function (col) {
        var clave = 'DATO ' + t.nombre + ': ' + col;
        if (lista.some(function (c) { return c.id === 'd:' + clave; })) return;
        lista.push({ id: 'd:' + clave, nombre: col + ' (' + t.nombre + ')', grupo: 'Persona', origen: 'Tabla de datos', tabla: t.nombre, columna: col,
          marca: marcaDeClave(clave), clases: [] });
      });
    });
    Object.keys(e.cabeceras || {}).forEach(function (cat) {
      (e.cabeceras[cat] || []).forEach(function (col) {
        if (!col) return;
        var c = deColumna(cat, col, (e.ficheros || {})[cat]);
        /* Una columna que ya sale con otro nombre (Unidad = Grupo, Nº Id. Escolar = Nº escolar…) no se repite. */
        var repetida = lista.some(function (x) { return x.origen === 'Centro de datos' && norm(x.columna) === norm(col) && x.tabla.indexOf(c.tabla) === 0; });
        if (!repetida) lista.push(c);
        conocidos[norm(col)] = true;
      });
    });
    ((config.calculados) || []).forEach(function (c) {
      anadir({ id: 'c:' + c.id, nombre: c.nombre, grupo: grupoDeCalculado(c), origen: 'Calculado', tabla: 'Se calcula', columna: 'de ' + ((c.origen && (c.origen.columna || c.origen.clase)) || '?'),
        marca: marcaDeCampo(c.nombre), clases: c.categorias || [], calculadoId: c.id });
    });
    ((config.propios) || []).forEach(function (p) {
      anadir({ id: 'p:' + p.id, nombre: p.nombre, grupo: GRUPOS.indexOf(p.grupo) !== -1 ? p.grupo : 'Asunto', origen: 'Manual', tabla: 'Se escribe a mano', columna: '',
        marca: marcaDeCampo(p.nombre), clases: [], clase: p.clase || 'texto', opciones: p.valores || [], propioId: p.id });
    });
    camposEscritosAMano(e.textos, conocidos).forEach(function (c) { lista.push(c); });

    lista.forEach(function (c) {
      c.usos = usosDe(c, e.textos, lista);
      c.dondeSePide = c.propioId && window.Campos ? Campos.tiposQueUsanPropio(config, c.propioId) : [];
      if (c.calculadoId && window.Campos) c.dondeSePide = Campos.tiposQueUsanCalculado(config, c.calculadoId);
      /* Fila 530: lo que hace cada tipo con el campo (al crear, en la parte general sin pedirlo al crear, o un hito). */
      c.dondeDetalle = detalleDeDonde(config, c);
      c.enTipos = c.dondeSePide.length;
      c.dondeSePide.forEach(function (t) { c.usos.push('Tipo de asunto «' + t + '»'); });
    });
    /* Los calculados que dependen de otro campo cuentan como uso de ese campo. */
    ((config.calculados) || []).forEach(function (c) {
      var base = c.origen && c.origen.columna ? norm(c.origen.columna) : '';
      if (!base) return;
      lista.forEach(function (x) { if (norm(x.nombre) === base && x.calculadoId !== c.id) x.usos.push('Campo calculado «' + c.nombre + '»'); });
    });
    return lista;
  }

  /* Se puede quitar solo un campo manual o calculado que nadie usa. */
  function sePuedeQuitar(c) {
    return !!(c.propioId || c.calculadoId) && !c.usos.length;
  }

  function dondeSePide(c) {
    if (c.origen !== 'Manual') return 'Sale solo';
    if (!c.enTipos) return 'Al usarlo';
    return c.enTipos === 1 ? 'En 1 tipo' : 'En ' + c.enTipos + ' tipos';
  }

  function camino(c) {
    if (c.origen === 'Centro de datos') return 'Centro de datos → ' + c.tabla + (c.columna ? ' → columna ' + c.columna : '');
    if (c.origen === 'Tabla de datos') return 'Tabla de datos → ' + c.tabla + (c.columna ? ' → columna ' + c.columna : '');
    if (c.origen === 'El asunto') return 'La ficha del asunto → ' + c.columna;
    if (c.origen === 'Ajustes del centro') return 'Ajustes → El centro → ' + c.columna;
    if (c.origen === 'Calculado') return 'Se calcula ' + c.columna;
    return 'Se escribe a mano';
  }

  function rutaCorta(c) {
    if (c.origen === 'Centro de datos' || c.origen === 'Tabla de datos') return c.tabla + (c.columna ? ' › ' + c.columna : '');
    if (c.origen === 'Calculado') return c.tabla + ' ' + c.columna;
    if (c.origen === 'Manual') return c.tabla;
    return '';
  }

  function sirveParaClase(c, categoria) { return !c.clases.length || !categoria || c.clases.indexOf(categoria) !== -1; }

  function buscar(lista, texto, grupo, origenOTabla) {
    var q = norm(texto);
    return lista.filter(function (c) {
      if (grupo && c.grupo !== grupo) return false;
      if (origenOTabla && c.origen !== origenOTabla && c.tabla !== origenOTabla) return false;
      return !q || norm(c.nombre + ' ' + c.tabla + ' ' + c.columna + ' ' + c.origen).indexOf(q) !== -1;
    });
  }

  return {
    GRUPOS: GRUPOS, ORIGENES: ORIGENES, CLASES_PERSONA: CLASES_PERSONA,
    reunir: reunir, textoDonde: textoDonde, sePuedeQuitar: sePuedeQuitar, dondeSePide: dondeSePide, camino: camino, rutaCorta: rutaCorta,
    sirveParaClase: sirveParaClase, buscar: buscar, marcaDeCampo: marcaDeCampo
  };
})();
window.CamposLista = CamposLista;
