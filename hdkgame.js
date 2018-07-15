// Watch out for bad quotes. Simple quotes work, kb generated DO NOT
// HTML5 Canvas Tutorial for Beginners : https://www.youtube.com/watch?v=EO6OkltgudE 
// Canvas animation : https://www.youtube.com/watch?v=yq2au9EfeRQ 
// https://www.phpied.com/3-ways-to-define-a-javascript-class/ 
// https://jscompress.com/  Javascript compression. Use this before deployment
//
// July 11: Add glints and AB1...BA4 puzzle testing from HDK
// July 13: Add crossglints (row/col now OK)
// July 14: Integrate with HDKAnim.js, add SFX         
// For puzzle draw AFTER shuffle:
//  https://stackoverflow.com/questions/43183026/what-is-the-simplest-way-of-chaining-together-animations-using-promises


var canvas = document.querySelector("canvas");
var oldX = -999; //Mouse Move tracking…
var oldY = -999;
var selectXOff = 0;
var selectYOff = 0;
var mousePressed  = false;
var puzzlePixelSize = 360;  //Overall puzzle XY size
var headerSize = 120;  //Top of puzzle header
var startTime, endTime;
var logoImage = new Image();
var karate44kSound = new Audio("samples/karate44k.wav");  
var snap44kSound   = new Audio("samples/snap44k.wav");  
var bigweinerSound = new Audio("samples/bigweiner.wav");  

var SOLUTION_AB1 = 1
var SOLUTION_AB2 = 2
var SOLUTION_AB3 = 3
var SOLUTION_AB4 = 4
var SOLUTION_BA1 = 5
var SOLUTION_BA2 = 6
var SOLUTION_BA3 = 7
var SOLUTION_BA4 = 8

logoImage.src = "images/hdklogocolors.png";
// Crude image init handler: 
logoImage.onload = (function(img) {
   drawLabels();
});

var glints = [];
var cglints = [];

canvas.width  = puzzlePixelSize;
canvas.height = puzzlePixelSize + headerSize;

var c = canvas.getContext("2d")

canvas.addEventListener("mousedown", mouseDown);
canvas.addEventListener("mousemove", mouseMove);
canvas.addEventListener("mouseup", mouseUp);
canvas.addEventListener("mouseleave", mouseLeave);


//—-(TileObj)————————————————————————
function Tile (index,color,w,h) {
    this.index = index;
    this.color = color;
    this.ok    = false;
    this.wasok = false;
    this.w     = w;
    this.h     = h;
    this.x = this.y = 0;
    this.isCorner = -1;
    this.gframe   = -1;
    this.cgframe  = -1;
    this.donutImage = new Image();
    this.donutImage.src = "images/donuts01.png";
    this.cornerImage = new Image();

    //——TileObj——————————————————
    // Draw a tile at its static position
    this.draw = function() 
    {
      this.drawXY(this.x,this.y);
      return;
    }

    //——TileObj——————————————————
    // Draws a tile anywhere, static or during a move
    this.drawXY = function(x,y)
    {
      c.fillStyle = this.color;
      c.fillRect(x,y,this.w,this.h);
      if (!this.ok)
       {
        if (game.difficulty == 1) //Easy Mode? Draw donuts / corners
         {
            if (this.isCorner == -1)
               c.drawImage(this.donutImage,x,y,this.w,this.h);
            else
               c.drawImage(this.cornerImage,x,y,this.w,this.h);
         }
       } //end ok
       else if (!this.wasok) //Tile just became OK? Glint!
       {
          this.gframe = 0;
       }
       if (this.gframe > -1)
       {
           c.drawImage(glints[this.gframe],x,y,this.w,this.h);
       }
       if (this.cgframe > -1)
       {
           c.drawImage(cglints[this.cgframe],x,y,this.w,this.h);
       }
      //Add tile numbers if needed
      //c.fillStyle = "#000000";
      //c.fillText(this.index, x+20, y+20); 

      this.wasok = this.ok;
    }

    //——TileObj——————————————————
    this.setCorner = function(whichCorner)
    {
       this.isCorner = whichCorner;
       this.cornerImage.src = "images/corner" + whichCorner + ".png";
    }
 
    //——TileObj——————————————————
    this.setXY = function(x,y) 
    {
     this.x = x;
     this.y = y;
   }

    //——TileObj——————————————————
   this.stopAnimations = function()
   {
     this.gframe = -1;
   }

    //——TileObj——————————————————
   this.updateAnimations = function()
    {
      if (this.gframe >= 0)
       {
         this.draw();
         this.gframe++;
         if (this.gframe == glints.length) this.gframe = -1;
       }
      if (this.cgframe >= 0)
       {
         this.draw();
         this.cgframe++;
         if (this.cgframe == cglints.length) this.cgframe = -1;
       }
    }
}  //end Tile object



