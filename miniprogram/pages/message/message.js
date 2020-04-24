// pages/message/message.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 我的openid
    myOpenid: '',
    // 消息列表
    messageList:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that =this;
    that.setData({
      myOpenid : wx.getStorageSync('openid')
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
  onShow: async function () {
    await this.loadMessageList();
  },
  // 加载消息列表
  loadMessageList: async function () {
    var that = this;
    var myOpenid = that.data.myOpenid;
    var res = await wx.cloud.callFunction({
      name:'getMessageList',
    })
    var messageList = res.result.list;
    // 循环判断对方
    for (let i = 0; i < messageList.length; i++) {
      if (messageList[i].userBuy[0]._openid==myOpenid) {
        messageList[i].otheruser=messageList[i].userSell[0];
      } else {
        messageList[i].otheruser=messageList[i].userBuy[0];
      }
    }
    that.setData({
      messageList: messageList
    })
  },
  // 进入消息详情页面
  goMessageDetail: function (e) {
    var messageDeatil = this.data.messageList[e.currentTarget.dataset.index];
    wx.setStorageSync('messageDetail', messageDeatil);
    wx.navigateTo({
      url: '../messageDetail/messageDeatil?id='+messageDeatil._id,
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: async function () {

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
    wx.showNavigationBarLoading({
      // complete: (res) => {console.log("下拉刷新动画")},
    })
    this.loadMessageList();
    wx.hideNavigationBarLoading({
      // complete: (res) => {console.log("完成停止加载")},
    })
    wx.stopPullDownRefresh({
      // complete: (res) => {console.log("定制下拉刷新")},
    })
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
  
})