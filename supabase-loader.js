// ── Supabase public content loader ───────────────────
// Loads dynamic content from Supabase into public pages
// Falls back gracefully if Supabase is unavailable

(function() {
  const SUPABASE_URL = 'https://msrfitvtiyfukgnzhqrs.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_E8Xtx3-pZKG-SKwCOJyWNg__QBOshKX';

  async function sbFetch(table, params) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
    try {
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Load images and apply to img tags with matching IDs
  async function loadImages() {
    const data = await sbFetch('site_images', 'select=image_key,image_url');
    if (!data) return;
    data.forEach(row => {
      if (!row.image_url) return;
      // Match by ID
      const el = document.getElementById(row.image_key);
      if (el && el.tagName === 'IMG') {
        el.src = row.image_url;
        el.style.background = 'none';
      }
      // Match by data-book attribute for book covers
      const byData = document.querySelector(`img[data-book="${row.image_key}"]`);
      if (byData) {
        byData.src = row.image_url;
        byData.style.display = 'block';
        const placeholder = byData.nextElementSibling;
        if (placeholder && placeholder.classList.contains('book-cover-placeholder')) {
          placeholder.style.display = 'none';
        }
      }
    });
  }

  // Load homepage bio
  async function loadBio() {
    const bioEl = document.getElementById('homepage-bio');
    if (!bioEl) return;
    const data = await sbFetch('page_content', "select=value&content_key=eq.homepage-bio");
    if (data && data[0] && data[0].value) bioEl.textContent = data[0].value;
  }

  // Load footer email
  async function loadFooterEmail() {
    const els = document.querySelectorAll('.footer-email a');
    if (!els.length) return;
    const data = await sbFetch('page_content', "select=value&content_key=eq.footer-email");
    if (data && data[0] && data[0].value) {
      els.forEach(el => {
        el.href = 'mailto:' + data[0].value;
        el.textContent = data[0].value;
      });
    }
  }

  // Load books on publications page
  async function loadBooks() {
    const grid = document.getElementById('books-grid-dynamic');
    if (!grid) return;
    const data = await sbFetch('books', 'select=*&order=sort_order');
    if (!data || !data.length) return;
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
          <p class="book-publisher">${book.publisher}${book.year ? ' · ' + book.year : ''}</p>
        </div>
        <div class="book-footer">
          ${book.is_available && book.buy_url
            ? `<a href="${book.buy_url}" target="_blank" rel="noopener" class="btn btn-terra" style="width:100%;justify-content:center">Buy Now</a>`
            : `<button class="btn btn-muted" style="width:100%;justify-content:center">Coming Soon</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Load projects on projects page and homepage
  async function loadProjects() {
    // Homepage project list
    const homeList = document.getElementById('projects-list-dynamic');
    if (homeList) {
      const data = await sbFetch('projects', 'select=*&is_active=eq.true&order=sort_order');
      if (data && data.length) {
        homeList.innerHTML = data.map((p, i) => `
          <div class="project-entry reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
            <span class="project-entry-label">${p.category || ''}</span>
            <div class="project-entry-name">${p.name}<small>${p.short_desc || ''}</small></div>
            <a href="${p.link}" target="_blank" rel="noopener" class="btn btn-ghost">Visit &nearr;</a>
          </div>
        `).join('');
      }
    }

    // Projects page full blocks
    const projPage = document.getElementById('projects-page-dynamic');
    if (projPage) {
      const data = await sbFetch('projects', 'select=*&is_active=eq.true&order=sort_order');
      if (data && data.length) {
        projPage.innerHTML = data.map((p, i) => `
          <div class="project-block">
            <div class="project-block-inner">
              <div class="project-img">
                ${p.image_url
                  ? `<img src="${p.image_url}" alt="${p.name}"/>`
                  : '<div style="width:100%;height:100%;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:3rem;color:var(--border)">' + (p.name.substring(0,2)) + '</div>'
                }
              </div>
              <div class="reveal">
                <span class="project-category">${p.category || ''}</span>
                <h2 class="project-name">${p.name}</h2>
                <p class="project-desc">${p.full_desc || p.short_desc || ''}</p>
                <a href="${p.link}" target="_blank" rel="noopener" class="btn btn-dark">Visit ${p.name} &nearr;</a>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // Load media on media page
  async function loadMedia() {
    const grid = document.getElementById('media-grid-dynamic');
    if (!grid) return;
    const data = await sbFetch('media_coverage', 'select=*&order=sort_order');
    if (!data || !data.length) return;
    grid.innerHTML = data.map((m, i) => `
      <div class="media-card reveal${i % 2 !== 0 ? ' reveal-delay-1' : ''}" data-type="${m.type || 'feature'}">
        <p class="media-card-type">${m.type || ''}</p>
        <h2 class="media-card-title">${m.title}</h2>
        <p class="media-card-outlet">${m.outlet || ''}</p>
        <p class="media-card-desc">${m.description || 'Description coming soon.'}</p>
        <div class="media-card-footer">
          <span class="media-card-date">${m.coverage_date || 'Date to be confirmed'}</span>
          <a href="${m.link}" target="_blank" rel="noopener" class="btn btn-ghost">Read &nearr;</a>
        </div>
      </div>
    `).join('');
    // Re-run reveal observer for dynamically added elements
    if (window._revealObserver) {
      grid.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
    }
  }

  // Load blog posts on blog page
  async function loadBlogPosts() {
    const container = document.getElementById('blog-posts-dynamic');
    if (!container) return;
    const data = await sbFetch('blog_posts', 'select=*&is_published=eq.true&order=published_at.desc');
    if (!data || !data.length) return;
    // Hide empty state
    const emptyState = document.querySelector('.blog-empty');
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = data.map(post => `
      <article class="card reveal" style="margin-bottom:1rem">
        <p style="font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--terra);margin-bottom:.5rem">${post.category || ''}</p>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;margin-bottom:.75rem">${post.title}</h2>
        <div style="font-size:.95rem;line-height:1.8;color:var(--brown-mid)">${post.content || ''}</div>
        <p style="font-size:.78rem;color:var(--muted);margin-top:1rem">${post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) : ''}</p>
      </article>
    `).join('');
  }

  // Run all loaders
  document.addEventListener('DOMContentLoaded', () => {
    loadImages();
    loadBio();
    loadFooterEmail();
    loadBooks();
    loadProjects();
    loadMedia();
    loadBlogPosts();
  });

})();
