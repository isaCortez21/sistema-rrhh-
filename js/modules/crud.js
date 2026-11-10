// =========================================================
// Módulo CRUD reutilizable
// Lista, busca, filtra, ordena, pagina, exporta a Excel,
// crea, edita y elimina registros de cualquier tabla definida
// en js/modulos.js
// =========================================================
import { listar, crear, actualizar, eliminar } from "../api.js";
import { REFERENCIAS } from "../modulos.js";
import { FILAS_POR_PAGINA } from "../config.js";
import {
  $, $$, esc, normalizar, badge, mensaje, toast, mostrarModal, cerrarModal, confirmar,
  formatearFecha, formatearDinero, dibujarPaginador, exportarExcel
} from "../ui.js";

// Datos de las tablas relacionadas (para los <select> y para mostrar nombres en vez de IDs)
const cache = {};

// Evita que una vista vieja escriba encima si el usuario cambia rápido de módulo
let montajeActual = 0;


// ---------- Referencias (tablas relacionadas) ----------
export async function cargarReferencias(nombres) {
  const todas = new Set();
  nombres.forEach(n => {
    todas.add(n);
    (REFERENCIAS[n].depende || []).forEach(d => todas.add(d));
  });
  await Promise.all([...todas].map(async n => {
    const ref = REFERENCIAS[n];
    cache[n] = await listar(ref.tabla, ref.columnas, ref.orden).catch(() => []);
  }));
}

export function buscar(nombreRef, id) {
  const ref = REFERENCIAS[nombreRef];
  return (cache[nombreRef] || []).find(r => String(r[ref.pk]) === String(id));
}

export function etiqueta(nombreRef, id) {
  if (id === null || id === undefined || id === "") return "";
  const fila = buscar(nombreRef, id);
  return fila ? REFERENCIAS[nombreRef].etiqueta(fila, etiqueta) : `N° ${id}`;
}


// ---------- Mostrar valores ----------
// Texto plano de un campo (se usa en la tabla, el buscador y el Excel)
function texto(campo, valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (campo.tipo === "fk") return etiqueta(campo.ref, valor);
  if (campo.tipo === "date") return formatearFecha(valor);
  if (campo.tipo === "money") return formatearDinero(valor);
  return String(valor);
}

// HTML de una celda
function celda(campo, valor) {
  if (valor === null || valor === undefined || valor === "") return `<td>—</td>`;
  if (campo.badge) return `<td>${badge(valor)}</td>`;
  const numerico = ["money", "number"].includes(campo.tipo);
  return `<td class="${numerico ? "num" : ""}">${esc(texto(campo, valor))}</td>`;
}


