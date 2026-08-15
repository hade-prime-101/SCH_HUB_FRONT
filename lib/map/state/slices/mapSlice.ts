/**
 * Map view state slice — camera position, zoom, pitch, bearing
 */

import { MapCamera } from '../../types/map';

export interface MapState {
  camera: MapCamera;
  targetCamera: MapCamera | null; // For smooth transitions
  isAnimating: boolean;
}

export interface MapActions {
  setCamera: (camera: MapCamera) => void;
  updateCamera: (partial: Partial<MapCamera>) => void;
  animateToCamera: (camera: MapCamera, duration?: number) => void;
  stopAnimation: () => void;
  resetCamera: (defaultCamera: MapCamera) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMapSlice = (defaultCamera: MapCamera) => (set: any) => ({
  camera: defaultCamera,
  targetCamera: null,
  isAnimating: false,

  setCamera: (camera: MapCamera) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set((state: MapState & MapActions) => ({
      camera,
      targetCamera: null,
      isAnimating: false,
    })),

  updateCamera: (partial: Partial<MapCamera>) =>
    set((state: MapState) => ({
      camera: { ...state.camera, ...partial },
    })),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  animateToCamera: (camera: MapCamera, duration: number = 800) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set((state: MapState) => ({
      targetCamera: camera,
      isAnimating: true,
    })),

  stopAnimation: () =>
    set({
      isAnimating: false,
      targetCamera: null,
    }),

  resetCamera: (defaultCamera: MapCamera) =>
    set({
      camera: defaultCamera,
      targetCamera: null,
      isAnimating: false,
    }),
});
