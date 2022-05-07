let config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 700,
    physics: {
        default: "arcade",
        arcade: { fps: 60 } 
    },
    scene: [DashScene2, DashScene, HexScene, DanceScene, SlideScene]
}

//keys and setup
let key_left, key_right, key_up, key_down, key_next, key_prev, key_space;
let game_settings;

let game = new Phaser.Game(config);