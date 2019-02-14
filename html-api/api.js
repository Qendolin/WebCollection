var __xapi = {};
(function () {	
	var line = document.createElement("span")
	line.textContent="M"
	line.style.cssText = "line-height: normal !important;"+
		"display: inline !important;"+
		"font: initial !important;"+
		"padding: initial !important;"+
		"margin: initial !important;"+
		"border: initial !important;";
	document.body.append(line);
	__xapi.lineHeight = line.offsetHeight;
	line.remove();
})()
__xapi.isTouch = function() {
	var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
	var mq = function (query) {
		isTouch = window.matchMedia(query).matches;
		return isTouch;
	}
	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
		isTouch = true;
		return isTouch;
	}
	var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
	isTouch = mq(query);
	return isTouch;
}()
__xapi.html = document.getElementById("x-api").import;

Math.clamp = function (value, min, max) {
	return Math.min(Math.max(value, min), max)
}

class XElement extends HTMLElement {
	constructor() {
		super();
		this._mutationObserver = new MutationObserver(this._onMutate)
		this._mutationObserver.update = () => {
			this._mutationObserver.disconnect()
			this._mutationObserver.observe(this, this._mutationObserver.config)
		}
		this._mutationObserver.callbacks = {};
	}

	connectedCallback() {
		if(this._mutationObserver.config != null)
			this._mutationObserver.observe(this, this._mutationObserver.config)
	}

	disconnectedCallback() {
		this._mutationObserver.disconnect()
	}

	_onMutate(records, observer) {
		for(var i = 0; i < records.length; i++) {
			var r = records[i]
			if(r.type == "attributes") {
				this._mutationObserver.callbacks[r.attributeName](r.attributeName, r.attributeNamespace, this.getAttribute(r.attributeName), r.oldValue);
			}
		}
	}

	observeAttribute(name, cast, def, callback) {
		var cf = this._mutationObserver.config;
		var af = cf.attributeFilter;
		if(!af.includes(name)) {
			af.push(name);
			cf.attributes = true
			cf.attributeOldValue = true
			this._mutationObserver.callbacks[name] = (name, namespace, value, oldValue) => {
				if(cast) {
					try {
						value = JSON.parse(value)
					} catch {
						value = def;
					}
					try {
						oldValue = JSON.parse(oldValue)
					} catch {
						oldValue = def;
					}
				}
				callback(name, namespace, value, oldValue, def)
			}
			this._mutationObserver.update();
		}

		return this.getAttribute(name);
	}
}

class XSwitch extends XElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: "open"})
		this.shadow.appendChild(__xapi.html.getElementById("x-switch").content.cloneNode(true))
	}
}

class XScroll extends XElement {
	constructor() {
		super();
		if(__xapi.isTouch) {
			this.style.overflow="auto";
			return this;
		}
		this.inset = this.observeAttribute("data-scroll-inset", true, false, (name, _, value) => {
			this.inset = typeof value == "boolean" ? value : false;
		})
		//this.inset = (this.getAttribute("data-scroll-inset") || "false") == "true" ? true:false;
		this.scrollX = (this.getAttribute("data-scroll-x") || "false") == "true" ? true:false;
		this.scrollY = (this.getAttribute("data-scroll-y") || "true") == "false" ? false:true;
		if(this.scrollX) {
			this.scrollBarX = document.createElement("x--scroll-bar")
			this.scrollBarX.setAttribute("data-dir", "x")
			this.scrollBarX.addEventListener("mousedown", function(ev) {this._click("x", ev)}.bind(this))
			this.appendChild(this.scrollBarX)
			this.thumbX = document.createElement("x--scroll-thumb")
			this._dragX = function (ev) {this._drag("x", ev)}.bind(this)
			this.thumbX.addEventListener("mousedown", this._dragX)
			this.lastChild.appendChild(this.thumbX)
		}
		if(this.scrollY) {
			this.scrollBarY = document.createElement("x--scroll-bar")
			this.scrollBarY.setAttribute("data-dir", "y")
			this.scrollBarY.addEventListener("mousedown", function(ev) {this._click("y", ev)}.bind(this))
			this.appendChild(this.scrollBarY)
			this.thumbY = document.createElement("x--scroll-thumb")
			this._dragY = function (ev) {this._drag("y", ev)}.bind(this)
			this.thumbY.addEventListener("mousedown", this._dragY)
			this.lastChild.appendChild(this.thumbY)
		}
		this.addEventListener("wheel", this._onwheel.bind(this), {passive:false})
		document.addEventListener("keydown", this._keydown.bind(this))
		this.addEventListener("mouseover", this._mousehover.bind(this))
		this.ox = 0;
		this.oy = 0;
		this.isUnderMouse = false;
		observe(this, {childList:true,subtree:true,attributes:true,attributeFilter:["height","width","margin"]}, this.update.bind(this))
		this.update()
	}

