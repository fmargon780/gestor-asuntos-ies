/* ============================================================
   campos-valores.js — clase, nombre y valor de cada campo y el catálogo de una categoría (fila 536: trozo de js/campos.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/campos.js.
   ============================================================ */
var CamposNucleo = CamposNucleo || {};
(function () {

  var I = CamposNucleo;
  /* Fila 244 (js/campos-clases.js): la clase de un campo (solo los propios la
     tienen; el resto, texto) y cómo se lee y se enseña su valor. */
  function claseDeCampo(c, config) {
    if (!c || c.origen !== 'propio') return 'texto';
    var p = ((config && config.propios) || []).filter(function (x) { return x.id === c.id; })[0];
    return (p && p.clase) || 'texto';
  }
  function leerValor(clase, texto) { return window.CamposClases ? CamposClases.leer(clase, texto) : { ok: true, valor: String(texto || '').trim() }; }
  function mostrarValor(clase, valor) { return window.CamposClases ? CamposClases.mostrar(clase, valor) : String(valor || ''); }

  /* El nombre que se enseña. Para uno "de fichero" es el propio título
     de la columna; para uno calculado o propio, hay que mirarlo en su
     tabla. */
  function nombreDeCampo(c, config) {
    if (!c) return '';
    if (c.origen === 'fichero') return c.columna;
    if (c.origen === 'calculado') {
      var propio = ((config && config.calculados) || []).filter(function (x) { return x.id === c.id; })[0];
      if (propio) return propio.nombre;
      var cal = CALCULADOS.filter(function (x) { return x.id === c.id; })[0];
      return cal ? cal.nombre : c.id;
    }
    if (c.origen === 'propio') {
      var p = ((config && config.propios) || []).filter(function (x) { return x.id === c.id; })[0];
      return p ? p.nombre : c.id;
    }
    return '';
  }

  /* ---------- los campos calculados ----------

     Tabla abierta a propósito: para añadir otro no hay que tocar nada
     más de este fichero. Cada uno dice de qué categorías vale y cómo
     se calcula a partir de la persona (el tercero) que se ha elegido. */

  /* "Curso": la unidad sin su última letra, y sin el espacio que deja
     al quitarla.
         1ºA       -> 1º
         1ºBachA   -> 1ºBach
         2ºFPB B   -> 2ºFPB
     No inventa la etapa: si la unidad no la trae, el curso sale sin
     ella, porque solo se le quita la última letra. */
  function calcularCurso(unidad) {
    var t = String(unidad || '').trim();
    if (!t) return '';
    t = t.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]$/, '');
    return t.replace(/\s+$/, '');
  }

  /* Se aplica sobre la forma COMPACTA del grupo (`Nombres.grupoCompacto`,
     la misma que usa el nombre del grupo), no
     sobre la Unidad tal cual la escribe Séneca: así da "1ºBach" y no
     "1º Bach", con el hueco de en medio. */
  var CALCULADOS = [
    {
      id: 'curso', nombre: 'Curso', categorias: ['ALUMNADO'], deQueColumna: 'unidad',
      calcular: function (persona) {
        var compacto = Nombres.grupoCompacto(persona && persona.unidad, persona && persona.curso);
        return calcularCurso(compacto);
      }
    }
  ];

  /* ---------- el catálogo de una categoría ----------

     La lista de campos que se le pueden asociar a un tipo de esta
     categoría: los de su fichero (por la cabecera de verdad), los
     calculados que le tocan, y todos los propios, que valen para
     cualquier categoría. */
  async function catalogoDeCategoria(dirDatos, categoria, config) {
    var cabecera = [];
    try {
      var r = dirDatos ? await Datos.cargar(dirDatos, categoria) : null;
      cabecera = (r && r.cabecera) ||
                 (Datos.LISTAS[categoria] && Datos.LISTAS[categoria].cabecera) || [];
    } catch (e) {
      cabecera = (Datos.LISTAS[categoria] && Datos.LISTAS[categoria].cabecera) || [];
    }

    var deFichero = cabecera.map(function (c) {
      return { origen: 'fichero', columna: c, nombre: c };
    });

    /* Los calculados de Francisco (fila 56) primero; los de
       `CALCULADOS` (el respaldo de fábrica) solo si no hay ya uno con
       ese mismo id, para no enseñar "Curso" dos veces una vez migrado
       a `campos.json` (ver `leer()`). */
    var idsDeUsuario = {};
    var calculadosDeUsuario = ((config && config.calculados) || []).filter(function (c) {
      return c.categorias.indexOf(categoria) !== -1;
    }).map(function (c) {
      idsDeUsuario[c.id] = true;
      return { origen: 'calculado', id: c.id, nombre: c.nombre };
    });
    var calculadosDeFabrica = CALCULADOS.filter(function (c) {
      return c.categorias.indexOf(categoria) !== -1 && !idsDeUsuario[c.id];
    }).map(function (c) {
      return { origen: 'calculado', id: c.id, nombre: c.nombre };
    });

    var propios = ((config && config.propios) || []).map(function (p) {
      return { origen: 'propio', id: p.id, nombre: p.nombre, clase: p.clase, valores: p.valores };
    });
    return deFichero.concat(calculadosDeUsuario).concat(calculadosDeFabrica).concat(propios);
  }

  /* ---------- el valor de partida ----------

     Lo que sale ya escrito al crear un asunto, según de dónde venga el
     campo. Los propios nacen vacíos (o con su desplegable, que lo pinta
     quien pregunte por él): no hay ningún fichero del que sacarlos.

     `config` (fila 56): si el calculado tiene receta propia en
     `campos.json`, se evalúa con `Calculo.evaluar`; si no (todavía no
     migrado, o `Calculo` no está cargado en algún contexto de
     prueba), se cae en la función de `CALCULADOS`, como hacía antes
     de esta fila — así ningún nombre de carpeta cambia de un día para
     otro. */
  function valorInicial(c, persona, config) {
    if (!persona || !c) return '';
    if (c.origen === 'fichero') {
      return (persona.campos && persona.campos[c.columna]) || '';
    }
    if (c.origen === 'calculado') {
      var receta = ((config && config.calculados) || []).filter(function (x) { return x.id === c.id; })[0];
      if (receta && window.Calculo) return Calculo.evaluar(receta, persona, config) || '';
      var calRespaldo = CALCULADOS.filter(function (x) { return x.id === c.id; })[0];
      return (calRespaldo && calRespaldo.calcular(persona)) || '';
    }
    return '';
  }

  I.claseDeCampo = claseDeCampo;
  I.leerValor = leerValor;
  I.mostrarValor = mostrarValor;
  I.nombreDeCampo = nombreDeCampo;
  I.calcularCurso = calcularCurso;
  I.CALCULADOS = CALCULADOS;
  I.catalogoDeCategoria = catalogoDeCategoria;
  I.valorInicial = valorInicial;
})();
