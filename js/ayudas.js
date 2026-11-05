/* ============================================================
   ayudas.js — los textos del recuadro de ayuda al pasar el ratón (fila 462,
   24-oct-2026, docs/AYUDA-AL-PASAR-EL-RATON.md). TODOS los textos fijos viven
   aquí, uno por línea: corregir una ayuda es cambiar una línea de este fichero.

   Cómo se enlaza un botón o una pestaña con su texto (js/ayuda-raton.js lo
   pregunta con `Ayudas.de(elemento)`), por este orden:
     1. `data-ayuda-clave="…"` en el elemento → TEXTOS[clave];
     2. su `id` → POR_ID;
     3. la pestaña a la que pertenece (`data-pantalla`, `data-pestana`,
        `data-ajustes-pestana`, `data-tarjeta`) → POR_PESTANA;
     4. su rótulo (lo que se lee en el botón, sin números ni flechas) → POR_ROTULO.
   Un botón con `data-ayuda` (un dato del momento, como el nombre entero de algo
   cortado) enseña ese texto y nada más. Los botones OBVIOS no llevan recuadro.

   Reglas de los textos: una o dos frases, 20 palabras como mucho, lo que hace
   o lo que se ve (no repiten el nombre del botón), lenguaje de Secretaría
   (docs/VOCABULARIO-EN-PANTALLA.md). Los motivos de un botón apagado dicen
   por qué y qué hay que hacer para encenderlo.
   ============================================================ */
