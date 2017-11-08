const app = (function () {

  /**
   * cache DOM
   */

  const $bachelorSelectionStudentsBody = $('#bachelor-selection-students-body');
  const $bachelorPlacementStudentsBody = $('#bachelor-placement-students-body');
  const $divisionOfPreparatoryProgramsStudentsBody = $('#division-of-preparatory-programs-students-body');
  const $twoYearTechStudentsBody = $('#two-year-tech-students-body');
  const $masterStudentsBody = $('#master-students-body');
  const $phdStudentsBody = $('#phd-students-body');

  /**
   * init
   */

  _init();

  /**
   * functions
   */

  // init
  function _init() {
    loading.start();

    API.isLogin().then(response => {
      if (response.ok) {
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
        // 分包 render
        _render($bachelorSelectionStudentsBody, response.data.bachelor_selection_students);
        _render($bachelorPlacementStudentsBody, response.data.bachelor_placement_students, true);
        _render($divisionOfPreparatoryProgramsStudentsBody, response.data.division_of_preparatory_programs_students);
        _render($twoYearTechStudentsBody, response.data.two_year_tech_students);
        _render($masterStudentsBody, response.data.master_students);
        _render($phdStudentsBody, response.data.phd_students);
      } else if (response.statusCode === 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        $originalImgModal.modal('hide');
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }

      loading.complete();
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
          <td>${student.student_misc_data.rule_code_of_overseas_student_id}</td>
          <td>${student.student_misc_data.overseas_student_id}</td>
          <td>${student.student_misc_data.verified_memo}</td>
        </tr>
      `;
    }

    // render
    $body.html(result);
  }

  return {

  }

})();
