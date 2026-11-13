/* ============================================================
   nombres-terceros.js — leer un nombre y los nombres de los terceros (fila 536: trozo de js/nombres.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/nombres.js.
   ============================================================ */
var NombresNucleo = NombresNucleo || {};
(function () {

  var I = NombresNucleo;
  /* Lee un nombre de carpeta y saca lo que puede: la fecha y el tipo.
     El resto se devuelve tal cual, porque ahí van juntos el año académico,
     el grupo, la descripción y el tercero, y no siempre están los cuatro.

     Un tipo puede arrastrar nombres viejos, guardados en su lista 'alias'.
     Eso pasa cuando se le cambia el nombre: las carpetas ya archivadas
     siguen llamándose como se llamaban, y no se tocan, pero aquí se
     reconocen igual y se enseñan con el nombre nuevo. */
  function leer(nombre, tipos, terceroDeFuera) {
    var r = leerNombre(nombre, tipos);
    /* Fila 648: una carpeta archivada con número ya no lleva a la persona en el nombre; quien la lee sabe de qué
       carpeta del tercero viene y se la pasa, para que `resto` siga diciendo quién es. */
    if (terceroDeFuera && r.numero && !r.resto) r.resto = String(terceroDeFuera);
    return r;
  }

  function leerNombre(nombre, tipos) {
    var m = String(nombre).match(/^(\d{6})\s+(.*)$/);
    if (!m) return { fecha: '', tipo: '', resto: nombre, reconocido: false };
    var fecha = m[1], resto = m[2], numero = '';
    /* Fila 239: los asuntos nuevos llevan su número justo después de la fecha. */
    var mn = resto.match(/^(A\d{2}-\d{4})\s+(.*)$/);
    if (mn) { numero = mn[1]; resto = mn[2]; }

    var candidatos = [];
    (tipos || []).forEach(function (t) {
      candidatos.push({ texto: t.tipo, tipo: t.tipo, categoria: t.categoria });
      /* El nombre corto (20-sep-2026, fila 79, apartado 4.9): las carpetas
         nuevas de este tipo llevan el nombre corto, no el nombre de
         siempre, así que hay que reconocerlo igual para no dejar la
         carpeta como "no reconocida". No cuenta como alias: no es un
         nombre viejo, es el que se usa a partir de ahora. */
      if (t.nombreCorto && t.nombreCorto !== t.tipo) {
        candidatos.push({ texto: t.nombreCorto, tipo: t.tipo, categoria: t.categoria });
      }
      (t.alias || []).forEach(function (viejo) {
        candidatos.push({ texto: viejo, tipo: t.tipo, categoria: t.categoria, porAlias: true });
      });
    });
    candidatos.sort(function (a, b) { return b.texto.length - a.texto.length; });

    for (var i = 0; i < candidatos.length; i++) {
      var t = candidatos[i].texto;
      var enResto = U.normalizar(resto), enTipo = U.normalizar(t);
      /* Fila 648: el tipo puede ser lo último del nombre (carpeta archivada, sin la persona detrás). */
      if (enResto === enTipo || enResto.indexOf(enTipo + ' ') === 0) {
        return { fecha: fecha, numero: numero, tipo: candidatos[i].tipo, categoria: candidatos[i].categoria,
                 nombreViejo: candidatos[i].porAlias ? t : '',
                 resto: resto.slice(t.length).trim(), reconocido: true };
      }
    }
    /* No está en la lista de tipos: nos quedamos con la primera palabra en
       mayúsculas, que es lo que se ha venido usando siempre. */
    var m2 = resto.match(/^([A-ZÁÉÍÓÚÜÑ0-9._-]{2,})(?:\s+(.*))?$/);
    if (m2) return { fecha: fecha, numero: numero, tipo: m2[1], resto: m2[2] || '', reconocido: false };
    return { fecha: fecha, numero: numero, tipo: '', resto: resto, reconocido: false };
  }


  /* ---------- el nombre de la carpeta archivada (fila 648, docs/648-CARPETAS-ARCHIVADAS-MAS-CORTAS.md) ----------

     Un asunto con número, ya archivado, entra en la carpeta de su persona sin el nombre de la persona:
     `261113 A26-0137 BAJA MATRICULA`. Abierto lleva `261113 A26-0137 BAJA MATRICULA Cordero Navas, Lucía 1139877`.
     Los asuntos sin número (`A26-…`) no cambian nunca. */
  var RE_CON_NUMERO = /^\d{6} A\d{2}-\d{4}(?: |$)/;
  function tieneNumeroEnElNombre(nombre) { return RE_CON_NUMERO.test(String(nombre || '')); }

  /* Las formas en que puede acabar el nombre abierto: la persona de la ficha o de su carpeta, y sus versiones cortas. */
  function formasDeLaPersona(terceros) {
    var vistas = {}, salida = [];
    (terceros || []).forEach(function (t) {
      if (!t) return;
      [U.limpiarNombre(String(t)), acortarNombrePila(String(t))].forEach(function (f) {
        if (f && !vistas[f]) { vistas[f] = true; salida.push(f); }
      });
    });
    return salida.sort(function (a, b) { return b.length - a.length; });
  }

  /* PURA. Cuál de esas formas lleva puesta al final el nombre ('' si ninguna: ya es corto, o no tiene número). */
  function personaAlFinal(nombre, terceros) {
    nombre = String(nombre || '');
    if (!tieneNumeroEnElNombre(nombre)) return '';
    var formas = formasDeLaPersona(terceros);
    for (var i = 0; i < formas.length; i++) {
      var f = formas[i];
      if (nombre.length > f.length + 1 && nombre.slice(-(f.length + 1)) === ' ' + f
          && RE_CON_NUMERO.test(nombre.slice(0, nombre.length - f.length - 1))) return f;
    }
    return '';
  }

  /* PURA. El nombre que lleva en el archivo: sin la persona. Si no tiene número, o ya es corto, el mismo. */
  function nombreEnArchivo(nombre, terceros) {
    var f = personaAlFinal(nombre, terceros);
    return f ? String(nombre).slice(0, String(nombre).length - f.length - 1) : String(nombre || '');
  }

  /* PURA. ¿Es un nombre con número al que le falta la persona? */
  function esNombreCorto(nombre, terceros) {
    return tieneNumeroEnElNombre(nombre) && !personaAlFinal(nombre, terceros);
  }

  /* PURA. El nombre de una carpeta abierta: el corto más la persona, como `montarAsunto`. Si el nombre ya la lleva, el mismo. */
  function nombreAbierto(nombre, tercero) {
    if (!esNombreCorto(nombre, [tercero]) || !tercero) return String(nombre || '');
    return U.limpiarNombre(String(nombre) + ' ' + acortarNombrePila(String(tercero)));
  }

  /* ---------- nombres de pila largos (fila 247, docs/NOMBRES-DE-PILA-LARGOS.md) ----------

     Un tercero «Apellido1 Apellido2, Nombre… <número>» cuyo nombre (sin el
     número ni los 4 caracteres del documento) pasa de 40 caracteres se
     escribe, SOLO en nombres de carpetas, con el primer nombre de pila
     entero y los demás en inicial con punto; las partículas (de, del, la,
     los…) se quitan. Los apellidos y el número no se tocan. El nombre
     completo sigue en la ficha, en los buscadores y en los documentos. */
  var TOPE_NOMBRE_LARGO = 40;
  var PARTICULAS = { de: 1, del: 1, la: 1, las: 1, los: 1, y: 1 };

  /* PURA. Parte «Apellidos, Nombres 1234567» en { apellidos, pilas, id }. */
  function partirTercero(t) {
    var texto = U.limpiarNombre(t);
    var coma = texto.indexOf(',');
    if (coma < 0) return null;
    var apellidos = texto.slice(0, coma).trim();
    var piezas = texto.slice(coma + 1).trim().split(/\s+/).filter(Boolean);
    var id = '';
    if (piezas.length > 1 && /^[0-9A-Za-z]{4,}$/.test(piezas[piezas.length - 1]) && /\d/.test(piezas[piezas.length - 1])) {
      id = piezas.pop();
    }
    return { apellidos: apellidos, pilas: piezas, id: id };
  }

  /* PURA. El tercero como se escribe en una carpeta. */
  function acortarNombrePila(t) {
    var p = partirTercero(t);
    if (!p || !p.pilas.length) return U.limpiarNombre(t);
    if ((p.apellidos + ', ' + p.pilas.join(' ')).length <= TOPE_NOMBRE_LARGO) return U.limpiarNombre(t);
    var utiles = p.pilas.slice(1).filter(function (x) { return !PARTICULAS[x.toLowerCase()]; });
    var cortas = [p.pilas[0]].concat(utiles.map(function (x) { return x.charAt(0).toUpperCase() + '.'; }));
    return U.limpiarNombre(p.apellidos + ', ' + cortas.join(' ') + (p.id ? ' ' + p.id : ''));
  }

  /* PURA. Lo que identifica a la persona en forma corta o larga: número
     (o 4 caracteres) + apellidos, sin tildes ni mayúsculas. */
  function claveDeTercero(t) {
    var p = partirTercero(t);
    if (!p || !p.id) return '';
    var ap = p.apellidos.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
    return p.id.toUpperCase() + '|' + ap;
  }

  /* PURA. De las carpetas de tercero que ya hay, la de la misma persona (si
     hay) o, si no, el nombre corto. */
  function carpetaDeTercero(tercero, existentes) {
    var clave = claveDeTercero(tercero);
    if (clave) {
      var lista = existentes || [];
      for (var i = 0; i < lista.length; i++) if (claveDeTercero(lista[i]) === clave) return lista[i];
    }
    return acortarNombrePila(tercero);
  }

  /* Cómo se escribe cada clase de tercero dentro del nombre. */
  function terceroAlumno(alumno) {
    return U.limpiarNombre(alumno.nombre + (alumno.id ? ' ' + alumno.id : ''));
  }

  /* Del resto de un nombre de carpeta quita lo que va DELANTE del tercero
     y se puede reconocer por su forma: el año académico y el grupo.
     De "26-27 3ºA Cordero Navas, Lucía 1139877" deja "Cordero Navas, Lucía 1139877".
     La descripción libre no se puede distinguir del tercero, así que se
     queda: el campo del cuadro es editable y ahí se quita a mano. */
  function terceroDeResto(resto) {
    var t = String(resto || '').trim();
    t = t.replace(/^\d{2}[-\/]\d{2}\s+/, '');
    t = t.replace(/^\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?\s+/i, '');
    return U.limpiarNombre(t);
  }

  /* Lo mismo que quita terceroDeResto, pero capturándolo en vez de
     descartarlo: el año académico y el grupo que vengan delante del
     tercero, si vienen. Lo que no se reconozca se deja en blanco, nada
     se inventa. Estaba duplicada en js/archivo-indice.js (fila 44); se
     saca aquí en la fila 74 (docs/CUENTAS-DE-FIN-DE-CURSO.md) porque
     también hace falta para los asuntos ABIERTOS, que no pasan por el
     índice del archivo. */
  var RE_CURSO_RESTO = /^(\d{2}[-\/]\d{2})\s+/;
  var RE_GRUPO_RESTO = /^(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\s+/i;
  function cursoYGrupoDeResto(resto) {
    var t = String(resto || '');
    var curso = '', grupo = '';
    var m1 = t.match(RE_CURSO_RESTO);
    if (m1) { curso = m1[1]; t = t.slice(m1[0].length); }
    var m2 = t.match(RE_GRUPO_RESTO);
    if (m2) grupo = m2[1];
    return { curso: curso, grupo: grupo };
  }

  /* Del personal se ponen los CUATRO ÚLTIMOS CARACTERES del documento,
     con la letra incluida: 12345678Z -> 678Z, X1234567L -> 567L.
     Lo pidió Francisco el 7-sep-2026: con la letra el dato identifica
     mejor y es como se venía escribiendo a mano en el centro. Si el
     documento no acaba en letra, salen los cuatro últimos números. */
  function terceroPersonal(persona) {
    var doc = String(persona.documento || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    var cuatro = doc.slice(-4);
    return U.limpiarNombre(persona.nombre + (cuatro ? ' ' + cuatro : ''));
  }
  /* Tutores legales (fila 166): igual que el personal, «Apellido1
     Apellido2, Nombre» + los 4 últimos caracteres de su DNI. */
  function terceroTutor(tutor) { return terceroPersonal(tutor); }

  /* Administraciones (fila 167): el organismo, por su nombre corto y
     estable (ni el DIR3 ni la Consejería: cambian con cada legislatura);
     el centro educativo, nombre corto + su código de centro, que no cambia. */
  function terceroAdministracion(o) {
    var codigo = o && o.clase === 'centro' ? String(o.codigoCentro || '').replace(/\D/g, '') : '';
    return U.limpiarNombre(String((o && o.corto) || '') + (codigo ? ' ' + codigo : ''));
  }
  function terceroEmpresa(empresa) {
    return U.limpiarNombre(empresa.nombre + (empresa.nif ? ' ' + empresa.nif : ''));
  }

  /* ============================================================
     LOS DOCUMENTOS DE DENTRO DE LA CARPETA

         AAMMDD  [REGISTRO]  TIPO  [AÑO ACADÉMICO] . extensión

         260907 26EM1234 SOLICITUD 26-27.pdf

     La fecha es la DEL DOCUMENTO, no la del día en que se archiva:
     la de una factura es la que trae impresa. Así la carpeta se ordena
     por el orden real de los hechos.
     ============================================================ */

  /* ============================================================
     LOS ESTADOS DEL ASUNTO

     Dicen por dónde va la tramitación: si está sin empezar, si se ha
     mandado a la firma, si se espera a un tercero... La lista se guarda
     en la carpeta del centro, así que la ven todos los ordenadores, y
     se cambia en Ajustes.

     El orden importa: es el orden del trámite, no el alfabético. Por eso
     esta lista no se ordena nunca sola.
     ============================================================ */

  I.leer = leer;
  I.tieneNumeroEnElNombre = tieneNumeroEnElNombre;
  I.nombreEnArchivo = nombreEnArchivo;
  I.esNombreCorto = esNombreCorto;
  I.nombreAbierto = nombreAbierto;
  I.acortarNombrePila = acortarNombrePila;
  I.claveDeTercero = claveDeTercero;
  I.carpetaDeTercero = carpetaDeTercero;
  I.terceroAlumno = terceroAlumno;
  I.terceroDeResto = terceroDeResto;
  I.cursoYGrupoDeResto = cursoYGrupoDeResto;
  I.terceroPersonal = terceroPersonal;
  I.terceroTutor = terceroTutor;
  I.terceroAdministracion = terceroAdministracion;
  I.terceroEmpresa = terceroEmpresa;
})();
