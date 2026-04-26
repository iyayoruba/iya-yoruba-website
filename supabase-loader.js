// ── Supabase public content loader ───────────────────
(function () {
  var SUPABASE_URL = 'https://msrfitvtiyfukgnzhqrs.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcmZpdHZ0aXlmdWtnbnpocXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTA0NjgsImV4cCI6MjA5MjQ2NjQ2OH0.GRsF5TyNmWNXMlGhzDlrQ3YJeuUFQjJbHgEtZOUJsgQ';

  function sbFetch(table, params) {
    var url = SUPABASE_URL + '/rest/v1/' + table + '?' + params;
    return fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Accept': 'application/json'
      }
    })
    .then(function(res) {
      if (!res.ok) {
        console.warn('[Supabase] ' + table + ' status ' + res.status);
        return [];
      }
      return res.json();
    })
    .catch(function(e) {
      console.warn('[Supabase] fetch error:', e);
      return [];
    });
  }

  function reveal(container) {
    if (!container) return;
    var els = container.querySelectorAll('.reveal');
    if (window._revealObserver) {
      els.forEach(function(el) { window._revealObserver.observe(el); });
    } else {
      els.forEach(function(el) { el.classList.add('visible'); });
    }
  }

  // ── PAGE CONTENT ─────────────────────────────────────
  function loadPageContent() {
    sbFetch('page_content', 'select=content_key,value').then(function(data) {
      if (!data || !data.length) return;
      var map = {};
      data.forEach(function(row) { map[row.content_key] = row.value; });

      // Footer tagline — all pages
      var taglineEl = document.getElementById('footer-tagline-text');
      if (taglineEl && map['footer-tagline']) taglineEl.textContent = map['footer-tagline'];

      // Footer email — all pages
      var footerEmails = document.querySelectorAll('.footer-email a');
      if (footerEmails.length && map['footer-email']) {
        footerEmails.forEach(function(a) {
          a.href = 'mailto:' + map['footer-email'];
          a.textContent = map['footer-email'];
        });
      }

      // Homepage specific
      var alias = document.getElementById('hero-alias-text');
      if (alias && map['hero-alias']) alias.textContent = map['hero-alias'];

      var roles = document.getElementById('hero-roles-text');
      if (roles && map['hero-roles']) roles.textContent = map['hero-roles'];

      var vertical = document.getElementById('hero-vertical-text');
      if (vertical && map['hero-tagline']) vertical.textContent = map['hero-tagline'];

      var bio = document.getElementById('homepage-bio');
      if (bio && map['homepage-bio']) bio.textContent = map['homepage-bio'];

      var csHead = document.getElementById('contact-strip-heading');
      if (csHead && map['contact-strip-heading']) csHead.textContent = map['contact-strip-heading'];

      var csText = document.getElementById('contact-strip-text');
      if (csText && map['contact-strip-text']) csText.textContent = map['contact-strip-text'];

      var csBtn = document.getElementById('contact-strip-btn');
      if (csBtn && map['contact-strip-email']) csBtn.href = 'mailto:' + map['contact-strip-email'];

      // Page intro on inner pages
      var introEl = document.getElementById('page-intro-text');
      if (introEl) {
        var path = window.location.pathname.replace('.html','').split('/').pop() || 'index';
        var key = path + '-page-intro';
        if (map[key]) introEl.textContent = map[key];
      }
    });
  }

  // ── IMAGES ───────────────────────────────────────────
  function loadImages() {
    sbFetch('site_images', 'select=image_key,image_url').then(function(data) {
      if (!data || !data.length) return;
      data.forEach(function(row) {
        if (!row.image_url) return;
        var el = document.getElementById(row.image_key);
        if (el && el.tagName === 'IMG') {
          el.src = row.image_url;
          el.style.background = 'none';
          el.style.minHeight = 'auto';
        }
      });
    });
  }

  // ── TESTIMONIALS ─────────────────────────────────────
  function loadTestimonials() {
    var container = document.getElementById('testimonials-dynamic');
    if (!container) return;

    sbFetch('testimonials', 'select=id,quote,author_name,author_context,is_active,sort_order&order=sort_order.asc')
    .then(function(data) {
      if (!data || !data.length) return;

      // Show active ones, or all if none are marked active
      var active = data.filter(function(t) { return t.is_active !== false; });
      var toShow = active.length ? active : data;

      container.innerHTML = toShow.map(function(t) {
        return '<div class="testimonial">' +
          '<p>"' + (t.quote || '') + '"</p>' +
          '<p class="testimonial-attr">' +
            (t.author_name ? '<strong>' + t.author_name + '</strong> &nbsp;&middot;&nbsp; ' : '') +
            (t.author_context || '') +
          '</p>' +
        '</div>';
      }).join('');
      reveal(container);
    });
  }

  // ── BOOKS ────────────────────────────────────────────
  function loadBooks() {
    var grid = document.getElementById('books-grid-dynamic');
    if (!grid) return;

    sbFetch('books', 'select=id,title,publisher,year,cover_url,buy_url,is_available,sort_order&order=sort_order.asc')
    .then(function(data) {
      if (!data || !data.length) return;
      grid.innerHTML = data.map(function(book, i) {
        return '<div class="book-card reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i,4) : '') + '">' +
          '<div class="book-cover">' +
            (book.cover_url
              ? '<img src="' + book.cover_url + '" alt="' + book.title + ' cover"/>'
              : '<div class="book-cover-placeholder">' + book.title + '</div>') +
          '</div>' +
          '<div class="book-body">' +
            '<h3 class="book-title">' + book.title + '</h3>' +
            '<p class="book-publisher">' + (book.publisher || 'Alamoja Books') + (book.year ? ' · ' + book.year : '') + '</p>' +
          '</div>' +
          '<div class="book-footer">' +
            (book.is_available && book.buy_url
              ? '<a href="' + book.buy_url + '" target="_blank" rel="noopener" class="btn btn-terra" style="width:100%;justify-content:center">Buy Now</a>'
              : '<button class="btn btn-muted" style="width:100%;justify-content:center">Coming Soon</button>') +
          '</div>' +
        '</div>';
      }).join('');
      reveal(grid);
    });
  }

  // ── PROJECTS ─────────────────────────────────────────
  function loadProjects() {
    // Homepage list
    var homeList = document.getElementById('projects-list-dynamic') || document.querySelector('.project-list');
    // Projects page
    var projPage = document.getElementById('projects-page-dynamic');

    if (!homeList && !projPage) return;

    sbFetch('projects', 'select=id,name,category,short_desc,full_desc,link,image_url,is_active,sort_order&is_active=eq.true&order=sort_order.asc')
    .then(function(data) {
      if (!data || !data.length) return;

      if (homeList) {
        homeList.innerHTML = data.map(function(p, i) {
          return '<div class="project-entry reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i,4) : '') + '">' +
            '<span class="project-entry-label">' + (p.category || '') + '</span>' +
            '<div class="project-entry-name">' + p.name + '<small>' + (p.short_desc || '') + '</small></div>' +
            '<a href="' + (p.link || '#') + '" target="_blank" rel="noopener" class="btn btn-ghost">Visit &#8599;</a>' +
          '</div>';
        }).join('');
        reveal(homeList);
      }

      if (projPage) {
        projPage.innerHTML = data.map(function(p, i) {
          return '<div class="project-block">' +
            '<div class="project-block-inner">' +
              '<div class="project-img">' +
                (p.image_url
                  ? '<img src="' + p.image_url + '" alt="' + p.name + '"/>'
                  : '<div style="width:100%;height:100%;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:3rem;color:var(--border)">' + (p.name||'').substring(0,2) + '</div>') +
              '</div>' +
              '<div class="reveal">' +
                '<span class="project-category">' + (p.category || '') + '</span>' +
                '<h2 class="project-name">' + p.name + '</h2>' +
                '<p class="project-desc">' + (p.full_desc || p.short_desc || '') + '</p>' +
                '<a href="' + (p.link || '#') + '" target="_blank" rel="noopener" class="btn btn-dark">Visit ' + p.name + ' &#8599;</a>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');
        reveal(projPage);
      }
    });
  }

  // ── MEDIA ────────────────────────────────────────────
  function loadMedia() {
    var grid = document.getElementById('media-grid-dynamic') || document.querySelector('.media-grid');
    if (!grid) return;

    sbFetch('media_coverage', 'select=id,type,title,outlet,description,coverage_date,link,sort_order&order=sort_order.asc')
    .then(function(data) {
      if (!data || !data.length) return;
      grid.innerHTML = data.map(function(m, i) {
        return '<div class="media-card reveal' + (i % 2 !== 0 ? ' reveal-delay-1' : '') + '" data-type="' + (m.type || 'feature') + '">' +
          '<p class="media-card-type">' + (m.type || '') + '</p>' +
          '<h2 class="media-card-title">' + m.title + '</h2>' +
          '<p class="media-card-outlet">' + (m.outlet || '') + '</p>' +
          '<p class="media-card-desc">' + (m.description || 'Description coming soon.') + '</p>' +
          '<div class="media-card-footer">' +
            '<span class="media-card-date">' + (m.coverage_date || 'Date to be confirmed') + '</span>' +
            '<a href="' + (m.link || '#') + '" target="_blank" rel="noopener" class="btn btn-ghost">Read &#8599;</a>' +
          '</div>' +
        '</div>';
      }).join('');
      reveal(grid);
    });
  }

  // ── BLOG POSTS ───────────────────────────────────────
  function loadBlogPosts() {
    var container = document.getElementById('blog-posts-dynamic');
    if (!container) return;

    sbFetch('blog_posts', 'select=id,title,excerpt,category,featured_image_url,published_at&is_published=eq.true&order=published_at.desc')
    .then(function(data) {
      if (!data || !data.length) return;

      // Hide empty state
      var empty = container.querySelector('.blog-empty');
      if (empty) empty.style.display = 'none';

      container.innerHTML = data.map(function(post, i) {
        var date = post.published_at ? new Date(post.published_at) : null;
        var dateStr = date ? date.toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) : '';
        var postUrl = 'post.html?id=' + post.id;
        return '<a href="' + postUrl + '" class="blog-card reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i,4) : '') + '">' +
          '<div class="blog-card-img">' +
            (post.featured_image_url
              ? '<img src="' + post.featured_image_url + '" alt="' + post.title + '" loading="lazy"/>'
              : '<div class="blog-card-img-placeholder">' + ((post.title||'').charAt(0)) + '</div>') +
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
      reveal(container);
    });
  }

  // ── RUN — container-based, no page detection ─────────
  function run() {
    // These run on every page
    loadPageContent();
    loadImages();

    // These run only if their container exists on the page
    if (document.getElementById('testimonials-dynamic')) loadTestimonials();
    if (document.getElementById('books-grid-dynamic') || document.querySelector('.books-grid')) loadBooks();
    if (document.getElementById('projects-list-dynamic') || document.querySelector('.project-list') || document.getElementById('projects-page-dynamic')) loadProjects();
    if (document.getElementById('media-grid-dynamic') || document.querySelector('.media-grid')) loadMedia();
    if (document.getElementById('blog-posts-dynamic')) loadBlogPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();
