/* ============================================================
   ficha-asunto.js — la pantalla de un asunto.

   Al pulsar el nombre de un asunto se entra aquí. En una sola
   pantalla está todo lo suyo: sus datos, el contacto del tercero, la
   guía de su tipo con las casillas, sus notas, sus documentos y los
   demás asuntos de ese mismo tercero. Y todos los botones de
   siempre, sin volver a la lista.

   Este fichero no guarda nada por su cuenta: para cambiar el estado,
   la vía, el plazo, el nombre o el archivado llama a lo que ya hace
   la aplicación. Así no hay dos sitios que hagan lo mismo.

   Como aquí dentro está todo, la tarjeta de la lista se queda con el
   desplegable del estado, "Copiar nombre" y "Archivar". Esa poda
   también se hace aquí, un poco más abajo.
   ============================================================ */
(function () {

  var actual = null;      /* el asunto que se está viendo */
  var modoActual = 'abierto';

  function $(id) { return document.getElementById(id); }

  /* La pantalla nueva entra en la lista de pantallas, para que al
     pulsar cualquier pestaña se esconda como las demás. */
  if (App.PANTALLAS.indexOf('asunto') === -1) App.PANTALLAS.push('asunto');

  /* ==========================================================
     ENTRAR Y SALIR
     ========================================================== */

  App.abrirFicha = function (a, modo) {
    actual = a;
    modoActual = modo || 'abierto';
    App.ir('asunto');
    pintar();
  };

  function volverALaLista() {
    actual = null;
    App.ir(modoActual === 'archivado' ? 'archivo' : 'abiertos');
  }

  /* El nombre del asunto, en la tarjeta de la lista, abre la ficha.

     Y ya que dentro de la ficha están todos los botones, la tarjeta se
     queda con lo justo: el desplegable del estado, que es lo que más
     se toca y se hace de un clic sin entrar, copiar el nombre para
     pegarlo en un correo, y archivar el asunto cuando se termina. Lo
     demás (vía, plazo, editar, guía, notas y documentos) se hace
     dentro. */
  var BOTONES_DE_LA_TARJETA = ['Copiar nombre', 'Cerrar', 'Reabrir'];

  /* "Cerrar" se llama Archivar, que es lo que de verdad hace: llevar
     la carpeta al ARCHIVO. El texto se cambia aquí, donde ya se está
     tocando la tarjeta. */
  var NOMBRES_NUEVOS = { 'Cerrar': 'Archivar' };

  (function () {
    var comoEra = App.tarjetaAsunto;
    App.tarjetaAsunto = function (a, modo) {
      var div = comoEra(a, modo);

      var nombre = div.querySelector('.tarjeta-nombre');
      if (nombre) {
        nombre.classList.add('nombre-pulsable');
        nombre.title = 'Abrir la ficha de este asunto';
        nombre.onclick = function (ev) {
          ev.stopPropagation();
          App.abrirFicha(a, modo);
        };
      }

      var acciones = div.querySelector('.acciones');
      if (acciones) {
        Array.prototype.slice.call(acciones.children).forEach(function (h) {
          if (h.tagName === 'SELECT') return;            /* el estado se queda */
          var texto = (h.textContent || '').trim();
          if (BOTONES_DE_LA_TARJETA.indexOf(texto) === -1) { acciones.removeChild(h); return; }
          if (NOMBRES_NUEVOS[texto]) {
            h.textContent = NOMBRES_NUEVOS[texto];
            h.title = 'Llevar la carpeta al ARCHIVO';
          }
        });
      }

      return div;
    };
  })();

  /* ==========================================================
     PINTAR LA FICHA
     ========================================================== */

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function bloque(titulo, dentro, id, alLado) {
    return '<section class="ficha-bloque"' + (id ? ' id="' + id + '"' : '') + '>' +
             '<h3 class="ficha-titulo">' + U.escapar(titulo) + (alLado || '') + '</h3>' +
             dentro +
           '</section>';
  }

  function filas(lista) {
    var buenas = lista.filter(function (f) { return f && f.valor; });
    if (!buenas.length) return '<p class="explica">Nada que enseñar aquí.</p>';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  function pintar() {
    var a = actual;
    var caja = $('ficha-asunto-cuerpo');
    if (!a || !caja) return;

    var abierto = (modoActual === 'abierto');
    var situacion = a.ficha.situacion || '';
    var p = abierto ? App.plazoDe(a) : null;
    var tipo = tipoDe(a);

    caja.innerHTML =
      '<header class="ficha-cabecera">' +
        '<button type="button" class="boton" id="ficha-volver">← Volver a la lista</button>' +
        '<div class="ficha-marcas">' +
          (tipo ? '<span class="marca-tipo">' + U.escapar(tipo) + '</span>' : '') +
          (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                       U.escapar(situacion) + '</span>' : '') +
          (p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '') +
        '</div>' +
        '<h2 class="ficha-nombre">' + U.escapar(a.nombre) + '</h2>' +
      '</header>' +
      '<div id="ficha-aviso-tipo"></div>' +
      '<div class="ficha-acciones" id="ficha-acciones"></div>' +
      '<div class="ficha-columnas">' +
        '<div class="ficha-izquierda">' +
          bloque('Guía del procedimiento', '<div id="ficha-guia" class="explica">Leyendo…</div>') +
          bloque('Notas', '<div id="ficha-notas"></div>') +
        '</div>' +
        '<div class="ficha-derecha">' +
          bloque('Documentos de la carpeta',
                 '<div id="ficha-documentos" class="explica">Leyendo…</div>', null,
                 '<span class="ficha-cuenta" id="ficha-cuenta-docs"></span>') +
          bloque('Otros asuntos de este tercero',
                 '<div id="ficha-otros" class="explica">Buscando…</div>') +
          bloque('Datos del asunto', datosDelAsunto(a, p)) +
          '<div id="ficha-contacto-caja"></div>' +
        '</div>' +
      '</div>';

    $('ficha-volver').onclick = volverALaLista;

    pintarAcciones(a, abierto, p);
    pintarNotas(a, abierto);
    pintarAvisoDeTipo(a, tipo);
    pintarGuia(a, tipo, abierto);
    pintarContacto(a);
    pintarDocumentos(a);
    pintarOtrosDelTercero(a);
  }

  function datosDelAsunto(a, p) {
    var f = a.ficha || {};
    return filas([
      { titulo: 'Abierto el', valor: a.leido.fecha ? U.fechaLegible(a.leido.fecha) : '' },
      { titulo: 'Tipo', valor: tipoDe(a) },
      { titulo: 'Tercero', valor: f.tercero || a.leido.resto || '' },
      { titulo: 'Categoría', valor: f.categoria || a.leido.categoria || '' },
      { titulo: 'Año académico', valor: f.curso || a.leido.curso || '' },
      { titulo: 'Descripción', valor: f.descripcion || '' },
      { titulo: 'Estado', valor: f.situacion || 'Sin estado' },
      { titulo: 'Vía de comunicación', valor: App.textoVia(f) },
      { titulo: 'Fecha límite', valor: p ? Plazos.legible(p.limite) + ' · ' + p.texto : '' },
      { titulo: 'Lo abrió', valor: f.abiertoPor || '' },
      { titulo: 'En el archivo', valor: a.ruta || '' }
    ]);
  }

  /* ---------- la barra de botones ----------

     Son los mismos de la tarjeta. Al terminar cada uno se repinta la
     ficha, y los que mueven o renombran la carpeta devuelven a la
     lista, porque el asunto ya no se llama igual. */

  function pintarAcciones(a, abierto, p) {
    var caja = $('ficha-acciones');
    caja.innerHTML = '';

    if (abierto) {
      var sel = document.createElement('select');
      sel.className = 'campo campo-estado';
      sel.title = 'Estado del asunto';
      var situacion = a.ficha.situacion || '';
      var lista = App.E.estados.map(function (e) { return e.nombre; });
      if (situacion && lista.indexOf(situacion) === -1) lista.push(situacion);
      sel.innerHTML = '<option value="">Sin estado</option>' +
        lista.map(function (e) {
          return '<option value="' + U.escapar(e) + '"' + (e === situacion ? ' selected' : '') +
                 '>' + U.escapar(e) + '</option>';
        }).join('');
      sel.onchange = async function () {
        await App.ponerEstado(a, sel.value);
        pintar();
      };
      caja.appendChild(sel);

      var v = Nombres.via(a.ficha.via);
      var bvia = boton('', App.textoVia(a.ficha) || 'Por dónde prefiere que le hablemos',
        async function () { await App.editarVia(a); pintar(); }, !!a.ficha.via);
      bvia.innerHTML = dibujoVia(a.ficha.via) + '<span>' + U.escapar(v ? v.corto : 'Vía') + '</span>';
      bvia.classList.add('boton-con-dibujo');
      caja.appendChild(bvia);

      caja.appendChild(boton(p ? 'Plazo ✓' : 'Plazo', 'Poner o cambiar la fecha límite',
        async function () { await App.editarPlazo(a); pintar(); }, !!p));

      caja.appendChild(boton('Editar', 'Cambiar la fecha, el tipo, la descripción o el tercero',
        async function () { await App.editarAsunto(a); volverALaLista(); }));
    }

    caja.appendChild(boton('Copiar nombre', 'Para pegarlo como asunto del correo', function () {
      navigator.clipboard.writeText(a.nombre).then(function () {
        U.aviso('Nombre copiado.', 'bueno');
      });
    }));

    caja.appendChild(boton('Gestionar documentos', 'Nombrar y archivar los documentos de la carpeta',
      async function () { await App.verDocumentos(a); pintarDocumentos(a); }));

    var cerrar = boton(abierto ? 'Archivar el asunto' : 'Reabrir el asunto',
      abierto ? 'Llevar la carpeta al ARCHIVO' : '', async function () {
      if (abierto) await App.cerrarAsunto(a); else await App.reabrirAsunto(a);
      volverALaLista();
    });
    cerrar.classList.add('boton-principal');
    caja.appendChild(cerrar);
  }

  /* ---------- el dibujo de la vía de comunicación ----------

     Un botón que pone "Vía" no dice nada de un vistazo. Cada vía
     lleva su dibujo: un teléfono, un sobre, una pantalla o una
     persona. Sin vía puesta, el bocadillo de hablar. */
  var DIBUJOS_VIA = {
    TELEFONO: '<path d="M6.5 3.5h3l1.5 3.7-2 1.4a11 11 0 0 0 4.4 4.4l1.4-2 3.7 1.5v3a1.5 1.5 0 0 1-1.7 1.5C11.4 16.3 7.7 12.6 5 6.2A1.5 1.5 0 0 1 6.5 3.5z"/>',
    CORREO: '<rect x="3" y="5.5" width="18" height="13" rx="1.6"/><path d="M3.6 6.4 12 12.6l8.4-6.2"/>',
    IPASEN: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2"/><path d="M10.5 18.6h3"/>',
    PRESENCIAL: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20.2c.6-3.5 3.3-5.4 6.5-5.4s5.9 1.9 6.5 5.4"/>',
    '': '<path d="M4 5.6A1.6 1.6 0 0 1 5.6 4h12.8A1.6 1.6 0 0 1 20 5.6v8.3a1.6 1.6 0 0 1-1.6 1.6H9.2L5 19.4v-3.9h-.4A.6.6 0 0 1 4 14.9z"/>'
  };

  function dibujoVia(clave) {
    var d = DIBUJOS_VIA[clave || ''] || DIBUJOS_VIA[''];
    return '<svg class="via-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           d + '</svg>';
  }

  function boton(texto, ayuda, alPulsar, marcado) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton' + (marcado ? ' boton-marcado' : '');
    b.textContent = texto;
    if (ayuda) b.title = ayuda;
    b.onclick = alPulsar;
    return b;
  }

  /* ---------- el tipo que no está en la lista ----------

     Los asuntos de antes traen tipos que nadie ha dado de alta. Desde
     aquí se añaden a la lista del centro sin ir a Ajustes. */

  function pintarAvisoDeTipo(a, tipo) {
    var caja = $('ficha-aviso-tipo');
    if (!caja) return;
    caja.innerHTML = '';
    if (!tipo || (a.leido && a.leido.reconocido)) return;

    caja.className = 'aviso aviso-ambar';
    caja.innerHTML = '<strong>El tipo ' + U.escapar(tipo) + ' no está en la lista del centro.</strong>' +
      '<p>Mientras no esté, este asunto no tiene guía, ni plazo de tipo, ni sale ' +
      'al elegir tipo en un asunto nuevo.</p>';

    var fila = document.createElement('div');
    fila.className = 'alta-tipo';

    var cat = document.createElement('select');
    cat.className = 'campo';
    cat.style.maxWidth = '180px';
    cat.innerHTML = Nombres.CATEGORIAS.map(function (c) {
      var elegida = (a.ficha && a.ficha.categoria) === c;
      return '<option value="' + c + '"' + (elegida ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    fila.appendChild(cat);

    fila.appendChild(boton('Añadir ' + tipo + ' a la lista', '', async function () {
      await anadirTipo(tipo, cat.value);
    }));

    caja.appendChild(fila);
  }

  async function anadirTipo(tipo, categoria) {
    var nombre = U.limpiarNombre(tipo).toUpperCase();
    if (!nombre) return;
    var repetido = App.E.tipos.some(function (t) {
      return U.normalizar(t.tipo) === U.normalizar(nombre);
    });
    if (repetido) { U.aviso('Ese tipo ya está en la lista.', 'malo'); return; }
    try {
      App.E.tipos.push({ tipo: nombre, categoria: categoria });
      await App.guardarTipos();
      await App.verAbiertos();
      /* La carpeta se lee otra vez, así que hay que volver a coger el
         asunto: el de antes ya no es el mismo objeto. */
      var mismo = App.E.listaAbiertos.filter(function (x) { return x.nombre === actual.nombre; })[0];
      if (mismo) actual = mismo;
      pintar();
      U.aviso('Tipo ' + nombre + ' añadido a la lista.', 'bueno');
    } catch (e) {
      U.aviso('No he podido añadirlo: ' + e.message, 'malo');
    }
  }

  /* ---------- la guía, con sus casillas ---------- */

  async function pintarGuia(a, tipo, abierto) {
    var caja = $('ficha-guia');
    if (!caja) return;
    var pasos = [];
    try {
      var todo = App.E.gestor ? await Carpetas.leerJson(App.E.gestor, 'guias.json') : null;
      pasos = Guias.normalizar((todo && tipo && todo[tipo]) || []);
    } catch (e) { pasos = []; }

    if (!pasos.length) {
      caja.className = 'explica';
      caja.innerHTML = tipo
        ? 'El tipo ' + U.escapar(tipo) + ' todavía no tiene guía. Se escribe en Ajustes.'
        : 'Este asunto no tiene tipo reconocido, así que no hay guía que enseñar.';
      return;
    }

    var marcados = ((a.ficha && a.ficha.pasosHechos) || []).slice();
    caja.className = '';
    caja.innerHTML = '<p class="explica" id="ficha-guia-cuenta"></p>' +
                     Guias.vista(pasos, marcados, abierto);

    function contar() {
      $('ficha-guia-cuenta').textContent =
        Guias.hechosDe(pasos, marcados) + ' de ' + pasos.length + ' pasos hechos.' +
        (abierto ? ' Lo que marques lo ve todo el que abra la aplicación.' : '');
    }
    contar();

    if (!abierto) return;

    Array.prototype.forEach.call(caja.querySelectorAll('.paso-casilla'), function (c) {
      c.onchange = async function () {
        var id = c.dataset.paso;
        var i = marcados.indexOf(id);
        if (c.checked && i === -1) marcados.push(id);
        if (!c.checked && i !== -1) marcados.splice(i, 1);
        c.closest('.paso-lectura').classList.toggle('paso-hecho', c.checked);
        contar();
        try {
          await App.anotar(a.nombre, {
            pasosHechos: marcados.slice(),
            pasosEl: U.ahora(),
            pasosPor: App.E.usuario
          });
        } catch (e) {
          U.aviso('No he podido guardar lo marcado: ' + e.message, 'malo');
        }
      };
    });
  }

  /* ---------- las notas, escritas aquí mismo ---------- */

  function pintarNotas(a, abierto) {
    var caja = $('ficha-notas');
    if (!caja || !window.Notas) return;
    var notas = window.Notas.de(a);

    caja.innerHTML =
      (abierto
        ? '<div class="nota-nueva">' +
            '<textarea id="ficha-nota-texto" class="campo" rows="2" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<div class="nota-botonera">' +
              '<span class="nota-aviso" id="ficha-nota-aviso">Las notas no se borran.</span>' +
              '<button type="button" id="ficha-nota-anadir" class="boton boton-principal">Añadir nota</button>' +
            '</div>' +
          '</div>'
        : '<p class="explica">Asunto archivado: las notas se leen, pero ya no se escriben.</p>') +
      '<div id="ficha-notas-lista" class="notas-lista">' + window.Notas.pintar(notas) + '</div>';

    if (!abierto) return;

    var campo = $('ficha-nota-texto');
    var boton = $('ficha-nota-anadir');
    var guardando = false;

    async function guardar() {
      var texto = (campo.value || '').trim();
      if (!texto || guardando) return;
      guardando = true;
      boton.disabled = true;
      try {
        var lista = await window.Notas.anadir(a, texto);
        campo.value = '';
        $('ficha-notas-lista').innerHTML = window.Notas.pintar(lista);
        $('ficha-nota-aviso').textContent = lista.length === 1
          ? '1 nota guardada.' : lista.length + ' notas guardadas.';
      } catch (e) {
        U.aviso('No he podido guardar la nota: ' + e.message, 'malo');
      }
      boton.disabled = false;
      guardando = false;
    }

    boton.onclick = guardar;
    campo.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); guardar(); }
    };
  }

  /* ---------- el contacto del tercero ----------

     Se busca en el mismo fichero de datos que usa la pantalla de
     Personas. El nombre del tercero lleva pegado el número de
     identificación, así que si no aparece a la primera se prueba sin
     él. */

  /* La ficha del alumnado trae muchas filas, y ocupaba media pantalla.
     Aquí se enseña pequeña: el nombre y un par de datos de contacto.
     Al pulsarla se abre entera. */
  function contactoPlegado(persona, lista) {
    var buenas = lista.filter(function (f) { return f && f.valor; });
    var resumen = buenas.filter(function (f) {
      return /tel|m[oó]vil|correo|email/i.test(f.titulo);
    }).slice(0, 2);
    if (!resumen.length) resumen = buenas.slice(0, 2);

    return '<details class="ficha-bloque ficha-plegable">' +
             '<summary>' +
               '<span class="ficha-titulo">Contacto del tercero</span>' +
               '<span class="ficha-resumen">' + U.escapar(persona.nombre) +
                 (resumen.length
                   ? ' · ' + U.escapar(resumen.map(function (f) { return f.valor; }).join(' · '))
                   : '') +
               '</span>' +
             '</summary>' +
             '<div class="ficha-plegable-cuerpo">' + filas(buenas) + '</div>' +
           '</details>';
  }

  function contactoSuelto(texto) {
    return '<section class="ficha-bloque">' +
             '<h3 class="ficha-titulo">Contacto del tercero</h3>' +
             '<p class="explica">' + U.escapar(texto) + '</p>' +
           '</section>';
  }

  async function pintarContacto(a) {
    var caja = $('ficha-contacto-caja');
    if (!caja) return;
    caja.innerHTML = contactoSuelto('Buscando…');
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    /* Si la carpeta la creó la aplicación, el tercero está en su ficha.
       Si se creó a mano, se saca del propio nombre: es lo que queda
       después del tipo. */
    var quien = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';

    if (!categoria || !quien || !App.E.datos) {
      caja.innerHTML = contactoSuelto('Este asunto no dice a qué tercero pertenece.');
      return;
    }

    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var encontrados = Datos.buscar(fuente.lista, quien, 1);
      /* El nombre suele llevar pegado el número de identificación o el
         NIF, y a veces el año académico. Si así no aparece, se prueba
         quitando lo de detrás. */
      if (!encontrados.length) {
        encontrados = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      }
      if (!encontrados.length) {
        var corto = quien.replace(/\b\d{2}-\d{2}\b/, '').replace(/\s+\S*\d\S*\s*$/, '').trim();
        if (corto) encontrados = Datos.buscar(fuente.lista, corto, 1);
      }
      if (!encontrados.length) {
        caja.innerHTML = contactoSuelto(quien + ' no aparece en el fichero de ' + categoria + '.');
        return;
      }

      var persona = encontrados[0];
      var lista;
      if (categoria === 'ALUMNADO') lista = Datos.destacadosAlumno(persona).destacados;
      else if (categoria === 'PERSONAL') lista = Datos.destacadosPersona(persona).destacados;
      else {
        lista = Object.keys(persona.campos || {}).slice(0, 8).map(function (c) {
          return { titulo: c, valor: persona.campos[c] };
        });
      }
      caja.innerHTML = contactoPlegado(persona, lista);
    } catch (e) {
      caja.innerHTML = contactoSuelto('No he podido leer el fichero de datos: ' + e.message);
    }
  }

  /* ---------- los otros asuntos del mismo tercero ----------

     Para ver de un vistazo si esto ya se gestionó. Los del mismo tipo
     van marcados, que son los que de verdad pueden estar repetidos.
     La búsqueda la hace duplicados.js. */

  function nombreDelTercero(a) {
    var f = a.ficha || {};
    if (f.tercero) return f.tercero;
    if (a.leido && a.leido.resto) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  function listaDeOtros(titulo, nombres, tipo) {
    if (!nombres.length) return '';
    return '<div class="otros-grupo"><div class="otros-rotulo">' + U.escapar(titulo) + '</div>' +
      nombres.slice(0, 12).map(function (n) {
        var igual = tipo && window.Duplicados &&
                    U.normalizar(window.Duplicados.tipoDeNombre(n)) === U.normalizar(tipo);
        return '<div class="otros-asunto' + (igual ? ' otros-mismo-tipo' : '') + '">' +
               U.escapar(n) + '</div>';
      }).join('') +
      (nombres.length > 12 ? '<p class="nota">Y ' + (nombres.length - 12) + ' más.</p>' : '') +
      '</div>';
  }

  async function pintarOtrosDelTercero(a) {
    var caja = $('ficha-otros');
    if (!caja) return;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = nombreDelTercero(a);

    if (!window.Duplicados || !categoria || !quien) {
      caja.className = 'explica';
      caja.textContent = 'No se sabe de qué tercero es este asunto, así que no se puede buscar.';
      return;
    }

    try {
      var todo = await window.Duplicados.delTercero(categoria, quien);
      var fuera = function (n) { return n !== a.nombre; };
      var abiertos = todo.abiertos.filter(fuera);
      var archivados = todo.archivados.filter(fuera);

      if (!abiertos.length && !archivados.length) {
        caja.className = 'explica';
        caja.textContent = 'Es el único asunto de ' + quien + '.';
        return;
      }
      caja.className = 'otros-lista';
      caja.innerHTML = listaDeOtros('Abiertos', abiertos, tipoDe(a)) +
                       listaDeOtros('En el archivo', archivados, tipoDe(a));
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido mirar el archivo: ' + e.message;
    }
  }

  /* ---------- los documentos que hay en la carpeta ----------

     Van en dos grupos: los papeles del expediente y lo que ha llegado
     por correo. Mezclados, la solicitud se pierde entre hilos y
     adjuntos, que son los que más se acumulan. */

  /* Lo que la aplicación mete cuando entra un correo: el hilo en PDF
     (CORREO, y HILO en las primeras versiones) y sus adjuntos. */
  var DE_CORREO = /(^|[\s_-])(CORREO|HILO|ADJUNTO)([\s_.\-(]|$)/i;

  function esDeCorreo(nombre) {
    return DE_CORREO.test(String(nombre || ''));
  }

  /* El nombre empieza por la fecha, así que por orden alfabético
     quedan en orden de antigüedad. */
  function porNombre(a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  }

  function filaDeDocumento(f) {
    var ext = Nombres.extensionDe(f.nombre);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ficha-documento';
    b.title = 'Verlo al lado del programa';
    b.innerHTML = (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
                  '<span>' + U.escapar(f.nombre) + '</span>';
    b.onclick = function () { abrirDocumento(f); };
    return b;
  }

  function grupoDeDocumentos(caja, titulo, ficheros, conRotulo) {
    if (!ficheros.length) return;
    if (conRotulo) {
      var r = document.createElement('div');
      r.className = 'ficha-grupo-docs';
      r.textContent = titulo + '  (' + ficheros.length + ')';
      caja.appendChild(r);
    }
    ficheros.sort(porNombre).forEach(function (f) { caja.appendChild(filaDeDocumento(f)); });
  }

  async function pintarDocumentos(a) {
    var caja = $('ficha-documentos');
    var cuenta = $('ficha-cuenta-docs');
    if (!caja) return;
    try {
      var lista = await Carpetas.ficheros(a.handle);
      if (cuenta) cuenta.textContent = lista.length || '';
      if (!lista.length) {
        caja.className = 'explica';
        caja.textContent = 'La carpeta todavía está vacía.';
        return;
      }
      caja.className = 'ficha-documentos';
      caja.innerHTML = '';

      var correos = lista.filter(function (f) { return esDeCorreo(f.nombre); });
      var expediente = lista.filter(function (f) { return !esDeCorreo(f.nombre); });

      /* Con un solo grupo no hacen falta rótulos: sobran. */
      var conRotulo = correos.length > 0 && expediente.length > 0;
      grupoDeDocumentos(caja, 'Del expediente', expediente, conRotulo);
      grupoDeDocumentos(caja, 'Llegados por correo', correos, conRotulo);
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + e.message;
    }
  }

  /* Se abre en la columna de la derecha, al lado del programa, para
     poder trabajar con el papel delante. */
  async function abrirDocumento(f) {
    if (window.Visor) return window.Visor.abrir(f.handle, f.nombre);
    try {
      var fichero = await f.handle.getFile();
      var url = URL.createObjectURL(fichero);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      U.aviso('No he podido abrirlo: ' + e.message, 'malo');
    }
  }

})();
