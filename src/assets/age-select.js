// 디어데이클래스 · 신청 폼의 연령대 고르기 목록입니다.
// 페이지 안에 그대로 있던 것을 옮겨왔습니다. 내용은 손대지 않았습니다.
(function(){
  var cd=document.getElementById('afAgeCd');
  if(!cd) return;
  var btn=document.getElementById('afAgeBtn'), list=document.getElementById('afAgeList'),
      label=document.getElementById('afAgeLabel'), hiddenInput=document.getElementById('afAge'),
      form=document.getElementById('applyForm');
  function positionCdList(){
    var r=btn.getBoundingClientRect();
    list.style.left=r.left+'px';
    list.style.top=(r.bottom+6)+'px';
    list.style.width=r.width+'px';
  }
  function closeCd(){ cd.classList.remove('open'); list.hidden=true; btn.setAttribute('aria-expanded','false'); }
  function openCd(){ document.body.appendChild(list); positionCdList(); cd.classList.add('open'); list.hidden=false; btn.setAttribute('aria-expanded','true'); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); e.preventDefault(); if(list.hidden) openCd(); else closeCd(); });
  window.addEventListener('scroll',function(){ if(!list.hidden) positionCdList(); },true);
  window.addEventListener('resize',function(){ if(!list.hidden) positionCdList(); });
  list.querySelectorAll('li').forEach(function(li){
    li.addEventListener('click',function(e){
      e.stopPropagation();
      hiddenInput.value=li.getAttribute('data-value');
      label.textContent=li.textContent;
      btn.classList.add('has-value');
      list.querySelectorAll('li.sel').forEach(function(o){o.classList.remove('sel');});
      li.classList.add('sel');
      closeCd();
    });
  });
  document.addEventListener('click',function(e){ if(!cd.contains(e.target) && !list.contains(e.target)) closeCd(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeCd(); });
  if(form){
    form.addEventListener('reset',function(){
      label.textContent='연령대 선택';
      btn.classList.remove('has-value');
      hiddenInput.value='';
      list.querySelectorAll('li.sel').forEach(function(o){o.classList.remove('sel');});
      closeCd();
    });
  }
  var afModalEl=document.getElementById('applyModal');
  if(afModalEl && window.MutationObserver){
    new MutationObserver(function(){ if(afModalEl.hidden) closeCd(); }).observe(afModalEl,{attributes:true,attributeFilter:['hidden']});
  }
})();
