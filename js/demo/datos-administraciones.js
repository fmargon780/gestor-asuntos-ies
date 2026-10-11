/* ============================================================
   demo/datos-administraciones.js — las Administraciones inventadas de la
   copia de pruebas (fila 329, docs/ENTREGAR-ADMINISTRACIONES-AL-CENTRO-DE-DATOS.md):
   cuatro, para que haya algo que entregar al Centro de datos.

     - «Delegación de Mentira» y «Servicio de Prueba», dos organismos que
       dependen del mismo superior («Consejería Inventada»). El primero, con
       un nombre oficial anterior y dos niveles de departamentos
       (Planificación > Escolarización, con persona de contacto).
     - «IES Ejemplo» (29000001) y «CEIP Falso» (29000002), dos centros.

   Todo inventado: códigos que no existen y correos de example.com.
   `Demo.administraciones.escribir(dirDatos)` lo llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  async function escribir(d) {
    var contenido = {
      superiores: [{ id: 'sup-demo1', nombre: 'Consejería Inventada', antes: [{ nombre: 'Consejería de Antes', hasta: '2026-07-01' }] }],
      organismos: [
        { id: 'org-demo1', clase: 'organismo', corto: 'Delegación de Mentira', oficial: 'Delegación Territorial Inventada de Educación', dir3: 'A00000001',
          codigoCentro: '', superior: 'sup-demo1', correo: 'delegacion@example.com', telefono: '600 000 001', direccion: 'Calle Falsa, 1',
          antes: [{ nombre: 'Delegación Provincial Inventada', hasta: '2026-09-25' }],
          departamentos: [{ id: 'dep-demo1', nombre: 'Planificación', correo: 'planificacion@example.com', telefono: '', contacto: 'Ana Prueba', dir3: '',
            hijos: [{ id: 'dep-demo2', nombre: 'Escolarización', correo: '', telefono: '600 000 002', contacto: '', dir3: '', hijos: [] }] }] },
        { id: 'org-demo2', clase: 'organismo', corto: 'Servicio de Prueba', oficial: 'Servicio de Prueba de la Consejería', dir3: 'A00000002',
          codigoCentro: '', superior: 'sup-demo1', correo: 'servicio@example.com', telefono: '', direccion: '', antes: [], departamentos: [] },
        { id: 'org-demo3', clase: 'centro', corto: 'IES Ejemplo', oficial: 'Instituto de Educación Secundaria Ejemplo', dir3: '', codigoCentro: '29000001',
          superior: '', correo: 'ies@example.com', telefono: '', direccion: '', antes: [],
          departamentos: [{ id: 'dep-demo3', nombre: 'Secretaría', correo: '', telefono: '', contacto: '', dir3: '', hijos: [] }] },
        { id: 'org-demo4', clase: 'centro', corto: 'CEIP Falso', oficial: 'Colegio de Educación Infantil y Primaria Falso', dir3: '', codigoCentro: '29000002',
          superior: '', correo: '', telefono: '', direccion: '', antes: [], departamentos: [] }
      ]
    };
    await Carpetas.escribirTexto(d, 'administraciones.json', JSON.stringify(contenido, null, 1));
  }

  window.Demo = window.Demo || {};
  window.Demo.administraciones = { escribir: escribir };
})();