	update() {
		console.log("Update")
		if(this.scrollY) {
			this._clientHeight = this.clientHeight;
			this._offsetHeight = this.offsetHeight;
			this._scrollHeight = this.scrollHeight;
			if(!this.inset && this.scrollX) this._scrollHeight += this.scrollBarX.scrollHeight;
			this.heightDifference = this._scrollHeight-this._offsetHeight
			this.ratioY = this._offsetHeight / this._scrollHeight
			this.thumbHeight = this.ratioY*this._clientHeight
			if(this.scrollX) {
				this.thumbHeight = this.ratioY*(this._clientHeight-this.scrollBarX.scrollHeight)
			} else 
				this.thumbHeight = this.ratioY*this._clientHeight
			this.thumbY.style.height = this.thumbHeight + "px"
			this.scroll(0, "y")
			this._boundingClientRectY = this.scrollBarY.getBoundingClientRect();
		}
		if(this.scrollX) {
			this._clientWidth = this.clientWidth;
			this._offsetWidth = this.offsetWidth;
			this._scrollWidth = this.scrollWidth;
			if(!this.inset && this.scrollY) this._scrollWidth += this.scrollBarY.scrollWidth;
			this.widthDifference = this._scrollWidth-this._offsetWidth;
			this.ratioX = this._offsetWidth / this._scrollWidth
			if(this.scrollY) {
				//var ywidth = this.scrollBarY.scrollWidth;
				this.thumbWidth = this.ratioX*(this._clientWidth-this.scrollBarY.scrollWidth)
				//this.widthDifference = this._scrollWidth-this._offsetWidth+ywidth
			} else {
				this.thumbWidth = this.ratioX*this._clientWidth
			}
			this.thumbX.style.width = this.thumbWidth + "px"
			this.scroll(0, "x")
			this._boundingClientRectX = this.scrollBarX.getBoundingClientRect();
		}
	}

	_click(dir, ev) {
		var rect = dir=="x"?this._boundingClientRectX:this._boundingClientRectY
		var delta;
		if(dir=="x") {
			if(ev.clientX - rect.left <= -this.ox+this.thumbWidth/2) delta = -1;
			else delta = 1;
		} else if(dir=="y") {
			if(ev.clientY - rect.top <= -this.oy+this.thumbHeight/2) delta = -1;
			else delta = 1;
		}
		if(!this.scroll(delta*this._clientHeight*0.875, dir)) return;
		ev.stopPropagation();
	}

	_mousehover(ev) {
		if(ev.type == "mouseover") {
			this.isUnderMouse = true;
			this._mousehover.mouseout = this._mousehover.bind(this)
			this.addEventListener("mouseout", this._mousehover.mouseout)
		} else if(ev.type == "mouseout") {
			this.isUnderMouse = false;
			this.addEventListener("mouseout", this._mousehover.mouseout)
		}
	}

