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
        max_health: 5,
        num_sentinals: 0,
        num_shooters: 0,
        num_runners: 2,
        runner_respawn_time: 2000,
        show_grid_coords: false,
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
            health: game_settings.max_health,
        }
        this.setHexPos(this.player);
        this.skipNext = false;

        //enemies
        this.enemies = [];
        for(let i = 0; i < game_settings.num_sentinals; i++){
            this.spawnEnemy("SENTINAL");
        }
        for(let i = 0; i < game_settings.num_runners; i++){
            this.spawnEnemy("RUNNER");
        }
        for(let i = 0; i < game_settings.num_shooters;i++){
            this.spawnEnemy("SHOOTER");
        }
        this.extra_sentinals = 0;
        

        this.score = 0;
        this.score_text = this.add.text(20, 20, `SCORE: ${this.score}`);
        this.health_text = this.add.text(150, 20, `LIVES: ${game_settings.max_health}`);
        this.updateUI();
    }

    update(time, delta){
        //player movement
        if (Phaser.Input.Keyboard.JustDown(key_left)){
            this.skipNext = false;
            if (key_up.isDown){
                this.movePlayer("LEFT UP");
                this.skipNext = true;
            } else if (key_down.isDown){
                this.movePlayer("LEFT DOWN");
                this.skipNext = true;
            } else{
                this.movePlayer("LEFT");
            }
        }
        if (key_left.isDown){
            if (Phaser.Input.Keyboard.JustDown(key_up) && !this.skipNext){
                this.movePlayer("LEFT UP");
            } else if (Phaser.Input.Keyboard.JustDown(key_down)&& !this.skipNext){
                this.movePlayer("LEFT DOWN");
            }
        }
        if (Phaser.Input.Keyboard.JustDown(key_right)){
            this.skipNext = false;
            if (key_up.isDown){
                this.movePlayer("RIGHT UP");
                this.skipNext = true;
            } else if (key_down.isDown){
                this.movePlayer("RIGHT DOWN");
                this.skipNext = true;
            } else{
                this.movePlayer("RIGHT");
            }
        }
        if (key_right.isDown){
            if (Phaser.Input.Keyboard.JustDown(key_up)&& !this.skipNext){
                this.movePlayer("RIGHT UP");
            } else if (Phaser.Input.Keyboard.JustDown(key_down)&& !this.skipNext){
                this.movePlayer("RIGHT DOWN");
            }
        }
        if (Phaser.Input.Keyboard.JustUp(key_up) || Phaser.Input.Keyboard.JustUp(key_down)){
            this.skipNext = false;
        }
        
        //enemies
        if (this.extra_sentinals !=  Math.floor(this.score/40)){
            this.extra_sentinals += 1;
            if (this.extra_sentinals % 2 == 0){
                this.spawnEnemy("RUNNER");
            }
            this.spawnEnemy("SENTINAL");
        }
        this.updateEnemies(delta);

        //scene management
        if (Phaser.Input.Keyboard.JustDown(key_next)){
            this.scene.start('DanceScene');
        }
        if (Phaser.Input.Keyboard.JustDown(key_prev)){
            this.scene.start('SlideScene');
        }
    }

    movePlayer(dir){
        this.moveHexObj(this.player, dir);

        this.enemies.forEach(enemy => {
            if (enemy.hex_pos.equals(this.player.hex_pos) && enemy.vulnerable == true){
                this.damageEnemy(enemy);
                return;
            }
        });
    }

    setRandomHexPos(container){
        container.hex_pos.set(Phaser.Math.Between(2, game_settings.gridSize.x-2), Phaser.Math.Between(2, game_settings.gridSize.y-2));

        while(!this.inBounds(container)){
            container.hex_pos.set(Phaser.Math.Between(2, game_settings.gridSize.x-2), Phaser.Math.Between(2, game_settings.gridSize.y-2));
        }
    }

    spawnEnemy(type){
        let new_enemy = {
        }

        switch(type){
            case "SENTINAL":
                new_enemy = { 
                    obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale).setTint(0xaa0000).setAlpha(0.5),
                    hex_pos: new Phaser.Math.Vector2(Phaser.Math.Between(2, game_settings.gridSize.x-2), Phaser.Math.Between(2, game_settings.gridSize.y-2)),
                    current_state_pattern: null,
                    current_state: null,
                    patrol_state: [["RIGHT"],["RIGHT UP"],["LEFT UP"], ["LEFT"],["LEFT DOWN"],["RIGHT DOWN"]],
                    attack_state: [["CHASE"]],
                    speed: 500,
                    current_countdown: 0,
                    unstackable: true,
                    conditions: [["DIST+", 4, "PATROL"],["DIST-", 4, "ATTACK"]],
                }
                this.enemySetState(new_enemy, new_enemy.patrol_state, "PATROL");
                break;
            case "SHOOTER":
                new_enemy = { 
                    obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale).setTint(0x00aa00).setAlpha(0.5),
                    hex_pos: new Phaser.Math.Vector2(Phaser.Math.Between(2, game_settings.gridSize.x-2), Phaser.Math.Between(2, game_settings.gridSize.y-2)),
                    current_state_pattern: null,
                    current_state: null,
                    patrol_state: [[3, "RIGHT"],[4, "LEFT UP"], [3, "RIGHT"],[5, "LEFT DOWN"], [2,"RANDOM MOVE"]],
                    attack_state: [["RADOM MOVE"],["SHOOT"]],
                    speed: 500,
                    current_countdown: 0,
                    unstackable: true,
                    conditions: [["SECONDS %", 4, "ATTACK"], ["ELSE", null, "PATROL"]],
                }
                this.enemySetState(new_enemy, new_enemy.patrol_state, "PATROL");
                break;
            case "RUNNER":
                new_enemy = { obj: this.physics.add.sprite(game.config.width/2, game.config.height/2, 'white square').setScale(game_settings.objScale-0.1).setTint(0xbba000).setAlpha(0.5).setDepth(1),
                    hex_pos: new Phaser.Math.Vector2(Phaser.Math.Between(2, game_settings.gridSize.x-2), Phaser.Math.Between(2, game_settings.gridSize.y-2)),
                    current_state_pattern: null,
                    current_state: null,
                    patrol_state: [["LEFT", 200], ["RIGHT", 200]],
                    run_state: [[3, "RUN"], ["RANDOM MOVE"]],
                    speed: 500,
                    current_countdown: 0,
                    conditions: [["DIST+", 7, "PATROL"],["DIST-", 7, "RUN"]],
                    vulnerable: true,
                }
                break;
            default:
                console.log(`invalid enemy type: ${type}`);
                break;
        }
        
        this.setHexPos(new_enemy);
        this.enemies.push(new_enemy);

    }

    updateUI(){
        this.score_text.text = `SCORE: ${this.score}`;
        this.health_text.text = `LIVES: ${this.player.health}`;
    }

    updateEnemies(delta){
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy, delta);
        });
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
            let num_times = enemy.current_state_pattern[0][0];
            enemy.current_state_pattern[0].shift();
            for (let i = 0; i < num_times-1; i++){
                enemy.current_state_pattern.unshift(enemy.current_state_pattern[0]);
            }
        } 
        this.takeEnemyAction(enemy, enemy.current_state_pattern[0][0]);
        if (enemy.current_state_pattern[0].length == 1){
            enemy.current_countdown = enemy.speed;
        } else {
            enemy.current_countdown = enemy.current_state_pattern[0][1];
        }
        enemy.current_state_pattern.push(enemy.current_state_pattern.shift());
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
                    case "RUN":
                        enemy.obj.setAlpha(1);
                        this.enemySetState(enemy, enemy.run_state, "RUN");
                        break;
                    default:
                        console.log(`invalid condition result chosen: ${condition[2]}`);
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
            case "RANDOM MOVE":
                switch(Phaser.Math.Between(1, 6)){
                    case 1: action = "RIGHT"; break;
                    case 2: action = "LEFT"; break;
                    case 3: action = "RIGHT UP"; break;
                    case 4: action = "RIGHT DOWN"; break;
                    case 5: action = "LEFT UP"; break;
                    case 6: action = "LEFT DOWN"; break;
                }
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
                if (enemy.hex_pos.equals(this.player.hex_pos)){
                    this.setRandomHexPos(enemy);
                    this.setHexPos(enemy);
                    this.damagePlayer();
                }
                break;
            case "RUN":
                    this.moveTo(enemy, this.player, true);
                    break;
            default: 
                console.log(`invalid action selected: ${action}`);
                break;
        }
    }

    damageEnemy(enemy){
        this.score += 10;
        this.updateUI();
        enemy.obj.setActive(false);
        enemy.obj.setVisible(false);
        enemy.obj.x = game.config.width*2;
        this.time.delayedCall(game_settings.runner_respawn_time, function () {
            enemy.obj.setActive(true);
            enemy.obj.setVisible(true);
            this.setRandomHexPos(enemy);
            this.setHexPos(enemy);
        }, null, this)
    }

    damagePlayer(){
        this.cameras.main.shake(150, 0.003);
        this.player.health -= 1;
        if (this.player.health <= 0){
            this.scene.restart();
        }
        this.player.hex_pos = new Phaser.Math.Vector2(10, 10);
        this.setHexPos(this.player);
        this.updateUI();
    }

    moveTo(container, target, run = false){
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

        if (run){
            change.scale(-1);
        }

        if ((change.x == 1 && change.y == 1) || (change.x == -1 && change.y == -1)){
            change.x = 0;
        }
        

        this.moveHexObj(container, "NULL", change);
    }

    enemySetState(enemy, state, state_name){
        enemy.current_state_pattern = state;
        enemy.current_state = state_name;
        this.enemyNextAction(enemy);        
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
    
    // 99% of the time, call with only a container and a dir. if you already know the specific change you want to make to the hex_pos, call with any other string and pass the change
    moveHexObj(container, dir, change = new Phaser.Math.Vector2(0, 0), ){

        switch(dir){
            case "LEFT": 
                change.x -= 1;
                break;
            case "RIGHT": 
                change.x += 1;
                break;
            case "LEFT UP": 
                
                change.y -= 1;
                break;
            case "RIGHT UP": 
                change.x += 1;
                change.y -= 1;
                break;
            case "LEFT DOWN":
                change.x -= 1;
                change.y += 1;
                break;
            case "RIGHT DOWN": 
                change.y += 1;
                break;
        }

        container.hex_pos.add(change)
        if (!this.inBounds(container)){
            container.hex_pos.subtract(change)
        }

        if (container.text){
            container.text.text = `${container.hex_pos.x}, ${container.hex_pos.y}`
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
            text: this.add.text(0, 0, `${hexX}, ${hexY}`, {fontSize: '11px', align: 'center'}).setOrigin(0.5).setVisible(game_settings.show_grid_coords),
            hex_pos: new Phaser.Math.Vector2(hexX, hexY),
        }
            this.setHexPos(new_hex, true);
            this.hexGrid.push(new_hex);
    }

    inBounds(container, fix){
        
        let closest_dist = this.getHexDist(this.hexGrid[0], container);
        let closestPoint = this.hexGrid[0].hex_pos;
        let found = false;

        this.hexGrid.forEach(grid_hex => {
            if (this.getHexDist(grid_hex, container) < closest_dist){
                closestPoint = grid_hex.hex_pos;
            }
            
            if (grid_hex.hex_pos.x == container.hex_pos.x && grid_hex.hex_pos.y == container.hex_pos.y){
                found = true;
                return false;
            }
        });
        if (found) { return true};
        if (fix){
            container.hex_pos.x = closestPoint.x;
            container.hex_pos.y = closestPoint.y;
            return true;
        }
        return false;
    }

    //sets the world position of the passed object according to that object's Vector2 hex_pos property. 0,0 is top left. will automatically lock objects to the grid bounds, unless making_grid is true
    setHexPos(container, making_grid = false){
        if (!making_grid){
            this.inBounds(container, true)
        }

        container.obj.y = (container.hex_pos.y + game_settings.hex_offset.y)*game_settings.hex_vert;
        container.obj.x = (container.hex_pos.x+(0.5*container.hex_pos.y) + game_settings.hex_offset.x)*game_settings.hex_width;
        if (container.text){
            container.text.y = (container.hex_pos.y + game_settings.hex_offset.y)*game_settings.hex_vert;
            container.text.x = (container.hex_pos.x+(0.5*container.hex_pos.y) + game_settings.hex_offset.x)*game_settings.hex_width;
        }
    }
}

