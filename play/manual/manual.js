var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var TILE_SIZE = 55;
var PEEP_SIZE = 50;
var DIAGONAL_SQUARED = (TILE_SIZE+5)*(TILE_SIZE+5) + (TILE_SIZE+5)*(TILE_SIZE+5);

var assetsLeft = 0;
var onImageLoaded = function(){
	assetsLeft--;
};

var images = {};
function addAsset(name,src){
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onImageLoaded;
	images[name].src = src;
}
addAsset("yayTriangle","../img/yay_triangle.png");
addAsset("yayTriangleBlink","../img/yay_triangle_blink.png");
addAsset("mehTriangle","../img/meh_triangle.png");
addAsset("sadTriangle","../img/sad_triangle.png");
addAsset("yaySquare","../img/yay_square.png");
addAsset("yaySquareBlink","../img/yay_square_blink.png");
addAsset("mehSquare","../img/meh_square.png");
addAsset("sadSquare","../img/sad_square.png");

function Draggable(x,y){
	
	var self = this;
	self.x = x;
	self.y = y;
	self.gotoX = x;
	self.gotoY = y;

	var offsetX, offsetY;
	var pickupX, pickupY;
	self.pickup = function(){

		pickupX = (Math.floor(self.x/TILE_SIZE)+0.5)*TILE_SIZE;
		pickupY = (Math.floor(self.y/TILE_SIZE)+0.5)*TILE_SIZE;
		offsetX = Mouse.x-self.x;
		offsetY = Mouse.y-self.y;
		self.dragged = true;

		// Draw on top
		var index = draggables.indexOf(self);
		draggables.splice(index,1);
		draggables.push(self);

	};

	self.drop = function(){

		var potentialX = (Math.floor(Mouse.x/TILE_SIZE)+0.5)*TILE_SIZE;
		var potentialY = (Math.floor(Mouse.y/TILE_SIZE)+0.5)*TILE_SIZE;

		var spotTaken = false;
		for(var i=0;i<draggables.length;i++){
			var d = draggables[i];
			if(d==self) continue;
			var dx = d.x-potentialX;
			var dy = d.y-potentialY;
			if(dx*dx+dy*dy<10){
				spotTaken=true;
				break;
			}
		}

		if(spotTaken){
			self.gotoX = pickupX;
			self.gotoY = pickupY;
		}else{
			self.gotoX = potentialX;
			self.gotoY = potentialY;
		}

		self.dragged = false;

	}

	var lastPressed = false;
	self.update = function(){

		// Shakiness?
		self.shaking = false;
		self.bored = false;
		if(!self.dragged){
			var neighbours = 0;
			var same = 0;
			for(var i=0;i<draggables.length;i++){
				var d = draggables[i];
				if(d==self) continue;
				var dx = d.x-self.x;
				var dy = d.y-self.y;
				if(dx*dx+dy*dy<DIAGONAL_SQUARED){
					neighbours++;
					if(d.color==self.color){
						same++;
					}
				}
			}
			if(neighbours>0 && (same/neighbours)<0.33){
				self.shaking = true;
			}
			if(neighbours==0 || (same/neighbours)>0.99){
				self.bored = true;
			}
		}

		// Dragging
		if(!self.dragged){
			if(self.shaking && Mouse.pressed && !lastPressed){
				var dx = Mouse.x-self.x;
				var dy = Mouse.y-self.y;
				if(Math.abs(dx)<PEEP_SIZE/2 && Math.abs(dy)<PEEP_SIZE/2){
					self.pickup();
				}
			}
		}else{
			self.gotoX = Mouse.x - offsetX;
			self.gotoY = Mouse.y - offsetY;
			if(!Mouse.pressed){
				self.drop();
			}
		}
		lastPressed = Mouse.pressed;

		// Going to where you should
		self.x = self.x*0.5 + self.gotoX*0.5;
		self.y = self.y*0.5 + self.gotoY*0.5;

	};

	self.frame = 0;
	self.blinking=0;
	self.draw = function(){
		ctx.save();
		ctx.translate(self.x,self.y);
		if(self.shaking){
			self.frame+=0.07;
			ctx.translate(0,20);
			ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
			ctx.translate(0,-20);
		}

		// Blinking
		if(Math.random()<0.01){
			self.blinking=10;
		}

		// Draw thing
		var img;
		if(self.color=="triangle"){
			if(self.shaking){
				img = images.sadTriangle;
			}else if(self.bored){
				img = images.mehTriangle;
			}else{
				if(self.blinking>0){
					self.blinking--;
					img = images.yayTriangleBlink;
				}else{
					img = images.yayTriangle;
				}
			}
		}else{
			if(self.shaking){
				img = images.sadSquare;
			}else if(self.bored){
				img = images.mehSquare;
			}else{
				if(self.blinking>0){
					self.blinking--;
					img = images.yaySquareBlink;
				}else{
					img = images.yaySquare;
				}
			}
		}
		ctx.drawImage(img,-PEEP_SIZE/2,-PEEP_SIZE/2,PEEP_SIZE,PEEP_SIZE);
		ctx.restore();
	};

}

var draggables;
function reset(){
	draggables = [];
	for(var x=0;x<10;x++){
		for(var y=0;y<10;y++){
			if(Math.random()<0.85){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = (Math.random()<0.5) ? "triangle" : "square";
				draggables.push(draggable);
			}
		}
	}
}
reset();

function render(){
	if(assetsLeft>0) return;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	for(var i=0;i<draggables.length;i++){
		draggables[i].update();
	}
	for(var i=0;i<draggables.length;i++){
		draggables[i].draw();
	}
}

////////////////////
// ANIMATION LOOP //
////////////////////
window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };
(function animloop(){
	requestAnimFrame(animloop);
	if(window.IS_IN_SIGHT){
		render();
	}
})();
