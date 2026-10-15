"use strict";
const PRODUCTS = window.CMS_PRODUCTS || {
  "elpa8": {
  "name": "ELPA 8",
  "kind": "Staircase time switch",
  "description": "Timer tangga elektromekanis dengan durasi nyala 1-7 menit.",
  "spec": "1-7 menit · DIN rail · 1 modul",
  "size": "Item no. 0080002"
},
  "cp4": {
    "name": "iONprime CP4 KNX",
    "kind": "Room controller KNX",
    "description": "Panel sentuh 4 inci untuk kontrol ruang KNX.",
    "spec": "4 inci · 48 fungsi",
    "size": "Item no. 4969300"
  },
  "pb": {
    "name": "iONprime PB KNX",
    "kind": "Touch sensor KNX",
    "description": "Keypad KNX dengan LED RGB dan pilihan finishing.",
    "spec": "8 tombol · LED RGB",
    "size": "Item no. 4969301 (tanpa rocker)"
  },
  "sul": {
    "name": "SUL 181 d",
    "kind": "Analogue time switch",
    "description": "Timer harian dengan terminal DuoFix.",
    "spec": "15 menit · DuoFix",
    "size": "Item no. 1810011"
  },
  "sul-sk": {
    "name": "SUL 181 d SK",
    "kind": "Analogue time switch",
    "description": "Timer harian dengan screw terminals.",
    "spec": "15 menit · Screw terminals",
    "size": "Item no. 1810021"
  },
  "tr030": {
    "name": "TR 030 top3 UP",
    "kind": "Digital flush-mounted time switch",
    "description": "Timer mingguan untuk pemasangan di dinding.",
    "spec": "Flush-mounted · 84 memori",
    "size": "Item no. 0300130"
  },
  "tr610": {
    "name": "TR 610 top3",
    "kind": "Digital time switch",
    "description": "Timer mingguan dengan dukungan pemrograman aplikasi.",
    "spec": "56 memori · 10 tahun",
    "size": "Item no. 6100130"
  },
  "simplexa": {
    "name": "SIMPLEXA 601 top",
    "kind": "Digital time switch",
    "description": "Timer digital satu kanal yang mudah diatur.",
    "spec": "1 kanal · 42 memori",
    "size": "Item no. 6010130"
  }
};

// Product-specific buying links supplied by the site owner.
const PRODUCT_PURCHASE_LINKS = window.CMS_PRODUCT_PURCHASE_LINKS || {
  "tr030": {
    "name": "TR 030 top3 UP",
    "href": "https://tk.tokopedia.com/ZSbXq8XYm/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli TR 030 top3 UP di Tokopedia"
  },
  "sul": {
    "name": "SUL 181 d",
    "href": "https://tk.tokopedia.com/ZSbXqYjsp/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli SUL 181 d di Tokopedia"
  },
  "sul-sk": {
    "name": "SUL 181 d SK",
    "href": "https://tk.tokopedia.com/ZSbXVtGPT/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli SUL 181 d SK di Tokopedia"
  },
  "elpa8": {
    "name": "ELPA 8",
    "href": "https://tk.tokopedia.com/ZSbXqLCbf/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli ELPA 8 di Tokopedia"
  },
  "simplexa": {
    "name": "SIMPLEXA 601 top",
    "href": "https://tk.tokopedia.com/ZSbXV7uNu/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli SIMPLEXA 601 top di Tokopedia"
  },
  "tr610": {
    "name": "TR 610 top3",
    "href": "https://tk.tokopedia.com/ZSbXqL8Df/",
    "channel": "tokopedia",
    "label": "Beli di Tokopedia ↗",
    "aria": "Beli TR 610 top3 di Tokopedia"
  },
  "pb": {
    "name": "iONprime PB KNX",
    "channel": "whatsapp",
    "href": "https://wa.me/6285122188879?text=Halo%20PT%20Klik%20Hiro%20Optima%2C%20saya%20ingin%20berkonsultasi%20tentang%20produk%20iONprime%20PB%20KNX.",
    "label": "Tanya via WhatsApp ↗",
    "aria": "Tanyakan iONprime PB KNX melalui WhatsApp"
  },
  "cp4": {
    "name": "iONprime CP4 KNX",
    "channel": "whatsapp",
    "href": "https://wa.me/6285122188879?text=Halo%20PT%20Klik%20Hiro%20Optima%2C%20saya%20ingin%20berkonsultasi%20tentang%20produk%20iONprime%20CP4%20KNX.",
    "label": "Tanya via WhatsApp ↗",
    "aria": "Tanyakan iONprime CP4 KNX melalui WhatsApp"
  }
};

