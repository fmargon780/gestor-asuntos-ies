# 539 — Lo creado «solo este asunto» no entra en la lista común

## Lo que escribió Francisco

De la idea 538, punto (e), que dejó Claude Code al programar la fila 531:

> (e) crear una tarea «solo este asunto» también la deja en la lista común.

Al debatirlo, el 6-nov-2026: «Lo cambiamos así».

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

- En la ventana de «+ Añadir tarea» y «+ Añadir hito» del asunto, al crear una tarea o un hito nuevo con «Para: Solo este asunto», se añade a ese asunto y **no entra en la lista común**.
- Con «Este asunto y los siguientes» todo sigue igual: entra en la lista común y en la guía.
- Crear con nombre igual al de otra de la lista sigue sin dejarse cuando entra en la lista. Con «Solo este asunto» el nombre puede repetirse, porque no ocupa sitio en la lista.
- Si esa tarea vuelve a hacer falta en otro asunto, se crea otra vez (Francisco lo sabe y lo acepta).

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba. Lo que se ve no cambia; solo cambia lo que queda guardado.

## Qué NO se hace en esta tarea

- Quitar la caja «Nueva tarea…» del asunto, las tareas libres de las guías y «+ Traer un hito de otro tipo»: es la fila 532.
- Sacar de la lista común lo que ya esté creado así.

## Notas técnicas de Claude

- Ficheros: `js/comunes-ventana-nuevo.js` (botón `#cn-crear`) y, si hace falta, `js/comunes-ventana.js`. Pruebas: `pruebas/comunes-ventanas.mjs`.
- Hoy `#cn-crear` llama siempre a `ComunesGuardado.anadir` y después a `c.elegir(guardado)`. Con `c.st.para === 'aqui'` no se llama a `anadir`: se pasa el elemento a `c.elegir` sin guardarlo en las listas.
- `ponerTarea` y `ponerHito` (`js/comunes-asunto.js`), con «aqui», ya hacen copia suelta sin marca de común; mirar que funcionan con un elemento sin `id`.
- Comprobar `Comunes.existeNombre`: con «aqui» no debe impedir crear. Las ventanas de la guía (`js/comunes-guia.js`) no cambian.
- Cambios quirúrgicos y una sola tanda de pruebas al final.

## Cómo lo comprueba el segundo revisor

- Crear una tarea nueva con «Solo este asunto»: sale en el asunto y no sale en la ventana de «+ Añadir tarea» al abrirla otra vez.
- Crear un hito nuevo con «Solo este asunto»: igual, con sus tareas.
- Crear con «Este asunto y los siguientes»: sale en el asunto, en la guía y en la lista.
- La guía no cambia en el primer caso.
- Una tarea con plantilla nueva y «Solo este asunto» conserva su plantilla en el asunto.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
