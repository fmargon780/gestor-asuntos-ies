/* ============================================================
   ficha-tercero-alumno.js — la ventana «Ver todo» de un alumno, en
   tarjetas (24-sep-2026, fila 108, docs/CONTACTO-EN-TARJETAS.md).

   Antes, cinco columnas (Identificación, Matrícula y grupo, Contacto
   del alumno, Tutores legales, Otros datos de la familia). Ahora:

   - Cabecera: círculo con iniciales, el nombre en orden natural, la
     edad y la fecha de nacimiento, y tres etiquetas (unidad, estado de
     la matrícula, NIE con su copiar).
   - Una fila de tarjetas del mismo tamaño: el alumno, tutor 1, tutor 2
     (solo las que traen algo) y, si hay algo, «Otros datos de la
     familia». Dentro, siempre teléfono(s), correo(s) y DNI, cada uno con
     icono y copiar. Un teléfono repetido sale una vez; si el del alumno
     es el de un tutor, «mismo que la tutora 1».
   - Abajo: «Correo a la familia» (el cuadro de Correo de siempre, con
     los correos de los tutores puestos; la aplicación no envía nada),
     «Copiar todo el contacto» y el desplegable «Todo lo que trae Séneca».

   Los tutores salen de `Datos.tutoresDe` (js/datos-tutores.js). Lo usa
   js/ficha-tercero.js (`abrirVerTodo`); las ventanas de personal y del
   resto de terceros no cambian.
   ============================================================ */
