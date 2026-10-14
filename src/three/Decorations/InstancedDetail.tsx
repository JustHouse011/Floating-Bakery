import { useLayoutEffect, useRef, type ReactNode } from "react";
import { InstancedMesh, Object3D } from "three";
import { useThree } from "@react-three/fiber";
export interface DetailInstance {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}
export default function InstancedDetail({
  instances,
  children,
}: {
  instances: DetailInstance[];
  children: ReactNode;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.scale.set(...(instance.scale ?? [1, 1, 1]));
      dummy.rotation.set(...(instance.rotation ?? [0, 0, 0]));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [instances, invalidate]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, instances.length]}>
      {children}
    </instancedMesh>
  );
}
