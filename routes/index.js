var model = require("../client");

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
	console.log(req.body);
   req.user.gender = req.body['gender-m'] || req.body['gender-f'] || req.user.gender;
   console.log(req.user.gender);
   if((req.body['gender-m'] || req.body['gender-f']) && req.body.username){
	   req.user.codename = req.body.username;
	   res.render('chat',{user:req.user});
   }
   else{
	   res.render('option');
   }
   
};