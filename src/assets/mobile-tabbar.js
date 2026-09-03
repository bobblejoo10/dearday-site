// 디어데이클래스 · 모바일 하단 메뉴의 [더보기] 시트입니다.
// 페이지 안에 그대로 있던 것을 옮겨왔습니다. 내용은 손대지 않았습니다.
(function(){
  var btn=document.getElementById('mtMoreBtn'), sheet=document.getElementById('mtMoreSheet');
  if(!btn||!sheet) return;
  function closeSheet(){ sheet.classList.remove('open'); sheet.hidden=true; btn.setAttribute('aria-expanded','false'); document.body.classList.remove('more-open'); }
  function openSheet(){ sheet.hidden=false; requestAnimationFrame(function(){ sheet.classList.add('open'); }); btn.setAttribute('aria-expanded','true'); document.body.classList.add('more-open'); }
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    if(sheet.classList.contains('open')) closeSheet(); else openSheet();
  });
  document.addEventListener('click',function(e){
    if(!sheet.hidden && !sheet.contains(e.target) && e.target!==btn) closeSheet();
  });
  addEventListener('keydown',function(e){ if(e.key==='Escape') closeSheet(); });
})();
