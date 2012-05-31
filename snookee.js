
function trace(str) {
    console.log(str);
}

function jstr(obj) {
    return JSON.stringify(obj);
}

// === Point
var Point = function(x, y) {
    this.x = x; this.y = y;
}
Point.prototype.newFrom = function(x1, y1) {
    return new Point(this.x + x1, this.y + y1);
}

// === Ball
var Ball = function(coords, color, radius, cost) {
    //this.position = coords;
    this.x = coords.x;
    this.y = coords.y;
    this.radius = radius;
    this.color = color;
    this.cost = 1;
    if(cost !== undefined) {
        this.cost = cost; 
    }

    this.speed = 0;
    var slowing = 0.97,
        inertia = 1.02;
    this.acc = slowing * inertia;
    this.stop = this.acc / 4;
    this.angle = 0;
    this.lightColor = utils.parseColor(0xDFDFDF | utils.parseColor(this.color, true));
}
Ball.prototype.getVelocity = function() {
    return { vx: Math.cos(this.angle) * this.speed,
        vy: Math.sin(this.angle) * this.speed };
};
Ball.prototype.setVelocity = function(vx, vy) {
    this.angle = Math.atan2(vy, vx);
    this.speed = Math.sqrt(vx * vx + vy * vy);
};
Ball.prototype.draw = function(context) {
    var grad = context.createRadialGradient(
        this.x+2, this.y-2, 1,
        this.x, this.y, this.radius);
    grad.addColorStop(0, this.lightColor);
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, this.color);
    var v = this.getVelocity();
    this.x += v.vx;
    this.y += v.vy;
    this.speed *= this.acc;
    if(this.speed < this.stop) {
        this.speed = 0;
    }

    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = grad;
    context.strokeStyle = "black";
    context.lineWidth = this.radius / 20;
    context.fill();
    context.stroke();
    // Shade
    context.fillStyle = "rgba(125, 125, 125, 0.2)";
    context.beginPath();
    context.arc(this.x, this.y, this.radius - 1, Math.PI * 1.2, Math.PI / 2, true);
    context.closePath();
    context.fill();
}
Ball.prototype.hit = function(angle, power) {
    //this.vx = Math.cos(Math.PI + angle) * power;
    //this.vy = Math.sin(Math.PI + angle) * power;
    this.speed = power / 2;
    this.angle = Math.PI + angle;
}

// === Table
var Table = function(phis_long, marginX, marginY) {
    var dimensions = {
        tableHeight: 1778,
        tableWidth: 3569,
        baulkFromBottom: 737,
        dRaduis: 292,
        pocket_size: 89,
        blackFromTop: 324,
        ballDiam: 52.5,
        cueLength: 1200
    };
    var ratio = dimensions.tableWidth / phis_long;
    trace("Ratio is " + ratio);

    function calc(phisical_size) {
        //var res = Math.floor(phisical_size / ratio);
        var res = Math.ceil(phisical_size / ratio);
        trace(phisical_size + " converted to " + res);
        return res;
    }

    this.onTable = function(x, y) {
        return new Point(marginX + x, marginY + y);
    };
    this.marginX = marginX;
    this.marginY = marginY;
    this.width = calc(dimensions.tableWidth);
    this.height = calc(dimensions.tableHeight);
    this.topLeft = new Point(marginX, marginY);
    this.bottomRight = new Point(marginX + this.width, marginY + this.height);
    this.bluePoint = this.onTable(this.width / 2, this.height / 2);
    this.blackPoint = this.onTable(this.width - calc(dimensions.blackFromTop), this.height / 2);
    this.baulkX = marginX + calc(dimensions.baulkFromBottom);
    this.ballRadius = calc(dimensions.ballDiam / 2);
    this.dRaduis = calc(dimensions.dRaduis);
    this.cueLength = calc(dimensions.cueLength);
    this.balls = {
        cue: new Ball(new Point(this.baulkX - this.dRaduis / 2, this.bluePoint.y), "#F2EADC", this.ballRadius, 0),
        yellow: new Ball(new Point(this.baulkX, this.bluePoint.y + this.dRaduis), "#E0C200", this.ballRadius, 2),
        green: new Ball(new Point(this.baulkX, this.bluePoint.y - this.dRaduis), "#19552C", this.ballRadius, 3),
        brown: new Ball(new Point(this.baulkX, this.bluePoint.y), "#8C000C", this.ballRadius, 4),
        blue: new Ball(this.bluePoint, "#0000FF", this.ballRadius, 5),
        pink: new Ball(new Point(this.width / 4 * 3, this.bluePoint.y), "#FF7FB6", this.ballRadius, 6),
        black: new Ball(this.blackPoint, "#000000", this.ballRadius, 7),
        reds: (function(that) {
            var reds = [];
            var stepX = that.ballRadius * 2;
            var stepY = that.ballRadius + 1;
            var color = "#FF0000";
            var startPoint = new Point((that.width / 4 * 3) + stepX, that.bluePoint.y);
            for(var i=0; i < 5; i++) {
                var sp = startPoint.newFrom(stepX * i - i, -stepY * i);
                for(var j = 0; j <= i; j++) {
                    var p = sp.newFrom(0, stepX * j);
                    reds.push(new Ball(p, color, that.ballRadius));
                }
            }
            return reds;
        })(this)
    };

    this.stick = new Stick(this.cueLength, this.ballRadius);
    this.ballsArr = []; // Array for fast calculations
    for(var b in this.balls) {
        if(b !== "reds") {
            this.ballsArr.push(this.balls[b]);
        }
    }
    var redCount = 15;
    while(--redCount >= 0) {
        this.ballsArr.push(this.balls.reds[redCount]);
    }
}
Table.prototype.draw = function(tableContext, ballsContext) {
    tableContext.fillStyle = "#198078";
    tableContext.fillRect(this.marginX, this.marginY, this.width, this.height);
    // Baulk
    tableContext.beginPath();
    tableContext.moveTo(this.baulkX, this.topLeft.y);
    tableContext.lineTo(this.baulkX, this.bottomRight.y);
    tableContext.lineWidth = 0.5;
    tableContext.strokeStyle = "rgba(255, 255, 255, 0.65)";
    tableContext.stroke();
    tableContext.beginPath();
    tableContext.arc(this.baulkX, this.bluePoint.y, this.dRaduis, Math.PI/2, Math.PI*3/2); 
    tableContext.stroke();
}
Table.prototype.drawBalls = function(context, mouse) {
    var ba = this.ballsArr,
        i = ba.length,
        railsPower = 0.85,
        movingBalls = 0;
    while(--i >= 0) {
        var ball = ba[i];
        if(ba[i].speed > 0) {
            movingBalls++;
            if(ball.x + ball.radius > this.bottomRight.x) {
                ball.x = this.bottomRight.x - ball.radius;
                var v = ball.getVelocity();
                ball.setVelocity(-v.vx * railsPower, v.vy);
            } else if(ball.x - ball.radius < this.topLeft.x) {
                ball.x = this.topLeft.x + ball.radius;
                var v = ball.getVelocity();
                ball.setVelocity(-v.vx * railsPower, v.vy);
            }
            if(ball.y + ball.radius > this.bottomRight.y) {
                ball.y = this.bottomRight.y - ball.radius;
                var v = ball.getVelocity();
                ball.setVelocity(v.vx, -v.vy * railsPower);
            } else if(ball.y - ball.radius < this.topLeft.y) {
                ball.y = this.topLeft.y + ball.radius;
                var v = ball.getVelocity();
                ball.setVelocity(v.vx, -v.vy * railsPower);
            }
        }
        for(var j = i - 1; j >= 0; j--) {
            var oball = ba[j];
            utils.checkCollision(ball, oball);
        }

        ball.draw(context);
    }
    var stick = this.stick;
    if(stick.state === 3 && movingBalls === 0) {
        stick.state = 0;
        stick.x = this.balls.cue.x;
        stick.y = this.balls.cue.y;
    }

    if(stick.state < 1) {
        var cue = this.balls.cue;
        var dx = mouse.x - cue.x,
            dy = mouse.y - cue.y,
            angle = Math.atan2(dy, dx);
        stick.x = cue.x;
        stick.y = cue.y;
        stick.angle = angle;
    }
    if(this.stick.state < 3) {
        stick.draw(context, this.width);
    }
}

