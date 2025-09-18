const API = "/api/creditos";

let state = {
  total_pages:1,
  total: 0,
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
  state.total       = data.total
  state.total_pages = Math.max(1, Math.ceil(data.total / data.page_size ));

  $("#page-info").textContent = `Página ${data.page} / ${state.total_pages}`;
}

/* ---------- Crear ---------- */
async function onSubmitCreate(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = serializeForm(form);
  const errBox = $("#form-errors");
  showErrors(errBox, null);

  // Validación básica
  if (!form.reportValidity()) return;

  try {
    await fetchJSON(API, { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    await loadTable();
    await loadChartsFromAllCredits();
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
    // obtener detalle
    const row = await fetchJSON(`${API}/${editId}`);
    openEditModal(row);
  }

  if (delId) {
    if (!confirm(`¿Eliminar crédito #${delId}?`)) return;
    try {
      await fetchJSON(`${API}/${delId}`, { method: "DELETE" });
      await loadTable();
      await loadChartsFromAllCredits();
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
    await loadChartsFromAllCredits();
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

/* ---------- Dashboard ---------- */
async function fetchAllCreditos(filters = {}) {
  const pageSize = state.total
  let page = 1;
  let all = [];

  while (true) {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (filters.cliente) params.set("cliente", filters.cliente);
    if (filters.desde) params.set("desde", filters.desde);
    if (filters.hasta) params.set("hasta", filters.hasta);

    const chunk = await fetchJSON(`/api/creditos?${params.toString()}`);

    const items = Array.isArray(chunk) ? chunk : (chunk.items || []);
    all = all.concat(items);

    const total = Array.isArray(chunk) ? items.length : (chunk.total ?? items.length);
    const pageSizeUsed = Array.isArray(chunk) ? items.length : (chunk.page_size ?? pageSize);
    const currentPage = Array.isArray(chunk) ? page : (chunk.page ?? page);

    const totalPages = Math.max(1, Math.ceil(total / pageSizeUsed));
    if (currentPage >= totalPages || items.length === 0) break;

    page += 1;
  }
  return all;
}
function groupByDateSumMonto(creditos) {
  // suma por día YYYY-MM-DD
  const map = new Map();
  for (const c of creditos) {
    const d = c.fecha_otorgamiento; // YYYY-MM-DD
    const monto = Number(c.monto) || 0;
    map.set(d, (map.get(d) || 0) + monto);
  }
  // orden cronológico
  const dates = [...map.keys()].sort();
  const daily = dates.map(d => ({ fecha: d, monto: map.get(d) }));

  // acumulado
  let acc = 0;
  const acumulado = daily.map(x => { acc += x.monto; return { fecha: x.fecha, acumulado: acc }; });

  return { daily, acumulado };
}

function distribucionPorCliente(creditos, top = 10) {
  const map = new Map();
  for (const c of creditos) {
    const nombre = c.cliente || "N/D";
    const monto = Number(c.monto) || 0;
    map.set(nombre, (map.get(nombre) || 0) + monto);
  }
  const arr = [...map.entries()].map(([cliente, monto]) => ({ cliente, monto }));
  arr.sort((a,b) => b.monto - a.monto);
  return arr.slice(0, top);
}

function distribucionPorRangos(creditos, rangos = [[0,5000], [5000,10000], [10000,20000], [20000,50000], [50000,null]]) {
  const buckets = rangos.map(([min,max]) => ({
    etiqueta: max == null ? `${min}+` : `${min}–${max}`,
    min, max, cantidad: 0
  }));
  for (const c of creditos) {
    const m = Number(c.monto) || 0;
    for (const b of buckets) {
      const inBin = b.max == null ? (m >= b.min) : (m >= b.min && m < b.max);
      if (inBin) { b.cantidad++; break; }
    }
  }
  return buckets;
}

const charts = {};
function renderOrUpdateChart(canvasId, config) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (charts[canvasId]) { charts[canvasId].data = config.data; charts[canvasId].options = config.options || {}; charts[canvasId].update(); }
  else { charts[canvasId] = new Chart(ctx, config); }
}

async function loadChartsFromAllCredits() {
  const creditos = await fetchAllCreditos();

  // Todos los créditos otorgados (línea acumulada por fecha)
  const { acumulado } = groupByDateSumMonto(creditos);
  renderOrUpdateChart("chartTodos", {
    type: "line",
    data: {
      labels: acumulado.map(x => x.fecha),
      datasets: [{ label: "Monto acumulado", data: acumulado.map(x => x.acumulado) }]
    },
    options: { responsive: true, scales: { x: { ticks: { autoSkip: true } } } }
  });

  // Distribución por cliente (solo primeros 10))
  const topClientes = distribucionPorCliente(creditos, 10);
  renderOrUpdateChart("chartClientes", {
    type: "bar",
    data: {
      labels: topClientes.map(x => x.cliente),
      datasets: [{ label: "Monto por cliente", data: topClientes.map(x => x.monto) }]
    },
    options: { indexAxis: "y", responsive: true }
  });

  // Distribución por rangos de montos
  const buckets = distribucionPorRangos(creditos);
  renderOrUpdateChart("chartRangos", {
    type: "bar",
    data: {
      labels: buckets.map(b => b.etiqueta),
      datasets: [{ label: "Cantidad de créditos", data: buckets.map(b => b.cantidad) }]
    },
    options: { responsive: true }
  });
}


/* ---------- Init ---------- */
function init() {
  $("#form-credito").addEventListener("submit", onSubmitCreate);
  $("#tabla-creditos").addEventListener("click", onClickTable);
  $("#form-editar").addEventListener("submit", onSubmitEdit);
  bindFilters();
  loadTable().then(loadChartsFromAllCredits).catch(console.error);
}

document.addEventListener("DOMContentLoaded", init);
