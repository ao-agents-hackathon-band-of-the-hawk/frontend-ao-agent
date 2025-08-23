import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import LiquidChrome from './LiquidChrome';
import * as THREE from 'three';

interface VoiceModeProps {
  imageUrl?: string;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ imageUrl }) => {
  const theme = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const breathePhaseRef = useRef<number>(0);
  
  // Add smoothing variables for gradual voice activity scaling
  const currentScaleRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);

  // Three.js refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const liquidChromeRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initThreeJS = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 300);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create sphere geometry - increased by 25%
    const geometry = new THREE.SphereGeometry(1.875, 64, 64);

    // Create canvas for LiquidChrome texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureRef.current = texture;

    // Create material with the texture - no brightness reduction
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 100,
      transparent: true,
    });

    // Create mesh
    const sphere = new THREE.Mesh(geometry, material);
    // Position sphere to hide seam (rotate it so seam is behind)
    sphere.rotation.y = Math.PI; // 180 degrees to put seam at back
    sphereRef.current = sphere;
    scene.add(sphere);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x646cff, 0.5, 10);
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);
  };

  const updateLiquidChromeTexture = () => {
    if (!liquidChromeRef.current || !canvasRef.current || !textureRef.current) return;

    // Find the canvas element within LiquidChrome component
    const liquidCanvas = liquidChromeRef.current.querySelector('canvas');
    if (liquidCanvas && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Copy LiquidChrome canvas to our texture canvas
        ctx.drawImage(liquidCanvas, 0, 0, canvasRef.current.width, canvasRef.current.height);
        textureRef.current.needsUpdate = true;
      }
    }
  };

  const renderThreeJS = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current && sphereRef.current) {
      // Update texture from LiquidChrome
      updateLiquidChromeTexture();

      // Apply scaling animation to the 3D sphere
      sphereRef.current.scale.setScalar(currentScaleRef.current);
      
      // No rotation - keep seam hidden at back
      // No brightness modifications - show texture as is

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.85;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);

          // Focus on voice frequency range (85Hz to 3000Hz)
          const sampleRate = audioContextRef.current!.sampleRate;
          const voiceStart = Math.floor((85 / (sampleRate / 2)) * bufferLength);
          const voiceEnd = Math.floor((3000 / (sampleRate / 2)) * bufferLength);

          let sum = 0;
          for (let i = voiceStart; i < voiceEnd; i++) {
            sum += dataArray[i];
          }
          const average = sum / (voiceEnd - voiceStart);

          // Dynamic threshold and normalized level (0-1)
          const threshold = 15;
          const maxLevel = 100;
          const normalizedLevel = Math.min(Math.max((average - threshold) / (maxLevel - threshold), 0), 1);

          const now = Date.now();
          const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
          lastUpdateTimeRef.current = now;

          // Smoothing factor for gradual transitions (0-1, higher = smoother but slower)
          const smoothingFactor = 0.1;

          if (normalizedLevel > 0) {
            // Voice active: set target values for smooth scaling
            targetScaleRef.current = 1.1 + normalizedLevel * 0.3; // Reduced by 25% for more subtle voice activity
            // Reset breathe phase when voice starts
            breathePhaseRef.current = 0;
          } else {
            // Idle: enhanced breathing animation with larger scale changes
            breathePhaseRef.current += deltaTime * Math.PI * 2 / 8; // Slightly faster 8s period
            const breatheAmplitude = 0.08 + Math.sin(breathePhaseRef.current * 0.3) * 0.03; // Much larger amplitude: 0.05 to 0.11
            targetScaleRef.current = 1 + Math.abs(Math.sin(breathePhaseRef.current)) * breatheAmplitude;
          }

          // Smoothly interpolate current values toward targets
          currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * smoothingFactor;

          // Render the 3D scene
          renderThreeJS();
        }

        animationRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (error) {
      console.error('Microphone access denied or unavailable:', error);
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const cleanup = () => {
    stopListening();
    
    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }
    
    if (textureRef.current) {
      textureRef.current.dispose();
    }
  };

  useEffect(() => {
    lastUpdateTimeRef.current = Date.now();
    initThreeJS();
    
    // Small delay to ensure LiquidChrome is rendered before starting audio
    setTimeout(() => {
      startListening();
    }, 500);

    return cleanup;
  }, []);

  const containerStyle: React.CSSProperties = {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    position: 'fixed',
    top: 0,
    left: 0,
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  };

  const threejsContainerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
  };

  const liquidChromeContainerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '512px',
    height: '512px',
    top: '-1000px', // Hide it off-screen but keep it rendered
    left: '-1000px',
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <div ref={mountRef} style={threejsContainerStyle} />
      
      {/* Hidden LiquidChrome component that provides texture data */}
      <div ref={liquidChromeRef} style={liquidChromeContainerStyle}>
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={1}
          amplitude={0.6}
          interactive={true}
        />
      </div>
    </div>
  );
};

export default VoiceMode;