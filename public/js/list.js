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

  // 拿已審核學生清單
  function _getVerifiedStudents() {
    API.getVerifiedStudents().then(response => {
      if (response.ok) {

        // 暫存已審核清單
        students.bachelor_selection = response.data.bachelor_selection_students;
        students.bachelor_placement = response.data.bachelor_placement_students;
        students.division_of_preparatory_programs = response.data.division_of_preparatory_programs_students;
        students.master = response.data.master_students;
        students.phd = response.data.phd;
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
      const verifiedDate = `${verifiedDateObject.getFullYear()}/${verifiedDateObject.getMonth()+1}/${verifiedDateObject.getDate()}`;

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
      let verified_at = moment(student.student_misc_data.verified_at).format('YYYY/MM/DD hh:mm:ss ');
      result += `
        <tr>
          <td>${student.id}</td>
          <td>${verified_at}</td>
          <td>${student.name}</td>
          ${student.student_personal_data.gender.toLowerCase() === 'm' ? '<td>男</td>' : '<td>女</td>'}
          <td>${student.student_personal_data.birthday}</td>
          ${hasApplyWay ? '<td>' + student.student_misc_data.admission_placement_apply_way_data.description + '</td>' : ''}
          <td>${student.student_personal_data.school_country_data.country}</td>
          <td>${student.student_misc_data.overseas_student_id}</td>
          <td>${student.student_misc_data.verified_memo}</td>
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

  function downloadList(system = '') {
    window.location.href = `${env.baseUrl}/office/students/file/verified?system=${system}`;
  }

  return {
    reloadList,
    downloadList,
  }

})();
