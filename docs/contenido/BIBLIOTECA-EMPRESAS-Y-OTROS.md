# Biblioteca de hitos — EMPRESAS y OTROS

Contenido de la fila 80. La notación está en `docs/CARGAR-BIBLIOTECA.md`, apartado 2.

Bloque del sistema de normativa usado aquí: `economica`.

---

# EMPRESAS

## La regla que manda en toda la categoría

Dos campos propios obligatorios en **todos** los tipos de EMPRESAS, porque de ellos depende el
trámite entero:

- **`Objeto`**, lista cerrada: obra / suministro / servicio. Decide el umbral legal.
- **`Importe sin IVA`**, texto. Es el dato que manda, no el total de la factura.

Las cifras que hay que tener a mano:

| Cifra | Qué determina |
|---|---|
| 40.000 € sin IVA | Techo del contrato menor de obras (Ley 9/2017, art. 118.1) |
| 15.000 € sin IVA | Techo del contrato menor de suministros y servicios (Ley 9/2017, art. 118.1) |
| 1 año, sin prórroga | Duración máxima del contrato menor (Ley 9/2017, art. 29.8) |
| 10 % del crédito anual | Techo de adquisición de material inventariable; el bibliográfico no computa (Orden de 10 de mayo de 2006, art. 3.2.b) |
| 300,50 € con IVA | Desde ahí, inscripción obligatoria en el inventario del centro (Instrucción 1/2021) |
| 400 € con IVA | Techo general de la factura simplificada (Real Decreto 1619/2012, art. 4.1.a) |
| 5.000 € impuestos incluidos | Desde ahí, la factura en papel no vale: va al Registro Contable (Decreto 75/2016, art. 2.4) |
| 30 días naturales | Plazo general de pago (Ley 3/2004, art. 4) |
| 20 días naturales | Plazo reducido en determinadas obligaciones educativas (Decreto 5/2017, art. 4.2) |
| 600 € | Saldo máximo de efectivo en caja (Orden de 10 de mayo de 2006, art. 10.1) |

**Tres cosas que se dan por buenas en los centros y ya no son ciertas:**

1. El límite de 15.000 € por contratista al año **desapareció** con el Real Decreto-ley 3/2020.
   Lo que sigue prohibido es fraccionar el contrato.
2. **Pedir tres ofertas no lo exige la Ley de Contratos.** Solo lo imponen las instrucciones de
   Formación Profesional para sus propios fondos.
3. La exención del informe de necesidad por debajo de 5.000 € está **condicionada al anticipo de
   caja fija**. Un instituto paga desde su cuenta y tiene 600 € de caja como tope: mejor no
   ampararse en ella.

---

## Los tipos

### COMPRA — Compra de bienes o servicios
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

1. Recoger la petición · Secretaría · del departamento o de la dirección
2. Comprobar el crédito · Secretaría · si es material inventariable, el techo es el 10 % del crédito anual de gastos de funcionamiento, con informe previo de la Delegación y aprobación del Consejo Escolar; el material bibliográfico no computa · norma: Orden de 10 de mayo de 2006, art. 3.2.b) {economica|O2006-3.2.b)}
3. Calcular el valor estimado, sin IVA · Secretaría · es el hito que más se falla · norma: Ley 9/2017, art. 118.1 {economica|LCSP-118.1}
4. Comprobar el umbral · Secretaría · 40.000 € en obras y 15.000 € en suministros y servicios; por encima ya no es contrato menor y no lo tramita el centro · norma: Ley 9/2017, art. 118.1 {economica|LCSP-118.1}
5. [i] Informe de necesidad · Dirección · por qué hace falta y por qué no se está fraccionando · norma: Ley 9/2017, art. 118 {economica|LCSP-118}
6. [i] Aprobar el gasto · Dirección
7. Pedido al proveedor · Secretaría · reunir: pedido
8. Recepción y conformidad · Secretaría · reunir: albarán firmado
9. Registrar la factura · Secretaría · reunir: factura completa · factura simplificada solo hasta 400 € con IVA; desde 5.000 € impuestos incluidos, la de papel no vale · norma: Real Decreto 1619/2012, art. 4.1.a) {economica|RD1619-4.1.a)} + Decreto 75/2016, art. 2.4 {economica|D75-2.4}
10. Pagar · Secretaría · 30 días naturales de plazo general y 20 en determinadas obligaciones educativas · norma: Ley 3/2004, art. 4 {economica|L3-4} + Decreto 5/2017, art. 4.2 {economica|D5-4.2}
11. Alta en inventario, si procede · Secretaría · obligatoria desde 300,50 € con IVA de valor unitario · norma: Instrucción 1/2021 {economica|I1-2021}
12. Archivar el justificante · Secretaría

