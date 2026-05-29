
const API = "";

// ── Iconos por categoría ─────────────────────────────────────
const ICONOS_CAT = {
  "Electrónica": "ti-cpu",
  "Accesorios":  "ti-mouse",
  "Periféricos": "ti-keyboard",
  "Monitores":   "ti-device-desktop",
  "Componentes": "ti-circuit-board",
};
const TAG_CAT = {
  "Electrónica": "tag-elec",
  "Accesorios":  "tag-acce",
  "Periféricos": "tag-peri",
  "Monitores":   "tag-moni",
  "Componentes": "tag-comp",
};

// ── Cache de productos ───────────────────────────────────────
let todosLosProductos = [];

// ── Referencias DOM ──────────────────────────────────────────
const formulario  = document.getElementById("formulario");
const divAlerta   = document.getElementById("alerta");
const tbody       = document.getElementById("tbody-productos");

// ── Utilidades ───────────────────────────────────────────────

function mostrarAlerta(mensaje, tipo = "exito") {
  divAlerta.textContent = mensaje;
  divAlerta.className   = `alerta ${tipo}`;
  clearTimeout(divAlerta._timer);
  divAlerta._timer = setTimeout(() => {
    divAlerta.className = "alerta oculto";
  }, 4000);
}

function limpiarFormulario() {
  formulario.reset();
  document.getElementById("productId").value = "";
  document.getElementById("titulo-form").textContent = "Agregar Nuevo Producto";
}

function cancelarEdicion() {
  limpiarFormulario();
}

function badgeEstado(estado) {
  const mapa = {
    activo:   "badge-activo",
    inactivo: "badge-inactivo",
    agotado:  "badge-agotado",
  };
  return `<span class="badge ${mapa[estado] || "badge-inactivo"}">${estado}</span>`;
}

function tagCategoria(cat) {
  const clase = TAG_CAT[cat] || "tag-otro";
  return `<span class="tag ${clase}">${cat}</span>`;
}

function iconoCategoria(cat) {
  return ICONOS_CAT[cat] || "ti-box";
}

// ── Actualizar tarjetas de estadísticas ──────────────────────

function actualizarStats(productos) {
  const total   = productos.length;
  const activos = productos.filter(p => p.estado === "activo").length;
  const bajo    = productos.filter(p => parseInt(p.stock) < 10).length;
  const valor   = productos.reduce((acc, p) => acc + parseFloat(p.precio || 0) * parseInt(p.stock || 0), 0);

  document.getElementById("stat-total").textContent   = total;
  document.getElementById("stat-activos").textContent = activos;
  document.getElementById("stat-bajo").textContent    = bajo;
  document.getElementById("stat-valor").textContent   = "$" + valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("stat-total-txt").textContent = `${total} productos registrados`;
}

// ── Renderizar tabla ─────────────────────────────────────────

