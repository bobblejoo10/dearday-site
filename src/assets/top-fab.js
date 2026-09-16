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
      // [+] 단추가 자리를 맞출 수 있게 몸통에도 표시를 남깁니다.
      // TOP 이 아직 안 나왔으면 [+] 가 그 자리로 내려갑니다.
      document.body.classList.toggle('topfab-on', show);
    };
    toggleFabShow();
    window.addEventListener('scroll',toggleFabShow,{passive:true});
    window.addEventListener('resize',toggleFabShow);
  }
})();
