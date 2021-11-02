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

  const $diplomaDiv = $('#diploma-div'); // 學歷證明 div
  const $transcriptDiv = $('#transcript-div'); // 成績單 div
  const $hkOfficeUploadDiv = $('#hk-office-upload-div'); // 核驗單位上傳 div
  // 圖片原圖 modal
  const $originalImgModal = $('#original-img-modal');
  const $originalImgCanvas = $('#original-img-canvas');
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

  // 圖片關掉就清除畫布
  $originalImgModal.on('hidden.bs.modal', e => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });


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
    $applyWayTitle.hide();
    $applyWay.hide();
    $applyWay.html('');
    $diplomaDiv.html('');
    $transcriptDiv.html('');
    $hkOfficeUploadDiv.html('');
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

        // 香港地區要 show 上傳核驗文件區塊
        if(userData.student_personal_data.resident_location == '113' && (
          userData.student_qualification_verify.identity === 1 || userData.student_qualification_verify.identity === 2)
        ){
          $('#hk-certified-area').show();
        }

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

    // 報名層級（學制）
    $system.text(qualificationVerify && qualificationVerify.system_data && qualificationVerify.system_data.title ? qualificationVerify.system_data.title : noData);

    // 報名序號
    $userId.text(studentInfo.id.toString().padStart(6, '0'));

    // 若尚未審核，僑生編號為'未產生'
    $overseasStudentId.text(miscData && miscData.overseas_student_id ? miscData.overseas_student_id : '未產生');

    // 置放身份別代碼（有才放）
    $ruleCodeOfOverseasStudentId.text(miscData && miscData.rule_code_of_overseas_student_id ? miscData.rule_code_of_overseas_student_id : '未產生');

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
    $disability.text(personalData && personalData.disability_category ? personalData.disability_level + personalData.disability_category : '無');

    // 姓名
    $name.text(studentInfo.name ? studentInfo.name : noData);
    $engName.text(studentInfo.eng_name ? studentInfo.eng_name : noData);

    // 生日
    $birthday.text(personalData && personalData.birthday ? personalData.birthday : noData);

    // 出生地國別
    $birthLocation.text(personalData && personalData.birth_location_data && personalData.birth_location_data.country ? personalData.birth_location_data.country : noData);

    // 僑居地國別
    $residentLocation.text(personalData && personalData.resident_location_data && personalData.resident_location_data.country ? personalData.resident_location_data.country : noData);

    // 性別
    $gender.text(personalData && personalData.gender ? personalData.gender.toLowerCase() === 'm' ? '男' : '女' : '未提供');

    // 畢業學校國別
    $schoolCountry.text(personalData && personalData.school_country_data && personalData.school_country_data.country ? personalData.school_country_data.country : noData);

    // 畢業學校名稱
    $schoolName.text(personalData && personalData.school_name ? personalData.school_name : noData);

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
    $identity.text(identity);

    // 學士班 才有「成績採計方式」
    if (qualificationVerify && qualificationVerify.system_id && qualificationVerify.system_id === 1 ) {
      $applyWay.text(miscData && miscData.admission_placement_apply_way_data ? miscData.admission_placement_apply_way_data.description : '未選擇');
      $applyWayTitle.show();
      $applyWay.show();
    }

    // 學歷證明文件
    _appendEducationFile('diploma', studentInfo.student_diploma);
    // 成績單
    _appendEducationFile('transcripts', studentInfo.student_transcripts);
    // 核驗文件
    _appendEducationFile('verification-file', studentInfo.office_upload_student_files);
    // 確認報名狀態
    $confirmedStatus.text((miscData && miscData.confirmed_at ? '已' : '尚未') + '確認上傳及報名資料');

    // 審核、狀態
    $verifiedStatus.text((miscData && miscData.verified_at ? '已' : '尚未') + '審核');

    // 審核、報名狀態對應狀況
    if (miscData && miscData.confirmed_at && verifier.overseas_office.can_verify) {
      // 學生已確認報名

      // 同時學生已被審核
      if (miscData.verified_at) {

        // 非海聯窗口，學生被審核後不得增刪文件
        if (verifier.overseas_office.authority !== 1) {
          // 不能重傳文件
          $(":file").filestyle('disabled', true);
          // 不能刪原圖
          $originalDeleteBtn.prop('disabled', true);
        }

        // 不能審核
        $submitBtn.prop('disabled', true);
        // 不能編輯審核備註
        $verificationDesc.prop('readonly', true);
        // 擺上審核備註
        $verificationDesc.text(miscData.verified_memo);
      }
    } else {
      // 學生尚未確認報名

      // 不能審核
      $submitBtn.prop('disabled', true);
      // 不能編輯審核備註
      $verificationDesc.prop('readonly', true);
    }
  }

  // 將圖片依照 type append 到 DOM 上
  function _appendEducationFile(type = '', filenames = [], highlight = false) {
    for (let filename of filenames) {
      var filename_for_id = filename;
      filename_for_id = filename_for_id.replace('.','');
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
      if (type === 'verification-file') {
        $hkOfficeUploadDiv.prepend(`
          <div class="card" id='${filename_for_id}'>
            <div class="card-body">
              <embed
                src="${baseUrl}/office/students/${userId}/verification-file/${filename}"
                width="100%" height="375px"
                type="application/pdf"
                frameBorder="0"
                scrolling="auto"
              ></embed>
            </div>
            <div class="card-footer">
              <div class="pull-right">
                <a type="button" class="btn btn-info" target="_blank" style="color:white" href="${baseUrl}/office/students/${userId}/verification-file/${filename}"><i class="fa fa-search-plus" aria-hidden="true">點此放大</i></a>
                <button
                  type="button"
                  class="btn btn-danger"
                  id="original-delete-btn"
                  onclick="app.deleteEducationFile('${filename}', 'verification-file')"
                  onmousedown="event.preventDefault()">
                  <i class="fa fa-trash-o" aria-hidden="true">刪除</i>
                </button>
              </div>
            </div>
          </div>
          <hr/>
        `)
      }
    }
  }

  // <object data="${env.baseUrl}/office/students/${userId}/verification-file/${filename}"" type="application/pdf" width="700" height="375">
  //           <a href="${env.baseUrl}/office/students/${userId}/verification-file/${filename}"">test.pdf</a>
  //         </object>

  // 上傳成績單或學歷證明文件
  function uploadEducationFile(type = '', files = []) {
    loading.start();

    // 使用 formData
    let data = new FormData();

    // 將檔案一一放到 formData 中（FileList is a node list, it needs to use pure for loop.）
    for (let i = 0; i < files.length; i++) {
      // get file item
      const file = files.item(i);
      // 放到 formData 中
      data.append('files[]', file);
    }

    // 上傳囉
    API.uploadStudentEducationFile(userId, type, data).then((response) => {
      // 成功就把剛上傳的檔案們秀出來，不然就彈 alert
      if (response.ok) {
        _appendEducationFile(type, response.data.student_diploma, true);
      } else if (response.statusCode == 401) {
        alert('請先登入');
        // 若沒有登入，跳轉登入頁面
        window.location.href = './login.html';
      } else {
        alert(response.singleErrorMessage);
      }

      // 清除上傳檔案的快取
      $(":file").filestyle('clear');

      loading.complete();
    })
  }

  function downloadEducationFile(type = '') {
    window.open(`${env.baseUrl}/office/students/${userId}/${type}?type=file`,'_blank');
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
        //$(`.doc-thumbnail[data-filename="${filename}"]`).remove();
        var filename_for_id = filename;
        filename_for_id = filename_for_id.replace('.','');
        $(`#${filename_for_id}`).hide();
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

    // 確認有無相同僑居地身分證字號的同學
    API.checkDuplicateStudent(userId).then(response => {
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
    }).catch(e => {
      e.json && e.json().then((data) => {
        console.error(data);
        alert(`${data.messages[0]}`);
      });
    });

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

  function checkVerifyTime(verificationDesc){
    //只有學士班有參加個人申請且有完成提交備審資料者需要檢查收件時間
    if(student.student_misc_data.join_admission_selection == 1 && student.student_misc_data.admission_selection_document_lock_at != null && student.student_qualification_verify.system_id == 1){
      API.checkStudentVerifyTime(userId).then(response => {
        if (!response.ok){
          throw response;
        }
  
        /*
         * 有問題：200
         * 沒問題：204
         */
        if (response.status === 200){
          response.json().then(function (data) {
            // 跳個確認框 問一下收件者是否確認要收件
            if(!confirm(data.messages[0])){
              return ;
            } else{
              verifyStudentInfo(verificationDesc);
            }
          })
        } else{
          verifyStudentInfo(verificationDesc);
        }
      }).catch(e => {
        e.json && e.json().then((data) => {
          console.error(data);
          alert(`${data.messages[0]}`);
        });
      });
    } else {
      verifyStudentInfo(verificationDesc);
    }
  }

  // 開啟原圖
  function loadOriginalImgModal(src = '', alt = '', filename = '', filetype = '') {
    // 重置圖片及畫布設定
    originalImageAngleInDegrees = 0;
    isMouseDownOnImage = false;
    startDragOffset = {x: 0, y: 0};
    translatePos = {x: 0, y: 0};
    scale = 1.0;

    // 擷取畫面元素
    canvas = document.getElementById('original-img-canvas');
    ctx = canvas.getContext('2d');

    // 建立圖片元素
    originalImage = new Image();

    // 等圖片元素 load 好，就畫出來
    originalImage.onload = () => {

      renderImage();
    }

    // 置放圖片
    originalImage.src = src;

    // 設定圖片後設資料
    $originalImgCanvas.attr('data-filename', filename);
    $originalImgCanvas.attr('data-filetype', filetype);
    $originalImgTitle.html(alt);

    // 顯示 modal
    $originalImgModal.modal();
  }

  // 圖片轉向
  function renderImage(degress = 0, scaleMultiplier = 1.0) {
    // 累加角度
    originalImageAngleInDegrees = (originalImageAngleInDegrees + degress) % 360;

    // 若轉動，恢復比例及位置
    if (degress > 0) {
      isMouseDownOnImage = false; // 是否按著圖片本人
      startDragOffset = {};
      translatePos = {x: 0, y: 0};
      scale = 1.0;
    } else {
      // 若非轉動，則計算縮放比例
      scale *= scaleMultiplier;
    }

    // 清空畫布全區
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 依角度設定畫布邊長
    switch (originalImageAngleInDegrees) {
      case 0:
      case 180:
        ctx.canvas.width = originalImage.width;
        ctx.canvas.height = originalImage.height;
        break;
      case 90:
      case 270:
        ctx.canvas.width = originalImage.height;
        ctx.canvas.height = originalImage.width;
        break;
    }

    // 暫存畫布狀態
    ctx.save();
    // 移動原點以模擬拖拉
    ctx.translate(translatePos.x, translatePos.y);
    // 移動原點至畫布中心
    ctx.translate(canvas.width/2, canvas.height/2);
    // 縮放
    ctx.scale(scale, scale);
    // 順轉畫布
    ctx.rotate(originalImageAngleInDegrees*Math.PI/180);
    // 移動原點至原圖置中狀態的左上點
    ctx.translate(-originalImage.width/2, -originalImage.height/2);
    // 放置圖
    ctx.drawImage(originalImage, 0,0);
    // 恢復畫布狀態
    ctx.restore();
  }

  // 於圖上按下游標，開始拖拉
  function mouseDownOnImage(evt) {
    isMouseDownOnImage = true;
    // 計算開始拖拉位置
    startDragOffset.x = evt.clientX - translatePos.x;
    startDragOffset.y = evt.clientY - translatePos.y;
  }

  // 於圖上移動按著的游標，進行拖拉
  function mouseMoveOnImage(evt) {
    // 有按下游標才動
    if (isMouseDownOnImage) {
        // 計算畫布中心位置
        translatePos.x = evt.clientX - startDragOffset.x;
        translatePos.y = evt.clientY - startDragOffset.y;
        // 繪製
        renderImage(0);
    }
  }

  // 離開拖拉現場
  function clearDrag() {
    isMouseDownOnImage = false;
  }


  return {
    openScanner,
    searchUserId,
    checkVerifyTime,
    verifyStudentInfo,
    uploadEducationFile,
    downloadEducationFile,
    loadOriginalImgModal,
    deleteEducationFile,
    renderImage,
    mouseDownOnImage,
    mouseMoveOnImage,
    clearDrag,
  }

})();
