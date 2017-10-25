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

  // 審核單位登出
  function logout() {
    const request = fetch(`${baseUrl}/office/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    return _requestHandle(request);
  }

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

  // 取得學生報名資料
  function getStudentData(userId = '') {
    const request = fetch(`${baseUrl}/office/students/${userId}`, {
      method: 'GET',
      credentials: 'include'
    });

    return _requestHandle(request);
  }

  // 上傳
  function uploadStudentEducationFile(userId = '', type = '', data) {
    const request = fetch(`${baseUrl}/office/students/${userId}/${type}`, {
      method: 'POST',
      body: data,
      credentials: 'include'
    });

    // 不管哪種 type，都直接存到 data 中
    return _requestHandle(request).then(response => {
      if (response.data[`student_${type}`]) {
        response.data = response.data[`student_${type}`];
      }

      return response;
    });
  }

  // 刪除學生文件
  function deleteStudentEducationFile(userId = '', type = '', fileName = '') {
    const request = fetch(`${baseUrl}/office/students/${userId}/${type}/${fileName}`, {
      method: 'DELETE',
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

  // 審核學生
  function verifyStudent(userId, verificationInfo, applyWaySelect) {
    const data = {verified_memo: verificationInfo, verified_confirmation: true, apply_way_confirmation: applyWaySelect};
    console.log(data);
    const request = fetch(`${baseUrl}/office/students/${userId}/verified`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include'
    });

    return _requestHandle(request);
  }

  // http request 的中介處理
  function _requestHandle(request) {
    return request.then(fetchResponse => {
      return fetchResponse.json().then(data => {
        return {
          ok: fetchResponse.ok,
          data,
          statusCode: fetchResponse.status
        };
      }).then(response => {
        // 錯誤時的處理

        // 沒錯閃邊去
        if (response.ok) {
          return response;
        }

        // 設定兩種錯誤類型（單行 string 跟原始 string array）
        response.singleErrorMessage = response.data.messages.join(',');
        response.errorMessages = response.data.messages;

        return response;
      });
    })
  }

  // 拿到該學生的成績採計方式
  function getApplyWays (userId) {

  }

  function setApplyWay (userId, applyWay) {

  }

  return {
    login,
    logout,
    isLogin,
    getStudentData,
    deleteStudentEducationFile,
    getConfirmedStudentList,
    uploadStudentEducationFile,
    verifyStudent,
    getApplyWays,
    setApplyWay
  }
})();
