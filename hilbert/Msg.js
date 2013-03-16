/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.Msg
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Msg = 
  OpenLayers.Class(OpenLayers.Control, {

      fadingStep: 0.02,
      fadingInterval: 40,
      msgHTML: "Selection Changed:<br>Data Was Not Available",
    /**
     * Constructor: OpenLayers.Control.Msg 
     * 
     * Parameters:
     * options - {Object} Options for control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
	timer_ = null;
    },

    /** 
     * Method: destroy
     * Destroy control.
     */
    destroy: function() {
	this.stopFading();
	this.map.events.unregister("mousedown", this, this.stopFading);
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },    
    
    /**
     * Method: draw
     * Initialize control.
     * 
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

	this.map.events.register("mousedown", this, this.stopFading);

	this.div.style.position = "absolute";
	this.div.style.textAlign = "center";
	this.div.style.display= "block";
	this.div.style.left = "0px"
	this.div.style.right = "0px"
	this.div.style.top = "50%";
	this.div.style.width = "100%";
	this.div.style.height = "72px";
	this.div.style.marginTop = "-45px";

	this.div.style.fontFamily = "sans-serif";
	this.div.style.fontWeight = "bold";
	this.div.style.fontSize = "24px";
	this.div.style.color = "#f212d2";
	this.div.style.visibility = "hidden";
	this.div.style.backgroundColor = "transparent";

	this.div.innerHTML = this.msgHTML;

	this.opacity_ = 0;
        OpenLayers.Util.modifyDOMElement(this.div, null, null, 
					 null, null, null, null, 0);
        return this.div;    
    },

    stopFading: function() {
	if (this.timer_ != null) {
	    window.clearTimeout(this.timer_);
	    this.timer_ = null;
	    this.opacity_ = 0;
	    this.div.style.visibility = "hidden";
	    OpenLayers.Util.modifyDOMElement(this.div, null, null, 
					     null, null, null, null, 0);
	}
    },
      
    /**
     * Method: startFading
     */
    startFading: function(op, msg) {
	if (op == null) op = 1.5;
	if (msg) this.div.innerHTML = this.msgHTML = msg;
	this.div.style.visibility="visible";
	this.opacity_ = op;
	OpenLayers.Util.modifyDOMElement(this.div, null, null, 
					 null, null, null, null, 
					 (this.opacity_>1)?1:this.opacity_);
	if (this.timer_ != null) {
	    window.clearTimeout(this.timer_);
	    this.timer_ = null;
	}
        this.timer_ = window.setTimeout(OpenLayers.Function.bind(this.doFading, this), 
					this.fadingInterval);
    },

    doFading: function() {
        if (this.timer_ == null) {
	    this.opacity_ = 0;
	    return;
	}
	this.opacity_ -= this.fadingStep;
	if (this.opacity_ <= 0.05) {
	    this.stopFading();
	} else {
	    this.startFading(this.opacity_);
	}
    },


    timer_: null,
    opacity_: 0,


    CLASS_NAME: "OpenLayers.Control.Msg"
});
