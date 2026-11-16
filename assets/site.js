(() => {
  const menu = document.getElementById('mobileMenu');
  const menuButton = document.getElementById('mobileMenuBtn');
  const menuIcon = document.getElementById('menuIcon');
  const closeMenu = () => {
    if (!menu || !menuButton) return;
    menu.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menüyü aç');
    if (menuIcon) {
      menuIcon.classList.remove('fa-xmark');
      menuIcon.classList.add('fa-bars');
    }
  };

  if (menu && menuButton) {
    menuButton.addEventListener('click', () => {
      const opening = menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !opening);
      menuButton.setAttribute('aria-expanded', String(opening));
      menuButton.setAttribute('aria-label', opening ? 'Menüyü kapat' : 'Menüyü aç');
      if (menuIcon) {
        menuIcon.classList.toggle('fa-bars', !opening);
        menuIcon.classList.toggle('fa-xmark', opening);
      }
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a[href^="#"]')) closeMenu();
    });
  }

  document.querySelectorAll('[data-service-prefill]').forEach((link) => {
    link.addEventListener('click', () => {
      const select = document.getElementById('appServiceType');
      const requested = link.dataset.servicePrefill;
      if (!select) return;
      const aliases = {
        'Motor Mekanik Onarım': 'Motor ve Mekanik Onarım',
        'Fren & Alt Takım': 'Fren ve Alt Takım',
        'Oto Elektrik & DPF': 'Oto Elektrik / DPF-EGR arıza tespiti'
      };
      const value = aliases[requested] || requested;
      if ([...select.options].some((option) => option.value === value)) select.value = value;
    });
  });

  const form = document.getElementById('appointmentForm');
  if (!form) return;
  const date = document.getElementById('appDate');
  if (date) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = (id) => document.getElementById(id)?.value.trim() || 'Belirtilmedi';
    const message = [
      'OTO KLİNİK ALAŞEHİR randevu talebi',
      `Ad Soyad: ${value('appCustName')}`,
      `Telefon: ${value('appCustPhone')}`,
      `Plaka: ${value('appPlate').toLocaleUpperCase('tr-TR')}`,
      `Hizmet: ${value('appServiceType')}`,
      `Tercih edilen tarih: ${value('appDate')}`,
      `Tercih edilen saat: ${value('appTime')}`,
      `Not: ${value('appNotes')}`
    ].join('\n');
    const url = new URL('https://wa.me/905321737943');
    url.searchParams.set('text', message);
    window.location.assign(url.toString());
  });
})();
