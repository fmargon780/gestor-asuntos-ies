/* ============================================================
   ajustes-tipo.js — la pantalla de un tipo de asunto (17-sep-2026,
   fila 39, docs/AJUSTES-POR-TIPO.md).

   Pantalla entera, no cuadro emergente: se entra pulsando una tarjeta
   de la pestaña "Tipos de asunto" (js/ajustes.js, `App.
   tarjetaTipoAjustes`) y se registra como una pantalla más de
   `App.PANTALLAS`, igual que hacen js/ficha-asunto.js ("asunto") y
   js/que-me-toca.js: el botón de volver y la tecla Escape los pone
   solos js/usabilidad.js, porque `#pantalla-tipo-asunto` tiene la
   misma `<header class="cabecera"><h2>...</h2></header>` que todas
   las demás pantallas.

   Las siete secciones NO reescriben ningún editor: cada una llama al
   que ya existe (`js/campos.js` a través de la lógica que vivía en
   `App.pintarCuadroDeCampos`, `js/guias-enganche.js`, `js/plantillas-
   ajustes.js`, `js/plantillas-documento.js`, `js/recurrentes.js`) y lo
   pinta dentro de su hueco.

   Todo se guarda al cambiar (fila 198, apartado 2, 27-sep-2026,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md): ni la sección Campos ni la
   de Palabras clave (js/ajustes-tipo-palabras-clave.js) tienen ya un
   botón "Guardar" propio, como tampoco lo tienen "Datos del tipo" ni
   "Plazo". Arriba de las secciones, la lista de comprobación (js/
   ajustes-tipo-comprobacion.js) dice qué falta por rellenar.
   ============================================================ */

if (App.PANTALLAS.indexOf('tipo-asunto') === -1) App.PANTALLAS.push('tipo-asunto');

/* ---------- entrar y salir ---------- */

App.abrirTipoDeAsunto = async function (tipo) {
  App.E.tipoAjustesActual = tipo;
  /* Se relee campos.json justo al abrir: el compañero puede haberlo
     cambiado desde el otro ordenador mientras tanto (igual que hacía
     el cuadro de "Campos" antes de este cambio). */
  try { App.E.campos = await Campos.leer(App.E.gestor); } catch (e) { /* se sigue con lo que había */ }
  if (window.GuiasDelCentro) await GuiasDelCentro.ponerAlDia();   /* fila 273: la guía guardada, no la de al arrancar */
  App.ir('tipo-asunto');
  await App.pintarTipoDeAsunto();
};

App.cerrarTipoDeAsunto = function () {
  App.E.tipoAjustesActual = null;
  App.ir('ajustes');
};

/* Un bloque de sección: plegable, con su resumen en el título y la
   memoria de lo abierto (fila 105, js/ajustes-plegado.js). */
function seccionDeTipo(id, titulo, pie) {
  return AjustesPlegado.seccion(id, titulo, pie);
}

/* ---------- 1. Datos del tipo ---------- */

