/* ============================================================
   plantillas-ajustes.js — el bloque "Plantillas de correo" de
   Ajustes (16-sep-2026, docs/PLANTILLAS-DE-CORREO.md).

   Vivía dentro de js/plantillas.js hasta que ese fichero, al crecer
   con el motor de las plantillas de documento (fila 17 de
   docs/COLA.md, docs/PLANTILLAS-DE-DOCUMENTO.md), pasó de 450 líneas.
   Se saca aquí sin cambiar lo que hace: solo pantalla, apoyada en la
   API pública de `window.Plantillas` (cargar, guardar, deTipo,
   idNuevo, rellenar, HUECOS...).

   Se engancha solo, como js/bandeja-correos.js y js/unir-asuntos.js:
   no toca js/ajustes.js, que ya pasa de 47 KB. El bloque "Plantillas
   de documento" es hermano de este, y vive en
   js/plantillas-documento.js.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var datosDeAjustes = null;   /* { firma, centro, lista } ya leído, para pintar sin esperar */

  function bloqueDeAjustes() {
    var ya = $('bloque-plantillas');
    if (ya) return ya;
    var pantalla = $('pantalla-ajustes');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-plantillas';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Plantillas de correo</span>' +
        '<span class="bloque-pie">Textos ya escritos para el correo y el mensaje de Séneca, por tipo de asunto</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Cada plantilla es solo el cuerpo del medio: el saludo y la firma se ' +
        'ponen solos. Sirve igual para el correo y para el mensaje de Séneca. Los huecos entre ' +
        'llaves, como <code>{nombre}</code>, se rellenan solos al abrir el cuadro.</p>' +
        '<div class="alta-tipo">' +
          '<input id="plantillas-buscar" class="campo" placeholder="Buscar por tipo o por nombre">' +
          '<button type="button" class="boton boton-principal" id="plantillas-nueva">+ Nueva plantilla</button>' +
        '</div>' +
        '<div id="plantillas-lista" class="rejilla-tipos"></div>' +
        '<hr>' +
        '<p class="explica">Estos datos los usan también las plantillas de documento de Word, ' +
        'en Ajustes › Plantillas de documento.</p>' +
        '<label class="etiqueta">Firma</label>' +
        '<textarea id="plantillas-firma" class="campo" rows="3"></textarea>' +
        '<div class="dos-columnas">' +
          '<div><label class="etiqueta">Nombre del centro</label>' +
            '<input id="plantillas-centro" class="campo"></div>' +
          '<div><label class="etiqueta">Cargo de quien firma</label>' +
            '<input id="plantillas-cargo" class="campo" placeholder="Director, Secretario…"></div>' +
        '</div>' +
        '<div class="dos-columnas">' +
          '<div><label class="etiqueta">Localidad</label>' +
            '<input id="plantillas-localidad" class="campo"></div>' +
          '<div><label class="etiqueta">Código del centro</label>' +
            '<input id="plantillas-codigo" class="campo"></div>' +
        '</div>' +
        '<label class="etiqueta">Dirección del centro</label>' +
        '<input id="plantillas-direccion" class="campo">' +
        '<button type="button" class="boton" id="plantillas-guardar-firma">Guardar firma y centro</button>' +
      '</div>';
    pantalla.appendChild(d);

    $('plantillas-buscar').oninput = pintarLista;
    $('plantillas-nueva').onclick = function () { abrirCuadroDePlantilla(null); };
    $('plantillas-guardar-firma').onclick = guardarFirma;
    return d;
  }

  async function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    if (!App.E.gestor) return;
    datosDeAjustes = await Plantillas.cargar(App.E.gestor);
    $('plantillas-firma').value = datosDeAjustes.firma;
    $('plantillas-centro').value = datosDeAjustes.centro;
    $('plantillas-localidad').value = datosDeAjustes.localidad;
    $('plantillas-direccion').value = datosDeAjustes.direccion;
    $('plantillas-codigo').value = datosDeAjustes.codigo;
    $('plantillas-cargo').value = datosDeAjustes.cargo;
    pintarLista();
  }

  function pintarLista() {
    var caja = $('plantillas-lista');
    if (!caja || !datosDeAjustes) return;
    var q = U.normalizar($('plantillas-buscar').value);
    var lista = datosDeAjustes.lista.filter(function (p) {
      return !q || U.normalizar(p.nombre + ' ' + p.tipo + ' ' + p.categoria).indexOf(q) !== -1;
    }).slice().sort(function (a, b) {
      return (a.tipo + a.nombre) < (b.tipo + b.nombre) ? -1 : 1;
    });

    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">' +
        (datosDeAjustes.lista.length ? 'Nada coincide con lo que buscas.' : 'Todavía no hay ninguna plantilla.') +
        '</div>';
      return;
    }
    lista.forEach(function (p) { caja.appendChild(tarjetaDePlantilla(p)); });
  }

  function tarjetaDePlantilla(p) {
    var div = document.createElement('div');
    div.className = 'tarjeta-tipo';
    div.innerHTML = '<div class="nombre-tipo">' + U.escapar(p.nombre) + '</div>' +
      '<div class="suave">' + U.escapar(p.tipo) + '  ·  ' + U.escapar(p.categoria) + '</div>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.style.marginTop = '8px';

    var editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'boton';
    editar.textContent = 'Editar';
    editar.onclick = function () { abrirCuadroDePlantilla(p); };
    acciones.appendChild(editar);

    acciones.appendChild(Papelera.botonBorrar(async function () {
      var ok = await Papelera.preguntarBorrar(p.nombre);
      if (!ok) return;
      try {
        await Papelera.mandarDato('plantilla', p.nombre, { categoria: p.categoria, tipo: p.tipo }, { plantilla: p });
        await Plantillas.guardar(App.E.gestor, function (actual) {
          actual.lista = actual.lista.filter(function (x) { return x.id !== p.id; });
          return actual;
        });
        U.aviso('Plantilla mandada a la papelera.', 'bueno');
        await pintarBloqueAjustes();
      } catch (e) {
        U.aviso('No he podido borrarla: ' + e.message, 'malo');
      }
    }));

    div.appendChild(acciones);
    return div;
  }

  async function guardarFirma() {
    var firma = $('plantillas-firma').value;
    var centro = $('plantillas-centro').value.trim() || Plantillas.POR_DEFECTO_CENTRO;
    var localidad = $('plantillas-localidad').value.trim();
    var direccion = $('plantillas-direccion').value.trim();
    var codigo = $('plantillas-codigo').value.trim();
    var cargo = $('plantillas-cargo').value.trim();
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.firma = firma;
        actual.centro = centro;
        actual.localidad = localidad;
        actual.direccion = direccion;
        actual.codigo = codigo;
        actual.cargo = cargo;
        return actual;
      });
      U.aviso('Firma y centro guardados.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
    }
  }

  /* ---------- el cuadro de alta / edición ----------

     Un cuadro de U.preguntar corriente: la pantalla de Ajustes no es
     ningún cuadro, así que no hay problema en abrir este. */

  function datosDeMuestra(categoria, tipo) {
    var real = (App.E.listaAbiertos || []).filter(function (a) {
      var c = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria);
      var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo);
      return c === categoria && t === tipo;
    })[0];

    var hoy = U.fechaLegible(U.aAaMmDd(U.hoyIso()));
    if (real) {
      var f = real.ficha || {};
      var resto = (real.leido && real.leido.resto) || '';
      return {
        nombre: soloElNombreDeMuestra(f.tercero || Nombres.terceroDeResto(resto)),
        grupo: f.grupo || '',
        curso: f.curso || '',
        tipo: tipo,
        hoy: hoy,
        limite: f.limite ? U.fechaLegible(U.aAaMmDd(f.limite)) : '',
        usuario: App.E.usuario || 'Quien firme',
        centro: (datosDeAjustes && datosDeAjustes.centro) || Plantillas.POR_DEFECTO_CENTRO,
        campos: {}
      };
    }
    return {
      nombre: 'Pérez García, Ana', grupo: '2ºA', curso: U.cursoActual(), tipo: tipo || 'Tipo de ejemplo',
      hoy: hoy, limite: hoy, usuario: App.E.usuario || 'Quien firme',
      centro: (datosDeAjustes && datosDeAjustes.centro) || Plantillas.POR_DEFECTO_CENTRO, campos: {}
    };
  }

  function soloElNombreDeMuestra(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  function opcionesDeCategoria(categoria) {
    return (App.E.tipos || []).filter(function (t) { return t.categoria === categoria; });
  }

  function abrirCuadroDePlantilla(existente) {
    var categorias = Nombres.CATEGORIAS;
    var categoriaInicial = (existente && existente.categoria) || categorias[0];

    function opcionesTipos(categoria) {
      return opcionesDeCategoria(categoria).map(function (t) {
        return '<option value="' + U.escapar(t.tipo) + '"' +
          (existente && existente.tipo === t.tipo ? ' selected' : '') + '>' + U.escapar(t.tipo) + '</option>';
      }).join('');
    }

    var cuerpo =
      '<div class="dos-columnas">' +
        '<div><label class="etiqueta">Categoría</label>' +
          '<select id="pl-categoria" class="campo">' +
            categorias.map(function (c) {
              return '<option value="' + c + '"' + (c === categoriaInicial ? ' selected' : '') + '>' + c + '</option>';
            }).join('') +
          '</select></div>' +
        '<div><label class="etiqueta">Tipo de asunto</label>' +
          '<select id="pl-tipo" class="campo">' + opcionesTipos(categoriaInicial) + '</select></div>' +
      '</div>' +
      '<label class="etiqueta">Nombre de la plantilla</label>' +
      '<input id="pl-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      '<div class="hueco-insertar-fila">' +
        '<button type="button" class="boton" id="pl-insertar-hueco">Insertar hueco</button>' +
      '</div>' +
      '<label class="etiqueta">Texto</label>' +
      '<textarea id="pl-texto" class="campo" rows="7">' + U.escapar((existente && existente.texto) || '') + '</textarea>' +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl-previa"></div></div>';

    var promesa = U.preguntar(existente ? 'Editar plantilla' : 'Nueva plantilla', cuerpo,
      existente ? 'Guardar' : 'Crear');

    U.engancharInsertarHueco($('pl-insertar-hueco'), [$('pl-texto')], Plantillas.HUECOS, pintarPrevia);

    function pintarPrevia() {
      var muestra = datosDeMuestra($('pl-categoria').value, $('pl-tipo').value);
      var r = Plantillas.rellenar($('pl-texto').value, muestra);
      $('pl-previa').textContent = r.texto || '(vacío)';
    }

    $('pl-categoria').onchange = function () {
      $('pl-tipo').innerHTML = opcionesTipos($('pl-categoria').value);
      pintarPrevia();
    };
    $('pl-tipo').onchange = pintarPrevia;
    $('pl-texto').oninput = pintarPrevia;
    pintarPrevia();

    promesa.then(async function (ok) {
      if (!ok) return;
      var nombre = $('pl-nombre').value.trim();
      var tipo = $('pl-tipo').value;
      var categoria = $('pl-categoria').value;
      var texto = $('pl-texto').value;
      if (!nombre || !tipo || !texto.trim()) {
        U.aviso('Hace falta el nombre, el tipo y el texto.', 'malo');
        return;
      }
      try {
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) actual.lista[i] = { id: existente.id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
          } else {
            actual.lista.push({ id: Plantillas.idNuevo(), tipo: tipo, categoria: categoria, nombre: nombre, texto: texto });
          }
          return actual;
        });
        U.aviso(existente ? 'Plantilla guardada.' : 'Plantilla creada.', 'bueno');
        await pintarBloqueAjustes();
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + e.message, 'malo');
      }
    });
  }

  /* ==========================================================
     ENGANCHE
     ========================================================== */

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!$('pantalla-ajustes') || !App.E.gestor) return;
      try { pintarBloqueAjustes(); } catch (e) { /* un bloque roto no puede tumbar la aplicación */ }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

})();
