var game = {
	c: null,
	ce: null,
	player: {x:0,y:0},
	fps:{
		target: 70,
		dtime: 0,
		rtime: 0,
		last_tick: 0
	},
	r_id: 0,
	mouse: {x:0,y:0},
	map: {seed: 35536,render:[],chunks:[]}
};

var CHUNK_SIZE = 300;

game.init = function(){
	// Get canvas
	this.ce = document.getElementById("canvas");
	this.c = this.ce.getContext("2d");

	// Reset canvas dimensions
	this.ce.width = $(window).width();
	this.ce.height = $(window).height();
};

game.start = function(){
	// Binding
	window.onkeydown = function(e){
		if ( e.keyCode == 65 ) {
			game.player.x -= 5;
		}else if ( e.keyCode == 68 ) {
			game.player.x += 5;
		}else if ( e.keyCode == 87 ) {
			game.player.y -= 5;
		}else if ( e.keyCode == 83 ) {
			game.player.y += 5;
		}else{
			//alert(e.keyCode);
		}
	};
	game.ce.addEventListener('mousemove', function(e) {
		var rect = game.ce.getBoundingClientRect();
        game.mouse = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
	});
	game.ce.addEventListener('click', function(e){
		game.map.explode(game.mouse.x+game.player.x-(game.ce.width/2),game.mouse.y+game.player.y-(game.ce.height/2),10);
	}, false);
	game.fps.last_tick = new Date().getTime();

	setInterval(this.tick,1000/this.fps.target);
	setInterval(this.update_fps,200);
};

game.tick = function() {
	// Draw game
	game.drawALL();

	// Finish timing
	var end = new Date().getTime();
	game.fps.dtime = Math.round(end - game.fps.last_tick);
	game.fps.last_tick = end;
	//game.player.x += 50 * (game.fps.dtime/1000);
};

game.update_fps = function(){
	var res = "FPS: "+Math.round(1000/game.fps.dtime);
	$("#fps").html(res);

	res = "DEBUG";
	res += "<hr>DTime: "+game.fps.dtime;
	res += "<br>RTime: "+game.fps.rtime;
	res += "<hr>Chunks: "+game.map.chunks.length;
	res += "<br>Rendered: "+game.map.render.length;
	res += "<br>OnScreen: "+game.fps.terrains;
	res +="<hr>Load Time: "+game.fps.load;
	$("#chunks").html(res);

	res = "PLAYER<hr>X: "+Math.round(game.player.x);
	res += "<br>Y: "+Math.round(game.player.y);
	$("#plr").html(res);
};

game.drawALL = function(){
	var start = new Date().getTime();

	// Reset canvas dimensions
	//if (this.ce.width != $(window).width() || this.ce.height != $(window).height()){
		this.ce.width = $(window).width();
		this.ce.height = $(window).height();
	//}


	// Run draw passes
	this.drawBG();
	this.drawTerrain();
	//this.drawDynPix();
	
	// Draw Center
	this.c.beginPath();
	this.c.moveTo((this.ce.width/2)-9.5,this.ce.height/2);
	this.c.lineTo((this.ce.width/2)+10.5,this.ce.height/2);
	this.c.strokeStyle = "black";
	this.c.stroke();
	this.c.beginPath();
	this.c.moveTo(this.ce.width/2+0.5,this.ce.height/2-9.5);
	this.c.lineTo(this.ce.width/2+0.5,this.ce.height/2+10.5);
	this.c.strokeStyle = "black";
	this.c.stroke();
	
	var v = game.map.getStaticNormal(game.mouse.x+0.5+this.player.x-(this.ce.width/2),game.mouse.y+this.player.y-(this.ce.height/2));
	// Draw Mouse
	this.c.beginPath();
	this.c.moveTo(game.mouse.x-9,game.mouse.y-.5);
	this.c.lineTo(game.mouse.x+10,game.mouse.y-.5);
	this.c.moveTo(game.mouse.x+0.5,game.mouse.y-9);
	this.c.lineTo(game.mouse.x+0.5,game.mouse.y+10);
	if (v){
		this.c.strokeStyle = "blue";
	}else{
		this.c.strokeStyle = "black";
	}		
	this.c.stroke();
	
	if (v){
		this.c.beginPath();	
		this.c.moveTo(game.mouse.x,game.mouse.y);
		this.c.lineTo(v.x-this.player.x+(this.ce.width/2),v.y-this.player.y+(this.ce.height/2));
		this.c.strokeStyle = "red";
		this.c.stroke();	
		this.c.fillStyle = "black";
		this.c.fillText("("+v.x+","+v.y+")",game.mouse.x+10,game.mouse.y-20);
	}

	var end = new Date().getTime();
	game.fps.rtime = Math.round(end - start);
};

