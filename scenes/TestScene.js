class TestScene extends Phaser.Scene {
    constructor() {
        super("TestScene");
    }

    preload(){
        this.load.image('white square', './assets/White square.png');
        this.load.image('white arrow', './assets/White arrow.png');
    }

    create(){
        //setup functions
        this.SetupKeys();

        //position variables
        let center_x = game.config.width/2;
        let center_y = game.config.height/2

        this.player = this.add.sprite(center_x, center_y, 'white square').setOrigin(0.5);
        this.enemy = this.add.sprite(center_x + 50, center_y, 'white square').setOrigin(0.5).setTint('0xaa0000');
        this.enemy.arrow = this.add.sprite(center_x + 100, center_y, 'white arrow').setOrigin(0.5).setTint('0xaa0000');
        this.enemy.dir = "";
    }

    SetupKeys(){
        key_left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        key_right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        key_up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        key_down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        pointer = this.input.activePointer;
    }

    update(){
        if (Phaser.Input.Keyboard.JustDown(key_left)){
            this.movePlayer("LEFT");
        }
        if (Phaser.Input.Keyboard.JustDown(key_right)){
            this.movePlayer("RIGHT");
        }
        if (Phaser.Input.Keyboard.JustDown(key_up)){
            this.movePlayer("UP");
        }
        if (Phaser.Input.Keyboard.JustDown(key_down)){
            this.movePlayer("DOWN");
        }
    }

    movePlayer(dir){
        switch(dir){
            case "LEFT":
                this.player.x -= game_settings.playerSpeed;
                break;
            case "RIGHT":
                this.player.x += game_settings.playerSpeed;
                break;
            case "UP":
                this.player.y -= game_settings.playerSpeed;
                break;
            case "DOWN":
                this.player.y += game_settings.playerSpeed;
                break;
        }

        this.moveEnemy(this.enemy);
    }

    moveEnemy(enemy){
        switch(enemy.dir){
            case "LEFT":
                enemy -= game_settings.playerSpeed;
                break;
            case "RIGHT":
                enemy += game_settings.playerSpeed;
                break;
            case "UP":
                enemy -= game_settings.playerSpeed;
                break;
            case "DOWN":
                enemy += game_settings.playerSpeed;
                break;
        }
        if (enemy.x > game.config.width){
            enemy.x = game.config.width;
        }
        if (enemy.x < 0){
            enemy.x = 0;
        }
        if (enemy.y > game.config.height){
            enemy.y = game.config.height
        }
        if (enemy.y < 0){
            enemy.y = 0
        }
        enemy.arrow.x = enemy.x;
        enemy.arrow.y = enemy.y;


        switch(Phaser.Math.Between(1, 4)){
            case 1:
                enemy.dir = "LEFT";
                enemy.arrow.x += game_settings.playerSpeed;
                break;
            case 2:
                enemy.dir = "RIGHT";
                enemy.arrow.x -= game_settings.playerSpeed;
                break;
            case 3:
                enemy.dir = "UP";
                enemy.arrow.y += game_settings.playerSpeed;
                break;
            case 4:
                enemy.dir = "DOWN";
                enemy.arrow.y -= game_settings.playerSpeed;
                break;
        }
        
        
    }
}