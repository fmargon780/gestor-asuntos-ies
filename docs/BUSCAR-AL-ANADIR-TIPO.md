# Al escribir un tipo nuevo, la lista se filtra

Fila 122 de `docs/COLA.md`. Diseño cerrado con Francisco el 24-sep-2026.

## Qué pasa hoy

En Ajustes, los tipos de asunto y los tipos de documento son muchos (31 tipos de documento
el 24-sep-2026). Al escribir en la casilla «TIPO NUEVO» (`#nuevo-tipo` en `js/ajustes.js`,
`#nuevo-tipo-doc` en `js/ajustes-centro.js`), solo sale un aviso «Se parece a:» con como mucho
tres nombres, calculado con `U.parecidos` (`js/util.js`). Ese cálculo solo encuentra un nombre
contenido dentro de otro si los dos tienen 4 letras o más, y además mezcla parecidos por
erratas. Francisco no encuentra lo que ya existe y teme crear duplicados.

## Qué tiene que pasar

1. **La lista de tarjetas de debajo se filtra mientras se escribe.** Se quedan a la vista solo
   los tipos cuyo nombre **contiene** lo escrito, en cualquier parte del nombre (no solo al
   principio). Ejemplo: «FAMILIA» deja «LIBRO FAMILIA»; «CERT» deja «CERT. DEFUNCION» y
   «CERTIFICADO».
2. **Sin distinguir mayúsculas ni tildes.** «academico» encuentra «HISTORIAL ACADÉMICO».
   Usar la misma normalización que ya use `util.js` (la del «hueso» sin tildes), sin inventar
   otra. Los espacios y signos de lo escrito se comparan tal cual, tras quitar tildes y pasar a
   mayúsculas.
3. **Desde la primera letra.** Nada de mínimo de 4 letras para filtrar.
4. **Con la casilla vacía, la lista entera**, como hoy. Al pulsar «Añadir» y vaciarse la
   casilla, vuelve la lista entera.
5. **Si nada coincide**, en el hueco de la lista una línea: «Ninguno contiene "<lo escrito>".
   Puedes añadirlo.» El contador del título (el «31») sigue diciendo el total, no los filtrados.
6. **Si lo escrito ya existe tal cual**, «Añadir» se queda desactivado y sale «Ya existe: …»,
   igual que hoy (eso ya funciona; no se toca). El aviso ámbar «Se parece a:» se queda, porque
   sigue cazando erratas que el filtro no ve.
7. **Igual en los dos sitios**: tipos de asunto (pestaña «Tipos de asunto», respetando su
   agrupación por categoría: una categoría sin ningún tipo que coincida no se enseña) y tipos de
   documento (pestaña del centro). Una sola función compartida para el filtrado, no dos copias.
8. El filtro solo oculta tarjetas. No cambia el orden, no toca los datos y no afecta a los
   menús de cada tarjeta (los tres puntos).

## Pruebas

Añadir a `pruebas/` un caso para cada lista: escribir «familia» y comprobar que solo queda
«LIBRO FAMILIA»; escribir «academico» y comprobar que sale «HISTORIAL ACADÉMICO»; escribir una
cadena que no coincide y comprobar la línea de «Ninguno contiene»; vaciar la casilla y comprobar
que vuelve la lista entera.

## Al terminar

Lo normal de la cola: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` actualizados, entrada en
`docs/HISTORIA.md`, fila 122 HECHA con la versión publicada.