function construirSeccionDatos(tipo) {
  var b = seccionDeTipo('datos', 'Datos del tipo');
  var lista = document.createElement('div');
  lista.className = 'lista';
  lista.appendChild(App.filaEstado('Nombre', tipo.tipo));
  lista.appendChild(App.filaEstado('Categoría', tipo.categoria));
  if (tipo.alias && tipo.alias.length) {
    lista.appendChild(App.filaEstado('Antes se llamó', tipo.alias.join(', ')));
  }
  b.cuerpo.appendChild(lista);
  /* «Quién lo encarga» (fila 134, js/tipos-organo.js), junto a la categoría. */
  if (window.TiposOrgano) b.cuerpo.appendChild(TiposOrgano.filaDeTipo(tipo));
  /* «Reservado» (fila 135, js/reservados.js). */
  if (window.Reservados) b.cuerpo.appendChild(Reservados.filaDeTipo(tipo));
  /* «Conservar ___ años después de archivar» (fila 136, js/conservacion.js). */
  if (window.Conservacion) b.cuerpo.appendChild(Conservacion.filaDeTipo(tipo));
  /* «Al repartir, crear asuntos de tipo…» (fila 141, js/repartir-pantalla.js). */
  if (window.Repartir) b.cuerpo.appendChild(Repartir.filaDeTipo(tipo));
  var cambiar = document.createElement('button');
  cambiar.type = 'button';
  cambiar.className = 'boton';
  cambiar.style.marginTop = '10px';
  cambiar.textContent = 'Cambiar el nombre';
  cambiar.onclick = function () { App.renombrarTipo(tipo); };
  b.cuerpo.appendChild(cambiar);

  /* Unir con otro tipo (27-sep-2026, fila 207, docs/UNIR-DOS-TIPOS.md):
     el cuadro y la lógica viven en js/tipos-unir.js. */
  if (window.TiposUnir) {
    var unirBtn = document.createElement('button');
    unirBtn.type = 'button';
    unirBtn.className = 'boton';
    unirBtn.style.marginTop = '10px';
    unirBtn.style.marginLeft = '8px';
    unirBtn.textContent = 'Unir con otro tipo';
    unirBtn.onclick = function () { App.unirTipoConOtro(tipo); };
    b.cuerpo.appendChild(unirBtn);
  }

  /* El nombre corto (20-sep-2026, fila 79, apartado 4.9): lo que entra
     en el nombre de la carpeta de los asuntos nuevos y de la ficha en
     construcción; vacío, se usa el nombre de arriba, igual que hoy.
     Cambiarlo no toca ninguna carpeta ya creada. */
  var filaCorto = document.createElement('div');
  filaCorto.style.marginTop = '10px';
  filaCorto.innerHTML =
    '<label class="etiqueta">Nombre corto <span class="suave">(para el nombre de la carpeta)</span></label>' +
    '<input class="campo tipo-nombre-corto" maxlength="25" placeholder="Igual que el nombre de arriba">' +
    '<div class="aviso-en-vivo" id="tipo-nombre-corto-aviso"></div>' +
    '<p class="nota">Lo que entra en el nombre de la carpeta y de los asuntos que se creen a partir ' +
    'de ahora. Si lo dejas vacío, se usa el nombre de arriba. Cambiarlo no toca ninguna carpeta ya creada.</p>';
  b.cuerpo.appendChild(filaCorto);
  var campoCorto = filaCorto.querySelector('.tipo-nombre-corto');
  var avisoCorto = filaCorto.querySelector('#tipo-nombre-corto-aviso');
  campoCorto.value = tipo.nombreCorto || '';

  function efectivoDe(t) { return t.nombreCorto || t.tipo; }

  function pintarAvisoCorto() {
    var texto = U.limpiarNombre(campoCorto.value).toUpperCase();
    avisoCorto.innerHTML = '';
    avisoCorto.className = 'aviso-en-vivo';
    if (!texto) return;
    /* Fila 239: tope de 25 caracteres, con contador. */
    avisoCorto.textContent = texto.length + ' de 25 caracteres';
    if (texto.length > 25) {
      avisoCorto.className = 'aviso-en-vivo aviso-en-vivo-malo';
      avisoCorto.textContent = 'Lleva ' + texto.length + ' caracteres: el máximo es 25.';
    }
    var otros = App.E.tipos.filter(function (t) { return t !== tipo; }).map(efectivoDe);
    var cerca = U.parecidos(texto, otros);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      avisoCorto.className = 'aviso-en-vivo aviso-en-vivo-malo';
      avisoCorto.textContent = 'Ya lo usa otro tipo: ' + mismo.nombre + '.';
    } else if (cerca.length) {
      avisoCorto.className = 'aviso-en-vivo aviso-en-vivo-ambar';
      avisoCorto.textContent = 'Se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ');
    }
  }
  pintarAvisoCorto();
  campoCorto.oninput = pintarAvisoCorto;
  campoCorto.onchange = async function () {
    var texto = U.limpiarNombre(campoCorto.value).toUpperCase();
    if (texto === (tipo.nombreCorto || '')) return;
    if (texto.length > 25) {
      U.aviso('El nombre corto no puede pasar de 25 caracteres.', 'malo');
      campoCorto.value = tipo.nombreCorto || '';
      pintarAvisoCorto();
      return;
    }
    var otros = App.E.tipos.filter(function (t) { return t !== tipo; }).map(efectivoDe);
    if (texto && otros.some(function (o) { return U.normalizar(o) === U.normalizar(texto); })) {
      U.aviso('Ya lo usa otro tipo: no puede repetirse.', 'malo');
      campoCorto.value = tipo.nombreCorto || '';
      pintarAvisoCorto();
      return;
    }
    tipo.nombreCorto = texto;
    await App.guardarTipos();
    U.aviso('Nombre corto guardado.', 'bueno');
  };

  /* Fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md: si este
     tipo lleva el sello de registro de Séneca y/o la firma digital
     del director, para "Preparar el documento". Un tipo sin estos
     campos en tipos.json se comporta como si llevara sello y no
     llevara firma: no hace falta migrar nada. */
  var interruptores = document.createElement('div');
  interruptores.style.marginTop = '10px';
  interruptores.appendChild(App.construirInterruptorDeTipo(tipo, 'llevaSello', true,
    'Lleva el sello de registro de Séneca', 'Deja libre la banda de arriba al preparar el documento.'));
  interruptores.appendChild(App.construirInterruptorDeTipo(tipo, 'llevaFirma', false,
    'Lleva la firma digital del director', 'Deja libre la banda de abajo al preparar el documento.'));
  /* Fila 249 (docs/POR-LIQUIDAR.md): al terminar, el asunto pasa a «Por liquidar» en vez de archivarse. */
  var filaLiquidar = App.construirInterruptorDeTipo(tipo, 'liquidar', false,
    'Hay que liquidarlo antes de archivar', 'Al terminar, el asunto pasa a «Por liquidar» en vez de archivarse.');
  /* Con el cambio, la pestaña «Por liquidar» de Inicio sale o se va sin esperar a otro repintado. */
  filaLiquidar.querySelector('input').addEventListener('change', function () {
    if (window.InicioTabla) InicioTabla.pintar();
    /* Fila 253: con la casilla marcada, sus asuntos abiertos sin nada por hacer pasan ya. */
    if (window.PorLiquidar) PorLiquidar.alMarcarCasilla(tipo);
  });
  interruptores.appendChild(filaLiquidar);
  b.cuerpo.appendChild(interruptores);

  /* «Al cerrar el asunto, avisar a quien lo pide» (fila 195,
     docs/AVISOS-A-QUIEN-LO-PIDE.md, punto 1). */
  if (window.AvisosLoPide) {
    var filaAvisoCierre = document.createElement('label');
    filaAvisoCierre.className = 'interruptor';
    filaAvisoCierre.style.marginTop = '10px';
    filaAvisoCierre.innerHTML = '<input type="checkbox" class="tipo-avisar-lopide-cierre"' +
      (tipo.avisarLoPideCierre ? ' checked' : '') + '>' +
      '<span>Al cerrar el asunto, avisar a quien lo pide</span>';
    b.cuerpo.appendChild(filaAvisoCierre);

    var cajaAvisoCierre = document.createElement('div');
    cajaAvisoCierre.className = 'tipo-avisar-lopide-cierre-plantilla' + (tipo.avisarLoPideCierre ? '' : ' oculto');
    cajaAvisoCierre.innerHTML = '<label class="etiqueta-en-linea">Con la plantilla:</label>' +
      '<select class="campo tipo-avisar-lopide-cierre-select"><option value="">Cargando…</option></select>';
    b.cuerpo.appendChild(cajaAvisoCierre);

    var casillaAvisoCierre = filaAvisoCierre.querySelector('.tipo-avisar-lopide-cierre');
    var selectAvisoCierre = cajaAvisoCierre.querySelector('.tipo-avisar-lopide-cierre-select');
    casillaAvisoCierre.onchange = async function () {
      tipo.avisarLoPideCierre = casillaAvisoCierre.checked;
      cajaAvisoCierre.classList.toggle('oculto', !casillaAvisoCierre.checked);
      await App.guardarTipos();
    };
    selectAvisoCierre.onchange = async function () {
      tipo.avisarLoPideCierrePlantilla = selectAvisoCierre.value;
      await App.guardarTipos();
    };
    AvisosLoPide.opcionesPlantillaHTML(tipo.tipo, tipo.avisarLoPideCierrePlantilla, AvisosLoPide.NOMBRE_CIERRE)
      .then(function (html) {
        if (!selectAvisoCierre.isConnected) return;
        selectAvisoCierre.innerHTML = html;
      });
  }

  /* Formularios oficiales del tipo (20-sep-2026, fila 82,
     docs/FORMULARIOS-OFICIALES.md): además de los que lleve cada hito,
     un tipo puede necesitar un impreso sin que dependa de ningún paso
     concreto. Se guarda directo en tipos.json, como el nombre corto. */
  if (window.Formularios) {
    var filaFormularios = document.createElement('div');
    filaFormularios.style.marginTop = '10px';
    filaFormularios.innerHTML = '<label class="etiqueta">Impresos de este tipo</label>';
    var contenedorFormularios = document.createElement('div');
    filaFormularios.appendChild(contenedorFormularios);
    b.cuerpo.appendChild(filaFormularios);
    Formularios.pintarEditorAsync(contenedorFormularios, tipo.formularios, async function (claves) {
      tipo.formularios = claves;
      try {
        await App.guardarTipos();
      } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    });
  }

  return b.sec;
}

