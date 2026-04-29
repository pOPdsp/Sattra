// ══════════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycby1oymWGkzFVT7ar5NBE8m6koMzFWpV9Pz3o_qGFnXNpMLpLFoUA2dMA7sbqrDDoUvK/exec';

// ══════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Convierte "08:30" → minutos desde medianoche (510)
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// ══════════════════════════════════════════
//  TODAS LAS HORAS POSIBLES (08:00 – 20:30)
// ══════════════════════════════════════════
const TODAS_LAS_HORAS = [];
for (let h = 8; h <= 20; h++) {
  TODAS_LAS_HORAS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 20) TODAS_LAS_HORAS.push(`${String(h).padStart(2, '0')}:30`);
}

// ══════════════════════════════════════════
//  FECHA MÍNIMA
// ══════════════════════════════════════════
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
}

// ══════════════════════════════════════════
//  CARGAR HORAS DISPONIBLES SEGÚN LA FECHA
// ══════════════════════════════════════════
const horaSelect = document.getElementById('hora');

async function cargarHorasDisponibles(fecha) {
  if (!horaSelect) return;

  horaSelect.innerHTML = '<option value="">Cargando horarios...</option>';
  horaSelect.disabled = true;

  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    const citas = data.ok ? data.citas : [];

    // Solo citas del día que no estén canceladas
    const citasDelDia = citas.filter(c => c.fecha === fecha && c.estado !== 'cancelada');

    // Bloquear horas dentro de 60 min de cualquier cita existente
    const bloqueadas = new Set();
    citasDelDia.forEach(c => {
      const minCita = horaAMinutos(c.hora);
      TODAS_LAS_HORAS.forEach(h => {
        if (Math.abs(horaAMinutos(h) - minCita) < 60) {
          bloqueadas.add(h);
        }
      });
    });

    horaSelect.innerHTML = '<option value="">Selecciona la hora...</option>';
    let hayDisponibles = false;

    TODAS_LAS_HORAS.forEach(h => {
      const option = document.createElement('option');
      option.value = h;
      if (bloqueadas.has(h)) {
        option.textContent = `${h} — No disponible`;
        option.disabled = true;
        option.style.color = '#888';
      } else {
        option.textContent = h;
        hayDisponibles = true;
      }
      horaSelect.appendChild(option);
    });

    if (!hayDisponibles) {
      horaSelect.innerHTML = '<option value="">Sin horarios disponibles para este día</option>';
    }

  } catch (err) {
    console.error('Error cargando horarios:', err);
    // Fallback: mostrar todas las horas sin restricción
    horaSelect.innerHTML = '<option value="">Selecciona la hora...</option>';
    TODAS_LAS_HORAS.forEach(h => {
      const o = document.createElement('option');
      o.value = h; o.textContent = h;
      horaSelect.appendChild(o);
    });
  } finally {
    horaSelect.disabled = false;
  }
}

// Escuchar cambio de fecha
if (fechaInput && horaSelect) {
  fechaInput.addEventListener('change', () => {
    const fecha = fechaInput.value;
    if (fecha) {
      cargarHorasDisponibles(fecha);
    } else {
      horaSelect.innerHTML = '<option value="">Selecciona primero una fecha</option>';
    }
  });

  // Estado inicial
  horaSelect.innerHTML = '<option value="">Selecciona primero una fecha</option>';
}

// ══════════════════════════════════════════
//  FORMULARIO DE CITAS
// ══════════════════════════════════════════
const form       = document.getElementById('bookingForm');
const confirmMsg = document.getElementById('confirmMsg');
const btnSubmit  = document.querySelector('.btn-submit');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre   = (document.getElementById('nombre')?.value   || '').trim();
    const telefono = (document.getElementById('telefono')?.value || '').trim();
    const email    = (document.getElementById('email')?.value    || '').trim();
    const servicio = document.getElementById('servicio')?.value  || '';
    const fecha    = document.getElementById('fecha')?.value     || '';
    const hora     = document.getElementById('hora')?.value      || '';
    const notas    = (document.getElementById('notas')?.value    || '').trim();

    if (!nombre || !telefono || !servicio || !fecha || !hora) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (new Date(fecha + 'T00:00:00') < hoy) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }

    // Verificación final de disponibilidad antes de enviar
    try {
      const checkRes  = await fetch(API_URL);
      const checkData = await checkRes.json();
      const citasActuales = checkData.ok ? checkData.citas : [];

      const conflicto = citasActuales.some(c => {
        if (c.fecha !== fecha || c.estado === 'cancelada') return false;
        return Math.abs(horaAMinutos(c.hora) - horaAMinutos(hora)) < 60;
      });

      if (conflicto) {
        alert('Lo sentimos, ese horario acaba de ser reservado. Por favor selecciona otra hora.');
        await cargarHorasDisponibles(fecha);
        return;
      }
    } catch (err) {
      console.warn('No se pudo verificar disponibilidad en tiempo real:', err);
    }

    if (btnSubmit) { btnSubmit.textContent = 'Enviando...'; btnSubmit.disabled = true; }

    const nuevaCita = {
      action: 'crearCita',
      id:     generarId(),
      nombre, telefono, email, servicio, fecha, hora, notas
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body:   JSON.stringify(nuevaCita)
      });
      const data = await res.json();

      if (data.ok) {
        if (confirmMsg) {
          confirmMsg.style.display = 'block';
          confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { confirmMsg.style.display = 'none'; }, 8000);
        }
        form.reset();
        if (fechaInput) fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
        if (horaSelect) horaSelect.innerHTML = '<option value="">Selecciona primero una fecha</option>';
      } else {
        alert(data.mensaje || 'Error al guardar la cita. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      if (btnSubmit) { btnSubmit.textContent = 'Confirmar Cita'; btnSubmit.disabled = false; }
    }
  });
}

// ══════════════════════════════════════════
//  MENÚ HAMBURGUESA
// ══════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
}
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => { if (navLinks) navLinks.classList.remove('active'); });
});