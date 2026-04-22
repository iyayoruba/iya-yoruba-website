(function(){
  var h=new Date().getHours();
  var en=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  var yo=h<12?'Ẹ káàárọ̀':h<17?'Ẹ káàsán':'Ẹ káàlẹ̀';
  var el=document.getElementById('greeting');
  if(el)el.innerHTML=en+'. &nbsp;<em>'+yo+'.</em>';
})();
(function(){
  var els=document.querySelectorAll('.reveal');
  if(!els.length)return;
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.1});
  els.forEach(function(el){io.observe(el);});
})();
(function(){
  var params=new URLSearchParams(window.location.search);
  if(params.get('edit')!=='1')return;
  var token=sessionStorage.getItem('iya_admin_token');
  if(!token){window.location.href='/admin/index.html?redirect='+encodeURIComponent(window.location.href);return;}
  document.querySelectorAll('[data-editable]').forEach(function(el){
    el.contentEditable='true';
    el.style.outline='2px dashed #A0522D';
    el.style.minHeight='1em';
    el.style.cursor='text';
  });
  var bar=document.createElement('div');
  bar.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#2C1810;color:#fff;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;z-index:9999;font-family:DM Sans,sans-serif;font-size:.875rem;';
  bar.innerHTML='<span>Edit mode — click any highlighted area to edit text</span><div style="display:flex;gap:.75rem;"><button id="save-btn" style="background:#A0522D;color:#fff;border:none;padding:.5rem 1.25rem;cursor:pointer;border-radius:2px;font-size:.825rem;">Save Changes</button><button id="cancel-btn" style="background:transparent;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.2);padding:.5rem 1.25rem;cursor:pointer;border-radius:2px;font-size:.825rem;">Exit</button></div>';
  document.body.appendChild(bar);
  document.getElementById('cancel-btn').addEventListener('click',function(){window.location.href=window.location.pathname;});
  document.getElementById('save-btn').addEventListener('click',function(){
    var btn=this;btn.textContent='Saving...';btn.disabled=true;
    var payload={};
    document.querySelectorAll('[data-editable]').forEach(function(el){payload[el.dataset.editable]=el.innerHTML;});
    fetch('/api/save-content',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({page:document.body.dataset.page,content:payload})})
    .then(function(r){return r.json();})
    .then(function(){btn.textContent='Saved!';btn.style.background='#2E7D32';setTimeout(function(){window.location.href=window.location.pathname;},1200);})
    .catch(function(){btn.textContent='Error — try again';btn.style.background='#c0392b';btn.disabled=false;});
  });
})();
