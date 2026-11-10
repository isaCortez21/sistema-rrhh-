
create table departamento (
  id_departamento serial primary key,
  nombre varchar(100) not null unique,
  descripcion text,
  estado varchar(20) default 'Activo'
);
create table cargo (
  id_cargo serial primary key,
  nombre varchar(100) not null unique,
  descripcion text,
  estado varchar(20) default 'Activo'
);
create table trabajador (
  id_trabajador serial primary key,
  rut varchar(12) not null unique,
  nombres varchar(100) not null,
  apellidos varchar(100) not null,
  correo_personal varchar(150),
  correo_corporativo varchar(150),
  telefono varchar(20),
  fecha_nacimiento date,
  fecha_ingreso date not null,
  direccion varchar(200),
  comuna varchar(100),
  region varchar(100),
  estado_laboral varchar(20) default 'Activo',
  fecha_salida date
);
create table contrato (
  id_contrato serial primary key,
  id_trabajador int not null references trabajador(id_trabajador),
  id_departamento int not null references departamento(id_departamento),
  id_cargo int not null references cargo(id_cargo),
  tipo_contrato varchar(30),
  sueldo_base numeric(12,0),
  estado_contrato varchar(20) default 'Vigente',
  fecha_inicio date,
  fecha_termino date
);
create table anexo_contrato (
  id_anexo serial primary key,
  id_contrato int not null references contrato(id_contrato),
  numero_anexo int,
  tipo_modificacion varchar(50),
  sueldo_nuevo numeric(12,0),
  estado varchar(20) default 'Vigente'
);
create table asistencia_diaria (
  id_asistencia serial primary key,
  id_trabajador int not null references trabajador(id_trabajador),
  fecha date not null,
  horas_trabajadas numeric(5,2),
  estado varchar(20) default 'Presente',
  unique (id_trabajador, fecha)
);
create table movimiento_vacaciones (
  id_movimiento serial primary key,
  id_trabajador int not null references trabajador(id_trabajador),
  fecha_movimiento date not null,
  tipo_movimiento varchar(30),
  dias numeric(5,1) default 1,
  descripcion text
);
create table saldo_vacaciones (
  id_saldo serial primary key,
  id_trabajador int not null unique references trabajador(id_trabajador),
  dias_disponibles numeric(5,1) default 0,
  dias_tomados numeric(5,1) default 0
);
create table concepto_remuneracion (
  id_concepto serial primary key,
  nombre varchar(100) not null,
  tipo_concepto varchar(20),
  descripcion text,
  estado varchar(20) default 'Activo'
);
create table liquidacion (
  id_liquidacion serial primary key,
  id_trabajador int not null references trabajador(id_trabajador),
  id_contrato int not null references contrato(id_contrato),
  periodo varchar(7),
  fecha_pago date,
  sueldo_base numeric(12,0),
  sueldo_liquido numeric(12,0)
);
create table detalle_liquidacion (
  id_detalle serial primary key,
  id_liquidacion int not null references liquidacion(id_liquidacion),
  id_concepto int not null references concepto_remuneracion(id_concepto),
  monto numeric(12,0) not null
);
create table rol (
  id_rol serial primary key,
  nombre varchar(50) not null unique,
  descripcion text
);
create table permiso (
  id_permiso serial primary key,
  nombre varchar(80) not null unique,
  descripcion text
);
create table rol_permiso (
  id_rol_permiso serial primary key,
  id_rol int not null references rol(id_rol),
  id_permiso int not null references permiso(id_permiso),
  unique (id_rol, id_permiso)
);
create table usuario (
  id_usuario serial primary key,
  nombre_usuario varchar(50),
  correo varchar(150) unique,
  estado varchar(20) default 'Activo',
  id_trabajador int references trabajador(id_trabajador),
  id_rol int references rol(id_rol)
);
create table auditoria (
  id_auditoria serial primary key,
  id_usuario int references usuario(id_usuario),
  accion varchar(20) not null,
  tabla_afectada varchar(60) not null,
  fecha_registro timestamp default now()
);
