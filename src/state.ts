import {
    Vector2,
    Intersection,
    Mesh,
    LineSegments,
    BufferGeometry,
    EdgesGeometry,
    LineBasicMaterial,
    BoxGeometry,
    MeshBasicMaterial,
    Box3,
    Vector3,
    Color
} from 'three';
import { Game } from './game';
import { ObjectsArray, StateProcesses } from './types';

class StateMachine {
    game: Game;
    processes: StateProcesses = {
        creation: {
            triggerCreation: false
        },
        dragging: {
            object: null,
            backlight: null,
            intersection: null,
            type: 'new',
            blocked: false
        },
        selection: {
            object: null
        }
    };

    objectsArray: ObjectsArray = [];
    pointerPosition: Vector2 = new Vector2(0, 0);
    activeProcess: keyof StateProcesses | null = null;

    constructor(game: Game) {
        this.game = game;
    }

    public setDraggableObject(object: StateProcesses['dragging']['object'] | any) {
        this.processes.dragging.object = object;
    }

    public setDraggableBacklight(backlight: StateProcesses['dragging']['backlight']) {
        this.processes.dragging.backlight = backlight;
    }

    public triggerSelection(selection: ObjectsArray[number] | null) {
        if (selection) {
            if (this.processes.selection.object) {
                this.processes.selection.object.boundary.material.opacity = 0;
            }
            selection.boundary.material.color = new Color('yellow');
            selection.boundary.material.opacity = 0.5;
            this.processes.selection.object = selection;
        }

        if (!selection && this.processes.selection.object) {
            this.processes.selection.object.boundary.material.opacity = 0;
            this.processes.selection.object = null;
        }
    }

    public intersectionDragging() {
        const cells = this.game.intersect(this.game.grid.children);

        if (cells.length > 0) {
            this.processes.dragging.intersection = cells[0];
            return;
        }

        this.processes.dragging.intersection = null;
    }

    public intersectionSelection() {
        const boundaries = this.game.intersect(this.objectsArray.map(({ boundary }) => boundary));

        if (boundaries.length > 0 && !this.activeProcess && this.objectsArray.length > 0) {
            const selection = this.objectsArray.find((item) =>
                boundaries.find((b) => item.boundary.uuid === b.object.uuid)
            );

            if (selection) {
                this.triggerSelection(selection);
                return;
            }
        } else {
            this.triggerSelection(null);
        }
    }

    public intersectionBlocked() {
        const boundaries = this.game.intersect(this.objectsArray.map(({ boundary }) => boundary));

        if (boundaries.length > 1 && this.activeProcess === 'dragging') {
            const intersectedSeveralObjects = this.objectsArray
                .filter(({ boundary }) => boundaries.find((item) => item.object.uuid === boundary.uuid))
                .some(({ cell }) => cell.object.uuid === this.processes.dragging.intersection?.object.uuid);
            if (intersectedSeveralObjects) {
                this.processes.dragging.blocked = true;
                document.body.style.cursor = 'not-allowed';

                if (this.processes.dragging.backlight) {
                    this.processes.dragging.backlight.material.color = new Color('red');
                }
                return;
            } else {
                document.body.style.cursor = 'pointer';
                this.processes.dragging.blocked = false;

                if (this.processes.dragging.backlight) {
                    this.processes.dragging.backlight.material.color = new Color('green');
                }
                return;
            }
        }

        if (boundaries.length === 1 && this.activeProcess === 'dragging') {
            const newIntersection = boundaries[0];
            const current = this.objectsArray.find(({ boundary }) => boundary.uuid === newIntersection.object.uuid);

            if (
                current &&
                current.cell.object.uuid === this.processes.dragging.intersection?.object.uuid &&
                current.object.uuid !== this.processes.dragging.object?.uuid
            ) {
                this.processes.dragging.blocked = true;
                document.body.style.cursor = 'not-allowed';

                if (this.processes.dragging.backlight) {
                    this.processes.dragging.backlight.material.color = new Color('red');
                }
                return;
            } else {
                document.body.style.cursor = 'pointer';
                this.processes.dragging.blocked = false;

                if (this.processes.dragging.backlight) {
                    this.processes.dragging.backlight.material.color = new Color('green');
                }
            }
        } else {
            document.body.style.cursor = 'pointer';
            this.processes.dragging.blocked = false;

            if (this.processes.dragging.backlight) {
                this.processes.dragging.backlight.material.color = new Color('green');
            }
        }
    }

