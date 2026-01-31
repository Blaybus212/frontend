'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AnimationMixer } from 'three';

/**
 * ModelViewer 컴포넌트의 Props 인터페이스
 * @interface ModelViewerProps
 * @property {string} modelPath - 로드할 3D 모델 파일의 경로 (예: '/Assets/model.glb')
 */
interface ModelViewerProps {
  modelPath: string;
}

/**
 * 툴팁에 표시될 데이터 구조
 * @interface TooltipData
 * @property {string} name - 메시의 이름 (툴팁에 표시될 텍스트)
 * @property {number} x - 툴팁의 화면상 X 좌표 (픽셀 단위)
 * @property {number} y - 툴팁의 화면상 Y 좌표 (픽셀 단위)
 */
interface TooltipData {
  name: string;
  x: number;
  y: number;
}

/**
 * 3D 모델 뷰어 컴포넌트
 * 
 * Three.js를 사용하여 OBJ 및 GLB 형식의 3D 모델을 로드하고 표시합니다.
 * 각 메시에 마우스를 올리면 툴팁이 표시되고 호버 효과가 적용됩니다.
 * 
 * 주요 기능:
 * - OBJ 및 GLB 파일 형식 지원
 * - 마우스 오버 시 메시별 툴팁 표시
 * - Raycasting을 통한 정확한 메시 감지
 * - 호버 효과 (밝은 노란색 발광)
 * - OrbitControls를 통한 모델 조작 (회전, 줌, 패닝)
 * 
 * @component
 * @param {ModelViewerProps} props - 컴포넌트 props
 * @param {string} props.modelPath - 로드할 3D 모델 파일의 경로
 * @returns {JSX.Element} 3D 모델 뷰어 컴포넌트
 * 
 * @example
 * ```tsx
 * <ModelViewer modelPath="/Assets/model.glb" />
 * ```
 */
