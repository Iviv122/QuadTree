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
      this.dir.x *= -1;
    }
    if (this.pos.y <= this.r || this.pos.y > clientHeight - this.r) {
      this.dir.y *= -1;
    }
  }
  draw(p: p5) {
    p.fill(255, 0, 0);
    p.circle(this.pos.x, this.pos.y, this.r);
  }

  collide(unit: Unit) {
    const dx = unit.pos.x - this.pos.x;
    const dy = unit.pos.y - this.pos.y;

    const minDistance = this.r + unit.r;
    const distanceSq = dx * dx + dy * dy;

    // Not colliding
    if (distanceSq > minDistance * minDistance) return;

    this.dir.rotate(Math.random() * 720 - 360);
    unit.dir.rotate(Math.random() * 720 - 360);
  }
}

// rectangle shape :(
class Quad {
  pos;
  width;
  height;
  max_depth = 4;
  threshold;
  depth = 0;
  val = new Set<Unit>();

  nodes: Quad[] = [];

  constructor(
    p: p5,
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number,
    max_depth: number = 4,
    depth = 0,
  ) {
    this.pos = p.createVector(x, y);
    this.width = width;
    this.height = height;
    this.threshold = threshold;
    this.max_depth = max_depth;
    this.depth = depth;
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

  child_count(): number {
    return this.nodes.length;
  }

  split(p: p5) {
    if (this.child_count() > 0) return;
    if (this.depth >= this.max_depth) return;

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
        this.max_depth,
        this.depth + 1,
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
        this.max_depth,
        this.depth + 1,
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
        this.max_depth,
        this.depth + 1,
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
        this.max_depth,
        this.depth + 1,
      ),
    );
    const chils = Array.of(...this.val.values());

    this.val.clear();

    for (let j of this.nodes) {
      for (let i of chils) {
        if (j.isInside(i.pos.x, i.pos.y)) {
          j.insert(p, i);
          continue;
        }
      }
    }
  }
  merge() {
    this.nodes.map((node) => {
      for (let i of node.val) {
        this.val.add(i);
      }
    });
    console.log("Removed");
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
  // i will go insane lul
  insert(p: p5, unit: Unit) {
    if (!this.isInside(unit.pos.x, unit.pos.y)) return false;
    for (const node of this.nodes) {
      if (node.isInside(unit.pos.x, unit.pos.y)) {
        node.insert(p, unit);
        return true;
      }
    }
    this.val.add(unit);
    if (this.amount() >= this.threshold) {
      this.split(p);
      return true;
    }
  }
  collide() {
    if (this.nodes.length > 0) {
      this.nodes.map((i) => {
        i.collide();
      });
      return;
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
      1,
    );
    setTimeout(async () => {
      for (let i = 0; i < 5000; i++) {
        circles.push(
          new Unit(
            p,
            clientWidth / 2 + Math.random() * 500 - 250,
            clientHeight / 2 + Math.random() * 500 - 250,
            Math.random() * 5 + 5,
            Math.random() * 2 + 1,
          ),
        );
        //await new Promise((r) => setTimeout(r, 100));
      }
    }, 0);
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
    console.log(root.amount());
  };
};

new p5(sketch, document.getElementById("main"));
