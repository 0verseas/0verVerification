const app = (function () {

  /**
   * cache DOM
   */

  const $bachelorSelectionStudentsBody = $('#bachelor-selection-students-body');
  const $bachelorPlacementStudentsBody = $('#bachelor-placement-students-body');
  const $divisionOfPreparatoryProgramsStudentsBody = $('#division-of-preparatory-programs-students-body');
  const $twoYearTechStudentsTab = $('#two-year-tech-students-tab');
  const $twoYearTechStudentsBody = $('#two-year-tech-students-body');
  const $masterStudentsBody = $('#master-students-body');
  const $phdStudentsBody = $('#phd-students-body');
  const $datepicker = $('#datepicker');

  const $downVerifiedListButton = $('#download-Verified-List');

  /**
   * init
   */

  let user;
  let students = {
    bachelor_selection: [],
    bachelor_placement: [],
    division_of_preparatory_programs: [],
    master: [],
    phd: [],
    two_year_tech: [],
  }

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
  /*
  切換不同的tab時同步切換學制變數
  * system_Type  用來控制 收件統計表按鈕動作
  * system_Num  用來控制 已審核清單按鈕動作
  * 11：學士班 個人申請
  * 10：學士班 聯合分發
  * 6：僑先部
  * 2：港二技
  * 3：碩士班
  * 4：博士班
  */
  var system_Type = 'bachelor-selection';
  var system_Num = '11';
  $(document).ready(function () {
    $('a[data-toggle="tab"]').on("click", function() {
      let tabId = this.id;
      switch(tabId){
        case "bachelor-selection-students-tab":
            system_Type = 'bachelor-selection';
            system_Num = 11;
          break;
        case "bachelor-placement-students-tab":
            system_Type = 'bachelor-placement';
            system_Num = 10;
          break;
        case "division-of-preparatory-programs-students-tab":
            system_Type = 'division-of-preparatory-programs';
            system_Num = 6;
          break;
        case "two-year-tech-students-tab":
            system_Type = 'two-year-tech';
            system_Num = 2;
          break;
        case "master-students-tab":
            system_Type = 'master';
            system_Num = 3;
          break;
        case "phd-students-tab":
            system_Type = 'phd';
            system_Num = 4;
          break;
      }
    });
});

  // 拿已審核學生清單
  function _getVerifiedStudents() {
    API.getVerifiedStudents().then(response => {
      if (response.ok) {

        // 暫存已審核清單
        students.bachelor_selection = response.data.bachelor_selection_students;
        students.bachelor_placement = response.data.bachelor_placement_students;
        students.division_of_preparatory_programs = response.data.division_of_preparatory_programs_students;
        students.master = response.data.master_students;
        students.phd = response.data.phd_students;
        students.two_year_tech = response.data.two_year_tech_students;

        // 分包 render
        _render($bachelorSelectionStudentsBody, _sortList(students.bachelor_selection));
        _render($bachelorPlacementStudentsBody, _sortList(students.bachelor_placement), true);
        _render($divisionOfPreparatoryProgramsStudentsBody, _sortList(students.division_of_preparatory_programs));
        _render($masterStudentsBody, _sortList(students.master));
        _render($phdStudentsBody, _sortList(students.phd));

        // 審核單位為海聯或香港時才顯示二技分頁
        if (user.overseas_office.authority == 1 || user.overseas_office.authority == 2) {
          _render($twoYearTechStudentsBody, students.two_year_tech);
        } else {
          $twoYearTechStudentsTab.remove();
          $twoYearTechStudentsBody.remove();
        }
        // 審核單位為僑務委員會時才顯示下載已審核清單按鈕
        if (user.overseas_office.authority == 4) {
          $downVerifiedListButton.show();
        } else {
          $downVerifiedListButton.remove();
        }



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
      return new Date(b.student_misc_data.verified_at) - new Date(a.student_misc_data.verified_at);
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
      const verifiedDateObject = new Date(student.student_misc_data.verified_at);
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
      console.log(student.student_misc_data.verified_at);
      let verified_at = dateFns.format(student.student_misc_data.verified_at, 'YYYY/MM/DD HH:mm:ss ');
      let name = encodeHtmlCharacters(student.name);  // 學生姓名
      let verified_memo = student.student_misc_data.verified_memo!==null ? encodeHtmlCharacters(student.student_misc_data.verified_memo) : '';
      result += `
        <tr>
          <td>${student.id}</td>
          <td>${verified_at}</td>
          <td>${name}</td>
          ${student.student_personal_data.gender.toLowerCase() === 'm' ? '<td>男</td>' : '<td>女</td>'}
          <td>${student.student_personal_data.birthday}</td>
          ${hasApplyWay ? '<td>' + student.student_misc_data.admission_placement_apply_way_data.description + '</td>' : ''}
          <td>${student.student_personal_data.school_country_data.country}</td>
          <td>${student.student_misc_data.overseas_student_id}</td>
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

    _render($bachelorSelectionStudentsBody, _sortList(_filterListByDate(students.bachelor_selection, date)));
    _render($bachelorPlacementStudentsBody, _sortList(_filterListByDate(students.bachelor_placement, date), true));
    _render($divisionOfPreparatoryProgramsStudentsBody, _sortList(_filterListByDate(students.division_of_preparatory_programs, date)));
    _render($masterStudentsBody, _sortList(_filterListByDate(students.master, date)));
    _render($phdStudentsBody, _sortList(_filterListByDate(students.phd, date)));
  }

  /* 根據system_Type下載不同收件統計表 */
  function downloadList() {
    window.location.href = `${env.baseUrl}/office/students/file/verified?system=${system_Type}`;
  }

  /* 根據system_Num下載不同已審核清單 */
  function downloadVerifiedList() {
    window.location.href = `${env.baseUrl}/office/verified-list/${system_Num}`;
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
    downloadList,
    downloadVerifiedList,
  }

})();
