
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , passport = require('passport')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('hatchcatch'));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/option',routes.option);
app.get('/authfb', passport.authenticate('facebook'));
app.get('/authtw', passport.authenticate('twitter'));
app.get('/authfb/callback', 
        passport.authenticate('facebook', {
	      successRedirect: '/option',
	      failureRedirect: '/'
	    })
);
app.get('/:version/authtw/callback', 
	    passport.authenticate('twitter', {
	      successRedirect: '/option',
	      failureRedirect: '/'
	    })
);

app.get('/logout', function(req, res){
	  req.logout();
	  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
