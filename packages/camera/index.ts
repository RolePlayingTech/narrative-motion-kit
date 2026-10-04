import { cinematic, lerp, progress, shake } from '../motion/index';
import type { CameraSpec } from '../schema/index';
export interface Camera2D {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}
export function cameraAt(spec: CameraSpec, time: number): Camera2D {
  const p = cinematic(progress(spec.start, spec.end, time));
  return {
    x: lerp(spec.from.x, spec.to.x, p),
    y: lerp(spec.from.y, spec.to.y, p),
    zoom: Math.exp(lerp(Math.log(spec.from.zoom), Math.log(spec.to.zoom), p)),
    rotation: lerp(spec.from.rotation, spec.to.rotation, p),
  };
}
/** x/y are normalized displacements of the world centre; rotation in degrees. */
export function cameraTransform(camera: Camera2D, width: number, height: number): string {
  return `translate(${width / 2} ${height / 2}) scale(${camera.zoom}) rotate(${camera.rotation}) translate(${-width * (0.5 + camera.x)} ${-height * (0.5 + camera.y)})`;
}
export function frameBounds(
  bounds: { x: number; y: number; width: number; height: number },
  width: number,
  height: number,
  padding = 0.1,
): Camera2D {
  return {
    x: (bounds.x + bounds.width / 2) / width - 0.5,
    y: (bounds.y + bounds.height / 2) / height - 0.5,
    zoom: Math.min(
      (width * (1 - padding * 2)) / bounds.width,
      (height * (1 - padding * 2)) / bounds.height,
    ),
    rotation: 0,
  };
}
export function trackTarget(
  point: [number, number],
  width: number,
  height: number,
  zoom = 1,
): Camera2D {
  return { x: point[0] / width - 0.5, y: point[1] / height - 0.5, zoom, rotation: 0 };
}
export function withShake(camera: Camera2D, time: number, amplitude = 0.001, seed = 1): Camera2D {
  const [x, y] = shake(time, amplitude, seed);
  return { ...camera, x: camera.x + x, y: camera.y + y };
}
export function orbit3D(
  time: number,
  options: { radius: number; elevation: number; from: number; to: number; duration: number },
): [number, number, number] {
  const theta = lerp(options.from, options.to, cinematic(progress(0, options.duration, time)));
  return [Math.sin(theta) * options.radius, options.elevation, Math.cos(theta) * options.radius];
}
