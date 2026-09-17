/* Prueba de Verificacion.leerDelTexto, sin PDF y sin navegador
   (17-sep-2026, fila 19, docs/CSV-DEL-DOCUMENTO.md). Mismo estilo que
   pruebas/logica.mjs: el fichero se carga tal cual en un contexto de
   Node con `vm`, sin librerías ni disco de mentira, porque
   `leerDelTexto` no toca nada de eso. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(raiz + 'verificacion.js', 'utf8'), contexto, { filename: 'verificacion.js' });
const { Verificacion } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* 1. Pie de un documento de verdad (Séneca), con código y dirección. */
comprobar('1. pie de Séneca: saca el código y la dirección',
  Verificacion.leerDelTexto(
    'Código Seguro de Verificación (CSV): 29700692F7X8K2M1N4P6Q0R3\n' +
    'Puede verificar la integridad de este documento en la siguiente dirección ' +
    'https://www.juntadeandalucia.es/educacion/verificafirma/verificarDocumento/?csv=29700692F7X8K2M1N4P6Q0R3'),
  { codigo: '29700692F7X8K2M1N4P6Q0R3',
    enlace: 'https://www.juntadeandalucia.es/educacion/verificafirma/verificarDocumento/?csv=29700692F7X8K2M1N4P6Q0R3' });

/* 2. Etiqueta "CSV:" a secas. */
comprobar('2. "CSV:" a secas saca el código',
  Verificacion.leerDelTexto('Firmado electrónicamente. CSV: AB12CD34EF56'),
  { codigo: 'AB12CD34EF56', enlace: '' });

/* 3. Con tildes, y partida en dos líneas (el espacio de después cuenta
   como el hueco normal entre etiqueta y código). */
comprobar('3. "Código Seguro de Verificación", con tildes y en dos líneas',
  Verificacion.leerDelTexto('CÓDIGO SEGURO DE VERIFICACIÓN\nCSV0011223344AA'),
  { codigo: 'CSV0011223344AA', enlace: '' });

/* 4. Un punto pegado al final de la dirección no debe entrar. */
comprobar('4. el punto final de la frase no entra en la dirección',
  Verificacion.leerDelTexto(
    'CVE: 99887766ZZ\nVerifíquelo en https://sede.ayuntamiento.example/verifica/documento.'),
  { codigo: '99887766ZZ', enlace: 'https://sede.ayuntamiento.example/verifica/documento' });

/* 5. Varias direcciones: se queda con la de verificación, no la de la
   web general del organismo. */
comprobar('5. entre varias direcciones, coge la de verificación',
  Verificacion.leerDelTexto(
    'CVE: 11223344556677\n' +
    'Más información en https://www.organismo.example/\n' +
    'Compruebe este documento en https://www.organismo.example/cotejo/'),
  { codigo: '11223344556677', enlace: 'https://www.organismo.example/cotejo/' });

/* 6. Sin nada de esto: los dos campos vacíos, sin reventar. */
comprobar('6. un texto cualquiera no saca nada',
  Verificacion.leerDelTexto('Esto es un documento normal, sin ningún sello ni código.'),
  { codigo: '', enlace: '' });
comprobar('6b. tampoco revienta con texto vacío',
  Verificacion.leerDelTexto(''), { codigo: '', enlace: '' });
comprobar('6c. ni con undefined',
  Verificacion.leerDelTexto(undefined), { codigo: '', enlace: '' });

/* 7. Un código de menos de ocho caracteres no se toma por código. */
comprobar('7. un código de menos de ocho caracteres no cuenta',
  Verificacion.leerDelTexto('CSV: AB12CD'),
  { codigo: '', enlace: '' });

/* Extra: sin etiqueta de código, aunque haya una dirección de
   verificación, no se inventa ningún código. */
comprobar('extra: sin etiqueta, no hay código aunque haya dirección',
  Verificacion.leerDelTexto('Compruebe este documento en https://sede.example/verifica/'),
  { codigo: '', enlace: 'https://sede.example/verifica/' });

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
