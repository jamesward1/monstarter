import Phaser from 'phaser'
import Data from '../../cafe-back/server/public/js/util/data.mjs'

$('body').on('contextmenu', 'canvas', function (e) { return false; });
class Example extends Phaser.Scene {
	constructor() {
		super();
		this.started = false;
		this.tick = 0;
		this.tickFreq = 140;
		this.graph = [];
		this.bounds = [];
		this.displayBounds = [];
		this.water = [];
		this.path = [];
		this.road = [];
		this.start = null;
		this.end = null;
		this.activeEndpoint = null;
		this.offset = -8;
		this.socket = io();


		this.context = "bounds";
		this.type = "line";
		this.square = "square-black";
		this.contexts = {
			"bounds": {
				square: "square-black",
				types: ["line"],
				icon: "B",
				depth: 4,
			},
			"water": {
				square: "square-blue",
				types: ["area", "line", "single"],
				icon: "W",
				depth: 3,
			},
			"path": {
				square: "square-tan",
				types: ["area", "line", "single"],
				icon: "P",
				depth: 1,
			},
			"road": {
				square: "square-gray",
				types: ["area", "line", "single"],
				icon: "R",
				depth: 2,
			},
			//"erasing": {
			//	square: "square",
			//	types: ["single"],
			//	icon: "E"
			//}
		}
		this.all = false;
		this.types = { "line": null, "area": null, "single": null }
		this.contextButtons = [];
		this.typeButtons = [];
		console.log(Data.data.scenes);
	}

	preload() {
		this.load.image("dot", "assets/dot.png");
		this.load.image("line", "assets/line.png");
		this.load.image("square", "assets/square.png");
		this.load.image("square-filled", "assets/square-filled.png");
		this.load.image("square-green", "assets/square-green.png");
		this.load.image("square-black", "assets/square-black.png");
		this.load.image("square-blue", "assets/square-blue.png");
		this.load.image("square-tan", "assets/square-tan.png");
		this.load.image("square-gray", "assets/square-gray.png");
		this.load.image("empty", "assets/empty.png");
		this.size = 100;

		Object.keys(this.contexts).forEach((context, i) => {
			let button = $('<button class="context-btn btn">' + this.contexts[context].icon + "</button>");
			button.click(() => {
				if (button.hasClass('disabled')) { return; }
				this.contextButtons.forEach(b => {
					b.removeClass("active");
				})
				Object.keys(this.contexts).forEach(c => {
					if (c != context && this.contexts[c].l) {
						this.contexts[c].l.alpha = 0.7;
					} else if (c == context && this.contexts[c].l) {
						this.contexts[c].l.alpha = 1;
					}
				})
				button.addClass("active")
				this.context = context;
				this.square = this.contexts[context].square;
				if (!this.contexts[context].types.includes(this.type)) {
					this.types[this.contexts[context].types[0]].click();
				}
				Object.keys(this.types).forEach(type => {
					if (!this.contexts[context].types.includes(type)) {
						this.types[type].addClass('disabled');
					} else {
						this.types[type].removeClass('disabled');
					}
				})
			})
			this.contextButtons.push(button);
			$('#menu').append(button);
		})
		let button = $('<button class="context-btn btn">A</button>');
		button.click(() => {
			this.contextButtons.forEach(b => {
				b.removeClass("active");
			})
			button.addClass("active")
			this.context = null;
			Object.values(this.contexts).forEach(c => {
				c.l.alpha = 1;
			})
		});
		this.contextButtons.push(button);
		$('#menu').append(button);

		Object.keys(this.types).forEach((type, i) => {
			let button = $('<button class="context-btn btn">' + type + "</button>");
			if (i === 0) {
				button.addClass('active');
			}
			button.click(() => {
				if (button.hasClass('disabled')) { return; }
				this.typeButtons.forEach(b => {
					b.removeClass("active");
				})
				button.addClass("active");
				this.type = type;
			})
			this.typeButtons.push(button);
			this.types[type] = button;
			$('#type-menu').append(button);
		})

		this.contextButtons[0].click();
	}

