# Casos de prueba de la demostración grande

Fila 711 (19-nov-2026). Todo inventado, con semilla fija: salen siempre los mismos. Se ven con
`?demo=1&auto=1&grande=1` (sin `grande=1` la demostración es la pequeña de siempre). El juego grande **se suma** al pequeño: sus
casos (vencido, dormido, esperando a un tercero o a una Administración, reservado, recurrente, firmado y sellado, correo con adjunto,
Administración con varios departamentos, nombre de pila de más de 40 caracteres, hilo registrado…) siguen donde estaban (`docs/COPIA-DE-PRUEBAS.md`).

Tamaño (constante `Demo.grande.TAM` en `js/demo/datos-grande-personas.js`): 700 alumnos, 55 personas de personal, unos 50 asuntos abiertos y 400 cerrados en
tres cursos. Se dejó por debajo de lo pensado (150 y 1.500) porque con ese tamaño la demostración tardaba más de 25 s en entrar.

**Las filas siguientes añaden aquí sus propios casos** (una línea cada uno) y a los datos, cuando su instrucción lo pida.

## Personas (RegAlum.csv)
| Caso | Cómo verlo |
|---|---|
| Homónimos | «Nuevo asunto» → buscar «Homónimo»: «Homónimo Primero, Antonio» sale dos veces, en unidades distintas |
| Hermanos | uno de cada veinticinco alumnos tiene un hermano en otra unidad con los mismos apellidos y tutor; buscar un apellido repetido |
| Apellidos compuestos | «de la Cruz del Río, Mª Carmen» y «del Valle y de la Peña, Íñigo» |
| ñ y tildes | «Muñoz Peña, Ñusta Núñez» |
| Nombre de pila larguísimo | «Caso Nombrelargo Dosapellidos, María Concepción Josefa Remedios Dolores Trinidad Soledad» |
| Alumno sin número escolar | «Sinnúmero Escolar, Aspirante» (columna «Nº Id. Escolar» vacía) |
| Cambia de grupo | «Cambiado de Grupo, Leo»: una fila con la unidad nueva y otra, en «Baja», con la anterior |
| Baja a mitad de curso | «Bajademediocurso Ruiz, Pilar» (estado «Baja») |
| Custodia dicha y compartida | «Custodia Compartida, Hugo» (dos tutores, custodia de la primera) |
| Custodia que no coincide | «Custodia Dudosa, Vera» (custodia «Abuela materna») |
| Tutores sin custodia dicha | «Sin Custodia Dicha, Noa» |
| Tutores con DNI, NIE y pasaporte | `tutores.csv`: «Tutor Con Dni, Pilar», «Tutor Con Nie, Mohamed», «Tutor Con Pasaporte, Olga» |

## Terceros
| Caso | Cómo verlo |
|---|---|
| Empresa con nombre comercial | «Grande Suministros del Sur, S.L.» (Gran Sur) y «…del Norte, S.L.» (Gran Norte) |
| NIF repetido | esas dos empresas comparten el NIF `B20000001` |

## Asuntos
| Caso | Cómo verlo |
|---|---|
| Muchos del mismo tercero | ocho «CERTIFICADO» abiertos de «Homónimo Primero, Antonio» |
| Uno con 50 documentos | asunto de «de la Cruz del Río, Mª Carmen» con la descripción «CASO 50 DOCUMENTOS» |
| Uno del curso anterior | descripción «CASO CURSO ANTERIOR», de «Muñoz Peña, Ñusta Núñez», todavía abierto |
| Uno vencido | descripción «CASO VENCIDO», de «Custodia Dudosa, Vera», abierto hace más de un año |
| Mucha gente y mucho archivo | Inicio con decenas de asuntos; «Archivo» con tres cursos |

## Todavía sin caso (se añadirán cuando una fila los necesite)
Un asunto con 30 tareas · un asunto cerrado y reabierto · documentos Word en cantidad · tipo desactivado, plantilla sin uso, campo de lista vacío con «Solo si» y
plazos en festivo o en el cambio de curso · los listados de Séneca en Latin-1 con `;` y fechas `dd/mm/aaaa` (los de la demostración se escriben en UTF-8).
