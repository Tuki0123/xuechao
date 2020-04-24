//index.js
const app = getApp();
// 链接数据库
const db = wx.cloud.database();

Page({
  data:{
     userInfo:{},
     openid:" "
  },
  onLoad: function(){
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        env:'xuchaodemo1-xxylh',
        traceUser: true,
      })
    }
    // 无论是否授权都可以获取到openid
    //获取ID
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid);
        // 将openid写入data中
        this.setData({
          openid : res.result.openid
        });
        // 将openid直接添加进缓存
        wx.setStorageSync('openid', res.result.openid);
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
    //获取用户授权信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {         
              console.log("用户已授权：",res); 
              // 将用户信息存入缓存
              wx.setStorageSync('userinfo', res.userInfo);
              // 跳转进主页
              wx.switchTab({
                url: '../square/square',
              })
            }
          })
        }else{
          console.log("用户未授权：",res);
        }
      }
    })
  },
  
  // 登录事件函数
  haddleGetUserInfo(e){
    wx.showLoading({
      title:'处理中',
    })
    // 打印登录返回信息
    console.log("登录用户信息：",e);
    // 从返回值中取出用户信息
    const{userInfo}=e.detail;
     // 将用户信息存入缓存
    console.log("将用户写入缓存：",userInfo);
    wx.setStorageSync('userinfo', userInfo);
    this.setData({
      userInfo : userInfo
    });
    // 写入数据库
    this.putUser();
    wx.hideLoading({
      complete: (res) => {},
    })
    // 跳转进主页
    wx.switchTab({
      url: '../square/square',
    })

  },
  // 将用户写入数据库
  putUser: function(){
    // 获取用户信息
    var userInfo = this.data.userInfo;
    var openId = this.data.openid;
    // 先查找，若已有信息，则更新
    db.collection('user').where({
      _openid: openId
    }).get({
      success: res=>{
        console.log("查询用户库结果:",res);
        if (res.result.data.length==0) {
          console.log("将用户写入数据库：",userInfo);
          db.collection('user').add({
            data: {
              userInfo : userInfo,
              identification : false,
              university : "none",
              college : "none"
            }
          });
        } else {
          // 更新
          db.collection('user').doc(res.result.data[0]._id).update({
            data:{
              userInfo: userInfo
            },
            complete: res=>{
              console.log("更新完成",res);
            }
          })
        }
      }
    })
    
  }
})