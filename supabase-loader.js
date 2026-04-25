// ── Supabase public content loader v4 ────────────────
(function () {
  const SUPABASE_URL = 'https://msrfitvtiyfukgnzhqrs.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcmZpdHZ0aXlmdWtnbnpocXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTA0NjgsImV4cCI6MjA5MjQ2NjQ2OH0.GRsF5TyNmWNXMlGhzDlrQ3YJeuUFQjJbHgEtZOUJsgQ';

  async function sbFetch(table, params) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) { console.warn('[SB]', table, res.status); return []; }
      return await res.json();
    } catch (e) { console.warn('[SB] error', table, e); return []; }
  }

  function currentPage() {
    const p = window.location.pathname.split('/').pop() || 'index.html';
    if (p === '' || p === 'index.html') return 'home';
    if (p === 'about.html') return 'about';
    if (p === 'projects.html') return 'projects';
    if (p === 'publications.html') return 'publications';
    if (p === 'media.html') return 'media';
    if (p === 'blog.html') return 'blog';
    return 'other';
  }

  // ── PAGE CONTENT (all editable text) ────────────────
  async function loadPageContent() {
    const data = await sbFetch('page_content', 'select=content_key,value');
    if (!data.length) return;

    const map = {};
    data.forEach(row => { map[row.content_key] = row.value; });

    // Helper: set text of element by ID, fall back gracefully
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    }
    function setHTML(id, value) {
      const el = document.getElementById(id);
      if (el && value) el.innerHTML = value;
    }
    function setAttr(id, attr, value) {
      const el = document.getElementById(id);
      if (el && value) el.setAttribute(attr, value);
    }
    function setAll(selector, value) {
      document.querySelectorAll(selector).forEach(el => { if (value) el.textContent = value; });
    }
    function setAllHref(selector, value) {
      document.querySelectorAll(selector).forEach(el => { if (value) el.href = value; });
    }

    // Footer — appears on every page
    setText('footer-tagline-text', map['footer-tagline']);
    const footerEmailEls = document.querySelectorAll('.footer-email a');
    if (map['footer-email']) {
      footerEmailEls.forEach(a => {
        a.href = 'mailto:' + map['footer-email'];
        a.textContent = map['footer-email'];
      });
    }

    // Contact strip — homepage
    setText('contact-strip-heading', map['contact-strip-heading']);
    setText('contact-strip-text', map['contact-strip-text']);
    const ctaBtn = document.getElementById('contact-strip-btn');
    if (ctaBtn && map['contact-strip-email']) {
      ctaBtn.href = 'mailto:' + map['contact-strip-email'];
    }

    // Hero — homepage
    setText('hero-alias-text', map['hero-alias']);
    setText('hero-roles-text', map['hero-roles']);
    setText('hero-vertical-text', map['hero-tagline']);

    // Homepage bio
    setText('homepage-bio', map['homepage-bio']);

    // Page hero intros (each inner page)
    setText('page-intro-text', map[currentPage() + '-page-intro']);

    // About page tagline
    setText('about-tagline', map['about-page-intro']);
  }

  // ── IMAGES ──────────────────────────────────────────
  async function loadImages() {
    const data = await sbFetch('site_images', 'select=image_key,image_url');
    data.forEach(row => {
      if (!row.image_url) return;
      const byId = document.getElementById(row.image_key);
      if (byId && byId.tagName === 'IMG') {
        byId.src = row.image_url;
        byId.style.background = 'none';
        byId.style.minHeight = 'auto';
      }
      const byData = document.querySelector(`img[data-book="${row.image_key}"]`);
      if (byData) {
        byData.src = row.image_url;
        const ph = byData.nextElementSibling;
        if (ph && ph.classList.contains('book-cover-placeholder')) ph.style.display = 'none';
      }
    });
  }

  // ── TESTIMONIALS ────────────────────────────────────
  async function loadTestimonials() {
    const container = document.getElementById('testimonials-dynamic');
    if (!container) return;

    // Try with is_active filter first, fall back to all if empty
    let data = await sbFetch('testimonials', 'select=*&is_active=eq.true&order=sort_order.asc');
    if (!data.length) {
      data = await sbFetch('testimonials', 'select=*&order=sort_order.asc');
    }
    if (!data.length) return;

    container.innerHTML = data.map(t => `
      <div class="testimonial">
        <p>"${t.quote}"</p>
        <p class="testimonial-attr">
          ${t.author_name ? '<strong>' + t.author_name + '</strong> &nbsp;&middot;&nbsp; ' : ''}${t.author_context || ''}
        </p>
      </div>
    `).join('');
    triggerReveal(container);
  }

  // ── PROJECTS ────────────────────────────────────────
  async function loadProjects() {
    const data = await sbFetch('projects', 'select=*&is_active=eq.true&order=sort_order.asc');
    if (!data.length) return;

    const homeList = document.getElementById('projects-list-dynamic') || document.querySelector('.project-list');
    if (homeList) {
      homeList.innerHTML = data.map((p, i) => `
        <div class="project-entry reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
          <span class="project-entry-label">${p.category || ''}</span>
          <div class="project-entry-name">${p.name}<small>${p.short_desc || ''}</small></div>
          <a href="${p.link || '#'}" target="_blank" rel="noopener" class="btn btn-ghost">Visit &#8599;</a>
        </div>
      `).join('');
      triggerReveal(homeList);
    }

    const projPage = document.getElementById('projects-page-dynamic');
    if (projPage) {
      projPage.innerHTML = data.map((p, i) => buildProjectBlock(p, i)).join('');
      triggerReveal(projPage);
      return;
    }
    if (currentPage() === 'projects') {
      const hero = document.querySelector('.page-hero');
      if (hero) {
        const wrap = document.createElement('div');
        wrap.id = 'projects-page-dynamic';
        wrap.innerHTML = data.map((p, i) => buildProjectBlock(p, i)).join('');
        hero.insertAdjacentElement('afterend', wrap);
        triggerReveal(wrap);
      }
    }
  }

  function buildProjectBlock(p) {
    return `
      <div class="project-block">
        <div class="project-block-inner">
          <div class="project-img">
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}"/>`
              : `<div style="width:100%;height:100%;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--border)">${(p.name||'').substring(0,2)}</div>`
            }
          </div>
          <div class="reveal">
            <span class="project-category">${p.category || ''}</span>
            <h2 class="project-name">${p.name}</h2>
            <p class="project-desc">${p.full_desc || p.short_desc || ''}</p>
            <a href="${p.link || '#'}" target="_blank" rel="noopener" class="btn btn-dark">Visit ${p.name} &#8599;</a>
          </div>
        </div>
      </div>
    `;
  }

  // ── BOOKS ───────────────────────────────────────────
  async function loadBooks() {
    const data = await sbFetch('books', 'select=*&order=sort_order.asc');
    if (!data.length) return;
    const grid = document.getElementById('books-grid-dynamic') || document.querySelector('.books-grid');
    if (!grid) return;
    grid.innerHTML = data.map((book, i) => `
      <div class="book-card reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
        <div class="book-cover">
          ${book.cover_url
            ? `<img src="${book.cover_url}" alt="${book.title} cover"/>`
            : `<div class="book-cover-placeholder">${book.title}</div>`
          }
        </div>
        <div class="book-body">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-publisher">${book.publisher || 'Alamoja Books'}${book.year ? ' · ' + book.year : ''}</p>
        </div>
        <div class="book-footer">
          ${book.is_available && book.buy_url
            ? `<a href="${book.buy_url}" target="_blank" rel="noopener" class="btn btn-terra" style="width:100%;justify-content:center">Buy Now</a>`
            : `<button class="btn btn-muted" style="width:100%;justify-content:center">Coming Soon</button>`
          }
        </div>
      </div>
    `).join('');
    triggerReveal(grid);
  }

  // ── MEDIA ───────────────────────────────────────────
  async function loadMedia() {
    const data = await sbFetch('media_coverage', 'select=*&order=sort_order.asc');
    if (!data.length) return;
    const grid = document.getElementById('media-grid-dynamic') || document.querySelector('.media-grid');
    if (!grid) return;
    grid.innerHTML = data.map((m, i) => `
      <div class="media-card reveal${i % 2 !== 0 ? ' reveal-delay-1' : ''}" data-type="${m.type || 'feature'}">
        <p class="media-card-type">${m.type || ''}</p>
        <h2 class="media-card-title">${m.title}</h2>
        <p class="media-card-outlet">${m.outlet || ''}</p>
        <p class="media-card-desc">${m.description || 'Description coming soon.'}</p>
        <div class="media-card-footer">
          <span class="media-card-date">${m.coverage_date || 'Date to be confirmed'}</span>
          <a href="${m.link || '#'}" target="_blank" rel="noopener" class="btn btn-ghost">Read &#8599;</a>
        </div>
      </div>
    `).join('');
    triggerReveal(grid);
  }

  // ── BLOG ────────────────────────────────────────────
  async function loadBlogPosts() {
    const data = await sbFetch('blog_posts', 'select=id,title,excerpt,category,featured_image_url,published_at&is_published=eq.true&order=published_at.desc');
    const container = document.getElementById('blog-posts-dynamic');
    if (!container) return;
    if (!data.length) return;

    // Hide empty state
    const emptyState = container.querySelector('.blog-empty');
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = data.map(function(post, i) {
      var date = post.published_at ? new Date(post.published_at) : null;
      var dateStr = date ? date.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) : '';
      var postUrl = 'post.html?id=' + post.id;
      return '<a href="' + postUrl + '" class="blog-card reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i, 4) : '') + '">' +
        '<div class="blog-card-img">' +
          (post.featured_image_url
            ? '<img src="' + post.featured_image_url + '" alt="' + post.title + '" loading="lazy"/>'
            : '<div class="blog-card-img-placeholder">' + ((post.title || '').charAt(0)) + '</div>'
          ) +
        '</div>' +
        '<div class="blog-card-body">' +
          '<div class="blog-card-meta">' +
            (post.category ? '<span class="blog-card-cat">' + post.category + '</span>' : '') +
            (dateStr ? '<span class="blog-card-date">' + dateStr + '</span>' : '') +
          '</div>' +
          '<h2 class="blog-card-title">' + post.title + '</h2>' +
          (post.excerpt ? '<p class="blog-card-excerpt">' + post.excerpt + '</p>' : '') +
          '<div class="blog-card-footer"><span class="blog-read-more">Read post &rarr;</span></div>' +
        '</div>' +
        '</a>';
    }).join('');
    triggerReveal(container);
  }
  // ── REVEAL ──────────────────────────────────────────
  function triggerReveal(container) {
    const els = container.querySelectorAll('.reveal');
    if (window._revealObserver) {
      els.forEach(el => window._revealObserver.observe(el));
    } else {
      els.forEach(el => el.classList.add('visible'));
    }
  }

  // ── RUN ─────────────────────────────────────────────
  function run() {
    const page = currentPage();
    loadPageContent();
    loadImages();
    // Load testimonials whenever the container exists on the page
    if (document.getElementById('testimonials-dynamic')) loadTestimonials();
    if (page === 'home' || page === 'projects') loadProjects();
    if (page === 'publications') loadBooks();
    if (page === 'media') loadMedia();
    if (page === 'blog') loadBlogPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
