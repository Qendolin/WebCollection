var cv;
var ctx;
var audioCtx;
var layers = [];
var scene;
var input;

const Rad2Deg = (180/Math.PI);
const Deg2Rad = 1 / Rad2Deg;
const UD = undefined;

Number.prototype.isInt = function() {
    return this % 1 === 0;
}

class Observable {
    /**
     * 
     * @param {*} target The element on which has the traps
     * @param {*} values The values that should be trapped and their values or undefined if all should be trapped. 
     * e.g.: ['rotation', 20, 'partent', null]
     * @param {*} onset function(root, property, oldValue, newValue)
     * @param {*} onget function(root, property)
     */
    constructor(target, values, onset, onget) {
        this.onset = onset;
        this.onget = onget;
        if(values) {
            for(var i = 0; i < values.length; i+=2) {
                let prop = values[i];
                let val = values[i+1]
                Object.defineProperty(target, prop, {
                    set: (nv) => {
                        if(this.onset) this.onset(target, prop, val, nv)
                        val = nv;
                    },
                    get: () => {
                        if(this.onget) this.onget(target, prop)
                        return val;
                    }
                })
            }
        } else {
            this.get = (target, prop) => {
                if(this.onget) this.onget(target, prop)
                return target[prop];
            }
            this.set = (target, prop, val) => {
                if(this.onset) this.onset(target, prop, target[prop], val)
                target[prop] = val;
                return true;
            }
            return new Proxy(target, this);
        }
    }
}

class multi {
    static inherit(..._bases) {
        class classes {
            get base() { return _bases; }

            constructor(..._args) {
                var index = 0;
                for (let b of this.base) {
                    let obj = new b(_args[index++]);
                    multi.copy(this, obj);
                }
            }
        }
        for (let base of _bases) {
            multi.copy(classes, base);
            multi.copy(classes.prototype, base.prototype);
        }
        return classes;
    }

    static copy(_target, _source) {
        for (let key of Reflect.ownKeys(_source)) {
            if (key !== "constructor" && key !== "prototype" && key !== "name") {
                let desc = Object.getOwnPropertyDescriptor(_source, key);
                Object.defineProperty(_target, key, desc);
            }
        }
    }
}   

class Style {
    constructor(fill = "#000000", stroke = "#ff0000", strokeWidth = 5) {
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = strokeWidth
    }
}

class Sprite {
    constructor(dim = {w:100, h:100}, pos = {x:0, y:0}, rot = 0, scl = {x:1, y:1}, piv = {x:0, y:0}) {
        this.pos = new Observable(pos, UD, () => this._markTransformUpdate());
        new Observable(this, ["rot", rot], () => this._markTransformUpdate());
        this.scl = new Observable(scl, UD, () => this._markTransformUpdate());
        this.dim = dim
        this.piv = piv
        this._updateTransform();
    }

    render(ctx) {}

    _markTransformUpdate() {
        this._shouldUpdateTransform = true;
    }

    _updateTransform() {
        var a = this.scl.x*Math.cos(Deg2Rad*this.rot);
        var b = this.scl.x*Math.sin(Deg2Rad*this.rot);
        var c = -this.scl.y*Math.sin(Deg2Rad*this.rot);
        var d = this.scl.y*Math.cos(Deg2Rad*this.rot);
        var e = this.pos.x;
        var f = this.pos.y;
        this._transformMat = [a, b,
                              c, d,
                              e, f]
    }

    _transform(ctx) {
        if(this._shouldUpdateTransform === true) {
            this._updateTransform()
            this._shouldUpdateTransform = false;
        }
        ctx.transform.apply(ctx, this._transformMat)
    }
    _style(ctx, style) {
        ctx.lineWidth = style.strokeWidth
        ctx.strokeStyle = style.stroke
        ctx.stroke();
        ctx.fillStyle = style.fill
        ctx.fill();
    }

    translate(x = null, y = null) {
        if(x != null)
            this.pos.x+=x
        if(y != null)
            this.pos.y+=y
    }

    position(piv, pos) {
        this.pos.x = pos.x + this.dim.w*piv.x;
        this.pos.y = pos.y + this.dim.y*piv.y;
    }

    rotate(deg) {
        this.rot += deg
    }

    scale(x, y) {
        this.scl.x+=x;
        this.scl.y+=y==null?x:y;
    }

    remove() {
        this.layer.splice(this.layer.indexOf(this), 1)
    }
}

class EllipseSprite extends Sprite {
    constructor(dim, pos, rot, scl, piv, style = new Style()) {
        super(dim, pos, rot, scl, piv)
        this.style = style
    }

    render(ctx) {
        ctx.save()
        this._transform(ctx)
        ctx.beginPath()
        ctx.ellipse(-this.piv.x*this.dim.w, -this.piv.y*this.dim.h, this.dim.w/2., this.dim.h/2., 0, 0, 2 * Math.PI);
        ctx.closePath()
        this._style(ctx, this.style)
        ctx.restore()
    }
}

