/* ============================================================
   ficha-tercero.js — "Datos y contacto" del tercero de un asunto.

   17-sep-2026, fila 37 de la cola (docs/FICHA-DEL-ASUNTO-NUEVA.md).
   `js/ficha-asunto.js` ya andaba por las 1.100 líneas y el encargo pide
   explícitamente no engordarlo más: este fichero hace todo el trabajo
   de "Datos y contacto" (la línea resumen y la ventana "Ver todo") y
   se habla con la ficha solo por `window.FichaTercero.pintarLinea(caja,
   a)`, igual que `window.FichaDocumentos.pintar(a, ...)`.

   La búsqueda del tercero es la misma que hacía antes
   `pintarContacto` en js/ficha-asunto.js: por el nombre que trae la
   ficha del asunto o, si se creó a mano, por lo que queda del nombre
   de la carpeta después del tipo.
   ============================================================ */
(function () {

  var ICONO_COPIAR = '⧉';

  /* ---------- buscar al tercero ----------

     La misma cascada de siempre: el nombre suele llevar pegado el
     número de identificación o el NIF, y a veces el año académico. */
  /* El orden de la fila 66 (docs/CONTACTO-GUARDADO-EN-LA-FICHA.md, 2.2):
     1) el CSV, como siempre, que es el dato más fresco; 2) si no está,
     `ficha.contacto`, la foto guardada al crear el asunto; 3) si
     tampoco hay eso, sin datos, como hasta ahora. */
  async function buscarPersona(a) {
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';
    var contacto = a.ficha && a.ficha.contacto;

    if (!categoria || !quien) {
      return { categoria: categoria, persona: null,
               aviso: 'Este asunto no dice a qué tercero pertenece.' };
    }

    if (App.E.datos) {
      try {
        var fuente = await Datos.cargar(App.E.datos, categoria);
        var encontrados = Datos.buscar(fuente.lista, quien, 1);
        if (!encontrados.length) {
          encontrados = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
        }
        if (!encontrados.length) {
          var corto = quien.replace(/\b\d{2}-\d{2}\b/, '').replace(/\s+\S*\d\S*\s*$/, '').trim();
          if (corto) encontrados = Datos.buscar(fuente.lista, corto, 1);
        }
        if (encontrados.length) return { categoria: categoria, persona: encontrados[0] };
      } catch (e) {
        if (!contacto) {
          return { categoria: categoria, persona: null,
                   aviso: 'No he podido leer el fichero de datos: ' + e.message };
        }
      }
    }

    if (contacto) {
      return { categoria: categoria, persona: Datos.personaDesdeFoto(contacto, categoria) };
    }

    return { categoria: categoria, persona: null,
             aviso: quien + ' no aparece en el fichero de ' + categoria + '.' };
  }

  /* ---------- copiar al pulsar ----------

     js/copiar.js hace justo esto, pero es privado a sus propias
     pantallas (nada colgado de `window`): se rehace aquí en pequeño,
     sin tocar ese fichero. */
  function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; })
        .catch(function () { return copiarALaAntigua(texto); });
    }
    return Promise.resolve(copiarALaAntigua(texto));
  }

  function copiarALaAntigua(texto) {
    try {
      var c = document.createElement('textarea');
      c.value = texto;
      c.setAttribute('readonly', '');
      c.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
      document.body.appendChild(c);
      c.select();
      var ok = document.execCommand('copy');
      c.parentNode.removeChild(c);
      return ok;
    } catch (e) { return false; }
  }

  function botonCopiar(texto, titulo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dato-copiable';
    b.title = titulo || ('Copiar ' + texto);
    b.textContent = ICONO_COPIAR;
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      copiarTexto(texto).then(function (ok) {
        if (!ok) { U.aviso('No he podido copiarlo. Es ' + texto + '.', 'malo'); return; }
        b.classList.add('copiado');
        setTimeout(function () { b.classList.remove('copiado'); }, 1200);
      });
    };
    return b;
  }

  /* Un trozo de la línea, con su dato y el botón de copiar al lado.
     Lo que se enseña (con la etiqueta delante, "Tutor legal 1: ...")
     puede ser distinto de lo que se copia (solo el dato, sin ella). */
  function datoConCopiar(textoMostrado, valorACopiar, ayuda) {
    var span = document.createElement('span');
    span.className = 'tercero-dato-copiable';
    span.appendChild(document.createTextNode(textoMostrado + ' '));
    span.appendChild(botonCopiar(valorACopiar, ayuda));
    return span;
  }

  /* ---------- la línea resumen ---------- */

  function puntoHtml() { return '<span class="tercero-punto">·</span>'; }

  function grupoHtml(grupo) {
    if (!grupo || !grupo.texto) return '';
    if (!grupo.clase) return '<span class="tercero-grupo">' + U.escapar(grupo.texto) + '</span>';
    return '<span class="tercero-etiqueta tercero-etiqueta-' + grupo.clase + '">' +
           U.escapar(grupo.texto) + '</span>';
  }

  function suelto(texto) {
    return '<section class="ficha-bloque">' +
             '<h3 class="ficha-titulo">Datos y contacto</h3>' +
             '<p class="explica">' + U.escapar(texto) + '</p>' +
           '</section>';
  }

  var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                       'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  /* AAAA-MM-DD -> "5 de septiembre de 2026", para el aviso de que los
     datos son una foto guardada, no de hoy. */
  function fechaLargaDeIso(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return iso || '';
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
    if (!y || !m || !d || m < 1 || m > 12) return iso || '';
    return d + ' de ' + MESES_LARGOS[m - 1] + ' de ' + y;
  }

  function avisoDeFotoHtml(persona) {
    if (!persona || !persona.foto) return '';
    return '<p class="tercero-detalle">Datos guardados el ' +
      U.escapar(fechaLargaDeIso(persona.fotoFecha)) +
      '; esta persona ya no está en ' + U.escapar(persona.fotoFichero || 'el fichero') + '.</p>';
  }

  function montarLinea(caja, persona, categoria, resumen) {
    caja.innerHTML =
      '<section class="ficha-bloque">' +
        '<h3 class="ficha-titulo">Datos y contacto</h3>' +
        '<div class="tercero-linea">' +
          '<span class="tercero-nombre">' + U.escapar(resumen.nombre) + '</span>' +
          (resumen.grupo && resumen.grupo.texto ? puntoHtml() + grupoHtml(resumen.grupo) : '') +
          (resumen.edad ? puntoHtml() + '<span class="tercero-edad">' + U.escapar(resumen.edad) + '</span>' : '') +
          (resumen.telefono ? puntoHtml() + '<span class="tercero-hueco" id="tercero-telefono-hueco"></span>' : '') +
          (resumen.documento && resumen.documento.valor
            ? puntoHtml() + '<span class="tercero-hueco" id="tercero-dni-hueco"></span>' : '') +
          (resumen.documento && resumen.documento.falta
            ? puntoHtml() + '<span class="tercero-falta-dni">FALTA EL DNI (' +
              U.escapar(String(resumen.documento.edad)) + ' años, ya debería tenerlo)</span>' : '') +
          '<button type="button" class="boton tercero-vertodo" id="tercero-ver-todo">Ver todo</button>' +
        '</div>' +
        (resumen.grupo && resumen.grupo.detalle
          ? '<p class="tercero-detalle">' + U.escapar(resumen.grupo.detalle) + '</p>' : '') +
        avisoDeFotoHtml(persona) +
      '</section>';

    var huecoTel = document.getElementById('tercero-telefono-hueco');
    if (huecoTel && resumen.telefono) {
      var textoTel = (resumen.telefono.etiqueta ? resumen.telefono.etiqueta + ': ' : '') + resumen.telefono.valor;
      huecoTel.appendChild(datoConCopiar(textoTel, resumen.telefono.valor, 'Copiar el teléfono'));
    }
    var huecoDni = document.getElementById('tercero-dni-hueco');
    if (huecoDni && resumen.documento && resumen.documento.valor) {
      huecoDni.appendChild(datoConCopiar('DNI ' + resumen.documento.valor, resumen.documento.valor, 'Copiar el DNI'));
    }
    var btn = document.getElementById('tercero-ver-todo');
    if (btn) btn.onclick = function () { abrirVerTodo(persona, categoria, resumen); };
  }

  /* La usa js/ficha-asunto.js (`pintarContacto`): busca al tercero y
     pinta la línea, o el aviso que toque si no se encuentra. */
  async function pintarLinea(caja, a) {
    if (!caja) return;
    caja.innerHTML = suelto('Buscando…');
    var r = await buscarPersona(a);
    if (!r.persona) { caja.innerHTML = suelto(r.aviso || 'No encontrado.'); return; }
    var resumen = Datos.resumenDeTercero(r.persona, r.categoria);
    montarLinea(caja, r.persona, r.categoria, resumen);
  }

  /* ---------- la ventana "Ver todo" ---------- */

  function filasHtml(lista) {
    var buenas = (lista || []).filter(function (f) { return f && f.valor; });
    if (!buenas.length) return '<p class="explica">Nada que enseñar aquí.</p>';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  function seccion(titulo, contenidoHtml, claseExtra) {
    return '<div class="vertodo-seccion' + (claseExtra ? ' ' + claseExtra : '') + '">' +
             '<h4>' + U.escapar(titulo) + '</h4>' + contenidoHtml +
           '</div>';
  }

  function filaDato(etiqueta, valor, ayuda) {
    var div = document.createElement('div');
    div.className = 'tutor-dato';
    div.appendChild(document.createTextNode((etiqueta ? etiqueta + ' ' : '') + valor + ' '));
    div.appendChild(botonCopiar(valor, ayuda));
    return div;
  }

  /* Una tarjeta por tutor (4.1 del encargo): nombre, relación,
     teléfonos y correos, cada uno con su copiar. Sin botón
     "Escribirle": `js/correo.js` no expone ninguna función pública
     para abrir su cuadro con un destinatario puesto (su `abrirCuadro`
     es privado a su propio IIFE) y tocar ese fichero se sale de lo que
     pide esta fila; queda anotado en `docs/COLA.md`. */
  function tarjetaTutor(tutor) {
    var div = document.createElement('div');
    div.className = 'tutor-tarjeta';

    var nombre = document.createElement('p');
    nombre.className = 'tutor-nombre';
    nombre.textContent = tutor.nombre || ('Tutor legal ' + tutor.numero);
    div.appendChild(nombre);

    if (tutor.relacion) {
      var relacion = document.createElement('p');
      relacion.className = 'suave';
      relacion.style.margin = '0 0 6px';
      relacion.textContent = tutor.relacion;
      div.appendChild(relacion);
    }

    tutor.telefonos.forEach(function (t) { div.appendChild(filaDato('', t, 'Copiar el teléfono')); });
    tutor.correos.forEach(function (c) { div.appendChild(filaDato('', c, 'Copiar el correo')); });
    if (tutor.documento) div.appendChild(filaDato('DNI', tutor.documento, 'Copiar el DNI'));
    tutor.otros.forEach(function (o) {
      var fila = document.createElement('div');
      fila.className = 'tutor-dato suave';
      fila.textContent = o.titulo + ': ' + o.valor;
      div.appendChild(fila);
    });

    return div;
  }

  function ventanaAlumnado(persona, resumen) {
    var dest = Datos.destacadosAlumno(persona);
    var filaDni = dest.destacados.filter(function (f) { return U.normalizar(f.titulo) === 'dni'; })[0];
    var tutores = Datos.tutoresDe(persona);

    var identificacion = filasHtml([
      { titulo: 'Nombre', valor: persona.nombre },
      { titulo: 'DNI', valor: filaDni ? filaDni.valor : '' },
      { titulo: 'Nº de identificación escolar', valor: persona.id },
      { titulo: 'Fecha de nacimiento', valor: persona.fechaNac },
      { titulo: 'Edad', valor: resumen.edad }
    ]);

    var matricula = filasHtml([
      { titulo: 'Curso', valor: persona.matriculado ? persona.curso : '' },
      { titulo: 'Unidad', valor: persona.matriculado ? persona.unidad : '' },
      { titulo: 'Estado de la matrícula', valor: persona.matriculado
          ? 'Matriculado en el curso ' + U.cursoDeAno(persona.ano)
          : (persona.solicitante ? 'Solicitante, todavía sin matricular' : 'No matriculado este curso') },
      { titulo: 'Última matrícula', valor: (!persona.matriculado && !persona.solicitante && persona.anoUltima)
          ? (U.cursoDeAno(persona.anoUltima) +
             (persona.cursoUltima ? ' · ' + persona.cursoUltima : '') +
             (persona.unidadUltima ? ' · ' + persona.unidadUltima : ''))
          : '' }
    ]);

    var contacto = filasHtml(dest.destacados.filter(function (f) {
      var t = U.normalizar(f.titulo);
      return /telefono|movil|correo|e-?mail/.test(t) && !/tutor|padre|madre|responsable|familia/.test(t);
    }));

    var otrosFamilia = filasHtml(tutores.otros);
    var resto = filasHtml(dest.resto);

    var html =
      '<div class="vertodo-cols">' +
        seccion('Identificación', identificacion) +
        seccion('Matrícula y grupo', matricula) +
        seccion('Contacto del alumno', contacto) +
        seccion('Tutores legales', tutores.length
          ? '<div class="tutores-lista"></div>'
          : '<p class="explica">No hay tutores legales en el fichero.</p>', 'vertodo-tutores') +
        seccion('Otros datos de la familia', otrosFamilia) +
      '</div>' +
      '<details class="vertodo-resto"><summary>Todo lo que trae Séneca</summary>' + resto + '</details>';

    return { html: html, tutores: tutores };
  }

  function ventanaPersonal(persona) {
    var dest = Datos.destacadosPersona(persona);

    var identificacion = filasHtml([
      { titulo: 'Nombre', valor: persona.nombre },
      { titulo: 'DNI', valor: persona.documento }
    ]);
    var situacion = filasHtml([
      { titulo: 'Puesto', valor: persona.puesto },
      { titulo: 'Situación', valor: persona.enElCentro
          ? 'En el centro' + (persona.fechaCese ? ' hasta el ' + persona.fechaCese : '')
          : ('Ya no está en el centro' + (persona.cursoUltimo ? ' · último curso aquí: ' + persona.cursoUltimo : '')) }
    ]);
    var contacto = filasHtml(dest.destacados.filter(function (f) {
      return /telefono|movil|correo|e-?mail|cuenta/i.test(f.titulo);
    }));
    var resto = filasHtml(dest.resto);

    var html =
      '<div class="vertodo-cols">' +
        seccion('Identificación', identificacion) +
        seccion('Situación en el centro', situacion) +
        seccion('Contacto', contacto) +
      '</div>' +
      '<details class="vertodo-resto"><summary>Todo lo que trae Séneca</summary>' + resto + '</details>';

    return { html: html, tutores: [] };
  }

  function ventanaGenerica(persona, categoria) {
    var extra = categoria === 'EMPRESAS'
      ? [{ titulo: 'Nombre comercial', valor: persona.comercial }, { titulo: 'NIF', valor: persona.nif }]
      : [{ titulo: 'Referencia', valor: persona.referencia }];
    var campos = persona.campos || {};
    var claves = Object.keys(campos);

    var identificacion = filasHtml([{ titulo: 'Nombre', valor: persona.nombre }].concat(extra));
    var contacto = filasHtml(claves.filter(function (c) { return /telefono|movil|correo|e-?mail/i.test(c); })
      .map(function (c) { return { titulo: c, valor: campos[c] }; }));
    var resto = filasHtml(claves.filter(function (c) { return !/telefono|movil|correo|e-?mail/i.test(c); })
      .map(function (c) { return { titulo: c, valor: campos[c] }; }));

    var html =
      '<div class="vertodo-cols">' +
        seccion('Identificación', identificacion) +
        seccion('Contacto', contacto) +
      '</div>' +
      '<details class="vertodo-resto"><summary>Todo lo que trae</summary>' + resto + '</details>';

    return { html: html, tutores: [] };
  }

  async function abrirVerTodo(persona, categoria, resumen) {
    var construido = categoria === 'ALUMNADO' ? ventanaAlumnado(persona, resumen)
      : categoria === 'PERSONAL' ? ventanaPersonal(persona)
      : ventanaGenerica(persona, categoria);

    var promesa = U.preguntar(persona.nombre, construido.html, 'Cerrar', true);
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho');

    if (construido.tutores && construido.tutores.length) {
      var lista = document.querySelector('.vertodo-tutores .tutores-lista');
      if (lista) construido.tutores.forEach(function (t) { lista.appendChild(tarjetaTutor(t)); });
    }

    await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho');
  }

  /* Expuesta para js/ficha-nombre-acciones.js (18-sep-2026, fila 58,
     docs/AJUSTES-DE-USO-2026-09-18.md, 1): los botones "Nombre" y
     "DNI"/"CIF" de la fila de copiar necesitan el mismo tercero que ya
     busca `pintarLinea`, sin inventar otra búsqueda. `Datos.cargar`
     guarda en caché el fichero leído, así que buscarlo dos veces no
     vuelve a leer el CSV. */
  async function datosBasicos(a) {
    var r = await buscarPersona(a);
    if (!r.persona) return { categoria: r.categoria, persona: null, resumen: null };
    return { categoria: r.categoria, persona: r.persona,
             resumen: Datos.resumenDeTercero(r.persona, r.categoria) };
  }

  window.FichaTercero = {
    pintarLinea: pintarLinea, datosBasicos: datosBasicos,
    /* para las pruebas: la cascada CSV -> ficha.contacto -> nada, sin
       tener que montar un DOM entero para leer el resultado. */
    _buscarPersona: buscarPersona
  };

})();
