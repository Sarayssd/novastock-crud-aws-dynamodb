import uuid
import boto3
from flask import Flask, jsonify, request, render_template
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# --------------------------------------------------------------
# Configuración de conexión a DynamoDB
# --------------------------------------------------------------
AWS_REGION      = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE  = os.getenv("DYNAMODB_TABLE", "Products")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
tabla    = dynamodb.Table(DYNAMODB_TABLE)


# ==============================================================
# RUTAS - FRONTEND
# ==============================================================

@app.route("/")
def inicio():
    """Sirve la página principal de NovaStock."""
    return render_template("index.html")


# ==============================================================
# RUTAS - API REST
# ==============================================================

@app.route("/health")
def health():
    """Verifica que el servidor esté en línea."""
    return jsonify({"estado": "ok", "mensaje": "NovaStock funcionando correctamente"}), 200


# --------------------------------------------------------------
# Listar todos los productos
# --------------------------------------------------------------
@app.route("/products", methods=["GET"])
def listar_productos():
    try:
        respuesta   = tabla.scan()
        productos   = respuesta.get("Items", [])
        return jsonify({"exito": True, "productos": productos}), 200
    except ClientError as e:
        return jsonify({"exito": False, "error": str(e)}), 500


# --------------------------------------------------------------
# Obtener un producto por ID
# --------------------------------------------------------------
@app.route("/products/<string:product_id>", methods=["GET"])
def obtener_producto(product_id):
    try:
        respuesta = tabla.get_item(Key={"productId": product_id})
        producto  = respuesta.get("Item")
        if not producto:
            return jsonify({"exito": False, "error": "Producto no encontrado"}), 404
        return jsonify({"exito": True, "producto": producto}), 200
    except ClientError as e:
        return jsonify({"exito": False, "error": str(e)}), 500


# --------------------------------------------------------------
# Crear un nuevo producto
# --------------------------------------------------------------
@app.route("/products", methods=["POST"])
def crear_producto():
    datos = request.get_json()
    if not datos:
        return jsonify({"exito": False, "error": "No se recibieron datos"}), 400

    campos_requeridos = ["nombre", "categoria", "precio", "stock", "estado"]
    for campo in campos_requeridos:
        if campo not in datos:
            return jsonify({"exito": False, "error": f"Campo requerido faltante: {campo}"}), 400

    nuevo_producto = {
        "productId" : str(uuid.uuid4()),
        "nombre"    : datos["nombre"],
        "categoria" : datos["categoria"],
        "precio"    : str(datos["precio"]),
        "stock"     : int(datos["stock"]),
        "estado"    : datos["estado"],
    }

    try:
        tabla.put_item(Item=nuevo_producto)
        return jsonify({"exito": True, "mensaje": "Producto creado exitosamente", "producto": nuevo_producto}), 201
    except ClientError as e:
        return jsonify({"exito": False, "error": str(e)}), 500


# --------------------------------------------------------------
# Actualizar un producto existente
# --------------------------------------------------------------
@app.route("/products/<string:product_id>", methods=["PUT"])
def actualizar_producto(product_id):
    datos = request.get_json()
    if not datos:
        return jsonify({"exito": False, "error": "No se recibieron datos"}), 400

    expresion_actualizacion = "SET "
    valores_expresion       = {}
    nombres_expresion       = {}
    partes                  = []

    campos_actualizables = ["nombre", "categoria", "precio", "stock", "estado"]
    for campo in campos_actualizables:
        if campo in datos:
            clave_expr                   = f"#campo_{campo}"
            valor_expr                   = f":val_{campo}"
            nombres_expresion[clave_expr] = campo
            valores_expresion[valor_expr] = datos[campo]
            partes.append(f"{clave_expr} = {valor_expr}")

    if not partes:
        return jsonify({"exito": False, "error": "No hay campos válidos para actualizar"}), 400

    expresion_actualizacion += ", ".join(partes)

    try:
        respuesta = tabla.update_item(
            Key={"productId": product_id},
            UpdateExpression=expresion_actualizacion,
            ExpressionAttributeNames=nombres_expresion,
            ExpressionAttributeValues=valores_expresion,
            ReturnValues="ALL_NEW"
        )
        producto_actualizado = respuesta.get("Attributes", {})
        return jsonify({"exito": True, "mensaje": "Producto actualizado exitosamente", "producto": producto_actualizado}), 200
    except ClientError as e:
        return jsonify({"exito": False, "error": str(e)}), 500


# --------------------------------------------------------------
# Eliminar un producto
# --------------------------------------------------------------
@app.route("/products/<string:product_id>", methods=["DELETE"])
def eliminar_producto(product_id):
    try:
        tabla.delete_item(Key={"productId": product_id})
        return jsonify({"exito": True, "mensaje": "Producto eliminado exitosamente"}), 200
    except ClientError as e:
        return jsonify({"exito": False, "error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)