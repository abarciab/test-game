function initDash2(){
    console.log('initializing dash scene2');

    game_settings = {
        player_walk_speed: 140,
        player_dash_speed: 1000,
        player_max_charge_progress: 1000,
        player_max_health: 5,

        charger_speed: 30,
            charger_health: 1,
        golem_speed: 10,
            golem_health: 2,
            golem_agro_range: 280,
        enemy_spawn_timer: 8000,
    }
}

class DashScene2 extends Phaser.Scene {
    constructor() {
        super("DashScene2");
    }

    //comment
    preload(){
        this.load.image('white square', './assets/white square.png');
        this.load.image('white hexagon', './assets/white hexagon.png');
    }

    create(){
        initDash2();

        this.SetupKeys();

        this.cameras.main.setBackgroundColor('#0000aa');

        //player
        this.player = {
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setAlpha(0.3).setScale(0.8),
            charge_progress: 0,
            dashing: false,
            health: game_settings.player_max_health,
        }
        this.player.obj.setDrag(0.05);
        this.player.obj.setDamping(true);

        //enemies
        this.enemies = [];
        //this.spawnEnemy("CHARGER");    
        this.spawnEnemy("GOLEM"); 
        //this.spawnEnemy("SHOOTER");         

        //enemy collisions
        this.physics.add.overlap(this.player.obj, this.enemies, this.enemyPlayerCollision.bind(this));

        //score and lives
        this.timePlayed = 0; 
        this.score = 0;
        this.score_text = this.add.text(20, 20, "SCORE: 0");
        this.health_text = this.add.text(150, 20, "LIVES: 0");
        this.updateUI();
        this.paused = false;

        //UI
        this.pauseLayer = this.add.sprite(game.config.width/2, game.config.height/2, 'white square').setTint(0x010101).setAlpha(0.3).setScale(20,20).setOrigin(0.5).setDepth(5).setVisible(false);
    }

    update(time, delta){
        //pause the game
        if (Phaser.Input.Keyboard.JustDown(key_esc)){
            this.paused = !this.paused;
        }
        //scene management
        if (Phaser.Input.Keyboard.JustDown(key_prev)){
            this.scene.start('DanceScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('SlideScene');
        }
        if (this.paused){
            this.pause();
            return;
        } else {
            this.pauseLayer.setVisible(false);
        }


        this.timePlayed += delta;
        /*if (Math.floor(this.timePlayed/game_settings.enemy_spawn_timer) > this.enemies.length-1){
            this.spawnEnemy("CHARGER");
        }*/

        //player dash
        if (Math.abs(this.player.obj.body.velocity.x) <= game_settings.player_walk_speed && Math.abs(this.player.obj.body.velocity.y) <= game_settings.player_walk_speed){
            this.player.dashing = false;
            this.player.obj.clearTint();
        }
        if (key_space.isDown && !this.player.dashing && this.player.charge_progress < game_settings.player_max_charge_progress){
            this.player.charge_progress += delta;
            this.player.obj.setAlpha(this.player.charge_progress/game_settings.player_max_charge_progress + 0.1);
        }
        if (Phaser.Input.Keyboard.JustUp(key_space)){
            if (this.player.charge_progress > 0){
                this.dash();
            }
            this.player.charge_progress = 0;
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
        
        
    }

    dash(){
        let speed = (this.player.charge_progress/game_settings.player_max_charge_progress)*game_settings.player_dash_speed;
        this.physics.moveToObject(this.player.obj, this.game.input.mousePointer, speed);
        this.player.dashing = true;
        this.player.obj.setTint(0xFF0000);
    }

    updateUI(){
        this.score_text.text =  `SCORE: ${this.score}`;
        this.health_text.text = `LIVES: ${this.player.health}`;
    }

    spawnEnemy(type){
        let new_enemy;

        switch(type){
            case "CHARGER":
                new_enemy = new ChargerEnemy(this, 0, 0, 'white square').setTint(0xFF0000);
                this.setRandomPositionOutside(new_enemy);
                break;
            case "GOLEM":
                new_enemy = new GolemEnemy(this, game.config.width/3, 140, 'white hexagon').setTint(0xaaFF00).setScale(1.5);
                break;
            case "SHOOTER":
                break;
            default: 
                console.log(`invalid enemy type requested: ${type}`);
        }
        this.enemies.push(new_enemy);
    }

    updateEnemies(){
        this.enemies.forEach(enemy => {
            enemy.update(this);
        });
    }

    pause(){
        this.pauseLayer.setVisible(true);
        this.player.obj.body.stop();
        this.enemies.forEach(enemy => {
            enemy.body.stop();
        });
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
            this.score += 10;
        } else {
            this.player.health-= 1;
            if (this.player.health == 0){
                this.scene.restart();
            }
            this.cameras.main.shake(150, 0.003);
            playerObj.setPosition(game.config.width/2, game.config.height/2);
            
        }

        //this.setRandomPositionOutside(enemy);
        this.updateUI();
    }

    movePlayer(dir){
        let speed = game_settings.player_walk_speed;

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
        key_space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        key_esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        key_prev = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        key_next = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT); 
    }
}
