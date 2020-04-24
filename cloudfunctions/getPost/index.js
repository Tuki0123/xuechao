// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // const wxContext = cloud.getWXContext()
  let res = await db.collection('post')
 .aggregate()
//  聚合查询中不支持orderby，可以用sort实现排序功能
 .sort({
   time: -1
 })
 .lookup({
   from: 'user',
   localField: '_openid',
   foreignField: '_openid',
   as: 'userinfo',
  })
  .lookup({
    from: 'post-comment',
    localField: '_id',
    foreignField: 'post_id',
    as: 'comments',
  })
  .lookup({
    from: 'post-like',
    localField: '_id',
    foreignField: 'post_id',
    as: 'likes',
  })
  .end();
  return res;
}