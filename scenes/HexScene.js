function initHex(){
    console.log('initializing hex scene');

    let hex_size = 28;

    game_settings = {
        hex_size: hex_size,
        hex_width: Math.sqrt(3) * hex_size,
        hex_height: 2 * hex_size,
        hex_vert: 3/4*(2 * hex_size),
        hex_offset: new Phaser.Math.Vector2(1.5, 1.1),
        objScale: 0.5,
        gridSize: new Phaser.Math.Vector2(19, 15),
    }

}

class HexScene extends Phaser.Scene {
    constructor() {
        super("HexScene");   
    }

    preload(){
        this.load.image('white hex', './assets/white hexagon.png');
        this.load.image('white square', './assets/white square.png')
    }

    create(){
        initHex();

        this.SetupKeys();

        //grid
        this.hexGrid = [];
        this.createHexGrid(game_settings.gridSize.x, game_settings.gridSize.y);

        //player
        this.player = {
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale),
            hex_pos: new Phaser.Math.Vector2(10, 10),
        }
        this.setHexPos(this.player);
        this.skipNext = false;

        //enemies
        this.enemy = {
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale).setTint(0xaa0000),
            hex_pos: new Phaser.Math.Vector2(5, 10),
            current_state: null,
            patrol_state: [["RIGHT", 500],["LEFT UP", 500],["LEFT", 500],["RIGHT DOWN", 500]],
            attack_state: [["CHASE", 200]],
            current_countdown: 0,
            conditions: [["PATROL", "DIST+", 6],["ATTACK", "DIST-", 6]],
        }
        this.enemySetState(this.enemy, this.enemy.patrol_state);
        this.setHexPos(this.enemy);
    }

    update(time, delta){
        //player movement
        if (Phaser.Input.Keyboard.JustDown(key_left)){
            this.skipNext = false;
            if (key_up.isDown){
                this.moveHexObj(this.player, "LEFT UP");
                this.skipNext = true;
            } else if (key_down.isDown){
                this.moveHexObj(this.player, "LEFT DOWN");
                this.skipNext = true;
            } else{
                this.moveHexObj(this.player, "LEFT");
            }
        }
        if (key_left.isDown){
            if (Phaser.Input.Keyboard.JustDown(key_up) && !this.skipNext){
                this.moveHexObj(this.player, "LEFT UP");
            } else if (Phaser.Input.Keyboard.JustDown(key_down)&& !this.skipNext){
                this.moveHexObj(this.player, "LEFT DOWN");
            }
        }
        if (Phaser.Input.Keyboard.JustDown(key_right)){
            this.skipNext = false;
            if (key_up.isDown){
                this.moveHexObj(this.player, "RIGHT UP");
                this.skipNext = true;
            } else if (key_down.isDown){
                this.moveHexObj(this.player, "RIGHT DOWN");
                this.skipNext = true;
            } else{
                this.moveHexObj(this.player, "RIGHT");
            }
        }
        if (key_right.isDown){
            if (Phaser.Input.Keyboard.JustDown(key_up)&& !this.skipNext){
                this.moveHexObj(this.player, "RIGHT UP");
            } else if (Phaser.Input.Keyboard.JustDown(key_down)&& !this.skipNext){
                this.moveHexObj(this.player, "RIGHT DOWN");
            }
        }
        if (Phaser.Input.Keyboard.JustUp(key_up) || Phaser.Input.Keyboard.JustUp(key_down)){
            this.skipNext = false;
        }
        
        this.updateEnemies(delta);
    }

    updateEnemies(delta){
        this.updateEnemy(this.enemy, delta);
    }

    updateEnemy(enemy, delta){
        this.checkEnemyConditions(enemy);

        if (enemy.current_state == null){
            return;
        }
        enemy.current_countdown -= delta;
        if (enemy.current_countdown <= 0){
            this.takeEnemyAction(enemy, enemy.current_state[0][0]);
            enemy.current_state.push(enemy.current_state.shift());
            enemy.current_countdown = enemy.current_state[0][1];
        } 
    }

    checkEnemyConditions(enemy){

    }

    takeEnemyAction(enemy, action){
        switch(action){
            case "RIGHT":
            case "LEFT":
            case "RIGHT UP":
            case "LEFT UP":
            case "RIGHT DOWN":
            case "LEFT DOWN":
                this.moveHexObj(enemy, action);
                break;
            default: 
                console.log(`invalid action selected. add additional options at my location`);
                break;
        }
    }

    enemySetState(enemy, state){
        enemy.current_state = state;
        enemy.current_countdown = enemy.current_state[0][1];
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

    moveHexObj(container, dir){
        switch(dir){
            case "LEFT": 
                container.hex_pos.x -= 1;
                break;
            case "RIGHT": 
                container.hex_pos.x += 1;
                break;
            case "LEFT UP": 
                container.hex_pos.y -= 1;
                break;
            case "RIGHT UP": 
                container.hex_pos.x += 1;
                container.hex_pos.y -= 1;
                break;
            case "LEFT DOWN":
                container.hex_pos.x -= 1;
                container.hex_pos.y += 1;
                break;
            case "RIGHT DOWN": 
                container.hex_pos.y += 1;
                break;
        }
        this.setHexPos(container);
    }

    //creates a 'rectangular' grid of hexagons that is grid_x hexagons wide and grid_y hexagons tall
    createHexGrid(grid_x, grid_y){
        let offset = 0;
        for(let y = 0; y < grid_y; y++){
            for (let x = 0+offset; x < grid_x+offset; x++){
                this.newGridHex(x, y);                
            }
            offset = -Math.floor(y/2)-1;
        }
    }

    //adds a new gridHex at the given hex positions
    newGridHex(hexX, hexY){
        let new_hex = {
            obj: this.add.sprite(game.config.width/2, game.config.height/2, 'white hex').setAlpha(0.2),
            hex_pos: new Phaser.Math.Vector2(hexX, hexY),

        }
            this.setHexPos(new_hex);
            this.hexGrid.push(new_hex);
    }

    //sets the world position of the passed object according to that object's Vector2 hex_pos property. 0,0 is top left
    setHexPos(container){
        container.obj.y = (container.hex_pos.y + game_settings.hex_offset.y)*game_settings.hex_vert;
        container.obj.x = (container.hex_pos.x+(0.5*container.hex_pos.y) + game_settings.hex_offset.x)*game_settings.hex_width;
    }
}