//——GameObj———————————————————————————————————————————————————
var game = new function() {
    this.size  	    = gameSize; //Declared in html file
    this.difficulty = gameDiff; //Declared in html file
    this.totalSize  = this.size*this.size;
    this.time       = 0;
    this.moves      = 0;
    this.started    = false;
    this.over       = false;
    this.selected   = -1;
    this.swap1      = -1;  //Which two tiles are getting swapped
    this.swap2      = -1;
    this.swapped1   = -1;  //Which two tiles are getting swapped
    this.swapped2   = -1;
    this.tileWid    = canvas.width  / this.size;
    this.tileHit    = this.tileWid;
    this.animStep   = this.tileWid / 10; //the 10 must match animframes in swap below
    this.animX      = 0;  //Animation X/Y directions during swap
    this.animY      = 0;
    this.swapX      = 0;  //Current anim position of swapping tile 
    this.swapY      = 0;
    this.animFrames = 0;
    this.indices    = [];
    this.solutionGuess = 0;
    this.solutions8 = [];
    for (var i=0;i<this.size*this.size;i++)  //add size x size tile objects…
	this.indices.push(i);
    this.tiles      = []; //Create new array of tiles…
    for (var i=0;i<this.size*this.size;i++)  //add size x size tile objects…
     {     //Colors are Declared in html file
      this.tiles.push(new Tile(i,gameColors[i],this.tileWid,this.tileHit));
     }

    //set tile corners…
    this.Aindex = 0;
    this.Bindex = this.size-1;
    this.Cindex = this.size*this.size-1;
    this.Dindex = this.size*(this.size-1);
    this.tiles[this.Aindex].setCorner(1); 
    this.tiles[this.Bindex].setCorner(2); 
    this.tiles[this.Cindex].setCorner(3); 
    this.tiles[this.Dindex].setCorner(4); 

    this.name = "Kihei Yellow";
    this.getInfo = function () {
        return this.name + " " + this.type + " apple";
    };



    //——GameObj——————————————————
    this.clear = function()
    {
      this.time  = 0;
      this.moves = 0;
      startTime = new Date();
    }


    //——GameObj——————————————————
    this.drawPuzzle = function() 
    {
	//No drop shadow in game 
        c.shadowBlur = 0;
        c.shadowOffsetX = 0;
        c.shadowOffsetY = 0;
  	c.fillStyle = "black";
	 c.fillRect(0, 0, canvas.width, canvas.height);
	 for (var i=0;i<this.size*this.size;i++)
	   {
	    if (i != this.selected && i != this.swap2)
	     {
              this.tiles[this.indices[i]].draw();
	     }
           }
          drawLabels();

     }; //end drawPuzzle

   //——GameObj——————————————————
    this.drawSelectTile = function()
    {
      if (this.selected < 0) return;
      c.shadowColor = "black";
      c.shadowBlur = 10;
      c.shadowOffsetX = 4;
      c.shadowOffsetY = 4;
      var i = this.selected;
      this.tiles[this.indices[i]].drawXY(selectXOff,selectYOff);
    };  //end drawSelectTile

    //——GameObj——————————————————
    this.drawSwapTile = function()
    {
      c.shadowBlur = 0;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      var i = this.swap2;
      this.tiles[this.indices[i]].drawXY(this.swapX,this.swapY);
    }; //end drawSwapTile

 
    //——GameObj——————————————————
    this.getRandomInt = function(max) 
     {
      return Math.floor(Math.random() * Math.floor(max));
     } //end getRandomInt

    //——GameObj——————————————————
    this.getTileNum = function(x,y)
    {
       var ypuzzle = y - headerSize;
       var xx = Math.floor(x / this.tileWid);
       var yy = Math.floor(ypuzzle / this.tileHit);
       return this.size * yy + xx;
    } //end getTileNum

    //——GameObj——————————————————
    this.getTileX = function(index)
    {
	return (index%this.size) * this.tileWid;
    };

    //——GameObj——————————————————
    this.getTileY = function(index)
    {
	return Math.floor(index/this.size) * this.tileHit + headerSize;
    };

    //——GameObj——————————————————
    this.setTiles = function()
    {
	for (var i=0;i<this.totalSize;i++)
	 {
           var ii = this.indices[i];
           this.tiles[ii].setXY(this.getTileX(i),this.getTileY(i));
	 }
    };

    //——GameObj——————————————————
   // row goes from 0..n,
   //   compares lastPositionIsOK vs cellPositionIsOK
   this.isRowNowOK = function(index)
   {
      var step = 1;
      var row = Math.floor(index / this.size);
      var offset = this.size*row;
      return this.isRowOrColNowOK(offset,step);
   } //end isRowNowOK

    //——GameObj——————————————————
   this.isColNowOK = function(index)
   {
      var offset = index % this.size;
      var step = this.size;
      return this.isRowOrColNowOK(offset,step);
   } //end isColNowOK

    //——GameObj——————————————————
   this.isRowOrColNowOK = function(offset,step)
   {
      var ptr = offset;
      var loop,wascount,iscount,toploop;
      toploop = this.size;
      wascount = iscount = 0;
      for (var loop=0;loop<toploop;loop++)
      {
        if (this.tiles[this.indices[ptr]].wasok) wascount++;
        if (this.tiles[this.indices[ptr]].ok)  iscount++;
        ptr+=step;
      }
    return ((wascount < toploop) && (iscount == toploop));
   } //end isRowOrColNowOK
 
 
//======(HDKGame)==========================================
// Assumes a SQUARE puzzle always!
this.initAllEightSolutions = function()
{
    var sptr,rptr,loop,loop1,pminus1,nminus1 = 0;

    if (this.size <= 0 || this.size > 6) return;   //Too big!
    //Init a size x size 2D array…
    pminus1 = this.size-1;
    nminus1 = this.totalSize-1;
    //AB1: Trivial, unrotated, unmirrored case.
    for (var loop=0;loop<this.totalSize;loop++) this.solutions8.push(loop);
    //AB2: Rotate AB1 90 degrees CCW
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = pminus1-loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(rptr);
            rptr+=this.size;
        }
    }
    //AB3: Rotate AB1 180 degrees CCW
    for (var loop=0;loop<this.totalSize;loop++) this.solutions8.push(nminus1-loop);
    //AB4: Rotate AB1 270 degrees CCW
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = this.totalSize-this.size+loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(rptr);
            rptr-=this.size;
        }
    }
    // ===second four, mirrored versions........
    //  BA1: AB1 mirrored horizontally
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = pminus1 + this.size*loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(rptr);
            rptr--;
        }
    }
    //  BA2: BA1 rotated 90 degrees CCW
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(rptr);
            rptr+=this.size;
        }
    }
    //  BA3: BA1 rotated 180 degrees CCW
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = pminus1 + this.size*loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(nminus1 - rptr);
            rptr--;
        }
    }
    //  BA4: BA1 rotated 270 degrees CCW
    for (var loop=0;loop<this.size;loop++)
    {
        rptr = nminus1 - loop;
        for (var loop1=0;loop1<this.size;loop1++)
        {
            this.solutions8.push(rptr);
            rptr-=this.size;
        }
    }
    //console.log(this.solutions8);
};  // end initAllEightSolutions

