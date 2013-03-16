//<![CDATA[

// netlocator.js:
//   show subnet under cursor (involves slow hilbert curve unwinding)

/**
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.NetLocator
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */

OpenLayers.Control.NetLocator = OpenLayers.Class(OpenLayers.Control, {
  
  /**
   * Property: element
   * {DOMElement}
   */
  element: null,
  
  /**
   * APIProperty: suffix
   * {String}
   */
  suffix: '',
  	/**  
     * Property: position
     * {String}
     */
   position : "left", 
  /**
   * Array of current markers
   */
  currentMarkers: null,
  thisrightpressed: null,
  start_x: null,
  start_y: null,

  lastpatch :null,
  /**
   * current kind of the underlying dataset
   */
  currentMapKind: null,
  
  
  /**
   * Constructor: OpenLayers.Control.NetLocator
   *
   * Parameters:
   * options - {DOMElement} Options for control.
   */
  initialize: function(options) {
    this.currentMarkers = [];
    OpenLayers.Control.prototype.initialize.apply(this, arguments);
    this.rightpressed = 0;
  },
  
  /**
   * Method: destroy
   */
  destroy: function() {
    this.deactivate();
    OpenLayers.Event.stopObservingElement(this.div);
    if (this.map) {
      this.map.events.unregister("mousedown", this, this.onMouseDown);
	  
	  this.map.events.unregister("mouseup", this, this.onMouseRightUp);
	  
      this.map.events.unregister("click", this, this.onMapClick);
      
      this.map.events.unregister('mousemove', this, this.mouseMove);
	  this.map.events.unregister('mouseenter', this, this.mouseEnter);
      this.map.events.unregister('click', this, this.onClick);
      if (  OpenLayers.Util.getElement("loc_link")) {
	this.map.events.unregister('moveend', this, this.onMoveEnd);
	OpenLayers.Event.stopObservingElement(  OpenLayers.Util.getElement("loc_link"));
      }
    }
    for (var i=0, l=this.currentMarkers.length; i<l; ++i) {
      this.currentMarkers[i].txtcache = null;
      this.currentMarkers[i].remove(null); 
    }
    this.map.events.un({"changebaselayer": this.onBLChange, scope: this});
    OpenLayers.Control.prototype.destroy.apply(this, arguments);
  },
  
  setMap: function(map) {
    OpenLayers.Control.prototype.setMap.apply(this, arguments);
    if (this.currentMapKind == null)
      this.currentMapKind = map.currentds.kind;
    this.map.events.on({"changebaselayer": this.onBLChange, scope: this});
  },
  
  onBLChange: function() {
    if (this.currentMapKind != null && this.currentMapKind != this.map.currentds.kind) {
      this.currentMapKind = this.map.currentds.kind;
      for (var i=0, l=this.currentMarkers.length; i<l; ++i) {
	var m = this.currentMarkers[i];
	this.markTxtLookup(m);
	
      }
    }
  },
  /**
   * Method: draw
   * {DOMElement}
   */
  draw: function() {
    OpenLayers.Control.prototype.draw.apply(this, arguments);
    
    // create layout
    this.loadContents();
    
    // populate div with current info
    this.redraw();
    
    return this.div;
  },
  
  /**
   * Method: redraw
   */
  redraw: function() {
    this.mouseMove();
  },
  
  /**
   * Method: loadContents
   * Set up the labels and divs for the control
   */
  loadContents: function() {
    //configure main div
    this.div.style.position = "absolute";
    this.div.style.top = "5px";
    this.div.style.marginTop = "5px";
    this.div.style.right = "5px";
    //this.div.style.rightMargin = "2px";
    this.div.style.fontSize = "small";
    this.div.style.backgroundColor = "transparent";
    //this.div.style.width = "70px";
    //this.div.style.padding="2px";
    this.div.style.zIndex = 2200;
    this.inputElem = document.createElement("input");
    this.inputElem.id = "inputip";
    this.inputElem.type = "text";
    //this.inputElem.focus = "true";
    this.inputElem.style.fontFamily = "Arial";
    //this.inputElem.style.display = "block";
    this.inputElem.style.fontSize="small";
    this.inputElem.fontWeight = "bold";
    this.inputElem.style.border = "1px solid black";
    this.inputElem.style.textAlign = "right";
    this.inputElem.style.width = "120px";
    this.inputElem.style.background = "white";
    this.inputElem.style.margin = "0px";
    this.inputElem.style.padding="2px";
    this.inputElem.ctrl = this;
    this.inputElem.zIndex = 2000;
	this.inputElem.value = "1.2.3.4"
    //this.inputElem.style.disabled = null;
    //this.inputElem.style.readonly = null;
    this.inputElem.keyinput=false; //flag used by NetLocator
    
    OpenLayers.Event.observe(this.div, "click", 
			     OpenLayers.Function.bindAsEventListener(this.onDivClick, this));
    OpenLayers.Event.observe(this.div, "dblclick", 
			     OpenLayers.Function.bindAsEventListener(this.onDivDblClick, this));
  
	
    //this.map.events.register("click", this, this.onMapClick);
    this.map.events.register("mouseup", this, this.onMouseRightUp);
    this.handler = new OpenLayers.Handler.Keyboard(this.inputElem, {"keydown": this.keyPress});
    
    this.map.events.register('mousemove', this, this.mouseMove);
	//this.map.events.register('mouseEnter', this, this.mousEnter);
	//this.map.events.register('mouseOut', this, this.mouseOut);
	 	
    if (  OpenLayers.Util.getElement("loc_link")) {
      this.map.events.register('moveend', this, this.onMoveEnd);
      OpenLayers.Event.observe(  OpenLayers.Util.getElement("loc_link"), 'mousedown', OpenLayers.Event.stop);
    }
	  this.map.events.register("mousedown", this, this.onMouseDown);
	$("#add_marker").append( this.inputElem  );
  
    this.activate();
  },
  
  onMoveEnd: function(e) {
    var baseurl = document.URL.split("?")[0];
    var ds = this.map.currentds;
    var scale = this.map.getZoom()*2;
    var center = this.getIPString(this.map.getCenter());
    var htmlfile = baseurl.substring(baseurl.lastIndexOf("/")+1);
    var url = htmlfile + "?kind="+ds.kind + "&scale="+scale + "&center="+center;
    var markertxt = "";
    for (var i=0, l=this.currentMarkers.length; i<l; ++i) {
		markertxt = ((this.currentMarkers[i].args_pfix)?this.currentMarkers[i].args_pfix:"")
		if(  markertxt.substring(0, 11) == "<b>You are "){		   
			markertxt = "";
		}else{
		
			url += "&m=" + this.currentMarkers[i].args_iptxt + "~" + markertxt;
		}
   
    }
   OpenLayers.Util.getElement("loc_link").innerHTML = '<a class="nlLink" href="' + encodeURI(url) + '" title="Click to copy current view to browser location bar">&nbsp;Link this view&nbsp;</a>';
  },
  
  onDivDblClick: function(e) {
    if (this.inputElem.keyinput) {
      OpenLayers.Event.stop(e);
      return;
    }
  },
  
 num2dot: function (num) {
	var d = num%256;
	for (var i = 3; i > 0; i--) { 
	num = Math.floor(num/256);
	d = num%256 + '.' + d;}
	return d;
	}
  
  ,
  sortNumber: function (a,b) {
    return a - b;
	}
  
  ,
  
  onMouseDown: function(e) {
	
    this.onMapClick(e);
    if (!OpenLayers.Event.isLeftClick(e)) {
      if (e.preventDefault) e.preventDefault();
      this.onMapRightClick(e);
    }
  },
   onMouseRightUp: function(e) {
      //alert(this.start_x +" "+ this.start_y);
	  if (e.which === 3) {
		
		this.rightpressed = 0;
		 var ll = this.map.getLonLatFromPixel(e.xy);
    if (!ll) return;
       if (ll.lon < 0 || ll.lat < 0 || ll.lon > 65536 || ll.lat > 65536) return null;
	  var z = map.getZoom();
	 if (z>9){
		var netmask = new Ull(1,(0xfffffFc0 ));
	}else{
		var netmask = this.map.netmask;
	}
    
    var addr = this.getIPString(ll, netmask);
  if (z==10){
		var netbits = 26;
	}else{
	var netbits = this.map.netbits;
	}
		
		if(z==0){var subnet = 2;var divider = 4096;}
		if(z==1){var subnet = 4;var divider = 2048;}
		if(z==2){var subnet = 6;var divider = 1024;}
		if(z==3){var subnet = 8;var divider = 512;}
		if(z==4){var subnet = 10;var divider = 256;}
		if(z==5){var subnet = 12;var divider = 128;}
		if(z==6){var subnet = 14;var divider = 64;}
		if(z==7){var subnet = 16;var divider = 32;}
		if(z==8){var subnet = 18;var divider = 16;}
		if(z==9){var subnet = 20;var divider = 8;}
		if(z==10){var subnet = 20;var divider = 8;}
		if(z==11){var subnet = 24;divider = 2;}
		if(z==12){var subnet = 26;divider = 1;}
		if(z==13){var subnet = 28;divider = 1;}
			
		var ll_2 = this.mapIP(addr);
		var indexx = parseInt( (""+(ll_2.lon/divider)).split(".")[0]);
		var indexy = parseInt( (""+((65536 - ll_2.lat)/divider)).split(".")[0]);
		
		
		if (indexx > this.start_x){
			var xfrom = this.start_x;
			var xto = indexx;
		}else{
			var xfrom =indexx;
			var xto = this.start_x;
		}
		if (indexy > this.start_y){
			var yfrom = this.start_y;
			var yto = indexy;
		}else{
			var yfrom =indexy;
			var yto = this.start_y;
		}
		var ranges =  new Array();
		var cnt = 0;
		var field = "";
		var ip  = "";
		
		for (var x=xfrom;x<=xto;x++)
		{
			for (var y=yfrom;y<=yto;y++)
			{
				
				field=jQuery('.in_'+x+"_"+y);
				field.addClass("hl");//.css('background-color', '#00FFFF').css('opacity','.9');
				ip = field.attr('id');
				if (ip == undefined){
					var value = (addr) ? addr : ""; // "" needed for IE
					value += "/" + netbits;
					jQuery("#ranges").html(value);
					return
				}
				var d = ip.split('_');
				ip_int =  ((((((+d[1])*256)+(+d[2]))*256)+(+d[3]))*256)+(+d[4]);
				ranges[cnt] = ip_int;
				cnt++;
				//ranges +=  ip_int +",";
				
			}
		}
		var startips = ranges.sort(this.sortNumber);
		var endips = startips.slice(0);
		var length = endips.length;

		for (var i = 0; i < length; i++) {
			var sn = subnet;
			sn = 32-(subnet+6);
			var pow1 = Math.pow(2,sn);
			endips[i] = endips[i] +  pow1;
		}
		var startip = -1;
		var endip = -1;
		var output = "";
		for (var i = 0; i < length; i++) {
			
			if (startip == -1){
				startip = startips[i];
				if(endips[i] >= startips[i+1]){
							
					}else{
						endip = endips[i] -1 ;
						output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
						startip = -1;
					}
			}else{
				
				if (length < i+1){
					endip = endips[i] -1;
					output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
					startip = -1;
				}else{
					if(endips[i] >= startips[i+1]){
							
					}else{
						endip = endips[i] -1 ;
						output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
						startip = -1;
					}
				}
			
			}
			
		
		
		}
		jQuery("#ranges").html(output );
		
		
		
		
		}
	},
  
  rightpressed : function(e){
  }
  
  ,
  onMapRightClick: function(e) {
	this.rightpressed = 1;
	$(".ol").removeClass("hl");
    var ll = this.map.getLonLatFromPixel(e.xy);
    if (!ll) return;
    if (ll.lon < 0 || ll.lat < 0 || ll.lon > 65536 || ll.lat > 65536) return null;
	var z = map.getZoom();
    if (z>9){
		var netmask = new Ull(1,(0xfffffFc0 ));
	}else{
		var netmask = this.map.netmask;
	}
    var addr = this.getIPString(ll,netmask);
 

		//$('#patch64px').show();
		

    
		//$('#patch64px').show();
		
	if( $('#overlay_enable').attr('checked')){
			
		
	if(this.rightpressed == 1){
	
		
		if(z==0){var subnet = 2;var divider = 4096;}
		if(z==1){var subnet = 4;var divider = 2048;}
		if(z==2){var subnet = 6;var divider = 1024;}
		if(z==3){var subnet = 8;var divider = 512;}
		if(z==4){var subnet = 10;var divider = 256;}
		if(z==5){var subnet = 12;var divider = 128;}
		if(z==6){var subnet = 14;var divider = 64;}
		if(z==7){var subnet = 16;var divider = 32;}
		if(z==8){var subnet = 18;var divider = 16;}
		if(z==9){var subnet = 20;var divider = 8;}
		if(z==10){var subnet = 20;var divider = 8;}
		if(z==11){var subnet = 24;divider = 2;}
		if(z==12){var subnet = 26;divider = 1;}
		if(z==13){var subnet = 28;divider = 1;}
			
			
		ll1 = this.mapIP(addr);
		this.start_x =parseInt( (""+(ll1.lon/divider)).split(".")[0]);
		this.start_y =parseInt( (""+((65536 - ll1.lat)/divider)).split(".")[0]);
		
	}
	}

  },

  onDivClick: function(e) { 
    this.inputElem.keyinput=true;
    this.inputElem.style.border="1px solid red";
    this.inputElem.value="";
    this.inputElem.focus();
    if (e) OpenLayers.Event.stop(e);
  },
  
  onMapClick: function(e) {
    this.inputElem.keyinput=false;
    this.inputElem.style.border="1px solid black";
    this.mouseMove(e);
  },
  
	
  
  
  mouseMove: function(e) {
    if (this.inputElem.keyinput) return;
    if (e == null) return;
    
    var ll = this.map.getLonLatFromPixel(e.xy);
    if (!ll) return;
	var z = this.map.getZoom();
	if (z>9){
		var netmask = new Ull(1,(0xfffffFc0 ));
	}else{
		
		var netmask = this.map.netmask;
	}
  
	
    var addr = this.getIPString(ll, netmask);
	
    var value = (addr) ? addr : ""; // "" needed for IE
   
	
    //if (this.map.netbits > 28)
    //	ptr.innerHTML += "<sup>&Dagger;</sup>";
   if (z==10){
		var netbits = 26;
	}else{
	var netbits = this.map.netbits;
	}
		var foo1= "";
		if(z==0){var netmask = new Ull(1, (0xffff0000 ));foo1 = "/16";}
		if(z==1){var netmask = new Ull(1, (0xffffc000 ));foo1 = "/18";}
		if(z==2){var netmask = new Ull(1, (0xfffff000 ));foo1 = "/20";}
		if(z==3){var netmask = new Ull(1, (0xfffffc00 ));foo1 = "/22";}
		if(z==4){var netmask = new Ull(1, (0xffffff00 ));foo1 = "/24";}
		if(z==5){var netmask = new Ull(1, (0xffffffc0 ));foo1 = "/26";}
		if(z==6){var netmask = new Ull(1, (0xfffffff0 ));foo1 = "/28";}
		if(z==7){var netmask = new Ull(1, (0xfffffffc ));foo1 = "/30";}
		if(z>=8){var netmask = new Ull(1, (0xffffffff ))}
		
		addr = this.getIPString(this.map.getLonLatFromPixel(e.xy),netmask);

	 
	 if( $('#overlay_enable').attr('checked')){
		value =  addr + foo1 +  "<br>" + value + "/" + netbits;
	 }else{
		value =  addr + foo1 +  "<br>";
	 }
	 
	   jQuery("#mouserange").html(value);

	if (addr == null){
		//$('#patch64px').hide();
		return
	}

		//$('#patch64px').show();
		
	if( this.lastpatch == addr){return; }
	
	this.lastpatch = addr;
	if(this.rightpressed == 1 ){
	
		
		if(z==0){var subnet = 2;var divider = 4096;}
		if(z==1){var subnet = 4;var divider = 2048;}
		if(z==2){var subnet = 6;var divider = 1024;}
		if(z==3){var subnet = 8;var divider = 512;}
		if(z==4){var subnet = 10;var divider = 256;}
		if(z==5){var subnet = 12;var divider = 128;}
		if(z==6){var subnet = 14;var divider = 64;}
		if(z==7){var subnet = 16;var divider = 32;}
		if(z==8){var subnet = 18;var divider = 16;}
		if(z==9){var subnet = 20;var divider = 8;}
		if(z==10){var subnet = 20;var divider = 8;}
		if(z==11){var subnet = 24;divider = 2;}
		if(z==12){var subnet = 26;divider = 1;}
		if(z==13){var subnet = 28;divider = 1;}
			
		ll1 = this.mapIP(addr);
		indexx =(""+(ll1.lon/divider)).split(".")[0];
		indexy =(""+((65536 - ll1.lat)/divider)).split(".")[0];
		
	
		$(".ol").removeClass("hl");
		
		if (indexx > this.start_x){
			var xfrom = this.start_x;
			var xto = indexx;
		}else{
			var xfrom =indexx;
			var xto = this.start_x;
		}
		if (indexy > this.start_y){
			var yfrom = this.start_y;
			var yto = indexy;
		}else{
			var yfrom =indexy  ;
			var yto = this.start_y  ;
		}
		var ranges =  new Array();
		var cnt = 0;
		for (var x=xfrom;x<=xto;x++)
		{
			for (var y=yfrom;y<=yto;y++)
			{
				var  field= jQuery('.in_'+x+"_"+y);
				
				
				field.addClass("hl");
				ip = field.attr('id');
				if (ip == undefined){
					var value = (addr) ? addr : ""; // "" needed for IE
					value += "/" + netbits;
					jQuery("#ranges").html(value);
					return
				}
				var d = ip.split('_');
				ip_int =  ((((((+d[1])*256)+(+d[2]))*256)+(+d[3]))*256)+(+d[4]);
				ranges[cnt] = ip_int;
				cnt++;
			
			}
		}
		
		
		var startips = ranges.sort(this.sortNumber);
		var endips = startips.slice(0);
		var length = endips.length;

		for (var i = 0; i < length; i++) {
			var sn = subnet;
			sn = 32-(subnet+6);
			var pow1 = Math.pow(2,sn);
			endips[i] = endips[i] +  pow1;
		}
		var startip = -1;
		var endip = -1;
		var output = "";
		for (var i = 0; i < length; i++) {
			
			if (startip == -1){
				startip = startips[i];
				if(endips[i] >= startips[i+1]){
							
					}else{
						endip = endips[i] -1 ;
						output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
						startip = -1;
					}
			}else{
				
				if (length < i+1){
					endip = endips[i] -1;
					output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
					startip = -1;
				}else{
					if(endips[i] >= startips[i+1]){
							
					}else{
						endip = endips[i] -1 ;
						output +=  this.num2dot(startip)  + "-" + this.num2dot(endip) + "<br>";
						startip = -1;
					}
				}
			
			}
			
		}
		
		
		
		jQuery("#ranges").html(output)
	}

    
  },
  
  keyPress: function(e) {
    if (!this.keyinput) { this.focus(); this.value=""; }
    this.keyinput=true;
    this.style.border="1px solid red";
    var keycode;
    if (window.event) {
      e = window.event;
      keycode = e.keyCode;
    } else if(e.which) {
      keycode = e.which;
    }
    if (keycode == 13) {
      this.ctrl.markIP(this.value, true);
      this.value="";
      this.keyinput=false;
      this.style.border="1px solid black";
    }
  },
  
  getIPString: function(ll, mask) {
    if (ll.lon < 0 || ll.lat < 0 || ll.lon > 65536 || ll.lat > 65536) return null;
    
    ll.lat = 65536 - ll.lat;
   // 
    var ull = hilbert_c2i(16, [ll.lat, ll.lon]);
    if (mask != null) ull.and1(mask); //mask (insignificant) host bits
    var o4 = ull.l & 0xff;
    ull.rshift1(8); // because ull.l is 31 bit 
    var o3 = ull.l & 0xff;
    var o2 = (ull.l >> 8) & 0xff;
    var o1 = (ull.l >> 16) & 0xff;
    return o1 + "." + o2 + "." + o3 + "." + o4;
  },
  
  
  mapIP: function(iptxt) {
    if (iptxt == null || iptxt.length == 0) return;
    if (!iptxt.match(/^\d{1,3}\/\d{1,2}$/)) {
      if (!iptxt.match(/^\d{1,3}\.\d{1,3}\/\d{1,2}$/)) {
	if (!iptxt.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/)) {
	  if (!iptxt.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/)) {
	  
		  alert("sorry this is no ip: " + iptxt);
		  return;
		}
	      
	  }
	}
      }
    
    var netlen = iptxt.split("/");
    var net = netlen[0];
    var plen = 32;
    if (netlen.length > 1) {
      plen=netlen[1];
      if (plen < 1 || plen >32) return;
    }
    var o = net.split(".");
    var i, ull = new Ull(0,0);
    for (i = 0; i<4; ++i) {
      ull.lshift1(8);
      if (i < o.length) {
	var x = parseInt(o[i]);
	if (x > 255) return;
	ull.or1(new Ull(0, x));
      }
    }
    if (32-plen > 0) {
      ull.rshift1(32-plen);
      ull.lshift1(32-plen);
    }
    var c1 = hilbert_i2c(16, ull);
    
    var llm = new OpenLayers.LonLat(c1[1], 65536-c1[0]);
    return llm;
  },
  
  markTxtLookup: function(marker) {
    if (!marker.txtcache) marker.txtcache=[];
    var cachedtxt = marker.txtcache[this.currentMapKind];
    if (cachedtxt) {
      this.markerUpdateContents(marker, cachedtxt);
      return;
    }
    var nl = this;
    var txt = (marker.args_pfix) ? marker.args_pfix+marker.args_iptxt : marker.args_iptxt;
    if (this.map.currentds && this.map.currentds.db) {
      var lk = (this.map.currentds.lookup?this.map.currentds.lookup:"lookup_"+this.map.currentds.kind+".sh");
      OpenLayers.Request.issue({
	    url: "/cgi-bin/ant/"+lk+"?"
	         +marker.args_iptxt+"%20"
	         +this.map.currentds.db,
	    success: function(req) {
	        var tbl = '<br><style type="text/css" media="screen">td,th,table{border-color:black;border-style:solid;} td,th{padding-left:5px;padding-right:5px;border-width: 1px 1px 0 0;margin:0;}table{border-width: 0 0 1px 1px;width:auto;border-spacing:0;border-collapse:collapse;}</style><table>' + req.responseText + '</table>';
	        nl.markerUpdateContents(marker, txt+tbl);
	    },
	    failure: function(req) {
	        nl.markerUpdateContents(marker, txt);
	    }
      });
    } else {
      this.markerUpdateContents(marker, txt);
    }
  },
  
  markerUpdateContents: function(marker, txt) {
    marker.txtcache[this.currentMapKind] = txt;
    marker.feature.data.popupContentHTML = txt;
    if (marker.feature.popup) {
      marker.feature.popup.setContentHTML(txt);
    }
  },
  
  markIP: function(iptxt, openpopup, pfix) {
    var llm=this.mapIP(iptxt);
    if (!llm) return;
    var m = this.addMarker(llm, iptxt, pfix);
    if (openpopup) {
      this.map.panTo(llm);
      m.togglePopup();
    }
    this.markTxtLookup(m);    
  },
  
  rePosition: function() {
    var args = decodeURI(document.URL).split("?");
    if (args.length == 1) return;
    var markers=[];
    if (args.length == 2) {
      var pargs = args[1].split("&"), vargs = {};
      for (var j in pargs) {
	var a = pargs[j].split("=");
	if (a.length != 2) continue;
	if (a[0] == "m") 
	  markers.push(a[1]);
	else
	  vargs[a[0]] = a[1];
      }
      var found = false;
      for (var i=0, d; d=this.map.datasets[i]; ++i) {
	if (d.kind == vargs.kind) {
	  if (d.layer) {
	    var bl = this.map.baseLayer;
	    if (d.layer != bl) {
	      this.map.addLayer(d.layer);
	      this.map.setBaseLayer(d.layer);
	      this.map.removeLayer(bl);
	      OpenLayers.Control.Selector.virtualtime=d.date;
	      map.events.triggerEvent("changebaselayer");
	    }
	    this.map.currentds = d;
	    found = true;
	    break;
	  }
	}
      }
      this.currentMapKind = this.map.currentds.kind;
      //add markers
      for (var i = 0, l=markers.length; i<l; ++i) {
	var ip_pfix = markers[i].split("~");
	this.markIP(ip_pfix[0], false, ip_pfix[1]);
      }
      if (found) {
	if (vargs.scale != null) {
	  this.map.zoomTo(vargs.scale/2);
	}
	if (vargs.center != null) {
	  var nl = this.map.getControlsByClass("OpenLayers.Control.NetLocator")[0];
	  this.map.setCenter(nl.mapIP(vargs.center));
	}
	return;
      }
    }
    if (!this.msgctl) {
      var m = this.map.getControlsByClass("OpenLayers.Control.Msg");
      if (m.length > 0)
	this.msgctl = m[0];
    }
    if (this.msgctl)
      this.msgctl.startFading(3.0, 'Selection Specified in URL is not available');
  },
  
  addMarker: function(ll, iptxt, pfix) {
    if (!this.ipmarkers) {
      this.ipmarkers = new OpenLayers.Layer.Markers("IP Markers");
      this.map.addLayer(this.ipmarkers);
      this.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble, {
        'autoSize': true,
	'maxSize': new OpenLayers.Size(512,128),
	'zIndex': 3000
      });
    }
    ll.lat -= .5; // place in the middle of the pixel      
    ll.lon += .5; // (for zoom levels > 8)
    
    var feature = new OpenLayers.Feature(this.ipmarkers, ll);
    
    feature.popupClass = this.popupClass;
    feature.data.popupContentHTML = "looking up " + iptxt + "...";
    feature.data.overflow = "auto"; // or "hidden/auto"
    
    var marker = feature.createMarker();
    marker.netlocator = this;
    marker.feature    = feature;
    marker.args_iptxt = iptxt;
    marker.args_pfix  = pfix;
    
    marker.togglePopup = function(e) {
      var p = this.feature.popup;
      if (p && p.visible()) {
        p.hide();
        p.map.removePopup(p);
        OpenLayers.Event.stopObservingElement(p.closeDiv);
        this.feature.destroyPopup();
      } else {
        this.feature.createPopup(true);
        p = this.feature.popup;
        p.autoSize=true;
        p.closeDiv.style.backgroundImage = 'url("img/close.png")';
        p.closeDiv.style.backgroundRepeat = "no-repeat";
        p.closeDiv.style.right = "0px";
        p.setBackgroundColor("#F0F0F0");
        p.setOpacity(1);
        this.map.addPopup(feature.popup);
        this.netlocator.markTxtLookup(this);
        p.show();
        OpenLayers.Event.observe(p.closeDiv, "click",
				 OpenLayers.Function.bindAsEventListener(marker.remove, marker));
      }
      if (e) OpenLayers.Event.stop(e);
      return false;
    };
    marker.remove = function (e) {
      this.netlocator.ipmarkers.removeMarker(this);
      this.feature.destroy();
      OpenLayers.Util.removeItem(this.netlocator.currentMarkers, this);
      if (e) OpenLayers.Event.stop(e);
    };
    
    //marker.events.register("mousedown", marker, marker.togglePopup);
    //marker.events.register("dblclick",  marker, marker.togglePopup);
    marker.events.on({"mousedown": marker.togglePopup,
                      //"dblclick" : marker.togglePopup,
                      //"click"    : marker.togglePopup, 
                      scope: marker
                     });
    this.ipmarkers.addMarker(marker);

    this.currentMarkers.push(marker);
    this.onMoveEnd();
    return marker;
  },
  
  
  CLASS_NAME: "OpenLayers.Control.NetLocator"
});

//]]>
