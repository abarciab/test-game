let config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 700,
    physics: {
        default: "arcade",
        arcade: { fps: 60 } 
    },
    scene: [TestScene]
}

//keys and setup
let key_left, key_right, key_up, key_down;
let pointer;

let game_settings = {
    playerSpeed: 50
}

let game = new Phaser.Game(config);