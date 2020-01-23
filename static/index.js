/* Enum mode of canvas
 * Login, User, Host, Join, Game.
 */
var mode = {
    LOGIN: 1,
    USER: 2,
    HOST: 3,
    JOIN: 4,
    GAME: 5,
};

/* Enum weapons
 * pistal, sniper, assault, submachine, shotgun.
 */
var wpn = {
    PISTAL: 0,
    SNIPER: 1,
    ASSAULT: 2,
    SUB: 3,
    SHOT: 4,
};

/* Store mouse click, press, and when released.
 */
var mouseInfo = {
    press : 0,
    click : 0,
    relea : 0,
};

/* Store when key board was pressed or clicked.
 */
var keyBoard = {
    press : 0,
    click : 0,
};

/* Confirm which key was pressed on key board.
 */
var map = {};

/* Store which index is the player and how far to shift canvas to center on player.
 */
var screenShifter = {
    x : 0,
    y : 0,
    index : -1,
};

/* Store name to send to server for name change.
 */
var nameSelector = {
    click : 0,
    name : "",
};

/* To start game from HTML file.
 */
function initial() {
    myArea.start();
}

/* Store canvas information and functions.
 */
var myArea = {
    //Grab canvas element from HTML.
    canvas : document.getElementById("mainCanvas"),
    //Initialize canvas and window functions.
    start : function() {
        //Canvas variables and login page.
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");
        this.currentMode = mode.LOGIN;

        //Set to run "primary" function each 20 milliseconds.
        this.interval = setInterval(primary, 20);

        //Set to true if this key is pressed on key board otherwise false.
        onkeydown = onkeyup = function(e) {
            e = e || this.event;
            map[e.keyCode] = e.type == 'keydown';
        }

        //Store mouse position on canvas.
        window.addEventListener('mousemove', function(e) {
            myArea.x = e.pageX;
            myArea.y = e.pageY;
        })

        //Store when mouse is pressed.
        window.addEventListener('mousedown', function() {
            mouseInfo.press = 1;
        })

        //Stored when mouse is released and check clicked.
        window.addEventListener('mouseup', function() {
            if(mouseInfo.press == 1) { mouseInfo.click = 1; }
            mouseInfo.press = 0;
            mouseInfo.relea = 0;
        })

        //Store when key board is pressed.
        window.addEventListener('keydown', function(e) {
            keyBoard.press = 1;
        })

        //Store when key board is released and extra function if in user mode.
        window.addEventListener('keyup', function(e) {
            if(keyBoard.press == 1) { keyBoard.click = 1; }

            //Check if key is number or letter and store in name selector.
            if(keyBoard.click == 1 && nameSelector.click == 1) {
                if(e.keyCode == 8 || e.keyCode == 46){
                    nameSelector.name = nameSelector.name.slice(0, -1);
                }else if(e.keyCode > 47){
                    var tmp = String.fromCharCode(e.keyCode);
                    if(tmp.match(/^[0-9a-zA-Z]+$/)){
                        nameSelector.name += String.fromCharCode(e.keyCode);
                    } 
                }
            }
            keyBoard.press = 0;
        })

        //Prevent key from messing with the browser.
        document.onkeydown = function (event) {
            if (!event) {
                event = window.event;
            }   
            var keyCode = event.keyCode;
            if (keyCode == 8 &&
                ((event.target || event.srcElement).tagName != "TEXTAREA") && 
                ((event.target || event.srcElement).tagName != "INPUT")) { 
                
                if (navigator.userAgent.toLowerCase().indexOf("msie") == -1) {
                    event.stopPropagation();
                } else {
                    alert("prevented");
                    event.returnValue = false;
                }
                return false;
            }
        };
    },
    //Clear or reset content.
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    //End function.
    stop : function() {
        this.clearInterval(this.interval);
    }
}

/* Use specific functions based on current mode.
 * login, user, host, join, or game.
 */
function primary() {
    myArea.clear();
    if(myArea.currentMode == mode.LOGIN) {
        drawLogin();
        login();
    }else if(myArea.currentMode == mode.USER) {
        drawUser();
        user();
    }else if(myArea.currentMode == mode.HOST) {
        drawHost();
        host();
    }else if(myArea.currentMode == mode.JOIN) {
        drawJoin();
        join();
    }else if(myArea.currentMode == mode.GAME) {
        drawGame();
        game();
    }
    drawCursor();
}

/* Draw a white circle in modes login, user, host, or join.
 * Draw a targetting cursor in game mode.
 */
