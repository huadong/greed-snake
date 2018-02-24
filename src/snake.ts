class Point {
    x: number = 0;
    y: number = 0;

    constructor(x?: number, y?: number) {
        if (x) {
            this.x = x;
        }
        if (y) {
            this.y = y;
        }
    }

    toString(): string {
        return `${this.x},${this.y}`
    }
}

class Circle {
    point: Point = new Point();
    radius: number = 0;

    constructor(point: Point, radius: number) {
        this.point = point;
        this.radius = radius;
    }

    innerSquare(): Rect {
        let c = this.point;
        let w = this.radius / Math.SQRT2;

        return new Rect(
            new Point(c.x - w, c.y - w),
            new Point(c.x + w, c.y + w)
        );
    }

    outerSquare(): Rect {
        let c = this.point;
        let w = this.radius;

        return new Rect(
            new Point(c.x - w, c.y - w),
            new Point(c.x + w, c.y + w)
        );
    }

    toString(): string {
        return `(${this.point}),${this.radius}`
    }
}

class Rect {
    start: Point = new Point();
    end: Point = new Point();

    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }

    get center(): Point {
        return new Point(
            (this.start.x + this.end.x) / 2,
            (this.start.y + this.end.y) / 2,
        );
    }

    get topLeft(): Point {
        return new Point(this.start.x, this.start.y);
    }

    get topRight(): Point {
        return new Point(this.end.x, this.start.y);
    }

    get bottomLeft(): Point {
        return new Point(this.start.x, this.end.y);
    }

    get bottomRight(): Point {
        return this.end;
    }

    get width(): number {
        return this.end.x - this.start.x;
    }

    get height(): number {
        return this.end.y - this.start.y;
    }

    innerSquare(): Rect {
        let c = this.center;
        let w = Math.min(this.width, this.height);

        return new Rect(
            new Point(c.x - w / 2, c.y - w / 2),
            new Point(c.x + w / 2, c.y + w / 2)
        );
    }

    outerSquare(): Rect {
        let c = this.center;
        let w = Math.max(this.width, this.height);

        return new Rect(
            new Point(c.x - w / 2, c.y - w / 2),
            new Point(c.x + w / 2, c.y + w / 2)
        );
    }

    innerCircle(): Circle {
        let r = Math.min(this.width, this.height) / 2;

        return new Circle(this.center, r);
    }

    outerCircle(): Circle {
        let r = Math.max(this.width, this.height) / 2;

        return new Circle(this.center, r);
    }

    toString(): string {
        return `(${this.start}),(${this.start})`
    }
}

type Direction = "right" | "left" | "down" | "up";

class Command {
    static SEQUENCE: number = 0;
    _sequence: number = 0;
    point: Point;
    direction: Direction;

    constructor(point: Point, direction: Direction) {
        this._sequence = Command.SEQUENCE++;
        this.point = point;
        this.direction = direction;
    }

    get sequence(): number {
        return this._sequence;
    }

    toString(): string {
        return `${this.sequence}:(${this.point}),${this.direction}`;
    }
}

class Part {
    cmd?: number;
    point: Point;
    direction: Direction;

    constructor(point: Point, direction: Direction, cmd?: number) {
        this.point = point;
        this.direction = direction;
        this.cmd = cmd;
    }

    toString(): string {
        return `${this.cmd}:(${this.point}),${this.direction}`;
    }
}

class Player {
    _original: Part;
    snake: Array<Part> = [];
    commands: Array<Command> = [];

    constructor(part?: Part) {
        if (part) {
            this._original = new Part(new Point(part.point.x, part.point.y), part.direction);
            this.snake.push(part);
        } else {
            this._original = new Part(new Point(0, 0), "right");
            this.snake.push(new Part(new Point(0, 0), "right"));
        }
    }

    reset() {
        this.snake = [];
        this.snake.push(new Part(
            new Point(this._original.point.x, this._original.point.y),
            this._original.direction));
        this.commands = [];
    }
}

class Snake {
    _callbacks: {[name:string]:any} = {};

    _cols: number = 40;
    _rows: number = 40;
    _canvas: HTMLCanvasElement;
    _matrix: Array<Array<Rect>>;

    _mouses: Array<Point> = [];
    _players: Array<Player> = [];

    //state
    INTERVAL: number = 50;
    ELAPSE: number = 5;
    _tickInterval: number | null = null;
    _tickCount: number = 0;
    _playerCount: number = 1;
    _status: boolean = true;

