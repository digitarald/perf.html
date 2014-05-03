function tab_showInstruction(tabName, instruction) {
  var currentTab = gTabWidget.getTab(tabName);
  if (currentTab && currentTab.isInstruction !== true) {
    // We have a real tab, don't set instructions
    return;
  }

  var container = createElement("div", {
    className: "tab",
    style: {
      background: "white",
      height: "100%",
    },
    textContent: instruction,
  });
  container.isInstruction = true;
  gTabWidget.addTab(tabName, container); 
}

function tab_showLayersDump(layersDumpLines, compositeTitle, compositeTime) {
  function parseLayers() {
    function trim(s){ 
      return ( s || '' ).replace( /^\s+|\s+$/g, '' ); 
    }
    function parseMatrix2x3(str) {
      str = trim(str);

      // Something like '[ 1 0; 0 1; 0 158; ]'
      var matches = str.match("\\[ (.*?) (.*?); (.*?) (.*?); (.*?) (.*?); \\]");
      if (!matches) {
        return null;
      }

      var matrix = [
        [parseFloat(matches[1]), parseFloat(matches[2])],
        [parseFloat(matches[3]), parseFloat(matches[4])],
        [parseFloat(matches[5]), parseFloat(matches[6])],
      ];

      dump("Matrix: " + JSON.stringify(matrix) + "\n");
      return matrix;
    }
    function parseRect2D(str) {
      str = trim(str);

      // Something like '(x=0, y=0, w=2842, h=158)'
      var rectMatches = str.match("\\(x=(.*?), y=(.*?), w=(.*?), h=(.*?)\\)");
      if (!rectMatches) {
        return null;
      }

      var rect = [
        parseFloat(rectMatches[1]), parseFloat(rectMatches[2]),
        parseFloat(rectMatches[3]), parseFloat(rectMatches[4]),
      ];
      dump("Rect: " + JSON.stringify(rect) + "\n");
      return rect;
    }
    function parseRegion(str) {
      str = trim(str);

      // Something like '< (x=0, y=0, w=2842, h=158); (x=0, y=1718, w=2842, h=500); >'
      if (str.charAt(0) != '<' || str.charAt(str.length - 1) != '>') {
        return null;
      }

      var region = [];
      str = trim(str.substring(1, str.length - 1));
      while (str != "") {
        var rectMatches = str.match("\\(x=(.*?), y=(.*?), w=(.*?), h=(.*?)\\);");
        if (!rectMatches) {
          return null;
        }

        var rect = [
          parseFloat(rectMatches[1]), parseFloat(rectMatches[2]),
          parseFloat(rectMatches[3]), parseFloat(rectMatches[4]),
        ];
        str = trim(str.substring(rectMatches[0].length, str.length));
        region.push(rect);
      }
      dump("Region: " + JSON.stringify(region) + "\n");
      return region;
    }

    var layerObjects = [];
    for (var i = 0; i < layersDumpLines.length; i++) {
      // Something like 'ThebesLayerComposite (0x12104cc00) [shadow-visible=< (x=0, y=0, w=1920, h=158); >] [visible=< (x=0, y=0, w=1920, h=158); >] [opaqueContent] [valid=< (x=0, y=0, w=1920, h=2218); >]'
      var line = layersDumpLines[i].name;

      var layerObject = {
      }
      layerObjects.push(layerObject);

      var matches = line.match("(\\w+)\\s\\((\\w+)\\)(.*)");
      if (!matches)
        continue; // Something like a texturehost dump. Safe to ignore
      layerObject.name = matches[1];
      layerObject.address = matches[2];

      var rest = matches[3];

      var fields = [];
      var nesting = 0;
      var startIndex;
      for (var j = 0; j < rest.length; j++) {
        if (rest.charAt(j) == '[') {
          nesting++;
          if (nesting == 1) {
            startIndex = j;
          }
        } else if (rest.charAt(j) == ']') {
          nesting--;
          if (nesting == 0) {
            fields.push(rest.substring(startIndex + 1, j));
          }
        }
      }

      for (var j = 0; j < fields.length; j++) {
        // Something like 'valid=< (x=0, y=0, w=1920, h=2218); >' or 'opaqueContent'
        var field = fields[j];
        dump("FIELD: " + field + "\n");
        var parts = field.split("=", 2);
        var fieldName = parts[0];
        var rest = field.substring(fieldName.length + 1);
        if (parts.length == 1) {
          // bool value
          layerObject[fieldName] = "true";
          layerObject[fieldName].type = "bool";
          continue;
        } else {
          var region = parseRegion(rest); 
          if (region) {
            layerObject[fieldName] = region;
            layerObject[fieldName].type = "region";
            continue;
          }
          var rect = parseRect2D(rest);
          if (rect) {
            layerObject[fieldName] = rect;
            layerObject[fieldName].type = "rect2d";
            continue;
          }
          var matrix = parseMatrix2x3(rest);
          if (matrix) {
            layerObject[fieldName] = matrix;
            layerObject[fieldName].type = "matrix2x3";
            continue;
          }
        }
      }
      dump("Fields: " + JSON.stringify(fields) + "\n");
    }
    dump("OBJECTS: " + JSON.stringify(layerObjects) + "\n");
  }
  var container = createElement("div", {
    style: {
      background: "white",
      height: "100%",
      position: "relative",
    },
  });
  var titleDiv = createElement("div", {
    className: "treeColumnHeader",
    style: {
      width: "100%",
    },
    textContent: compositeTitle + " (near " + compositeTime.toFixed(0) + " ms)",
  });
  container.appendChild(titleDiv);
  parseLayers();

  gTabWidget.addTab("LayerTree", container); 
  gTabWidget.selectTab("LayerTree");
}
