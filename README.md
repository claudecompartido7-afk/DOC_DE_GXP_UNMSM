# Gestión por Procesos · UNMSM

Centro de documentación del proyecto **Implementación de la Gestión por Procesos en las 20 Facultades**, organizado bajo la guía del PMBOK 6.ª edición.

Oficina General de Planificación · Oficina de Racionalización · Universidad Nacional Mayor de San Marcos.

---

## Qué contiene

Una web interactiva con el diagnóstico de la documentación de trabajo, más los tres documentos de gestión corregidos en su versión 2.0.

| | Documento | Estado |
|---|---|---|
| **D1** | Plan de Gestión del Proyecto | v2.0 |
| **D2** | Plan de Gestión del Cronograma | v2.0 |
| **D3** | Bitácora de ejecución | v2.0 |
| **D4** | Revisión interna de avances | vigente en Drive |

## Estructura

```
.
├── index.html                        Centro de documentación (portada)
├── docs/
│   ├── 01-plan-de-gestion-v2.html
│   ├── 02-cronograma-v2.html
│   └── 03-bitacora-v2.html
├── data/
│   ├── 02-cronograma-v2.csv          41 filas
│   ├── 03-bitacora-v2.csv            111 filas
│   ├── registro-riesgos.csv          9 riesgos
│   ├── registro-incidencias.csv      6 incidencias
│   ├── catalogo-procesos-nivel0.csv  16 procesos
│   └── diccionario-estados.csv       5 estados
├── assets/
│   ├── doc.css
│   ├── decisiones.css                interfaz de aceptación de recomendaciones
│   ├── decisiones.js
│   ├── localizaciones.js             dónde está cada hallazgo en su documento
│   ├── visor.css                     visor lateral de documentos
│   └── visor.js
├── apps-script/                      backend del registro de decisiones
│   ├── Codigo.gs                     Web App: escribe en los 4 documentos
│   ├── appsscript.json
│   └── README.md                     despliegue paso a paso
└── PUBLICAR-EN-GITHUB.md
```

## Registro de decisiones

En el panel **Diagnóstico**, cada hallazgo despliega sus recomendaciones con dos
botones: «Acepto la recomendación» y «Mejorar la recomendación». El segundo abre
el texto para editarlo y lo confirma con «Acepto recomendación».

Cada aceptación se registra en tiempo real en los documentos de Drive que el
hallazgo afecta, más el Plan de Alcance como libro maestro. Consulte
[apps-script/README.md](apps-script/README.md) para el despliegue y para conectar
el endpoint en `index.html`.

Sin endpoint configurado la interfaz funciona igual, pero las decisiones sólo se
guardan en el navegador.

## Visor de documentos

Cada hallazgo del diagnóstico y cada celda de la matriz de contradicciones
declaran **dónde está el problema**: la ruta dentro del documento, el texto
literal con el que encontrarlo y, en las hojas de cálculo, la celda.

Al pulsar «Ver» se abre a la derecha el documento de origen. En las hojas el
visor salta directamente a la celda; en los documentos de texto Google no
permite anclar a un texto arbitrario desde la URL, así que el visor entrega el
texto ancla con un botón de copiar para pegarlo en Ctrl+F.

Las 52 anclas están en [assets/localizaciones.js](assets/localizaciones.js). El
visor incrusta la vista previa de Drive: quien lo consulte necesita acceso de
lectura a los cuatro archivos.

## Reglas que rigen esta documentación

**Fuente única del avance de fase.** Se mide solo con la revisión interna (D4):

```
Avance de fase = (Completos + 0,5 × Observados) ÷ Total de productos
```

El porcentaje del cronograma mide actividades iniciadas o culminadas y no se usa para reportar avance.

**Códigos.** Fase `F#` › Etapa `F#.E#` › Actividad `F#.E#.A#` › Tarea `T F#.E#.A#.T##` › Subtarea `S 1.3.2.02.14`. Los hitos usan el prefijo `H`. Ningún código se reutiliza.

**Estados.** Cinco valores: `NO INICIADO`, `EN PROCESO`, `OBSERVADO`, `CONFORME`, `NO APLICA`.

**Fechas.** Formato `dd/mm/aaaa`. Duración en días hábiles.

**Procesos.** Rige el catálogo maestro de `data/catalogo-procesos-nivel0.csv`. Atención al bloque PS.04–PS.10: circula una numeración desplazada un dígito que debe corregirse.

## Estado del proyecto

- Avance de la Fase 1: **63%**
- Cierre de la Fase 1: **30 de setiembre de 2026**
- Productos catalogados: 2 823 · completos 828 · observados 1 901 · pendientes 94
- Procesos de Nivel 0 obligatorios ausentes: 73, en 13 facultades

> **Ruta crítica sin holgura.** Quedan 25 días hábiles hasta el cierre y la ruta crítica consume 24. El levantamiento de las 1 901 observaciones (T1.3.3.02) debe arrancar de inmediato.

## Uso

Abrir `index.html` en cualquier navegador, o publicar el repositorio con GitHub Pages siguiendo [PUBLICAR-EN-GITHUB.md](PUBLICAR-EN-GITHUB.md).

Todos los enlaces internos son relativos: el sitio funciona igual en local que publicado.
