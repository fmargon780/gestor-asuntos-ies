/* ============================================================
   datos-tutores.js — los tutores legales de un alumno, agrupados por
   persona (17-sep-2026, fila 37; sacado de js/datos.js y arreglado el
   24-sep-2026, fila 108, docs/CONTACTO-EN-TARJETAS.md).

   Séneca vuelca cada dato de la familia en su propia columna, con el
   título tal cual («Primer apellido Segundo tutor», «Nombre Primer
   tutor», «Sexo Primer tutor»…). Aquí se agrupan por tutor, leyendo el
   título de cada columna, y se monta su nombre entero.

   El arreglo de la fila 108: el número del tutor es el que va pegado a
   la palabra «tutor» («… Segundo tutor»), no el primer ordinal del
   título («Primer apellido» es del apellido). Y el nombre se monta con
   nombre + primer apellido + segundo apellido, en vez de quedarse con
   la primera columna y colgar las demás como líneas sueltas.

   Publica `Datos.tutoresDe` (lo usan js/datos.js, la línea resumen, y
   js/ficha-tercero.js, la ventana «Ver todo»). Carga justo después de
   js/datos.js.
   ============================================================ */
(function () {

  /* El número de tutor de un título de columna. Primero, el que va
     pegado a «tutor/tutora» («Segundo tutor», «Tutor 2», «Tutor2»); si no
     hay ninguno, el de siempre: un dígito 1/2 o «primer/segund» en
     cualquier sitio. Null si no se puede saber. */
  function numeroDeTitulo(titulo) {
    var t = U.normalizar(titulo);
    var antes = t.match(/(primer|segund)\w*\s+(tutor|tutora|padre|madre|responsable)/);
    if (antes) return antes[1] === 'primer' ? 1 : 2;
    var despues = t.match(/(tutor|tutora|responsable)\w*\s*(\d)/);
    if (despues) {
      var d = parseInt(despues[2], 10);
      if (d === 1 || d === 2) return d;
    }
    var digitos = t.match(/\d+/);
    if (digitos) {
      var n = parseInt(digitos[0], 10);
      if (n === 1 || n === 2) return n;
    }
    if (/primer/.test(t)) return 1;
    if (/segund/.test(t)) return 2;
    return null;
  }

  /* La clase de dato que dice el título (ya normalizado). El «primer»
     de «Primer apellido Segundo tutor» es del apellido. */
  function claseDeTitulo(t) {
    if (/sexo|genero/.test(t)) return 'sexo';
    if (/primer\w*\s+apellido|apellido\s*1\b/.test(t)) return 'apellido1';
    if (/segund\w*\s+apellido|apellido\s*2\b/.test(t)) return 'apellido2';
    if (/apellidos/.test(t) && !/nombre/.test(t)) return 'apellidos';
    if (/nombre/.test(t) && /apellido/.test(t)) return 'nombreEntero';
    if (/nombre/.test(t)) return 'nombreSolo';
    if (/apellido/.test(t)) return 'apellido1';
    if (/telefono|movil/.test(t)) return 'telefonos';
    if (/correo|e-?mail/.test(t)) return 'correos';
    if (/dni|documento|nif/.test(t)) return 'documento';
    if (/relacion|parentesco/.test(t)) return 'relacion';
    return 'otros';
  }

  /* M (mujer), H (hombre) o vacío. */
  function sexoNormalizado(valor) {
    var v = U.normalizar(valor || '').trim();
    if (/^(m|mujer|f|femenino)$/.test(v)) return 'M';
    if (/^(h|v|hombre|varon|masculino)$/.test(v)) return 'H';
    return '';
  }

  /* «Apellidos, Nombre» -> «Nombre Apellidos»; lo demás, tal cual. */
  function nombreNatural(texto) {
    var s = String(texto || '').trim();
    var coma = s.indexOf(',');
    if (coma === -1) return s;
    return (s.slice(coma + 1).trim() + ' ' + s.slice(0, coma).trim()).trim();
  }

  function iniciales(nombreCompleto) {
    return String(nombreCompleto || '').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }

  /* Datos.tutoresDe(alumno) -> [ { numero, nombre, relacion, telefonos[],
     correos[], documento, otros[], sexo, iniciales }, ... ], ordenados
     por número y solo con los que traigan algo. `nombre` es ya el nombre
     entero, en orden natural. Una columna de familia sin número
     reconocible se cuelga de `.otros` del propio array, para «Otros datos
     de la familia» en la ventana «Ver todo». */
  function tutoresDe(alumno) {
    var campos = (alumno && alumno.campos) || {};
    var porNumero = {};
    var sinNumero = [];

    Object.keys(campos).forEach(function (clave) {
      var t = U.normalizar(clave);
      if (!/tutor|padre|madre|responsable|familia/.test(t)) return;
      var valor = String(campos[clave] || '').trim();
      if (!valor) return;

      var numero = numeroDeTitulo(clave);
      if (numero === null) { sinNumero.push({ titulo: clave, valor: valor }); return; }

      if (!porNumero[numero]) {
        porNumero[numero] = { numero: numero, nombre: '', relacion: '', telefonos: [], correos: [],
                              documento: '', otros: [], sexo: '', iniciales: '',
                              _partes: { nombreSolo: '', apellido1: '', apellido2: '', apellidos: '', nombreEntero: '' } };
      }
      var tutor = porNumero[numero];
      var clase = claseDeTitulo(t);
      if (tutor._partes[clase] !== undefined) {
        if (!tutor._partes[clase]) tutor._partes[clase] = valor;
        else tutor.otros.push({ titulo: clave, valor: valor });
      }
      else if (clase === 'sexo') { if (!tutor.sexo) tutor.sexo = sexoNormalizado(valor); }
      else if (clase === 'telefonos') { if (tutor.telefonos.indexOf(valor) === -1) tutor.telefonos.push(valor); }
      else if (clase === 'correos') { if (tutor.correos.indexOf(valor) === -1) tutor.correos.push(valor); }
      else if (clase === 'documento') { if (!tutor.documento) tutor.documento = valor; }
      else if (clase === 'relacion') { if (!tutor.relacion) tutor.relacion = valor; }
      else tutor.otros.push({ titulo: clave, valor: valor });
    });

    var salida = Object.keys(porNumero).map(function (k) { return parseInt(k, 10); })
      .sort(function (a, b) { return a - b; })
      .map(function (n) {
        var tutor = porNumero[n];
        var p = tutor._partes;
        delete tutor._partes;
        var trozos = [p.nombreSolo, p.apellido1, p.apellido2, p.apellidos].filter(Boolean);
        tutor.nombre = trozos.length ? trozos.join(' ').replace(/\s+/g, ' ').trim() : nombreNatural(p.nombreEntero);
        tutor.iniciales = iniciales(tutor.nombre);
        return tutor;
      })
      .filter(function (tutor) {
        return tutor.nombre || tutor.relacion || tutor.telefonos.length ||
               tutor.correos.length || tutor.documento || tutor.otros.length;
      });
    salida.otros = sinNumero;
    return salida;
  }

  Datos.tutoresDe = tutoresDe;
  /* Para la ventana «Ver todo» (js/ficha-tercero.js) y las pruebas. */
  Datos.sexoNormalizado = sexoNormalizado;
  Datos.nombreNatural = nombreNatural;
  Datos.iniciales = iniciales;
})();
