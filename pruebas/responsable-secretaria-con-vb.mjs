/* Fila 234 (docs/RESPONSABLE-SECRETARIA-CON-VB.md): responsable fijo
   «Secretaría con V.º B.º de Dirección». */
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
await pagina.waitForFunction(() => window.HitosAdministracion && window.Hitos);
const r = await pagina.evaluate(() => {
  const H = HitosAdministracion;
  const aj = Hitos.normalizarAjustes({ responsables: [
    { id: 'yo', nombre: 'Yo', administracion: true },
    { id: 'direccion', nombre: 'Dirección', administracion: false },
    { id: 'secretaria', nombre: 'Secretaría', administracion: false },
    { id: 'jefatura', nombre: 'Jefatura', administracion: false },
    { id: 'secretaria-vb-direccion', nombre: 'Renombrada', administracion: true }] });
  const VB = H.ID_VB;
  return {
    ids: aj.responsables.map(x => x.id),
    nombre: aj.responsables[1].nombre,
    marca: [aj.responsables[1].administracion, aj.responsables[1].fijo],
    paraGuia: H.paraGuia(aj).map(x => x.id),
    conSecretaria: H.cuentaPara(VB, 'secretaria', aj),
    conDireccion: H.cuentaPara(VB, 'direccion', aj),
    conJefatura: H.cuentaPara(VB, 'jefatura', aj),
    conAdministracion: H.cuentaPara(VB, 'administracion', aj),
    conLaOpcionMisma: H.cuentaPara(VB, VB, aj),
    secretariaSola: [H.cuentaPara('secretaria', 'secretaria', aj), H.cuentaPara('secretaria', 'direccion', aj)],
    espera: Hitos.esDeAdministracion(VB, aj)
  };
});
igual('va detrás de Administración, y no se duplica ni se renombra', r.ids, ['administracion', 'secretaria-vb-direccion', 'yo', 'direccion', 'secretaria', 'jefatura']);
igual('con su nombre entero', r.nombre, 'Secretaría con V.º B.º de Dirección');
igual('del centro, sin marca de Administración, fija', r.marca, [false, true]);
igual('las guías la ofrecen', r.paraGuia.indexOf('secretaria-vb-direccion') !== -1, true);
igual('cuenta para Secretaría', r.conSecretaria, true);
igual('cuenta para Dirección', r.conDireccion, true);
igual('no para Jefatura', r.conJefatura, false);
igual('no para Administración', r.conAdministracion, false);
igual('sí para sí misma', r.conLaOpcionMisma, true);
igual('un hito de Secretaría sigue igual', r.secretariaSola, [true, false]);
igual('va a «En espera» (no es de Administración)', r.espera, false);
igual('sin errores', errores, []);
await navegador.close();
if (fallos) process.exit(1);
