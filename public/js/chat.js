$(function() {

  var socket = io.connect();

  var room_members;
  var room;
  var me;
  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function (){
    console.info('successfully established a working connection');
  });
  
  socket.on('participants complete', function (data){
	    alert(JSON.stringify(data));
  });
  
  socket.on('start_chat', function (data){
	    if(data){
	    	alert("chat started!");
	    	
	    	    }
	    ("tiemleft").dialog(exports.Timer);
  });
  
  socket.on('members', function (data){
	  data.members.forEach(function(user){
		  user = JSON.parse(user);
		  
		  if(user.codename !=  $("#codename").html()){
			  $(".current-photo").html("<img class='cpimg' src='"+user.photourl+"'></img>");
		  }
		  else{
			  me = user;
		  }
	  });
	  
  });
  
  socket.on('room_members', function (data){
	  room_members = data.members;
	  room = data.room;
	  var next_room = room + 1;
	  var prev_room = room -1;
	  if(next_room > room_members.length ){
		  next_room = 1;
	  }
	  if(prev_room <= 0 ){
		  prev_room = room_members.length;
	  }
	  room_members.forEach(function(room_visitor){
		  if(room_visitor.room == next_room){
			  var next_room_members = room_visitor.members;
			  next_room_members.forEach(function(user){
				  user = JSON.parse(user);
				  if(me.gender != user.gender){
					  $(".next-photo").html("<img class='npimg' src='"+user.photourl+"'></img>");
				  }
			  });
			  
		  }
		  if(room_visitor.room == prev_room){
			  var prev_room_members = room_visitor.members;
			  prev_room_members.forEach(function(user){
				  user = JSON.parse(user);
				  if(me.gender != user.gender){
					  $(".previous-photo").html("<img class='ppimg' src='"+user.photourl+"'></img>");
				  }
			  });
			  
		  }
	  });
	  
  });
  
  

  socket.on('new msg', function(data) {
	  if(data.gender == "male"){
		  $(" .messagewindow ").append("<img class='leftp' src='"+data.photourl+"'></img><p class='me-chat'>" + data.msg + "</p>");
	  }
	  else{
		  $(" .messagewindow ").append("<img class='rightp' src='"+data.photourl+"'></img><p class='you-chat'>" + data.msg + "</p>");
	  }
  });

  socket.on('user leave', function(data) {
  });

  $("#reply").click(function(){

	  var inputText = $("#message").val().trim();
	    if(inputText) {
	      var chunks = inputText.match(/.{1,1024}/g)
	        , len = chunks.length;

	      for(var i = 0; i<len; i++) {
	        socket.emit('my msg', {
	          msg: chunks[i]
	        });
	      }

	      $(this).val('');

	      return false;
	    }
  });
  $("#message").keypress(function(e) {
    var inputText = $(this).val().trim();
    if(e.which == 13 && inputText) {
      var chunks = inputText.match(/.{1,1024}/g)
        , len = chunks.length;

      for(var i = 0; i<len; i++) {
        socket.emit('my msg', {
          msg: chunks[i]
        });
      }

      $(this).val('');

      return false;
    }
  });


});


