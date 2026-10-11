/* La parte que decide del segundo intento a solas (fila 333, docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md).
   No lanza nada: recibe resultados y devuelve la decisión, para poder probarla sin navegador. */

export const MAS_DE = 10;   /* pasar de aquí al segundo intento avisa de que la máquina va muy cargada */

/* Qué pruebas de la tanda en paralelo hay que repetir a solas: las que han fallado y no iban ya a solas. */
export function aRepetir(resultadosParalelo, enSolitario) {
  return resultadosParalelo.filter((r) => !r.ok && !enSolitario.includes(r.fichero)).map((r) => r.fichero);
}

/* Junta los resultados de la primera pasada con los de los segundos intentos.
   Devuelve { finales, recuperadas, fallos }: `finales` es un resultado por prueba (el del segundo intento
   sustituye al primero), `recuperadas` las que fallaron en paralelo y pasaron a solas, `fallos` las que fallan. */
export function decidir(primeros, segundos) {
  const porFichero = new Map(segundos.map((r) => [r.fichero, r]));
  const finales = primeros.map((r) => porFichero.get(r.fichero) || r);
  const recuperadas = segundos.filter((r) => r.ok).map((r) => r.fichero);
  const fallos = finales.filter((r) => !r.ok).map((r) => r.fichero);
  return { finales, recuperadas, fallos };
}

/* Las líneas del resumen que cuentan los segundos intentos (vacías si no hubo ninguno). */
export function lineasDelResumen(recuperadas) {
  const lineas = [];
  if (recuperadas.length) {
    lineas.push(recuperadas.length + ' pasaron al segundo intento, a solas: ' + recuperadas.join(', '));
  }
  if (recuperadas.length > MAS_DE) {
    lineas.push('Demasiadas pruebas necesitan segundo intento (' + recuperadas.length +
      '). La máquina va muy cargada: prueba con PRUEBAS_A_LA_VEZ=2.');
  }
  return lineas;
}

export function tituloSegundoIntento(fichero) { return fichero + ' (segundo intento, a solas)'; }
