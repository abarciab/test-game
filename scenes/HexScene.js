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
            obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale).setTint(0xaa0000).setAlpha(0.5),
            hex_pos: new Phaser.Math.Vector2(5, 2),
            current_state_pattern: null,
            current_state: null,
            patrol_state: [[4, "RIGHT", 500],["LEFT UP", 500],[4, "LEFT", 500],["RIGHT DOWN", 500]],
            attack_state: [["CHASE", 500]],
            current_countdown: 0,
            conditions: [["DIST+", 4, "PATROL"],["DIST-", 4, "ATTACK"]],
        }
        this.enemySetState(this.enemy, this.enemy.patrol_state, "PATROL");
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

        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('DanceScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('DodgeScene');
        }
    }

    updateEnemies(delta){
        this.updateEnemy(this.enemy, delta);
    }

    updateEnemy(enemy, delta){
        this.checkEnemyConditions(enemy);

        if (enemy.current_state_pattern == null){
            return;
        }
        enemy.current_countdown -= delta;
        if (enemy.current_countdown <= 0){
            this.enemyNextAction(enemy)
        } 
    }

    enemyNextAction(enemy){
        
        if (!isNaN(enemy.current_state_pattern[0][0])){
            console.log(`this enemy's next state (${enemy.current_state_pattern[0][1]}) should be duplicated ${enemy.current_state_pattern[0][0]} times`);
            let num_times = enemy.current_state_pattern[0][0];
            enemy.current_state_pattern[0].shift();
            for (let i = 0; i < num_times-1; i++){
                console.log(`duplicating ${enemy.current_state_pattern[0][0]}`);
                enemy.current_state_pattern.push(enemy.current_state_pattern[0]);
            }
        } else {
            //console.log(enemy.current_state_pattern[0])
        }
        this.takeEnemyAction(enemy, enemy.current_state_pattern[0][0]);
        enemy.current_state_pattern.push(enemy.current_state_pattern.shift());
        enemy.current_countdown = enemy.current_state_pattern[0][1];
    }

    checkEnemyConditions(enemy){
        enemy.conditions.forEach(condition => {
            let passed = false;
            switch(condition[0]){
                case "DIST+":
                    if (this.getHexDist(enemy, this.player) > condition[1]){
                        passed = true;
                    }
                    break;
                case "DIST-":
                    if (this.getHexDist(enemy, this.player) < condition[1]){
                        passed = true;
                    }
                    break;
                default:
                    console.log(`Invalid condition checked: ${condition[0]}`);
                    break;
            }
            if (passed){
                if (enemy.current_state == condition[2]){
                    return;
                }
                switch(condition[2]){
                    case "PATROL":
                        enemy.obj.setAlpha(0.5);
                        this.enemySetState(enemy, enemy.patrol_state, "PATROL");
                        break;
                    case "ATTACK": 
                        enemy.obj.setAlpha(1);
                        this.enemySetState(enemy, enemy.attack_state, "ATTACK");
                        break;
                }
                return;
            }
        });
    }

    getHexDist(container1, container2){
        return Math.max(
            Math.abs(container2.hex_pos.y - container1.hex_pos.y),     
            Math.abs(container2.hex_pos.x - container1.hex_pos.x),
            Math.abs((container2.hex_pos.x - container2.hex_pos.y)*-1 - (container1.hex_pos.x - container1.hex_pos.y)*-1)
       )-1
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
            case "CHASE":
                this.moveTo(enemy, this.player);
                break;
            default: 
                console.log(`invalid action selected. add additional options at my location`);
                break;
        }
    }

    moveTo(container, target){
        let change = new Phaser.Math.Vector2(0,0);

        if (container.hex_pos.y < target.hex_pos.y){
            change.y += 1;
        } else if (container.hex_pos.y > target.hex_pos.y){
            change.y -= 1;
        }

        if (container.hex_pos.x < target.hex_pos.x){
            change.x += 1;
        } else if (container.hex_pos.x > target.hex_pos.x){
            change.x -= 1;
        }

        if ((change.x == 1 && change.y == 1) || (change.x == -1 && change.y == -1)){
            change.x = 0;
        }
        container.hex_pos.add(change);
        this.setHexPos(container);
    }

    enemySetState(enemy, state, state_name){
        enemy.current_state_pattern = state;
        enemy.current_state = state_name;
        this.enemyNextAction(enemy);
        //enemy.current_countdown = enemy.current_state_pattern[0][1];
        
        console.log(`state: ${state_name}`);
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

