/* Prueba de la fila 738 (docs/738-CAMBIAR-DATO-DE-LISTA-EN-EL-ASUNTO.md): «Cambiar» en un dato de lista con valor, dentro de «Campos del asunto».
   Chromium real con la copia de pruebas (?demo=1&auto=1&baja=1), tipo «Baja de matrícula».

   1. Un dato de lista con valor sale con su valor y «Cambiar» (y sin desplegable hasta pulsarlo); uno vacío sigue con «Elegir…».
   2. «Cambiar» abre el desplegable con el valor de ahora elegido; elegir otro lo guarda, lo enseña y queda al recargar los datos.
   3. El registro del asunto lleva la línea «<dato>: de <antes> a <ahora>».
   4. Las tareas con «Solo si» de ese dato se recalculan con el valor nuevo.
   5. En un asunto que no está abierto no hay «Cambiar».
   6. Soltar el desplegable sin elegir otro lo deja como estaba. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&baja=1';
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.BajaMatricula, null, { timeout: 60000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && App.E.tipos.some((t) => t.nombreCorto === 'BAJA MATRICULA'), null, { timeout: 240000 });
await pagina.waitForTimeout(1500);



console.log('--- 1 a 4. Cambiar ---');
const T = 'Baja de matrícula';
const r = await pagina.evaluate(async (T) => {
  const esp = (ms) => new Promise((x) => setTimeout(x, ms));
  const tipo = App.E.tipos.filter((x) => x.tipo === T)[0];
  const clave = await Demo.datos._interno.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Lara Soto, Daniel', id: '2100072' }), Demo.datos._interno.hace(0), {});
  await App.verAbiertos();
  const a = App.E.listaAbiertos.filter((x) => x.nombre === clave)[0];
  App.abrirFicha(a);
  await esp(800);
  const q = (s) => document.querySelector('#ficha-datos-tramite ' + s);
  const sal = {};
  sal.vacioElegir = !!q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]');
  q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]').value = 'Sí';
  q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]').dispatchEvent(new Event('change', { bubbles: true }));
  await esp(1500);
  const b = q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]');
  sal.conCambiar = !!b;
  sal.sinDesplegable = !q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]');
  const sonda = () => SoloSi.detalle({ campo: 'Protocolo de absentismo iniciado', valores: ['Sí'] }, SoloSi.valoresDe(SoloSi.asuntoDeClave(clave))).estado;
  sal.condAntes = sonda();
  b.click();
  await esp(200);
  const sel = q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]');
  sal.abre = !!sel && sel.value === 'Sí';
  const otro = 'No';
  sal.otro = otro;
  sel.value = otro; sel.dispatchEvent(new Event('change', { bubbles: true }));
  await esp(2000);
  const campo = DatosDelAsunto.camposDelAsunto(a).filter((c) => c.nombre === 'Protocolo de absentismo iniciado')[0];
  sal.guardado = DatosDelAsunto.valorGuardado(a, Campos.claveDeCampo(campo.cfg));
  sal.visto = (q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]') || {}).dataset ? q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]').dataset.valor : null;
  const ficha = App.E.registro.asuntos[clave];
  sal.nota = ((ficha && ficha.notas) || []).map((n) => n.texto).filter((t) => t.indexOf('Protocolo de absentismo iniciado') === 0);
  sal.condDespues = sonda();
  /* soltar sin elegir */
  if (!q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]')) return sal;
  q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]').click();
  await esp(200);
  q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]').dispatchEvent(new Event('blur'));
  await esp(200);
  sal.soltado = !!q('.ficha-dato-cambiar[data-nombre="Protocolo de absentismo iniciado"]') && !q('.ficha-dato-elegir[data-nombre="Protocolo de absentismo iniciado"]');
  sal.clave = clave;
  return sal;
}, T);
console.log(JSON.stringify(r));
await comprobar('1. vacío con «Elegir…»; con valor, «Cambiar» y sin desplegable', Promise.resolve([r.vacioElegir, r.conCambiar, r.sinDesplegable]), [true, true, true]);
await comprobar('2. «Cambiar» abre el desplegable con el valor de ahora', Promise.resolve(r.abre), true);
await comprobar('2. el valor nuevo se guarda y se ve', Promise.resolve([r.guardado === r.otro, r.visto === r.otro]), [true, true]);
await comprobar('3. el registro lleva la línea del cambio', Promise.resolve(r.nota), ['Protocolo de absentismo iniciado: de Sí a ' + r.otro]);
await comprobar('4. las tareas con «Solo si» se recalculan', Promise.resolve([r.condAntes, r.condDespues]), ['sale', 'quita']);
await comprobar('6. soltarlo sin elegir lo deja como estaba', Promise.resolve(r.soltado), true);

console.log('--- 5. no abierto ---');
await comprobar('en consulta no hay «Cambiar»', pagina.evaluate(async (clave) => {
  const esp = (ms) => new Promise((x) => setTimeout(x, ms));
  FichaNucleo.modoActual = 'consulta'; FichaNucleo.pintar(); await esp(500);
  return !document.querySelector('#ficha-datos-tramite .ficha-dato-cambiar');
}, r.clave), true);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
