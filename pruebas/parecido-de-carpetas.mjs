/* Fila 292 (docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 3): cuánto se parecen dos nombres de
   asunto o de carpeta. Los cinco criterios, el empate, sin candidatas y el parecido claro.
   Chromium real con la copia de pruebas (?demo=1&auto=1); la función no tiene pantalla. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForFunction(() => window.ParecidoDeCarpetas);

/* Ordena y devuelve los nombres, y si el primero es un parecido claro. */
const ordenar = (viejo, nombres) => pagina.evaluate(([v, n]) => {
  const r = ParecidoDeCarpetas.ordenar(v, n.map((x) => ({ nombre: x })));
  return [r.map((x) => x.nombre), r.map((x) => x.claro)];
}, [viejo, nombres]);

console.log('--- 1. el mismo número de asunto gana a todo ---');
await comprobar('1. con el mismo número, aunque cambie el tercero, la fecha y el nombre',
  ordenar('260101 A26-0137 FACTURA Uno 11112222A', ['260101 FACTURA Uno 11112222A', '260909 A26-0137 PEDIDO Otro 99990000Z']),
  [['260909 A26-0137 PEDIDO Otro 99990000Z', '260101 FACTURA Uno 11112222A'], [true, false]]);

console.log('--- 2. el mismo tercero ---');
await comprobar('2. el mismo tercero va antes que el mismo tipo; sin el mismo tipo no es un parecido claro',
  ordenar('260101 FACTURA Uno 11112222A', ['260101 COMPRA Dos 55556666B', '260202 COMPRA Uno 11112222A', '260303 FACTURA Tres 77778888C']),
  [['260202 COMPRA Uno 11112222A', '260303 FACTURA Tres 77778888C', '260101 COMPRA Dos 55556666B'], [false, false, false]]);
await comprobar('2. el tercero por sus cuatro últimos caracteres del documento equivale a su NIF; con el mismo tipo, es claro',
  ordenar('260101 BAJA MEDICA Otero Campos, Marta 344A', ['260102 BAJA MEDICA Otero Campos, Marta 11223344A', '260102 BAJA MEDICA Reyes Palma, Fernando 455B']),
  [['260102 BAJA MEDICA Otero Campos, Marta 11223344A', '260102 BAJA MEDICA Reyes Palma, Fernando 455B'], [true, false]]);

console.log('--- 3. el tipo, 4. la fecha y 5. las palabras ---');
await comprobar('3. el mismo tipo pesa más que la misma fecha',
  ordenar('260101 CERTIFICADO Nadie', ['260101 COMPRA Zeta', '260303 CERTIFICADO Zeta']),
  [['260303 CERTIFICADO Zeta', '260101 COMPRA Zeta'], [false, false]]);
await comprobar('4. la misma fecha pesa más que una palabra suelta',
  ordenar('260101 COMPRA Ferreteria Sol', ['270202 PEDIDO Ferreteria', '260101 PEDIDO Panaderia']),
  [['260101 PEDIDO Panaderia', '270202 PEDIDO Ferreteria'], [false, false]]);
await comprobar('5. a igual de lo demás, gana el que comparte más palabras del nombre',
  ordenar('260101 COMPRA Ferreteria Los Alamos', ['270101 PEDIDO Panaderia', '270101 PEDIDO Ferreteria Los Alamos']),
  [['270101 PEDIDO Ferreteria Los Alamos', '270101 PEDIDO Panaderia'], [false, false]]);

console.log('--- empate y sin candidatas ---');
await comprobar('con dos candidatas que empatan se ordenan por nombre y no se marca ninguna',
  ordenar('260101 A26-0137 FACTURA Uno 11112222A', ['270101 A26-0137 FACTURA Dos 22223333B', '260909 A26-0137 FACTURA Tres 33334444C']),
  [['260909 A26-0137 FACTURA Tres 33334444C', '270101 A26-0137 FACTURA Dos 22223333B'].sort(), [false, false]]);
