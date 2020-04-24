// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
// 参数 event.type   event.value
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  // 类别查询
  if (event.type=='category') {
    // 全部
    if (event.value == 'all') {
      var res = await db.collection('goods')
                 .orderBy('time', 'desc')
                 .get();
    }else{
      // 普通类目
      var res = await db.collection('goods')
                 .where({
                   category: event.value
                 })
                 .orderBy('time', 'desc')
                 .get();
    }
  }else if(event.type=='search'){
    // 关键字搜索
    var res = await db.collection('goods')
                 .where({
                  title:db.RegExp({
                    regexp: event.value,
                    options:'1'
                  })
                 })
                 .orderBy('time', 'desc')
                 .get();
  }else{
    var res = await db.collection('goods')
                 .orderBy('time', 'desc')
                 .get();
  }
  return res;
}