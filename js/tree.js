function TreeView() {
  this._eventListeners = {};

  this._container = document.createElement("div");
  this._container.className = "treeViewContainer";
  this._container.setAttribute("tabindex", "0"); // make it focusable

  this._header = document.createElement("ul");
  this._header.className = "treeHeader";
  this._container.appendChild(this._header);

  this._verticalScrollbox = document.createElement("div");
  this._verticalScrollbox.className = "treeViewVerticalScrollbox";
  this._container.appendChild(this._verticalScrollbox);

  this._leftColumnBackground = document.createElement("div");
  this._leftColumnBackground.className = "leftColumnBackground";
  this._verticalScrollbox.appendChild(this._leftColumnBackground);

  this._horizontalScrollbox = document.createElement("ol");
  this._horizontalScrollbox.className = "treeViewHorizontalScrollbox";
  this._verticalScrollbox.appendChild(this._horizontalScrollbox);

  var self = this;
  this._container.onkeypress = function (e) {
    self._onkeypress(e);
  };
  this._container.onclick = function (e) {
    self._onclick(e);
  };
  this._setUpScrolling();
};

TreeView.prototype = {
  getContainer: function TreeView_getContainer() {
    return this._container;
  },
  setColumns: function TreeView_setColumns(columns) {
    this._header.innerHTML = "";
    for (var i = 0; i < columns.length; i++) {
      var li = document.createElement("li");
      li.className = "treeColumnHeader treeColumnHeader" + i;
      li.id = columns[i].name + "Header";
      var span = document.createElement("span");
      span.textContent = columns[i].title;
      li.appendChild(span);
      this._header.appendChild(li);
    }
  },
  display: function TreeView_display(data) {
    this._horizontalScrollbox.innerHTML = "";
    var firstElem = this._createTree(data.data[0]); 
    this._horizontalScrollbox.appendChild(firstElem);
    this._select(firstElem);
    this._toggle(firstElem);
    this._container.focus();
  },
  addEventListener: function TreeView_addEventListener(eventName, callbackFunction) {
    if (!(eventName in this._eventListeners))
      this._eventListeners[eventName] = [];
    if (this._eventListeners[eventName].indexOf(callbackFunction) != -1)
      return;
    this._eventListeners[eventName].push(callbackFunction);
  },
  removeEventListener: function TreeView_removeEventListener(eventName, callbackFunction) {
    if (!(eventName in this._eventListeners))
      return;
    var index = this._eventListeners[eventName].indexOf(callbackFunction);
    if (index == -1)
      return;
    this._eventListeners[eventName].splice(index, 1);
  },
  _fireEvent: function TreeView__fireEvent(eventName, eventObject) {
    if (!(eventName in this._eventListeners))
      return;
    this._eventListeners[eventName].forEach(function (callbackFunction) {
      callbackFunction(eventObject);
    });
  },
  _setUpScrolling: function TreeView__setUpScrolling() {
    var waitingForPaint = false;
    var accumulatedDeltaX = 0;
    var accumulatedDeltaY = 0;
    var self = this;
    function scrollListener(e) {
      if (!waitingForPaint) {
        window.mozRequestAnimationFrame(function () {
          self._horizontalScrollbox.scrollLeft += accumulatedDeltaX;
          self._verticalScrollbox.scrollTop += accumulatedDeltaY;
          accumulatedDeltaX = 0;
          accumulatedDeltaY = 0;
          waitingForPaint = false;
        });
        waitingForPaint = true;
      }
      if (e.axis == e.HORIZONTAL_AXIS) {
        accumulatedDeltaX += e.detail;
      } else {
        accumulatedDeltaY += e.detail;
      }
      e.preventDefault();
    }
    this._verticalScrollbox.addEventListener("MozMousePixelScroll", scrollListener, false);
    this._verticalScrollbox.cleanUp = function () {
      self._verticalScrollbox.removeEventListener("MozMousePixelScroll", scrollListener, false);
    };
  },
  _scrollHeightChanged: function TreeView__scrollHeightChanged() {
    this._leftColumnBackground.style.height = this._horizontalScrollbox.getBoundingClientRect().height + 'px';
  },
  _createTree: function TreeView__createTree(data) {
    var li = document.createElement("li");
    li.className = "treeViewNode collapsed";
    var hasChildren = ("children" in data) && (data.children.length > 0);
    if (!hasChildren)
      li.classList.add("leaf");
    var treeLine = document.createElement("div");
    treeLine.className = "treeLine";
    treeLine.innerHTML = this._HTMLForFunction(data);
    li.treeLine = treeLine;
    li.data = data;
    li.appendChild(treeLine);
    li.treeChildren = [];
    li.treeParent = null;
    li.tree = this;
    if (hasChildren) {
      var ol = document.createElement("ol");
      ol.className = "treeViewNodeList";
      for (var i = 0; i < data.children.length; ++i) {
        var innerTree = this._createTree(data.children[i]);
        if (innerTree) {
          innerTree.treeParent = li;   
          ol.appendChild(innerTree);
          li.appendChild(ol);
          li.treeChildren.push(innerTree);
        }
      }
    }
    return li;
  },
  _HTMLForFunction: function TreeView__HTMLForFunction(node) {
    return '<input type="button" value="Expand / Collapse" class="expandCollapseButton" tabindex="-1"> ' +
      '<span class="sampleCount">' + node.counter + '</span> ' +
      '<span class="samplePercentage">' + (100 * node.ratio).toFixed(1) + '%</span> ' +
      '<span class="selfSampleCount">' + node.selfCounter + '</span> ' +
      '<span class="functionName">' + node.name + '</span>' +
      '<span class="libraryName">' + node.library + '</span>';
  },
  _toggle: function TreeView__toggle(div, /* optional */ newCollapsedValue, /* optional */ suppressScrollHeightNotification) {
    if (newCollapsedValue === undefined) {
      div.classList.toggle("collapsed");
    } else {
      if (newCollapsedValue)
        div.classList.add("collapsed");
      else
        div.classList.remove("collapsed");
    }
    if (!suppressScrollHeightNotification)
      this._scrollHeightChanged();
  },
  _toggleAll: function TreeView__toggleAll(subtreeRoot, /* optional */ newCollapsedValue) {
    // Expands / collapses all child nodes, too.
    if (newCollapsedValue === undefined)
      newCollapsedValue = !this._isCollapsed(subtreeRoot);
    this._toggle(subtreeRoot, newCollapsedValue);
    var subtree = subtreeRoot.querySelectorAll('.treeViewNode');
    for (var i = 0; i < subtree.length; ++i) {
      this._toggle(subtree[i], newCollapsedValue, true);
    }
    this._scrollHeightChanged();
  },
  _getParent: function TreeView__getParent(div) {
    return div.treeParent;
  },
  _getFirstChild: function TreeView__getFirstChild(div) {
    if (this._isCollapsed(div))
      return null;
    var child = div.treeChildren[0];
    return child;
  },
  _getLastChild: function TreeView__getLastChild(div) {
    if (this._isCollapsed(div))
      return div;
    var lastChild = div.treeChildren[div.treeChildren.length-1];
    if (lastChild == null)
      return div;
    return this._getLastChild(lastChild);
  },
  _getPrevSib: function TreeView__getPevSib(div) {
    if (div.treeParent == null)
      return null;
    var nodeIndex = div.treeParent.treeChildren.indexOf(div);
    if (nodeIndex == 0)
      return null;
    return div.treeParent.treeChildren[nodeIndex-1];
  },
  _getNextSib: function TreeView__getNextSib(div) {
    if (div.treeParent == null)
      return null;
    var nodeIndex = div.treeParent.treeChildren.indexOf(div);
    if (nodeIndex == div.treeParent.treeChildren.length - 1)
      return this._getNextSib(div.treeParent);
    return div.treeParent.treeChildren[nodeIndex+1];
  },
  _scrollIntoView: function TreeView__scrollIntoView(parentScrollbox, element, maxImportantWidth) {
    // Make sure that element is inside the visible part of parentScrollbox by
    // adjusting the scroll position of parentScrollbox. If element is wider or
    // higher than the scroll port, the left and top edges are prioritized over
    // the right and bottom edges.
    // If maxImportantWidth is set, parts of the beyond this widths are
    // considered as not important; they'll not be moved into view.

    if (maxImportantWidth === undefined)
      maxImportantWidth = Infinity;

    // We can't use getBoundingClientRect() on the parentScrollbox because that
    // would give us the outer size of the scrollbox, and not the actually
    // visible part of the scroll viewport (which might be smaller due to
    // scrollbars). So we use offsetLeft/Top and clientWidth/Height.
    var r = element.getBoundingClientRect();
    var right = Math.min(r.right, r.left + maxImportantWidth);
    var leftCutoff = parentScrollbox.offsetLeft - r.left;
    var rightCutoff = right - (parentScrollbox.offsetLeft + parentScrollbox.clientWidth);
    var topCutoff = parentScrollbox.offsetTop - r.top;
    var bottomCutoff = r.bottom - (parentScrollbox.offsetTop + parentScrollbox.clientHeight);
    if (leftCutoff > 0)
      parentScrollbox.scrollLeft -= leftCutoff;
    else if (rightCutoff > 0)
      parentScrollbox.scrollLeft += Math.min(rightCutoff, -leftCutoff);
    if (topCutoff > 0)
      parentScrollbox.scrollTop -= topCutoff;
    else if (bottomCutoff > 0)
      parentScrollbox.scrollTop += Math.min(bottomCutoff, -topCutoff);
  },
  _select: function TreeView__select(li) {
    if (li.tree != this)
      throw "supplied element isn't part of this tree";
    if (this.selected != null) {
      this.selected.id = "";
      this.selected.treeLine.classList.remove("selected");
      this.selected = null;
    }
    if (li) {
      li.id = "selected";
      li.treeLine.classList.add("selected");
      li.tree.selected = li;
      var functionName = li.treeLine.querySelector(".functionName");
      this._scrollIntoView(li.tree._verticalScrollbox, functionName, 400);
      this._fireEvent("select", li.data);
    }
  },
  _selected: function TreeView__selected() {
    return this.selected;
  },
  _isCollapsed: function TreeView__isCollapsed(div) {
    return div.classList.contains("collapsed");
  },
  _getParenttreeViewNode: function TreeView__getParenttreeViewNode(node) {
    while (node) {
      if (node.nodeType != node.ELEMENT_NODE)
        break;
      if (node.classList.contains("treeViewNode"))
        return node;
      node = node.parentNode;
    }
    return null;
  },
  _onclick: function TreeView__onclick(event) {
    var target = event.target;
    var node = this._getParenttreeViewNode(target);
    if (!node)
      return;
    if (target.classList.contains("expandCollapseButton")) {
      if (event.altKey)
        this._toggleAll(node);
      else
        this._toggle(node);
    } else {
      this._select(node);
      if (event.detail == 2) // dblclick
        this._toggle(node);
    }
  },
  _onkeypress: function TreeView__onkeypress(event) {
    var selected = this._selected();
    if (event.keyCode < 37 || event.keyCode > 40) {
      if (event.keyCode != 0 ||
          String.fromCharCode(event.charCode) != '*') {
        return;
      }
    }
    event.stopPropagation();
    event.preventDefault();
    if (selected == null) return false;
    if (event.keyCode == 37) { // KEY_LEFT
      var isCollapsed = this._isCollapsed(selected);
      if (!isCollapsed) {
        this._toggle(selected);
      } else {
        var parent = this._getParent(selected); 
        if (parent != null) {
          this._select(parent);
        }
      }
    } else if (event.keyCode == 38) { // KEY_UP
      var prevSib = this._getPrevSib(selected);
      var parent = this._getParent(selected); 
      if (prevSib != null) {
        this._select(this._getLastChild(prevSib));
      } else if (parent != null) {
        this._select(parent);
      }
    } else if (event.keyCode == 39) { // KEY_RIGHT
      var isCollapsed = this._isCollapsed(selected);
      if (isCollapsed) {
        this._toggle(selected);
      }
    } else if (event.keyCode == 40) { // KEY_DOWN
      var nextSib = this._getNextSib(selected);
      var child = this._getFirstChild(selected); 
      if (child != null) {
        this._select(child);
      } else if (nextSib) {
        this._select(nextSib);
      }
    } else if (String.fromCharCode(event.charCode) == '*') {
      this._toggleAll(selected);
    }
    return false;
  },
};

