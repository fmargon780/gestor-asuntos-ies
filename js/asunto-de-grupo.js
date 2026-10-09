/* ============================================================
   asunto-de-grupo.js — un asunto cuyo tercero no es una persona sino un
   grupo (fila 293, docs/TRABAJO-EN-BLOQUE.md).

   - `esGrupo(a)`: el único criterio de toda la aplicación. Un asunto de grupo
     lleva `ficha.grupo = { nombre, origen, creado }` (un objeto: los asuntos
     de antes guardan ahí, a lo sumo, un texto como «1ºA»).
   - Sus personas son sus relacionados de siempre (`ficha.relacionados`).
   - En «Nuevo asunto»: el botón «Es para un grupo de personas», el cuadro de
     señalar varios (el de «+ Añadir varios»), el nombre del grupo, y el
     tercero `GRUPO <nombre>` con «Grupo <nombre> · N personas» y «Cambiar».
   - «Cambiar el asunto» deja cambiar el nombre del grupo, nunca pasarlo a una persona.
   La tabla «Personas del grupo» vive en js/personas-del-grupo.js.
   ============================================================ */
var AsuntoDeGrupo = (function () {

  var MAXIMO = 40;

  function $(id) { return document.getElementById(id); }
  function fichaDe(a) { return (a && a.ficha) ? a.ficha : (a || {}); }

  function esGrupo(a) {
    var g = fichaDe(a).grupo;
    return !!(g && typeof g === 'object' && g.nombre);
  }
  function personasDe(a) { return fichaDe(a).relacionados || []; }
  function cuantas(a) { return personasDe(a).length; }
  function plural(n) { return n + (n === 1 ? ' persona' : ' personas'); }

  /* «Grupo de 6 personas», donde antes se buscaba a la persona. */
  function textoCabecera(a) { return 'Grupo de ' + plural(cuantas(a)); }
  /* La columna «Tercero» de Inicio. */
  function terceroEnLista(a) { return esGrupo(a) ? 'Grupo ' + fichaDe(a).grupo.nombre + ' · ' + cuantas(a) : ''; }
  /* Para el buscador de Inicio: los nombres de sus personas. */
  function textoDeBusqueda(a) {
    return esGrupo(a) ? U.normalizar(personasDe(a).map(function (r) { return r.nombre; }).join(' ')) : '';
  }

  /* Lo que hace de «persona» donde la aplicación pide una: sin datos, solo para que no falte. */
  function personaDelGrupo(a) {
    var f = fichaDe(a);
    return { esGrupo: true, categoria: f.categoria || 'OTROS', nombre: f.tercero || ('GRUPO ' + (f.grupo && f.grupo.nombre)), campos: {} };
  }

  /* ---------- sin efectos: la categoría y el nombre que se propone ---------- */

  function categoriaDe(marcados) {
    var vistas = {};
    marcados.forEach(function (m) { vistas[m.categoria] = true; });
    var lista = Object.keys(vistas);
    return lista.length === 1 ? lista[0] : 'OTROS';
  }

  /* Un solo atajo y nadie más: de ahí sale el nombre. Quitar a alguien con su × no cuenta como
     tocar la lista; añadir a alguien que no estaba en el atajo, sí. */
  function origenYNombre(marcados, atajos) {
    var distintos = {};
    atajos.forEach(function (x) { distintos[x.tipo + '|' + x.valor] = x; });
    var claves = Object.keys(distintos);
    if (claves.length !== 1) return { origen: 'mano', nombre: '' };
    var x = distintos[claves[0]];
    var delAtajo = {};
    (x.lista || []).forEach(function (m) {
      delAtajo[m.categoria + '|' + m.nombre] = true;
    });
    var ajeno = marcados.some(function (m) { return !delAtajo[m.categoria + '|' + m.nombre]; });
    if (ajeno) return { origen: 'mano', nombre: '' };
    var primero = (x.lista || [])[0] || {};
    var nombre = x.valor;
    if (x.tipo === 'unidad') nombre = Nombres.grupoCompacto(x.valor, primero.curso || '') || x.valor;
    else if (x.tipo === 'nivel') nombre = (x.valor + ' ' + (Nombres.nivelYEnsenanza(primero.unidad || '').ensenanza || '')).trim();
    return { origen: x.tipo === 'ensenanza' ? 'nivel' : x.tipo, nombre: U.limpiarNombre(nombre).slice(0, MAXIMO) };
  }

  /* ---------- «Nuevo asunto» ---------- */

  function pedirNombre(sugerido) {
    var promesa = U.preguntar('Nombre del grupo',
      '<label class="etiqueta" for="grupo-nombre">Nombre del grupo</label>' +
      '<input id="grupo-nombre" class="campo" maxlength="' + MAXIMO + '" value="' + U.escapar(sugerido) + '">' +
      '<p class="nota">Va en el nombre de la carpeta. Como mucho ' + MAXIMO + ' letras.</p>', 'Usar este nombre');
    var campo = $('grupo-nombre'), aceptar = $('cuadro-aceptar');
    function revisar() { aceptar.disabled = !U.limpiarNombre(campo.value); }
    campo.oninput = revisar;
    revisar();
    campo.focus();
    return promesa.then(function (ok) {
      aceptar.disabled = false;
      return ok ? U.limpiarNombre(campo.value).slice(0, MAXIMO) : null;
    });
  }

  async function empezar() {
    var actual = App.E.nuevo.tercero && App.E.nuevo.tercero.esGrupo ? App.E.nuevo.tercero.grupoDatos : null;
    /* Fila 306: un grupo que es una actividad extraescolar se cambia en su propio formulario. */
    if (actual && actual.actividad && window.ActividadesFormulario) return ActividadesFormulario.cambiarDesdeNuevo();
    var atajos = actual ? actual.atajos.slice() : [];
    var marcados = await Relacionados.elegirVarios({
      titulo: 'Un grupo de personas', marcadosIniciales: actual ? actual.marcados : null, minimo: 2,
      textoBoton: function (n) { return 'Usar los ' + n + ' señalados'; },
      alSenalar: function (tipo, valor, lista) {
        atajos.push({ tipo: tipo, valor: valor, lista: (lista || []).map(function (m) {
          return { categoria: m.categoria || 'ALUMNADO', nombre: m.campos ? App.textoTercero(m) : m.nombre, unidad: m.unidad, curso: m.curso };
        }) });
      }
    });
    if (!marcados || marcados.length < 2) return;
    var d = origenYNombre(marcados, atajos);
    var sugerido = d.nombre || (actual && actual.nombre) || '';
    var nombre = await pedirNombre(sugerido);
    if (!nombre) return;
    fijar({ nombre: nombre, origen: d.origen, marcados: marcados, atajos: atajos });
  }

  function fijar(g) {
    var categoria = g.categoria || categoriaDe(g.marcados);   /* fila 306: una actividad lleva la categoría de su tipo */
    var pseudo = { esGrupo: true, categoria: categoria, nombre: 'GRUPO ' + g.nombre, campos: {}, grupoDatos: g };
    var primero = g.marcados[0] && g.marcados[0].persona;
    if (g.origen === 'unidad' && primero) { pseudo.unidad = primero.unidad; pseudo.curso = primero.curso; }
    App.fijarTercero(pseudo);
  }

  /* El recuadro del tercero elegido, para un grupo. Se engancha a `App.alFijarTercero`: así sale igual
     cuando elegir otro tipo vuelve a fijar el tercero. */
  function pintarElegido(p, caja) {
    if (!p || !p.esGrupo) return;
    var g = p.grupoDatos;
    caja.innerHTML = '<div class="elegido-caja"><div><strong>Grupo ' + U.escapar(g.nombre) + ' · ' +
      plural(g.marcados.length) + '</strong></div><button type="button" class="boton" id="btn-cambiar-tercero">Cambiar</button></div>';
    $('btn-cambiar-tercero').onclick = empezar;
  }

  /* Al crear: `ficha.grupo` y las personas, en la misma escritura que el resto de la ficha. */
  function alDatosNuevos(datos, tercero) {
    if (!tercero || !tercero.esGrupo) return;
    var g = tercero.grupoDatos;
    delete datos.contacto;
    datos.grupo = { nombre: g.nombre, origen: g.origen, creado: U.ahora() };
    if (g.actividad) datos.actividad = { id: g.actividad.id };   /* fila 306: lo demás vive en actividades.json */
    datos.relacionados = Relacionados.combinarRelacionados([], datos.categoria, datos.tercero,
      g.marcados.map(function (m) { return { categoria: m.categoria, nombre: m.nombre }; })).finales;
  }

  function botonDeNuevo() {
    var b = $('btn-grupo-nuevo');
    if (b) b.onclick = empezar;
  }

  /* ---------- «Cambiar el asunto» ---------- */

  /* En vez del buscador de personas: el nombre del grupo. Devuelve lo que espera el cuadro
     (`terceroElegido`): el grupo con su nombre nuevo, o null si no se ha tocado. */
  function montarEditar(caja, a, alCambiar) {
    var f = fichaDe(a);
    caja.innerHTML = '<input id="ed-grupo-nombre" class="campo" maxlength="' + MAXIMO + '" value="' + U.escapar(f.grupo.nombre) + '">' +
      '<p class="nota">Es un asunto de un grupo de personas: se le puede cambiar el nombre, pero no pasarlo a una sola persona.</p>';
    var campo = caja.querySelector('#ed-grupo-nombre');
    campo.oninput = alCambiar;
    return {
      terceroElegido: function () {
        var nombre = U.limpiarNombre(campo.value).slice(0, MAXIMO);
        if (!nombre || nombre === f.grupo.nombre) return null;
        return { esGrupo: true, categoria: f.categoria || 'OTROS', nombre: 'GRUPO ' + nombre, campos: {}, nombreDelGrupo: nombre };
      }
    };
  }
  /* El `grupo` de la ficha con el nombre nuevo (o tal cual, si no ha cambiado). */
  function grupoRenombrado(a, elegido) {
    var g = Object.assign({}, fichaDe(a).grupo);
    if (elegido && elegido.nombreDelGrupo) g.nombre = elegido.nombreDelGrupo;
    return g;
  }

  /* ---------- la tarjeta de la ficha ---------- */

  /* «Personas del grupo (N)» en lugar de «Personas y entidades relacionadas». */
  function titularTarjeta(raiz, a) {
    var t = raiz && raiz.querySelector('.ficha-tarjeta[data-tarjeta="relacionados"]');
    if (!t) return;
    var titulo = t.querySelector('.ficha-titulo');
    var texto = esGrupo(a) ? 'Personas del grupo (' + cuantas(a) + ')' : '';
    if (!texto) { delete t.dataset.titulo; return; }
    t.dataset.titulo = texto;
    if (titulo && titulo.firstChild && titulo.firstChild.nodeType === 3 && titulo.firstChild.nodeValue !== texto) titulo.firstChild.nodeValue = texto;
  }

  if (window.App && App.alFijarTercero) App.alFijarTercero.push(pintarElegido);
  botonDeNuevo();

  return {
    esGrupo: esGrupo, cuantas: cuantas, textoCabecera: textoCabecera, terceroEnLista: terceroEnLista,
    textoDeBusqueda: textoDeBusqueda, personaDelGrupo: personaDelGrupo, titularTarjeta: titularTarjeta,
    alDatosNuevos: alDatosNuevos, montarEditar: montarEditar, grupoRenombrado: grupoRenombrado,
    fijar: fijar,
    _interno: { categoriaDe: categoriaDe, origenYNombre: origenYNombre, empezar: empezar }
  };
})();
window.AsuntoDeGrupo = AsuntoDeGrupo;
