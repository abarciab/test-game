function initSlide(){
    console.log('initializing dodge scene');

    game_settings = {
        player_move_speed: 160,
        enemy_speed: 100,
        max_health: 3,
        enemy_range: 55,
        enemy_charge_time: 1000,
        enemy_attack_dist: 50,
        enemy_spawn_timer: 9000,
    }
}

class SlideScene extends Phaser.Scene {
    constructor() {
        super("SlideScene");   
    }

    preload(){
        this.load.image('white square', './assets/white square.png');
    }

    create(){
        initSlide();

        this.SetupKeys();

        this.timePlayed = 0;

        //player
        this.player = {
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square'),
            health: game_settings.max_health,
        }
        this.player.obj.setDrag(0.5);
        this.player.obj.setDamping(true);

        //enemies
        this.enemies = [];
        this.spawnEnemy();
        this.attacking_enemies = [];  
        

        //UI
        this.score = 0;
        this.score_text = this.add.text(20, 20, "SCORE: 0");
        this.health_text = this.add.text(150, 20, "LIVES: 0");   
        this.updateUI();
    }

    update(time, delta){

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
        if (Phaser.Input.Keyboard.JustDown(key_space)){
            this.playerAttack();
        }

        //enemies
        this.updateEnemies();
        this.timePlayed += delta;
        if (Math.floor(this.timePlayed/game_settings.enemy_spawn_timer) > this.enemies.length-1){
            this.spawnEnemy();
        }

       

        //scene management
        if (Phaser.Input.Keyboard.JustDown(key_prev)){
            this.scene.start('DashScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('HexScene');
        }
    }

    updateUI(){
        this.score_text.text = `SCORE: ${this.score}`;
        this.health_text.text = `LIVES: ${this.player.health}`;
    }

    playerAttack(){
        if (this.attacking_enemies[0]){
            if (this.attacking_enemies[0].dir.left){
                this.movePlayer("LEFT");
            }
            if (this.attacking_enemies[0].dir.right){
                this.movePlayer("RIGHT");
            }
            if (this.attacking_enemies[0].dir.up){
                this.movePlayer("UP");
            }
            if (this.attacking_enemies[0].dir.down){
                this.movePlayer("DOWN");
            }
            this.attacking_enemies[0].attacking = false;
            this.setRandomPositionOutside(this.attacking_enemies[0].obj);
            this.score += 10;
            this.updateUI();
            this.attacking_enemies.shift();
        }
    }

    killPlayer(){
        this.cameras.main.shake(150, 0.003);
        this.player.health -= 1;
        this.updateUI();
        if (this.player.health <= 0){
            this.scene.restart();
        }
        this.player.obj.setPosition(game.config.width/2, game.config.height/2);
    }

    updateEnemies(){
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy);
        });
    }

    updateEnemy(enemy){
        let dist = Phaser.Math.Distance.Between(enemy.obj.x, enemy.obj.y, this.player.obj.x, this.player.obj.y);
        
        if (dist > game_settings.enemy_range && !enemy.attacking){
            let buffer = 2;
            if (this.player.obj.x > enemy.obj.x+buffer){
                enemy.obj.setVelocityX(game_settings.enemy_speed);
                if (Math.abs(this.player.obj.x - enemy.obj.x) > game_settings.enemy_attack_dist/2){
                    enemy.dir.right = true;
                    enemy.dir.left = false;
                } else {enemy.dir.right = false; }
            } 
            if (this.player.obj.x < enemy.obj.x-buffer){
                enemy.obj.setVelocityX(-game_settings.enemy_speed);
                if (Math.abs(this.player.obj.x - enemy.obj.x) > game_settings.enemy_attack_dist/2){
                    enemy.dir.left = true;
                    enemy.dir.right = false;
                } else {enemy.dir.left = false;}
            } 
            if (this.player.obj.y > enemy.obj.y+buffer){
                enemy.obj.setVelocityY(game_settings.enemy_speed);
                if (Math.abs(this.player.obj.y - enemy.obj.y) > game_settings.enemy_attack_dist/2){
                    enemy.dir.down = true;
                    enemy.dir.up = false;
                } else {enemy.dir.down = false;}
            } 
            if (this.player.obj.y < enemy.obj.y-buffer){
                enemy.obj.setVelocityY(-game_settings.enemy_speed);
                if (Math.abs(this.player.obj.y - enemy.obj.y) > game_settings.enemy_attack_dist/2){
                    enemy.dir.up = true
                    enemy.dir.down = false;
                } else {enemy.dir.up = false;}
            } 
        } else {
            enemy.obj.setVelocity(0, 0);
            
            if (!enemy.attacking){
                enemy.attacking = true;
                this.attacking_enemies.push(enemy);
                this.tweens.add({
                    targets: enemy.obj,
                    alpha: 1,
                    duration: game_settings.enemy_charge_time, 
                    onComplete: function() { this.enemyAttack(enemy);},
                    onCompleteScope: this,
                })
            } else if (enemy.alpha == 1){
                this.enemyAttack(enemy);
            }
        }
        
        
    }

    enemyAttack(enemy){        
        enemy.obj.setAlpha(0.3);
        
        if(enemy.attacking && Phaser.Math.Distance.Between(enemy.obj.x, enemy.obj.y, this.player.obj.x, this.player.obj.y) < 200){

            if (enemy.dir.right){
                enemy.obj.x += game_settings.enemy_attack_dist;
            }
            if (enemy.dir.left){
                enemy.obj.x -= game_settings.enemy_attack_dist;

            }
            if (enemy.dir.up){
                enemy.obj.y -= game_settings.enemy_attack_dist;
            }
            if (enemy.dir.down){
                enemy.obj.y += game_settings.enemy_attack_dist;
            }

            this.player.health -= 1;
            if (this.player.health <= 0){
                this.scene.restart();
            }
            this.updateUI();
        }

        for(let i = 0; i < this.attacking_enemies.length; i++){
            if (this.attacking_enemies[i] == enemy){
                this.attacking_enemies.splice(i, 1);
                this.time.delayedCall(150, function() {this.setRandomPositionOutside(enemy.obj)}, null, this)
            }
        }

        
        enemy.attacking = false;
    }

    spawnEnemy(){
        let new_enemy ={
            obj: this.physics.add.sprite(game.config.width/3, game.config.height/2, 'white square').setTint(0xFF0000).setAlpha(0.3),
            attacking: false,
            dir: {right: false, left: false, up: false, down: false},
        }
        this.setRandomPosition(new_enemy.obj);
        this.enemies.push(new_enemy);
    }

    setRandomPosition(obj){
        obj.setPosition(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height));
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

    movePlayer(dir){
        switch(dir){
            case "LEFT":
                this.player.obj.setVelocityX(-game_settings.player_move_speed);
                break;
            case "RIGHT":
                this.player.obj.setVelocityX(game_settings.player_move_speed);
                break;
            case "UP":
                this.player.obj.setVelocityY(-game_settings.player_move_speed);
                break;
            case "DOWN":
                this.player.obj.setVelocityY(game_settings.player_move_speed);
                break;
        }
    }
    SetupKeys(){
        key_left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        key_right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        key_up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        key_down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        key_space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        key_prev = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        key_next = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT); 
    }

}
