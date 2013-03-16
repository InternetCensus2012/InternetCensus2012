/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.PrefixScaleLine
 * The PrefixScaleLine displays a small line indicator representing the current 
 * map scale on the map. By default it is drawn in the lower left corner of
 * the map.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 *  
 * Is a very close copy of:
 *  - <OpenLayers.Control.Scale>
 */
OpenLayers.Control.PrefixScaleLine = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: eTop
     * {DOMElement}
     */
    eTop: null,

    /**
     * Property: eBottom
     * {DOMElement}
     */
    eBottom:null,

    /**
     * Constructor: OpenLayers.Control.PrefixScaleLine
     * Create a new scale line control.
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be used
     *     to extend the control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);     
    },

    /**
     * Method: draw
     * 
     * Returns:
     * {DOMElement}
     */
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.eTop) {
            this.div.style.display = "block";
            this.div.style.position = "absolute";
            
	   

            this.ePix2Net = document.createElement("div");
            this.ePix2Net.className = this.displayClass + "Pix2Net";
            this.div.appendChild(this.ePix2Net);
			
			this.eWBracket = document.createElement("div");
			
            this.eBBracket = document.createElement("div");
			this.eBBracket.style.margin = "1px;";
			this.eBBracket.style.position = "relative";
			this.eBBracket.style.width = "256px";
			
			this.eWBracket.className = this.displayClass + "WBracket";
		 
            this.eBBracket.className = this.displayClass + "BBracket";
		
            this.eWBracket.appendChild(this.eBBracket);
	
		
	    this.div.appendChild(this.eWBracket);
			
        }
        this.map.events.register('zoomend', this, this.update);
        this.update();
        return this.div;
    },

    /**
     * Method: update
     * Update the size of the bars, and the labels they contain.
     */
    update: function() {
        var zoom = this.map.getZoom();
	var net = zoom<<1, btxt;
	var value =  Math.pow(2,32- ( ((zoom<<1) + 16)));
	if (value > 100000){
		value = " ~ " +  ((value / 1000) + ".").split(".")[0] + " K" ;
	}else{
		value = " = " + value;
	}
	
	if (zoom > 8) {
	  btxt = (1<<(zoom-8)) + " pixels : 1 Ip";
	} else {
	  btxt = "1 pixel : /" + ((zoom<<1) + 16) + value  + " IPs";
	}
	
	this.ePix2Net.innerHTML = 
	    '<span style="background-color:black; color:white;">&nbsp;&nbsp;' 
            + btxt 
	    + '&nbsp;&nbsp;</span>';
	
	net = zoom<<1;	
	var value =Math.pow(2,32- ( ((zoom<<1) ))) ;
	if (value > 1000000){
		value = " ~ " +((value / 1000000) + ".").split(".")[0] + " Mil" ;
	}else{
		if (value > 1000){
			value = " ~ " +((value / 1000) + ".").split(".")[0] + " K" ;
		}else{
			value = " = " + value;
		}
	}
	net = net +  value + " IPs";  	

	this.eBBracket.innerHTML = 
	    '<span style="background-color:black; color:white;">&nbsp;&nbsp;/'
	    + net + '&nbsp;&nbsp;</span>';
	//this.eWBracket.removeChild(this.eBBracket);
	
	this.eWBracket.appendChild(this.eBBracket);
    }, 

    CLASS_NAME: "OpenLayers.Control.PrefixScaleLine"
});

