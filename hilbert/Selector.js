/** 
 * @requires OpenLayers/Control.js
 */

OpenLayers.Control.Selector = 
  OpenLayers.Class(OpenLayers.Control, {

    /**  
     * Property: activeColor
     * {String}
     */
    activeColor: "darkblue",
	/**  
     * Property: position
     * {String}
     */
 position : "right", 
    topOffset: 50,
    
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
     * Property: baseLayers
     * {Array(<OpenLayers.Layer>)}
     */
    baseLayers: null,
    
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
     * Property: headertxt
     * {String}
     * 
     */
    headertxt: "",
    /**
     * Property: selectionType
     * {String}
     * either "date" or "source" or "kind"
     */
    selectionType: null,

    selectionTypes: {"kind":1},

    selectionTrimmed: null,

    /**
     * Constructor: OpenLayers.Control.Selector
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        if (options && options.selectionTrimmed) {
            this.selectionTrimmed=options.selectionTrimmed;
            delete options.selectionTrimmed;
        }
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        if (this.div) this.div = OpenLayers.Util.getElement(this.div);
    },

    /**
     * APIMethod: destroy 
     */    
    destroy: function() {
        OpenLayers.Event.stopObservingElement(this.div);
        OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        OpenLayers.Event.stopObservingElement(this.maximizeDiv);
        this.map.events.un({
            "changebaselayer": this.redraw, scope: this
        });
        //clear out layers info and unregister their events 
        this.clearBaseLayers();
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
        this.map.events.on({
            "changebaselayer": this.redraw, 
            scope: this
        });
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
            return this.div;
        },

    /** 
     * Method: clearBaseLayers
     * Clear all the corresponding listeners, the div, and reinitialize a new array.
     * 
     * Parameters: None
     */
    clearBaseLayers: function(layersType) {
        if (this.baseLayers) {
            for(var i=0, len=this.baseLayers.length; i<len ; i++) {
                var layer = this.baseLayers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
        this.baseLayersDiv.innerHTML = "";
        this.baseLayers = [];
    },

    date_close: function(s1, s2) {
        var ns1 = s1.replace(/-/g, "")+"00000000";
        var ns2 = s2.replace(/-/g, "")+"00000000";
        var d = Math.abs(parseInt(ns1.slice(0,8)) - parseInt(ns2.slice(0,8)));
        return 1./(10+d); //max at .1
    },

    findLayer: function(arg) {
        var best_score = 0.0;
        var best_ds = null;
        for (var i=0, ds; ds=this.datasets[i]; i++) {
            var score = 0.0, max_score = 0.0;
            for (var p in this.selectionTypes) {
                if (p == 'date') {
                    score += this.date_close(ds.date, arg.date);
                    max_score += .1; //xxx max date
                } else if (p == 'source' && ds[p] == 'amite') {
                    score += .1;
                    max_score += .1;
                } else {
                    if (ds[p] == arg[p]) ++score;
                    ++max_score;
                }
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
        this.clearBaseLayers();
        var options = {};
        var currentds = null;
		var i = 0;
        for (i=0, ds; ds=this.datasets[i]; ++i) {
            options[ds[this.selectionType]] = ds;
            if (map.baseLayer && ds.layer == map.baseLayer) {
                currentds = ds;
            }
        }
		if (i==0){return;}
        var selections = [];
        for (var opt in options) selections.push(opt);
        selections.sort();

        var descr = {};
        for (var p in this.selectionTypes) descr[p] = currentds[p];
        if (OpenLayers.Control.Selector.virtualtime)
            descr.date = OpenLayers.Control.Selector.virtualtime;
        for (var i=0, len=selections.length; i<len; i++) {
            var opt = selections[i];
            //if (opt == "" | opt == "global") continue;
            //find out if this option is "available"
            descr[this.selectionType] = opt;
            var d_s = this.findLayer(descr);
            var layer_not_available = (d_s.score != 1.0);
            if (this.selectionTrimmed) {
                if (d_s.dataset[this.selectionTrimmed] != currentds[this.selectionTrimmed]) continue;
            }
            //if (this.selectionTrimmed && layer_not_available) continue;
            //labelSpan.style.color=(layer_not_available)?"lightgray":"white";
            checked = (currentds[this.selectionType] == opt);
            // create input element
            var inputElem = document.createElement("input");
            inputElem.id = this.id + "_input_" + opt;
            inputElem.name = opt;
            inputElem.type = "radio";
            inputElem.value = opt;
            inputElem.checked = checked;
            inputElem.defaultChecked = checked;
            inputElem.disabled = false;
            var labelSpan = document.createElement("span");

            labelSpan.innerHTML = opt;
            labelSpan.style.verticalAlign = "bottom";


            var msg = "";
            for (var p in this.selectionTypes) {
                if (descr[p] != d_s.dataset[p]) {
                    msg += (msg == "") ? p : ", "+p;
                    //msg += "(" + descr[p] + ")";
                }
            }
            if ( msg != "" )
                msg = "Selection of <i>"+msg+"</i> changed <br>to satisfy your request of<br><i>"
                    + this.selectionType + ": " + opt + "</i>";
            var context = {
                'inputElem': inputElem,
                'ds'       : d_s.dataset,
                'notavail' : layer_not_available,
                'msg'      : msg,
                'selector': this
            };
            OpenLayers.Event.observe(inputElem, "mouseup", 
                OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context));
            OpenLayers.Event.observe(labelSpan, "click", 
                OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context));
            // create line break
            var br = document.createElement("br");
            var groupArray = this.baseLayers;

            groupArray.push({
                'opt': opt,
                'inputElem': inputElem,
                'labelSpan': labelSpan
            });
                                                     
            var groupDiv = this.baseLayersDiv;

            groupDiv.appendChild(inputElem);
            groupDiv.appendChild(labelSpan);
            groupDiv.appendChild(br);
        }
        return this.div;
    },

    /** 
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     * 
     * Parameters:
     * e - {Event} 
     *
     * Context:  
     *  - {DOMElement} inputElem
     *  - {<OpenLayers.Control.Selector>} selector
     *  - {<dataset>} ds
     */

    onInputClick: function(e) {
        if (!this.inputElem.disabled) {
            this.inputElem.checked = true;
            if (this.selector.msgctl) {
                if (this.notavail)
                    this.selector.msgctl.startFading(2.0, this.msg);
                else
                    this.selector.msgctl.stopFading();
            }
            var bl = this.selector.map.baseLayer;
            this.selector.map.currentds = this.ds;
            if (bl != this.ds.layer) {
                this.selector.map.addLayer(this.ds.layer);
                this.selector.map.setBaseLayer(this.ds.layer);
                this.selector.map.removeLayer(bl);
            }
        }
        OpenLayers.Event.stop(e);
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

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
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

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
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
		if(this.position == "right"){
		  this.div.style.right = "0px";
		}
      
        //this.div.style.left = "";
	this.div.style.fontFamily="monospace";
        //this.div.style.fontFamily = "sans-serif";
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
     //   this.layersDiv.style.width = "100%";
        this.layersDiv.style.height = "100%";
	this.layersDiv.style.cursor = "pointer";


        this.baseLbl = document.createElement("div");
        this.baseLbl.innerHTML = OpenLayers.i18n(this.headertxt);
        this.baseLbl.style.marginTop = "3px";
        this.baseLbl.style.marginLeft = "3px";
        this.baseLbl.style.marginBottom = "3px";
        
        this.baseLayersDiv = document.createElement("div");
        this.baseLayersDiv.style.paddingLeft = "10px";

        this.layersDiv.appendChild(this.baseLbl);
        this.layersDiv.appendChild(this.baseLayersDiv);
 
        this.div.appendChild(this.layersDiv);
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

        this.div.appendChild(this.minimizeDiv);
    },

    CLASS_NAME: "OpenLayers.Control.Selector"
});
