// ══════════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycby1oymWGkzFVT7ar5NBE8m6koMzFWpV9Pz3o_qGFnXNpMLpLFoUA2dMA7sbqrDDoUvK/exec';

// ══════════════════════════════════════════
//  HORAS DISPONIBLES
// ══════════════════════════════════════════
const TODAS_LAS_HORAS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30',
  '17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00','20:30'
];

// ══════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function horaEnMinutos(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}

// ══════════════════════════════════════════
//  ACTUALIZAR HORAS DISPONIBLES
// ══════════════════════════════════════════
function actualizarHorasDisponibles() {
  const fechaInput = document.getElementById('fecha');
  const horaSelect = document.getElementById('hora');
  if (!fechaInput || !horaSelect) return;

  const fechaElegida = fechaInput.value;
  if (!fechaElegida) {
    // Si no hay fecha, mostrar todas
    horaSelect.innerHTML = '<option value="">Selecciona la hora...</option>';
    TODAS_LAS_HORAS.forEach(h => {
      const o = document.createElement('option');
      o.value = h; o.textContent = h;
      horaSelect.appendChild(o);
    });
    return;
  }

  const ahora      = new Date();
  const hoy        = ahora.toISOString().split('T')[0];
  const esHoy      = fechaElegida === hoy;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  horaSelect.innerHTML = '<option value="">Selecciona la hora...</option>';

  let hayHorasDisponibles = false;

  TODAS_LAS_HORAS.forEach(hora => {
    const o = document.createElement('option');
    o.value = hora;

    if (esHoy && horaEnMinutos(hora) <= minutosAhora) {
      // Hora ya pasada — mostrar deshabilitada
      o.textContent = hora + ' (no disponible)';
      o.disabled = true;
      o.style.color = '#888';
    } else {
      o.textContent = hora;
      hayHorasDisponibles = true;
    }

    horaSelect.appendChild(o);
  });

  // Si no quedan horas disponibles hoy, avisar
  if (esHoy && !hayHorasDisponibles) {
    horaSelect.innerHTML = '<option value="">No hay horas disponibles para hoy</option>';
  }
}

// ══════════════════════════════════════════
//  FECHA MÍNIMA
// ══════════════════════════════════════════
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.setAttribute('min', hoy);

  // Actualizar horas cuando cambia la fecha
  fechaInput.addEventListener('change', actualizarHorasDisponibles);

  // Inicializar horas al cargar
  actualizarHorasDisponibles();
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

    // Validar que la hora no haya pasado
    const ahora    = new Date();
    const hoy      = ahora.toISOString().split('T')[0];
    if (fecha === hoy) {
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      if (horaEnMinutos(hora) <= minutosAhora) {
        alert('Esa hora ya pasó. Por favor selecciona una hora disponible.');
        actualizarHorasDisponibles();
        return;
      }
    }

    // Validar fecha pasada
    const fechaElegida = new Date(fecha + 'T00:00:00');
    ahora.setHours(0,0,0,0);
    if (fechaElegida < ahora) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }

    if (btnSubmit) { btnSubmit.textContent = 'Enviando...'; btnSubmit.disabled = true; }

    const nuevaCita = {
      action: 'crearCita',
      id:     generarId(),
      nombre, telefono, email, servicio, fecha, hora, notas
    };

    try {
      const res  = await fetch(API_URL, {
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
        const hoyStr = new Date().toISOString().split('T')[0];
        if (fechaInput) fechaInput.setAttribute('min', hoyStr);
        actualizarHorasDisponibles();
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