function drawCursor() {
    var x = 10;
    var y = 10;
    var size = 5;
    ctx = myArea.context;
    if(myArea.currentMode != mode.GAME) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(myArea.x - x, myArea.y - y, size, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }else {
        var len = 20;
        var unitSize = gameinfo._allShapesPlayers[screenShifter.index]._width/2;
        var dif = Math.sqrt(Math.pow(400 + unitSize - myArea.x + x, 2) + Math.pow(300 + unitSize - myArea.y + y, 2));
        var wep = gameinfo._allPlayerIndicator[screenShifter.index]._wp;
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        var extend = 0.0;
        ctx.beginPath();
        if(wep == 1) {
            extend = (300 - dif)/14.75;
        }else if(wep == 2 || wep == 3) {
            extend = dif/30;
        }
        extend += (100.0 - gameinfo._allPlayerIndicator[screenShifter.index]._accur)/2;
        if(extend > 20.0) extend = 20.0;
        if(extend < 0.0) extend = 0.0;
        ctx.moveTo(myArea.x - x - len - extend, myArea.y - y - extend);
        ctx.lineTo(myArea.x - x - extend, myArea.y - y - extend);
        ctx.lineTo(myArea.x - x - extend, myArea.y - y - len - extend);
        ctx.moveTo(myArea.x - x + len + extend, myArea.y - y - extend);
        ctx.lineTo(myArea.x - x + extend, myArea.y - y - extend);
        ctx.lineTo(myArea.x - x + extend, myArea.y - y - len - extend);
        ctx.moveTo(myArea.x - x - len - extend, myArea.y - y + extend);
        ctx.lineTo(myArea.x - x - extend, myArea.y - y + extend);
        ctx.lineTo(myArea.x - x - extend, myArea.y - y + len + extend);
        ctx.moveTo(myArea.x - x + len + extend, myArea.y - y + extend);
        ctx.lineTo(myArea.x - x + extend, myArea.y - y + extend);
        ctx.lineTo(myArea.x - x + extend, myArea.y - y + len + extend);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = '#ff0000';
        ctx.arc(myArea.x - x, myArea.y - y, 5, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

/* Draw the login page. Contains user name and id.
 * Contains clickeable buttons for user, host, and join page.
 */
function drawLogin() {
    var x = 10;
    var y = 10;
    ctx = myArea.context;
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 0, myArea.canvas.width, myArea.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = "bold 20px Arial";
    ctx.fillText(playerInfo._id, 10, 40);
    ctx.fillText(playerInfo._name, 10, 60);
    ctx.fillStyle = '#000000';
    ctx.fillRect(499, 49, 202, 102);
    ctx.fillRect(499, 249, 202, 102);
    ctx.fillRect(499, 449, 202, 102);
    if(500 + x < myArea.x && myArea.x < 700 + x && 50 + y < myArea.y && myArea.y < 150 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(500, 50, 200, 100);
    if(500 + x < myArea.x && myArea.x < 700 + x && 250 + y < myArea.y && myArea.y < 350 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(500, 250, 200, 100);
    if(500 + x < myArea.x && myArea.x < 700 + x && 450 + y < myArea.y && myArea.y < 550 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(500, 450, 200, 100);
    ctx.fillStyle = '#000000';
    ctx.fillText("Username", 550, 110);
    ctx.fillText("Host", 580, 310);
    ctx.fillText("Join", 580, 510);
}

/* Trigger functions to send user to user, host, or join page.
 * Host trigger send request to create host channel.
 */
function login() {
    if(mouseInfo.click == 1) {
        var x = 10;
        var y = 10;
        if(500 + x < myArea.x && myArea.x < 700 + x && 50 + y < myArea.y && myArea.y < 150 + y) {
            myArea.currentMode = mode.USER;
            nameSelector.name = "";
        }
        else if(500 + x < myArea.x && myArea.x < 700 + x && 250 + y < myArea.y && myArea.y < 350 + y) {
            socket.emit('createHost'); // creates host room player
            myArea.currentMode = mode.HOST;
        }
        else if(500 + x < myArea.x && myArea.x < 700 + x && 450 + y < myArea.y && myArea.y < 550 + y) {
            myArea.currentMode = mode.JOIN;
        }
        mouseInfo.click = 0;
    }
}

/* Draw the user page. Contains text bar for name.
 * Contains clickeable set and exit buttons.
 */
function drawUser() {
    var x = 10;
    var y = 10;
    ctx = myArea.context;
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 0, myArea.canvas.width, myArea.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = "bold 20px Arial";
    ctx.fillText(playerInfo._id, 10, 40);
    ctx.fillText(playerInfo._name, 10, 60);
    ctx.fillRect(199, 199, 402, 32);
    if(nameSelector.click == 1){
        ctx.fillRect(195, 195, 410, 40);
        ctx.fillRect(196, 196, 408, 38);
        ctx.fillRect(197, 197, 406, 36);
        ctx.fillRect(198, 198, 404, 34);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 200, 400, 30);
    ctx.fillStyle = '#000000';
    ctx.fillRect(199, 249, 152, 62);
    ctx.fillRect(449, 249, 152, 62);
    if(200 + x < myArea.x && myArea.x < 350 + x && 250 + y < myArea.y && myArea.y < 310 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(200, 250, 150, 60);
    if(450 + x < myArea.x && myArea.x < 600 + x && 250 + y < myArea.y && myArea.y < 310 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(450, 250, 150, 60);
    ctx.fillStyle = '#000000';
    ctx.fillText("Set", 260, 290);
    ctx.fillText("Exit", 510, 290);
    ctx.font = "20px Arial";
    ctx.fillText(nameSelector.name, 205, 220);
}

/* Trigger function to send request to change name or
 * send user to login page. Text field when clicked allow
 * user to enter new name.
 */
function user() {
    if(mouseInfo.click == 1) {
        var x = 10;
        var y = 10;
        if(200 + x < myArea.x && myArea.x < 600 + x && 200 + y < myArea.y && myArea.y < 230 + y){
            if(nameSelector.click == 1){
                nameSelector.click = 0;
            }else{
                nameSelector.click = 1;
            }
        }
        if(200 + x < myArea.x && myArea.x < 350 + x && 250 + y < myArea.y && myArea.y < 310 + y){
            socket.emit('changeName', nameSelector.name);
        }
        if(450 + x < myArea.x && myArea.x < 600 + x && 250 + y < myArea.y && myArea.y < 310 + y){
            myArea.currentMode = mode.LOGIN;
            nameSelector.click = 0;
        }
        mouseInfo.click = 0;
    }
}

/* Draw the host page. Contains all player names and ready status.
 * Contains start and exit button for login page or game page.
 */
function drawHost() {
    var x = 10;
    var y = 10;
    ctx = myArea.context;
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 0, myArea.canvas.width, myArea.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = "bold 20px Arial";
    ctx.fillText("Host Game here: ", 10, 40);
    ctx.fillStyle = '#000000';
    ctx.fillText(playerInfo._id, 500, 40);
    ctx.fillText(playerInfo._name, 500, 60);
    ctx.fillText("ReadyStatus",300, 80);
   
   for(var i=0;i<hostinfo._players.length;i++){

        
        if(10 + x < myArea.x && myArea.x < 160 + x &&  (100+90*i)+ y < myArea.y && myArea.y < (100+90*i) + y){ ctx.fillStyle = '#808080'; }
        else{ ctx.fillStyle = '#a9a9a9'; }
        ctx.fillRect(10, 100+90*i, 150, 60);
        ctx.fillStyle = '#000000';
        ctx.fillText(hostinfo._players[i]._name, 40, 140+90*i);
        ctx.fillText(hostinfo._ready[i], 300, 140+90*i);


   }
    
    

  
    if(650 + x < myArea.x && myArea.x < 800 + x && 540 + y < myArea.y && myArea.y < 600 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(650, 540, 150, 60);
    ctx.fillStyle = '#000000';
    ctx.fillText("Exit", 710, 580);
    
    if(150 + x < myArea.x && myArea.x < 800 + x && 60 + y < myArea.y && myArea.y < 120 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(650, 60, 150, 60);
    ctx.fillStyle = '#000000';
    ctx.fillText("START", 710, 100); 
}

/* Trigger function to send request to ready up or start game.
 * Exit button send user to login page.
 */
function host() {
    if(mouseInfo.click == 1) {
        var x = 10;
        var y = 10;   
        
        if(150 + x < myArea.x && myArea.x < 800 + x && 60 + y < myArea.y && myArea.y < 120 + y){
            socket.emit('readyHost', host_index);
        }
        if(650 + x < myArea.x && myArea.x < 800 + x && 540 + y < myArea.y && myArea.y < 600 + y){
            myArea.currentMode = mode.LOGIN;
            socket.emit('leaveHost', host_index);
        }

        
        for(var i=0;i<hostinfo._players.length;i++){
                    
                    if(10 + x < myArea.x && myArea.x < 160 + x &&  (60+20*i)+ y < myArea.y && myArea.y < (60+60+20*i) + y){ ctx.fillStyle = '#808080'; }
                    else{ ctx.fillStyle = '#a9a9a9'; }
                    ctx.fillRect(10, 60+20*i, 150, 60);
                    ctx.fillStyle = '#000000';
        }
        
        mouseInfo.click = 0;
    }
    if(hostinfo._inGame >= 0 && game_index < 0) {
        socket.emit('joinGame', hostinfo._inGame);
    }
    if(game_index >= 0 && gameinfo._access == true) {
        myArea.currentMode = mode.GAME;
    }
}

/* Draw the join page. Contains list of active host to join.
 * Contains exit button.
 */
function drawJoin() {
    var x = 10;
    var y = 10;
    ctx = myArea.context;
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 0, myArea.canvas.width, myArea.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = "bold 20px Arial";
    ctx.fillText("Join Host Room Here:", 10, 40); // where I am putting the text on the grid
    ctx.fillStyle = '#000000';
    ctx.fillText(playerInfo._id, 500, 40);
    ctx.fillText(playerInfo._name, 500, 60);
   
    ctx.fillText("NumofPlayers", 400, 80);
    ctx.fillText("GameStatus", 250,80);


    

    for(var i=0; i< hostlist.length;i++){
        if(10 + x < myArea.x && myArea.x < 250 + x && (100+90*i) + y < myArea.y && myArea.y < 160+(100+90*i) + y){ ctx.fillStyle = '#808080'; }
        else{ ctx.fillStyle = '#a9a9a9'; }
        ctx.fillRect(10, 100+90*i, 150, 60);
        ctx.fillStyle = '#000000';
        ctx.fillText(hostlist[i]._host._name,40, 140+90*i);
        ctx.fillText(hostlist[i]._players.length+"/4", 450, 140+90*i); 
        

        

        var status = hostlist[i]._inGame;

        if(status >=0){
            ctx.fillText("inGame", 250,140+90*i);
        }
        else {

            ctx.fillText("NotinGame",250,140+90*i);
        }
        
   

    }



  
    if(650 + x < myArea.x && myArea.x < 800 + x && 540 + y < myArea.y && myArea.y < 600 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(650, 540, 150, 60);
    ctx.fillStyle = '#000000';
    ctx.fillText("Exit", 710, 580);
}

/* Trigger function for sending user to selected host page. Exit button to
 * send user to login page.
 */
function join() {
    if(mouseInfo.click == 1) {
        var x = 10;
        var y = 10;
       

        if(650 + x < myArea.x && myArea.x < 800 + x && 540 + y < myArea.y && myArea.y < 600 + y){
            myArea.currentMode = mode.LOGIN;
        }


        for(var i=0; i< hostlist.length;i++){
            if(10 + x < myArea.x && myArea.x < 250 + x && (100+90*i) + y < myArea.y && myArea.y < 160+(100+90*i) + y){ 
            
                if(hostlist[i]._players.length < 4){
                 
                    
                myArea.currentMode =mode.HOST;
                socket.emit('joinHost',i);

                    
                }
                
            
            
            }
           
    
        }
      




        mouseInfo.click = 0;
    }

}

/* Draw the game page. Contains rooms, tunnels, players, bullets, items,
 * Contains indicators, map, attack effects, etc.
 */
function drawGame() {
    ctx = myArea.context;
    ctx.fillStyle = '#a9a9a9';
    ctx.fillRect(0, 0, myArea.canvas.width, myArea.canvas.height);
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = '#000000';
    ctx.fillText(gameinfo._id, 10, 40);
    var shape = gameinfo._allShapes;
    ctx.fillStyle = '#000000';
    for(var i = 0; i < shape.length; i++) {
        ctx.fillRect(shape[i]._x - 1 + screenShifter.x, shape[i]._y - 1 + screenShifter.y, shape[i]._width + 2, shape[i]._height + 2);
    }
    ctx.fillStyle = '#808080';
    for(var i = 0; i < shape.length; i++) {
        if(shape[i]._type == 'Tunnel') ctx.fillRect(shape[i]._x + screenShifter.x, shape[i]._y + screenShifter.y, shape[i]._width, shape[i]._height);
    }
    ctx.fillStyle = '#b5651d';
    for(var i = 0; i < shape.length; i++) {
        if(shape[i]._type == 'room') ctx.fillRect(shape[i]._x + screenShifter.x, shape[i]._y + screenShifter.y, shape[i]._width, shape[i]._height);
    }
    for(var i = 0; i < gameinfo._allItems.length; i++) {
        var s = gameinfo._allItems[i];
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.fillRect(s._x - 1  + screenShifter.x, s._y - 1 + screenShifter.y, s._w + 2, s._w + 2);
        ctx.fillStyle = '#013220';
        ctx.fillRect(s._x  + screenShifter.x, s._y + screenShifter.y, s._w, s._w);
        ctx.fillStyle = '#000000';
        if(s._type == 1) ctx.fillText("SN", s._x + 2 + screenShifter.x, s._y + 20 + screenShifter.y);
        else if(s._type == 2) ctx.fillText("AS", s._x + 2 + screenShifter.x, s._y + 20 + screenShifter.y);
        else if(s._type == 3) ctx.fillText("SM", s._x + 2 + screenShifter.x, s._y + 20 + screenShifter.y);
        else if(s._type == 4) ctx.fillText("SG", s._x + 2 + screenShifter.x, s._y + 20 + screenShifter.y);
        ctx.closePath();
    }
    shape = gameinfo._allShapesPlayers;
    var team = gameinfo._allPlayerIndicator[screenShifter.index]._tm;
    for(var i = 0; i < shape.length; i++) {
        if(gameinfo._allPlayerIndicator[i]._respawn == -1) {
            drawArms(i);
            ctx.beginPath();
            if(i == screenShifter.index) {
                ctx.fillStyle = '#0000ff';
                ctx.arc(shape[i]._x + shape[i]._width/2 + screenShifter.x, shape[i]._y + shape[i]._height/2 + screenShifter.y, shape[i]._width/2, 0, 2*Math.PI);
                ctx.fill();
            }else if(gameinfo._allPlayerIndicator[i]._tm == team) {
                ctx.fillStyle = '#0d98ba';
                ctx.arc(shape[i]._x + shape[i]._width/2 + screenShifter.x, shape[i]._y + shape[i]._height/2 + screenShifter.y, shape[i]._width/2, 0, 2*Math.PI);
                ctx.fill();
            }else {
                ctx.fillStyle = '#ff0000';
                ctx.arc(shape[i]._x + shape[i]._width/2 + screenShifter.x, shape[i]._y + shape[i]._height/2 + screenShifter.y, shape[i]._width/2, 0, 2*Math.PI);
                ctx.fill();
            }
            ctx.fillStyle = '#000000';
            var c = ctx.measureText(gameinfo._players[i]._name).width;
            ctx.fillText(gameinfo._players[i]._name, shape[i]._x + shape[i]._width/2 + screenShifter.x - c/2, shape[i]._y + screenShifter.y);
            ctx.closePath();
            drawFire(i);
        }
    }
    ctx.strokeStyle = '#ffff00';
    for(var i = 0; i < gameinfo._bullets.length; i++) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        var b = gameinfo._bullets[i];
        ctx.moveTo(b._x + screenShifter.x, b._y + screenShifter.y);
        ctx.lineTo(b._x + screenShifter.x + 50*Math.cos(b._rd), b._y + screenShifter.y + 50*Math.sin(b._rd));
        ctx.stroke();
        ctx.closePath();
    }
    ctx.strokeStyle = '#000000';
    drawIndicator(screenShifter.index);
    if(gameinfo._access == false) {
        drawGameOver();
    }
}

/* Trigger functions for WASD movement, QE switch weapon, R reload, Left Click/PRESS for
 * firing weapon request to server. SHIFT to increase movement speed.
 */
function game() {
    var x = 0;
    var y = 0;
    var s = 1;
    if(gameinfo._allPlayerIndicator[screenShifter.index]._respawn == -1) {
        if(map[16]){
            s = 3;
        }
        if(map[87]){
            y = Math.floor(-4*s);
        }else if(map[83]) {
            y = Math.floor(4*s);
        }
        if(map[65]) {
            x = Math.floor(-4*s);
        }else if(map[68]) {
            x = Math.floor(4*s);
        }
        if(map[27]) {
            socket.emit('leaveGame', game_index);
            socket.emit('leaveHost', host_index);
            myArea.currentMode = mode.LOGIN;
        }
        if(keyBoard.click == 1 && map[81]) {
            socket.emit('changeWeapon', game_index, 1);
            keyBoard.click = 0;
        }else if(keyBoard.click == 1 && map[69]) {
            socket.emit('changeWeapon', game_index, -1);
            keyBoard.click = 0;
        }else if(keyBoard.click == 1 && map[82]) {
            socket.emit('reloading', game_index);
            keyBoard.click = 0;
        }
        
        socket.emit('movePlayer', game_index, x, y);
        socket.emit('direction', game_index, myArea.x, myArea.y);
        var tmp = gameinfo._allPlayerIndicator[screenShifter.index];
        if(tmp._wp > 0 && mouseInfo.press == 1 && tmp._load[tmp._wp] > 0) {
            socket.emit('attack', game_index);
        }else if(mouseInfo.press == 1 && mouseInfo.relea == 0 && tmp._load[tmp._wp] > 0) {
            socket.emit('attack', game_index);
            mouseInfo.relea = 1;
        }
    }
    if(gameinfo._access == false) {
        if(330 < myArea.x && myArea.x < 480 && 420 < myArea.y && myArea.y < 480 && mouseInfo.click == 1) {
            socket.emit('leaveGame', game_index);
            game_index = -1;
            gameinfo = null;
            mouseInfo.click = 0;
            myArea.currentMode = mode.HOST;
        }
    }
    mouseInfo.click = 0;
}

/* Draw weapon shape based on current [wp].
 */
function drawArms(index) {
    var shape = gameinfo._allShapesPlayers[index];
    var x = shape._x + shape._width/2 + screenShifter.x;
    var y = shape._y + shape._height/2 + screenShifter.y;
    var radian = gameinfo._allPlayerIndicator[index]._rd;
    var wep = gameinfo._allPlayerIndicator[index]._wp;
    var range = gameinfo._allPlayerIndicator[index]._range;
    ctx = myArea.context;
    if(wep == wpn.SNIPER) {
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 55*Math.cos(radian), y + 55*Math.sin(radian));
        ctx.strokeStyle = '#013220';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.moveTo(x + 25*Math.cos(radian), y + 25*Math.sin(radian));
        ctx.lineTo(x + 35*Math.cos(radian), y + 35*Math.sin(radian));
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();
    }else if(wep == wpn.ASSAULT) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(x, y);
        ctx.lineTo(x + range*Math.cos(radian), y + range*Math.sin(radian));
        ctx.strokeStyle = '#ff6961';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.moveTo(x + 40*Math.cos(radian), y + 40*Math.sin(radian));
        ctx.lineTo(x + 50*Math.cos(radian), y + 50*Math.sin(radian));
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 55*Math.cos(radian), y + 55*Math.sin(radian));
        ctx.strokeStyle = '#013220';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.moveTo(x + 25*Math.cos(radian), y + 25*Math.sin(radian));
        ctx.lineTo(x + 28*Math.cos(radian), y + 28*Math.sin(radian));
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();
    }else if(wep == wpn.SUB) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(x, y);
        ctx.lineTo(x + range*Math.cos(radian), y + range*Math.sin(radian));
        ctx.strokeStyle = '#ff6961';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 45*Math.cos(radian), y + 45*Math.sin(radian));
        ctx.strokeStyle = '#6c7a86';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x + 30*Math.cos(radian), y + 30*Math.sin(radian));
        ctx.lineTo(x + 45*Math.cos(radian), y + 45*Math.sin(radian));
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();
    }else if(wep == wpn.SHOT) {
        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.moveTo(x + 30*Math.cos(radian), y + 30*Math.sin(radian));
        ctx.lineTo(x + 45*Math.cos(radian), y + 45*Math.sin(radian));
        ctx.strokeStyle = '#362204';
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 55*Math.cos(radian), y + 55*Math.sin(radian));
        ctx.strokeStyle = '#654321';
        ctx.stroke();
        ctx.closePath();
    }else {
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30*Math.cos(radian), y + 30*Math.sin(radian));
        ctx.strokeStyle = '#aaa9ad';
        ctx.stroke();
        ctx.strokeStyle = '#000000';
        ctx.closePath();
    }
}

/* Draw health, current weapon, ammo in weapon, ammo in storage,
 * A and B team scores.
 */
function drawIndicator(index) {
    var ctx = myArea.context;
    var wp = gameinfo._allPlayerIndicator[index]._wp;
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 0, 220, 80);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 5, 215, 25);
    ctx.fillRect(30, 35, 115, 40);
    ctx.fillRect(150, 35, 95, 40);
    ctx.fillStyle = '#000000';
    if(wp == 0) ctx.fillText("PISTAL", 90, 25);
    else if(wp == 1) ctx.fillText("SNIPER", 90, 25);
    else if(wp == 2) ctx.fillText("ASSAULT", 90, 25);
    else if(wp == 3) ctx.fillText("SUBMACHINE", 90, 25);
    else ctx.fillText("SHOTGUN", 90, 25);
    var load = gameinfo._allPlayerIndicator[index]._load[wp];
    var capa = gameinfo._allPlayerIndicator[index]._capa[wp];
    var ammo = gameinfo._allPlayerIndicator[index]._ammo[wp];
    ctx.fillText(load+"/"+capa, 90, 60);
    if(ammo < 0) {
        ctx.fillText("**", 170, 60);
    }else {
        ctx.fillText(ammo, 170, 60);
    }
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 20;
    ctx.arc(40, 40, 30, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = '#0000ff';
    ctx.fillText(gameinfo._allPlayerIndicator[screenShifter.index]._tm, 35, 46);
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.arc(40, 40, 30, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
    var degree = 0;
    var i = 0;
    while(i < 10) {
        var trace = degree - 30/180;
        if(degree == 0) trace = 330/180;
        ctx.beginPath();
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 15;
        ctx.arc(40, 40, 31, trace*Math.PI, degree*Math.PI);
        ctx.stroke();
        ctx.closePath();
        if(degree == 0) degree = 360/180;
        degree -= 36/180;
        i++;
    }
    var hp = gameinfo._allPlayerIndicator[index]._hp;
    var max = Math.floor(hp / 10);
    i = 0;
    degree = 0;
    while(i < max) {
        var trace = degree - 30/180;
        if(degree == 0) trace = 330/180;
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 15;
        ctx.arc(40, 40, 31, trace*Math.PI, degree*Math.PI);
        ctx.stroke();
        ctx.closePath();
        if(degree == 0) degree = 360/180;
        degree -= 36/180;
        i++;
    }
    var rem = hp % 10;
    if(rem > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 15;
        var trace = degree - (30 - 3*rem)/180;
        ctx.arc(40, 40, 31, trace*Math.PI, degree*Math.PI);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.fillRect(350,5,150,20);
    ctx.fillRect(350,30,150,20);
    var aScore = 148*gameinfo._teamA/gameinfo._maxScore;
    var bScore = 148*gameinfo._teamB/gameinfo._maxScore;
    if(gameinfo._allPlayerIndicator[screenShifter.index]._tm == 0) {
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(351, 6, aScore, 18);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(351, 31, bScore, 18);
        ctx.fillStyle = '#000000';
        ctx.fillText('Team A', 270, 20);
        ctx.fillText('Team B', 270, 45);
        ctx.fillText(gameinfo._teamA, 355, 20);
        ctx.fillText(gameinfo._teamB, 355, 45);
    }else {
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(351, 6, bScore, 18);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(351, 31, aScore, 18);
        ctx.fillStyle = '#000000';
        ctx.fillText('Team B', 270, 20);
        ctx.fillText('Team A', 270, 45);
        ctx.fillText(gameinfo._teamB, 355, 20);
        ctx.fillText(gameinfo._teamA, 355, 45);
    }
    ctx.closePath();
    drawMiniMap();
}

/* Draw firing effects.
 */
function drawFire(index) {
    var date = new Date();
    if(((date.getTime() - gameinfo._allPlayerIndicator[index]._ready) <= 80) && (gameinfo._allPlayerIndicator[index]._load[gameinfo._allPlayerIndicator[index]._wp] >= 0)) {
        var shape = gameinfo._allShapesPlayers[index];
        var x = shape._x + shape._width/2 + screenShifter.x;
        var y = shape._y + shape._height/2 + screenShifter.y;
        var radian = gameinfo._allPlayerIndicator[index]._rd;
        var wep = gameinfo._allPlayerIndicator[index]._wp;
        var size = 30;
        if(wep == 1 || wep == 2 || wep == 4) {
            size = 55;
        }else if(wep == 3) {
            size = 45;
        }
        ctx = myArea.context;
        ctx.beginPath();
        ctx.fillStyle = '#ffd700';
        ctx.arc(x + size*Math.cos(radian), y + size*Math.sin(radian), 7, 0, 2*Math.PI);
        ctx.arc(x + size*Math.cos(radian) - 5*Math.cos(radian + Math.PI/2), y + size*Math.sin(radian) - 5*Math.sin(radian + Math.PI/2), 3, 0, 2*Math.PI);
        ctx.arc(x + size*Math.cos(radian) + 5*Math.cos(radian + Math.PI/2), y + size*Math.sin(radian) + 5*Math.sin(radian + Math.PI/2), 3, 0, 2*Math.PI);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.arc(x + size*Math.cos(radian), y + size*Math.sin(radian), 20, 0, 2*Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.closePath();
    }
}

/* Draw game over screen. Contains team winner and all player personal score.
 * Contain exit button to send user to host page.
 */
function drawGameOver() {
    ctx = myArea.context;
    var x = 10;
    var y = 10;
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.fillRect(95, 95, 610, 410);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(100, 100, 600, 400);
    ctx.fillStyle = '#000000';
    ctx.fillText("Game End!", 330, 160);
    ctx.fillText("Winner is: ", 300, 180);
    var str = "Team ";
    if(gameinfo._teamA == gameinfo._maxScore) str += "A";
    else str += "B";
    var tmp = gameinfo._allPlayerIndicator[screenShifter.index]._tm;
    if(tmp == 0 && gameinfo._teamA == gameinfo._maxScore || tmp == 1 && gameinfo._teamB == gameinfo._maxScore) {
        ctx.fillStyle = '#0000ff';
    }else {
        ctx.fillStyle = '#ff0000';
    }
    ctx.fillText(str, 400, 180);
    ctx.fillStyle = '#000000';
    var l = 0;
    var r = 0;
    if(tmp == 0) {
        ctx.fillText("Team A", 150, 220);
        ctx.fillText("Team B", 450, 220);
    }else {
        ctx.fillText("Team B", 150, 220);
        ctx.fillText("Team A", 450, 220);
    }
    for(var i = 0; i < gameinfo._players.length; i++) {
        var str = gameinfo._players[i]._name;
        if(gameinfo._allPlayerIndicator[screenShifter.index]._tm == gameinfo._allPlayerIndicator[i]._tm) {
            if(str.length > 10) ctx.fillText(str.substring(0, 10), 150, 240 + 20*l);
            else ctx.fillText(gameinfo._players[i]._name, 150, 240 + 20*l);
            ctx.fillText(": " + gameinfo._allPlayerIndicator[i]._score, 300, 240 + 20*l);
            l++;
        }else {
            if(str.length > 10) ctx.fillText(str.substring(0, 10), 450, 240 + 20*r);
            else ctx.fillText(str, 450, 240 + 20*r);
            ctx.fillText(": " + gameinfo._allPlayerIndicator[i]._score, 600, 240 + 20*r);
            r++;
        }
    }
    ctx.fillRect(319, 409, 152, 62);
    if(320 + x < myArea.x && myArea.x < 470 + x && 410 + y < myArea.y && myArea.y < 470 + y){ ctx.fillStyle = '#808080'; }
    else{ ctx.fillStyle = '#a9a9a9'; }
    ctx.fillRect(320, 410, 150, 60);
    ctx.fillStyle = '#000000';
    ctx.fillText("Exit", 380, 450);
    ctx.closePath();
}

/* Draw mini map on the upper right of canvas. Black dot for user, Green-Blue for allies,
 * Red for enemies. Red appears only if ememy fires weapon.
 */
function drawMiniMap() {
    ctx = myArea.context;
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.fillRect(595, 0, 210, 155);
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(600, 0, 200, 150);
    var shape = gameinfo._allShapes;
    ctx.fillStyle = '#808080';
    for(var i = 0; i < shape.length; i++) {
        if(shape[i]._type == 'Tunnel') ctx.fillRect(600 + (shape[i]._x/32), (shape[i]._y/32), (shape[i]._width/32), (shape[i]._height/32));
    }
    ctx.fillStyle = '#b5651d';
    for(var i = 0; i < shape.length; i++) {
        if(shape[i]._type == 'room') ctx.fillRect(600 + (shape[i]._x/32), (shape[i]._y/32), (shape[i]._width/32), (shape[i]._height/32));
    }
    ctx.closePath();
    
    shape = gameinfo._allShapesPlayers;
    var team = gameinfo._allPlayerIndicator[screenShifter.index]._tm;
    var date = new Date();
    for(var i = 0; i < gameinfo._players.length; i++) {
        if(i == screenShifter.index) {
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.arc(600 + (shape[i]._x + shape[i]._width/2)/32, (shape[i]._y + shape[i]._height/2)/32, 5, 0, 2*Math.PI);
            ctx.fill();
            ctx.closePath();
        }else if(gameinfo._allPlayerIndicator[i]._tm == team) {
            ctx.beginPath();
            ctx.fillStyle = '#0d98ba';
            ctx.arc(600 + (shape[i]._x + shape[i]._width/2)/32, (shape[i]._y + shape[i]._height/2)/32, 5, 0, 2*Math.PI);
            ctx.fill();
            ctx.closePath();
        }else if((date - gameinfo._allPlayerIndicator[i]._ready) < 500) {
            ctx.beginPath();
            ctx.fillStyle = '#ff0000';
            ctx.arc(600 + (shape[i]._x + shape[i]._width/2)/32, (shape[i]._y + shape[i]._height/2)/32, 5, 0, 2*Math.PI);
            ctx.fill();
            ctx.closePath();
        }
    }
}

//Socket connection.
var socket = io();
//Store data from server.
var playerinfo;

//Store host channels from server and current user host channel if selected.
var hostinfo;
var hostlist = [];
var host_index = -1;

//Store selected game channel and information.
var gameinfo;
var game_index = -1;

//socket.on to receive personal data from server.
socket.on('players', function(data){
    for(var i=0; i< data.length; i++){
        if(data[i]._id == socket.id){
            playerInfo = data[i];
        }
    }
});

//socket.on to receive host channels from server.
socket.on('host list', function(data) {
    hostlist = data;
    host_index = -1;
    for(var i=0; i < data.length; i++) {
        for(var k = 0; k < data[i]._players.length; k++){
            if(data[i]._players[k]._id == socket.id){
                hostinfo = data[i];
                host_index = i;  
            }
        }
    }
});

//socket.on to receive selected game channel information from server.
socket.on('game list', function(data) {
    game_index = -1;
    for(var i = 0; i < data.length; i++) {
        for(var k = 0; k < data[i]._players.length; k++) {
            if(data[i]._players[k]._id == socket.id) {
                gameinfo = data[i];
                game_index = i;
                for(var j = 0; j < gameinfo._players.length; j++) {
                    if(gameinfo._players[j]._id == socket.id) {
                        screenShifter.index = j;
                    }
                }
                screenShifter.x = Math.floor(myArea.canvas.width/2) - gameinfo._allShapesPlayers[screenShifter.index]._x;
                screenShifter.y = Math.floor(myArea.canvas.height/2) - gameinfo._allShapesPlayers[screenShifter.index]._y;
            }
        }
    }
});