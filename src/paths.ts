import { PlaneGeometry, MeshStandardMaterial, Mesh, Group, MathUtils } from 'three';
import { Game } from './game';

class PathsGenerator {
    game: Game;

    readonly rotation = -Math.PI / 2;

    constructor(game: Game) {
        this.game = game;
    }

    public createTestPath(paths: Group) {
        const geometry = new PlaneGeometry(1, 1);
        const material = new MeshStandardMaterial({ color: 'grey', transparent: true, opacity: 0.8 });

        for (let i = 0; i < 10; i++) {
            const mesh = new Mesh(geometry, material);

            mesh.name = 'Path';
            mesh.uuid = MathUtils.generateUUID();
            mesh.position.x = 4;
            mesh.position.y = 0.02;
            mesh.position.z = i;
            mesh.rotation.x = this.rotation;

            paths.add(mesh);
        }

        paths.position.x = -4.5;
        paths.position.z = -4.5;
    }
}

export { PathsGenerator };
