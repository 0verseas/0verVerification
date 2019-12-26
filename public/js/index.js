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
  const $applyWayTitle = $('#apply-way-title'); // 聯合分發成績採計方式 title
  const $applyWay = $('#apply-way'); // 聯合分發成績採計方式
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

  // 學歷文件 modal 所需變數
  let canvas; // 畫布
  let ctx; // 畫布內容
  let isMouseDownOnImage = false; // 是否按著圖片本人
  let startDragOffset = {x: 0, y: 0}; // 開始拖拉圖片的位置設定
  let translatePos = {x: 0, y: 0}; // 拖拉後畫布原點位置設定
  let scale = 1.0; // 圖片縮放比例
  let originalImage; // 圖片本人
  let originalImageAngleInDegrees = 0; // 目前角度
  let student; // 目前查詢的學生資料
  let verifier; // 目前審核單位的帳號資料
  let i = 0;
  let j = 0;

  _init();
  ping();
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
    $applyWayTitle.hide();
    $applyWay.hide();
    $applyWay.html('');
    $verificationDesc.html('');
    // 重置上傳文件按鈕
    $(":file").filestyle('disabled', false);
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
        userId = userData.id;
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
    const miscData = studentInfo.student_misc_data;
    const personalData = studentInfo.student_personal_data;
    const qualificationVerify = studentInfo.student_qualification_verify;

    // 報名序號
    $system.html(qualificationVerify && qualificationVerify.system_data && qualificationVerify.system_data.title ? qualificationVerify.system_data.title : noData);

    // 報名序號
    $userId.html(studentInfo.id.toString().padStart(6, '0'));

    // 若尚未審核，僑生編號為'未產生'
    $overseasStudentId.html(miscData && miscData.overseas_student_id ? miscData.overseas_student_id : '未產生');

    // 置放身份別代碼（有才放）
    $ruleCodeOfOverseasStudentId.html(miscData && miscData.rule_code_of_overseas_student_id ? miscData.rule_code_of_overseas_student_id : '未產生');

    // 若最後畢業學校國別為緬甸學士班學生，且可被審核，拿可用身份別代碼並置放選單
    if (miscData.confirmed_at && !miscData.verified_at && personalData.school_country_data.country === '緬甸' && qualificationVerify.system_id && qualificationVerify.system_id === 1 ) {
      API.getAvailableRuleCodeOfOverseasStudentId(studentInfo.id).then((response) => {
        if (response.statusCode == 200) {
          let html = '<select id="rule-code-of-overseas-student-id" style="width: 100%">';

          html += `<option value="" disabled selected>請選擇</option>`;

          for (let data of response.data) {
            html += `<option value="${data.student_rule_code_id}">${data.code_id_description}</option>`;
          }

          html += `</select>`;

          $ruleCodeOfOverseasStudentId.html(html);
        }
      });
    }

    // 身障程度
    $disability.html(personalData && personalData.disability_category ? personalData.disability_level + personalData.disability_category : '無');

    // 姓名
    $name.html(studentInfo.name ? studentInfo.name : noData);
    $engName.html(studentInfo.eng_name ? studentInfo.eng_name : noData);

    // 生日
    $birthday.html(personalData && personalData.birthday ? personalData.birthday : noData);

    // 出生地國別
    $birthLocation.html(personalData && personalData.birth_location_data && personalData.birth_location_data.country ? personalData.birth_location_data.country : noData);

    // 僑居地國別
    $residentLocation.html(personalData && personalData.resident_location_data && personalData.resident_location_data.country ? personalData.resident_location_data.country : noData);

    // 性別
    $gender.html(personalData && personalData.gender ? personalData.gender.toLowerCase() === 'm' ? '男' : '女' : '未提供');

    // 畢業學校國別
    $schoolCountry.html(personalData && personalData.school_country_data && personalData.school_country_data.country ? personalData.school_country_data.country : noData);

    // 畢業學校名稱
    $schoolName.html(personalData && personalData.school_name ? personalData.school_name : noData);

    //  判斷申請身份別
    let identity = '未提供';
    if (qualificationVerify && qualificationVerify.identity) {
      switch(qualificationVerify.identity) {
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
    }
    $identity.html(identity);

    // 學士班 才有「成績採計方式」
    if (qualificationVerify && qualificationVerify.system_id && qualificationVerify.system_id === 1 ) {
      $applyWay.html(miscData && miscData.admission_placement_apply_way_data ? miscData.admission_placement_apply_way_data.description : '未選擇');
      $applyWayTitle.show();
      $applyWay.show();
    }

    // 確認報名狀態
    $confirmedStatus.html((miscData && miscData.confirmed_at ? '已' : '尚未') + '確認上傳及報名資料');

    // 審核、狀態
    $verifiedStatus.html((miscData && miscData.verified_at ? '已' : '尚未') + '審核');

    // 審核、報名狀態對應狀況
    if (miscData && miscData.confirmed_at) {
      // 學生已確認報名

      // 同時學生已被審核
      if (miscData.verified_at) {
        // 不能審核
        $submitBtn.prop('disabled', true);
        // 不能編輯審核備註
        $verificationDesc.prop('readonly', true);
        // 擺上審核備註
        $verificationDesc.html(miscData.verification_desc);
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
    const systemId = student.student_qualification_verify.system_id;

    // 最後畢業學校國別在緬甸就一定要選身份別喔
    if (student.student_personal_data.school_country == 105 && !ruleCodeOfOverseasStudentId && systemId && systemId === 1 ) {
      alert('請選擇身份別');
      return;
    }

    checkDuplicateStudent(userId);

    // 送審
    API.verifyStudent(userId, verificationDesc, ruleCodeOfOverseasStudentId).then(response => {
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

  // 確認有無相同僑居地身分證字號的同學
  async function checkDuplicateStudent(userId) {
    try {
      const response = await API.checkDuplicateStudent(userId);

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
          // 跳個善逸(X)善意(O)的提醒
          alert(data.messages[0]);
        })
      }
    } catch (e) {
      e.json && e.json().then((data) => {
        console.error(data);
        alert(`${data.messages[0]}`);

        loading.complete();
      });
    }

  }

  //測試連線狀態  以後有人連線中斷沒收到回應 就能知道是誰的錯了
  function ping() {
    $.ajax(avar());//發送請求到Google.com
    $.ajax(avar2());//發送請求到海聯收件系統
    //setTimeout(ping,5000);
  }

  //要發送給Google.com的請求內容
  function avar(){
    let requestTime;
    let responseTime;
    let ajax_vars = {
        url: 'https://www.google.com/ping/' + Math.random() + '.html',
        type: 'GET',
        dataType: 'html',
        timeout: 5000,
        beforeSend: function() {
            //發送前取得時間
            requestTime = new Date().getTime();
        },
        complete: function() {
            i = i + 1;
            //接到回應後取得時間
            responseTime = new Date().getTime();
            ping = Math.abs(requestTime - responseTime);
            //印出時間差 超過時間印time out
            console.log('------------------------------------');
            if (ping > 4999) {
                console.log('Ping Google : Connection timed out');
            } else {
                console.log('Ping Google : '+i + "-Ping:" + ping + "ms");
            }
            console.log('------------------------------------');
            setTimeout(function() { $.ajax(avar()); }, 5000);  //每5秒請求一次
        }
    }
    return ajax_vars;
  }

  //要發送給海聯收件系統的請求內容
  function avar2(){
    let requestTime;
    let responseTime;
    let ajax_vars = {
        url: 'https://office.overseas.ncnu.edu.tw/verification/',
        type: 'GET',
        dataType: 'html',
        timeout: 5000,
        beforeSend: function() {
            //發送前取得時間
            requestTime = new Date().getTime();
        },
        complete: function() {
            j = j + 1;
            //接到回應後取得時間
            responseTime = new Date().getTime();
            ping = Math.abs(requestTime - responseTime);
            //印出時間差 超過時間印time out
            console.log('------------------------------------');
            if (ping > 4999) {
                console.log('Ping Overseas : Connection timed out');
            } else {
                console.log('Ping Overseas : '+j + "-Ping:" + ping + "ms");
            }
            console.log('------------------------------------');
            setTimeout(function() { $.ajax(avar2()); }, 5000);  //每5秒請求一次
        }
    }
    return ajax_vars;
  }

  return {
    openScanner,
    searchUserId,
    verifyStudentInfo,
  }

})();