//======(HDKGame)==========================================
// Attempts to solve the game for 8 outcomes....
// Assumes a SQUARE puzzle always!
//   First, looks for two corners that are in any matching
//   configuration, tests top L/R first.  Determines whih
//   of the eight puzzle types it is and then does a
//   brute-force test against the apropriate results
//   (All 8 correct results are canned at puzzle init time)
this.testGameSolution = function()
{
    var ival=0;
    var cornercount=0;
    var gotdiagonal = 0;
    var gotA=0;
    var gotB=0;
    var gotC=0;
    var gotD = 0;
    var solution = 0; //0 is FAIL
    
    //console.log(" testGameSolution...");
    //clear validation bins...
    for (var loop=0;loop<this.totalSize;loop++)
        this.tiles[loop].ok = false;
        
    //OK, now we need to see if any corners are in place (at all)
    ival = this.indices[this.Aindex]; //get A corner (top left)
    // is this one of our corners? (just means _A_ corner is present not the correct one!)
    if (ival == this.Aindex || ival == this.Bindex || ival == this.Cindex || ival == this.Dindex)
    {
        gotA = 1 + ival;
        cornercount++;
    }
    //  repeat for B,C,D
    ival = this.indices[this.Bindex]; //get B corner (top right)
    if (ival == this.Aindex || ival == this.Bindex || ival == this.Cindex || ival == this.Dindex)
    {
        gotB = 1 + ival;
        cornercount++;
    }
    ival = this.indices[this.Cindex]; //get C corner (bottom left)
    if (ival == this.Aindex || ival == this.Bindex || ival == this.Cindex || ival == this.Dindex)
    {
        gotC = 1 + ival;
        cornercount++;
    }
    ival = this.indices[this.Dindex]; //get D corner (bottom right)
    if (ival == this.Aindex || ival == this.Bindex || ival == this.Cindex || ival == this.Dindex)
    {
        gotD = 1 + ival;
        cornercount++;
    }

    //OK! If we have two or more corners, determine which of the 8 solutions
    //      the puzzle most closely resembles....
    if (cornercount >= 2)
    {
        //Check top left/right:
        if (gotA!=0 && gotB!=0)
        {
            if ((this.indices[this.Aindex] == this.Aindex)      && (this.indices[this.Bindex] == this.Bindex))
                solution = SOLUTION_AB1;
            else if ((this.indices[this.Aindex] == this.Bindex) && (this.indices[this.Bindex] == this.Cindex))
                solution = SOLUTION_AB2;
            else if ((this.indices[this.Aindex] == this.Cindex) && (this.indices[this.Bindex] == this.Dindex))
                solution = SOLUTION_AB3;
            else if ((this.indices[this.Aindex] == this.Dindex) && (this.indices[this.Bindex] == this.Aindex))
                solution = SOLUTION_AB4;
            //Mirrored...
            else if ((this.indices[this.Aindex] == this.Bindex) && (this.indices[this.Bindex] == this.Aindex))
                solution = SOLUTION_BA1;
            else if ((this.indices[this.Aindex] == this.Aindex) && (this.indices[this.Bindex] == this.Dindex))
                solution = SOLUTION_BA2;
            else if ((this.indices[this.Aindex] == this.Dindex) && (this.indices[this.Bindex] == this.Cindex))
                solution = SOLUTION_BA3;
            else if ((this.indices[this.Aindex] == this.Cindex) && (this.indices[this.Bindex] == this.Bindex))
                solution = SOLUTION_BA4;
        } //end gotAB
        else if (gotB!=0 && gotC!=0) //check top/bottom right in place
        {
            if ((this.indices[this.Bindex] == this.Bindex)      && (this.indices[this.Cindex] == this.Cindex))
                solution = SOLUTION_AB1;
            else if ((this.indices[this.Bindex] == this.Cindex) && (this.indices[this.Cindex] == this.Dindex))
                solution = SOLUTION_AB2;
            else if ((this.indices[this.Bindex] == this.Dindex) && (this.indices[this.Cindex] == this.Aindex))
                solution = SOLUTION_AB3;
            else if ((this.indices[this.Bindex] == this.Aindex) && (this.indices[this.Cindex] == this.Bindex))
                solution = SOLUTION_AB4;
            //Mirrored...
            else if ((this.indices[this.Bindex] == this.Aindex) && (this.indices[this.Cindex] == this.Dindex))
                solution = SOLUTION_BA1;
            else if ((this.indices[this.Bindex] == this.Dindex) && (this.indices[this.Cindex] == this.Cindex))
                solution = SOLUTION_BA2;
            else if ((this.indices[this.Bindex] == this.Cindex) && (this.indices[this.Cindex] == this.Bindex))
                solution = SOLUTION_BA3;
            else if ((this.indices[this.Bindex] == this.Bindex) && (this.indices[this.Cindex] == this.Aindex))
                solution = SOLUTION_BA4;
        }  //end gotBC
        else if (gotC!=0 && gotD!=0)
        {
            if ((this.indices[this.Cindex] == this.Cindex)      && (this.indices[this.Dindex] == this.Dindex))
                solution = SOLUTION_AB1;
            else if ((this.indices[this.Cindex] == this.Dindex) && (this.indices[this.Dindex] == this.Aindex))
                solution = SOLUTION_AB2;
            else if ((this.indices[this.Cindex] == this.Aindex) && (this.indices[this.Dindex] == this.Bindex))
                solution = SOLUTION_AB3;
            else if ((this.indices[this.Cindex] == this.Bindex) && (this.indices[this.Dindex] == this.Cindex))
                solution = SOLUTION_AB4;
            //Mirrored...
            else if ((this.indices[this.Cindex] == this.Dindex) && (this.indices[this.Dindex] == this.Cindex))
                solution = SOLUTION_BA1;
            else if ((this.indices[this.Cindex] == this.Cindex) && (this.indices[this.Dindex] == this.Bindex))
                solution = SOLUTION_BA2;
            else if ((this.indices[this.Cindex] == this.Bindex) && (this.indices[this.Dindex] == this.Aindex))
                solution = SOLUTION_BA3;
            else if ((this.indices[this.Cindex] == this.Aindex) && (this.indices[this.Dindex] == this.Dindex))
                solution = SOLUTION_BA4;
        }   //end gotCD
        else if (gotD!=0 && gotA!=0)
        {
            if ((this.indices[this.Dindex] == this.Dindex)      && (this.indices[this.Aindex] == this.Aindex))
                solution = SOLUTION_AB1;
            else if ((this.indices[this.Dindex] == this.Aindex) && (this.indices[this.Aindex] == this.Bindex))
                solution = SOLUTION_AB2;
            else if ((this.indices[this.Dindex] == this.Bindex) && (this.indices[this.Aindex] == this.Cindex))
                solution = SOLUTION_AB3;
            else if ((this.indices[this.Dindex] == this.Cindex) && (this.indices[this.Aindex] == this.Dindex))
                solution = SOLUTION_AB4;
            //Mirrored...
            else if ((this.indices[this.Dindex] == this.Cindex) && (this.indices[this.Aindex] == this.Bindex))
                solution = SOLUTION_BA1;
            else if ((this.indices[this.Dindex] == this.Bindex) && (this.indices[this.Aindex] == this.Aindex))
                solution = SOLUTION_BA2;
            else if ((this.indices[this.Dindex] == this.Aindex) && (this.indices[this.Aindex] == this.Dindex))
                solution = SOLUTION_BA3;
            else if ((this.indices[this.Dindex] == this.Dindex) && (this.indices[this.Aindex] == this.Cindex))
                solution = SOLUTION_BA4;
        } //end gotDA
        solutionGuess = solution;
    } //end cornercount

    // If we have ONE corner in place, look at its XY neighbors and see if any of
    //   our 8 solutions is being tried at.  Just takes 2 neighbors to get a match...
    if (solution==0 && (gotA!=0 || gotB!=0 || gotC!=0 || gotD!=0))
        {
            var v,w,i,xdir,ydir,nx,ny = 0;
            var bing = false;
            w = this.size;
            for (var c = 0;c<4;c++) //Loop over 4 corners
            {
                switch (c)
                {
                    case 0: //Top Left
                        if (gotA!=0)
                        {
                            v = gotA - 1; i = 0;
                            xdir = 1; ydir = 1;
                            bing = true;
                        }
                        break;
                    case 1: //Top Right
                        if (gotB!=0)
                        {
                            v = gotB - 1; i = w-1;
                            xdir = -1; ydir = 1;
                            bing = true;
                        }
                        break;
                    case 2: //Bottom Right
                        if (gotC!=0)
                        {
                            v = gotC - 1; i = w*w-1;
                            xdir = -1; ydir = -1;
                            bing = true;
                        }
                        break;
                    case 3: //Bottom Left
                        if (gotD!=0)
                        {
                            v = gotD - 1; i = w*(w-1);
                            xdir = 1; ydir = -1;
                            bing = true;
                        }
                        break;
                } //end switch
            } //end for c
            ydir*=w;
            nx = this.indices[i+xdir]; //Get x neighbor's puzzle index
            ny = this.indices[i+ydir]; //    y neighbor
            if (bing) for (var loop=0;loop<8;loop++)
            {
                var ptr8 = loop * this.totalSize;
                if (v == this.solutions8[ptr8 + i] && nx == this.solutions8[ptr8 + i+xdir]) // Check for 2 in a row along x
                    {solution = 1+loop; break;}                                          // Match!
                else if (v == this.solutions8[ptr8 + i] && ny == this.solutions8[ptr8 + i + ydir]) //    ...or 2 in a row along y
                    {solution = 1+loop; break;}                                               // Match!
            } //end loop
           //console.log("corner: " + solution + " : " + xdir+ " : " + ydir);
        } //end big if
    
    //Based on assumed solution user is trying to get at, check tiles for
    //  proper ordering, be it up/down/right/left...
    var okcount = 0;
    var sminusone = solution - 1; //Valid solution #'s are 1...8 but solution array is 0..7
    var ptr8 = sminusone * this.totalSize;

    if (solution > 0) for (var loop=0;loop<this.totalSize;loop++)
    {
        if (this.indices[loop] == this.solutions8[ptr8 + loop])
        {
            okcount++;
            this.tiles[this.indices[loop]].ok = true;
        }
        
    } //end loop
    if (okcount == this.totalSize) return solution;
    return 0;
} //end testGameSolution


    //——GameObj——————————————————
    this.initHistory = function()
    {
	for (var i=0;i<this.totalSize;i++)
	 {
            this.tiles[i].wasok = this.tiles[i].ok;
	 }
    };

    //——GameObj——————————————————
    this.checkTilesOK = function()
    {
        if (this.difficulty == 1) //Easy Mode? AB1 pattern only!
        {
          var okCount = 0;
	  for (var i=0;i<this.totalSize;i++)
	   {
             var ii = this.indices[i];
             if (ii == i) //Tile OK? AB1 Pattern ONLY!
              {
                this.tiles[ii].ok = true;
                okCount++; 
              }
             else this.tiles[ii].ok = false;
   	   }
         if (okCount == this.totalSize) this.over = true;
        }
        else // Harder game? Test against all 8 patterns
        {
          var count2 = this.testGameSolution();
          if (count2 > 0) this.over = true;
        }
 
	for (var i=0;i<this.totalSize;i++)
        {
           var rowOK = this.isRowNowOK(i);
           var colOK = this.isColNowOK(i);
           if (rowOK || colOK) this.tiles[this.indices[i]].cgframe = 0;
        }
	return;

    }; //end checkTilesOK

    //——GameObj——————————————————
    this.scramble = function()
    {
	 for (var i=0;i<this.totalSize;i++)
	 {
           var i1 = this.getRandomInt(this.totalSize-1)
	   var ti = this.indices[i];
	   this.indices[i]  = this.indices[i1];
           this.indices[i1] = ti;
	 }
    }; //end scramble

 
    //——GameObj——————————————————
    // triggered as user moves a tile over one of its neighbors…
    this.setupSwap = function(iswap)  
    {
       if (this.swap2 >= 0) return;
       snap44kSound.volume = 0.1;
       snap44kSound.play();

       var idel = iswap - this.selected;
       this.animX = this.animY = 0;
       //Test if swapping with Left/Right neighbor…
       if (idel == 1)               this.animX = -1;
       else if (idel == -1)         this.animX =  1;
       //Test if swapping with Up/Down neighbor…
       else if (idel == this.size)  this.animY = -1;
       else if (idel == -this.size) this.animY =  1;
       this.animFrames = 10;  //Fast animation, this coeff is matched in animStep calculation
       this.swap1 = this.selected;
       this.swap2 = iswap;
       this.swapX = this.getTileX(iswap)
       this.swapY = this.getTileY(iswap)
    } //end setupSwap

    //——GameObj——————————————————
   this.isAnimating = function()
   {
     if (this.animFrames > 0) return true;
     return false;
   }

    //——GameObj——————————————————
   this.selectTile = function(x,y)
   {
    this.selected = this.getTileNum(x,y);
   }

   //——GameObj——————————————————
   this.eogAnim = function()
   {
	HDKAnim.clear();
	HDKAnim.buildPuzzle();
	HDKAnim.buildSmoosh();
	HDKAnim.addKeyframe(0.0);
	HDKAnim.addKeyframe(1.0);
	HDKAnim.addKeyframe(0.0);
	HDKAnim.addKeyframe(-1.0);  //end
	HDKAnim.animFrames = 30;
	HDKAnim.animFunc = EasingFunctions.easeInOutCubic;
   }

    //——GameObj——————————————————
   this.updateAnimations = function()
   {
     if (this.swap2 != -1)
     {
        this.drawSwapTile()
        this.drawSelectTile()
        if (this.animFrames > 0)
	{
          this.swapX += this.animX * this.animStep;
          this.swapY += this.animY * this.animStep;
          this.animFrames-=1;
	}  
        else //Out of frames?
        {
          //Swap the contents of the two game positions 1/2
          var itmp = this.indices[this.swap1];
	  this.indices[this.swap1] = this.indices[this.swap2];
	  this.indices[this.swap2] = itmp;
	  //Looks complex: makes sure the two swapped tiles have their X/Y coordinates correct!
          //  swap1/2 point to game positions, the indices point to which tile is in that position
          this.tiles[this.indices[this.swap1]].setXY(this.getTileX(this.swap1),this.getTileY(this.swap1));
          this.tiles[this.indices[this.swap2]].setXY(this.getTileX(this.swap2),this.getTileY(this.swap2));
          if (mousePressed) //User still moving selected tile around?
	     this.selected = this.swap2; // we now are on a different tile!
	  this.swapped1 = this.swap1;
	  this.swapped2 = this.swap2;
          this.swap2 = this.swap1 = -1; //Reset swap numbers until next time…
	  this.isAnimating = false;
	  this.checkTilesOK();
          if (this.over) 
	   {
	       bigweinerSound.volume = 0.1;
	       bigweinerSound.play();
	       this.eogAnim();
	   }

          if (!mousePressed) game.drawPuzzle();  //Do puzzle redraw if user done moving tile
        }
     }
    for (var i=0;i<this.totalSize;i++) this.tiles[i].updateAnimations();

   } //end updateAnimations



} //end game object


