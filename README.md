# RH Gestión modular

Sistema web de Recursos Humanos (HTML + CSS + JavaScript) conectado a Supabase.

## Funcionalidades

- Inicio de sesión con Supabase Authentication (usuarios bloqueados o inactivos no pueden entrar).
- Panel principal con indicadores: trabajadores activos, contratos vigentes, masa salarial, líquido del último periodo, trabajadores por departamento, contratos por vencer y últimos movimientos.
- CRUD de todas las tablas con:
  - buscador (sin importar mayúsculas ni tildes),
  - filtros por estado, tipo, departamento, etc.,
  - orden al hacer clic en las columnas,
  - paginación,
  - exportación a Excel de lo que se está viendo,
  - listas desplegables (select) para estados, tipos y relaciones entre tablas.
- Validaciones: RUT chileno, fechas coherentes, plazo fijo con fecha de término, liquidación duplicada, etc.
- Cálculos automáticos: horas trabajadas, días hábiles de vacaciones, sueldo líquido estimado, número de anexo.
- Auditoría automática de cada creación, edición, eliminación, inicio y cierre de sesión, con filtros por acción, tabla, usuario y fechas, y exportación a Excel.

## Estructura

```
index.html                 Estructura base de la página
css/styles.css             Estilos (ordenados por secciones)
js/config.js               Conexión a Supabase, listas de opciones y menú
js/modulos.js              Definición de cada tabla: campos, validaciones y cálculos
js/api.js                  Login, CRUD y registro de auditoría
js/ui.js                   Funciones de apoyo: formato, modal, mensajes, Excel, RUT
js/main.js                 Menú y navegación entre vistas
js/modules/auth.js         Inicio y cierre de sesión
js/modules/dashboard.js    Panel principal
js/modules/crud.js         Pantalla reutilizable para todas las tablas
js/modules/auditoria.js    Historial de auditoría
sql/01_tablas.sql          Creación de tablas
sql/02_datos_prueba.sql    Datos de prueba
diagrama.dbml              Modelo de datos (dbdiagram.io)
```

## Puesta en marcha

1. En Supabase, abrir **SQL Editor** y ejecutar `sql/01_tablas.sql` y luego `sql/02_datos_prueba.sql`.
2. En **Authentication > Users > Add user** crear un usuario (marcar *Auto Confirm User*).
3. Poner la URL y la *publishable key* del proyecto en `js/config.js`.
4. Levantar un servidor local (por usar módulos ES no funciona con doble clic):

```bash
cd rh-gestion-modular
python3 -m http.server 5500
```

5. Abrir `http://localhost:5500`.

Al iniciar sesión por primera vez, el sistema crea automáticamente la fila del usuario en la tabla `usuario`. El rol se asigna en el módulo **Usuarios**.

## Agregar o modificar un módulo

Todo se configura en `js/modulos.js`. Para agregar una tabla nueva basta con crear una entrada en `MODULOS` con sus campos y agregar su nombre al menú en `js/config.js` (`NAVEGACION`).

## Nota de seguridad

Las tablas no tienen RLS (Row Level Security) activado, por lo que es un prototipo académico: no usar con datos reales.
