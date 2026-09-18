/* ============================================================
   campos.js — los campos que lleva cada tipo de asunto.

   Hasta ahora, lo único que distinguía a dos asuntos del mismo tipo y
   del mismo tercero era la descripción corta, texto libre escrito a
   mano cada vez. Pero la aplicación ya tiene datos que sí distinguen
   un asunto: la unidad del alumno, el puesto de un empleado, el NIF
   de una empresa. Aquí se deja que cada tipo de asunto elija cuáles
   de esos datos lleva, para que salgan solos y ya rellenos al crear
   el asunto, y para que puedan ir al nombre de la carpeta sin
   escribirlos a mano.

   De dónde sale la lista de campos que se le pueden poner a un tipo,
   según su categoría (ALUMNADO, PERSONAL, EMPRESAS, OTROS):

     a) DEL FICHERO de esa categoría. Cada columna de su cabecera es
        un campo posible. Para ALUMNADO es la cabecera de verdad del
        RegAlum.csv descargado (`Datos.cargar('ALUMNADO').cabecera`);
        para PERSONAL, EMPRESAS y OTROS es la cabecera de su propio
        fichero (personal.csv, empresas.csv, otros.csv), que mantiene
        la propia aplicación.

        OJO, esto ya mordió una vez (ver el DNI en docs/CONTEXTO.md):
        `persona.campos` solo trae las columnas que traen algo. Para
        saber qué columnas EXISTEN hay que mirar la cabecera del CSV,
        no la ficha de una persona.

     b) CALCULADOS. No están en ninguna columna, se sacan de otra. De
        momento uno: "Curso", la unidad sin su última letra. Se deja
        la tabla `CALCULADOS` abierta para poder añadir otro sin tocar
        el resto.

     c) PROPIOS. Los que Francisco crea a mano en Ajustes, para lo que
        no está en ningún fichero (el trimestre, por ejemplo). Cada
        uno es texto libre o una lista cerrada de valores, y vale para
        cualquier categoría: no están atados a ninguna.

   Cómo se guarda, en `_GESTOR/campos.json`:

       {
         "propios": [
           { "id": "p1", "nombre": "Trimestre", "clase": "lista",
             "valores": ["1º", "2º", "3º"] }
         ],
         "porTipo": {
           "SANCION": [
             { "origen": "fichero",   "columna": "Unidad", "obligatorio": true,  "enNombre": true },
             { "origen": "calculado", "id": "curso",       "obligatorio": false, "enNombre": true },
             { "origen": "propio",    "id": "p1",          "obligatorio": false, "enNombre": true }
           ]
         }
       }

   `porTipo` se indexa por `tipo.tipo`, la misma clave con la que
   `tipos.json` identifica un tipo de asunto.

   Si el fichero no existe, todo funciona como hoy: un tipo sin campos
   configurados se comporta exactamente igual que antes de este
   cambio. `campos.json` entra en las copias de seguridad y en la
   guardia de fichero roto (`js/copias.js`), igual que los demás JSON
   compartidos: se relee justo antes de escribirlo.

   Este fichero no monta ningún nombre de carpeta: eso sigue siendo
   trabajo solo de `js/nombres.js`. Aquí solo se dice qué campos hay,
   de dónde sale su valor de partida, y cómo se guardan y se leen.
   ============================================================ */
