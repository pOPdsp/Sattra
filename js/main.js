// Manejo del formulario de citas
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

    // Bloquear fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaElegida = new Date(fecha + 'T00:00:00');
    if (fechaElegida < hoy) {
      alert('Por favor selecciona una fecha válida (hoy o posterior).');
      return;
    }

    confirmMsg.style.display = 'block';
    form.reset();
    confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => { confirmMsg.style.display = 'none'; }, 6000);
  });
}

// Menú hamburguesa (mobile)
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '64px';
    navLinks.style.left = '0';
    navLinks.style.width = '100%';
    navLinks.style.background = '#fff';
    navLinks.style.padding = '20px 40px';
    navLinks.style.borderBottom = '0.5px solid rgba(0,0,0,0.1)';
  });
}

// Fecha mínima en el input de fecha
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.setAttribute('min', hoy);
}