await comprobar('sin candidatas, la lista sale vacía', ordenar('260101 FACTURA Uno', []), [[], []]);
await comprobar('con el tipo de la aplicación (de más de una palabra) también reconoce el mismo tipo',
  pagina.evaluate(() => {
    const p = ParecidoDeCarpetas.puntuar('260101 CERTIFICADO DE NOTAS Vidal Soto, Irene 2100030', '260505 CERTIFICADO DE NOTAS Otra Cosa 2100099', App.E.tipos);
    return [p.tipo, p.tercero, p.numero, p.fecha];
  }), [true, false, false, false]);

console.log('--- proponer: solo si se parece de verdad ---');
await comprobar('mejor(): ninguno se parece si solo comparten el tipo',
  pagina.evaluate(() => ParecidoDeCarpetas.mejor('260510 FACTURA Papeleria Nova 11223344B', [{ nombre: '260907 FACTURA Imprenta Sol 22334455C' }])), null);
await comprobar('mejor(): con el mismo número propone ese, aunque haya otros',
  pagina.evaluate(() => {
    const m = ParecidoDeCarpetas.mejor('260704 A26-0888 PEDIDO Imprenta Sol 22334455C', [{ nombre: '260907 A26-0001 PEDIDO Otro 1111' }, { nombre: '260907 A26-0888 PEDIDO Imprenta Sol 22334455C' }]);
    return [m.nombre, m.claro];
  }), ['260907 A26-0888 PEDIDO Imprenta Sol 22334455C', true]);
await comprobar('mejor(): sin candidatas, null', pagina.evaluate(() => ParecidoDeCarpetas.mejor('260704 A26-0888 PEDIDO X', [])), null);

console.log('--- fila 303: cuándo «encaja» una carpeta ---');
const encaja = (v, n) => pagina.evaluate(([a, b]) => ParecidoDeCarpetas.encaja(a, b, App.E.tipos), [v, n]);
const V = '260917 TRASLADO MATR VIVA 26-27 Apellido Apellido, Nombre 1234567';
await comprobar('encaja: el tipo escrito abreviado, misma fecha y misma persona', encaja(V, '260917 TRAS. MATR. VIVA 26-27 Apellido Apellido, Nombre 1234567'), true);
await comprobar('encaja: el mismo número, aunque cambie todo lo demás', encaja('260101 A26-0137 PEDIDO Uno 1111', '260909 A26-0137 FACTURA Otro 2222'), true);
await comprobar('no encaja: otro tipo distinto', encaja(V, '260917 BAJA MEDICA 26-27 Apellido Apellido, Nombre 1234567'), false);
await comprobar('no encaja: otra fecha', encaja(V, '260918 TRAS. MATR. VIVA 26-27 Apellido Apellido, Nombre 1234567'), false);
await comprobar('no encaja: otra persona', encaja(V, '260917 TRAS. MATR. VIVA 26-27 Otro Otro, Nombre 7654321'), false);
await comprobar('encaja: plural y sin tildes (carpeta cambiada a mano)', encaja('260829 FACTURA Ferretería Los Álamos 55443322Z', '260829 FACTURAS Ferreteria Los Alamos 55443322Z'), true);
await comprobar('encaja: el tipo con el nombre corto o antiguo que tenga en la aplicación',
  pagina.evaluate(() => {
    const tipos = [{ tipo: 'CERTIFICADO DE NOTAS', nombreCorto: 'CERT NOTAS', alias: ['NOTAS CERTIFICADAS'] }];
    return [ParecidoDeCarpetas.encaja('260101 CERTIFICADO DE NOTAS Vidal Soto, Irene 2100030', '260101 CERT NOTAS Vidal Soto, Irene 2100030', tipos),
      ParecidoDeCarpetas.encaja('260101 NOTAS CERTIFICADAS Vidal Soto, Irene 2100030', '260101 CERTIFICADO DE NOTAS Vidal Soto, Irene 2100030', tipos)];
  }), [true, true]);
await comprobar('encajes(): devuelve las que encajan, para proponer solo si es una',
  pagina.evaluate((v) => ParecidoDeCarpetas.encajes(v, [{ nombre: '260917 TRAS. MATR. VIVA 26-27 Apellido Apellido, Nombre 1234567' }, { nombre: '260917 BAJA 26-27 Apellido Apellido, Nombre 1234567' }, { nombre: '260917 TRASLADO MATR. VIVA 26-27 Apellido Apellido, Nombre 1234567' }], App.E.tipos).length, V), 2);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
