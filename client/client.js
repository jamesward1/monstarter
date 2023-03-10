import Phaser from 'phaser'

class Example extends Phaser.Scene {
	constructor() {
		super();
	}

	preload() {

	}

	create() {

	}
}
const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	backgroundColor: '#222',
	parent: 'phaser-example',
	scene: [Example]
};

const game = new Phaser.Game(config);