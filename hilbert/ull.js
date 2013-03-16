//<![CDATA[

// ull.js: poor implementation of unsigned long integers
//         (should be about 62 bit long)

function Ull(h,l) {this.h = h;this.l = l;}
Ull.prototype.MAXMASK = 0x7fffffff;
Ull.prototype.SIGNBIT = 0x80000000;
Ull.prototype.HIGHBIT = 0x40000000;
Ull.prototype.ZEROBIT = 0x00000001;

Ull.prototype.lshift1 = function(n) {
    while(n-- >0) {
	this.h<<=1; 
	this.l<<=1;
	if (this.l < 0) { this.h|= this.ZEROBIT; }
    }
    this.l &= this.MAXMASK;
    this.h &= this.MAXMASK;
    return this;
};
Ull.prototype.lshift = function(n) {
    var ull = new Ull(this.h, this.l);
    ull.lshift1(n);
    return ull;
};
Ull.prototype.rshift1 = function(n) {
    while (n-- > 0) {
	this.l>>=1;
	if (this.h&this.ZEROBIT) { this.l|=this.HIGHBIT; }
	this.h>>=1;
    }
    return this;
};
Ull.prototype.rshift = function(n) {
    var ull = new Ull(this.h, this.l);
    ull.rshift1(n);
    return ull;
};
Ull.prototype.and1= function(ull) {this.h&=ull.h; this.l&=ull.l;return this;};
Ull.prototype.and = function(ull) {return new Ull(this.h & ull.h, this.l & ull.l);};
Ull.prototype.or1 = function(ull) {this.h|=ull.h; this.l|=ull.l;return this;};
Ull.prototype.or  = function(ull) {return new Ull(this.h | ull.h, this.l | ull.l);};
Ull.prototype.xor1= function(ull) {this.h^=ull.h; this.l^=ull.l;return this;};
Ull.prototype.xor = function(ull) {return new Ull(this.h ^ ull.h, this.l ^ ull.l);};
Ull.prototype.neg1= function()    {this.h=(~this.h)&this.MAXMASK;this.l=(~this.l)&this.MAXMASK;return this;};
Ull.prototype.neg = function()    {return new Ull((~this.h)&this.MAXMASK, (~this.l)&this.MAXMASK);};
Ull.prototype.inc1 = function() {
    this.l++;
    if (this.l<0) {
	this.l=0;
	this.h++;
    }
    return this;
};
Ull.prototype.inc = function() {
    var ull = new Ull(this.h, this.l);
    ull.inc1();
    return ull;
};
Ull.prototype.dec1 = function() {
    this.l--;
    if (this.l<0) {
	this.l=this.MAXMASK;
	this.h--;
    }
    return this;
};
Ull.prototype.dec = function() {
    var ull = new Ull(this.h, this.l);
    ull.dec1();
    return ull;
};
Ull.prototype.div1 = function(ul) {
    var d = 0.0 + this.h * this.SIGNBIT + this.l;
    d = d/ul;
    this.h = (d/this.SIGNBIT) | 0;
    this.l = (d - this.h*this.SIGNBIT) | 0;
    return this;
};

//]]>
