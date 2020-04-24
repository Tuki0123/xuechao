// 云函数入口文件
// 用于获取点赞的云函数
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let res = await db.collection('post-like')
            .where({
              _openid:wxContext.OPENID
            })
            .field({
              _id: true,
              post_id: true,
            })
            .orderBy('time', 'desc')
            .get();
  return res;
}