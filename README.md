# Orders Management — Backend API

Node.js + Express + MySQL REST API para el sistema de gestión de órdenes.

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 18+            |
| npm         | 9+             |
| MySQL       | 8+             |

---

## Setup paso a paso

### 1. Instalar dependencias

```bash
cd orders-backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos de MySQL:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=orders_db
```

### 3. Crear la base de datos y tablas

Conéctate a MySQL y ejecuta el script de migración:

```bash
mysql -u root -p < src/config/schema.sql
```

O si prefieres desde el cliente MySQL:

```sql
SOURCE /ruta/completa/a/orders-backend/src/config/schema.sql;
```

Esto crea:
- La base de datos `orders_db`
- Tabla `products` (con 3 productos seed)
- Tabla `orders`
- Tabla `order_items`

### 4. Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo (auto-reload con nodemon)
npm run dev
```

El servidor corre en `http://localhost:3001`

---

## Estructura del proyecto

```
orders-backend/
├── src/
│   ├── config/
│   │   ├── db.js          # Pool de conexiones MySQL
│   │   └── schema.sql     # Migración de base de datos
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── orderItemController.js
│   ├── routes/
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   └── index.js           # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Endpoints de la API

**Base URL:** `http://localhost:3001/api`

---

### Products `/api/products`

| Método | Ruta              | Descripción              |
|--------|-------------------|--------------------------|
| GET    | `/api/products`   | Listar todos los productos |
| GET    | `/api/products/:id` | Obtener producto por ID |
| POST   | `/api/products`   | Crear producto           |
| PUT    | `/api/products/:id` | Editar producto        |
| DELETE | `/api/products/:id` | Eliminar producto      |

**Body para POST/PUT:**
```json
{
  "name": "Teclado Mecánico",
  "unit_price": 89.99
}
```

---

### Orders `/api/orders`

| Método | Ruta                    | Descripción               |
|--------|-------------------------|---------------------------|
| GET    | `/api/orders`           | Listar todas las órdenes  |
| GET    | `/api/orders/:id`       | Obtener orden con items   |
| POST   | `/api/orders`           | Crear orden               |
| PUT    | `/api/orders/:id`       | Editar orden (reemplaza items) |
| PATCH  | `/api/orders/:id/status`| Cambiar estado de la orden|
| DELETE | `/api/orders/:id`       | Eliminar orden            |

**Body para POST/PUT:**
```json
{
  "order_number": "ORD-001",
  "date": "2024-02-20",
  "items": [
    { "product_id": 1, "qty": 2 },
    { "product_id": 3, "qty": 1 }
  ]
}
```

**Body para PATCH /status:**
```json
{
  "status": "InProgress"
}
```
> Valores válidos: `Pending`, `InProgress`, `Completed`

**Respuesta de GET order (incluye cálculos automáticos):**
```json
{
  "id": 1,
  "order_number": "ORD-001",
  "date": "2024-02-20",
  "status": "Pending",
  "num_products": 2,
  "final_price": 2649.97,
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Laptop Pro 15\"",
      "qty": 2,
      "unit_price": 1299.99
    },
    ...
  ]
}
```

---

### Order Items `/api/orders/:orderId/items`

| Método | Ruta                                   | Descripción             |
|--------|----------------------------------------|-------------------------|
| GET    | `/api/orders/:orderId/items`           | Listar items de una orden|
| POST   | `/api/orders/:orderId/items`           | Agregar item a la orden |
| PUT    | `/api/orders/:orderId/items/:itemId`   | Editar item             |
| DELETE | `/api/orders/:orderId/items/:itemId`   | Eliminar item           |

**Body para POST (agregar item):**
```json
{
  "product_id": 2,
  "qty": 3
}
```

**Body para PUT (editar item):**
```json
{
  "qty": 5,
  "unit_price": 25.00
}
```

---

## Reglas de negocio

- Las órdenes con status **Completed** no pueden ser editadas, eliminadas, ni tener items modificados. Cualquier intento devuelve `403 Forbidden`.
- El `unit_price` en `order_items` es un **snapshot** del precio del producto al momento de agregar el item (protege contra cambios futuros en el precio del catálogo).
- No se puede eliminar un producto que esté referenciado en alguna orden (`409 Conflict`).

---

## Configurar CORS para tu frontend

Si tu frontend corre en un puerto diferente (ej. `3000`), edita `src/index.js`:

```javascript
// Reemplaza:
app.use(cors());

// Por:
app.use(cors({ origin: "http://localhost:3000" }));
```

---

## Ejemplo de conexión desde React (fetch)

```javascript
// Listar órdenes
const res = await fetch("http://localhost:3001/api/orders");
const orders = await res.json();

// Crear orden
const res = await fetch("http://localhost:3001/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    order_number: "ORD-005",
    date: new Date().toISOString().split("T")[0],
    items: [{ product_id: 1, qty: 1 }]
  })
});
```
