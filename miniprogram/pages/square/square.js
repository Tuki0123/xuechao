// miniprogram/pages/square/square.js
// 1. 获取数据库引用
const db = wx.cloud.database({env: 'xuchaodemo1-xxylh'});
// 引入时间js文件
var util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    posts:[],//添加iLike属性后的心情数组
    // 我点赞的数组
    iLike: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
  
      // // 获取文章
      // this.getPost();
      // // 获取我的点赞
      // this.getMyLike();
      // // 等待两件事处理完
      this.markPost();
  },
  // 为每个post添加iLike属性
  markPost: async function(){
    var that = this;
    // 获取postsOri
    var postsOri = await that.getPost();
    // 获取点赞数组
    var iLike =await that.getMyLike();
    for (let i = 0; i < postsOri.length; i++) {
      var iLikeIndex = that.findIndexOfIlike(iLike,'post_id',postsOri[i]._id);
      // 将值添加入posts对象数组
      postsOri[i].iLike = iLikeIndex;
      postsOri[i].likeSum = postsOri[i].likes.length;
    }
    that.setData({
      posts : postsOri
    })
  },
  // 查找我的点赞数组中是否有某篇文章的记录,参数为  被查找数组、查找的属性关键字、查找的值
  findIndexOfIlike: function(arr,key,value){
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key] == value){
        return true;
      }
    }
    return false;
  },
  // 获取我点赞的数据
  getMyLike: function(){
    var that = this;
    return new Promise(function(resolve,reject){
      wx.cloud.callFunction({
        name: 'getMyLike',
        success: function(res){
          console.log("getMyLike云函数调用成功:",res.result.data);
          // that.setData({iLike : res.result.data})
          // 测试异步用
          resolve(res.result.data);
        },
        fail: function(err){
          console.log("getMyLike云函数调用失败:",err)
         reject(err);
        }
      })
    })
    
  },
  //获取post数据
  getPost(){
    var page=this;
    return new Promise(function(resolve,reject){
      wx.cloud.callFunction({
        name: 'getPost', 
        success: function(res){
          console.log("getPost云函数调用成功:",res.result.list)
          // page.setData({postsOri:res.result.list});
          resolve (res.result.list);
        },
        fail: function(err){
          console.log("getPost云函数调用失败:",err)
          reject(err);
        } 
      })
    })
  },
  // 点击点赞事件
  likeBtn: function(e){
    console.log("点击了点赞,下标为：",e.currentTarget.dataset);
    var that = this;
    // 获取传入参数，文章下标
    var index = e.currentTarget.dataset.index;
    // 获取文章和opendid
    var openid = wx.getStorageSync('openid');
    var posts = that.data.posts;
    var post = posts[index];
    // 点赞数
    // var likesum = that.data.likeSum;
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
        },
        fail: err =>{
          console.log("removeMyLike云函数执行失败:",err);
          wx.showToast({
            title: '操作失败',
          })
        }
      });
      posts[index].likeSum--;
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
        },
        success: res =>{
          console.log("点赞成功",res);
        },
        fail: err =>{
          console.log("点赞失败",err);
        }
      });
      // 直接增加数组长度呢？
      // 这种写法不符合真实逻辑，本应在success中++，fail中不处理，但是会影响到渲染结果，
      posts[index].likeSum++;
    }
    var booleanValue = post.iLike;
    posts[index].iLike = !booleanValue;
    that.setData({
      posts : posts
    })
  },
    
  // 绑定事件：进入详情页
  loadDetail:function(e){
    // 获取文章下标
    var index=e.currentTarget.dataset.index;
    // 获取post
    var posts = this.data.posts;
    var detailpost = posts[index];
    // 将详情页数据写入缓存
    wx.setStorageSync('detailPost', detailpost);
    wx.navigateTo({
      url: '../postDetail/postDetail',
    })
  },
  
  // 发表按钮页跳转事件
  goAdd(e) {
    wx.navigateTo({
      url: '../publish-post/publish-post',
    })
  },

  // 绑定事件：点击已选择的图片预览
  previewImg: function(e){
    // 获取图片数组
    var imgs = e.currentTarget.dataset.imgs;
    // 调用wx.previewImage进行预览
    wx.previewImage({
      // 当前显示的图片
      current:imgs[0],
      // 所有图片
      urls: imgs,
    })
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
    //下拉刷新动画
    wx.showNavigationBarLoading()
    // 执行获取数据方法
    this.markPost();
    // 停止刷新动画
    wx.hideNavigationBarLoading()
    // 结束下拉刷新
    wx.stopPullDownRefresh()
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