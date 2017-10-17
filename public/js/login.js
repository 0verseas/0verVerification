const app = (function () {

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

  _init();

  /**
   * functions
   */

  function _init() {

  }

  function login(username, password) {
    $loginAlert.prop('hidden', true);
    API.login(username, password).then(({data, statusCode}) => {
      if (statusCode == 200) {
        // 登入成功，跳轉至首頁
        window.location.href = './index.html';
      } else if (statusCode == 401) {
        // 驗證失敗，清除密碼並顯示提示
        $password.prop('value', '');
        $username.addClass('is-invalid');
        $password.addClass('is-invalid');
        $loginAlert.prop('hidden', false);
      } else {
        console.log('GG');
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  return {
    login
  }

})();
