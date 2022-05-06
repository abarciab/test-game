function initDash(){
    console.log('initializing dash scene');

    game_settings = {
        player_walk_speed: 140,
        player_max_dash_modifier: 7,
        player_dash_charge_time: 1000,
        player_max_health: 5,

        enemy_walk_speed: 30,
        enemy_spawn_timer: 8000,
    }
}

class DashScene extends Phaser.Scene {
    constructor() {
        super("DashScene");
    }

    preload(){
        this.load.image('white square', './assets/White square.png');
    }

    create(){
        initDash();

        this.SetupKeys();

        //player
        this.player = {
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setAlpha(0.1).setScale(0.8),
            wait_time: 0,
            dashing: false,
            health: game_settings.player_max_health,
        }
        this.player.obj.setDrag(0.05);
        this.player.obj.setDamping(true);

        //enemies
        this.enemies = [];
        this.spawnEnemy();        

        //enemy collisions
        this.physics.add.overlap(this.player.obj, this.enemies, this.enemyPlayerCollision.bind(this));

        //score and lives
        this.timePlayed = 0; 
        this.score = 0;
        this.score_text = this.add.text(20, 20, "SCORE: 0");
        this.health_text = this.add.text(150, 20, "LIVES: 0");
        this.updateUI();
    }

    update(time, delta){
        this.timePlayed += delta;
        if (Math.floor(this.timePlayed/game_settings.enemy_spawn_timer) > this.enemies.length-1){
            this.spawnEnemy();
        }

        //player dash
        let dash_charge_cutoff = 50;
        if (Math.abs(this.player.obj.body.velocity.x) <= dash_charge_cutoff && Math.abs(this.player.obj.body.velocity.y) <= dash_charge_cutoff){
            this.player.wait_time += delta;
            if (this.player.wait_time > game_settings.player_dash_charge_time){
                this.player.wait_time = game_settings.player_dash_charge_time;
            }
            this.player.obj.clearTint();
            this.player.obj.setAlpha(this.player.wait_time/game_settings.player_dash_charge_time + 0.1);
            this.player.dashing = false;
        } else{
            this.player.wait_time = 0;
            this.player.obj.setAlpha(0.3);
        }
        //player movement
        if (key_left.isDown){
            this.movePlayer("LEFT");
        }
        if (key_right.isDown){
            this.movePlayer("RIGHT");
        }
        if (key_up.isDown){
            this.movePlayer("UP");
        }
        if (key_down.isDown){
            this.movePlayer("DOWN");
        }

        this.updateEnemies();
        
        //scene management
        if (Phaser.Input.Keyboard.JustDown(key_prev)){
            this.scene.start('DanceScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('SlideScene');
        }
    }

    updateUI(){
        this.score_text.text =  `SCORE: ${this.score}`;
        this.health_text.text = `LIVES: ${this.player.health}`;
    }

    spawnEnemy(){
        let new_enemy = this.physics.add.sprite(game.config.width/3, game.config.height/2, 'white square').setTint(0xFF0000);
        this.setRandomPositionOutside(new_enemy);
        this.enemies.push(new_enemy);
    }

    updateEnemies(){
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy);
        });
    }

    updateEnemy(enemy){
        let buffer = 2;
        if (this.player.obj.x > enemy.x+buffer){
            enemy.setVelocityX(game_settings.enemy_walk_speed);
        }
        if (this.player.obj.x < enemy.x-buffer){
            enemy.setVelocityX(-game_settings.enemy_walk_speed);
        }
        if (this.player.obj.y > enemy.y+buffer){
            enemy.setVelocityY(game_settings.enemy_walk_speed);
        }
        if (this.player.obj.y < enemy.y-buffer){
            enemy.setVelocityY(-game_settings.enemy_walk_speed);
        }
    }

    setRandomPositionOutside(obj){
        let max = 150;
        switch (Phaser.Math.Between(1, 4)){
            case 1:
                obj.setPosition(Phaser.Math.Between(game.config.width+50, game.config.width+max), Phaser.Math.Between(-50, game.config.height+50));
                break;
            case 2:
                obj.setPosition(Phaser.Math.Between(-50, -max), Phaser.Math.Between(-50, game.config.height+50));
                break;
            case 3:
                obj.setPosition(Phaser.Math.Between(-50, game.config.width+50), Phaser.Math.Between(-50, -max));
                break;
            case 4:
                obj.setPosition(Phaser.Math.Between(-50, game.config.width+50), Phaser.Math.Between(game.config.height + 50, game.config.height + max));
                break;
        }
        
    }

    enemyPlayerCollision(playerObj, enemy){
        if (this.player.dashing){
            this.setRandomPositionOutside(enemy);
            this.score += 10;
        } else {
            this.player.health-= 1;
            if (this.player.health == 0){
                this.scene.restart();
            }
            this.cameras.main.shake(150, 0.003);
            playerObj.setPosition(game.config.width/2, game.config.height/2);
            this.setRandomPositionOutside(enemy);
        }

        this.updateUI();
    }

    movePlayer(dir){
        let speed = game_settings.player_walk_speed;

        if (this.player.wait_time > 0){
            speed += (this.player.wait_time / game_settings.player_dash_charge_time) * game_settings.player_max_dash_modifier * game_settings.player_walk_speed;
            this.player.dashing = true;
            this.player.obj.setTint(0xa8ebf0);
        }

        this.player.wait_time = 0;

        switch(dir){
            case "LEFT":
                if (this.player.obj.body.velocity.x > -speed){
                    this.player.obj.setVelocityX(-speed);
                    if (speed == game_settings.player_walk_speed){
                        this.player.dashing = false;
                        this.player.obj.clearTint();
                    }
                }
                break;
            case "RIGHT":
                if (this.player.obj.body.velocity.x < speed){
                    this.player.obj.setVelocityX(speed);
                    if (speed == game_settings.player_walk_speed){
                        this.player.dashing = false;
                        this.player.obj.clearTint();
                    }
                }
                break;
            case "UP":
                if (this.player.obj.body.velocity.y > -speed){
                    this.player.obj.setVelocityY(-speed);
                    if (speed == game_settings.player_walk_speed){
                        this.player.dashing = false;
                        this.player.obj.clearTint();
                    }
                }
                break;
            case "DOWN":
                if (this.player.obj.body.velocity.y < speed){
                    this.player.obj.setVelocityY(speed);
                    if (speed == game_settings.player_walk_speed){
                        this.player.dashing = false;
                        this.player.obj.clearTint();
                    }
                }
                break;
        }
    }

    SetupKeys(){
        key_left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        key_right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        key_up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        key_down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        key_prev = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        key_next = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT); 
    }

}