// 디어데이클래스 · [맨 위로] 단추입니다.
// 페이지 안에 그대로 있던 것을 옮겨왔습니다. 내용은 손대지 않았습니다.
(function(){
  var topFab=document.getElementById('topFab');
  if(!topFab) return;
  topFab.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });

  var heroEl=document.querySelector('.hero, .hero-detail, .page-head');
  if(heroEl){
    var toggleFabShow=function(){
      var show=window.scrollY>=heroEl.offsetHeight-60;
      topFab.classList.toggle('show', show);
    };
    toggleFabShow();
    window.addEventListener('scroll',toggleFabShow,{passive:true});
    window.addEventListener('resize',toggleFabShow);
  }
})();
