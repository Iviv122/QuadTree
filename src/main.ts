import { Queue } from "./queue_linked_list";
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
  amount_subtree(): number {
    const q = new Queue<Quad>();
    let sum = 0;
    q.enqueue(this);
    while (!q.isEmpty()) {
      const curr = q.peek();
      q.dequeue();
      if (curr === undefined) return sum;
      sum += curr.amount();

      for (let i of curr.nodes) {
        q.enqueue(i);
      }
    }
    return sum;
  }
  amount_children(): number {
    let sum = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      sum += this.nodes[i].amount();
    }
    return sum;
  }

  child_count(): number {
    return this.nodes.length;
  }

  split(p: p5) {
    if (this.child_count() > 0) return;
    if (this.depth >= this.max_depth) return;

    const halfwidth = this.width / 2;
    const halfheight = this.height / 2;
    const poses = [
      {
        x: this.pos.x - halfwidth / 2,
        y: this.pos.y - halfheight / 2,
      },
      {
        x: this.pos.x + halfwidth / 2,
        y: this.pos.y - halfheight / 2,
      },
      {
        x: this.pos.x - halfwidth / 2,
        y: this.pos.y + halfheight / 2,
      },
      {
        x: this.pos.x + halfwidth / 2,
        y: this.pos.y + halfheight / 2,
      },
    ];
    poses.forEach((i) =>
      this.nodes.push(
        new Quad(
          p,
          i.x,
          i.y,
          halfwidth,
          halfheight,
          this.threshold,
          this.max_depth,
          this.depth + 1,
        ),
      ),
    );
    const units = Array.from(this.val.values());
    this.val.clear();

    for (let unit of units) {
      for (let node of this.nodes) {
        if (node.isInside(unit.pos.x, unit.pos.y)) {
          node.insert(p, unit);
          break; // we inserted node, ig xd
        }
      }
    }
  }
  merge() {
    if (this.nodes.length <= 0) return;
    if (this.amount_children() > this.threshold) return; // fix here
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j of this.nodes[i].val) {
        this.nodes[i].merge();
        this.val.add(j);
      }
    }
    this.nodes = [];
  }
  remove(unit: Unit) {
    if (this.nodes.length > 0) {
      for (let i of this.nodes) {
        i.remove(unit);
      }
      if (this.amount_subtree() <= this.threshold) {
        this.merge();
      }
      return;
    }
    this.val.delete(unit);
    return;
  }
  // i will go insane lul
  insert(p: p5, unit: Unit) {
    this.remove(unit);
    if (!this.isInside(unit.pos.x, unit.pos.y)) return;
    for (const node of this.nodes) {
      if (node.isInside(unit.pos.x, unit.pos.y)) {
        node.insert(p, unit);
        return;
      }
    }
    this.val.add(unit);
    if (this.amount() > this.threshold) {
      this.split(p);
    }
  }
  collide() {
    if (this.child_count() > 0) {
      for (let i of this.nodes) {
        i.collide();
      }
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
  FindDepth(): number {
    let res = this.depth;
    for (let i of this.nodes) {
      res = Math.max(res, i.FindDepth());
    }
    return res;
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
      20,
    );
    setTimeout(async () => {
      for (let i = 0; i < 1000; i++) {
        circles.push(
          new Unit(
            p,
            clientWidth / 2 + Math.random() * clientWidth - clientWidth / 2,
            clientHeight / 2 + Math.random() * clientHeight - clientHeight / 2,
            Math.random() * 5 + 5,
            Math.random() * 2 + 1,
          ),
        );
        //await new Promise((r) => setTimeout(r, 100));
      }
    }, 0);
  };
  let max_depth = 0;
  p.draw = () => {
    //let mp = p.createVector(p.mouseX, p.mouseY);
    p.background(220);

    for (let i of circles) {
      i.move();
      root.insert(p, i);
    }

    root.draw(p);
    for (let i of circles) {
      i.draw(p);
    }
    root.collide();
    console.log("overall " + circles.length + " root:" + root.amount());
    max_depth = Math.max(max_depth, root.FindDepth());
    console.log("depth: " + max_depth);
  };
};

new p5(sketch, document.getElementById("main"));