//—-(main)————————————————————————
function mouseDown(e) {
//    if (game.over) return;
    if (!game.started || game.over) //First click? Scramble!
     {
       startNewGame();
       return;
     }
    mousePressed   = true;
    var element = canvas;
    var offsetX = 0, offsetY = 0
    if (element.offsetParent) {
    do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }
    x = e.pageX - offsetX;
    y = e.pageY - offsetY;
    oldX = x;
    oldY = y;
    game.selectTile(x,y);
    selectXOff = game.getTileX(game.selected); 
    selectYOff = game.getTileY(game.selected);  
    game.drawSelectTile();
} //end mouseDown

//—-(main)————————————————————————
function mouseLeave(e) 
{
   if (mousePressed) mouseUp(e);
} //end mouseLeave

//—-(main)————————————————————————
function mouseUp(e) {
    if (!mousePressed) return;
    mousePressed  = false;
    game.selected = -1;
    game.moves++;
    endTime = new Date();
    var timeDiff = endTime - startTime; //in ms
    // strip the ms
    timeDiff /= 1000;
    game.time = Math.floor(timeDiff);
    game.checkTilesOK();
    if (game.over) game.eogAnim();
    game.drawPuzzle();
} //end mouseUp

//—-(main)————————————————————————
function mouseMove(e) {
    if (game.selected < 0 || game.over) return;

    var element = canvas;
    var offsetX = 0, offsetY = 0
    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    x = e.pageX - offsetX;
    y = e.pageY - offsetY;

    var tnew = game.getTileNum(x,y)
    if (tnew != game.selected && game.swap2 == -1) //Did tile move to new spot?
    {
      //console.log("Swap tile " + game.selected + " with tile " + tnew);
      game.setupSwap(tnew)
    }
    if (y < headerSize)
      mouseUp(e);
    else
      {     
       //Make sure we are dragging…
       selectXOff += x - oldX;
       selectYOff += y - oldY;
       oldX = x;
       oldY = y;
       game.drawPuzzle();
       game.drawSelectTile();
      }
} //end mouseMove


