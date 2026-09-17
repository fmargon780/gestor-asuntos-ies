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
   pinta dentro de su hueco. El único editor que no sabía vivir fuera
   de `U.preguntar` era el de Campos: aquí se le cambia el "Aceptar"
   del cuadro por un botón "Guardar campos" propio de la sección,
   porque una pantalla entera no tiene un botón de aceptar común.
   ============================================================ */

if (App.PANTALLAS.indexOf('tipo-asunto') === -1) App.PANTALLAS.push('tipo-asunto');

/* ---------- entrar y salir ---------- */

App.abrirTipoDeAsunto = async function (tipo) {
  App.E.tipoAjustesActual = tipo;
  /* Se relee campos.json justo al abrir: el compañero puede haberlo
     cambiado desde el otro ordenador mientras tanto (igual que hacía
     el cuadro de "Campos" antes de este cambio). */
  try { App.E.campos = await Campos.leer(App.E.gestor); } catch (e) { /* se sigue con lo que había */ }
  App.ir('tipo-asunto');
  await App.pintarTipoDeAsunto();
};

App.cerrarTipoDeAsunto = function () {
  App.E.tipoAjustesActual = null;
  App.ir('ajustes');
};

/* Un bloque de sección, siempre desplegado: mismo aspecto que un
   `.bloque-ajustes`, pero sin `<details>`, porque las siete tienen que
   verse a la vez, sin plegar. */
function seccionDeTipo(titulo, pie) {
  var sec = document.createElement('section');
  sec.className = 'tipo-asunto-seccion';
  var h = document.createElement('h3');
  h.textContent = titulo;
  sec.appendChild(h);
  if (pie) {
    var p = document.createElement('span');
    p.className = 'bloque-pie';
    p.textContent = pie;
    sec.appendChild(p);
  }
  var cuerpo = document.createElement('div');
  cuerpo.className = 'tipo-asunto-seccion-cuerpo';
  sec.appendChild(cuerpo);
  return { sec: sec, cuerpo: cuerpo };
}

/* ---------- 1. Datos del tipo ---------- */

function construirSeccionDatos(tipo) {
  var b = seccionDeTipo('Datos del tipo');
  var lista = document.createElement('div');
  lista.className = 'lista';
  lista.appendChild(App.filaEstado('Nombre', tipo.tipo));
  lista.appendChild(App.filaEstado('Categoría', tipo.categoria));
  if (tipo.alias && tipo.alias.length) {
    lista.appendChild(App.filaEstado('Antes se llamó', tipo.alias.join(', ')));
  }
  b.cuerpo.appendChild(lista);
  var cambiar = document.createElement('button');
  cambiar.type = 'button';
  cambiar.className = 'boton';
  cambiar.style.marginTop = '10px';
  cambiar.textContent = 'Cambiar el nombre';
  cambiar.onclick = function () { App.renombrarTipo(tipo); };
  b.cuerpo.appendChild(cambiar);
  return b.sec;
}

/* ---------- 2. Campos ----------

   Es la lógica que antes vivía en `App.pintarCuadroDeCampos`, dentro
   de un `U.preguntar`. Aquí se pinta igual, pero el "Aceptar" del
   cuadro se sustituye por un botón "Guardar campos" propio de la
   sección: `lista` se sigue mutando en el sitio y solo se escribe en
   `campos.json` al pulsarlo. */
