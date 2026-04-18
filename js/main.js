// ══════════════════════════════════════════
//  CONFIGURACIÓN — PON TU URL AQUÍ
// ══════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycby1oymWGkzFVT7ar5NBE8m6koMzFWpV9Pz3o_qGFnXNpMLpLFoUA2dMA7sbqrDDoUvK/exec';

// ══════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ══════════════════════════════════════════
//  FECHA MÍNIMA
// ══════════════════════════════════════════
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
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

    // Estado de carga
    if (btnSubmit) { btnSubmit.textContent = 'Enviando...'; btnSubmit.disabled = true; }

    const nuevaCita = {
      action:   'crearCita',
      id:       generarId(),
      nombre, telefono, email, servicio, fecha, hora, notas
    };

    try {
      const res = await fetch(API_URL, {
        method:  'POST',
        body:    JSON.stringify(nuevaCita)
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
      } else {
        alert('Error al guardar la cita: ' + (data.mensaje || 'Intenta nuevamente'));
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