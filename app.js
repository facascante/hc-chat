
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , passport = require('passport')
  , path = require('path')
  , redis = require("redis")
  , model = require("./client")
  , RedisStore = require("connect-redis")(express);

var client = exports.client  = redis.createClient();
var pub = exports.pub  = redis.createClient();
var sub = exports.sub  = redis.createClient();
var sessionStore = exports.sessionStore = new RedisStore({client: client});

require('./strategy');

var app = exports.app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('hatchcatch'));
  app.use(express.session({
        key: "hatchcatch",
        store: sessionStore
  }));
  app.use(
		  function(req,res,next){
			  req.client = exports.client;
			  next();
		  }
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.logger('dev'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function restrict(req,res,next){
	if(req.isAuthenticated()){
		next();
	}
	else{
		req.logout();
		res.redirect('/');
	}
}
app.get('/', routes.index);
app.get('/option',restrict,routes.option);
app.post('/chat',restrict,routes.chat);
app.get('/authfb', passport.authenticate('facebook'));
app.get('/authtw', passport.authenticate('twitter'));
app.get('/authfb/callback', passport.authenticate('facebook', {successRedirect: '/option',failureRedirect: '/'}));
app.get('/authtw/callback', passport.authenticate('twitter', {successRedirect: '/option',failureRedirect: '/'}));
app.get('/ranking',restrict,function(req, res){
      var client = redis.createClient();
	  var members = new Array();
	  var ctr = 0;
	  model.roomList(client,function(err,rooms){
		  if(rooms && rooms.length){
			  rooms.forEach(function(room){
				  console.log(room);
				  model.roomVisitors(client,room,function(visitors){
					  console.log("===============");
					  console.log(visitors);
					  ctr++;
					  if(visitors && visitors.length){
						  console.log(visitors);
						  visitors.forEach(function(visitor){
							  console.log(visitor);
							  members.push(JSON.parse(visitor));
						  });
					  }
					  if(ctr >= rooms.length){
						  console.log("chito");
						  console.log(members);
						  res.render('ranking',{members:members});
					  }
				  });
			  });
		  }
		  else{
			  res.render('ranking',{members:members});
		  }
	  });
});
app.get('/logout', function(req, res){
	
    req.logout();
	res.redirect('/');
});

exports.server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

require('./sockets');

client.keys('hc:*', function(err, keys) {
    keys.forEach(function(key){client.del(key)});
    console.log('Deletion of all redis reference ', err || "Done!");
});



