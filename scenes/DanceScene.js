function initDance(){
    console.log('initializing dance scene');

    game_settings = {
        move_speed: 50,
        player_depth: 1,
        num_coins: 4,
        max_health: 3
    }
}

class DanceScene extends Phaser.Scene {
    constructor() {
        super("DanceScene");   
    }

    preload(){
        this.load.image('white square', './assets/white square.png');
        this.load.image('white arrow', './assets/white arrow.png');
    }

    create(){
        initDance();

        //setup functions
        this.SetupKeys();

        //alignment variables
        let center_x = game.config.width/2;
        let center_y = game.config.height/2

        //player
        this.player = this.add.sprite(center_x, center_y, 'white square').setOrigin(0.5).setDepth(game_settings.player_depth);

        //enemies
        this.enemies = [];
        this.spawnNewEnemy();
        
        //coins
        this.coins = [];
        for(let i = 0; i < game_settings.num_coins; i ++){
            let new_coin = this.add.sprite(center_x + 450, center_y, 'white square').setOrigin(0.5).setTint('0xbba000').setDepth();
            this.setRandomPosition(new_coin);
            this.coins.push(new_coin);
        }

        //score and lives
        this.score = 0;
        this.score_text = this.add.text(20, 20, "SCORE: 0");
        this.health = game_settings.max_health
        this.health_text = this.add.text(150, 20, "LIVES: 0");
        this.updateUI();
        
    }

    update(){
        this.updatePlayer();
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('DashScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_prev)){
            this.scene.start('HexScene');
        }
    }

    updateUI(){
        this.score_text.text = `SCORE: ${this.score}`;
        this.health_text.text = `LIVES: ${this.health}`;
    }

    spawnNewEnemy(){
        let new_enemy = {
            obj: this.add.sprite(0, 0, 'white square').setOrigin(0.5).setTint('0x880000').setDepth(0.5),
            arrow: this.add.sprite(0, 0, 'white arrow').setOrigin(0.5).setTint('0x880000').setDepth(game_settings.player_depth+1),
            dir: "RIGHT",
            ready: Phaser.Math.Between(0, 1) == 1 ? true : false,
            dead: false
        };
        this.setRandomPosition(new_enemy.obj);
        new_enemy.arrow.setPosition(new_enemy.obj.position+game_settings.move_speed);
        this.enemies.push(new_enemy);
    }

    SetupKeys(){
        key_left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        key_right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        key_up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        key_down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        key_prev = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        key_next = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT); 
    }

    updatePlayer(){
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

    updateEnemies(){
        this.enemies.forEach(enemy => {
            if (this.checkOverlap(this.player, enemy.obj)){
                this.killPlayer();
            }
    
            this.moveEnemy(enemy);
    
            if (this.checkOverlap(this.player, enemy.obj)){
                this.killPlayer();
            }
        });
    }

    movePlayer(dir){
        switch(dir){
            case "LEFT":
                this.player.x -= game_settings.move_speed;
                break;
            case "RIGHT":
                this.player.x += game_settings.move_speed;
                break;
            case "UP":
                this.player.y -= game_settings.move_speed;
                break;
            case "DOWN":
                this.player.y += game_settings.move_speed;
                break;
        }

        this.updateCoins();

        this.updateEnemies();
    }

    updateCoins(){
        this.coins.forEach(coin => {
            if (this.checkOverlap(this.player, coin)){
                this.score += 10;
                this.updateUI();
                this.spawnNewEnemy();
                this.setRandomPosition(coin);
            }
        });
    }

    setRandomPosition(obj){
        let x_range = Math.floor(game.config.width/game_settings.move_speed)/2-1;
        let y_range = Math.floor(game.config.height/game_settings.move_speed)/2-1;
        obj.setPosition(game.config.width/2 + (game_settings.move_speed*Phaser.Math.Between(-x_range, x_range)), game.config.height/2 + (game_settings.move_speed*Phaser.Math.Between(-y_range, y_range)))
        if (obj.position = this.player.position){
            obj.x += game_settings.move_speed;
        }
    }

    checkOverlap(obj1, obj2){

        if (obj1.x == obj2.x && obj1.y == obj2.y){
            return true;
        }
        return false;
    }

    killPlayer(){
        if (this.health == 1){
            this.scene.restart();
        }
        this.health -= 1;
        this.updateUI();
        this.cameras.main.shake(150, 0.007);
        this.player.setPosition(game.config.width/2, game.config.height/2);

    }

    killEnemy(enemy){
        this.setRandomPosition(enemy.obj);
        enemy.dead = true;
        enemy.arrow.setVisible(false);
        enemy.ready = false;
    }

    moveEnemy(enemy){
        if (!enemy.dead){
            if (!enemy.ready){
                enemy.ready = true;
                enemy.arrow.setVisible(true);
                return;
            }

            switch(enemy.dir){
                case "LEFT":
                    enemy.obj.x -= game_settings.move_speed;
                    break;
                case "RIGHT":
                    enemy.obj.x += game_settings.move_speed;
                    break;
                case "UP":
                    enemy.obj.y -= game_settings.move_speed;
                    break;
                case "DOWN":
                    enemy.obj.y += game_settings.move_speed;
                    break;
            }
            if (enemy.obj.x > game.config.width){
                enemy.obj.x = game.config.width;
            }
            if (enemy.obj.x < 0){
                enemy.obj.x = 0;
            }
            if (enemy.obj.y > game.config.height){
                enemy.obj.y = game.config.height
            }
            if (enemy.obj.y < 0){
                enemy.obj.y = 0
            }
        } else{
            enemy.dead = false;
        }
        
        enemy.arrow.x = enemy.obj.x;
        enemy.arrow.y = enemy.obj.y;
        let dir = Phaser.Math.Between(1, 4);
        if (this.player.x == enemy.obj.x){
            dir = this.player.y > enemy.obj.y ? 4 : 3;
        } 
        if (this.player.y == enemy.obj.y){
            dir = this.player.x > enemy.obj.x ? 2 : 1;
        }
        switch(dir){
            case 1:
                enemy.dir = "LEFT";
                enemy.arrow.x -= game_settings.move_speed;
                enemy.arrow.angle = 180;
                break;
            case 2:
                enemy.dir = "RIGHT";
                enemy.arrow.x += game_settings.move_speed;
                enemy.arrow.angle = 0;
                break;
            case 3:
                enemy.dir = "UP";
                enemy.arrow.y -= game_settings.move_speed;
                enemy.arrow.angle = 270;
                break;
            case 4:
                enemy.dir = "DOWN";
                enemy.arrow.y += game_settings.move_speed;
                enemy.arrow.angle = 90;
                break;
        }
        
        enemy.ready = false;
        enemy.arrow.setVisible(false);
    }
}