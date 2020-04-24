// miniprogram/pages/messageDetail/messageDeatil.js
//  获取数据库引用
const db = wx.cloud.database()
// 引入时间js文件
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 我的openid
    myOpenid:'',
    // 会话id
    id:'',
    // 会话信息
    messageDetail:{},
    // 消息数组
    messages: [],

    // 输入的信息
    value: '',
    inputValue: '',
    // 定时器id
    intervalNum: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:  function (options) {
    var that = this;
    // 获取自己的openid
    var openid = wx.getStorageSync('openid')
    // options为会话id
    db.collection('message-list')
    .doc(options.id)
    .get({
      success: res=>{
        console.log("查询会话记录成功:",res);
      },
      fail: err=>{
        console.log("查询会话记录失败:",err);
      },
      complete: res=>{
        // 先写入data
        that.setData({
          messageDetail: res.data,
          myOpenid: openid,
          id : options.id
        });
        // 第一次自动调用获取消息的方法
         that.getMessages();
      }
    })
  },
  // 获取消息
  getMessages: async function () {
    var that = this;
    var id = this.data.id;
    console.log("开始获取消息:",id);
    var res = await wx.cloud.callFunction({
      name:'getMessages',
      data:{
        id: id
      },
    });
    console.log("查询到的消息:",res);
    that.setData({
      messages:res.result.data
    });
    console.log("获取一次完毕")
    //  每10秒执行一次
    // setTimeout(this.getMessages(id), 10000);
    // 自动移步到最下面
    wx.pageScrollTo({
      selector: '.bottom-anchor',
      duration: 200,
      complete: (res) => {},
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    // 每隔5s调用一次获取消息
    var intervalNum = setInterval(that.getMessages,5000);
    that.setData({
      intervalNum : intervalNum
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    var id = this.data.intervalNum;
    // 取消定时器
    clearInterval(id);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  // 发送消息
  sendMessage: function(){
    var that = this;
    // 获取输入内容
    var value = this.data.inputValue;
    if (value=='') {
      console.log("输入区为空");
      wx.showToast({
        title: '请不要发送空白内容',
        icon: 'none'
      })
    }else {
      console.log("输入正常");
      // 获取会话ID
      var id = that.data.id;
      // 获取用户信息
      var userinfo = wx.getStorageSync('userinfo');
      // 将需要的信息封装
      var user = {
        "nickName": userinfo.nickName,
        "avatarUrl": userinfo.avatarUrl,
      };
      // 获取时间作为评论时间
      var TIME = util.formatTime(new Date());
      // 将写入内容封装
      var message = {
        messageListId: id,
        value: value,
        userinfo: user,
        time: TIME,
      }
      // 写入云数据库
      db.collection('message')
      .add({
        data: message
      });
      // 完成发送或将前端的输入框值清空，并将后端的输入值清空
      that.setData({
        value: '',
        inputValue: '',
      });
      // 发送成功后将消息写入本页面
      var newMessages = that.data.messages;
      message._openid = that.data.myOpenid;
      newMessages.push(message);
      that.setData({
        messages : newMessages,
      })
      // 自动移步到最下面
      wx.pageScrollTo({
        selector: '.bottom-anchor',
        duration: 200,
        complete: (res) => {},
      })
    }
  },
  // 输入框实时获取事件
  inputInput: function(e){
    var value = e.detail.value.trim();
    this.setData({
      inputValue : value
    })
  },

  // 处理下单
  doOrder: function (e) {
    var that = this;
    // 获取处理类型
    var type = e.currentTarget.dataset.type;
    // 获取会话
    var messageDetail = that.data.messageDetail;
    wx.showLoading({
      title: '处理中',
    })
    // 下单
    // 修改商品库/任务库
    db.collection(type).doc(messageDetail.objId).update({
      data:{
        state:false
      },
      success: res=>{
        // 修改聊天库
        db.collection('message-list').doc(messageDetail._id).update({
          data:{
            state: false
          },
          success:res=>{
            console.log("修改聊天库成功：",res);
            messageDetail.state=false;
            that.setData({
              messageDetail: messageDetail
            })
          }
        })
      },
      complete: res=>{
        wx.hideLoading() 
      }
    })
    
  }
})