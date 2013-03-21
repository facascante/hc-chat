var async = require('async');

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
    	
    	async.auto({
    		GetRooms : function(cb){
    			console.log('GetRooms');
    			client.sort('hc:rooms',cb);
    		},
    		GetVisitors : ['GetRooms', function(cb,result){
    			console.log('GetVisitors');
    			var rooms = result.GetRooms;
    			var room_visitors = new Array();
    			if(rooms && rooms.length){
    				var room_ctr = 1;
    				rooms.forEach(function(room){
    					console.log(room);
    					client.smembers('hc:room:'+room+':visitor',function(err,visitors){
    						console.log(visitors);
    						if(visitors && visitors.length){
    							room_visitors.push({room:room_ctr,members:visitors});
    						}
    						room_ctr++;
    						if(room_ctr > rooms.length){
    							cb(null,room_visitors);
    						}
    					});
    				});
    			}
    			else{
    				cb(null,room_visitors);
    			}
    		}],
    		CheckMe : ['GetVisitors', function(cb,result){
    			console.log('CheckMe');
    			var room_visitors = result.GetVisitors;
    			var flag = false;
    			console.log(room_visitors);
    			room_visitors.forEach(function(room_visitor){
    				var members = room_visitor.members;
    				members.forEach(function(visitor){
    					visitor = JSON.parse(visitor);
    					if(visitor.codename == user.codename){
    						flag = true;
    						cb(null,room_visitor);
    					}
    				});
    			});
    			if(!flag){
    				cb(null,-1);
    			}
    			
    			
    		}],
    		AddMe : ['CheckMe', function(cb,result){
    			console.log('AddMe');
    			var me = result.CheckMe;
    			if(me == -1){
    				var room_visitors = result.GetVisitors;
    				var room_ctr =0, flag =false;;
        			room_visitors.forEach(function(room_visitor){
        				var members = room_visitor.members;
        				members.forEach(function(visitor){
        					visitor = JSON.parse(visitor);
        					if(visitor.gender != user.gender && members.length == 1){
        						room_visitor.members.push(JSON.stringify(user));
        						flag = true;
        						cb(null,room_visitor);
        					}
        				});
        				if(members.length == 0){
        					room_visitor.members.push(JSON.stringify(user));
        					flag = true;
        					cb(null,room_visitor);
        				}
        				room_ctr++;
        			});
        			if((room_ctr >= room_visitors.length) && !flag){
        				var room_visitor = {room:0,members: new Array()};
        				room_visitor.members.push(JSON.stringify(user));
        				cb(null,room_visitor);
        			}
        			
    			}
    			else{
    				cb(null,me);
    			}
    			
    		}],
    		RecordToRedis : ['AddMe', function(cb,result){
    			console.log('RecordToRedis');
    			var isExist = result.CheckMe;
    			if(isExist == -1){
    				var room_visitor = result.AddMe;
    				var room = room_visitor.room;
    				var room_visitors = result.GetVisitors;
    				var members = room_visitor.members;
    				console.log(result.GetVisitors);
    				console.log(room_visitor);
    				if(members.length == 1){
    					if(room == 0){
    						room = Number(room_visitors.length) + 1;
    						client.sadd('hc:rooms',room,function(err,result){
    							if(result){
    								client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
        								cb(err,room);
        							});
    							}
    							else{
    								cb(err);
    							}
    						});
    					}
    					else{
    						client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
								cb(err,room);
							});
    					}
    					
    				}
    				else{
    					client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
							cb(err,room);
						});
    				}
    			}
    			else{
    				cb(null,isExist.room);
    			}
    		}]
    		
    	},function(err,result){
    		if(err) console.log(err);
    		else {
    			console.log(result);
    		}
    		fn(err,result.RecordToRedis);
    	});
    	
    },
    switchVisitorRoom : function(client,room,user,fn){
    	
    	async.auto({
    		
    	},function(err,result){
    		
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