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
    	console.log('hc:room:'+room+':visitor');
    	client.smembers('hc:room:'+room+':visitor',function(err, visitors){
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
    	
    },
    switchVisitorRoom : function(client,room,nroom,visitor,fn){
    	console.log("========================");
    	client.srem('hc:room:'+room+':visitor',JSON.stringify(visitor),function(err,result){
    		if(result){
    			client.sadd('hc:room:'+nroom+':visitor',JSON.stringify(visitor),function(err,result){
    				console.log("room " + room);
        			console.log("nroom "+nroom);
        			console.log("========================");
        			fn(err,nroom);
        			
        		});
    		}
    		else{
    			fn(err);
    		}
    		
    	});
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
    }
}