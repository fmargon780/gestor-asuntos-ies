/* ============================================================
   lo-pide.js — quién nos ha pedido la gestión (17-sep-2026, fila 28
   de docs/COLA.md, docs/LO-PIDE.md).

   Cada asunto puede guardar, si se quiere, quién lo pidió, por qué
   vía y en qué fecha: `loPide` en `_GESTOR/asuntos.json`, siempre
   opcional. Toda la lógica vive aquí, para no engordar
   js/asuntos-nuevo.js, js/ficha-asunto.js ni js/correo.js: los tres
   solo llaman a `window.LoPide`.

   `LoPide.datosDeTutor` estaba antes en js/plantillas.js (privada, sin
   nombre público); se saca aquí porque `LoPide.opciones` también la
   necesita para ofrecer "Tutor legal 1/2", y js/plantillas.js la sigue
   usando, ya llamando a esta.

   El parentesco de verdad (padre, madre, abuela) no existe en los
   datos del centro (RegAlum no trae esa columna): por eso las
   opciones de alumnado son "Tutor legal 1" y "Tutor legal 2", nunca
   un parentesco inventado.
   ============================================================ */
var LoPide = (function () {

  var RE_TELEFONO = /telefono|movil/;
  var RE_CORREO = /correo|e-?mail/;

  /* Columnas que nunca son el nombre de una persona, aunque no sean ni
     teléfono ni correo (docs/LO-PIDE-NOMBRE-DEL-TUTOR.md, 1): el
     RegAlum del centro suele traer, junto al nombre del tutor, su
     documento, su relación de parentesco, su fecha de nacimiento o su
     domicilio, y la primera de esas columnas no es nunca el nombre. */
  var RE_NO_ES_NOMBRE = /documento|dni|nif|nie|pasaporte|identificacion|identificador|ident|numero|num|nº|codigo|parentesco|relacion|sexo|fecha|nacimiento|domicilio|direccion|localidad|municipio|provincia|pais|nacionalidad|postal/;

  var RE_APELLIDOS = /apellido/;
  var RE_NOMBRE = /\bnombre\b/;

  /* Al menos una letra (con acentos y ñ): la red de seguridad de
     docs/LO-PIDE-NOMBRE-DEL-TUTOR.md, 3, para que un número suelto
     nunca se cuele como si fuera un nombre. */
  var RE_ALGUNA_LETRA = /\p{L}/u;

  /* El primer valor de `campos` cuyo título case con el patrón, leído
     por el título (como js/dni.js y js/plantillas.js). Copia mínima,
     a propósito: este módulo no depende del orden de carga de
     js/plantillas.js. */
  function primerValorQueParezca(campos, patron) {
    var claves = Object.keys(campos || {});
    for (var i = 0; i < claves.length; i++) {
      if (!patron.test(U.normalizar(claves[i]))) continue;
      var v = String(campos[claves[i]] || '').trim();
      if (v) return v;
    }
    return '';
  }

  /* {tutor1}/{tutor2} de js/plantillas.js hasta el 17-sep-2026: las
     columnas que hablan de "tutor" y de ese número (o de
     "primer"/"segundo"), separando dentro el teléfono y el correo del
     nombre por el título. Lo que Séneca no traiga se queda vacío.

     El nombre, por orden (docs/LO-PIDE-NOMBRE-DEL-TUTOR.md, 2), de las
     columnas que sobrevivan a RE_TELEFONO, RE_CORREO y RE_NO_ES_NOMBRE:
     1. Apellidos y Nombre en columnas distintas → "Apellidos, Nombre"
        (si Apellidos ya trae una coma, se deja tal cual).
     2. Solo Nombre → esa columna entera.
     3. Solo Apellidos → esa columna entera.
     4. Ninguna de las dos → la primera columna que quede, como antes.
     Y, al final, la red de seguridad: sin ninguna letra, nombre vacío. */
  function datosDeTutor(campos, numero) {
    var reNumero = numero === 1
      ? /tutor.*\b0*1\b|\b0*1\b.*tutor|primer\s*tutor/
      : /tutor.*\b0*2\b|\b0*2\b.*tutor|segundo\s*tutor/;
    var propios = {};
    Object.keys(campos || {}).forEach(function (k) {
      if (reNumero.test(U.normalizar(k))) propios[k] = campos[k];
    });
    var supervivientes = Object.keys(propios).filter(function (k) {
      var t = U.normalizar(k);
      return !RE_TELEFONO.test(t) && !RE_CORREO.test(t) && !RE_NO_ES_NOMBRE.test(t);
    });
    var claveApellidos = supervivientes.filter(function (k) { return RE_APELLIDOS.test(U.normalizar(k)); })[0];
    var claveNombre = supervivientes.filter(function (k) { return RE_NOMBRE.test(U.normalizar(k)); })[0];
    var valApellidos = claveApellidos ? String(propios[claveApellidos] || '').trim() : '';
    var valNombre = claveNombre ? String(propios[claveNombre] || '').trim() : '';

    var nombre;
    if (claveApellidos && claveNombre && claveApellidos !== claveNombre && valApellidos && valNombre) {
      nombre = valApellidos.indexOf(',') !== -1 ? valApellidos : (valApellidos + ', ' + valNombre);
    } else if (valNombre) {
      nombre = valNombre;
    } else if (valApellidos) {
      nombre = valApellidos;
    } else {
      nombre = supervivientes.length ? String(propios[supervivientes[0]] || '').trim() : '';
    }
    if (nombre && !RE_ALGUNA_LETRA.test(nombre)) nombre = '';

    return {
      nombre: nombre,
      telefono: primerValorQueParezca(propios, RE_TELEFONO),
      correo: primerValorQueParezca(propios, RE_CORREO)
    };
  }

  /* Los candidatos de quién puede haberlo pedido: siempre el propio
     interesado y "Otra persona…"; si es alumnado, además los tutores
     legales que tengan nombre. `persona` es la ficha del tercero tal y
     como la trae Datos.buscar (o null, si no se ha encontrado). */
  function opciones(persona) {
    var lista = [];
    var categoria = (persona && persona.categoria) || '';

    lista.push({
      valor: 'interesado',
      texto: 'El propio interesado',
      datos: {
        nombre: (persona && persona.nombre) || '',
        categoria: categoria,
        relacion: 'El propio interesado',
        correo: persona ? primerValorQueParezca(persona.campos, RE_CORREO) : '',
        telefono: persona ? primerValorQueParezca(persona.campos, RE_TELEFONO) : ''
      }
    });

    if (categoria === 'ALUMNADO') {
      [1, 2].forEach(function (n) {
        var t = datosDeTutor(persona.campos, n);
        /* Sin nombre pero con teléfono o correo, la opción no
           desaparece (docs/LO-PIDE-NOMBRE-DEL-TUTOR.md, 4): se ofrece
           a secas como "Tutor legal N", con relación vacía para que
           LoPide.texto no la repita entre paréntesis. */
        if (!t.nombre && !t.telefono && !t.correo) return;
        var nombre = t.nombre || ('Tutor legal ' + n);
        lista.push({
          valor: 'tutor' + n,
          texto: 'Tutor legal ' + n + (t.nombre ? ' · ' + t.nombre : ''),
          datos: {
            nombre: nombre, categoria: categoria, relacion: t.nombre ? ('Tutor legal ' + n) : '',
            correo: t.correo, telefono: t.telefono
          }
        });
      });
    }

    lista.push({ valor: 'otro', texto: 'Otra persona…', datos: null });
    return lista;
  }

  /* Pinta dentro de `caja` el desplegable de quién lo pide, los campos
     de "Otra persona…" (solo visibles con esa opción elegida), la vía
     y la fecha. Todo con clases, nunca con id: este mismo módulo se
     monta a la vez en la pantalla de "Nuevo asunto" (que queda en el
     documento, aunque escondida, mientras dura la sesión) y dentro del
     cuadro de diálogo de la ficha, y dos elementos con el mismo id en
     el documento romperían el segundo sitio que se pintara.

     `valorInicial` es el `loPide` ya guardado (o null/undefined, para
     empezar en blanco). Devuelve `{ leer() }`. */
  function controles(caja, persona, valorInicial) {
    var lista = opciones(persona);
    var v = valorInicial || null;

    var inicial = '';
    if (v && v.nombre) {
      var candidato = lista.filter(function (o) {
        return o.datos && o.datos.relacion === v.relacion && o.datos.nombre === v.nombre;
      })[0];
      inicial = candidato ? candidato.valor : 'otro';
    }
    var esOtro = inicial === 'otro';

    caja.innerHTML =
      '<label class="etiqueta">Quién lo pide</label>' +
      '<select class="campo lopide-quien">' +
        '<option value="">— sin apuntar —</option>' +
        lista.map(function (o) {
          return '<option value="' + o.valor + '"' + (o.valor === inicial ? ' selected' : '') + '>' +
            U.escapar(o.texto) + '</option>';
        }).join('') +
      '</select>' +
      '<div class="lopide-otro' + (esOtro ? '' : ' oculto') + '">' +
        '<label class="etiqueta">Nombre</label>' +
        '<input class="campo lopide-otro-nombre" value="' + U.escapar(esOtro ? (v.nombre || '') : '') + '">' +
        '<label class="etiqueta">Qué es del interesado</label>' +
        '<input class="campo lopide-otro-relacion" value="' + U.escapar(esOtro ? (v.relacion || '') : '') + '">' +
        '<label class="etiqueta">Correo, si lo tienes</label>' +
        '<input class="campo lopide-otro-correo" value="' + U.escapar(esOtro ? (v.correo || '') : '') + '">' +
      '</div>' +
      '<label class="etiqueta">Por dónde lo pidió</label>' +
      '<select class="campo lopide-via"><option value="">Sin indicar</option>' +
        Nombres.VIAS.map(function (via) {
          return '<option value="' + via.clave + '"' + ((v && v.via) === via.clave ? ' selected' : '') +
            '>' + U.escapar(via.texto) + '</option>';
        }).join('') +
      '</select>' +
      '<label class="etiqueta">Fecha</label>' +
      '<input type="date" class="campo lopide-fecha" value="' + U.escapar((v && v.fecha) || U.hoyIso()) + '">';

    var selQuien = caja.querySelector('.lopide-quien');
    var cajaOtro = caja.querySelector('.lopide-otro');
    selQuien.onchange = function () {
      cajaOtro.classList.toggle('oculto', selQuien.value !== 'otro');
    };

    function quienFirmado() {
      return (window.App && App.E && App.E.usuario) || '';
    }

    function leer() {
      var valor = selQuien.value;
      if (!valor) return null;
      var viaElegida = caja.querySelector('.lopide-via').value;
      var fecha = caja.querySelector('.lopide-fecha').value || U.hoyIso();

      if (valor === 'otro') {
        var nombre = caja.querySelector('.lopide-otro-nombre').value.trim();
        if (!nombre) return null;
        return {
          nombre: nombre,
          categoria: '',
          relacion: caja.querySelector('.lopide-otro-relacion').value.trim(),
          correo: caja.querySelector('.lopide-otro-correo').value.trim(),
          telefono: '',
          via: viaElegida,
          fecha: fecha,
          apuntadoPor: quienFirmado()
        };
      }

      var candidato = lista.filter(function (o) { return o.valor === valor; })[0];
      if (!candidato || !candidato.datos || !candidato.datos.nombre) return null;
      return {
        nombre: candidato.datos.nombre,
        categoria: candidato.datos.categoria || '',
        relacion: candidato.datos.relacion || '',
        correo: candidato.datos.correo || '',
        telefono: candidato.datos.telefono || '',
        via: viaElegida,
        fecha: fecha,
        apuntadoPor: quienFirmado()
      };
    }

    return { leer: leer };
  }

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "17-sep-2026", a partir de una fecha ISO (AAAA-MM-DD, sin hora):
     por texto, sin `new Date()`, para no depender de la zona horaria
     del navegador (el mismo motivo por el que U.aAaMmDd/U.fechaLegible
     tampoco usan Date). */
  function fechaCorta(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var mes = parseInt(p[1], 10);
    if (!mes || mes < 1 || mes > 12) return '';
    return String(parseInt(p[2], 10)) + '-' + MESES_CORTOS[mes - 1] + '-' + p[0];
  }

  var VIA_FRASE = { TELEFONO: 'por teléfono', CORREO: 'por correo electrónico',
                     IPASEN: 'por iPasen / Séneca', PRESENCIAL: 'en persona' };

  /* La línea legible de la ficha: "María López (Tutor legal 1) · por
     teléfono · 17-sep-2026". Cadena vacía si el asunto no tiene dato.
     `ficha` es la ficha entera del asunto (a.ficha), igual que
     App.textoVia(ficha): así lo llama js/ficha-asunto.js, en la
     misma fila que ese otro dato. */
  function texto(ficha) {
    var d = ficha && ficha.loPide;
    if (!d || !d.nombre) return '';
    var trozos = [d.nombre + (d.relacion ? ' (' + d.relacion + ')' : '')];
    var via = VIA_FRASE[d.via || ''];
    if (via) trozos.push(via);
    var fecha = fechaCorta(d.fecha);
    if (fecha) trozos.push(fecha);
    return trozos.join(' · ');
  }

  /* La dirección de quien lo pide, o cadena vacía. */
  function correoDe(ficha) {
    var d = ficha && ficha.loPide;
    return (d && d.correo) || '';
  }

  /* Cómo quedan las casillas de "Para" del cuadro de Correo y el campo
     "Otro correo" (docs/LO-PIDE.md, 6): con el correo de quien lo pide,
     si está entre `correos` se marca ella sola y se desmarcan las
     demás; si no está, ninguna casilla queda marcada y la dirección va
     a "Otro correo". Sin `correoLoPide`, de partida van marcadas todas
     las que no tuvieran ya una marca (lo de siempre en el alumnado, que
     suele ir a los dos tutores).

     Pura, sin tocar el DOM: así se puede probar sin cargar el cuadro de
     correo entero, que no expone nada hacia fuera. `elegidosDeAntes` es
     el estado de las casillas antes de llamarla (no se muta). */
  function elegirDestinatarios(correos, correoLoPide, elegidosDeAntes) {
    var lista = correos || [];
    var elegidos = Object.assign({}, elegidosDeAntes || {});
    if (!correoLoPide) {
      lista.forEach(function (c) { if (elegidos[c.dir] === undefined) elegidos[c.dir] = true; });
      return { elegidos: elegidos, otro: '' };
    }
    var normal = correoLoPide.toLowerCase();
    var enLista = lista.some(function (c) { return c.dir.toLowerCase() === normal; });
    lista.forEach(function (c) { elegidos[c.dir] = enLista && c.dir.toLowerCase() === normal; });
    return { elegidos: elegidos, otro: enLista ? '' : correoLoPide };
  }

  return {
    opciones: opciones, controles: controles, texto: texto, correoDe: correoDe,
    elegirDestinatarios: elegirDestinatarios, datosDeTutor: datosDeTutor
  };
})();
