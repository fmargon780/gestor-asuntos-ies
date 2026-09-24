/* ============================================================
   correo-grupos.js — los grupos para la copia oculta y el desplegable
   «Añadir un grupo» (window.CorreoGrupos). Salió de js/correo.js en la
   fila 133 (24-sep-2026, docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar
   nada. Se carga justo después de js/correo.js.
   ============================================================ */
(function () {
  /* ---------- los grupos, para la copia oculta ----------

     17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md. Decisión de
     Francisco: los destinatarios que vienen de un grupo van SIEMPRE en
     copia oculta, nunca en Para, para que una familia no vea el correo
     de las demás. Combinar los correos de un grupo es cosa de
     js/correo-cuadro.js (fila 58): aquí solo queda resolver quiénes
     son los miembros, que también usa Séneca. */

  /* Busca la ficha de cada miembro que no la traiga ya puesta (los
     atajos de alumnado la traen; los miembros de un grupo guardado,
     no: solo se guarda { categoria, nombre }). Una sola lectura de
     Datos.cargar por categoría, no una por miembro. */
  async function resolverMiembros(miembros) {
    var porCategoria = {};
    miembros.forEach(function (m) {
      if (!porCategoria[m.categoria]) porCategoria[m.categoria] = [];
      porCategoria[m.categoria].push(m);
    });
    var resueltos = [];
    for (var categoria in porCategoria) {
      var fuente = null;
      if (!porCategoria[categoria].every(function (m) { return m.persona; })) {
        try { fuente = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null; }
        catch (e) { fuente = null; }
      }
      porCategoria[categoria].forEach(function (m) {
        var persona = m.persona ||
          (fuente ? fuente.lista.filter(function (p) { return App.textoTercero(p) === m.nombre; })[0] : null);
        resueltos.push({ nombre: m.nombre, persona: persona || null });
      });
    }
    return resueltos;
  }

  /* Los mismos tres filtros de js/relacionados.js (Relacionados.filtrarPorUnidad
     y compañía): ni el análisis de la unidad ni el filtro de matriculado
     se repiten aquí. */
  async function miembrosDeOpcionDeGrupo(valor) {
    if (valor.indexOf('grupo:') === 0) {
      var g = window.Grupos && Grupos.porId(valor.slice(6));
      return g ? g.miembros.slice() : [];
    }
    if (!App.E.datos || !window.Relacionados) return [];
    var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
    var lista;
    if (valor.indexOf('unidad:') === 0) lista = Relacionados.filtrarPorUnidad(fuente.lista, valor.slice(7));
    else if (valor.indexOf('nivel:') === 0) lista = Relacionados.filtrarPorNivel(fuente.lista, valor.slice(6));
    else if (valor.indexOf('ensenanza:') === 0) lista = Relacionados.filtrarPorEnsenanza(fuente.lista, valor.slice(10));
    else return [];
    return lista.map(function (al) { return { categoria: 'ALUMNADO', nombre: App.textoTercero(al), persona: al }; });
  }

  /* Las opciones del desplegable "Añadir un grupo": los grupos propios
     y, para el alumnado, los mismos atajos de unidad, nivel y
     enseñanza de "Añadir varios" en js/relacionados.js. Cadena vacía
     si no hay ni grupos ni alumnado cargado: entonces no sale el
     desplegable. */
  async function opcionesDeGrupo() {
    var partes = [];
    var grupos = (window.Grupos && Grupos.lista()) || [];
    if (grupos.length) {
      partes.push('<optgroup label="Grupos">' + grupos.map(function (g) {
        return '<option value="grupo:' + U.escapar(g.id) + '">' + U.escapar(g.nombre) + '</option>';
      }).join('') + '</optgroup>');
    }
    if (App.E.datos) {
      try {
        var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
        var unidades = Datos.unidadesDistintas(fuente.lista);
        if (unidades.length) {
          var niveles = {}, ensenanzas = {};
          unidades.forEach(function (u) {
            var p = Nombres.nivelYEnsenanza(u.unidad);
            if (p.nivel) niveles[p.nivel] = true;
            if (p.ensenanza) ensenanzas[p.ensenanza] = true;
          });
          partes.push('<optgroup label="Unidades">' + unidades.map(function (u) {
            return '<option value="unidad:' + U.escapar(u.unidad) + '">' + U.escapar(u.unidad) + '</option>';
          }).join('') + '</optgroup>');
          partes.push('<optgroup label="Niveles">' + Object.keys(niveles).sort().map(function (n) {
            return '<option value="nivel:' + U.escapar(n) + '">' + U.escapar(n) + '</option>';
          }).join('') + '</optgroup>');
          partes.push('<optgroup label="Enseñanzas">' + Object.keys(ensenanzas).sort().map(function (e) {
            return '<option value="ensenanza:' + U.escapar(e) + '">' + U.escapar(e) + '</option>';
          }).join('') + '</optgroup>');
        }
      } catch (e) { /* sin datos cargados, no pasa nada: el desplegable se queda sin esas opciones */ }
    }
    return partes.join('');
  }

  /* Las mismas piezas de "Añadir un grupo" las necesita también el
     cuadro de Séneca (fila 47, docs/DESTINATARIOS-EN-SENECA.md), que
     vive en su propio fichero (js/seneca-destinatarios.js) para no
     engordar más este. Se exponen sin tocar nada de lo de arriba. */
  window.CorreoGrupos = {
    opciones: opcionesDeGrupo,
    miembrosDeOpcion: miembrosDeOpcionDeGrupo,
    resolverMiembros: resolverMiembros
  };
})();
