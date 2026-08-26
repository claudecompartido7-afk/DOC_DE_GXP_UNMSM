/**
 * Recomendaciones por hallazgo
 * -----------------------------
 * Cada hallazgo se descompone en acciones independientes. La unidad no es
 * el hallazgo sino la recomendación: el equipo acepta, edita o rechaza cada
 * una por separado, y cada una viaja al registro de Drive con su propio
 * código (D1-01-R1, D1-01-R2, …).
 *
 * Criterios de redacción
 *  · Una sola acción por recomendación, en imperativo y verificable.
 *  · Ordenadas por dependencia: primero lo que desbloquea, después lo que
 *    depende de ello.
 *  · `q` responsable propuesto · `e` entregable con el que se da por cerrada.
 *    Ambos son propuestas: el equipo los ajusta al aceptar.
 *
 * OR = Oficina de Racionalización · OGPL = Jefatura de la Oficina General de
 * Planificación · UPPR = Unidad de Planeamiento · VRAP, OCCAA = órganos
 * consultados · F = facultades.
 */
window.GXP_RECS = {

/* ==================== D1 · PLAN DE GESTIÓN DEL ALCANCE ==================== */

'D1-01': [
  { t:'Sustituir las dos filas contradictorias de la tabla «Dentro / Fuera» por una sola redacción: dentro del alcance está la documentación de procesos que cada facultad elabora en los Anexos 1 y 3; fuera está la documentación de procesos de unidades centrales ajenas a la facultad.',
    q:'OR', e:'Tabla §2 corregida en el D1 v2.0' },
  { t:'Añadir al §3 el criterio que resuelve cualquier caso futuro: documenta el proceso la unidad que lo ejecuta, no la que lo supervisa.',
    q:'OR', e:'Párrafo nuevo en §3' },
  { t:'Tramitar la corrección como solicitud de cambio del alcance y comunicarla por oficio a las 20 facultades, para que ninguna siga trabajando con la versión ambigua.',
    q:'OGPL', e:'Oficio circular con acuse de las 20 facultades' }
],

'D1-02': [
  { t:'Renombrar la tarea del cronograma «AUTOMATIZACIÓN CULMINADA» como «Automatización de la carga de datos en SIGPRO», de modo que su nombre indique qué se automatiza.',
    q:'OR', e:'Celda D27 del cronograma actualizada' },
  { t:'Precisar la exclusión del D1: donde dice «Automatización de los procesos» debe decir «Automatización de los procesos de negocio de las facultades», que es lo que realmente queda fuera.',
    q:'OR', e:'Fila 8 de la tabla §2 corregida' },
  { t:'Incorporar al glosario del D1 la distinción entre automatizar el sistema de gestión (dentro del alcance) y automatizar el proceso de la facultad (fuera del alcance).',
    q:'OR', e:'Entrada de glosario en el D1' }
],

'D1-03': [
  { t:'Adoptar en acta la separación del componente SIGPRO: el desarrollo permanece en la Fase 1 y el despliegue con las facultades pasa a la Fase 2.',
    q:'OGPL', e:'Acta de acuerdo del equipo' },
  { t:'Declarar expresamente si la disponibilidad de SIGPRO es condición para cerrar la Fase 1. De la respuesta depende que su retraso bloquee o no el 30 de setiembre.',
    q:'OGPL', e:'Cláusula en el criterio de cierre de fase' },
  { t:'Una vez decidido, reubicar la Actividad 1.3.4 en el cronograma y alinear el párrafo 3 del §3 del D1 con esa ubicación.',
    q:'OR', e:'Cronograma y D1 coincidentes' }
],

'D1-04': [
  { t:'Reescribir la EDT del D1 con los mismos cuatro niveles del cronograma —Fase, Etapa, Actividad, Tarea— y con los mismos códigos, de modo que una tarea del Gantt se pueda rastrear hasta su paquete de trabajo.',
    q:'OR', e:'EDT de cuatro niveles en el D1 v2.0' },
  { t:'Corregir las celdas desalineadas de los niveles 2 y 3 de la tabla actual, que hoy hacen ilegible la jerarquía.',
    q:'OR', e:'Tabla EDT sin celdas desplazadas' },
  { t:'Añadir el diccionario de la EDT: para cada paquete de trabajo, su entregable, su criterio de aceptación y su responsable.',
    q:'OR', e:'Diccionario de la EDT como anexo del D1' }
],

'D1-05': [
  { t:'Renumerar el flujo de control de cambios a seis pasos correlativos, eliminando la duplicación del número 5.',
    q:'OR', e:'Diagrama de flujo renumerado' },
  { t:'Asignar al Jefe de OGPL la aprobación del Mapa de Procesos modificado, que hoy figura con la celda de responsable vacía.',
    q:'OGPL', e:'Celda de responsable completada' },
  { t:'Fijar un plazo máximo de respuesta para cada paso del flujo, de modo que una solicitud de cambio no pueda quedar detenida indefinidamente.',
    q:'OGPL', e:'Plazos incorporados al flujo' }
],

'D1-06': [
  { t:'Dejar una sola A por fila en la matriz RACI: el Decano aprueba el MAGPROF de su facultad y el Jefe de OGPL pasa de A a C.',
    q:'OGPL', e:'Matriz RACI con un único aprobador por actividad' },
  { t:'Aplicar el mismo criterio a la fila del MAPRO, que hoy repite la doble aprobación.',
    q:'OGPL', e:'Fila MAPRO corregida' },
  { t:'Registrar la aprobación institucional como un hito aparte del cronograma, en lugar de resolverla con una segunda A en la matriz.',
    q:'OR', e:'Hito de aprobación institucional en el cronograma' }
],

'D1-07': [
  { t:'Añadir a la matriz de trazabilidad la columna «Tarea de la EDT» y completarla para los siete requisitos RQ-01 a RQ-07.',
    q:'OR', e:'Matriz de trazabilidad con vínculo al cronograma' },
  { t:'Comprometer fecha para RQ-05 (aprobación del MAGPROF) y RQ-07 (MAPRO), que hoy figuran «Pendiente» sin plazo.',
    q:'OGPL', e:'Fechas comprometidas en la matriz' },
  { t:'Verificar en sentido inverso que toda tarea del cronograma sirva a algún requisito: la que no lo haga, o sobra, o revela un requisito no declarado.',
    q:'OR', e:'Informe de cobertura requisito ↔ tarea' }
],

'D1-08': [
  { t:'Dejar de escribir a mano el estado de los requisitos: debe calcularse desde el estado de las tareas del cronograma que los entregan.',
    q:'OR', e:'Columna de estado por fórmula' },
  { t:'Mientras no exista el cálculo automático, declarar en el propio documento que el cronograma es la fuente y la matriz sólo un reflejo.',
    q:'OR', e:'Nota de fuente única en la matriz' }
],

'D1-09': [
  { t:'Abrir el plan de gestión de riesgos con las nueve entradas ya identificadas en el diagnóstico, cuatro de ellas materializadas.',
    q:'OGPL', e:'Registro de riesgos R-01 a R-09 formalizado' },
  { t:'Abrir el plan de interesados y comunicaciones: es el área que gobierna la falta de respuesta de facultades, VRAP y OCCAA, que hoy es el principal freno.',
    q:'OGPL', e:'Matriz de interesados y plan de comunicaciones' },
  { t:'Renombrar el documento como «Plan de Dirección del Proyecto» y declarar en su índice qué áreas del PMBOK están cubiertas y cuáles quedan pendientes, con fecha.',
    q:'OGPL', e:'Índice de áreas con estado y fecha' },
  { t:'Postergar de forma explícita costos, recursos y adquisiciones si no se van a redactar ahora, en lugar de dejarlos sin mención.',
    q:'OGPL', e:'Acta con el alcance documental acordado' }
],

/* ==================== D2 · CRONOGRAMA (GANTT) ==================== */

'D2-01': [
  { t:'Renombrar la celda «% AVANCE DEL PROYECTO: 78%» como «% de actividades iniciadas o culminadas · Fase 1», que es lo que el número mide en realidad.',
    q:'OR', e:'Celda M3 del cronograma corregida' },
  { t:'Escribir la fórmula debajo del indicador —(culminadas + en proceso) ÷ actividades de la fase— para que cualquier lector pueda reconstruirla.',
    q:'OR', e:'Fórmula visible en el banner' },
  { t:'Retirar esa cifra de todo reporte de avance dirigido al Rectorado o a los decanos: el avance de fase se toma únicamente del D4.',
    q:'OGPL', e:'Instrucción escrita al equipo de reportes' }
],

'D2-02': [
  { t:'Rotular explícitamente los tres contadores del banner como «actividades», ya que «6 de 18» cuenta actividades y no tareas.',
    q:'OR', e:'Contadores rotulados en el banner' },
  { t:'Añadir una segunda fila de contadores por tarea, con su propio rótulo, para quien necesite el detalle fino.',
    q:'OR', e:'Fila de contadores por tarea' }
],

'D2-03': [
  { t:'Declarar la dependencia entre las dos tareas de SIGPRO: «Front-End culminado» precede a «DESARROLLO DEL SISTEMA COMPLETADO». Hoy el sistema completo empieza dos meses antes que el componente que lo integra.',
    q:'OR – MELI', e:'Columna de predecesora completada' },
  { t:'Actualizar el estado de «DESARROLLO DEL SISTEMA COMPLETADO»: figura Pendiente pese a que su fecha de inicio pasó hace dos meses.',
    q:'OR – MELI', e:'Estado y fecha real de inicio corregidos' },
  { t:'Revisar las seis tareas de la Actividad 1.3.4 con el mismo criterio, porque el desorden de fechas afecta a todo el bloque.',
    q:'OR – MELI', e:'Bloque SIGPRO con fechas coherentes' }
],

'D2-04': [
  { t:'Fijar una única fecha de cierre de la Fase 1 en acta de línea base. Hoy conviven tres: 30/09 en el D1, 01–03/10 en las fechas de la tarea y 30 de octubre en su nombre.',
    q:'OGPL', e:'Acta de línea base del cronograma v1.0' },
  { t:'Propagar la fecha acordada a los tres lugares donde hoy discrepan: el §3 del D1, el nombre de la tarea y sus columnas de fecha.',
    q:'OR', e:'Las tres referencias coincidentes' },
  { t:'Revisar el arranque de la Fase 2, programado para el 01/10, que depende de la fecha que se elija.',
    q:'OR', e:'Fechas de la Fase 2 ajustadas' }
],

'D2-05': [
  { t:'Renumerar como 1.3.4.1 a 1.3.4.6 las seis tareas de SIGPRO, que hoy comparten el código «Tarea 1.3.1.2» con el llenado de fichas.',
    q:'OR', e:'Códigos únicos en la Actividad 1.3.4' },
  { t:'Devolver a la tarea de llenado de fichas el código que le corresponde por su actividad padre (1.3.3), no el 1.3.1.2 que hoy ostenta.',
    q:'OR', e:'Código corregido en la fila del llenado' },
  { t:'Añadir una validación en la hoja que impida guardar dos filas con el mismo código de tarea.',
    q:'OR', e:'Regla de validación de datos activa' }
],

'D2-06': [
  { t:'Consolidar «Consolidación Fase 1» como una única Actividad 1.3.5 con dos tareas —validación y aprobación del MAGPROF—, en lugar de las tres numeraciones actuales (1.3.2, 1.3.5 y 1.3.6).',
    q:'OR', e:'Actividad 1.3.5 unificada' },
  { t:'Devolver el código 1.3.2 en exclusiva a la actividad «Indicadores», que es la que lo tenía primero.',
    q:'OR', e:'Código 1.3.2 con un solo nombre' },
  { t:'Verificar después que ninguna tabla dinámica ni fórmula del libro dependa de los códigos antiguos.',
    q:'OR', e:'Libro revisado tras la renumeración' }
],

'D2-07': [
  { t:'Unificar el nombre de la Etapa 1.1 como «Inicio y sensibilización», que cubre las cuatro tareas que hoy se reparten entre dos denominaciones.',
    q:'OR', e:'Columna Etapa homogénea en B5:B8' },
  { t:'Si el equipo prefiere mantenerlas separadas, dividir en Etapa 1.1 Inicio y Etapa 1.2 Sensibilización y renumerar todas las etapas posteriores.',
    q:'OR', e:'Renumeración completa de etapas' },
  { t:'Reflejar la denominación elegida en la EDT del D1, para que ambos documentos coincidan.',
    q:'OR', e:'EDT alineada con el cronograma' }
],

'D2-08': [
  { t:'Renumerar como Tarea 1.3.2.5 la segunda de las dos filas que hoy comparten el código 1.3.2.4 (la de PM.03 y PS.04–PS.09, de 28 días).',
    q:'OR', e:'Código único por fila' },
  { t:'Revisar el estado de esa tarea: figura En Proceso desde el 03/08 con cierre previsto el 31/08, fecha ya vencida.',
    q:'OR', e:'Estado y fecha actualizados' }
],

'D2-09': [
  { t:'Agregar la columna «Responsable» a las 35 tareas, sin la cual no hay a quién escalar un retraso.',
    q:'OR', e:'Columna Responsable completa' },
  { t:'Agregar las columnas «Predecesora» y «Tipo de vínculo», que son las que permiten calcular la ruta crítica y la holgura.',
    q:'OR', e:'Dependencias declaradas en las 35 tareas' },
  { t:'Agregar la columna «Hito (sí/no)» y marcar como hitos las tareas de duración cero, que hoy se confunden con tareas normales.',
    q:'OR', e:'Hitos identificados' },
  { t:'Agregar «% de avance por tarea» para poder informar progreso sin recurrir al contador de actividades del banner.',
    q:'OR', e:'Columna de avance por tarea' }
],

'D2-10': [
  { t:'Extender el rango de las bandas mensuales del Gantt hasta junio de 2025, para que se grafiquen los 51 días de la primera tarea.',
    q:'OR', e:'Gráfico con rango desde junio 2025' },
  { t:'Si se prefiere no tocar el gráfico, declarar julio de 2025 como inicio oficial del proyecto y ajustar la fecha de la tarea, dejando constancia del criterio.',
    q:'OGPL', e:'Fecha de inicio oficial declarada' }
],

'D2-11': [
  { t:'Sustituir el texto fijo «Estado al 24 de julio de 2026» por una fecha de corte calculada, que se actualice sola al guardar.',
    q:'OR', e:'Celda A2 con fecha automática' },
  { t:'Si se mantiene manual, incorporar la actualización de esa celda al procedimiento de cierre semanal.',
    q:'OR', e:'Paso añadido al procedimiento semanal' }
],

/* ==================== D3 · BITÁCORA DE IMPLEMENTACIÓN ==================== */

'D3-01': [
  { t:'Adoptar la regla de herencia de códigos: la subtarea de la bitácora toma el código de la tarea del cronograma y le añade su correlativo (S 1.3.2.01.07).',
    q:'OR', e:'Regla escrita en el encabezado de la bitácora' },
  { t:'Recodificar el bloque de indicadores de PE.01, que hoy cuelga de «Tarea 1.3.1.2» cuando en el cronograma es la «Tarea 1.3.2.1».',
    q:'OR', e:'Bloque PE.01 recodificado' },
  { t:'Recorrer el resto de la bitácora con la misma regla y dejar constancia de las equivalencias entre el código viejo y el nuevo.',
    q:'OR', e:'Tabla de equivalencias de códigos' }
],

'D3-02': [
  { t:'Numerar correlativamente las subtareas dentro de cada tarea padre, sin reiniciar la cuenta, para sustituir las decenas de filas rotuladas «Sub Tarea 1».',
    q:'OR', e:'Columna de subtarea con correlativo único' },
  { t:'Generar el correlativo por fórmula y no a mano, que es lo que produjo la duplicación.',
    q:'OR', e:'Fórmula de correlativo en la columna' }
],

'D3-03': [
  { t:'Resolver las siete filas con código repetido —tres «Subtarea 31», dos «Subtarea 33» y dos «Subtarea 35»— asignando a cada una un correlativo propio.',
    q:'OR', e:'Códigos únicos en el segundo bloque' },
  { t:'Bloquear la columna de código para que sólo se alimente por fórmula y nadie pueda sobrescribirla.',
    q:'OR', e:'Columna protegida en la hoja' }
],

'D3-04': [
  { t:'Corregir la fecha de inicio declarada en la bitácora: debe ser 01/06/2025, la del cronograma, y no 01/03/2026.',
    q:'OR', e:'Encabezado de la bitácora corregido' },
  { t:'Recalcular las posiciones de semana del Gantt de la bitácora, que hoy parten de la fecha equivocada.',
    q:'OR', e:'Columnas de semana recalculadas' }
],

'D3-05': [
  { t:'Reemplazar las funciones de la plantilla Vertex42 que Google Sheets no reconoce y que devuelven #NAME? en toda la fila de encabezados de fecha.',
    q:'OR – ISA', e:'Fila de fechas sin errores' },
  { t:'Si la conversión resulta más costosa que rehacerlo, reconstruir el Gantt con fórmulas nativas de Sheets y formato condicional.',
    q:'OR – ISA', e:'Gantt nativo funcionando' },
  { t:'Documentar en la propia hoja qué fórmulas la sostienen, para que la próxima migración no vuelva a romperla.',
    q:'OR', e:'Nota técnica en el libro' }
],

'D3-06': [
  { t:'Registrar como incidencias formales las dos paralizaciones anotadas en observaciones: la toma de la universidad (11–22/05/2026) y la reorganización del personal de la OR (12–31/07/2026).',
    q:'OR', e:'Incidencias INC-01 e INC-02 en el registro' },
  { t:'Recalcular las fechas de las tareas posteriores del cronograma incorporando los cerca de 32 días hábiles perdidos.',
    q:'OR', e:'Cronograma con fechas recalculadas' },
  { t:'Si el recálculo empuja el cierre más allá del 30 de setiembre, preparar la solicitud formal de ampliación de plazo con esta evidencia como sustento.',
    q:'OGPL', e:'Solicitud de cambio de plazo sustentada' }
],

'D3-07': [
  { t:'Trasladar a un registro de riesgos formal las tres dependencias externas ya materializadas que hoy viven en la columna de observaciones: facultades que no remiten, VRAP que no retroalimenta y OCCAA que no aprueba.',
    q:'OR', e:'Riesgos R-01, R-02 y R-03 registrados' },
  { t:'Asignar a cada uno responsable, disparador y plan de respuesta, que es lo que hoy falta para poder actuar.',
    q:'OGPL', e:'Campos de respuesta completados' },
  { t:'Adoptar la regla de silencio administrativo positivo para los órganos consultados: transcurridos cinco días hábiles sin respuesta, se da por conforme.',
    q:'OGPL', e:'Regla comunicada por oficio' }
],

'D3-08': [
  { t:'Separar en archivos distintos los cuatro objetos que hoy conviven en el libro: bitácora de tareas, cronograma de visitas, capacitación en Bizagi y relación de participantes.',
    q:'OR', e:'Cuatro archivos independientes' },
  { t:'Archivar como histórico el cronograma de capacitación de marzo de 2026, que sigue mezclado con datos de agosto.',
    q:'OR', e:'Archivo movido a la carpeta de históricos' },
  { t:'Dejar en la bitácora una portada que indique qué contiene y qué no, para evitar que vuelva a acumular objetos ajenos.',
    q:'OR', e:'Portada del libro' }
],

'D3-09': [
  { t:'Separar del bloque de PE.03 las subtareas que en realidad pertenecen a PM.02, identificables por el indicador «Porcentaje de Convenios Activos».',
    q:'OR', e:'Bloque PM.02 con encabezado propio' },
  { t:'Asignar a PM.02 Gestión de la Investigación su indicador correcto, porque el de convenios no le corresponde.',
    q:'OR', e:'Indicador de PM.02 determinado' },
  { t:'Corregir la errata «PE.03- Gestión de Relaciones Interinstitucionalesc» y verificar que el nombre coincida con el del catálogo maestro.',
    q:'OR', e:'Denominación corregida' },
  { t:'Revisar si el error se propagó al MAGPROF de alguna facultad, donde el indicador quedaría mal asignado.',
    q:'OR', e:'Informe de propagación del error' }
],

'D3-10': [
  { t:'Convertir todas las fechas de la bitácora al formato dd/mm/aaaa, hoy escritas como d-m-aa.',
    q:'OR', e:'Columnas de fecha con formato único' },
  { t:'Fijar dd/mm/aaaa como formato obligatorio para todos los archivos de la carpeta del proyecto y dejarlo escrito en la guía.',
    q:'OGPL', e:'Regla de formato en la Guía de GxP' },
  { t:'Verificar antes de cualquier carga a SIGPRO que ninguna fecha se haya invertido al importar, porque d-m-aa puede leerse como m-d-aa.',
    q:'OR – ISA', e:'Prueba de importación sin inversiones' }
],

/* ==================== D4 · REVISIÓN INTERNA DE AVANCES ==================== */

'D4-01': [
  { t:'Fijar como denominador los 16 procesos de Nivel 0 obligatorios del catálogo, no los procesos que la facultad haya cargado. Lo no cargado debe contar como cero, no excluirse del cálculo.',
    q:'OR', e:'Fórmula de avance con denominador fijo' },
  { t:'Recalcular los porcentajes de las 20 facultades con el nuevo denominador y comunicar la variación, que será a la baja en las 13 facultades con procesos ausentes.',
    q:'OGPL', e:'Tablero recalculado y comunicado' },
  { t:'Añadir al tablero una columna visible de «procesos obligatorios ausentes», para que un 100% con procesos faltantes no vuelva a pasar inadvertido.',
    q:'OR', e:'Columna de ausencias en el tablero' }
],

'D4-02': [
  { t:'Marcar como OBSERVADOS los cuatro procesos de la Facultad de Medicina hoy CONFORMES pese a estar registrados bajo el prefijo PE.02 que no les corresponde.',
    q:'OR', e:'Estado corregido en las cuatro filas' },
  { t:'Recodificar los productos de la facultad para que cada uno cuelgue del proceso que le corresponde: PE.03, PM.01, PM.02 y PM.03.',
    q:'FMED', e:'Pestaña de la facultad recodificada' },
  { t:'Añadir al validador la comprobación de que el prefijo del producto coincide con el del proceso que lo encabeza, que es la regla 10.1 y hoy no se verifica.',
    q:'OR – ISA', e:'Regla de validación implementada' },
  { t:'Aplicar esa comprobación a las 20 pestañas, porque el mismo error puede existir sin haberse detectado.',
    q:'OR', e:'Informe de validación de las 20 facultades' }
],

'D4-03': [
  { t:'Corregir en la pestaña de la FCF el sufijo de formulario _F02, que pertenece a la FDCP, y sustituirlo por el que corresponde a la FCF.',
    q:'FCF', e:'Sufijos corregidos en la pestaña' },
  { t:'Validar automáticamente que cada pestaña use únicamente su propio sufijo, para impedir la contaminación de datos entre facultades al consolidar en SIGPRO.',
    q:'OR – ISA', e:'Validación de sufijo por pestaña' },
  { t:'Revisar si algún dato de la FDCP fue sobrescrito por el uso del formulario ajeno.',
    q:'OR', e:'Informe de integridad de la FDCP' }
],

'D4-04': [
  { t:'Publicar el catálogo maestro de códigos de facultad F01 a F20, aprobado por OGPL, para que ninguno tenga que deducirse de los datos.',
    q:'OGPL', e:'Catálogo F01–F20 aprobado y difundido' },
  { t:'Declarar formalmente el código de la FPSIC, hoy inferido como _F18 por ser el dominante de su pestaña.',
    q:'OGPL', e:'Código de la FPSIC declarado' },
  { t:'Sustituir en el tablero toda asignación deducida por la del catálogo, dejando constancia de los casos que cambien.',
    q:'OR', e:'Tablero alineado con el catálogo' }
],

'D4-05': [
  { t:'Emitir la nota de derogación formal del Anexo 2, cuya sustitución ya está declarada en el Anexo 1 pero nunca se comunicó como decisión.',
    q:'OGPL', e:'Nota de derogación difundida a las facultades' },
  { t:'Retirar del tablero las columnas «A.2 PARCIALMENTE» y «A.2 COMPLETADO» y la regla especial A2↔A3.',
    q:'OR', e:'Columnas del Anexo 2 eliminadas' },
  { t:'Corregir en el cronograma el nombre de la tarea de llenado, que sigue diciendo «Anexos 1, 2, 3».',
    q:'OR', e:'Celda D21 del cronograma corregida' },
  { t:'Informar a las facultades que estén llenando el Anexo 2 que suspendan ese trabajo, para no seguir gastando esfuerzo en un instrumento sin uso.',
    q:'OGPL', e:'Comunicación con acuse de las facultades' }
],

'D4-06': [
  { t:'Eliminar del tablero las columnas «A.4 PARCIALMENTE» y «A.4 COMPLETADO», que miden un anexo inexistente y hoy sólo ensucian el cálculo.',
    q:'OR', e:'Columnas del Anexo 4 eliminadas' },
  { t:'Si el Anexo 4 estaba previsto, crearlo con su plantilla y su regla de validación antes de volver a medirlo.',
    q:'OGPL', e:'Anexo 4 definido o descartado en acta' }
],

'D4-07': [
  { t:'Publicar el catálogo maestro de procesos de Nivel 0 como fuente única, con la numeración correcta del bloque PS.04 a PS.10.',
    q:'OGPL', e:'Catálogo maestro difundido' },
  { t:'Auditar las 20 pestañas contra el catálogo antes de que continúe el llenado, porque todo lo codificado con el esquema desplazado deberá rehacerse.',
    q:'OR', e:'Informe de auditoría de codificación' },
  { t:'Corregir en la bitácora las denominaciones desplazadas, empezando por PS.04, que hoy figura como Recursos Bibliográficos cuando eso es PS.09.',
    q:'OR', e:'Bitácora recodificada' },
  { t:'Incorporar al validador la comprobación de que código y denominación de proceso coinciden con el catálogo.',
    q:'OR – ISA', e:'Validación de catálogo activa' }
]

};
