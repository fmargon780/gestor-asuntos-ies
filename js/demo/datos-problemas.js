/* ============================================================
   demo/datos-problemas.js — lo que enseña Ajustes → Problemas en la copia de pruebas (fila 291,
   docs/PROBLEMAS-CON-SU-SOLUCION.md), además del asunto sin carpeta de la fila 288
   (`crearFichaSinCarpeta` en js/demo/datos.js):
     - la carpeta que alguien le cambió de nombre a mano (sin tildes y con otro tipo), sin asunto:
       la que se elige al «Buscar su carpeta»;
     - hitos guardados de un asunto que ya no existe y, para ver que no salen dos veces, hitos
       del asunto que ha perdido su carpeta;
     - una lista guardada a la vez en dos ordenadores (la de tipos de documento);
     - el fichero de alumnado de hace tres meses;
     - un script de Gmail visto con una versión anterior (en la demostración, «Probar» lo deja al día);
     - el contacto de los asuntos abiertos ya guardado, para que «Problemas» enseñe solo lo que se quiere.
   Todo inventado. Lo llama `Demo.datos.construir` (js/demo/datos.js) con los tipos ya creados.
   ============================================================ */
(function () {
  'use strict';

  function hace(dias) {
    var d = new Date(Date.now() - dias * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  async function construir(tipos, sinCarpeta) {
    if (sinCarpeta) {
      await Carpetas.crear(App.E.abiertos, sinCarpeta.replace(' FACTURA ', ' FACTURAS ').replace('Ferretería Los Álamos', 'Ferreteria Los Alamos'));
    }
    var tercero = Nombres.terceroEmpresa({ nombre: 'Papelería Nova', nif: '11223344B' });
    var viejo = Nombres.montarAsunto({
      fecha: hace(150), tipo: Nombres.tipoParaCarpeta(tipos.FACTURA), categoria: 'EMPRESAS',
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: ''
    }).nombre;
    function hito(id, titulo, estado) {
      return Hitos.normalizarHito({ id: id, titulo: titulo, estado: estado, clase: 'paso', desde: hace(40) });
    }
    await Hitos.cambiar(function (d) {
      d.porAsunto[viejo] = { creados: hace(150), hitos: [hito('demo-viejo-1', 'Pedir la factura', 'hecho'), hito('demo-viejo-2', 'Pagar la factura', 'encurso')] };
      if (sinCarpeta) d.porAsunto[sinCarpeta] = { creados: hace(40), hitos: [hito('demo-sc-1', 'Recibir la factura', 'encurso')] };
      return d;
    });
    await Carpetas.escribirTexto(App.E.gestor, 'tipos-documento (copia en conflicto de PC-Secretaría 2026-10-05).json', JSON.stringify({ _esquema: 1, tipos: [] }));
    if (window.Conflictos) await Conflictos.revisar();
    try { (await App.E.datos.getFileHandle('RegAlum.csv'))._modificado = Date.now() - 90 * 86400000; } catch (e) { /* sin fichero, ya sale «falta» */ }
    if (window.Frescura) await Frescura.repasar();
    if (window.CorreoEnviar) CorreoEnviar._registrarVersionScript('20-sep-2026 · fila 180');
    try {
      if (window.ContactoMigracion) await ContactoMigracion._rellenarTodos();
      await App.guardarRegistroFresco(function (registro) {
        Object.keys(registro.asuntos).forEach(function (k) {
          var f = registro.asuntos[k];
          if (f.estado === 'abierto' && !f.contacto && f.categoria && f.tercero) f.contacto = Datos.fotoDeContacto({ nombre: f.tercero }, f.categoria);
        });
      });
    } catch (e) { /* si no se puede, sale su tarjeta */ }
    /* Ya montado todo: las tarjetas, calculadas a la fuerza (el cálculo de fondo espera a que no haya guardados). */
    if (window.Problemas) await Problemas.calcular({ forzar: true });
  }

  window.Demo = window.Demo || {};
  window.Demo.problemas = { construir: construir };
})();