/* ---------- 2. Campos ----------

   Fila 56, 18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md: el
   catálogo entero (antes desplegado aquí mismo, con el buscador y el
   formulario de campo propio) se ha ido a js/campos-catalogo.js, que
   pinta un panel de tres pestañas donde estaba la sección al pulsar
   "+ Añadir campo". Aquí solo queda la lista de campos ya puestos
   (con sus casillas, las flechas de orden y Quitar) y ese botón:
   `lista` se sigue mutando en el sitio, y se guarda sola en
   `campos.json` en cuanto cambia algo (fila 198, apartado 2: una sola
   forma de guardar en toda la pantalla, sin botón "Guardar campos"). */

async function construirSeccionCampos(tipo) {
  var b = seccionDeTipo('campos', 'Campos',
    'Los campos de este tipo, en el orden en que saldrán en el formulario. Sirven para clasificar el asunto: salen en la ficha y al exportar; no entran en ningún nombre.');
  var cuerpo = b.cuerpo;

  /* `$` global (js/util.js) busca con `document.getElementById`, y
     esta sección se pinta ANTES de colgarse del documento (se pinta
     entera y luego el orquestador la añade a su columna): mientras
     tanto `document.getElementById` no encuentra nada dentro de un
     trozo de DOM todavía suelto. Aquí se sombrea por uno que busca
     solo dentro de `cuerpo`, ya esté colgado o no. */
  function $(id) { return cuerpo.querySelector('#' + id); }

  var lista = ((App.E.campos.porTipo || {})[tipo.tipo] || []).map(function (c) { return Object.assign({}, c); });

  function textoOrigen(c) {
    return c.origen === 'fichero' ? 'del fichero' : (c.origen === 'calculado' ? 'calculado' : 'propio');
  }

  function pintarListado() {
    cuerpo.innerHTML =
      '<div id="campos-puestos" class="lista"></div>' +
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="boton" id="campos-btn-anadir">+ Añadir campo</button>' +
      '</div>';
    pintarPuestos();
    $('campos-btn-anadir').onclick = abrirCatalogo;
  }

  function pintarPuestos() {
    var cont = $('campos-puestos');
    cont.innerHTML = '';
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio">Ningún campo puesto todavía.</div>';
      return;
    }
    lista.forEach(function (c, i) {
      var envoltorio = document.createElement('div');

      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(Campos.nombreDeCampo(c, App.E.campos)) +
        '</span><span class="suave">' + textoOrigen(c) + '</span>';

      /* Fila 255: el hito del campo («Ninguno» = un campo del asunto). */
      var pasosGuia = window.CamposDeHito ? CamposDeHito.pasosDeLaGuia(tipo.tipo) : [];
      if (pasosGuia.length) {
        var selH = document.createElement('select');
        selH.className = 'campo campo-hito-select';
        selH.title = 'Hito de este campo';
        selH.innerHTML = '<option value="">Ninguno (del asunto)</option>' + pasosGuia.map(function (p) {
          return '<option value="' + U.escapar(p.id) + '"' + (c.hito === p.id ? ' selected' : '') + '>' + U.escapar(p.titulo) + '</option>';
        }).join('');
        selH.onchange = function () {
          if (selH.value) { c.hito = selH.value; c.obligatorio = false; } else { delete c.hito; }
          pintarPuestos();
          guardarCampos();
        };
        f.appendChild(selH);
      }

      var oblig = document.createElement('label');
      oblig.className = 'interruptor interruptor-fila' + (c.hito ? ' oculto' : '');
      var cOblig = document.createElement('input');
      cOblig.type = 'checkbox';
      cOblig.checked = !!c.obligatorio;
      cOblig.onchange = function () { c.obligatorio = cOblig.checked; guardarCampos(); };
      oblig.appendChild(cOblig);
      var tOblig = document.createElement('span');
      tOblig.textContent = 'Obligatorio';
      oblig.appendChild(tOblig);
      f.appendChild(oblig);

      var subir = document.createElement('button');
      subir.type = 'button'; subir.className = 'boton'; subir.textContent = '▲';
      subir.title = 'Subirlo un puesto'; subir.disabled = (i === 0);
      subir.onclick = function () { mover(i, -1); };
      f.appendChild(subir);

      var bajar = document.createElement('button');
      bajar.type = 'button'; bajar.className = 'boton'; bajar.textContent = '▼';
      bajar.title = 'Bajarlo un puesto'; bajar.disabled = (i === lista.length - 1);
      bajar.onclick = function () { mover(i, 1); };
      f.appendChild(bajar);

      var quitar = document.createElement('button');
      quitar.type = 'button'; quitar.className = 'boton boton-peligro'; quitar.textContent = 'Quitar';
      quitar.onclick = function () { lista.splice(i, 1); pintarPuestos(); guardarCampos(); };
      f.appendChild(quitar);

      envoltorio.appendChild(f);

      /* Lo que se comparte, avisa (17-sep-2026, docs/AJUSTES-POR-TIPO.md):
         un campo propio o calculado puede estar puesto en otros tipos
         también. No bloquea nada, solo informa. */
      var otros = c.origen === 'propio' ? Campos.tiposQueUsanPropio(App.E.campos, c.id)
        : c.origen === 'calculado' ? Campos.tiposQueUsanCalculado(App.E.campos, c.id)
        : [];
      otros = otros.filter(function (t) { return t !== tipo.tipo; });
      if (otros.length) {
        var aviso = document.createElement('div');
        aviso.className = 'aviso-compartido';
        aviso.textContent = 'También se usa en ' + otros.length +
          (otros.length === 1 ? ' tipo más: ' : ' tipos más: ') + otros.join(', ');
        envoltorio.appendChild(aviso);
      }

      cont.appendChild(envoltorio);
    });
  }

  function mover(i, salto) {
    var j = i + salto;
    if (j < 0 || j >= lista.length) return;
    var g = lista[i]; lista[i] = lista[j]; lista[j] = g;
    pintarPuestos();
    guardarCampos();
  }

  function abrirCatalogo() {
    cuerpo.innerHTML = '';
    if (!window.CamposCatalogo) { pintarListado(); return; }
    CamposCatalogo.abrir(cuerpo, tipo, lista, {
      onCambio: function () { guardarCampos(); },
      onVolver: pintarListado
    });
  }

  /* Se guarda sola en cuanto algo cambia (fila 198, apartado 2): la
     llaman todos los onchange/onclick de arriba, sin botón propio. */
  /* En fila (fila 99, `App.enFila`/`ColaGuardado`, sobre `campos.json`):
     un cambio seguido de otro (dos casillas, dos "Quitar") puede
     disparar dos llamadas casi a la vez, y sin cola una podía leer el
     fichero a medio escribir de la otra. */
  async function guardarCampos() {
    try {
      App.E.campos = await App.enFila('campos.json', function () {
        return Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
      });
      U.aviso('Campos de ' + tipo.tipo + ' guardados.', 'bueno');
      AjustesPlegado.resumirTipo();
    } catch (e) {
      U.aviso('No he podido guardarlos: ' + U.mensajeDeError(e), 'malo');
    }
  }

  pintarListado();
  return b.sec;
}

