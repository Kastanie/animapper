class Animapper {
  /**
   * Loads, animate and maps an Animapper
   * @param {string} svgpath Path to SVG
   * @param {string} datapath Path to Data (json)
   * @param {HTMLElement} element HTML-Element to draw svg
   */
  constructor(svgpath, datapath, element, onClick) {
    this.id = element.getAttribute("id");
    this.svg = svgpath;
    this.element = element;
    this.datapath = datapath;
    this.interactives = [];
    this.animations = [];
    this.data = {};
    this.graphic = null;
    this.onClick = onClick;
    this._load();
  }

  _load() {
    this.loading = true;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", this.svg, false);
    xhr.overrideMimeType("image/svg+xml");
    var controller = this;
    xhr.onload = function (e) {
      controller.isactive = true;
      var svg = xhr.responseXML.documentElement;
      controller.graphic = svg;
      controller._onSVGLoaded();
    };
    xhr.send("");
  }

  _loadJSON(path, success) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          if (success) success(JSON.parse(xhr.responseText));
        } else {
          console.error("Problems to load JSON-File " + path);
        }
      }
    };
    xhr.open("GET", path, true);
    xhr.send();
  }

  _interactiveClick(element) {
    if (this.onClick != undefined) {
      this.onClick(element);
    }
  }

  getDataByElementId(id) {
    var id = id.replace("x5F_", "");
    if (id in this.data) {
      return this.data[id];
    }
    id = id.split("_")[0];
    if (id in this.data) {
      return this.data[id];
    }
    return null;
  }

  _onSVGLoaded() {
    console.log("SVG geladen: ", this.graphic);
    this.element.classList.add("complete");
    this.element.innerHTML = "";
    this.element.appendChild(this.graphic);
    var controller = this;
    this._loadJSON(this.datapath, function (data) {
      controller.data = data;
      console.log("JSON geladen: ", data);
      controller._process();
    });
  }

  _process() {
    this.interactives = document.querySelectorAll(`[id*="_interactive"]`);
    this.animations = document.querySelectorAll(`[id*="_animated"]`);

    var controller = this;
    for (var i = 0; i < this.interactives.length; i++) {
      var data = controller.getDataByElementId(this.interactives[i].id);
      var ai = new AnimapperInteractive(
        this.interactives[i],
        function (element) {
          controller._interactiveClick(element);
        },
        data
      );
      ai.parent = this;
    }

    for (i = 0; i < this.animations.length; i++) {
      var am = new AnimapperAnimation(this.animations[i]);
      am.parent = this;
    }
  }
}

class AnimapperInteractive {
  constructor(element, onClick, data) {
    this.data = data;
    this.parent = null;
    this.element = element;
    if (data) {
      if ("title" in data) {
        this.element.setAttribute("title", data.title);
        this.element.setAttribute("tabindex", "0");
        this.element.setAttribute("role", "button");
      }
    }
    this.element.classList.add("interactive");
    var controller = this;
    if (onClick != undefined) {
      this.element.addEventListener("click", function (e) {
        onClick(controller);
      });
    }
  }
}

class AnimapperAnimation {
  constructor(element) {
    this.element = element;
    this.parent = null;
    this.element.classList.add("animated");
    this.frames = this.element.children;
    this.animation = null;
    this.current = 0;
    if (this.frames.length) {
      this.start();
    }
  }

  start() {
    var controller = this;
    this.stop();
    this.animation = setInterval(function () {
      controller.render();
    }, 80);
  }

  render() {
    this.frames[this.current].style.display = "none";

    if (this.current + 1 < this.frames.length) {
      this.current++;
    } else {
      this.current = 0;
    }
    this.frames[this.current].style.display = "block";
  }

  stop() {
    if (this.animation) {
      clearInterval(this.animation);
      this.animation = null;
    }
  }
}
