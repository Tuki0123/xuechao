// miniprogram/pages/all/all.js
//  获取数据库引用
const db = wx.cloud.database()
// 引入时间js文件
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 选中和未选择数组
    select:[],
    // 当前模块
    currentPage:'',
    // 发布页面相关
    // 发布的类型
    publishType:'errand',
    // 文字内容
    textValue:'',
    value:'',

    // task数组
    task:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // 默认选中
    var select = ['selected','none','none'];
    var currentPage = 0;
    that.setData({
      select:select,
      currentPage:currentPage
    })

  },
  // 加载数据
  loadTask: async function () {
    var that = this;
    // 云函数获取数据
    let res = await  wx.cloud.callFunction({
      name:'getTask',
    });
    console.log(res);
    var tasks = res.result.data;
    that.setData({
      task : tasks
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
    that.loadTask();
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
  // 选中模块
  selectItem: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.index;
    // 获取当前的选择数组和页面
    var select = that.data.select;
    var currentPage = that.data.currentTarget;
    console.log("点击了某功能块:",e.currentTarget.dataset.index);
    if(id==currentPage){
      // 点击的就是当前页面，什么都不做
    }else{
      // 点击的是其他页面,改变
      // 先将选中变为none
      for (let i = 0; i < select.length; i++) {
        if (select[i]=='selected') {
          select[i] = 'none'
        }
      }
      select[id] = 'selected'
      // 写回data
      that.setData({
        select: select,
        currentPage: id
      })
    }
    
  },

  // 单选框改变
  getRadio: function (e) {
    console.log("点击了单选框:",e.detail.value)
    var type = e.detail.value;
    this.setData({
      publishType: type
    })
  },
  // 获取文字内容
  getText: function (e) {
    var value = e.detail.value.trim();
    this.setData({
      textValue : value
    })
  },
  // 处理发布
  doPublish: function(){
    var that = this;
    // loading
    wx.showLoading({
      title: '正在处理',
    })
    // 获取输入内容
    var value = this.data.textValue;
    if (value=='') {
      wx.hideLoading({
        complete: (res) => {},
      })
      wx.showToast({
        title: '请不要发送空白内容',
        icon: 'none'
      })
    }else {
      console.log("输入正常");
      // 获取类型
      var type = that.data.publishType;
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
      var task = {
        type: type,
        textValue: value,
        userinfo: user,
        time: TIME,
        state: true,
      }
      // 写入云数据库
      db.collection('task')
      .add({
        data: task
      });
      // 完成发送或将前端的输入框值清空，并将后端的输入值清空
      that.setData({
        textValue: '',
        value: '',
      });
      wx.hideLoading({
        complete: (res) => {},
      })
      // 发送成功后将消息写入本页面
      // var newMessages = that.data.messages;
      // message._openid = that.data.myOpenid;
      // newMessages.push(message);
      // that.setData({
      //   messages : newMessages,
      // })
    }
  },
  // 点击联系，进入聊天页面
  goMessage:function(e){
    var index = e.currentTarget.dataset.index;
    var that = this;
    // 会话ID
    var messageId = '';
    // 获取自己的openid
    var openid = wx.getStorageSync('openid');
    // 获取taskid
    var taskId = that.data.task[index]._id;
    // 获取发布用户id
    var userId = that.data.task[index]._openid;
    // 从消息列表中查找，是否建立对话，若有则直接跳转，若无则先创建再跳转
    that.checkMessage(index)
    .then((result)=>{
      // 如果res.data.leng==0则无会话记录
      if (result.data.length==0) {
        that.creatMessage(index).then((result)=>{
        console.log("创建会话结果:",result);
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
  checkMessage: function(index){
    var that = this;
     // 获取自己的openid
     var openid = wx.getStorageSync('openid')
    // 获取taskid
    var taskId = that.data.task[index]._id;
    // 获取发布用户id
    var userId = that.data.task[index]._openid;
    let p = new Promise(function(resolve,reject){
      db.collection("message-list")
      .where({
      _openid: openid,
      objId: taskId,
      userId: userId
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
  creatMessage:  function(index){
    var that = this;
    // 获取taskid
    var taskId = that.data.task[index]._id;
    // 获取发布用户id
    var userId = that.data.task[index]._openid;
    // 获取时间作为发起时间
    var TIME = util.formatTime(new Date());
    // 创建会话
    let p = new Promise(function(resolve,reject){
      db.collection("message-list")
      .add({
        data:{
          objId: taskId,
          objInfo:that.data.task[index],
          customerWant:false,
          sellerWant:false,
          userId: userId,
          state: true,
          time: TIME,
          type: that.data.task[index].type
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