# Cómo publicar esto en GitHub

Dos caminos. El primero no requiere instalar nada ni saber Git.

---

## Opción A · Desde el navegador (recomendada)

### 1. Crear el repositorio

1. Entra a [github.com](https://github.com) e inicia sesión. Si no tienes cuenta, créala: es gratuita.
2. Botón **+** arriba a la derecha → **New repository**.
3. Completa:
   - **Repository name:** `gxp-unmsm`
   - **Public** (obligatorio para que GitHub Pages funcione en cuentas gratuitas)
   - **No** marques «Add a README file» — ya viene uno en la carpeta
4. **Create repository**.

### 2. Subir los archivos

1. En la página que aparece, haz clic en **uploading an existing file**.
2. Descomprime `gxp-unmsm.zip` en tu computadora.
3. Abre la carpeta `gxp-unmsm` y selecciona **todo su contenido** (no la carpeta en sí):
   `index.html`, `README.md`, `PUBLICAR-EN-GITHUB.md`, `.nojekyll`, y las carpetas `docs`, `data` y `assets`.
4. Arrástralo a la zona de carga del navegador.
5. Espera a que suba todo. Abajo escribe en **Commit changes**: `Documentación v2.0`
6. **Commit changes**.

> Si el navegador no acepta arrastrar carpetas, sube primero los archivos sueltos y luego repite la carga entrando a cada carpeta.

### 3. Activar GitHub Pages

1. Pestaña **Settings** del repositorio.
2. Menú lateral izquierdo → **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** selecciona `main` y carpeta `/ (root)`. **Save**.
5. Espera entre 1 y 3 minutos y recarga la página.

Arriba aparecerá la dirección:

```
https://TU-USUARIO.github.io/gxp-unmsm/
```

Esa es la web. Se puede compartir con los decanos y con el equipo; no necesitan cuenta de GitHub para verla.

---

## Opción B · Desde la terminal

```bash
cd gxp-unmsm
git init
git add .
git commit -m "Documentación v2.0"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gxp-unmsm.git
git push -u origin main
```

Después activa Pages siguiendo el paso 3 de la Opción A.

---

## Actualizar la documentación más adelante

**Desde el navegador:** entra al archivo en GitHub → icono del lápiz (**Edit this file**) → edita → **Commit changes**. El sitio se actualiza solo en un par de minutos.

**Desde la terminal:**

```bash
git add .
git commit -m "Actualización del avance al 30/09/2026"
git push
```

---

## Notas

- El archivo `.nojekyll` evita que GitHub intente procesar el sitio con Jekyll. No lo borres.
- Todos los enlaces internos son relativos, así que el sitio funciona igual abriendo `index.html` en local que publicado.
- Los CSV se descargan directamente desde la web y se importan a Google Sheets sin ajustes.
- Si el repositorio debe ser privado, GitHub Pages requiere plan de pago. Alternativa gratuita: publicarlo público y no incluir datos sensibles, o usar Google Sites con los archivos en Drive.