class CircleSprite extends EllipseSprite {
    constructor(diameter, pos, scl, style = new Style()) {
        super({w: diameter, h:diameter}, pos, 0, scl, style)
    }

    get diameter() {
        return (this.dim.w+this.dim.h)/2;
    }

    set diameter(d) {
        this.dim.w = this.dim.h = d;
    }

    get radius() {
        return (this.dim.w+this.dim.h)/4;
    }
}


class PolySprite extends Sprite {
    /*
        shape: float[2][] - Vertex positions in percent
    */
    constructor(shape, dim, pos, rot, scl, piv, style = new Style()) {
        super(dim, pos, rot, scl, piv)
        this.shape = shape
        this.style = style
    }

    render(ctx) {
        ctx.save()
        this._transform(ctx)
        var x = -this.piv.x*this.dim.w
        var y = -this.piv.y*this.dim.h
        var width = this.dim.h
        var height = this.dim.w
        ctx.beginPath()
        for (let i = 0; i < this.shape.length; i++) {
            var p = this.shape[i];
            var px = p[0]*width+x
            var py = p[1]*height+y
            if(i == 0) {
                ctx.moveTo(px, py)
            } else {
                ctx.lineTo(px, py)
            }
        }
        ctx.closePath()
        this._style(ctx, this.style)
        ctx.restore()
    }
}

class RectSprite extends Sprite {
    constructor(dim, pos, rot, scl, piv, style = new Style()) {
        super(dim, pos, rot, scl, piv)
        this.style = style
    }

    render(ctx) {
        ctx.save()
        this._transform(ctx)
        ctx.beginPath()
        ctx.rect(-this.piv.x*this.dim.w, -this.piv.y*this.dim.h, this.dim.w, this.dim.h)
        ctx.closePath()
        this._style(ctx, this.style)
        ctx.restore()
    }
}

class ImageSprite extends Sprite {
    /*
        img: ImageBitmap
    */
    constructor(img, pos, rot, scl, piv) {
        super({w:img.width, h:img.height}, pos, rot, scl, piv)
        this.img = img
    }

    render(ctx) {
        ctx.save()
        this._transform(ctx)
        ctx.drawImage(this.img, -this.piv.x*this.dim.w, -this.piv.y*this.dim.h, this.dim.w, this.dim.h)
        ctx.restore()
    }
}

class Pos {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
    
    add(pos, y = null) {
        if(y == null) {
            this.x += pos.x
            this.y += pos.y
        } else {
            this.x += pos;
            this.y += y;
        }
    }

    sub(pos, y = null) {
        if(y == null) {
            this.x -= pos.x
            this.y -= pos.y
        } else {
            this.x -= pos;
            this.y -= y;
        }
    }

    mul(pos, y = null) {
        if(y == null) {
            this.x *= pos.x
            this.y *= pos.y
        } else {
            this.x *= pos;
            this.y *= y;
        }
    }

    cpy() {
        return new Pos(this.x, this.y)
    }
}

class Relative {
    constructor(parent = null, width = 100, height = 100, x = 0, y = 0) {
        this.x = x;
        this.y = y;
        if(parent.constructor.name === "CanvasRenderingContext2D") {
            this.width = ctx.canvas.clientWidth;
            this.height = ctx.canvas.clientHeight;
        } else {
            this.parent = parent;
            this.width = width;
            this.height = height;
        }
    }

    relPos(p) {
        if(p.constructor.name === "Pos")
            return p.cpy().add(this.position)
        console.error("Invalid Type: "+p.constructor.name)
    }

    relX(x) {
        return x * this.width + this.position.x
    }

    relY(y) {
        return y * this.height + this.position.y
    }

    relLen(p) {
        if(p.constructor.name === "Pos")
            return p.cpy().mul(this.position)
        console.error("Invalid Type: "+p.constructor.name)
    }

    relW(width) {
        return this.width * width
    }

    relH(height) {
        return this.height * height
    }

    get offset() {
        return new Pos(this.x, this.y)
    }

    get position() {
        if(this.parent == null)
            return this.offset
        return this.offset.add(parent.position)
    }
}

class Layer extends multi.inherit(Relative, Array) {
    constructor(parent = null, width = 100, height = 100, x = 0, y = 0, drawOrder = 1) {
        super(parent, x, y, width, height)
        this.drawOrder = drawOrder;
    }

    push(elem) {
        elem.layer = this
        super.push(elem)
    }
}

class Actor {
    /**
     * 
     * @param {*} init 
     * @param {*} actFunc Must not be lambda
     * @param {*} sprite 
     */
    constructor(init, actFunc, sprite) {
        this.actFunc = actFunc
        this.sprite = sprite
        if(init != null)
            init.call(this);
    }

    act(ctx, frame, time, delta) {
        if(this.actFunc != null)
            this.actFunc.call(this, ctx, frame, time, delta)
    }

