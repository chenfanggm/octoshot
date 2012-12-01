

function Room(name, scene) {
    this.name = name;
    this.scene = scene;
    this.players = [];
}

Room.prototype.start = function() {
    this.scene.start(this);
};

Room.prototype.stop = function() {
    this.scene.stop(this);
};

Room.prototype.addPlayer = function(player) {
    this.players.push(player);
    this.scene.addObject(player.entity);
};

Room.prototype.removePlayer = function(player) {
    var idx = this.players.indexOf(player);
    if(idx !== -1) {
        this.players.splice(idx, 1);
    }

    var ent = this.scene.getObject(player.name);
    if(ent) {
        ent._parent.removeObject(ent);
    }
};

Room.prototype.getPlayer = function(id) {
    for(var i=0; i<this.players.length; i++) {
        if(this.players[i].id == id) {
            return this.players[i];
        }
    }
}

Room.prototype.count = function() {
    return this.players.length;
};

Room.prototype.names = function() {
    return this.players.map(function(user) { return user.name; });
};

Room.prototype.broadcast = function(user, packet) {
    for(var i=0, l=this.players.length; i<l; i++) {
        var player = this.players[i];

        if(player != user) {
            try {
                player.stream.write(packet);
            }
            catch(e) {
                console.log('send error: ' + e);
            }
        }
    }
};

Room.prototype.lookupUser = function(entity) {
    for(var i=0, l=this.players.length; i<l; i++) {
        var player = this.players[i];

        if(player.entity === entity) {
            return player;
        }
    }

    return null;
};

module.exports = Room;