//—-(main)————————————————————————
function animate()
{
   game.updateAnimations()
   HDKAnim.updateAnimations();
   requestAnimationFrame(animate);
}

//—-(main)————————————————————————
function drawLabels()
{
   var iwid = 200;
   c.drawImage(logoImage,canvas.width/2 - iwid/2,0,iwid,50);

   c.font = "28px Arial";
   c.fillStyle = "#ffffff";
   c.textAlign = "center";
   var title   = gameName;    //Declared in html file
   if (game.over) title = "Game Over";
   c.fillText(title, canvas.width/2, 70); 

   c.font = "24px Arial";
   c.textAlign = "left";
   var mins = Math.floor(game.time/60);
   var secs = game.time - 60*mins;
   c.fillText("Time:" + ("00" + mins).slice(-2) + ":" +  ("00" + secs).slice(-2), 10, 110); 

   c.textAlign = "end";
   c.fillText("Moves:" + ("000" + game.moves).slice(-3),canvas.width-10,110);

}

//—-(main)————————————————————————
function startNewGame()
{

   karate44kSound.volume = 0.1;
   karate44kSound.play();
   game.scramble();
   game.setTiles();
   game.clear();
   game.checkTilesOK();
   game.initHistory();
   game.drawPuzzle();
   game.started = true;
   game.over = false;
}

    //Init glints global.  
    for (var i = 0; i < 13; i++) //Canned glints
    {
      var img=new Image();
      img.src = "glintanim/g" + ("00" + i).slice(-2) + ".png";
      glints.push(img);
      var img2=new Image();
      img2.src = "glintcrossanim/gcr" + ("00" + i).slice(-2) + ".png";
      cglints.push(img2);
    }



console.log(game);
game.initAllEightSolutions();
game.setTiles();
game.drawPuzzle();
//animate();
//alert("Click on puzzle to start!")

// Set up animation object . . .
HDKAnim.yorigin = headerSize;

//NOTE! We CAN indeed see hdkanim (it’s in a different JS file!)
if (false)
{
HDKAnim.clear();
HDKAnim.buildPuzzle();
HDKAnim.buildSmoosh();
HDKAnim.addKeyframe(0.0);
HDKAnim.addKeyframe(1.0);
HDKAnim.addKeyframe(0.0);
HDKAnim.addKeyframe(-1.0);  //end
HDKAnim.animFrames = 60;
HDKAnim.animFunc = EasingFunctions.easeInOutCubic;
}
animate();


