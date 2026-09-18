/* Prueba de la aplicación entera en un navegador de verdad,
   con un disco de mentira y un almacén de mentira. */
import { chromium } from 'playwright';

const preparacion = `
(function () {
  /* ---- almacén de mentira, en memoria ---- */
  const guardado = new Map();
  Object.defineProperty(window, 'indexedDB', { configurable: true, value: {
    open() {
      const p = {};
      setTimeout(() => {
        p.result = {
          objectStoreNames: { contains: () => true },
          createObjectStore() {},
          transaction() {
            const t = {};
            t.objectStore = () => ({
              put(v, k) { guardado.set(k, v); },
              get(k) { const r = {}; setTimeout(() => { r.result = guardado.get(k); r.onsuccess && r.onsuccess(); }, 0); return r; },
              delete(k) { guardado.delete(k); }
            });
            setTimeout(() => t.oncomplete && t.oncomplete(), 0);
            return t;
          }
        };
        p.onsuccess && p.onsuccess();
      }, 0);
      return p;
    }
  } });

  /* ---- disco de mentira ---- */
  function dir(nombre) {
    const hijos = new Map();
    return {
      kind: 'directory', name: nombre, _hijos: hijos,
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; },
      async getDirectoryHandle(n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          hijos.set(n, dir(n));
        }
        return hijos.get(n);
      },
      async getFileHandle(n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          hijos.set(n, fich(n, ''));
        }
        return hijos.get(n);
      },
      async removeEntry(n) { hijos.delete(n); },
      async *entries() { for (const par of hijos) yield par; }
    };
  }
  function fich(nombre, texto, tipo) {
    const f = { kind: 'file', name: nombre, _texto: texto };
    f.getFile = async () => new Blob([f._texto], { type: tipo || 'text/plain' });
    f.createWritable = async () => ({
      /* Un Blob o un File puede traer bytes de verdad (un PDF, por
         ejemplo), no solo texto: leerlo con .text() los decodifica
         como UTF-8 y, si no lo eran, los cambia de tamaño al volver a
         codificarlos. Se guardan con .arrayBuffer(), como hace de
         verdad la API del navegador. */
      async write(c) {
        if (typeof c === 'string') { f._texto = c; return; }
        if (c && typeof c.arrayBuffer === 'function') { f._texto = new Uint8Array(await c.arrayBuffer()); return; }
        if (c && c._texto !== undefined) { f._texto = c._texto; return; }
        f._texto = c;
      },
      async close() {}
    });
    /* Las carpetas del centro están en Dropbox, y ahí Chrome tiene
       move() pero lo rechaza. El disco de mentira hace lo mismo, para
       que las pruebas pasen por el camino que se usa de verdad. */
    f.move = async () => {
      const e = new Error("Failed to execute 'move' on 'FileSystemFileHandle': " +
        'The request is not allowed by the user agent or the platform in the current context.');
      e.name = 'NotAllowedError';
      throw e;
    };
    return f;
  }

  window.__disco = { abiertos: dir('ASUNTOS ABIERTOS'), archivo: dir('ARCHIVO'), fich: fich };

  /* el documento que el usuario buscaría en Descargas */
  window.__disco.externo = fich('descarga sin nombre (3).pdf', 'contenido del pdf');
  window.showOpenFilePicker = async function () { return [window.__disco.externo]; };
  let toca = 'abiertos';
  window.showDirectoryPicker = async function () {
    const h = window.__disco[toca];
    toca = toca === 'abiertos' ? 'archivo' : 'abiertos';
    return h;
  };
})();
`;

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(DIRECCION);

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* --- pantalla de arranque --- */
await comprobar('el aviso de navegador no sale',
  pagina.locator('#aviso-navegador').isHidden(), true);
await comprobar('entrar está apagado', pagina.locator('#btn-entrar').isDisabled(), true);

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await comprobar('entrar se enciende con las dos carpetas',
  pagina.locator('#btn-entrar').isDisabled(), false);

