/* ============================================================
   personas-familias.js — Personas y empresas, categoría Alumnado:
   matriculados primero, buscar por la familia y hermanos en el centro
   (24-sep-2026, fila 125, docs/BUSCAR-PERSONAS-Y-FAMILIAS.md).

   - `indice(lista)`: los tutores legales de cada alumno MATRICULADO este
     curso, agrupados por persona (su DNI normalizado; sin DNI, su nombre
     entero normalizado), cada uno con sus hijos matriculados. Se calcula
     una vez por lista cargada (se guarda en la propia lista de
     `Datos.cargar`, que se rehace con `Datos.olvidar`), nunca por tecla.
   - `buscarFamilias(indice, texto)`: los tutores cuyo texto (nombre,
     DNI, teléfonos y correos) tiene todas las palabras escritas; el DNI y
     el teléfono, también sin espacios, puntos ni guiones. Con menos de 3
     caracteres, nada.
   - `hermanosDe(indice, alumno)`: los matriculados que comparten al menos
     un tutor con él, sin él.
   - `pintar(caja, fuente, texto, tarjeta, alPulsar)`: la lista de la
     pantalla (Familias arriba, luego los de este curso y aspirantes, y
     «Antiguos (N)» plegado). Lo llama js/archivo-personas.js; no envuelve
     nada.

   Carga después de js/datos-tutores.js y antes de js/archivo-personas.js.
   ============================================================ */
