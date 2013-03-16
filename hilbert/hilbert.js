//<![CDATA[

// Hilbert mapping functions using homegrown-larger-than-31-bit unsigned integer
// class Ull

// adapted from http://computation.pa.msu.edu/NO/F90/SFC/hilbert.c

//coords to index mapping
function hilbert_c2i(nBits,coord) {
    var one = new Ull(0,1);
    var ndOnes = new Ull(0,3);
    var nthbits = one.lshift(nBits<<1).dec(); nthbits.div1(3); nthbits.rshift1(1);
    var b, d;
    var rotation = 0; 
    var reflection = new Ull(0,0);
    var index = new Ull(0,0);
    for (b = nBits; b--;) {
	var bits = reflection;
	reflection = new Ull(0,  (coord[0] >> b) & 1 );
	reflection.or1(new Ull(0, ((coord[1] >> b) & 1 ) << 1));

	bits.xor1(reflection);
	bits = bits.rshift(rotation).or(bits.lshift(2-rotation)).and(ndOnes);
		
	index.or1(bits.lshift(b<<1));
	reflection.xor1(one.lshift(rotation));

	bits.and1(bits.neg().inc().and(one));
	while (bits.l | bits.h) {bits.rshift1(1); ++rotation;}
	if (++rotation >= 2) rotation -= 2;
    }	
    index.xor1(nthbits);

    for (d = 1; ; d *= 2) {
	var t = index.rshift(d);
	if ((t.h|t.l) == 0) break;
	index.xor1(t);
    }
    return index;
}

//index to coords mapping
function hilbert_i2c(nBits,index) {
    var one = new Ull(0,1);
    var ndOnes = new Ull(0,3);
    var nthbits = one.lshift(nBits<<1).dec(); nthbits.div1(3); nthbits.rshift1(1);
    var b, d, t;
    var rotation = 0; 
    var reflection = new Ull(0,0);
    var coord = [0, 0];
    
    t = index.rshift(1); index.xor1(t);
    index.xor1(nthbits);
    for (b = nBits; b--; ) {
	var bits = index.rshift(2*b).and(ndOnes);
	reflection.xor1(bits.rshift(2-rotation).or(bits.lshift(rotation)).and(ndOnes));

	coord[0] |= ((reflection.l)      & 1) << b;
	coord[1] |= (((reflection.l) >> 1) & 1) << b;

	reflection.xor1(one.lshift(rotation));

	bits.and1(bits.neg().inc().and(one));
	while (bits.l | bits.h) {bits.rshift1(1); ++rotation;}
	if (++rotation >= 2) rotation -= 2;
    }
    return coord;
}
//]]>
