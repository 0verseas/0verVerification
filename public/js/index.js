const app = (function () {

  /**
   * cache DOM
   */
  const $userIdForm = $('#userIdForm'); // 填入報名序號
  const $userId = $('#userId'); // 報名序號
  const $overseasStudentId = $('#overseasStudentId'); // 僑生編號
  const $name = $('#name'); // 姓名
  const $engName = $('#engName'); // 英文姓名
  const $gender = $('#gender'); // 性別
  const $birthday = $('#birthday'); // 生日
  const $birthLocation = $('#birthLocation'); // 出生地
  const $residentLocation = $('#residentLocation'); // 僑居地
  const $identity = $('#identity'); // 申請身份別
  const $ruleCodeOfOverseasStudentId = $('#ruleCodeOfOverseasStudentId'); // 規則馬（身份別代碼）
  const $schoolCountry = $('#schoolCountry'); // 畢業學校國家
  const $schoolName = $('#schoolName'); // 畢業學校
  // 確認上傳及報名資料
  const $applyWay = $('#applyWay'); // 成績採計方式
  const $diplomaDiv = $('#diplomaDiv'); // 學歷證明 div
  const $transcriptDiv = $('#transcriptDiv'); // 成績單 div
  const $verificationDesc = $('#verificationDesc'); // 審核備註
  // 圖片原圖 modal
  const $originalImgModal = $('#original-img-modal');
  const $originalImg = $('#original-img');
  const $originalImgTitle = $('#original-img-title');

  /**
   * init
   */

  // const baseUrl = env.baseUrl;
  const baseUrl = 'https://yuer.tw';

  _init();

  /**
   * functions
   */

  // init
  function _init() {
    _initStudentInfo();
  }

  // init student info 把所有欄位清空
  function _initStudentInfo() {
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
    $applyWay.html('');
    $diplomaDiv.html('');
    $transcriptDiv.html('');
    $verificationDesc.html('');
  }

  // 用報名序號搜尋學生資料
  function searchUserId(userId) {
    // 判斷是不是空的
    if (userId.trim() == '') {
      $userIdForm.val('');
      return alert('請填入正確的報名序號');
    }
    console.log(userId);
    // 有無查到學生資料
    // 有的話 _renderStudentInfo

    _renderStudentInfo({
      diplomas: [
        {
          filename: 'sunnyworm.png'
        },
        {
          filename: 'avatar.jpg'
        },
        {
          filename: 'avatar2.jpg'
        },
      ]
    });
    // 沒有的話 alert 無此報名序號 _initStudentInfo
  }

  // render 學生資料 含 成績單、學歷證明
  function _renderStudentInfo(studentInfo) {

    for (let diploma of studentInfo.diplomas) {
      $diplomaDiv.append(`
        <img src="${baseUrl}/${diploma.filename}" alt="學歷證明文件" data-filetype="學歷證明文件" class="img-thumbnail doc-thumbnail" onclick="app.loadOriginalImgModal(this.src, this.dataset.filetype)">
      `)
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
