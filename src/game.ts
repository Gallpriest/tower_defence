import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { createGrid } from './grid';
import { GlobalEvents } from './events';
import { StateMachine } from './state';
import GUI from 'lil-gui';

const tool = new GUI();
const gridFolder = tool.addFolder('Grid');
const cameraFolder = tool.addFolder('Camera');
const lightFolder = tool.addFolder('Lights');

class Game {
    canvas: HTMLElement;
    scene: THREE.Scene;
    controls: OrbitControls;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    raycaster: THREE.Raycaster;
    loader: GLTFLoader;
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;

    events: GlobalEvents;
    DOMElements: { picker: Array<Element> } = {
        picker: []
    };
    grid: THREE.Group = new THREE.Group();
    edges: THREE.Group = new THREE.Group();

    state: StateMachine;
    models: Record<'tower', GLTF | null> = { tower: null };

    SIZE = {
        w: window.innerWidth,
        h: window.innerHeight
    };

    constructor(canvas: HTMLElement) {
        /** General setup */
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera();
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.raycaster = new THREE.Raycaster(new THREE.Vector3(-3, 0, 0));
        this.ambientLight = new THREE.AmbientLight();
        this.directionalLight = new THREE.DirectionalLight();
        this.loader = new GLTFLoader();

        /** State */
        this.state = new StateMachine(this);

        /** Main initialization */
        this.loadModels();
        this.initializeDefaultSettings();
        this.initializeGrid();
        this.loadDOMElements();

        /** Support classes */
        this.events = new GlobalEvents(this);
        this.initilizeGlobalEvents();

        /** Bindings */
        this.loop = this.loop.bind(this);
    }

    public start(): void {
        this.loop();
        this.enableGUI();
    }

    private loadModels(): void {
        this.loader.load('../assets/tower.gltf', (gltf) => {
            gltf.scene.scale.set(0.1, 0.12, 0.1);
            gltf.scene.rotation.y = Math.PI / 2;
            this.models.tower = gltf;
        });
    }

    private enableGUI() {
        gridFolder.add(this.grid.position, 'x').min(-10).max(10).step(0.1).name('grid "x" position');

        cameraFolder.add(this.camera.position, 'x').min(-10).max(10).step(0.1).name('camera "x" position');
        cameraFolder.add(this.camera.position, 'y').min(-10).max(10).step(0.1).name('camera "y" position');
        cameraFolder.add(this.camera.position, 'z').min(-10).max(10).step(0.1).name('camera "z" position');

        lightFolder.add(this.ambientLight, 'intensity').min(0).max(1).step(0.01).name('ambient light intensity');
        lightFolder
            .add(this.directionalLight, 'intensity')
            .min(0)
            .max(1)
            .step(0.01)
            .name('directional light intensity');
        lightFolder
            .add(this.directionalLight.position, 'x')
            .min(-10)
            .max(10)
            .step(0.1)
            .name('directional light "x" position');
        lightFolder
            .add(this.directionalLight.position, 'y')
            .min(-10)
            .max(10)
            .step(0.1)
            .name('directional light "y" position');
        lightFolder
            .add(this.directionalLight.position, 'z')
            .min(-10)
            .max(10)
            .step(0.1)
            .name('directional light "z" position');
    }

    private initializeDefaultSettings(): void {
        /** Scene settings */
        // this.scene.background = new THREE.Color('#537188');

        /** Camera settings */
        this.camera.fov = 75;
        this.camera.aspect = this.SIZE.w / this.SIZE.h;
        this.camera.near = 0.1;
        this.camera.far = 1000;
        this.camera.position.set(2, 5, 7);
        this.scene.add(this.camera);
        this.camera.updateProjectionMatrix();

        /** Control settings */
        this.controls.update();
        this.controls.rotateSpeed = 0.7;
        this.controls.target.set(0, 0, 0);
        this.controls.enablePan = false;
        this.controls.maxDistance = 8;
        this.controls.minDistance = 2;
        this.controls.maxPolarAngle = Math.PI / 2.2;

        /** Raycaster settings */
        this.raycaster.near = 0.1;
        this.raycaster.far = 1000;

        /** Ambient light settings */
        this.ambientLight.intensity = 0.4;
        this.scene.add(this.ambientLight);

        /** Directional light settings */
        this.directionalLight.color = new THREE.Color('white');
        this.directionalLight.intensity = 1;
        this.directionalLight.position.set(5.3, 1.5, 4.2);
        this.scene.add(this.directionalLight);

        /** Renderer settings */
        this.renderer.setSize(this.SIZE.w, this.SIZE.h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    private initilizeGlobalEvents(): void {
        window.addEventListener('resize', this.events.resizeListener);
        window.addEventListener('pointerup', this.events.pointerUpCreation);
        window.addEventListener('pointermove', this.events.pointerMoveHandler);
        window.addEventListener('keyup', this.events.objectProcessDescision);
        window.addEventListener('pointerdown', this.events.publicObjectSelection);
    }

    private initializeGrid(): void {
        createGrid(this.grid, this.edges);

        this.scene.add(this.edges);
        this.scene.add(this.grid);
    }

    private loadDOMElements(): void {
        this.DOMElements.picker = Array.from(document.querySelector('.panel-container')?.children ?? []);
    }

    public intersect(children: any[]): THREE.Intersection<THREE.Mesh<any, any>>[] {
        this.raycaster.setFromCamera(this.state.pointerPosition, this.camera);
        return this.raycaster.intersectObjects<THREE.Mesh<any, any>>(children);
    }

    private createTower(): void {
        if (this.models.tower) {
            const box = this.models.tower.scene.clone();
            const cell = this.state.processes.dragging.intersection;

            box.name = 'Tower';
            box.uuid = THREE.MathUtils.generateUUID();

            box.position.x = cell?.point.x ?? 0;
            box.position.y = 0.5;
            box.position.z = cell?.point.z ?? 0;

            this.state.setDraggableObject(box);
            this.scene.add(box);
        }
    }

    private createBacklight(): void {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ color: 'green', transparent: true, opacity: 0.8 })
        );
        const cell = this.state.processes.dragging.intersection;

        plane.rotation.x = -Math.PI / 2;
        plane.position.x = cell?.point.x ?? 0;
        plane.position.y = 0.1;
        plane.position.z = cell?.point.z ?? 0;

        this.state.setDraggableBacklight(plane);
        this.scene.add(plane);
    }

    private loop(): void {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        if (this.state.processes.creation.triggerCreation) {
            this.createTower();
            this.createBacklight();
            this.state.updateProcess('dragging');
        }

        window.requestAnimationFrame(this.loop);
    }
}

export { Game };
