// Time-based greeting
(function(){
  var h = new Date().getHours();
  var en = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  var yo = h < 12 ? 'Ẹ káàárọ̀' : h < 17 ? 'Ẹ káàsán' : 'Ẹ káàlẹ̀';
  var el = document.getElementById('greeting');
  if (el) el.innerHTML = en + '. &nbsp;<em>' + yo + '.</em>';
})();

// Scroll reveal
(function(){
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function(el){ io.observe(el); });
})();

// Mobile nav
(function(){
  var btn = document.querySelector('.nav-hamburger');
  var mob = document.querySelector('.mobile-nav');
  if (!btn || !mob) return;
  btn.addEventListener('click', function(){
    mob.classList.toggle('open');
    document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
  });
  mob.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mob.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// Active nav link
(function(){
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item > a').forEach(function(a){
    var href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();

// Filter tabs
(function(){
  document.querySelectorAll('.filter-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      var parent = this.closest('.filter-tabs');
      parent.querySelectorAll('.filter-tab').forEach(function(t){ t.classList.remove('active'); });
      this.classList.add('active');
      var filter = this.dataset.filter;
      document.querySelectorAll('[data-type]').forEach(function(item){
        item.style.display = (filter === 'all' || item.dataset.type === filter) ? '' : 'none';
      });
    });
  });
})();