function renderizarTabla(productos) {
  if (!productos || productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="sin-datos">
          <i class="ti ti-package-off"></i> No hay productos registrados.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = productos.map(p => {
    const idCorto   = p.productId ? p.productId.substring(0, 8) + "…" : "—";
    const icono     = iconoCategoria(p.categoria);
    const stockBajo = parseInt(p.stock) < 10;

    return `
      <tr>
        <td class="id-cell" title="${p.productId}">${idCorto}</td>
        <td>
          <div class="prod-cell">
            <div class="prod-thumb"><i class="ti ${icono}" aria-hidden="true"></i></div>
            <div>
              <div class="prod-nombre">${p.nombre}</div>
              <div class="prod-sub">${p.categoria}</div>
            </div>
          </div>
        </td>
        <td>${tagCategoria(p.categoria)}</td>
        <td class="precio-cell">$${parseFloat(p.precio).toFixed(2)}</td>
        <td class="${stockBajo ? "stock-bajo" : ""}">${p.stock}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td>
          <div class="acciones">
            <button class="act-btn act-view" title="Ver detalle" onclick="verDetalle('${p.productId}')">
              <i class="ti ti-eye" aria-label="Ver"></i>
            </button>
            <button class="act-btn act-edit" title="Editar" onclick="cargarParaEditar('${p.productId}')">
              <i class="ti ti-pencil" aria-label="Editar"></i>
            </button>
            <button class="act-btn act-del" title="Eliminar" onclick="eliminarProducto('${p.productId}')">
              <i class="ti ti-trash" aria-label="Eliminar"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── Cargar productos desde el backend ───────────────────────

async function cargarProductos() {
  tbody.innerHTML = `
    <tr><td colspan="7" class="sin-datos">
      <i class="ti ti-loader"></i> Cargando productos...
    </td></tr>`;

  try {
    const res  = await fetch(`${API}/products`);
    const data = await res.json();

    if (data.exito) {
      todosLosProductos = data.productos;
      renderizarTabla(todosLosProductos);
      actualizarStats(todosLosProductos);
    } else {
      mostrarAlerta("Error al cargar los productos: " + (data.error || ""), "error");
      tbody.innerHTML = `<tr><td colspan="7" class="sin-datos"><i class="ti ti-alert-triangle"></i> Error al cargar.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="sin-datos"><i class="ti ti-wifi-off"></i> Sin conexión con el servidor.</td></tr>`;
    console.error("Error al cargar productos:", err);
  }
}

// ── Filtrar productos en tiempo real ─────────────────────────

function filtrarProductos() {
  const q = document.getElementById("buscador").value.toLowerCase().trim();
  if (!q) {
    renderizarTabla(todosLosProductos);
    return;
  }
  const filtrado = todosLosProductos.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q) ||
    p.estado.toLowerCase().includes(q)
  );
  renderizarTabla(filtrado);
}

// ── Cargar producto en formulario para editar ────────────────

async function cargarParaEditar(productId) {
  try {
    const res  = await fetch(`${API}/products/${productId}`);
    const data = await res.json();

    if (!data.exito) {
      mostrarAlerta("No se pudo cargar el producto.", "error");
      return;
    }

    const p = data.producto;
    document.getElementById("productId").value  = p.productId;
    document.getElementById("nombre").value     = p.nombre;
    document.getElementById("categoria").value  = p.categoria;
    document.getElementById("estado").value     = p.estado;
    document.getElementById("precio").value     = p.precio;
    document.getElementById("stock").value      = p.stock;

    document.getElementById("titulo-form").textContent = "✏️ Editar Producto";
    document.getElementById("panel-form").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    mostrarAlerta("Error al cargar el producto.", "error");
  }
}

// ── Ver detalle (alerta informativa) ────────────────────────

function verDetalle(productId) {
  const p = todosLosProductos.find(x => x.productId === productId);
  if (!p) return;
  mostrarAlerta(
    `📦 ${p.nombre} | Categoría: ${p.categoria} | Precio: $${parseFloat(p.precio).toFixed(2)} | Stock: ${p.stock} | Estado: ${p.estado}`,
    "exito"
  );
}

// ── Guardar (crear o actualizar) ─────────────────────────────

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const payload = {
    nombre:    document.getElementById("nombre").value.trim(),
    categoria: document.getElementById("categoria").value,
    estado:    document.getElementById("estado").value,
    precio:    parseFloat(document.getElementById("precio").value),
    stock:     parseInt(document.getElementById("stock").value),
  };

  if (!payload.nombre || !payload.categoria || isNaN(payload.precio) || isNaN(payload.stock)) {
    mostrarAlerta("Por favor completa todos los campos requeridos.", "error");
    return;
  }

  const esEdicion = id !== "";
  const url    = esEdicion ? `${API}/products/${id}` : `${API}/products`;
  const metodo = esEdicion ? "PUT" : "POST";

  try {
    const res  = await fetch(url, {
      method:  metodo,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.exito) {
      mostrarAlerta(data.mensaje, "exito");
      limpiarFormulario();
      cargarProductos();
    } else {
      mostrarAlerta(data.error || "Error al guardar el producto.", "error");
    }
  } catch (err) {
    mostrarAlerta("Error de conexión con el servidor.", "error");
  }
});

// ── Eliminar producto ────────────────────────────────────────

async function eliminarProducto(productId) {
  if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

  try {
    const res  = await fetch(`${API}/products/${productId}`, { method: "DELETE" });
    const data = await res.json();

    if (data.exito) {
      mostrarAlerta(data.mensaje, "exito");
      cargarProductos();
    } else {
      mostrarAlerta(data.error || "No se pudo eliminar el producto.", "error");
    }
  } catch (err) {
    mostrarAlerta("Error de conexión al eliminar.", "error");
  }
}

// ── Inicialización ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarProductos);