# Quesos Carranco — entrega 3, primera fase

**PROYECTO ACADÉMICO · SITIO NO OFICIAL**

Esta fase añade Node, Express y MySQL al proyecto existente. Inicio, catálogo, detalle, navbar, footer, WhatsApp, colores, fuentes y estilos se conservan en `public/`.

## Qué funciona

- Nueve tablas MySQL con claves foráneas, índices y restricciones.
- Ocho productos en el catálogo y el dúo independiente de la entrega anterior.
- Precios de catálogo y académicos separados en MySQL.
- Consulta de productos, búsqueda, filtros y disponibilidad desde el backend.
- Disponibilidad basada en `stock - stock_reservado`.
- Validación de cantidades y existencias desde el servidor al agregar productos o aumentar su cantidad.
- Carrito local compatible con `carranco.cart.v1` y registros `{ id, quantity }`.
- Errores JSON sin consultas, contraseñas ni detalles internos de MySQL.
- Inicialización repetible que no sobrescribe precios ni existencias existentes.

## Alcance de esta fase

Las tablas de clientes, direcciones, carritos, pedidos, pagos y movimientos quedan preparadas. Sus operaciones, autenticación, checkout, historial y pasarelas se implementarán después. El carrito todavía se conserva en el navegador. **Ninguna operación de esta versión crea pedidos, reserva stock, descuenta inventario o realiza cobros.**

Los importes del carrito y su envío siguen siendo ilustrativos. La API de validación calcula subtotales desde MySQL, pero no representa una cotización definitiva de checkout.

No hay botones de Apple Pay ni un servicio Openpay ficticio. Mercado Pago se añadirá después de validar esta fase y consultar su SDK oficial vigente. No se instalan SDK, bcrypt ni sesiones hasta implementar las funciones que los utilizarán.

## Archivos

El proyecto tiene `public/`, `src/`, `database/`, `scripts/` y `tests/`. Solo `public/` se sirve por HTTP. `.env`, el código del backend y los SQL no se exponen como archivos descargables.

Archivos nuevos:

- `database/schema.sql`, `database/seed.sql`.
- `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `server.js`, `README.md`.
- `src/app.js`.
- `src/config/env.js`, `src/config/database.js`.
- `src/controllers/productos.controller.js`.
- `src/routes/productos.routes.js`.
- `src/services/productos.service.js`, `src/services/inventario.service.js`.
- `src/middleware/validation.js`, `src/middleware/errorHandler.js`.
- `src/utils/HttpError.js`, `src/utils/money.js`.
- `scripts/init-database.js`, `scripts/check-database.js`.
- `tests/api.integration.test.js`, `tests/money.test.js`.

Archivos modificados: `public/js/productos.js`, `public/js/main.js`, `public/js/catalogo.js`, `public/js/producto-detalle.js`. Las tres páginas HTML y los tres CSS mantienen su contenido de la segunda entrega; únicamente cambia su ubicación bajo `public/`.

## Requisitos

- Node.js 22 o 24 LTS, con npm: https://nodejs.org/en/download
- MySQL Community Server 8.0.16 o posterior de la serie 8; también funciona con 8.4: https://dev.mysql.com/downloads/mysql/
- MySQL Workbench es opcional: https://dev.mysql.com/downloads/workbench/
- Conexión a Internet para instalar dependencias y cargar las imágenes, tipografías e iconos externos ya utilizados.

Instala Node para Windows con su instalador oficial. Instala MySQL Server, inicia su servicio y configura una contraseña propia para el administrador. Guarda esa contraseña fuera del código. XAMPP normalmente utiliza MariaDB; esta entrega requiere **MySQL 8**, no lo sustituye por MariaDB.

Verifica en PowerShell:

```powershell
node --version
npm --version
```

En Workbench ejecuta:

```sql
SELECT VERSION();
```

## Instalación en Windows

Descomprime el ZIP y abre PowerShell dentro de `carranco-ecommerce`, donde está `package.json`.

```powershell
npm ci
Copy-Item .env.example .env
```

Edita `.env`. Los valores de usuario y contraseña son los que tú configures en tu MySQL local, no credenciales proporcionadas por este proyecto.

Primero crea un usuario de aplicación con permiso de lectura. En Workbench, conectado como administrador, ejecuta lo siguiente **reemplazando `CLAVE_ELEGIDA_POR_TI` antes de ejecutarlo**:

```sql
CREATE USER 'carranco_app'@'127.0.0.1' IDENTIFIED BY 'CLAVE_ELEGIDA_POR_TI';
GRANT SELECT ON carranco_ecommerce.* TO 'carranco_app'@'127.0.0.1';
```

Para esta fase la API solo necesita lectura. En las siguientes fases se añadirán permisos concretos para las operaciones implementadas. Si el usuario ya existe, administra su contraseña y permisos desde MySQL en lugar de ejecutar otra vez `CREATE USER`.

Configura en `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=carranco_app
DB_PASSWORD=
DB_NAME=carranco_ecommerce
DB_SETUP_USER=root
DB_SETUP_PASSWORD=
```

Completa `DB_PASSWORD` con la clave del usuario `carranco_app`, y `DB_SETUP_PASSWORD` con tu clave de administrador. Si una contraseña contiene `#` o espacios, ponla entre comillas en `.env`.

