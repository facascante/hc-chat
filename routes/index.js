
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
  res.render('chat');
};