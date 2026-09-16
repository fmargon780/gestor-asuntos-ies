/* ============================================================
   plantillas.js — plantillas de correo y de mensaje de Séneca
   (16-sep-2026, docs/PLANTILLAS-DE-CORREO.md).

   Una plantilla es solo el cuerpo del medio: el saludo y la firma los
   sigue poniendo js/correo.js, solos. La misma plantilla sirve para el
   correo y para el mensaje de Séneca. Se crean en Ajustes, pegadas al
   tipo de asunto, y se guardan en _GESTOR/plantillas.json, compartido
   con el compañero.

   Este fichero trae dos cosas separadas:
     - El módulo `Plantillas`: leer y guardar el fichero, y rellenar
       los huecos de un texto. Lo usa js/correo.js.
     - El bloque "Plantillas de correo" de Ajustes, con su propia
       pantalla de alta/edición. Vive aquí para no engordar
       js/ajustes.js: se engancha solo, como hacen js/bandeja-correos.js
       y js/unir-asuntos.js con sus bloques.
   ============================================================ */
var Plantillas = (function () {

  var ARCHIVO = 'plantillas.json';
  var POR_DEFECTO_FIRMA = 'Un saludo.\n{usuario}\n{centro}';
  var POR_DEFECTO_CENTRO = 'IES Fuente Lucena';

  /* Los huecos que se conocen, con el nombre en cristiano que se
     enseña en Ajustes y en el aviso de "Faltan datos". `{campo:LO QUE
     SEA}` es aparte: vale para cualquier campo propio del tipo. */
  var HUECOS = [
    { clave: 'nombre', etiqueta: 'Nombre del tercero' },
    { clave: 'grupo', etiqueta: 'Grupo' },
    { clave: 'curso', etiqueta: 'Año académico' },
    { clave: 'tipo', etiqueta: 'Tipo de asunto' },
    { clave: 'hoy', etiqueta: 'Fecha de hoy' },
    { clave: 'limite', etiqueta: 'Fecha límite' },
    { clave: 'usuario', etiqueta: 'Quien firma' },
    { clave: 'centro', etiqueta: 'Nombre del centro' }
  ];

  function $(id) { return document.getElementById(id); }

  var cache = null;

  function limpio(leido) {
    return (leido && typeof leido === 'object')
      ? { firma: leido.firma || POR_DEFECTO_FIRMA, centro: leido.centro || POR_DEFECTO_CENTRO,
          lista: Array.isArray(leido.lista) ? leido.lista : [] }
      : { firma: POR_DEFECTO_FIRMA, centro: POR_DEFECTO_CENTRO, lista: [] };
  }

  /* Si el fichero no existe todavía, sale lo de siempre (la firma y el
     centro que hasta hoy estaban escritos en js/correo.js) y no falla
     nada: se crea de verdad al primer guardado.

     Se relee cada vez, sin guardar en caché entre llamadas: es un
     fichero compartido con el compañero, y el cuadro de Correo lo pide
     una vez por apertura, así que releerlo no cuesta nada y evita que
     un cambio suyo se quede sin ver. `cache` solo sirve para que el
     propio bloque de Ajustes, mientras está abierto, no tenga que
     volver a leer el fichero en cada tecla de su buscador. */
  async function cargar(gestor) {
    var leido = null;
    try { leido = gestor ? await Carpetas.leerJson(gestor, ARCHIVO) : null; } catch (e) { leido = null; }
    cache = limpio(leido);
    return cache;
  }

  function olvidar() { cache = null; }

  /* Como Campos.guardarPropios: relee lo de verdad (no lo que hubiera
     en caché, que puede estar viejo si el compañero ha guardado algo
     mientras tanto), aplica `mutar` y guarda. */
  async function guardar(gestor, mutar) {
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, ARCHIVO); } catch (e) { leido = null; }
    var actual = limpio(leido);
    var nuevo = mutar(actual) || actual;
    await Copias.guardar(gestor, ARCHIVO, nuevo);
    cache = nuevo;
    return nuevo;
  }

  function deTipo(datos, categoria, tipo) {
    return ((datos && datos.lista) || []).filter(function (p) {
      return p.categoria === categoria && p.tipo === tipo;
    });
  }

  function idNuevo() { return 'pl-' + Date.now() + Math.floor(Math.random() * 1000); }

  function nombreDeHueco(clave) {
    var h = HUECOS.filter(function (x) { return x.clave === clave; })[0];
    return h ? h.etiqueta : clave;
  }

  /* Las llaves se comparan sin mayúsculas ni acentos, nunca al
     sustituir: el valor que trae el campo se escribe tal cual. */
  function buscarCampo(campos, nombre) {
    var normal = U.normalizar(nombre);
    var clave = Object.keys(campos || {}).filter(function (k) { return U.normalizar(k) === normal; })[0];
    return clave ? campos[clave] : '';
  }

  /* Sustituye {hueco} y {campo:LO QUE SEA} de un texto.

     `valores` trae lo que se sepa del asunto: nombre, grupo, curso,
     tipo, hoy, limite, usuario, centro, y `campos` (un objeto nombre
     de campo -> valor). Un hueco sin valor se deja vacío —nunca se
     escribe {grupo} en lo que le llega al tercero— y se apunta en
     `faltan`; uno que no se reconozca se deja tal cual (para no
     romper nada) y también se apunta. */
  function rellenar(texto, valores) {
    valores = valores || {};
    var faltan = [];
    var CONOCIDOS = ['nombre', 'grupo', 'curso', 'tipo', 'hoy', 'limite', 'usuario', 'centro'];
    var salida = String(texto || '').replace(/\{([^{}]+)\}/g, function (todo, dentro) {
      var clave = dentro.trim();
      if (/^campo\s*:/i.test(clave)) {
        var nombreCampo = clave.replace(/^campo\s*:/i, '').trim();
        var valorCampo = buscarCampo(valores.campos, nombreCampo);
        if (!valorCampo) faltan.push(nombreCampo);
        return valorCampo || '';
      }
      var real = CONOCIDOS.filter(function (c) { return U.normalizar(c) === U.normalizar(clave); })[0];
      if (!real) { faltan.push(clave); return todo; }
      var valor = valores[real] || '';
      if (!valor) faltan.push(nombreDeHueco(real));
      return valor;
    });
    return { texto: salida, faltan: faltan };
  }

  var API = {
    ARCHIVO: ARCHIVO, HUECOS: HUECOS,
    POR_DEFECTO_FIRMA: POR_DEFECTO_FIRMA, POR_DEFECTO_CENTRO: POR_DEFECTO_CENTRO,
    cargar: cargar, olvidar: olvidar, guardar: guardar,
    deTipo: deTipo, idNuevo: idNuevo, rellenar: rellenar
  };

  /* ==========================================================
     EL BLOQUE DE AJUSTES

     Vive aparte del módulo de arriba para que quede claro qué es la
     lógica (la usa js/correo.js) y qué es solo pantalla. Se engancha
     solo, como js/bandeja-correos.js y js/unir-asuntos.js: no toca
     js/ajustes.js, que ya pasa de 47 KB.
     ========================================================== */

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
        '<label class="etiqueta">Firma</label>' +
        '<textarea id="plantillas-firma" class="campo" rows="3"></textarea>' +
        '<label class="etiqueta">Nombre del centro</label>' +
        '<input id="plantillas-centro" class="campo">' +
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
    datosDeAjustes = await cargar(App.E.gestor);
    $('plantillas-firma').value = datosDeAjustes.firma;
    $('plantillas-centro').value = datosDeAjustes.centro;
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
        await guardar(App.E.gestor, function (actual) {
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
    var centro = $('plantillas-centro').value.trim() || POR_DEFECTO_CENTRO;
    try {
      await guardar(App.E.gestor, function (actual) {
        actual.firma = firma;
        actual.centro = centro;
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
        centro: (datosDeAjustes && datosDeAjustes.centro) || POR_DEFECTO_CENTRO,
        campos: {}
      };
    }
    return {
      nombre: 'Pérez García, Ana', grupo: '2ºA', curso: U.cursoActual(), tipo: tipo || 'Tipo de ejemplo',
      hoy: hoy, limite: hoy, usuario: App.E.usuario || 'Quien firme',
      centro: (datosDeAjustes && datosDeAjustes.centro) || POR_DEFECTO_CENTRO, campos: {}
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
      '<label class="etiqueta">Huecos</label>' +
      '<div class="correo-botones" id="pl-huecos" style="flex-wrap:wrap"></div>' +
      '<label class="etiqueta">Texto</label>' +
      '<textarea id="pl-texto" class="campo" rows="7">' + U.escapar((existente && existente.texto) || '') + '</textarea>' +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl-previa"></div></div>';

    var promesa = U.preguntar(existente ? 'Editar plantilla' : 'Nueva plantilla', cuerpo,
      existente ? 'Guardar' : 'Crear');

    HUECOS.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.textContent = h.etiqueta;
      b.onclick = function () { insertarHueco('{' + h.clave + '}'); };
      $('pl-huecos').appendChild(b);
    });

    function insertarHueco(texto) {
      var campo = $('pl-texto');
      var inicio = campo.selectionStart || 0;
      var fin = campo.selectionEnd || 0;
      campo.value = campo.value.slice(0, inicio) + texto + campo.value.slice(fin);
      campo.focus();
      campo.selectionStart = campo.selectionEnd = inicio + texto.length;
      pintarPrevia();
    }

    function pintarPrevia() {
      var muestra = datosDeMuestra($('pl-categoria').value, $('pl-tipo').value);
      var r = rellenar($('pl-texto').value, muestra);
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
        await guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) actual.lista[i] = { id: existente.id, tipo: tipo, categoria: categoria, nombre: nombre, texto: texto };
          } else {
            actual.lista.push({ id: idNuevo(), tipo: tipo, categoria: categoria, nombre: nombre, texto: texto });
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

  (function () {
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

  return API;
})();
