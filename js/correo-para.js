/* ============================================================
   correo-para.js — Para, Copia y Copia oculta del correo de un asunto
   (6-nov-2026, fila 555, docs/555-A-QUIEN-VA-CADA-CORREO.md).

   Reglas:
   - Solo se escribe a gente ligada al asunto (la «lista cerrada»): el interesado, sus tutores legales (los dos), el tutor o
     tutora de su grupo, sus profesores, quien lo pide, los relacionados con el asunto y las listas de Ajustes › Grupos que
     tienen solo personal del centro. Nadie más: ni otros alumnos ni una dirección escrita a mano.
   - Cada persona va en un solo campo: ponerla en otro la quita del anterior.
   - Asunto de grupo (o varios alumnos relacionados): las familias van siempre en Copia oculta.
   - La plantilla propone destinatarios por papeles (`para`, `copia`, `oculta`: interesado, legales, tutor, profes, pide,
     relac, grupo:<id>); aquí se convierten en personas de este asunto. Un papel que el asunto no tiene no pone a nadie.
   - Lo que traiga una llamada de la propia aplicación (un aviso a quien lo pidió, el claustro…) entra como pastilla
     propia aunque no esté en la lista: no lo ha escrito la usuaria.
   - Una pastilla admite otro correo «solo esta vez»: no cambia el guardado.

   Estado en `S` (un cuadro abierto a la vez). Lo pintan CampoDestinatarios (js/campo-destinatarios.js) y el cuadro de
   Correo (js/correo-cuadro-cuerpo.js).
   ============================================================ */