// Navigation: mobile menu and section state.
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#nav-menu');
const mobileView = window.matchMedia('(max-width: 960px)');
function setMenu(open) {
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  toggle.querySelector('span').textContent = open ? '✕' : '☰';
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('click', event => { if (!event.target.closest('.navbar')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
});
mobileView.addEventListener('change', () => setMenu(false));
const navLinks = [...menu.querySelectorAll('a')];
navLinks.forEach(link => {
  if (new URL(link.href).pathname === location.pathname || (link.href.endsWith('/produk.html') && document.querySelector('.detail-hero'))) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
});

// Product search and category filtering.
let category = 'all';
const search = document.querySelector('#product-search');
const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.product-card')];
function filterProducts() {
  const query = search.value.trim().toLocaleLowerCase('id');
  let count = 0;
  cards.forEach(card => {
    const matches = (category === 'all' || card.dataset.category === category) && card.textContent.toLocaleLowerCase('id').includes(query);
    card.hidden = !matches;
    if (matches) count++;
  });
  document.querySelector('#product-count').textContent = `${count} produk tersedia`;
  document.querySelector('#empty-products').hidden = count > 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(filter => { const active = filter === button; filter.setAttribute('aria-pressed', String(active)); filter.classList.toggle('is-active', active); });
  filterProducts();
}));
search?.addEventListener('input', filterProducts);

// Product details. Native dialog supports focus trapping and Escape.
const dialog = document.querySelector('#product-dialog');
if (dialog) {
let selectedProduct;
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  selectedProduct = PRODUCTS[button.dataset.product];
  const purchase = PRODUCT_PURCHASE_LINKS[button.dataset.product];
  const purchaseButton = document.querySelector('#dialog-buy');
  if (purchase && purchaseButton) {
    purchaseButton.href = purchase.href;
    purchaseButton.setAttribute('aria-label', purchase.aria);
    purchaseButton.querySelector('[data-purchase-label]').textContent = purchase.label;
    purchaseButton.querySelectorAll('[data-purchase-icon]').forEach(icon => {
      icon.toggleAttribute('hidden', icon.dataset.purchaseIcon !== purchase.channel);
    });
  }
  document.querySelector('#dialog-full').href = button.dataset.product + '.html';
  document.querySelector('#dialog-title').textContent = selectedProduct.name;
  document.querySelector('#dialog-kind').textContent = selectedProduct.kind;
  document.querySelector('#dialog-description').textContent = selectedProduct.description;
  document.querySelector('#dialog-spec').textContent = selectedProduct.spec;
  document.querySelector('#dialog-size').textContent = selectedProduct.size;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
document.querySelector('#dialog-contact').addEventListener('click', () => {
  const url = new URL('konsultasi.html', location.href);
  url.searchParams.set('product', selectedProduct.name);
  document.querySelector('#dialog-contact').href = url.href;
  dialog.close();
});
}

// Illustrative scenes, not a connection to real equipment.
const scenes = {
  morning: [['Pencahayaan', 'Terang untuk aktivitas'], ['Tirai', 'Terbuka'], ['Iklim ruang', 'Mode nyaman']],
  relax: [['Pencahayaan', 'Redup & hangat'], ['Tirai', 'Tertutup'], ['Iklim ruang', 'Mode nyaman']],
  away: [['Pencahayaan', 'Nonaktif sesuai zona'], ['Tirai', 'Sesuai jadwal'], ['Iklim ruang', 'Mode hemat']]
};
function setScene(name) {
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === name)));
  const output = document.querySelector('#scene-output');
  output.replaceChildren(...scenes[name].map(([label, value]) => {
    const row = document.createElement('div');
    const title = document.createElement('span'); title.textContent = label;
    const detail = document.createElement('strong'); detail.textContent = value;
    row.append(title, detail); return row;
  }));
}
document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => setScene(button.dataset.scene)));
if (document.querySelector('#scene-output')) setScene('morning');

// Prepare a WhatsApp draft. No automatic send and no server storage.
const form = document.querySelector('#consultation-form');
form?.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = `Halo PT Klik Hiro Optima, saya ingin berkonsultasi tentang Theben.\n\nNama: ${data.get('name').trim()}\nPerusahaan: ${data.get('company').trim() || '-'}\nEmail: ${data.get('email').trim() || '-'}\nWhatsApp: ${data.get('phone').trim()}\nMinat: ${data.get('interest')}\n\nInformasi proyek:\n${data.get('project').trim()}`;
  const whatsappUrl = 'https://wa.me/6285122188879?text=' + encodeURIComponent(message);
  window.location.assign(whatsappUrl);
});

