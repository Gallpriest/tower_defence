import { Game, PATH_CONFIGS } from './game';

class GlobalEvents {
    game: Game;

    constructor(game: Game) {
        this.game = game;

        this.pointerGeneratePath = this.pointerGeneratePath.bind(this);
        this.pointerUpTimer = this.pointerUpTimer.bind(this);
        this.resizeListener = this.resizeListener.bind(this);
        this.pointerUpCreation = this.pointerUpCreation.bind(this);
        this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
        this.objectProcessDescision = this.objectProcessDescision.bind(this);
        this.publicObjectSelection = this.publicObjectSelection.bind(this);
    }

    public resizeListener() {
        this.game.SIZE.w = window.innerWidth;
        this.game.SIZE.h = window.innerHeight;

        this.game.renderer.setSize(this.game.SIZE.w, this.game.SIZE.h);
        this.game.camera.aspect = this.game.SIZE.w / this.game.SIZE.h;
        this.game.camera.updateProjectionMatrix();

        this.game.orthographicCamera.left = this.game.SIZE.w / -10;
        this.game.orthographicCamera.right = this.game.SIZE.w / 10;
        this.game.orthographicCamera.top = this.game.SIZE.h / 10;
        this.game.orthographicCamera.bottom = this.game.SIZE.h / -10;
        this.game.orthographicCamera.updateProjectionMatrix();
    }

    public pointerGeneratePath(event: PointerEvent) {
        const pathIndex = Number((event.target as HTMLButtonElement).getAttribute('data-path-index'));

        this.game.generatePath(pathIndex);
        this.game.currentPathIdx = pathIndex;
    }

    public pointerUpTimer(event: PointerEvent) {
        if (!this.game.timer.clock.running) {
            this.game.timer.start();
        } else {
            this.game.timer.stop();
        }
        (event.target as HTMLElement).textContent = this.game.timer.clock.running ? 'Stop timer' : 'Start timer';
    }

    public pointerUpCreation(event: PointerEvent) {
        const isPanelElement = (event.target as HTMLElement).closest('.panel-container__item');

        /** Cancel object creation */
        if (isPanelElement && this.game.state.activeProcess === 'dragging') {
            this.game.state.cancelCreation();
            return;
        }

        /** Start object creation process */
        if (isPanelElement && !this.game.state.activeProcess) {
            this.game.state.updateProcess('creation');
            return;
        }

        /** Create a new object or update placement on an old one */
        if (
            this.game.state.activeProcess === 'dragging' &&
            this.game.state.processes.dragging.intersection &&
            !this.game.state.processes.dragging.blocked
        ) {
            this.game.state.processes.dragging.type === 'new'
                ? this.game.state.createNewObject()
                : this.game.state.updateObjectPlacement();
            return;
        }
    }

    public pointerMoveHandler(event: PointerEvent) {
        const x = (event.clientX / this.game.SIZE.w) * 2 - 1;
        const y = -(event.clientY / this.game.SIZE.h) * 2 + 1;

        this.game.state.updatePointerState(x, y);
        this.game.state.intersectionDragging();
        this.game.state.intersectionBlocked();
        this.game.state.performDragging();
    }

    public objectProcessDescision(event: KeyboardEvent) {
        if (event.code === 'KeyX' && this.game.state.processes.selection.object) {
            this.game.state.deleteSelectedObject();
            return;
        }

        if (event.code === 'KeyX' && this.game.state.activeProcess === 'dragging') {
            this.game.state.processes.dragging.type === 'new'
                ? this.game.state.cancelCreation()
                : this.game.state.deleteDraggableObject();
            return;
        }

        if (
            event.code === 'KeyY' &&
            this.game.state.activeProcess === 'dragging' &&
            !this.game.state.processes.dragging.blocked
        ) {
            this.game.state.processes.dragging.type === 'new'
                ? this.game.state.createNewObject()
                : this.game.state.updateObjectPlacement();
            return;
        }
    }

    publicObjectSelection() {
        if (!this.game.state.activeProcess) {
            this.game.state.intersectionSelection();
        }
    }
}

export { GlobalEvents };
