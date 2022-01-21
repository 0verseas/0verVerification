const app = (function () {

	// 引入 reCAPTCHA 的 JS 檔案
    var s = document.createElement('script');
    let src = 'https://www.google.com/recaptcha/api.js?render=' + env.reCAPTCHA_site_key;
    s.setAttribute('src', src);
    document.body.appendChild(s);

	/**
	 * cache DOM
	 */

	const $loginAlert = $('#login-alert');
	const $username = $('#username');
	const $password = $('#password');
	const $loginBtn = $('#login-btn');

	/**
	 * init
	 */


	/**
	 * functions
	 */
	function login(username, password) {

		$loginAlert.prop('hidden', true);
		let google_recaptcha_token = '';
		grecaptcha.ready(function() {
			grecaptcha.execute(env.reCAPTCHA_site_key, {
			action: 'VerifyLogin'
			}).then(function(token) {
				// token = document.getElementById('btn-login').value
				google_recaptcha_token = token;
			}).then(function(){
				API.login(username, password, google_recaptcha_token).then(response => {
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
			});
		});
	}

	return {
		login
	}

})();