/* --- un RegAlum de mentira, con ESO y Bachillerato --- */
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2025;Matriculada;14/03/2013;600111222;tutor.marina@correo.es',
    'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013;600111222;tutor.marina@correo.es',
    'Bermúdez Ortiz, Álvaro;1140501;1º de E.S.O.;1º C;2026;Matriculado;02/09/2014;600333444;tutor.alvaro@correo.es',
    'Solano Vega, Ruth;1138002;1º de Bachillerato;1º Bach A;2026;Matriculada;11/05/2009;600555666;tutor.ruth@correo.es',
    'Trujillo Sanz, Hugo;1120044;4º de E.S.O.;4º D;2024;Matriculado;20/01/2009;600777888;tutor.hugo@correo.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));

  const per = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Teléfono","Móvil avisos de emergencia","Usuario IdEA","Cuenta Google/Microsoft"',
    '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","01/09/2011","","952276078","620177026","maguran591","maguran591@g.educaand.es"',
    '"Sánchez Alegría, María José","07862312S","Dibujo P.E.S.","01/09/2005","06/09/2026","656633968","656633968","msanale312","msanale312@g.educaand.es"'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', per));

  /* un curso anterior: una profesora que ya no está */
  const viejo = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"',
    '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","01/09/2011",""',
    '"Vieja Guardia, Antonia","11112233A","Latín P.E.S.","01/09/2010",""'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 24-25.csv', window.__disco.fich('RelPerCen 24-25.csv', viejo));

  /* y el personal no docente, en su propio fichero */
  const pas = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015",""'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCenNodocente 2627.csv', window.__disco.fich('RelPerCenNodocente 2627.csv', pas));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La barra de la izquierda nace plegada (10-sep-2026), y plegada las
   pestanas no se ven. Se abre una vez, y como se recuerda en
   localStorage, se queda abierta el resto de la prueba. */
await pagina.click('#btn-barra');

await comprobar('entra en la aplicación', pagina.locator('#lista-abiertos').isVisible(), true);
await comprobar('la lista empieza vacía', pagina.locator('#lista-abiertos .vacio').count(), 1);

/* --- nuevo asunto: primero la categoría --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await comprobar('salen las cuatro categorías',
  pagina.locator('#categorias-lista .categoria-boton').count(), 4);
await comprobar('los tipos no se ven todavía',
  pagina.locator('#bloque-tipos').isHidden(), true);

await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
await comprobar('solo salen los tipos de ALUMNADO',
  pagina.locator('#tipos-lista .tipo-boton').count(), 14);

await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'marina');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-07');
await pagina.fill('#campo-curso', '26-27');
await pagina.fill('#campo-descripcion', 'Cambio de optativa');
await comprobar('el nombre se monta sin el grupo',
  pagina.locator('#vista-nombre').textContent(),
  '260907 MATRICULA 26-27 Cambio de optativa Aguilar Ponce, Marina 1140233');

/* --- el interruptor del grupo --- */
await comprobar('el interruptor del grupo se ofrece',
  pagina.locator('#bloque-grupo').isHidden(), false);
await comprobar('y dice qué grupo pondría',
  pagina.locator('#grupo-vista').textContent(), '(2ºB)');
await pagina.check('#campo-grupo');
await comprobar('al encenderlo el grupo entra en el nombre',
  pagina.locator('#vista-nombre').textContent(),
  '260907 MATRICULA 26-27 2ºB Cambio de optativa Aguilar Ponce, Marina 1140233');

await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('la carpeta existe en el disco', pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return nombres.filter(n => n[0] !== '_');
}), ['260907 MATRICULA 26-27 2ºB Cambio de optativa Aguilar Ponce, Marina 1140233']);
await comprobar('el contador del menú marca uno',
  pagina.locator('#cuenta-abiertos').textContent(), '1');