/* ---------- 3. Guía ---------- */

function construirSeccionPasos(tipo) {
  var b = seccionDeTipo('pasos', 'Guía', 'La guía del tipo, con sus preguntas y bifurcaciones.');

  /* El aviso de la biblioteca (20-sep-2026, fila 79, apartado 4.4):
     misma clase .aviso-compartido que ya usan los campos compartidos,
     un aviso por hito desactualizado. */
  async function pintarAvisosBiblioteca(pasos) {
    if (!window.GuiasBiblioteca) return;
    var desactualizados;
    try { desactualizados = await GuiasBiblioteca.pasosDesactualizados(pasos); }
    catch (e) { return; }
    if (!desactualizados.length) return;
    desactualizados.forEach(function (entrada) {
      var aviso = document.createElement('div');
      aviso.className = 'aviso-compartido';
      aviso.innerHTML = '"' + U.escapar(entrada.modelo.nombre) + '" ha cambiado en la biblioteca. ' +
        '<button type="button" class="enlace">Ver el cambio</button>';
      aviso.querySelector('button').onclick = async function () {
        await GuiasBiblioteca.abrirComparacion(entrada);
        try {
          await GuiasDelCentro.guardarPasos(tipo.tipo, pasos);
        } catch (e2) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e2), 'malo'); }
        repintar();
      };
      b.cuerpo.appendChild(aviso);
    });
  }

  function repintar() {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo.tipo)) || [];
    b.cuerpo.innerHTML = pasos.length
      ? Guias.vista(pasos, [], false)
      : '<div class="vacio">Todavía no hay guía para este tipo.</div>';
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton';
    boton.style.marginTop = '10px';
    boton.textContent = pasos.length ? 'Cambiar la guía' : 'Escribir la guía';
    boton.onclick = async function () {
      if (!window.GuiasDelCentro) return;
      var ok = await GuiasDelCentro.escribir(tipo.tipo);
      if (ok) repintar();
    };
    /* «Ver mapa» (fila 113, js/guias-mapa.js): la guía entera de un
       vistazo; pulsar un paso abre el cuadro de escribirla en ese paso. */
    var mapa = null;
    if (pasos.length && window.GuiasMapa) {
      mapa = document.createElement('button');
      mapa.type = 'button';
      mapa.className = 'boton';
      mapa.style.marginTop = '10px';
      mapa.style.marginLeft = '8px';
      mapa.textContent = 'Ver mapa';
      mapa.onclick = function () {
        GuiasMapa.abrirEnAjustes(tipo.tipo, pasos, async function (id) {
          var ok = await GuiasDelCentro.escribir(tipo.tipo, { irA: id });
          if (ok) repintar();
        });
      };
    }
    b.cuerpo.appendChild(boton);
    if (mapa) b.cuerpo.appendChild(mapa);
    pintarAvisosBiblioteca(pasos);
  }
  repintar();
  return b.sec;
}

