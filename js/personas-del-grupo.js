/* ============================================================
   personas-del-grupo.js — la tarjeta «Personas del grupo» de la ficha de un asunto
   de grupo (fila 293, docs/TRABAJO-EN-BLOQUE.md).

   Una fila por persona: qué se le ha generado, registrado y enviado. Nada de esto
   se guarda aparte: sale de lo que la aplicación ya guarda, en una sola pasada,
   sin leer un fichero por fila:
     - generado: `ficha.documentos[<número>]` con `generadoDe` = «plantilla|categoría|nombre»
       (fila 239), mientras su fichero siga en la carpeta;
     - registrado: los `registros` de ese mismo documento;
     - enviado: `ficha.enviosPorPersona` ({ documento, correo, cuando, quien }).
   `PersonasDelGrupo.estado(a, ficheros)` es esa cuenta, sin efectos.

   Se engancha por `Relacionados.pintarEnFicha` (js/relacionados-ficha.js).
   Un asunto normal con relacionados la usa en cuanto a alguno se le haya hecho algo.
   ============================================================ */
var PersonasDelGrupo = (function () {

  function $(id) { return document.getElementById(id); }
  function fichaDe(a) {
    var viva = a && window.App && App.E && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
    return viva || (a && a.ficha) || {};
  }
  function clave(categoria, nombre) { return categoria + '|' + U.normalizar(nombre); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function numeroDe(f) { return window.Numeros ? Numeros.delNombreDeDocumento(f) : ''; }

  /* ---------- la cuenta, sin efectos ---------- */

  /* { trabajos: [{ clave, tipo, fecha }] (del más viejo al último),
       personas: [{ categoria, nombre, hechos: { <trabajo>: { generado: { fecha, numero, fichero },
         registrado: ['26SM0412'], enviado: { fecha, correo, quien } | null } } }] } */
  function estado(a, ficheros) {
    var ficha = fichaDe(a);
    var docs = ficha.documentos || {};
    var porNumero = {};
    (ficheros || []).forEach(function (f) {
      var n = numeroDe(f);
      if (!n) return;
      if (!porNumero[n] || /\.pdf$/i.test(f)) porNumero[n] = f;   /* fila 294: con su PDF, el PDF */
    });
    var indice = {};
    var personas = (ficha.relacionados || []).map(function (r) {
      var p = { categoria: r.categoria, nombre: r.nombre, hechos: {} };
      indice[clave(r.categoria, r.nombre)] = p;
      return p;
    });
    var trabajos = {};
    var pdfDeTanda = {};   /* fila 295: el PDF `CORREO` de cada tanda de envío */
    (ficha.tandasDeEnvio || []).forEach(function (t) { if (t && t.id && t.pdf) pdfDeTanda[t.id] = t.pdf; });
    var elegido = {};   /* persona|trabajo -> número del documento que cuenta (el último) */

    Object.keys(docs).forEach(function (n) {
      var d = docs[n];
      if (!d || !d.generadoDe || !porNumero[n]) return;
      var partes = String(d.generadoDe).split('|');
      var plantilla = partes[0], persona = indice[clave(partes[1], partes.slice(2).join('|'))];
      if (!persona) return;
      var t = trabajos[plantilla] || (trabajos[plantilla] = { clave: plantilla, tipo: d.tipo || '', fecha: '', numero: '' });
      if ((d.fecha || '') > t.fecha) t.fecha = d.fecha || '';
      if (n > t.numero) t.numero = n;
      var ya = persona.hechos[plantilla];
      if (ya && (ya.generado.fecha > (d.fecha || '') || (ya.generado.fecha === (d.fecha || '') && ya.generado.numero > n))) return;
      persona.hechos[plantilla] = {
        generado: { fecha: d.fecha || '', numero: n, fichero: porNumero[n] },
        registrado: (d.registros || []).map(function (r) { return r.codigo; }).filter(Boolean),
        enviado: null
      };
      elegido[persona.categoria + '|' + persona.nombre + '|' + plantilla] = n;
    });

    (ficha.enviosPorPersona || []).forEach(function (e) {
      if (e.aviso) return;
      var n = numeroDe(e.documento), d = docs[n];
      if (!d || !d.generadoDe) return;
      var partes = String(d.generadoDe).split('|');
      var persona = indice[clave(partes[1], partes.slice(2).join('|'))];
      var celda = persona && persona.hechos[partes[0]];
      /* Solo el envío del documento que cuenta (el último): uno rehecho después no está enviado todavía. */
      if (!celda || celda.generado.numero !== n || (celda.enviado && celda.enviado.cuando > (e.cuando || ''))) return;
      celda.enviado = { fecha: String(e.cuando || '').slice(0, 10), cuando: e.cuando || '', correo: e.correo || '', quien: e.quien || '' };
      if (pdfDeTanda[e.tanda]) celda.enviado.pdf = pdfDeTanda[e.tanda];   /* fila 295: el PDF de su tanda */
    });

    /* Fila 295: cada aviso sin documento es un trabajo más, con solo la columna «Enviado». */
    (ficha.avisosEnBloque || []).forEach(function (v) {
      trabajos['aviso:' + v.id] = { clave: 'aviso:' + v.id, tipo: '', fecha: String(v.cuando || '').slice(0, 10), numero: '', aviso: v.asunto || '' };
    });
    (ficha.enviosPorPersona || []).forEach(function (e) {
      if (!e.aviso || !trabajos['aviso:' + e.aviso]) return;
      var i = String(e.persona || '').indexOf('|');
      var persona = i > 0 && indice[clave(e.persona.slice(0, i), e.persona.slice(i + 1))];
      if (persona) persona.hechos['aviso:' + e.aviso] = { generado: null, registrado: [],
        enviado: { fecha: String(e.cuando || '').slice(0, 10), cuando: e.cuando || '', correo: e.correo || '', quien: e.quien || '', pdf: pdfDeTanda[e.tanda] || '' } };
    });
    var lista = Object.keys(trabajos).map(function (k) { return trabajos[k]; });
    /* Del más viejo al último: por fecha y, el mismo día, por el número del documento. */
    lista.sort(function (x, y) {
      return x.fecha !== y.fecha ? (x.fecha < y.fecha ? -1 : 1) : (x.numero < y.numero ? -1 : (x.numero > y.numero ? 1 : 0));
    });
    return { trabajos: lista, personas: personas };
  }

  /* ¿Se le ha hecho algo a alguien? (un asunto normal usa la tabla solo entonces). */
  function conAlgoHecho(est) {
    return est.personas.some(function (p) { return Object.keys(p.hechos).length > 0; });
  }

  /* Las filas de un trabajo, con su filtro. Sin efectos. */
  function filas(est, trabajo, opciones) {
    var o = opciones || {};
    var texto = U.normalizar(o.texto || '');
    return est.personas.map(function (p, i) {
      var h = (trabajo && p.hechos[trabajo]) || null;
      return { i: i, persona: p, generado: h ? h.generado : null, registrado: h ? h.registrado : [], enviado: h ? h.enviado : null };
    }).filter(function (f) {
      if (texto && U.normalizar(f.persona.nombre).indexOf(texto) === -1) return false;
      if (o.soloFalta && f.generado && f.registrado.length && f.enviado) return false;
      return true;
    });
  }

  function cuentas(est, trabajo) {
    var c = { personas: est.personas.length, generados: 0, registrados: 0, enviados: 0 };
    est.personas.forEach(function (p) {
      var h = trabajo && p.hechos[trabajo];
      if (!h) return;
      if (h.generado) c.generados++;
      if (h.registrado.length) c.registrados++;
      if (h.enviado) c.enviados++;
    });
    return c;
  }

  function textoResumen(c, esAviso) {
    if (esAviso) return c.personas + (c.personas === 1 ? ' persona' : ' personas') + ' · ' + c.enviados + (c.enviados === 1 ? ' enviado' : ' enviados');
    return c.personas + (c.personas === 1 ? ' persona' : ' personas') + ' · ' + c.generados + (c.generados === 1 ? ' generado' : ' generados') +
      ' · ' + c.registrados + (c.registrados === 1 ? ' registrado' : ' registrados') + ' · ' + c.enviados + (c.enviados === 1 ? ' enviado' : ' enviados');
  }

  /* ---------- pintar ---------- */

  function fechaLarga(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? U.fechaCorta(m[3] + '/' + m[2] + '/' + m[1]).replace(/^0/, '') : '';   /* 7-oct-2026 */
  }
  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  var memoria = {};   /* por asunto: el trabajo mirado, lo escrito y «Solo lo que falta» */

  /* Algo generado o enviado a las personas de este asunto (una mirada a la ficha, sin leer la carpeta). */
  function conAlgo(a) {
    var f = fichaDe(a), docs = f.documentos || {};
    return Object.keys(docs).some(function (k) { return docs[k] && docs[k].generadoDe; }) || (f.enviosPorPersona || []).length > 0 || (f.avisosEnBloque || []).length > 0;
  }

  function aplica(a) {
    return !!(window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a));
  }

  function nombreDeTrabajo(t, plantillas) {
    var p = plantillas && plantillas.documentos && plantillas.documentos.filter(function (x) { return x.id === t.clave; })[0];
    if (t.aviso !== undefined) return 'Aviso: ' + t.aviso + (t.fecha ? ' · ' + fechaLarga(t.fecha) : '');
    var nombre = (p && p.nombre) || (t.tipo ? t.tipo.charAt(0) + t.tipo.slice(1).toLowerCase() : 'Documento');
    return nombre + (t.fecha ? ' · ' + fechaLarga(t.fecha) : '');
  }

  async function unidadesDe(est) {
    var salida = {};
    if (!est.personas.some(function (p) { return p.categoria === 'ALUMNADO'; }) || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
      var porNombre = {};
      fuente.lista.forEach(function (al) { porNombre[App.textoTercero(al)] = al.unidad || ''; });
      est.personas.forEach(function (p) { if (p.categoria === 'ALUMNADO') salida[p.nombre] = porNombre[p.nombre] || ''; });
      return salida;
    } catch (e) { return null; }
  }

  function celdaGenerado(f) {
    if (!f.generado) return '';
    return '<button type="button" class="enlace pg-abrir" data-solo-lectura data-fichero="' + U.escapar(f.generado.fichero) +
      '" title="Abrir su documento">' + U.escapar(fechaLarga(f.generado.fecha)) + '</button>';
  }

  /* Fila 295: la celda «Enviado»: fecha y dirección (abre el PDF de su tanda), «No ha salido: …» o «Pendiente de enviar». */
  function celdaEnviado(f, extra) {
    if (f.enviado) {
      var texto = U.escapar(fechaLarga(f.enviado.fecha) + (f.enviado.correo ? ' · ' + f.enviado.correo : ''));
      return f.enviado.pdf ? '<button type="button" class="enlace pg-abrir" data-solo-lectura data-fichero="' + U.escapar(f.enviado.pdf) + '" title="Abrir el correo enviado">' + texto + '</button>' : texto;
    }
    if (extra && extra.pendiente && (extra.esAviso || f.generado)) return '<span class="suave">Pendiente de enviar</span>';
    var fallo = extra && extra.fallos && extra.fallos[f.persona.categoria + '|' + f.persona.nombre];
    if (fallo && (extra.esAviso || f.generado)) return '<span class="pg-fallo">No ha salido: ' + U.escapar(fallo) + '</span>';
    return '';
  }

  function tablaHtml(est, vista, unidades, conRegistro, extra) {
    var esAviso = !!(extra && extra.esAviso);
    var cab = '<tr><th>Persona</th>' + (unidades ? '<th>Unidad</th>' : '') +
      (esAviso ? '' : '<th>Generado</th>') + (conRegistro && !esAviso ? '<th>Registrado</th>' : '') + '<th>Enviado</th><th></th></tr>';
    var cuerpo = vista.map(function (f) {
      var p = f.persona;
      return '<tr data-i="' + f.i + '"><td class="pg-persona">' + U.escapar(soloElNombre(p.nombre) || p.nombre) + '</td>' +
        (unidades ? '<td>' + U.escapar(unidades[p.nombre] || '') + '</td>' : '') +
        (esAviso ? '' : '<td class="pg-generado">' + celdaGenerado(f) + '</td>') +
        (conRegistro && !esAviso ? '<td class="pg-registrado">' + (f.registrado.length ? U.escapar(f.registrado.join(', ')) : (f.generado ? '<span class="suave">Pendiente</span>' : '')) + '</td>' : '') +
        '<td class="pg-enviado">' + celdaEnviado(f, extra) + '</td>' +
        '<td><button type="button" class="boton boton-chico pg-mas" data-solo-lectura title="Más acciones">⋯</button></td></tr>';
    }).join('');
    return '<table class="pg-tabla"><thead>' + cab + '</thead><tbody>' + cuerpo + '</tbody></table>' +
      (vista.length ? '' : '<p class="explica">Nadie con eso.</p>');
  }

  async function pintar(caja, a, abierto, alCambiar) {
    var turno = caja._turnoGrupo = (caja._turnoGrupo || 0) + 1;
    var ficha = fichaDe(a);
    var lista = ficha.relacionados || [];
    var mem = memoria[a.nombre] || (memoria[a.nombre] = { trabajo: '', texto: '', solo: false });
    /* Fila 294: con «Estos documentos se registran en Séneca», se miran antes los PDF sellados de la carpeta. */
    var conRegistro = !!(window.GrupoRegistro && GrupoRegistro.activo(a)), sinColocar = [];
    if (conRegistro && GrupoRegistro.hayPendientes(a)) sinColocar = (await GrupoRegistro.revisar(a)).sinColocar;
    var ficheros = [];
    try { ficheros = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { ficheros = []; }
    var plantillas = null;
    try { plantillas = window.Plantillas ? await Plantillas.cargar(App.E.gestor) : null; } catch (e1) { plantillas = null; }
    var est = estado(a, ficheros);
    var unidades = await unidadesDe(est);
    var envio = null;   /* fila 295: a cuántos se puede enviar ahora */
    var trabajoElegido = est.trabajos.some(function (t) { return t.clave === mem.trabajo; }) ? mem.trabajo : (est.trabajos.length ? est.trabajos[est.trabajos.length - 1].clave : '');
    if (window.GrupoEnviar) { try { envio = await GrupoEnviar.contar(a, est, trabajoElegido, conRegistro); } catch (eEnvio) { envio = null; } }
    if (turno !== caja._turnoGrupo || !caja.isConnected) return;

    /* El que se eligió a mano; si no, el último. */
    var trabajo = est.trabajos.some(function (t) { return t.clave === mem.trabajo; }) ? mem.trabajo
      : (est.trabajos.length ? est.trabajos[est.trabajos.length - 1].clave : '');
    var esAviso = String(trabajo).indexOf('aviso:') === 0;
    var pendiente = !!(ficha.envioPendiente && ficha.envioPendiente.trabajo === trabajo);
    var extraTabla = { esAviso: esAviso, pendiente: pendiente, fallos: window.GrupoEnviar ? GrupoEnviar.fallosDe(a) : null };
    caja.dataset.cuenta = String(lista.length);
    caja.dataset.resumen = textoResumen(cuentas(est, trabajo), esAviso);
    if (window.AsuntoDeGrupo && aplica(a)) AsuntoDeGrupo.titularTarjeta($('ficha-tarjetas'), { ficha: ficha });

    caja._ultimo = { a: a, abierto: abierto, alCambiar: alCambiar };   /* para repintar al terminar de generar desde la mesa del hito */
    var propia = abierto && !soloConsulta();
    U.conservandoLoEscrito(caja, function () {
      caja.innerHTML =
        '<div class="pg-cabeza"><strong class="pg-cuenta">' + U.escapar(textoResumen(cuentas(est, trabajo), esAviso)) + '</strong>' +
          (lista.length > 15 ? '<input type="search" class="campo pg-buscar" data-solo-lectura placeholder="Buscar por nombre" value="' + U.escapar(mem.texto) + '">' : '') +
          '<label class="pg-solo"><input type="checkbox" class="pg-solo-falta" data-solo-lectura' + (mem.solo ? ' checked' : '') + '> Solo lo que falta</label>' +
          (est.trabajos.length > 1 ? '<label class="pg-trabajo">Qué se mira <select class="campo pg-trabajo-lista" data-solo-lectura>' +
            est.trabajos.map(function (t) {
              return '<option value="' + U.escapar(t.clave) + '"' + (t.clave === trabajo ? ' selected' : '') + '>' + U.escapar(nombreDeTrabajo(t, plantillas)) + '</option>';
            }).join('') + '</select></label>' : '') +
          '<span class="pg-botones">' +
            '<button type="button" class="boton pg-generar"' + (propia ? '' : ' disabled') + '>Generar para todos ▾</button>' +
            '<button type="button" class="boton pg-anadir"' + (propia ? '' : ' disabled') + '>+ Añadir personas</button>' +
            (envio === null ? '' : '<button type="button" class="boton boton-principal pg-enviar"' + (propia && envio ? '' : ' disabled') + '>' +
              (pendiente ? 'Seguir enviando' : 'Enviar…') + ' (' + envio + ')</button>' +
              '<button type="button" class="boton pg-aviso"' + (propia ? '' : ' disabled') + '>Enviar un aviso…</button>') +
          '</span></div><div class="pg-menu oculto"></div>' +
        (window.GrupoRegistro ? '<div class="pg-registro">' + GrupoRegistro.html(est, trabajo, conRegistro, sinColocar) + '</div>' : '') +
        '<div class="pg-tabla-caja">' + (lista.length ? '' : '<p class="explica">Nadie en el grupo todavía.</p>') + '</div>';
      pintarCuerpo();
    });

    function pintarCuerpo() {
      var vista = filas(est, trabajo, { texto: mem.texto, soloFalta: mem.solo });
      var cajaTabla = caja.querySelector('.pg-tabla-caja');
      if (lista.length) cajaTabla.innerHTML = tablaHtml(est, vista, unidades, conRegistro, extraTabla);
    }
    if (window.GrupoRegistro) GrupoRegistro.enganchar(caja.querySelector('.pg-registro'), a, est, trabajo, sinColocar, propia, function () { pintar(caja, a, abierto, alCambiar); });
    var buscar = caja.querySelector('.pg-buscar');
    if (buscar) buscar.oninput = function () { mem.texto = buscar.value; pintarCuerpo(); };
    caja.querySelector('.pg-solo-falta').onchange = function (ev) { mem.solo = ev.target.checked; pintarCuerpo(); };
    var sel = caja.querySelector('.pg-trabajo-lista');
    if (sel) sel.onchange = function () { mem.trabajo = sel.value; pintar(caja, a, abierto, alCambiar); };
    caja.querySelector('.pg-anadir').onclick = async function () {
      var cambiado = await Relacionados.agregarVarios(a);
      if (cambiado && alCambiar) alCambiar();
    };
    var bEnviar = caja.querySelector('.pg-enviar'), bAviso = caja.querySelector('.pg-aviso');
    if (bEnviar) bEnviar.onclick = function () { GrupoEnviarPantalla.abrir(a, { trabajo: trabajo, conRegistro: conRegistro }); };
    if (bAviso) bAviso.onclick = function () { GrupoAvisos.abrir(a, '', conRegistro); };
    caja.querySelector('.pg-generar').onclick = function (ev) { ev.stopPropagation(); menuDeGenerar(caja, a, alCambiar, ev.currentTarget); };

    caja.querySelector('.pg-tabla-caja').onclick = function (ev) {
      var abrirDoc = ev.target.closest('.pg-abrir');
      if (abrirDoc) { abrirDocumento(a, abrirDoc.dataset.fichero); return; }
      var mas = ev.target.closest('.pg-mas');
      if (mas) menuDeFila(caja, a, est, trabajo, parseInt(mas.closest('tr').dataset.i, 10), mas, propia, alCambiar);
    };
  }

  /* ---------- las acciones ---------- */

  async function abrirDocumento(a, nombre) {
    try {
      var h = await a.handle.getFileHandle(nombre);
      if (window.Visor) Visor.abrir(h, nombre, { asunto: a, carpeta: a.handle });
    } catch (e) { U.aviso('Ya no está ese documento en la carpeta.', 'ambar'); }
  }

  function ponerMenu(caja, boton, botones) {
    var menu = caja.querySelector('.pg-menu');
    menu.innerHTML = '';
    botones.forEach(function (b) { menu.appendChild(b); });
    var r = boton.getBoundingClientRect(), c = caja.getBoundingClientRect();
    menu.style.top = (r.bottom - c.top + 2) + 'px';
    menu.style.left = Math.max(0, Math.min(r.left - c.left, c.width - 220)) + 'px';
    menu.classList.remove('oculto');
    function cerrar(ev) {
      if (ev && ev.type === 'keydown') { if (ev.key !== 'Escape') return; ev.stopPropagation(); }   /* Escape cierra solo el menú */
      if (ev && ev.type === 'mousedown' && menu.contains(ev.target)) return;
      menu.classList.add('oculto');
      document.removeEventListener('mousedown', cerrar, true);
      document.removeEventListener('keydown', cerrar, true);
    }
    document.addEventListener('mousedown', cerrar, true);   /* ya pasó el mousedown que lo abrió: el clic viene después */
    document.addEventListener('keydown', cerrar, true);
    menu.onclick = function () { cerrar(); };
  }

  function botonDeMenu(texto, alPulsar, apagado, titulo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pg-menu-boton';
    b.textContent = texto;
    if (apagado) b.disabled = true;
    if (titulo) b.title = titulo;
    b.onclick = alPulsar;
    return b;
  }

  function menuDeFila(caja, a, est, trabajo, i, boton, propia, alCambiar) {
    var persona = est.personas[i];
    var r = { categoria: persona.categoria, nombre: persona.nombre };
    var hecho = trabajo && persona.hechos[trabajo];
    var tieneAlgo = Object.keys(persona.hechos).some(function (k) { return persona.hechos[k].generado || persona.hechos[k].enviado; });
    ponerMenu(caja, boton, [
      botonDeMenu('Abrir su ficha', function () { abrirFicha(persona); }),
      botonDeMenu('Copiar el nombre', function (ev) {
        var t = window.Relacionados ? Relacionados.nombreEnOrdenNormal(r) : r.nombre;
        U.copiar(t, null, { avisoFallo: 'No he podido copiarlo. Es ' + t + '.' });
      }),
      botonDeMenu('Quitar del grupo', async function () {
        try {
          await App.anotarLista(a.nombre, 'relacionados', { quitar: [r] });
          if (alCambiar) alCambiar();
        } catch (e) { U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); }
      }, !propia || tieneAlgo, tieneAlgo ? 'Ya se le ha hecho algo: no se puede quitar' : ''),
      botonDeMenu('Volver a generar', async function () {
        try { await GrupoGenerar.volverAGenerar(a, r, hitoActual(a), trabajo, hecho.generado.numero); }
        catch (e) { U.fallo('No he podido volver a generarlo', e); }
        finally { if (alCambiar) alCambiar(); }
      }, !propia || !hecho || !hecho.generado || hecho.registrado.length > 0 || !!hecho.enviado || !window.GrupoGenerar,
      hecho && (hecho.registrado.length || hecho.enviado) ? 'Ya está registrado o enviado: no se puede volver a generar' : '')
    ]);
  }

  async function abrirFicha(persona) {
    try {
      var fuente = await Datos.cargar(App.E.datos, persona.categoria);
      var hallado = fuente.lista.filter(function (p) { return App.textoTercero(p) === persona.nombre; })[0] ||
        Datos.buscar(fuente.lista, soloElNombre(persona.nombre), 1)[0];
      if (!hallado) { U.aviso('No encuentro su ficha: ya no está en las listas.', 'ambar'); return; }
      if ($('filtro-personas')) $('filtro-personas').value = persona.categoria;
      App.ir('personas');
      if (App.pintarPersonas) await App.pintarPersonas();
      App.verFicha(hallado);
    } catch (e) { U.aviso('No he podido abrir su ficha: ' + U.mensajeDeError(e), 'malo'); }
  }

  /* «Generar para todos ▾»: las plantillas que ofrece la mesa del hito actual. */
  async function menuDeGenerar(caja, a, alCambiar, boton) {
    try { await Plantillas.cargarReciente(App.E.gestor, 60000); } catch (e) { /* con lo que haya */ }
    var h = hitoActual(a);
    var g = (window.HitosGenerar && HitosGenerar.grupos && HitosGenerar.grupos(a, h)) || { delPaso: [], delTipo: [] };
    var todas = g.delPaso.concat(g.delTipo);
    /* Fila 306: en un asunto de actividad, la plantilla de participación del profesorado no se ofrece. */
    if (window.Actividades && Actividades.tieneActividad(a)) todas = todas.filter(function (p) { return !Actividades.esPlantillaVieja(p); });
    if (!todas.length) { U.aviso('No hay ninguna plantilla de documento para este tipo de asunto.', 'ambar'); return; }
    ponerMenu(caja, boton, todas.map(function (p) {
      return botonDeMenu(p.nombre, async function () {
        boton.disabled = true;
        try { await GenerarParaRelacionados.generar(a, p, h); }
        catch (e) { U.fallo('No he podido generar los documentos', e); }
        finally { boton.disabled = false; if (alCambiar) alCambiar(); }
      });
    }));
  }

  function hitoActual(a) {
    try {
      var datos = Hitos.ultimosLeidos && Hitos.ultimosLeidos();
      var e = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
      var id = e && window.EstadoHito ? EstadoHito.idActual(e.hitos, datos.ajustes) : null;
      return id ? Hitos.buscar(e.hitos, id) : null;
    } catch (err) { return null; }
  }

  /* Terminó de generar o de enviar (desde donde sea): la tabla, si está a la vista, se pone al día sola. */
  function repintar(a) {
    var caja = $('ficha-relacionados');
    if (!caja || !caja._ultimo || caja._ultimo.a.nombre !== a.nombre || !caja.isConnected) return;
    if (window.GrupoEnviar && GrupoEnviar.enMarcha(a)) return;   /* fila 295: durante una tanda no se repinta nada; al acabar sí */
    pintar(caja, caja._ultimo.a, caja._ultimo.abierto, caja._ultimo.alCambiar);
  }

  /* Una persona cambia de nombre: sus documentos siguen siendo suyos (`generadoDe` lleva su nombre). */
  async function alRenombrar(asunto, categoria, viejo, nuevo) {
    var antes = '|' + categoria + '|' + viejo, despues = '|' + categoria + '|' + nuevo;
    await App.guardarRegistroFresco(function (registro) {
      var docs = ((registro.asuntos || {})[asunto] || {}).documentos || {};
      Object.keys(docs).forEach(function (n) {
        var g = docs[n] && docs[n].generadoDe;
        if (g && g.length > antes.length && g.slice(g.length - antes.length) === antes) {
          docs[n].generadoDe = g.slice(0, g.length - antes.length) + despues;
        }
      });
    });
  }

  return { alRenombrar: alRenombrar, repintar: repintar, estado: estado, filas: filas, cuentas: cuentas, textoResumen: textoResumen, conAlgoHecho: conAlgoHecho, conAlgo: conAlgo, celdaEnviado: celdaEnviado,
           aplica: aplica, pintar: pintar, hitoActual: hitoActual, fechaLarga: fechaLarga, nombreDeTrabajo: nombreDeTrabajo };
})();
window.PersonasDelGrupo = PersonasDelGrupo;
