const API = (function () {
  const baseUrl = env.baseUrl;

  // 審核單位登入
  function login(username, password) {
    const data = {username, password: sha256(password)};

    const request = fetch(`${baseUrl}/office/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    return _requestHandle(request);
  }

  /*
  // 驗證審核單位是否登入
  function isLogin() {
    const request = fetch(`${baseUrl}/office/login`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    return _requestHandle(request);
  }
  */

  // 取得學生報名資料
  function getStudentData(userId = '') {
    const request = fetch(`${baseUrl}/office/students/${userId}`, {
      method: 'GET',
      credentials: 'include'
    });

    return _requestHandle(request);
  }

  // 取得已審核學生清單
  function getConfirmedStudentList() {
    const request = fetch(`${baseUrl}/students?status=confirmed`, {
      method: 'GET',
      credentials: 'include'
    });

    return _requestHandle(request);
  }

  // http request 的中介處理
  function _requestHandle(request) {
    return request.then(response => {
      return response.json().then(data => {
        return {
          data,
          statusCode: response.status
        };
      });
    })
  }

  return {
    login,
    //isLogin,
    getStudentData,
    getConfirmedStudentList,
  }
})();
