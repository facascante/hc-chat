module.exports = {
    
    roomList : function(client,fn){
        client.smembers('hc:rooms',function(err, rooms){
            if(err){
                fn(err);
            }
            else{
                fn(null,rooms);
            }
        });  
    },
    getRoom : function(client,user,fn){
        console.log("Getting Rooms and Visitor");
        console.log(user);
        client.smembers('hc:rooms',function(err, rooms){
            if(err){
                fn(err);
            }
            else if(rooms.length > 0){
                var i=0;
                rooms.forEach(function(room){
                    var roomInfo = JSON.parse(room);
                    /*** is room empty ***/
                    if(roomInfo.visitor.length === 0){
                        fn(null,roomInfo); return;
                    }
                    /*** is user already exist ***/
                    roomInfo.visitor.forEach(function(visitor){
                        if(visitor.username == user.username){
                            fn(null,roomInfo); return;
                           
                        }
                    });
                    /*** is room contain 1 visitor and gender is opposite ***/
                    if(roomInfo.visitor.length == 1 &&  (roomInfo.visitor[0].gender != user.gender)){
                        fn(null,roomInfo); return;
                    }
                    i++;
                });
                /*** no more vacant room ***/
                if(i == rooms.length){
                    fn(null,{no:i++,visitor:[]});
                }
            }
            /*** no room created yet ***/
            else{
                fn(null,{no:1,visitor:[]});
            }
        });
    },
    addVisitor : function(client,room,visitor){
        console.log("Adding user");
        console.log(room);
        console.log(visitor);
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
        console.log(room);
        console.log(visitor);
        client.srem('hc:rooms',JSON.stringify(room));
        for(var user in room.visitor){
            if(room.visitor[user].username == visitor.username){
                delete room.visitor[user];
            }
        }
        client.sadd('hc:rooms',JSON.stringify(room));
    }
}