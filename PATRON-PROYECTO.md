# Patrón de Proyecto — Frontend React (Vite + Tailwind)

> Documento de referencia para agentes de IA. Aplica al frontend de la familia
> full-stack Spring Boot + React. Referencia real: repo `casa-hogar-mantenimiento-frontend`.

---

## 1. Resumen en una línea

SPA construida con **Vite + React + Tailwind**, capa de API con **axios**, routing con
**react-router-dom**, notificaciones con **react-toastify**, modales con **sweetalert2**,
iconos con **lucide-react**. Se sirve con **nginx** y se despliega a Docker Hub y Render
vía GitHub Actions.

- Idioma de la UI: **Español (Chile)**. Sin comentarios salvo que se pidan.
- Rutas públicas: `/login`, `/register`; el resto va bajo `ProtectedRoute` + `Layout`.

---

## 2. Stack (probado)

| Capa | Tecnología |
|---|---|
| Build | Vite 7, Node 20 |
| UI | React 19, Tailwind 4, react-router-dom 7 |
| Datos | axios (baseURL `/api`, token JWT en headers) |
| UX | lucide-react, react-toastify, sweetalert2 |
| Tests | Vitest (`npm test`) |
| Servir | nginx (SPA fallback) |

---

## 3. Estructura de carpetas

```
src/
├── api/          # clientes HTTP por dominio (axios)
├── components/   # componentes reutilizables (Modal, DataTable, RichTextEditor, Layout...)
├── context/      # AuthContext (login/logout/user en localStorage)
├── constants/    # categorías, colores (con __tests__)
├── pages/        # páginas agrupadas por dominio
│   ├── admin/ clinical/ inventory/ locations/ maintenance/
│   ├── residents/ shifts/ staff/ work-orders/ assets/ reports/
│   └── Dashboard, Login, Register
├── utils/        # utilidades (roles, etc.)
├── App.jsx       # rutas (lazy)
├── config.js     # API_BASE_URL (VITE_API_BASE_URL o /api)
├── main.jsx
```

---

## 4. Convenciones

- **Rutas:** declaradas en `App.jsx` con `lazy` + `Suspense`; componentes de página por dominio.
- **API:** cada dominio tiene su módulo en `src/api` que envuelve axios.
- **Autenticación:** `AuthContext` guarda `token`, `refreshToken` y `user` en `localStorage`.
- **Roles:** `isViewer(user)` en `src/utils/roles` — un usuario es VIEWER solo si su ÚNICO rol
  es `VIEWER`. Los multi-rol (ej. admin con todos los roles) **no** se consideran viewer.
  Usarlo en todo control de edición (menú, botones, modales).
- **Formularios:** modales con el componente `Modal` (título + children).
- **Editor de texto enriquecido:** `RichTextEditor` (contentEditable + toolbar) reutilizable.
- **Subida de archivos:** al elegir archivo solo se muestra preview local
  (`URL.createObjectURL`); la subida a Cloudinary ocurre al **confirmar** (guardar),
  para no dejar archivos huérfanos si se cancela.
- **Sin comentarios** en el código.

---

## 5. Docker / nginx (crítico)

El `Dockerfile` es multi-etapa (node build → nginx). El nginx usa **plantilla**:

- `nginx.conf.template` referencia `${NGINX_BACKEND_URL}` y `${NGINX_BACKEND_HOST}`.
- `docker-entrypoint.sh` sustituye esas variables en runtime (no requiere rebuild) y
  ejecuta nginx.
- El proxy `/api` debe enviar `Host` del **backend** (no `$host`), `proxy_ssl_server_name on`
  y TLS 1.2/1.3 — de lo contrario Render devuelve `508 loop` o `502`.

### Variables de entorno (Render)
```
NGINX_BACKEND_URL=https://<backend-host>.onrender.com/api
```

---

## 6. CI/CD (GitHub Actions)

El workflow `docker-build.yml` en `.github/workflows/` se dispara en push a `main`/`master`:
1. Login a Docker Hub (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
2. Calcula versión incremental (`0.0.6` → `0.0.7`) desde los tags de Docker Hub.
3. Build + push `:0.0.X` y `:latest`.
4. PATCH del servicio Render + POST deploy (secrets `RENDER_API_KEY`,
   `RENDER_SERVICE_ID`, `RENDER_OWNER_ID`).

Secrets en GitHub (Settings → Secrets → Actions):
`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`.

---

## 7. Checklist para replicar

1. [ ] Vite + React + Tailwind + react-router-dom + axios.
2. [ ] AuthContext con persistencia en localStorage.
3. [ ] Capa `src/api` por dominio.
4. [ ] Páginas por dominio + rutas lazy en `App.jsx`.
5. [ ] `RichTextEditor` y `Modal` reutilizables.
6. [ ] `Dockerfile` + `nginx.conf.template` + `docker-entrypoint.sh`.
7. [ ] Workflow GitHub Actions + secrets.
8. [ ] Verificación: `npm run build` + `npm test`.
