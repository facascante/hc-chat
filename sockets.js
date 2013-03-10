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
  , cookie = require("cookie");
  
var io = sio.listen(server);

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
  var hs = socket.handshake.hatchcatch.user
    , username = hs.username
    , provider = hs.provider
    , codename = hs.codename
    , gender = hs.gender
  var user = {username: hs.username,provider: hs.provider, codename: hs.codename, gender: hs.gender, profileUrl: hs.profileUrl};
  console.log(user);
  model.getRoom(client,user,function(err,room){
      if(room){
          socket.join(room.no); 
          model.addVisitor(client,room,user);
          
          model.roomList(client,function(err,rooms){
              if(rooms){    
                  rooms.forEach(function(room){
                      io.sockets.in(room.no).emit('chatmate', rooms); 
                  });
              }
          });
          socket.on('my msg', function(data) {
            var no_empty = data.msg.replace("\n","");
            if(no_empty.length > 0) {      
              io.sockets.in(room).emit('new msg', {
                username: username,
                gender: gender,
                codename: codename,
                provider: provider,
                msg: data.msg
              });        
            }   
          });
            
          socket.on('disconnect', function() {
            model.removeVisitor(client,room,user);
          });
      }
      else{
          console.log("ERROR: Unable to alocate room!");
          console.log(err);
      }
  });
  
  
  
});
