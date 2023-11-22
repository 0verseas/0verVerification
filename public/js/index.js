const app = (function () {

  /**
   * cache DOM
   */

  const $studentInfoDiv = $('#student-info-div');
  const $searchInput = $('#search-input');
  const $system = $('#system'); // 報名序號
  const $userId = $('#user-id'); // 報名序號
  const $userIdInput = $('#user-id-input'); // 報名序號
  const $overseasStudentId = $('#overseas-student-id'); // 僑生編號
  const $disability = $('#disability'); // 身障程度
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
  const $confirmedStatus = $('#confirmed-status'); // 確認上傳及報名資料
  const $verifiedStatus = $('#verified-status'); // 審核狀態
  const $verificationDesc = $('#verification-desc'); // 審核備註
  const $submitBtn = $('#submit-btn'); // 送出審核按鈕


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
  let has_videoinput;

  let student; // 目前查詢的學生資料
  let verifier; // 目前審核單位的帳號資料

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


    // 驗證登入狀態
    API.isLogin().then(response => {
      if (response.ok) {
        // 儲存審核單位帳號資料
        verifier = response.data;

        // 驗證能否使用 scanner
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof navigator.mediaDevices.enumerateDevices === 'function') {
          console.log('safely access navigator.mediaDevices.getUserMedia');

          navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
              devices.forEach(function(device) {
                if (device.kind === 'videoinput') {
                  has_videoinput = true;
                }
              });

              if (has_videoinput !== true) {
                console.log('No videoinput devices detected');
                $scannerBtnGroup.remove();
                $scannerModal.remove();
              }
            }).catch(function(err) {
              console.log(err.name + ": " + err.message);
              $scannerBtnGroup.remove();
              $scannerModal.remove();
            });
        } else {
          // 不給掃描就幹掉掃描器
          console.log('can not use scanner');
          $scannerBtnGroup.remove();
          $scannerModal.remove();
        }

        if(verifier.overseas_office.authority === 6 || verifier.overseas_office.authority === 2){
          $('.nav-list').hide();
        }

        if (verifier.overseas_office.authority === 1) {
          $('.email-check-div').show();
        } else {
          $('.email-check-div').hide();
        }

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

  // 設定「上傳檔案」按鈕
  function _renderUploadFileBtn() {
    // 使用 bootstrap-filestyle（https://github.com/markusslima/bootstrap-filestyle/）處理上傳按鈕

    // 所有 type="file" 的通通 filestyle 成要求的樣子
    $(":file").filestyle({
      input: false, // 只留按鈕，不要 input 欄位
      htmlIcon: '<i class="fa fa-upload" aria-hidden="true"></i>',
      text: ' 上傳檔案',
      btnClass: 'btn-success',
    });

    // 調整按鈕排版
    $('.bootstrap-filestyle').addClass('col-2');
    $('.group-span-filestyle').addClass('ml-auto');
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
    // 重置審核按鈕
    $submitBtn.prop('disabled', false);
    // 重設審核備註編輯
    $verificationDesc.prop('readonly', false);
  }

  // 用報名序號搜尋學生資料
  function searchUserId(inputUserId = '') {
    loading.start();

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
        userId = userData.user_id;
        // render 學生資料
        _renderStudentInfo(student = userData);

        // 顯示資料
        $studentInfoDiv.prop('hidden', false);
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else if (response.statusCode == 403) {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      } else if (response.statusCode == 404) {
        alert('無此報名序號');
      } else {
        // 彈出錯誤訊息
        alert(response.singleErrorMessage);
      }

      loading.complete();
    }).catch((error) => {
      console.log(error);
    });

    // 沒有的話 alert 無此報名序號 _resetStudentInfo
  }

  // render 學生資料 含 成績單、學歷證明
  function _renderStudentInfo(studentInfo) {
    const noData = '未填寫';

    // 報名層級（學制）
    $system.text(studentInfo.system_title ? studentInfo.system_title : noData);

    // 報名序號
    $userId.text(studentInfo.user_id.toString().padStart(6, '0'));

    // 若尚未審核，僑生編號為'未產生'
    $overseasStudentId.text(studentInfo.overseas_student_id ? studentInfo.overseas_student_id : '未產生');

    $ruleCodeOfOverseasStudentId.text(studentInfo.rule_code_of_overseas_student_id ? studentInfo.rule_code_of_overseas_student_id : '未產生');

    // 若最後畢業學校國別為緬甸學士班學生，且可被審核，拿可用身份別代碼並置放選單
    if (studentInfo.confirmed_at && !studentInfo.verified_at && studentInfo.school_country_data.country === '緬甸' && studentInfo.system_id) {


      let html = '<select id="rule-code-of-overseas-student-id" style="width: 100%">';

      html += `
        <option value="" disabled selected hidden>請選擇</option>
        <option value="16">曼德勒</option>
        <option value="17">密支那</option>
        <option value="18">臘戌</option>
        <option value="19">東枝</option>
        <option value="20">仰光</option>
      `;
      html += `</select>`;
      $ruleCodeOfOverseasStudentId.html(html);
    }

    // 身障程度
    $disability.text(studentInfo.disability_category ? studentInfo.disability_level + studentInfo.disability_category : '無');

    // 姓名
    $name.text(studentInfo.name ? studentInfo.name : noData);
    $engName.text(studentInfo.eng_name ? studentInfo.eng_name : noData);

    // 生日
    $birthday.text(studentInfo.birthday ? studentInfo.birthday : noData);

    // 出生地國別
    $birthLocation.text(studentInfo.birth_location_data && studentInfo.birth_location_data.country ? studentInfo.birth_location_data.country : noData);

    // 僑居地國別
    $residentLocation.text(studentInfo.resident_location_data && studentInfo.resident_location_data.country ? studentInfo.resident_location_data.country : noData);

    // 性別
    $gender.text(studentInfo.gender ? studentInfo.gender.toLowerCase() === 'm' ? '男' : '女' : '未提供');

    // 畢業學校國別
    $schoolCountry.text(studentInfo.school_country_data && studentInfo.school_country_data.country ? studentInfo.school_country_data.country : noData);

    // 畢業學校名稱
    $schoolName.text(studentInfo.school_name ? studentInfo.school_name : noData);

    //  判斷申請身份別
    let identity = '海外僑生';
    $identity.text(identity);

    // 確認報名狀態
    $confirmedStatus.text((studentInfo.confirmed_at ? '已' : '尚未') + '確認並鎖定報名基本資料');

    // 審核、狀態
    $verifiedStatus.text((studentInfo.verified_at ? '已' : '尚未') + '審核');

    // 審核、報名狀態對應狀況
    if (studentInfo.confirmed_at && verifier.overseas_office.can_verify) {
      // 學生已確認報名

      // 同時學生已被審核
      if (studentInfo.verified_at) {
        // 不能審核
        $submitBtn.prop('disabled', true);
        // 不能編輯審核備註
        $verificationDesc.prop('readonly', true);
        // 擺上審核備註
        $verificationDesc.text(studentInfo.verified_memo);
        // 審核時是否寄信選項隱藏
        $('.email-check-div').hide();
      }
    } else {
      // 學生尚未確認報名

      // 不能審核
      $submitBtn.prop('disabled', true);
      // 不能編輯審核備註
      $verificationDesc.prop('readonly', true);
    }
  }


  function verifyStudentInfo(verificationDesc) {
    // 彈出確認框
    const isConfirmedDelete = confirm('確定要送出審核結果嗎？');

    // 其實不想送，那算了
    if (!isConfirmedDelete) {
      return;
    }

    // 取得所選的身份別代碼
    const ruleCodeOfOverseasStudentId= $('#rule-code-of-overseas-student-id').find(":selected").val();

    // 取得學制 id
    const systemId = student.system_id;
    // 默認收件都要寄信但海聯可以選
    let sendEmail = true
    if (verifier.overseas_office.authority === 1) {
      sendEmail = $('#email-check').is(":checked");
    }

    // 最後畢業學校國別在緬甸就一定要選身份別喔
    if (student.school_country == 105 && !ruleCodeOfOverseasStudentId) {
      alert('請選擇身份別');
      return;
    }

    // 確認有無相同僑居地身分證字號的同學
    let check = true;
    API.checkDuplicateStudent(userId, sendEmail)
    .then(response => {
      if (!response.ok){
        throw response;
      }

      /*
       * 有發現重複：200
       * 沒有發現重複：204
       * 無開放此功能：204
       */
      if (response.status === 200){
        response.json().then(function (data) {
          // 發現重複的身份證字號詢問是否收件
          if(confirm(data.messages[0]+' , 是否要收件？')){
            _handleVerifyStudent(userId, verificationDesc, ruleCodeOfOverseasStudentId, sendEmail);
          }
        })
      } else {
        _handleVerifyStudent(userId, verificationDesc, ruleCodeOfOverseasStudentId, sendEmail);
      }
    })
    .catch(e => {
      e.json && e.json().then((data) => {
        console.error(data);
        alert(`${data.messages[0]}`);
      });
    });
  }

  function _handleVerifyStudent(userId, verificationDesc, ruleCodeOfOverseasStudentId, sendEmail){
    // 送審
    API.verifyStudent(userId, verificationDesc, ruleCodeOfOverseasStudentId, sendEmail).then(response => {
      if (response.ok) {
        alert('審核成功');

        _resetStudentInfo();
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

  return {
    openScanner,
    searchUserId,
    verifyStudentInfo,
  }

})();
