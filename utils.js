// Taken from the “Foundation HTML5 Animation with JavaScript” book
// http://www.apress.com/9781430236658

/**
 * Normalize the browser animation API across implementations. This requests
 * the browser to schedule a repaint of the window for the next animation frame.
 * Checks for cross-browser support, and, failing to find it, falls back to setTimeout.
 * @param {function}    callback  Function to call when it's time to update your animation for the next repaint.
 * @param {HTMLElement} element   Optional parameter specifying the element that visually bounds the entire animation.
 * @return {number} Animation frame request.
 */
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (window.webkitRequestAnimationFrame ||
                                  window.mozRequestAnimationFrame ||
                                  window.msRequestAnimationFrame ||
                                  window.oRequestAnimationFrame ||
                                  function (callback) {
                                    return window.setTimeout(callback, 17 /*~ 1000/60*/);
                                  });
}

/**
 * Cancels an animation frame request.
 * Checks for cross-browser support, falls back to clearTimeout.
 * @param {number}  Animation frame request.
 */
if (!window.cancelRequestAnimationFrame) {
  window.cancelRequestAnimationFrame = (window.cancelAnimationFrame ||
                                        window.webkitCancelRequestAnimationFrame ||
                                        window.mozCancelRequestAnimationFrame ||
                                        window.msCancelRequestAnimationFrame ||
                                        window.oCancelRequestAnimationFrame ||
                                        window.clearTimeout);
}


/* Object that contains our utility functions.
 * Attached to the window object which acts as the global namespace.
 */
window.utils = {};

/**
 * Keeps track of the current mouse position, relative to an element.
 * @param {HTMLElement} element
 * @return {object} Contains properties: x, y, event
 */
window.utils.captureMouse = function (element) {
  var mouse = {x: 0, y: 0, event: null},
      body_scrollLeft = document.body.scrollLeft,
      element_scrollLeft = document.documentElement.scrollLeft,
      body_scrollTop = document.body.scrollTop,
      element_scrollTop = document.documentElement.scrollTop,
      offsetLeft = element.offsetLeft,
      offsetTop = element.offsetTop;
  
  element.addEventListener('mousemove', function (event) {
    var x, y;
    
    if (event.pageX || event.pageY) {
      x = event.pageX;
      y = event.pageY;
    } else {
      x = event.clientX + body_scrollLeft + element_scrollLeft;
      y = event.clientY + body_scrollTop + element_scrollTop;
    }
    x -= offsetLeft;
    y -= offsetTop;
    
    mouse.x = x;
    mouse.y = y;
    mouse.event = event;
  }, false);
  
  return mouse;
};

/**
 * Returns a color in the format: '#RRGGBB', or as a hex number if specified.
 * @param {number|string} color
 * @param {boolean=}      toNumber=false  Return color as a hex number.
 * @return {string|number}
 */
window.utils.parseColor = function (color, toNumber) {
  if (toNumber === true) {
    if (typeof color === 'number') {
      return (color | 0); //chop off decimal
    }
    if (typeof color === 'string' && color[0] === '#') {
      color = color.slice(1);
    }
    return window.parseInt(color, 16);
  } else {
    if (typeof color === 'number') {
      color = '#' + ('00000' + (color | 0).toString(16)).substr(-6); //pad
    }
    return color;
  }
};
function rotate (x, y, sin, cos, reverse) {
  return {
    x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
    y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
  };
}

window.utils.checkCollision = function(ball0, ball1) {
var dx = ball1.x - ball0.x,
    dy = ball1.y - ball0.y,
    dist = Math.sqrt(dx * dx + dy * dy);
  //collision handling code here
  if (dist < ball0.radius + ball1.radius) {
    //calculate angle, sine, and cosine
    var angle = Math.atan2(dy, dx),
        sin = Math.sin(angle),
        cos = Math.cos(angle),
        //rotate ball0's position
        pos0 = {x: 0, y: 0}, //point
        //rotate ball1's position
        v1 = ball0.getVelocity(),
        v2 = ball1.getVelocity(),
        pos1 = rotate(dx, dy, sin, cos, true),
        //rotate ball0's velocity
        vel0 = rotate(v1.vx, v1.vy, sin, cos, true),
        //rotate ball1's velocity
        vel1 = rotate(v2.vx, v2.vy, sin, cos, true),
        //collision reaction
        vxTotal = vel0.x - vel1.x;
    vel0.x = vel1.x;
    vel1.x = vxTotal + vel0.x;
    //update position
    pos0.x += vel0.x;
    pos1.x += vel1.x;
    //rotate positions back
    var pos0F = rotate(pos0.x, pos0.y, sin, cos, false),
        pos1F = rotate(pos1.x, pos1.y, sin, cos, false);
    //adjust positions to actual screen positions
    ball1.x = ball0.x + pos1F.x;
    ball1.y = ball0.y + pos1F.y;
    ball0.x = ball0.x + pos0F.x;
    ball0.y = ball0.y + pos0F.y;
    //rotate velocities back
    var vel0F = rotate(vel0.x, vel0.y, sin, cos, false),
        vel1F = rotate(vel1.x, vel1.y, sin, cos, false);
    ball0.setVelocity(vel0F.x, vel0F.y);
    ball1.setVelocity(vel1F.x, vel1F.y);
  }
}