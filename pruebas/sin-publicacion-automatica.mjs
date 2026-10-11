/* Fila 331 (docs/PUBLICAR-SOLO-AL-TERMINAR.md): Vercel no publica nada solo.
   Sin navegador: lee vercel.json y falla si `git.deploymentEnabled` no es exactamente `false`,
   si existe `ignoreCommand` (las publicaciones canceladas también cuentan en el tope de 100 al día)
   o si falta el bloque de cabeceras de siempre. Sustituye a vercel-ignore-command.mjs. */
import fs from 'node:fs';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const json = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
comprobar('1. git.deploymentEnabled es exactamente false', json.git && json.git.deploymentEnabled, false);
comprobar('2. no hay ignoreCommand', 'ignoreCommand' in json, false);
comprobar('3. el script del ignoreCommand ya no existe', fs.existsSync(new URL('../scripts/vercel-ignore-build.sh', import.meta.url)), false);
comprobar('4. buildCommand y outputDirectory siguen como siempre', [json.buildCommand, json.outputDirectory], ['node scripts/version-al-publicar.mjs', '.']);
comprobar('5. las cabeceras de seguridad siguen ahí',
  json.headers.flatMap((h) => h.headers).map((x) => x.key).sort(),
  ['Cache-Control', 'Content-Security-Policy', 'Referrer-Policy', 'X-Content-Type-Options']);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
