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

var timer_start = false;
var rotate_ctr = 0;
var chat_lock = false;
io.sockets.on('connection', function (socket) {
  
  var hs = socket.handshake.hatchcatch.user;
  if(hs){
	  var user = {
			  		username: hs.username,
			  		provider: hs.provider, 
			  		codename: hs.codename, 
			  		gender: hs.gender, 
			  		photourl: hs.photourl
	  };
  }
  if(!chat_lock){
	  model.accomodateVisitor(client,user,function(err,result){
		  var room = result.RecordToRedis;
		  var members = result.getRoomMembers;
		  socket.join(room);
		  if(timer_start){
			//  io.sockets.in(room).emit('start_chat', false);  
		  }
		  else{
			//  io.sockets.in(room).emit('start_chat', true);  
		  }
		  io.sockets.in(room).emit('members', members);  
		  socket.on('log_out', function(data) {
	          console.log("==================user logout===================");
	          client.srem('hc:room:'+room+':visitor',JSON.stringify(user));
	      });
		  socket.on('my msg', function(data) {
	          console.log("==================message arrive===================");
	        console.log(data);
	        var no_empty = data.msg.replace("\n","");
	        if(no_empty.length > 0) {
	          io.sockets.in(room).emit('new msg', {
	            username: user.username,
	            gender: user.gender,
	            codename: user.codename,
	            provider: user.provider,
	            photourl: user.photourl,
	            msg: data.msg,
	            
	          });        
	        }   
	      });
		  model.roomMembers(client,function(err,roomVisitors){
	    	  roomVisitors.forEach(function(roomVisitor){
	    		  io.sockets.in(roomVisitor.room).emit('room_members', {room: roomVisitor.room, members : roomVisitors});  
	    	  }); 
	    	  
	      });
		  
	  });
  }
});

setInterval(function(){
	setInterval(function(){
		model.switchVisitorRoom(client,function(err,result){
			if(result){
				var rooms = result.switchPartner;
				console.log("++++++++++++++++++++++++++++++++");
				console.log(rotate_ctr >= rooms.length);
				console.log("++++++++++++++++++++++++++++++++");
				if(rotate_ctr >= (rooms.length - 1)){
					for(var i=0; i < rooms.length; i++){
						io.sockets.in(rooms[i].no).emit('rank_room', rooms); 
						client.del('hc:rooms');
						client.del('hc:room:'+rooms[i].no+':visitor');
						console.log('rank room called');
					}
				}
				else{
					for(var j=0; j < rooms.length; j++){
						io.sockets.in(rooms[j].no).emit('switch_room', {minutes : 0, seconds : 30 }); 
						console.log('switch room called');
					}
					rotate_ctr++;
				}
				chat_lock = false;
			}
		});
		console.log("======================================");
		console.log("rotate_ctr:" +rotate_ctr);
		console.log("======================================");
		
	},60000);
	rotate_ctr = 0;
},120000);