/* --- el grupo de Bachillerato no se confunde --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'CERTIFICADO', exact: true }).click();
await pagina.fill('#buscar-tercero', 'solano');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await comprobar('el grupo de Bachillerato lleva la etapa',
  pagina.locator('#grupo-vista').textContent(), '(1ºBachA)');

/* --- un alumno que ya no está matriculado no da grupo --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'CERTIFICADO', exact: true }).click();
await pagina.fill('#buscar-tercero', 'trujillo');
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('el buscador avisa de que ya no está matriculado',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('No matriculado este curso') !== -1 && t.indexOf('24-25') !== -1), true);
await pagina.click('#resultados-tercero .resultado');
await comprobar('y no se ofrece ponerle el grupo',
  pagina.locator('#bloque-grupo').isHidden(), true);
await comprobar('el nombre se monta sin grupo ninguno',
  pagina.locator('#vista-nombre').textContent()
    .then(t => t.indexOf('4ºD') === -1), true);

/* --- la ficha lo dice también --- */
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.fill('#buscar-personas', 'trujillo');
await pagina.waitForTimeout(250);
await pagina.click('#lista-personas .resultado');
const fichaHugo = await pagina.locator('#ficha-persona').textContent();
await comprobar('la ficha dice que no está matriculado',
  fichaHugo.indexOf('No está matriculado este curso') !== -1, true);
await comprobar('y de cuándo fue su última matrícula',
  fichaHugo.indexOf('24-25') !== -1, true);

await pagina.click('.pestana[data-pantalla="abiertos"]');

/* --- el personal sale del RelPerCen de Séneca --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="PERSONAL"]');
await pagina.click('#tipos-lista .tipo-boton');
await pagina.fill('#buscar-tercero', 'aguado');
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('encuentra al profesorado del RelPerCen',
  pagina.locator('#resultados-tercero .resultado').first().textContent()
    .then(t => t.indexOf('Aguado Ranea') !== -1), true);
await comprobar('y enseña su puesto debajo',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Música P.E.S.') !== -1), true);
await pagina.click('#resultados-tercero .resultado');
await comprobar('el nombre lleva los cuatro últimos caracteres del DNI',
  pagina.locator('#vista-nombre').textContent()
    .then(t => t.indexOf('Aguado Ranea, Marcos Antonio 591R') !== -1), true);
await comprobar('al personal no se le ofrece grupo',
  pagina.locator('#bloque-grupo').isHidden(), true);

await pagina.click('#btn-cambiar-tercero');
await pagina.fill('#buscar-tercero', 'ordonez');
await pagina.waitForTimeout(300);
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('el personal no docente sale de su propio fichero',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Ordenanza') !== -1), true);

await pagina.fill('#buscar-tercero', 'vieja guardia');
await pagina.waitForTimeout(300);
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('quien solo está en un curso viejo se encuentra, pero avisa',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('su último curso aquí: 24-25') !== -1), true);

await pagina.fill('#buscar-tercero', 'sanchez alegria');
await pagina.waitForTimeout(300);
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('avisa de quien ya cesó',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Ya no está en el centro') !== -1), true);

await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.selectOption('#filtro-personas', 'PERSONAL');
await pagina.waitForTimeout(250);
await pagina.fill('#buscar-personas', 'sanchez');
await pagina.waitForTimeout(250);
await pagina.click('#lista-personas .resultado');
const fichaPer = await pagina.locator('#ficha-persona').textContent();
await comprobar('la ficha del personal empieza por el puesto',
  fichaPer.indexOf('Dibujo P.E.S.') !== -1, true);
await comprobar('y dice que ya no está en el centro',
  fichaPer.indexOf('Ya no está en el centro') !== -1, true);
await comprobar('el puesto sale antes que el resto del fichero',
  fichaPer.indexOf('Puesto') < fichaPer.indexOf('Usuario IdEA'), true);

await pagina.fill('#buscar-personas', '');
await pagina.selectOption('#filtro-personas', 'ALUMNADO');
await pagina.waitForTimeout(250);
await pagina.click('.pestana[data-pantalla="abiertos"]');

/* --- cerrar el asunto --- */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.getByRole('button', { name: 'Archivar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro dice a dónde va',
  pagina.locator('#cuadro-cuerpo .vista-nombre').textContent(),
  'ARCHIVO / ALUMNADO / Aguilar Ponce, Marina 1140233');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#lista-abiertos .vacio');
await comprobar('la carpeta ha aterrizado en el archivo', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Aguilar Ponce, Marina 1140233');
  const n = [];
  for await (const p of ter.entries()) n.push(p[0]);
  return n;
}), ['260907 MATRICULA 26-27 2ºB Cambio de optativa Aguilar Ponce, Marina 1140233']);

