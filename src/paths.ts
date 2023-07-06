import { PlaneGeometry, MeshStandardMaterial, Mesh, Group, MathUtils, MeshBasicMaterial, Vector3 } from 'three';
import { Game } from './game';

type Pattern = {
    amount: number;
    coordinate: 'x' | 'z';
    direction: boolean;
};

export type Mapping = {
    initial: { x: number; z: number };
    patterns: Array<Pattern>;
};

class NewGenerator {
    game: Game;
    pathsGroup: Group = new Group();

    readonly geometry: PlaneGeometry;
    readonly material: MeshBasicMaterial;
    readonly rotation = -Math.PI / 2;
    readonly coordY = 0.02;
    readonly directions = {
        forward: 'z|+',
        backward: 'z|-',
        left: 'x|-',
        right: 'x|+'
    };

    startingCoordinates = new Vector3(0, 0, 0);
    initialCoordinates = new Vector3(0, 0, 0);
    controlPoints: { points: Vector3; direction?: 'forward' | 'backward' | 'left' | 'right' }[] = [];

    constructor(game: Game, coordinates: Vector3) {
        this.game = game;
        this.startingCoordinates = Object.assign(this.startingCoordinates, coordinates);
        this.initialCoordinates = this.startingCoordinates.clone();
        this.geometry = new PlaneGeometry(1, 1);
        this.material = new MeshBasicMaterial({ color: 'grey', transparent: true, opacity: 0.8 });

        this.addControlPoint(this.startingCoordinates.clone());
        this.initGroup();
    }

    initGroup() {
        this.pathsGroup = new Group();
        this.pathsGroup.name = 'paths_three_group';
        this.pathsGroup.uuid = MathUtils.generateUUID();
    }

    addControlPoint(vector: Vector3, direction?: 'forward' | 'backward' | 'left' | 'right') {
        this.controlPoints.push({ points: vector, direction });
    }

    go(direction: keyof typeof this.directions, steps: number) {
        const constantCoordinate = direction === 'forward' || direction === 'backward' ? 'x' : 'z';

        for (let i = 0; i < steps; i++) {
            const mesh = new Mesh(this.geometry, this.material);

            const [coordinate, value] = this.directions[direction].split('|') as ['x' | 'y' | 'z', string];

            const increment = i === 0 ? (this.controlPoints.length >= 2 ? 1 : 0) : 1;

            this.startingCoordinates[coordinate] += Number(value + increment);

            mesh.name = 'path_three_block';
            mesh.uuid = MathUtils.generateUUID();
            mesh.position[coordinate] = this.startingCoordinates[coordinate];
            mesh.position[constantCoordinate] = this.startingCoordinates[constantCoordinate];
            mesh.position.y = this.coordY;
            mesh.rotation.x = this.rotation;

            this.pathsGroup.add(mesh);
        }

        this.addControlPoint(this.startingCoordinates.clone(), direction);

        return this;
    }

    output() {
        this.pathsGroup.position.x;
        this.pathsGroup.position.z;
        this.game.scene.add(this.pathsGroup);
        console.log(this.controlPoints);
        return this;
    }
}

class PathsGenerator {
    game: Game;

    readonly rotation = -Math.PI / 2;
    readonly coordY = 0.02;

    constructor(game: Game) {
        this.game = game;
    }

    public generatePath(paths: Group, mapping: Mapping) {
        const geometry = new PlaneGeometry(1, 1);
        const material = new MeshStandardMaterial({ color: 'grey', transparent: true, opacity: 0.8 });

        const prevCoord: any = {};

        mapping.patterns.forEach(({ coordinate, amount, direction }, idx) => {
            const preservedCoord = coordinate === 'z' ? 'x' : 'z';

            if (idx === 0) {
                prevCoord.x = mapping.initial.x;
                prevCoord.z = mapping.initial.z;
            }

            for (let j = 0; j < amount; j++) {
                const mesh = new Mesh(geometry, material);

                prevCoord[coordinate] += direction ? 1 : -1;

                if (prevCoord[coordinate] === 1 && j === 0 && idx === 0) {
                    prevCoord[coordinate] = 0;
                }

                mesh.name = 'Path';
                mesh.uuid = MathUtils.generateUUID();
                mesh.position.y = this.coordY;
                mesh.position[coordinate] = prevCoord[coordinate];
                mesh.position[preservedCoord] = prevCoord[preservedCoord];
                mesh.rotation.x = this.rotation;

                paths.add(mesh);
            }
        });
    }
}

export { PathsGenerator, NewGenerator };