	create() {

		this.input.keyboard.on('keydown-ESC', (event) => {
			this.clearDraw();
		});


		$('#results').click((e) => {
			console.log("hayyyy")
			e.stopPropagation();
		})

		$('#bake').click((e) => {
			console.log("hayyyy")
			e.stopPropagation();
			this.bake();
		})


		for (let y = 0; y < this.size; y++) {
			let row = []
			for (let x = 0; x < this.size; x++) {
				let node = this.add.sprite(x * 16 + 8, y * 16 + 8, 'square').setInteractive()
				node.on('pointerover', function (pointer) {
					if (node.texture.key !== 'square' && node.texture.key !== 'square-filled') { return }
					node.setTexture('square-filled');
					//node.setScale(1.2);
				})
				node.on('pointerdown', (pointer) => {
					//if(pointer.downElement != canvas)
					//node.setScale(1.2);
					if (pointer.event.button === 0) {
						if (!this.started && this.context !== null) {
							if (pointer.downElement.localName != 'canvas') {
								return;
							};
							$('.ui').addClass('uiDisabled');
							console.log("[" + x + ", " + y + "]")
							this.started = true;
							node.setTexture('square-green');
							//this.bounds.push([x, y]);
							this.start = [x, y];
						}
					} else if (pointer.event.button === 2) {
						if (!this.started) {
							this.erase(x, y);
						}
					}
				})

				node.on('pointerout', function (pointer) {
					if (node.texture.key !== 'square' && node.texture.key !== 'square-filled') { return }
					node.setTexture('square');
					//node.setScale(1);
				})
				node.depth = 5;
				/*
				let node = this.add.sprite(x * 16 + 8, y * 16 + 8, 'dot').setInteractive()
				node.on('pointerover', function (pointer) {
					node.setScale(4);
				})
				node.on('pointerout', function (pointer) {
					node.setScale(1);
				})
				this.add.image(x * 16 + 16, y * 16 + 8, 'line')
				this.add.image(x * 16 + 8, y * 16 + 16, 'line').setAngle(90)
				*/
				row.push(node);
			}
			this.graph.push(row);
			this.bounds.push(Array.apply(null, Array(100)));
			this.water.push(Array.apply(null, Array(100)));
			this.path.push(Array.apply(null, Array(100)));
			this.road.push(Array.apply(null, Array(100)));
		}
		this.contexts['bounds'].g = this.bounds;
		this.contexts['water'].g = this.water;
		this.contexts['path'].g = this.path;
		this.contexts['road'].g = this.road;
		this.contexts['bounds'].l = this.add.layer();
		this.contexts['bounds'].l.depth = this.contexts['bounds'].depth;
		this.contexts['water'].l = this.add.layer();
		this.contexts['water'].l.depth = this.contexts['water'].depth;
		this.contexts['path'].l = this.add.layer();
		this.contexts['path'].l.depth = this.contexts['path'].depth;
		this.contexts['road'].l = this.add.layer();
		this.contexts['road'].l.depth = this.contexts['road'].depth;
		this.input.on('pointerdown', (pointer) => {
			console.log("general pointer down");
			if (pointer.event.button === 0) {
				if (this.started && this.end) {
					if (this.type == "line") {
						this.drawLine(this.start, this.end, this.context);
					} else if (this.type == "area") {
						this.drawArea(this.start, this.end, this.context);
					}
					//this.bounds.push(this.activeEndpoint);
					this.start = this.end;
				} else {
					//if (this.type == "single") {
					//	this.drawSingle(x, y, this.contexts[this.context].square);
					//}
				}
				//this.started = false;
			} else if (pointer.event.button === 2) {
				if (this.started) {
					this.clearDraw();
				}
			}
		})

		this.loadCB(Data.data.scenes.Smalltown.info.cb);
	}

	loadCB(cb) {
		for (let i = 0; i < cb.length; i++) {
			let p1 = cb[i];
			let p2 = cb[(i + 1) % cb.length];
			console.log(p1);
			console.log(p2);
			this.drawLine([p1[0] - this.offset, p1[1] - this.offset], [p2[0] - this.offset, p2[1] - this.offset], 'bounds');
			/*
			let p1 = cb[i];
			let p2 = cb[(i + 1) % cb.length];
			if (p1[0] != p2[0]) {
				let start = p1;
				let end = p2;
				if (p1[0] > p2[0]) {
					start = p2;
					end = p1;
				}
				for(let x = start[0]; x < end[0]; x++){

				}
			}
			*/
		}
	}

