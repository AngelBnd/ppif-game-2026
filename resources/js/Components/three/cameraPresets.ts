export type CameraPreset = 'home';

export const cameraPresets: Record<
    CameraPreset,
    { position: [number, number, number]; lookAt: [number, number, number] }
> = {
    home: {
        position: [10, 1, 1],
        lookAt: [3, 1.5, 1],
    },
};
