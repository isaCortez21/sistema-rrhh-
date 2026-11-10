import { listRows, insertRow, updateRow, deleteRow } from '../api.js';
import { $, esc, niceDate, statusHtml, message, showModal, closeModal, formValue } from '../ui.js';

let foreignData = { trabajador: [], departamento: [], cargo: [], contrato: [], liquidacion: [] };

function inputType(field) {
  if (field.includes('fecha')) return 'date';
  if (field.includes('correo')) return 'email';
  if (field.includes('hash')) return 'password';
  if (['imponible', 'tributable'].includes(field)) return 'checkbox';
  if (field.startsWith('id_')) return 'select';
  if (field.includes('hora')) return 'time';
  return 'text';
}

function formHtml(cfg, row = {}) {

  let fieldsToMap = cfg.editable;
  if (cfg.table === 'movimiento_vacaciones') {
    fieldsToMap = cfg.editable.filter(f => f !== 'dias' && f !== 'fecha_movimiento');
  }

  let html = `<form id="catalogForm"><div class="form-grid">`;


  if (cfg.table === 'movimiento_vacaciones') {
    html += `
      <label>Fecha Inicio *<input name="vac_inicio" type="date" required value="${esc(row.fecha_movimiento || '')}"></label>
      <label>Fecha Término *<input name="vac_termino" type="date" required value=""></label>
    `;
  }

  html += fieldsToMap.map(field => {
    const type = inputType(field);
    const val = row[field] ?? '';

    if (type === 'checkbox') {
      return `<label><span>${field.replaceAll('_', ' ')}</span><input name="${field}" type="checkbox" ${val === true ? 'checked' : ''}></label>`;
    }

    if (type === 'select') {
      const refTable = field.replace('id_', '');
      const options = foreignData[refTable] || [];
      return `<label>${field.replaceAll('_', ' ')} *
        <select name="${field}" required>
          <option value="">-- Seleccione un registro --</option>
          ${options.map(opt => {
            const optId = opt[`id_${refTable}`];
            const label = opt.nombre || opt.nombres ? `${opt.nombres || opt.nombre} ${opt.apellidos || ''}` : `ID: ${optId}`;
            return `<option value="${optId}" ${String(val) === String(optId) ? 'selected' : ''}>${esc(label)}</option>`;
          }).join('')}
        </select>
      </label>`;
    }

    if (type === 'time') {
      return `<label>${field.replaceAll('_', ' ')}
        <input name="${field}" type="time" value="${esc(val)}" onclick="this.showPicker ? this.showPicker() : null">
      </label>`;
    }

    return `<label>${field.replaceAll('_', ' ')}<input name="${field}" type="${type}" value="${esc(val)}"></label>`;
  }).join('');

  html += `</div><div class="modal-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary">Guardar</button></div></form>`;
  return html;
}

function display(field, value, row) {
  if (value === null || value === undefined || value === '') return '—';
  if (field.includes('fecha')) return niceDate(value);
  if (field.startsWith('estado')) return statusHtml(value);
  
  if (field.startsWith('id_')) {
    const refTable = field.replace('id_', '');
    const list = foreignData[refTable];
    if (list) {
      const found = list.find(item => String(item[field]) === String(value));
      if (found) {
        return esc(found.nombre || found.nombres ? `${found.nombres || found.nombre} ${found.apellidos || ''}` : value);
      }
    }
  }
  
  return esc(value);
}

