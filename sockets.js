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

var timer_start =false;

io.sockets.on('connection', function (socket) {
  
	if(!timer_start){
		timer.Timer(function(){
			console.log("timer started");
			model.roomList(client,function(err,rooms){
				rooms.forEach(function(room){
					console.log("timer stopped:" + room);
					io.sockets.in(room).emit('start_chat', true); 
				});
			});
			
		},30000);
		timer_start = true;
	}
  var hs = socket.handshake.hatchcatch.user
    , username = hs.username
    , provider = hs.provider
    , codename = hs.codename
    , gender = hs.gender
    , photourl = hs.photourl;
  var user = {
		  		username: hs.username,
		  		provider: hs.provider, 
		  		codename: hs.codename, 
		  		gender: hs.gender, 
		  		photourl: hs.photourl
  };
  var room_ctr = false;
  model.accomodateVisitor(client,user,function(err,room){
      if(room){
    	  if(!room_ctr){
    		  room_ctr = true;
    		  console.log(JSON.stringify(user) + " - " + room);
              socket.join(room); 
              io.sockets.in(room).emit('start_chat', false); 
              model.roomMembers(client,function(err,roomVisitors){
            	  roomVisitors.forEach(function(roomVisitor){
            		  io.sockets.in(roomVisitor.room).emit('room_members', {room: roomVisitor.room, members : roomVisitors});  
            	  }); 
            	  
              });
              model.roomVisitors(client,room,function(err,visitor){
            	  if(visitor.length == 2){
            		  io.sockets.in(room).emit('members', {members : visitor}); 
            	  }
              });
              socket.on('my msg', function(data) {
                  console.log("==================message arrive===================");
                console.log(data);
                var no_empty = data.msg.replace("\n","");
                if(no_empty.length > 0) {
                  io.sockets.in(room).emit('new msg', {
                    username: username,
                    gender: gender,
                    codename: codename,
                    provider: provider,
                    photourl: photourl,
                    msg: data.msg,
                    
                  });        
                }   
              });
                
              socket.on('disconnect', function() {
                //model.removeVisitor(client,room,user);
              });
    	  }
    	  else{
    		  console.log("user alrady joined!!!!");
    	  }
      
      }
      else{
          console.log("ERROR: Unable to alocate room!");
          console.log(err);
      }
  });
  
  
  
});
