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

function formatoFecha(date) {
  const año = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// ══════════════════════════════════════════
//  CALENDARIO
// ══════════════════════════════════════════
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const title = new Date(year, month).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  document.getElementById('calendarTitle').textContent = title.charAt(0).toUpperCase() + title.slice(1);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDaysDiv = document.getElementById('calendarDays');
  calendarDaysDiv.innerHTML = '';

  // Días del mes anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'calendar-day other-month';
    day.textContent = prevMonthLastDay - i;
    calendarDaysDiv.appendChild(day);
  }

  // Días del mes actual
  const today = new Date();
  const todayStr = formatoFecha(today);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatoFecha(date);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;

    // Desactivar días pasados
    if (dateStr < todayStr) {
      dayDiv.classList.add('disabled');
    } else {
      dayDiv.classList.add('available');
      dayDiv.addEventListener('click', () => selectDate(dateStr, dayDiv));

      if (dateStr === selectedDate) {
        dayDiv.classList.add('selected');
      }
    }

    calendarDaysDiv.appendChild(dayDiv);
  }

  // Días del próximo mes
  const totalCells = calendarDaysDiv.children.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    const day = document.createElement('div');
    day.className = 'calendar-day other-month';
    day.textContent = i;
    calendarDaysDiv.appendChild(day);
  }
}

function selectDate(dateStr, dayElement) {
  // Remover selección anterior
  document.querySelectorAll('.calendar-day.selected').forEach(el => {
    el.classList.remove('selected');
  });

  selectedDate = dateStr;
  dayElement.classList.add('selected');
  selectedTime = null;
  cargarHorasDisponibles();
}

// ══════════════════════════════════════════
//  CARGAR HORAS DISPONIBLES
// ══════════════════════════════════════════
async function cargarHorasDisponibles() {
  if (!selectedDate) return;

  const timeSlots = document.getElementById('timeSlots');
  timeSlots.innerHTML = '<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">Cargando horarios...</div>';

  const ahora = new Date();
  const hoy = formatoFecha(ahora);
  const esHoy = selectedDate === hoy;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  // Obtener citas reservadas
  let citasDelDia = [];
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.ok) {
      citasDelDia = data.citas.filter(
        c => c.fecha === selectedDate && c.estado !== 'cancelada'
      );
    }
  } catch (e) {
    console.warn('No se pudo consultar la API', e);
  }

  // Construir set de horas bloqueadas
  const bloqueadasPorCita = new Set();
  citasDelDia.forEach(c => {
    const minCita = horaEnMinutos(c.hora);
    TODAS_LAS_HORAS.forEach(h => {
      if (Math.abs(horaEnMinutos(h) - minCita) < 60) {
        bloqueadasPorCita.add(h);
      }
    });
  });

  // Renderizar horas
  timeSlots.innerHTML = '';
  TODAS_LAS_HORAS.forEach(hora => {
    const minHora = horaEnMinutos(hora);
    const yaPaso = esHoy && minHora <= minutosAhora;
    const estaOcupada = bloqueadasPorCita.has(hora);
    const bloqueada = yaPaso || estaOcupada;

    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'time-slot';
    slot.textContent = hora;

    if (bloqueada) {
      slot.classList.add('disabled');
      slot.disabled = true;
    } else {
      if (hora === selectedTime) {
        slot.classList.add('selected');
      }
      slot.addEventListener('click', (e) => {
        e.preventDefault();
        selectTime(hora, slot);
      });
    }

    timeSlots.appendChild(slot);
  });
}

function selectTime(time, element) {
  document.querySelectorAll('.time-slot.selected').forEach(el => {
    el.classList.remove('selected');
  });

  selectedTime = time;
  element.classList.add('selected');
}

// ══════════════════════════════════════════
//  INICIALIZACIÓN DEL CALENDARIO
// ══════════════════════════════════════════
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const resetBtn = document.getElementById('resetBtn');

if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('bookingForm').reset();
    selectedDate = null;
    selectedTime = null;
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
      el.classList.remove('selected');
    });
    document.querySelectorAll('.time-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });
    document.getElementById('timeSlots').innerHTML = '';
  });
}

