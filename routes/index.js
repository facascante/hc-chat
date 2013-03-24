var model = require("../client");

/*
 * GET home page.
 */

exports.ranking = function(req, res){
	console.log(req.cookies.data);
	  res.render('ranking',{user:req.user});
};
exports.index = function(req, res){
  res.render('login');
};
exports.option = function(req, res){
  res.render('option');
};
exports.chat = function(req,res){
	console.log(req.query);
   req.user.gender = req.query['gender-m'] || req.query['gender-f'] || req.user.gender;
   console.log(req.user.gender);
   if((req.query['gender-m'] || req.query['gender-f']) && req.query.username){
	   req.user.codename = req.query.username;
	   res.render('chat',{user:req.user});
   }
   else{
	   res.render('chat',{user:req.user});
   }
   
};