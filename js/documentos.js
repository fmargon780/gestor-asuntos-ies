/* ============================================================
   documentos.js — los documentos que van dentro de la carpeta
   de un asunto.

   Dos caminos, y los dos acaban con el fichero bien nombrado:

     - Añadir documento: se busca donde esté (Descargas, el
       escritorio, un pendrive) y la aplicación GUARDA UNA COPIA
       en la carpeta del asunto, ya con el nombre montado. El
       original no se toca: el navegador no puede borrar nada
       fuera de las dos carpetas señaladas.

     - Poner nombre: para los que ya están dentro de la carpeta,
       porque han llegado por otro camino. Ese sí se renombra en
       el sitio, y es instantáneo.

   En los dos casos el documento se ve a la izquierda mientras se
   rellenan los campos, para poder leer la fecha de la factura o el
   sello del registro sin abrir nada aparte. Se enseña a todo el
   ancho de su columna, y con el botón "Ver más grande" ocupa
   toda la ventana.

   Si el tipo de documento que hace falta no está en la lista, se crea
   aquí mismo, sin salir del cuadro. Antes de crearlo se mira si ya hay
   uno que se le parezca aunque esté escrito de otra manera: mayúsculas,
   tildes, espacios, guiones, puntos o el plural. Así la lista no se
   llena de dos nombres para la misma cosa.
   ============================================================ */
