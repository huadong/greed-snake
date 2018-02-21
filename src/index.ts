import Snake from './snake';

import './styles/index.css';


var canvas: HTMLCanvasElement = document.getElementById("snake") as HTMLCanvasElement;
var mouse: HTMLAudioElement = document.getElementById("mouse") as HTMLAudioElement;

if(canvas) {
    var snake = new Snake(canvas, 2, {
        eat: () => {
            mouse.play();
        }
    });
} else {
    alert("Can't find canvas.");
}