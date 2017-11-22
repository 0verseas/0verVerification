const nav = {
  logout: () => {
    API.logout().then(function () {
      alert('登出成功！');
      window.location.href = './login.html';
    });
  }
};
