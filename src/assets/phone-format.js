// 디어데이클래스 · 전화번호 칸에 하이픈을 넣어 줍니다.
// 페이지 안에 그대로 있던 것을 옮겨왔습니다. 내용은 손대지 않았습니다.
(function(){
  document.querySelectorAll('input[type="tel"]').forEach(function(el){
    el.addEventListener('input',function(){
      var d=this.value.replace(/[^0-9]/g,'').slice(0,11),v=d;
      if(d.length>3&&d.length<8) v=d.slice(0,3)+'-'+d.slice(3);
      else if(d.length>=8) v=(d.length<=10)?(d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6)):(d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7));
      this.value=v;
    });
  });
})();
