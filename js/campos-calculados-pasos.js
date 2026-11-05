/* ============================================================
   campos-calculados-pasos.js — lo que se rellena en cada paso de un
   campo creado a partir de otros (fila 529,
   docs/529-CREAR-CAMPOS-POR-PASOS.md).

   Solo HTML: `formulario(paso, i, opciones)` devuelve las casillas de
   un paso, y `etiquetaDe(paso)` el nombre con el que se ve en la lista.
   Quien los engancha y guarda es js/campos-calculados-editor.js. Cada
   casilla lleva `data-paso` (el número del paso) y `data-k` (qué dato
   es); si `data-re` está puesto, al cambiarla se vuelve a pintar el
   formulario (porque cambia lo que hay que rellenar).

   `opciones(claveElegida, textoVacio)` la pone el editor: las
   opciones de «elige un campo», con los campos de la lista.
   ============================================================ */
var CamposCalculadosPasos = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function entrada(i, k, v, etiqueta, tipo) {
    return '<div><label class="etiqueta" for="s' + i + '-' + k + '">' + etiqueta + '</label>' +
      '<input class="campo" id="s' + i + '-' + k + '" data-paso="' + i + '" data-k="' + k + '" type="' + (tipo || 'text') + '" value="' + esc(v) + '"></div>';
  }
  function desplegable(i, k, v, etiqueta, pares, recargar) {
    return '<div><label class="etiqueta" for="s' + i + '-' + k + '">' + etiqueta + '</label>' +
      '<select class="campo" id="s' + i + '-' + k + '" data-paso="' + i + '" data-k="' + k + '"' + (recargar === false ? '' : ' data-re="1"') + '>' +
      pares.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
      '</select></div>';
  }
  function campo(i, k, v, etiqueta, opciones, vacio) {
    return '<div class="cp-ancho"><label class="etiqueta" for="s' + i + '-' + k + '">' + etiqueta + '</label>' +
      '<select class="campo" id="s' + i + '-' + k + '" data-paso="' + i + '" data-k="' + k + '" data-campo="1">' + opciones(v, vacio || 'Elige un campo') + '</select></div>';
  }

  function formulario(s, i, opciones) {
    switch (s.op) {
      case 'juntar':
        return campo(i, 'campo', s.campo, 'Con qué campo', opciones) + entrada(i, 'sep', s.sep, 'Entre los dos') +
          desplegable(i, 'lado', s.lado, 'Dónde va', [['final', 'Detrás'], ['principio', 'Delante']], false);
      case 'texto':
        return entrada(i, 'txt', s.txt, 'Texto') + desplegable(i, 'lado', s.lado, 'Dónde va', [['principio', 'Delante'], ['final', 'Detrás']], false);
      case 'si': {
        var sinValor = s.cond === 'vacio' || s.cond === 'lleno';
        return campo(i, 'campo', s.campo, 'Mirar el campo', opciones, 'El valor de arriba') +
          desplegable(i, 'cond', s.cond, 'Condición', [['igual', 'es igual a'], ['distinto', 'es distinto de'], ['contiene', 'contiene'], ['empieza', 'empieza por'], ['vacio', 'está vacío'], ['lleno', 'tiene dato']]) +
          (sinValor ? '' : entrada(i, 'val', s.val, 'Valor')) + entrada(i, 'ent', s.ent, 'Entonces pone') + entrada(i, 'sino', s.sino, 'Si no, pone') +
          '<p class="cp-ancho nota" style="margin:0">Si dejas una casilla vacía, sigue el valor de arriba.</p>';
      }
      case 'vacio':
        return campo(i, 'campo', s.campo, 'Campo de reserva', opciones);
      case 'equiv':
        return '<div class="cp-ancho cp-equiv">' + (s.filas || []).map(function (f, j) {
          return '<input class="campo" aria-label="Si vale" placeholder="Si vale" data-paso="' + i + '" data-fila="' + j + '" data-c="de" value="' + esc(f.de) + '">' +
            '<span class="cp-flecha">→</span>' +
            '<input class="campo" aria-label="Pone" placeholder="Pone" data-paso="' + i + '" data-fila="' + j + '" data-c="a" value="' + esc(f.a) + '">' +
            '<button type="button" class="boton boton-chico" data-acc="quitar-fila" data-paso="' + i + '" data-fila="' + j + '" aria-label="Quitar esta línea">×</button>';
        }).join('') + '</div><div class="cp-ancho"><button type="button" class="boton boton-chico" data-acc="anadir-fila" data-paso="' + i + '">+ Otra línea</button></div>' +
          desplegable(i, 'siNoEsta', s.siNoEsta, 'Si no está en la tabla', [['seguir', 'Deja el valor de arriba'], ['vaciar', 'Queda vacío']], false);
      case 'quitarFin':
        return entrada(i, 'n', s.n, 'Cuántos', 'number') +
          '<label class="interruptor interruptor-fila cp-ancho"><input type="checkbox" data-paso="' + i + '" data-k="soloSiEsLetra"' + (s.soloSiEsLetra ? ' checked' : '') + '><span>Solo si es una letra</span></label>';
      case 'quitarIni':
        return entrada(i, 'n', s.n, 'Cuántos', 'number');
      case 'partir':
        return entrada(i, 'signo', s.signo, 'Signo') + desplegable(i, 'parte', s.parte, 'Me quedo con', [
          ['1', 'La primera parte'], ['2', 'La segunda parte'], ['3', 'La tercera parte'], ['u', 'La última parte'],
          ['despuesPrimero', 'Todo lo que va después del primer signo'], ['antesUltimo', 'Todo lo que va antes del último signo']], false);
      case 'letras':
        return desplegable(i, 'modo', s.modo, 'Forma', [['mayus', 'TODO EN MAYÚSCULAS'], ['minus', 'todo en minúsculas'], ['cada', 'Cada Palabra Con Mayúscula']], false);
      case 'fechaSuma':
        return entrada(i, 'cant', s.cant, 'Cuánto', 'number') +
          desplegable(i, 'uni', s.uni, 'De qué', [['habiles', 'Días hábiles'], ['dias', 'Días naturales'], ['meses', 'Meses']], false) +
          (s.uni === 'habiles' || !s.uni ? '<p class="cp-ancho nota" style="margin:0">Los días hábiles saltan sábados, domingos y los festivos de Ajustes › Hitos.</p>' : '');
      case 'fechaFormato':
        return desplegable(i, 'f', s.f, 'Forma', [['larga', '5 de noviembre de 2026'], ['dia', 'Día de la semana'], ['mes', 'Mes en letra'], ['anio', 'Solo el año'], ['anioAcademico', 'Curso académico'], ['edad', 'Edad a día de hoy']], false);
      case 'cuenta':
        return desplegable(i, 'oper', s.oper, 'Cuenta', [['+', 'Sumar'], ['-', 'Restar'], ['*', 'Multiplicar por'], ['/', 'Dividir entre']], false) +
          desplegable(i, 'modo', s.modo, 'Con', [['num', 'Una cifra'], ['campo', 'Otro campo']]) +
          (s.modo === 'campo' ? campo(i, 'campo', s.campo, 'Campo', opciones) : entrada(i, 'num', s.num, 'Cifra'));
      default:
        return '<p class="nota" style="margin:0">Sin nada que rellenar.</p>';
    }
  }

  return { formulario: formulario };
})();
window.CamposCalculadosPasos = CamposCalculadosPasos;
