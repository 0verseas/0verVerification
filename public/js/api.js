const API = (function () {
  const baseUrl = env.baseUrl;

  function login(username, password) {
    const data = {username, password};
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
    //isLogin
  }
})();
