/* ============================================================
   guias-sin-preguntas.js — los hitos-pregunta desaparecen (fila 576,
   docs/576-SOLO-SI-EN-HITOS-Y-TAREAS.md). Las guías que ya tenían preguntas
   las pasa la app sola, una vez, al entrar:

   - Cada pregunta pasa a ser un campo de lista del tipo (con sus respuestas
     como opciones). Si ya hay un campo con ese nombre y sus opciones casan, se
     reutiliza; si no casan, el nuevo se llama «<pregunta> (respuesta)».
   - Los hitos que había dentro de cada respuesta pasan a la lista única, en el
     sitio de la pregunta, con «Solo si <campo> vale <respuesta>». Las
     preguntas dentro de respuestas se pasan igual, sumando las condiciones.
   - En los asuntos abiertos que ya contestaron una pregunta, el campo queda
     relleno con la respuesta elegida, y sus hitos pasan a la lista única.
     Un hito-pregunta con notas o documentos se queda como hito normal.

   Partes puras (`planificar`, `aplanarPasos`, `aplanarHitos`) y la parte con
   disco (`convertir`), que se engancha a `Gestor.alRefrescar` y no hace nada
   si no hay guías con preguntas (se mira en memoria). Antes de tocar nada
   guarda una copia de las guías (`guias-antes-de-quitar-preguntas-….json`).
   ============================================================ */