Ejecuta:

```powershell
npm run db:init
npm run db:check
npm start
```

`db:init` crea la base, ejecuta `schema.sql` y después `seed.sql`. Repetirlo agrega únicamente los productos que falten; no reinicia el inventario. Una vez inicializada, puedes borrar los valores `DB_SETUP_USER` y `DB_SETUP_PASSWORD` de `.env`: el servidor utiliza `DB_USER`.

Abre http://localhost:3000. En esta fase utiliza Express para servir el frontend; **Live Server no sirve la API `/api`**.

En macOS/Linux los comandos son iguales salvo la copia:

```bash
cp .env.example .env
```

Alternativamente, puedes ejecutar completos `database/schema.sql` y luego `database/seed.sql` desde Workbench. Usa en `.env` el mismo nombre de base de datos. Los scripts npm admiten otro `DB_NAME` formado por letras, números y guion bajo.

## Diseño de datos

| Tabla | Función y restricciones principales |
| --- | --- |
| productos | SKU y slug únicos, dos precios, stock físico y reservado, galería y datos existentes |
| clientes | Correo único y `password_hash`; no se crean clientes de ejemplo |
| direcciones | Pertenece a un cliente; código postal de cinco dígitos |
| carritos | Como máximo un carrito activo por cliente |
| carrito_items | Producto único dentro del carrito; cantidad de 1 a 20 |
| pedidos | Número y clave de idempotencia, importes separados, estados y datos de reserva |
| pedido_items | Copia del nombre, SKU, presentación y ambos precios para conservar historial |
| pagos | Identificador externo único por proveedor; no contiene campos de tarjeta |
| movimientos_inventario | Variación firmada del stock; venta/cancelación única por producto y pedido |

Los pedidos incluyen una copia de la dirección. La clave foránea compuesta impide asociar al pedido la dirección de otro cliente. Los importes se almacenan como `DECIMAL`; los cálculos de la API utilizan centavos enteros.

`total_catalogo` conserva la simulación comercial, `total_academico` será el monto aceptado antes de pagar y `total_cobrado` comienza en cero; solo deberá actualizarse cuando exista una confirmación de pago verificada.

El diseño prepara reservas para la futura fase de pedidos: una transacción deberá bloquear los productos, verificar el disponible y aumentar `stock_reservado`. Al aprobarse un pago verificado, otra transacción descontará `stock` y la reserva, registrará el movimiento y marcará el pedido. Las reservas vencidas deberán liberarse. Estas operaciones aún no se ejecutan en esta fase; las claves únicas por sí solas no sustituyen esa lógica.

