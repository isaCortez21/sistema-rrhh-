export const SUPABASE_URL = "https://cbjbtuetaufkgsvotjei.supabase.co";
export const SUPABASE_KEY = "sb_publishable_RkmpmlnV_5oo79k27sYXuw_3VEPg41r";


export const FILAS_POR_PAGINA = 15;


export const OPCIONES = {
  estadoGeneral: ["Activo", "Inactivo"],
  estadoUsuario: ["Activo", "Bloqueado", "Inactivo"],
  estadoLaboral: ["Activo", "Inactivo", "Desvinculado"],
  tipoContrato: ["Indefinido", "Plazo fijo", "Por obra o faena", "Honorarios"],
  estadoContrato: ["Vigente", "Suspendido", "Terminado"],
  tipoAnexo: [
    "Reajuste de sueldo",
    "Reajuste IPC",
    "Cambio de jornada",
    "Cambio de funciones",
    "Cambio de cargo",
    "Prórroga de plazo",
    "Otro"
  ],
  estadoAnexo: ["Vigente", "Pendiente", "Anulado"],
  estadoAsistencia: ["Presente", "Atraso", "Ausente", "Licencia", "Permiso"],
  tipoVacaciones: ["Solicitud", "Abono", "Ajuste"],
  tipoConcepto: ["Haber", "Descuento"],
  accionAuditoria: ["Crear", "Editar", "Eliminar", "Inicio de sesión", "Cierre de sesión"],
  regiones: [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana de Santiago",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes"
  ]
};


export const NAVEGACION = [
  { grupo: "Principal", items: ["dashboard"] },
  { grupo: "Personas", items: ["trabajador", "departamento", "cargo"] },
  { grupo: "Contratos", items: ["contrato", "anexo_contrato"] },
  { grupo: "Asistencia y vacaciones", items: ["asistencia_diaria", "movimiento_vacaciones", "saldo_vacaciones"] },
  { grupo: "Remuneraciones", items: ["concepto_remuneracion", "liquidacion", "detalle_liquidacion"] },
  { grupo: "Seguridad", items: ["usuario", "rol", "permiso", "rol_permiso", "auditoria"] }
];
