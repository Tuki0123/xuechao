// miniprogram/pages/goods-detail.js
// 1. 获取数据库引用
const db = wx.cloud.database();
// 引入时间js文件
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 商品信息
    goods: {},
    // 发布用户的信息
    userInfo: {},
    // 商品留言
    message: [],
    //  评论框相关变量
    //评论输入框宽度
    inputWidth: '50%',
    //  发送1，其他0
    inputSend: 0,
    //  发送颜色
     inputSendColor: '#888',
    //  输入内容
    value: '',
    //  输入的内容去除左右空格后
    inputValue: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // 获取商品信息
    var goods = wx.getStorageSync('detailGoods');
    console.log("取到了goods数据：",goods);
    that.setData({
      goods : goods
    });
    // 获取发布用户的信息
    that.getUserInfo(goods._openid);
    // 获取留言
    that.getMessage(goods._id);
  },
  // 获取发布商品的用户信息
  getUserInfo: function(e){
    var that = this;
    var openid = e;
    db.collection('user')
    .where({
      _openid: openid
    })
    .get({
      success: res=>{
        console.log("取到用户信息:",res.data[0]);
        that.setData({
          userInfo: res.data[0]
        })
      }
    })
  },
  // 获取留言
  getMessage: function(e){
    var that = this;
    var goodsId = e;
    db.collection('goods-message')
    .where({
      goods_id: goodsId
    })
    .get({
      success: res=>{
        console.log("取到留言:",res.data);
        that.setData({
          message: res.data
        })
      }
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
  // 发送留言
  sendMessage: function(){
    var that = this;
    // 获取输入内容
    var value = this.data.inputValue;
    console.log("获取输入内容：",value);
    if (value=='') {
      console.log("输入区为空");
      wx.showToast({
        title: '请不要发送空白内容',
        icon: 'none'
      })
    }else {
      console.log("输入正常");
      // 获取商品iD
      var goods_id = that.data.goods._id;
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
        goods_id: goods_id,
        value: value,
        userinfo: user,
        time: TIME,
      }
      // 写入云数据库
      db.collection('goods-message')
      .add({
        data: message
      });
      // 完成发送或将前端的输入框值清空，并将后端的输入值清空
      that.setData({
        value: '',
        inputValue: '',
      });
      // 发送成功后将评论写入本页面
      var newmessage = that.data.message;
      newmessage.push(message);
      that.setData({
        message : newmessage,
      })
      wx.showToast({
        title: '评论成功',
        icon: 'success',
        duration: 2000
      })
    }
  },
  // 评论输入框实时获取事件，用于改变发送按键字体颜色和数据中的inputValue
  inputInput: function(e){
    var value = e.detail.value.trim();
    // 发送字体颜色默认灰色
    var color = '#888';
    if (value) {
      color = '#00B26A';
    }else{
      color = '#888';
    }
    this.setData({
      inputSendColor : color,
      inputValue : value
    })
  },
   // 点击抢沙发进入评论
   doMessage: function(){
    var foucs = true;
    this.setData({
      foucs : foucs
    })
  },
  // 评论输入聚焦时
  inputFocus: function(){
    var width = '70%';
    var inputsend = 1;
    this.setData({
        inputWidth : width,
        inputSend : inputsend
    })
  },
  // 评论失去焦点时
  inputBlur: function(){
    var width = '50%';
    var inputsend = 0;
    this.setData({
        inputWidth : width,
        inputSend : inputsend
    })
  },

  // 点击我想要，进入聊天页面
  iWant:function(){
    var that = this;
    // 会话ID
    var messageId = '';
    // 获取自己的openid
    var openid = wx.getStorageSync('openid');
    // 获取商品id
    var goodsId = that.data.goods._id;
    // 获取发布用户id
    var goodsUserId = that.data.goods._openid;
    // 从消息列表中查找，是否建立对话，若有则直接跳转，若无则先创建再跳转
    that.checkMessage()
    .then((result)=>{
      console.log("then的数据:",result);
      // 如果res.data.leng==0则无会话记录
      if (result.data.length==0) {
        that.creatMessage().then((result)=>{
        console.log("会话结果:",result);
        // 得到会话id，进入消息页面
        wx.setStorageSync('messageDetail', result);
        wx.navigateTo({
          url: '../messageDetail/messageDeatil?id='+result._id,
        })
       });
      }else{
        // 入如果已有会话则直接跳转
        wx.setStorageSync('messageDetail', result.data[0]);
        wx.navigateTo({
          url: '../messageDetail/messageDeatil?id='+result.data[0]._id,
        })
      }
    });
  },
  // 查询会话
  checkMessage: function(e){
    var that = this;
     // 获取自己的openid
     var openid = wx.getStorageSync('openid')
    // 获取商品id
    var goodsId = that.data.goods._id;
    // 获取发布用户id
    var goodsUserId = that.data.goods._openid;
    let p = new Promise(function(resolve,reject){
      db.collection("message-list")
      .where({
      _openid: openid,
      objId: goodsId,
      userId: goodsUserId
    })
    .get({
      success: res =>{
        console.log("查询会话的结果:",res);
        resolve(res);
      }
    });
    })
    return p;
  },
  // 创建会话
  creatMessage:  function(){
    var that = this;
    // 获取商品id
    var goodsId = that.data.goods._id;
    // 获取发布用户id
    var goodsUserId = that.data.goods._openid;
    // 获取时间作为发起时间
    // 创建会话
    var TIME = util.formatTime(new Date());
    let p = new Promise(function(resolve,reject){
      db.collection("message-list")
      .add({
        data:{
          objId: goodsId,
          objInfo:that.data.goods,
          customerWant:false,
          sellerWant:false,
          userId: goodsUserId,
          state: true,
          time: TIME,
          type: 'goods'
        },
        success: res=>{
          console.log("创建会话成功:",res);
          resolve(res);
        },
        fail: err=>{
          console.log("创建会话失败:",err);
          reject(err);
        }
      })
    })
    return p;
  },
})