### SUMINISTRO — Contrato menor de suministro
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

Mismos hitos que COMPRA. Umbral: 15.000 € sin IVA.

### OBRA — Contrato menor de obra
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

Mismos hitos que COMPRA. Umbral: 40.000 € sin IVA.

### CONTRATO MENOR — Expediente de contrato menor
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

Mismos hitos que COMPRA. Es el tipo que hoy se llama CONTRATO: hay que renombrarlo.

### MANTENIMIENTO — Contrato de mantenimiento
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

1. Contrato o encargo · Secretaría · reunir: contrato o encargo con objeto, duración y precio sin IVA
2. Calendario de revisiones · Secretaría
3. Parte de cada revisión · Secretaría · cada parte, un documento del asunto
4. Factura y pago · Secretaría · 30 días naturales, o 20 en obligaciones educativas · norma: Ley 3/2004, art. 4 {economica|L3-4}
5. Aviso antes del vencimiento · Secretaría · para decidir si se renueva

Nota del tipo: asunto recurrente anual, con la fecha de vencimiento como fecha límite. El contrato menor dura un año como máximo y no se prorroga (Ley 9/2017, art. 29.8).

### GARANTIA — Garantía de un bien o servicio
Encarga: Secretaría
Campos: Objeto; Importe sin IVA

1. Anotar el inicio de la garantía · Secretaría · fecha de la factura o del acta de recepción
2. Guardar los papeles · Secretaría · reunir: factura; documento de garantía
3. Fecha límite del asunto · Secretaría · el fin de la garantía
4. Aviso antes de que venza · Secretaría
5. Reclamación al proveedor, si hay incidencia · Secretaría · por escrito y con acuse de recibo

---

# OTROS

### PRESUPUESTO — Presupuesto del centro
Encarga: Secretaría
NUEVO

1. Recibir la comunicación del crédito asignado · Secretaría
2. Elaborar el proyecto · Secretaría · reunir: estado de ingresos; estado de gastos; Anexos I, II y III · norma: Orden de 10 de mayo de 2006 {economica|O2006-4}
3. Comprobar el equilibrio e incorporar el remanente · Secretaría
4. Aprobarlo en Consejo Escolar · Dirección
5. Registrarlo en Séneca · Secretaría
6. Modificaciones durante el año · Secretaría · documentadas; lo finalista no se mueve nunca

Nota del tipo: los fondos de funcionamiento llegan en cuatro libramientos al año como mínimo (Orden de 10 de mayo de 2006, art. 6.2). Asunto recurrente anual.

### CUENTA DE GESTION — Cuenta de gestión y cierre del ejercicio
Encarga: Secretaría
NUEVO

1. Cerrar el ejercicio · Secretaría
2. Montar la cuenta de gestión · Secretaría · reunir: anexos de la Orden de 10 de mayo de 2006
3. Aprobarla en Consejo Escolar · Dirección
4. Remitirla · Secretaría · tope: 30 de octubre · norma: Orden de 10 de mayo de 2006, art. 15.3 {economica|O2006-15.3}

