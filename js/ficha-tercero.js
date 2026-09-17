/* ============================================================
   ficha-tercero.js — "Datos y contacto", en una sola línea
   (17-sep-2026, fila 37, docs/FICHA-DEL-ASUNTO-NUEVA.md).

   Antes, el contacto del tercero era una tarjeta plegable con una
   fila por dato, y los datos del asunto (tipo, curso, estado...) otra
   tarjeta aparte. Aquí solo se pinta la línea resumen del tercero
   —nombre, grupo o etiqueta de estado, edad, un teléfono, DNI— con
   "Ver todo" para el resto. La lógica pura (qué grupo o etiqueta
   toca, qué teléfono es el que se enseña) vive en `Datos.resumenDeTercero`
   y `Datos.tutoresDe` (js/datos.js), para poder probarla sin navegador.

   Se habla con js/ficha-asunto.js por `window.FichaTercero.pintarLinea`,
   igual que `window.FichaDocumentos.pintar`: así no hay que engordar
   ficha-asunto.js con la búsqueda del tercero ni con el pintado.
   ============================================================ */
var FichaTercero = (function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- copiar de un clic ----------

     Mismo truco que js/copiar.js (con su propio botón "Copiado"), sin
     depender de él: ese fichero no expone nada a window. */
  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }).catch(function () { return false; });
    }
    try {
      var c = document.createElement('textarea');
      c.value = texto;
      c.setAttribute('readonly', '');
      c.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
      document.body.appendChild(c);
      c.select();
      var ok = document.execCommand('copy');
      c.parentNode.removeChild(c);
      return Promise.resolve(ok);
    } catch (e) { return Promise.resolve(false); }
  }

  function engancharCopiables(raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-copiar]'), function (el) {
      el.title = 'Copiar';
      el.style.cursor = 'pointer';
      el.onclick = function () {
        copiarAlPortapapeles(el.getAttribute('data-copiar')).then(function (ok) {
          if (!ok) { U.aviso('No he podido copiarlo.', 'malo'); return; }
          var antes = el.textContent;
          el.textContent = 'Copiado';
          setTimeout(function () { el.textContent = antes; }, 1200);
        });
      };
    });
  }

  /* ---------- encontrar al tercero ---------- */

  function categoriaDe(a) {
    return (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
  }

  /* Misma búsqueda que hacía antes js/ficha-asunto.js: el nombre suele
     llevar pegado el número de identificación o el NIF, y a veces el
     año académico. */
  function nombreDelTercero(a) {
    var f = a.ficha || {};
    if (f.tercero) return f.tercero;
    if (a.leido && a.leido.resto) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  async function buscarTercero(a) {
    var categoria = categoriaDe(a);
    var quien = nombreDelTercero(a);
    if (!categoria || !quien || !App.E.datos) return null;

    var fuente = await Datos.cargar(App.E.datos, categoria);
    var encontrados = Datos.buscar(fuente.lista, quien, 1);
    if (!encontrados.length) {
      encontrados = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
    }
    if (!encontrados.length) {
      var corto = quien.replace(/\b\d{2}-\d{2}\b/, '').replace(/\s+\S*\d\S*\s*$/, '').trim();
      if (corto) encontrados = Datos.buscar(fuente.lista, corto, 1);
    }
    if (!encontrados.length) return { persona: null, categoria: categoria, quien: quien };
    return { persona: encontrados[0], categoria: categoria, quien: quien };
  }

  /* ---------- la línea resumen ---------- */

  function lineaSuelta(caja, texto) {
    caja.innerHTML = '<p class="explica">' + U.escapar(texto) + '</p>';
  }

  function trozoEtiquetaOGrupo(resumen) {
    if (resumen.etiqueta) {
      return '<span class="ft-etiqueta ft-etiqueta-' + U.escapar(resumen.etiqueta.clase) + '">' +
             U.escapar(resumen.etiqueta.texto) + '</span>';
    }
    return resumen.grupo ? '<span>' + U.escapar(resumen.grupo) + '</span>' : '';
  }

  function pintarResumen(caja, resumen) {
    var trozos = ['<span class="ft-nombre">' + U.escapar(resumen.nombre) + '</span>'];
    var etiquetaOGrupo = trozoEtiquetaOGrupo(resumen);
    if (etiquetaOGrupo) trozos.push(etiquetaOGrupo);
    if (resumen.edad !== '' && resumen.edad !== undefined && resumen.edad !== null) {
      trozos.push('<span>' + U.escapar(resumen.edad) + ' años</span>');
    }
    if (resumen.telefono) {
      trozos.push('<span data-copiar="' + U.escapar(resumen.telefono.valor) + '">' +
        (resumen.telefono.etiqueta ? U.escapar(resumen.telefono.etiqueta) + ' ' : '') +
        U.escapar(resumen.telefono.valor) + ' ⧉</span>');
    }
    if (resumen.dni) {
      trozos.push('<span data-copiar="' + U.escapar(resumen.dni) + '">DNI ' + U.escapar(resumen.dni) + ' ⧉</span>');
    } else if (resumen.avisoDni) {
      trozos.push('<span class="ft-aviso-dni">FALTA EL DNI</span>');
    }

    caja.innerHTML =
      '<div class="ficha-tercero-linea">' + trozos.join('<span class="ft-punto">·</span>') + '</div>' +
      (resumen.etiqueta && resumen.etiqueta.sub ? '<div class="ft-sub">' + U.escapar(resumen.etiqueta.sub) + '</div>' : '') +
      '<button type="button" class="boton ft-ver-todo">Ver todo</button>';

    engancharCopiables(caja);
  }

  async function pintarLinea(caja, a) {
    if (!caja) return;
    caja.innerHTML = '<p class="explica">Buscando…</p>';

    var categoria = categoriaDe(a);
    var quien = nombreDelTercero(a);
    if (!categoria || !quien) {
      lineaSuelta(caja, 'Este asunto no dice a qué tercero pertenece.');
      return;
    }
    if (!App.E.datos) { lineaSuelta(caja, quien); return; }

    var encontrado;
    try { encontrado = await buscarTercero(a); }
    catch (e) { lineaSuelta(caja, 'No he podido leer el fichero de datos: ' + e.message); return; }

    if (!encontrado || !encontrado.persona) {
      lineaSuelta(caja, quien + ' no aparece en el fichero de ' + categoria + '.');
      return;
    }

    var resumen = Datos.resumenDeTercero(encontrado.persona, encontrado.categoria);
    pintarResumen(caja, resumen);

    var verTodo = caja.querySelector('.ft-ver-todo');
    if (verTodo) verTodo.onclick = function () { abrirVerTodo(encontrado.persona, encontrado.categoria); };
  }

  /* ---------- la ventana "Ver todo" ---------- */

  function seccion(titulo, dentroHtml) {
    if (!dentroHtml) return '';
    return '<div class="ft-seccion"><h4>' + U.escapar(titulo) + '</h4>' + dentroHtml + '</div>';
  }

  function filasDe(lista) {
    var buenas = (lista || []).filter(function (f) { return f && f.valor !== '' && f.valor !== undefined && f.valor !== null; });
    if (!buenas.length) return '';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span data-copiar="' + U.escapar(String(f.valor)) + '">' + U.escapar(String(f.valor)) + '</span></div>';
    }).join('') + '</div>';
  }

  function tarjetaTutor(t) {
    var datos = [];
    if (t.relacion) datos.push({ titulo: 'Relación', valor: t.relacion });
    t.telefonos.forEach(function (v, i) { datos.push({ titulo: t.telefonos.length > 1 ? 'Teléfono ' + (i + 1) : 'Teléfono', valor: v }); });
    t.correos.forEach(function (v, i) { datos.push({ titulo: t.correos.length > 1 ? 'Correo ' + (i + 1) : 'Correo', valor: v }); });
    if (t.documento) datos.push({ titulo: 'Documento', valor: t.documento });
    t.otros.forEach(function (o) { datos.push({ titulo: o.titulo, valor: o.valor }); });
    return '<div class="ft-tutor">' +
      '<h5>' + U.escapar(t.nombre || ('Tutor legal ' + t.numero)) + '</h5>' +
      filasDe(datos) +
    '</div>';
  }

  function seccionTutores(persona) {
    var tutores = Datos.tutoresDe(persona);
    if (!tutores.length) return '';
    return seccion('Tutores legales', tutores.map(tarjetaTutor).join(''));
  }

  function seccionOtrosDeLaFamilia(persona) {
    var tutores = Datos.tutoresDe(persona);
    var otros = tutores.otros || [];
    if (!otros.length) return '';
    return seccion('Otros datos de la familia', filasDe(otros));
  }

  function seccionRestoDeSeneca(resto) {
    if (!resto || !resto.length) return '';
    return '<details class="ft-resto"><summary>Todo lo que trae Séneca</summary>' +
           filasDe(resto) + '</details>';
  }

  function abrirVerTodo(persona, categoria) {
    var cuerpo;

    if (categoria === 'ALUMNADO') {
      var edad = U.edadDesde(persona.fechaNac || '');
      var ficha = Datos.destacadosAlumno(persona);
      var identificacion = filasDe([
        { titulo: 'Nombre', valor: persona.nombre },
        { titulo: 'DNI', valor: window.Dni ? window.Dni.de(persona) : '' },
        { titulo: 'Nº de identificación escolar', valor: persona.id },
        { titulo: 'Fecha de nacimiento', valor: persona.fechaNac },
        { titulo: 'Edad actual', valor: edad !== '' ? edad + ' años' : '' }
      ]);
      var matricula = filasDe([
        { titulo: 'Curso', valor: persona.curso },
        { titulo: 'Unidad', valor: persona.unidad },
        { titulo: 'Estado', valor: persona.matriculado ? 'Matriculado' : (persona.solicitante ? 'Solicitante' : 'No matriculado') },
        { titulo: 'Última matrícula', valor: !persona.matriculado && persona.anoUltima
          ? U.cursoDeAno(persona.anoUltima) + (persona.unidadUltima ? '  ·  ' + persona.unidadUltima : '') : '' }
      ]);
      var contactoPropio = filasDe(
        Object.keys(persona.campos || {})
          .filter(function (t) { return !/tutor|padre|madre|responsable|familia/.test(U.normalizar(t)) && /telefono|movil|correo|e-?mail/.test(U.normalizar(t)); })
          .map(function (t) { return { titulo: t, valor: persona.campos[t] }; })
      );

      cuerpo =
        seccion('Identificación', identificacion) +
        seccion('Matrícula y grupo', matricula) +
        seccion('Contacto del alumno', contactoPropio) +
        seccionTutores(persona) +
        seccionOtrosDeLaFamilia(persona) +
        seccionRestoDeSeneca(ficha.resto);
    } else {
      var esPersonal = categoria === 'PERSONAL';
      var esEmpresa = categoria === 'EMPRESAS';
      var ficha2 = esPersonal ? Datos.destacadosPersona(persona) : { resto: Object.keys(persona.campos || {}).map(function (c) { return { titulo: c, valor: persona.campos[c] }; }) };
      var identificacion2 = filasDe([
        { titulo: 'Nombre', valor: persona.nombre },
        { titulo: esEmpresa ? 'NIF' : 'DNI', valor: esEmpresa ? persona.nif : persona.documento },
        { titulo: 'Rótulo', valor: esEmpresa ? (persona.comercial || (persona.campos && persona.campos['Nombre comercial'])) : '' }
      ]);
      var situacion = esPersonal ? filasDe([
        { titulo: 'Puesto', valor: persona.puesto },
        { titulo: 'Situación', valor: persona.enElCentro ? 'En el centro' : 'Ya no está en el centro' },
        { titulo: 'Último curso aquí', valor: !persona.enElCentro ? persona.cursoUltimo : '' }
      ]) : '';
      var contacto2 = filasDe(
        Object.keys(persona.campos || {})
          .filter(function (t) { return /telefono|movil|correo|e-?mail/.test(U.normalizar(t)); })
          .map(function (t) { return { titulo: t, valor: persona.campos[t] }; })
      );

      cuerpo =
        seccion('Identificación', identificacion2) +
        seccion('Situación en el centro', situacion) +
        seccion('Contacto', contacto2) +
        seccionRestoDeSeneca(ficha2.resto);
    }

    var promesa = U.preguntar(persona.nombre, '<div class="ft-ventana">' + cuerpo + '</div>', 'Cerrar', true);
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-medio');
    var cuerpoCuadro = $('cuadro-cuerpo');
    if (cuerpoCuadro) engancharCopiables(cuerpoCuadro);
    promesa.then(function () { if (cuadro) cuadro.classList.remove('cuadro-medio'); });
  }

  return { pintarLinea: pintarLinea };
})();

window.FichaTercero = FichaTercero;
