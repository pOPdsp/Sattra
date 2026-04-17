// Fecha mínima en el picker
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
}

// Formulario de citas
const form = document.getElementById('bookingForm');
const confirmMsg = document.getElementById('confirmMsg');

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const servicio = document.getElementById('servicio').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    if (!nombre || !servicio || !fecha || !hora) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (new Date(fecha + 'T00:00:00') < hoy) {
      alert('Por favor selecciona una fecha válida (hoy o posterior).');
      return;
    }

    confirmMsg.style.display = 'block';
    form.reset();
    fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { confirmMsg.style.display = 'none'; }, 7000);
  });
}

// Menú hamburguesa
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Cerrar menú al hacer click en un link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('active'));
});