import "./style.css";
import p5 from "p5";

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;

class Node {}

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
    const halfx = this.pos.x / 2;
    const halfy = this.pos.y / 2;

    const halfwidth = this.width / 2;
    const halfheight = this.height / 2;

    this.lb = new Quad(
      p,
      this.pos.x - halfx,
      this.pos.y - halfy,
      halfwidth,
      halfheight,
    );
    this.rb = new Quad(
      p,
      this.pos.x + halfx,
      this.pos.y - halfy,
      halfwidth,
      halfheight,
    );

    this.lt = new Quad(
      p,
      this.pos.x - halfx,
      this.pos.y + halfy,
      halfwidth,
      halfheight,
    );
    this.rt = new Quad(
      p,
      this.pos.x + halfx,
      this.pos.y + halfy,
      halfwidth,
      halfheight,
    );
  }
  search(x, y, p) {
    this._search(this, x, y, p);
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
      }
      // check here
    } else {
      node._search(node.lb, x, y, p);
      node._search(node.rb, x, y, p);
      node._search(node.lt, x, y, p);
      node._search(node.rt, x, y, p);

      // go deeper
    }
  }
}

/** @param {p5} p */
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(clientWidth, clientHeight);
  };

  p.draw = () => {
    let mp = p.createVector(p.mouseX, p.mouseY);
    p.background(220);
    let root = new Quad(
      p,
      clientWidth / 2,
      clientHeight / 2,
      clientWidth,
      clientHeight,
    );

    root.split(p);
    root.lb.split(p);
    root.lb.lb.split(p);
    root.lb.lb.split(p);
    root.draw(p);
    root.search(mp.x, mp.y, p);
  };
};

new p5(sketch, document.getElementById("main"));
