/** 
 * @requires OpenLayers/Control.js
 */

OpenLayers.Control.Selector2 = 
  OpenLayers.Class(OpenLayers.Control, {

    /**  
     * Property: activeColor
     * {String}
     */
    activeColor: "darkblue",

    topOffset: 50,
	/**  
     * Property: position
     * {String}
     */
    position : "right", 
     /**  
     * Property: datasets
     * {Array(<datasets>)}
     */
   
    // DOM Elements
  
    /**
     * Property: layersDiv
     * {DOMElement} 
     */
    layersDiv: null,
    
    /** 
     * Property: baseLayersDiv
     * {DOMElement}
     */
    baseLayersDiv: null,
 /**
     * Property: headertxt
     * {String}
     * 
     */
    headertxt: null,
    /** 
     * Property: minimizeDiv
     * {DOMElement} 
     */
    minimizeDiv: null,

    /** 
     * Property: maximizeDiv
     * {DOMElement} 
     */
    maximizeDiv: null,

    /**
     * Property: selector
     * {selector}
     */
    selector: null,

    /**
     * Property: selectionType
     * {String}
     * either "date" or "source" or "kind"
     */
    selectionType: null,

    selectionTypes: {"kind":1},
    /**
     * Constructor: OpenLayers.Control.Selector2
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        if (this.div) this.div = OpenLayers.Util.getElement(this.div);
    },

    /**
     * APIMethod: destroy 
     */    
    destroy: function() {
        OpenLayers.Event.StopObservingElement(this.larrow);
        OpenLayers.Event.StopObservingElement(this.rarrow);
        OpenLayers.Event.stopObservingElement(this.div);
        OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        OpenLayers.Event.stopObservingElement(this.maximizeDiv);
        OpenLayers.Event.stopObservingElement(this.selector);
        this.map.events.un({
            "changebaselayer": this.redraw, 
              scope: this
        });
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /** 
     * Method: setMap
     *
     * Properties:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        this.map.events.on({"changebaselayer": this.redraw, scope: this});
    },

    LAMouseDown: function() { this.ArrowMouseDown(this.larrow); },
    LAMouseUp: function() { this.ArrowMouseUp(this.larrow); },
    RAMouseDown: function() { this.ArrowMouseDown(this.rarrow); },
    RAMouseUp: function() { this.ArrowMouseUp(this.rarrow); },
    ArrowMouseDown: function(img) { OpenLayers.Rico.Corner.changeOpacity(img, 0.5) },
    ArrowMouseUp: function(img) { OpenLayers.Rico.Corner.changeOpacity(img, 1) },

    RAclick: function() {
        var s=this.selector, i=s.options[s.selectedIndex].avail_next;
        if (i<0) return;
        s.selectedIndex = i;
        this.onChange();
    },
    LAclick: function() { 
        var s=this.selector, i=s.options[s.selectedIndex].avail_prev;
        if (i<0) return;
        s.selectedIndex = i;
        this.onChange();
    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the 
     *     switcher tabs.
     */  

    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // populate div with current info
        this.redraw();
        this.maximizeControl();
        if (this.selectionType == 'date')
            OpenLayers.Control.Selector.virtualtime=this.map.currentds.date;
        return this.div;
    },

    findLayer: function(arg) {
        var best_score=0.0, best_ds=null;
        for (var i=0, ds; (ds=this.datasets[i]); i++) {
            var score = 0.0;
            var max_score = 0.0;
            for (var p in this.selectionTypes) {
                if (ds[p] == arg[p]) ++score;
                ++max_score;
                if (p == this.selectionType) {
                    if (ds[p] == arg[p]) score += 99;
                    max_score += 99;
                }
            }
            score /= max_score;
            if (score >= best_score) {
                best_score = score;
                best_ds = ds;
            }
        }
        return {"dataset":best_ds, "score":best_score};
    },
    /** 
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a 
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */  
    redraw: function() {
        if (this.selector) this.selector.options.length = 0;
        var options = {};
        var currentds = null;
        for (var i=0, ds; ds=this.datasets[i]; ++i) {
            options[ds[this.selectionType]] = ds;
            if (map.baseLayer && ds.layer == map.baseLayer) currentds = ds;
        }
        var selections = [];
        for (var opt in options){
			selections.push(opt);	
		}
	   
        selections.sort();

        var descr = {};
        for (var p in this.selectionTypes) descr[p] = currentds[p];
        this.selector.options.length = 0;
        var avail_prev=-1, j=-1;
        for (var i=0, len=selections.length; i<len; i++) {
            var opt = selections[i];
            //find out if this option is "available"
            descr[this.selectionType] = opt;
            var d_s = this.findLayer(descr);
           // if (d_s.dataset['kind'] != currentds['kind']) continue;
            
            ++j;
            var option = document.createElement("option");
            option.avail_prev = option.avail_next = -1;
            option.id = this.id + "_option_" + opt;
            option.ds = d_s.dataset;
            option.layer = d_s.dataset.layer;
            option.selected =  (currentds[this.selectionType] == opt);
            if (d_s.score == 1.0) {
                option.available = true;
                option.avail_prev = avail_prev;
                if (avail_prev >= 0) 
                    this.selector.options[avail_prev].avail_next = j;
                avail_prev = j;
            } else {
                option.available = false;
                //option.style.background="lightgray";
                opt += " n/a";
            }
            option.value = opt;
            option.text = opt;

            var msg = "";
            for (var p in this.selectionTypes) {
                if (descr[p] != d_s.dataset[p]) {
                    msg += (msg == "") ? p : ", "+p;
                }
            }
            option.msg = "Selection of <i>"+msg+"</i> changed <br>to satisfy your request of<br><i>"
                       + this.selectionType+": "+opt+"</i>";

            this.selector.options[j] = option;
        }
       
        if (this.larrow) {
            this.larrow.style.visibility = 
               (this.selector.options[this.selector.selectedIndex].avail_prev < 0)?"hidden":"visible";
        }
        if (this.rarrow) {
            this.rarrow.style.visibility = 
                (this.selector.options[this.selector.selectedIndex].avail_next < 0)?"hidden":"visible";
        }
        return this.div;
    },

    /** 
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     * 
     */
    onChange: function(e) {
        var s = this.selector;
        var o = s.options[s.selectedIndex];
        if (this.msgctl) {
            if (o.available)
                this.msgctl.stopFading();
            else
                this.msgctl.startFading(2.0, o.msg);
        }
        
        var bl = this.map.baseLayer;
        if (this.selectionType == 'date')
            OpenLayers.Control.Selector.virtualtime=o.ds[this.selectionType];
        if (bl != o.layer) {
            this.map.currentds = o.ds;
            this.map.addLayer(o.layer);
            this.map.setBaseLayer(o.layer);
            this.map.removeLayer(bl);
        }
        if (e) OpenLayers.Event.stop(e);
        s.blur();
    },
    
    /** 
     * Method: maximizeControl
     * Set up the labels and divs for the control
     * 
     * Parameters:
     * e - {Event} 
     */
    maximizeControl: function(e) {
        this.div.style.width = "210px";
        this.showControls(false);
        if (e != null) OpenLayers.Event.stop(e);                                            
    },
    
    /** 
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size, 
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event} 
     */
    minimizeControl: function(e) {
        this.div.style.width = "0px";
        this.showControls(true);
        if (e != null) OpenLayers.Event.stop(e);                                            
    },

    /**
     * Method: showControls
     * Hide/Show all Selector controls depending on whether we are
     *     minimized or not
     * 
     * Parameters:
     * minimize - {Boolean}
     */
    showControls: function(minimize) {
        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";
        this.layersDiv.style.display = minimize ? "none" : "";
    },
    
    /** 
     * Method: loadContents
     * Set up the labels and divs for the control
     */
    loadContents: function() {
        //configure main div
        this.div.style.position = "absolute";
        this.div.style.top = this.topOffset + "px";
        //this.div.style.right = "0px";
		if(this.position == "right"){
		  this.div.style.right = "0px";
		}
        //this.div.style.left = "";
	    this.div.style.fontFamily="monospace";
        this.div.style.fontWeight = "bold";
        this.div.style.marginTop = "3px";
     
        this.div.style.marginBottom = "3px";
        this.div.style.fontSize = "8pt";   
        this.div.style.color = "white";   
        this.div.style.backgroundColor = "transparent";
        // layers list div        
        this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        this.layersDiv.style.paddingTop = "5px";
        this.layersDiv.style.paddingLeft = "10px";
        this.layersDiv.style.paddingBottom = "5px";
        this.layersDiv.style.paddingRight = "5px";
        this.layersDiv.style.backgroundColor = this.activeColor;        
    //    this.layersDiv.style.width = "100%";
        this.layersDiv.style.height = "100%";
        this.layersDiv.style.cursor = "pointer";

        this.baseLbl = document.createElement("div");
       this.baseLbl.innerHTML = '<img src="alb.png" alt="back" id="LArrow" align="top"/>' 
                               + OpenLayers.i18n(this.headertxt)
                               + '<img src="arb.png" alt="forw" id="RArrow" align="top"/>';
        this.baseLbl.style.marginTop = "3px";
        this.baseLbl.style.marginLeft = "3px";
        this.baseLbl.style.marginBottom = "3px";
        
        this.baseLayersDiv = document.createElement("div");
        this.baseLayersDiv.style.paddingLeft = "10px";

        this.layersDiv.appendChild(this.baseLbl);
        this.layersDiv.appendChild(this.baseLayersDiv);
 
        this.div.appendChild(this.layersDiv);

        this.selector = document.createElement("select");
        this.selector.style.fontFamily="monospace";
        this.selector.style.fontSize="8pt";
        this.selector.style.width="120px";
        this.selector.hight = "auto";
        OpenLayers.Event.observe(this.selector, "change", 
            OpenLayers.Function.bindAsEventListener(this.onChange, this)
        );
        this.baseLayersDiv.appendChild(this.selector);
		if(this.position == "right"){
		  OpenLayers.Rico.Corner.round(this.div, {corners: "tl bl",
                                        bgColor: "transparent",
                                        color: this.activeColor,
                                        blend: false});
		}else{
		  OpenLayers.Rico.Corner.round(this.div, {corners: "tr br",
                                        bgColor: "transparent",
                                        color: this.activeColor,
                                        blend: false});
		}
       

        OpenLayers.Rico.Corner.changeOpacity(this.layersDiv, 0.85);

        var imgLocation = OpenLayers.Util.getImagesLocation();
        var sz = new OpenLayers.Size(18,18);        

        // maximize button div
        if(this.position == "right"){
			var img = imgLocation + 'plus-mini-right.png';
		}else{
			var img = imgLocation + 'plus-mini-left.png';
		}
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.maximizeDiv.style.top = "5px";
		if(this.position == "right"){
			this.maximizeDiv.style.right = "0px";
		}
        this.maximizeDiv.style.left = "";
        this.maximizeDiv.style.display = "none";
        OpenLayers.Event.observe(this.maximizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.maximizeControl, this)
        );
        
        this.div.appendChild(this.maximizeDiv);

        // minimize button div
        var img = imgLocation + 'layer-switcher-minimize.png';
        var sz = new OpenLayers.Size(18,18);        
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MinimizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.minimizeDiv.style.top = "5px";
		if(this.position == "right"){
			this.minimizeDiv.style.right = "0px";
		}
        this.minimizeDiv.style.left = "";
        this.minimizeDiv.style.display = "none";
        OpenLayers.Event.observe(this.minimizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.minimizeControl, this)
        );

        this.larrow=OpenLayers.Util.getElement("LArrow");
        this.rarrow=OpenLayers.Util.getElement("RArrow");

        OpenLayers.Event.observe(this.larrow, "click",
            OpenLayers.Function.bindAsEventListener(this.LAclick, this)
        );
        OpenLayers.Event.observe(this.rarrow, "click",
            OpenLayers.Function.bindAsEventListener(this.RAclick, this)
        );
        OpenLayers.Event.observe(this.larrow, "mousedown",
            OpenLayers.Function.bindAsEventListener(this.LAMouseDown, this)
        );
        OpenLayers.Event.observe(this.rarrow, "mousedown",
            OpenLayers.Function.bindAsEventListener(this.RAMouseDown, this)
        );
        OpenLayers.Event.observe(this.larrow, "mouseup",
            OpenLayers.Function.bindAsEventListener(this.LAMouseUp, this)
        );
        OpenLayers.Event.observe(this.rarrow, "mouseup",
            OpenLayers.Function.bindAsEventListener(this.RAMouseUp, this)
        );
        this.div.appendChild(this.minimizeDiv);
    },
    CLASS_NAME: "OpenLayers.Control.Selector2"
});
