// miniprogram/pages/publish-post/publish-post.js

// 引入时间js文件
var util = require('../../utils/util.js');
// 初始化数据库
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:{},
    openId:'',
    // // 发布
    time: '',
    // 文字内容
    textContent:'',
    // 选择图片的路径
    imgs: [],
    // 存放图片上传后的fileId
    imgsList:[],
    // 用于隐藏增加块的变量
    addHidden:"flex",
    // 用于隐藏删除按钮的变量
    delectIcon:"block",
    // 用于设置文本框是否可更改
    textDisabled: false,
    // 用于隐藏发布按钮
    publishBtn: 'block',
    // 发布过程
    showUploadProgress:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     // 从缓存中获取用户信息
     let userinfo = wx.getStorageSync('userinfo');
     let openid = wx.getStorageSync('openid');
     this.setData({
       userInfo : userinfo,
       openId : openid
     });    
  },
  // 绑定事件：获取文字内容
  getTextareaValue: function(e){
      this.setData({
        textContent : e.detail.value
      })
  },

  // 绑定事件：选择图片
  selectImg: function(){
    var that = this;
    wx.chooseImage({
      // 选择的数量
      count:9,
      // 画质，原图、压缩
      sizeType: ['original','compressed'],
      // 来源：相册、相机'camera'
      sourceType: ['album','camera'],
      success: function (res){
        // res.tempFilePaths 返回图片本地文件路径列表
        console.log("wx.chooseImage成功的回调:",res);
        var tempFilePaths = res.tempFilePaths;
        var imgs = that.data.imgs;
        for (let i = 0; i < tempFilePaths.length; i++) {
          // 如果图片数量大于9
          if (imgs.length >= 9) {
            break;
          } else {
            imgs.push(tempFilePaths[i]);
          } 
        }
        that.setData({
          imgs : imgs
        });
        // 如果图片达到9张，则隐藏添加块
        if (that.data.imgs.length == 9) {
          that.setData({
            addHidden : "none"
          });
        }else{
          that.setData({
            addHidden : "flex"
          });
        }
      },
      complete: (res) => {
        console.log("wx.chooseImage执行完毕")
      },
    })  
  },
  // 绑定事件：删除图片,传入参数为index下标
  deleteImg: function(e){
    // console.log("删除图片函数传入参数：",e);
    // 获取图片数组
    var imgs = this.data.imgs;
    // 获取下标
    var index = e.currentTarget.dataset.index;
    // console.log("删除图片下标为：",index);
    // 从图片数组中移除该下标图片
    imgs.splice(index,1);
    // 重设图片数组
    this.setData({
      imgs: imgs,
      addHidden : "flex",
    });
  },
  // 绑定事件：点击已选择的图片预览
  previewImg: function(e){
    // 获取图片下标
    var index = e.currentTarget.dataset.index;
    // 获取图片数组
    var imgs = this.data.imgs;
    // 调用wx.previewImage进行预览
    wx.previewImage({
      // 当前显示的图片
      current:imgs[index],
      // 所有图片
      urls: imgs,
    })
  },
  // 绑定事件：发表post
  publishPost: function(){
    var that = this;
    
    // 获取openId
    var openid = this.data.openId;
    // 获取文字内容
    var textContent = that.data.textContent; 
    // 获取图片数组
    var imgs = that.data.imgs;
    // 判断是否有内容,如果没文字且没图片则终止操作
    if ((textContent.length==0)&&(imgs.length==0)) {
      console.log("你他娘的啥都没写？");
      wx.showToast({
        title: '请添加内容或图片',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    // 如果有文字或图片就继续操作
    // 禁用更改
    this.offChange();
    //  获取当前系统时间，作为发布时间
    var TIME = util.formatTime(new Date());
    this.setData({
      time : TIME
    });
    // 如果有图片先上传图片
    if (!imgs.length==0) {     
      // 声明数组用于存储图片fileId
      var imgsList = that.data.imgsList;
      // 上传图片，
      console.log("开始传图片咯");
      // 获取处理时的时间戳
      var timestamp = Date.parse(new Date());
      // 定义prominse对象
      let promiseMrthod = new Array(imgs.length);
      for (let i = 0; i < imgs.length; i++) {
        // 保存时名字采用opendid+时间戳形式+图片数组下标+图片文件格式
        const cloudpath ="post-images/"+openid+"-" +timestamp+"-"+i + imgs[i].match(/\.[^.]+?$/); 
        console.log("第"+i+"张图片开始上传，路径为为："+cloudpath);
        promiseMrthod[i] = wx.cloud.uploadFile({
          cloudPath: cloudpath,
          filePath: imgs[i],
          // success: res => {
          //   // 返回fileId
          //   console.log("图片上传成功", i);
          //   imgsList[i] = res.fileID;
          // }
        }).then(res =>{
          console.log("图片上传成功", i);
          imgsList[i] = res.fileID;
        });
      };
      // 等待所有上传完毕
      Promise.all([...promiseMrthod]).then(()=>{
        console.log("图片传完咯，返回的fileId：",imgsList);
        // 将fileId返回imgList数组
        that.setData({
          imgsList : imgsList
        });
        // 上传图片结束
        // 将post写入数据库
        that.writePost();
      })
    }
    // 若无图片直接上传
    else{
      that.writePost();
    }
    
  },
  
  //将post写入数据库
  writePost: function(){
    console.log("开始写入数据库");
    var that = this;
    // 从data获取相关数据,openId,发布时间戳，文字内容，图片fileId,其中openid会自动添加
    var time = that.data.time;
    var textContent = that.data.textContent;
    var imgsList = that.data.imgsList;
    db.collection('post').add({
      data:{
        time: time,
        textContent:textContent,
        imgs: imgsList,
      }
    });
    // 发布结束，隐藏loading
    wx.hideLoading();
    // 成功提示框
    wx.showToast({
      title: '发布成功',
      icon: 'success',
      duration: 2000
    })
  },
  // 文本框、图片删除、图片添加、发表按钮设置为不可用
  offChange: function(){
    // 弹出loading框,发送结束后hide
    wx.showLoading({
      title: '正在发布'
    });
    // 通过改变DATA来设置相应元素状态
    this.setData({
      textDisabled: true,
      delectIcon : "none",
      addHidden : "none",
      publishBtn : "none",
    });
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