export function mountCatalogo(id, cfg) {
  const panel = $('#genericPanel');
  let rows = [];
  
  panel.innerHTML = `<div class="module-head"><div><h2>${cfg.title}</h2><p class="muted">Tabla <strong>${cfg.table}</strong>. Gestiona sus registros desde un módulo reutilizable.</p></div><button id="newCatalog" class="primary">Nuevo registro</button></div><div class="toolbar"><input id="catalogSearch" class="search" type="search" placeholder="Buscar en ${cfg.title.toLowerCase()}..."><button id="reloadCatalog" class="secondary">Actualizar lista</button></div><div id="catalogMessage" class="message"></div><div class="table-wrap"><table><thead><tr>${cfg.columns.map(c => `<th>${c.replaceAll('_', ' ')}</th>`).join('')}<th>Acciones</th></tr></thead><tbody id="catalogRows"></tbody></table></div>`;

  const draw = () => {
    const q = ($('#catalogSearch').value || '').toLowerCase();
    const data = rows.filter(r => !q || cfg.columns.some(c => String(r[c] ?? '').toLowerCase().includes(q)));
    $('#catalogRows').innerHTML = data.length ? data.map(r => `<tr>${cfg.columns.map(c => `<td>${display(c, r[c], r)}</td>`).join('')}<td class="actions"><button class="secondary" data-edit="${esc(r[cfg.pk])}">Editar</button><button class="danger" data-delete="${esc(r[cfg.pk])}">Eliminar</button></td></tr>`).join('') : `<tr><td colspan="${cfg.columns.length + 1}" class="empty">No hay registros para mostrar.</td></tr>`;
  };

  const load = async () => {
    message($('#catalogMessage'), 'Consultando registros...');
    try {
      const [rWorkers, rDeps, rCargos, rContratos] = await Promise.all([
        listRows({ table: 'trabajador', columns: ['id_trabajador', 'rut', 'nombres', 'apellidos'] }).catch(() => []),
        listRows({ table: 'departamento', columns: ['id_departamento', 'nombre'] }).catch(() => []),
        listRows({ table: 'cargo', columns: ['id_cargo', 'nombre'] }).catch(() => []),
        listRows({ table: 'contrato', columns: ['id_contrato', 'id_trabajador', 'tipo_contrato'] }).catch(() => [])
      ]);
      
      foreignData.trabajador = rWorkers;
      foreignData.departamento = rDeps;
      foreignData.cargo = rCargos;
      foreignData.contrato = rContratos;

      rows = await listRows(cfg);
      draw();
      message($('#catalogMessage'), `Se cargaron ${rows.length} registros.`);
    } catch (e) {
      message($('#catalogMessage'), e.message, true);
    }
  };

    const openForm = (row = {}) => {
  
    let html = formHtml(cfg, row);
    if (cfg.table === 'asistencia_diaria') {
    
      html = html.replace('<div class="form-grid">', `
        <div class="form-grid">
        <label>Hora de Entrada *<input name="asist_entrada" type="time" required onclick="this.showPicker ? this.showPicker() : null" value="08:00"></label>
        <label>Hora de Salida *<input name="asist_salida" type="time" required onclick="this.showPicker ? this.showPicker() : null" value="17:00"></label>
      `);
   
      html = html.replace(/<label>horas trabajadas.*?<\/label>/i, '');
    }

    const modal = showModal(row[cfg.pk] ? `Editar ${cfg.title}` : `Nuevo registro`, html);
    
    $('#catalogForm', modal).addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.currentTarget;
      const payload = {};
      
      // 1. LÓGICA DE CÁLCULO PARA VACACIONES (Mantenemos intacta la tuya)
      if (cfg.table === 'movimiento_vacaciones') {
        const fInicio = new Date(f.elements.vac_inicio.value);
        const fTermino = new Date(f.elements.vac_termino.value);
        const diffTime = Math.abs(fTermino - fInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        payload['fecha_movimiento'] = f.elements.vac_inicio.value;
        payload['dias'] = isNaN(diffDays) ? 1 : diffDays;
      }

      // 2. NUEVA LÓGICA: CÁLCULO DE HORAS DE ASISTENCIA DIARIA
      if (cfg.table === 'asistencia_diaria') {
        const [hEntrada, mEntrada] = f.elements.asist_entrada.value.split(':').map(Number);
        const [hSalida, mSalida] = f.elements.asist_salida.value.split(':').map(Number);
        
        // Convertimos las horas completas a minutos absolutos para evitar fallos de signos
        const totalMinutos = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
        // Calculamos la fracción decimal exacta (Ejemplo: 8 horas y media se traduce como 8.5)
        const calculoHoras = totalMinutos / 60;
        
        payload['horas_trabajadas'] = isNaN(calculoHoras) || calculoHoras < 0 ? 8 : parseFloat(calculoHoras.toFixed(2));
      }

      cfg.editable.forEach(field => {
        if (cfg.table === 'movimiento_vacaciones' && ['dias', 'fecha_movimiento'].includes(field)) return;
        // Si es asistencia, impedimos que se mande el valor manual vacío
        if (cfg.table === 'asistencia_diaria' && field === 'horas_trabajadas') return;
        
        const el = f.elements[field];
        if (!el) return;

        if (el.type === 'checkbox') {
          payload[field] = el.checked;
        } else if (field.startsWith('id_')) {
          const val = formValue(el);
          payload[field] = val ? parseInt(val, 10) : null;
        } else {
          payload[field] = formValue(el);
        }
      });
      
      try {
        if (row[cfg.pk]) await updateRow(cfg.table, cfg.pk, row[cfg.pk], payload);
        else await insertRow(cfg.table, payload);
        closeModal();
        await load();
      } catch (err) {
        message(f, err.message, true);
      }
    });
  };


  $('#newCatalog').onclick = () => openForm();
  $('#reloadCatalog').onclick = load;
  $('#catalogSearch').oninput = draw;
  
  panel.addEventListener('click', async e => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) openForm(rows.find(r => String(r[cfg.pk]) === edit.dataset.edit));
    if (del && confirm('¿Eliminar este registro?')) {
      try {
        await deleteRow(cfg.table, cfg.pk, del.dataset.delete);
        await load();
      } catch (err) {
        message($('#catalogMessage'), err.message, true);
      }
    }
  });
  
  load();
}