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
    getRoom : function(client,user,fn){
        
        
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