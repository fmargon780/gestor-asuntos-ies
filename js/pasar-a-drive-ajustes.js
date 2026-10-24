/* ============================================================
   pasar-a-drive-ajustes.js — «Pasar las carpetas a Google Drive» en
   Ajustes → Mantenimiento (fila 458, docs/PASAR-A-DRIVE.md). El traslado
   vive en js/pasar-a-drive.js; aquí solo se pinta y se encadenan los pasos.

   Solo para el perfil Administración y nunca en «solo consultar».
   ============================================================ */
var PasarADriveAjustes = (function () {
  'use strict';

  var caja = null;        /* #pasar-a-drive-ajustes */
  var zona = null;        /* donde va lo que cambia de un paso a otro */
  var enMarcha = false;   /* mientras haya un paso en pantalla, pintar() no lo borra */

  function boton(texto, alPulsar, id) {
    var b = document.createElement('button');
    b.className = 'boton';
    b.textContent = texto;
    if (id) b.id = id;
    b.onclick = alPulsar;
    return b;
  }

  function parrafo(texto, clase) {
    var p = document.createElement('p');
    p.className = clase || 'nota';
    p.textContent = texto;
    return p;
  }

  function limpiar() { zona.innerHTML = ''; return zona; }

  function filaDeBotones(lista) {
    var f = document.createElement('div');
    f.className = 'acciones-fila';
    lista.forEach(function (b) { f.appendChild(b); });
    return f;
  }

  function lista(items) {
    var ul = document.createElement('ul');
    ul.className = 'traslado-lista';
    items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    return ul;
  }

  function mostrarError(texto, botones) {
    var z = limpiar();
    var p = parrafo(texto, 'nota traslado-error');
    p.setAttribute('role', 'alert');
    z.appendChild(p);
    if (botones && botones.length) z.appendChild(filaDeBotones(botones));
  }

  /* ---------- la barra de progreso ---------- */

  function conBarra(titulo) {
    var z = limpiar();
    z.appendChild(parrafo(titulo, 'nota traslado-titulo'));
    var barra = document.createElement('progress');
    barra.id = 'traslado-barra';
    barra.max = 100; barra.value = 0;
    z.appendChild(barra);
    var nombre = parrafo('', 'nota traslado-nombre');
    nombre.id = 'traslado-nombre';
    z.appendChild(nombre);
    return function (p) {
      barra.value = p.total ? Math.round(100 * p.hechos / p.total) : 100;
      nombre.textContent = p.nombre ? p.hechos + ' de ' + p.total + ' · ' + p.nombre : '';
    };
  }

  /* ---------- los pasos ---------- */

  async function pasoComenzar(seguirDeTodasFormas) {
    enMarcha = true;
    try {
      var quienes = seguirDeTodasFormas ? [] : await PasarADrive.dentroDeLaApp();
      if (quienes.length) {
        var z = limpiar();
        var p = parrafo(quienes.join(', ') + ' está dentro de la app. Pídele que la cierre y vuelve a pulsar.', 'nota traslado-aviso');
        p.id = 'traslado-presencia';
        z.appendChild(p);
        z.appendChild(filaDeBotones([
          boton('Seguir de todas formas', function () { pasoComenzar(true); }, 'traslado-seguir-igual'),
          boton('Cancelar', function () { enMarcha = false; pintar(caja); })
        ]));
        return;
      }
      await PasarADrive.cerrar();
      pasoSenalar();
    } catch (e) {
      mostrarError('No puedo empezar: ' + U.mensajeDeError(e), [boton('Volver', function () { enMarcha = false; pintar(caja); })]);
    }
  }

  function pasoSenalar() {
    var z = limpiar();
    z.appendChild(parrafo('Señala la carpeta «Mi unidad» de Google Drive (en el disco puede llamarse «Mi unidad» o «My Drive»). ' +
      'Dentro se crearán «asuntos vivos», «ARCHIVO» y la carpeta de la copia sin internet.'));
    z.appendChild(filaDeBotones([
      boton('Señalar «Mi unidad»', pasoContar, 'traslado-senalar'),
      boton('Cancelar', pasoCancelar, 'traslado-cancelar')
    ]));
  }

  async function pasoContar() {
    var drive;
    try { drive = await PasarADrive.elegirDrive(); }
    catch (e) {
      if (e && e.name === 'AbortError') return;
      mostrarError(U.mensajeDeError(e), [boton('Señalar otra vez', pasoContar), boton('Cancelar', pasoCancelar)]);
      return;
    }
    limpiar().appendChild(parrafo('Contando lo que hay que copiar…'));
    try {
      var r = await PasarADrive.preparar(drive);
      pasoEmpezar(r);
    } catch (e) {
      mostrarError('No he podido preparar el traslado: ' + U.mensajeDeError(e), [boton('Cancelar', pasoCancelar)]);
    }
  }

  function pasoEmpezar(r) {
    var z = limpiar();
    var p = parrafo('', 'nota traslado-cuenta');
    p.id = 'traslado-cuenta';
    p.appendChild(document.createTextNode('Vas a copiar ' + r.documentos + ' documentos (' + gbTexto(r.bytes) + ' GB). La cuenta común tiene 50 GB. ' +
      'Mira el espacio libre aquí antes de seguir: '));
    var a = document.createElement('a');
    a.href = r.urlEspacio; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = r.urlEspacio;
    p.appendChild(a);
    z.appendChild(p);
    z.appendChild(filaDeBotones([
      boton('Empezar', pasoCopiar, 'traslado-empezar'),
      boton('Cancelar', pasoCancelar, 'traslado-cancelar')
    ]));
  }

  function gbTexto(bytes) {
    var g = bytes / (1024 * 1024 * 1024);
    return (g >= 0.1 ? g.toFixed(1) : g.toFixed(2)).replace('.', ',');
  }

  async function pasoCopiar() {
    var progreso = conBarra('Copiando…');
    try {
      await PasarADrive.copiar(progreso);
    } catch (e) {
      mostrarError('El traslado se ha cortado: ' + U.mensajeDeError(e) + ' Hay un traslado a medias; lo copiado ya está apuntado.',
        [boton('Seguir', pasoSeguir, 'traslado-seguir'), boton('Cancelar el traslado', pasoCancelar, 'traslado-cancelar')]);
      return;
    }
    await pasoComprobar();
  }

  async function pasoComprobar() {
    var progreso = conBarra('Comprobando que no falta nada…');
    var c;
    try { c = await PasarADrive.comprobar(progreso); }
    catch (e) {
      mostrarError('No he podido comprobar la copia: ' + U.mensajeDeError(e), [boton('Volver a comprobar', pasoComprobar), boton('Cancelar el traslado', pasoCancelar)]);
      return;
    }
    if (c.faltan.length) {
      var z = limpiar();
      var p = parrafo('Faltan ' + c.faltan.length + ' ficheros. No sigo hasta que estén todos:', 'nota traslado-error');
      p.id = 'traslado-faltan';
      z.appendChild(p);
      z.appendChild(lista(c.faltan.slice(0, 50).map(function (x) { return x.ruta + ' (' + x.motivo + ')'; })));
      if (c.faltan.length > 50) z.appendChild(parrafo('… y ' + (c.faltan.length - 50) + ' más.'));
      z.appendChild(filaDeBotones([
        boton('Reintentar lo que falta', async function () {
          var progreso2 = conBarra('Copiando lo que faltaba…');
          try {
            var c2 = await PasarADrive.reintentar(c.faltan, progreso2);
            if (c2.faltan.length) { c.faltan = c2.faltan; return pasoComprobarLista(c2); }
            await pasoCambiar(c2);
          } catch (e) { mostrarError('Sigue fallando: ' + U.mensajeDeError(e), [boton('Cancelar el traslado', pasoCancelar)]); }
        }, 'traslado-reintentar'),
        boton('Cancelar el traslado', pasoCancelar, 'traslado-cancelar')
      ]));
      return;
    }
    await pasoCambiar(c);
  }

  function pasoComprobarLista(c) {
    var z = limpiar();
    var p = parrafo('Faltan ' + c.faltan.length + ' ficheros. No sigo hasta que estén todos:', 'nota traslado-error');
    p.id = 'traslado-faltan';
    z.appendChild(p);
    z.appendChild(lista(c.faltan.slice(0, 50).map(function (x) { return x.ruta + ' (' + x.motivo + ')'; })));
    z.appendChild(filaDeBotones([
      boton('Reintentar lo que falta', function () { pasoComprobar(); }, 'traslado-reintentar'),
      boton('Cancelar el traslado', pasoCancelar, 'traslado-cancelar')
    ]));
  }

  async function pasoCambiar(c) {
    var info;
    try { info = await PasarADrive.cambiar(); }
    catch (e) {
      mostrarError('Las copias están bien, pero no he podido terminar el cambio: ' + U.mensajeDeError(e),
        [boton('Volver a intentarlo', function () { pasoCambiar(c); })]);
      return;
    }
    pintarArrastre({ noUsar: info.noUsar, arrastrar: info.lista, archivoViejo: info.archivoViejo, copiaVieja: info.copiaVieja },
      'Copiados ' + c.documentos + ' documentos. No falta ninguno.', info);
  }

  /* El paso 5: qué arrastrar con el explorador de Windows. `a` es lo apuntado en el avance. */
  function pintarArrastre(a, titulo, info) {
    var z = limpiar();
    if (titulo) {
      var t = parrafo(titulo, 'nota traslado-titulo');
      t.id = 'traslado-resultado';
      z.appendChild(t);
    }
    z.appendChild(parrafo('Ahora hay que sacar las carpetas viejas de Dropbox. El navegador no puede moverlas: arrástralas tú con el explorador de ' +
      'Windows (dentro de Dropbox es instantáneo) a la carpeta «' + a.noUsar + '», que está dentro de «asuntos vivos». No borres nada.'));
    var cosas = (a.arrastrar || []).map(function (n) { return n === '_GESTOR' ? '_GESTOR' : n; });
    if (a.archivoViejo) cosas.push(a.archivoViejo + ' (el ARCHIVO viejo; suele estar junto a «asuntos vivos»)');
    if (a.copiaVieja) cosas.push(a.copiaVieja + ' (la copia sin internet vieja; suele estar en Dropbox, junto a «asuntos vivos»)');
    var ul = lista(cosas);
    ul.id = 'traslado-arrastrar';
    z.appendChild(ul);
    var botones = [boton('Ya las he arrastrado', pasoArrastradas, 'traslado-arrastradas')];
    if (window.Demo && Demo.activo && Demo.activo()) botones.push(boton('(Demostración) Arrastrar las carpetas viejas', arrastrarEnLaDemo, 'traslado-demo-arrastrar'));
    z.appendChild(filaDeBotones(botones));
    var aviso = parrafo('', 'nota traslado-aviso');
    aviso.id = 'traslado-quedan';
    z.appendChild(aviso);
  }

  async function pasoArrastradas() {
    var r;
    try { r = await PasarADrive.comprobarArrastre(); }
    catch (e) { U.aviso('No he podido comprobarlo: ' + U.mensajeDeError(e), 'malo'); return; }
    var aviso = document.getElementById('traslado-quedan');
    if (r.quedan.length) {
      aviso.textContent = 'Todavía queda fuera de «NO USAR»: ' + r.quedan.join(', ') + '.';
      return;
    }
    var a = await PasarADrive.estado();
    var info = PasarADrive.traslado();
    var z = limpiar();
    var texto = parrafo(PasarADrive.textoFinal({
      noUsar: (info && info.avance.noUsar) || (a.avance && a.avance.noUsar) || '',
      copiaNueva: (info && info.dCopia && info.dCopia.name) || '', rutaCopia: ''
    }), 'nota traslado-final');
    texto.id = 'traslado-final';
    z.appendChild(texto);
    enMarcha = false;
  }

  /* Solo en la demostración: no hay explorador de Windows, así que se hace aquí lo que harían ellos. */
  async function arrastrarEnLaDemo() {
    var t = PasarADrive.traslado();
    if (!t) return;
    var noUsar = await t.o.abiertos.getDirectoryHandle(t.avance.noUsar);
    var nombres = t.avance.arrastrar || [];
    for (var i = 0; i < nombres.length; i++) {
      var h = t.o.abiertos._hijos && t.o.abiertos._hijos.get(nombres[i]);
      if (h) { noUsar._hijos.set(nombres[i], h); t.o.abiertos._hijos.delete(nombres[i]); }
    }
    var cerrar = function (c) {
      if (!c) return;
      var fallo = function () { var e = new Error('no existe'); e.name = 'NotFoundError'; throw e; };
      c.entries = fallo; c.values = fallo;
    };
    cerrar(t.o.archivo); cerrar(t.o.copia);
    U.aviso('Demostración: carpetas viejas movidas a «' + t.avance.noUsar + '».', 'bueno');
  }

  async function pasoSeguir() {
    enMarcha = true;
    limpiar().appendChild(parrafo('Hay un traslado a medias. Siguiendo donde lo dejó…'));
    try {
      await PasarADrive.reanudar();
    } catch (e) {
      mostrarError('No he podido seguir: ' + U.mensajeDeError(e), [boton('Seguir', pasoSeguir, 'traslado-seguir'), boton('Cancelar el traslado', pasoCancelar, 'traslado-cancelar')]);
      return;
    }
    await pasoCopiar();
  }

  async function pasoCancelar() {
    try { await PasarADrive.cancelar(); } catch (e) { U.aviso('No he podido cancelar: ' + U.mensajeDeError(e), 'malo'); return; }
    U.aviso('Traslado cancelado. Lo copiado en Google Drive se queda y no se usa.', 'bueno');
    enMarcha = false;
    pintar(caja);
  }

  /* ---------- lo que se ve al entrar en Ajustes ---------- */

  async function pintar(c) {
    if (!c || !window.PasarADrive) return;
    if (enMarcha) return;
    caja = c;
    c.innerHTML = '';
    if (window.Perfil && Perfil.esDirectivo()) return;   /* solo Administración */
    var enSolo = !!(window.SoloConsulta && SoloConsulta.activo());

    var titulo = document.createElement('div');
    titulo.className = 'fila-tipo';
    titulo.innerHTML = '<span class="nombre-tipo">Pasar las carpetas a Google Drive</span>';
    c.appendChild(titulo);
    zona = document.createElement('div');
    zona.id = 'traslado-zona';
    c.appendChild(zona);

    var e;
    try { e = await PasarADrive.estado(); } catch (err) { e = { vista: 'inicio' }; }
    if (e.vista === 'arrastrar') {
      enMarcha = true;
      pintarArrastre(e.avance);
      return;
    }
    if (e.vista === 'hecho') { zona.appendChild(parrafo('Las carpetas ya están en Google Drive.', 'nota traslado-hecho')); return; }
    if (e.vista === 'ajeno') { zona.appendChild(parrafo('Se están pasando las carpetas a Google Drive. Espera a que termine.', 'nota traslado-aviso')); return; }
    if (e.vista === 'amedias') {
      zona.appendChild(parrafo('Hay un traslado a medias.', 'nota traslado-aviso'));
      var f = filaDeBotones([boton('Seguir', pasoSeguir, 'traslado-seguir'), boton('Cancelar el traslado', pasoCancelar, 'traslado-cancelar')]);
      if (enSolo) f.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      zona.appendChild(f);
      return;
    }
    zona.appendChild(parrafo('Copia a Google Drive las carpetas de cada asunto, el ARCHIVO, _GESTOR y la copia sin internet, comprueba que no falta ' +
      'nada y, desde entonces, la aplicación trabaja allí. Hazlo en el instituto, una tarde sin trabajo. Se puede cortar y seguir.'));
    var inicio = boton('Pasar a Drive', function () { pasoComenzar(false); }, 'traslado-pasar');
    if (enSolo) { inicio.disabled = true; inicio.setAttribute('data-motivo-clave', 'en-solo-consultar'); }
    zona.appendChild(filaDeBotones([inicio]));
  }

  return { pintar: pintar };
})();
window.PasarADriveAjustes = PasarADriveAjustes;
