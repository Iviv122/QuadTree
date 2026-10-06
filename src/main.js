import "./style.css";
import p5 from "p5";

const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(clientWidth, clientHeight);
  };

  p.draw = () => {
    p.background(220);
  };
};

new p5(sketch, document.getElementById("main"));