// ---------- Pantalla principal del módulo ----------
export async function montarCrud(modulo) {
  const miMontaje = ++montajeActual;
  const panel = $("#crudPanel");
  panel.innerHTML = `<div class="card empty">Cargando ${esc(modulo.titulo.toLowerCase())}...</div>`;

  // Columna con el ID + campos visibles en la tabla
  const colId = { nombre: modulo.pk, etiqueta: "N°", tipo: "number" };
  const columnas = [colId, ...modulo.campos.filter(c => c.tabla)];
  const camposFiltro = modulo.campos.filter(c => c.filtro);
  const camposBusqueda = [colId, ...modulo.campos.filter(c => !c.virtual)];

  // Estado de la pantalla
  let filas = [];
  let busqueda = "";
  let filtros = {};
  let pagina = 1;
  let orden = { campo: null, asc: true };

  // Carga tablas relacionadas + datos del módulo
  try {
    const refs = [...new Set(modulo.campos.filter(c => c.tipo === "fk").map(c => c.ref))];
    await cargarReferencias(refs);
    filas = await listar(modulo.tabla, "*", modulo.orden, modulo.descendente);
  } catch (e) {
    if (miMontaje !== montajeActual) return;
    panel.innerHTML = `<div class="card empty"><i class="ti ti-alert-triangle"></i> ${esc(e.message)}</div>`;
    return;
  }
  if (miMontaje !== montajeActual) return;

  // --- Estructura HTML ---
  panel.innerHTML = `
    <div class="module-head">
      <div>
        <p class="muted">${esc(modulo.descripcion)}</p>
      </div>
      <button id="btnNuevo" class="btn btn-primary"><i class="ti ti-plus"></i> Nuevo registro</button>
    </div>

    <div class="card toolbar">
      <div class="search-box">
        <i class="ti ti-search"></i>
        <input id="txtBuscar" type="search" placeholder="Buscar en ${esc(modulo.titulo.toLowerCase())}...">
      </div>
      ${camposFiltro.map(c => `
        <select data-filtro="${c.nombre}" title="${esc(c.etiqueta)}">
          <option value="">${esc(c.etiqueta)}: todos</option>
          ${opcionesFiltro(c)}
        </select>`).join("")}
      <span class="spacer"></span>
      <button id="btnExcel" class="btn btn-light"><i class="ti ti-file-spreadsheet"></i> Exportar Excel</button>
    </div>

    <div class="card table-card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${columnas.map(c => `<th data-orden="${c.nombre}">${esc(c.etiqueta)} <i class="ti ti-arrows-sort"></i></th>`).join("")}
              <th class="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbodyFilas"></tbody>
        </table>
      </div>
      <div class="table-footer">
        <span id="resumen"></span>
        <div id="paginador" class="pager"></div>
      </div>
    </div>`;

  // Opciones de cada filtro
  function opcionesFiltro(campo) {
    let lista;
    if (campo.tipo === "select") {
      lista = campo.opciones.map(o => [o, o]);
    } else if (campo.tipo === "fk") {
      const pk = REFERENCIAS[campo.ref].pk;
      lista = (cache[campo.ref] || []).map(r => [r[pk], etiqueta(campo.ref, r[pk])]);
    } else {
      // Valores distintos que existen en los datos (ej: periodo)
      lista = [...new Set(filas.map(f => f[campo.nombre]).filter(Boolean))].sort().reverse().map(v => [v, texto(campo, v)]);
    }
    return lista.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
  }

  // --- Filtrar, buscar y ordenar ---
  function filasVisibles() {
    const q = normalizar(busqueda);
    let lista = filas.filter(f => {
      for (const [campo, val] of Object.entries(filtros)) {
        if (val && String(f[campo]) !== val) return false;
      }
      if (!q) return true;
      return camposBusqueda.some(c => normalizar(texto(c, f[c.nombre])).includes(q));
    });

    if (orden.campo) {
      const campo = columnas.find(c => c.nombre === orden.campo);
      const numerico = ["number", "money"].includes(campo.tipo);
      lista = [...lista].sort((a, b) => {
        const va = a[campo.nombre];
        const vb = b[campo.nombre];
        let r;
        if (numerico) r = (Number(va) || 0) - (Number(vb) || 0);
        else if (campo.tipo === "date" || campo.tipo === "month") r = String(va || "").localeCompare(String(vb || ""));
        else r = normalizar(texto(campo, va)).localeCompare(normalizar(texto(campo, vb)));
        return orden.asc ? r : -r;
      });
    }
    return lista;
  }

  // --- Dibujar la tabla ---
  function dibujar() {
    const lista = filasVisibles();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / FILAS_POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;
    const desde = (pagina - 1) * FILAS_POR_PAGINA;
    const pagActual = lista.slice(desde, desde + FILAS_POR_PAGINA);

    $("#tbodyFilas").innerHTML = pagActual.length
      ? pagActual.map(f => `
          <tr>
            ${columnas.map(c => celda(c, f[c.nombre])).join("")}
            <td class="actions">
              <button class="btn btn-icon" data-editar="${esc(f[modulo.pk])}" title="Editar"><i class="ti ti-pencil"></i></button>
              <button class="btn btn-icon btn-danger" data-eliminar="${esc(f[modulo.pk])}" title="Eliminar"><i class="ti ti-trash"></i></button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="${columnas.length + 1}" class="empty">No hay registros para mostrar.</td></tr>`;

    $("#resumen").textContent = `${lista.length} de ${filas.length} registros`;
    dibujarPaginador($("#paginador"), lista.length, pagina, FILAS_POR_PAGINA, p => { pagina = p; dibujar(); });

    // Ícono de la columna ordenada
    $$("th[data-orden]", panel).forEach(th => {
      const icono = th.querySelector(".ti");
      icono.className = "ti " + (th.dataset.orden !== orden.campo ? "ti-arrows-sort" : orden.asc ? "ti-sort-ascending" : "ti-sort-descending");
    });
  }

  async function recargar() {
    try {
      filas = await listar(modulo.tabla, "*", modulo.orden, modulo.descendente);
      dibujar();
    } catch (e) {
      toast(e.message, true);
    }
  }

  // --- Eventos ---
  $("#txtBuscar").addEventListener("input", e => { busqueda = e.target.value; pagina = 1; dibujar(); });

  $$("[data-filtro]", panel).forEach(sel => sel.addEventListener("change", () => {
    filtros[sel.dataset.filtro] = sel.value;
    pagina = 1;
    dibujar();
  }));

  $$("th[data-orden]", panel).forEach(th => th.addEventListener("click", () => {
    const campo = th.dataset.orden;
    orden = { campo, asc: orden.campo === campo ? !orden.asc : true };
    dibujar();
  }));

  $("#btnNuevo").addEventListener("click", () => abrirFormulario());

  $("#btnExcel").addEventListener("click", () => {
    const datos = filasVisibles().map(f => {
      const fila = {};
      columnas.forEach(c => { fila[c.etiqueta] = texto(c, f[c.nombre]); });
      return fila;
    });
    exportarExcel(modulo.tabla, datos);
  });

  $("#tbodyFilas").addEventListener("click", async e => {
    const btnEditar = e.target.closest("[data-editar]");
    const btnEliminar = e.target.closest("[data-eliminar]");

    if (btnEditar) {
      const fila = filas.find(f => String(f[modulo.pk]) === btnEditar.dataset.editar);
      abrirFormulario(fila);
    }

    if (btnEliminar) {
      const ok = await confirmar(`¿Eliminar el registro N° ${btnEliminar.dataset.eliminar}? Esta acción no se puede deshacer.`);
      if (!ok) return;
      try {
        await eliminar(modulo.tabla, modulo.pk, btnEliminar.dataset.eliminar);
        toast("Registro eliminado.");
        await recargar();
      } catch (err) {
        toast(err.message, true);
      }
    }
  });


  // ---------- Formulario (crear / editar) ----------
  function abrirFormulario(fila = null) {
    const esEdicion = !!fila;
    const datosFila = fila || {};
    const camposForm = modulo.campos;

    const modal = mostrarModal(
      esEdicion ? `Editar ${modulo.titulo.toLowerCase()} N° ${datosFila[modulo.pk]}` : `Nuevo registro: ${modulo.titulo.toLowerCase()}`,
      `<form id="frmRegistro">
        <div class="form-grid">
          ${camposForm.map(c => htmlCampo(c, esEdicion ? datosFila[c.nombre] : valorInicial(c))).join("")}
        </div>
        <p id="frmMensaje" class="message"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-light" data-cerrar>Cancelar</button>
          <button type="submit" class="btn btn-primary"><i class="ti ti-device-floppy"></i> Guardar</button>
        </div>
      </form>`
    );

    const form = $("#frmRegistro", modal);
    const ctx = { filas, buscar, etiqueta, esEdicion, id: datosFila[modulo.pk] };

    // Cálculos automáticos del módulo
    if (modulo.alCambiar) {
      form.addEventListener("input", e => modulo.alCambiar(form, e.target.name, ctx));
      modulo.alCambiar(form, null, ctx);
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const boton = form.querySelector("[type=submit]");
      const datos = leerFormulario(form);

      try {
        if (modulo.antesDeGuardar) modulo.antesDeGuardar(datos, form, ctx);
        boton.disabled = true;
        mensaje($("#frmMensaje", form), "Guardando...");

        if (esEdicion) await actualizar(modulo.tabla, modulo.pk, datosFila[modulo.pk], datos);
        else await crear(modulo.tabla, datos);

        cerrarModal();
        toast(esEdicion ? "Cambios guardados." : "Registro creado.");
        await recargar();
      } catch (err) {
        mensaje($("#frmMensaje", form), err.message, true);
        boton.disabled = false;
      }
    });
  }

  // Valor inicial al crear (puede ser un valor o una función)
  function valorInicial(campo) {
    return typeof campo.porDefecto === "function" ? campo.porDefecto() : campo.porDefecto ?? "";
  }

  // Lee el formulario y arma el objeto que se guarda en Supabase
  function leerFormulario(form) {
    const datos = {};
    modulo.campos.filter(c => !c.virtual).forEach(c => {
      const bruto = form.elements[c.nombre].value.trim();
      if (bruto === "") datos[c.nombre] = null;
      else if (["fk", "number", "money"].includes(c.tipo)) datos[c.nombre] = Number(bruto);
      else datos[c.nombre] = bruto;
    });
    return datos;
  }

  // HTML de un campo del formulario
  function htmlCampo(campo, valor) {
    const v = valor ?? "";
    const req = campo.requerido ? "required" : "";
    const titulo = `${esc(campo.etiqueta)}${campo.requerido ? " *" : ""}`;
    let control;

    if (campo.tipo === "select") {
      const opciones = [...campo.opciones];
      if (v !== "" && !opciones.includes(v)) opciones.push(v); // valor antiguo que no está en la lista
      control = `
        <select name="${campo.nombre}" ${req}>
          <option value="">Seleccione...</option>
          ${opciones.map(o => `<option ${String(o) === String(v) ? "selected" : ""}>${esc(o)}</option>`).join("")}
        </select>`;
    } else if (campo.tipo === "fk") {
      const pk = REFERENCIAS[campo.ref].pk;
      control = `
        <select name="${campo.nombre}" ${req}>
          <option value="">Seleccione...</option>
          ${(cache[campo.ref] || []).map(r => `
            <option value="${r[pk]}" ${String(r[pk]) === String(v) ? "selected" : ""}>${esc(etiqueta(campo.ref, r[pk]))}</option>`).join("")}
        </select>`;
    } else if (campo.tipo === "textarea") {
      control = `<textarea name="${campo.nombre}" ${req}>${esc(v)}</textarea>`;
    } else if (campo.tipo === "money") {
      control = `<input name="${campo.nombre}" type="number" min="0" step="1" value="${esc(v)}" ${req}>`;
    } else if (campo.tipo === "number") {
      control = `<input name="${campo.nombre}" type="number" step="any" value="${esc(v)}" ${req}>`;
    } else {
      control = `<input name="${campo.nombre}" type="${campo.tipo}" value="${esc(v)}" ${req}>`;
    }

    return `
      <label class="field ${campo.completo ? "full" : ""}">
        <span>${titulo}</span>
        ${control}
        ${campo.ayuda ? `<small>${esc(campo.ayuda)}</small>` : ""}
      </label>`;
  }

  dibujar();
}
