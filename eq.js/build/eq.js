//////////////////////////////
// eq.js
// The global eqjs object that contains all eq.js functionality.
//
// eqjs.nodes - List of all nodes to act upon when eqjs.states is called
// eqjs.nodesLength - Number of nodes in eqjs.nodes
//
// eqjs.refreshNodes - Call this function to refresh the list of nodes that eq.js should act on
// eqjs.sortObj - Sorts a key: value object based on value
// eqjs.query - Runs through all nodes and finds their widths and points
// eqjs.nodeWrites - Runs through all nodes and writes their eq status
//////////////////////////////
(function (eqjs) {
  'use strict';

  function EQjs() {
    this.nodes = [];
    this.eqsLength = 0;
    this.widths = [];
    this.points = [];
  }

  //////////////////////////////
  // Request Animation Frame Polyfill
  //
  // Written by  Erik Möller and Paul Irish
  // From http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
  //////////////////////////////
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
      element = element;
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }

  //////////////////////////////
  // Query
  //
  // Reads nodes and finds the widths/points
  //  nodes - optional, an array or NodeList of nodes to query
  //  load - Whether it's an initial load or not. If nodes are passed in, forces `false`
  //////////////////////////////
  EQjs.prototype.query = function (nodes, load) {
    var proto = Object.getPrototypeOf(eqjs);
    var length;

    if (nodes && typeof(nodes) !== 'number') {
      length = nodes.length;
    }
    else {
      nodes = proto.nodes;
      length = proto.nodesLength;
    }
    var widths = [], points = [], i;

    for (i = 0; i < length; i++) {
      widths.push(nodes[i].offsetWidth);
      try {
        points.push(proto.sortObj(nodes[i].getAttribute('data-eq-pts')));
      }
      catch (e) {
        points.push({});
      }
    }

    if (nodes && typeof(nodes) !== 'number') {
      proto.nodeWrites(nodes, widths, points);
    }
    else {
      proto.widths = widths;
      proto.points = points;

      if (load) {
        proto.nodeWrites();
      }
      else {
        window.requestAnimationFrame(proto.nodeWrites);
      }
    }
  };

  //////////////////////////////
  // NodeWrites
  //
  // Writes the data attribute to the object
  //  nodes - optional, an array or NodeList of nodes to query
  //  widths - optional, widths of nodes to use. Only used if `nodes` is passed in
  //  points - optional, points of nodes to use. Only used if `nodes` is passed in
  //////////////////////////////
  EQjs.prototype.nodeWrites = function (nodes, widths, points) {
    var i;
    var proto = Object.getPrototypeOf(eqjs);
    var length;

    if (nodes && typeof(nodes) !== 'number') {
      length = nodes.length;
    }
    else {
      nodes = proto.nodes;
      length = proto.nodesLength;
      widths = proto.widths;
      points = proto.points;
    }

    for (i = 0; i < length; i++) {
      // Set object width to found width
      var objWidth = widths[i];
      var obj = nodes[i];
      var eqPts = points[i];

      // Get keys for states
      var eqStates = Object.keys(eqPts);
      var eqPtsLength = eqStates.length;

      // Get first and last key
      var firstKey = eqStates[0];
      var lastKey = eqStates[eqPtsLength - 1];

      // Be greedy for smallest state
      if (objWidth < eqPts[firstKey]) {
        obj.removeAttribute('data-eq-state');
      }
      // Be greedy for largest state
      else if (objWidth >= eqPts[lastKey]) {
        obj.setAttribute('data-eq-state', lastKey);
      }
      // Traverse the states if not found
      else {
        for (var j = 0; j < eqPtsLength; j++) {
          var thisKey = eqStates[j];
          var nextKey = eqStates[j + 1];

          if (j === 0 && objWidth < eqPts[thisKey]) {
            obj.removeAttribute('data-eq-state');
            break;
          }

          if (nextKey === undefined) {
            obj.setAttribute('data-eq-state', thisKey);
            break;
          }

          if (objWidth >= eqPts[thisKey] && objWidth < eqPts[nextKey]) {
            obj.setAttribute('data-eq-state', thisKey);
            break;
          }
        }
      }
    }
  };

  //////////////////////////////
  // Refresh Nodes
  // Refreshes the list of nodes for eqjs to work with
  //////////////////////////////
  EQjs.prototype.refreshNodes = function () {
    var proto = Object.getPrototypeOf(eqjs);
    proto.nodes = document.querySelectorAll('[data-eq-pts]');
    proto.nodesLength = proto.nodes.length;
  };

  //////////////////////////////
  // Sort Object
  // Sorts a simple object (key: value) by value and returns a sorted object
  //////////////////////////////
  EQjs.prototype.sortObj = function (obj) {
    var arr = [];
    var rv = {};

    var objSplit = obj.split(',');

    for (var i = 0; i < objSplit.length; i++) {
      var sSplit = objSplit[i].split(':');
      arr.push({
        'key': sSplit[0].replace(/^\s+|\s+$/g, ''),
        'value': parseFloat(sSplit[1])
      });
    }

    arr.sort(function (a, b) { return a.value - b.value; });

    for (i = 0; i < arr.length; i++) {
      var item = arr[i];
      rv[item.key] = item.value;
    }
    return rv;
  };

  //////////////////////////////
  // We only ever want there to be
  // one instance of EQjs in an app
  //////////////////////////////
  eqjs = eqjs || new EQjs();

  //////////////////////////////
  // Window Onload
  //
  // Fires on load
  //////////////////////////////
  window.onload = function () {
    eqjs.refreshNodes();
    eqjs.query(undefined, true);
  };

  //////////////////////////////
  // Window Resize
  //
  // Loop over each `eq-pts` element and pass to eqState
  //////////////////////////////
  window.onresize = function () {
    eqjs.refreshNodes();
    window.requestAnimationFrame(eqjs.query);
  };

  // Expose 'eqjs'
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = eqjs;
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return eqjs;
    });
  } else {
    window.eqjs = eqjs;
  }
})(window.eqjs);