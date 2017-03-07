var MIN_CIRCLES = 0,
    MAX_CIRCLES = 80,
    R = 20,
    R2 = R*2,
    MIN_DISTANCE = R2+R/4,
    NUDGE_VARIANCE = R2
;

// global variables
var svgEl = document.getElementById('view'),
    inputEl = document.getElementById('input'),
    errorEl = document.getElementById('error'),
    inputWrapEl = document.getElementById('input-wrap'),
    mousePosEl = document.getElementById('mouse-position'),
    width = svgEl.clientWidth,
    height = svgEl.clientHeight,
    draggedItem = null,
    draggedItemOffset = null
;

// clears out the error message
function clearError() {
  inputWrapEl.className = inputWrapEl.className.replace(/\serror\b/,'');
  errorEl.textContent = '';
}

// shows the error message
function showError(msg) {
  inputWrapEl.className += ' error';
  errorEl.textContent = msg;
}

// returns an svg element with tag tagName
function createSvgEl(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

// returns an SVG circle, located at x,y with color c
function createCircle(x, y, c) {
  var circleEl = createSvgEl('circle');
  circleEl.setAttribute('r', R);  
  circleEl.setAttribute('cx', x);
  circleEl.setAttribute('cy', y);
  circleEl.setAttribute('style', 'fill:' + c);
  return circleEl;
}

/*
circleCoordinates returns an array of circle coordinate / color objects.  The
parameter `n` corresponds to the number of circle objects to return

For example, circleCoordinates(2) might return something like:
[{x:20, y:30, c:'rgb(200,170,180)'}, {x:40, y:90, c: 'rgb(200,180,200)'}]

The complexity is n^2; It will only add a circle if it does not collide with
all of the other circles.

To do this, a random point is selected. Then, I create an array of all of the
circles which would collide with a circle at this point.  I then calculate the
centroid of the collided circles. Then, I attempt to move the point away from
this centroid (I call this 'nudging' in the algorithm). I attempt to nudge the
point at most 10 times, if it's still colliding I pick a completely random
point.

If after 500 tries I can not find a place to put a new point, I throw an error.

The reason I did it this way was for fun. If complexity was an issue the space
could easily be divided into N partitions, and then a random point could be
generated within this partition.
*/
function circleCoordinates(n) {
  var coords = [];

  for (let i = 0; i < n; i++) {
    let nudgeAttempts = 0,
        totalAttempts = 0,
        attempts = 0,
        x, y, nudge, collides
    ;
    
    do {
      // too many attempts to place a circle, error out
      if (attempts++ >= 500) {
        showError('Please choose a lower number of circles');
        throw new Error();
      }
    
      if (!nudge || nudgeAttempts >= 10) {
        nudgeAttempts = 0;
        // just pick a random point, we aren't nudging

        // generates an x/y such that it doesnt collide with svg border
        x = (Math.random() * (width - R2)) + R;
        y = (Math.random() * (height - R2)) + R;
      } else {
        // we are nudging the point
        nudgeAttempts++;
        
        // change the point's position
        x += nudge.x;
        y += nudge.y;
        
        // if the point would collide with the svg border / be out of bounds
        // then simply set a random value for that dimension
        if (x >= (width - R) || x <= R) {
          x = (Math.random() * (width - (R2))) + R;
        }
        if (y >= (height - R) || y <= R) {
          y = (Math.random() * (height - (R2))) + R;
        }
      }
      
      // generate the array of circles which would collide
      collides = [];
      for (let j=0; j<coords.length; j++) {
        let other = coords[j];
        
        if (Math.hypot(x-other.x, y-other.y) <= MIN_DISTANCE) {
          collides.push(other);
        }
      }
      
      // if our point collides with at least one circle, generate
      // the nudge vector
      if (collides.length) {
        // sum is the sum of collided x/y points
        let sum = collides.reduce(
              (p,c) => {p.x += c.x; p.y += c.y; return p;},
              {x:0, y:0}
            ),
            // centroid is the average point of the collided circles
            centroid = {
              x: sum.x / collides.length,
              y: sum.y / collides.length
            },
            // displacement is the difference between the centroid
            // and the point
            displacement = {
              x: x - centroid.x,
              y: y - centroid.y
            },
            // get the magnitude so we can calculate unit vec
            magnitude = Math.hypot(
              displacement.x,
              displacement.y
            ),
            // unit vector of displacement
            unit = {
              x: displacement.x / magnitude,
              y: displacement.y / magnitude
             }
        ;
        // nudge the point a diameter away + some variance away from the
        // centroid
        nudge = {
          x: unit.x * R2 + Math.random() * NUDGE_VARIANCE,
          y: unit.y * R2 + Math.random() * NUDGE_VARIANCE
        };
      }
    } while (collides.length);
    
    // the color depends on the x/y position
    let color = (
      'rgb(200,' + 
            Math.floor(155 + (x / width) * 25) + ',' + 
            Math.floor(155 + (y / height) * 100) + ')'
    );

    coords.push({x:x, y:y, c: color});
  }
  return coords;
}

// if mousedown occurs over a circle, set draggedItem to the circle
// initialize the draggedItemOffset as well
svgEl.addEventListener('mousedown', function(e) {
  var mouseX = e.offsetX,
      mouseY = e.offsetY
  ;
  
  if (e.target !== svgEl) {
    let item = e.target,
        itemX = (+ item.getAttribute('cx')),
        itemY = (+ item.getAttribute('cy'))
    ;
  
    draggedItem = item;
    draggedItemOffset = {x: itemX-mouseX, y: itemY-mouseY};
  }
});

// if the mouse is moving and we have an item we are dragging
// then update the position of the dragged item
svgEl.addEventListener('mousemove', function(e) {
  var mouseX = e.offsetX,
      mouseY = e.offsetY
  ;

  mousePosEl.textContent = '('+mouseX.toFixed(2)+','+mouseY.toFixed(2)+')';
  
  if (draggedItem) {
    let newItemX = mouseX + draggedItemOffset.x,
        newItemY = mouseY + draggedItemOffset.y
    ;
    
    draggedItem.setAttribute('cx', newItemX);
    draggedItem.setAttribute('cy', newItemY);
  }
});

// clear out the draggedItem
svgEl.addEventListener('mouseup', function(e) {
  draggedItem = null;
  draggedItemOffset = null;
});

inputEl.addEventListener('input', function(e) {
  var inputVal = (+ inputEl.value);

  if (inputVal < MIN_CIRCLES || inputVal > MAX_CIRCLES) {
    // invalid input
    showError('Please input a number between 0 and 50');
  } else if (Math.floor(inputVal) - inputVal !== 0) {
    // invalid input
    showError('Please input an integer');
  } else {
    // valid input
    clearError();

    // clear out the svg element (simple but might cause mem leaks)
    svgEl.innerHTML = '';

    // generate the array of circle values
    circleCoordinates(inputVal)
      // for each circle value, convert it to an svg element
      .map((c) => createCircle(c.x, c.y, c.c))
      // for each svg element, append it to the svg
      .forEach(svgEl.appendChild.bind(svgEl))
    ;
  }
});
