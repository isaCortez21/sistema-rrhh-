
import { OPCIONES } from "./config.js";
import { hoy, diasHabiles, horasEntre, rutValido, formatearRut } from "./ui.js";


export const REFERENCIAS = {
  trabajador: {
    tabla: "trabajador", pk: "id_trabajador", orden: "apellidos",
    columnas: "id_trabajador,rut,nombres,apellidos,estado_laboral",
    etiqueta: r => `${r.nombres} ${r.apellidos} (${r.rut})`
  },
  departamento: {
    tabla: "departamento", pk: "id_departamento", orden: "nombre",
    columnas: "id_departamento,nombre",
    etiqueta: r => r.nombre
  },
  cargo: {
    tabla: "cargo", pk: "id_cargo", orden: "nombre",
    columnas: "id_cargo,nombre",
    etiqueta: r => r.nombre
  },
  contrato: {
    tabla: "contrato", pk: "id_contrato", orden: "id_contrato",
    columnas: "id_contrato,id_trabajador,tipo_contrato,sueldo_base,estado_contrato",
    depende: ["trabajador"],
    etiqueta: (r, etiqueta) => `N° ${r.id_contrato} · ${etiqueta("trabajador", r.id_trabajador)} · ${r.tipo_contrato || ""}`
  },
  liquidacion: {
    tabla: "liquidacion", pk: "id_liquidacion", orden: "id_liquidacion",
    columnas: "id_liquidacion,id_trabajador,periodo",
    depende: ["trabajador"],
    etiqueta: (r, etiqueta) => `N° ${r.id_liquidacion} · ${r.periodo || ""} · ${etiqueta("trabajador", r.id_trabajador)}`
  },
  concepto_remuneracion: {
    tabla: "concepto_remuneracion", pk: "id_concepto", orden: "nombre",
    columnas: "id_concepto,nombre,tipo_concepto",
    etiqueta: r => `${r.nombre} (${r.tipo_concepto || "-"})`
  },
  rol: {
    tabla: "rol", pk: "id_rol", orden: "nombre",
    columnas: "id_rol,nombre",
    etiqueta: r => r.nombre
  },
  permiso: {
    tabla: "permiso", pk: "id_permiso", orden: "nombre",
    columnas: "id_permiso,nombre",
    etiqueta: r => r.nombre
  },
  usuario: {
    tabla: "usuario", pk: "id_usuario", orden: "nombre_usuario",
    columnas: "id_usuario,nombre_usuario,correo",
    etiqueta: r => r.nombre_usuario || r.correo
  }
};


const valor = (form, nombre) => form.elements[nombre]?.value ?? "";
const asignar = (form, nombre, v) => { if (form.elements[nombre]) form.elements[nombre].value = v ?? ""; };



