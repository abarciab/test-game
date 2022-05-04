let config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 700,
    physics: {
        default: "arcade",
        arcade: { fps: 60 } 
    },
    scene: [DashScene, DanceScene]
}

//keys and setup
let key_left, key_right, key_up, key_down, key_next, key_prev;
let game_settings;



let game = new Phaser.Game(config);