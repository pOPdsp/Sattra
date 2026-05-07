// ══════════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycby1oymWGkzFVT7ar5NBE8m6koMzFWpV9Pz3o_qGFnXNpMLpLFoUA2dMA7sbqrDDoUvK/exec';

// ══════════════════════════════════════════
//  TODAS LAS HORAS (08:00 – 20:30)
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
//  CARGAR HORAS DISPONIBLES
//  Bloquea: horas pasadas (si es hoy) +
//           horas dentro de 60 min de una cita existente
// ══════════════════════════════════════════
const fechaInput = document.getElementById('fecha');
const horaSelect = document.getElementById('hora');

async function cargarHorasDisponibles() {
  if (!fechaInput || !horaSelect) return;

  const fechaElegida = fechaInput.value;

  // Sin fecha → reset limpio
  if (!fechaElegida) {
    horaSelect.innerHTML = '<option value="">Selecciona primero una fecha</option>';
    return;
  }

  horaSelect.innerHTML = '<option value="">Cargando horarios...</option>';
  horaSelect.disabled  = true;

  // ── 1. Determinar minutos actuales (para bloquear pasado si es hoy) ──
  const ahora        = new Date();
  const hoy          = ahora.toISOString().split('T')[0];
  const esHoy        = fechaElegida === hoy;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  // ── 2. Obtener citas reservadas de la API ──
  let citasDelDia = [];
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (data.ok) {
      citasDelDia = data.citas.filter(
        c => c.fecha === fechaElegida && c.estado !== 'cancelada'
      );
    }
  } catch (e) {
    console.warn('No se pudo consultar la API, se muestran horas sin filtro de reservas.', e);
  }

  // ── 3. Construir set de horas bloqueadas por citas (±60 min) ──
  const bloqueadasPorCita = new Set();
  citasDelDia.forEach(c => {
    const minCita = horaEnMinutos(c.hora);
    TODAS_LAS_HORAS.forEach(h => {
      if (Math.abs(horaEnMinutos(h) - minCita) < 60) {
        bloqueadasPorCita.add(h);
      }
    });
  });

  // ── 4. Construir el select ──
  horaSelect.innerHTML = '<option value="">Selecciona la hora...</option>';
  let hayDisponibles = false;

  TODAS_LAS_HORAS.forEach(hora => {
    const minHora      = horaEnMinutos(hora);
    const yaPaso       = esHoy && minHora <= minutosAhora;
    const estaOcupada  = bloqueadasPorCita.has(hora);
    const bloqueada    = yaPaso || estaOcupada;

    const option = document.createElement('option');
    option.value = hora;

    if (bloqueada) {
      option.textContent = `${hora} — ${yaPaso ? 'hora pasada' : 'no disponible'}`;
      option.disabled    = true;
      option.style.color = '#888';
    } else {
      option.textContent = hora;
      hayDisponibles     = true;
    }

    horaSelect.appendChild(option);
  });

  if (!hayDisponibles) {
    horaSelect.innerHTML = '<option value="">Sin horarios disponibles para este día</option>';
  }

  horaSelect.disabled = false;
}

// ══════════════════════════════════════════
//  FECHA MÍNIMA + LISTENER
// ══════════════════════════════════════════
if (fechaInput) {
  fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  fechaInput.addEventListener('change', cargarHorasDisponibles);
}

// Estado inicial del selector de hora
if (horaSelect) {
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

    // ── Validar que la hora no haya pasado (si es hoy) ──
    const ahora = new Date();
    const hoy   = ahora.toISOString().split('T')[0];
    if (fecha === hoy) {
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      if (horaEnMinutos(hora) <= minutosAhora) {
        alert('Esa hora ya pasó. Por favor selecciona otra hora.');
        cargarHorasDisponibles();
        return;
      }
    }

    // ── Validar fecha pasada ──
    const fechaObj = new Date(fecha + 'T00:00:00');
    const hoyObj   = new Date(hoy  + 'T00:00:00');
    if (fechaObj < hoyObj) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }

    // ── Verificación final en tiempo real (alguien pudo reservar mientras tanto) ──
    try {
      const checkRes  = await fetch(API_URL);
      const checkData = await checkRes.json();
      if (checkData.ok) {
        const conflicto = checkData.citas.some(c => {
          if (c.fecha !== fecha || c.estado === 'cancelada') return false;
          return Math.abs(horaEnMinutos(c.hora) - horaEnMinutos(hora)) < 60;
        });
        if (conflicto) {
          alert('Lo sentimos, ese horario acaba de ser reservado. Por favor selecciona otra hora.');
          await cargarHorasDisponibles();
          return;
        }
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
      const res  = await fetch(API_URL, { method: 'POST', body: JSON.stringify(nuevaCita) });
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