var Documentos = (function () {

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
     cambiar nada de lo que hace. Aquí, el cuadro, el visor y la lista;
     el formulario del nombre, en js/documentos-formulario.js; crear un
     tipo sin salir, en js/documentos-tipo-nuevo.js; guardar, en
     js/documentos-guardar.js. El estado del cuadro y lo que se piden
     entre ellos va en `Documentos._interno` (N). */
  var N = {};

  N.ctx = {
    tipos: function () { return []; },
    curso: function () { return ''; },
    crearTipo: null            /* lo pone nucleo.js: guarda el tipo nuevo en _GESTOR */
  };
  N.asuntoActual = null;
  N.urlVisor = null;   /* la dirección temporal del documento que se está viendo */
  /* El hito al que hay que apuntar lo que se guarde en este cuadro
     (23-sep-2026, fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección
     1, camino "Desde el ordenador"): opcional, puesto por
     js/hitos-anadir.js. Vale para todo lo que se guarde mientras este
     cuadro esté abierto, no solo para el primer documento. */
  N.hitoActual = null;

  function configurar(o) { N.ctx = o; }

  function $(id) { return document.getElementById(id); }

  /* ---------- el cuadro ---------- */

  /* `opciones.hito`: ver arriba. `opciones.irDirectoAAnadir`: se salta
     la lista y va directa al selector de fichero, para cuando ya se
     sabe que se quiere añadir uno (el camino "Desde el ordenador" de
     un hito); sin ella, se ve la lista de siempre. */
  async function abrir(asunto, opciones) {
    N.asuntoActual = asunto;
    N.hitoActual = (opciones && opciones.hito) || null;
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-ancho');
    var esperar = U.preguntar(asunto.nombre, '<div id="doc-cuerpo"></div>', 'Cerrar', true);
    await pintarLista();
    /* `opciones.ponerNombre` (arreglo de la fila 103): abre directamente
       el formulario de ponerle nombre a ese documento de la carpeta (el
       que acaba de entrar desde "Por clasificar"). */
    if (opciones && opciones.ponerNombre) {
      N.pintarFormulario({ modo: 'renombrar', nombreActual: opciones.ponerNombre });
    }
    /* Un fichero soltado encima de la mesa del hito (fila 109): lo mismo
       que "Desde el ordenador", con el fichero ya elegido. */
    if (opciones && opciones.ficheroSoltado) {
      var soltado = opciones.ficheroSoltado;
      N.pintarFormulario({ modo: 'anadir', nombreActual: soltado.name,
        handle: { kind: 'file', name: soltado.name, getFile: function () { return Promise.resolve(soltado); } } });
    } else if (opciones && opciones.irDirectoAAnadir) {
      try { await anadirDesdeOrdenador(); } catch (e) { /* AbortError: se queda en la lista */ }
    }
    await esperar;
    soltarVisor();
    cuadro.classList.remove('cuadro-ancho');
    N.hitoActual = null;
  }

  /* El navegador guarda en memoria el documento que enseña hasta que se
     le dice que ya no hace falta. */
  function soltarVisor() {
    if (N.urlVisor) { URL.revokeObjectURL(N.urlVisor); N.urlVisor = null; }
  }

  /* Qué se puede enseñar. Los PDF y las imágenes los pinta el navegador
     por su cuenta; un Word o un Excel no sabe. */
  function visorDe(fichero, nombre) {
    soltarVisor();
    var ext = Nombres.extensionDe(nombre);
    var tipo = fichero.type || '';
    if (tipo === 'application/pdf' || ext === 'pdf') {
      N.urlVisor = URL.createObjectURL(fichero);
      /* Sin la barra de Chrome: enseña el nombre interno del fichero, que no
         dice nada, y roba sitio a la página. Se sigue pudiendo desplazar y
         hacer zoom con Ctrl y la rueda. */
      return '<iframe id="doc-visor" src="' + N.urlVisor +
             '#toolbar=0&navpanes=0&view=FitH" title="Documento"></iframe>';
    }
    if (tipo.indexOf('image/') === 0 || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].indexOf(ext) !== -1) {
      N.urlVisor = URL.createObjectURL(fichero);
      return '<img id="doc-visor" src="' + N.urlVisor + '" alt="Documento">';
    }
    return '<p class="explica" id="doc-sin-visor">Este tipo de fichero no se puede ver aquí. ' +
           'El navegador solo sabe enseñar PDF e imágenes.<br>' +
           'Ponle el nombre igual: lo de la derecha funciona lo mismo.</p>';
  }

  async function pintarLista() {
    var caja = $('doc-cuerpo');
    if (!caja) return;
    var lista = await Carpetas.ficheros(N.asuntoActual.handle);

    var html = '<p class="explica">' +
      (lista.length ? 'Los documentos guardados en esta carpeta.'
                    : 'La carpeta todavía está vacía.') + '</p>';

    if (lista.length) {
      html += '<div class="lista-documentos">' + lista.map(function (f, i) {
        var pendiente = Registro.pendiente(N.asuntoActual, f.nombre);
        var sinRegistro = !Registro.tieneRegistro(f.nombre);
        return '<div class="fila-documento">' +
                 '<span class="nombre-documento">' + U.escapar(f.nombre) + '</span>' +
                 (pendiente ? '<span class="marca-sin-registrar">Sin registrar</span>' : '') +
                 '<button type="button" class="boton" data-copiar="' + i + '" ' +
                   'title="Copiar el nombre del documento, sin la extensión">Copiar nombre</button>' +
                 '<button type="button" class="boton" data-renombrar="' + i + '">Poner nombre</button>' +
                 (sinRegistro ? '<button type="button" class="boton' + (pendiente ? ' boton-ambar' : '') +
                   '" data-registrar="' + i + '" title="Dar registro de entrada o salida a este documento">' +
                   'Registrar</button>' : '') +
                 '<button type="button" class="boton boton-peligro" data-borrar="' + i +
                   '" style="margin-left:auto">Borrar</button>' +
               '</div>';
      }).join('') + '</div>';
    }

    html += '<button type="button" class="boton boton-principal boton-ancho" id="doc-anadir">' +
            'Añadir documento</button>';

    caja.innerHTML = html;

    /* El nombre, sin la extensión, para pegarlo en el registro de Séneca
       o en un correo. */
    Array.prototype.forEach.call(caja.querySelectorAll('[data-copiar]'), function (b) {
      b.onclick = function () {
        var f = lista[Number(b.dataset.copiar)];
        var sinExtension = String(f.nombre).replace(/\.[A-Za-z0-9]{1,8}$/, '');
        U.copiar(sinExtension, b);
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-renombrar]'), function (b) {
      b.onclick = function () {
        var f = lista[Number(b.dataset.renombrar)];
        N.pintarFormulario({ modo: 'renombrar', nombreActual: f.nombre });
      };
    });

    /* Pulsar la fila del documento lo enseña igual que "Poner nombre":
       es el visor que tiene este cuadro (17-sep-2026, fila 86). Los
       botones de la propia fila siguen haciendo lo suyo. */
    Array.prototype.forEach.call(caja.querySelectorAll('.fila-documento'), function (fila, i) {
      fila.style.cursor = 'pointer';
      fila.title = 'Pulsa para verlo';
      fila.onclick = function (ev) {
        if (ev.target.closest('button, a, input, select, textarea, label')) return;
        N.pintarFormulario({ modo: 'renombrar', nombreActual: lista[i].nombre });
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-registrar]'), function (b) {
      b.onclick = async function () {
        var f = lista[Number(b.dataset.registrar)];
        await Registro.pintarEnContenedor(caja, N.asuntoActual, f.nombre, function () { pintarLista(); });
      };
    });

    Array.prototype.forEach.call(caja.querySelectorAll('[data-borrar]'), function (b) {
      b.onclick = async function () {
        var f = lista[Number(b.dataset.borrar)];
        if (!window.Papelera) return;
        var ok = await window.Papelera.preguntarBorrar(f.nombre);
        if (!ok) return;
        b.disabled = true;
        try {
          await Papelera.mandarDocumentoDeAsunto(N.asuntoActual, f.nombre);
          U.aviso('Documento mandado a la papelera.', 'bueno');
          await pintarLista();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
          b.disabled = false;
        }
      };
    });

    $('doc-anadir').onclick = async function () {
      try { await anadirDesdeOrdenador(); }
      catch (e) { if (e.name !== 'AbortError') U.aviso('No he podido abrir ese fichero: ' + U.mensajeDeError(e), 'malo'); }
    };
  }

  /* Sacada aparte (fila 103) para poder llamarla también desde
     `abrir()`, cuando `opciones.irDirectoAAnadir` se salta la lista.
     Lanza lo mismo que Carpetas.elegirFichero: quien llama decide qué
     hacer con un AbortError (cancelar el selector del navegador). */
  async function anadirDesdeOrdenador() {
    var handle = await Carpetas.elegirFichero(N.asuntoActual.handle);
    N.pintarFormulario({ modo: 'anadir', handle: handle, nombreActual: handle.name });
  }

  /* Lee un nombre de documento que ya siga la norma, para rellenar el
     formulario con lo que se pueda aprovechar. */
  function leerNombre(nombre) {
    var salida = { fecha: '', registro: null, tipo: '', curso: '' };
    var sinExtension = String(nombre || '').replace(/\.[A-Za-z0-9]{1,8}$/, '');
    var m = sinExtension.match(/^(\d{2})(\d{2})(\d{2})\s+(.*)$/);
    if (!m) return salida;
    salida.fecha = '20' + m[1] + '-' + m[2] + '-' + m[3];
    var resto = m[4];

    var reg = resto.match(/^(\d{2})([ES])([MA])(\d{4,6})\s*(.*)$/);
    if (reg) {
      salida.registro = { ano: reg[1], sentido: reg[2], modo: reg[3], numero: reg[4] };
      resto = reg[5];
    }

    var tipos = N.ctx.tipos().slice().sort(function (a, b) { return b.length - a.length; });
    var seSabeElTipo = false;
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(resto).indexOf(U.normalizar(tipos[i])) === 0) {
        salida.tipo = tipos[i];
        resto = resto.slice(tipos[i].length).trim();
        seSabeElTipo = true;
        break;
      }
    }
    /* Lo que quede después del tipo es el texto adicional, sea lo que
       sea: un curso, una referencia de la factura, un expediente. Antes
       aquí solo se admitía algo con forma de año académico, porque el
       campo se llamaba así; desde que es texto libre se recoge entero.

       Eso sí, **solo si se ha reconocido el tipo**. Si no, lo que queda
       es el propio tipo sin identificar, y meterlo aquí sacaría un texto
       cualquiera donde no toca. */
    salida.curso = seSabeElTipo ? resto.trim() : '';
    return salida;
  }

  /* ¿Este nombre ya lo ha puesto la aplicación? Lo dice la fecha de
     delante (AAMMDD): es lo que Séneca nunca escribe. Lo usa
     js/registro-sellado.js (17-sep-2026, fila 20) para no leer el
     sello de un PDF que ya está bien colocado. */
  function pareceDeLaAplicacion(nombre) {
    return !!leerNombre(nombre).fecha;
  }

  Object.assign(N, { pintarLista: pintarLista, soltarVisor: soltarVisor, visorDe: visorDe, leerNombre: leerNombre });

  return { configurar: configurar, abrir: abrir, leerNombre: leerNombre,
           pareceDeLaAplicacion: pareceDeLaAplicacion, _interno: N };
})();
