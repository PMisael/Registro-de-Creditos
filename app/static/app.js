const API = "/api/creditos";

let state = {
  total_pages:1,
  page: 1,
  page_size: 10,
  cliente: "",
  desde: "",
  hasta: "",
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function serializeForm(formEl) {
  const data = Object.fromEntries(new FormData(formEl).entries());
  // normaliza números
  if (data.monto !== undefined) data.monto = data.monto === "" ? "" : Number(data.monto);
  if (data.tasa_intereses !== undefined) data.tasa_intereses = data.tasa_intereses === "" ? "" : Number(data.tasa_intereses);
  if (data.plazo !== undefined) data.plazo = data.plazo === "" ? "" : Number(data.plazo);
  return data;
}

function showErrors(container, errors) {
  if (!errors) { container.textContent = ""; return; }
  const lines = Object.entries(errors).map(([k,v]) => `• ${k}: ${v}`);
  container.textContent = lines.join("  ");
}

async function fetchJSON(url, opts={}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) {
    let payload;
    try { payload = await res.json(); } catch { payload = { message: res.statusText }; }
    throw payload;
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- Listado ---------- */
async function loadTable() {
  const params = new URLSearchParams({
    page: state.page,
    page_size: state.page_size,
  });
  if (state.cliente) params.set("cliente", state.cliente);
  if (state.desde) params.set("desde", state.desde);
  if (state.hasta) params.set("hasta", state.hasta);

  const data = await fetchJSON(`${API}?${params.toString()}`);
  const tbody = $("#tabla-creditos tbody");
  tbody.innerHTML = "";

  data.items.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.cliente}</td>
      <td>${row.monto.toFixed(2)}</td>
      <td>${row.tasa_intereses.toFixed(2)}</td>
      <td>${row.plazo}</td>
      <td>${row.fecha_otorgamiento}</td>
      <td>
        <div class="row-actions">
          <button data-edit="${row.id}">Editar</button>
          <button data-del="${row.id}" class="secondary">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  state.total_pages=Math.max(1, Math.ceil(data.total / data.page_size ));

  $("#page-info").textContent = `Página ${data.page} / ${state.total_pages}`;
}

/* ---------- Crear ---------- */
async function onSubmitCreate(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = serializeForm(form);
  const errBox = $("#form-errors");
  showErrors(errBox, null);

  // Validación básica del navegador
  if (!form.reportValidity()) return;

  try {
    await fetchJSON(API, { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    await loadTable();
  } catch (err) {
    showErrors(errBox, err.errors || { error: err.message || "Error" });
  }
}

/* ---------- Editar ---------- */
function openEditModal(row) {
  const dlg = $("#modal-editar");
  $("#edit-id").textContent = `#${row.id}`;
  const form = $("#form-editar");
  form.cliente.value = row.cliente;
  form.monto.value = row.monto;
  form.tasa_intereses.value = row.tasa_intereses;
  form.plazo.value = row.plazo;
  form.fecha_otorgamiento.value = row.fecha_otorgamiento;
  form.dataset.id = row.id;
  $("#edit-errors").textContent = "";
  dlg.showModal();
}

async function onClickTable(e) {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    // obtener detalle (o usar la fila actual si traes todo)
    const row = await fetchJSON(`${API}/${editId}`);
    openEditModal(row);
  }

  if (delId) {
    if (!confirm(`¿Eliminar crédito #${delId}?`)) return;
    try {
      await fetchJSON(`${API}/${delId}`, { method: "DELETE" });
      await loadTable();
    } catch (err) {
      alert(err.message || "Error eliminando");
    }
  }
}

async function onSubmitEdit(e) {
  e.preventDefault();
  const dlg = $("#modal-editar");
  const form = e.currentTarget;
  if (!form.reportValidity()) return;
  const id = form.dataset.id;
  const payload = serializeForm(form);

  try {
    await fetchJSON(`${API}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    dlg.close();
    await loadTable();
  } catch (err) {
    showErrors($("#edit-errors"), err.errors || { error: err.message || "Error" });
  }
}

/* ---------- Filtros y paginación ---------- */
function bindFilters() {
  $("#btn-filtrar").addEventListener("click", () => {
    state.cliente = $("#f-cliente").value.trim();
    state.desde = $("#f-desde").value;
    state.hasta = $("#f-hasta").value;
    state.page = 1;
    loadTable();
  });
  $("#prev").addEventListener("click", () => {
    if (state.page > 1) { state.page--; loadTable(); }
  });
  $("#next").addEventListener("click", () => {
    if (state.total_pages > state.page) {state.page++; loadTable();}
  });
}

/* ---------- Init ---------- */
function init() {
  $("#form-credito").addEventListener("submit", onSubmitCreate);
  $("#tabla-creditos").addEventListener("click", onClickTable);
  $("#form-editar").addEventListener("submit", onSubmitEdit);
  bindFilters();
  loadTable().catch(err => console.error(err));
}

document.addEventListener("DOMContentLoaded", init);