Nota del tipo: asunto recurrente anual, con fecha límite el 30 de octubre. Es la fecha más dura del año.

### RETENCIONES — Retenciones y obligaciones fiscales
Encarga: Secretaría
NUEVO

1. Modelo 095 · Secretaría · cada trimestre
2. Modelo 190 · Secretaría · resumen anual
3. Declaración de operaciones con terceros · Secretaría · anual, por Séneca; el centro remite todas las operaciones del ejercicio, superen o no los 3.005,06 €

Nota del tipo: retención del 15 % a profesionales, y del 7 % en el año de inicio de actividad y los dos siguientes si la persona lo comunica por escrito (Real Decreto 439/2007, art. 95.1). Asunto recurrente trimestral.

### INVENTARIO — Inventario del centro
Encarga: Secretaría
NUEVO

1. Alta de cada bien · Secretaría · obligatoria desde 300,50 € con IVA de valor unitario; por debajo, potestativa · norma: Instrucción 1/2021 {economica|I1-2021}
2. Bajas · Secretaría · con su motivo
3. Cierre anual · Secretaría

Nota del tipo: no confundirlo con el Inventario General de Bienes de la Comunidad, cuyo umbral es de 1.500 € y no es el del centro. Asunto recurrente anual.

### GRATUIDAD LIBROS — Programa de gratuidad de libros de texto
Encarga: Secretaría
NUEVO

1. Comprobar el remanente del curso anterior · Secretaría · se incorpora como primera partida de la dotación del curso siguiente · norma: Instrucciones de gratuidad de 9 de junio de 2026
2. Reutilización y reposición · Secretaría · en 2026/2027 no hay cheque-libro en ESO: se mantienen los libros y solo hay reposición, con tasa del 8 % en 1.º, 2.º y 3.º y del 5 % en 4.º · norma: Instrucciones de gratuidad de 9 de junio de 2026
3. Dotación específica de NEAE · Secretaría · 147 € por alumno con material adaptado · norma: Instrucciones de gratuidad de 9 de junio de 2026
4. Cheque-libro electrónico, donde lo haya · Secretaría · va por el Punto de Recogida Electrónico; hay que comprobar en Séneca si la librería ha registrado la aceptación leyendo el código QR, y si no, lo registra el centro
5. Estado de gastos en Séneca · Secretaría · antes del 31 de octubre de 2026 · norma: Instrucciones de gratuidad de 9 de junio de 2026
6. Solicitud de aumento de cuantía, si hace falta · Dirección · Anexo VI con memoria motivada, antes del 31 de mayo de 2027 · norma: Instrucciones de gratuidad de 9 de junio de 2026
7. Justificación · Secretaría · Anexo XI en Séneca, con fecha cierta del 30 de junio de 2027 · norma: Instrucciones de gratuidad de 9 de junio de 2026

Nota del tipo: los centros no pueden, bajo ningún concepto, requerir a las familias contribución económica para la adquisición de libros de texto. Asunto recurrente anual.

### ELECCIONES CONSEJO ESCOLAR — Elecciones al Consejo Escolar
Encarga: Secretaría
NUEVO

1. [i] Constituir la Junta Electoral · Dirección
2. Publicar el censo · Secretaría · y resolver las reclamaciones
3. Recoger candidaturas · Secretaría
4. [i] Proclamar candidaturas · Junta Electoral
5. Votación por sectores · Secretaría · profesorado, familias, alumnado y personal de administración y servicios
6. Actas de escrutinio · Secretaría
7. [i] Constitución del nuevo Consejo Escolar · Dirección
8. Grabar el resultado en Séneca · Secretaría

Nota del tipo: los plazos salen de la normativa de elección de Consejos Escolares, que todavía no está en el sistema de normativa del centro. Se dejan vacíos a propósito. Asunto recurrente cada dos años.

### CONSEJO ESCOLAR — Sesión del Consejo Escolar
Encarga: Dirección

1. Convocatoria · Secretaría · la extraordinaria, con 48 horas de antelación como mínimo · norma: Decreto 327/2010, art. 52.3 {convivencia|ROC-52.3}
2. Orden del día y documentación · Secretaría
3. [i] Celebración de la sesión · Dirección
4. Acta · Secretaría
5. Comunicar los acuerdos · Secretaría

### CORRESPONDENCIA — Correspondencia de entrada o de salida
Encarga: Secretaría

1. Registrar · Secretaría · con su número y su fecha
2. Repartir o remitir · Secretaría
3. Archivar · Secretaría

### SUBVENCION — Subvención
Encarga: Secretaría
Campos: Convocatoria

1. Publicar o recibir la convocatoria · Secretaría
2. Presentar la solicitud en plazo · Secretaría · reunir: solicitud; documentación de la convocatoria
3. Recibir la resolución · Secretaría
4. Ejecutar el gasto · Secretaría · lo finalista no se puede mover a otra finalidad
5. Justificar · Secretaría · es donde se pierden las subvenciones

### ACTIVIDAD EXTRAESCOLAR — Actividad complementaria o extraescolar
Encarga: Jefatura de Estudios

1. [i] Propuesta del departamento · Jefatura de Estudios
2. [i] Aprobación del Consejo Escolar · Dirección
3. Autorizaciones de las familias · Secretaría · reunir: autorización firmada de cada alumno
4. Cobro y control de ingresos, si lo hay · Secretaría
5. Liquidación al volver · Secretaría · reunir: facturas; justificantes de gasto

### INSPECCION — Actuación del Servicio de Inspección
Encarga: Dirección

1. Registrar el requerimiento o la visita · Secretaría
2. [i] Preparar la respuesta · Dirección
3. Reunir la documentación · Secretaría
4. Remitir en plazo · Secretaría · el plazo lo fija el propio requerimiento
5. Archivar · Secretaría

### CONVENIO — Convenio con una entidad
Encarga: Dirección

1. [i] Negociar el texto · Dirección
2. [i] Aprobación que corresponda · Dirección
3. Firma · Secretaría · reunir: convenio firmado
4. Fecha límite del asunto · Secretaría · el fin de la vigencia
5. Aviso antes de que venza · Secretaría

### PROYECTO — Proyecto o programa educativo
Encarga: Dirección

1. Presentar la solicitud en plazo · Secretaría
2. Recibir la resolución · Secretaría
3. [i] Desarrollo del proyecto · Dirección
4. Memoria final · Secretaría · reunir: memoria; justificación del gasto si lo hubo

### COMUNICADO — Comunicado
Encarga: Dirección

1. [i] Redactar el comunicado · Dirección
2. Difundir · Secretaría
3. Archivar · Secretaría

### PARADA TTE. ESCOLAR — Parada de transporte escolar
Encarga: Secretaría

1. Recoger la solicitud · Secretaría · reunir: solicitud; domicilio y distancia
2. [i] Informe del centro · Dirección
3. Remitir a la Delegación Territorial · Secretaría
4. Comunicar la resolución a la familia · Secretaría

---

## Lo que hay que quitar, y no lo hace esta fila

Francisco lo borrará desde la aplicación cuando el borrado de tipos funcione (apartado 9 de la
fila 79). Queda apuntado aquí para que no se cargue contenido en ellos:

- **ANULACIÓN** (ALUMNADO), duplicado de ANULACIÓN MATRÍCULA.
- **DTMA (PLANIFICACION)** (OTROS), duplicado de PARADA TTE. ESCOLAR.
- **INCAPACIDAD TEMPORAL** (OTROS), que es BAJA MEDICA y vive en PERSONAL.
- **JUSTIFICACION FALTAS PAS** (PERSONAL), sustituido por AUSENCIA, que cubre los tres colectivos.
