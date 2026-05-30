# NovaStock – Sistema de Gestión de Inventario

Aplicación web CRUD para gestionar productos de inventario, desarrollada con **Python Flask** y **Amazon DynamoDB**.  
Permite crear, listar, editar y eliminar productos desde una interfaz web desplegada en AWS.

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Python, Flask |
| Base de datos | Amazon DynamoDB, Boto3 |
| Frontend | HTML, CSS, JavaScript |
| Servidor | Amazon EC2, Nginx, Gunicorn, systemd  |
| Seguridad | HTTPS, IAM Role |

---

## Funcionalidades

- Crear productos.
- Listar productos registrados.
- Editar productos.
- Eliminar productos.
- Validar campos del formulario.
- Guardar la información en DynamoDB.

---

## Estructura del proyecto

```bash
NovaStock/
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── docs/
    └── capturas/
```

---

## Modelo de datos

Tabla en DynamoDB:

```text
Products
```

Clave primaria:

```text
productId
```

Campos principales:

| Campo | Descripción |
|-------|-------------|
| productId | Identificador único |
| nombre | Nombre del producto |
| categoria | Categoría |
| precio | Precio |
| stock | Cantidad disponible |
| estado | Estado del producto |

---

## Rutas del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Interfaz principal |
| GET | `/health` | Estado del backend |
| GET | `/products` | Lista productos |
| GET | `/products/<product_id>` | Consulta un producto |
| POST | `/products` | Crea producto |
| PUT | `/products/<product_id>` | Actualiza producto |
| DELETE | `/products/<product_id>` | Elimina producto |

---

## Arquitectura

```text
Usuario → HTTPS → EC2/Nginx → Flask → Boto3 → DynamoDB
```

---

## Seguridad

La aplicación no expone credenciales de AWS en el código fuente.  
Se configuró un **IAM Role asociado a EC2** para permitir acceso seguro a DynamoDB sin usar claves dentro del repositorio.

El acceso a DynamoDB se realiza mediante permisos controlados sobre la tabla `Products`.

Archivo `.env.example`:

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE=Products
```

La aplicación está disponible mediante HTTPS:

```text
https://novastock.52-206-206-9.sslip.io
```

---

## Instalación local

```bash
git clone https://github.com/Sarayssd/novastock-crud-aws-dynamodb.git
cd NovaStock
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

La aplicación local se ejecuta en:

```text
http://127.0.0.1:5000
```

---

## Despliegue en AWS

El proyecto fue desplegado en una instancia **Amazon EC2** con Ubuntu.  
Se utilizó **Amazon DynamoDB** como base de datos, **Nginx** como servidor intermedio y **Certbot** para habilitar HTTPS.
Además, el backend quedó configurado como un servicio del sistema utilizando **Gunicorn** y **systemd**. Esto permite que la aplicación Flask se ejecute de forma estable en la instancia EC2, sin depender de una terminal SSH abierta. De esta manera, el servicio puede mantenerse activo en segundo plano y reiniciarse automáticamente si ocurre algún fallo.

Servicios usados:

- Amazon EC2
- Amazon DynamoDB
- IAM Role
- Security Groups
- Elastic IP
- Nginx
- Certbot
- Gunicorn 
- systemd

---

## Pruebas realizadas

| Prueba | Resultado |
|--------|-----------|
| Crear producto | Producto almacenado en DynamoDB |
| Listar productos | Productos visibles en la tabla |
| Editar producto | Cambios guardados correctamente |
| Eliminar producto | Producto eliminado de DynamoDB |
| HTTPS | Aplicación accesible con conexión segura |

---

## Evidencias sugeridas

Para la entrega se recomienda incluir capturas de:

- Página principal con HTTPS.
- Formulario de creación de producto.
- Producto listado en la tabla.
- Producto editado correctamente.
- Producto eliminado.
- Tabla `Products` en DynamoDB.
- IAM Role asociado a EC2.
- Security Group configurado.
- AWS Budget o Billing activo.

---

## Estado del proyecto

Proyecto funcional, desplegado en AWS, conectado a Amazon DynamoDB y disponible mediante HTTPS.

---

## Autores

- Juan Lizarazo
- Saray Suarez
- Jose Ardila