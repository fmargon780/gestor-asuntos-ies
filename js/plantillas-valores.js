/* ============================================================
   plantillas-valores.js — los valores de un asunto para rellenar los
   huecos de una plantilla (`Plantillas.valoresDeAsunto`).

   Sacado tal cual de js/plantillas.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo del motor (cargar, rellenar, los valores de partida) se pide a
   `Plantillas._interno` (I). Se carga justo detrás de js/plantillas.js.
   ============================================================ */
(function () {
  if (typeof Plantillas === 'undefined' || !Plantillas._interno) return;
  var I = Plantillas._interno;

  /* ==========================================================
     LOS VALORES DE UN ASUNTO (docs/PLANTILLAS-DE-DOCUMENTO.md, 3.1
     y 3.2)

     Hasta el 16-sep-2026 esto era `valoresDePlantilla()`, privada de
     js/correo.js, y solo traía lo que hacía falta para el correo:
     nombre, grupo, curso, tipo, hoy, limite, usuario, centro y
     `campos`. Aquí se amplía con lo que hace falta para las
     plantillas de documento —el DNI, los tutores, la referencia según
     la categoría, la fecha en letra, los datos del centro...— y se
     hace pública, para que js/docx.js y js/plantillas-documento.js la
     usen igual que js/correo.js.

     Un solo sitio que sepa de dónde sale cada valor: los teléfonos,
     correos y tutores se leen del CSV **por el título de su columna**
     (como js/dni.js), nunca por su posición y nunca desde
     `persona.campos` para saber si una columna EXISTE (esa solo trae
     las que tienen dato). Lo que no se encuentre se queda vacío: lo
     dice `Plantillas.rellenar` en `faltan`, no esta función. */

  function categoriaDelAsunto(a) {
    return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
  }

  function tipoDelAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    return l.tipo || f.tipo || '';
  }

  function terceroDelAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    if (f.tercero) return f.tercero;
    if (l.resto && window.Nombres) return Nombres.terceroDeResto(l.resto);
    return '';
  }

  /* El nombre sin el número de identificación ni el NIF pegado detrás:
     lo mismo que hace hoy js/correo.js para el saludo. */
  function soloElNombreDe(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* El grupo y el año académico, si la carpeta no tiene ficha (se creó
     a mano) se sacan del propio nombre, igual que en js/correo.js. */
  function piezasDelNombreDe(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    var resto = String(l.resto || '');
    var curso = f.curso || (resto.match(/\b(\d{2}[-\/]\d{2})\b/) || [])[1] || '';
    var grupo = f.grupo || (resto.match(/\b(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\b/i) || [])[1] || '';
    return { curso: curso, grupo: grupo };
  }

  /* {nombreNatural}: "Nombre Apellido1 Apellido2", sin el código que
     va pegado al final (el mismo que se le quita en
     Relacionados.nombreEnOrdenNormal). En empresas y otros no hay nada
     que dar la vuelta: se deja tal cual. */
  function nombreNaturalDe(texto, categoria) {
    var t = String(texto || '').trim();
    if (!t || categoria === 'EMPRESAS' || categoria === 'OTROS' || categoria === 'ADMINISTRACIONES') return t;
    var coma = t.indexOf(',');
    if (coma === -1) return t;
    var apellidos = t.slice(0, coma).trim();
    var palabras = t.slice(coma + 1).trim().split(/\s+/);
    var ultima = palabras[palabras.length - 1] || '';
    if (palabras.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) palabras.pop();
    return (palabras.join(' ') + ' ' + apellidos).trim();
  }

  /* {{DNI}}: el del alumnado (js/dni.js) o, desde la fila 123, el documento
     entero del personal (nunca los 4 caracteres sueltos de {referencia}). */
  function dniDe(categoria, persona) {
    if (!persona) return '';
    if (categoria === 'ALUMNADO') return window.Dni ? (Dni.de(persona) || '') : '';
    if (categoria === 'PERSONAL' || categoria === 'TUTORES LEGALES') {
      var doc = String(persona.documento || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
      return doc.length > 4 ? doc : '';
    }
    return '';
  }

  /* {referencia}: cambia según la categoría (3.2). */
  function referenciaDe(categoria, persona) {
    if (!persona) return '';
    if (categoria === 'ALUMNADO') return persona.id || '';
    if (categoria === 'PERSONAL' || categoria === 'TUTORES LEGALES') {
      var doc = String(persona.documento || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
      return doc.slice(-4);
    }
    if (categoria === 'EMPRESAS') return persona.nif || '';
    if (categoria === 'OTROS') return persona.referencia || '';
    if (categoria === 'ADMINISTRACIONES') return persona.codigoCentro || persona.dir3 || '';
    return '';
  }

  var RE_TELEFONO = /telefono|movil/;
  var RE_CORREO = /correo|e-?mail/;

  /* El primer valor de `campos` cuyo título case con el patrón, leído
     por el título como js/dni.js y js/via-contacto.js. */
  function primerValorQueParezca(campos, patron) {
    var claves = Object.keys(campos || {});
    for (var i = 0; i < claves.length; i++) {
      if (!patron.test(U.normalizar(claves[i]))) continue;
      var v = String(campos[claves[i]] || '').trim();
      if (v) return v;
    }
    return '';
  }

  /* {tutor1}/{tutor2} y sus teléfonos y correos: solo alumnado. Desde
     el 17-sep-2026 (fila 28, docs/LO-PIDE.md) vive en js/lo-pide.js
     (`LoPide.opciones` también la necesita, para ofrecer "Tutor legal
     1/2" en "Lo pide"): aquí solo se llama, con lo de siempre si el
     módulo no ha cargado (por ejemplo, en una prueba que no lo carga). */
  function datosDeTutor(campos, numero) {
    if (window.LoPide) return LoPide.datosDeTutor(campos, numero);
    return { nombre: '', telefono: '', correo: '' };
  }

  /* El campo propio (js/campos.js) de un tipo de asunto, como nombre
     -> valor: lo mismo que hacía `camposDelAsunto` en js/correo.js. */
  function camposDelAsuntoDe(a) {
    if (!window.Campos || !window.App || !App.E) return {};
    var guardados = (a.ficha && a.ficha.campos) || {};
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipoDelAsunto(a)]) || [];
    var salida = {};
    config.forEach(function (cfg) {
      var g = guardados[Campos.claveDeCampo(cfg)];
      if (g && g.valor) salida[Campos.nombreDeCampo(cfg, App.E.campos)] = g.valor;
    });
    return salida;
  }

  var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                       'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function fechaLargaDe(d) {
    d = d || new Date();
    return d.getDate() + ' de ' + MESES_LARGOS[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /* {registro}: el código de registro (`26EM1234`) del documento más
     reciente de la carpeta que ya lo lleve en el nombre, sin depender
     de js/documentos.js ni de la lista de tipos de documento. Si el
     asunto no tiene carpeta a mano (`a.handle`), o ningún documento
     está registrado, se queda vacío. */
  function ultimoRegistroDe(nombres) {
    var candidatos = (nombres || []).map(function (n) {
      var m = String(n || '').match(/^\d{6}\s+(\d{2}[ES][MA]\d{4,6})\b/);
      return m ? { nombre: n, codigo: m[1] } : null;
    }).filter(Boolean);
    if (!candidatos.length) return '';
    candidatos.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
    return candidatos[0].codigo;
  }

  async function registroDelAsunto(a) {
    if (!a || !a.handle || !window.Carpetas) return '';
    try {
      var lista = await Carpetas.ficheros(a.handle);
      return ultimoRegistroDe(lista.map(function (f) { return f.nombre; }));
    } catch (e) { return ''; }
  }

  /* La persona (tercero) de este asunto, tal y como la trae el CSV de
     su categoría: es de ahí de donde salen el DNI, la referencia, los
     teléfonos, los correos y los tutores. `null` si no se encuentra o
     si no hay carpeta de datos señalada (por ejemplo, en las pruebas
     de lógica). */
  async function personaDelAsunto(categoria, terceroTexto) {
    if (!categoria || !terceroTexto || !window.Datos || !window.App || !App.E || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, terceroTexto, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, terceroTexto.replace(/[\s\d]+$/, ''), 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, soloElNombreDe(terceroTexto), 1);
      return lista.length ? lista[0] : null;
    } catch (e) { return null; }
  }

  /* Los datos del centro (firma, centro, localidad, dirección, código,
     cargo), ya normalizados. Se releen aquí en vez de fiarse de
     `cache`, para que valga aunque quien llame no haya llamado antes a
     `Plantillas.cargar`. */
  async function datosDelCentro() {
    if (window.App && App.E && App.E.gestor) {
      try { return await I.cargar(App.E.gestor); } catch (e) { /* sigue con lo que haya en cache */ }
    }
    return Plantillas.enMemoria() || I.limpio(null);
  }

  /* La función de la que habla 3.1: un solo argumento, el asunto tal y
     como lo trae `App.E.listaAbiertos`/`App.E.listaArchivo` (con
     `.ficha`, `.leido` y, si tiene carpeta, `.handle`). Async porque
     el DNI, los tutores y el registro salen de ficheros. */
  async function valoresDeAsunto(asunto, opciones) {
    var op = opciones || {};
    var a = asunto || {};
    var categoria = categoriaDelAsunto(a);
    var terceroTexto = terceroDelAsunto(a);
    var f = a.ficha || {};
    var p = piezasDelNombreDe(a);
    var datosCentro = await datosDelCentro();

    var persona = await personaDelAsunto(categoria, terceroTexto);
    var registro = await registroDelAsunto(a);

    var valores = {
      nombre: soloElNombreDe(terceroTexto),
      nombreNatural: nombreNaturalDe(terceroTexto, categoria),
      grupo: p.grupo,
      curso: p.curso,
      tipo: tipoDelAsunto(a),
      referencia: referenciaDe(categoria, persona),
      dni: dniDe(categoria, persona),
      telefono: persona ? primerValorQueParezca(persona.campos, RE_TELEFONO) : '',
      correo: persona ? primerValorQueParezca(persona.campos, RE_CORREO) : '',
      tutor1: '', tutor1telefono: '', tutor1correo: '',
      tutor2: '', tutor2telefono: '', tutor2correo: '',
      descripcion: f.descripcion || '',
      /* Fila 129: el hito actual; en el ARCHIVO, dónde se quedó. */
      estado: !window.EstadoHito || !a.nombre ? '' : (f.estado === 'cerrado' ? EstadoHito.textoArchivado(f) : EstadoHito.textoDeNombre(a.nombre)),
      registro: registro,
      hoy: U.fechaLegible(U.aAaMmDd(U.hoyIso())),
      hoyLargo: fechaLargaDe(),
      lugarYFecha: (datosCentro.localidad ? 'En ' + datosCentro.localidad + ', a ' : 'A ') + fechaLargaDe(),
      limite: f.limite ? U.fechaLegible(U.aAaMmDd(f.limite)) : '',
      usuario: (window.App && App.E && App.E.usuario) || '',
      centro: datosCentro.centro || I.POR_DEFECTO_CENTRO,
      localidad: datosCentro.localidad || '',
      provincia: datosCentro.provincia || '',
      direccionCentro: datosCentro.direccion || '',
      codigoCentro: datosCentro.codigo || '',
      cargo: datosCentro.cargo || '',
      consejeria: datosCentro.consejeria || I.POR_DEFECTO_CONSEJERIA || '',
      campos: camposDelAsuntoDe(a)
    };
    /* Fila 167: {departamento}, {departamentocorreo} y {organismooficial}. */
    var deAdministracion = window.Administraciones ? Administraciones.valoresDe(a)
      : { departamento: '', departamentocorreo: '', organismooficial: '' };
    Object.keys(deAdministracion).forEach(function (k) { valores[k] = deAdministracion[k]; });

    /* Desde un hito (fila 102): {{HITO}}, {{PLAZO DEL HITO}},
       {hecho:...} y {{LO QUE FALTA}} con lo del propio hito. Sin hito,
       no se ponen: se quedan vacíos sin contar como dato que falta. */
    if (op.hito) {
      var hito = op.hito;
      valores.hito = hito.titulo || '';
      valores['plazo del hito'] = hito.fecha ? U.fechaLegible(U.aAaMmDd(hito.fecha)) : '';
      if (op.conLoQueFalta !== false && window.HitosRequisitos && HitosRequisitos.textoLoQueFalta) {
        valores.loQueFalta = HitosRequisitos.textoLoQueFalta(hito, a) || '';   /* fila 138: del guion */
      }
      valores.hechos = {};
      try {
        var lista = op.hitosDelAsunto;
        if (!lista && window.Hitos && a.nombre) {
          var todos = await Hitos.leer();
          lista = (todos.porAsunto[a.nombre] || {}).hitos || [];
        }
        (function recorrer(l) {
          (l || []).forEach(function (h) {
            if (h.estado === 'hecho' && h.hechoEl) valores.hechos[U.normalizar(h.titulo)] = U.fechaLegible(U.aAaMmDd(h.hechoEl));
            (h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
          });
        })(lista);
      } catch (e) { /* sin hitos legibles, los {hecho:...} se quedan vacíos */ }
    }

    /* {{FORMULARIOS}} (20-sep-2026, fila 83, docs/PLANTILLAS-DEL-CENTRO.md,
       parte 3): los del tipo y de los hitos del asunto (fila 82), uno
       por línea, con su nombre y su dirección si la tiene. Sin
       ninguno, el hueco se queda vacío (nunca una línea suelta). */
    if (window.Formularios) {
      try {
        var clavesFormularios = await Formularios.clavesDelAsunto(a);
        var catalogoFormularios = await Formularios.cargar();
        valores.formularios = clavesFormularios.map(function (c) {
          var ficha = catalogoFormularios[c];
          if (!ficha) return '';
          return ficha.u ? (ficha.n + ' — ' + ficha.u) : ficha.n;
        }).filter(Boolean).join('\n');
      } catch (e) { valores.formularios = ''; }
    } else {
      valores.formularios = '';
    }

    /* {{FIRMANTE}} y compañía (20-sep-2026, fila 81): quien ocupaba el
       cargo firmante/de visto bueno de la PLANTILLA en la fecha del
       documento (la de hoy, salvo que `opciones.fecha` diga otra).
       `opciones.plantilla` es la fila de `documentos[]` que se está
       generando; sin ella (por ejemplo, para el correo, que no lleva
       firmante), estos huecos se quedan vacíos, como cualquier otro
       dato que falte. */
    var fechaDelDocumento = op.fecha || U.hoyIso();
    valores.firmante = ''; valores['cargo firmante'] = ''; valores['tratamiento firmante'] = '';
    valores['visto bueno'] = ''; valores['cargo visto bueno'] = ''; valores['tratamiento visto bueno'] = '';
    var firmante = null, vistoBueno = null;
    if (op.plantilla && window.Cargos) {
      if (op.plantilla.firmante) {
        firmante = await Cargos.enFecha(op.plantilla.firmante, fechaDelDocumento);
        if (firmante) {
          valores.firmante = firmante.persona;
          valores['cargo firmante'] = firmante.nombre;
          valores['tratamiento firmante'] = firmante.tratamiento;
        }
      }
      if (op.plantilla.vistoBueno) {
        vistoBueno = await Cargos.enFecha(op.plantilla.vistoBueno, fechaDelDocumento);
        if (vistoBueno) {
          valores['visto bueno'] = vistoBueno.persona;
          valores['cargo visto bueno'] = vistoBueno.nombre;
          valores['tratamiento visto bueno'] = vistoBueno.tratamiento;
        }
      }
    }

    /* {quienlopide} y compañía (17-sep-2026, fila 28, docs/LO-PIDE.md):
       vacíos, como cualquier otro hueco, cuando el asunto no tiene el
       dato; así salen en "Faltan datos" sin nada especial que hacer
       aquí. */
    var loPideDato = f.loPide || null;
    valores.quienlopide = loPideDato ? (loPideDato.nombre || '') : '';
    valores.quienlopiderelacion = loPideDato ? (loPideDato.relacion || '') : '';
    var viaLoPide = (loPideDato && loPideDato.via && window.Nombres) ? Nombres.via(loPideDato.via) : null;
    valores.quienlopidevia = viaLoPide ? viaLoPide.texto : '';
    valores.quienlopidefecha = (loPideDato && loPideDato.fecha)
      ? U.fechaLegible(U.aAaMmDd(loPideDato.fecha)) : '';

    if (categoria === 'ALUMNADO' && persona) {
      var t1 = datosDeTutor(persona.campos, 1);
      var t2 = datosDeTutor(persona.campos, 2);
      valores.tutor1 = t1.nombre; valores.tutor1telefono = t1.telefono; valores.tutor1correo = t1.correo;
      valores.tutor2 = t2.nombre; valores.tutor2telefono = t2.telefono; valores.tutor2correo = t2.correo;
    }

    /* Fila 111: los sexos de cada persona, para el masculino o el femenino
       (Plantillas.rellenar -> Genero.resolver); el tratamiento con barra
       («El/La Director/a») se resuelve aquí con el de quien ocupa el cargo. */
    if (window.Genero) {
      valores.categoria = categoria;
      valores.sexos = await Genero.sexosDeAsunto(persona, categoria, firmante || null, vistoBueno || null);
      ['firmante', 'visto bueno'].forEach(function (q) {
        var s = valores.sexos[q.replace(' ', '')];
        valores['tratamiento ' + q] = Genero.resolver(valores['tratamiento ' + q], { tercero: s, firmante: s }).texto;
      });
    }

    /* {firma}: el texto de la firma del centro, ya con sus propios
       huecos ({usuario}, {centro}...) sustituidos por lo de arriba. */
    valores.firma = I.rellenar(datosCentro.firma || I.POR_DEFECTO_FIRMA, valores).texto;

    return valores;
  }

  Plantillas.valoresDeAsunto = valoresDeAsunto;
})();