// Draw background and sky
game.drawBG = function(){
	var skygrad=this.c.createLinearGradient(0,(this.ce.height/4)-this.player.y,0,(this.ce.height/2)-this.player.y);
	skygrad.addColorStop(0,"#87CEEB");
	skygrad.addColorStop(1,"#E6F8FF");
	this.c.fillStyle=skygrad;
	this.c.fillRect(0,0,this.ce.width,this.ce.height);
};

// Draw static terrain
game.drawTerrain = function(){
	var count = 0;
	for (var i=0;i<this.map.render.length;i++){
		var img = this.map.render[i];
		count += 1;
		this.c.drawImage(img.img_ce,(img.x*CHUNK_SIZE)-this.player.x+(this.ce.width/2),(img.y*CHUNK_SIZE)-this.player.y+(this.ce.height/2));
	}
	game.fps.terrains = count;
	for (var i=0;i<this.map.render.length;i++){
		var c = this.map.render[i].chunk;
		if (c.rend_needed == true){
			this.map.renderChunk(c);
			c.rend_needed = false;
			return;
		}					
	}	
};

// Draw dynamic particles
game.drawDynPix = function(){
	for (var x = 0; x < this.pix.length; x++) {
		this.c.beginPath();
		for (var i = 0; i < this.pix[x].map.length; i++) {
			var pix = this.pix[x].map[i];

			this.c.moveTo(pix.x-this.offset+0.5, pix.y+0.5);
			this.c.lineTo(pix.x-this.offset+1.5, pix.y+1.5);
		}
		this.c.strokeStyle=this.pix[x].color;
		this.c.stroke();
	}
};

game.map.setStatic = function(x,y,data,nogen){
	var c = this.getChunkFromPix(x,y);
	
	if(!c){
		if (nogen==true){
			
			return null;
		}
		c = this.generateChunk(Math.floor(x/CHUNK_SIZE),Math.floor(y/CHUNK_SIZE));
	}

	c.map[x+y*CHUNK_SIZE] = data;
	c.rend_needed = true;
	return c;
};

game.map.getStatic = function(x,y){
	var c = this.getChunkFromPix(x,y);
	
	if(!c){
		return null;
	}

	return c.map[x+y*CHUNK_SIZE];	
};

game.map.explode = function(ix,iy,radius){
	ix = Math.round(ix);
	iy = Math.round(iy);
	console.log("Explode at ("+ix+","+iy+")")
	for (var x = -radius;x<radius;x++){
		for (var y = -radius;y<radius;y++){
			game.map.setStatic(x+ix,y+iy,null,false);			
		}
	}	
}

game.map.getStaticNormal = function(ix,iy) {
	var avg=null;
	for (var x = -3;x<3;x++){ // 3 is an arbitrary number
		for (var y = -3;y<3;y++){  // user larger numbers for smoother surfaces
			if (this.getStatic(ix+x,iy+y)){
				if (!avg){
					avg = {x:ix+x,y:iy+y};
				}else{
					avg = {x:avg.x+x+ix,y:avg.y+y+iy};
				}
			}
		}
	}
	if (!avg){
		return null;
	}
	
	var length = Math.sqrt(avg.x * avg.x + avg.y * avg.y); // distance from avg to the center
	return {x:avg.x/length,y:avg.y/length}; // normalize the vector by dividing by that distance
};

