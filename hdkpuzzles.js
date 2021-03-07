// Puzzles area
//  Should contain color sets in 3x3...5x5 formats (ascii HEX values)
// Colorsets are stored by name for now, also each has a 3 letter abbreviation


//——HDKPuzzles———————————————————————————————————————————————————
// this is a singleton...
var HDKPuzzles = new function() {

	this.CLUTNames = ["empty","Kihei Yellow"]; 
        //Kihei Yellow?
        this.KIYIndex = 1;  //For numeric lookups...
	this.KIYColors3x3 =
	 		["#1b0064","#66589c","#b0b0d3",
			"#324399","#85898a","#d6cf7a",
			"#4985ce","#a3ba78","#fcee21"];
	this.KIYColors4x4 = [
		    "#1b0064",
		    "#4c3b89",
		    "#7e75ae",
		    "#b0b0d3",
    
		    "#2a2c87",
		    "#5f5f8d",
		    "#949292",
		    "#c9c598",
    
		    "#3959ab",
		    "#728490",
		    "#aaae77",
		    "#e3d95c",
    
		    "#4985CE",
		    "#85a894",
		    "#c0cb5b",
		    "#FCEE21"
	];


	this.KIYColors5x5 = [
    		"#1b0064",
    		"#402c80",
    		"#66589c",
    		"#8b84b7",
    		"#b0b0d3",
    
    		"#27217F",
   		 "#4E4989",
    		"#757193",
    		"#9C989C",
    		"#C3C0A7",
    
    		"#324399",
    		"#5B6692",
    		"#85898A",
    		"#ADAC82",
    		"#D6CF7A",
    
    		"#3E64B4",
    		"#69829A",
   		 "#94A281",
   		 "#BEC067",
    		"#E9DF4E",
    
   		 "#4985CE",
   		 "#769FA3",
   		 "#A3BA78",
    		"#CFD44C",
   		 "#FCEE21"
	];



    //——HDKPuzzles——————————————————
    this.getNameByIndex = function(index)
    {
      if (index < 1) return "";
      if (index >= this.CLUTNames.length) return  "";
      return this.CLUTNames[index];
    }

    //——HDKPuzzles——————————————————
    this.getColorsByIndex = function(index,size)
    {
      if (index < 1) return "";
      if (index >= this.CLUTNames.length) return  "";
      switch(index)
	{
	  case this.KIYIndex:
             if (size == 3) return this.KIYColors3x3;
             if (size == 4) return this.KIYColors4x4;
             if (size == 5) return this.KIYColors5x5;
	     break;
	  default:
	     return [];
	}; //end case
    } //end getColorsByIndex

} //end HDKPuzzles