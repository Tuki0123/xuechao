// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ =db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let res = await db.collection('message-list')
 .aggregate()
 .match(_.or([
  {
    _openid:wxContext.OPENID
  },{
    userId:wxContext.OPENID
  }
  ]))
 .lookup({
   from: 'user',
   localField: '_openid',
   foreignField: '_openid',
   as: 'userBuy',
  })
  .lookup({
    from: 'user',
    localField: 'userId',
    foreignField: '_openid',
    as: 'userSell',
   })
  .lookup({
    from: 'message',
    localField: '_id',
    foreignField: 'messageListId',
    as: 'messages',
  })
  .end();
  return res;
}