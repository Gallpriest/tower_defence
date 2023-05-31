import { Mesh, PlaneGeometry, MeshBasicMaterial, Group, Intersection } from 'three';

type CellMeshObject = Mesh<PlaneGeometry, MeshBasicMaterial>;

type MeshObject = Mesh<any, any>;

type StateProcesses = {
    dragging: {
        object: Group | null;
        backlight: Mesh<any, any> | null;
        intersection: Intersection<Mesh<any, any>> | null;
        type: 'new' | 'old';
        blocked: boolean;
    };
    selection: {
        object: ObjectsArray[number] | null;
    };
};

type ObjectsArray = Array<{ boundary: Mesh<any, any>; object: any; cell: Intersection<Mesh<any, any>> }>;

export type { CellMeshObject, MeshObject, StateProcesses, ObjectsArray };
