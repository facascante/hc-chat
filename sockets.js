var parent = module.parent.exports
  , server = parent.server
  , client = parent.client
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , cookieParser = require("connect").utils.parseSignedCookies
  , cookie = require("cookie");
  
var io = sio.listen(server);

io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = cookieParser(cookie.parse(hsData.headers.cookie), "hatchcatch")
      , sid = cookies['balloons'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.hatchcatch = {
        user: session.passport.user,
        room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
      };

      return accept(null, true);
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore({client: client}));
  io.enable('browser client minification');
  io.enable('browser client gzip');
});

io.sockets.on('connection', function (socket) {
  var hs = socket.handshake
    , username = hs.hatchcatch.user.username
    , provider = hs.hatchcatch.user.provider
    , codename = hs.hatchcatch.user.codename
    , gender = hs.hatchcatch.user.gender
    , room = hs.hatchcatch.room;

  socket.join(room);
  
  client.smembers('hc:rooms',function(err,result){
      result.forEach(function(){
          io.sockets.in(room).emit('chat list', {
                    chatmate: result
          });
      });
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
  socket.on('user enter', function(data) {
      client.smembers('hc:users:'+gender,function(err,result){
          io.sockets.in(room).emit('chat list', {
                    chatmate: result
          });
      });  
  });
  
  socket.on('disconnect', function() {
    
  });
});