window.Ayudas = (function () {
  var I = AyudasNucleo;
  var TEXTO_CATEGORIA = I.TEXTO_CATEGORIA;
  var OBVIOS = I.OBVIOS;
  var TEXTOS = I.TEXTOS;
  var POR_ID = I.POR_ID;
  var POR_PESTANA = I.POR_PESTANA;
  var POR_ROTULO = I.POR_ROTULO;

  /* ---------- 5. los botones apagados: por qué y qué hay que hacer ---------- */
  var TEXTO_CONSULTA = 'Este ordenador está en «solo consulta»: se puede mirar, pero no cambiar nada.';
  var TEXTO_OCUPADO = 'Espera un momento: se está haciendo ahora mismo.';
  var TEXTO_GENERAL = 'Ahora no se puede: falta algo por rellenar o elegir en esta pantalla.';

  var MOTIVOS = {
    'actividad-anulada': 'La actividad está anulada: primero hay que deshacer la anulación.',
    'en-solo-consultar': 'Este ordenador no puede cambiar nada: ábrelo desde el ordenador del centro para pasar las carpetas a Drive.',
    'plantilla-de-la-app-borrar': 'La aplicación vuelve a crear esta plantilla sola: no se puede borrar.',
    'plantilla-de-la-app-fuera': 'La aplicación necesita esta plantilla para avisar a quien lo pide: no se puede dejar fuera.',
    'sin-correo-de-tutores': 'La familia no tiene ningún correo apuntado: añade uno en su ficha.',
    'consulta': TEXTO_CONSULTA
  };

  var MOTIVO_POR_ID = {
    'inicio-liquidar-boton': 'Marca antes algún asunto para poder liquidarlo.',
    'btn-crear': 'Rellena antes lo que falta: la persona, el tipo de asunto y su descripción.',
    'lp-senalar': 'Marca antes algún nombre de la lista.',
    'base-boton': 'Ya se está poniendo al día: espera a que termine.',
    'doc-guardar': 'El nombre del documento tiene que tener al menos 10 letras y caber en la ruta.',
    'btn-vaciar-registro': 'No hay nada que vaciar: el registro está vacío.',
    'copias-enlace-restaurar': 'Todavía no hay ninguna copia de seguridad que restaurar.',
    'act-avisar': 'La actividad está anulada: primero hay que deshacer la anulación.'
  };
  var MOTIVO_POR_ROTULO = {
    'liquidar': 'Marca antes algún asunto para poder liquidarlo.',
    'aceptar': 'Falta algo por rellenar o elegir en este cuadro.',
    'crear': 'Escribe antes el nombre y comprueba que no está repetido.',
    'enviar': 'Falta algo por rellenar o elegir antes de enviar.',
    'guardar': 'Falta algo por rellenar o cambiar antes de guardar.',
    'guardar pdf': 'Elige antes la carpeta donde guardarlo.',
    'repartir': 'Elige antes los ficheros y a quién va cada trozo.',
    'añadir': 'Escribe o elige antes lo que quieres añadir.',
    'subir': 'Ya es el primero de la lista: no se puede subir más.',
    'bajar': 'Ya es el último de la lista: no se puede bajar más.',
    '↑': 'Ya es el primero de la lista: no se puede subir más.',
    '↓': 'Ya es el último de la lista: no se puede bajar más.',
    '◀': 'Ya estás en el primero.',
    '▶': 'Ya estás en el último.',
    'retocar': 'El fichero de la plantilla no está en la carpeta de plantillas.',
    'borrar': 'Este elemento no se puede borrar ahora.',
    'enviar estado': 'Falta el correo de la persona a la que se envía.',
    'poner al día ahora': 'Ya se está poniendo al día: espera a que termine.',
    'pasar los marcados': 'Marca antes algún elemento de la lista.',
    'restaurar': 'Elige antes una copia de seguridad.'
  };

  /* ---------- la búsqueda ---------- */

  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  /* El rótulo de un botón: lo que se lee, sin cifras, paréntesis, flechas ni signos de los extremos. */
  function rotulo(el) {
    var t = limpio(el.textContent);
    t = t.replace(/\([^)]*\)/g, ' ').replace(/\b\d+\b/g, ' ');
    t = t.replace(/^[←→↑↓▲▼◀▶✕×+\-–−⋮⋯⧉⚑📎✎💬\s]+(?=\S)/, '');
    t = t.replace(/[▾▸▼▲\s]+$/g, '').replace(/[.:…]+$/, '');
    t = limpio(t).toLowerCase();
    return t;
  }

  /* El rótulo de un botón de solo un símbolo: el propio símbolo. */
  function simbolo(el) {
    var t = limpio(el.textContent);
    return /^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]{1,3}$/.test(t) ? t : '';
  }

  function esDeLaPestana(el) {
    var d = el.dataset || {};
    if (d.pantalla) return 'pantalla:' + d.pantalla;
    if (d.pestana && el.classList.contains('inicio-pestana')) return 'inicio:' + d.pestana;
    if (d.ajustesPestana) return 'ajustes:' + d.ajustesPestana;
    if (d.tarjeta && el.tagName === 'BUTTON') return 'tarjeta:' + d.tarjeta;
    return '';
  }

  function parecePestana(el) {
    var c = el.className;
    return typeof c === 'string' && /(^|[\s-])pestana(s)?([\s-]|$)|pestana-categoria|ficha-pestana|\bcr-pestana\b|\bpt-pestana\b|\bet-pestana\b|\bcep-pestana\b/.test(c);
  }

  /* ¿Es un elemento al que le toca recuadro por su cuenta (botón, pestaña, símbolo…)? */
  function esBoton(el) {
    return el.tagName === 'BUTTON' || el.tagName === 'SUMMARY' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab';
  }

  function esObvio(el) {
    var r = rotulo(el);
    if (!r) return false;
    if (OBVIOS.indexOf(r) !== -1) return true;
    return /^volver( a (inicio|la lista|herramientas|ver todo|la lista de documentos))?$/.test(r);
  }

  /* El texto de ayuda de un elemento apagado o no. Para uno apagado, el `data-ayuda` es el MOTIVO (lo pone js/ayuda-raton.js). */
  function de(el, apagado) {
    if (!el || el.nodeType !== 1) return '';
    var clave = el.getAttribute('data-ayuda-clave');
    if (clave && TEXTOS[clave]) return TEXTOS[clave];
    var propio = el.getAttribute('data-ayuda');
    if (!esBoton(el) && !parecePestana(el)) return apagado ? '' : (propio || '');
    if (el.id && POR_ID[el.id]) return POR_ID[el.id];
    var p = esDeLaPestana(el);
    if (p && POR_PESTANA[p]) return POR_PESTANA[p];
    if (esObvio(el)) return '';   /* el recuadro no sale en «Guardar», «Cancelar», «Cerrar»… aunque hoy lleven ayuda gris */
    if (propio && !apagado) return propio;
    if (el.closest && el.closest('#pestanas-tipos') && parecePestana(el)) return TEXTO_CATEGORIA;
    var r = rotulo(el);
    if (r && POR_ROTULO[r]) return POR_ROTULO[r];
    return '';
  }

  function ocupado(el) {
    if (el.dataset && el.dataset.guardando) return true;
    return /…\s*$/.test(limpio(el.textContent)) && /^(guardando|actualizando|enlazando|parando|comprobando|enviando|generando)/i.test(limpio(el.textContent));
  }

  /* Por qué está apagado un botón (o '' si el elemento no es un botón). `dicho` es el motivo que ya trae el propio
     botón (un `data-ayuda` que puso el código); gana a los motivos generales, no a los de «solo consulta», «ocupado»
     ni a los de un botón concreto. */
  function motivo(el, soloConsulta, dicho) {
    if (!esBoton(el) && !parecePestana(el)) return '';
    var d = el.dataset || {};
    if (d.apagadoPorSoloConsulta || d.apagadoPorConsulta) return TEXTO_CONSULTA;
    if (ocupado(el)) return TEXTO_OCUPADO;
    if (el.id && MOTIVO_POR_ID[el.id]) return MOTIVO_POR_ID[el.id];
    var r = rotulo(el), s = simbolo(el);
    if (s && MOTIVO_POR_ROTULO[s]) return MOTIVO_POR_ROTULO[s];
    if (dicho) return dicho;
    if (soloConsulta) return TEXTO_CONSULTA;
    if (r && MOTIVO_POR_ROTULO[r]) return MOTIVO_POR_ROTULO[r];
    return TEXTO_GENERAL;
  }

  return {
    de: de,
    motivo: motivo,
    rotulo: rotulo,
    TEXTOS: TEXTOS,
    POR_ID: POR_ID,
    POR_PESTANA: POR_PESTANA,
    POR_ROTULO: POR_ROTULO,
    MOTIVOS: MOTIVOS,
    MOTIVO_POR_ID: MOTIVO_POR_ID,
    MOTIVO_POR_ROTULO: MOTIVO_POR_ROTULO,
    TEXTO_CATEGORIA: TEXTO_CATEGORIA,
    TEXTO_CONSULTA: TEXTO_CONSULTA,
    TEXTO_OCUPADO: TEXTO_OCUPADO,
    TEXTO_GENERAL: TEXTO_GENERAL,
    OBVIOS: OBVIOS
  };
})();
