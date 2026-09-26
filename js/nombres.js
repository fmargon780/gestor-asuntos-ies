/* ============================================================
   nombres.js — cómo se llama una carpeta de asunto.

   El nombre es la ficha del asunto. Si siempre se monta igual,
   el archivo se puede leer entero años después sin más ayuda.

       AAMMDD  TIPO  [AÑO ACADÉMICO]  [GRUPO]  [CAMPOS]  [DESCRIPCIÓN]  TERCERO

   Ejemplo:  260907 MATRICULA 26-27 3ºA Cordero Navas, Lucía 1139877

   Desde el 11-sep-2026, entre el grupo y la descripción pueden entrar
   los campos que el tipo de asunto tenga configurados en Ajustes (ver
   js/campos.js), en su mismo orden: unidad, modalidad, lo que sea.
   Quien decide qué valores entran ahí es quien llama a `montar`; este
   fichero solo los limpia y los coloca. El interruptor viejo del grupo
   y los campos no suelen darse a la vez: si el tipo ya lleva la unidad
   o el curso como campo, el interruptor del grupo se esconde (lo hace
   js/asuntos-nuevo.js), para que no salga dos veces.
   ============================================================ */
var Nombres = (function () {

  /* Propuesta de partida. Se guarda en _GESTOR/tipos.json la primera vez
     y a partir de ahí manda el fichero, no esta lista. */
  var POR_DEFECTO = [
    { tipo: 'MATRICULA', categoria: 'ALUMNADO' },
    { tipo: 'BAJA', categoria: 'ALUMNADO' },
    { tipo: 'TRASLADO', categoria: 'ALUMNADO' },
    { tipo: 'SANCION', categoria: 'ALUMNADO' },
    { tipo: 'ABSENTISMO', categoria: 'ALUMNADO' },
    { tipo: 'CERTIFICADO', categoria: 'ALUMNADO' },
    { tipo: 'TITULO', categoria: 'ALUMNADO' },
    { tipo: 'BECA', categoria: 'ALUMNADO' },
    { tipo: 'TRANSPORTE', categoria: 'ALUMNADO' },
    { tipo: 'SEGURO ESCOLAR', categoria: 'ALUMNADO' },
    { tipo: 'RECLAMACION', categoria: 'ALUMNADO' },
    { tipo: 'ACCIDENTE', categoria: 'ALUMNADO' },
    { tipo: 'CONVALIDACION', categoria: 'ALUMNADO' },
    { tipo: 'DOCUMENTACION', categoria: 'ALUMNADO' },

    { tipo: 'TOMA POSESION', categoria: 'PERSONAL' },
    { tipo: 'CESE', categoria: 'PERSONAL' },
    { tipo: 'PERMISO', categoria: 'PERSONAL' },
    { tipo: 'LICENCIA', categoria: 'PERSONAL' },
    { tipo: 'BAJA MEDICA', categoria: 'PERSONAL' },
    { tipo: 'NOMINA', categoria: 'PERSONAL' },
    { tipo: 'FORMACION', categoria: 'PERSONAL' },
    { tipo: 'CERTIFICADO PERSONAL', categoria: 'PERSONAL' },

    { tipo: 'COMPRA', categoria: 'EMPRESAS' },
    { tipo: 'FACTURA', categoria: 'EMPRESAS' },
    { tipo: 'PRESUPUESTO', categoria: 'EMPRESAS' },
    { tipo: 'CONTRATO', categoria: 'EMPRESAS' },
    { tipo: 'MANTENIMIENTO', categoria: 'EMPRESAS' },
    { tipo: 'SUMINISTRO', categoria: 'EMPRESAS' },
    { tipo: 'OBRA', categoria: 'EMPRESAS' },
    { tipo: 'GARANTIA', categoria: 'EMPRESAS' },

    { tipo: 'CONVENIO', categoria: 'OTROS' },
    { tipo: 'SUBVENCION', categoria: 'OTROS' },
    { tipo: 'INSPECCION', categoria: 'OTROS' },
    { tipo: 'CONSEJO ESCOLAR', categoria: 'OTROS' },
    { tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS' },
    { tipo: 'PROYECTO', categoria: 'OTROS' },
    { tipo: 'CORRESPONDENCIA', categoria: 'OTROS' }
  ];

  /* Las categorías de tercero. Es la ÚNICA lista: todo lo que enseña o
     recorre categorías (botones, desplegables, buscadores, la bandeja)
     lee esta (fila 166, docs/TUTORES-LEGALES-COMO-TERCERO.md). Una
     categoría nueva se añade aquí (al final: los botones se reconocen
     por su sitio) y en TEXTOS_CATEGORIA, y su carpeta del ARCHIVO se
     llama igual. */
  var CATEGORIAS = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS', 'TUTORES LEGALES', 'ADMINISTRACIONES'];

  /* Cómo se nombra cada categoría en pantalla: `lista` (el desplegable
     de Personas y empresas), `descripcion` (el botón de Nuevo asunto) y
     `tercero` (la etiqueta del buscador del tercero). */
  var TEXTOS_CATEGORIA = {
    'ALUMNADO': { lista: 'Alumnado', descripcion: 'Alumnos y alumnas', tercero: 'Alumno o alumna' },
    'TUTORES LEGALES': { lista: 'Tutores legales', descripcion: 'Padres, madres y tutores del alumnado',
                         tercero: 'Tutor o tutora legal' },
    'PERSONAL': { lista: 'Personal', descripcion: 'Profesorado y personal del centro', tercero: 'Persona del centro' },
    'EMPRESAS': { lista: 'Empresas', descripcion: 'Proveedores y empresas', tercero: 'Empresa' },
    'OTROS': { lista: 'Otros', descripcion: 'Todo lo demás', tercero: 'Con quién es el asunto' },
    'ADMINISTRACIONES': { lista: 'Administraciones', descripcion: 'Organismos y centros educativos',
                          tercero: 'Organismo o centro educativo' }
  };

  function textoCategoria(categoria, que) {
    var t = TEXTOS_CATEGORIA[categoria];
    return (t && t[que || 'lista']) || String(categoria || '');
  }

  /* Rellena un <select> con las categorías (valor = la categoría; texto,
     el de `que`, o la categoría en mayúsculas si `que` es 'clave'),
     conservando lo elegido si sigue existiendo. */
  function opcionesCategorias(select, que) {
    if (!select) return;
    var antes = select.value;
    select.innerHTML = CATEGORIAS.map(function (c) {
      var texto = que === 'clave' ? c : textoCategoria(c, que);
      return '<option value="' + c + '">' + U.escapar(texto) + '</option>';
    }).join('');
    if (antes && CATEGORIAS.indexOf(antes) !== -1) select.value = antes;
  }

  /* El nombre corto de un tipo (20-sep-2026, fila 79, apartado 4.9,
     docs/BIBLIOTECA-DE-HITOS.md): lo que entra en el nombre de la
     carpeta y de los documentos. Vacío, se usa el nombre de siempre.
     Cambiar el nombre corto no toca las carpetas ya creadas: solo
     afecta a lo que se monta a partir de ahora. Un solo sitio: todo lo
     que hoy mete `tipo.tipo` en un nombre de carpeta o de documento
     pasa por aquí. */
  function tipoParaCarpeta(tipo) {
    return (tipo && tipo.nombreCorto) ? tipo.nombreCorto : ((tipo && tipo.tipo) || '');
  }

  /* Lo que se ENSEÑA de un tipo en los filtros «Por tipo de asunto» y
     en la etiqueta de la tarjeta (fila 97, docs/NOMBRE-CORTO-EN-LOS-FILTROS.md):
     el nombre corto si lo tiene, el de siempre si no. `nombreTipo` es el
     nombre de verdad (el largo, el que devuelve `leer`), y es el que
     sigue sirviendo para agrupar y filtrar. */
  function tipoParaVer(nombreTipo, tipos) {
    var t = (tipos || []).filter(function (x) { return x.tipo === nombreTipo; })[0];
    return t ? tipoParaCarpeta(t) : (nombreTipo || '');
  }

  /* Los dos nombres de un tipo, para el buscador: el largo y el corto
     (fila 97). Se resuelve al buscar, desde la lista de tipos de hoy. */
  function nombresDeTipo(nombreTipo, tipos) {
    var corto = tipoParaVer(nombreTipo, tipos);
    return corto && corto !== nombreTipo ? [nombreTipo || '', corto] : [nombreTipo || ''];
  }

  /* Monta el nombre de la carpeta a partir de sus piezas.
     El tercero va siempre el último. El grupo, si se pide, va detrás
     del año académico y delante de los campos y de la descripción.
     `datos.campos`, si viene, es una lista de valores ya elegidos
     (los que el usuario ha marcado "Añadir al nombre" y que no están
     vacíos), en el orden en que deben salir: aquí solo se limpian y
     se colocan, uno detrás de otro. */
  function montar(datos) { return montarAsunto(datos).nombre; }

  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): los nombres no
     pasan de un largo seguro (Windows no sincroniza rutas de más de 260
     caracteres). Carpeta de asunto: 150 como mucho; nombre de documento:
     120, más la extensión. */
  var TOPE_ASUNTO = 150;
  var TOPE_DOCUMENTO = 120;

  /* Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2): con la ruta
     de la carpeta ARCHIVO ya señalada, el hueco de verdad lo calcula
     `Nombres.topes()` (js/nombres-topes.js, cargado justo después de
     este fichero), contando la ruta completa dentro de Dropbox. Sin
     ella, se quedan los fijos de arriba, tal cual. */
  function topesDeHoy(tercero, categoria) {
    if (typeof window !== 'undefined' && window.Nombres && typeof window.Nombres.topes === 'function') {
      return window.Nombres.topes(tercero, categoria);
    }
    return { asunto: TOPE_ASUNTO, documento: TOPE_DOCUMENTO };
  }

  function unir(partes) { return U.limpiarNombre(partes.filter(function (p) { return p; }).join(' ')); }

  /* `antes` y `despues` no se tocan nunca; `medio` se recorta desde el
     final (lo último de `medio`, lo primero que se acorta). */
  function ajustarAlTope(antes, medio, despues, tope) {
    var m = medio.filter(function (p) { return p; });
    var recortado = false;
    var nombre = unir(antes.concat(m, despues));
    while (nombre.length > tope && m.length) {
      recortado = true;
      var i = m.length - 1;
      var queda = m[i].length - (nombre.length - tope);
      if (queda >= 3) m[i] = U.limpiarNombre(m[i].slice(0, queda));
      else m.splice(i, 1);
      nombre = unir(antes.concat(m, despues));
    }
    /* Fila 177: ni la fecha, el tipo, el año académico, el grupo ni el
       tercero se recortan nunca, así que si ellos solos ya pasan del
       tope (una ruta de Dropbox larga y un tercero largo, sobre todo),
       el nombre se queda sin caber por mucho que se recorte el texto
       libre. Quien llama tiene que avisar y no crear nada, en vez de
       guardar un nombre que luego no sincroniza. */
    return { nombre: nombre, recortado: recortado, noCabe: nombre.length > tope };
  }

  /* El nombre de la carpeta y si ha habido que recortarlo. Se recorta
     primero la descripción (el texto libre) y después los campos del
     tipo, por el final. Nunca la fecha, el tipo, el año académico, el
     grupo ni el tercero con su número. */
  function montarAsunto(datos) {
    var antes = [U.aAaMmDd(datos.fecha), U.limpiarNombre(datos.tipo).toUpperCase()];
    if (datos.curso) antes.push(U.limpiarNombre(datos.curso));
    if (datos.grupo) antes.push(U.limpiarNombre(datos.grupo));
    var medio = (datos.campos || []).map(function (v) { return U.limpiarNombre(v); });
    if (datos.descripcion) medio.push(U.limpiarNombre(datos.descripcion));
    var tope = topesDeHoy(datos.tercero, datos.categoria).asunto;
    return ajustarAlTope(antes, medio, [U.limpiarNombre(datos.tercero)], tope);
  }

  /* ---------- la abreviatura del grupo ----------

     Séneca escribe la unidad larga: "1º A", "1º de E.S.O. A",
     "2º Bachillerato B". En el nombre de una carpeta eso ocupa demasiado.

     La abreviatura lleva tres cosas: el nivel, la etapa y la letra.
     La etapa NO se escribe en la ESO, porque es lo normal en el centro,
     pero SÍ en Bachillerato y en Formación Profesional. Si no se escribiera,
     un 1ºA de Bachillerato y un 1ºA de la ESO se llamarían igual, y son
     dos grupos distintos.

         1º A          (ESO)            ->  1ºA
         2º Bach B     (Bachillerato)   ->  2ºBachB
         1º CFGM A     (FP)             ->  1ºFPA                       */
  function sinTildes(v) { return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function etapaDe(texto) {
    if (/bach/i.test(texto)) return 'Bach';
    if (/\bfp\b|ciclo|c\.?f\.?g|formacion profesional/i.test(texto)) return 'FP';
    if (/\bpmar\b|diversificacion/i.test(texto)) return 'Div';
    return '';
  }

  /* Se quitan las palabras de la etapa para que no estorben al buscar el
     nivel y la letra. */
  function sinPalabrasDeEtapa(texto) {
    return texto
      .replace(/\bde\b/gi, ' ')
      .replace(/e\.?\s?s\.?\s?o\.?/gi, ' ')
      .replace(/educacion secundaria obligatoria/gi, ' ')
      .replace(/bachillerato|bachiller|bach\.?/gi, ' ')
      .replace(/c\.?f\.?g\.?[ms]?|ciclo formativo|formacion profesional|\bfp\b/gi, ' ')
      .replace(/\bpmar\b|diversificacion/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function grupoCompacto(unidad, curso) {
    var texto = sinTildes(unidad);
    var deCurso = sinTildes(curso);
    var junto = (texto + ' ' + deCurso);

    var etapa = etapaDe(junto);
    var limpio = sinPalabrasDeEtapa(texto);

    var nivel = limpio.match(/([1-6])/);
    var letra = limpio.match(/(?:^|[\s\-º.])([A-Za-z])\s*$/);
    if (!nivel) {
      var nivelCurso = deCurso.match(/([1-6])/);
      if (nivelCurso) nivel = nivelCurso;
    }
    if (!nivel) return U.limpiarNombre(String(unidad || '')).replace(/\s+/g, '');

    return nivel[1] + 'º' + etapa + (letra ? letra[1].toUpperCase() : '');
  }

  /* El nivel y la enseñanza de una unidad, sueltos (17-sep-2026, fila 21,
     docs/GRUPOS-DE-PERSONAS.md): hacen falta para los atajos de "toda una
     unidad/nivel/enseñanza" al elegir grupos de alumnado. Reutiliza el
     mismo análisis de texto que `grupoCompacto`, para no tener dos sitios
     que entiendan "1º de E.S.O. A" de forma distinta. */
  var ENSENANZA_DE_ETAPA = {
    Bach: 'Bachillerato',
    FP: 'Formación Profesional',
    Div: 'PMAR',
    '': 'E.S.O.'
  };

  function nivelYEnsenanza(unidad) {
    var texto = sinTildes(unidad);
    var etapa = etapaDe(texto);
    var limpio = sinPalabrasDeEtapa(texto);
    var nivel = limpio.match(/([1-6])/);
    if (!nivel) return { nivel: '', ensenanza: '' };
    return { nivel: nivel[1] + 'º', ensenanza: ENSENANZA_DE_ETAPA[etapa] };
  }

  /* Lee un nombre de carpeta y saca lo que puede: la fecha y el tipo.
     El resto se devuelve tal cual, porque ahí van juntos el año académico,
     el grupo, la descripción y el tercero, y no siempre están los cuatro.

     Un tipo puede arrastrar nombres viejos, guardados en su lista 'alias'.
     Eso pasa cuando se le cambia el nombre: las carpetas ya archivadas
     siguen llamándose como se llamaban, y no se tocan, pero aquí se
     reconocen igual y se enseñan con el nombre nuevo. */
  function leer(nombre, tipos) {
    var m = String(nombre).match(/^(\d{6})\s+(.*)$/);
    if (!m) return { fecha: '', tipo: '', resto: nombre, reconocido: false };
    var fecha = m[1], resto = m[2];

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
      if (U.normalizar(resto).indexOf(U.normalizar(t) + ' ') === 0) {
        return { fecha: fecha, tipo: candidatos[i].tipo, categoria: candidatos[i].categoria,
                 nombreViejo: candidatos[i].porAlias ? t : '',
                 resto: resto.slice(t.length).trim(), reconocido: true };
      }
    }
    /* No está en la lista de tipos: nos quedamos con la primera palabra en
       mayúsculas, que es lo que se ha venido usando siempre. */
    var m2 = resto.match(/^([A-ZÁÉÍÓÚÜÑ0-9._-]{2,})\s+(.*)$/);
    if (m2) return { fecha: fecha, tipo: m2[1], resto: m2[2], reconocido: false };
    return { fecha: fecha, tipo: '', resto: resto, reconocido: false };
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

  /* 'espera' quiere decir que el trabajo está fuera del departamento:
     lo nuestro está hecho y toca esperar a que otro conteste, firme o
     traiga algo. Esos asuntos se enseñan aparte, para no mezclarlos con
     los que hay que gestionar hoy. */
  var ESTADOS_POR_DEFECTO = [
    { nombre: 'PENDIENTE',               espera: false },
    { nombre: 'EN TRÁMITE',              espera: false },
    { nombre: 'ENVIADO A FIRMA',         espera: true  },
    { nombre: 'FIRMADO',                 espera: false },
    { nombre: 'A LA ESPERA DEL TERCERO', espera: true  },
    { nombre: 'RESUELTO',                espera: false }
  ];

  /* ============================================================
     LA VÍA DE COMUNICACIÓN PREFERENTE

     Es de cada asunto, no del tercero: los datos estables de la persona
     ya están en su ficha. Aquí se apunta lo que ha dicho para ESTE
     asunto, y no siempre habrá algo que apuntar.
     ============================================================ */

  var VIAS = [
    { clave: 'TELEFONO',   texto: 'Teléfono',           corto: 'Teléfono' },
    { clave: 'CORREO',     texto: 'Correo electrónico', corto: 'Correo' },
    { clave: 'IPASEN',     texto: 'iPasen / Séneca',    corto: 'iPasen' },
    { clave: 'PRESENCIAL', texto: 'En persona',         corto: 'En persona' }
  ];

  function via(clave) {
    for (var i = 0; i < VIAS.length; i++) {
      if (VIAS[i].clave === clave) return VIAS[i];
    }
    return null;
  }

  var TIPOS_DOCUMENTO_POR_DEFECTO = [
    'SOLICITUD', 'FACTURA', 'CERTIFICADO', 'MATRICULA', 'RESOLUCION',
    'NOTIFICACION', 'INFORME', 'ACTA', 'COMUNICACION', 'JUSTIFICANTE',
    'PRESUPUESTO', 'ALBARAN', 'CONTRATO', 'RECURSO', 'ANEXO'
  ];

  /* El código del registro de Séneca.

     Séneca lleva cuatro series distintas, y el mismo número se repite
     cada año, así que el código las distingue todas:

         26 E M 1234
         |  | | |
         |  | | +-- los cuatro dígitos del asiento
         |  | +---- M manual, A automático
         |  +------ E entrada, S salida
         +--------- los dos últimos dígitos del año                     */
  function codigoRegistro(r) {
    if (!r) return '';
    var numero = String(r.numero || '').replace(/\D/g, '');
    if (!numero) return '';
    while (numero.length < 4) numero = '0' + numero;
    var ano = String(r.ano || '').replace(/\D/g, '');
    if (ano.length > 2) ano = ano.slice(-2);
    if (ano.length !== 2) return '';
    return ano + (r.sentido === 'S' ? 'S' : 'E') + (r.modo === 'A' ? 'A' : 'M') + numero;
  }

  function montarDocumento(datos) { return montarDocumentoAjustado(datos).nombre; }

  /* El nombre del documento y si ha habido que recortarlo (fila 130): se
     recorta el texto adicional (`curso`) y, si no basta, los campos del
     tipo por el final. La fecha, el registro y el tipo no se tocan. */
  function montarDocumentoAjustado(datos) {
    var antes = [U.aAaMmDd(datos.fecha)];
    if (datos.codigo) antes.push(U.limpiarNombre(datos.codigo));
    antes.push(U.limpiarNombre(datos.tipo).toUpperCase());
    /* Los campos del tipo de documento (fila 96,
       docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md), ya en orden: entre el
       tipo y el texto adicional. */
    var medio = (datos.campos || []).map(function (v) { return U.limpiarNombre(v); });
    if (datos.curso) medio.push(U.limpiarNombre(datos.curso));
    var tope = topesDeHoy(datos.tercero, datos.categoria).documento;
    var r = ajustarAlTope(antes, medio, [], tope);
    var ext = String(datos.extension || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    return { nombre: r.nombre + (ext ? '.' + ext : ''), recortado: r.recortado, noCabe: r.noCabe };
  }

  /* La línea ámbar de la vista previa, si ha habido recorte. */
  var AVISO_RECORTE = 'Nombre demasiado largo: se ha acortado el texto libre.';
  /* Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2): ni recortando
     el texto libre cabe en la ruta de Dropbox. En rojo, y no se crea. */
  var AVISO_NO_CABE = 'El nombre no cabe en la ruta de Dropbox: acorta el texto.';

  /* Pone (o quita) esa línea justo debajo de `el`, el nombre de la
     vista previa: ámbar si solo se ha recortado, roja si ni así cabe
     (`noCabe`, fila 177). */
  function avisoRecorte(el, recortado, noCabe) {
    if (!el || !el.parentNode || typeof document === 'undefined') return;
    var sig = el.nextElementSibling;
    var ya = sig && sig.classList && sig.classList.contains('vista-recorte') ? sig : null;
    if (!recortado && !noCabe) { if (ya) ya.parentNode.removeChild(ya); return; }
    if (ya) {
      ya.textContent = noCabe ? AVISO_NO_CABE : AVISO_RECORTE;
      ya.className = 'vista-recorte aviso-en-vivo ' + (noCabe ? 'aviso-rojo' : 'aviso-ambar');
      return;
    }
    var p = document.createElement('div');
    p.className = 'vista-recorte aviso-en-vivo ' + (noCabe ? 'aviso-rojo' : 'aviso-ambar');
    p.textContent = noCabe ? AVISO_NO_CABE : AVISO_RECORTE;
    el.parentNode.insertBefore(p, el.nextSibling);
  }

  function extensionDe(nombre) {
    var m = String(nombre || '').match(/\.([A-Za-z0-9]{1,8})$/);
    return m ? m[1].toLowerCase() : '';
  }

  function categoriaDeTipo(tipos, tipo) {
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(tipos[i].tipo) === U.normalizar(tipo)) return tipos[i].categoria;
    }
    return 'OTROS';
  }

  return {
    POR_DEFECTO: POR_DEFECTO, CATEGORIAS: CATEGORIAS, TEXTOS_CATEGORIA: TEXTOS_CATEGORIA,
    textoCategoria: textoCategoria, opcionesCategorias: opcionesCategorias, terceroTutor: terceroTutor,
    terceroAdministracion: terceroAdministracion,
    ESTADOS_POR_DEFECTO: ESTADOS_POR_DEFECTO, VIAS: VIAS, via: via,
    montar: montar, leer: leer, categoriaDeTipo: categoriaDeTipo, tipoParaCarpeta: tipoParaCarpeta,
    tipoParaVer: tipoParaVer, nombresDeTipo: nombresDeTipo,
    grupoCompacto: grupoCompacto, nivelYEnsenanza: nivelYEnsenanza,
    TIPOS_DOCUMENTO_POR_DEFECTO: TIPOS_DOCUMENTO_POR_DEFECTO,
    codigoRegistro: codigoRegistro, montarDocumento: montarDocumento,
    montarAsunto: montarAsunto, montarDocumentoAjustado: montarDocumentoAjustado,
    TOPE_ASUNTO: TOPE_ASUNTO, TOPE_DOCUMENTO: TOPE_DOCUMENTO, AVISO_RECORTE: AVISO_RECORTE, avisoRecorte: avisoRecorte,
    extensionDe: extensionDe,
    terceroAlumno: terceroAlumno, terceroDeResto: terceroDeResto,
    cursoYGrupoDeResto: cursoYGrupoDeResto,
    terceroPersonal: terceroPersonal, terceroEmpresa: terceroEmpresa
  };
})();
