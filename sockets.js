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
var switch_ctr = 0;
function switchRoom(socket,room,user,rooms){
	console.log("second timer started");
	
		console.log("second timer stopped");
		if(user.gender == "female"){
			
			socket.leave(room);
			
			var nroom;
			console.log("(Number(room) + 1)");
			console.log((Number(room) + 1));
			console.log(rooms.length);
			if((Number(room) + 1) >= rooms.length){
				nroom = 1;
			}
			else{
				nroom = Number(room) + 1;
			}
			socket.join(nroom);
			
			model.switchVisitorRoom(client,room,nroom,user,function(err,result){
				console.log(err);
				console.log(result);
				if(result){
					model.roomVisitors(client,nroom,function(err,visitor){
		            	  if(visitor.length == 2){
		            		  io.sockets.in(nroom).emit('members', {members : visitor}); 
		            		  console.log("timer switched:" + nroom);
		            	  }
		            });
					
				}
			});
			
		}
		switch_ctr++;
}

io.sockets.on('connection', function (socket) {
  
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
    	  console.log(room);
    	  room = Number(room);
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
              
              if(!timer_start){
          		timer.Timer(function(){
          			model.roomList(client,function(err,rooms){
          				rooms.forEach(function(room){
          					io.sockets.in(room).emit('start_chat', true); 

          				});
          				var stopper = setInterval(function(){
      						
      						if(switch_ctr >= rooms.length){
      							clearInterval(stopper);
      							io.sockets.in(room).emit('rank_start', true); 
      							timer_start = false;
      						}
      						switchRoom(socket,room,user,rooms);
          				},30000);
      				//	},120000);

          			});
          		},20000);
          	//	},1200000);
          		timer_start = true;
          	 }
                
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