/* --- archivo y reapertura --- */
await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForSelector('#lista-archivo .tarjeta');
await comprobar('el archivo lo enseña', pagina.locator('#lista-archivo .tarjeta').count(), 1);

/* --- ficha del alumnado --- */
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.fill('#buscar-personas', 'marina');
await pagina.waitForTimeout(200);
await pagina.click('#lista-personas .resultado');
const ficha = await pagina.locator('#ficha-persona').textContent();
await comprobar('la ficha calcula la edad de hoy', ficha.indexOf('13 años') !== -1, true);
await comprobar('la ficha enseña el teléfono del tutor', ficha.indexOf('600111222') !== -1, true);
await comprobar('la edad sale antes que el resto del fichero',
  ficha.indexOf('Edad actual') < ficha.indexOf('Nº Id. Escolar'), true);

/* --- sus asuntos --- */
await pagina.click('#ver-sus-asuntos');
await pagina.waitForSelector('#asuntos-del-tercero .resultado');
await comprobar('ve su asunto archivado',
  pagina.locator('#asuntos-del-tercero .resultado').count(), 1);
await comprobar('y dice que está archivado',
  pagina.locator('#asuntos-del-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Archivado') !== -1), true);

/* --- dar de alta un solicitante que aún no está en el RegAlum --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.click('#tipos-lista .tipo-boton');
await pagina.fill('#buscar-tercero', 'aspirante');
await pagina.waitForTimeout(300);
await comprobar('si no está, ofrece darlo de alta como solicitante',
  pagina.locator('#resultados-tercero button').textContent()
    .then(t => t.indexOf('solicitante') !== -1), true);
await pagina.click('#resultados-tercero button');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro explica para qué es',
  pagina.locator('#cuadro-cuerpo').textContent()
    .then(t => t.indexOf('todavía no está matriculado') !== -1), true);
await pagina.fill('.alta-campo[data-campo="Nombre"]', 'Nuevo Aspirante, Lucas');
await pagina.fill('.alta-campo[data-campo="Fecha de nacimiento"]', '10/04/2012');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('el solicitante aparece marcado como tal',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Solicitante, todavía sin matricular') !== -1), true);
await pagina.click('#resultados-tercero .resultado');
await comprobar('al solicitante no se le ofrece grupo',
  pagina.locator('#bloque-grupo').isHidden(), true);
await comprobar('sin Nº, el nombre de la carpeta va solo con el nombre',
  pagina.locator('#vista-nombre').textContent()
    .then(t => t.indexOf('Nuevo Aspirante, Lucas') !== -1), true);
await comprobar('se ha escrito el solicitantes.csv', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const d = await g.getDirectoryHandle('datos');
  const n = [];
  for await (const p of d.entries()) n.push(p[0]);
  return n.indexOf('solicitantes.csv') !== -1;
}), true);

/* --- ordenar los asuntos abiertos --- */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await comprobar('el orden por defecto es por fecha, los más antiguos arriba',
  pagina.locator('#orden-abiertos').inputValue(), 'fecha-asc');
/* Los filtros nacen plegados (10-sep-2026): hay que abrirlos para tocarlos. */
await pagina.click('#btn-filtros');
await pagina.selectOption('#orden-abiertos', 'fecha-desc');
await comprobar('se puede cambiar el orden',
  pagina.locator('#orden-abiertos').inputValue(), 'fecha-desc');
await pagina.selectOption('#orden-abiertos', 'fecha-asc');

/* --- ajustes --- */
await pagina.click('.pestana[data-pantalla="ajustes"]');
/* Los bloques de Ajustes son <details> cerrados (9-sep-2026): se abren
   todos de una vez, y como no se vuelven a crear, se quedan abiertos
   el resto de la prueba. "Ficheros de datos" y "Cómo se abrevia cada
   grupo" viven en la pestaña "El centro" (17-sep-2026, fila 39). */
await pagina.evaluate(() => App.cambiarPestanaAjustes('centro'));
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-grupos .fila-tipo');
await comprobar('la tabla de grupos lista solo las unidades de este curso',
  pagina.locator('#tabla-grupos .fila-tipo').count(), 3);
