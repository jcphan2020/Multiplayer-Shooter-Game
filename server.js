
/****************** Node Express Framework ********************/
//Initialize server variables
var port_number = 5000;
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');var app = express();
var server = http.Server(app);
var io = socketIO(server);app.set('port', port_number);

//Set server to allow the use of JS Files located in directory /static/
app.use('/static', express.static(__dirname + '/static'));

//Make the client.html the main page to open when accessing server
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

//Listen for client
server.listen(port_number, function() {
  console.log('Starting server on port '+port_number);
});
/**************************************************************/


/******************  Server-Side Request  *********************/
/* io.on is activated when a user/player establish connection with
 * server.
 */
io.on('connection', function(socket){
	//Create a generated name for user until user manually change it.
	players.push(new playerData(socket.id, createRandomName()));
	totalplayerlogged += 1;

	/* socket.on function that is activated when user/player disconnect from server.
	 * Remove user from list
	 * Remove user from any host channels
	 * Remove user from any game channels
	 */
	socket.on('disconnect', function(){
		for(var i = 0; i < gameActive.length; i++) {
			if(gameActive[i]._totalPlayers > 1) {
				var canBreak = false;
				for(var j = 0; j < gameActive[i]._totalPlayers; j++) {
					if(gameActive[i]._players[j]._id == socket.id) {
						gameActive[i].removePlayer(gameActive[i]._players[j]);
						canBreak = true;
						break;
					}
				}
				if(canBreak) break;
			}else {
				if(gameActive[i]._players[0]._id == socket.id) {
					gameActive[i].removePlayer(gameActive[i]._players[0]);
					break;
				}
			}
		}
		for(var i = 0; i < hosts.length; i++) {
			if(hosts[i]._players[1] != null) {
				var canBreak = false;
				for(var j = 0; j < hosts[i]._players.length; j++) {
					if(hosts[i]._players[j]._id == socket.id) {
						hosts[i].removePlayer(hosts[i]._players[j]);
						canBreak = true;
						break;
					}
				}
				if(canBreak) break;
			}else{
				if(hosts[i]._players[0]._id == socket.id) {
					hosts.splice(i, 1);
					break;
				}
			}
		}
		for(var i = 0; i < players.length; i++) {
			if(players[i]._id == socket.id){
				players.splice(i, 1);
				break;
			}
		}
	});

	/* User send request to change its visible name to chosen name.
	 * Chosen name must be available, no duplicates.
	 */
	socket.on('changeName', function(name) {
		var avail = true;
		for(var i = 0; i < players.length; i++){
			if(players[i]._name == name){
				avail = false;
			}
		}
		if(avail){
			for(var i = 0; i < players.length; i++){
				if(players[i]._id == socket.id){
					players[i].change(name);
				}
			}
		}
	});

	/* User send request to create a host channel.
	 * User is set as host of host channel and placed
	 * in channel's players list.
	 */
	socket.on('createHost', function() {
		for(var i = 0; i < players.length; i++){
			if(players[i]._id == socket.id){
				hosts.push(new hostroom(hosts.length, players[i]));
				hosts[hosts.length - 1].addPlayer(players[i]);
				break;
			}
		}
	});

	/* User send request to join a host channel.
	 * User is placed in channel's players list.
	 */
	socket.on('joinHost', function(host_index) {
		if(host_index >= 0 && hosts.length > host_index){
			for(var i = 0; i < players.length; i++){
				if(players[i]._id == socket.id){
					if(hosts[host_index]._players.length < 4) {
						hosts[host_index].addPlayer(players[i]);
					}
				}
			}
		}
	});

	/* User send request to leave a host channel.
	 * User is removed from channel's players list.
	 * If user is host, channel switch to next player.
	 * Destroy host channel when all players leaves.
	 */
	socket.on('leaveHost', function(host_index) {
		if(host_index >= 0 && hosts.length > host_index){
			for(var i = 0; i < players.length; i++){
				if(players[i]._id == socket.id){
					hosts[host_index].removePlayer(players[i]);
					if(hosts[host_index]._players.length == 0){
						hosts.splice(host_index, 1);
					}
				}
			}
		}
	});

	/* User send request to ready/start game.
	 * If all users are set to true, a game channel is created
	 * and users are placed in channel's players list.
	 */
	socket.on('readyHost', function(host_index) {
		if(host_index >= 0){
			for(var i = 0; i < players.length; i++) {
				if(players[i]._id == socket.id) {
					hosts[host_index].start(players[i]);
				}
			}
		}
	});
	
	/* User send request to join game channel.
	 * User is placed in channel's players list.
	 */
	socket.on('joinGame', function(game_index) {
		if(game_index >= 0 && gameActive.length > game_index){
			for(var i = 0; i < players.length; i++) {
				if(players[i]._id == socket.id) {
					gameActive[game_index].addPlayer(players[i]);
				}
			}
		}
	});

	/* User send request to leave game channel.
	 * User is removed from channel's players list.
	 */
	socket.on('leaveGame', function(game_index) {
		if(game_index >= 0 && gameActive.length > game_index) {
			for(var i = 0; i < players.length; i++) {
				if(players[i]._id == socket.id) {
					gameActive[game_index].removePlayer(players[i]);
				}
			}
		}
	});

	/* Update user's coordinates on game channel's map.
	 */
	socket.on('movePlayer', function(game_index, x, y) {
		if(game_index >= 0 && gameActive.length > game_index) {
			gameActive[game_index].updateMovement(x, y, socket);
		}
	});

	/* Update direction that user is facing on game channel.
	 */
	socket.on('direction', function(game_index, areaX, areaY) {
		if(game_index >= 0 && gameActive.length > game_index) {
			gameActive[game_index].updateDirection(areaX, areaY, socket);
		}
	});

	/* User send request to generate an attack on game channel.
	 */
	socket.on('attack', function(game_index) {
		if(game_index >= 0 && gameActive.length > game_index) {
			gameActive[game_index].updateAttack(socket);
		}
	});

	/* User send request to change weapon on game channel.
	 */
	socket.on('changeWeapon', function(game_index, qe) {
		if(game_index >= 0 && gameActive.length > game_index) {
			gameActive[game_index].changeWep(socket, qe);
		}
	});

	/* User send request to reload weapon on game channel.
	 */
	socket.on('reloading', function(game_index) {
		if(game_index >= 0 && gameActive.length > game_index) {
			gameActive[game_index].updateReload(socket);
		}
	})

	/* Set to send data back to all clients and update game status.
	 * Keep item spawn limit to 20 and set to 1 second per spawn.
	 * Keep all actively generated bullets to be destroyed when hit wall, touch players, or duration at zero.
	 * Destroy game channel when no active players remain.
	 * Respawn players after a set time,
	 */
	setInterval(function() {
		socket.emit('host list', hosts);
		socket.emit('players', players);
		socket.emit('game list', gameActive);
		var date = new Date();
		for(var i = 0; i < gameActive.length; i++) {
			if(gameActive[i]._totalPlayers == 0) {
				gameActive.splice(i, 1);
				continue;
			}
			if(gameActive[i]._allItems.length < 20 && (date.getTime() - gameActive[i]._itemSpawnTimer) >= 1000) {
				gameActive[i]._itemSpawnTimer = date.getTime();
				gameActive[i].spawnItem();
			}
			for(var j = 0; j < gameActive[i]._players.length; j++) {
				if(gameActive[i]._allPlayerIndicator[j]._respawn != -1 && (date.getTime() - gameActive[i]._allPlayerIndicator[j]._respawn) >= 1000) {
					gameActive[i].respawn(gameActive[i]._players[j]._id);
				}
				if(gameActive[i]._allPlayerIndicator[j]._respawn != -1) continue;
				if(gameActive[i]._allPlayerIndicator[j]._accur < 100) {
					gameActive[i]._allPlayerIndicator[j]._accur += 1;
				}
				var noTouch = -1;
				var sh = gameActive[i]._allShapesPlayers[j];
				var ml = sh._x;
				var mr = ml + sh._width;
				var mt = sh._y;
				var mb = mt + sh._height;
				for(var k = 0; k < gameActive[i]._allItems.length; k++){
					var ol = gameActive[i]._allItems[k]._x;
					var or = ol + gameActive[i]._allItems[k]._w;
					var ot = gameActive[i]._allItems[k]._y;
					var ob = ot + gameActive[i]._allItems[k]._w;
					if(!((mb < ot) || (mt > ob) || (mr < ol) || (ml > or))) {
						noTouch = k;
						break;
					}
				}
				if(noTouch >= 0){
					gameActive[i]._allPlayerIndicator[j]._ammo[gameActive[i]._allItems[noTouch]._type] += gameActive[i]._allItems[noTouch]._ammo;
					gameActive[i]._allItems.splice(noTouch, 1);
				}
			}
			for(var j = 0; j < gameActive[i]._bullets.length; j++) {
				var b = gameActive[i]._bullets[j];
				var spliceBullet = false;
				for(var k = 0; k < gameActive[i]._allShapesPlayers.length; k++) {
					if(gameActive[i]._allPlayerIndicator[k]._respawn != -1) continue;
					if(gameActive[i]._allPlayerIndicator[k]._tm == b._tm) continue;
					var s = gameActive[i]._allShapesPlayers[k];
					var x = b._x + (this._len / 2)*Math.cos(b._rd);
					var y = b._y + (this._len / 2)*Math.sin(b._rd);
					var killer = -1;
					if(s._x <= b._x && b._x <= (s._x + s._width) && s._y <= b._y && b._y <= (s._y + s._height)) {
						killer = gameActive[i]._bullets[j]._tm;
						gameActive[i]._bullets.splice(j, 1);
						spliceBullet = true;
						gameActive[i]._allPlayerIndicator[k]._hp -= b._dmg;
					}else if(s._x <= x && x <= (s._x + s._width) && s._y <= y && y <= (s._y + s._height)) {
						killer = gameActive[i]._bullets[j]._tm;
						gameActive[i]._bullets.splice(j, 1);
						spliceBullet = true;
						gameActive[i]._allPlayerIndicator[k]._hp -= b._dmg;
					}
					if(gameActive[i]._allPlayerIndicator[k]._hp <= 0) {
						if(killer == 0) gameActive[i]._teamA += 1;
						else if(killer == 1) gameActive[i]._teamB += 1;
						gameActive[i]._allPlayerIndicator[b._sc]._score += 1;
						gameActive[i]._allPlayerIndicator[k]._hp = 0;
						gameActive[i]._allPlayerIndicator[k]._respawn = date.getTime();
					}
				}
				if(!spliceBullet) {
					gameActive[i]._bullets[j].update();
					if(gameActive[i]._bullets[j]._duration <= 0) {
						gameActive[i]._bullets.splice(j, 1);
						spliceBullet = true;
					}
				}
				if(!spliceBullet) {
					for(var k = 0; k < gameActive[i]._crashObjects.length; k++) {
						var s = gameActive[i]._crashObjects[k];
						var x = b._x + (this._len / 2)*Math.cos(b._rd);
						var y = b._y + (this._len / 2)*Math.sin(b._rd);
						if(s._x <= b._x && b._x <= (s._x + s._width) && s._y <= b._y && b._y <= (s._y + s._height)) {
							gameActive[i]._bullets.splice(j, 1);
						}else if(s._x <= x && x <= (s._x + s._width) && s._y <= y && y <= (s._y + s._height)) {
							gameActive[i]._bullets.splice(j, 1);
						}
					}
				}
			}
			if(gameActive[i]._teamA >= gameActive[i]._maxScore) gameActive[i]._access = false;
			else if(gameActive[i]._teamB >= gameActive[i]._maxScore) gameActive[i]._access = false;
		}
	}, 1000 / 60);
});