renderCalendar();

// ══════════════════════════════════════════
//  FORMULARIO DE CITAS
// ══════════════════════════════════════════
const form = document.getElementById('bookingForm');
const confirmMsg = document.getElementById('confirmMsg');
const btnSubmit = document.querySelector('.btn-submit');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = (document.getElementById('nombre')?.value || '').trim();
    const telefono = (document.getElementById('telefono')?.value || '').trim();
    const email = (document.getElementById('email')?.value || '').trim();
    const servicio = document.getElementById('servicio')?.value || '';
    const notas = (document.getElementById('notas')?.value || '').trim();

    if (!nombre || !telefono || !email || !servicio || !selectedDate || !selectedTime) {
      alert('Por favor completa todos los campos obligatorios, incluyendo la fecha y hora.');
      return;
    }

    // Validar que la hora no haya pasado
    const ahora = new Date();
    const hoy = formatoFecha(ahora);
    if (selectedDate === hoy) {
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      if (horaEnMinutos(selectedTime) <= minutosAhora) {
        alert('Esa hora ya pasó. Por favor selecciona otra hora.');
        return;
      }
    }

    // Validar fecha pasada
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const hoyObj = new Date(hoy + 'T00:00:00');
    if (selectedDateObj < hoyObj) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }

    // Verificación final
    try {
      const checkRes = await fetch(API_URL);
      const checkData = await checkRes.json();
      if (checkData.ok) {
        const conflicto = checkData.citas.some(c => {
          if (c.fecha !== selectedDate || c.estado === 'cancelada') return false;
          return Math.abs(horaEnMinutos(c.hora) - horaEnMinutos(selectedTime)) < 60;
        });
        if (conflicto) {
          alert('Lo sentimos, ese horario acaba de ser reservado. Por favor selecciona otra hora.');
          await cargarHorasDisponibles();
          return;
        }
      }
    } catch (err) {
      console.warn('No se pudo verificar disponibilidad:', err);
    }

    if (btnSubmit) {
      btnSubmit.textContent = 'Enviando...';
      btnSubmit.disabled = true;
    }

    const nuevaCita = {
      action: 'crearCita',
      id: generarId(),
      nombre, telefono, email, servicio,
      fecha: selectedDate,
      hora: selectedTime,
      notas
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(nuevaCita)
      });
      const data = await res.json();

      if (data.ok) {
        if (confirmMsg) {
          confirmMsg.style.display = 'block';
          confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { confirmMsg.style.display = 'none'; }, 8000);
        }
        form.reset();
        selectedDate = null;
        selectedTime = null;
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
          el.classList.remove('selected');
        });
        document.querySelectorAll('.time-slot.selected').forEach(el => {
          el.classList.remove('selected');
        });
        document.getElementById('timeSlots').innerHTML = '';
        currentDate = new Date();
        renderCalendar();
      } else {
        alert(data.mensaje || 'Error al guardar la cita. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      if (btnSubmit) {
        btnSubmit.textContent = 'Confirmar Cita';
        btnSubmit.disabled = false;
      }
    }
  });
}

// ══════════════════════════════════════════
//  MENÚ FLOTANTE (MOBILE)
// ══════════════════════════════════════════
const floatingMenu = document.getElementById('floatingMenu');
const fabButton = document.getElementById('fabButton');
const fabItems = document.querySelectorAll('.fab-item');

function toggleFloatingMenu(e) {
  e.preventDefault();
  fabButton.classList.toggle('active');
}

if (fabButton) {
  fabButton.addEventListener('click', toggleFloatingMenu);
}

fabItems.forEach(item => {
  item.addEventListener('click', () => {
    fabButton.classList.remove('active');
  });
});

// Cerrar menú al hacer click fuera
document.addEventListener('click', (e) => {
  if (floatingMenu && !floatingMenu.contains(e.target)) {
    fabButton.classList.remove('active');
  }
});

// ══════════════════════════════════════════
//  MENÚ HAMBURGUESA
// ══════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
}
document.querySelectorAll('.nav-item a').forEach(link => {
  link.addEventListener('click', () => { if (navLinks) navLinks.classList.remove('active'); });
});