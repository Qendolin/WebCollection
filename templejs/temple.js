function temple(namespace, name) {
    //TODO: check if ns and name are set
    var ret = new Promise(async function(resolve, reject) {
        if(temple.__internal.includes.included[namespace] == null) {
            if(temple.__internal.includes.includesDefer[namespace] == null) {
                var res, rej
                var prom = new Promise(function(resolve, reject) {
                    res = resolve
                    rej = reject
                })
                prom.resolve = res
                prom.reject = rej
                temple.__internal.includes.includesDefer[namespace] = prom
            }
            var rejected = false
            await temple.__internal.includes.includesDefer[namespace].catch(function() {
                reject(`Namespace '${namespace}' was used but never included`)
                rejected = true
            })
            if(rejected) return
        }
        const include = temple.__internal.includes.included[namespace]
        if(include.loaded == true) {
            resolve(include.templets[name])
            return
        }
        await include.loaded
        var template
        if(template = include.templets[name]) {
            resolve(template)
            return
        }
        reject(`Template '${name}' does not exist in namespace '${namespace}'`)
        return
    })
    return ret
}

temple.__internal = {
    includes: {
        domParser: new DOMParser(),
        included: {},
        includesDefer: {}
    }
};


window.addEventListener("load", function() {
    for(const prom of Object.values(temple.__internal.includes.includesDefer)) {
        prom.reject()
    }
})

temple.__internal.log = function (arg) {
    if(temple.__internal.log.enabled) {
        temple.__internal.log(arg)
    }
}

temple.__internal.warn = function (arg) {
    if(temple.__internal.warn.enabled) {
        temple.__internal.warn(arg)
    }
}
temple.__internal.warn.enabled = true


temple.include = function(url, namespace) {
    temple.__internal.log(`including ${url} as ${namespace}`)
    temple.__internal.includes.included[namespace] = new temple.__internal.includes.include(url)
    var prom;
    if(prom = temple.__internal.includes.includesDefer[namespace]) {
        prom.resolve()
    }
}

temple.__internal.includes.include = class {
    constructor(url) {
        this.templets = {}
        var that = this
        this.loaded = new Promise(function(resolve, reject) {
            temple.__internal.log(`Fetching include ${url}`)
            fetch(url).then(function (resp) {
                //TODO: Error checking (resp.ok / resp.status)
                return resp.text()
            }).then(function (html) {
                const parser = temple.__internal.includes.domParser
                var doc = parser.parseFromString(html, "text/html")
                var templets = doc.getElementsByTagName("templet")
                for (const elem of templets) {
                    var name = elem.getAttribute("name")
                    //TODO: check if name valid
                    that.templets[name] = elem
                }
                resolve(that)
                that.loaded = true
            })
        })
    }
}

temple.__internal.temple = class extends HTMLElement {
    constructor() {
        super()
        if(!("isConnected" in this))
            this.isConnected = false
        this.isBuilding = false
    }
    disconnectedCallback() {
        if(!("isConnected" in this))
            this.isConnected = false
    }
    connectedCallback() {
        if(this.isBuilding == true) {
            temple.__internal.log(`Template ${name} is already building`)
            return
        }
        if(!("isConnected" in this))
            this.isConnected = true
        this.isBuilding = true
        var name = this.getAttribute("name")
        temple.__internal.log("Building "+name)
        name = name.split("/", 2)
        this.reference = {
            namespace: name[0],
            name: name[1]
        }

        var thatSlots = {}
        for (const slot of this.getElementsByTagName("t-slot")) {
            thatSlots[slot.getAttribute("name")] = slot
        }
        var that = this
        var fragment = new DocumentFragment()
        temple(this.reference.namespace, this.reference.name).then(function (node) {
            if(that.isConnected == false) {
                temple.__internal.log(`Template ${name} is no longer connected`)
                that.isBuilding = false
                return
            }
            temple.__internal.log(`Template for ${name} loaded, now processing`)
            fragment.append.apply(fragment, node.childNodes)
            for (const slot of fragment.querySelectorAll("t-slot")) {
                var filling
                if(filling = thatSlots[slot.getAttribute("name")]) {
                    var range = document.createRange()
                    range.selectNodeContents(filling)
                    var fillingContent = range.cloneContents()
                    range.selectNodeContents(slot)
                    range.deleteContents()
                    slot.appendChild(fillingContent)
                }
            }
            that.replaceWith(fragment)
            temple.__internal.log(`Template for ${name} done`)
        }).catch(function(error) {
            temple.__internal.warn(error)
        })
    }
}

customElements.define("t-temple", temple.__internal.temple)

const T = temple