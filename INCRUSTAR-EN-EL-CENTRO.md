# Incrustar el dashboard en el Centro de Documentación

## Lo que hay que hacer

Copiar `Dashboard.html` junto a la página del Centro de Documentación y
añadir esto donde deba aparecer el tablero:

```html
<iframe id="marco-dashboard"
        src="Dashboard.html"
        title="Panel de control — Gestión por Procesos"
        style="width:100%;height:1400px;border:0"
        loading="lazy"></iframe>

<script>
// El dashboard avisa de su altura; así el marco crece con el contenido
// y no aparece una segunda barra de desplazamiento.
window.addEventListener('message', function (e) {
  if (e.data && e.data.tipo === 'dashboard-ogpl:altura') {
    document.getElementById('marco-dashboard').style.height = e.data.altura + 'px';
  }
});
</script>
```

Eso es todo. **No hace falta ninguna otra configuración.**

## Por qué en un iframe y no pegado directamente

El dashboard carga Tailwind desde un CDN, y Tailwind aplica estilos
**globales**, incluido un *reset* que redefine cómo se ven los títulos, los
párrafos, las listas y los botones de toda la página. Pegado dentro del
Centro de Documentación, le reescribiría el aspecto a la página entera.

El iframe lo aísla: sus estilos no salen y los del Centro no entran. Es
también la razón de que el dashboard siga siendo un único archivo.

## Si prefiere no usar iframe

Habría que sustituir Tailwind por CSS propio con las clases del dashboard
prefijadas, para que no invadan la página anfitriona. Es un trabajo mayor y
no aporta nada al lector; el iframe resuelve lo mismo hoy.

## Dos avisos sobre la red

El dashboard pide tres recursos a servidores externos:

| Recurso | De dónde | Si no carga |
|---|---|---|
| Tailwind | `cdn.tailwindcss.com` | El tablero se ve **sin estilos**, aunque los datos siguen ahí |
| Chart.js | `cdn.jsdelivr.net` | **Solo** se omiten los dos gráficos; todo lo demás funciona |
| Font Awesome | `cdnjs.cloudflare.com` | No se ven los iconos |

Si la red de la universidad filtra alguno de esos dominios, conviene
descargarlos y servirlos desde el propio sitio. El caso de Chart.js ya está
contemplado en el código: si la librería no llega, el dashboard lo registra
en la consola y sigue funcionando sin gráficos.

## Comprobar que sigue bien

```
node verificar-dashboard.js
```

26 comprobaciones sobre el catálogo de facultades, la aritmética de los
indicadores, el Anexo 4, el histórico de revisiones y la integridad de los
registros. No necesita red ni navegador.
