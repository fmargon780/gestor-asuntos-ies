/* Prueba en navegador de verdad del DNI del alumnado y del aviso de
   que falta. Reutiliza el disco de mentira de pruebas/navegador.mjs.

   El RegAlum de mentira trae columna de DNI y cuatro alumnos:
     - uno con DNI,
     - uno de 16 años sin DNI  -> tiene que avisar,
     - uno de 12 años sin DNI  -> no avisa, todavía no le toca,
     - uno con NIE.

   Y al final se prueba una descarga SIN columna de DNI: entonces no se
   avisa de nada, porque el DNI puede existir y no estar en el fichero. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch();
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

/* Fechas de nacimiento calculadas a partir de hoy, para que la prueba
   no caduque el año que viene. */
const hoy = new Date();
const naceHace = (anos) => {
  const d = new Date(hoy.getFullYear() - anos, hoy.getMonth(), hoy.getDate());
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async (fechas) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;DNI/Pasaporte;DNI del tutor',
    'Con Dni, Ana;1000001;3º de E.S.O.;3º A;2026;Matriculada;' + fechas.dieciseis + ';12345678Z;99999999R',
    'Sin Dni, Bruno;1000002;4º de E.S.O.;4º B;2026;Matriculado;' + fechas.dieciseis + ';;88888888T',
    'Pequeño Aún, Clara;1000003;1º de E.S.O.;1º C;2026;Matriculada;' + fechas.doce + ';;77777777P',
    'Con Nie, Dana;1000004;2º de E.S.O.;2º A;2026;Matriculada;' + fechas.dieciseis + ';X1234567L;'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
}, { dieciseis: naceHace(16), doce: naceHace(12) });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);

const pies = () => pagina.evaluate(async () => {
  const fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const salida = {};
  fuente.lista.forEach(p => { salida[p.nombre] = App.pieDe(p); });
  return salida;
});

const p1 = await pies();
console.log('--- la línea de debajo del nombre ---');
await comprobar('el que tiene DNI lo enseña', p1['Con Dni, Ana'],
  '3º A  ·  3º de E.S.O.  ·  Nº 1000001  ·  DNI 12345678Z');
await comprobar('el NIE también vale', p1['Con Nie, Dana'],
  '2º A  ·  2º de E.S.O.  ·  Nº 1000004  ·  DNI X1234567L');
await comprobar('al de 16 sin DNI se le avisa', p1['Sin Dni, Bruno'],
  '4º B  ·  4º de E.S.O.  ·  Nº 1000002  ·  FALTA EL DNI (16 años, ya debería tenerlo)');
await comprobar('al de 12 no se le avisa', p1['Pequeño Aún, Clara'],
  '1º C  ·  1º de E.S.O.  ·  Nº 1000003');

console.log('--- no se coge el DNI del tutor ---');
await comprobar('el de Bruno sigue sin DNI',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const b = f.lista.filter(p => p.nombre === 'Sin Dni, Bruno')[0];
    return window.Dni.de(b);
  }), '');

console.log('--- la ficha del alumno ---');
const ficha = (quien) => pagina.evaluate(async (nombre) => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const p = f.lista.filter(x => x.nombre === nombre)[0];
  return Datos.destacadosAlumno(p).destacados.map(x => x.titulo + ': ' + x.valor);
}, quien);

await comprobar('el DNI sale justo detrás de la edad',
  ficha('Con Dni, Ana').then(f => f.slice(0, 2)),
  ['Edad actual: 16 años', 'DNI: 12345678Z']);
await comprobar('y el aviso ocupa su sitio',
  ficha('Sin Dni, Bruno').then(f => f[1]),
  'DNI: No consta. Con 16 años ya debería tenerlo: buena ocasión para pedírselo.');

console.log('--- una descarga sin columna de DNI ---');
/* En otra pestaña, con su propio disco de mentira: un RegAlum que no
   trae columna de documento. No se avisa de nada, porque el DNI puede
   existir y no estar en el fichero. */
const otra = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
otra.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await otra.addInitScript(preparacion);
await otra.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await otra.click('#btn-abiertos');
await otra.click('#btn-archivo');
await otra.fill('#campo-usuario', 'Francisco');
await otra.waitForSelector('#btn-entrar:not([disabled])');
await otra.evaluate(async (nacimiento) => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Sin Columna, Elena;1000005;4º de E.S.O.;4º A;2026;Matriculada;' + nacimiento
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
}, naceHace(16));
await otra.click('#btn-entrar');
await otra.waitForSelector('#aplicacion:not(.oculto)');
await otra.waitForTimeout(500);

await comprobar('sin columna de DNI, no se avisa de nada',
  otra.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const p = f.lista[0];
    return { pie: App.pieDe(p), falta: window.Dni.falta(p) };
  }), { pie: '4º A  ·  4º de E.S.O.  ·  Nº 1000005', falta: false });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
