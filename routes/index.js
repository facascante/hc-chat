
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('login');
};
exports.option = function(req, res){
  res.render('option');
};
exports.chat = function(req,res){
   req.user.gender = req.body['gender-m'] || req.body['gender-f'] || req.user.gender;
   req.user.codename = req.body.username;
   res.render('chat',{user:req.user});
};