/* Prueba en navegador de verdad de los campos de cada tipo de asunto
   (docs/CAMPOS-POR-TIPO.md).

   Sin js/campos.js esta prueba falla desde la primera comprobación:
   `#bloque-campos` y `#campos-lista-nuevo` no existen en el HTML viejo,
   el botón "Campos" no está en la fila de un tipo en Ajustes, y
   `App.E.campos` no se llega a rellenar nunca porque `App.cargarCampos`
   no existe. Con el cambio, las ocho comprobaciones de más abajo pasan.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, pero con su
   propio RegAlum.csv: trae Unidad y una columna nueva, "Modalidad de
   Bachillerato", que no viene rellena en el alumnado de la ESO. Así
   se comprueba, con datos reales, que un campo vacío no es un error.

   Corre a 1905 píxeles, el ancho del monitor del trabajo (como
   pruebas/tablon.mjs): con eso se ve si el bloque "Datos del asunto" y
   el cuadro de Campos de Ajustes aprovechan el ancho de verdad. */
