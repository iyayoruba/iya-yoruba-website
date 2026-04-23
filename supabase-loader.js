// ── Supabase public content loader ───────────────────
(function () {
  const SUPABASE_URL = 'https://msrfitvtiyfukgnzhqrs.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcmZpdHZ0aXlmdWtnbnpocXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTA0NjgsImV4cCI6MjA5MjQ2NjQ2OH0.GRsF5TyNmWNXMlGhzDlrQ3YJeuUFQjJbHgEtZOUJsgQ';

  // Core fetch — returns data array or empty array on any failure
  async function sbFetch(table, params) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${params}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) {
        console.warn('[Supabase] fetch error', table, res.status, await res.text());
        return [];
      }
      return await res.json();
    } catch (e) {
      console.warn('[Supabase] network error', table, e);
      return [];
    }
  }

  // Detect current page from URL
  function currentPage() {
    const p = window.location.pathname.split('/').pop() || 'index.html';
    if (p === '' || p === 'index.html') return 'home';
    if (p === 'projects.html') return 'projects';
    if (p === 'publications.html') return 'publications';
    if (p === 'media.html') return 'media';
    if (p === 'blog.html') return 'blog';
    return 'other';
  }

  // ── IMAGES (all pages) ──────────────────────────────
  async function loadImages() {
    const data = await sbFetch('site_images', 'select=image_key,image_url');
    data.forEach(row => {
      if (!row.image_url) return;
      // Match img by id
      const byId = document.getElementById(row.image_key);
      if (byId && byId.tagName === 'IMG') {
        byId.src = row.image_url;
        byId.style.background = 'none';
        byId.style.minHeight = 'auto';
      }
      // Match img by data-book
      const byData = document.querySelector(`img[data-book="${row.image_key}"]`);
      if (byData) {
        byData.src = row.image_url;
        const ph = byData.nextElementSibling;
        if (ph && ph.classList.contains('book-cover-placeholder')) ph.style.display = 'none';
      }
    });
  }

  // ── BIO (home + about) ──────────────────────────────
  async function loadBio() {
    const el = document.getElementById('homepage-bio');
    if (!el) return;
    const data = await sbFetch('page_content', 'select=value&content_key=eq.homepage-bio');
    if (data[0] && data[0].value) el.textContent = data[0].value;
  }

  // ── FOOTER EMAIL (all pages) ────────────────────────
  async function loadFooterEmail() {
    const links = document.querySelectorAll('.footer-email a');
    if (!links.length) return;
    const data = await sbFetch('page_content', 'select=value&content_key=eq.footer-email');
    if (data[0] && data[0].value) {
      links.forEach(a => {
        a.href = 'mailto:' + data[0].value;
        a.textContent = data[0].value;
      });
    }
  }

  // ── PROJECTS (home + projects page) ────────────────
  async function loadProjects() {
    const data = await sbFetch('projects', 'select=*&is_active=eq.true&order=sort_order.asc');
    if (!data.length) return;

    // Homepage list — look for existing div or create inside .project-list
    const homeList = document.getElementById('projects-list-dynamic')
      || document.querySelector('.project-list');
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

    // Projects page — look for dynamic div or inject after page-hero
    const projPage = document.getElementById('projects-page-dynamic');
    if (projPage) {
      projPage.innerHTML = data.map((p, i) => buildProjectBlock(p, i)).join('');
      triggerReveal(projPage);
      return;
    }
    // Fallback: if on projects page and no dynamic div, inject after page-hero
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

  function buildProjectBlock(p, i) {
    return `
      <div class="project-block">
        <div class="project-block-inner">
          <div class="project-img">
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}"/>`
              : `<div style="width:100%;height:100%;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--border)">${(p.name || '').substring(0, 2)}</div>`
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

  // ── BOOKS (publications page) ───────────────────────
  async function loadBooks() {
    const data = await sbFetch('books', 'select=*&order=sort_order.asc');
    if (!data.length) return;

    const grid = document.getElementById('books-grid-dynamic')
      || document.querySelector('.books-grid');
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

  // ── MEDIA (media page) ──────────────────────────────
  async function loadMedia() {
    const data = await sbFetch('media_coverage', 'select=*&order=sort_order.asc');
    if (!data.length) return;

    const grid = document.getElementById('media-grid-dynamic')
      || document.querySelector('.media-grid');
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

  // ── BLOG POSTS (blog page) ──────────────────────────
  async function loadBlogPosts() {
    const data = await sbFetch('blog_posts', 'select=*&is_published=eq.true&order=published_at.desc');
    if (!data.length) return;

    const container = document.getElementById('blog-posts-dynamic');
    const emptyState = document.querySelector('.blog-empty');
    if (emptyState) emptyState.style.display = 'none';

    const target = container || (() => {
      const el = document.createElement('div');
      el.id = 'blog-posts-dynamic';
      const section = document.querySelector('.section');
      if (section) section.appendChild(el);
      return el;
    })();

    target.innerHTML = data.map(post => `
      <article class="card reveal" style="margin-bottom:1rem">
        <p style="font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--terra);margin-bottom:.5rem">${post.category || ''}</p>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;margin-bottom:.75rem">${post.title}</h2>
        <div style="font-size:.95rem;line-height:1.8;color:var(--brown-mid)">${post.content || ''}</div>
        <p style="font-size:.78rem;color:var(--muted);margin-top:1rem">
          ${post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
      </article>
    `).join('');
    triggerReveal(target);
  }

  // ── REVEAL helper ───────────────────────────────────
  function triggerReveal(container) {
    const els = container.querySelectorAll('.reveal');
    if (!els.length) return;
    if (window._revealObserver) {
      els.forEach(el => window._revealObserver.observe(el));
    } else {
      // Fallback: just make them visible
      els.forEach(el => el.classList.add('visible'));
    }
  }

  // ── RUN ─────────────────────────────────────────────
  function run() {
    const page = currentPage();
    loadImages();
    loadBio();
    loadFooterEmail();
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
