import { Environment } from '@react-three/drei';

type SceneLightMode = 'lit' | 'dim';

interface SceneLightsProps {
  mode?: SceneLightMode;
}

/**
 * 3D 씬 조명 (Ambient, Hemisphere, Directional, Environment)
 * @param props.mode - 'lit' | 'dim' (조명 강도)
 */
export function SceneLights({ mode = 'lit' }: SceneLightsProps) {
  const isDim = mode === 'dim';
  const ambientIntensity = isDim ? 0.15 : 0.4;
  const hemiIntensity = isDim ? 0.12 : 0.25;
  const keyIntensity = isDim ? 0.45 : 0.8;
  const fillIntensity = isDim ? 0.2 : 0.35;
  const envIntensity = isDim ? 0.35 : 0.7;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight intensity={hemiIntensity} color="#ffffff" groundColor="#2c2f36" />
      <directionalLight
        position={[12, 12, 6]}
        intensity={keyIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight position={[-10, 6, -8]} intensity={fillIntensity} />
      <Environment preset="city" environmentIntensity={envIntensity} />
    </>
  );
}