    constructor(canvas: HTMLCanvasElement, players: number = 1,
         callbacks?: {[name:string]:any}) {
        this._onKeydown = this._onKeydown.bind(this);
        this.draw = this.draw.bind(this);

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this._canvas = canvas;

        this._cols = Math.floor(this._rows*canvas.clientWidth/canvas.clientHeight);

        if(callbacks) {
            this._callbacks = callbacks;
        }

        //axis matrix
        this._matrix = [];

        let X: number = this.width / (this._cols);
        let Y: number = this.height / (this._rows);

        for (let i = 0; i < this._cols; i++) {
            if (!this._matrix[i]) {
                this._matrix[i] = []
            }
            for (let j = 0; j < this._rows; j++) {
                this._matrix[i][j] = new Rect(
                    new Point(X * i, Y * j),
                    new Point(X * (i + 1), Y * (j + 1))
                );
            }
        }

        //init game
        this._playerCount = players;
        this.init();
    }

    init() {
        //keyboard
        window.addEventListener("keydown", this._onKeydown, true);
        //start tick
        this.start();
        //start draw
        this.draw()
    }

    start(player?: Player) {
        if (player) {
            player.reset();
        } else {
            this._players = [];
            this._players.push(new Player());
            if (this.playerCount > 1) {
                this._players.push(new Player(
                    new Part(new Point(this._cols - 1, this._rows - 1), "left")));
            }
        }
        this._startTick();
    }

    _startTick() {
        this._stopTick();
        this._tickInterval = setInterval(() => this._tick(), this.INTERVAL);
    }

    _stopTick() {
        if (this._tickInterval) {
            clearInterval(this._tickInterval);
        }
    }

    _tick() {
        if(!this._status) {
            return;
        }
        
        let t = ++this._tickCount % this.ELAPSE;
        if (t == 0) {
            this._tickCount = 0;
            this._move();
            this._eatMouse();
            this._randomMouses();
        }
    }

    _move() {
        this._players.forEach((player) => {
            let snake: Array<Part> = player.snake;
            for (let i = 0; i < snake.length; i++) {
                let p = snake[i];
                switch (p.direction) {
                    case "down":
                        ++p.point.y;
                        break;
                    case "up":
                        --p.point.y;
                        break;
                    case "left":
                        --p.point.x;
                        break;
                    case "right":
                    default:
                        ++p.point.x;
                }
                this._nextMotion(player.commands, p, i == (snake.length - 1));
                if (i == 0) {
                    if (p.point.x < 0
                        || p.point.x >= this._cols
                        || p.point.y < 0
                        || p.point.y >= this._rows) {
                        //out of bound
                        this.start(player);
                    }
                    for (let j = 1; j < snake.length; j++) {
                        if (p.point.x == snake[j].point.x
                            && p.point.y == snake[j].point.y) {
                            //bike itself
                            this.start(player);
                            break;
                        }
                    }
                }
            }
        });
    }

    _nextMotion(commands: Array<Command>, part: Part, last: boolean) {
        if (commands.length < 1) {
            return;
        }

        //console.debug(`next-1: ${part}`);
        let cmd = commands[commands.length - 1];
        if (!part.cmd || part.cmd < cmd.sequence) {
            for (let i = 0; i < commands.length; i++) {
                cmd = commands[i];
                if ((!part.cmd || part.cmd < cmd.sequence)
                    && (part.point.x == cmd.point.x
                        && part.point.y == cmd.point.y)) {
                    part.cmd = cmd.sequence;
                    part.direction = cmd.direction;
                    if (last) {
                        commands.splice(i, 1);
                    }
                    // console.debug(`next: ${part}`);
                    break;
                }
            }
        }
        //console.debug(`next-2: ${part}`);
    }

    _eatMouse() {
        this._players.forEach((player) => {
            let snake: Array<Part> = player.snake;
            let pt = snake[0];
            for(let i=0; i<this._mouses.length; i++) {
                let m = this._mouses[i];
                if (pt.point.x == m.x && pt.point.y == m.y) {
                    console.debug(`eat: ${m}`);
                    this._mouses.splice(i--, 1);
                    this._snakeGrow(player);
                    if(this._callbacks.eat) {
                        this._callbacks.eat();
                    }
                }
            }
        });
    }

    _snakeGrow(player: Player) {
        let snake: Array<Part> = player.snake;
        let p = snake[snake.length - 1];
        let t = new Part(new Point(p.point.x, p.point.y), p.direction, p.cmd);

        switch (p.direction) {
            case "down":
                --t.point.y;
                break;
            case "up":
                ++t.point.y;
                break;
            case "left":
                ++t.point.x;
                break;
            case "right":
            default:
                --t.point.x;
        }

        snake.push(t);
        console.info(`grow: ${snake}`);
    }

    _randomMouses() {
        while (this._mouses.length < this.playerCount) {
            let x = Math.round(Math.random() * (this._cols - 1));
            let y = Math.round(Math.random() * (this._rows - 1));
            this._mouses.push(new Point(x, y));
        }
    }