	_drag(dir, ev) {
		switch(ev.type) {
			case "mousemove":
			var delta = dir=="x"?(event.screenX-this._drag.lastCurPos.x)/this.ratioX : 
				(event.screenY-this._drag.lastCurPos.y)/this.ratioY;
			if(!this.scroll(delta, dir)) {
				ev.preventDefault();
				return;
			}
			break;
			case "mousedown":
			this[dir=="x"?"thumbX":"thumbY"].style.transition="unset";
			this.children[0].style.transition="unset";
			document.addEventListener("mouseup", dir == "x" ? this._dragX : this._dragY)
			document.addEventListener("mousemove", dir == "x" ? this._dragX : this._dragY)
			break;
			case "mouseup":
			this[dir=="x"?"thumbX":"thumbY"].style.transition="";
			this.children[0].style.transition="";
			document.removeEventListener("mouseup", dir == "x" ? this._dragX : this._dragY)
			document.removeEventListener("mousemove", dir == "x" ? this._dragX : this._dragY)
			break;
		}
		this._drag.lastCurPos = {x: ev.screenX, y: ev.screenY};
		ev.preventDefault();
		ev.stopPropagation();
	}

	_keydown(ev) {
		if(!this.isUnderMouse) return;
		var delta;
		var dir;
		switch(ev.key) {
			case "Down":
			case "ArrowDown":
			dir="y"
			delta=1
			break;
			case "Up":
			case "ArrowUp":
			dir="y"
			delta=-1
			break;
			case "Right":
			case "ArrowRight":
			dir="x"
			delta=1
			break;
			case "Left":
			case "ArrowLeft":
			dir="x"
			delta=-1
		}
		if(!dir) return
		if(!this.scroll(delta*40, dir)) return;
		ev.stopPropagation()
		ev.preventDefault()
	}

	_onwheel(ev) {
		var delta;
		var dir;
		if(this.scrollX && (ev.shiftKey || ev.deltaX))
			dir = "x";
		if(this.scrollY && ev.deltaY && !ev.shiftKey)
			dir = "y";
		if(!dir) return;
		delta = ev.deltaX || ev.deltaY;
		if (ev.deltaMode == 1) {
			delta *= __xapi.lineHeight;
		} else if (ev.deltaMode == 2) {
			delta = dir=="x"?this._clientWidth:this._clientHeight;
		}
		if(!delta) return;
		if(!this.scroll(delta, dir)) return;
		ev.stopPropagation()
		ev.preventDefault()
	}

	scroll(delta, dir) {
		if(dir == "x" && this.scrollX) {
			if((this.ox == 0 && delta <= 0) || (this.ox==-this.widthDifference && delta >= 0)) return false;
			this.ox=Math.clamp(this.ox-delta,-this.widthDifference,0)
			this.children[0].style.transform = `translate(${this.ox}px, ${this.oy}px)`
			var thumbX = this.ox*-100/this._offsetWidth;
			this.thumbX.style.transform = `translateX(${thumbX}%)`
		}
		else if(dir == "y" && this.scrollY) {
			if((this.oy == 0 && delta <= 0) || (this.oy==-this.heightDifference && delta >= 0)) return false;
			this.oy=Math.clamp(this.oy-delta,-this.heightDifference,0)
			this.children[0].style.transform = `translate(${this.ox}px, ${this.oy}px)`
			var thumbY = this.oy*-100/this._offsetHeight;
			this.thumbY.style.transform = `translateY(${thumbY}%)`
		}
		return true;
	}

	set scrollTop(val) {
		this.scroll(this.oy+val, "y")
	}

	get scrollTop() {
		return -this.oy;
	}

	set scrollLeft(val) {
		this.scroll(this.ox+val, "x")
	}

	get scrollLeft() {
		return -this.ox;
	}
}

onload = () => {
	WebComponents.waitFor(() => {
		customElements.define("x-scroll", XScroll)
		customElements.define("x-switch", XSwitch)
	})
}

function observe(elem, init, callback) {
	let disable = false;
	var os = new MutationObserver(function (mut) {
		if(disable) return;
		disable = true;
		callback(mut);
		requestAnimationFrame(() => disable = false)
	});
	os.observe(elem, init)
}

