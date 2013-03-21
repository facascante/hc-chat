var parent = module.parent.exports
  , server = parent.server
  , client = parent.client
  , pub = parent.pub
  , sub = parent.sub
  , model = require("./client")
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , redis = require("redis")
  , cookieParser = require("connect").utils.parseSignedCookies
  , timer = require("./timer")
  , async = require('async')
  , cookie = require("cookie");
  
var io = sio.listen(server);
io.set('log level', 1);
io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = cookieParser(cookie.parse(hsData.headers.cookie), "hatchcatch")
      , sid = cookies['hatchcatch'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.hatchcatch = {
        user: session.passport.user
      };

      return accept(null, true);
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore({redis: redis, redisPub: pub,redisSub: sub,redisClient: client}));
  io.enable('browser client minification');
  io.enable('browser client gzip');
});



io.sockets.on('connection', function (socket) {
  
  var hs = socket.handshake.hatchcatch.user;
  var user = {
		  		username: hs.username,
		  		provider: hs.provider, 
		  		codename: hs.codename, 
		  		gender: hs.gender, 
		  		photourl: hs.photourl
  };
  model.accomodateVisitor(client,user,function(err,room){
	  socket.join(room);
	  
  });
  
  
});
