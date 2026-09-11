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

  var CATEGORIAS = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS'];

  /* Monta el nombre de la carpeta a partir de sus piezas.
     El tercero va siempre el último. El grupo, si se pide, va detrás
     del año académico y delante de los campos y de la descripción.
     `datos.campos`, si viene, es una lista de valores ya elegidos
     (los que el usuario ha marcado "Añadir al nombre" y que no están
     vacíos), en el orden en que deben salir: aquí solo se limpian y
     se colocan, uno detrás de otro. */
  function montar(datos) {
    var partes = [];
    partes.push(U.aAaMmDd(datos.fecha));
    partes.push(U.limpiarNombre(datos.tipo).toUpperCase());
    if (datos.curso) partes.push(U.limpiarNombre(datos.curso));
    if (datos.grupo) partes.push(U.limpiarNombre(datos.grupo));
    (datos.campos || []).forEach(function (v) {
      var limpio = U.limpiarNombre(v);
      if (limpio) partes.push(limpio);
    });
    if (datos.descripcion) partes.push(U.limpiarNombre(datos.descripcion));
    partes.push(U.limpiarNombre(datos.tercero));
    return U.limpiarNombre(partes.filter(function (p) { return p; }).join(' '));
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
  function grupoCompacto(unidad, curso) {
    var texto = String(unidad || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    var deCurso = String(curso || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    var junto = (texto + ' ' + deCurso);

    var etapa = '';
    if (/bach/i.test(junto)) etapa = 'Bach';
    else if (/\bfp\b|ciclo|c\.?f\.?g|formacion profesional/i.test(junto)) etapa = 'FP';
    else if (/\bpmar\b|diversificacion/i.test(junto)) etapa = 'Div';

    /* Se quitan las palabras de la etapa para que no estorben al buscar
       el nivel y la letra. */
    var limpio = texto
      .replace(/\bde\b/gi, ' ')
      .replace(/e\.?\s?s\.?\s?o\.?/gi, ' ')
      .replace(/educacion secundaria obligatoria/gi, ' ')
      .replace(/bachillerato|bachiller|bach\.?/gi, ' ')
      .replace(/c\.?f\.?g\.?[ms]?|ciclo formativo|formacion profesional|\bfp\b/gi, ' ')
      .replace(/\bpmar\b|diversificacion/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    var nivel = limpio.match(/([1-6])/);
    var letra = limpio.match(/(?:^|[\s\-º.])([A-Za-z])\s*$/);
    if (!nivel) {
      var nivelCurso = deCurso.match(/([1-6])/);
      if (nivelCurso) nivel = nivelCurso;
    }
    if (!nivel) return U.limpiarNombre(String(unidad || '')).replace(/\s+/g, '');

    return nivel[1] + 'º' + etapa + (letra ? letra[1].toUpperCase() : '');
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

  function montarDocumento(datos) {
    var partes = [];
    partes.push(U.aAaMmDd(datos.fecha));
    if (datos.codigo) partes.push(U.limpiarNombre(datos.codigo));
    partes.push(U.limpiarNombre(datos.tipo).toUpperCase());
    if (datos.curso) partes.push(U.limpiarNombre(datos.curso));
    var base = U.limpiarNombre(partes.filter(function (p) { return p; }).join(' '));
    var ext = String(datos.extension || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    return base + (ext ? '.' + ext : '');
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
    POR_DEFECTO: POR_DEFECTO, CATEGORIAS: CATEGORIAS,
    ESTADOS_POR_DEFECTO: ESTADOS_POR_DEFECTO, VIAS: VIAS, via: via,
    montar: montar, leer: leer, categoriaDeTipo: categoriaDeTipo,
    grupoCompacto: grupoCompacto,
    TIPOS_DOCUMENTO_POR_DEFECTO: TIPOS_DOCUMENTO_POR_DEFECTO,
    codigoRegistro: codigoRegistro, montarDocumento: montarDocumento,
    extensionDe: extensionDe,
    terceroAlumno: terceroAlumno, terceroDeResto: terceroDeResto,
    terceroPersonal: terceroPersonal, terceroEmpresa: terceroEmpresa
  };
})();
