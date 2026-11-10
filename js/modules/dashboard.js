// =========================================================
// Panel principal: indicadores y resúmenes
// =========================================================
import { listar } from "../api.js";
import { nombreTabla, nombreAccion } from "../modulos.js";
import { $, esc, badge, hoy, formatearFecha, formatearDinero } from "../ui.js";

// Fila de un gráfico de barras
function barra(texto, valor, maximo, azul = false) {
  const ancho = maximo ? Math.max(4, valor / maximo * 100) : 4;
  return `
    <div class="bar-row">
      <span>${esc(texto)}</span>
      <span class="bar-track"><span class="bar-fill ${azul ? "navy" : ""}" style="width:${ancho}%"></span></span>
      <strong>${valor}</strong>
    </div>`;
}

// Tarjeta de indicador
function indicador(icono, titulo, valor, detalle = "") {
  return `
    <div class="card stat">
      <span class="stat-icon"><i class="ti ${icono}"></i></span>
      <div>
        <small>${esc(titulo)}</small>
        <strong>${esc(valor)}</strong>
        ${detalle ? `<small>${esc(detalle)}</small>` : ""}
      </div>
    </div>`;
}

export async function montarDashboard() {
  const panel = $("#dashboardPanel");
  panel.innerHTML = `<div class="card empty">Cargando indicadores...</div>`;

  let trabajadores, contratos, departamentos, liquidaciones, auditoria, usuarios;
  try {
    [trabajadores, contratos, departamentos, liquidaciones, auditoria, usuarios] = await Promise.all([
      listar("trabajador", "id_trabajador,nombres,apellidos,estado_laboral"),
      listar("contrato", "id_contrato,id_trabajador,id_departamento,tipo_contrato,sueldo_base,estado_contrato,fecha_termino"),
      listar("departamento", "id_departamento,nombre"),
      listar("liquidacion", "id_liquidacion,periodo,sueldo_liquido"),
      listar("auditoria", "*", "fecha_registro", true),
      listar("usuario", "id_usuario,nombre_usuario,correo")
    ]);
  } catch (e) {
    panel.innerHTML = `<div class="card empty"><i class="ti ti-alert-triangle"></i> ${esc(e.message)}</div>`;
    return;
  }

  // --- Cálculos ---
  const contar = (lista, campo, valor) => lista.filter(x => x[campo] === valor).length;
  const activos = contar(trabajadores, "estado_laboral", "Activo");
  const vigentes = contratos.filter(c => c.estado_contrato === "Vigente");
  const masaSalarial = vigentes.reduce((suma, c) => suma + Number(c.sueldo_base || 0), 0);

  const ultimoPeriodo = liquidaciones.map(l => l.periodo).filter(Boolean).sort().pop();
  const liqPeriodo = liquidaciones.filter(l => l.periodo === ultimoPeriodo);
  const totalLiquido = liqPeriodo.reduce((suma, l) => suma + Number(l.sueldo_liquido || 0), 0);

  const nombreTrabajador = id => {
    const t = trabajadores.find(x => x.id_trabajador === id);
    return t ? `${t.nombres} ${t.apellidos}` : `N° ${id}`;
  };
  const nombreUsuario = id => {
    const u = usuarios.find(x => x.id_usuario === id);
    return u ? u.nombre_usuario || u.correo : "Desconocido";
  };

  // Estados de trabajadores
  const estados = ["Activo", "Inactivo", "Desvinculado"].map(e => [e, contar(trabajadores, "estado_laboral", e)]);
  const maxEstados = Math.max(...estados.map(e => e[1]), 1);

  // Trabajadores por departamento (según contratos vigentes)
  const porDepto = departamentos
    .map(d => [d.nombre, vigentes.filter(c => c.id_departamento === d.id_departamento).length])
    .filter(d => d[1] > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxDepto = Math.max(...porDepto.map(d => d[1]), 1);

  // Contratos que vencen en los próximos 60 días
  const limite = new Date();
  limite.setDate(limite.getDate() + 60);
  const fechaLimite = limite.toISOString().slice(0, 10);
  const porVencer = vigentes
    .filter(c => c.fecha_termino && c.fecha_termino >= hoy() && c.fecha_termino <= fechaLimite)
    .sort((a, b) => a.fecha_termino.localeCompare(b.fecha_termino));

  // --- HTML ---
  panel.innerHTML = `
    <div class="stats-grid">
      ${indicador("ti-users", "Trabajadores activos", activos, `de ${trabajadores.length} registrados`)}
      ${indicador("ti-file-text", "Contratos vigentes", vigentes.length, `de ${contratos.length} contratos`)}
      ${indicador("ti-cash", "Masa salarial mensual", formatearDinero(masaSalarial), "suma de sueldos base vigentes")}
      ${indicador("ti-receipt", "Líquido último periodo", formatearDinero(totalLiquido), ultimoPeriodo ? `${liqPeriodo.length} liquidaciones de ${ultimoPeriodo}` : "sin liquidaciones")}
    </div>

    <div class="dashboard-grid">
      <article class="card">
        <h2><i class="ti ti-chart-bar"></i> Estado de los trabajadores</h2>
        <div class="bars">${estados.map(e => barra(e[0], e[1], maxEstados)).join("")}</div>
      </article>

      <article class="card">
        <h2><i class="ti ti-building"></i> Trabajadores por departamento</h2>
        <div class="bars">
          ${porDepto.length ? porDepto.map(d => barra(d[0], d[1], maxDepto, true)).join("") : `<p class="muted">Sin contratos vigentes.</p>`}
        </div>
      </article>

      <article class="card">
        <h2><i class="ti ti-alarm"></i> Contratos por vencer (60 días)</h2>
        ${porVencer.length ? `
          <ul class="simple-list">
            ${porVencer.map(c => `
              <li>
                <span>${esc(nombreTrabajador(c.id_trabajador))} <small class="muted">· ${esc(c.tipo_contrato || "")}</small></span>
                <strong>${formatearFecha(c.fecha_termino)}</strong>
              </li>`).join("")}
          </ul>` : `<p class="muted">No hay contratos por vencer.</p>`}
      </article>

      <article class="card">
        <h2><i class="ti ti-history"></i> Últimos movimientos</h2>
        ${auditoria.length ? `
          <ul class="simple-list">
            ${auditoria.slice(0, 6).map(a => `
              <li>
                <span>${badge(nombreAccion(a.accion))} ${esc(nombreTabla(a.tabla_afectada))}
                  <small class="muted">· ${esc(nombreUsuario(a.id_usuario))}</small></span>
                <small class="muted">${formatearFecha(a.fecha_registro)}</small>
              </li>`).join("")}
          </ul>` : `<p class="muted">Aún no hay movimientos registrados.</p>`}
      </article>
    </div>`;
}
