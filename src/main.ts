// parówka a nie kod :P

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
    let bord = false;
    if (this.pos.x <= this.r || this.pos.x > clientWidth - this.r) {
      this.dir.x *= -1;
      bord = true;
    }
    if (this.pos.y <= this.r || this.pos.y > clientHeight - this.r) {
      this.dir.y *= -1;
      bord = true;
    }
    if (bord) {
      this.move();
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

  // TODO: implement borders for optimization (isInside)
  top_border: number;
  bottom_border: number;
  left_border: number;
  right_border: number;

  subtree_sum?: number = undefined;

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

    this.left_border = this.pos.x - this.width / 2;
    this.right_border = this.pos.x + this.width / 2;
    this.bottom_border = this.pos.y - this.height / 2;
    this.top_border = this.pos.y + this.height / 2;
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
    let sum = this.amount();
    for (let i = 0; i < this.nodes.length; i++) {
      sum += this.nodes[i].amount_subtree();
    }
    this.subtree_sum = sum;
    return sum;
  }
  amount_children(): number {
    let sum = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      sum += this.nodes[i].amount();
    }
    this.subtree_sum = sum;
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
    this.subtree_sum = this.val.size;

    for (let unit of this.val) {
      for (let node of this.nodes) {
        if (node.isInside(unit.pos.x, unit.pos.y)) {
          node.insert(p, unit);
          break; // we inserted node, ig xd
        }
      }
    }
    this.val.clear();
  }
  merge() {
    if (this.nodes.length <= 0) return;
    if (this.subtree_sum === undefined) this.amount_subtree();
    // @ts-ignore
    if (this.subtree_sum > this.threshold) return;
    for (let i of this.nodes) {
      for (let j of i.val) {
        i.merge();
        this.val.add(j);
      }
    }
    this.nodes = [];
  }
  remove(unit: Unit): boolean {
    if (this.subtree_sum === undefined) this.amount_subtree();

    // ok someone isn't inside me!
    let isRemoved = false;
    if (this.nodes.length > 0) {
      for (let i of this.nodes) {
        if (!isRemoved) {
          isRemoved = i.remove(unit);
        } else {
          i.remove(unit);
        }
      }
      if (this.subtree_sum === undefined) this.amount_subtree();

      // @ts-ignore
      if (isRemoved) this.subtree_sum -= 1;

      // @ts-ignore
      if (this.subtree_sum <= this.threshold) this.merge();

      return isRemoved;
    }
    if (this.val.delete(unit)) {
      // @ts-ignore
      this.subtree_sum -= 1;
      return true;
    }
    return isRemoved;
  }
  // i will go insane lul
  insert(p: p5, unit: Unit): boolean {
    /*
    if (!this.isInside(unit.pos.x, unit.pos.y)) {
      // i don't have it i will remove it
      // i don't care remove will handle it
      this.remove(unit);
      return false;
    }
    */
    if (this.subtree_sum === undefined) this.amount_subtree();
    let isInserted = false;

    for (const node of this.nodes) {
      // ask children
      if (node.isInside(unit.pos.x, unit.pos.y)) {
        // is inside of my child?
        if (!isInserted) {
          isInserted = node.insert(p, unit); // had my child handled it succesfully?
        } else {
          break; // i had inserted this unit already, please no copies :begbegbeg:
        }
      }
    }
    if (isInserted) {
      // my child had inserted, i don't care about the rest
      // my size go vroom vroom
      // @ts-ignore
      this.subtree_sum += 1;
      return true;
    }
    // i have kids (not in irl lul)
    // why i didn't care to give them
    // it means false res
    if (this.child_count() > 0) {
      return false;
    }
    if (!this.val.has(unit)) {
      // in theory i add only once >->
      this.val.add(unit);
      // @ts-ignore
      this.subtree_sum += 1;
      isInserted = true;
    }
    if (this.amount() > this.threshold) {
      // i have too much
      this.split(p);
    }

    return isInserted;
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
      x >= this.left_border &&
      x < this.right_border &&
      y >= this.bottom_border &&
      y < this.top_border
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
      2,
      20,
    );
    setTimeout(async () => {
      for (let i = 0; i < 500; i++) {
        circles.push(
          new Unit(
            p,
            clientWidth / 2 +
              Math.random() * (clientWidth - 100) -
              (clientWidth - 100) / 2,
            clientHeight / 2 +
              Math.random() * (clientHeight - 100) -
              (clientHeight - 100) / 2,
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
      root.remove(i);
      root.insert(p, i);
    }
    root.collide();

    root.draw(p);
    for (let i of circles) {
      i.draw(p);
    }
    console.log(root.subtree_sum);
  };
};

new p5(sketch, document.getElementById("main"));