	update() {
		this.tick++;
		if (this.tick == this.tickFreq) {
			if (this.started) {
				//this.normalize();
			}
			this.writeToConsole();
			this.tick = 0;
		}
		if (this.started) {
			this.clearTexture('square-green');
			//console.log(this.input.activePointer.worldX);
			//.log(this.input.activePointer.worldY);
			let x = Math.floor(this.input.activePointer.worldX / 16);
			let y = Math.floor(this.input.activePointer.worldY / 16);
			/*
			let ref = this.bounds[this.bounds.length - 1];
			if (Math.abs(x - ref[0]) < Math.abs(y - ref[1])) {
				this.activeEndpoint = [ref[0], y]
				let end = [this.bounds[this.bounds.length - 1][0], y]
				this.drawLine(this.bounds[this.bounds.length - 1], end, "square-green", ["square-black"]);
			} else {
				this.activeEndpoint = [x, ref[1]]
				let end = [x, this.bounds[this.bounds.length - 1][1]]
				this.drawLine(this.bounds[this.bounds.length - 1], end, "square-green", ["square-black"]);
			}
			*/
			if (this.type == 'line') {
				this.handleLine(x, y);
			} else if (this.type == 'area') {
				this.handleArea(x, y);
			} else if (this.type == 'single') {
				this.drawSingle(x, y, null);
				this.clearDraw();
			}
		}
	}

	erase(x, y) {
		if (this.contexts[this.context].g[y][x] && this.contexts[this.context].g[y][x].texture.key == this.contexts[this.context].square) {
			this.contexts[this.context].g[y][x].setTexture('empty');
		}
	}

	clearDraw() {
		this.started = false;
		//this.bounds = [];
		this.start = null;
		this.end = null;
		this.activeEndpoint = null
		this.clearTexture('square-green');
		$('.ui').removeClass('uiDisabled');
	}

	normalize() {
		let tx = this.bounds[0][0];
		let ty = this.bounds[0][1];
		this.bounds.forEach(node => {
			if (node[0] < tx) {
				tx = node[0];
			}
			if (node[1] < ty) {
				ty = node[1];
			}
		});
		this.displayBounds = [];
		this.bounds.forEach(node => {
			this.displayBounds.push([node[0] - tx, node[1] - ty]);
		})
	}

	clearTexture(texture) {
		this.graph.forEach(row => {
			row.forEach(node => {
				if (node.texture.key == texture) {
					node.setTexture('square');
				}
			})
		})
	}

	drawSingle(x, y, context) {
		//if (this.graph[y][x].texture.key !== "square" && this.graph[y][x].texture.key !== "square-filled" && this.graph[y][x].texture.key !== "square-green") { return }
		//if (noOverwrite.includes(this.graph[i][start[0]].texture.key)) { continue; }
		//this.graph[y][x].setTexture(texture);
		this.drawTile(x, y, context);
	}

	handleArea(x, y) {
		this.end = [x, y];
		this.drawArea(this.start, this.end, null);
	}

	drawArea(start, end, context) {
		let sx = start[0];
		let sy = start[1];
		let tx = end[0];
		let ty = end[1];
		if (end[0] < start[0]) {
			sx = end[0];
			tx = start[0];
		}
		if (end[1] < start[1]) {
			sy = end[1];
			ty = start[1];
		}
		for (let i = sx; i <= tx; i++) {
			for (let j = sy; j <= ty; j++) {
				//if (this.graph[j][i].texture.key !== "square" && this.graph[j][i].texture.key !== "square-filled" && this.graph[j][i].texture.key !== "square-green") { continue }
				//if (noOverwrite.includes(this.graph[i][start[0]].texture.key)) { continue; }
				//this.graph[j][i].setTexture(texture);
				this.drawTile(i, j, context);
			}
		}
	}

	drawTile(x, y, context) {
		let graph;
		let depth;
		let texture;
		let layer;
		if (context) {
			graph = this.contexts[context].g;
			depth = this.contexts[context].depth;
			texture = this.contexts[context].square;
			layer = this.contexts[context].l;
		} else {
			graph = this.graph;
			depth = 5;
			texture = "square-green";
		}
		if (graph[y][x] == null) {
			let tile = this.add.image(x * 16 + 8, y * 16 + 8, texture);
			tile.depth = depth;
			if (layer) {
				layer.add(tile);
			}
			graph[y][x] = tile;
		} else if (graph[y][x].texture.key == 'empty' || graph[y][x].texture.key == 'square') {
			graph[y][x].setTexture(texture)
		}
	}

	handleLine(x, y) {

		if (Math.abs(x - this.start[0]) < Math.abs(y - this.start[1])) {
			this.end = [this.start[0], y]
			//let end = [this.start[0], y]
			this.drawLine(this.start, this.end, null);
		} else {
			this.end = [x, this.start[1]]
			//let end = [x, this.start[1]]
			this.drawLine(this.start, this.end, null);
		}
	}

