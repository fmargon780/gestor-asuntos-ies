/* ============================================================
   ficha-asunto.js — la pantalla de un asunto.

   Al pulsar el nombre de un asunto se entra aquí. En una sola
   pantalla está todo lo suyo: sus datos, el contacto del tercero, la
   guía de su tipo con las casillas, sus notas y sus documentos. Y
   todos los botones de siempre, sin volver a la lista.

   Este fichero no guarda nada por su cuenta: para cambiar el estado,
   la vía, el plazo, el nombre o el cierre llama a lo que ya hace la
   aplicación. Así no hay dos sitios que hagan lo mismo.
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

  /* El nombre del asunto, en la tarjeta de la lista, abre la ficha. */
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
      return div;
    };
  })();

  /* ==========================================================
     PINTAR LA FICHA
     ========================================================== */

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function bloque(titulo, dentro, id) {
    return '<section class="ficha-bloque"' + (id ? ' id="' + id + '"' : '') + '>' +
             '<h3 class="ficha-titulo">' + U.escapar(titulo) + '</h3>' +
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
          bloque('Datos del asunto', datosDelAsunto(a, p)) +
          bloque('Contacto del tercero', '<div id="ficha-contacto" class="explica">Buscando…</div>') +
          bloque('Documentos de la carpeta', '<div id="ficha-documentos" class="explica">Leyendo…</div>') +
        '</div>' +
      '</div>';

    $('ficha-volver').onclick = volverALaLista;

    pintarAcciones(a, abierto, p);
    pintarNotas(a, abierto);
    pintarAvisoDeTipo(a, tipo);
    pintarGuia(a, tipo, abierto);
    pintarContacto(a);
    pintarDocumentos(a);
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

      caja.appendChild(boton(a.ficha.via ? 'Vía ✓' : 'Vía', 'Por dónde prefiere que le hablemos',
        async function () { await App.editarVia(a); pintar(); }, !!a.ficha.via));

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

    var cerrar = boton(abierto ? 'Cerrar el asunto' : 'Reabrir el asunto', '', async function () {
      if (abierto) await App.cerrarAsunto(a); else await App.reabrirAsunto(a);
      volverALaLista();
    });
    cerrar.classList.add('boton-principal');
    caja.appendChild(cerrar);
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

  async function pintarContacto(a) {
    var caja = $('ficha-contacto');
    if (!caja) return;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    /* Si la carpeta la creó la aplicación, el tercero está en su ficha.
       Si se creó a mano, se saca del propio nombre: es lo que queda
       después del tipo. */
    var quien = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';

    if (!categoria || !quien || !App.E.datos) {
      caja.className = 'explica';
      caja.textContent = 'Este asunto no dice a qué tercero pertenece.';
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
        caja.className = 'explica';
        caja.textContent = quien + ' no aparece en el fichero de ' + categoria + '.';
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
      caja.className = '';
      caja.innerHTML = '<h4 class="ficha-persona-nombre">' + U.escapar(persona.nombre) + '</h4>' +
                       filas(lista);
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer el fichero de datos: ' + e.message;
    }
  }

  /* ---------- los documentos que hay en la carpeta ---------- */

  async function pintarDocumentos(a) {
    var caja = $('ficha-documentos');
    if (!caja) return;
    try {
      var lista = await Carpetas.ficheros(a.handle);
      if (!lista.length) {
        caja.className = 'explica';
        caja.textContent = 'La carpeta todavía está vacía.';
        return;
      }
      caja.className = 'ficha-documentos';
      caja.innerHTML = lista.map(function (f) {
        var ext = Nombres.extensionDe(f.nombre);
        return '<div class="ficha-documento">' +
                 (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
                 U.escapar(f.nombre) +
               '</div>';
      }).join('');
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + e.message;
    }
  }

})();
