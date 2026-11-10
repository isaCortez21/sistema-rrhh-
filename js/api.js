
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


let usuarioActual = null;
export const getUsuarioActual = () => usuarioActual;



function errorAmigable(error, accion = "") {
  const codigo = error?.code;
  if (codigo === "23503") {
    return new Error(accion === "eliminar"
      ? "No se puede eliminar: hay otros registros que dependen de este."
      : "El registro relacionado no existe.");
  }
  if (codigo === "23505") return new Error("Ya existe un registro con esos datos (dato duplicado).");
  if (codigo === "23502") return new Error("Falta completar un campo obligatorio.");
  if (codigo === "22P02" || codigo === "22007" || codigo === "22008") return new Error("Hay un dato con formato inválido.");
  if (codigo === "22001") return new Error("Un texto es demasiado largo para el campo.");
  if (codigo === "42501") return new Error("No tienes permiso para realizar esta acción.");
  return new Error(error?.message || "Ocurrió un error inesperado.");
}



export async function iniciarSesion(email, password) {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message === "Invalid login credentials"
      ? "Correo o contraseña incorrectos."
      : error.message);
  }
}

export async function cerrarSesion() {
  await registrarAuditoria("Cierre de sesión", "sesion");
  usuarioActual = null;
  await client.auth.signOut();
}

export function escucharSesion(callback) {
  client.auth.onAuthStateChange((evento, sesion) => callback(evento, sesion));
}


export async function cargarUsuarioActual(email) {
  let { data, error } = await client.from("usuario").select("*").eq("correo", email).maybeSingle();
  if (error) throw errorAmigable(error);

  if (!data) {
    const nuevo = { correo: email, nombre_usuario: email.split("@")[0], estado: "Activo" };
    const res = await client.from("usuario").insert(nuevo).select().single();
    if (res.error) throw errorAmigable(res.error);
    data = res.data;
  }


  data.nombre_rol = "Sin rol asignado";
  if (data.id_rol) {
    const rol = await client.from("rol").select("nombre").eq("id_rol", data.id_rol).maybeSingle();
    if (rol.data) data.nombre_rol = rol.data.nombre;
  }

  usuarioActual = data;
  return data;
}



export async function listar(tabla, columnas = "*", orden = null, descendente = false) {
  let consulta = client.from(tabla).select(columnas).limit(1000);
  if (orden) consulta = consulta.order(orden, { ascending: !descendente });
  const { data, error } = await consulta;
  if (error) throw errorAmigable(error);
  return data || [];
}

export async function contar(tabla) {
  const { count, error } = await client.from(tabla).select("*", { count: "exact", head: true });
  return error ? 0 : count || 0;
}

export async function crear(tabla, datos) {
  const { data, error } = await client.from(tabla).insert(datos).select().single();
  if (error) throw errorAmigable(error);
  await registrarAuditoria("Crear", tabla);
  return data;
}

export async function actualizar(tabla, pk, id, datos) {
  const { data, error } = await client.from(tabla).update(datos).eq(pk, id).select().single();
  if (error) throw errorAmigable(error);
  await registrarAuditoria("Editar", tabla);
  return data;
}

export async function eliminar(tabla, pk, id) {
  const { error } = await client.from(tabla).delete().eq(pk, id);
  if (error) throw errorAmigable(error, "eliminar");
  await registrarAuditoria("Eliminar", tabla);
}



export async function registrarAuditoria(accion, tabla) {
  try {
    await client.from("auditoria").insert({
      id_usuario: usuarioActual?.id_usuario ?? null,
      accion,
      tabla_afectada: tabla
    });
  } catch (e) {
    console.warn("No se pudo registrar la auditoría", e);
  }
}
