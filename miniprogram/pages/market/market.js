// pages/market/market.js

// 1. 获取数据库引用
const db = wx.cloud.database();
// 引入时间js文件
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 商品数组
    goods: [],
    // 搜索框
    inputValue:'',
    value:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    
    // 向云端请求商品数据
    that.getGoods('category','all');
  },
  // 请求商品数据
  getGoods:function(type,value){
    console.log("执行云函数加载数据");
    wx.showLoading({
      title: '正在加载',
    });
    var that = this;
    wx.cloud.callFunction({
      name: 'getGoods',
      data:{
        type: type,
        value:value
      },
      success: res=>{
        console.log("getGoods云函数执行成功：",res)
        that.setData({
          goods : res.result.data
        })
      },
      complete: res=>{
        console.log("getGoods执行完成：结果：",res);
        wx.hideLoading({
          complete: (res) => {console.log("页面加载完成")},
        })
      }
    })
  },
  // 分类请求商品
  getCategoryGoods: function (e) {
    var that = this;
    var value = e.currentTarget.dataset.value;
    that.getGoods('category',value);
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
  // 详情页跳转事件
  goGoodsDetail(e){
    var that = this;
    console.log('进入详情页:',e);
    var goods = that.data.goods[e.currentTarget.dataset.index];
    wx.setStorageSync('detailGoods', goods);
    wx.navigateTo({
      url: '../goods-detail/goods-detail',
    });
  },
  // 发布商品页面跳转
  goPublish: function (){
    console.log("进入商品发布页面");
    wx.navigateTo({
      url: '../publish-goods/publish-goods',
    })
  },
  // 获取搜索框内容
  getInput: function (e) {
    var value = e.detail.value.trim();
    this.setData({
      inputValue : value
    })
  },
  // 搜索
  doSearch: function () {
    var that = this;
    var value = that.data.inputValue;
    if (!value) {
      wx.showToast({
        title: '请输入有效值',
        icon: 'none'
      })
    }else{
      that.getGoods('search',value);
    }
    that.setData({
      value:'',
      inputValue:''
    })
  }
})