El dúo anterior tiene un SKU y stock propios. No descuenta automáticamente los SKU individuales Ranchero y Panela; representa un conjunto separado para conservar el comportamiento previo.

## Datos iniciales y precios

| Producto | Catálogo MXN | Presentación simulada | Stock inicial |
| --- | ---: | --- | ---: |
| Ranchero | 95.00 | 400 g | 20 |
| Panela | 85.00 | 400 g | 15 |
| Oaxaca | 125.00 | 400 g | 18 |
| Manchego | 140.00 | 400 g | 12 |
| Chihuahua | 120.00 | 400 g | 8 |
| Cottage | 90.00 | 400 g | 5 |
| Asadero | 115.00 | 400 g | 10 |
| Mantequilla | 60.00 | 225 g | 3 |
| Dúo previo | 160.00 | Ranchero 400 g + Panela 400 g | 6 |

Se conservan los precios de la segunda entrega. `seed.sql` centraliza el importe académico inicial en `@precio_academico = 2.00`. Esto es un dato de prueba sin cobros activos; deberá revisarse contra los límites vigentes de la pasarela antes de utilizarlo en un pago real. Una vez creado un producto, cambia su importe en la base:

```sql
UPDATE productos SET precio_academico = 2.00 WHERE slug = 'ranchero';
```

La disponibilidad utiliza el stock disponible: más de 5, Disponible; de 1 a 5, Últimas unidades; 0, Agotado. Las fotos pueden mostrar gramajes distintos a las presentaciones simuladas. No se presenta este inventario como información oficial de Carranco.

## API implementada

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/salud` | Estado de conexión y pagos deshabilitados |
| GET | `/api/productos` | Ocho productos activos del catálogo |
| GET | `/api/productos?catalogo=todos` | Incluye la oferta previa |
| GET | `/api/productos?categoria=fundir&q=queso` | Filtros combinados |
| GET | `/api/productos?disponibilidad=agotado` | Filtra disponibilidad |
| GET | `/api/productos/ranchero` | Detalle por slug; también acepta ID numérico |
| GET | `/api/productos/ranchero/inventario` | Stock físico, reservado y disponible |
| POST | `/api/productos/validar-stock` | Consulta preliminar sin reservar ni cobrar |

El POST acepta únicamente `items` y líneas con `id` (slug) y `cantidad` (entero de 1 a 20). Combina líneas repetidas y vuelve a consultar precios y stock en MySQL. Campos de precio enviados desde DevTools se rechazan con 422.

## Pruebas manuales exactas en PowerShell

Con el servidor activo, abre otra consola:

```powershell
Invoke-RestMethod http://localhost:3000/api/salud
Invoke-RestMethod http://localhost:3000/api/productos
Invoke-RestMethod http://localhost:3000/api/productos/ranchero/inventario

