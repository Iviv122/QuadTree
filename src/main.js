import "./style.css";
import p5 from "p5";

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;

class Unit {
  pos;
  dir;
  r;
  v;

  constructor(p, x, y, r = 50, v = 10) {
    this.r = r;
    this.v = v;
    this.pos = p.createVector(x, y);
    this.dir = p.createVector(Math.random(), Math.random()).normalize();
  }
  move(p) {
    this.pos.add(p5.Vector.mult(this.dir, this.v));
    p.fill(255, 0, 0);
    p.circle(this.pos.x, this.pos.y, this.r);
    if (this.pos.x <= 0 || this.pos.x > clientWidth) {
      this.bounce(-1, 0);
    }
    if (this.pos.y <= 0 || this.pos.y > clientHeight) {
      this.bounce(0, -1);
    }
  }
  bounce(x, y) {
    this.dir.x *= x;
    this.dir.y *= y;
  }
}

// rectangle shape :(
class Quad {
  pos;
  width;
  height;

  threshold;
  val;

  lb;
  rb;
  lt;
  rt;

  /** @param {p5} p */
  p;

  /** @param {p5} p */
  constructor(p, x, y, width, height, threshold) {
    this.pos = p.createVector(x, y);
    this.width = width;
    this.height = height;
    this.threshold = threshold;
  }
  // todo: depht gradient
  /** @param {p5} p */
  draw(p, d = 0, r = true, c = undefined) {
    if (c === undefined) {
      p.fill(255 - d * 20, 255 - d * 20, 255 - d * 20, 255 - d * 20);
    } else {
      p.fill(c, c, c);
    }
    p.stroke(0, 0, 0);
    p.rect(
      this.pos.x - this.width / 2,
      this.pos.y - this.height / 2,
      this.width,
      this.height,
    );
    if (r) {
      this.lb?.draw(p, d + 1);
      this.rb?.draw(p, d + 1);
      this.lt?.draw(p, d + 1);
      this.rt?.draw(p, d + 1);
    }
  }
  // ig split on of
  /** @param {p5} p */
  split(p) {
    const halfwidth = this.width / 2;
    const halfheight = this.height / 2;

    this.lb = new Quad(
      p,
      this.pos.x - halfwidth / 2,
      this.pos.y - halfheight / 2,
      halfwidth,
      halfheight,
    );
    this.rb = new Quad(
      p,
      this.pos.x + halfwidth / 2,
      this.pos.y - halfheight / 2,
      halfwidth,
      halfheight,
    );

    this.lt = new Quad(
      p,
      this.pos.x - halfwidth / 2,
      this.pos.y + halfheight / 2,
      halfwidth,
      halfheight,
    );
    this.rt = new Quad(
      p,
      this.pos.x + halfwidth / 2,
      this.pos.y + halfheight / 2,
      halfwidth,
      halfheight,
    );
  }
  merge(p) {
    this.lb = undefined;
    this.lt = undefined;
    this.rb = undefined;
    this.rt = undefined;

    this.draw(p);
  }
  search(p, x, y) {
    return this._search(this, x, y, p);
  }
  isInside(x, y) {
    return (
      x >= this.pos.x - this.width / 2 &&
      x < this.pos.x + this.width / 2 &&
      y >= this.pos.y - this.height / 2 &&
      y < this.pos.y + this.height / 2
    );
  }
  /** @param {p5} p */
  _search(node, x, y, p) {
    if (!node.lb) {
      if (node.isInside(x, y)) {
        node.draw(p, 0, 0, 100);
        return true;
      }
      return false;
      // check here
    } else {
      return (
        node._search(node.lb, x, y, p) ||
        node._search(node.rb, x, y, p) ||
        node._search(node.lt, x, y, p) ||
        node._search(node.rt, x, y, p)
      );
      // go deeper
    }
  }
}

/** @param {p5} p */
const sketch = (p) => {
  let root;
  let circles = [];
  p.setup = () => {
    p.createCanvas(clientWidth, clientHeight);
    root = new Quad(
      p,
      clientWidth / 2,
      clientHeight / 2,
      clientWidth,
      clientHeight,
      2,
    );
    circles.push(new Unit(p, 125, 54, 10, 7));
    circles.push(new Unit(p, 30, 124, 50, 5));
    circles.push(new Unit(p, 125, 54, 5, 9));
    circles.push(new Unit(p, 30, 124, 20, 8));
  };
  p.draw = () => {
    let mp = p.createVector(p.mouseX, p.mouseY);
    p.background(220);

    root.split(p);
    root.lb.split(p);
    root.lb.lb.split(p);
    root.lb.merge(p);
    root.draw(p);

    for (let i of circles) {
      root.search(p, i.pos.x, i.pos.y);
    }
    for (let i of circles) {
      i.move(p);
    }
  };
};

new p5(sketch, document.getElementById("main"));