// === Cue stick
var Stick = function(long, ballRadius) {
    this.state = 0; // 0 = free | 1 = raising | 2 = shot | 3 = hidden
    this.x = 0;
    this.y = 0;
    if(long === undefined) { long = 200; }
    if(ballRadius === undefined) { ballRadius = 5; }
    this.fromBall = ballRadius * 2;
    this.shotPower = 0;
    this.long = long;
    this.angle = 0;
}
Stick.prototype.draw = function(context, helpLength) {
    if(this.state === 2) {
        // Shooting
        this.shotPower *= 0.1;
        if(this.shotPower <= 0.05) {
            this.state = 3;
        }
    }

    context.beginPath();
    var angleX = Math.cos(this.angle),
        angleY = Math.sin(this.angle);
    var distanceFromBall = this.fromBall + this.shotPower;
    context.moveTo(this.x + distanceFromBall * angleX, this.y + distanceFromBall * angleY);
    context.lineTo(
        this.x + (this.long + distanceFromBall) * angleX,
        this.y + (this.long + distanceFromBall) * angleY);
    context.lineWidth = 1.5;
    context.strokeStyle = "#333333";
    context.stroke();
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(this.x + helpLength * -angleX, this.y + helpLength * -angleY);
    context.lineWidth = 0.5;
    context.strokeStyle = "#FFFFFF";
    context.stroke();
}

// =================================
// Start
// =================================
window.onload = function() {
    var bgcanvas = document.getElementById("bgLayer"),
        bcontext = bgcanvas.getContext("2d"),
        fgcanvas = document.getElementById("fLayer"),
        fcontext = fgcanvas.getContext("2d"),
        mouse = utils.captureMouse(fgcanvas);

    var tableHeight = bgcanvas.width - 40;
    var table = new Table(tableHeight, 20, 20);
    table.draw(bcontext, fcontext);

    (function frame() {
        window.requestAnimationFrame(frame, fgcanvas);
        fcontext.clearRect(0, 0, fgcanvas.width, fgcanvas.height);
        table.drawBalls(fcontext, mouse);
    })();

    var mouseDownAt = null;

    fgcanvas.addEventListener("mousedown", function() {
        mouseDownAt = new Point(mouse.x, mouse.y);
        table.stick.state = 1; // raising
        fgcanvas.addEventListener("mousemove", onMouseMove, false);
        document.addEventListener("mouseup", onMouseUp, false);
    });

    function onMouseMove(event) {
        var maxPower = table.cueLength / 3;
        var power = mouse.y - mouseDownAt.y;
        if(power > maxPower) { power = maxPower; }
        else if(power < 0) { power = 0; }
        table.stick.shotPower = power * 0.9;
    }

    function onMouseUp() {
        if(table.stick.shotPower > 0) {
            table.stick.state = 2; // Shoot em' all
            table.balls.cue.hit(table.stick.angle, table.stick.shotPower);
        } else {
            table.stick.state = 0; // Reload the gun
        }

        fgcanvas.removeEventListener("mousemove", onMouseMove, false);
        document.removeEventListener("mouseup", onMouseUp, false);
    }
}