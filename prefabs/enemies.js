class ChargerEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture){
        super(scene, x, y, texture)
        scene.physics.world.enableBody(this);
        scene.add.existing(this);

        this.type = "CHARGER";
        this.speed = game_settings.charger_speed;
        this.health = game_settings.charger_health;
    }

    //this enemy will just always move toward the player
    update(scene, time, delta){
        let buffer = 2;
        if (scene.player.obj.x > this.x+buffer){
            this.setVelocityX(this.speed);
        }
        if (scene.player.obj.x < this.x-buffer){
            this.setVelocityX(-this.speed);
        }
        if (scene.player.obj.y > this.y+buffer){
            this.setVelocityY(this.speed);
        }
        if (scene.player.obj.y < this.y-buffer){
            this.setVelocityY(-this.speed);
        }
    }
}

class GolemEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture){
        super(scene, x, y, texture)
        scene.physics.world.enableBody(this);
        scene.add.existing(this);

        this.type = "GOLEM";
        this.speed = game_settings.golem_speed;
        this.setDrag(0.05);
        this.setDamping(true);
    }

    //this enemy will only move toward the player if they're close. Otherwise, they'll just stand still
    update(scene, time, delta){
        let dist = Phaser.Math.Distance.Between(this.x, this.y, scene.player.obj.x, scene.player.obj.y);

        if (dist <= game_settings.golem_agro_range){
                let buffer = 2;
            if (scene.player.obj.x > this.x+buffer){
                this.setVelocityX(this.speed);
            }
            if (scene.player.obj.x < this.x-buffer){
                this.setVelocityX(-this.speed);
            }
            if (scene.player.obj.y > this.y+buffer){
                this.setVelocityY(this.speed);
            }
            if (scene.player.obj.y < this.y-buffer){
                this.setVelocityY(-this.speed);
            }
        } else {
            this.angle += 0.1;
        }

        
    }
}