    _onKeydown(e: KeyboardEvent) {
        if (e.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }

        let snake = this._players[0].snake;
        let commands = this._players[0].commands;

        if (this.playerCount > 1) {
            switch (e.key) {
                case "a":
                case "A":
                case "s":
                case "S":
                case "d":
                case "D":
                case "w":
                case "W":
                    snake = this._players[1].snake;
                    commands = this._players[1].commands;
                    break;
            }
        }

        let direct: Direction | null = null;
        switch (e.key) {
            case "s":
            case "S":
            case "ArrowDown":
                direct = "down";
                break;
            case "w":
            case "W":
            case "ArrowUp":
                direct = "up";
                break;
            case "a":
            case "A":
            case "ArrowLeft":
                direct = "left";
                break;
            case "d":
            case "D":
            case "ArrowRight":
                direct = "right";
                break;
            case " ":
                this._status = !this._status;
                console.log(`snake: ${snake}`);
                console.log(`cmds: ${commands}`);
                break;
            default:
                return; // Quit when this doesn't handle the key event.
        }
        if (!direct) {
            return;
        }
        // Cancel the default action to avoid it being handled twice
        e.preventDefault();

        let pt = snake[0];
        if (pt.direction == direct) {
            //ignore the same direction with snake's heading
            return;
        } else if (snake.length > 1) {
            let p2 = snake[1];
            if (p2.point.x == pt.point.x) {
                //same col
                if (pt.point.y - p2.point.y > 0
                    && direct == "up") {
                    return;
                } else if (pt.point.y - p2.point.y < 0
                    && direct == "down") {
                    return;
                }
            } else {
                //same row
                if (pt.point.x - p2.point.x > 0
                    && direct == "left") {
                    return;
                } else if (pt.point.x - p2.point.x < 0
                    && direct == "right") {
                    return;
                }
            }
        }

        pt.direction = direct;
        let cmd = new Command(new Point(pt.point.x, pt.point.y), direct);
        console.debug(`cmd: ${cmd}`);
        if (snake.length < 2) {
            return;
        }

        if (commands.length > 0) {
            let c = commands[commands.length - 1];//last command
            if (c.point.x == cmd.point.x
                && c.point.y == cmd.point.y) {
                if (c.direction != cmd.direction) {
                    //just update
                    c.direction = cmd.direction;
                    for (let i = 0; i < snake.length; i++) {
                        let p = snake[i];
                        if (!p.cmd || p.cmd < c.sequence) {
                            break;
                        } else if (p.cmd == c.sequence) {
                            p.direction = c.direction;
                        }
                    }
                }
            } else {
                commands.push(cmd);
            }
        } else {
            commands.push(cmd);
        }

        pt.cmd = commands[commands.length - 1].sequence;
        console.debug(`cmds: ${commands}`);
    }

    get context(): CanvasRenderingContext2D {
        return this._canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    get width(): number {
        return this._canvas.width;
    }

    get height(): number {
        return this._canvas.height;
    }

    get playerCount(): number {
        return this._playerCount;
    }

    draw() {
        //clear
        let ctx = this.context;
        let w = this.width;
        let h = this.height;

        ctx.clearRect(0, 0, w, h);

        this.drawMouses();
        this.drawSnakes();
        //next frame
        window.requestAnimationFrame(this.draw);
    }

    drawSnakes() {
        let ctx = this.context;
        let p = 0;
        this._players.forEach((player) => {
            ctx.save();
            let snake = player.snake;
            for (let i = 0; i < snake.length; i++) {
                let color = (p==0? "#f476ff":"#47e642");
                if(i == 0) {
                    color = (p==0? "red":"green");
                }
                this.drawCircle(snake[i].point, color);
                if (i == 0) {
                    this.drawText(`${snake.length}`, snake[i].point);
                }
            }
            ctx.restore();
            p++;
        });
    }

    drawMouses() {
        let ctx = this.context;
        this._mouses.forEach((mouse) => {
            if (mouse) {
                ctx.save();
                this.drawCircle(mouse, "#5c5c53");
                ctx.restore();
            }
        });
    }

    drawText(text: string, point: Point, color?: string) {
        let rt = this._matrix[point.x][point.y];
        let pt = rt.center;

        let ctx = this.context;
        ctx.fillStyle = color ? color : 'blue';
        ctx.font = `${rt.innerCircle().radius}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pt.x, pt.y);
    }

    drawCircle(point: Point, color?: string) {
        if (point.x < 0 || point.y < 0
            || point.x >= this._cols || point.y >= this._rows) {
            //ignore overflow axis
            return;
        }
        let c = this._matrix[point.x][point.y].innerCircle();
        //console.debug(`draw circle: ${c}`);
        this._drawCircle(c.point, c.radius, color);
    }

    _drawCircle(point: Point, radius: number, color?: string) {
        let ctx = this.context;
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        let anticlockwise = true; 

        ctx.fillStyle = color ? color : 'red';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, startAngle, endAngle, anticlockwise);
        ctx.fill();
    }
}

export default Snake;