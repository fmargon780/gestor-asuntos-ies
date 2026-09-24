/* ============================================================
   ficha-bloques.js — los bloques de dentro de la ficha (datos, "El encargo", el tipo que falta, guía, notas, contacto, documentos, otros asuntos del tercero).

   Sacado tal cual de js/ficha-asunto.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la ficha (el asunto que se ve, su modo, la huella…) y lo
   de los demás ficheros de la ficha se piden a `window.FichaNucleo` (N).
   Se carga justo detrás de js/ficha-asunto.js.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* Los relacionados se pintan y se guardan enteramente en
     js/relacionados.js: aquí solo se le da el hueco. Si por lo que
     sea ese fichero no ha cargado, el hueco se queda con "Leyendo…"
     y no rompe el resto de la ficha. */
  function pintarRelacionados(a, abierto) {
    var caja = $('ficha-relacionados');
    if (!caja || !window.Relacionados) return;
    window.Relacionados.pintarEnFicha(caja, a, abierto, function () {
      pintarRelacionados(a, abierto);
      App.repintarAccionesFicha(a.nombre);
    });
  }

  /* Los campos configurados en Ajustes para el tipo de este asunto,
     con el valor que se guardó al crearlo o al editarlo, uno por
     línea. Solo los que traen valor: un campo vacío no se enseña. Se
     enseñan en el orden de Ajustes; si alguno se guardó con una clave
     que ya no está en la configuración de hoy (se quitó del tipo, o
     se borró el campo propio), se enseña igual al final, con su clave
     como título, para no perder el dato. */
  function filasDeCampos(a) {
    var guardados = (a.ficha && a.ficha.campos) || {};
    var tipo = N.tipoDe(a);
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var vistos = {};
    var salida = [];
    config.forEach(function (cfg) {
      var clave = Campos.claveDeCampo(cfg);
      vistos[clave] = true;
      var g = guardados[clave];
      if (g && g.valor) salida.push({ titulo: Campos.nombreDeCampo(cfg, App.E.campos), valor: g.valor });
    });
    Object.keys(guardados).forEach(function (clave) {
      if (vistos[clave]) return;
      var g = guardados[clave];
      if (g && g.valor) salida.push({ titulo: clave, valor: g.valor });
    });
    return salida;
  }

  /* "Datos del trámite" (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md,
     5): ya no repite nada que se vea en otro sitio de la pantalla
     (cabecera, marcas, "Datos y contacto", la línea gris de arriba).
     Solo quedan los campos propios del tipo, la vía, "Lo pide" y en
     qué carpeta del ARCHIVO está. Sin ninguna fila, devuelve null: el
     bloque entero no se pinta, ni el título ni la tarjeta. */
  function datosDelAsunto(a) {
    var f = a.ficha || {};
    var buenas = filasDeCampos(a).concat([
      { titulo: 'Vía de comunicación', valor: App.textoVia(f) },
      { titulo: 'Lo pide', valor: window.LoPide ? LoPide.texto(f) : '' },
      { titulo: 'En el archivo', valor: a.ruta || '' }
    ]).filter(function (x) { return x && x.valor; });
    /* "Formularios" (20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md):
       se rellena aparte, después de pintar (js/formularios.js, que
       envuelve App.abrirFicha), porque hace falta leer los hitos del
       asunto, que es async. Nace oculta: si no hay ninguno, se queda
       así, sin que nada la muestre. */
    if (!buenas.length) return null;
    var extraFormularios = window.Formularios
      ? '<div class="ficha-dato oculto" id="ficha-formularios-fila">' +
        '<span>Formularios</span><span id="ficha-formularios-valor"></span></div>' : '';
    return N.filasHtml(buenas, extraFormularios);
  }

  /* ---------- "Lo pide": quién ha pedido esta gestión ----------

     17-sep-2026, fila 28, docs/LO-PIDE.md. Los controles y la lógica
     de verdad viven en js/lo-pide.js; aquí solo se abre el cuadro, se
     busca la persona del tercero (misma búsqueda que pintarContacto,
     un poco más abajo) para ofrecer sus tutores, y se guarda con
     App.anotar. */

  async function personaDelTerceroLoPide(a) {
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = nombreDelTercero(a);
    if (!categoria || !quien || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, quien, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      return lista.length ? lista[0] : null;
    } catch (e) { return null; }
  }

  /* "El encargo" (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 7):
     el mismo cuadro de "Lo pide" de siempre, con la vía de comunicación
     (antes su propio botón, `App.editarVia`) metida dentro como un
     campo más. Se guardan los dos con el mismo `App.anotar`, en una
     sola pasada, pero sin depender el uno del otro: la vía se guarda
     aunque no se haya elegido "quién lo pide", y viceversa. Ninguno de
     los dos cambia de sitio en `asuntos.json` (`loPide` y
     `via`/`viaDato` siguen siendo las mismas claves de siempre). */
  /* El cuadro se abre al momento y la persona se carga después (fila
     100: antes esperaba a Datos.cargar con el botón ya en
     «Guardando…»). `control`, el botón que lo abrió, solo se apaga
     mientras se guarda. */
  async function abrirLoPide(a, control) {
    var tieneDato = !!(a.ficha.loPide && a.ficha.loPide.nombre);
    var pieQuitar = tieneDato
      ? '<button type="button" class="boton" id="lopide-quitar" style="margin-top:10px">Quitar el dato</button>'
      : '';
    var promesa = U.preguntar('El encargo',
      '<p class="explica">Quién ha pedido esta gestión, por qué vía y en qué fecha.</p>' +
      '<div id="lopide-caja-ficha"><p class="nota">Cargando…</p></div>' + pieQuitar, 'Guardar');
    var caja = $('lopide-caja-ficha');
    var aceptar = $('cuadro-aceptar');
    aceptar.disabled = true;
    var persona = await personaDelTerceroLoPide(a);
    aceptar.disabled = false;
    if (!caja.isConnected) return;   /* se cerró mientras cargaba */
    caja.innerHTML = '';
    var controles = LoPide.controles(caja, persona, a.ficha.loPide || null,
      { via: a.ficha.via || '', viaDato: a.ficha.viaDato || '' });

    var quitado = false;
    var btnQuitar = $('lopide-quitar');
    if (btnQuitar) {
      btnQuitar.onclick = function () { quitado = true; $('cuadro-cancelar').click(); };
    }

    var ok = await promesa;
    try {
      if (quitado) {
        /* `loPide: null`, no `undefined`: App.anotar hace Object.assign, y
           undefined no borra nada (docs/LO-PIDE.md, 1). La vía no se
           toca: "Quitar el dato" es solo de "Lo pide". */
        await U.mientrasGuarda(control || null, function () { return App.anotar(a.nombre, { loPide: null }); });
        return;
      }
      if (!ok) return;
      var via = controles.leerVia();
      await U.mientrasGuarda(control || null, function () {
        return App.anotar(a.nombre, {
          loPide: controles.leer(),
          via: via.via, viaDato: via.dato, viaEl: U.ahora(), viaPor: App.E.usuario
        });
      });
    } catch (e) {
      U.fallo('No he podido guardar el encargo', e);
    }
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

    fila.appendChild(N.boton('Añadir ' + tipo + ' a la lista', '', async function () {
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
      await Borrados.revivir(App.E.gestor, 'tipos', nombre);
      App.E.tipos.push({ tipo: nombre, categoria: categoria });
      await App.guardarTipos();
      /* App.verAbiertos ya reengancha sola la ficha (más arriba en
         este fichero): no hace falta repetir aquí el apaño de volver
         a coger el asunto de la lista fresca. */
      await App.verAbiertos();
      U.aviso('Tipo ' + nombre + ' añadido a la lista.', 'bueno');
    } catch (e) {
      U.aviso('No he podido añadirlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- el enlace de escribir o cambiar la guía ----------

     Los pasos de la guía SON los hitos (docs/HITOS-SON-LA-GUIA.md):
     ya no se leen aquí como texto con casillas, eso lo pinta
     js/hitos-panel.js dentro de este mismo #ficha-guia. Esta función
     deja solo el <p class="nota" id="ficha-guia-nota"> del final, con
     el botón de escribir o cambiar la guía del tipo; es tramitando un
     asunto cuando uno se da cuenta de qué pasos faltan, y hasta el
     10-sep-2026 había que salir a Ajustes para apuntarlos.

     hitos-panel.js localiza esta nota por su id y la conserva al
     repintar el resto de #ficha-guia. */
  function pintarGuia(a, tipo, abierto) {
    var caja = $('ficha-guia');
    if (!caja) return;
    /* Solo se toca la nota, nunca el resto de #ficha-guia: eso es de
       js/hitos-panel.js, y puede que ya haya pintado ahí la lista de
       hitos (por ejemplo, al volver a llamar desde el propio botón de
       más abajo, después de escribir la guía). */
    var anterior = $('ficha-guia-nota');
    if (anterior && anterior.parentNode === caja) anterior.remove();
    if (!abierto || !tipo || !window.GuiasDelCentro) return;

    var pasos = window.GuiasDelCentro.pasosDe(tipo);
    var fila = document.createElement('p');
    fila.className = 'nota';
    fila.id = 'ficha-guia-nota';

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = pasos.length ? 'Cambiar la guía' : ('Escribir la guía de ' + tipo);
    b.onclick = async function () {
      b.disabled = true;
      var hecho = await window.GuiasDelCentro.escribir(tipo);
      b.disabled = false;
      if (hecho) {
        pintarGuia(a, tipo, abierto);
        if (window.HitosPanel) window.HitosPanel.programarRepintado();
      }
    };
    fila.appendChild(b);

    var aviso = document.createElement('span');
    aviso.className = 'suave';
    aviso.style.marginLeft = '8px';
    aviso.textContent = 'Vale para todos los asuntos ' + tipo + ', no solo para este.';
    fila.appendChild(aviso);

    caja.appendChild(fila);
  }

  /* ---------- las notas, escritas aquí mismo ----------

     La caja de escribir directa (guardado automático, sin botón) y su
     lista viven en js/notas.js (`Notas.pintarEnFicha`, fila 37,
     17-sep-2026): aquí solo se le da el hueco, como con los documentos
     o los relacionados. Se llama también por su cuenta (al asociar un
     sello, al borrar un documento con nota). */
  function pintarNotas(a, abierto) {
    if (!window.Notas) return;
    /* `apuntarHuella` como cuarto argumento: el guardado automático de
       la nota cambia `a.ficha` por dentro (fila 37), y sin volver a
       apuntar la huella aquí mismo el próximo repintado en segundo
       plano se creería que algo ha cambiado de verdad y rehace la
       ficha entera sin hacer falta. */
    return window.Notas.pintarEnFicha($('ficha-notas'), a, abierto, N.apuntarHuella);
  }

  /* ---------- "Datos y contacto" del tercero ----------

     La línea resumen y la ventana "Ver todo" viven en
     js/ficha-tercero.js (fila 37, 17-sep-2026,
     docs/FICHA-DEL-ASUNTO-NUEVA.md): busca al tercero en el mismo
     fichero de datos que usa la pantalla de Personas, y se habla con
     esta ficha solo por `FichaTercero.pintarLinea(caja, a)`, igual que
     `FichaDocumentos.pintar`, para no engordar más este fichero. */
  function pintarContacto(a) {
    if (!window.FichaTercero) return;
    return window.FichaTercero.pintarLinea($('ficha-contacto-caja'), a);
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

  /* El bloque en sí, el salto a otro asunto del mismo tercero y la
     vuelta al de partida viven en js/otros-del-tercero.js (17-sep-2026,
     fila 40, docs/SALTAR-A-OTRO-ASUNTO.md), para no engordar más este
     fichero. Aquí solo se cuelga el hueco, con la categoría, el
     tercero y el tipo ya calculados; si el módulo no ha cargado, el
     hueco se queda como está y la ficha no se rompe. */
  function pintarOtrosDelTercero(a) {
    var caja = $('ficha-otros');
    if (!caja || !window.OtrosDelTercero) return;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    OtrosDelTercero.pintarEnFicha(caja, a, N.modoActual,
      { categoria: categoria, tercero: nombreDelTercero(a), tipo: N.tipoDe(a) });
  }

  /* ---------- los documentos que hay en la carpeta ----------

     Van en dos grupos: los papeles del expediente y lo que ha llegado
     por correo. Mezclados, la solicitud se pierde entre hilos y
     adjuntos, que son los que más se acumulan. Vive en
     js/ficha-documentos.js (17-sep-2026, fila 26: se separa de aquí al
     quitarle trabajo la fila "los hitos son la guía"); aquí solo el
     puente, y el repintado de notas que puede hacer falta tras un
     borrado (un documento con nota de registro, por ejemplo). */

  async function repintarNotasTrasDocumento(a) {
    if (!window.Notas) return;
    a.ficha.notas = await window.Notas.frescas(a);
    pintarNotas(a, N.modoActual === 'abierto');
  }

  function pintarDocumentos(a) {
    if (!window.FichaDocumentos) return;
    FichaDocumentos.pintar(a, function () { return repintarNotasTrasDocumento(a); });
  }

  Object.assign(N, {
    abrirLoPide: abrirLoPide,
    datosDelAsunto: datosDelAsunto,
    pintarAvisoDeTipo: pintarAvisoDeTipo,
    pintarContacto: pintarContacto,
    pintarDocumentos: pintarDocumentos,
    pintarGuia: pintarGuia,
    pintarNotas: pintarNotas,
    pintarOtrosDelTercero: pintarOtrosDelTercero,
    pintarRelacionados: pintarRelacionados
  });
})();