function ModelViewer({ modelPath }: ModelViewerProps) {
  /** 컨테이너 DOM 요소 참조 */
  const containerRef = useRef<HTMLDivElement>(null);
  /** Three.js Scene 객체 참조 - 모든 3D 객체를 포함하는 씬 */
  const sceneRef = useRef<THREE.Scene | null>(null);
  /** Three.js WebGL Renderer 참조 - 3D 장면을 렌더링하는 렌더러 */
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  /** Three.js Perspective Camera 참조 - 3D 장면을 보는 시점 */
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  /** OrbitControls 참조 - 마우스로 모델을 회전/줌/패닝하는 컨트롤 */
  const controlsRef = useRef<OrbitControls | null>(null);
  /** 로드된 모델의 그룹 참조 - 모든 메시를 포함하는 그룹 */
  const modelRef = useRef<THREE.Group | null>(null);
  /** 애니메이션 프레임 ID 참조 - requestAnimationFrame의 반환값 */
  const animationIdRef = useRef<number | null>(null);
  /** AnimationMixer 참조 - GLB 파일의 애니메이션을 재생하는 믹서 (현재 미사용) */
  const mixerRef = useRef<AnimationMixer | null>(null);
  /** Raycaster 참조 - 마우스 위치에서 광선을 쏴 메시와의 교차를 감지 */
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  /** 마우스 위치를 정규화된 좌표(-1 ~ 1)로 저장하는 Vector2 */
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  /** 메시와 이름을 매핑하는 Map - 각 메시의 이름을 저장하여 툴팁에 표시 */
  const meshMapRef = useRef<Map<THREE.Mesh, string>>(new Map());
  /** 현재 마우스 오버 중인 메시 참조 - 호버 효과를 적용하기 위함 */
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  /** 모델 로딩 상태 */
  const [loading, setLoading] = useState(true);
  /** 에러 메시지 상태 */
  const [error, setError] = useState<string | null>(null);
  /** 로딩 진행률 (0-100) */
  const [progress, setProgress] = useState(0);
  /** 현재 표시 중인 툴팁 데이터 */
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  /**
   * Three.js 씬 초기화 및 모델 로드
   * 
   * 이 useEffect는 다음 작업을 수행합니다:
   * 1. Three.js 씬, 카메라, 렌더러 초기화
   * 2. OrbitControls 설정 (모델 조작)
   * 3. 조명 및 헬퍼 객체 추가
   * 4. 모델 파일 형식에 따라 적절한 로더로 모델 로드
   * 5. 마우스 이벤트 리스너 등록 (툴팁 표시)
   * 6. 애니메이션 루프 시작
   * 
   * @effect
   * @dependencies [modelPath] - 모델 경로가 변경되면 재실행
   */
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 이미 초기화되었으면 중복 실행 방지
    if (rendererRef.current) {
      console.warn('Renderer already exists, skipping initialization');
      return;
    }

    // 컨테이너에 이미 canvas가 있으면 제거 (이전 모델의 렌더러 정리)
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      containerRef.current.removeChild(existingCanvas);
    }

    /**
     * Three.js Scene 생성
     * Scene은 모든 3D 객체(메시, 조명, 카메라 등)를 포함하는 컨테이너입니다.
     * 배경색은 어두운 회색(#1a1a1a)으로 설정합니다.
     */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    /**
     * Perspective Camera 생성
     * 원근 투영 카메라로 3D 장면을 2D 화면에 렌더링합니다.
     * @param {number} 50 - 시야각(FOV) - 50도
     * @param {number} aspect - 종횡비 (컨테이너 너비/높이)
     * @param {number} 0.1 - 근거리 클리핑 평면
     * @param {number} 1000 - 원거리 클리핑 평면
     */
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // 카메라를 Z축으로 5단위 뒤로 이동
    cameraRef.current = camera;

    /**
     * WebGL Renderer 생성
     * WebGL을 사용하여 3D 장면을 렌더링합니다.
     * antialias: true - 안티앨리어싱 활성화 (부드러운 렌더링)
     */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio); // 고해상도 디스플레이 지원
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /**
     * OrbitControls 생성 및 설정
     * 마우스로 모델을 회전, 줌, 패닝할 수 있게 해주는 컨트롤입니다.
     * enableDamping: true - 부드러운 움직임을 위한 감쇠 효과
     */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true; // 패닝 활성화 (오른쪽 클릭 + 드래그)
    controls.enableZoom = true; // 줌 활성화 (마우스 휠)
    controls.enableRotate = true; // 회전 활성화 (왼쪽 클릭 + 드래그)
    controls.minDistance = 2; // 최소 줌 거리
    controls.maxDistance = 20; // 최대 줌 거리
    controls.enableDamping = true; // 감쇠 효과 활성화
    controls.dampingFactor = 0.05; // 감쇠 계수
    controlsRef.current = controls;

    /**
     * 3D 뷰어 영역에서 페이지 스크롤 방지
     * 마우스 휠을 사용할 때 페이지가 스크롤되지 않고 모델만 줌되도록 합니다.
     * 
     * @param {WheelEvent} e - 휠 이벤트 객체
     */
    const preventScroll = (e: WheelEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const wheelHandler = (e: WheelEvent) => preventScroll(e);
    window.addEventListener('wheel', wheelHandler, { passive: false });

    /**
     * 조명 추가
     * 3D 모델을 볼 수 있도록 다양한 조명을 추가합니다.
     */
    // 환경광 - 전체적인 밝기 제공
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 방향광 1 - 메인 조명 (오른쪽 위에서)
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(10, 10, 5);
    scene.add(directionalLight1);

    // 방향광 2 - 보조 조명 (왼쪽 아래에서)
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-10, -10, -5);
    scene.add(directionalLight2);

    // 점광 - 중심에서 발산하는 조명
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    /**
     * 헬퍼 객체 추가
     * 개발 및 디버깅을 위한 시각적 도구입니다.
     */
    // 그리드 - 바닥에 격자 표시 (10x10 단위)
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // 축 헬퍼 - X(빨강), Y(초록), Z(파랑) 축 표시
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    /**
     * 파일 확장자 확인
     * 모델 파일이 GLB 형식인지 OBJ 형식인지 확인하여 적절한 로더를 사용합니다.
     */
    const isGLB = modelPath.toLowerCase().endsWith('.glb');
    
    /**
     * 마우스 이동 이벤트 핸들러
     * 
     * 마우스가 모델 위를 이동할 때 호출됩니다.
     * Raycasting을 사용하여 마우스 위치 아래의 메시를 감지하고,
     * 해당 메시에 툴팁을 표시하고 호버 효과를 적용합니다.
     * 
     * 작동 원리:
     * 1. 마우스 위치를 정규화된 좌표(-1 ~ 1)로 변환
     * 2. 카메라에서 마우스 위치로 광선(Ray)을 발사
     * 3. 광선과 교차하는 메시를 찾음
     * 4. 교차한 메시의 이름을 툴팁으로 표시
     * 5. 호버 효과(밝은 노란색 발광) 적용
     * 
     * @param {MouseEvent} event - 마우스 이동 이벤트 객체
     */
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !camera || !scene || !modelRef.current) return;

      // 컨테이너의 화면상 위치와 크기 가져오기
      const rect = containerRef.current.getBoundingClientRect();
      
      // 마우스 위치를 정규화된 좌표(-1 ~ 1)로 변환
      // Three.js의 Raycaster는 정규화된 좌표를 사용합니다
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 카메라에서 마우스 위치로 광선 설정
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      /**
       * Raycasting 수행
       * 모델만 raycasting 대상으로 설정하여 그리드와 축은 제외합니다.
       * 두 번째 인자 true는 자식 객체까지 재귀적으로 검사한다는 의미입니다.
       */
      const intersects = raycasterRef.current.intersectObjects([modelRef.current], true);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        
        // 교차한 객체가 메시이고, 이전에 호버한 메시와 다른 경우에만 처리
        if (intersectedObject instanceof THREE.Mesh && intersectedObject !== hoveredMeshRef.current) {
          /**
           * 이전 호버 효과 제거
           * 이전에 호버했던 메시의 발광 효과를 제거합니다.
           */
          if (hoveredMeshRef.current) {
            if (hoveredMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
              hoveredMeshRef.current.material.emissive.setHex(0x000000); // 발광 색상 제거
              hoveredMeshRef.current.material.emissiveIntensity = 1.0; // 발광 강도 초기화
            }
          }
          
          // 현재 호버 중인 메시로 설정
          hoveredMeshRef.current = intersectedObject;
          
          /**
           * 메시 이름 가져오기
           * meshMapRef에서 메시 이름을 찾고, 없으면 메시의 name 속성을 사용합니다.
           * 둘 다 없으면 'Unknown'을 사용합니다.
           */
          const meshName = meshMapRef.current.get(intersectedObject) || intersectedObject.name || 'Unknown';
          
          /**
           * 툴팁 위치 계산
           * 마우스 위치를 그대로 사용하여 툴팁을 표시합니다.
           */
          const x = event.clientX;
          const y = event.clientY;
          
          // 툴팁 상태 업데이트
          setTooltip({ name: meshName, x, y });
          
          /**
           * 호버 효과 적용
           * 메시에 밝은 노란색(#ffff00) 발광 효과를 적용하여 시각적 피드백을 제공합니다.
           */
          if (intersectedObject.material instanceof THREE.MeshStandardMaterial) {
            intersectedObject.material.emissive.setHex(0xffff00); // 밝은 노란색
            intersectedObject.material.emissiveIntensity = 0.8; // 발광 강도 80%
          }
        }
      } else {
        /**
         * 빈 공간에 마우스가 있을 때
         * 메시와 교차하지 않으면 호버 효과와 툴팁을 제거합니다.
         */
        if (hoveredMeshRef.current) {
          // 호버 효과 제거
          if (hoveredMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
            hoveredMeshRef.current.material.emissive.setHex(0x000000);
            hoveredMeshRef.current.material.emissiveIntensity = 1.0;
          }
          hoveredMeshRef.current = null;
        }
        setTooltip(null);
      }
    };

    /**
     * 마우스가 뷰어 영역을 벗어날 때 호출되는 핸들러
     * 호버 효과와 툴팁을 모두 제거합니다.
     */
    const handleMouseLeave = () => {
      if (hoveredMeshRef.current) {
        if (hoveredMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
          hoveredMeshRef.current.material.emissive.setHex(0x000000);
          hoveredMeshRef.current.material.emissiveIntensity = 1.0;
        }
        hoveredMeshRef.current = null;
      }
      setTooltip(null);
    };

    // 마우스 이벤트 리스너 등록
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);

    /**
     * OBJ 모델 로드 함수
     * 
     * OBJ 파일을 로드하고 처리합니다.
     * 
     * 처리 과정:
     * 1. OBJLoader를 사용하여 파일 로드
     * 2. 각 메시의 geometry 검증 및 NaN 값 제거
     * 3. 메시에 재질 적용 및 이름 매핑
     * 4. 모델 크기 정규화 (화면에 맞게 크기 조정)
     * 5. 씬에 모델 추가
     * 
     * @function loadOBJModel
     * @returns {void}
     */
    const loadOBJModel = () => {
      const loader = new OBJLoader();
      loader.load(
      modelPath,
        /**
         * OBJ 파일 로드 성공 콜백
         * 
         * @param {THREE.Group} object - 로드된 OBJ 모델의 그룹 객체
         */
        (object: THREE.Group) => {
          try {
            /**
             * 모델의 모든 자식 객체를 순회하며 처리
             * traverse 메서드는 그룹 내의 모든 메시를 재귀적으로 순회합니다.
             */
            object.traverse((child) => {
              if (child instanceof THREE.Mesh && child.geometry) {
                const geometry = child.geometry;
                const position = geometry.attributes.position;
                
                /**
                 * Geometry 검증 및 NaN 값 제거
                 * 일부 OBJ 파일에는 잘못된 좌표값(NaN)이 포함될 수 있어 이를 제거합니다.
                 */
                if (position) {
                  // 모든 정점의 좌표를 검사하여 NaN 값 제거
                  for (let i = 0; i < position.count; i++) {
                    const x = position.getX(i);
                    const y = position.getY(i);
                    const z = position.getZ(i);
                    
                    if (isNaN(x) || isNaN(y) || isNaN(z)) {
                      position.setXYZ(i, 0, 0, 0); // NaN 값을 (0, 0, 0)으로 대체
                    }
                  }
                  
                  position.needsUpdate = true; // 변경사항 반영
                  geometry.computeVertexNormals(); // 정점 법선 벡터 재계산 (조명 효과를 위해 필요)
                }
                
                /**
                 * 재질 추가
                 * 각 메시에 표준 재질을 적용합니다.
                 * color: 보라색(#8b5cf6)
                 * emissive: 발광 색상 (기본값 0x000000, 호버 시 변경됨)
                 */
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x8b5cf6,
                  emissive: 0x000000,
                });
                
                /**
                 * 메시 이름 매핑
                 * 각 메시를 이름과 함께 Map에 저장하여 툴팁에 표시할 수 있도록 합니다.
                 * 이름이 없으면 자동으로 "Mesh_1", "Mesh_2" 등으로 생성합니다.
                 */
                const meshName = child.name || `Mesh_${meshMapRef.current.size + 1}`;
                meshMapRef.current.set(child, meshName);
              }
            });

            /**
             * 모델 크기 정규화
             * 모델의 크기를 화면에 맞게 조정합니다.
             * 가장 긴 축의 길이를 2 단위로 맞춥니다.
             */
            const box = new THREE.Box3();
            let hasValidBounds = false;
            
            try {
              // 모델의 경계 상자(Bounding Box) 계산
              box.setFromObject(object);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              
              if (!isNaN(maxDim) && maxDim > 0 && isFinite(maxDim)) {
                hasValidBounds = true;
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2 / maxDim; // 가장 긴 축이 2 단위가 되도록 스케일 계산

                // 모델 크기 조정 및 중심을 원점으로 이동
                object.scale.setScalar(scale);
                object.position.sub(center.multiplyScalar(scale));
              }
            } catch (e) {
              console.warn('Bounding box 계산 실패, 기본 위치 사용:', e);
              // 계산 실패 시 기본 위치와 크기 사용
              object.position.set(0, 0, 0);
              object.scale.setScalar(1);
            }

            // 씬에 모델 추가
            scene.add(object);
            modelRef.current = object;
            setLoading(false);
            setProgress(100);
          } catch (error) {
            console.error('모델 처리 중 오류:', error);
            setError('모델을 처리할 수 없습니다.');
            setLoading(false);
          }
        },
        /**
         * 로딩 진행률 콜백
         * 파일 로딩 중 진행률을 업데이트합니다.
         * 
         * @param {ProgressEvent<EventTarget>} progressEvent - 진행률 이벤트 객체
         */
        (progressEvent: ProgressEvent<EventTarget>) => {
          if (progressEvent.lengthComputable) {
            const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(percentComplete);
          }
        },
        /**
         * 로딩 실패 콜백
         * 파일 로딩 실패 시 에러 메시지를 표시합니다.
         * 
         * @param {unknown} error - 에러 객체
         */
        (error: unknown) => {
          console.error('모델 로드 실패:', error);
          setError('모델을 로드할 수 없습니다.');
          setLoading(false);
        }
      );
    };

    /**
     * GLB 모델 로드 함수
     * 
     * GLB 파일을 로드하고 처리합니다.
     * GLB는 glTF 2.0의 바이너리 형식으로, 메시, 재질, 애니메이션 등을 포함할 수 있습니다.
     * 
     * 처리 과정:
     * 1. GLTFLoader를 사용하여 파일 로드
     * 2. 모든 메시를 순회하며 이름 매핑 및 재질 설정
     * 3. 애니메이션 처리 (현재는 재생하지 않음)
     * 4. 모델 크기 정규화
     * 5. 씬에 모델 추가
     * 
     * @function loadGLBModel
     * @returns {void}
     */
    const loadGLBModel = () => {
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        /**
         * GLB 파일 로드 성공 콜백
         * 
         * @param {Object} gltf - 로드된 GLTF 객체
         * @param {THREE.Scene} gltf.scene - GLTF 씬 객체
         * @param {Array} gltf.animations - 애니메이션 배열 (있는 경우)
         */
        (gltf) => {
          try {
            // 모델을 그룹으로 감싸서 관리
            const modelGroup = new THREE.Group();
            const gltfScene = gltf.scene;
            
            /**
             * GLB 파일의 모든 메시를 순회하며 처리
             * traverse 메서드는 씬 내의 모든 객체를 재귀적으로 순회합니다.
             */
            gltfScene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                /**
                 * 메시 이름 매핑
                 * Blender에서 설정한 메시 이름이 그대로 보존됩니다.
                 * 이름이 없으면 자동으로 "Mesh_1", "Mesh_2" 등으로 생성합니다.
                 */
                const meshName = child.name || `Mesh_${meshMapRef.current.size + 1}`;
                meshMapRef.current.set(child, meshName);
                
                /**
                 * 재질 처리
                 * GLB 파일에 재질이 포함되어 있으면 그대로 사용하고,
                 * 없으면 기본 재질을 추가합니다.
                 */
                if (!child.material) {
                  // 재질이 없으면 기본 재질 추가
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0x8b5cf6,
                    emissive: 0x000000,
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial) {
                  /**
                   * 기존 재질에 emissive 속성 추가
                   * 호버 효과를 적용하기 위해 발광 색상 속성을 보장합니다.
                   */
                  child.material.emissive = child.material.emissive || new THREE.Color(0x000000);
                }
              }
            });

            /**
             * 애니메이션 처리 (현재는 재생하지 않음)
             * GLB 파일에 애니메이션이 포함되어 있어도 재생하지 않습니다.
             * 필요시 주석을 해제하여 애니메이션을 재생할 수 있습니다.
             */
            // if (gltf.animations && gltf.animations.length > 0) {
            //   const mixer = new AnimationMixer(gltfScene);
            //   mixerRef.current = mixer;
            //   
            //   gltf.animations.forEach((clip) => {
            //     mixer.clipAction(clip).play();
            //   });
            // }

            // 모델 그룹에 씬 추가
            modelGroup.add(gltfScene);

            /**
             * 모델 크기 정규화
             * OBJ 모델과 동일한 방식으로 크기를 조정합니다.
             */
            const box = new THREE.Box3();
            try {
              box.setFromObject(modelGroup);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              
              if (maxDim > 0 && isFinite(maxDim)) {
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2 / maxDim;

                modelGroup.scale.setScalar(scale);
                modelGroup.position.sub(center.multiplyScalar(scale));
              }
            } catch (e) {
              console.warn('Bounding box 계산 실패, 기본 위치 사용:', e);
              modelGroup.position.set(0, 0, 0);
              modelGroup.scale.setScalar(1);
            }

            // 씬에 모델 추가
            scene.add(modelGroup);
            modelRef.current = modelGroup;
            setLoading(false);
            setProgress(100);
          } catch (error) {
            console.error('모델 처리 중 오류:', error);
            setError('모델을 처리할 수 없습니다.');
            setLoading(false);
          }
        },
        /**
         * 로딩 진행률 콜백
         * @param {ProgressEvent<EventTarget>} progressEvent - 진행률 이벤트 객체
         */
        (progressEvent: ProgressEvent<EventTarget>) => {
          if (progressEvent.lengthComputable) {
            const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(percentComplete);
          }
        },
        /**
         * 로딩 실패 콜백
         * @param {unknown} error - 에러 객체
         */
        (error: unknown) => {
          console.error('모델 로드 실패:', error);
          setError('모델을 로드할 수 없습니다.');
          setLoading(false);
        }
      );
    };

    /**
     * 파일 형식에 따라 적절한 로더 사용
     * GLB 파일은 GLTFLoader를, OBJ 파일은 OBJLoader를 사용합니다.
     */
    if (isGLB) {
      loadGLBModel();
    } else {
      loadOBJModel();
    }

    /**
     * 애니메이션 루프
     * 매 프레임마다 씬을 렌더링합니다.
     * requestAnimationFrame을 사용하여 브라우저의 리프레시 레이트에 맞춰 실행됩니다.
     */
    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      /**
       * 애니메이션 재생 (현재는 비활성화)
       * GLB 파일의 애니메이션을 재생하려면 주석을 해제하세요.
       */
      // const delta = clock.getDelta();
      // if (mixerRef.current) {
      //   mixerRef.current.update(delta);
      // }
      
      // OrbitControls 업데이트 (감쇠 효과 적용)
      controls.update();
      // 씬 렌더링
      renderer.render(scene, camera);
    };
    animate();

    /**
     * 윈도우 리사이즈 핸들러
     * 윈도우 크기가 변경되면 카메라와 렌더러의 크기를 조정합니다.
     */
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;

      // 카메라 종횡비 업데이트
      camera.aspect =
        containerRef.current.clientWidth /
        containerRef.current.clientHeight;
      camera.updateProjectionMatrix(); // 변경사항 반영
      
      // 렌더러 크기 업데이트
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);

    /**
     * 클린업 함수
     * 컴포넌트가 언마운트되거나 modelPath가 변경될 때 실행됩니다.
     * 모든 이벤트 리스너를 제거하고 Three.js 객체를 정리합니다.
     * 
     * @returns {Function} 클린업 함수
     */
    return () => {
      // 윈도우 이벤트 리스너 제거
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', wheelHandler);
      
      // 마우스 이벤트 리스너 제거
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      
      // 애니메이션 루프 중지
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      
      // 애니메이션 믹서 정리
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      
      // 모든 canvas 요소 제거
      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll('canvas');
        canvases.forEach((canvas) => {
          if (containerRef.current?.contains(canvas)) {
            containerRef.current.removeChild(canvas);
          }
        });
      }
      
      // Three.js 객체 정리 (메모리 누수 방지)
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
      if (modelRef.current) {
        scene.remove(modelRef.current);
        // 모델의 모든 geometry와 material 정리
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
      
      // 모든 ref 초기화
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      hoveredMeshRef.current = null;
      meshMapRef.current.clear();
      setTooltip(null);
    };
  }, [modelPath]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ touchAction: 'none' }}
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
          <div className="text-white text-xl mb-4">모델 로딩 중...</div>
          {progress > 0 && (
            <div className="w-64 bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="text-white text-sm mt-2">{Math.round(progress)}%</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-xl">{error}</div>
        </div>
      )}
      {tooltip && (
        <div
          className="absolute bg-black/80 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-50 shadow-lg border border-gray-600"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 40}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{tooltip.name}</div>
        </div>
      )}
    </div>
  );
}

export default ModelViewer;
