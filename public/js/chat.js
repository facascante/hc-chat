$(function() {

  var socket = io.connect();

  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function (){
    console.info('successfully established a working connection');
  });
  
  socket.on('participants complete', function (data){
	    alert(JSON.stringify(data));
  });

  socket.on('new msg', function(data) {
	  var photo_url = "";
	  if(data.provider == 'facebook'){
		  photo_url = 'http://graph.facebook.com/' + data.nickname + '/picture';
	  }
	  else{
		  photo_url = 'http://graph.facebook.com/' + data.nickname + '/picture';
	  }
	  if(data.gender == "male"){
		  $(" .messagewindow ").append("<img class='leftp' src='"+photo_url+"'></img><p class='me-chat'>" + data.msg + "</p>");
	  }
	  else{
		  $(" .messagewindow ").append("<img class='rightp' src='"+photo_url+"'></img><p class='you-chat'>" + data.msg + "</p>");
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


