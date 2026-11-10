
import { iniciarSesion, cerrarSesion, escucharSesion, cargarUsuarioActual, registrarAuditoria } from "../api.js";
import { $, mensaje, toast } from "../ui.js";

export function iniciarAuth({ alEntrar, alSalir }) {
  let sesionActiva = null; 

 
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const boton = e.submitter;
    boton.disabled = true;
    mensaje($("#loginMessage"), "Validando acceso...");
    try {
      await iniciarSesion($("#loginEmail").value.trim(), $("#loginPassword").value);
      $("#loginForm").reset();
    } catch (error) {
      mensaje($("#loginMessage"), error.message, true);
    } finally {
      boton.disabled = false;
    }
  });


  $("#logoutButton").addEventListener("click", async () => {
    await cerrarSesion();
  });


  escucharSesion((evento, sesion) => {
   
    setTimeout(async () => {
      if (!sesion) {
        sesionActiva = null;
        alSalir();
        return;
      }
      if (sesionActiva === sesion.user.id) return; 

      try {
        const usuario = await cargarUsuarioActual(sesion.user.email);

        
        if (usuario.estado !== "Activo") {
          await cerrarSesion();
          mensaje($("#loginMessage"), `Tu usuario está ${usuario.estado.toLowerCase()}. Contacta al administrador.`, true);
          return;
        }

        sesionActiva = sesion.user.id;
        if (evento === "SIGNED_IN") {
          await registrarAuditoria("Inicio de sesión", "sesion");
          toast(`Bienvenido/a, ${usuario.nombre_usuario}`);
        }
        alEntrar(usuario);
      } catch (error) {
        mensaje($("#loginMessage"), error.message, true);
      }
    }, 0);
  });
}
