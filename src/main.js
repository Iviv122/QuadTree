import "./style.css";
import p5 from "p5";

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;

class Node {}

// rectangle shape
class Quad {
  pos;
  width;
  height;

  val;
  lb;
  rb;
  lt;
  rt;

  /** @param {p5} p */
  p;

  constructor(p, x, y, width, height) {
    this.pos = p.createVector(x, y);
    this.width = width;
    this.height = height;
  }
  // todo: depht gradient
  /** @param {p5} p */
  draw(p, d = 0) {
    p.fill(255 - d * 20, 255 - d * 20, 255 - d * 20, 255 - d * 20);
    p.rect(
      this.pos.x - this.width / 2,
      this.pos.y - this.height / 2,
      this.width,
      this.height,
    );
    this.lb?.draw(p, d + 1);
    this.rb?.draw(p, d + 1);
    this.lt?.draw(p, d + 1);
    this.rt?.draw(p, d + 1);
  }
  // ig split on of
  split() {}
}

/** @param {p5} p */
const sketch = (p) => {
  let root;
  p.setup = () => {
    p.createCanvas(clientWidth, clientHeight);
    root = new Quad(
      p,
      clientWidth / 2,
      clientHeight / 2,
      clientWidth,
      clientHeight,
    );
  };

  p.draw = () => {
    let mp = p.createVector(p.mouseX, p.mouseY);
    p.background(220);
    p.ellipse(mp.x, mp.y, 50, 50);
    root.draw(p);
  };
};

new p5(sketch, document.getElementById("main"));
