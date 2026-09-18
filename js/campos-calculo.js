/* ============================================================
   campos-calculo.js — el motor de los campos calculados (fila 56,
   18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md).

   Sin nada de interfaz, a propósito: para que se pueda probar solo
   (pruebas/campos-calculo.mjs), sin navegador. Quien pinta y
   quien guarda vive en js/campos-catalogo.js y en
   js/campos-calculados-editor.js; este fichero solo sabe evaluar una
   receta sobre una persona, describirla en palabras y comprobar que
   se puede guardar.

   Una receta:
       { origen: { clase: "columna"|"grupo"|"calculado", ... },
         operacion: "quitarFinal"|"quitarInicio"|"partir"|
                     "equivalencias"|"juntar"|"deFecha",
         parametros: { ... } }

   El origen puede ser:
     - { clase: "columna", columna: "Unidad" } — una columna del
       fichero de la categoría (mirando la CABECERA del CSV, nunca
       `persona.campos`: la trampa ya conocida de docs/CONTEXTO.md).
     - { clase: "grupo" } — Nombres.grupoCompacto(persona.unidad,
       persona.curso), la forma compacta ("1ºBach", no "1º Bach").
     - { clase: "calculado", id: "c2" } — otro campo calculado. Se
       permite encadenar hasta 3 saltos; más allá, o en un ciclo, el
       valor sale vacío y no se cuelga.

   Todas las operaciones recortan los espacios sobrantes del
   resultado, y con el valor de partida vacío el resultado es vacío,
   nunca un error.
   ============================================================ */
