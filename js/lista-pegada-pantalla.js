/* ============================================================
   lista-pegada-pantalla.js — el cuadro «Pegar una lista» (fila 296,
   docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md). Se pinta dentro del buscador
   de señalar varios (App.pintarBuscadorDeTercero, modo `multiple`), así
   que sale en los tres sitios que lo usan.

   `ListaPegada.abrir(sitio, o)`: `sitio` es el elemento donde se pinta,
   `o.categoria()` la categoría que hay elegida en el buscador, `o.marcar`
   señala personas en el buscador, `o.alSenalar(tipo, valor, lista)` es el
   de Relacionados (de ahí sale el origen del grupo, fila 293) y
   `o.alCerrar()` se llama al cerrarse el cuadro.

   Tres apartados: «Reconocidas» (con su marca), «Hay que elegir» (ámbar,
   con las candidatas) y «No encontradas» (rojo, con «Copiar»). Nada de lo
   pegado se guarda ni se manda a ningún sitio: solo las personas
   señaladas, y el grupo si se pide. El reconocimiento en sí está en
   js/lista-pegada.js.
   ============================================================ */
(function () {
  'use strict';
  var LP = window.ListaPegada;

  /* Los bytes de un CSV (utf-8, y si no es válido, Latin-1 como los de Séneca) o de un Excel, como texto de tabuladores. */
  LP.textoDeFichero = async function (nombre, bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (/\.xlsx$/i.test(nombre)) {
      var t = await TablasDatosLeer.deXlsx(b);
      return LP.deFilas([t.cabecera].concat(t.filas.map(function (f) { return t.cabecera.map(function (c) { return f.celdas[c]; }); })));
    }
    var texto;
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(b); }
    catch (e) { texto = new TextDecoder('windows-1252').decode(b); }
    if (/\.txt$/i.test(nombre)) return texto.replace(/^﻿/, '');
    return LP.deFilas(Datos.aTabla(texto).filas);
  };

  function opcionesDeCategoria(actual) {
    return Nombres.CATEGORIAS.map(function (c) {
      return '<option value="' + U.escapar(c) + '"' + (c === actual ? ' selected' : '') + '>' + U.escapar(c) + '</option>';
    }).join('') + '<option value="TODAS"' + (actual === 'TODAS' ? ' selected' : '') + '>En todas</option>';
  }

  async function personasDe(categoria) {
    var cats = categoria === 'TODAS' ? Nombres.CATEGORIAS : [categoria];
    var salida = {};
    for (var i = 0; i < cats.length; i++) {
      try { salida[cats[i]] = (await Datos.cargar(App.E.datos, cats[i])).lista || []; }
      catch (e) { salida[cats[i]] = []; }
    }
    return salida;
  }

  function copiarTexto(texto) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto); } catch (e) { /* sin portapapeles */ }
    return Promise.reject(new Error('sin portapapeles'));
  }

  LP.abrir = function (sitio, o) {
    var categoriaInicial = (o.categoria && o.categoria()) || 'ALUMNADO';
    var modelo = null;   /* { enc: [{...encontrada, marcada}], dud: [...], no: [...], cabecera } */
    var guardar = { si: false, nombre: '' };   /* «Guardar también como grupo»: sobrevive a repintar el resultado */
    var sustituir = null;   /* el grupo con ese nombre, a la espera de que se confirme sustituirlo */

    var panel = document.createElement('div');
    panel.className = 'lp-cuadro';
    panel.innerHTML =
      '<label class="etiqueta" for="lp-texto">Pega aquí la lista: una persona por línea.</label>' +
      '<textarea id="lp-texto" class="campo lp-texto" rows="7" spellcheck="false"></textarea>' +
      '<div class="lp-fila"><label class="etiqueta" for="lp-fichero">o elige un fichero</label>' +
        '<input type="file" id="lp-fichero" accept=".csv,.txt,.xlsx"></div>' +
      '<div class="lp-fila"><label class="etiqueta" for="lp-categoria">Buscar en</label>' +
        '<select id="lp-categoria" class="campo">' + opcionesDeCategoria(categoriaInicial) + '</select>' +
        '<button type="button" class="boton boton-principal" id="lp-reconocer">Reconocer</button>' +
        '<button type="button" class="boton" id="lp-cerrar">Cancelar</button></div>' +
      '<div id="lp-resultado"></div>';
    sitio.appendChild(panel);
    var texto = panel.querySelector('#lp-texto');
    var resultado = panel.querySelector('#lp-resultado');
    texto.focus();

    function cerrar() {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      if (o.alCerrar) o.alCerrar();
    }
    panel.querySelector('#lp-cerrar').onclick = cerrar;

    panel.querySelector('#lp-fichero').onchange = async function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      try {
        texto.value = await LP.textoDeFichero(f.name, new Uint8Array(await f.arrayBuffer()));
        await reconocer();
      } catch (e) { U.aviso('No he podido leer ese fichero: ' + U.mensajeDeError(e), 'malo'); }
    };

    async function reconocer() {
      var categoria = panel.querySelector('#lp-categoria').value;
      resultado.innerHTML = '<div class="explica">Reconociendo…</div>';
      var r = LP.reconocer(texto.value, await personasDe(categoria), categoria);
      modelo = {
        enc: r.encontradas.map(function (e) { return Object.assign({ marcada: true }, e); }),
        dud: r.dudosas, no: r.noEncontradas.slice(), cabecera: r.cabecera
      };
      sustituir = null;
      pintar();
    }
    panel.querySelector('#lp-reconocer').onclick = reconocer;

    /* Una dudosa elegida pasa a «Reconocidas» (si esa persona ya estaba, no se repite). */
    function elegir(i, c) {
      var d = modelo.dud.splice(i, 1)[0];
      if (c && !modelo.enc.some(function (e) { return e.persona === c.persona; })) {
        modelo.enc.push({ marcada: true, linea: d.linea, categoria: c.categoria, nombre: c.nombre, persona: c.persona });
      }
      if (!c) modelo.no.push(d.linea);
      pintar();
    }

    function pintar() {
      var marcadas = modelo.enc.filter(function (e) { return e.marcada; });
      var h = '';
      if (modelo.cabecera) h += '<p class="nota">La primera línea («' + U.escapar(modelo.cabecera) + '») es una cabecera: no cuenta.</p>';

      h += '<div class="lp-apartado lp-ok"><h4>Reconocidas (' + modelo.enc.length + ')</h4>';
      h += modelo.enc.map(function (e, i) {
        return '<label class="lp-fila-persona"><input type="checkbox" class="lp-marca" data-i="' + i + '"' + (e.marcada ? ' checked' : '') + '>' +
          '<span><span class="lp-nombre">' + U.escapar(e.nombre) + '</span>' +
          '<small class="lp-linea">' + U.escapar(e.linea) + '</small></span></label>';
      }).join('') || '<p class="nota">Ninguna.</p>';
      h += '</div>';

      if (modelo.dud.length) {
        h += '<div class="lp-apartado lp-dudosas"><h4>Hay que elegir (' + modelo.dud.length + ')</h4>';
        h += modelo.dud.map(function (d, i) {
          return '<div class="lp-duda"><div class="lp-linea-pegada">' + U.escapar(d.linea) + ' <small>' + U.escapar(d.motivo) + '</small></div>' +
            d.candidatas.map(function (c, k) {
              return '<button type="button" class="boton lp-candidata" data-i="' + i + '" data-k="' + k + '">' + U.escapar(c.nombre) +
                (c.unidad ? ' <small>' + U.escapar(c.unidad) + '</small>' : '') + '</button>';
            }).join('') +
            '<button type="button" class="boton lp-ninguna" data-i="' + i + '">Ninguna</button></div>';
        }).join('');
        h += '</div>';
      }

      if (modelo.no.length) {
        h += '<div class="lp-apartado lp-no"><h4>No encontradas (' + modelo.no.length + ')</h4>' +
          '<div class="lp-no-lineas">' + modelo.no.map(function (l) { return '<div>' + U.escapar(l) + '</div>'; }).join('') + '</div>' +
          '<button type="button" class="boton" id="lp-copiar">Copiar</button></div>';
      }

      h += '<div class="lp-guardar"><label><input type="checkbox" id="lp-guardar-si"' + (guardar.si ? ' checked' : '') + '> Guardar también como grupo, con el nombre…</label>' +
        '<input id="lp-guardar-nombre" class="campo" maxlength="60" value="' + U.escapar(guardar.nombre) + '"' + (guardar.si ? '' : ' disabled') + '></div>';
      h += '<div id="lp-sustituir" class="lp-sustituir oculto"></div>';
      h += '<div class="lp-pie"><button type="button" class="boton boton-principal" id="lp-senalar"' + (marcadas.length ? '' : ' disabled') + '>' +
        'Señalar las ' + marcadas.length + '</button>' +
        (modelo.dud.length ? '<span class="nota">' + (modelo.dud.length === 1 ? 'Una sin elegir se queda fuera.' : modelo.dud.length + ' sin elegir se quedan fuera.') + '</span>' : '') + '</div>';
      resultado.innerHTML = h;

      Array.prototype.forEach.call(resultado.querySelectorAll('.lp-marca'), function (c) {
        c.onchange = function () { modelo.enc[+c.dataset.i].marcada = c.checked; pintar(); };
      });
      Array.prototype.forEach.call(resultado.querySelectorAll('.lp-candidata'), function (b) {
        b.onclick = function () { elegir(+b.dataset.i, modelo.dud[+b.dataset.i].candidatas[+b.dataset.k]); };
      });
      Array.prototype.forEach.call(resultado.querySelectorAll('.lp-ninguna'), function (b) {
        b.onclick = function () { elegir(+b.dataset.i, null); };
      });
      var copiar = resultado.querySelector('#lp-copiar');
      if (copiar) copiar.onclick = function () {
        copiarTexto(modelo.no.join('\n')).then(function () { U.aviso('Copiadas.', 'bueno'); },
          function () { U.aviso('No he podido copiar: cópialas a mano.', 'malo'); });
      };
      var si = resultado.querySelector('#lp-guardar-si'), nombre = resultado.querySelector('#lp-guardar-nombre');
      si.onchange = function () { guardar.si = si.checked; nombre.disabled = !si.checked; if (si.checked) nombre.focus(); };
      nombre.oninput = function () { guardar.nombre = nombre.value; };
      resultado.querySelector('#lp-senalar').onclick = function () { senalar(si.checked ? U.limpiarNombre(nombre.value) : ''); };
    }

    /* Guarda el grupo propio si se ha pedido; con un nombre que ya existe, pregunta aquí mismo si lo sustituye. */
    async function guardarGrupo(nombre, miembros) {
      var igual = (Grupos.lista() || []).filter(function (g) { return U.normalizar(g.nombre) === U.normalizar(nombre); })[0];
      if (!igual) { await Grupos.crear(nombre, miembros); return true; }
      if (sustituir !== igual) {
        sustituir = igual;
        var caja = resultado.querySelector('#lp-sustituir');
        caja.className = 'lp-sustituir';
        caja.innerHTML = 'Ya hay un grupo llamado «' + U.escapar(igual.nombre) + '». ' +
          '<button type="button" class="boton boton-principal" id="lp-sustituir-si">Sustituirlo</button>' +
          '<button type="button" class="boton" id="lp-sustituir-no">No</button>';
        caja.querySelector('#lp-sustituir-no').onclick = function () { sustituir = null; caja.className = 'lp-sustituir oculto'; };
        caja.querySelector('#lp-sustituir-si').onclick = function () { senalar(nombre); };
        return false;
      }
      await Grupos.ponerMiembros(igual.id, miembros);
      return true;
    }

    async function senalar(nombreGrupo) {
      var elegidas = modelo.enc.filter(function (e) { return e.marcada; });
      if (!elegidas.length) return;
      var miembros = elegidas.map(function (e) { return { categoria: e.categoria, nombre: e.nombre }; });
      if (nombreGrupo) {
        try { if (!(await guardarGrupo(nombreGrupo, miembros))) return; }
        catch (e) { U.aviso('No he podido guardar el grupo: ' + U.mensajeDeError(e), 'malo'); return; }
        if (window.App && App.pintarGruposPersonas) { try { App.pintarGruposPersonas(); } catch (e2) { /* Ajustes aún no está pintado */ } }
      }
      if (o.alSenalar) o.alSenalar('lista', nombreGrupo, elegidas.map(function (e) { return e.persona; }));
      o.marcar(elegidas.map(function (e) { return { categoria: e.categoria, nombre: e.nombre, persona: e.persona }; }));
      if (modelo.dud.length) U.aviso((modelo.dud.length === 1 ? 'Una se ha quedado fuera' : modelo.dud.length + ' se han quedado fuera') + ': había que elegir.', 'malo');
      cerrar();
    }
  };
})();
