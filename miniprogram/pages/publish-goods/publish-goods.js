// miniprogram/pages/publish-goods/publish-goods.js
// 引入时间js文件
var util = require('../../utils/util.js');
// 初始化数据库
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 商品描述文字内容
    textValue: '',
    // 图片数组
    imgs: [],
    // 用于存放图片的云存储地址
    imgsList: [],
    // 发布时间
    time:'',

    // 添加图片块的display属性
    addHidden : "flex",

    // 商品名
    goodsTitle:'',

    // 价格
    price: '0.00',
    // 原价
    priceOri : '',
    // 价格输入框高度
    priceHeight : '0px',
    // 分类块高度
    categoryHeight : '0px',

    // 其他块高度
    moreHeight : '0px',
    // 分类数组
    categoryAll: ['其他','手机数码','二手书籍','体育运动','美妆首饰','鞋包服饰','日用百货'],
    // 分类选择器下标
    index: 0,

    // ISBN码
    isbnValue: '',

    // flex-none
    flexNone: 'block',
    // 是否禁用
    disabledAll: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
  // 执行发布事件
  doPublish: function(){
    var that = this;
    wx.showLoading({
      title: '正在处理'
    });
    // 关闭修改
    that.offOnChange('off');
    // 先检查
    if(that.checkAllInfo()){
        console.log("检查全部通过");
        var openid = wx.getStorageSync('openid');
        //  获取当前系统时间，作为发布时间
        var TIME = util.formatTime(new Date());
        this.setData({
          time : TIME
        });
        // 上传图片
        var imgs = that.data.imgs;
        if (imgs.length != 0) {
          // 声明数组用于存储图片fileId
          var imgsList = imgs;
          // 上传图片，
          console.log("开始传图片咯");
          // 获取处理时的时间戳
          var timestamp = Date.parse(new Date());
          // 定义prominse对象
          let promiseMrthod = new Array(imgs.length);
          for (let i = 0; i < imgs.length; i++) {
            // 保存时名字采用opendid+时间戳形式+图片数组下标+图片文件格式
            const cloudpath ="goods-images/"+openid+"-" +timestamp+"-"+i + imgs[i].match(/\.[^.]+?$/); 
            console.log("第"+i+"张图片开始上传，路径为为："+cloudpath);
            promiseMrthod[i] = wx.cloud.uploadFile({
              cloudPath: cloudpath,
              filePath: imgs[i],
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
            that.writeGoods();
          })
        }else{
          that.writeGoods();
        }
    }else{
      // 打开修改
      console.log("检查未通过,修改整顿");
      that.offOnChange('on');
    }
  },
  // 将数据写入数据库
  writeGoods: function(){
    console.log("开始写入数据库");
    var that = this;
    // 从data获取相关数据,openId,发布时间戳，文字内容，图片fileId,其中openid会自动添加
    var time = that.data.time;
    var goodsTitle = that.data.goodsTitle;
    var textValue = that.data.textValue;
    var imgsList = that.data.imgsList;
    var price = that.data.price;
    var priceOri = that.data.priceOri;
    var index = that.data.index;
    var category = that.data.categoryAll[index];
    var ISBN = that.data.ISBN;
    if (index == 2) {
      console.log("书籍商品写入数据库")
      db.collection('goods').add({
        data:{
          time: time,
          title:goodsTitle,
          textValue: textValue,
          imgs: imgsList,
          price: price,
          priceOri: priceOri,
          category: category,
          mroeInfo: {
            ISBN : ISBN,
          }
        }
      });
    }else{
      console.log("其他商品写入数据库");
      db.collection('goods').add({
        data:{
          time: time,
          title:goodsTitle,
          textValue: textValue,
          imgs: imgsList,
          price: price,
          priceOri: priceOri,
          category: category,
          state: true,
          mroeInfo: {
            
          }
        }
      });
    }
    // 发布结束，隐藏loading
    wx.hideLoading();
    // 成功提示框
    wx.showToast({
      title: '发布成功',
      icon: 'success',
      duration: 2000
    })
    that.goBack();
  },
  // 改变修改状态
  offOnChange: function(e){
    var that = this;
    console.log(e," change设置");
    if (e == 'off') {
      // 关闭
      that.setData({
        flexNone : 'none',
        addHidden: 'none',
        disabledAll: true
      })
    }else if(e == 'on'){
      // 打开
      that.setData({
        flexNone : 'block',
        addHidden: 'flex',
        disabledAll: false
      })
    }
  },
  // 检查页面内数据是否完整
  checkAllInfo: function(){
    var that = this;
    // 或许需要发送的必要信息
    var goodsTitle = that.data.goodsTitle;
    var imgs = that.data.imgs;
    var price = that.data.price;
    // 开始判断
    if (goodsTitle.length == 0) {
      wx.hideLoading({
        complete: (res) => {console.log("商品名未输入")},
      });
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      });
      return false;
    }
    if (price == '0.00') {
      wx.hideLoading({
        complete: (res) => {console.log("检查到价格未输入")},
      })
      wx.showModal({
        title: '未添加售价',
        content: '售价为0.00人民币?',
        cancelText: '否',
        confirmText: '是',
        success: res=>{
          if (res.confirm) {
            console.log("再次确认售价为0.00元");
          } else if(res.cancel) {
            console.log("修改售价");
            return false;
          }
        }
      })
    }    
    if (imgs.length == 0) {
      wx.hideLoading({
        complete: (res) => {console.log("无图片")},
      });
      wx.showModal({
        title: '未添加图片',
        content: '是否添加图片完善商品信息?',
        cancelText: '否',
        confirmText: '是',
        success: res=>{
          if (res.confirm) {
            console.log("执行添加图片的事件");
            return false;
          } else if(res.cancel) {
            console.log("不添加图片继续执行");
          }
        }
      });
    }
    return true;
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
  // 文本输入框输入事件
  getTextValue: function(e) {
    var that = this;
    // 判断输入的来源
    var type = e.currentTarget.dataset.type;
    /*
      textare ->来自textarea  ->textValue
      price-sale -> 来自input  -> price
      price-ori  ->来自input   -> priceOri
      ISBN ->来自isbn input ->isbnCode
      title - ----- >  goodsTitle
    */
    // 去除前后空格
    var value = e.detail.value.trim();
    if (type=='textarea') {
      that.setData({
        textValue : value
      })
    }else if(type == 'price-sale'){
      if (value.length>=9) {
        wx.showToast({
          title: '请输入一亿以内的整数',
          icon: 'none'
        })
      }else{
        if (value.length==0){
          value='0.00'
        }else{
          value += '.00';
        }
        that.setData({
          price : value
        })
      }
    }else if(type == 'price-ori'){
      if (value.length>=9) {
        wx.showToast({
          title: '请输入一亿以内的整数',
          icon: 'none'
        })
      }else{
        if (value.length==0){
          value='0.00'
        }else{
          value += '.00';
        }
        that.setData({
          priceOri : value
        })
      }
    }else if(type == 'ISBN'){
      that.setData({
        isbnValue : value
      })
    }else if(type == 'title'){
      that.setData({
        goodsTitle: value
      })
    }
    },
  // 绑定事件：选择图片
  selectImgs: function(){
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
        // 取到数组
        var imgs = that.data.imgs;
        for (let i = 0; i < tempFilePaths.length; i++) {
          // 循环将图片push入数组
          if (imgs.length >= 9) {
            // 如果选择图片数量大于9,则退出循环
            break;
          } else {
            imgs.push(tempFilePaths[i]);
          } 
        }
        // 将图片发回
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
  // 更多信息设置块隐藏开关
  hiddenWapper: function(e){
    var that = this;
    // 判断输入的来源
    var type = e.currentTarget.dataset.type;
    /*
      price ->来自价格块  ->priceHeight
      category -> 来自类别块  -> categoryHeight
    */
    if (type == 'price') {
      var priceHeight = that.data.priceHeight;
      if (priceHeight == '0px') {
        priceHeight ='80px'
      }else{
        priceHeight ='0px'
      }
      that.setData({
        priceHeight : priceHeight
      })   
    } else if(type == 'more') {
      var index = that.data.index;
      var moreHeight = that.data.moreHeight;
      if (moreHeight == '0px') {
        if (index==2) {
          moreHeight='80px'
        }else{
          moreHeight='40px'
        }
      }else{
        moreHeight ='0px'
      }
      that.setData({
        moreHeight : moreHeight
      })   
    }
  },
  // 获取分类选择器数据
  changeCategory: function(e){
    var that = this;
    var select = e.detail.value;
    var height = that.data.moreHeight;
    if (select == 2) {
      height='80px'
    }
    this.setData({
      moreHeight : height,
      index : select
    })
  },
  // 检查ISBN输入信息
  checkISBN: function(){
    var that = this;
    var isbn = that.data.isbnValue;
    wx.showLoading({
      title: '查询中',
    });
    if(isbn.length == 10){
      isbn = '978'+isbn;
    }
    if (isbn.length != 13) {
      wx.hideLoading({
        complete: (res) => {},
      });
      wx.showToast({
        title: 'ISBN码为10/13位数字',
        icon: 'none'
      })
      return false;
    }else{
      // 查询ISBN码
      console.log("ISBN格式正确，开始网上查询书名：",isbn);
      wx.request({
        url: 'http://49.234.70.238:9001/book/worm/isbn?isbn='+isbn,
        success: res=>{
          wx.hideLoading();
          console.log("查询成功",res);
          if (res.data.data.length==0) {
            wx.showToast({
              title: '未查到相关信息',
              icon: 'none'
            })
          } else {
            var backdata = res.data.data[0]; 
              wx.showModal({
                title: '查到的书名',
                content: backdata.name,
                showCancel: false,
              })
          }
        },
        fail: err=>{
          wx.hideLoading();
          console.log("查询失败:",err)
        }
      })
    }
  },
  goBack: function(){
    console.log("返回上一页面");
    wx.navigateBack({
      delta: 1
    })
  }
})