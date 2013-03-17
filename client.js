module.exports = {
    
    roomList : function(client,fn){
        client.smembers('hc:rooms',function(err, rooms){
            console.log("Getting Rooms: " + rooms.length);
            if(err){
                fn(err);
            }
            else{
                fn(null,rooms);
            }
        });  
    },
    roomVisitors : function(client,room,fn){
    	client.smembers('hc:room:'+room+':visitor',function(err, visitors){
            console.log("Getting Visitors: " + visitors.length);
            if(err){
                fn(err);
            }
            else{
                fn(null,visitors);
            }
        }); 
    },
    roomMembers : function(client,fn){
    	client.smembers('hc:rooms',function(err, rooms){
            if(err){
                fn(err);
            }
            else{
            	var room_map = 1;
            	var ar = new Array();
            	rooms.forEach(function(room){
            		client.smembers('hc:room:'+room+':visitor',function(err, visitors){
                        if(err){
                            fn(err);
                        }
                        else{
                        	ar.push({room:room_map,members:visitors});
                        }
                        if(room_map >= rooms.length){
                        	console.log(ar);
                        	fn(null,ar);
                        }
                        room_map++;
                    });
            	});
            	
            }
        });  
    	
    },
    accomodateVisitor : function(client,user,fn){
    	
    	client.smembers('hc:rooms',function(err, rooms){
    		if(err){
    			fn(err);
    		}
    		if(!rooms || (rooms.length == 0)){
    			client.sadd('hc:rooms',1);
    			client.sadd('hc:room:1:visitor',JSON.stringify(user));
    			fn(null,1);
    		}
    		if(rooms.length > 0){
    			var ctr =0;
    			rooms.every(function(room){
    				console.log('hc:room:'+room+':visitor');
    				client.smembers('hc:room:'+room+':visitor',function(err,visitors){
    					room = ctr + 1;
    					if(err){
    						fn(err); return false;
    					}
    					if(!visitors || (visitors.length == 0)){
    						
    						client.sadd('hc:rooms',room);
    		    			client.sadd('hc:room:'+room+':visitor',JSON.stringify(user));
    		    			fn(null,1); return false;
    					}
    					if(visitors.length == 1 && JSON.parse(visitors[0]).gender != user.gender){
    						client.sadd('hc:room:'+ room +':visitor',JSON.stringify(user));
    						fn(null,room); return false;
    					}
    					ctr++;
    					console.log("counter : "+ctr);
    					if(ctr >= rooms.length){
    						var room = rooms.length + 1;
    						client.sadd('hc:rooms',room);
    		    			client.sadd('hc:room:'+ room +':visitor',JSON.stringify(user));
    		    			fn(null,room); return false;
    					}
    					
    					
    				});
    				return true;
    			});
    			
    		}
    		
    	});
    	
         
    	/*
        client.smembers('hc:rooms',function(err, rooms){
            var room;
            if(err){
                fn(err);
                console.log("Redis failed!, smembers hc:rooms "+err);
            }
            else if(!rooms || (rooms.length == 0)){
            	   console.log("!rooms || (rooms.length == 0): " + (!rooms || (rooms.length == 0)));
                   room = 1;
                   client.sadd('hc:rooms',room);
                   client.sadd('hc:room:'+room+':visitor',JSON.stringify(user));
                   console.log("room and visitor added successfully");
                   fn(null,room); return;
            }
            else{
                var ctr = 0, ctrin = 1;
                var die = false;
                console.log("ctr <= rooms.length :" + (ctr <= rooms.length));
                while (die != true) {
                    client.smembers('hc:room:'+rooms[ctr]+':visitor',function(err,visitors){
                        if(err){
                            console.log("Redis failed!, smembers" + 'hc:room:'+rooms[ctr]+':visitor' +err);
                            die = true;
                            fn(err); return;
                        }
                        else if(!visitors || (visitors.length == 0)){
                        	client.sadd('hc:rooms',ctrin);
                            client.sadd('hc:room:'+ctrin+':visitor',JSON.stringify(user));
                            die = true;
                            fn(null,ctrin); return;
                        }
                        else if(visitors.length == 1){
                            visitor = JSON.parse(visitors[0]);
                            if(visitor.gender != user.gender && visitor.username != user.username){
                                client.sadd('hc:room:'+ctrin+':visitor',JSON.stringify(user));
                                die = true;
                                fn(null,ctrin); return;
                            }
                        }
                        else{
                            
                        }
                        ctrin++;
                    });
                    ctr++;
                }
                
            }
            
        });
        /*
        client.smembers('hc:rooms',function(err, rooms){
            console.log("Getting Rooms and Visitor: " + rooms.length );
            if(err){
                fn(err);
            }
            else if(rooms.length > 0){
                var i=0;
                rooms.forEach(function(room){
                    var roomInfo = JSON.parse(room);
              
                    if(roomInfo.visitor.length === 0){
                        fn(null,roomInfo); return;
                    }
                 
                    roomInfo.visitor.forEach(function(visitor){
                        if(visitor.username == user.username){
                            fn(null,roomInfo); return;
                           
                        }
                    });
                 
                    if(roomInfo.visitor.length == 1 &&  (roomInfo.visitor[0].gender != user.gender)){
                        fn(null,roomInfo); return;
                    }
                    i++;
                });
           
                if(i == rooms.length){
                    fn(null,{no:(rooms.length + 1),visitor:[]});
                }
            }
       
            else{
                fn(null,{no:1,visitor:[]});
            }
        });
        */
    },
    addVisitor : function(client,room,visitor){
        console.log("Adding user");
        var isUserExist = false;
        room.visitor.forEach(function(user){
            if(user.username == visitor.username){
                isUserExist = true;
            }
        });
        if(!isUserExist){
            client.srem('hc:rooms',JSON.stringify(room));
            room.visitor.push(visitor);    
        }
        client.sadd('hc:rooms',JSON.stringify(room));
    },
    removeVisitor : function(client,room,visitor){
        console.log("Removing user");
        client.srem('hc:rooms',JSON.stringify(room));
        for(var user in room.visitor){
            if(room.visitor[user].username == visitor.username){
                delete room.visitor[user];
            }
        }
        client.sadd('hc:rooms',JSON.stringify(room));
    }
}