    render(ctx) {
        if(this.sprite != null)
            this.sprite.render(ctx)
    }

    remove() {
        this.layer.splice(this.layer.indexOf(this), 1)
    }
}

class SoundSource {
    constructor(file, actx, then) {
        var request = new XMLHttpRequest();
        request.open('GET', file, true);
        request.responseType = 'arraybuffer';
        var self = this;
        request.onload = function() {
            var data = request.response;
            actx.decodeAudioData(data).then(function(buffer) {
                self.buffer = buffer;
                console.log("Loaded Sound \""+file+"\"");
                if(then)
                    then();
            }).catch(function(error) {
                console.error(error);
                if(then)
                    then();
            });
        };
        request.send();
    }

    play(actx) {
        var source = new Sound(actx, this.buffer);
        source.start();
        return source;
    }

    newInstance(actx) {
        return new Sound(actx, this.buffer);
    }
}

class Sound {
    constructor(actx, buffer) {
        this.source = actx.createBufferSource();
        if(buffer == null) {
            console.warn("Creating sound with null buffer");
        }
        this.source.buffer = buffer;
        this.source.connect(actx.destination);
        this.state = 0;
    }

    stop() {
        if(this.state === 2) {
            console.warn("Sound is already stopped");
            return;
        } else if(this.state === 0) {
            console.warn("Sound has not been started");
            return;
        }
        this.source.stop();
        this.source.disconnect();
        this.source = undefined;
        clearTimeout(this.timeout);
        this.state = 2;
    }

    start() {
        if(this.state === 1) {
            console.warn("Sound is already started");
            return;
        } else if(this.state === 2) {
            console.warn("Sound has already been stopped, cannot resume");
            return;
        }
        this.source.start();
        this.timeout = setTimeout(() => {
            this.stop();
        }, (this.source.buffer.duration+0.1)*1000);
        this.state = 1;
    }
}

class WaitGroup {
    constructor(size = null) {
        this.size = size || 0;
    }

    start(count = 1) {
        this.size+=count;
    }

    stop() {
        this.size--;
        if(this.size == 0 && this.then != null) this.then();
        if(this.size < 0) console.warn("Invalid use of waitgroup. More stoppped than started")
    }

    then(func) {
        this.then = func;
    }
}

class Scene {
    init() {}
    start() {}
    //render() {}
    stop() {}
    pause() {}
    resume() {}
}

class AssetLoader {
    constructor() {
        this.requests = 0;
        this.downloaded = 0;
        this.total = 0;
    }
    load(file, type) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", file, true);
            xhr.responseType = type||xhr.responseType;
            xhr.onload = function() {
                this.requests--;
                if(xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(xhr);
                }
            }.bind(this)
            xhr.onerror = function() {
                if(xhr.type=="load") return;
                this.requests--;
                reject(xhr);
            }.bind(this)
            var addedToTotal = false;
            xhr.onprogress = function(event) {
                if(addedToTotal == false) {
                    this.total += event.total;
                }
                this.downloaded += event.loaded;
            }.bind(this)
            this.requests++;
            xhr.send();
        }.bind(this))
    }

    get progress() {
        return this.downloaded / this.total;
    }
}

function isJustBefore(now, delta, time) {
    if(now <= time) {
        if(now - delta > time) {
            return true;
        }
        return false
    }
    return false;
}

function isJustAfter(now, delta, time) {
    if(now >= time) {
        if(now - delta < time) {
            return true;
        }
        return false
    }
    return false;
}

//Get Element By Id
function gebi(id) {
    return document.getElementById(id)
}

function setScene(scene) {
    if(window.scene)
        window.scene.stop();
    window.scene = scene;
    layers = [];
    if(scene.init)
        scene.init();
}

class InputHandler {
    constructor() {
        /*
         * KeySates: 
         * -2: Up
         * -1: Just Up
         * 0: Queued for Up
         * 1: Queued for Down
         * 2: Just Down
         * 3: Down
         */
        this.keyStates = {};
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));
    }

    _onKeyDown(ev) {
        this.keyStates[ev.key] = 1;
    }
    _onKeyUp(ev) {
        this.keyStates[ev.key] = 0;
    }

    update() {
        for (const key of Object.keys(this.keyStates)) {
            if(this.keyStates[key] === 1) this.keyStates[key] = 2;
            else if(this.keyStates[key] === 2) this.keyStates[key] = 3;
            else if(this.keyStates[key] === 0) this.keyStates[key] = -1;
            else if(this.keyStates[key] === -1) this.keyStates[key] = -2;
        }
    }

    isJustDown(key) {
        return this.keyStates[key] == 2;
    }

    isJustUp(key) {
        return this.keyStates[key] == -1;
    }

    isDown(key) {
        return this.keyStates[key] >= 2;
    }

    isUp(key) {
        return this.keyStates[key] <= -1;
    }
}

input = new InputHandler();