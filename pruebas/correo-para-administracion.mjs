/* Prueba de la fila 717 (19-nov-2026, docs/717-CORREO-PARA-ADMINISTRACION.md): en un asunto cuyo tercero es una administración,
   el cuadro de Correo lleva ya su correo en «Para»: el del departamento del asunto o, si no, el general. Sin ninguno, «Para» vacío.
   Chromium real con la copia de pruebas (?demo=1&auto=1); las administraciones se inventan en memoria. */
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
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.CorreoPara && window.Administraciones, null, { timeout: 60000 });
await pagina.waitForTimeout(2000);

/* Tres administraciones inventadas: con correo general y departamento con correo; con correo general solo; sin ningún correo. */
const para = (nombre, dep, extra) => pagina.evaluate(async ({ nombre, dep, extra }) => {
  const d = Administraciones.enMemoria();
  d.organismos = d.organismos.filter((o) => o.corto !== nombre);
  d.organismos.push(Object.assign({ id: 'prueba-' + nombre, clase: 'organismo', corto: nombre, oficial: nombre, departamentos: dep ? [{ id: 'dep-1', nombre: 'Departamento de prueba', correo: dep }] : [] }, extra));
  const a = { nombre: '261119 CORRESPONDENCIA ' + nombre, ficha: { categoria: 'ADMINISTRACIONES', tercero: nombre, departamento: dep ? { id: 'dep-1', nombre: 'Departamento de prueba', correo: dep } : undefined } };
  const f = await Datos.cargar(App.E.datos, 'ADMINISTRACIONES');
  const persona = { campos: Object.assign({}, extra.correo ? { Correo: extra.correo } : {}) };
  await CorreoPara.preparar(a, persona, { tercero: nombre, pide: { correo: Administraciones.correoDelAsunto(a), nombre: '' } });
  CorreoPara.vaciar();
  CorreoPara.aplicarPapeles({ para: ['interesado', 'pide'] });
  return { dirs: CorreoPara.direcciones('para'), pastillas: CorreoPara.nombres('para').length };
}, { nombre, dep, extra });

await comprobar('con departamento con correo: sale el del departamento, una sola vez', para('Admin Uno', 'depto@admin-uno.es', { correo: 'general@admin-uno.es' }), { dirs: ['depto@admin-uno.es'], pastillas: 1 });
await comprobar('sin departamento: sale el correo general', para('Admin Dos', '', { correo: 'general@admin-dos.es' }), { dirs: ['general@admin-dos.es'], pastillas: 1 });
await comprobar('sin ningún correo: Para queda vacío', para('Admin Tres', '', {}), { dirs: [], pastillas: 0 });

/* Un alumno no cambia: su propio correo, y nadie de la administración. */
await comprobar('con un alumno no cambia nada', pagina.evaluate(async () => {
  const a = { nombre: '261119 FALTA Alumno de prueba', ficha: { categoria: 'ALUMNADO', tercero: 'Alumno de prueba' } };
  await CorreoPara.preparar(a, { campos: { 'Correo': 'alumno@correo-demo.es' } }, { tercero: 'Alumno de prueba' });
  CorreoPara.vaciar(); CorreoPara.aplicarPapeles({ para: ['interesado'] });
  return CorreoPara.direcciones('para');
}), ['alumno@correo-demo.es']);

if (errores.length) { fallos++; console.log('ERRORES EN CONSOLA: ' + errores.join(' | ')); }
await navegador.close();
console.log(fallos ? fallos + ' fallos' : 'todo bien');
process.exit(fallos ? 1 : 0);
