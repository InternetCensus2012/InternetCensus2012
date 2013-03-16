"use strict";var DygraphLayout=function(a){this.dygraph_=a;this.datasets=[];this.setNames=[];this.annotations=[];this.yAxes_=null;this.xTicks_=null;this.yTicks_=null};DygraphLayout.prototype.attr_=function(a){return this.dygraph_.attr_(a)};DygraphLayout.prototype.addDataset=function(a,b){this.datasets.push(b);this.setNames.push(a)};DygraphLayout.prototype.getPlotArea=function(){return this.computePlotArea_()};DygraphLayout.prototype.computePlotArea_=function(){var a={x:0,y:0};if(this.attr_("drawYAxis")){a.x=this.attr_("yAxisLabelWidth")+2*this.attr_("axisTickSize")}a.w=this.dygraph_.width_-a.x-this.attr_("rightGap");a.h=this.dygraph_.height_;if(this.attr_("drawXAxis")){if(this.attr_("xAxisHeight")){a.h-=this.attr_("xAxisHeight")}else{a.h-=this.attr_("axisLabelFontSize")+2*this.attr_("axisTickSize")}}if(this.dygraph_.numAxes()==2){a.w-=(this.attr_("yAxisLabelWidth")+2*this.attr_("axisTickSize"))}else{if(this.dygraph_.numAxes()>2){this.dygraph_.error("Only two y-axes are supported at this time. (Trying to use "+this.dygraph_.numAxes()+")")}}if(this.attr_("title")){a.h-=this.attr_("titleHeight");a.y+=this.attr_("titleHeight")}if(this.attr_("xlabel")){a.h-=this.attr_("xLabelHeight")}if(this.attr_("ylabel")){}if(this.attr_("y2label")){}if(this.attr_("showRangeSelector")){a.h-=this.attr_("rangeSelectorHeight")+4}return a};DygraphLayout.prototype.setAnnotations=function(d){this.annotations=[];var e=this.attr_("xValueParser")||function(a){return a};for(var c=0;c<d.length;c++){var b={};if(!d[c].xval&&!d[c].x){this.dygraph_.error("Annotations must have an 'x' property");return}if(d[c].icon&&!(d[c].hasOwnProperty("width")&&d[c].hasOwnProperty("height"))){this.dygraph_.error("Must set width and height when setting annotation.icon property");return}Dygraph.update(b,d[c]);if(!b.xval){b.xval=e(b.x)}this.annotations.push(b)}};DygraphLayout.prototype.setXTicks=function(a){this.xTicks_=a};DygraphLayout.prototype.setYAxes=function(a){this.yAxes_=a};DygraphLayout.prototype.setDateWindow=function(a){this.dateWindow_=a};DygraphLayout.prototype.evaluate=function(){this._evaluateLimits();this._evaluateLineCharts();this._evaluateLineTicks();this._evaluateAnnotations()};DygraphLayout.prototype._evaluateLimits=function(){this.minxval=this.maxxval=null;if(this.dateWindow_){this.minxval=this.dateWindow_[0];this.maxxval=this.dateWindow_[1]}else{for(var f=0;f<this.datasets.length;++f){var d=this.datasets[f];if(d.length>1){var b=d[0][0];if(!this.minxval||b<this.minxval){this.minxval=b}var a=d[d.length-1][0];if(!this.maxxval||a>this.maxxval){this.maxxval=a}}}}this.xrange=this.maxxval-this.minxval;this.xscale=(this.xrange!==0?1/this.xrange:1);for(var c=0;c<this.yAxes_.length;c++){var e=this.yAxes_[c];e.minyval=e.computedValueRange[0];e.maxyval=e.computedValueRange[1];e.yrange=e.maxyval-e.minyval;e.yscale=(e.yrange!==0?1/e.yrange:1);if(e.g.attr_("logscale")){e.ylogrange=Dygraph.log10(e.maxyval)-Dygraph.log10(e.minyval);e.ylogscale=(e.ylogrange!==0?1/e.ylogrange:1);if(!isFinite(e.ylogrange)||isNaN(e.ylogrange)){e.g.error("axis "+c+" of graph at "+e.g+" can't be displayed in log scale for range ["+e.minyval+" - "+e.maxyval+"]")}}}};DygraphLayout._calcYNormal=function(a,b){if(a.logscale){return 1-((Dygraph.log10(b)-Dygraph.log10(a.minyval))*a.ylogscale)}else{return 1-((b-a.minyval)*a.yscale)}};DygraphLayout.prototype._evaluateLineCharts=function(){this.points=[];this.setPointsLengths=[];this.setPointsOffsets=[];var c=this.attr_("connectSeparatedPoints");for(var a=0;a<this.datasets.length;++a){var e=this.datasets[a];var h=this.setNames[a];var b=this.dygraph_.axisPropertiesForSeries(h);this.setPointsOffsets.push(this.points.length);var i=0;for(var f=0;f<e.length;f++){var n=e[f];var d=parseFloat(n[0]);var k=parseFloat(n[1]);var m=(d-this.minxval)*this.xscale;var g=DygraphLayout._calcYNormal(b,k);var l={x:m,y:g,xval:d,yval:k,name:h};if(c&&n[1]===null){l.yval=null}this.points.push(l);i+=1}this.setPointsLengths.push(i)}};DygraphLayout.prototype._evaluateLineTicks=function(){var d,c,b,f;this.xticks=[];for(d=0;d<this.xTicks_.length;d++){c=this.xTicks_[d];b=c.label;f=this.xscale*(c.v-this.minxval);if((f>=0)&&(f<=1)){this.xticks.push([f,b])}}this.yticks=[];for(d=0;d<this.yAxes_.length;d++){var e=this.yAxes_[d];for(var a=0;a<e.ticks.length;a++){c=e.ticks[a];b=c.label;f=this.dygraph_.toPercentYCoord(c.v,d);if((f>=0)&&(f<=1)){this.yticks.push([d,f,b])}}}};DygraphLayout.prototype.evaluateWithError=function(){this.evaluate();if(!(this.attr_("errorBars")||this.attr_("customBars"))){return}var h=0;for(var a=0;a<this.datasets.length;++a){var g=0;var f=this.datasets[a];var l=this.setNames[a];var e=this.dygraph_.axisPropertiesForSeries(l);for(g=0;g<f.length;g++,h++){var o=f[g];var c=parseFloat(o[0]);var m=parseFloat(o[1]);if(c==this.points[h].xval&&m==this.points[h].yval){var k=parseFloat(o[2]);var d=parseFloat(o[3]);var n=m-k;var b=m+d;this.points[h].y_top=DygraphLayout._calcYNormal(e,n);this.points[h].y_bottom=DygraphLayout._calcYNormal(e,b)}}}};DygraphLayout.prototype._evaluateAnnotations=function(){var d;var f={};for(d=0;d<this.annotations.length;d++){var b=this.annotations[d];f[b.xval+","+b.series]=b}this.annotated_points=[];if(!this.annotations||!this.annotations.length){return}for(d=0;d<this.points.length;d++){var e=this.points[d];var c=e.xval+","+e.name;if(c in f){e.annotation=f[c];this.annotated_points.push(e)}}};DygraphLayout.prototype.removeAllDatasets=function(){delete this.datasets;delete this.setNames;delete this.setPointsLengths;delete this.setPointsOffsets;this.datasets=[];this.setNames=[];this.setPointsLengths=[];this.setPointsOffsets=[]};DygraphLayout.prototype.unstackPointAtIndex=function(b){var a=this.points[b];var d={};for(var e in a){d[e]=a[e]}if(!this.attr_("stackedGraph")){return d}for(var c=b+1;c<this.points.length;c++){if(this.points[c].xval==a.xval){d.yval-=this.points[c].yval;break}}return d};"use strict";var DygraphCanvasRenderer=function(d,c,b,e){this.dygraph_=d;this.layout=e;this.element=c;this.elementContext=b;this.container=this.element.parentNode;this.height=this.element.height;this.width=this.element.width;if(!this.isIE&&!(DygraphCanvasRenderer.isSupported(this.element))){throw"Canvas is not supported."}this.xlabels=[];this.ylabels=[];this.annotations=[];this.chartLabels={};this.area=e.getPlotArea();this.container.style.position="relative";this.container.style.width=this.width+"px";if(this.dygraph_.isUsingExcanvas_){this._createIEClipArea()}else{if(!Dygraph.isAndroid()){var a=this.dygraph_.canvas_ctx_;a.beginPath();a.rect(this.area.x,this.area.y,this.area.w,this.area.h);a.clip();a=this.dygraph_.hidden_ctx_;a.beginPath();a.rect(this.area.x,this.area.y,this.area.w,this.area.h);a.clip()}}};DygraphCanvasRenderer.prototype.attr_=function(a){return this.dygraph_.attr_(a)};DygraphCanvasRenderer.prototype.clear=function(){var c;if(this.isIE){try{if(this.clearDelay){this.clearDelay.cancel();this.clearDelay=null}c=this.elementContext}catch(f){return}}c=this.elementContext;c.clearRect(0,0,this.width,this.height);function a(g){for(var e=0;e<g.length;e++){var h=g[e];if(h.parentNode){h.parentNode.removeChild(h)}}}a(this.xlabels);a(this.ylabels);a(this.annotations);for(var b in this.chartLabels){if(!this.chartLabels.hasOwnProperty(b)){continue}var d=this.chartLabels[b];if(d.parentNode){d.parentNode.removeChild(d)}}this.xlabels=[];this.ylabels=[];this.annotations=[];this.chartLabels={}};DygraphCanvasRenderer.isSupported=function(f){var b=null;try{if(typeof(f)=="undefined"||f===null){b=document.createElement("canvas")}else{b=f}b.getContext("2d")}catch(c){var d=navigator.appVersion.match(/MSIE (\d\.\d)/);var a=(navigator.userAgent.toLowerCase().indexOf("opera")!=-1);if((!d)||(d[1]<6)||(a)){return false}return true}return true};DygraphCanvasRenderer.prototype.setColors=function(a){this.colorScheme_=a};DygraphCanvasRenderer.prototype.render=function(){var b=this.elementContext;function c(h){return Math.round(h)+0.5}function g(h){return Math.round(h)-0.5}if(this.attr_("underlayCallback")){this.attr_("underlayCallback")(b,this.area,this.dygraph_,this.dygraph_)}var a,f,d,e;if(this.attr_("drawYGrid")){e=this.layout.yticks;b.save();b.strokeStyle=this.attr_("gridLineColor");b.lineWidth=this.attr_("gridLineWidth");for(d=0;d<e.length;d++){if(e[d][0]!==0){continue}a=c(this.area.x);f=g(this.area.y+e[d][1]*this.area.h);b.beginPath();b.moveTo(a,f);b.lineTo(a+this.area.w,f);b.closePath();b.stroke()}b.restore()}if(this.attr_("drawXGrid")){e=this.layout.xticks;b.save();b.strokeStyle=this.attr_("gridLineColor");b.lineWidth=this.attr_("gridLineWidth");for(d=0;d<e.length;d++){a=c(this.area.x+e[d][0]*this.area.w);f=g(this.area.y+this.area.h);b.beginPath();b.moveTo(a,f);b.lineTo(a,this.area.y);b.closePath();b.stroke()}b.restore()}this._renderLineChart();this._renderAxis();this._renderChartLabels();this._renderAnnotations()};DygraphCanvasRenderer.prototype._createIEClipArea=function(){var g="dygraph-clip-div";var f=this.dygraph_.graphDiv;for(var e=f.childNodes.length-1;e>=0;e--){if(f.childNodes[e].className==g){f.removeChild(f.childNodes[e])}}var c=document.bgColor;var d=this.dygraph_.graphDiv;while(d!=document){var a=d.currentStyle.backgroundColor;if(a&&a!="transparent"){c=a;break}d=d.parentNode}function b(j){if(j.w===0||j.h===0){return}var i=document.createElement("div");i.className=g;i.style.backgroundColor=c;i.style.position="absolute";i.style.left=j.x+"px";i.style.top=j.y+"px";i.style.width=j.w+"px";i.style.height=j.h+"px";f.appendChild(i)}var h=this.area;b({x:0,y:0,w:h.x,h:this.height});b({x:h.x,y:0,w:this.width-h.x,h:h.y});b({x:h.x+h.w,y:0,w:this.width-h.x-h.w,h:this.height});b({x:h.x,y:h.y+h.h,w:this.width-h.x,h:this.height-h.h-h.y})};DygraphCanvasRenderer.prototype._renderAxis=function(){if(!this.attr_("drawXAxis")&&!this.attr_("drawYAxis")){return}function q(i){return Math.round(i)+0.5}function p(i){return Math.round(i)-0.5}var d=this.elementContext;var l,n,m,s,r;var a={position:"absolute",fontSize:this.attr_("axisLabelFontSize")+"px",zIndex:10,color:this.attr_("axisLabelColor"),width:this.attr_("axisLabelWidth")+"px",lineHeight:"normal",overflow:"hidden"};var g=function(i,v,w){var x=document.createElement("div");for(var u in a){if(a.hasOwnProperty(u)){x.style[u]=a[u]}}