async function construirSeccionCampos(tipo) {
  var b = seccionDeTipo('Campos',
    'Los campos de este tipo, en el orden en que saldrán en el formulario y en el nombre de la carpeta.');
  var cuerpo = b.cuerpo;

  /* `$` global (js/util.js) busca con `document.getElementById`, y
     esta sección se pinta ANTES de colgarse del documento (se pinta
     entera y luego el orquestador la añade a su columna): mientras
     tanto `document.getElementById` no encuentra nada dentro de un
     trozo de DOM todavía suelto. Aquí se sombrea por uno que busca
     solo dentro de `cuerpo`, ya esté colgado o no. */
  function $(id) { return cuerpo.querySelector('#' + id); }

  var catalogo = await Campos.catalogoDeCategoria(App.E.datos, tipo.categoria, App.E.campos);
  var lista = ((App.E.campos.porTipo || {})[tipo.tipo] || []).map(function (c) { return Object.assign({}, c); });

  function textoOrigen(c) {
    return c.origen === 'fichero' ? 'del fichero' : (c.origen === 'calculado' ? 'calculado' : 'propio');
  }

  function catalogoDisponible(filtro) {
    var usadas = {};
    lista.forEach(function (c) { usadas[Campos.claveDeCampo(c)] = true; });
    var q = U.normalizar(filtro || '');
    return catalogo.filter(function (c) {
      if (usadas[Campos.claveDeCampo(c)]) return false;
      if (q && U.normalizar(c.nombre).indexOf(q) === -1) return false;
      return true;
    });
  }

  function pintar() {
    var buscado = $('campos-buscar') ? $('campos-buscar').value : '';
    cuerpo.innerHTML =
      '<div id="campos-puestos" class="lista"></div>' +
      '<button type="button" class="boton boton-principal" id="campos-guardar" ' +
      'style="margin-top:10px">Guardar campos</button>' +
      '<p class="explica" style="margin-top:18px">Campos disponibles en ' + U.escapar(tipo.categoria) +
      ':</p>' +
      '<input id="campos-buscar" class="campo" placeholder="Buscar un campo…" value="' +
      U.escapar(buscado) + '">' +
      '<div id="campos-catalogo" class="lista" style="margin-top:8px"></div>' +
      '<div id="campos-propio-nuevo"></div>' +
      '<button type="button" class="boton" id="campos-btn-propio" style="margin-top:8px">' +
      '+ Crear un campo propio</button>';

    pintarPuestos();
    pintarCatalogo(buscado);
    $('campos-buscar').oninput = function () { pintarCatalogo($('campos-buscar').value); };
    $('campos-btn-propio').onclick = abrirFormularioPropio;
    $('campos-guardar').onclick = guardarCampos;
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

      var oblig = document.createElement('label');
      oblig.className = 'interruptor interruptor-fila';
      var cOblig = document.createElement('input');
      cOblig.type = 'checkbox';
      cOblig.checked = !!c.obligatorio;
      cOblig.onchange = function () { c.obligatorio = cOblig.checked; };
      oblig.appendChild(cOblig);
      var tOblig = document.createElement('span');
      tOblig.textContent = 'Obligatorio';
      oblig.appendChild(tOblig);
      f.appendChild(oblig);

      var enNom = document.createElement('label');
      enNom.className = 'interruptor interruptor-fila';
      var cEnNom = document.createElement('input');
      cEnNom.type = 'checkbox';
      cEnNom.checked = c.enNombre !== false;
      cEnNom.onchange = function () { c.enNombre = cEnNom.checked; };
      enNom.appendChild(cEnNom);
      var tEnNom = document.createElement('span');
      tEnNom.textContent = 'Añadir al nombre';
      enNom.appendChild(tEnNom);
      f.appendChild(enNom);

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
      quitar.onclick = function () { lista.splice(i, 1); pintar(); };
      f.appendChild(quitar);

      envoltorio.appendChild(f);

      /* Lo que se comparte, avisa (17-sep-2026, docs/AJUSTES-POR-TIPO.md):
         un campo propio puede estar puesto en otros tipos también. No
         bloquea nada, solo informa. */
      if (c.origen === 'propio') {
        var otros = Campos.tiposQueUsanPropio(App.E.campos, c.id)
          .filter(function (t) { return t !== tipo.tipo; });
        if (otros.length) {
          var aviso = document.createElement('div');
          aviso.className = 'aviso-compartido';
          aviso.textContent = 'También se usa en ' + otros.length +
            (otros.length === 1 ? ' tipo más: ' : ' tipos más: ') + otros.join(', ');
          envoltorio.appendChild(aviso);
        }
      }

      cont.appendChild(envoltorio);
    });
  }

  function mover(i, salto) {
    var j = i + salto;
    if (j < 0 || j >= lista.length) return;
    var g = lista[i]; lista[i] = lista[j]; lista[j] = g;
    pintarPuestos();
  }

  function pintarCatalogo(filtro) {
    var cont = $('campos-catalogo');
    var disponibles = catalogoDisponible(filtro);
    if (!disponibles.length) {
      cont.innerHTML = '<div class="vacio">Nada que añadir' + (filtro ? ' con ese texto' : '') + '.</div>';
      return;
    }
    cont.innerHTML = '';
    disponibles.slice(0, 80).forEach(function (c) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(c.nombre) + '</span>' +
        '<span class="suave">' + textoOrigen(c) + '</span>';
      var anadir = document.createElement('button');
      anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir';
      anadir.onclick = function () {
        var nuevo = { origen: c.origen, obligatorio: false, enNombre: false };
        if (c.origen === 'fichero') nuevo.columna = c.columna; else nuevo.id = c.id;
        lista.push(nuevo);
        pintar();
      };
      f.appendChild(anadir);
      cont.appendChild(f);
    });
  }

  /* ---------- crear un campo propio sin salir de esta pantalla ---------- */

  function abrirFormularioPropio() {
    if ($('campos-propio-form')) return;
    var caja2 = $('campos-propio-nuevo');
    var d = document.createElement('div');
    d.id = 'campos-propio-form';
    d.style.cssText = 'margin:8px 0;padding:10px 12px;border:1px solid #d7dee6;' +
                      'border-radius:8px;background:#f7f9fb';
    d.innerHTML =
      '<label class="etiqueta">Nombre del campo</label>' +
      '<input id="propio-nombre" class="campo" autocomplete="off" placeholder="Por ejemplo: Trimestre">' +
      '<label class="etiqueta">Clase</label>' +
      '<select id="propio-clase" class="campo">' +
      '<option value="texto">Texto libre</option><option value="lista">Lista cerrada</option></select>' +
      '<div id="propio-valores-caja" class="oculto">' +
      '<label class="etiqueta">Valores, uno por línea</label>' +
      '<textarea id="propio-valores" class="campo" rows="3"></textarea></div>' +
      '<div id="propio-aviso" class="nota"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
      '<button type="button" class="boton" id="propio-cancelar">Cancelar</button>' +
      '<button type="button" class="boton boton-principal" id="propio-crear">Crear y añadir</button>' +
      '</div>';
    caja2.appendChild(d);

    $('propio-clase').onchange = function () {
      $('propio-valores-caja').classList.toggle('oculto', $('propio-clase').value !== 'lista');
    };
    $('propio-nombre').oninput = avisoPropio;
    $('propio-cancelar').onclick = function () { d.remove(); };
    $('propio-crear').onclick = crearPropio;
    avisoPropio();
    $('propio-nombre').focus();
  }

  function avisoPropio() {
    var campo = $('propio-nombre');
    var aviso = $('propio-aviso');
    var crear = $('propio-crear');
    if (!campo) return;
    var nombre = campo.value.trim();
    if (!nombre) {
      crear.disabled = true;
      aviso.textContent = 'Escribe el nombre del campo.';
      return;
    }
    var nombresPropios = (App.E.campos.propios || []).map(function (p) { return p.nombre; });
    var cerca = U.parecidos(nombre, nombresPropios);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      crear.disabled = true;
      aviso.textContent = 'Ya hay un campo propio así, escrito: ' + mismo.nombre + '.';
      return;
    }
    crear.disabled = false;
    aviso.textContent = cerca.length
      ? 'Ojo, se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ') + '.'
      : 'Se creará como campo propio, vale para cualquier tipo de asunto.';
  }

  async function crearPropio() {
    var nombre = $('propio-nombre').value.trim();
    if (!nombre) return;
    var clase = $('propio-clase').value === 'lista' ? 'lista' : 'texto';
    var valores = clase === 'lista'
      ? $('propio-valores').value.split('\n').map(function (v) { return v.trim(); }).filter(Boolean)
      : [];
    var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
                  nombre: nombre, clase: clase, valores: valores };
    try {
      App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) {
        propios.push(nuevo);
        return propios;
      });
      catalogo.push({ origen: 'propio', id: nuevo.id, nombre: nuevo.nombre,
                       clase: nuevo.clase, valores: nuevo.valores });
      lista.push({ origen: 'propio', id: nuevo.id, obligatorio: false, enNombre: false });
      pintar();
      U.aviso('Campo propio ' + nombre + ' creado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido crearlo: ' + e.message, 'malo');
    }
  }

  async function guardarCampos() {
    try {
      App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
      U.aviso('Campos de ' + tipo.tipo + ' guardados.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlos: ' + e.message, 'malo');
    }
  }

  pintar();
  return b.sec;
}