export const MODULOS = {

 
  trabajador: {
    titulo: "Trabajadores", icono: "ti-users", tabla: "trabajador", pk: "id_trabajador", orden: "apellidos",
    descripcion: "Ficha personal y laboral de cada trabajador.",
    campos: [
      { nombre: "rut", etiqueta: "RUT", tipo: "text", requerido: true, tabla: true, ayuda: "Ej: 12345678-9" },
      { nombre: "nombres", etiqueta: "Nombres", tipo: "text", requerido: true, tabla: true },
      { nombre: "apellidos", etiqueta: "Apellidos", tipo: "text", requerido: true, tabla: true },
      { nombre: "correo_personal", etiqueta: "Correo personal", tipo: "email", tabla: true },
      { nombre: "correo_corporativo", etiqueta: "Correo corporativo", tipo: "email" },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", ayuda: "Ej: +56912345678" },
      { nombre: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "date" },
      { nombre: "fecha_ingreso", etiqueta: "Fecha de ingreso", tipo: "date", requerido: true, tabla: true, porDefecto: hoy },
      { nombre: "direccion", etiqueta: "Dirección", tipo: "text", completo: true },
      { nombre: "comuna", etiqueta: "Comuna", tipo: "text" },
      { nombre: "region", etiqueta: "Región", tipo: "select", opciones: OPCIONES.regiones, porDefecto: "Tarapacá", filtro: true },
      { nombre: "estado_laboral", etiqueta: "Estado laboral", tipo: "select", opciones: OPCIONES.estadoLaboral, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Activo" },
      { nombre: "fecha_salida", etiqueta: "Fecha de salida", tipo: "date", ayuda: "Obligatoria si está desvinculado" }
    ],
    antesDeGuardar(datos) {
      if (!rutValido(datos.rut)) throw new Error("El RUT no es válido. Revisa el dígito verificador.");
      datos.rut = formatearRut(datos.rut);
      if (datos.estado_laboral === "Desvinculado" && !datos.fecha_salida) {
        throw new Error("Si el trabajador está desvinculado, indica la fecha de salida.");
      }
      if (datos.fecha_salida && datos.fecha_salida < datos.fecha_ingreso) {
        throw new Error("La fecha de salida no puede ser anterior a la de ingreso.");
      }
    }
  },

  departamento: {
    titulo: "Departamentos", icono: "ti-building", tabla: "departamento", pk: "id_departamento", orden: "nombre",
    descripcion: "Áreas de la empresa.",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true, tabla: true },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoGeneral, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Activo" }
    ]
  },

  cargo: {
    titulo: "Cargos", icono: "ti-briefcase", tabla: "cargo", pk: "id_cargo", orden: "nombre",
    descripcion: "Puestos de trabajo disponibles.",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true, tabla: true },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoGeneral, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Activo" }
    ]
  },


  contrato: {
    titulo: "Contratos", icono: "ti-file-text", tabla: "contrato", pk: "id_contrato", orden: "id_contrato",
    descripcion: "Contratos de trabajo con su departamento, cargo y sueldo.",
    campos: [
      { nombre: "id_trabajador", etiqueta: "Trabajador", tipo: "fk", ref: "trabajador", requerido: true, tabla: true, completo: true },
      { nombre: "id_departamento", etiqueta: "Departamento", tipo: "fk", ref: "departamento", requerido: true, tabla: true, filtro: true },
      { nombre: "id_cargo", etiqueta: "Cargo", tipo: "fk", ref: "cargo", requerido: true, tabla: true, filtro: true },
      { nombre: "tipo_contrato", etiqueta: "Tipo de contrato", tipo: "select", opciones: OPCIONES.tipoContrato, requerido: true, tabla: true, filtro: true },
      { nombre: "sueldo_base", etiqueta: "Sueldo base", tipo: "money", requerido: true, tabla: true },
      { nombre: "fecha_inicio", etiqueta: "Fecha de inicio", tipo: "date", requerido: true, tabla: true, porDefecto: hoy },
      { nombre: "fecha_termino", etiqueta: "Fecha de término", tipo: "date", ayuda: "Obligatoria en plazo fijo" },
      { nombre: "estado_contrato", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoContrato, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Vigente" }
    ],
    antesDeGuardar(datos) {
      if (datos.tipo_contrato === "Plazo fijo" && !datos.fecha_termino) {
        throw new Error("Un contrato a plazo fijo necesita fecha de término.");
      }
      if (datos.fecha_termino && datos.fecha_inicio && datos.fecha_termino < datos.fecha_inicio) {
        throw new Error("La fecha de término no puede ser anterior a la de inicio.");
      }
      if (datos.sueldo_base < 0) throw new Error("El sueldo no puede ser negativo.");
    }
  },

  anexo_contrato: {
    titulo: "Anexos de contrato", icono: "ti-file-plus", tabla: "anexo_contrato", pk: "id_anexo", orden: "id_anexo",
    descripcion: "Modificaciones a los contratos vigentes.",
    campos: [
      { nombre: "id_contrato", etiqueta: "Contrato", tipo: "fk", ref: "contrato", requerido: true, tabla: true, completo: true },
      { nombre: "numero_anexo", etiqueta: "N° de anexo", tipo: "number", requerido: true, tabla: true, ayuda: "Se sugiere automáticamente" },
      { nombre: "tipo_modificacion", etiqueta: "Tipo de modificación", tipo: "select", opciones: OPCIONES.tipoAnexo, requerido: true, tabla: true, filtro: true },
      { nombre: "sueldo_nuevo", etiqueta: "Sueldo nuevo", tipo: "money", tabla: true, ayuda: "Solo si cambia el sueldo" },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoAnexo, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Vigente" }
    ],
  
    alCambiar(form, campo, ctx) {
      if (campo !== "id_contrato" || ctx.esEdicion) return;
      const id = Number(valor(form, "id_contrato"));
      const numeros = ctx.filas.filter(f => f.id_contrato === id).map(f => f.numero_anexo || 0);
      asignar(form, "numero_anexo", numeros.length ? Math.max(...numeros) + 1 : 1);
    }
  },

  asistencia_diaria: {
    titulo: "Asistencia diaria", icono: "ti-calendar-check", tabla: "asistencia_diaria", pk: "id_asistencia", orden: "fecha", descendente: true,
    descripcion: "Registro diario de asistencia y horas trabajadas.",
    campos: [
      { nombre: "id_trabajador", etiqueta: "Trabajador", tipo: "fk", ref: "trabajador", requerido: true, tabla: true, filtro: true, completo: true },
      { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, tabla: true, porDefecto: hoy },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoAsistencia, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Presente" },
      { nombre: "hora_entrada", etiqueta: "Hora de entrada", tipo: "time", virtual: true, porDefecto: "08:00" },
      { nombre: "hora_salida", etiqueta: "Hora de salida", tipo: "time", virtual: true, porDefecto: "17:00" },
      { nombre: "horas_trabajadas", etiqueta: "Horas trabajadas", tipo: "number", tabla: true, ayuda: "Se calcula con la entrada y la salida" }
    ],
    alCambiar(form, campo) {
      if (valor(form, "estado") === "Ausente") {
        asignar(form, "horas_trabajadas", 0);
        return;
      }
      if (["hora_entrada", "hora_salida", null].includes(campo)) {
        const horas = horasEntre(valor(form, "hora_entrada"), valor(form, "hora_salida"));
        if (horas !== null) asignar(form, "horas_trabajadas", horas);
      }
    }
  },

  movimiento_vacaciones: {
    titulo: "Vacaciones", icono: "ti-beach", tabla: "movimiento_vacaciones", pk: "id_movimiento", orden: "fecha_movimiento", descendente: true,
    descripcion: "Solicitudes, abonos y ajustes de días de vacaciones.",
    campos: [
      { nombre: "id_trabajador", etiqueta: "Trabajador", tipo: "fk", ref: "trabajador", requerido: true, tabla: true, filtro: true, completo: true },
      { nombre: "tipo_movimiento", etiqueta: "Tipo", tipo: "select", opciones: OPCIONES.tipoVacaciones, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Solicitud" },
      { nombre: "fecha_movimiento", etiqueta: "Fecha (inicio)", tipo: "date", requerido: true, tabla: true, porDefecto: hoy },
      { nombre: "fecha_termino", etiqueta: "Fecha de término", tipo: "date", virtual: true, ayuda: "Solo para solicitudes" },
      { nombre: "dias", etiqueta: "Días", tipo: "number", requerido: true, tabla: true, ayuda: "En solicitudes se calculan los días hábiles" },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true }
    ],
    alCambiar(form) {
      if (valor(form, "tipo_movimiento") !== "Solicitud") return;
      const inicio = valor(form, "fecha_movimiento");
      const termino = valor(form, "fecha_termino");
      if (inicio && termino) asignar(form, "dias", diasHabiles(inicio, termino));
    },
    antesDeGuardar(datos, form) {
      const termino = valor(form, "fecha_termino");
      if (datos.tipo_movimiento === "Solicitud") {
        if (termino && termino < datos.fecha_movimiento) throw new Error("La fecha de término no puede ser anterior a la de inicio.");
        if (!(datos.dias > 0)) throw new Error("Una solicitud debe tener al menos 1 día hábil.");
      }
    }
  },

  saldo_vacaciones: {
    titulo: "Saldo de vacaciones", icono: "ti-calendar-stats", tabla: "saldo_vacaciones", pk: "id_saldo", orden: "id_saldo",
    descripcion: "Días disponibles y tomados por trabajador.",
    campos: [
      { nombre: "id_trabajador", etiqueta: "Trabajador", tipo: "fk", ref: "trabajador", requerido: true, tabla: true, completo: true },
      { nombre: "dias_disponibles", etiqueta: "Días disponibles", tipo: "number", requerido: true, tabla: true, porDefecto: 15 },
      { nombre: "dias_tomados", etiqueta: "Días tomados", tipo: "number", requerido: true, tabla: true, porDefecto: 0 }
    ]
  },

  
  concepto_remuneracion: {
    titulo: "Conceptos de pago", icono: "ti-list-details", tabla: "concepto_remuneracion", pk: "id_concepto", orden: "nombre",
    descripcion: "Haberes y descuentos que componen una liquidación.",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true, tabla: true },
      { nombre: "tipo_concepto", etiqueta: "Tipo", tipo: "select", opciones: OPCIONES.tipoConcepto, requerido: true, tabla: true, filtro: true, badge: true },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoGeneral, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Activo" }
    ]
  },

  liquidacion: {
    titulo: "Liquidaciones de sueldo", icono: "ti-receipt", tabla: "liquidacion", pk: "id_liquidacion", orden: "periodo", descendente: true,
    descripcion: "Liquidaciones mensuales. Al elegir el contrato se completan el trabajador y el sueldo.",
    campos: [
      { nombre: "id_contrato", etiqueta: "Contrato", tipo: "fk", ref: "contrato", requerido: true, tabla: true, completo: true },
      { nombre: "id_trabajador", etiqueta: "Trabajador", tipo: "fk", ref: "trabajador", requerido: true, tabla: true, filtro: true, completo: true },
      { nombre: "periodo", etiqueta: "Periodo", tipo: "month", requerido: true, tabla: true, filtro: true, porDefecto: () => hoy().slice(0, 7) },
      { nombre: "fecha_pago", etiqueta: "Fecha de pago", tipo: "date", tabla: true },
      { nombre: "sueldo_base", etiqueta: "Sueldo base", tipo: "money", requerido: true, tabla: true },
      { nombre: "sueldo_liquido", etiqueta: "Sueldo líquido", tipo: "money", requerido: true, tabla: true, ayuda: "Estimado: base menos 19,1% (AFP, salud y cesantía)" }
    ],
    alCambiar(form, campo, ctx) {
      if (campo === "id_contrato") {
        const contrato = ctx.buscar("contrato", valor(form, "id_contrato"));
        if (contrato) {
          asignar(form, "id_trabajador", contrato.id_trabajador);
          asignar(form, "sueldo_base", contrato.sueldo_base);
        }
      }
      if (campo === "id_contrato" || campo === "sueldo_base") {
        const base = Number(valor(form, "sueldo_base"));
        if (base) asignar(form, "sueldo_liquido", Math.round(base * 0.809));
      }
    },
    antesDeGuardar(datos, form, ctx) {
      const repetida = ctx.filas.find(f =>
        f.id_contrato === datos.id_contrato && f.periodo === datos.periodo && f.id_liquidacion !== ctx.id);
      if (repetida) throw new Error("Ya existe una liquidación para ese contrato en ese periodo.");
      if (datos.sueldo_liquido > datos.sueldo_base) throw new Error("El líquido no puede ser mayor que el sueldo base.");
    }
  },

  detalle_liquidacion: {
    titulo: "Detalle de liquidaciones", icono: "ti-list-numbers", tabla: "detalle_liquidacion", pk: "id_detalle", orden: "id_liquidacion",
    descripcion: "Montos de cada concepto dentro de una liquidación.",
    campos: [
      { nombre: "id_liquidacion", etiqueta: "Liquidación", tipo: "fk", ref: "liquidacion", requerido: true, tabla: true, filtro: true, completo: true },
      { nombre: "id_concepto", etiqueta: "Concepto", tipo: "fk", ref: "concepto_remuneracion", requerido: true, tabla: true, filtro: true },
      { nombre: "monto", etiqueta: "Monto", tipo: "money", requerido: true, tabla: true }
    ]
  },

  usuario: {
    titulo: "Usuarios", icono: "ti-user-shield", tabla: "usuario", pk: "id_usuario", orden: "nombre_usuario",
    descripcion: "Usuarios del sistema. Para iniciar sesión, el correo también debe existir en Supabase Authentication.",
    campos: [
      { nombre: "nombre_usuario", etiqueta: "Nombre de usuario", tipo: "text", requerido: true, tabla: true },
      { nombre: "correo", etiqueta: "Correo", tipo: "email", requerido: true, tabla: true },
      { nombre: "id_trabajador", etiqueta: "Trabajador asociado", tipo: "fk", ref: "trabajador", tabla: true, completo: true },
      { nombre: "id_rol", etiqueta: "Rol", tipo: "fk", ref: "rol", tabla: true, filtro: true },
      { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: OPCIONES.estadoUsuario, requerido: true, tabla: true, filtro: true, badge: true, porDefecto: "Activo" }
    ]
  },

  rol: {
    titulo: "Roles", icono: "ti-shield-lock", tabla: "rol", pk: "id_rol", orden: "nombre",
    descripcion: "Perfiles de acceso al sistema.",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true, tabla: true },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true }
    ]
  },

  permiso: {
    titulo: "Permisos", icono: "ti-key", tabla: "permiso", pk: "id_permiso", orden: "nombre",
    descripcion: "Acciones que se pueden asignar a un rol.",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "text", requerido: true, tabla: true, ayuda: "Ej: trabajadores.editar" },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", tabla: true, completo: true }
    ]
  },

  rol_permiso: {
    titulo: "Permisos por rol", icono: "ti-lock-access", tabla: "rol_permiso", pk: "id_rol_permiso", orden: "id_rol",
    descripcion: "Qué permisos tiene cada rol.",
    campos: [
      { nombre: "id_rol", etiqueta: "Rol", tipo: "fk", ref: "rol", requerido: true, tabla: true, filtro: true },
      { nombre: "id_permiso", etiqueta: "Permiso", tipo: "fk", ref: "permiso", requerido: true, tabla: true, filtro: true }
    ]
  }
};


export const VISTAS = {
  dashboard: { titulo: "Panel principal", icono: "ti-layout-dashboard" },
  auditoria: { titulo: "Auditoría", icono: "ti-history" }
};


export function nombreTabla(tabla) {
  if (tabla === "sesion") return "Sesión";
  return MODULOS[tabla]?.titulo || tabla;
}

const ACCIONES_EN = { INSERT: "Crear", UPDATE: "Editar", DELETE: "Eliminar" };
export function nombreAccion(accion) {
  return ACCIONES_EN[String(accion).toUpperCase()] || accion;
}
