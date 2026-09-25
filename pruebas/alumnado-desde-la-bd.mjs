/* Prueba de la fila 142 (docs/ALUMNADO-DESDE-LA-BD.md): el alumnado,
   desde la base de datos de alumnado (js/alumnado-bd.js).

   Todos los alumnos son INVENTADOS (docs/ACUERDO-ALUMNADO.md: nunca
   datos de verdad, ni en pruebas). Tres:
     - «Inventada Primera, Lucía», matriculada, con NEAE. Está también en
       el RegAlum de mentira con otro grupo: manda la base de datos.
     - «Inventado Antiguo, Pablo», que ya no está matriculado y no sale en
       el RegAlum: aparece igual, sin grupo.
     - «Inventado Rechazado, Íker», en un fichero con `acuerdo: 99`, que
       se rechaza entero.

   Se comprueba: validar; la dirección sin `?k=` se rechaza sin llamar;
   sin fichero, todo como antes (sin tarjeta); con fichero válido, sus
   datos mandan sobre el RegAlum; la tarjeta «Datos académicos» (con
   «NEAE Sí» y la fecha al pie); la tabla «ALUMNADO BD» para los huecos;
   «Traer» con una dirección de mentira; los bloques de Ajustes. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const BUENO = {
  acuerdo: 1, generado: '2026-09-20T08:00:00Z', cursoAcademico: '2026/2027',
  alumnos: [
    { idEscolar: '9990001', apellido1: 'Inventada', apellido2: 'Primera', nombre: 'Lucía', sexo: 'M',
      fechaNacimiento: '2012-03-04', documento: '00000000T', matriculado: true, unidad: '2º ESO B', curso: '2º de E.S.O.',
      ensenanza: 'ESO', contacto: { telefono: '600000001', movil: '', correo: 'lucia@ejemplo.invalid', domicilio: 'Calle Falsa 1',
        localidad: 'Villainventada', codigoPostal: '00000', provincia: 'Inventada' },
      academico: { repeticiones: 1, pil: false, pendientes: ['Matemáticas 1º'], materiasNoSuperadas: [], neae: true } },
    { idEscolar: '9990002', apellido1: 'Inventado', apellido2: 'Antiguo', nombre: 'Pablo', sexo: 'H',
      fechaNacimiento: '2008-05-06', matriculado: false, unidad: '', curso: '',
      contacto: {}, academico: { repeticiones: 0, pil: null, pendientes: [], materiasNoSuperadas: [], neae: false } }
  ]
};
const RECHAZADO = {
  acuerdo: 99, generado: '2026-09-21T08:00:00Z',
  alumnos: [{ idEscolar: '9990003', apellido1: 'Inventado', apellido2: 'Rechazado', nombre: 'Íker', matriculado: true, unidad: '1º ESO A' }]
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Primera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2012',
    'Solo Regalum, Marta;9990009;3º de E.S.O.;3º ESO A;2026;Matriculada;01/01/2011'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);

console.log('--- validar y la dirección ---');
await comprobar('validar: el fichero bueno vale', pagina.evaluate((b) => AlumnadoBD.validar(b).ok, BUENO), true);
await comprobar('validar: acuerdo 99 se rechaza', pagina.evaluate((r) => AlumnadoBD.validar(r), RECHAZADO),
  { ok: false, motivo: 'viene con el acuerdo 99, y este gestor conoce el 1' });
await comprobar('validar: un alumno sin Nº escolar se rechaza',
  pagina.evaluate(() => AlumnadoBD.validar({ acuerdo: 1, alumnos: [{ nombre: 'X' }] }).ok), false);
await comprobar('la dirección sin ?k= se rechaza',
  pagina.evaluate(() => [
    AlumnadoBD.problemaDeDireccion('https://script.google.com/macros/s/INVENTADA/exec') !== '',
    AlumnadoBD.problemaDeDireccion('http://script.google.com/macros/s/INVENTADA/exec?k=abc') !== '',
    AlumnadoBD.problemaDeDireccion('https://script.google.com/macros/s/INVENTADA/exec?k=abc')
  ]), [true, true, '']);

console.log('--- sin fichero, todo como antes ---');
await comprobar('sin ALUMNADO-BD.json: el alumnado sale del RegAlum y no hay tarjeta',
  pagina.evaluate(async () => {
    Datos.olvidar('ALUMNADO');
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const p = f.lista.find((x) => x.id === '9990001');
    return { n: f.lista.length, unidad: p.unidad, bd: f.bd, tarjeta: AlumnadoBD.tarjetaAcademica(p) };
  }), { n: 2, unidad: '1º ESO C', bd: null, tarjeta: null });

async function ponerFichero(datos) {
  await pagina.evaluate(async (datos) => {
    await Carpetas.escribirTexto(App.E.datos, AlumnadoBD.FICHERO, JSON.stringify(datos));
    Datos.olvidar('ALUMNADO');
    TablasDatos.olvidar();
  }, datos);
}

console.log('--- un fichero con acuerdo 99 ---');
await ponerFichero(RECHAZADO);
await comprobar('acuerdo 99: se ignora, Íker no aparece y todo sigue como antes',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    return { n: f.lista.length, iker: f.lista.some((x) => x.id === '9990003'), bd: f.bd };
  }), { n: 2, iker: false, bd: null });

console.log('--- el fichero bueno ---');
await ponerFichero(BUENO);
await comprobar('sus datos mandan sobre el RegAlum; el antiguo aparece sin grupo; lo demás sigue',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const p = f.lista.find((x) => x.id === '9990002');
    const m = f.lista.find((x) => x.id === '9990009');
    return {
      lucia: [l.nombre, l.matriculado, l.unidad, l.fechaNac, l.campos['Teléfono'], l.campos['Localidad']],
      pablo: [p.nombre, p.matriculado, p.unidad],
      marta: [m.nombre, m.unidad, !!m.bd],
      bd: [f.bd.unidos, f.bd.nuevos], matriculados: f.matriculados
    };
  }), {
    lucia: ['Inventada Primera, Lucía', true, '2º ESO B', '04/03/2012', '600000001', 'Villainventada'],
    pablo: ['Inventado Antiguo, Pablo', false, ''],
    marta: ['Solo Regalum, Marta', '3º ESO A', false],
    bd: [1, 1], matriculados: 2
  });

await comprobar('la tarjeta «Datos académicos»: NEAE Sí, pendientes y la fecha al pie',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const caja = document.createElement('div');
    const v = FichaTerceroAlumno.ventana(l, Datos.resumenDeTercero(l, 'ALUMNADO'), null);
    caja.innerHTML = v.html;
    document.body.appendChild(caja);
    v.montar(caja);
    const t = caja.querySelector('.vt-tarjeta-academica');
    const filas = t ? Array.from(t.querySelectorAll('.ficha-dato')).map((d) => d.textContent) : [];
    const pie = t ? t.querySelector('.nota').textContent : '';
    caja.remove();
    return { filas, pie };
  }), {
    filas: ['Unidad2º ESO B', 'Repeticiones1', 'PILNo', 'PendientesMatemáticas 1º', 'NEAESí'],
    pie: 'Datos de la base de datos de alumnado del 20-09-2026'
  });

await comprobar('sin NEAE, la fila NEAE no sale (ni «No»)',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const p = f.lista.find((x) => x.id === '9990002');
    return AlumnadoBD.filasAcademicas(p).map((x) => x.titulo);
  }), ['Repeticiones']);

await comprobar('la tabla «ALUMNADO BD», unida por Nº escolar',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const m = f.lista.find((x) => x.id === '9990009');
    const filas = await TablasDatos.filasDe('ALUMNADO BD', l);
    const ninguna = await TablasDatos.filasDe('ALUMNADO BD', m);
    return { n: filas.length, unidad: filas[0] && filas[0].celdas['Unidad'], neae: filas[0] && filas[0].celdas['NEAE'], otra: ninguna.length };
  }), { n: 1, unidad: '2º ESO B', neae: 'Sí', otra: 0 });

console.log('--- traer ---');
await comprobar('traer con una dirección de mentira: guarda la copia; con acuerdo 99, sigue con la anterior',
  pagina.evaluate(async ([bueno, malo]) => {
    const original = window.fetch;
    let respuesta = bueno;
    window.fetch = async () => new Response(JSON.stringify(respuesta), { status: 200 });
    try {
      await AlumnadoBD.guardarDireccion('https://script.google.com/macros/s/INVENTADA/exec?k=inventada');
      bueno = Object.assign({}, bueno, { generado: '2026-09-22T08:00:00Z' });
      respuesta = bueno;
      const r1 = await AlumnadoBD.traer(true);
      respuesta = malo;
      const r2 = await AlumnadoBD.traer(true);
      const d = await AlumnadoBD.leer();
      return [r1.ok, r1.cuantos, r2.ok, d.generado, AlumnadoBD.direccion().indexOf('?k=') !== -1];
    } finally { window.fetch = original; }
  }, [BUENO, RECHAZADO]), [true, 2, false, '2026-09-22T08:00:00Z', true]);

console.log('--- Ajustes ---');
await comprobar('Ajustes: el bloque en El centro y el botón en Mantenimiento',
  pagina.evaluate(async () => {
    await App.pintarAjustes();
    await new Promise((r) => setTimeout(r, 300));
    const b = document.getElementById('bloque-alumnado-bd');
    const t = document.getElementById('alumnado-bd-traer');
    return {
      centro: !!(b && b.closest('#ajustes-tab-centro')),
      url: document.getElementById('alumnado-bd-url').value.indexOf('?k=') !== -1,
      traer: !!(t && t.closest('#ajustes-tab-mantenimiento')),
      copia: document.getElementById('alumnado-bd-copia').textContent
    };
  }), { centro: true, url: true, traer: true, copia: 'Última copia: 2 alumnos, datos del 22-09-2026.' });

/* Los avisos ámbar del «traer» que falla a propósito no son errores. */
const deVerdad = errores.filter((e) => e.indexOf('alumnado') === -1);
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