/********************** Server-Side Codes *********************/
var totalplayerlogged = 0;
var hosts = [];
var players = [];
var gameActive = [];

/* Class constructor for user/player name and identity.
 * - _id    = id    : String : identity
 * - _name  = name  : String : userName
 */
class playerData {
	constructor(id, name) {
		this._id = id;
		this._name = name;
		this.change = function (name) { this._name = name; };
	}
}

/* Class constructor to store host channel's variables and actions.
 * - _id	  = id		: int		: index of host channel
 * - _host	  = player	: pData		: playerData of host player
 * - _players = []		: pData[]	: List to store all players, host player included
 * - _ready	  = []		: bool[]	: List of all players' ready status in false/true
 * - _inGame  = -1		: int		: index of game channel, -1 when not connected to one
 */
class hostroom {
	constructor(id, player) {
		this._id = id;
		this._host = player;
		this._players = [];
		this._ready = [false];
		this._inGame = -1;
		/* change boolean function in ready[] and generate game channel if all true.
		 */
		this.start = function (player) {
			for(var i = 0; i < this._players.length; i++) {
				if(this._players[i]._id == player._id){
					this._ready[i] = !this._ready[i];
				}
			}
			if(this._host._id == player._id) {
				var tmp = true;
				for(var i = 0; i < this._players.length; i++) {
					if(!this._ready[i]) {tmp = false; }
				}
				if(tmp) {
					gameActive.push(new gameArea(gameActive.length));
					gameActive[gameActive.length - 1].create(this._players);
					this._inGame = gameActive.length - 1;
					for(var j = 0; j < this._players.length; j++) {
						this._ready[j] = false;
					}
				}else{
					this._ready[0] = false;
				}
			}
		};
		/* Add user to channel's players list.
		 */
		this.addPlayer = function (player) {
			if (this._players.length < 4) {
				this._players.push(player);
				this._ready.push(false);
			}
		};
		/* Remove user from channel's players list.
		 */
		this.removePlayer = function (player) {
            for(var i = 0; i < this._players.length; i++) {
                if(this._players[i]._id == player._id){ 
					this._players.splice(i, 1);
					this._ready.splice(i, 1);
					break;
				}
            }

			if(this._host._id == player._id) {
                this._host = this._players[0];
			}
		};
	}
}

