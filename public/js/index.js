const app = (function () {

  /**
   * cache DOM
   */

  const $studentInfoDiv = $('#student-info-div');
  const $searchInput = $('#search-input');
  const $userId = $('#user-id'); // 報名序號
  const $userIdInput = $('#user-id-input'); // 報名序號
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
  const $originalDeleteBtn = $('#original-delete-btn');

  // Scanner
  const $scannerBtnGroup = $('#scanner-btn-group');
  const $scannerBtn = $('#scanner-btn');
  const $scannerBody = $('#scanner-body');
  const $scannerModal = $('#scanner-modal');

  /**
   * init
   */

  const baseUrl = env.baseUrl;
  let userId = '';

  _init();

  /**
   * Event Listener
   */

  // 掃瞄器被關掉就停止掃描器
  $scannerModal.on('hidden.bs.modal', e => {
    Quagga.stop();
  });

  // 掃瞄器偵測到 code 時
  Quagga.onDetected(result => {
    // 拿到 code
    const code = result.codeResult.code;

    // 隱藏 Scanner
    $scannerModal.modal('hide');

    // 搜尋學生資料
    searchUserId(code);
  });

  /**
   * functions
   */

  // init
  function _init() {
    // 設定上傳按鈕
    _renderUploadFileBtn();

    // 驗證能否使用 scanner
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      console.log('safely access navigator.mediaDevices.getUserMedia');
    } else {
      // 不給掃描就幹掉掃描器
      console.log('can not use scanner');
      $scannerBtnGroup.remove();
      $scannerModal.remove();
    }

    // 驗證登入狀態
    API.isLogin().then(response => {
      if (response.ok) {
        // 確認有登入，init 頁面
        _resetStudentInfo();
      } else if (response.statusCode == 401) {
        console.log(response);
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // 開啟 scanner modal
  function openScanner() {
    // init scanner
    Quagga.init({
      inputStream : {
        name : "Scanner",
        type : "LiveStream",
        target: document.querySelector('#scanner-body'),
      },
      decoder: {
        readers : ["i2of5_reader"]
      },
      debug: false
    }, error => {
      if (error) {
        // 錯到彈出來
        console.log(error);
        alert(error);

        // 不能掃描就幹掉掃瞄器
        $scannerBtnGroup.remove();
        $scannerModal.remove();

        return;
      }
      // 可以掃描就開啟 modal 開始掃描
      console.log("Initialization finished. Ready to start");
      $scannerModal.modal();
      Quagga.start();
    });
  }

  // 設定「上傳檔案」按鈕
  function _renderUploadFileBtn() {
    // 使用 bootstrap-filestyle（https://github.com/markusslima/bootstrap-filestyle/）處理上傳按鈕

    // 所有 type="file" 的通通 filestyle 成要求的樣子
    $(":file").filestyle({
      input: false, // 只留按鈕，不要 input 欄位
      htmlIcon: '<i class="fa fa-upload" aria-hidden="true"></i>',
      text: ' 重傳檔案',
      btnClass: 'btn-success',
    });

    // 調整按鈕排版
    $('.bootstrap-filestyle').addClass('col ml-auto');
    $('.group-span-filestyle').addClass('ml-auto');
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
    $applyWayTitle.show();
    $applyWay.show();
    $applyWay.html('');
    $diplomaDiv.html('');
    $transcriptDiv.html('');
    $verificationDesc.html('');
    // 重置上傳文件按鈕
    $(":file").filestyle('disabled', false);
    // 重置審核按鈕
    $submitBtn.prop('disabled', false);
    // 重設審核備註編輯
    $verificationDesc.prop('readonly', false);
    // 重設原圖刪除按鈕
    $originalDeleteBtn.prop('disabled', false);
  }

  // 用報名序號搜尋學生資料
  function searchUserId(inputUserId = '') {
    // 清空學生資料的顯示畫面並隱藏
    $studentInfoDiv.prop('hidden', true);
    _resetStudentInfo();

    // 判斷輸入是否為空
    if (inputUserId.trim() == '') {
      return alert('請填入正確的報名序號');
    }

    // 取得學生資料
    API.getStudentData(inputUserId).then((response) => {
      // 重置輸入框
      $userIdInput.prop('value', '');

      if (response.statusCode == 200) {
        const userData = response.data;
        // 儲存使用者
        userId = userData.id;
        // render 學生資料
        _renderStudentInfo(userData);

        // 顯示資料
        $studentInfoDiv.prop('hidden', false);
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else if (response.statusCode == 404) {
        alert('無此報名序號');
      }
    }).catch((error) => {
      console.log(error);
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
    $birthday.html(studentInfo.student_personal_data.birthday);
    $birthLocation.html(studentInfo.student_personal_data.birth_location_data.country);
    $residentLocation.html(studentInfo.student_personal_data.resident_location_data.country);

    // 性別判斷
    let genderString = '未提供';
    if (studentInfo.student_personal_data.gender != null) {
      genderString = studentInfo.student_personal_data.gender.toLowerCase() === 'm' ? '男' : '女';
    }
    $gender.html(genderString);

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



    // 學士班 才有「成績採計方式」
    if (studentInfo.student_qualification_verify.system_id == 1 ) {
      if (studentInfo.student_misc_data.admission_placement_apply_way_data == null) {
        $applyWay.html('不參加聯合分發');
      } else {
        // 置放「成績採計方式」
        let applyWayHtml = '';

        API.getApplyWays($userId.html()).then(({data, statusCode}) => {
          if (statusCode == 200) {
            console.log(data);
            applyWayHtml += '<select class="custom-select" id="applyWaySelect">';
            for (let applyWay of data) {
              if (applyWay.id === studentInfo.student_misc_data.admission_placement_apply_way_data.id) {
                applyWayHtml += '<option selected>';
              } else {
                applyWayHtml += '<option>';
              }
              applyWayHtml += applyWay.description + '</option>';
            }
            applyWayHtml += '</select>';
            $applyWay.html(applyWayHtml);
          } else {
            console.log(data.message);
          }
        }).catch((error) => {
          console.log(error);
        });
      }
    } else {
      // 把「成績採計方式」藏起來
      $applyWayTitle.hide();
      $applyWay.hide();
    }

    // 重置並擺上學歷證明文件
    $diplomaDiv.html('');
    _appendEducationFile('diploma', studentInfo.student_diploma);

    // 重置並擺上成績單
    $transcriptDiv.html('');
    _appendEducationFile('transcripts', studentInfo.student_transcripts);

    // 擺上審核、確認報名狀態
    $confirmedStatus.html((studentInfo.student_misc_data.confirmed_at !== null ? '已' : '尚未') + '確認上傳及報名資料');
    $verifiedStatus.html((studentInfo.student_misc_data.verified_at !== null ? '已' : '尚未') + '審核');

    // 審核、報名狀態對應狀況
    if (studentInfo.student_misc_data.confirmed_at !== null) {
      // 學生已確認報名

      // 同時學生已被審核
      if (studentInfo.student_misc_data.verified_at !== null) {
        // TODO 不能選文憑別、身份別

        // 不能重傳文件
        $(":file").filestyle('disabled', true);
        // 不能刪原圖
        $originalDeleteBtn.prop('disabled', true);
        // 不能審核
        $submitBtn.prop('disabled', true);
        // 不能編輯審核備註
        $verificationDesc.prop('readonly', true);
        // 擺上審核備註
        $verificationDesc.html(studentInfo.student_misc_data.verification_desc);
      }
    } else {
      // 學生尚未確認報名

      // TODO 不能選文憑別、身份別

      // 不能重傳文件
      $(":file").filestyle('disabled', true);
      // 不能刪原圖
      $originalDeleteBtn.prop('disabled', true);
      // 不能審核
      $submitBtn.prop('disabled', true);
      // 不能編輯審核備註
      $verificationDesc.prop('readonly', true);
    }

    // 確認是否已審核
    if (studentInfo.student_misc_data.verified_at != null) {
      // 封印審核按鈕
      $submitBtn.prop('disabled', true);
      // 封印審核備註編輯
      $verificationDesc.prop('readonly', true);
      // 擺上審核備註
      $verificationDesc.html(studentInfo.student_misc_data.verification_desc);
      // 擺上審核狀態
      $verifiedStatus.html('已審核');
    } else {
      // 擺上審核狀態
      $verifiedStatus.html('未審核');
    }

  }

  // 將圖片依照 type append 到 DOM 上
  function _appendEducationFile(type = '', filenames = [], highlight = false) {
    for (let filename of filenames) {
      if (type === 'diploma') {
        $diplomaDiv.prepend(`
          <img
            src="${baseUrl}/office/students/${userId}/diploma/${filename}"
            alt="學歷證明文件"
            data-filename="${filename}" data-filetype="diploma"
            class="img-thumbnail doc-thumbnail ${highlight ? 'doc-highlight' : ''}"
            onclick="app.loadOriginalImgModal(this.src, this.alt, this.dataset.filename, this.dataset.filetype)"
          >
        `)
      }

      if (type === 'transcripts') {
        $transcriptDiv.prepend(`
          <img
            src="${baseUrl}/office/students/${userId}/transcripts/${filename}"
            alt="成績單文件"
            data-filename="${filename}" data-filetype="transcripts"
            class="img-thumbnail doc-thumbnail ${highlight ? 'doc-highlight' : ''}"
            onclick="app.loadOriginalImgModal(this.src, this.alt, this.dataset.filename, this.dataset.filetype)"
          >
        `)
      }
    }
  }

  // 上傳成績單或學歷證明文件
  function uploadEducationFile(type = '', files = []) {
    loading.start();

    // 使用 formData
    let data = new FormData();

    // 將檔案一一放到 formData 中
    for (let file of files) {
      data.append('files[]', file);
    }

    // 上傳囉
    API.uploadStudentEducationFile(userId, type, data).then((response) => {
      // 成功就把剛上傳的檔案們秀出來，不然就彈 alert
      if (response.ok) {
        _appendEducationFile(type, response.data, true);
      } else {
        alert(response.singleErrorMessage);
      }

      // 清除上傳檔案的快取
      $(":file").filestyle('clear');

      loading.complete();
    })
  }

  // 刪除某成績單或學歷證明文件
  function deleteEducationFile(filename = '', filetype = '') {
    // 彈出確認框
    const isConfirmedDelete = confirm('確定要刪除嗎？');

    // 其實不想刪，那算了
    if (!isConfirmedDelete) {
      return;
    }

    // 關閉原圖 modal
    $originalImgModal.modal('hide');

    loading.start();

    // 沒不想刪就刪吧
    API.deleteStudentEducationFile(userId, filetype, filename).then(response => {
      if (response.ok) {
        // 確認刪除，移除該圖
        $(`.doc-thumbnail[data-filename="${filename}"]`).remove();
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        $originalImgModal.modal('hide');
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }

      loading.complete();
    }).catch(error => {
      console.log(error);
    });
  }

  function verifyStudentInfo(verificationDesc) {

    API.verifyStudent($userId.html(), verificationDesc).then(response => {
      if (response.ok) {
        alert('審核成功');

        // 重新 render 學生資料
        _renderStudentInfo(response.data);
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // 開啟原圖
  function loadOriginalImgModal(src = '', alt = '', filename = '', filetype = '') {
    // 設定圖片
    $originalImg.attr('data-filename', filename);
    $originalImg.attr('data-filetype', filetype);
    $originalImg.prop({src, alt});
    $originalImgTitle.html(alt);
    // 顯示 modal
    $originalImgModal.modal();
  }

  return {
    openScanner,
    searchUserId,
    uploadEducationFile,
    verifyStudentInfo,
    loadOriginalImgModal,
    deleteEducationFile,
  }

})();