var CorreoPara = (function () {

  var CAMPOS = ['para', 'copia', 'oculta'];
  var ROTULOS = { para: 'Para', copia: 'Copia', oculta: 'Copia oculta' };
  var S = reiniciado();

  function reiniciado() {
    return { candidatos: [], dest: { para: [], copia: [], oculta: [] }, grupoDeFamilias: false, campos: {}, a: null };
  }
  function norm(t) { return U.normalizar(String(t || '')); }
  function primerCorreo(dirs) { return (dirs && dirs[0]) || ''; }

  /* ---------- la lista cerrada ---------- */

  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  /* PURA. Quién tiene la custodia: el nombre del tutor que dice el asunto; con un solo tutor, ese. */
  function custodiaDe(nombresTutores, escrita) {
    var e = norm(escrita);
    if (e) {
      var hay = nombresTutores.filter(function (n) { return norm(n) === e || norm(n).indexOf(e) !== -1 || e.indexOf(norm(n)) !== -1; })[0];
      if (hay) return hay;
    }
    return nombresTutores.length === 1 ? nombresTutores[0] : '';
  }

  function custodiaEscrita(a) {
    try {
      if (!window.DatosDelAsunto) return '';
      var c = DatosDelAsunto.camposDelAsunto(a).filter(function (x) { return DatosDelAsunto.esTutorConCustodia(x.nombre); })[0];
      return c ? DatosDelAsunto.valorGuardado(a, c.clave) : '';
    } catch (e) { return ''; }
  }

  function esFamiliaForzada(a) {
    if (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a)) return true;
    var rel = (a && a.ficha && a.ficha.relacionados) || [];
    return rel.filter(function (r) { return (r.categoria || 'ALUMNADO') === 'ALUMNADO'; }).length > 1;
  }

  function nuevo(id, nombre, rol, dirs, extra) {
    var c = { id: id, nombre: nombre, rol: rol, dirs: (dirs || []).slice(), sinCorreo: !(dirs || []).length, buscar: '' };
    return Object.assign(c, extra || {});
  }

  /* Prepara la lista cerrada del asunto. Nunca lanza: lo que no se pueda saber, no sale. */
  async function preparar(a, persona, ctx) {
    S = reiniciado();
    S.a = a;
    S.grupoDeFamilias = esFamiliaForzada(a);
    var lista = [];
    var tercero = (ctx && ctx.tercero) || '';

    /* El interesado: sus propios correos (no los de la familia). */
    var propios = [];
    if (persona) {
      Object.keys(persona.campos || {}).forEach(function (k) {
        if (/tutor|padre|madre|responsable|familia/.test(norm(k))) return;
        (String(persona.campos[k] || '').match(Destinatarios.RE_CORREO) || []).forEach(function (d) {
          if (propios.map(function (x) { return x.toLowerCase(); }).indexOf(d.toLowerCase()) === -1) propios.push(d);
        });
      });
    }
    if (tercero) lista.push(nuevo('interesado', soloElNombre(tercero), 'El interesado', propios, { papel: 'interesado', buscar: 'interesado alumno alumna' }));

    /* Los tutores legales, con la custodia. Los correos de familia que no cuelgan de ningún tutor («Correo del tutor» a secas) se
       reparten: con un solo tutor sin correo, son suyos; si no, salen como «La familia». */
    var tutores = persona && window.Datos && Datos.tutoresDe ? Datos.tutoresDe(persona) : [];
    var nombres = tutores.map(function (t) { return t.nombre; }).filter(Boolean);
    var conCustodia = custodiaDe(nombres, custodiaEscrita(a));
    var delTutor = {};
    tutores.forEach(function (t) { t.correos.forEach(function (d) { delTutor[d.toLowerCase()] = true; }); });
    var sueltos = [];
    if (persona) Object.keys(persona.campos || {}).forEach(function (k) {
      if (!/tutor|padre|madre|responsable|familia/.test(norm(k))) return;
      (String(persona.campos[k] || '').match(Destinatarios.RE_CORREO) || []).forEach(function (d) {
        if (!delTutor[d.toLowerCase()] && sueltos.map(function (x) { return x.toLowerCase(); }).indexOf(d.toLowerCase()) === -1) sueltos.push(d);
      });
    });
    var sinCorreoPropio = tutores.filter(function (t) { return !t.correos.length; });
    var algunoTiene = tutores.some(function (t) { return t.correos.length; });
    tutores.forEach(function (t) {
      var etiqueta = window.FichaTerceroAlumno ? FichaTerceroAlumno.etiquetaDeTutor(t) : 'Tutor legal ' + t.numero;
      var tiene = !!conCustodia && t.nombre === conCustodia;
      var dirs = t.correos.slice();
      if (!dirs.length && sueltos.length && sinCorreoPropio.length === 1 && tutores.length === 1) { dirs = sueltos.slice(); sueltos = []; }
      var quien = /padre|madre/.test(norm(t.relacion)) ? t.relacion : 'padre madre';
      lista.push(nuevo('legal' + t.numero, t.nombre || etiqueta, 'Tutor legal · ' + etiqueta.toLowerCase(), dirs, {
        papel: 'legales', familia: true, custodia: tiene,
        nota: '',
        buscar: etiqueta + ' ' + quien + ' tutor legal tutores legales familia' + (tiene ? ' custodia' : '')
      }));
    });
    if (sueltos.length && !algunoTiene) lista.push(nuevo('legales-familia', 'La familia', 'Tutores legales', sueltos, { papel: 'legales', familia: true, buscar: 'familia tutor legal tutores legales padre madre' }));

    /* El tutor o tutora del grupo. */
    var tg = ctx && ctx.tutoresDelAlumno;
    if (tg && tg.unidades) {
      tg.unidades.forEach(function (u) {
        (u.tutores || []).forEach(function (t, i) {
          lista.push(nuevo('tutor:' + (t.clave || (u.unidad + i)), t.nombre, 'Tutor/a de ' + u.unidad, t.correos || [], {
            papel: 'tutor', buscar: 'tutor tutora tutoria ' + u.unidad
          }));
        });
      });
    }

    /* Quien lo pide. */
    var pide = ctx && ctx.pide;
    if (pide && (pide.correo || pide.nombre)) {
      lista.push(nuevo('pide', pide.nombre || 'Quien lo pide', 'Quien lo pide', String(pide.correo || '').match(Destinatarios.RE_CORREO) || [], { papel: 'pide', buscar: 'pide pidio solicita' }));
    }

    /* Los relacionados con el asunto. */
    var rel = (a && a.ficha && a.ficha.relacionados) || [];
    var resueltos = [];
    if (rel.length && window.CorreoGrupos) {
      try { resueltos = await CorreoGrupos.resolverMiembros(rel); } catch (e) { resueltos = []; }
      if (S.grupoDeFamilias && !tutores.length && window.Datos && Datos.tutoresDe) {
        var fam = [];
        resueltos.forEach(function (m) {
          Datos.tutoresDe(m.persona).forEach(function (t) { t.correos.forEach(function (d) { if (fam.indexOf(d) === -1) fam.push(d); }); });
        });
        if (fam.length) lista.push(nuevo('legales-grupo', 'Tutores legales del grupo', 'Familias', fam, { papel: 'legales', familia: true, buscar: 'tutores legales familias padres madres' }));
      }
      resueltos.forEach(function (m, i) {
        lista.push(nuevo('rel:' + m.nombre, soloElNombre(m.nombre), 'Relacionado con el asunto', Destinatarios.direccionesDe(m.persona), {
          papel: 'relac', buscar: 'relacionado relacionados ' + m.nombre
        }));
      });
    }

    /* Sus profesores (fila 572): los de las materias del alumno, o todos los del grupo (js/horario.js). Sin el dato del Centro de datos, ninguno. */
    var profes = window.Horario && Horario.profesoresDeUnidades ? await Horario.profesoresDeUnidades(a, { persona: persona, relacionados: resueltos }) : [];
    (profes || []).forEach(function (p, i) {
      lista.push(nuevo('profe:' + (p.clave || i), p.nombre, 'Profesor/a de ' + (p.materia || 'su grupo'), p.correos || [], {
        papel: 'profes', claveCorreo: p.claveCorreo || '', buscar: 'profesor profesora profesores sus profesores ' + (p.materia || '') }));
    });

    /* Las listas del personal. */
    var grupos = (window.Grupos && Grupos.lista()) || [];
    for (var g = 0; g < grupos.length; g++) {
      var gr = grupos[g];
      var miembros = gr.miembros || [];
      if (!miembros.length || !miembros.every(function (m) { return m.categoria === 'PERSONAL'; })) continue;
      var dirs = [];
      try { dirs = Destinatarios.delGrupo(await CorreoGrupos.resolverMiembros(miembros)).direcciones; } catch (e2) { dirs = []; }
      lista.push(nuevo('grupo:' + gr.id, gr.nombre, 'Lista del personal', dirs, { papel: 'grupo:' + gr.id, esLista: true, buscar: 'lista personal grupo ' + gr.nombre }));
    }
    S.candidatos = lista;
  }

  /* ---------- poner y quitar ---------- */

  function enCampo(campo) { return S.dest[campo]; }
  function buscarCandidato(id) { return S.candidatos.filter(function (c) { return c.id === id; })[0] || null; }
  function campoDe(id) {
    return CAMPOS.filter(function (c) { return S.dest[c].some(function (p) { return p.id === id; }); })[0] || '';
  }

  function quitar(id) {
    CAMPOS.forEach(function (c) { S.dest[c] = S.dest[c].filter(function (p) { return p.id !== id; }); });
  }

  /* Pone una persona en un campo, quitándola de donde estuviera. Las familias de un asunto de grupo van a Copia oculta. */
  function poner(campo, item) {
    if (!item) return;
    if (item.familia && S.grupoDeFamilias) campo = 'oculta';
    quitar(item.id);
    S.dest[campo].push({ id: item.id, nombre: item.nombre, dirs: (item.dirs || []).slice(), vez: '', familia: !!item.familia, custodia: !!item.custodia });
  }

  function ponerElegido(campo, id) { poner(campo, buscarCandidato(id)); }

  /* Los papeles de una plantilla, a personas de este asunto. */
  function candidatosDePapel(papel) {
    return S.candidatos.filter(function (c) { return c.papel === papel; });
  }

  function aplicarPapeles(papeles) {
    CAMPOS.forEach(function (campo) {
      ((papeles && papeles[campo]) || []).forEach(function (papel) {
        candidatosDePapel(papel).forEach(function (c) { if (!c.sinCorreo) poner(campo, c); });
      });
    });
  }

  function vaciar() { CAMPOS.forEach(function (c) { S.dest[c] = []; }); }

  /* Lo puesto ahora, para volver a ponerlo si el cuadro se cierra y se reabre (relacionar a alguien desde el correo). */
  function instantanea() { return JSON.parse(JSON.stringify(S.dest)); }
  function restaurar(snap) {
    vaciar();
    CAMPOS.forEach(function (c) { ((snap && snap[c]) || []).forEach(function (p) { S.dest[c].push(p); }); });
  }

  /* Un correo recién escrito a mano para una persona de la lista (el aviso «Falta el correo de…» del tutor): ya se puede elegir, y se pone en Para. */
  function actualizarCorreo(id, correo) {
    var c = buscarCandidato(id);
    if (!c) return false;
    c.dirs = [correo]; c.sinCorreo = false;
    poner('para', c);
    return true;
  }

  /* Direcciones que pone la propia aplicación (no la usuaria): si son de alguien de la lista, esa persona; si no, pastilla propia. */
  function ponerDirecciones(campo, dirs, nombre) {
    (dirs || []).forEach(function (d) {
      if (!d) return;
      var c = S.candidatos.filter(function (x) { return x.dirs.some(function (y) { return y.toLowerCase() === String(d).toLowerCase(); }); })[0];
      if (c) { if (campoDe(c.id) !== campo) { quitar(c.id); S.dest[campo].push({ id: c.id, nombre: c.nombre, dirs: [d], vez: '', familia: !!c.familia }); } return; }
      var id = 'dir:' + String(d).toLowerCase();
      if (campoDe(id)) return;
      quitar(id);
      S.dest[campo].push({ id: id, nombre: nombre || d, dirs: [d], vez: '', familia: false });
    });
  }

  /* ---------- lo que sale ---------- */

  function direccionesDe(p) { return p.vez ? [p.vez] : p.dirs; }

  function direcciones(campo) {
    var vistas = {}, salida = [];
    S.dest[campo].forEach(function (p) {
      direccionesDe(p).forEach(function (d) {
        if (!vistas[d.toLowerCase()]) { vistas[d.toLowerCase()] = true; salida.push(d); }
      });
    });
    return salida;
  }
  function texto(campo) { return direcciones(campo).join(', '); }
  function nombres(campo) { return S.dest[campo].map(function (p) { return p.nombre; }); }
  function todosLosNombres() { return CAMPOS.reduce(function (acc, c) { return acc.concat(nombres(c)); }, []); }

  /* ---------- pintar ---------- */

  function opcionesDe() {
    return S.candidatos.map(function (c) {
      var ahora = campoDe(c.id);
      return {
        id: c.id, nombre: c.nombre, rol: c.rol + (c.custodia ? ' · tiene la custodia' : ''),
        correo: c.dirs.join(', '), buscar: c.buscar + (c.custodia ? ' custodia' : ''), sinCorreo: c.sinCorreo,
        nota: ahora ? 'Ahora en ' + ROTULOS[ahora] + ': pasará a este campo' : ''
      };
    });
  }

  function elegidosDe(campo) {
    return S.dest[campo].map(function (p) {
      return { id: p.id, nombre: p.nombre + (p.custodia ? ' · custodia' : ''), correo: p.vez || primerCorreo(p.dirs), vez: p.vez };
    });
  }

  function html() {
    return '<div class="correo-para-campos">' + CAMPOS.map(function (c) { return CampoDestinatarios.html('correo-' + c, ROTULOS[c]); }).join('') +
      '<p class="nota correo-para-ayuda">Escribe un nombre o lo que es: padre, madre, tutor, custodia, profesor, director, secretaría… ' +
      'Solo salen personas de este asunto. Pulsa un nombre ya puesto para escribirle a otro correo solo esta vez.</p></div>';
  }

  function repintarTodos() { CAMPOS.forEach(function (c) { if (S.campos[c]) S.campos[c].repintar(); }); }

  function enganchar() {
    S.campos = {};
    CAMPOS.forEach(function (campo) {
      S.campos[campo] = CampoDestinatarios.montar('correo-' + campo, {
        opciones: opcionesDe,
        elegidos: function () { return elegidosDe(campo); },
        alElegir: function (id) { ponerElegido(campo, id); repintarTodos(); },
        alQuitar: function (id) { S.dest[campo] = S.dest[campo].filter(function (p) { return p.id !== id; }); },
        alCambiarVez: function (id, correo) { S.dest[campo].forEach(function (p) { if (p.id === id) p.vez = correo; }); },
        alRelacionar: function (texto) { if (window.CorreoRelacionar && CorreoRelacionar.alRelacionarEscrito) CorreoRelacionar.alRelacionarEscrito(texto); }
      });
    });
  }

  function candidatos() { return S.candidatos.slice(); }
  function estado() { return S; }

  return {
    CAMPOS: CAMPOS, ROTULOS: ROTULOS, preparar: preparar, custodiaDe: custodiaDe,
    aplicarPapeles: aplicarPapeles, ponerDirecciones: ponerDirecciones, poner: poner, ponerElegido: ponerElegido, quitar: quitar,
    vaciar: vaciar, instantanea: instantanea, restaurar: restaurar, actualizarCorreo: actualizarCorreo, direcciones: direcciones, texto: texto, nombres: nombres, todosLosNombres: todosLosNombres,
    html: html, enganchar: enganchar, repintar: repintarTodos, candidatos: candidatos, estado: estado, campoDe: campoDe
  };
})();
window.CorreoPara = CorreoPara;