var GuiasSinPreguntas = (function () {

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }
  function norm(x) { return U.normalizar(String(x === undefined || x === null ? '' : x).trim()); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function hayPreguntas(pasos) { return (pasos || []).some(esPregunta); }

  /* Todas las preguntas de una lista de pasos, también las de dentro de respuestas. */
  function preguntasDe(pasos, out) {
    out = out || [];
    (pasos || []).forEach(function (p) {
      if (!esPregunta(p)) return;
      out.push(p);
      p.opciones.forEach(function (o) { preguntasDe(o.pasos, out); });
    });
    return out;
  }

  /* ---------- el plan: qué campo es cada pregunta ---------- */

  /* `propios`: los campos propios que ya existen ([{ id, nombre, clase, valores }]). Devuelve
     { porPregunta: idPregunta -> { id, nombre, valores, valorDe: idOpcion -> valor, nuevo }, campos: [los distintos] }.
     No toca `propios`. */
  function planificar(pasos, propios) {
    var existentes = (propios || []).map(function (p) { return { id: p.id, nombre: p.nombre, clase: p.clase, valores: (p.valores || []).slice(), nuevo: false }; });
    var plan = { porPregunta: {}, campos: [] };
    preguntasDe(pasos).forEach(function (p, n) {
      var vistos = {}, valores = [];
      var valorDe = {};
      p.opciones.forEach(function (o, j) {
        var v = String(o.titulo || '').trim() || 'Respuesta ' + (j + 1);
        var base = v, k = 2;
        while (vistos[norm(v)]) v = base + ' (' + (k++) + ')';
        vistos[norm(v)] = true;
        valores.push(v);
        valorDe[o.id] = v;
      });
      var titulo = String(p.titulo || '').trim() || 'Pregunta';
      var candidato = titulo, intento = 0, elegido = null;
      for (;;) {
        var hallado = existentes.filter(function (c) { return norm(c.nombre) === norm(candidato); })[0];
        if (!hallado) { elegido = { id: '', nombre: candidato, clase: 'lista', valores: valores.slice(), nuevo: true }; existentes.push(elegido); break; }
        if (hallado.clase === 'lista' && valores.every(function (v) { return hallado.valores.some(function (w) { return norm(w) === norm(v); }); })) { elegido = hallado; break; }
        intento++;
        candidato = titulo + ' (respuesta' + (intento > 1 ? ' ' + intento : '') + ')';
      }
      /* Las respuestas, con la grafía que ya tiene el campo si se reutiliza. */
      var valorFinal = {};
      p.opciones.forEach(function (o) {
        var v = valorDe[o.id];
        valorFinal[o.id] = elegido.valores.filter(function (w) { return norm(w) === norm(v); })[0] || v;
      });
      plan.porPregunta[p.id] = { id: elegido.id, nombre: elegido.nombre, valores: elegido.valores, valorDe: valorFinal, nuevo: elegido.nuevo, ref: elegido };
      if (plan.campos.indexOf(elegido) === -1) plan.campos.push(elegido);
    });
    return plan;
  }

  /* ---------- la guía ---------- */

  function aplanarPasos(pasos, plan) {
    var salida = [];
    (function volcar(lista, cond) {
      (lista || []).forEach(function (p) {
        if (!esPregunta(p)) {
          var q = copia(p);
          var si = SoloSi.sumar(cond, p.soloSi);
          if (si) q.soloSi = si; else delete q.soloSi;
          delete q.opciones;
          q.opciones = [];
          salida.push(q);
          return;
        }
        var c = plan.porPregunta[p.id];
        p.opciones.forEach(function (o) {
          volcar(o.pasos, SoloSi.sumar(cond, { campo: c.nombre, valores: [c.valorDe[o.id]] }));
        });
      });
    })(pasos, null);
    return salida;
  }

  /* ---------- los hitos de un asunto ---------- */

  function conTrabajo(h) {
    var notas = window.HitosNucleo && HitosNucleo.notasPropias ? HitosNucleo.notasPropias(h) : (h.notas || []);
    return !!((notas && notas.length) || (h.documentos && h.documentos.length));
  }

  /* { hitos, valores: nombre del campo -> respuesta elegida, cambios }. `hitos` no se toca. */
  function aplanarHitos(hitos, plan) {
    var valores = {}, salida = [], cambios = 0;
    (function volcar(lista, cond, descartada) {
      (lista || []).forEach(function (h) {
        var c = h.clase === 'decision' ? plan.porPregunta[h.origenGuia || h.id] : null;
        if (h.clase === 'decision' && !c) { salida.push(h); return; }   /* una pregunta que la guía ya no tiene: se queda como está */
        if (!c) {
          var q = h;
          var propio = descartada && q.estado === 'noaplica' && conTrabajo(q);   /* con notas o documentos: se queda a la vista, sin condición nueva */
          var si = propio ? SoloSi.normalizar(q.soloSi) : SoloSi.sumar(cond, q.soloSi);
          if (si) q.soloSi = si; else delete q.soloSi;
          if (descartada && q.estado === 'noaplica' && !conTrabajo(q)) q.estado = 'pendiente';   /* ahora lo esconde la condición */
          salida.push(q);
          return;
        }
        cambios++;
        if (conTrabajo(h)) {
          var d = copia(h);
          d.clase = 'paso'; d.opciones = []; delete d.elegida;
          var sd = SoloSi.sumar(cond, d.soloSi);
          if (sd) d.soloSi = sd; else delete d.soloSi;
          salida.push(d);
        }
        if (h.elegida && !descartada && c.valorDe[h.elegida]) valores[c.nombre] = c.valorDe[h.elegida];
        (h.opciones || []).forEach(function (o) {
          var rama = descartada || (!!h.elegida && o.id !== h.elegida);
          volcar(o.hitos, SoloSi.sumar(cond, { campo: c.nombre, valores: [c.valorDe[o.id]] }), rama);
        });
      });
    })(hitos, null, false);
    return { hitos: salida, valores: valores, cambios: cambios };
  }

  /* ---------- con disco ---------- */

  var enMarcha = false, fallado = false, ultimoError = '', paso = '';

  function dosDigitos(x) { return String(x).padStart(2, '0'); }
  function sello() {
    var d = new Date();
    return '' + d.getFullYear() + dosDigitos(d.getMonth() + 1) + dosDigitos(d.getDate()) + '-' + dosDigitos(d.getHours()) + dosDigitos(d.getMinutes());
  }

  function listo() {
    return !!(window.Gestor && Gestor.carpetaGestor() && window.GuiasDelCentro && window.App && App.E && App.E.campos && window.Campos &&
      window.SoloSi && window.Hitos && !(window.SoloConsulta && SoloConsulta.activo()));
  }

  /* Los campos nuevos y su puesta en cada tipo, en una sola pasada por campos.json. */
  async function escribirCampos(tipo, plan) {
    var nuevos = plan.campos.filter(function (c) { return c.nuevo && !c.id; });
    nuevos.forEach(function (c) { c.id = 'p' + Date.now() + Math.floor(Math.random() * 100000); });
    return App.enFila('campos.json', async function () {
      var config = await Campos.leer(App.E.gestor);
      if (nuevos.length) {
        config = await Campos.guardarPropios(App.E.gestor, function (propios) {
          nuevos.forEach(function (c) { if (!propios.some(function (p) { return p.id === c.id; })) propios.push({ id: c.id, nombre: c.nombre, clase: 'lista', valores: c.valores, grupo: 'Asunto' }); });
          return propios;
        });
      }
      var lista = ((config.porTipo && config.porTipo[tipo]) || []).slice();
      plan.campos.forEach(function (c) {
        if (!lista.some(function (e) { return Campos.claveDeCampo(e) === 'propio:' + c.id; })) lista.push({ origen: 'propio', id: c.id, obligatorio: false, enNombre: false });
      });
      return Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista);
    }).then(function (config) { App.E.campos = config; });
  }

  /* Los asuntos abiertos de estos tipos: { clave: tipo }, según su ficha. */
  function asuntosDe(tipos, datos) {
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var r = {};
    Object.keys(datos.porAsunto || {}).forEach(function (clave) {
      var t = registro[clave] && SoloSi.tipoDe(SoloSi.asuntoDeClave(clave));
      if (t && tipos.indexOf(t) !== -1) r[clave] = t;
    });
    return r;
  }

  /* Mientras se monta la copia de pruebas la conversión espera (js/demo/datos-solo-si.js la llama al terminar). */
  var pausada = !!window.__pruebaSinConvertirPreguntas;   /* solo para las pruebas que miran los hitos-pregunta de antes */
  function pausar(si) { pausada = !!si; }

  async function convertir() {
    if (enMarcha || fallado || pausada || !listo()) return null;
    var guias = GuiasDelCentro.todas();
    var tipos = Object.keys(guias).filter(function (t) { return hayPreguntas(guias[t]); });
    if (!tipos.length) return null;
    enMarcha = true;
    try {
      var g = Gestor.carpetaGestor();
      await Carpetas.guardarJson(g, 'guias-antes-de-quitar-preguntas-' + sello() + '.json', guias);
      paso = 'var planes = {}';
      var planes = {}, preguntas = 0, campos = 0;
      for (var i = 0; i < tipos.length; i++) {
        var plan = planificar(guias[tipos[i]], App.E.campos.propios || []);
        await escribirCampos(tipos[i], plan);
        planes[tipos[i]] = plan;
        preguntas += Object.keys(plan.porPregunta).length;
        campos += plan.campos.filter(function (c) { return c.nuevo; }).length;
      }
      paso = '/* Los asuntos abier';
      /* Los asuntos abiertos: primero el campo relleno, luego sus hitos en la lista única. */
      var leidos = await Hitos.leer();
      var deAsunto = asuntosDe(tipos, leidos);
      var respuestas = {};
      Object.keys(deAsunto).forEach(function (clave) {
        var r = aplanarHitos(copia(leidos.porAsunto[clave].hitos), planes[deAsunto[clave]]);
        if (Object.keys(r.valores).length) respuestas[clave] = r.valores;
      });
      if (Object.keys(respuestas).length) {
        await App.guardarRegistroFresco(function (registro) {
          Object.keys(respuestas).forEach(function (clave) {
            var f = registro.asuntos && registro.asuntos[clave];
            if (!f) return;
            var camposF = (f.campos && !Array.isArray(f.campos)) ? Object.assign({}, f.campos) : {};
            Object.keys(respuestas[clave]).forEach(function (nombre) {
              var cfg = planes[deAsunto[clave]].campos.filter(function (c) { return c.nombre === nombre; })[0];
              var k = cfg && Campos.claveDeCampo({ origen: 'propio', id: cfg.id });
              if (k && !(camposF[k] && String(camposF[k].valor || '').trim())) camposF[k] = { valor: respuestas[clave][nombre], enNombre: false };
            });
            f.campos = camposF;
          });
        });
      }
      paso = 'var enCurso = [];';
      var enCurso = [];
      await Hitos.cambiar(function (d) {
        Object.keys(deAsunto).forEach(function (clave) {
          var e = d.porAsunto[clave];
          if (!e) return;
          var r = aplanarHitos(e.hitos, planes[deAsunto[clave]]);
          if (!r.cambios) return;
          e.hitos = r.hitos.map(Hitos.normalizarHito);
          SoloSi.marcarLista(e.hitos, SoloSi.valoresDe(SoloSi.asuntoDeClave(clave)));
          var h = Hitos.recomputeEnCurso(e.hitos);
          if (h) enCurso.push({ clave: clave, hito: h });
        });
        return d;
      });
      for (var j = 0; j < enCurso.length; j++) await Hitos.aplicarEstadoDelHito(enCurso[j].clave, enCurso[j].hito);
      paso = '/* Y, por fin, las g';
      /* Y, por fin, las guías. */
      for (var k = 0; k < tipos.length; k++) {
        await GuiasDelCentro.guardarPasos(tipos[k], aplanarPasos(guias[tipos[k]], planes[tipos[k]]), { sinLlevar: true });
      }
      U.aviso('He quitado las preguntas de ' + tipos.length + (tipos.length === 1 ? ' guía' : ' guías') + ': ahora son ' + campos +
        (campos === 1 ? ' campo de lista' : ' campos de lista') + ' y los hitos llevan «Solo si». Los asuntos abiertos siguen como estaban.', 'bueno');
      return { tipos: tipos, preguntas: preguntas, campos: campos };
    } catch (e) {
      fallado = true;
      ultimoError = String((e && e.stack) || e);
      U.fallo('No he podido pasar las preguntas de las guías a «Solo si». Las guías no se han tocado', e);
      return null;
    } finally {
      enMarcha = false;
    }
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { convertir(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { convertir: convertir, pausar: pausar, listo: listo, error: function () { return ultimoError + ' [paso: ' + paso + ']'; }, ocupado: function () { return enMarcha; }, hayPreguntas: hayPreguntas, planificar: planificar, aplanarPasos: aplanarPasos, aplanarHitos: aplanarHitos };
})();
window.GuiasSinPreguntas = GuiasSinPreguntas;