game.map.getChunkFromPix = function(x,y){
	for (var i=0;i<this.chunks.length;i++){
		var c = this.chunks[i];
		if ((c.x*CHUNK_SIZE  + CHUNK_SIZE) > x && x > (c.x*CHUNK_SIZE)){
			if ((c.y*CHUNK_SIZE  + CHUNK_SIZE) > y && y > (c.y*CHUNK_SIZE)){
				return c;
			}
		}
	}
	return null;
};

game.map.deleteRender = function(x,y){
	for (var i=0;i<this.render.length;i++){
		var c = this.render[i];
		if (c.x==x && c.y==y){
			this.render.splice(i,1);
			return;
		}
	}
	return null;
};

game.map.renderChunk = function(chunk){
	game.map.deleteRender(chunk.x,chunk.y);
	var img = game.c.createImageData(CHUNK_SIZE,CHUNK_SIZE);
	for (var i=0;i<chunk.map.length;i++){
		var p = chunk.map[i];
		
		if (p){
			img.data[i*4] = p.color.r;
			img.data[i*4+1] = p.color.g;
			img.data[i*4+2] = p.color.b;
			img.data[i*4+3] = 255;
		}else{
			img.data[i*4] = 0;
			img.data[i*4+1] = 0;
			img.data[i*4+2] = 0;
			img.data[i*4+3] = 0;
		}
	}
	game.r_id += 1;
	$('#rendered').append("<canvas id=\"render_"+game.r_id+"\" style=\"display:none;\" width=\""+CHUNK_SIZE+"\" height=\""+CHUNK_SIZE+"\"></canvas>");
	img_ce = document.getElementById("render_"+game.r_id);
	var can = img_ce.getContext("2d");
	can.putImageData(img,0,0);
	this.render.push({x:chunk.x,y:chunk.y,img:img,img_ce:img_ce,chunk:chunk});
};

game.map.generateChunk = function(ix,iy){
	noise.seed(this.seed);
	var c = {x:ix,y:iy,map:[],rend_needed:false};
	for (var x=0;x<CHUNK_SIZE;x++){
		var h = 60 * noise.simplex2((ix*CHUNK_SIZE+x)/400,2) + 200 * noise.simplex2((ix*CHUNK_SIZE+x)/800,10);
		var grass = 5+(Math.random())*10;
		var shade = (Math.random()-0.5)*50;
		var gcol = {r:117+shade,g:179+shade,b:18+shade};
		var stone = h + 100 + 20*noise.simplex2((ix*CHUNK_SIZE+x)/500,5);
		for (var y=0;y<CHUNK_SIZE;y++){
			var real = {x:(ix*CHUNK_SIZE)+x,y:(iy*CHUNK_SIZE)+y};			
			//console.log(real.y);
			if (real.y > stone){
				var coal_seed = noise.simplex2(real.x/500,real.y/500);
				if (coal_seed<0.75){
					c.map[x+y*CHUNK_SIZE] = {type:"stone",color:{r:43,g:43,b:43}};
				}else{
					var mag = (coal_seed - 0.75) * 4;
					c.map[x+y*CHUNK_SIZE] = {type:"coal",color:{r:43-30*mag,g:43-30*mag,b:43-30*mag},amt: mag};
				}
			}else if (real.y > h){
				c.map[x+y*CHUNK_SIZE] = {type:"dirt",color:{r:66,g:42,b:26}};
			}else if (real.y > h-grass){
				c.map[x+y*CHUNK_SIZE] = {type:"grass",color:gcol};
			}else{
				c.map[x+y*CHUNK_SIZE] = null;
			}
		}
	}

	this.chunks.push(c);
	return c
};

game.init();
game.map.seed = 35536;
var start = new Date().getTime();
for (var x=-3;x<3;x++){
	for (var y=-2;y<2;y++){
		game.map.renderChunk(game.map.generateChunk(x,y));
	}
}
var end = new Date().getTime();
game.fps.load = Math.round(end - start);
game.start();