/* Generate name for user on connection and based on number of players that logged in.
 */
function createRandomName() {
	return name = "PLAYER" + totalplayerlogged;
}

/* Class constructor to store game channel's variables and actions.
 * _id		= id		: int	: index of game channel
 * _width	= 1600		: int	: horizontal size of game map
 * _height	= 1200		: int	: vertical size of game map
 * _itemST	= 0			: int	: time when item last spawn on map
 * _teamA/B = 0			: int	: team A and B scores
 * _maxScore = 5		: int	: max score to achieve for end game
 * _access	= true		: bool	: allow other players to join game
 * _players = []		: pData : List to store players' data
 * _totalP  = 0			: int	: number of players in game channel
 * _rooms	= 5			: int	: number of rooms generated in game channel
 * _allShapes = []		: Object: stores room and tunnel coordinates, width, and height
 * _allShapesP = []		: Object: stores players coordinates, width, and height
 * _allPlayerInd = []	: Object: stores individual player's game data
 * _allItems = []		: Object: stores all spawned items' coordinates, width, and height
 * _crashObjects = []	: Object: store restricted area so players cannot go beyond walls
 * _bullets = []		: Object: store bullet coordinates and trajectory
 * _connection = []		: int[] : used only in generating tunnels
 * _mapper = []			: int[] : used only in generating restriction walls
 */
