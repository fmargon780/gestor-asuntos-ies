/* ============================================================
   datos-resumen.js — las unidades, los destacados de un tercero, la línea «Datos y contacto» y la foto del contacto.

   Sacado tal cual de js/datos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo compartido (la caché, leer CSV, cargarLista…) se pide a
   `Datos._interno` (I). Se carga justo detrás de js/datos.js.
   ============================================================ */
(function () {
  if (typeof Datos === 'undefined' || !Datos._interno) return;
  var I = Datos._interno;

  function unidadesDistintas(lista) {
    var vistas = {};
    for (var i = 0; i < lista.length; i++) {
      if (!lista[i].matriculado) continue;
      var u = String(lista[i].unidad || '').trim();
      if (!u || vistas[u]) continue;
      vistas[u] = { unidad: u, curso: lista[i].curso || '', cuantos: 0 };
    }
    for (var j = 0; j < lista.length; j++) {
      if (!lista[j].matriculado) continue;
      var v = String(lista[j].unidad || '').trim();
      if (vistas[v]) vistas[v].cuantos++;
    }
    var salida = Object.keys(vistas).map(function (k) { return vistas[k]; });
    salida.sort(function (a, b) { return a.unidad < b.unidad ? -1 : 1; });
    return salida;
  }

  /* Los datos de contacto que de verdad se consultan a diario, sacados
     del fichero de Séneca sin saber de antemano cómo se llaman sus columnas:
     se buscan por lo que dice el título de cada una. */
  function destacadosAlumno(alumno) {
    var fuera = {};
    var filas = [];

    function meter(titulo, valor) {
      if (valor === '' || valor === undefined || valor === null) return;
      filas.push({ titulo: titulo, valor: String(valor) });
    }

    var edad = U.edadDesde(alumno.fechaNac);
    if (edad !== '') meter('Edad actual', edad + ' años');
    if (alumno.fechaNac) { meter('Fecha de nacimiento', alumno.fechaNac); fuera['fecha de nacimiento'] = true; }

    if (alumno.matriculado) {
      meter('Matrícula', 'Matriculado en el curso ' + U.cursoDeAno(alumno.ano));
      if (alumno.unidad) meter('Grupo', alumno.unidad);
      if (alumno.curso) meter('Curso', alumno.curso);
    } else if (alumno.solicitante) {
      meter('Matrícula', 'Solicitante  ·  todavía sin matricular');
      if (!alumno.id) meter('Nº Id. Escolar', 'Todavía no lo tiene');
    } else {
      meter('Matrícula', 'No está matriculado este curso');
      if (alumno.anoUltima) {
        meter('Última matrícula', U.cursoDeAno(alumno.anoUltima) +
          (alumno.cursoUltima ? '  ·  ' + alumno.cursoUltima : '') +
          (alumno.unidadUltima ? '  ·  ' + alumno.unidadUltima : ''));
      }
    }

    var claves = Object.keys(alumno.campos);
    /* Primero todo lo que hable de tutores o de la familia. */
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (fuera[t]) continue;
      if (/tutor|padre|madre|responsable|familia/.test(t)) {
        meter(claves[i], alumno.campos[claves[i]]);
        fuera[t] = true;
      }
    }
    /* Después los teléfonos y correos que queden, y el domicilio. */
    for (var j = 0; j < claves.length; j++) {
      var t2 = U.normalizar(claves[j]);
      if (fuera[t2]) continue;
      if (/telefono|movil|correo|e-?mail|domicilio|direccion|localidad/.test(t2)) {
        meter(claves[j], alumno.campos[claves[j]]);
        fuera[t2] = true;
      }
    }

    var resto = [];
    for (var k = 0; k < claves.length; k++) {
      if (!fuera[U.normalizar(claves[k])]) {
        resto.push({ titulo: claves[k], valor: alumno.campos[claves[k]] });
      }
    }
    return { destacados: filas, resto: resto };
  }

  /* La ficha de una persona del centro. Arriba lo que se consulta a
     diario: qué puesto ocupa, si sigue en el centro y cómo se le
     localiza. Abajo, el resto de columnas del fichero de Séneca. */
  function destacadosPersona(persona) {
    var fuera = {};
    var filas = [];

    function meter(titulo, valor) {
      if (valor === '' || valor === undefined || valor === null) return;
      filas.push({ titulo: titulo, valor: String(valor) });
    }

    if (persona.documento) meter('DNI', persona.documento);

    if (persona.puesto) { meter('Puesto', persona.puesto); fuera['puesto'] = true; }

    if (persona.enElCentro) {
      meter('Situación', persona.fechaCese
        ? 'En el centro hasta el ' + persona.fechaCese
        : 'En el centro');
    } else if (persona.esteCurso) {
      meter('Situación', 'Ya no está en el centro' +
        (persona.fechaCese ? '  ·  cesó el ' + persona.fechaCese : ''));
    } else {
      meter('Situación', 'Ya no está en el centro' +
        (persona.cursoUltimo ? '  ·  su último curso aquí fue el ' + persona.cursoUltimo : ''));
    }
    fuera['fecha de cese'] = true;

    if (persona.cursos && persona.cursos.length > 1) {
      meter('Cursos en el centro', persona.cursos.join(', '));
    }

    var claves = Object.keys(persona.campos);
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (fuera[t]) continue;
      if (/telefono|movil|correo|e-?mail|cuenta/.test(t)) {
        meter(claves[i], persona.campos[claves[i]]);
        fuera[t] = true;
      }
    }

    var resto = [];
    for (var k = 0; k < claves.length; k++) {
      if (!fuera[U.normalizar(claves[k])]) {
        resto.push({ titulo: claves[k], valor: persona.campos[claves[k]] });
      }
    }
    /* Que no se repita abajo: la misma comparación por valor que hace
       js/dni.js con el alumnado, para que valga tanto para la columna
       DNI/Pasaporte de Séneca como para Documento de personal.csv. */
    if (persona.documento) {
      resto = resto.filter(function (f) {
        return String(f.valor).trim() !== persona.documento;
      });
    }
    return { destacados: filas, resto: resto };
  }

  /* ---------- los tutores legales, agrupados por persona ----------

     Viven en js/datos-tutores.js (fila 108, 24-sep-2026), que publica
     `Datos.tutoresDe`: este fichero ya pasaba de 1.000 líneas. */

  /* ---------- la línea resumen de "Datos y contacto" (17-sep-2026,
     fila 37, 3) ---------- */

  /* El teléfono propio de alguien (no el de un tutor): la primera
     columna de teléfono o móvil que NO hable de tutores ni de familia. */
  function telefonoPropio(persona) {
    var campos = (persona && persona.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      var t = U.normalizar(claves[i]);
      if (/tutor|padre|madre|responsable|familia/.test(t)) continue;
      if (!/telefono|movil/.test(t)) continue;
      var valor = String(campos[claves[i]] || '').trim();
      if (valor) return valor;
    }
    return '';
  }

  var EDAD_MAYORIA = 18;

  /* Datos.resumenDeTercero(persona, categoria) -> los datos de la línea
     "Datos y contacto": nombre, grupo o etiqueta de estado, edad, un
     solo teléfono (etiquetado) y documento. Pura: no toca el DOM. El
     aviso de DNI que falta lo sigue decidiendo `js/dni.js`
     (`window.Dni`, si está cargado), sin duplicar esa cuenta aquí. */
  function resumenDeTercero(persona, categoria) {
    var r = { nombre: '', grupo: null, edad: '', telefono: null, documento: null };
    if (!persona) return r;

    if (categoria === 'ALUMNADO') {
      r.nombre = persona.nombre || '';
      var edad = U.edadDesde(persona.fechaNac);
      if (edad !== '') r.edad = edad + ' años';

      if (persona.matriculado) {
        r.grupo = { texto: persona.unidad || persona.curso || '', clase: '' };
      } else if (persona.solicitante) {
        r.grupo = { texto: 'SOLICITANTE', clase: 'azul' };
      } else {
        var detalle = persona.anoUltima
          ? 'última matrícula: ' + U.cursoDeAno(persona.anoUltima) +
            (persona.unidadUltima ? ' · ' + persona.unidadUltima : '')
          : '';
        r.grupo = { texto: 'NO MATRICULADO ' + U.cursoActual(), clase: 'ambar', detalle: detalle };
      }

      var esMenor = edad !== '' && edad < EDAD_MAYORIA;
      if (esMenor) {
        var tutores = Datos.tutoresDe(persona);
        var primero = tutores[0];
        if (primero && primero.telefonos.length) {
          r.telefono = { valor: primero.telefonos[0], etiqueta: 'Tutor legal ' + primero.numero };
        }
      } else {
        var propio = telefonoPropio(persona);
        if (propio) r.telefono = { valor: propio, etiqueta: '' };
      }

      var doc = window.Dni ? window.Dni.de(persona) : '';
      var falta = window.Dni ? window.Dni.falta(persona) : false;
      if (doc) r.documento = { valor: doc, falta: false };
      else if (falta) r.documento = { valor: '', falta: true, edad: edad };
    } else if (categoria === 'PERSONAL') {
      r.nombre = persona.nombre || '';
      if (persona.enElCentro) {
        r.grupo = { texto: persona.puesto || '', clase: '' };
      } else {
        var detallePersonal = persona.cursoUltimo ? 'último curso aquí: ' + persona.cursoUltimo : '';
        r.grupo = { texto: 'YA NO ESTÁ', clase: 'ambar', detalle: detallePersonal };
      }
      var telPersonal = telefonoPropio(persona);
      if (telPersonal) r.telefono = { valor: telPersonal, etiqueta: '' };
      if (persona.documento) r.documento = { valor: persona.documento, falta: false };
    } else {
      /* Empresas y otros: nombre, el nombre comercial o la referencia en
         el sitio del grupo, un teléfono y el NIF o el documento. */
      r.nombre = (categoria === 'EMPRESAS' ? persona.nombre : persona.nombre) || '';
      var otro = (categoria === 'EMPRESAS' ? persona.comercial : persona.referencia) || '';
      if (otro) r.grupo = { texto: otro, clase: '' };
      var telOtro = telefonoPropio(persona);
      if (telOtro) r.telefono = { valor: telOtro, etiqueta: '' };
      var docOtro = (categoria === 'EMPRESAS' ? persona.nif : persona.documento) || '';
      if (docOtro) r.documento = { valor: docOtro, falta: false };
    }

    return r;
  }

  /* ---------- la foto del contacto, para cuando el tercero ya no está
     en el CSV (19-sep-2026, fila 66, docs/CONTACTO-GUARDADO-EN-LA-
     FICHA.md) ----------

     Solo las columnas que de verdad se miran: las mismas que ya buscan
     por título `destacadosAlumno`, `destacadosPersona`, `tutoresDe`,
     `telefonoPropio` y `js/dni.js` (tutor/familia, teléfono, correo,
     domicilio, cuenta y documento de identidad). Nada de columnas que
     no se consultan nunca, y nada del CSV entero. */
  var CAMPO_UTIL = /tutor|padre|madre|responsable|familia|telefono|movil|correo|e-?mail|domicilio|direccion|localidad|cuenta|dni\b|nif\b|nie\b|documento|identidad|pasaporte/;

  function ficheroDeCategoria(categoria) {
    if (categoria === 'ALUMNADO') return 'RegAlum.csv';
    if (categoria === 'PERSONAL') return 'RelPerCen.csv';
    return String(categoria || '') + '.csv';
  }

  /* Datos.fotoDeContacto(persona, categoria) -> un bloque pequeño para
     guardar en `ficha.contacto` al crear un asunto: lo justo para
     poder seguir trabajando el día que esta persona ya no esté en el
     fichero de Séneca. */
  function fotoDeContacto(persona, categoria) {
    if (!persona) return null;
    var origen = persona.campos || {};
    var campos = {};
    Object.keys(origen).forEach(function (clave) {
      if (CAMPO_UTIL.test(U.normalizar(clave))) campos[clave] = origen[clave];
    });
    return {
      nombre: persona.nombre || '',
      documento: persona.documento || '',
      id: persona.id || '',
      unidad: persona.unidad || '',
      curso: persona.curso || '',
      fechaNac: persona.fechaNac || '',
      puesto: persona.puesto || '',
      cursoUltimo: persona.cursoUltimo || '',
      comercial: persona.comercial || '',
      referencia: persona.referencia || '',
      nif: persona.nif || '',
      campos: campos,
      fichero: ficheroDeCategoria(categoria),
      fecha: U.hoyIso()
    };
  }

  /* Datos.personaDesdeFoto(contacto, categoria) -> una "persona" como
     las que devuelve el CSV, pero hecha con lo guardado en
     `ficha.contacto`. Vale para las mismas funciones de siempre
     (`destacadosAlumno`, `tutoresDe`, `resumenDeTercero`,
     `telefonoPropio`, `window.Dni`), así que la ventana "Ver todo" no
     necesita saber de dónde ha salido. Lleva `.foto = true` para que
     quien la pinte pueda avisar de que son datos guardados, no de hoy. */
  function personaDesdeFoto(contacto, categoria) {
    if (!contacto) return null;
    return {
      nombre: contacto.nombre || '', documento: contacto.documento || '',
      id: contacto.id || '', unidad: contacto.unidad || '', curso: contacto.curso || '',
      fechaNac: contacto.fechaNac || '', matriculado: false, solicitante: false,
      anoUltima: 0, unidadUltima: '', cursoUltima: '',
      puesto: contacto.puesto || '', enElCentro: false, esteCurso: false,
      cursoUltimo: contacto.cursoUltimo || '', cursos: [],
      comercial: contacto.comercial || '', referencia: contacto.referencia || '',
      nif: contacto.nif || '', campos: contacto.campos || {}, categoria: categoria,
      foto: true, fotoFecha: contacto.fecha || '', fotoFichero: contacto.fichero || ''
    };
  }

  Object.assign(Datos, {
    unidadesDistintas: unidadesDistintas,
    destacadosAlumno: destacadosAlumno,
    destacadosPersona: destacadosPersona,
    resumenDeTercero: resumenDeTercero,
    fotoDeContacto: fotoDeContacto,
    personaDesdeFoto: personaDesdeFoto
  });
})();
