// ══════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════
const CITAS_KEY = 'sattra_citas';

// ══════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════
function getCitas() {
  try {
    return JSON.parse(localStorage.getItem(CITAS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCitas(citas) {
  try {
    localStorage.setItem(CITAS_KEY, JSON.stringify(citas));
    return true;
  } catch (e) {
    console.error('Error guardando cita:', e);
    return false;
  }
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ══════════════════════════════════════════
//  FECHA MÍNIMA
// ══════════════════════════════════════════
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.setAttribute('min', hoy);
}

// ══════════════════════════════════════════
//  FORMULARIO DE CITAS
// ══════════════════════════════════════════
const form       = document.getElementById('bookingForm');
const confirmMsg = document.getElementById('confirmMsg');

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nombre   = (document.getElementById('nombre')?.value   || '').trim();
    const telefono = (document.getElementById('telefono')?.value || '').trim();
    const email    = (document.getElementById('email')?.value    || '').trim();
    const servicio = document.getElementById('servicio')?.value  || '';
    const fecha    = document.getElementById('fecha')?.value     || '';
    const hora     = document.getElementById('hora')?.value      || '';
    const notas    = (document.getElementById('notas')?.value    || '').trim();

    // Validaciones
    if (!nombre || !servicio || !fecha || !hora || !telefono) {
      alert('Por favor completa todos los campos obligatorios (nombre, teléfono, servicio, fecha y hora).');
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaElegida = new Date(fecha + 'T00:00:00');
    if (fechaElegida < hoy) {
      alert('Por favor selecciona una fecha válida (hoy o posterior).');
      return;
    }

    // Crear objeto cita
    const nuevaCita = {
      id:        generarId(),
      nombre:    nombre,
      telefono:  telefono,
      email:     email,
      servicio:  servicio,
      fecha:     fecha,
      hora:      hora,
      notas:     notas,
      estado:    'pendiente',
      creadaEn:  new Date().toISOString()
    };

    // Guardar
    const citas = getCitas();
    citas.push(nuevaCita);
    const guardado = saveCitas(citas);

    if (!guardado) {
      alert('Hubo un error al guardar la cita. Intenta nuevamente.');
      return;
    }

    // Verificar que se guardó correctamente
    const verificacion = getCitas();
    const guardadaOk = verificacion.find(c => c.id === nuevaCita.id);

    if (!guardadaOk) {
      alert('Error al verificar la cita guardada. Contáctanos directamente al 8672-7070.');
      return;
    }

    console.log('✅ Cita guardada:', nuevaCita);
    console.log('📋 Total citas en storage:', verificacion.length);

    // Mostrar confirmación
    if (confirmMsg) {
      confirmMsg.style.display = 'block';
      confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { confirmMsg.style.display = 'none'; }, 8000);
    }

    form.reset();
    if (fechaInput) {
      fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }
  });
}

// ══════════════════════════════════════════
//  MENÚ HAMBURGUESA
// ══════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks) navLinks.classList.remove('active');
  });
});