await comprobar('Ajustes dice a qué curso corresponde el fichero',
  pagina.locator('#estado-datos .fila-tipo').first().textContent()
    .then(t => t.indexOf('curso 26-27') !== -1 && t.indexOf('3 matriculados de 5') !== -1), true);
await comprobar('y cuenta el solicitante dado de alta a mano',
  pagina.locator('#estado-datos').textContent()
    .then(t => t.indexOf('1 dados de alta a mano, todavía sin matricular') !== -1), true);
await comprobar('Ajustes dice que reconoce todas las columnas del RegAlum',
  pagina.locator('#estado-datos').textContent()
    .then(t => t.indexOf('Las reconozco todas') !== -1), true);
await comprobar('Ajustes lista cada fichero de personal con su curso',
  pagina.locator('#estado-datos').textContent()
    .then(t => t.indexOf('RelPerCen 24-25.csv') !== -1 &&
               t.indexOf('RelPerCenNodocente 2627.csv') !== -1), true);
await comprobar('y cuenta cuánto personal sigue en el centro',
  pagina.locator('#estado-datos').textContent()
    .then(t => t.indexOf('2 en el centro (curso 26-27) de 4 fichas') !== -1), true);
await comprobar('y abrevia bien el de Bachillerato',
  pagina.locator('#tabla-grupos .fila-tipo').filter({ hasText: '1º Bach A' })
    .locator('.nombre-tipo').textContent(), '1ºBachA');

await pagina.evaluate(() => App.cambiarPestanaAjustes('tipos'));
await pagina.fill('#nuevo-tipo', 'evacuacion');
await pagina.selectOption('#nueva-categoria', 'OTROS');
await pagina.click('#btn-anadir-tipo');
await pagina.waitForTimeout(300);
await comprobar('el tipo nuevo se guarda en mayúsculas', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('tipos.json');
  const t = JSON.parse(await (await h.getFile()).text());
  return t.filter(x => x.tipo === 'EVACUACION').length;
}), 1);

/* --- el enlace a Ajustes desde el formulario --- */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.click('#ir-a-ajustes');
await comprobar('el enlace del formulario lleva a Ajustes',
  pagina.locator('#pantalla-ajustes').isHidden(), false);

/* ================= DOCUMENTOS ================= */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'BECA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'alvaro');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-07');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* "Documentos" ya no está en la tarjeta (10-sep-2026): está dentro de
   la ficha del asunto, en "Documentos ▾" (antes "Gestionar documentos",
   movido a la cabecera del propio bloque en la fila 52, 18-sep-2026). */
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.click('.ficha-documentos-gestionar');
await pagina.waitForSelector('#doc-anadir');
await comprobar('la carpeta del asunto empieza sin documentos',
  pagina.locator('#doc-cuerpo .fila-documento').count(), 0);

await pagina.click('#doc-anadir');
await pagina.waitForSelector('#doc-vista');
await comprobar('el documento se ve al lado del formulario',
  pagina.locator('#doc-visor').count(), 1);
await comprobar('y es un PDF, así que se enseña en un marco',
  pagina.evaluate(() => document.getElementById('doc-visor').tagName), 'IFRAME');

/* El "Texto adicional" (antes, Año académico) nace vacío desde el
   10-sep-2026 y no depende de la fecha: se escribe a mano. Y la fecha
   de partida es la de HOY, no una fija, así que aquí se ponen las dos
   a un valor conocido antes de comprobar el nombre. */
await pagina.fill('#doc-fecha', '2026-09-07');
await pagina.fill('#doc-curso', '26-27');
await pagina.waitForTimeout(100);
await comprobar('sin registro, el nombre sale sin código',
  pagina.locator('#doc-vista').textContent(), '260907 SOLICITUD 26-27.pdf');

await pagina.fill('#doc-fecha', '2026-09-02');
await pagina.selectOption('#doc-tipo', 'CERTIFICADO');
await pagina.check('#doc-hay-registro');
await pagina.fill('#doc-ano', '26');
await pagina.check('input[name="doc-sentido"][value="S"]');
await pagina.check('input[name="doc-modo"][value="A"]');
await pagina.fill('#doc-numero', '87');
await pagina.waitForTimeout(150);
await comprobar('el código del registro se monta entero',
  pagina.locator('#doc-vista').textContent(), '260902 26SA0087 CERTIFICADO 26-27.pdf');