    public performDragging() {
        if (
            this.processes.dragging.object &&
            this.processes.dragging.backlight &&
            this.processes.dragging.intersection &&
            this.activeProcess === 'dragging'
        ) {
            const { intersection } = this.processes.dragging;

            this.processes.dragging.object.position.x = intersection
                ? intersection.point.x
                : this.processes.dragging.object.position.y;
            this.processes.dragging.object.position.y = intersection
                ? intersection.point.y + 0.5
                : this.processes.dragging.object.position.z;
            this.processes.dragging.object.position.z = intersection
                ? intersection.point.z
                : this.processes.dragging.object.position.z;

            this.processes.dragging.backlight.position.x = intersection
                ? intersection.object.position.x - 4.5
                : this.processes.dragging.backlight.position.x;
            this.processes.dragging.backlight.position.y = intersection
                ? intersection.object.position.y
                : this.processes.dragging.backlight.position.y;
            this.processes.dragging.backlight.position.z = intersection
                ? intersection.object.position.z - 4.5
                : this.processes.dragging.backlight.position.z;
        }
    }

    public cancelCreation() {
        this.resetState();
        this.game.scene.children.pop();
        this.game.scene.children.pop();
    }

    public deleteSelectedObject() {
        this.game.scene.children = this.game.scene.children.filter(
            (child) => child.uuid !== this.processes.selection.object?.boundary.uuid
        );
        this.objectsArray = this.objectsArray.filter(
            (item) => item.object.uuid !== this.processes.selection.object?.boundary.uuid
        );
        this.resetState();
    }

    public deleteDraggableObject() {
        this.game.scene.children = this.game.scene.children.filter(
            (child) => child.uuid !== this.processes.dragging.object?.uuid
        );
        this.game.scene.children.pop();
        this.resetState();
    }

    public addNewObject(item: ObjectsArray[number]) {
        this.objectsArray.push(item);
    }

    public resetState() {
        this.activeProcess = null;
        this.processes = {
            creation: {
                triggerCreation: false
            },
            dragging: {
                object: null,
                backlight: null,
                intersection: null,
                type: 'new',
                blocked: false
            },
            selection: {
                object: null
            }
        };
        this.toggleEdges(0);
    }

    public createNewObject() {
        if (
            this.processes.dragging.object &&
            this.processes.dragging.backlight &&
            this.processes.dragging.intersection
        ) {
            const { object } = this.processes.dragging;
            const { intersection: cell } = this.processes.dragging;

            object.position.x = cell.object.position.x - 4.5;
            object.position.y = cell.object.position.y + 0.01;
            object.position.z = cell.object.position.z - 4.5;

            const modelProps = new Box3().setFromObject(object);
            let size = new Vector3();

            const boundaryGeometry = new BoxGeometry(0.7, modelProps.getSize(size).y - 0.4, 0.7);
            const boundaryMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0 });
            const boundary = new Mesh(boundaryGeometry, boundaryMaterial);
            boundary.position.x = cell.object.position.x - 4.5;
            boundary.position.y = cell.object.position.y + 0.7;
            boundary.position.z = cell.object.position.z - 4.5;
            boundary.uuid = object.uuid;

            this.addNewObject({ boundary, object, cell });
            this.resetState();
            this.game.scene.children.pop();
            this.game.scene.add(boundary);
        }
    }

    public updateObjectPlacement() {
        if (this.processes.dragging.object && this.processes.dragging.intersection) {
            this.objectsArray = this.objectsArray.map((item) => {
                if (item.object.uuid === this.processes.dragging.object?.uuid) {
                    return {
                        boundary: item.boundary,
                        object: this.processes.dragging.object,
                        cell: this.processes.dragging.intersection as Intersection<Mesh<any, any>>
                    };
                }

                return item;
            });
            this.resetState();
            this.game.scene.children.pop();
        }
    }

    public updatePointerState(x: number, y: number) {
        this.pointerPosition.x = x;
        this.pointerPosition.y = y;
    }

    public toggleEdges(value: number) {
        const edge = this.game.edges.children[0] as LineSegments<EdgesGeometry<BufferGeometry>, LineBasicMaterial>;
        edge.material.opacity = value;
    }

    public updateProcess(value: keyof StateProcesses | null) {
        this.activeProcess = value;

        if (value === 'creation') {
            this.processes.creation.triggerCreation = true;
            this.processes.dragging.type = 'new';
        }

        if (value === 'dragging') {
            this.processes.creation.triggerCreation = false;
            this.toggleEdges(0.5);
        }
    }
}

export { StateMachine };
