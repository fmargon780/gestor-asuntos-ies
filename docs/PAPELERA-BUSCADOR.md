# Buscador en la papelera (fila 172)

Acordado con Francisco el 26-sep-2026. Diseño cerrado.

## Qué quiere

En **Ajustes › Papelera** la lista puede crecer mucho (no se vacía sola). Encontrar una cosa
concreta obliga a recorrerla entera. Hace falta una caja de búsqueda.

## Cómo tiene que ser

1. **Una caja de búsqueda encima de la lista** del bloque Papelera de Ajustes
   (`js/papelera-ajustes.js`), con el texto de ayuda «Buscar en la papelera».
2. **Filtra mientras se escribe**, sin botón. Caja vacía = lista entera, como hoy.
3. **Palabras sueltas, en cualquier orden**, igual que el buscador de asuntos: una línea se
   queda si contiene **todas** las palabras escritas. Sin distinguir mayúsculas ni tildes
   (`U.normalizar`). Ejemplo: «garcia matricula» encuentra «Matrícula … García López, Ana».
4. **Dónde busca**, en cada línea de la papelera:
   - el nombre de lo borrado;
   - qué era (asunto, documento, tipo de asunto, persona…);
   - de dónde salía (la ruta o el asunto de origen);
   - quién lo borró;
   - la fecha, escrita como se ve en pantalla y también como `AAMMDD` y `dd/mm/aaaa`, para que
     «2609» o «26/09» encuentren lo borrado ese día.
5. **Contador al lado de la caja**: «12 de 85». Sin nada escrito, solo el total.
6. Si no hay coincidencias: «Nada en la papelera con esas palabras.»
7. **Los botones de cada línea no cambian**: «Devolver a su sitio» y «Borrar del todo», con sus
   confirmaciones de siempre.
8. **Lo escrito se conserva** al repintarse la lista (tras devolver o borrar una línea, o si llega
   un cambio del compañero): usar `U.conservandoLoEscrito`. El filtro se vuelve a aplicar solo.
9. **El aviso ámbar de «más de 30 días»** y su botón de borrar todo de golpe siguen actuando sobre
   la papelera entera, no sobre lo filtrado. Que el texto del botón lo deje claro si hay filtro
   puesto (por ejemplo, «Borrar del todo las N de más de 30 días (de toda la papelera)»).

## Lo que no se hace

- Nada de buscar dentro del contenido de los documentos borrados: solo lo que ya dice la lista.
- No se toca el índice `_GESTOR/papelera.json`: el filtro es solo de pantalla.

## Prueba

Añadir una prueba en `pruebas/` que mande tres cosas a la papelera y compruebe que dos palabras
en desorden y sin tildes dejan solo la que toca, que el contador dice «1 de 3», y que tras
«Devolver a su sitio» la caja conserva lo escrito.

## Al terminar

Reglas de siempre de `docs/COLA.md`: una línea en `docs/CONTEXTO-CORTO.md` (la de «Papelera»
de la sección 5, sustituyéndola), el bloque Papelera de `docs/contexto/ASUNTOS-ARCHIVO.md` y
una entrada en `docs/HISTORIA.md`.