if (form) {
  const requested = new URLSearchParams(location.search).get('product');
  const select = form.querySelector('[name=interest]');
  if ([...select.options].some(option => option.value === requested)) select.value = requested;
}

// Drop an image into the documented path; it replaces its placeholder automatically.
document.querySelectorAll('[data-image]').forEach(slot => {
  const image = new Image();
  image.alt = slot.dataset.alt;
  image.decoding = 'async';
  image.onload = () => {
    slot.replaceChildren(image); slot.classList.add('is-loaded');
    slot.removeAttribute('role'); slot.removeAttribute('aria-label');
  };
  image.onerror = () => { /* Keep the labeled placeholder when no photo has been supplied. */ };
  image.src = slot.dataset.image;
});
const yearElement = document.querySelector('#year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

// One active information panel prevents mismatched columns on product pages.
document.querySelectorAll('[data-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[data-tab]')];
  const panels = [...group.querySelectorAll('[data-tab-panel]')];
  const list = group.querySelector('.information-tabs');
  list.setAttribute('role', 'tablist');
  tabs.forEach(tab => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.dataset.tab);
  });
  panels.forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs.find(tab => tab.dataset.tab === panel.id).id);
    panel.tabIndex = 0;
  });
  function selectTab(selected, focus = false) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== selected.dataset.tab; });
    if (focus) selected.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  selectTab(tabs[0]);
});


// Homepage carousel: buttons, keyboard, pointer swipe and automatic playback.
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const viewport = carousel.querySelector('.carousel-viewport');
  const track = carousel.querySelector('.carousel-track');
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const status = carousel.querySelector('[data-carousel-status]');
  if (slides.length < 2) return;

  let index = 0;
  let visible = true;
  let gesture = null;
  let timer;
  const interval = Number(carousel.dataset.interval) || 5000;
  carousel.querySelector('.carousel-controls').hidden = false;
  carousel.querySelector('.carousel-navigation').hidden = false;

  function updatePlayback() {
    window.clearTimeout(timer);
    if (!gesture && visible && !document.hidden) {
      timer = window.setTimeout(() => showSlide(index + 1), interval);
    }
  }

  function showSlide(next, announce = false) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    carousel.classList.remove('is-dragging');
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      slide.classList.toggle('is-active', active);
    });
    dots.forEach((dot, position) => {
      if (position === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    // Fetch the next photograph ahead of time while keeping the first image fast.
    slides[index].querySelector('img').loading = 'eager';
    slides[(index + 1) % slides.length].querySelector('img').loading = 'eager';
    if (announce) status.textContent = slides[index].getAttribute('aria-label');
    updatePlayback();
  }

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => showSlide(index - 1, true));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => showSlide(index + 1, true));
  dots.forEach(dot => dot.addEventListener('click', () => showSlide(Number(dot.dataset.carouselSlide), true)));

  carousel.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = index + 1;
    if (event.key === 'ArrowLeft') next = index - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = slides.length - 1;
    if (next !== undefined) { event.preventDefault(); showSlide(next, true); }
  });
  // Manual navigation restarts the five-second delay without permanently stopping playback.
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, delta: 0, horizontal: false };
    viewport.setPointerCapture(event.pointerId);
    updatePlayback();
  });
  viewport.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) gesture.horizontal = true;
    if (!gesture.horizontal) return;
    if (event.cancelable) event.preventDefault();
    gesture.delta = dx;
    let offset = Math.max(-viewport.clientWidth * .3, Math.min(viewport.clientWidth * .3, dx));
    if ((index === 0 && offset > 0) || (index === slides.length - 1 && offset < 0)) offset *= .2;
    carousel.classList.add('is-dragging');
    track.style.transform = `translateX(calc(-${index * 100}% + ${offset}px))`;
  });
  function finishGesture(event, cancelled = false) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const movement = gesture;
    gesture = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    const threshold = Math.min(60, viewport.clientWidth * .15);
    if (!cancelled && movement.horizontal && Math.abs(movement.delta) > threshold) {
      showSlide(index + (movement.delta < 0 ? 1 : -1), true);
    } else showSlide(index);
  }
  viewport.addEventListener('pointerup', event => finishGesture(event));
  viewport.addEventListener('pointercancel', event => finishGesture(event, true));
  viewport.addEventListener('lostpointercapture', event => finishGesture(event, true));
  document.addEventListener('visibilitychange', updatePlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      updatePlayback();
    }, { threshold: .1 }).observe(carousel);
  }
  showSlide(0);
});