class gameArea {
	constructor(id){
		this._id = id;
		this._width = 6400;
		this._height = 4800;
		this._itemSpawnTimer = 0;
		this._teamA = 0;
		this._teamB = 0;
		this._maxScore = 5;
		this._access = true;
		this._players = [];
		this._totalPlayers = 0;
		this._rooms = 5;
		this._allShapes = [];
		this._allShapesPlayers = [];
		this._allPlayerIndicator = [];
		this._allItems = [];
		this._crashObjects = [];
		this._bullets = [];
		this._connection = [];
		this._mapper = [];
		/* Function to generate all rooms, tunnels, walls, players, and store players.
		 */
		this.create = function(numplayers) {
			this._mapper = new Array(this._height);
			for(var i = 0; i < this._height; i++) {
				this._mapper[i] = new Array(this._width);
				for(var j = 0; j < this._width; j++) {
					this._mapper[i][j] = 0;
				}
			}
			for(var i = 0; i < numplayers.length; i++) {
				this._players.push(numplayers[i]);
				this._totalPlayers += 1;
			}
			this.createRoom();
			this.createTunnel();
			this.createPlayers();
			this.crashGenerator();
			this._connection = null;
			this._mapper = null;
		}
		/* Single use function to generate rooms. Randomly add additional rooms.
		 * Randomly place rooms with different width and height but cannot overlap rooms.
		 */
		this.createRoom = function() {
			this._rooms += Math.floor(Math.random()*5);
			var i = 0;
			//While loop to generate all rooms.
			while(i < this._rooms) {
				//Generate coordinates, width, and height.
				var width = Math.floor(80*Math.floor(5 + Math.random()*5));
				var height = Math.floor(80*Math.floor(5 + Math.random()*5));
				var x = Math.floor(80*Math.floor(Math.random()*((this._width - width) / 80)));
				var y = Math.floor(80*Math.floor(Math.random()*((this._height - height) / 80)));

				//Check that generated room does not overlap other rooms.
				var noTouch = true;
				for(var j = 0; j < this._allShapes.length; j++){
					var ml = x;
					var mr = x + width;
					var mt = y;
					var mb = y + height;
					var ol = this._allShapes[j]._x - Math.floor(80);
					var or = ol + this._allShapes[j]._width + Math.floor(160);
					var ot = this._allShapes[j]._y - Math.floor(80);
					var ob = ot + this._allShapes[j]._height + Math.floor(160);
					if ((mt >= ot && ob >= mt && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml))) || (mb >= ot && ob >= mb && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml)))) {
						noTouch = false;
					}
				}

				//If no overlap, add room to allShapes and generate next room.
				if(noTouch){
					for(var j = y; j < y + height; j++) {
						for(var k = x; k < x + width; k++) {
							this._mapper[j][k] = 2;
						}
					}
					this._allShapes.push(new objectShape('room', x, y, width, height));
					this._connection.push(0);
					i++;
				}
			}
		}
		/* Function to update player's coordinates on map.
		 */
		this.updateMovement = function(x, y, socket) {
			for(var i = 0; i < this._players.length; i++) {
				if(this._players[i]._id == socket.id) {
					var t1 = this._allShapesPlayers[i];
					var cx = x;
					var cy = y;
					//While loop to check that horizontal coordinate does not pass restricted wall objects.
					while(cx != 0){
						var noTouch = true;
						for(var j = 0; j < this._crashObjects.length; j++){
							var ml = t1._x + cx;
							var mr = ml + t1._width;
							var mt = t1._y;
							var mb = mt + t1._height;
							var ol = this._crashObjects[j]._x;
							var or = ol + this._crashObjects[j]._width;
							var ot = this._crashObjects[j]._y;
							var ob = ot + this._crashObjects[j]._height;
							if ((mt >= ot && ob >= mt && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml))) || (mb >= ot && ob >= mb && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml)))) {
								noTouch = false;
							}
						}
						if(noTouch) {
							this._allShapesPlayers[i].shift(cx, 0);
							break;
						}else {
							if(cx > 0) cx -= 1;
							else cx += 1;
						}
					}
					//While loop to check that vertical coordinate does not pass restricted wall objects.
					while(cy != 0) {
						var noTouch = true;
						for(var j = 0; j < this._crashObjects.length; j++){
							var ml = t1._x;
							var mr = ml + t1._width;
							var mt = t1._y + cy;
							var mb = mt + t1._height;
							var ol = this._crashObjects[j]._x;
							var or = ol + this._crashObjects[j]._width;
							var ot = this._crashObjects[j]._y;
							var ob = ot + this._crashObjects[j]._height;
							if ((mt >= ot && ob >= mt && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml))) || (mb >= ot && ob >= mb && ((mr >= ol && or >= mr) || ( ml >= ol && or >= ml)))) {
								noTouch = false;
							}
						}
						if(noTouch) {
							this._allShapesPlayers[i].shift(0, cy);
							break;
						}else {
							if(cy > 0) cy -= 1;
							else cy += 1;
						}
					}
				}
			}
		}
		/* Function to update what direction player is facing on map.
		 */
		this.updateDirection = function(areaX, areaY, socket) {
			for(var i = 0; i < this._players.length; i++) {
				if(this._players[i]._id == socket.id) {
					var x = (800/2) + this._allShapesPlayers[i]._width/2;
					var y = (600/2) + this._allShapesPlayers[i]._height/2;
					var cx = areaX - x - 10;
					var cy = areaY - y - 10;
					var radian = Math.atan((cy)/(cx));
					if((areaX - x - 10) < 0) radian -= Math.PI;
					this._allPlayerIndicator[i]._rd = radian;
					var rg = 1;
					while(true) {
						var xBlock = this._allShapesPlayers[i]._x + this._allShapesPlayers[i]._width/2 + rg*Math.cos(radian);
						var yBlock = this._allShapesPlayers[i]._y + this._allShapesPlayers[i]._height/2 + rg*Math.sin(radian);
						var noTouch = true;
						for(var j = 0; j < this._crashObjects.length; j++) {
							var t = this._crashObjects[j];
							if(t._x < xBlock && xBlock < (t._x + t._width) && t._y < yBlock && yBlock < (t._y + t._height)) {
								noTouch = false;
								break;
							}
						}
						if(rg >= 500) break;
						if(noTouch) rg += 1;
						else break;
					}
					this._allPlayerIndicator[i]._range = rg;
				}
			}
		}
		/* Function to generate bullets on map.
		 * Cannot generate bullets if
		 * - weapon is pointing inside a restriction wall
		 * - load[wp] is zero
		 */
		this.updateAttack = function(socket) {
			var date = new Date();
			for(var i = 0; i < this._players.length; i++) {
				//Check that player is not under reloading effect and weapon's fire rate is ready.
				if(this._players[i]._id == socket.id && (date.getTime() - this._allPlayerIndicator[i]._reloading) < this._allPlayerIndicator[i]._rl) break;
				if(this._players[i]._id == socket.id && (date.getTime() - this._allPlayerIndicator[i]._ready) >= this._allPlayerIndicator[i]._fr) {
					this._allPlayerIndicator[i]._ready = date.getTime();
					
					//Find coordinates of the player's weapon.
					var radian = this._allPlayerIndicator[i]._rd;
					var size = 30;
					var shape = this._allShapesPlayers[i];
					if(this._allPlayerIndicator[i]._wp == 1 || this._allPlayerIndicator[i]._wp == 2 || this._allPlayerIndicator[i]._wp == 4) {
						size = 55;
					}else if(this._allPlayerIndicator[i]._wp == 3) {
						size = 45;
					}
					var x = shape._x + shape._width/2 + size*Math.cos(radian);
					var y = shape._y + shape._height/2 + size*Math.sin(radian);

					//Check that player's weapon is not inside a restriction wall.
					var spliceBullet = false;
					for(var k = 0; k < this._crashObjects.length; k++) {
						var s = this._crashObjects[k];
						if(s._x <= x && x <= (s._x + s._width) && s._y <= y && y <= (s._y + s._height)) {
							spliceBullet = true;
						}
					}
					
					//Generate bullets based on shotgun (4) or others.
					if(this._allPlayerIndicator[i]._wp == 4 && this._allPlayerIndicator[i]._load[this._allPlayerIndicator[i]._wp] > 0) {
						for(var j = 0; j < 12; j ++) {
							var input = radian - 5*Math.PI/180 + 10*Math.random()*Math.PI/180;
							this._bullets.push(new objectBullet(x, y, input, 20, this._allPlayerIndicator[i]._at, this._allPlayerIndicator[i]._tm, i));
						}
						this._allPlayerIndicator[i]._load[this._allPlayerIndicator[i]._wp] -= 1;
					}
					else if(!spliceBullet && this._allPlayerIndicator[i]._load[this._allPlayerIndicator[i]._wp] > 0) {
						var distort = (100.0 - this._allPlayerIndicator[i]._accur)*Math.random();
						if(100*Math.random() < 50) distort = -distort;
						this._allPlayerIndicator[i]._load[this._allPlayerIndicator[i]._wp] -= 1;
						if((this._allPlayerIndicator[i]._wp == 2 || this._allPlayerIndicator[i]._wp == 3) && 97.0 < this._allPlayerIndicator[i]._accur) {
							this._allPlayerIndicator[i]._accur -= 7;
						}else if(this._allPlayerIndicator[i]._wp == 1 && 90.0 < this._allPlayerIndicator[i]._accur){
							this._allPlayerIndicator[i]._accur -= 30;
						}else if(this._allPlayerIndicator[i]._wp == 0){
							this._allPlayerIndicator[i]._accur -= 7;
						}
						this._bullets.push(new objectBullet(x, y, radian + distort*Math.PI/180, 30, this._allPlayerIndicator[i]._at, this._allPlayerIndicator[i]._tm, i));
					}
					break;
				}
			}
		}
		/* Function to add ammo to generate bullets.
		 * - load[wp] is given ammo based on capa[wp] and ammo[wp]
		 * - will not load if ammo[wp] is zero
		 * - load[0] is except as it is set to infinity.
		 */
		this.updateReload = function(socket) {
			var date = new Date();
			for(var i = 0; i < this._players.length; i++) {
				//Check that reloading timer is over.
				if(this._players[i]._id == socket.id && (date.getTime() - this._allPlayerIndicator[i]._reloading) >= this._allPlayerIndicator[i]._rl) {
					var wp = this._allPlayerIndicator[i]._wp;
					if(wp == 0) {
						this._allPlayerIndicator[i]._load[wp] = 15;
						this._allPlayerIndicator[i]._reloading = date.getTime();
					}else if(this._allPlayerIndicator[i]._ammo[wp] > 0) {
						if(this._allPlayerIndicator[i]._load[wp] < this._allPlayerIndicator[i]._capa[wp]) {
							if(this._allPlayerIndicator[i]._ammo[wp] >= this._allPlayerIndicator[i]._capa[wp]) {
								var tmp = this._allPlayerIndicator[i]._capa[wp] - this._allPlayerIndicator[i]._load[wp];
								this._allPlayerIndicator[i]._load[wp] = this._allPlayerIndicator[i]._capa[wp];
								this._allPlayerIndicator[i]._ammo[wp] -= tmp;
							}else {
								var tmp = this._allPlayerIndicator[i]._capa[wp] - this._allPlayerIndicator[i]._load[wp];
								if(tmp > this._allPlayerIndicator[i]._ammo[wp]) {
									this._allPlayerIndicator[i]._load[wp] += this._allPlayerIndicator[i]._ammo[wp];
									this._allPlayerIndicator[i]._ammo[wp] = 0;
								}else {
									this._allPlayerIndicator[i]._load[wp] = this._allPlayerIndicator[i]._capa[wp];
									this._allPlayerIndicator[i]._ammo[wp] -= tmp;
								}
							}
							this._allPlayerIndicator[i]._reloading = date.getTime();
						}
					}
				}
			}
		}
		/* Function to spawn items on game map.
		 * Randomly select (0,1,2,3,4).
		 * Randomly select a certain amount to be generated.
		 */
		this.spawnItem = function() {
			var sel = 1 + Math.floor(5*Math.random());
			if(sel > 4) sel = 3;
			var ammo = 4 + 4*Math.floor(3*Math.random());
			if(sel == 2 || sel == 3) ammo = 15 + 15*Math.floor(3*Math.random());
			else if(sel == 4) ammo = 8 + 4*Math.floor(3*Math.random());
			var s = Math.floor(Math.random()*(this._allShapes.length));
			var x = this._allShapes[s]._x + Math.floor(Math.random()*(this._allShapes[s]._width - 20));
			var y = this._allShapes[s]._y + Math.floor(Math.random()*(this._allShapes[s]._height - 20));
			this._allItems.push(new objectItem(x, y, sel, ammo));
		}
		/* Function to change players [wp] or selected weapon
		 * [wp] cycle through 0, 1, 2, 3, 4.
		 * [wp] skips cycle if load[wp], ammo[wp] are set to zero.
		 */
		this.changeWep = function(socket, qe) {
			for(var i = 0; i < this._players.length; i++) {
				if(this._players[i]._id == socket.id) {
					var dir = 1;
					if(qe < 1) dir = -1;
					var wep = 0;
					while(true) {
						wep = this._allPlayerIndicator[i]._wp + dir;
						if(this._allPlayerIndicator[i]._wp == 5) wep = 0;
						if(this._allPlayerIndicator[i]._wp == -1) wep = 4;
						this._allPlayerIndicator[i].weapon(wep);
						if(this._allPlayerIndicator[i]._load[wep] > 0 || this._allPlayerIndicator[i]._ammo[wep] > 0 || this._allPlayerIndicator[i]._ammo[wep] == -1) {
							break;
						}
					}
				}
			}
		}
		/* Function to re-spawn a player.
		 * Randomly select a new coordinate.
		 * Reset player hp and all weapons.
		 */
		this.respawn = function(id) {
			var sel = Math.floor(Math.random()*(this._allShapes.length));
			var size = Math.floor(40);
			var x = this._allShapes[sel]._x + Math.floor(Math.random()*(this._allShapes[sel]._width - size));
			var y = this._allShapes[sel]._y + Math.floor(Math.random()*(this._allShapes[sel]._height - size));
			for(var i = 0; i < this._players.length; i++) {
				if(id == this._players[i]._id) {
					this._allShapesPlayers[i]._x = x;
					this._allShapesPlayers[i]._y = y;
					this._allPlayerIndicator[i]._hp = 100;
					this._allPlayerIndicator[i]._respawn = -1;
					this._allPlayerIndicator[i]._wp = 0;
					this._allPlayerIndicator[i]._load = [15, 0, 0, 0, 0];
					this._allPlayerIndicator[i]._ammo = [-1, 0, 0, 0, 0];
				}
			}
		}
		/* Function to add new player (if not in game channel) to game channel.
		 * Set to team will less players for balance.
		 * Generate coordinates to spawn.
		 */
		this.addPlayer = function(player) {
			var alreadyIn = false;
			for(var i = 0; i < this._players.length; i++) {
				if(this._players[i]._id == player._id) alreadyIn = true;
			}
			if(alreadyIn) return;
			var team1 = 0;
			var team2 = 0;
			for(var i = 0; i < this._players.length; i++) {
				if(this._allPlayerIndicator[i]._tm == 0) team1 += 1;
				else team2 += 1;
			}
			this._players.push(player);
			this._totalPlayers += 1;
			var sel = Math.floor(Math.random()*(this._allShapes.length));
			var size = Math.floor(40);
			var x = this._allShapes[sel]._x + Math.floor(Math.random()*(this._allShapes[sel]._width - size));
			var y = this._allShapes[sel]._y + Math.floor(Math.random()*(this._allShapes[sel]._height - size));
			this._allShapesPlayers.push(new objectShape('Player', x, y, size, size));
			this._allPlayerIndicator.push(new indicator());
			this._allPlayerIndicator[this._allPlayerIndicator.length - 1].weapon(0);
			if(team1 > team2) this._allPlayerIndicator[this._allPlayerIndicator.length - 1]._tm = 1;
			else this._allPlayerIndicator[this._allPlayerIndicator.length - 1]._tm = 0;
			
		}
		/* Function to remove player from game channel.
		 * Remove from channel's players list.
		 * Remove from allPlayerIndicator's list.
		 * Remove from allShapePlayer's list.
		 */
		this.removePlayer = function(player_left) {
			for(var i = 0; i < this._totalPlayers; i++) {
				if(this._players[i]._id == player_left._id) {
					this._players.splice(i, 1);
					this._allShapesPlayers.splice(i, 1);
					this._allPlayerIndicator.splice(i, 1);
					this._totalPlayers -= 1;
				}
			}
		}
		/* Single use function to generate tunnels.
		 */
		this.createTunnel = function() {
			/* Create Tunnels to connect rooms
			 * In horizontal and vertical form
			 */
			//Select minimum tunnels to generate for each room.
			var randomConnect = [];
			for(var i = 0; i < this._rooms; i++) {
				randomConnect.push(1 + Math.floor(Math.random() * 2));
			}

			//Select first room to generate tunnels.
			var sel = Math.floor(Math.random() * this._rooms);
			if(sel == this._rooms) sel = this._rooms - 1;
			
			//Generate tunnels for all rooms.
			while(true) {
				//Check that all rooms have enough tunnels.
				var allConnected = true;
				for(var j = 0; j < this._rooms; j++) {
					if(this._connection[j] < randomConnect[j]) allConnected = false;
				}
				if(allConnected) {
					break;
				}

				//Variables
				var index = sel;				
				var select = [];
				var chosen = [];

				//Find all rooms yet to reach maximum tunnels.
				for(var i = 0; i < this._rooms; i++) {
					if(i == index) continue;
					if(this._connection[i] >= 4) continue;
					select.push(i);
				}

				//Randomly select rooms to generate tunnels to from index room.
				if(select.length == 0) break;
				for(var i = 0; i < randomConnect[index]; i++) {
					if(select.length == 0) break;
					var con = Math.floor(Math.random() * select.length);
					if(con == select.length) con = select.length - 1;
					chosen.push(select[con]);
					select.splice(con, 1);
				}

				//Generate tunnel.
				for(var i = 0; i < chosen.length; i++) {
					var x1 = this._allShapes[index]._x + Math.floor(this._allShapes[index]._width / 2);
					var y1 = this._allShapes[index]._y + Math.floor(this._allShapes[index]._height / 2);
					var x2 = this._allShapes[chosen[i]]._x + Math.floor(this._allShapes[chosen[i]]._width / 2);
					var y2 = this._allShapes[chosen[i]]._y + Math.floor(this._allShapes[chosen[i]]._height / 2); 
					var horizontal = x2 - x1;
					var vertical = y2 - y1;
					
					if(horizontal >= 0 && vertical <= 0 && Math.abs(horizontal) <= Math.abs(vertical)) this.pathGenerator(0, index, chosen[i]);
					else if(horizontal >= 0 && vertical <= 0 && Math.abs(horizontal) >= Math.abs(vertical)) this.pathGenerator(1, index, chosen[i]);
					else if(horizontal >= 0 && vertical >= 0 && Math.abs(horizontal) >= Math.abs(vertical)) this.pathGenerator(1, index, chosen[i]);
					else if(horizontal >= 0 && vertical >= 0 && Math.abs(horizontal) <= Math.abs(vertical)) this.pathGenerator(2, index, chosen[i]);
					else if(horizontal <= 0 && vertical >= 0 && Math.abs(horizontal) <= Math.abs(vertical)) this.pathGenerator(2, index, chosen[i]);
					else if(horizontal <= 0 && vertical >= 0 && Math.abs(horizontal) >= Math.abs(vertical)) this.pathGenerator(3, index, chosen[i]);
					else if(horizontal <= 0 && vertical <= 0 && Math.abs(horizontal) >= Math.abs(vertical)) this.pathGenerator(3, index, chosen[i]);
					else this.pathGenerator(0, index, chosen[i]);

					this._connection[index] += 1;
					this._connection[chosen[i]] += 1;
				}

				//Select one of the chosen rooms as next index to generate tunnels.
				sel = Math.floor(Math.random()*chosen.length);
				if(sel == chosen.length) sel = chosen.length - 1;
			}
		}
		/* Single use function to add players to game channel.
		 * Generate coordinates to spawn for each player.
		 */
		this.createPlayers = function() {
			for(var i = 0; i < this._players.length; i++) {
				var sel = Math.floor(Math.random()*(this._allShapes.length));
				var size = Math.floor(40);
				var x = this._allShapes[sel]._x + Math.floor(Math.random()*(this._allShapes[sel]._width - size));
				var y = this._allShapes[sel]._y + Math.floor(Math.random()*(this._allShapes[sel]._height - size));
				this._allShapesPlayers.push(new objectShape('Player', x, y, size, size));
				this._allPlayerIndicator.push(new indicator());
				this._allPlayerIndicator[this._allPlayerIndicator.length - 1].weapon(0);
				this._allPlayerIndicator[this._allPlayerIndicator.length - 1]._tm = 1;
			}
			var j = 0;
			var arr = [];
			while(j < Math.floor(this._players.length/2)) {
				var rdm = Math.floor(Math.random() * this._players.length);
				var isTrue = true;
				for(var k = 0; k < arr.length; k++) {
					if(rdm == arr[k]) isTrue = false;
				}
				if(isTrue) {
					arr.push(rdm);
					this._allPlayerIndicator[rdm]._tm = 0;
					j++;
				}
			}
		}
		/* Single use function to create the tunnels from room to room.
		 * Start from center of initial room and branch to center of selected room.
		 */
		this.pathGenerator = function(path, index1, index2) {
			var x1 = this._allShapes[index1]._x;
			var y1 = this._allShapes[index1]._y;
			var w1 = this._allShapes[index1]._width;
			var h1 = this._allShapes[index1]._height;
			var x2 = this._allShapes[index2]._x;
			var y2 = this._allShapes[index2]._y;
			var w2 = this._allShapes[index2]._width;
			var h2 = this._allShapes[index2]._height;
			var h_size = Math.floor(40);
			var f_size = Math.floor(80);
			if(path == 0) {
				var x = x1 + Math.floor(w1/2) - h_size;
				var y = y2 + Math.floor(w2/2) - h_size;
				var w = f_size;
				var h = y1 - (y2 + Math.floor(w2/2) - h_size);
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
				w = x2 - (x1 + Math.floor(w1/2) - h_size);
				if(w < 0) {
					w = (x1 + Math.floor(w1/2) - h_size) - (x2 + w2);
					x = x2 + w2;
				}
				h = f_size;
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
			}else if(path == 1) {
				var x = x1 + Math.floor(w1/2) - h_size;
				var y = y1 + Math.floor(h1/2) - h_size;
				var w = (x2 + Math.floor(w2/2) + h_size) - x;
				var h = f_size;
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
				x = x2 + Math.floor(w2/2) - h_size;
				y = y2 + Math.floor(h2/2) - h_size;
				w = f_size;
				h = (y1 + Math.floor(h1/2) + h_size) - y;
				if(h < 0) {
					y = y1 + Math.floor(h1/2) - h_size;
					h = (y2 + Math.floor(h2/2) + h_size) - y;
				}
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
			}else if(path == 2) {
				var x = x1 + Math.floor(w1/2) - h_size;
				var y = y1 + Math.floor(h1/2) - h_size;
				var w = f_size;
				var h = (y2 + Math.floor(h2/2) + h_size) - y;
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
				y = y2 + Math.floor(h2/2) - h_size;
				w = (x2 + Math.floor(w2/2) + h_size) - x;
				if(w < 0) {
					w = (x1 + Math.floor(w1/2) + h_size) - (x2 + Math.floor(w2/2) - h_size);
					x = x2 + Math.floor(w2/2) - h_size;
				}
				h = f_size;
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
			}else if(path == 3) {
				var x = x2 + Math.floor(w2/2) - h_size;
				var y = y1 + Math.floor(h1/2) - h_size;
				var w = (x1 + Math.floor(w1/2) + h_size) - x;
				var h = f_size;
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
				w = f_size;
				h = (y2 + Math.floor(h2/2) + h_size) - y;
				if(h < 0) {
					h = (y1 + Math.floor(h1/2) + h_size) - (y2 + Math.floor(h2/2) - h_size);
					y = y2 + Math.floor(h2/2) - h_size;
				}
				this._allShapes.push(new objectShape('Tunnel', x, y, w, h));
				for(var j = y; j < y + h; j++) {
					for(var k = x; k < x + w; k++) {
						this._mapper[j][k] = 2;
					}
				}
			}
		}
		/* Single use function to generate restriction walls.
		 * Use mapper and create rectangular blocks that players and bullets cannot pass.
		 */
		this.crashGenerator = function() {
			for(var i = 0; i < this._height; i++) {
				for(var j = 0; j < this._width; j++) {
					if(this._mapper[i][j] == 0) {
						this.createWall(j, i);
					}
				}
			}
		}
		/* Function used by crashGenerator to scan horizontally then vertically until contact
		 * with room, tunnel, or reach canvas edges. Create restriction wall blocks using scan.
		 */
		this.createWall = function(x, y) {
			var b = true;
			var width = 1;
			var height = 1;
			//Scan horizontally
			while((this._mapper[y + height][x + width] == 0) && ((x + width) < this._width)) width += 1;
			//Scan vertically
			while(b && y + height < this._height) {
				for(var j = x; j < x + width; j++){
					if(this._mapper[y + height][j] > 0) b = false;
				}
				if(b){
					height += 1;
				}
			}
			
			//Create rectangular block and isolate location on mapper
			this._crashObjects.push(new objectShape('Wall', x, y, width, height));
			for(var i = y; i < y + height; i++) {
				for(var j = x; j < x + width; j++) {
					this._mapper[i][j] = 1;
				}
			}
		}
	}
}


