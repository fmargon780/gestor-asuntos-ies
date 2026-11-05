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

   `porTipoDocumento` (23-sep-2026, fila 96,
   docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md) es otra cosa: los campos
   del propio tipo de DOCUMENTO, que entran en el nombre del fichero
   entre el tipo y el texto adicional. Se indexa por el nombre del tipo
   de documento (`tipos-documento.json` sigue siendo una lista de
   nombres, sin tocar):

       "porTipoDocumento": {
         "FACTURA": [ { "id": "d1", "nombre": "Proveedor", "clase": "texto",
                        "valores": [], "obligatorio": true } ]
       }

   `clase` es 'texto', 'lista' (usa `valores`), 'fecha' o 'persona' (fila 435: usa `listas`, las
   categorías de terceros en las que busca, p. ej. ['ALUMNADO']). Un campo sin
   nombre no sobrevive. Solo se escribe la clave cuando hay alguno.

   `textoPorTipoDocumento` (28-sep-2026, fila 201,
   docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md) es otra cosa más: el «Texto
   por defecto» de un tipo de DOCUMENTO, el segundo sitio (después del
   hito) de donde puede salir ya escrito el texto adicional del nombre
   de un documento. Se indexa igual que `porTipoDocumento`, por el
   nombre del tipo de documento, y admite los mismos huecos que una
   plantilla ({nombre}, {curso}, {grupo}, {tipo}, {campo:...}…):

       "textoPorTipoDocumento": { "FACTURA": "{campo:Proveedor}" }

   Solo se escribe la clave cuando hay alguno, y solo si el texto no
   está vacío.

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
  var I = CamposNucleo;
  var FICHERO = I.FICHERO;
  function normalizarListaDeDocumento() { return I.normalizarListaDeDocumento.apply(this, arguments); }
  function normalizar() { return I.normalizar.apply(this, arguments); }
  var RECETA_CURSO_DE_FABRICA = I.RECETA_CURSO_DE_FABRICA;
  function leer() { return I.leer.apply(this, arguments); }
  function guardarPropios() { return I.guardarPropios.apply(this, arguments); }
  function guardarCalculados() { return I.guardarCalculados.apply(this, arguments); }
  function guardarConfigDeTipo() { return I.guardarConfigDeTipo.apply(this, arguments); }
  function guardarCamposDeDocumento() { return I.guardarCamposDeDocumento.apply(this, arguments); }
  function camposDeDocumento() { return I.camposDeDocumento.apply(this, arguments); }
  function guardarTextoPorDefectoDeDocumento() { return I.guardarTextoPorDefectoDeDocumento.apply(this, arguments); }
  function textoPorDefectoDeDocumento() { return I.textoPorDefectoDeDocumento.apply(this, arguments); }
  function claveDeCampo() { return I.claveDeCampo.apply(this, arguments); }
  function camposDeAsunto() { return I.camposDeAsunto.apply(this, arguments); }
  function claseDeCampo() { return I.claseDeCampo.apply(this, arguments); }
  function leerValor() { return I.leerValor.apply(this, arguments); }
  function mostrarValor() { return I.mostrarValor.apply(this, arguments); }
  function nombreDeCampo() { return I.nombreDeCampo.apply(this, arguments); }
  function calcularCurso() { return I.calcularCurso.apply(this, arguments); }
  var CALCULADOS = I.CALCULADOS;
  function catalogoDeCategoria() { return I.catalogoDeCategoria.apply(this, arguments); }
  function valorInicial() { return I.valorInicial.apply(this, arguments); }

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
    guardarCamposDeDocumento: guardarCamposDeDocumento, camposDeDocumento: camposDeDocumento,
    guardarTextoPorDefectoDeDocumento: guardarTextoPorDefectoDeDocumento,
    textoPorDefectoDeDocumento: textoPorDefectoDeDocumento,
    normalizarListaDeDocumento: normalizarListaDeDocumento,
    claveDeCampo: claveDeCampo, nombreDeCampo: nombreDeCampo, camposDeAsunto: camposDeAsunto,
    claseDeCampo: claseDeCampo, leerValor: leerValor, mostrarValor: mostrarValor,
    CALCULADOS: CALCULADOS, calcularCurso: calcularCurso,
    RECETA_CURSO_DE_FABRICA: RECETA_CURSO_DE_FABRICA,
    catalogoDeCategoria: catalogoDeCategoria, valorInicial: valorInicial,
    usaUnidadOCurso: usaUnidadOCurso, esColumnaUnidad: esColumnaUnidad,
    tiposQueUsanCalculado: tiposQueUsanCalculado,
    propioDe: propioDe, tiposQueUsanPropio: tiposQueUsanPropio
  };
})();
