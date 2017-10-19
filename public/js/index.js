const app = (function () {

  /**
   * cache DOM
   */

  const $studentInfoDiv = $('#student-info-div');
  const $userIdForm = $('#userIdForm'); // 填入報名序號
  const $userId = $('#id'); // 報名序號
  const $overseasStudentId = $('#overseas-student-id'); // 僑生編號
  const $name = $('#name'); // 姓名
  const $engName = $('#eng-name'); // 英文姓名
  const $gender = $('#gender'); // 性別
  const $birthday = $('#birthday'); // 生日
  const $birthLocation = $('#birth-location'); // 出生地
  const $residentLocation = $('#resident-location'); // 僑居地
  const $identity = $('#identity'); // 申請身份別
  const $ruleCodeOfOverseasStudentId = $('#rule-code-of-overseas-student-id'); // 規則碼（身份別代碼）
  const $schoolCountry = $('#graduate-school-country'); // 畢業學校國家
  const $schoolName = $('#graduate-school-name'); // 畢業學校
  const $confirmedStatus = $('#confirmed-status') // 確認上傳及報名資料
  const $applyWayTitle = $('#apply-way-title'); // 聯合分發成績採計方式 title
  const $applyWay = $('#apply-way'); // 聯合分發成績採計方式
  const $diplomaDiv = $('#diploma-div'); // 學歷證明 div
  const $transcriptDiv = $('#transcript-div'); // 成績單 div
  const $verifiedStatus = $('#verified-status'); // 審核狀態
  const $verificationDesc = $('#verification-desc'); // 審核備註
  const $submitBtn = $('#submit-btn'); // 送出審核按鈕

  // 圖片原圖 modal
  const $originalImgModal = $('#original-img-modal');
  const $originalImg = $('#original-img');
  const $originalImgTitle = $('#original-img-title');

  /**
   * init
   */

  const baseUrl = env.baseUrl;

  _init();

  /**
   * functions
   */

  // init
  function _init() {
    API.isLogin().then(({data, statusCode}) => {
      if (statusCode == 200) {
        // 確認有登入，init 頁面
        _resetStudentInfo();
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

  // init student info 把所有欄位清空
  function _resetStudentInfo() {
    $userId.html('');
    $overseasStudentId.html('');
    $name.html('');
    $engName.html('');
    $gender.html('');
    $birthday.html('');
    $birthLocation.html('');
    $residentLocation.html('');
    $identity.html('');
    $ruleCodeOfOverseasStudentId.html('');
    $schoolCountry.html('');
    $schoolName.html('');
    $confirmedStatus.html('');
    $applyWay.html('');
    $diplomaDiv.html('');
    $transcriptDiv.html('');
    $verificationDesc.html('');
  }

  // 用報名序號搜尋學生資料
  function searchUserId(userId = '') {
    // 清空學生資料的顯示畫面並隱藏
    $studentInfoDiv.prop('hidden', true);
    _resetStudentInfo();

    // 判斷輸入是否為空
    if (userId.trim() == '') {
      return alert('請填入正確的報名序號');
    }

    // 取得學生資料
    API.getStudentData(userId).then((response) => {
      // 重置輸入框
      $userIdForm.prop('value', '');

      // render 學生資料
      _renderStudentInfo(response.data);

      // 顯示資料
      $studentInfoDiv.prop('hidden', false);
    });

    // 沒有的話 alert 無此報名序號 _resetStudentInfo
  }

  // render 學生資料 含 成績單、學歷證明
  function _renderStudentInfo(studentInfo) {
    // 學生資料
    $userId.html(studentInfo.id.toString().padStart(6, '0'));
    $overseasStudentId.html(studentInfo.student_misc_data.overseas_student_id);
    $name.html(studentInfo.name);
    $engName.html(studentInfo.eng_name);

    // 性別判斷
    let gender = '未提供';
    if (studentInfo.student_personal_data.gender == 'M') {
      gender = '男';
    } else if (studentInfo.student_personal_data.gender == 'F') {
      gender = '女';
    }
    $gender.html(gender);

    $birthday.html(studentInfo.student_personal_data.birthday);
    $birthLocation.html(studentInfo.student_personal_data.birth_location_data.country);
    $residentLocation.html(studentInfo.student_personal_data.resident_location_data.country);

    //  判斷申請身份別
    let identity = '未提供';
    switch(studentInfo.student_qualification_verify.identity) {
      case 1:
        identity = '港澳生';
        break;
      case 2:
        identity = '港澳具外國國籍之華裔學生';
        break;
      case 3:
        identity = '海外僑生';
        break;
      case 4:
        identity = '在臺港澳生';
        break;
      case 5:
        identity = '在臺僑生';
        break;
      case 6:
        identity = '僑先部結業生';
        break;
      default:
        break;
    }
    $identity.html(identity);

    $ruleCodeOfOverseasStudentId.html(studentInfo.student_misc_data.rule_code_of_overseas_student_id);
    $schoolCountry.html(studentInfo.student_personal_data.school_country_data.country);
    $schoolName.html(studentInfo.student_personal_data.school_name);
    $confirmedStatus.html((studentInfo.student_misc_data.confirmed_at !== null ? '已' : '未') + '確認上傳及報名資料');

    // 學士班 才有「成績採計方式」
    if (studentInfo.student_qualification_verify.system_id == 1) {
      // 置放「成績採計方式」
      $applyWay.html(studentInfo.student_misc_data.admission_placement_apply_way_data.description);
    } else {
      // 把「成績採計方式」藏起來
      $applyWayTitle.hide();
      $applyWay.hide();
    }

    // 學歷證明文件
    for (let filename of studentInfo.student_diploma) {
      $diplomaDiv.append(`
        <img src="${baseUrl}/office/students/${studentInfo.id}/diploma/${filename}" alt="學歷證明文件" data-filetype="學歷證明文件" class="img-thumbnail doc-thumbnail" onclick="app.loadOriginalImgModal(this.src, this.dataset.filetype)">
      `)
    }

    // 成績單
    for (let filename of studentInfo.student_transcripts) {
      $transcriptDiv.append(`
        <img src="${baseUrl}/office/students/${studentInfo.id}/transcripts/${filename}" alt="成績單文件" data-filetype="成績單文件" class="img-thumbnail doc-thumbnail" onclick="app.loadOriginalImgModal(this.src, this.dataset.filetype)">
      `)
    }

    // 確認是否已審核
    if (studentInfo.verified_at != null) {
      // 封印審核按鈕
      $submitBtn.prop('disabled', true);
      // 封印審核備註編輯
      $verificationDesc.prop('readonly', true);
      // 擺上審核備註
      $verificationDesc.html(studentInfo.verification_desc);
      // 擺上審核狀態
      $verifiedStatus.html('已審核');
    } else {
      // 擺上審核狀態
      $verifiedStatus.html('未審核');
    }

  }

  function verifyStudentInfo(verificationDesc) {
    console.log($userId.val() + verificationDesc);
    // 確認是否已經有僑生編號
    // 有的話 alert 已經審查
    // 沒有的話 送 審查備註、報名序號 then _renderStudentInfo
  }

  // 開啟原圖
  function loadOriginalImgModal(src, filetype) {
    console.log(filetype);
    // 設定圖片網址
    $originalImg.prop('src', src);
    $originalImgTitle.html(filetype);
    // 顯示 modal
    $originalImgModal.modal();
  }

  return {
    searchUserId,
    verifyStudentInfo,
    loadOriginalImgModal,
  }

})();