/* ---------- 6. Plazo ---------- */

function construirSeccionPlazo(tipo) {
  var b = seccionDeTipo('plazo', 'Plazo', 'Los días de plazo por defecto de este tipo.');
  b.cuerpo.appendChild(App.construirCasillaPlazo(tipo));
  return b.sec;
}

/* ---------- el orquestador de las ocho secciones ---------- */

App.pintarTipoDeAsunto = async function () {
  var tipo = App.E.tipoAjustesActual;
  if (!tipo) return;

  var nombre = $('tipo-asunto-nombre'), categoria = $('tipo-asunto-categoria');
  if (nombre) nombre.textContent = tipo.tipo;
  if (categoria) categoria.textContent = tipo.categoria;

  var col1 = $('tipo-asunto-col-1'), col2 = $('tipo-asunto-col-2');
  if (!col1 || !col2) return;
  col1.innerHTML = '';
  col2.innerHTML = '';

  col1.appendChild(construirSeccionDatos(tipo));
  col1.appendChild(await construirSeccionCampos(tipo));
  col1.appendChild(construirSeccionPasos(tipo));
  col1.appendChild(construirSeccionPlazo(tipo));

  /* Palabras clave (17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-
     CLASIFICAR.md), sacada aparte en js/ajustes-tipo-palabras-clave.js
     para no seguir engordando este fichero. */
  if (window.PalabrasClaveTipo) {
    var secPalabras = seccionDeTipo('palabras', 'Palabras clave',
      'Para proponer este tipo al leer un documento suelto en "Por clasificar".');
    col1.appendChild(secPalabras.sec);
    PalabrasClaveTipo.pintarDeTipo(secPalabras.cuerpo, tipo);
  }

  var secCorreo = seccionDeTipo('correo', 'Plantillas de correo y de Séneca',
    'Las plantillas pegadas a este tipo, con su editor de huecos.');
  col2.appendChild(secCorreo.sec);
  var secWord = seccionDeTipo('word', 'Plantilla de documento de Word',
    'El .docx colgado de este tipo y su tipo de documento.');
  col2.appendChild(secWord.sec);
  var secRec = seccionDeTipo('repite', 'Se repite',
    'La recurrencia de este tipo: cada cuánto, qué día y para qué tercero.');
  col2.appendChild(secRec.sec);

  if (window.PlantillasAjustes) await PlantillasAjustes.pintarDeTipo(secCorreo.cuerpo, tipo);
  if (window.PlantillasDocumento) await PlantillasDocumento.pintarDeTipo(secWord.cuerpo, tipo);
  if (window.Recurrentes) Recurrentes.pintarEnContenedor(secRec.cuerpo, tipo.tipo);
  AjustesPlegado.resumirTipo();
};
