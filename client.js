module.exports = {
    
    getRoom : function(client,user,fn){
        client.smembers('hc:rooms',function(err, rooms){
            if(err){
                fn(err);
            }
            else if(rooms.length > 0){
                var i=0;
                rooms.forEach(function(room){
                    var roomInfo = JSON.stringify(room);
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
        var isUserExist = false;
        room.visitor.forEach(function(user){
            if(user.username == visitor.username){
                isUserExist = true;
            }
        });
        if(!isUserExist){
            client.srem('hc:rooms',room);
            room.visitor.push(visitor);    
        }
        client.sadd(room);
    }
}