/* ============================================================
   datos.js — de dónde salen los terceros.

   Alumnado: del RegAlum.csv de Séneca, que se deja en
             _GESTOR/datos.
   Personal: del RelPerCen.csv de Séneca, que se deja en la misma
             carpeta, más un personal.csv a mano para quien no
             aparece en Séneca (conserjería, administración,
             limpieza, empresas de servicios…).
   Empresas y otros: de dos CSV que mantiene la propia aplicación,
             en la misma carpeta.
   ============================================================ */
var Datos = (function () {

  var CACHE = {};   /* lo leído en esta sesión, para no releer 10 MB cada vez */

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
     cambiar nada de lo que hace. Aquí, leer CSV, las listas de la propia
     aplicación y la caché; el alumnado, en js/datos-alumnado.js; el
     personal, en js/datos-personal.js; los resúmenes y la foto del
     contacto, en js/datos-resumen.js; escribir las listas, en
     js/datos-listas.js (fila 130). Se hablan por `Datos._interno` (I). */
  var I = {};

  /* ---------- lectura de CSV ---------- */

  function partirLinea(linea, sep) {
    var campos = [], actual = '', dentro = false;
    for (var i = 0; i < linea.length; i++) {
      var c = linea.charAt(i);
      if (dentro) {
        if (c === '"') {
          if (linea.charAt(i + 1) === '"') { actual += '"'; i++; }
          else dentro = false;
        } else actual += c;
      } else {
        if (c === '"') dentro = true;
        else if (c === sep) { campos.push(actual); actual = ''; }
        else actual += c;
      }
    }
    campos.push(actual);
    return campos;
  }

  function aTabla(texto) {
    texto = String(texto || '').replace(/^﻿/, '');
    var lineas = texto.split(/\r?\n/);
    var primera = '';
    for (var i = 0; i < lineas.length; i++) { if (lineas[i].trim()) { primera = lineas[i]; break; } }
    var sep = (primera.split(';').length - 1) > (primera.split(',').length - 1) ? ';' : ',';
    var tabla = [];
    for (var j = 0; j < lineas.length; j++) {
      if (!lineas[j].trim()) continue;
      tabla.push(partirLinea(lineas[j], sep));
    }
    return { filas: tabla, sep: sep };
  }

  function aCsv(cabecera, filas) {
    function campo(v) {
      var t = String(v === null || v === undefined ? '' : v);
      return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }
    var lineas = [cabecera.map(campo).join(';')];
    for (var i = 0; i < filas.length; i++) lineas.push(filas[i].map(campo).join(';'));
    return lineas.join('\r\n') + '\r\n';
  }


  var LISTAS = {
    /* 'Documento de identidad' es del aspirante (17-sep-2026, fila 42):
       así se puede reconocer cuando llegue a matricularse, aunque
       todavía no tenga Nº de identificación escolar. Es opcional, igual
       que el Nº: muchos aspirantes lo traen ya (vienen del sistema
       educativo andaluz), los que no, lo tendrán al matricularse. */
    ALUMNADO: { fichero: 'solicitantes.csv',
                cabecera: ['Nombre', 'Documento de identidad', 'Nº Id. Escolar',
                           'Fecha de nacimiento', 'Teléfono de contacto', 'Correo de contacto',
                           'Curso de alta'] },
    PERSONAL: { fichero: 'personal.csv',
                cabecera: ['Nombre', 'Documento', 'Puesto', 'Teléfono', 'Correo'] },
    /* El nombre comercial es el rótulo del negocio, que muchas veces no
       tiene nada que ver con la razón social: "Papelería La Pluma Azul"
       de un autónomo que se llama Antonio Prueba Inventado. Se busca por
       los dos. En el nombre de la carpeta sigue mandando la razón
       social, que es la que viene en las facturas. */
    EMPRESAS: { fichero: 'empresas.csv',
                cabecera: ['Razón social', 'Nombre comercial', 'NIF',
                           'Contacto', 'Teléfono', 'Correo'] },
    OTROS:    { fichero: 'otros.csv',
                cabecera: ['Nombre', 'Referencia', 'Teléfono', 'Correo'] },
    /* Los tutores legales (fila 166, js/tutores-legales.js) salen del
       RegAlum; este fichero solo guarda la foto de los que ya son
       tercero de algún asunto, para que no desaparezcan si su hijo deja
       el centro. Sin alta a mano (`sinAlta`). */
    'TUTORES LEGALES': { fichero: 'tutores.csv', sinAlta: true,
                cabecera: ['Nombre', 'Documento', 'Teléfono', 'Teléfono 2', 'Correo', 'Correo 2',
                           'Domicilio', 'Hijos'] }
  };

  /* Categorías cuya lista monta otro módulo (fila 166): `registrarFuente
     (categoria, fn)`, con `fn(dirDatos)` -> { lista, fichero, cabecera }.
     Es el punto previsto para una categoría nueva, sin envolver `cargar`. */
  var FUENTES = {};
  function registrarFuente(categoria, fn) { FUENTES[categoria] = fn; }

  /* El valor de una columna buscándola por su título en la cabecera del
     propio fichero. Si ese título no está, se cae al sitio de reserva
     que se le indique; con -1 devuelve cadena vacía. Así un fichero
     viejo, con las columnas en otro orden, se sigue leyendo bien. */
  function porTitulo(cab, fila, titulo, sitioDeReserva) {
    var i = cab.indexOf(titulo);
    if (i === -1) i = sitioDeReserva;
    if (i < 0) return '';
    return String(fila[i] === undefined ? '' : fila[i]).trim();
  }

  /* clave por defecto === categoria. Se usa otra ('ALUMNADO_MANUAL',
     'PERSONAL_MANUAL') para las altas a mano de alumnado y personal,
     que conviven con su fichero de Séneca sin pisarlo.

     Desde el 11-sep-2026 se guarda también `cabecera`: la cabecera de
     verdad del fichero (o la de fábrica, si el fichero todavía no
     existe). La usa js/campos.js para ofrecer, en Ajustes, qué
     columnas de personal.csv, empresas.csv u otros.csv se pueden
     asociar a un tipo de asunto: se lee del fichero, no de una lista
     escrita a mano en el código. */
  async function cargarLista(dirDatos, categoria, clave) {
    clave = clave || categoria;
    if (CACHE[clave]) return CACHE[clave];
    var def = LISTAS[categoria];
    var texto = await Carpetas.leerTexto(dirDatos, def.fichero);
    var lista = [];
    var cab = def.cabecera;
    if (texto === null) {
      await Carpetas.escribirTexto(dirDatos, def.fichero, aCsv(def.cabecera, []));
    } else {
      var t = aTabla(texto);
      cab = t.filas.length ? t.filas[0].map(function (x) { return String(x).trim(); }) : def.cabecera;
      for (var f = 1; f < t.filas.length; f++) {
        var fila = t.filas[f];
        var campos = {};
        for (var c = 0; c < cab.length; c++) {
          var v = String(fila[c] === undefined ? '' : fila[c]).trim();
          if (v) campos[cab[c]] = v;
        }
        var nombre = String(fila[0] || '').trim();
        if (!nombre) continue;
        /* La segunda columna se lee POR SU TÍTULO, no por su sitio. Los
           ficheros escritos antes de que existiera el nombre comercial
           tienen el NIF en la segunda columna; los nuevos, en la
           tercera. Leerlo por el título vale para los dos. */
        var doc = porTitulo(cab, fila, 'Documento', 1);
        var nif = porTitulo(cab, fila, 'NIF', 1);
        var ref = porTitulo(cab, fila, 'Referencia', 1);
        var comercial = porTitulo(cab, fila, 'Nombre comercial', -1);
        lista.push({
          nombre: nombre,
          documento: categoria === 'PERSONAL' ? doc : '',
          nif: categoria === 'EMPRESAS' ? nif : '',
          referencia: categoria === 'OTROS' ? ref : '',
          comercial: categoria === 'EMPRESAS' ? comercial : '',
          campos: campos, categoria: categoria, deSeneca: false,
          enElCentro: true, fechaCese: '', puesto: campos['Puesto'] || '',
          busca: U.normalizar([nombre, doc, nif, ref, comercial,
                               campos['Puesto'] || ''].join(' '))
        });
      }
    }
    lista.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    CACHE[clave] = { lista: lista, fichero: def.fichero, cabecera: cab };
    return CACHE[clave];
  }

  async function cargar(dirDatos, categoria) {
    if (categoria === 'ALUMNADO') return I.cargarAlumnado(dirDatos);
    if (categoria === 'PERSONAL') return I.cargarPersonal(dirDatos);
    if (FUENTES[categoria]) return FUENTES[categoria](dirDatos);
    return cargarLista(dirDatos, categoria);
  }

  function buscar(lista, texto, tope) {
    var q = U.normalizar(texto);
    if (q.length < 2) return [];
    var trozos = q.split(' ').filter(function (x) { return x; });
    var salida = [];
    for (var i = 0; i < lista.length && salida.length < (tope || 40); i++) {
      var vale = true;
      for (var k = 0; k < trozos.length; k++) {
        if (lista[i].busca.indexOf(trozos[k]) === -1) { vale = false; break; }
      }
      if (vale) salida.push(lista[i]);
    }
    return salida;
  }

  function olvidar(categoria) {
    /* Se vacía el mismo objeto (no uno nuevo): js/datos-listas.js lo tiene cogido (fila 130). */
    if (!categoria) { Object.keys(CACHE).forEach(function (k) { delete CACHE[k]; }); return; }
    delete CACHE[categoria];
    delete CACHE[categoria + '_MANUAL'];
  }

  /* Las unidades distintas de ESTE curso, para poder enseñar en Ajustes
     cómo queda abreviada cada una. */

  /* ---------- los solicitantes de cursos anteriores (fila 66, 2.4)
     ----------

     `solicitantes.csv` no se limpia nunca solo: arrastraría a todos los
     aspirantes de todos los cursos. Se apartan (no se borran) a
     `solicitantes-anteriores.csv` los que se dieron de alta en un curso
     que no es el de hoy. */
  var FICHERO_SOLICITANTES_ANTERIORES = 'solicitantes-anteriores.csv';

  function esDeCursoAnterior(campos) {
    var curso = String((campos && campos['Curso de alta']) || '').trim();
    return curso !== '' && curso !== U.cursoActual();
  }

  async function contarSolicitantesAnteriores(dirDatos) {
    var actual = await cargarLista(dirDatos, 'ALUMNADO', 'ALUMNADO_MANUAL');
    return actual.lista.filter(function (p) { return esDeCursoAnterior(p.campos); }).length;
  }

  Object.assign(I, {
    CACHE: CACHE, aTabla: aTabla, cargarLista: cargarLista, esDeCursoAnterior: esDeCursoAnterior,
    FICHERO_SOLICITANTES_ANTERIORES: FICHERO_SOLICITANTES_ANTERIORES
  });

  return {
    aTabla: aTabla, aCsv: aCsv, cargar: cargar,
    buscar: buscar, olvidar: olvidar, LISTAS: LISTAS, registrarFuente: registrarFuente,
    contarSolicitantesAnteriores: contarSolicitantesAnteriores,
    /* Lo que necesitan los demás ficheros de Datos (filas 130 y 133). */
    _interno: I
  };
})();
