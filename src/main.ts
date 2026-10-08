import "./style.css";
import p5 from "p5";

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;

class Unit {
  pos;
  dir;
  r;
  v;

  constructor(p: p5, x: number, y: number, r = 50, v = 10) {
    this.r = r;
    this.v = v;
    this.pos = p.createVector(x, y);
    this.dir = p
      .createVector(Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize();
  }
  move() {
    this.pos.add(p5.Vector.mult(this.dir, this.v));
    if (this.pos.x <= this.r || this.pos.x > clientWidth - this.r) {
      this.bounce(-1, 0);
    }
    if (this.pos.y <= this.r || this.pos.y > clientHeight - this.r) {
      this.bounce(0, -1);
    }
  }
  draw(p: p5) {
    p.fill(255, 0, 0);
    p.circle(this.pos.x, this.pos.y, this.r);
  }
  // TODO: Make normal based bounce or dot/cross product bounce
  bounce(x: number, y: number) {
    this.dir.x *= x;
    this.dir.y *= y;
  }

  collide(unit: Unit) {10
    const dx = unit.pos.x - this.pos.x;
    const dy = unit.pos.y - this.pos.y;

    const minDistance = this.r + unit.r;
    const distanceSq = dx * dx + dy * dy;

    // Not colliding
    if (distanceSq > minDistance * minDistance) return;


    this.dir.mult(unit.dir.mult(1)).normalize()
    unit.dir.mult(this.dir.mult(1)).normalize()
  }
}

// rectangle shape :(
class Quad {
  pos;
  width;
  height;

  threshold;
  val = new Set<Unit>();

  nodes: Quad[] = [];

  constructor(
    p: p5,
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number,
  ) {
    this.pos = p.createVector(x, y);
    this.width = width;
    this.height = height;
    this.threshold = threshold;
  }

  draw(p: p5, d = 0, r = true, c = undefined) {
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
      this.nodes.map((i) => i.draw(p, d + 1));
    }
  }

  amount(): number {
    return this.val.size;
  }

  split(p: p5) {
    if (this.nodes.length > 0) return;

    const halfwidth = this.width / 2;
    const halfheight = this.height / 2;
    this.nodes.push(
      new Quad(
        p,
        this.pos.x - halfwidth / 2,
        this.pos.y - halfheight / 2,
        halfwidth,
        halfheight,
        this.threshold,
      ),
    );
    this.nodes.push(
      new Quad(
        p,
        this.pos.x + halfwidth / 2,
        this.pos.y - halfheight / 2,
        halfwidth,
        halfheight,
        this.threshold,
      ),
    );

    this.nodes.push(
      new Quad(
        p,
        this.pos.x - halfwidth / 2,
        this.pos.y + halfheight / 2,
        halfwidth,
        halfheight,
        this.threshold,
      ),
    );
    this.nodes.push(
      new Quad(
        p,
        this.pos.x + halfwidth / 2,
        this.pos.y + halfheight / 2,
        halfwidth,
        halfheight,
        this.threshold,
      ),
    );
    for (let i of this.val) {
      this.insert(p, i);
    }
    this.val.clear();
  }
  merge() {
    this.nodes.map((node) => {
      for (let i of node.val) {
        this.val.add(i);
      }
    });
    this.nodes = [];
  }
  remove(unit: Unit) {
    if (!this.isInside(unit.pos.x, unit.pos.y)) {
      return;
    }
    if (this.nodes.length > 0) {
      this.nodes.map((node) => {
        node.remove(unit);
      });
      const sum = this.nodes.reduce((acc, i) => acc + i.amount(), 0);
      if (sum < this.threshold) {
        this.merge();
      }
    } else {
      this.val.delete(unit);
    }
  }
  insert(p: p5, unit: Unit) {
    if (!this.isInside(unit.pos.x, unit.pos.y)) return;
    if (this.nodes.length > 0) {
      for (const node of this.nodes) {
        if (node.insert(p, unit)) {
          return true;
        }
      }
    }
    this.val.add(unit);

    if (this.amount() >= this.threshold) {
      this.split(p);
    }
  }
  collide() {
    if (this.nodes.length > 0) {
      this.nodes.map((i) => {
        i.collide();
      });
    }
    if (this.amount() <= 0) {
      return;
    }
    const vals = Array.from(this.val.values());
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        vals[i].collide(vals[j]);
      }
    }
  }
  isInside(x: number, y: number) {
    return (
      x >= this.pos.x - this.width / 2 &&
      x < this.pos.x + this.width / 2 &&
      y >= this.pos.y - this.height / 2 &&
      y < this.pos.y + this.height / 2
    );
  }
}

const sketch = (p: p5) => {
  let root: Quad;
  let circles: Unit[] = [];
  p.setup = () => {
    p.createCanvas(clientWidth, clientHeight);
    root = new Quad(
      p,
      clientWidth / 2,
      clientHeight / 2,
      clientWidth,
      clientHeight,
      4,
    );
    for (let i = 0; i < 100; i++) {
      circles.push(
        new Unit(
          p,
          clientWidth / 2 + Math.random() * 500 - 250,
          clientHeight / 2 + Math.random() * 500 - 250,
          Math.random() * 5 + 5,
          2,
        ),
      );
    }
  };
  p.draw = () => {
    //let mp = p.createVector(p.mouseX, p.mouseY);
    p.background(220);
    for (let i of circles) {
      i.move();
    }
    root.draw(p);
    for (let i of circles) {
      root.remove(i);
      root.insert(p, i);
      i.draw(p);
    }
    root.collide();
  };
};

new p5(sketch, document.getElementById("main"));