/* ---------- 3. Pasos del trámite ---------- */

function construirSeccionPasos(tipo) {
  var b = seccionDeTipo('Pasos del trámite', 'La guía del tipo, con sus preguntas y bifurcaciones.');

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
    b.cuerpo.appendChild(boton);
  }
  repintar();
  return b.sec;
}

/* ---------- 6. Plazo ---------- */

function construirSeccionPlazo(tipo) {
  var b = seccionDeTipo('Plazo', 'Los días de plazo por defecto de este tipo.');
  b.cuerpo.appendChild(App.construirCasillaPlazo(tipo));
  return b.sec;
}

/* ---------- el orquestador de las siete secciones ---------- */

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
    var secPalabras = seccionDeTipo('Palabras clave',
      'Para proponer este tipo al leer un documento suelto en "Por clasificar".');
    col1.appendChild(secPalabras.sec);
    PalabrasClaveTipo.pintarDeTipo(secPalabras.cuerpo, tipo);
  }

  var secCorreo = seccionDeTipo('Plantillas de correo y de Séneca',
    'Las plantillas pegadas a este tipo, con su editor de huecos.');
  col2.appendChild(secCorreo.sec);
  var secWord = seccionDeTipo('Plantilla de documento de Word',
    'El .docx colgado de este tipo y su tipo de documento.');
  col2.appendChild(secWord.sec);
  var secRec = seccionDeTipo('Se repite',
    'La recurrencia de este tipo: cada cuánto, qué día y para qué tercero.');
  col2.appendChild(secRec.sec);

  if (window.PlantillasAjustes) await PlantillasAjustes.pintarDeTipo(secCorreo.cuerpo, tipo);
  if (window.PlantillasDocumento) await PlantillasDocumento.pintarDeTipo(secWord.cuerpo, tipo);
  if (window.Recurrentes) Recurrentes.pintarEnContenedor(secRec.cuerpo, tipo.tipo);
};