var FichaTerceroAlumno = (function () {

  var ICONO_COPIAR = '⧉';
  var ICONOS = { telefono: '☎', correo: '✉', dni: '🪪' };

  function esDeFamilia(t) { return /tutor|padre|madre|responsable|familia/.test(t); }
  function soloDigitos(tel) { return String(tel || '').replace(/[^\d+]/g, ''); }

  /* 655645995 -> 655 645 995 (se enseña así; se copia sin espacios). */
  function telefonoLegible(tel) {
    var d = soloDigitos(tel);
    if (!/^\+?\d{6,}$/.test(d)) return String(tel || '').trim();
    var prefijo = '';
    if (d.charAt(0) === '+') { prefijo = d.slice(0, 3) + ' '; d = d.slice(3); }
    return prefijo + d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
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
      U.copiar(texto, null, { avisoFallo: 'No he podido copiarlo. Es ' + texto + '.' }).then(function (ok) {
        if (!ok) return;
        b.classList.add('copiado');
        setTimeout(function () { b.classList.remove('copiado'); }, 1200);
      });
    };
    return b;
  }

  /* ---------- los datos, ya ordenados ---------- */

  function sexoDelAlumno(persona) {
    var campos = persona.campos || {};
    var clave = Object.keys(campos).filter(function (k) {
      var t = U.normalizar(k);
      return /sexo|genero/.test(t) && !esDeFamilia(t);
    })[0];
    return clave ? Datos.sexoNormalizado(campos[clave]) : '';
  }

  function contactoDelAlumno(persona) {
    var campos = persona.campos || {};
    var telefonos = [], correos = [];
    Object.keys(campos).forEach(function (k) {
      var t = U.normalizar(k);
      if (esDeFamilia(t)) return;
      var v = String(campos[k] || '').trim();
      if (!v) return;
      if (/telefono|movil/.test(t)) {
        if (!telefonos.some(function (x) { return soloDigitos(x) === soloDigitos(v); })) telefonos.push(v);
      } else if (/correo|e-?mail/.test(t)) {
        if (correos.indexOf(v) === -1) correos.push(v);
      }
    });
    var dni = window.Dni ? window.Dni.de(persona) : '';
    if (!dni) {
      var fila = Datos.destacadosAlumno(persona).destacados.filter(function (f) { return U.normalizar(f.titulo) === 'dni'; })[0];
      dni = fila ? fila.valor : '';
    }
    return { telefonos: telefonos, correos: correos, documento: dni };
  }

  /* «Tutora 1», «Tutor 2», «Tutor legal 1»; si Séneca trae la relación,
     manda ella. Nunca «Madre»/«Padre» por el sexo. */
  function etiquetaDeTutor(tutor) {
    if (tutor.relacion) return tutor.relacion;
    if (tutor.sexo === 'M') return 'Tutora ' + tutor.numero;
    if (tutor.sexo === 'H') return 'Tutor ' + tutor.numero;
    return 'Tutor legal ' + tutor.numero;
  }

  function conArticulo(etiqueta) {
    return /^tutora\b/i.test(etiqueta) ? 'la ' + etiqueta.toLowerCase() : 'el ' + etiqueta.toLowerCase();
  }

  /* ---------- el HTML ---------- */

  function circulo(iniciales, clase) {
    return '<span class="vt-circulo ' + clase + '">' + U.escapar(iniciales || '?') + '</span>';
  }

  function dniDe(persona) {
    var d = window.Dni ? window.Dni.de(persona) : '';
    if (d) return d;
    var fila = Datos.destacadosAlumno(persona).destacados.filter(function (f) { return U.normalizar(f.titulo) === 'dni'; })[0];
    return fila ? fila.valor : '';
  }

  function cabeceraHtml(persona, resumen) {
    var nombre = Datos.nombreNatural(persona.nombre);
    var sexo = sexoDelAlumno(persona);
    var fecha = persona.fechaNac || '';
    var nacido = fecha
      ? (sexo === 'M' ? 'nacida el ' : sexo === 'H' ? 'nacido el ' : 'nacimiento: ') + fecha : '';
    var linea = [resumen && resumen.edad, nacido].filter(Boolean).join(' · ');

    var estado = persona.matriculado
      ? { texto: 'Matriculado ' + U.cursoDeAno(persona.ano), clase: 'vt-etq-verde' }
      : persona.solicitante ? { texto: 'Solicitante', clase: 'vt-etq-gris' }
      : { texto: 'No matriculado', clase: 'vt-etq-gris' };

    return '<div class="vt-cabecera">' +
      circulo(Datos.iniciales(nombre), 'vt-circulo-alumno') +
      '<div class="vt-cabecera-texto">' +
        '<div class="vt-nombre">' + U.escapar(nombre) + '</div>' +
        (linea ? '<div class="vt-sub">' + U.escapar(linea) + '</div>' : '') +
      '</div>' +
      '<div class="vt-etiquetas">' +
        (persona.matriculado && persona.unidad ? '<span class="vt-etq vt-etq-azul">' + U.escapar(persona.unidad) + '</span>' : '') +
        '<span class="vt-etq ' + estado.clase + '">' + U.escapar(estado.texto) + '</span>' +
        (persona.id ? '<span class="vt-etq vt-etq-gris" id="vt-nie">NIE ' + U.escapar(persona.id) + ' </span>' : '') +
        (dniDe(persona) ? '<span class="vt-etq vt-etq-gris" id="vt-dni">DNI ' + U.escapar(dniDe(persona)) + ' </span>' : '') +
      '</div>' +
    '</div>';
  }

  /* Una línea: icono, dato (y, si toca, «mismo que…» en gris), copiar. */
  function lineaDato(clase, mostrado, aCopiar, pie) {
    var div = document.createElement('div');
    div.className = 'vt-dato vt-dato-' + clase;
    div.innerHTML = '<span class="vt-icono">' + ICONOS[clase] + '</span>' +
      '<span class="vt-valor">' + U.escapar(mostrado) + '</span>' +
      (pie ? '<span class="vt-pie">' + U.escapar(pie) + '</span>' : '');
    div.appendChild(botonCopiar(aCopiar, 'Copiar ' + (clase === 'dni' ? 'el DNI' : clase === 'correo' ? 'el correo' : 'el teléfono')));
    return div;
  }

  function tarjeta(clase, cabeceraHtmlTexto, contacto, igualA) {
    var div = document.createElement('div');
    div.className = 'vt-tarjeta ' + clase;
    div.innerHTML = cabeceraHtmlTexto;
    (contacto.telefonos || []).forEach(function (t) {
      div.appendChild(lineaDato('telefono', telefonoLegible(t), soloDigitos(t), igualA && igualA(t, 'telefono')));
    });
    (contacto.correos || []).forEach(function (c) {
      div.appendChild(lineaDato('correo', c, c, igualA && igualA(c, 'correo')));
    });
    if (contacto.documento) div.appendChild(lineaDato('dni', contacto.documento, contacto.documento, 'DNI'));
    if (!(contacto.telefonos || []).length && !(contacto.correos || []).length && !contacto.documento) {
      var nada = document.createElement('p');
      nada.className = 'explica';
      nada.textContent = 'Sin teléfono, correo ni DNI en el fichero.';
      div.appendChild(nada);
    }
    return div;
  }

  function filasHtml(lista) {
    var buenas = (lista || []).filter(function (f) { return f && f.valor; });
    if (!buenas.length) return '<p class="explica">Nada que enseñar aquí.</p>';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- «Copiar todo el contacto» ---------- */

  /* Los «otros datos de la familia» que son un teléfono o un correo (Séneca a
     veces los trae sin número de tutor: «Teléfono del tutor», «Correo del tutor»). */
  function otrosDeContacto(otros) {
    return (otros || []).filter(function (f) { return f && f.valor && /telefono|movil|correo|e-?mail/.test(U.normalizar(f.titulo)); });
  }

  /* Todos los correos de la familia: los de cada tutor y los sueltos. */
  function correosDeFamilia(tutores, otros) {
    var lista = [];
    function meter(c) { c = String(c || '').trim(); if (c && lista.indexOf(c) === -1) lista.push(c); }
    tutores.forEach(function (t) { t.correos.forEach(meter); });
    otrosDeContacto(otros).forEach(function (f) {
      if (!/correo|e-?mail/.test(U.normalizar(f.titulo))) return;
      String(f.valor).split(/[;,\s]+/).forEach(function (c) { if (c.indexOf('@') !== -1) meter(c); });
    });
    return lista;
  }

  function textoDeTodo(persona, alumno, tutores, otros) {
    var lineas = [];
    var nombre = Datos.nombreNatural(persona.nombre) + (persona.matriculado && persona.unidad ? ' (' + persona.unidad + ')' : '');
    lineas.push([nombre].concat(alumno.telefonos.map(soloDigitos), alumno.correos).join(' · '));
    tutores.forEach(function (t) {
      lineas.push([etiquetaDeTutor(t) + ': ' + (t.nombre || etiquetaDeTutor(t))]
        .concat(t.telefonos.map(soloDigitos), t.correos).join(' · '));
    });
    otrosDeContacto(otros).forEach(function (f) { lineas.push(f.titulo + ': ' + f.valor); });
    return lineas.join('\n');
  }

  /* ---------- la familia y el contacto (tarjeta 1 de la ficha) ---------- */

  /* Fila 252: lo que antes era el cuerpo de «Ver todo» (el alumno, cada
     tutor, otros datos de la familia, hermanos y los dos botones), como un
     bloque para la tarjeta «Familia y contacto» de js/ficha-persona.js.
     `alPedirCorreo`: qué hacer al pulsar «Correo a la familia» (sale solo
     con asunto `a`). Devuelve { nodo, resumen, correosFamilia, tutores,
     textoDeTodo }. */
  function familia(persona, a, alPedirCorreo) {
    var tutores = Datos.tutoresDe(persona);
    var alumno = contactoDelAlumno(persona);
    var otrosFamilia = (tutores.otros || []).slice();
    tutores.forEach(function (t) { otrosFamilia = otrosFamilia.concat(t.otros || []); });
    var correosFamilia = correosDeFamilia(tutores, otrosFamilia);

    var nodo = document.createElement('div');
    var caja = document.createElement('div');
    caja.className = 'vt-tarjetas';
    caja.id = 'vt-tarjetas';
    nodo.appendChild(caja);

    /* «mismo que la tutora 1», para el teléfono o el correo del alumno. */
    function igualA(valor, clase) {
      for (var i = 0; i < tutores.length; i++) {
        var t = tutores[i];
        var lista = clase === 'telefono' ? t.telefonos.map(soloDigitos) : t.correos;
        var buscado = clase === 'telefono' ? soloDigitos(valor) : valor;
        if (lista.indexOf(buscado) !== -1) return 'mismo que ' + conArticulo(etiquetaDeTutor(t));
      }
      return '';
    }

    /* Fila 252: sin teléfono ni correo del alumno, no hay tarjeta «El alumno» (el DNI ya está en la cabecera). */
    if (alumno.telefonos.length || alumno.correos.length) {
      caja.appendChild(tarjeta('vt-tarjeta-alumno',
        '<div class="vt-tarjeta-titulo"><span class="vt-icono">👤</span>El alumno</div>',
        /* El DNI ya está en la cabecera: no se repite aquí. */
        Object.assign({}, alumno, { documento: '' }), igualA));
    }
    tutores.forEach(function (t) {
      var etiqueta = etiquetaDeTutor(t);
      caja.appendChild(tarjeta('vt-tarjeta-tutor vt-tarjeta-tutor' + t.numero,
        '<div class="vt-tutor-cabecera">' + circulo(t.iniciales, 'vt-circulo-tutor' + t.numero) +
          '<div><div class="vt-tutor-nombre">' + U.escapar(t.nombre || etiqueta) + '</div>' +
          '<span class="vt-etq-chica">' + U.escapar(etiqueta) + '</span></div>' +
        '</div>', t, null));
    });
    if (otrosFamilia.length) {
      var otros = document.createElement('div');
      otros.className = 'vt-tarjeta vt-tarjeta-otros';
      otros.innerHTML = '<div class="vt-tarjeta-titulo">Otros datos de la familia</div>' + filasHtml(otrosFamilia);
      caja.appendChild(otros);
    }

    /* Fila 125: «Hermanos en el centro» (si ya se cargó la lista de Personas). */
    if (window.PersonasFamilias) {
      var hh = PersonasFamilias.filasConHermanos([], persona, function (filas) {
        return filas.map(function (f) { return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' + U.escapar(f.valor) + '</span></div>'; }).join('');
      });
      if (hh) {
        var h = document.createElement('div');
        h.className = 'ficha-datos fp-hermanos';
        h.innerHTML = hh;
        nodo.appendChild(h);
        PersonasFamilias.engancharHermanos(nodo);
      }
    }

    var botones = document.createElement('div');
    botones.className = 'vt-botones';
    if (a && correosFamilia.length && window.CorreoNucleo) {
      var bc = document.createElement('button');
      bc.type = 'button'; bc.className = 'boton'; bc.id = 'vt-correo-familia';
      bc.textContent = 'Correo a la familia';
      bc.onclick = function () { if (alPedirCorreo) alPedirCorreo(correosFamilia); };
      botones.appendChild(bc);
    }
    var copiar = document.createElement('button');
    copiar.type = 'button'; copiar.className = 'boton'; copiar.id = 'vt-copiar-todo';
    copiar.textContent = 'Copiar todo el contacto';
    copiar.onclick = function () { U.copiar(textoDeTodo(persona, alumno, tutores, otrosFamilia), copiar); };
    botones.appendChild(copiar);
    nodo.appendChild(botones);

    var primero = tutores[0];
    var resumen = primero
      ? [etiquetaDeTutor(primero) + (primero.nombre ? ': ' + primero.nombre : ''),
         primero.telefonos[0] ? telefonoLegible(primero.telefonos[0]) : primero.correos[0]].filter(Boolean).join(' · ')
      : [alumno.telefonos[0] && telefonoLegible(alumno.telefonos[0]), alumno.correos[0]].filter(Boolean).join(' · ');

    if (!resumen) {
      resumen = otrosDeContacto(otrosFamilia).slice(0, 2).map(function (f) {
        return /telefono|movil/.test(U.normalizar(f.titulo)) ? telefonoLegible(f.valor) : f.valor;
      }).join(' · ');
    }
    if (!resumen) resumen = tutores.length ? tutores.length + (tutores.length === 1 ? ' tutor' : ' tutores') : (alumno.documento ? 'DNI ' + alumno.documento : '');
    var vacia = !tutores.length && !alumno.telefonos.length && !alumno.correos.length && !otrosFamilia.length;
    return { nodo: nodo, resumen: resumen, vacia: vacia, correosFamilia: correosFamilia, tutores: tutores,
             textoDeTodo: function () { return textoDeTodo(persona, alumno, tutores, otrosFamilia); } };
  }

  /* Pone el DNI y el NIE de la cabecera con su botón de copiar. */
  function montarCabecera(raiz, persona) {
    var nie = raiz.querySelector('#vt-nie');
    if (nie && !nie.querySelector('.dato-copiable')) nie.appendChild(botonCopiar(persona.id, 'Copiar el Nº de identificación escolar'));
    var dni = raiz.querySelector('#vt-dni');
    if (dni && !dni.querySelector('.dato-copiable')) dni.appendChild(botonCopiar(dniDe(persona), 'Copiar el DNI'));
  }

  /* ---------- la ventana «Ver todo» ---------- */

  /* Devuelve { html, titulo, montar(raiz), alCerrar() } para
     js/ficha-tercero.js. Desde la fila 252 pinta la misma ficha que
     Personas y empresas (js/ficha-persona.js), sin «Sus asuntos». `a` es
     el asunto de la ficha (para «Correo a la familia»). */
  function ventana(persona, resumen, a) {
    var tutores = Datos.tutoresDe(persona);
    var alumno = contactoDelAlumno(persona);
    var otrosFamilia = (tutores.otros || []).slice();
    tutores.forEach(function (t) { otrosFamilia = otrosFamilia.concat(t.otros || []); });
    var correosFamilia = correosDeFamilia(tutores, otrosFamilia);
    var irACorreo = false;

    var html = '<div id="fp-ventana"></div>';

    function montar(raiz) {
      var caja = raiz.querySelector('#fp-ventana');
      if (!caja) return;
      FichaPersona.pintar(caja, persona, { ventana: true, asunto: a, resumen: resumen,
        alPedirCorreo: function () {
          /* Un solo cuadro a la vez (U.preguntar): se cierra esta ventana y,
             al cerrarse, se abre el de Correo (alCerrar). */
          irACorreo = true;
          var cerrar = document.getElementById('cuadro-aceptar');
          if (cerrar) cerrar.click();
        } });
    }

    function alCerrar() {
      if (!irACorreo || !a || !window.CorreoNucleo) return;
      CorreoNucleo.abrirCuadro(a, false, { correoPreferente: correosFamilia.join(', ') });
    }

    return { html: html, titulo: 'Datos y contacto', montar: montar, alCerrar: alCerrar,
             tutores: tutores, textoDeTodo: function () { return textoDeTodo(persona, alumno, tutores, otrosFamilia); } };
  }

  return { ventana: ventana, familia: familia, cabeceraHtml: cabeceraHtml, montarCabecera: montarCabecera,
           telefonoLegible: telefonoLegible, etiquetaDeTutor: etiquetaDeTutor };
})();
