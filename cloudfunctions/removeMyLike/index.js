// 用于删除点赞记录
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
// 异步写法
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  console.log("异步写法");
  return new Promise((resolve,reject)=>{
    db.collection('post-like')
    .where({
      _openid: wxContext.OPENID,
      post_id: event._id
    })
    .remove({
      success: res=>{
        resolve(res)
      },
      fail: err=>{
        reject(err)
      }
    });
  })
}

// 原版写法,存在问题，因数据库操作有延时，导致返回数据不及时，跟不上页面的刷新
// exports.main = async (event, context) => {
//   const wxContext = cloud.getWXContext();
//   let res = await db.collection('post-like')
//   .where({
//     _openid: wxContext.OPENID,
//     post_id: event._id
//   })
//   .remove();
//   return res;
// }