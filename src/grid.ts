import {
    Mesh,
    Group,
    MathUtils,
    LineSegments,
    PlaneGeometry,
    EdgesGeometry,
    LineBasicMaterial,
    MeshStandardMaterial
} from 'three';

function createGrid(grid: Group, edges: Group) {
    /** Create grid */
    let geometryCell: PlaneGeometry | null = null;
    let materialCell: MeshStandardMaterial | null = null;
    let geometryEdge: EdgesGeometry | null = null;
    let materialEdge: LineBasicMaterial | null = null;

    grid.name = 'Grid';

    function drawGrid() {
        if (geometryCell !== null) {
            geometryCell.dispose();
            materialCell?.dispose();
            geometryEdge?.dispose();
            materialEdge?.dispose();
            grid = new Group();
        }

        geometryCell = new PlaneGeometry(1, 1, 1);
        materialCell = new MeshStandardMaterial({ color: '#CBB279' });
        geometryEdge = new EdgesGeometry(geometryCell);
        materialEdge = new LineBasicMaterial({ color: 'black', transparent: true, opacity: 0 });

        let shiftZ = 0;
        let shiftX = -1;
        const rotation = -Math.PI / 2;

        /** Create cells */
        for (let i = 0; i < 100; i++) {
            const plane = new Mesh(geometryCell, materialCell);
            const edge = new LineSegments(geometryEdge, materialEdge);

            shiftX += 1;

            if (i !== 0 && i % 10 === 0) {
                shiftZ += 1;
                shiftX = 0;
            }

            const uuid = MathUtils.generateUUID();

            edge.name = 'Edge';
            edge.uuid = uuid;
            edge.position.y = 0.01;
            edge.position.x = shiftX;
            edge.position.z = shiftZ;
            edge.rotation.x = rotation;

            plane.name = 'Cell';
            plane.uuid = uuid;
            plane.position.x = shiftX;
            plane.position.z = shiftZ;
            plane.rotation.x = rotation;

            grid.add(plane);
            edges.add(edge);
        }

        // edges.position.x = -4.5;
        // edges.position.z = -4.5;

        // grid.position.x = -4.5;
        // grid.position.z = -4.5;
    }

    drawGrid();
}

export { createGrid };
