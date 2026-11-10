
import { listar } from "../api.js";
import { nombreTabla, nombreAccion } from "../modulos.js";
import { OPCIONES, FILAS_POR_PAGINA } from "../config.js";
import { cargarReferencias, etiqueta } from "./crud.js";
import { $, $$, esc, normalizar, badge, formatearFecha, diaLocal, dibujarPaginador, exportarExcel } from "../ui.js";

export async function montarAuditoria() {
  const panel = $("#auditoriaPanel");
  panel.innerHTML = `<div class="card empty">Cargando auditoría...</div>`;

  let registros = [];
  try {
    await cargarReferencias(["usuario"]);
    registros = await listar("auditoria", "*", "fecha_registro", true);
  } catch (e) {
    panel.innerHTML = `<div class="card empty"><i class="ti ti-alert-triangle"></i> ${esc(e.message)}</div>`;
    return;
  }

  const tablas = [...new Set(registros.map(r => r.tabla_afectada))].sort();
  const usuarios = [...new Set(registros.map(r => r.id_usuario).filter(Boolean))];
  let pagina = 1;

  panel.innerHTML = `
    <div class="module-head">
      <div>
        <p class="muted">Registro automático de quién creó, editó o eliminó información, y de los inicios de sesión.</p>
      </div>
    </div>

    <div class="card toolbar">
      <div class="search-box">
        <i class="ti ti-search"></i>
        <input id="audBuscar" type="search" placeholder="Buscar...">
      </div>
      <select id="audAccion">
        <option value="">Acción: todas</option>
        ${OPCIONES.accionAuditoria.map(a => `<option>${esc(a)}</option>`).join("")}
      </select>
      <select id="audTabla">
        <option value="">Tabla: todas</option>
        ${tablas.map(t => `<option value="${esc(t)}">${esc(nombreTabla(t))}</option>`).join("")}
      </select>
      <select id="audUsuario">
        <option value="">Usuario: todos</option>
        ${usuarios.map(u => `<option value="${u}">${esc(etiqueta("usuario", u))}</option>`).join("")}
      </select>
      <input id="audDesde" type="date" title="Desde">
      <input id="audHasta" type="date" title="Hasta">
      <span class="spacer"></span>
      <button id="audExcel" class="btn btn-light"><i class="ti ti-file-spreadsheet"></i> Exportar Excel</button>
    </div>

    <div class="card table-card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>N°</th><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Tabla</th></tr>
          </thead>
          <tbody id="audFilas"></tbody>
        </table>
      </div>
      <div class="table-footer">
        <span id="audResumen"></span>
        <div id="audPaginador" class="pager"></div>
      </div>
    </div>`;

  function filtrados() {
    const q = normalizar($("#audBuscar").value);
    const accion = $("#audAccion").value;
    const tabla = $("#audTabla").value;
    const usuario = $("#audUsuario").value;
    const desde = $("#audDesde").value;
    const hasta = $("#audHasta").value;

    return registros.filter(r => {
      const dia = diaLocal(r.fecha_registro);
      if (accion && nombreAccion(r.accion) !== accion) return false;
      if (tabla && r.tabla_afectada !== tabla) return false;
      if (usuario && String(r.id_usuario) !== usuario) return false;
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      if (!q) return true;
      const textoFila = [r.id_auditoria, etiqueta("usuario", r.id_usuario), nombreAccion(r.accion), nombreTabla(r.tabla_afectada), formatearFecha(r.fecha_registro)].join(" ");
      return normalizar(textoFila).includes(q);
    });
  }

  function dibujar() {
    const lista = filtrados();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / FILAS_POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;
    const desde = (pagina - 1) * FILAS_POR_PAGINA;

    $("#audFilas").innerHTML = lista.length
      ? lista.slice(desde, desde + FILAS_POR_PAGINA).map(r => `
          <tr>
            <td>${r.id_auditoria}</td>
            <td>${esc(formatearFecha(r.fecha_registro))}</td>
            <td>${esc(etiqueta("usuario", r.id_usuario) || "Desconocido")}</td>
            <td>${badge(nombreAccion(r.accion))}</td>
            <td>${esc(nombreTabla(r.tabla_afectada))}</td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="empty">No hay registros de auditoría.</td></tr>`;

    $("#audResumen").textContent = `${lista.length} de ${registros.length} registros`;
    dibujarPaginador($("#audPaginador"), lista.length, pagina, FILAS_POR_PAGINA, p => { pagina = p; dibujar(); });
  }


  $$("#audBuscar, #audAccion, #audTabla, #audUsuario, #audDesde, #audHasta", panel)
    .forEach(el => el.addEventListener("input", () => { pagina = 1; dibujar(); }));

  $("#audExcel").addEventListener("click", () => {
    exportarExcel("auditoria", filtrados().map(r => ({
      "N°": r.id_auditoria,
      "Fecha y hora": formatearFecha(r.fecha_registro),
      "Usuario": etiqueta("usuario", r.id_usuario) || "Desconocido",
      "Acción": nombreAccion(r.accion),
      "Tabla": nombreTabla(r.tabla_afectada)
    })));
  });

  dibujar();
}