$seleccion = @{ items = @(@{ id = 'ranchero'; cantidad = 2 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/productos/validar-stock -ContentType 'application/json' -Body $seleccion
```

La selección devuelve subtotal de catálogo 190.00 y referencia académica 4.00 con los datos iniciales; `reserva_creada` es false. No cambia el stock.

Stock insuficiente, respuesta esperada 409:

```powershell
$exceso = @{ items = @(@{ id = 'mantequilla'; cantidad = 4 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/productos/validar-stock -ContentType 'application/json' -Body $exceso
```

Precio manipulado, respuesta esperada 422:

```powershell
$manipulado = @{ items = @(@{ id = 'ranchero'; cantidad = 1; precio = 0.01 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/productos/validar-stock -ContentType 'application/json' -Body $manipulado
```

Para comprobar una actualización, en tu base académica local ejecuta:

```sql
UPDATE productos SET stock = 2, stock_reservado = 0 WHERE slug = 'ranchero';
```

Consulta otra vez el inventario y recarga el catálogo. Verás Últimas unidades. Solicitar 3 unidades deberá producir 409. Para dejar el dato inicial de esta demostración:

```sql
UPDATE productos SET stock = 20, stock_reservado = 0 WHERE slug = 'ranchero';
```

En el navegador verifica Inicio → Productos → Ver producto, miniaturas y filtros. Agrega unidades y recarga: el carrito se conserva con la misma clave. El stock no disminuye porque aún no hay pedidos ni pagos.

## Pruebas automatizadas

```powershell
npm test
```

Este comando ejecuta las pruebas monetarias y omite las de integración si no se habilitan explícitamente. Para probar MySQL real, utiliza una base exclusiva cuyo nombre termine en `_test`. Conserva copia de tu `.env`, configura `DB_NAME=carranco_ecommerce_test` y un usuario con permisos para esa base, incluyendo `DB_SETUP_USER` si los ajustes de prueba necesitan otro usuario.

```powershell
npm run db:init
$env:RUN_DB_TESTS = 'true'
npm test
Remove-Item Env:RUN_DB_TESTS
```

Las pruebas restauran los valores de producto que modifican. Rechazan ejecutar ajustes de integración contra una base cuyo nombre no termine en `_test`. Después devuelve `.env` a su configuración habitual.

## Credenciales y futuras pasarelas

En esta fase **no necesitas credenciales de Mercado Pago**. Los campos `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` y `MP_WEBHOOK_SECRET` permanecen vacíos. No hay endpoints de pago ni webhook registrados.

Al implementar pagos se consultará la documentación oficial vigente y se indicará el recorrido exacto para obtener las credenciales, configurar el webhook y probarlo. Se utilizarán primero credenciales de prueba; los cobros reales reducidos requerirán la configuración correspondiente, aceptación del importe exacto antes de pagar, confirmación del proveedor y pruebas de idempotencia. Cambiar un token por sí solo no hará que esta fase procese pagos.

La integración se separará de pedidos e inventario mediante un servicio de proveedor, permitiendo incorporar Openpay después. Apple Pay permanecerá oculto hasta contar con soporte y configuración válidos.

## Reiniciar una demostración

`db:init` no elimina datos. Para repetir esta fase sin borrar historial, usa una base de pruebas nueva (`DB_NAME` distinto) y ejecuta `db:init`. En el navegador puedes borrar únicamente `carranco.cart.v1` desde Application → Local Storage.

No reinicies el stock de pedidos existentes manualmente en futuras fases: deberán utilizarse cancelaciones o ajustes registrados. `CREATE TABLE IF NOT EXISTS` es una inicialización, no un sistema de migraciones para cambiar tablas ya creadas.

## Problemas frecuentes

- Puerto ocupado: cambia `PORT`, `APP_ORIGIN` y `CORS_ORIGINS` coherentemente.
- MySQL desconectado: inicia el servicio y revisa `DB_HOST`/`DB_PORT`.
- Acceso denegado: revisa el usuario, contraseña y permisos; no publiques `.env`.
- Tablas ausentes: ejecuta `npm run db:init` con el usuario de configuración.
- Catálogo no disponible: utiliza la URL de Express, no Live Server ni `file://`.
- Nueva URL local: el navegador separa localStorage por origen; al cambiar de Live Server a Express no se copia automáticamente el carrito de otro puerto.
- Las fotos no cargan: comprueba Internet; el sitio muestra una alternativa accesible.

## Documentación primaria consultada

- Express 5, manejo de errores: https://expressjs.com/en/5x/guide/error-handling/
- mysql2, consultas preparadas: https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements
- MySQL 8, restricciones CHECK: https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html
- Descargas oficiales MySQL: https://dev.mysql.com/downloads/mysql/8.0.html

Este sitio fue desarrollado únicamente con fines académicos como parte de un proyecto universitario de Comercio Electrónico. No representa ni sustituye los canales oficiales de Quesos Carranco.
