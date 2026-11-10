
import { NAVEGACION } from "./config.js";
import { MODULOS, VISTAS } from "./modulos.js";
import { $, $$, esc } from "./ui.js";
import { iniciarAuth } from "./modules/auth.js";
import { montarDashboard } from "./modules/dashboard.js";
import { montarCrud } from "./modules/crud.js";
import { montarAuditoria } from "./modules/auditoria.js";

const PANELES = ["dashboardPanel", "crudPanel", "auditoriaPanel"];


const infoVista = id => MODULOS[id] || VISTAS[id];


function construirMenu() {
  $("#mainNav").innerHTML = NAVEGACION.map(grupo => `
    <div class="nav-group">${esc(grupo.grupo)}</div>
    ${grupo.items.map(id => `
      <a class="nav-link" href="#${id}" data-vista="${id}">
        <i class="ti ${infoVista(id).icono}"></i> ${esc(infoVista(id).titulo)}
      </a>`).join("")}
  `).join("");
}

function vistaActual() {
  const id = location.hash.replace("#", "");
  return infoVista(id) ? id : "dashboard";
}

async function mostrarVista(id = vistaActual()) {
  if ($("#appView").classList.contains("hidden")) return; // sin sesión no se carga nada
  PANELES.forEach(p => $("#" + p).classList.add("hidden"));
  $$(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.vista === id));
  $("#pageTitle").innerHTML = `<i class="ti ${infoVista(id).icono}"></i> ${esc(infoVista(id).titulo)}`;
  $("#sidebar").classList.remove("open"); // en celular se cierra el menú

  if (id === "dashboard") {
    $("#dashboardPanel").classList.remove("hidden");
    await montarDashboard();
  } else if (id === "auditoria") {
    $("#auditoriaPanel").classList.remove("hidden");
    await montarAuditoria();
  } else {
    $("#crudPanel").classList.remove("hidden");
    await montarCrud(MODULOS[id]);
  }
}


function mostrarApp(usuario) {
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#userName").textContent = usuario.nombre_usuario || usuario.correo;
  $("#userRole").textContent = usuario.nombre_rol;
  mostrarVista();
}

function mostrarLogin() {
  $("#appView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
}


construirMenu();
window.addEventListener("hashchange", () => mostrarVista());
$("#refreshCurrent").addEventListener("click", () => mostrarVista());
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

iniciarAuth({ alEntrar: mostrarApp, alSalir: mostrarLogin });
