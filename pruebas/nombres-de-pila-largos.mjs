/* Fila 247 (docs/NOMBRES-DE-PILA-LARGOS.md): nombres de pila largos se
   acortan solo en nombres de carpeta; la misma persona se reconoce en forma
   corta y larga; el medidor usa el nombre corto. */
import { chromium } from 'playwright';
let fallos = 0;
function igual(t, real, esperado) {
  if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLA  ' + t + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + t);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('pageerror', e => errores.push(e.message));
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.waitForFunction(() => window.Nombres && Nombres.acortarNombrePila);
const r = await pagina.evaluate(() => {
  const N = Nombres;
  return {
    largo: N.acortarNombrePila('García López, María Concepción Josefa Remedios 1234567'),
    particulas: N.acortarNombrePila('García López, María de los Ángeles Rocío Teresa Pilar 1234567'),
    corto: N.acortarNombrePila('Aguilar Ponce, Marina 2100001'),
    personal: N.acortarNombrePila('García López, María Concepción Josefa Remedios 678Z'),
    empresaSinComa: N.acortarNombrePila('Suministros Industriales de la Campiña Andaluza Sociedad Limitada'),
    compuesto: N.acortarNombrePila('De la Cruz Del Río, María Concepción Josefa Remedios 1234567'),
    misma: N.claveDeTercero('García López, María Concepción Josefa Remedios 1234567') === N.claveDeTercero('García López, María C. J. R. 1234567'),
    otra: N.claveDeTercero('García López, María C. J. R. 1234567') === N.claveDeTercero('García López, María C. J. R. 7654321'),
    reutiliza: N.carpetaDeTercero('García López, María Concepción Josefa Remedios 1234567', ['García López, María Concepción Josefa Remedios 1234567']),
    nueva: N.carpetaDeTercero('García López, María Concepción Josefa Remedios 1234567', ['Otra Persona, Ana 1111111']),
    asunto: N.montarAsunto({ fecha: '2026-10-01', numero: 'A26-0137', tipo: 'Cert', tercero: 'García López, María Concepción Josefa Remedios 1234567', categoria: 'ALUMNADO' }).nombre
  };
});
igual('cuatro nombres de pila', r.largo, 'García López, María C. J. R. 1234567');
igual('partículas fuera', r.particulas, 'García López, María Á. R. T. P. 1234567');
igual('nombre corto igual que antes', r.corto, 'Aguilar Ponce, Marina 2100001');
igual('personal con 4 caracteres', r.personal, 'García López, María C. J. R. 678Z');
igual('sin coma no se toca', r.empresaSinComa, 'Suministros Industriales de la Campiña Andaluza Sociedad Limitada');
igual('apellidos compuestos intactos', r.compuesto, 'De la Cruz Del Río, María C. J. R. 1234567');
igual('forma corta y larga son la misma persona', r.misma, true);
igual('otro número, otra persona', r.otra, false);
igual('reutiliza la carpeta larga', r.reutiliza, 'García López, María Concepción Josefa Remedios 1234567');
igual('carpeta nueva con nombre corto', r.nueva, 'García López, María C. J. R. 1234567');
igual('el asunto lleva el nombre corto', r.asunto, '261001 A26-0137 CERT García López, María C. J. R. 1234567');
igual('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log(fallos + ' fallo(s)'); process.exit(1); }