/* Class constructor to store user/player's game status for use and display.
 * _range = 0			: int	: range from player's center to mouse unless blocked by walls
 * _score = 0			: int	: personal kill count
 * _hp = 100			: int	: current hit points
 * _tm = 0				: int	: team A or B
 * _at = 0				: int	: current weapon's damage
 * _fr = 0				: int	: current fire rate of weapon
 * _rl = 0				: int	: current reload rate of weapon
 * _wp = 0				: int	: current weapon
 * _ready = 0			: int	: when last fired weapon
 * _reloading = 0		: int	: when last reload weapon
 * _respawn				: int	: -1 when active or when last killed
 * _accur = 100.0		: double: current weapon accuracy
 * _load = [15,0,0,0,0]	: int[]	: number of bullets to fire in each weapon
 * _capa = [15,5,30,..]	: int[]	: max number of bullets to fire in each load
 * _ammo = [-1,0,0,...] : int[] : number of bullets stored for each weapon, -1 is infinity
 */
class indicator {
	constructor() {
		this._range = 0;
		this._score = 0;
		this._hp = 100;
		this._tm = 0;
		this._at = 0;
		this._fr = 0;
		this._rl = 0;
		this._rd = 0.0;
		this._wp = 0;
		this._ready = 0;
		this._reloading = 0;
		this._respawn = -1;
		this._accur = 100.0;
		this._load = [15, 0, 0, 0, 0];
		this._capa = [15, 5, 30, 30, 10];
		this._ammo = [-1, 0, 0, 0, 0];
		/* Function to switch weapons, fire rate, and reloading rate
		 */
		this.weapon = function(type) {
			this._wp = type;
			if(type == 0) {
				this._at = 10;
				this._fr = 30;
				this._rl = 700;
			}else if(type == 1) {
				this._at = 80;
				this._fr = 500;
				this._rl = 1500;
			}else if(type == 2) {
				this._at = 15;
				this._fr = 80;
				this._rl = 700;
			}else if(type == 3) {
				this._at = 10;
				this._fr = 50;
				this._rl = 700;
			}else {
				this._at = 6;
				this._fr = 500;
				this._rl = 1100;
			}
		}
	}
}

