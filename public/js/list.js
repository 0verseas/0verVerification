const app = (function () {

  /**
   * cache DOM
   */

  const $oyvtpStudentsBody = $('#oyvtp-students-body');
  const $datepicker = $('#datepicker');

  const $downVerifiedListButton = $('#download-Verified-List');

  /**
   * init
   */

  let user;
  let students = [];

  // 設定日期選擇樣式
  $datepicker.datepicker({
    format: 'yyyy/mm/dd',
    weekStart: 0,
    todayBtn: true,
    language: 'zh-TW',
    todayHighlight: true
  });

  _init();

  /**
   * functions
   */

  // init
  function _init() {
    loading.start();

    API.isLogin().then(response => {
      if (response.ok) {
        user = response.data;
        // 確認有登入，init 頁面
        _getVerifiedStudents();
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        $originalImgModal.modal('hide');
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // 拿已審核學生清單
  function _getVerifiedStudents() {
    API.getVerifiedStudents().then(response => {
      if (response.ok) {
        students = response.data;

        // 分包 render
        _render($oyvtpStudentsBody, _sortList(students));
      } else if (response.statusCode === 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else if (response.statusCode === 403) {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
        // 跳轉至查詢頁
        window.location.href = './index.html';
      } else {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }

      loading.complete();
    });
  }

  // 排序已審核清單
  function _sortList(students = []) {
    return students.sort((a, b) => {
      // 按照審核時間排序（新的在前）
      return new Date(b.verified_at) - new Date(a.verified_at);
    });
  }

  // 過濾出某天的已審核清單
  function _filterListByDate(students = [], date) {
    // 容許 all
    if (date === 'all') {
      return students;
    }
    // 用年月日判斷
    return students.filter(student => {
      const verifiedDateObject = new Date(student.verified_at);
      var v_month;
      if (verifiedDateObject.getMonth()+1 < 10)
        v_month="0" + (verifiedDateObject.getMonth()+1).toString() ;
      else
        v_month=verifiedDateObject.getMonth()+1;
      var v_date;
      if (verifiedDateObject.getDate() < 10)
        v_date="0" + (verifiedDateObject.getDate()).toString() ;
      else
        v_date=verifiedDateObject.getDate();
      const verifiedDate = `${verifiedDateObject.getFullYear()}/${v_month}/${v_date}`;
      return verifiedDate === date;
    });
  }

  // render 資料
  function _render($body, students = [], hasApplyWay = false) {
    // 重置系所表格
    $body.html('');

    // 準備 data
    let result = ``;
    for (let student of students) {
      //https://date-fns.org/v1.29.0/docs/format  我們用得是v1.29.0版本 要記得看文件  大寫H才是 24小時制喔
      let verified_at = dateFns.format(student.verified_at, 'YYYY/MM/DD HH:mm:ss ');
      let name = encodeHtmlCharacters(student.name);  // 學生姓名
      let verified_memo = student.verified_memo!==null ? encodeHtmlCharacters(student.verified_memo) : '';
      result += `
        <tr>
          <td>${student.user_id}</td>
          <td>${verified_at}</td>
          <td>${name}</td>
          ${student.gender.toLowerCase() === 'm' ? '<td>男</td>' : '<td>女</td>'}
          <td>${student.birthday}</td>
          <td>${student.school_country_data.country}</td>
          <td>${student.overseas_student_id}</td>
          <td>${verified_memo}</td>
        </tr>
      `;
    }

    // render
    $body.html(result);
  }

  // 重新排 list
  function reloadList(date = 'all') {
    if (date === 'all') {
      $datepicker.val('');
    }

    _render($oyvtpStudentsBody, _sortList(_filterListByDate(students, date)));
  }

  function downloadVerifiedList() {
    window.location.href = `${env.baseUrl}/office/oyvtp-verified-list-file/`;
  }

  // 轉換一些敏感字元避免 XSS
  function encodeHtmlCharacters(bareString) {
    if (bareString === null) return '';
    return bareString.replace(/&/g, "&amp;")  // 轉換 &
      .replace(/</g, "&lt;").replace(/>/g, "&gt;")  // 轉換 < 及 >
      .replace(/'/g, "&apos;").replace(/"/g, "&quot;")  // 轉換英文的單雙引號
      .replace(/ /g, " &nbsp;")
      ;
  }

  return {
    reloadList,
    downloadVerifiedList,
  }

})();
