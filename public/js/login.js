const app = (function () {

  /**
   * cache DOM
   */

  const $loginAlert = $('#login-alert');
  const $username = $('#username');
  const $password = $('#password');
  const $loginBtn = $('#login-btn');
  const $identifyingCanvas = $('#identifyingCanvas')
	const $identifyingCode = $('#identifyingCode')
  var identifyingCode = '';
  
  $identifyingCanvas.on('click',generateCode);

  /**
   * init
   */

  _init();

  /**
   * functions
   */

  function _init() {
    generateCode();
  }

  function login(username, password) {

    //確認驗證碼是否一致  不區分大小寫
		const code = $identifyingCode.val();
		if(code.toUpperCase() !== identifyingCode){
			alert('驗證碼不正確');
			generateCode();
			return;
		}
		generateCode();

    $loginAlert.prop('hidden', true);
    API.login(username, password).then(response => {
      if (response.statusCode == 200) {
        // 登入成功，跳轉至首頁
        window.location.href = './index.html';
        console.log(response);
        alert('登入成功！');
      } else if (response.statusCode == 401) {
        // 驗證失敗，清除密碼並顯示提示
        $password.prop('value', '');
        $username.addClass('is-invalid');
        $password.addClass('is-invalid');
        $loginAlert.prop('hidden', false);
      } else {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }
    }).catch((error) => {
      console.log(error);
    });
  }

   //產生圖形驗證碼
	function generateCode(){

		//隨機產生數字
		function randomNumber(min, max){
			return Math.floor(Math.random()*(max-min)+min);  //隨機產生一個在min~max之間的整數
		}
	
		//隨機顏色色碼
		function randomColor(min, max){
			
			let r = randomNumber(min, max);
			let g = randomNumber(min, max);
			let b = randomNumber(min, max);
	
			return "rgb("+r+","+g+","+b+")";
		}

		//取得畫布物件屬性
		let canvas = document.getElementById('identifyingCanvas');
		let width = canvas.width;
		let height = canvas.height;
		let context = canvas.getContext('2d');

		//基礎設定 設置文本基線在底部  背景顏色  方形繪製
		context.textBaseline = 'bottom';
		context.fillStyle = randomColor(200,240);
		context.fillRect(0,0,width,height);

		//隨機字母表   去除相似的 1 I   0 O   
		let codeList = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

		let codeString = '';

		//隨機產生4個字母
		for(let i = 0; i<4 ; i++){
			let code = codeList[randomNumber(0,codeList.length)];
			codeString += code;

			context.fillStyle = randomColor(50,160);
			context.font = randomNumber(25,30)+ 'px Arial';  //字體大小25~30隨機

			let x = 10+i*25;
			let y = randomNumber(30,35);  //隨機高度
			let angle = randomNumber(-30,30);  //隨機旋轉角度

			context.translate(x,y);  //移動繪製初始位置
			context.rotate(angle*Math.PI/180);  //旋轉繪製初始位置

			context.fillText(code,0,0);

			context.rotate(-angle*Math.PI/180);  //返回繪製初始位置
			context.translate(-x,-y);  //返回繪製初始位置
		}

		//產生干擾線
		for(let i =0;i<2;i++){
			context.strokeStyle = randomColor(40,180);

			context.beginPath();

			context.moveTo( randomNumber(0,width), randomNumber(0,height));

			context.lineTo( randomNumber(0,width), randomNumber(0,height));

			context.stroke();
		}

		//產生干擾點
		for(let i=0 ; i<50 ; i++){
			context.fillStyle = randomColor(0,255);

			context.beginPath();
			
			context.arc( randomNumber(0,width), randomNumber(0,height),1,0,2*Math.PI);

			context.fill();
		}

		//紀錄驗證碼
		identifyingCode = codeString;
	}

  return {
    login
  }

})();
