// miniprogram/pages/postDetail/postDetail.js
//  获取数据库引用
const db = wx.cloud.database()
var app=getApp();
// 引入时间js文件
var util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
     post:{}, //post
     comments:[],
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
    // 输入框焦点
    foucs: false,
    // 评论数
    commentSum: '',
    // 点赞数
    likeSum: '',

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
     // 从缓存中获取post
      var post = wx.getStorageSync('detailPost');
      console.log("传入参数为:",post);
      var page=this;
      var post=post;
      page.setData({
        post:post
      });
      this.setData({
        comments : post.comments,
        commentSum : post.comments.length,
        likeSum: post.likes.length
      })
  },
  // 点击点赞事件
  likeBtn: function(){
    console.log("点击了点赞");
    var that = this;
    // 获取文章和opendid
    var openid = wx.getStorageSync('openid');
    var post = that.data.post;
    // 点赞数
    var likesum = that.data.likeSum;
    // 先判断是否点赞了
    if (post.iLike) {
      // 点过赞的,则删除点赞
      console.log("删除点赞记录");
      wx.cloud.callFunction({
        name: 'removeMyLike',
        data:{
          _id: post._id
        },
        success: res => {
          console.log("removeMyLike云函数执行成功:",res)
        }
      });
      likesum--;
    } else {
      // 没点过赞，则写入点赞记录
      console.log("写入点赞记录");
      var TIME = util.formatTime(new Date());
      // 将点赞记录写入数据库
      db.collection('post-like')
      .add({
        data:{
          post_id : post._id,
          time : TIME
        }
      });
      likesum++;
    }
    var booleanValue = post.iLike;
    post.iLike = !booleanValue;
    that.setData({
      likeSum : likesum,
      post : post
    })
  },
  
  // 发送评论事件
  sendComment: function(){
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
      // 获取动态ID
      var post_id = that.data.post._id;
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
      var comment = {
        post_id: post_id,
          value: value,
          userinfo: user,
          time: TIME,
      }
      // 写入云数据库
      db.collection('post-comment')
      .add({
        data: comment
        // {
        //   post_id: post_id,
        //   value: value,
        //   userinfo: user,
        //   time: TIME,
        // }
      });
      // 完成发送或将前端的输入框值清空，并将后端的输入值清空
      that.setData({
        value: '',
        inputValue: '',
      });
      // 发送成功后将评论写入本页面
      var newcomments = that.data.comments;
      newcomments.push(comment);
      that.setData({
        comments : newcomments,
        commentSum : newcomments.length,
      })
      wx.showToast({
        title: '评论成功',
        icon: 'success',
        duration: 2000
      })
    }
  },
  // 点击抢沙发进入评论
  doComment: function(){
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

  }
})