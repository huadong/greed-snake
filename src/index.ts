import Snake from './snake';

import './styles/index.css';


var canvas: HTMLCanvasElement = document.getElementById("snake") as HTMLCanvasElement;

if(canvas) {
    var snake = new Snake(canvas, 2);
} else {
    alert("Can't find canvas.");
}