var Campos = (function () {

  var FICHERO = 'campos.json';

  /* ---------- leer y normalizar ---------- */

  function normalizarPropio(p) {
    return {
      id: String((p && p.id) || ''),
      nombre: String((p && p.nombre) || ''),
      clase: (p && p.clase === 'lista') ? 'lista' : 'texto',
      valores: (p && Array.isArray(p.valores)) ? p.valores.map(String).filter(Boolean) : []
    };
  }

  /* Los campos calculados que crea Francisco (fila 56, 18-sep-2026,
     docs/CAMPOS-CATALOGO-Y-CALCULADOS.md), hermanos de los propios:
     la receta que evalúa `js/campos-calculo.js` (`Calculo.evaluar`).
     Se descartan las que no traigan id, nombre u operación conocida
     (`Calculo.OPERACIONES`), y las repetidas por id (se queda la
     primera: protege el alta del "curso" de fábrica contra una
     carrera de dos sesiones leyendo a la vez, ver `leer()`). */
  function normalizarCalculado(c) {
    return {
      id: String((c && c.id) || ''),
      nombre: String((c && c.nombre) || ''),
      categorias: (c && Array.isArray(c.categorias)) ? c.categorias.filter(Boolean) : [],
      origen: (c && c.origen && typeof c.origen === 'object') ? c.origen : null,
      operacion: String((c && c.operacion) || ''),
      parametros: (c && c.parametros && typeof c.parametros === 'object') ? c.parametros : {}
    };
  }

  function normalizarListaCalculados(lista) {
    var vistos = {};
    return (Array.isArray(lista) ? lista : [])
      .map(normalizarCalculado)
      .filter(function (c) {
        if (!c.id || !c.nombre || !c.origen || !(window.Calculo && Calculo.OPERACIONES[c.operacion])) return false;
        if (vistos[c.id]) return false;
        vistos[c.id] = true;
        return true;
      });
  }

  function normalizarCampoDeTipo(c) {
    var origen = (c && c.origen) || '';
    var salida = { origen: origen };
    if (origen === 'fichero') salida.columna = String((c && c.columna) || '');
    else salida.id = String((c && c.id) || '');
    salida.obligatorio = !!(c && c.obligatorio);
    salida.enNombre = !!(c && c.enNombre);
    return salida;
  }

  function normalizar(leido) {
    var c = leido || {};
    var propios = (Array.isArray(c.propios) ? c.propios : [])
      .map(normalizarPropio)
      .filter(function (p) { return p.id && p.nombre; });

    var calculados = normalizarListaCalculados(c.calculados);

    var porTipo = {};
    var origen = (c.porTipo && typeof c.porTipo === 'object') ? c.porTipo : {};
    Object.keys(origen).forEach(function (tipo) {
      var lista = Array.isArray(origen[tipo]) ? origen[tipo] : [];
      porTipo[tipo] = lista.map(normalizarCampoDeTipo).filter(function (x) {
        return x.origen === 'fichero' ? !!x.columna : !!x.id;
      });
    });

    return { propios: propios, calculados: calculados, porTipo: porTipo };
  }

  /* La receta de fábrica del calculado "curso" (fila 56, 18-sep-2026,
     docs/CAMPOS-CATALOGO-Y-CALCULADOS.md, 7): antes vivía solo en
     `CALCULADOS`, escrita en el código; ahora es una receta más, que
     Francisco ve y puede cambiar. Misma cuenta que hacía
     `calcularCurso` sobre el grupo compacto: por eso `CALCULADOS` se
     deja tal cual, como respaldo (más abajo). */
  var RECETA_CURSO_DE_FABRICA = {
    id: 'curso', nombre: 'Curso', categorias: ['ALUMNADO'],
    origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1, soloSiEsLetra: true }
  };

  /* Lee el fichero de la carpeta del centro. Si no existe, o si no hay
     carpeta todavía (las pruebas de lógica, por ejemplo), se devuelve
     la forma vacía: así el resto del código no tiene que comprobar
     nada antes de usarla.

     La primera vez que se lee sin una receta calculada con id "curso"
     (fila 56, sección 7), se añade y se guarda, pero SOLO si el
     fichero ya existía: no se crea `campos.json` solo para esto. Si
     dos sesiones leen a la vez y las dos escriben, `guardarCalculados`
     relee antes de guardar y `normalizarListaCalculados` descarta el
     id repetido: como mucho se pisan la una a la otra, nunca queda
     "curso" duplicado. */
  async function leer(gestor) {
    if (!gestor) return normalizar(null);
    var leido = await Carpetas.leerJson(gestor, FICHERO);
    var normalizado = normalizar(leido);
    if (leido && !normalizado.calculados.some(function (c) { return c.id === 'curso'; })) {
      /* Escribe directo con Copias.guardar, sin pasar por
         guardarCalculados (que a su vez llama a leer()): así no hay
         ninguna recursión, y `leido` ya está fresco (se acaba de leer
         dos líneas más arriba, sin ningún `await` de por medio). */
      normalizado.calculados = normalizado.calculados.concat([RECETA_CURSO_DE_FABRICA]);
      try { await Copias.guardar(gestor, FICHERO, normalizado); }
      catch (e) { /* si no se puede guardar ahora, CALCULADOS sigue de respaldo (punto 7) */ }
    }
    return normalizado;
  }

  /* ---------- guardar ----------

     Como todo fichero compartido, se relee justo antes de escribir:
     dos ordenadores pueden estar tocando cosas distintas del mismo
     fichero. Cada función solo toca su propio trozo (los campos
     propios, o los campos de UN tipo), para que dos cambios sobre
     partes distintas no se pisen. */

  async function guardarPropios(gestor, mutar) {
    var actual = await leer(gestor);
    var lista = mutar(actual.propios.slice());
    actual.propios = normalizar({ propios: lista || actual.propios, porTipo: actual.porTipo }).propios;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* Gemela de `guardarPropios`, para los campos calculados (fila 56).
     Relee lo de verdad antes de escribir, y solo toca su propio
     trozo. */
  async function guardarCalculados(gestor, mutar) {
    var actual = await leer(gestor);
    var lista = mutar(actual.calculados.slice());
    actual.calculados = normalizarListaCalculados(lista || actual.calculados);
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  async function guardarConfigDeTipo(gestor, claveTipo, listaCampos) {
    var actual = await leer(gestor);
    actual.porTipo = actual.porTipo || {};
    if (listaCampos && listaCampos.length) {
      actual.porTipo[claveTipo] = listaCampos.map(normalizarCampoDeTipo);
    } else {
      delete actual.porTipo[claveTipo];
    }
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* ---------- identidad de un campo ----------

     Una clave estable, para guardarlo en la ficha del asunto y para
     saber si dos entradas del catálogo son "el mismo campo". */
  function claveDeCampo(c) {
    if (!c) return '';
    if (c.origen === 'fichero') return 'fichero:' + c.columna;
    return c.origen + ':' + c.id;
  }

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
     la misma que usa el interruptor "Añadir el grupo al nombre"), no
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

  /* Las columnas que Séneca usa para la unidad del alumno, para saber
     si el interruptor viejo de "Añadir el grupo" hay que esconderlo:
     si el tipo ya trae esa columna, o el curso calculado, el grupo
     saldría dos veces. */
  var ALIAS_UNIDAD = ['Unidad', 'Unidad/Grupo', 'Grupo'].map(function (x) {
    return U.normalizar(x).replace(/\s+/g, '');
  });

  function esColumnaUnidad(columna) {
    var n = U.normalizar(columna).replace(/\s+/g, '');
    return ALIAS_UNIDAD.indexOf(n) !== -1;
  }

  /* `config` (fila 56): además del calculado "curso" de siempre, hay
     que esconder el interruptor también si el tipo lleva cualquier
     calculado de Francisco cuyo origen sea el grupo o una columna de
     unidad — el grupo saldría dos veces igual. */
  function usaUnidadOCurso(listaCampos, config) {
    return (listaCampos || []).some(function (c) {
      if (c.origen === 'fichero' && esColumnaUnidad(c.columna)) return true;
      if (c.origen !== 'calculado') return false;
      if (c.id === 'curso') return true;
      var receta = ((config && config.calculados) || []).filter(function (x) { return x.id === c.id; })[0];
      if (!receta || !receta.origen) return false;
      if (receta.origen.clase === 'grupo') return true;
      if (receta.origen.clase === 'columna' && esColumnaUnidad(receta.origen.columna)) return true;
      return false;
    });
  }

  /* La definición completa de un campo propio, buscada por id.

     `porTipo` solo guarda origen/id/obligatorio/enNombre: la clase y
     los valores de la lista viven en `propios`, y pueden cambiar
     (Francisco puede añadir un valor a la lista más adelante). Quien
     tenga que pintar el campo -un desplegable o una casilla de texto-
     debe mirar aquí, no fiarse de lo que trajera el catálogo el día
     que se puso. */
  function propioDe(id, config) {
    return ((config && config.propios) || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  /* Los tipos que tienen puesto un campo propio concreto. Para poder
     avisar, al borrarlo, de dónde está en uso. */
  function tiposQueUsanPropio(config, idPropio) {
    var salida = [];
    Object.keys((config && config.porTipo) || {}).forEach(function (tipo) {
      var usado = (config.porTipo[tipo] || []).some(function (c) {
        return c.origen === 'propio' && c.id === idPropio;
      });
      if (usado) salida.push(tipo);
    });
    return salida;
  }

  /* Gemela de `tiposQueUsanPropio`, para un campo calculado (fila 56). */
  function tiposQueUsanCalculado(config, idCalculado) {
    var salida = [];
    Object.keys((config && config.porTipo) || {}).forEach(function (tipo) {
      var usado = (config.porTipo[tipo] || []).some(function (c) {
        return c.origen === 'calculado' && c.id === idCalculado;
      });
      if (usado) salida.push(tipo);
    });
    return salida;
  }

  return {
    FICHERO: FICHERO,
    normalizar: normalizar, leer: leer,
    guardarPropios: guardarPropios, guardarCalculados: guardarCalculados,
    guardarConfigDeTipo: guardarConfigDeTipo,
    claveDeCampo: claveDeCampo, nombreDeCampo: nombreDeCampo,
    CALCULADOS: CALCULADOS, calcularCurso: calcularCurso,
    RECETA_CURSO_DE_FABRICA: RECETA_CURSO_DE_FABRICA,
    catalogoDeCategoria: catalogoDeCategoria, valorInicial: valorInicial,
    usaUnidadOCurso: usaUnidadOCurso, esColumnaUnidad: esColumnaUnidad,
    tiposQueUsanCalculado: tiposQueUsanCalculado,
    propioDe: propioDe, tiposQueUsanPropio: tiposQueUsanPropio
  };
})();