var Calculo = (function () {

  var PROFUNDIDAD_MAXIMA = 3; /* saltos de "calculado" permitidos, además del primero */

  function limpiar(v) {
    return String(v == null ? '' : v).trim();
  }

  /* ---------- de dónde sale el valor de partida ---------- */

  function calculadoPorId(config, id) {
    return ((config && config.calculados) || []).filter(function (c) { return c.id === id; })[0] || null;
  }

  function valorDeOrigen(origen, persona, config, profundidad) {
    if (!origen || !persona) return '';
    if (origen.clase === 'columna') {
      return limpiar(persona.campos && persona.campos[origen.columna]);
    }
    if (origen.clase === 'grupo') {
      return limpiar((typeof Nombres !== 'undefined' && Nombres.grupoCompacto)
        ? Nombres.grupoCompacto(persona.unidad, persona.curso) : '');
    }
    if (origen.clase === 'calculado') {
      if ((profundidad || 0) >= PROFUNDIDAD_MAXIMA) return '';
      var receta = calculadoPorId(config, origen.id);
      if (!receta) return '';
      return evaluar(receta, persona, config, (profundidad || 0) + 1);
    }
    return '';
  }

  function origenesIguales(a, b) {
    if (!a || !b) return a === b;
    if (a.clase !== b.clase) return false;
    if (a.clase === 'columna') return a.columna === b.columna;
    if (a.clase === 'calculado') return a.id === b.id;
    return true; /* "grupo" no lleva más datos */
  }

  /* ---------- las seis operaciones ---------- */

  function quitarFinal(valor, p) {
    var v = limpiar(valor);
    if (!v) return '';
    var n = Math.max(1, Math.min(20, parseInt(p.n, 10) || 1));
    for (var i = 0; i < n && v.length; i++) {
      if (p.soloSiEsLetra && !/[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(v)) break;
      v = v.slice(0, -1);
    }
    return limpiar(v);
  }

  function quitarInicio(valor, p) {
    var v = limpiar(valor);
    if (!v) return '';
    var n = Math.max(1, Math.min(20, parseInt(p.n, 10) || 1));
    return limpiar(v.slice(n));
  }

  function partir(valor, p) {
    var v = limpiar(valor);
    if (!v) return '';
    var signo = String(p.signo || '').charAt(0);
    if (!signo) return v;
    var idx = p.ocurrencia === 'ultima' ? v.lastIndexOf(signo) : v.indexOf(signo);
    if (idx === -1) return v;
    return limpiar(p.lado === 'despues' ? v.slice(idx + 1) : v.slice(0, idx));
  }

  function equivalencias(valor, p) {
    var v = limpiar(valor);
    if (!v) return '';
    var pares = Array.isArray(p.pares) ? p.pares : [];
    var normal = function (x) { return String(x == null ? '' : x).trim().replace(/\s+/g, ' '); };
    var comparar = (p.ignorarMayusculas && typeof U !== 'undefined' && U.normalizar) ? U.normalizar : normal;
    var buscado = comparar(v);
    var par = pares.filter(function (x) { return comparar(x && x.de) === buscado; })[0];
    if (par) return limpiar(par.a);
    return p.siNoEsta === 'vaciar' ? '' : v;
  }

  function juntar(valor, valor2, p) {
    var a = limpiar(valor), b = limpiar(valor2);
    if (!a) return b;
    if (!b) return a;
    return limpiar(a + String(p.separador || '') + b);
  }

  function partesFecha(v) {
    var esp = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (esp) return { d: +esp[1], m: +esp[2], a: +esp[3] };
    var iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return { d: +iso[3], m: +iso[2], a: +iso[1] };
    return null;
  }

  function deFecha(valor, p) {
    var v = limpiar(valor);
    if (!v) return '';
    if (p.que === 'edad') {
      var e = (typeof U !== 'undefined' && U.edadDesde) ? U.edadDesde(v) : '';
      return (e === '' || e == null) ? '' : String(e);
    }
    var partes = partesFecha(v);
    if (!partes) return '';
    if (p.que === 'anio') return String(partes.a);
    if (p.que === 'anioAcademico') {
      var iso = partes.a + '-' + String(partes.m).padStart(2, '0') + '-' + String(partes.d).padStart(2, '0');
      return (typeof U !== 'undefined' && U.cursoDeFecha) ? U.cursoDeFecha(iso) : '';
    }
    return '';
  }

  var OPERACIONES = {
    quitarFinal: { etiqueta: 'Quitar los últimos caracteres' },
    quitarInicio: { etiqueta: 'Quitar los primeros caracteres' },
    partir: { etiqueta: 'Partir por un signo' },
    equivalencias: { etiqueta: 'Tabla de equivalencias' },
    juntar: { etiqueta: 'Juntar dos campos' },
    deFecha: { etiqueta: 'Sacar un dato de una fecha' }
  };

  /* ---------- evaluar ---------- */

  function evaluar(receta, persona, config, profundidad) {
    if (!receta || !persona) return '';
    var origenValor = valorDeOrigen(receta.origen, persona, config, profundidad || 0);
    var p = receta.parametros || {};
    switch (receta.operacion) {
      case 'quitarFinal': return quitarFinal(origenValor, p);
      case 'quitarInicio': return quitarInicio(origenValor, p);
      case 'partir': return partir(origenValor, p);
      case 'equivalencias': return equivalencias(origenValor, p);
      case 'juntar':
        var valor2 = valorDeOrigen(p.origen2, persona, config, profundidad || 0);
        return juntar(origenValor, valor2, p);
      case 'deFecha': return deFecha(origenValor, p);
      default: return '';
    }
  }

  /* ---------- describir, en palabras ---------- */

  function nombreDeOrigen(origen, config) {
    if (!origen) return '';
    if (origen.clase === 'columna') return origen.columna || '';
    if (origen.clase === 'grupo') return 'El grupo';
    if (origen.clase === 'calculado') {
      var r = calculadoPorId(config, origen.id);
      return r ? r.nombre : '';
    }
    return '';
  }

  var PALABRAS_SIGNO = {
    ' ': 'espacio', '-': 'guion', '.': 'punto', ',': 'coma',
    '/': 'barra', ':': 'dos puntos', ';': 'punto y coma', '_': 'guion bajo'
  };
  function signoDesnudo(s) {
    return PALABRAS_SIGNO[s] || ('"' + s + '"');
  }
  var ARTICULO_SIGNO = {
    ' ': 'un espacio', '-': 'un guion', '.': 'un punto', ',': 'una coma',
    '/': 'una barra', ':': 'dos puntos', ';': 'un punto y coma', '_': 'un guion bajo'
  };
  function signoConArticulo(s) {
    return ARTICULO_SIGNO[s] || ('el signo "' + s + '"');
  }

  function describir(receta, config) {
    if (!receta) return '';
    var origen = nombreDeOrigen(receta.origen, config) || 'El campo';
    var p = receta.parametros || {};
    switch (receta.operacion) {
      case 'quitarFinal': {
        var n = parseInt(p.n, 10) || 1;
        return origen + ', sin ' + (n === 1 ? 'su última letra' : 'sus últimos ' + n + ' caracteres');
      }
      case 'quitarInicio': {
        var n2 = parseInt(p.n, 10) || 1;
        return origen + ', sin ' + (n2 === 1 ? 'su primer carácter' : 'sus primeros ' + n2 + ' caracteres');
      }
      case 'partir': {
        var lado = p.lado === 'despues' ? 'lo que va después' : 'lo que va antes';
        var ocurrencia = p.ocurrencia === 'ultima' ? 'del último' : 'del primer';
        return origen + ', ' + lado + ' ' + ocurrencia + ' ' + signoDesnudo(String(p.signo || ''));
      }
      case 'equivalencias': {
        var cuenta = (Array.isArray(p.pares) ? p.pares.length : 0);
        return origen + ', convertido con una tabla de ' + cuenta +
          (cuenta === 1 ? ' equivalencia' : ' equivalencias');
      }
      case 'juntar': {
        var origen2 = nombreDeOrigen(p.origen2, config) || 'otro campo';
        return origen + ' y ' + origen2 + ', unidos por ' + signoConArticulo(String(p.separador || ''));
      }
      case 'deFecha': {
        var modo = p.que === 'edad' ? 'la edad de hoy' : (p.que === 'anio' ? 'el año' : 'el curso académico');
        return 'De ' + origen + ', ' + modo;
      }
      default: return '';
    }
  }

  /* ---------- validar, antes de guardar ----------

     Devuelve una lista de motivos (vacía si se puede guardar). El
     nombre repetido de verdad (no solo parecido) también bloquea; el
     parecido, como con los campos propios, solo avisa: eso lo pinta
     el editor con `U.parecidos`, no esto. */

  function sigueLaCadena(origen, idBuscado, config, vistos) {
    if (!origen || origen.clase !== 'calculado') return false;
    if (origen.id === idBuscado) return true;
    if (vistos[origen.id]) return false; /* ya pasamos por aquí: no es este ciclo el que buscamos */
    vistos[origen.id] = true;
    var receta = calculadoPorId(config, origen.id);
    if (!receta) return false;
    if (sigueLaCadena(receta.origen, idBuscado, config, vistos)) return true;
    if (receta.operacion === 'juntar' && receta.parametros) {
      return sigueLaCadena(receta.parametros.origen2, idBuscado, config, vistos);
    }
    return false;
  }

  function haceCiclo(calculado, config) {
    if (!calculado || !calculado.id) return false;
    if (sigueLaCadena(calculado.origen, calculado.id, config, {})) return true;
    if (calculado.operacion === 'juntar' && calculado.parametros) {
      if (sigueLaCadena(calculado.parametros.origen2, calculado.id, config, {})) return true;
    }
    return false;
  }

  function validar(calculado, config) {
    var motivos = [];
    if (!calculado) return ['Falta la receta.'];
    var nombre = limpiar(calculado.nombre);
    if (!nombre) motivos.push('Escribe el nombre del campo.');
    else {
      var normalizar = (typeof U !== 'undefined' && U.normalizar) ? U.normalizar : function (x) { return String(x).toLowerCase(); };
      var repetido = ((config && config.calculados) || []).some(function (c) {
        return c.id !== calculado.id && normalizar(c.nombre) === normalizar(nombre);
      });
      if (repetido) motivos.push('Ya hay un campo calculado con ese nombre.');
    }
    if (!Array.isArray(calculado.categorias) || !calculado.categorias.length) {
      motivos.push('Marca al menos una categoría.');
    }
    if (!calculado.origen || !calculado.origen.clase) {
      motivos.push('Elige de dónde sale el valor.');
    }
    if (!OPERACIONES[calculado.operacion]) {
      motivos.push('Elige qué operación se le aplica.');
    }
    var p = calculado.parametros || {};
    if (calculado.operacion === 'quitarFinal' || calculado.operacion === 'quitarInicio') {
      var n = parseInt(p.n, 10);
      if (!(n >= 1 && n <= 20)) motivos.push('El número de caracteres tiene que estar entre 1 y 20.');
    }
    if (calculado.operacion === 'partir') {
      if (String(p.signo || '').length !== 1) motivos.push('El signo tiene que ser un solo carácter.');
    }
    if (calculado.operacion === 'equivalencias') {
      var pares = Array.isArray(p.pares) ? p.pares.filter(function (x) { return x && limpiar(x.de); }) : [];
      if (!pares.length) motivos.push('Añade al menos una equivalencia con su "de" escrito.');
    }
    if (calculado.operacion === 'juntar') {
      if (!p.origen2 || !p.origen2.clase) motivos.push('Elige el segundo campo con el que juntarlo.');
      else if (origenesIguales(calculado.origen, p.origen2)) motivos.push('El segundo campo tiene que ser distinto del primero.');
    }
    if (!motivos.length && haceCiclo(calculado, config)) {
      motivos.push('Ese origen acaba dependiendo de este mismo campo calculado (ciclo).');
    }
    return motivos;
  }

  return {
    evaluar: evaluar,
    describir: describir,
    validar: validar,
    OPERACIONES: OPERACIONES,
    PROFUNDIDAD_MAXIMA: PROFUNDIDAD_MAXIMA,
    /* expuestas por si el editor (js/campos-calculados-editor.js) las
       necesita sueltas, sin montar una receta completa */
    origenesIguales: origenesIguales,
    valorDeOrigen: function (origen, persona, config) { return valorDeOrigen(origen, persona, config, 0); }
  };
})();
window.Calculo = Calculo;
