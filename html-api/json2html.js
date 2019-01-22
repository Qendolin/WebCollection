var JSHN = {
	parse(struct) {
		var frag = document.createDocumentFragment();
		var walk = function (struct, elem, parent) {
			for(const key in struct) {
				var value = struct[key];
				if(key === "_init") {
					value.call(struct, elem, parent);
				} else if(elem != null && key in elem) {
					elem[key] = value
				} else if(typeof value === "object") {
					var child = document.createElement(key);
					parent.appendChild(child)
					walk(value, child, elem || parent);
				} else {
					console.log(`Unknown behavoir for ${key}: ${JSON.stringify(value)}`);
				}
			}
		}
		walk(struct, null, frag);
		return frag;
	}
}

/*
	{
		div: {
			style: {
				color: red,
				backgroundColor: white
			},
			button: {
				onclick: () => {
					alert(1)
				}
			}
		}
	}

*/