	drawLine(start, end, context) {
		if (start[0] == end[0]) {
			if (end[1] < start[1]) {
				let temp = start;
				start = end;
				end = temp;
			}
			for (let i = start[1]; i <= end[1]; i++) {
				if (this.graph[i][start[0]].texture.key !== "square" && this.graph[i][start[0]].texture.key !== "square-filled" && this.graph[i][start[0]].texture.key !== "square-green") { continue }
				//if (noOverwrite.includes(this.graph[i][start[0]].texture.key)) { continue; }
				//this.graph[i][start[0]].setTexture(texture);
				this.drawTile(start[0], i, context);
			}
		} else if (start[1] == end[1]) {
			if (end[0] < start[0]) {
				let temp = start;
				start = end;
				end = temp;
			}
			for (let i = start[0]; i <= end[0]; i++) {
				if (this.graph[start[1]][i].texture.key !== "square" && this.graph[start[1]][i].texture.key !== "square-filled" && this.graph[start[1]][i].texture.key !== "square-green") { continue }
				//if (noOverwrite.includes(this.graph[start[1]][i].texture.key)) { continue; }
				//this.graph[start[1]][i].setTexture(texture);
				this.drawTile(i, start[1], context);
			}
		} else {
			console.log("No diagonal lines!");
		}
	}


	getBoundsArray(ignore = []) {
		let cb = [];
		let current = null;
		let linestart = null;
		let visited = []
		let startfound = false;
		for (let y = 0; y < 100; y++) {
			if (startfound) { break }
			for (let x = 0; x < 100; x++) {
				let cell = this.bounds[y][x];
				if (cell != null && cell.texture.key == 'square-black') {
					current = [x, y];
					linestart = [x, y];
					cb.push(linestart);
					startfound = true;
					break;
				}
			}
		}
		if (!current) { return }
		let finished = false;
		let iters = 0;
		while (!finished && iters < 200) {
			iters++;
			//console.log(current);
			if (cb.length > 1 && arraysEqual(current, cb[0])) {
				finished = true;
				break;
			}
			if (this.bounds[current[1]][current[0] + 1] && this.bounds[current[1]][current[0] + 1].texture.key == 'square-black' && !checkAll(visited, [current[0] + 1, current[1]])) {
				if (linestart[0] < current[0] + 1 && linestart[1] == current[1]) {
					visited.push(current);
					current = [current[0] + 1, current[1]];
				} else {
					cb.push(current);
					visited.push(current);
					linestart = current;
				}
			} else if (this.bounds[current[1] + 1][current[0]] && this.bounds[current[1] + 1][current[0]].texture.key == 'square-black' && !checkAll(visited, [current[0], current[1] + 1])) {
				if (linestart[1] < current[1] + 1 && linestart[0] == current[0]) {
					visited.push(current);
					current = [current[0], current[1] + 1];
				} else {
					cb.push(current);
					visited.push(current);
					linestart = current;
				}
			} else if (this.bounds[current[1]][current[0] - 1] && this.bounds[current[1]][current[0] - 1].texture.key == 'square-black' && !checkAll(visited, [current[0] - 1, current[1]])) {
				if (linestart[0] > current[0] - 1 && linestart[1] == current[1]) {
					visited.push(current);
					current = [current[0] - 1, current[1]];
				} else {
					cb.push(current);
					visited.push(current);
					linestart = current;
				}
			} else if (this.bounds[current[1] - 1][current[0]] && this.bounds[current[1] - 1][current[0]].texture.key == 'square-black' && !checkAll(visited, [current[0], current[1] - 1])) {
				if (linestart[1] > current[1] - 1 && linestart[0] == current[0]) {
					visited.push(current);
					current = [current[0], current[1] - 1];
				} else {
					cb.push(current);
					visited.push(current);
					linestart = current;
				}
			} else {
				finished = true;
			}
		}
		return cb;
	}

	writeToConsole() {

		let cb = this.getBoundsArray();
		cb && (this.cb = cb);
		let exporter = "const graph = [\n";
		cb && cb.forEach(node => {
			exporter += "    [" + (node[0] + this.offset) + ", " + (node[1] + this.offset) + "]\n";
		})
		exporter += "]";

		$('#results textarea').val(exporter)
	}



	bake() {
		let result = {
			cb: this.cb
		}
		//JSON.stringify(result);
		this.socket.emit("result", result)
	}
}

function checkAll(visited, cell) {
	let found = false;
	visited.forEach(v => {
		if (arraysEqual(v, cell)) {
			found = true;
		}
	})
	return found;
}

function arraysEqual(a, b) {

	return (a[0] == b[0] && a[1] == b[1]);
}

const config = {
	type: Phaser.AUTO,
	width: 1600,
	height: 1600,
	backgroundColor: '#eee',
	parent: 'phaser-example',
	scene: [Example]
};

const game = new Phaser.Game(config);