/* Class constructor to store bullet information.
 * _x = x			: int	: x coordinate
 * _y = y			: int	: y coordinate
 * _rd = radians	: double: degree or direction bullet is facing
 * _len = 40		: int	: size shown from front to back of bullet
 * _duration = dur	: int	: duration of bullet until it disappears
 * _dmg = dmg		: int	: damage each bullet does to player
 * _tm = tm			: int	: which team fired this bullet
 * _sc = per		: int	: which player fired this bullet
 */
class objectBullet {
	constructor(x, y, radian, duration, dmg, tm, per) {
		this._x = x;
		this._y = y;
		this._rd = radian;
		this._len = 40;
		this._duration = duration;
		this._dmg = dmg;
		this._tm = tm;
		this._sc = per;
		/* Function to upldate bullet to new location and reduce duration each update.
		 */
		this.update = function() {
			this._x = this._x + this._len*Math.cos(this._rd);
			this._y = this._y + this._len*Math.sin(this._rd);
			this._duration -= 1;
		}
	}
}

/* Class constructor to store room, tunnel, or player information.
 * _type = type		: String: type - "room", "tunnel", "player"
 * _x = x			: int	: x coordinate
 * _y = y			: int	: y coordinate
 * _width = width	: int	: width of shape
 * _height = height : int	: height of shape
 */
class objectShape {
	constructor(type, x, y, width, height){
		this._type = type;
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		/* Function to change x and y coordinate of shape
		 */
		this.shift = function(x = 0, y = 0) {
			this._x += x;
			this._y += y;
		}
	}
}

/* Class constructor to store item information.
 * _x = x		: int	: x coordinate
 * _y = y		: int	: y coordinate
 * _w = 30		: int	: width/height of shape
 * _type = type : int	: _, 1, 2, 3, 4 weapon
 * _ammo = ammo : int	: amount stored
 */
class objectItem {
	constructor(x, y, type, ammo) {
		this._x = x;
		this._y = y;
		this._w = 30;
		this._type = type;
		this._ammo = ammo;
	}
}
/**********************************************************/