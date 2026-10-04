import * as THREE from 'three';
import type { FeatureCollection, Position } from 'geojson';
import type { CustomLayer } from '../core/layers';
import type { SceneContext } from '../scenes/index';
import type { SceneOf } from '../schema/index';
import { cinematic, lerp, progress } from '../motion/index';

function onSphere(p: Position, r = 1.006): THREE.Vector3 {
  const lon = (p[0] * Math.PI) / 180,
    lat = (p[1] * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.sin(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.cos(lon),
  );
}
function outlines(geometry: FeatureCollection, color: string): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color });
  const ring = (coordinates: Position[]) =>
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(coordinates.map((p) => onSphere(p))),
        material,
      ),
    );
  for (const f of geometry.features) {
    if (f.geometry.type === 'Polygon') f.geometry.coordinates.forEach(ring);
    if (f.geometry.type === 'MultiPolygon')
      f.geometry.coordinates.forEach((poly) => poly.forEach(ring));
  }
  return group;
}
/** Lazy optional 3D globe; no animation loop, physics accumulator or remote textures. */
export function createGlobe(
  host: HTMLElement,
  scene: SceneOf<'custom'>,
  ctx: SceneContext,
): CustomLayer {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(ctx.width, ctx.height);
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);
  const world = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 0.1, 100);
  camera.position.set(0, 0, 4.1);
  const globe = new THREE.Group();
  world.add(globe);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshStandardMaterial({ color: ctx.theme.panel, roughness: 0.9 }),
  );
  globe.add(sphere);
  const geometry = ctx.geometry[String(scene.props.asset)];
  if (!geometry) throw new Error('globe props.asset must reference cached GeoJSON/TopoJSON');
  globe.add(outlines(geometry, ctx.theme.secondary));
  world.add(new THREE.AmbientLight(0xffffff, 1.8));
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(-3, 4, 5);
  world.add(light);
  const update = (s: SceneOf<'custom'>, c: SceneContext) => {
    const p = cinematic(progress(0, s.end - s.start, c.localTime));
    const from = Number(s.props.fromLongitude ?? 0),
      to = Number(s.props.toLongitude ?? 56);
    globe.rotation.set(
      (Number(s.props.latitude ?? 24) * Math.PI) / 180,
      (-lerp(from, to, p) * Math.PI) / 180,
      0,
    );
    globe.position.set(c.width > c.height ? 0.45 : 0, -0.1, 0);
    camera.position.z = lerp(4.1, 3.4, p);
    renderer.render(world, camera);
  };
  update(scene, ctx);
  return {
    update,
    dispose: () => {
      world.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
