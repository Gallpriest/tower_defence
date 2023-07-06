import { Mesh, BoxGeometry, MeshBasicMaterial, MathUtils, Vector3 } from 'three';
import { Game } from './game';

class Target {
    game: Game;
    mesh: Mesh;

    pointsReached = 1;
    controlPoints: { points: Vector3; direction?: 'forward' | 'backward' | 'left' | 'right' }[] = [];

    constructor(game: Game, g: BoxGeometry, m: MeshBasicMaterial) {
        this.game = game;
        this.mesh = new Mesh(g, m);
        this.controlPoints = [...this.game.pathGenerator.controlPoints];

        this.move = this.move.bind(this);

        this.applySettings();
        this.add();
        this.move();
    }

    applySettings() {
        this.mesh.uuid = MathUtils.generateUUID();
        this.mesh.userData = { health: 0 };

        // add group and center it
        this.mesh.position.y = 0.5;

        this.mesh.position.z = this.game.pathGenerator.initialCoordinates.z;
        this.mesh.position.x = this.game.pathGenerator.initialCoordinates.x;

        console.log(this.mesh.position);
    }

    add() {
        this.game.scene.add(this.mesh);
    }

    move() {
        const point = this.controlPoints[this.pointsReached];

        switch (true) {
            case point.direction === 'forward' && this.mesh.position.z < point.points.z:
                this.mesh.position.z += 0.05;
                break;
            case point.direction === 'backward' && this.mesh.position.z > point.points.z:
                this.mesh.position.z -= 0.05;
                break;
            case point.direction === 'right' && this.mesh.position.x < point.points.x:
                this.mesh.position.x += 0.05;
                break;
            case point.direction === 'left' && this.mesh.position.x > point.points.x:
                this.mesh.position.x -= 0.05;
                break;
            default:
                this.pointsReached += 1;
        }

        if (this.pointsReached >= this.controlPoints.length) {
            this.game.scene.remove(this.mesh);
            return;
        }

        window.requestAnimationFrame(this.move);
    }
}

class EnemyBuilder {
    game: Game;
    targets: Target[] = [];
    geometry: BoxGeometry = new BoxGeometry(1, 1, 1);
    material: MeshBasicMaterial = new MeshBasicMaterial({ color: 'aqua', transparent: true, opacity: 0.7 });

    constructor(game: Game) {
        this.game = game;
    }

    public createTarget() {
        const target = new Target(this.game, this.geometry, this.material);

        this.targets.push(target);
    }

    public addTarget(t: Target) {
        this.targets.push(t);
    }
}

export { EnemyBuilder };
