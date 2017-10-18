const app = (function () {

  /**
   * cache DOM
   */


  /**
   * init
   */

  _init();

  /**
   * functions
   */

  // init
  function _init() {
    API.isLogin().then(({data, statusCode}) => {
      if (statusCode == 200) {
        // 確認有登入，init 頁面

      } else if (statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        console.log('GG');
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  return {

  }

})();
