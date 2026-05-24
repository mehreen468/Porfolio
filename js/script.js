document.addEventListener('DOMContentLoaded', () => {
  const cube = document.querySelector('.cube');
  let rotation = 0;

  const updateCube = () => {
    rotation += 0.15;
    if (cube) cube.style.transform = `rotateX(-20deg) rotateY(${rotation}deg)`;
    requestAnimationFrame(updateCube);
  };
  updateCube();

  const scene = document.querySelector('.scene');
  if (scene && cube) {
    scene.addEventListener('mousemove', (e) => {
      const rect = scene.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 20;
      const rotateX = -y * 20 - 20;
      cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotation + rotateY}deg)`;
    });

    scene.addEventListener('mouseleave', () => {
      if (cube) cube.style.transform = `rotateX(-20deg) rotateY(${rotation}deg)`;
    });
  }

  const tiltElements = document.querySelectorAll('.tilt-card');
  tiltElements.forEach(el => {
    el.style.transformStyle = 'preserve-3d';
    el.classList.add('tilt-animate');

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (y * 12);
      const rotateY = (x * 12);
      el.style.transform = `perspective(900px) rotateX(${ -rotateX }deg) rotateY(${ rotateY }deg) translateZ(0)`;
      const img = el.querySelector('.project-image');
      if (img) img.style.transform = `translateZ(40px) scale(1.02) rotateZ(${x*2}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      const img = el.querySelector('.project-image');
      if (img) img.style.transform = '';
    });
  });
});

// Scroll reveal & parallax background
document.addEventListener('DOMContentLoaded', () => {
  // Add initial reveal class to common blocks
  const selectors = ['.section-header', '.hero-copy', '.hero-visual', '.project-card', '.skill-card', '.content-panel', '.about-metrics', '.contact-card', '.contact-form-card'];
  const nodes = [];
  selectors.forEach(s => document.querySelectorAll(s).forEach((n,i)=>{ n.classList.add('reveal'); n.style.setProperty('--delay', `${i*40}ms`); nodes.push(n); }));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--active');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  nodes.forEach(n => io.observe(n));

  // Background parallax using CSS variables
  const root = document.documentElement;
  let lastMove = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMove < 16) return; // throttle ~60fps
    lastMove = now;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    root.style.setProperty('--bg-pos-x', `${x}%`);
    root.style.setProperty('--bg-pos-y', `${y}%`);
  });

  // Navbar scrolled state
  const nav = document.querySelector('.navbar-custom');
  const hero = document.querySelector('.hero');
  const checkNav = () => {
    if (!nav || !hero) return;
    const scrolled = window.scrollY > (hero.offsetHeight * 0.4);
    nav.classList.toggle('is-scrolled', scrolled);
  };
  window.addEventListener('scroll', checkNav);
  checkNav();

  // Pop hero chip briefly on load
  const chip = document.querySelector('.hero-chip');
  if (chip) {
    setTimeout(()=> chip.classList.add('pop'), 900);
    setTimeout(()=> chip.classList.remove('pop'), 2900);
  }
});

// UI interactions: contact form send, smooth nav, toasts
document.addEventListener('DOMContentLoaded', () => {
  // Smooth nav scrolling with offset for navbar
  document.querySelectorAll('a.nav-link[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        ev.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 84; // offset
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // Contact form handler
  const contactForm = document.querySelector('.contact-form-card form');
  if (contactForm) {
    const btn = contactForm.querySelector('button[type="submit"]');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (contactForm.querySelector('input[name="name"]') || {}).value?.trim() || '';
      const email = (contactForm.querySelector('input[name="email"]') || {}).value?.trim() || '';
      const message = (contactForm.querySelector('textarea[name="message"]') || {}).value?.trim() || '';
      if (!name || !email || !message) {
        showToast('Please complete all fields.');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.classList.remove('success');
        btn.classList.add('sending');
      }

      const subject = encodeURIComponent(`Portfolio message: ${name}`);
      const body = encodeURIComponent(`${message}\n\n---\nName: ${name}\nEmail: ${email}`);
      const mailto = `mailto:mehreenzahoor22@gmail.com?subject=${subject}&body=${body}`;

      const openMail = () => {
        window.location.href = mailto;
        showToast('Attempting to open your email client. If it does not open, the message is copied to clipboard.');
      };

      copyToClipboard(`${message}\n\nName: ${name}\nEmail: ${email}`);
      openMail();
      contactForm.reset();
      if (btn) {
        btn.classList.remove('sending');
        btn.classList.add('success');
        setTimeout(() => {
          btn.classList.remove('success');
          btn.disabled = false;
        }, 2200);
      }
    });
  }

  function showToast(text, timeout = 3600) {
    const t = document.createElement('div');
    t.className = 'toast-notice';
    t.textContent = text;
    document.body.appendChild(t);
    // force reflow
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); setTimeout(()=> t.remove(), 360); }, timeout);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(()=>{});
    } else {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(e){} ta.remove();
    }
  }
});
