# Casa Hogar - Frontend

Aplicación web (SPA) del sistema de mantenimiento de Casa Hogar. Construida con **React 19**, **Vite 7** y **Tailwind CSS**, servida por **nginx**.

## Requisitos

- Node.js 20+
- npm

## Instalación y desarrollo

```bash
npm ci
npm run dev
```

El servidor de desarrollo corre en `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

Los archivos estáticos se generan en `dist/`.

## Tests

```bash
npm test
```

## Docker

La imagen usa un build multi-etapa: compila el frontend con Node y sirve los estáticos con nginx.

```bash
docker build -t pblgllgs/casa-hogar-mantenimiento-frontend .
docker run -p 3000:80 -e NGINX_BACKEND_URL=http://localhost:8080/api pblgllgs/casa-hogar-mantenimiento-frontend
```

### Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `NGINX_BACKEND_URL` | URL base del backend (con `/api`) hacia donde nginx redirige las peticiones `/api/*`. | `http://backend:8080` |

### Despliegue en Render

Render ejecuta el workflow de GitHub Actions (`build-push.yml`) que construye la imagen y la sube a Docker Hub con versión incremental (`0.0.X` y `latest`). Para desplegar:

1. Crea un servicio web tipo **Docker** en Render apuntando a `pblgllgs/casa-hogar-mantenimiento-frontend:0.0.X`
2. Define la variable de entorno:
   ```
   NGINX_BACKEND_URL=https://<host-del-backend>.onrender.com/api
   ```
3. El backend debe tener el origen del frontend en `CORS_ALLOWED_ORIGINS`.

## Estructura

```
src/
├── api/          # Clientes HTTP (axios)
├── components/   # Componentes reutilizables
├── context/      # Contextos (Auth)
├── constants/    # Constantes y categorías
├── pages/        # Páginas del sistema
│   ├── admin/
│   ├── assets/
│   ├── clinical/
│   ├── inventory/
│   ├── locations/
│   ├── maintenance/
│   ├── residents/
│   ├── shifts/
│   └── staff/
└── utils/        # Utilidades (roles, etc.)
```

## Credenciales de prueba

- **Usuario:** `admin`
- **Password:** `admin123`
