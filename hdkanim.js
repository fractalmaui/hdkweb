// Test anim…
//  Try this to include this animation in the main game script:
//   https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// CSS Animations?
//  https://davidwalsh.name/css-animation-callback
//  http://www.javascriptkit.com/javatutors/requestanimationframe.shtml
var canvas = document.querySelector("canvas");
var c = canvas.getContext("2d")

//—-(main)————————————————————————
EasingFunctions = {
  // no easing, no acceleration
  linear: function (t) { return t },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t*t },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t) },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  // accelerating from zero velocity 
  easeInCubic: function (t) { return t*t*t },
  // decelerating to zero velocity 
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  // acceleration until halfway, then deceleration 
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  // accelerating from zero velocity 
  easeInQuart: function (t) { return t*t*t*t },
  // decelerating to zero velocity 
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  // acceleration until halfway, then deceleration 
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
}

//——HDKAnim——————————————————————————
 var HDKAnim = new function() {
        this.width  = 512;
        this.height = 512;
        this.xorigin = 0;
        this.yorigin = 0;
	this.animFrames = 30;
	this.animDir = 1.0;
	this.size       = gameSize; //Passed in from HTML!
	this.totalSize  = this.size*this.size;
	this.tileWid    = this.width  / this.size;
	this.animStep   = 1.0/this.animFrames; 
        //this.indices    = [];
	//Animation colors and animated rects
	this.colors = [];
        this.corners = [];
	this.xs = [];
	this.ys = [];
	this.xw = [];
	this.yw = [];
	this.txs = [];
	this.tys = [];
	this.txw = [];
	this.tyw = [];
        this.keyframes = [];
        this.keyframe = 0;
        this.substep  = 0.0;
        this.animating = false;
        this.animDone = false;
	this.name = "HDKAnim";
	this.animFunc = EasingFunctions.easeInOutQuad;

   //——HDKAnim——————————————————
     this.getInfo = function () {
        return this.name + " " + this.type + " animation";
    };



 
   //——HDKAnim——————————————————
   this.addKeyframe = function(kf)
    {
       this.keyframes.push(kf);
    };

   //——HDKAnim——————————————————
     this.clear = function()
    {
        this.keyframes = [];
	this.animating = false;
        this.animDone = false;
        //Clear our before/after anim arrays…
 	this.xs = [];
 	this.ys = [];
 	this.xw = [];
 	this.yw = [];
 	this.txs = [];
 	this.tys = [];
 	this.txw = [];
 	this.tyw = [];
	 

    } //end clear

   //——HDKAnim——————————————————
     this.buildPuzzle = function()
    {
    var x,y;
    // Create corners early, ABCD clockwise
    this.corners.push(0); //Top L
    this.corners.push(this.size-1); //Top R
    this.corners.push(this.totalSize-1); //Bottom R
    this.corners.push(this.totalSize-this.size); //Bottom L
    for (var i=0;i<this.totalSize;i++)  //add size x size tile objects…
     {  
      x = i % this.size;
      y = Math.floor(i/this.size);   
      this.xs.push(this.tileWid*x);
      this.ys.push(this.tileWid*y);
      this.xw.push(this.tileWid);
      this.yw.push(this.tileWid);
      this.colors.push( gameColors[i]); //Passed in from HTML!
     }
    } //end buildPuzzle

   //——HDKAnim——————————————————
    this.buildShuffle = function(indices)
    {
       if (indices.length != this.totalSize) return; //Bogus indices!
       for (var i=0;i<this.totalSize;i++)  //loop over indices. . .
	{
         var ii = indices[i];
 	 this.txs[ii] = this.xs[i];
 	 this.tys[ii] = this.ys[i];
 	 this.txw[ii] = this.xw[i];
 	 this.tyw[ii] = this.yw[i];
	}
    } //end buildShuffle

   //——HDKAnim——————————————————
   // makes smoothed animation shapes
    this.buildSmoosh = function()
    {
       for (var i=0;i<this.totalSize;i++)
	{
	//create arrays first, fixed size
	this.txs.push(0);
	this.tys.push(0);
	this.txw.push(0);
	this.tyw.push(0);
	}
        var cw2 = this.width/2;
        this.txs[this.corners[1]] = cw2;  //TR outer corners anim to 
        this.txs[this.corners[2]] = cw2;  //BR   fill 2x2 in canvas
        this.tys[this.corners[2]] = cw2;  //BR rest of tiles all vanish
        this.tys[this.corners[3]] = cw2;  //BL
	for (var i=0;i<4;i++) //Hit all 4 corners, all 1/4 canvas size
	{
  	 this.txw[this.corners[i]] = cw2;
  	 this.tyw[this.corners[i]] = cw2;
	}


	var ptr = 0;
        for (var i=1;i<this.size-1;i++) //Loop over inner rows
	{	
        	for (var j=1;j<this.size-1;j++) //inner cols
		{	
                  ptr = this.size * i + j;
		  //Shrink these tiles to zero in center . . .
		  this.txs[ptr] = cw2;
		  this.tys[ptr] = cw2;
		}
	}
        //Do top and bottom rows.. they fold down to tall skinny zero shapes
	for (var i=1;i<this.size-1;i++) 
	{
           this.txs[i] = cw2; //Top: center x  
           this.tyw[i] = cw2; // half canvas height
           this.txs[this.corners[3]+i] = cw2; //Bottom: center x
           this.tys[this.corners[3]+i] = cw2; //   center y  
           this.tyw[this.corners[3]+i] = cw2; // half canvas height
	}

        //Do L/R cols.. they fold down to short fat zero shapes
	for (var i=1;i<this.size-1;i++) 
	{
           var ptr = this.size * i;
           this.tys[ptr] = cw2; //LH: center y  
           this.txw[ptr] = cw2; // half canvas width
           this.txs[ptr + this.size-1] = cw2; //RH: center x  
           this.tys[ptr + this.size-1] = cw2; //    center y  
           this.txw[ptr + this.size-1] = cw2; // half canvas width
	}
    } //end buildSmoosh

    //——HDKAnim——————————————————
    this.draw = function()
    {
  	c.fillStyle = "black";
        var xo = this.xorigin;
        var yo = this.yorigin;

	c.fillRect(xo, yo, this.width, this.height);
        var animKF = this.animFunc(this.substep);
      	for (var i=0;i<this.totalSize;i++)  //hit all tiles
	{
	  //Get interpolation steps for XY coords and XY sizes
	   var xd  = (this.txs[i] - this.xs[i]);
	   var yd  = (this.tys[i] - this.ys[i]);
	   var xwd = (this.txw[i] - this.xw[i]);
	   var ywd = (this.tyw[i] - this.yw[i]);
	   var x = this.xs[i] + (animKF*xd);
	   var y = this.ys[i] + (animKF*yd);
	   var w = this.xw[i] + (animKF*xwd);
	   var h = this.yw[i] + (animKF*ywd);
      	   c.fillStyle = this.colors[i];
      	   c.fillRect(xo+x,yo+y,w,h);
	}


    } //end draw

    //——HDKAnim——————————————————
    this.updateAnimations = function()
    {
      //console.log("dun " + this.animDone);
      if (this.keyframes.length < 2) this.animDone = true;
      if (this.animDone) return;
      var newkf = false;
      if (!this.animating) //starting?
	{
         this.keyframe = -1;
         newkf = this.animating = true;
	}
      else 
	{
         if (this.animStep > 0 && this.substep>=this.keyframes[this.keyframe+1]) newkf = true;
         else if (this.animStep < 0 && this.substep<=this.keyframes[this.keyframe+1]) newkf = true;
         else this.substep += this.animStep;
	} //end else

      if (newkf)
	  {
            this.keyframe+=1;
	    if (this.keyframes[this.keyframe+1] == -1) this.animDone = true;
	    else 
		{
		   this.substep  = this.keyframes[this.keyframe];
		   this.animStep = (this.keyframes[this.keyframe+1]-this.substep)/this.animFrames; 
		}
	  }
      if (!this.animDone) this.draw();
    } //end updateAnimations



}; //end HDKAnim Obj