var PersonasFamilias = (function () {

  var TOPE = 60;
  var antiguosAbiertos = false;   /* se recuerda mientras no se cambie de pantalla */

  function compacto(texto) { return U.normalizar(texto || '').replace(/[\s.\-]/g, ''); }

  function claveAlumno(p) { return (p && (p.id || U.normalizar(p.nombre || ''))) || ''; }

  function etiqueta(tutor) {
    if (window.FichaTerceroAlumno && FichaTerceroAlumno.etiquetaDeTutor) return FichaTerceroAlumno.etiquetaDeTutor(tutor);
    if (tutor.relacion) return tutor.relacion;
    if (tutor.sexo === 'M') return 'Tutora ' + tutor.numero;
    if (tutor.sexo === 'H') return 'Tutor ' + tutor.numero;
    return 'Tutor legal ' + tutor.numero;
  }

  /* ---------- el índice ---------- */

  /* `todos` (fila 166, js/tutores-legales.js): también los hijos que ya
     no están matriculados, para la categoría TUTORES LEGALES. */
  function indice(lista, todos) {
    var porClave = {}, orden = [], porAlumno = {};
    (lista || []).forEach(function (p) {
      if (!p || (!p.matriculado && !todos) || !Datos.tutoresDe) return;
      var ca = claveAlumno(p);
      Datos.tutoresDe(p).forEach(function (t) {
        var doc = compacto(t.documento);
        var clave = doc ? 'd:' + doc : (t.nombre ? 'n:' + U.normalizar(t.nombre).replace(/\s+/g, ' ').trim() : '');
        if (!clave) return;
        var f = porClave[clave];
        if (!f) {
          f = porClave[clave] = { clave: clave, nombre: t.nombre || '', documento: t.documento || '',
                                  nombreApellidos: t.nombreApellidos || '', sexo: t.sexo || '', domicilio: '',
                                  telefonos: [], correos: [], etiquetas: [], hijos: [] };
          orden.push(f);
        }
        if (!f.nombre && t.nombre) f.nombre = t.nombre;
        if (!f.nombreApellidos && t.nombreApellidos) f.nombreApellidos = t.nombreApellidos;
        if (!f.sexo && t.sexo) f.sexo = t.sexo;
        if (!f.domicilio) {
          (t.otros || []).forEach(function (o) {
            if (!f.domicilio && /domicilio|direccion/.test(U.normalizar(o.titulo))) f.domicilio = o.valor;
          });
        }
        if (!f.documento && t.documento) f.documento = t.documento;
        (t.telefonos || []).forEach(function (x) { if (f.telefonos.indexOf(x) === -1) f.telefonos.push(x); });
        (t.correos || []).forEach(function (x) { if (f.correos.indexOf(x) === -1) f.correos.push(x); });
        var e = etiqueta(t);
        if (f.etiquetas.indexOf(e) === -1) f.etiquetas.push(e);
        if (f.hijos.indexOf(p) === -1) f.hijos.push(p);
        (porAlumno[ca] = porAlumno[ca] || []);
        if (porAlumno[ca].indexOf(f) === -1) porAlumno[ca].push(f);
      });
    });
    orden.forEach(function (f) {
      f.busca = U.normalizar([f.nombre, f.documento].concat(f.telefonos, f.correos).join(' '));
      f.buscaCompacto = [f.documento].concat(f.telefonos).map(compacto).join(' ');
    });
    return { familias: orden, porAlumno: porAlumno };
  }

  /* El índice de una lista cargada, calculado una sola vez. */
  function indiceDe(fuente) {
    if (!fuente || !fuente.lista) return null;
    if (!fuente._familias) fuente._familias = indice(fuente.lista);
    return fuente._familias;
  }

  /* ---------- buscar ---------- */

  function buscarFamilias(ind, texto) {
    var q = U.normalizar(texto || '').trim();
    if (!ind || q.replace(/\s/g, '').length < 3) return [];
    var palabras = q.split(/\s+/).filter(Boolean);
    var junto = compacto(q);
    return ind.familias.filter(function (f) {
      var todas = palabras.every(function (w) {
        return f.busca.indexOf(w) !== -1 || (compacto(w) && f.buscaCompacto.indexOf(compacto(w)) !== -1);
      });
      return todas || (/\d{3}/.test(junto) && f.buscaCompacto.indexOf(junto) !== -1);
    });
  }

  function hermanosDe(ind, alumno) {
    if (!ind || !alumno) return [];
    var yo = claveAlumno(alumno);
    var salida = [];
    (ind.porAlumno[yo] || []).forEach(function (f) {
      f.hijos.forEach(function (h) {
        if (h === alumno || claveAlumno(h) === yo || salida.indexOf(h) !== -1) return;
        salida.push(h);
      });
    });
    return salida;
  }

  /* Matriculados y aspirantes arriba; antiguos, aparte. */
  function dividir(lista) {
    var actuales = [], antiguos = [];
    (lista || []).forEach(function (p) { (p.matriculado || p.solicitante ? actuales : antiguos).push(p); });
    return { actuales: actuales, antiguos: antiguos };
  }

  /* Lo que se enseña, sin pintar nada (para las pruebas): cada bloque con
     su tope de 60 por separado. */
  function resultados(fuente, texto) {
    var partes = dividir(fuente.lista);
    var conTexto = U.normalizar(texto || '').length >= 2;
    function filtrar(lista, tope) { return conTexto ? Datos.buscar(lista, texto, tope) : lista.slice(0, tope); }
    var antiguosTodos = filtrar(partes.antiguos, Infinity);
    return {
      familias: buscarFamilias(indiceDe(fuente), texto),
      actuales: filtrar(partes.actuales, TOPE),
      antiguos: antiguosTodos.slice(0, TOPE),
      antiguosTotal: antiguosTodos.length
    };
  }

  /* ---------- pintar ---------- */

  function lineaDeHijo(h) {
    return [h.unidad, h.curso].filter(Boolean).join('  ·  ');
  }

  function tarjetaFamilia(f, alPulsar) {
    var d = document.createElement('div');
    d.className = 'familia-tarjeta';
    var contacto = [f.documento].concat(f.telefonos, f.correos).filter(Boolean).join('  ·  ');
    d.innerHTML = '<div class="familia-cabeza"><strong>' + U.escapar(f.nombre || 'Sin nombre') + '</strong>' +
      '<span class="familia-etiqueta">' + U.escapar(f.etiquetas.join(' / ')) + '</span></div>' +
      (contacto ? '<div class="familia-contacto">' + U.escapar(contacto) + '</div>' : '');
    f.hijos.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'familia-hijo';
      b.innerHTML = '<span>' + U.escapar(h.nombre) + '</span><span class="suave">' + U.escapar(lineaDeHijo(h)) + '</span>';
      b.onclick = function () { alPulsar(h); };
      d.appendChild(b);
    });
    return d;
  }

  function titulo(texto) {
    var h = document.createElement('div');
    h.className = 'personas-bloque-titulo';
    h.textContent = texto;
    return h;
  }

  /* Devuelve cuántos resultados ha pintado (sin contar las familias). */
  function pintar(caja, fuente, texto, tarjeta, alPulsar) {
    var r = resultados(fuente, texto);
    if (r.familias.length) {
      caja.appendChild(titulo('Familias (' + r.familias.length + ')'));
      r.familias.slice(0, TOPE).forEach(function (f) { caja.appendChild(tarjetaFamilia(f, alPulsar)); });
      if (r.actuales.length || r.antiguosTotal) caja.appendChild(titulo('Alumnado'));
    }
    r.actuales.forEach(function (p) { caja.appendChild(tarjeta(p)); });
    if (r.antiguosTotal) {
      var det = document.createElement('details');
      det.className = 'personas-antiguos';
      det.open = antiguosAbiertos || (!r.actuales.length && !r.familias.length);
      det.innerHTML = '<summary>Antiguos (' + r.antiguosTotal + ')</summary>';
      r.antiguos.forEach(function (p) { det.appendChild(tarjeta(p)); });
      if (r.antiguosTotal > r.antiguos.length) {
        var mas = document.createElement('div');
        mas.className = 'explica';
        mas.textContent = 'Se muestran ' + r.antiguos.length + ' de ' + r.antiguosTotal + '. Afina la búsqueda.';
        det.appendChild(mas);
      }
      det.addEventListener('toggle', function () { if (r.actuales.length || r.familias.length) antiguosAbiertos = det.open; });
      caja.appendChild(det);
    }
    return r.actuales.length + r.antiguosTotal + r.familias.length;
  }

  /* ---------- la ficha: la persona marcada y sus hermanos ---------- */

  var vista = null, hermanosVistos = [];

  function claveDePersona(p) {
    return p ? (p.categoria || '') + '|' + (p.id || U.normalizar(p.nombre || '')) : '';
  }

  function marcarTarjeta(d, p) {
    d.dataset.persona = claveDePersona(p);
    if (vista && claveDePersona(vista) === d.dataset.persona) d.classList.add('resultado-elegido');
  }

  function marcarVista(p) {
    vista = p;
    Array.prototype.forEach.call(document.querySelectorAll('#lista-personas [data-persona]'), function (d) {
      d.classList.toggle('resultado-elegido', d.dataset.persona === claveDePersona(p));
    });
  }

  /* Las filas de arriba de la ficha, con «Hermanos en el centro» detrás
     de «Curso» (o de la última de matrícula que haya). */
  function filasConHermanos(destacados, p, pintarFilas) {
    hermanosVistos = App.personasCargadas ? hermanosDe(indiceDe(App.personasCargadas), p) : [];
    var tras = -1;
    destacados.forEach(function (f, i) { if (/^(matricula|grupo|curso)$/.test(U.normalizar(f.titulo))) tras = i; });
    var html = pintarFilas(destacados.slice(0, tras + 1));
    if (hermanosVistos.length) {
      html += '<div class="ficha-dato ficha-hermanos"><span>Hermanos en el centro</span><span>' +
        hermanosVistos.map(function (h, i) {
          return '<button type="button" class="enlace" data-hermano="' + i + '">' + U.escapar(h.nombre) +
            (h.unidad ? ' <span class="suave">(' + U.escapar(h.unidad) + ')</span>' : '') + '</button>';
        }).join('<br>') + '</span></div>';
    }
    return html + pintarFilas(destacados.slice(tras + 1));
  }

  function engancharHermanos(caja) {
    var lista = hermanosVistos;
    Array.prototype.forEach.call(caja.querySelectorAll('[data-hermano]'), function (b) {
      b.onclick = function () { App.verFicha(lista[parseInt(b.dataset.hermano, 10)]); };
    });
  }

  return {
    marcarTarjeta: marcarTarjeta, marcarVista: marcarVista, filasConHermanos: filasConHermanos,
    engancharHermanos: engancharHermanos,
    indice: indice, indiceDe: indiceDe, buscarFamilias: buscarFamilias, hermanosDe: hermanosDe,
    dividir: dividir, resultados: resultados, pintar: pintar, claveAlumno: claveAlumno
  };
})();
window.PersonasFamilias = PersonasFamilias;