await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await comprobar('el documento se ha guardado en la carpeta del asunto', pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  const carpeta = nombres.find(n => n.indexOf('BECA') !== -1);
  const h = await window.__disco.abiertos.getDirectoryHandle(carpeta);
  const dentro = [];
  for await (const p of h.entries()) dentro.push(p[0]);
  return dentro;
}), ['260902 26SA0087 CERTIFICADO 26-27.pdf']);
await comprobar('y el original sigue donde estaba',
  pagina.evaluate(() => window.__disco.externo.name), 'descarga sin nombre (3).pdf');

/* renombrar el que ya está dentro. Cada fila trae ahora dos botones
   ("Copiar nombre" y "Poner nombre"), así que hay que elegir el que
   abre el formulario. */
await pagina.getByRole('button', { name: 'Poner nombre' }).click();
await pagina.waitForSelector('#doc-vista');
await comprobar('al renombrar se leen los datos del nombre que ya tenía',
  pagina.locator('#doc-vista').textContent(), '260902 26SA0087 CERTIFICADO 26-27.pdf');
await pagina.uncheck('#doc-hay-registro');
await pagina.waitForTimeout(150);
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await comprobar('quitar el registro cambia el nombre del fichero', pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  const carpeta = nombres.find(n => n.indexOf('BECA') !== -1);
  const h = await window.__disco.abiertos.getDirectoryHandle(carpeta);
  const dentro = [];
  for await (const p of h.entries()) dentro.push(p[0]);
  return dentro;
}), ['260902 CERTIFICADO 26-27.pdf']);
await pagina.click('#cuadro-aceptar');

/* ================= CAMBIAR EL NOMBRE DE UN TIPO ================= */
/* una carpeta ya archivada con el nombre viejo, que NO se debe tocar */
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle('Solano Vega, Ruth 1138002', { create: true });
  await ter.getDirectoryHandle('250401 SANCION 24-25 Solano Vega, Ruth 1138002', { create: true });
});

/* y una abierta con el nombre viejo, que SÍ se renombra */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'solano');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-03');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

await pagina.click('.pestana[data-pantalla="ajustes"]');
/* Se busca por nombre en vez de fiarse de la categoría marcada: el
   tipo EVACUACION de más arriba dejó Ajustes mirando OTROS, y el
   buscador de docs/AJUSTES-AGIL.md es justo para esto. */
await pagina.fill('#buscar-tipos', 'sancion');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
const tarjetaSancion = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'SANCION' });
await tarjetaSancion.locator('.tarjeta-tipo-menu-btn').click();
await tarjetaSancion.getByRole('button', { name: 'Cambiar el nombre' }).click();
await pagina.waitForSelector('#tipo-nuevo-nombre');
await pagina.fill('#tipo-nuevo-nombre', 'expediente disciplinario');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(900);

await comprobar('la carpeta abierta se ha renombrado', pagina.evaluate(async () => {
  const n = [];
  for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
  return n.filter(x => x.indexOf('EXPEDIENTE DISCIPLINARIO') !== -1).length;
}), 1);
await comprobar('la carpeta archivada NO se ha tocado', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Solano Vega, Ruth 1138002');
  const n = [];
  for await (const p of ter.entries()) n.push(p[0]);
  return n.filter(x => x.indexOf('SANCION') !== -1).length;
}), 1);
await comprobar('el nombre viejo queda guardado como alias', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('tipos.json');
  const t = JSON.parse(await (await h.getFile()).text());
  const x = t.find(y => y.tipo === 'EXPEDIENTE DISCIPLINARIO');
  return x && x.alias;
}), ['SANCION']);

await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForTimeout(600);
await comprobar('el archivo enseña la carpeta vieja con el nombre nuevo',
  pagina.locator('#lista-archivo .tarjeta').filter({ hasText: '250401 SANCION' })
    .locator('.marca-tipo').textContent(), 'EXPEDIENTE DISCIPLINARIO');

await comprobar('sin errores de consola', Promise.resolve(errores), []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas del navegador pasan.');
process.exit(fallos ? 1 : 0);
