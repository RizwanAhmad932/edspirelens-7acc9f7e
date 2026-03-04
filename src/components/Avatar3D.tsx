import { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";
import { Lock, Sparkles } from "lucide-react";

// ── Clothing / outfit definitions ────────────────────────────────────
export interface OutfitItem {
  id: string;
  name: string;
  icon: string;
  xpRequired: number;
  category: "top" | "bottom" | "hat" | "accessory";
  colors: { body: string; accent: string };
}

export const OUTFIT_CATALOG: OutfitItem[] = [
  { id: "tshirt_white", name: "Classic White", icon: "👕", xpRequired: 0, category: "top", colors: { body: "#ffffff", accent: "#e2e8f0" } },
  { id: "tshirt_blue", name: "Ocean Blue", icon: "👕", xpRequired: 0, category: "top", colors: { body: "#3b82f6", accent: "#2563eb" } },
  { id: "hoodie_purple", name: "Purple Hoodie", icon: "🧥", xpRequired: 100, category: "top", colors: { body: "#8b5cf6", accent: "#7c3aed" } },
  { id: "jacket_red", name: "Fire Jacket", icon: "🧥", xpRequired: 300, category: "top", colors: { body: "#ef4444", accent: "#dc2626" } },
  { id: "suit_gold", name: "Golden Suit", icon: "🥻", xpRequired: 800, category: "top", colors: { body: "#f59e0b", accent: "#d97706" } },
  { id: "armor_diamond", name: "Diamond Armor", icon: "🛡️", xpRequired: 2000, category: "top", colors: { body: "#06b6d4", accent: "#0891b2" } },
  { id: "none_hat", name: "No Hat", icon: "❌", xpRequired: 0, category: "hat", colors: { body: "none", accent: "none" } },
  { id: "cap_blue", name: "Study Cap", icon: "🧢", xpRequired: 0, category: "hat", colors: { body: "#3b82f6", accent: "#1d4ed8" } },
  { id: "wizard_hat", name: "Wizard Hat", icon: "🎩", xpRequired: 500, category: "hat", colors: { body: "#6d28d9", accent: "#4c1d95" } },
  { id: "crown", name: "Royal Crown", icon: "👑", xpRequired: 1500, category: "hat", colors: { body: "#f59e0b", accent: "#d97706" } },
  { id: "halo", name: "Angel Halo", icon: "😇", xpRequired: 3000, category: "hat", colors: { body: "#fbbf24", accent: "#f59e0b" } },
  { id: "none_acc", name: "None", icon: "❌", xpRequired: 0, category: "accessory", colors: { body: "none", accent: "none" } },
  { id: "glasses", name: "Smart Glasses", icon: "👓", xpRequired: 50, category: "accessory", colors: { body: "#1e293b", accent: "#334155" } },
  { id: "headphones", name: "Headphones", icon: "🎧", xpRequired: 200, category: "accessory", colors: { body: "#6366f1", accent: "#4f46e5" } },
  { id: "wings", name: "Study Wings", icon: "🪽", xpRequired: 5000, category: "accessory", colors: { body: "#f0abfc", accent: "#d946ef" } },
];

// ── Anime-style 3D Character ─────────────────────────────────────────

function AnimeCharacter({ topColor, accentColor }: { topColor: string; accentColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const armLeftRef = useRef<THREE.Group>(null);
  const armRightRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time.current * 1.8) * 0.015;
    }
    // Arm sway
    if (armLeftRef.current) {
      armLeftRef.current.rotation.z = 0.15 + Math.sin(time.current * 1.5) * 0.06;
    }
    if (armRightRef.current) {
      armRightRef.current.rotation.z = -0.15 - Math.sin(time.current * 1.5 + 0.5) * 0.06;
    }
    // Hair sway
    if (hairRef.current) {
      hairRef.current.rotation.z = Math.sin(time.current * 1.2) * 0.02;
    }
  });

  const skinColor = "#fce4c8";
  const hairColor = "#2d1b4e";
  const pantsColor = "#1e293b";
  const eyeColor = "#6d28d9";

  return (
    <group ref={groupRef}>
      {/* ── HEAD (anime proportions - larger, rounder) ── */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* ── ANIME EYES (large, expressive) ── */}
      {/* Left eye white */}
      <mesh position={[-0.11, 1.65, 0.26]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Left iris */}
      <mesh position={[-0.11, 1.65, 0.31]}>
        <sphereGeometry args={[0.048, 16, 16]} />
        <meshStandardMaterial color={eyeColor} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Left pupil */}
      <mesh position={[-0.11, 1.65, 0.34]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#0f0a1a" />
      </mesh>
      {/* Left eye sparkle (anime highlight) */}
      <mesh position={[-0.095, 1.67, 0.35]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.12, 1.635, 0.345]}>
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
      </mesh>

      {/* Right eye white */}
      <mesh position={[0.11, 1.65, 0.26]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Right iris */}
      <mesh position={[0.11, 1.65, 0.31]}>
        <sphereGeometry args={[0.048, 16, 16]} />
        <meshStandardMaterial color={eyeColor} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Right pupil */}
      <mesh position={[0.11, 1.65, 0.34]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#0f0a1a" />
      </mesh>
      {/* Right eye sparkle */}
      <mesh position={[0.125, 1.67, 0.35]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.1, 1.635, 0.345]}>
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.11, 1.72, 0.28]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      <mesh position={[0.11, 1.72, 0.28]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Nose (subtle) */}
      <mesh position={[0, 1.58, 0.3]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#f0d0a8" roughness={0.5} />
      </mesh>

      {/* Mouth - cute smile */}
      <mesh position={[0, 1.52, 0.28]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e8677d" />
      </mesh>

      {/* Blush marks (anime style) */}
      <mesh position={[-0.18, 1.57, 0.22]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#ffb3b3" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.18, 1.57, 0.22]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#ffb3b3" transparent opacity={0.4} />
      </mesh>

      {/* ── HAIR (anime spiky/flowing) ── */}
      <group ref={hairRef}>
        {/* Main hair cap */}
        <mesh position={[0, 1.78, -0.02]}>
          <sphereGeometry args={[0.33, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        {/* Side hair left */}
        <mesh position={[-0.28, 1.55, 0.05]}>
          <capsuleGeometry args={[0.06, 0.25, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        {/* Side hair right */}
        <mesh position={[0.28, 1.55, 0.05]}>
          <capsuleGeometry args={[0.06, 0.25, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        {/* Back hair */}
        <mesh position={[0, 1.5, -0.18]}>
          <capsuleGeometry args={[0.15, 0.35, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        {/* Front bangs */}
        <mesh position={[-0.1, 1.78, 0.2]} rotation={[0.3, 0.2, 0.15]}>
          <capsuleGeometry args={[0.04, 0.12, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.05, 1.79, 0.22]} rotation={[0.25, -0.1, -0.1]}>
          <capsuleGeometry args={[0.04, 0.1, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.15, 1.77, 0.18]} rotation={[0.3, -0.2, -0.15]}>
          <capsuleGeometry args={[0.035, 0.1, 8, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.6} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* ── TORSO ── */}
      <mesh position={[0, 1.08, 0]}>
        <capsuleGeometry args={[0.2, 0.35, 16, 16]} />
        <meshStandardMaterial color={topColor} roughness={0.45} metalness={0.05} />
      </mesh>
      {/* Collar detail */}
      <mesh position={[0, 1.26, 0.1]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* ── ARMS ── */}
      <group ref={armLeftRef} position={[-0.3, 1.15, 0]}>
        {/* Upper arm */}
        <mesh position={[-0.05, -0.1, 0]}>
          <capsuleGeometry args={[0.065, 0.22, 8, 8]} />
          <meshStandardMaterial color={topColor} roughness={0.45} />
        </mesh>
        {/* Lower arm */}
        <mesh position={[-0.08, -0.32, 0]}>
          <capsuleGeometry args={[0.055, 0.18, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.09, -0.48, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
      </group>

      <group ref={armRightRef} position={[0.3, 1.15, 0]}>
        <mesh position={[0.05, -0.1, 0]}>
          <capsuleGeometry args={[0.065, 0.22, 8, 8]} />
          <meshStandardMaterial color={topColor} roughness={0.45} />
        </mesh>
        <mesh position={[0.08, -0.32, 0]}>
          <capsuleGeometry args={[0.055, 0.18, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.09, -0.48, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
      </group>

      {/* ── HIPS / WAIST ── */}
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.18, 0.08, 12, 12]} />
        <meshStandardMaterial color={pantsColor} roughness={0.6} />
      </mesh>

      {/* ── LEGS ── */}
      <mesh position={[-0.1, 0.52, 0]}>
        <capsuleGeometry args={[0.085, 0.32, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.52, 0]}>
        <capsuleGeometry args={[0.085, 0.32, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.6} />
      </mesh>

      {/* ── SHOES ── */}
      <mesh position={[-0.1, 0.24, 0.04]}>
        <boxGeometry args={[0.13, 0.07, 0.19]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0.1, 0.24, 0.04]}>
        <boxGeometry args={[0.13, 0.07, 0.19]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.15} />
      </mesh>
      {/* Shoe soles */}
      <mesh position={[-0.1, 0.2, 0.04]}>
        <boxGeometry args={[0.14, 0.03, 0.2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.2, 0.04]}>
        <boxGeometry args={[0.14, 0.03, 0.2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Hat({ hatId, hatColor }: { hatId: string; hatColor: string }) {
  if (hatId === "none_hat") return null;
  if (hatId === "cap_blue") {
    return (
      <group position={[0, 1.85, 0.05]}>
        <mesh><cylinderGeometry args={[0.3, 0.33, 0.1, 32]} /><meshStandardMaterial color={hatColor} roughness={0.5} /></mesh>
        <mesh position={[0, 0, 0.24]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.22, 0.02, 0.2]} /><meshStandardMaterial color={hatColor} roughness={0.5} /></mesh>
      </group>
    );
  }
  if (hatId === "wizard_hat") {
    return (
      <group position={[0, 1.9, 0]}>
        <mesh><coneGeometry args={[0.27, 0.55, 16]} /><meshStandardMaterial color={hatColor} roughness={0.4} metalness={0.2} /></mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.34, 0.03, 8, 32]} /><meshStandardMaterial color={hatColor} roughness={0.4} /></mesh>
        <mesh position={[0, 0.3, 0.05]}><octahedronGeometry args={[0.05]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} /></mesh>
      </group>
    );
  }
  if (hatId === "crown") {
    return (
      <group position={[0, 1.9, 0]}>
        <mesh><cylinderGeometry args={[0.27, 0.3, 0.15, 8]} /><meshStandardMaterial color={hatColor} roughness={0.2} metalness={0.8} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin((i / 5) * Math.PI * 2) * 0.24, 0.12, Math.cos((i / 5) * Math.PI * 2) * 0.24]}>
            <coneGeometry args={[0.04, 0.1, 4]} /><meshStandardMaterial color={hatColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }
  if (hatId === "halo") {
    return (
      <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.03, 16, 32]} />
        <meshStandardMaterial color={hatColor} emissive={hatColor} emissiveIntensity={0.6} roughness={0.2} metalness={0.5} />
      </mesh>
    );
  }
  return null;
}

function Accessory({ accId, accColor }: { accId: string; accColor: string }) {
  if (accId === "none_acc") return null;
  if (accId === "glasses") {
    return (
      <group position={[0, 1.64, 0.3]}>
        <mesh position={[-0.11, 0, 0]}><torusGeometry args={[0.055, 0.008, 8, 16]} /><meshStandardMaterial color={accColor} /></mesh>
        <mesh position={[0.11, 0, 0]}><torusGeometry args={[0.055, 0.008, 8, 16]} /><meshStandardMaterial color={accColor} /></mesh>
        <mesh><boxGeometry args={[0.04, 0.008, 0.008]} /><meshStandardMaterial color={accColor} /></mesh>
      </group>
    );
  }
  if (accId === "headphones") {
    return (
      <group position={[0, 1.72, 0]}>
        <mesh><torusGeometry args={[0.3, 0.025, 8, 32, Math.PI]} /><meshStandardMaterial color={accColor} metalness={0.4} roughness={0.3} /></mesh>
        <mesh position={[-0.3, -0.05, 0]}><cylinderGeometry args={[0.06, 0.06, 0.08, 16]} /><meshStandardMaterial color={accColor} metalness={0.4} /></mesh>
        <mesh position={[0.3, -0.05, 0]}><cylinderGeometry args={[0.06, 0.06, 0.08, 16]} /><meshStandardMaterial color={accColor} metalness={0.4} /></mesh>
      </group>
    );
  }
  if (accId === "wings") {
    return (
      <group position={[0, 1.15, -0.2]}>
        <mesh position={[-0.3, 0.05, -0.05]} rotation={[0.2, -0.4, 0.3]}>
          <planeGeometry args={[0.4, 0.5]} /><meshStandardMaterial color={accColor} transparent opacity={0.7} side={THREE.DoubleSide} emissive={accColor} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.3, 0.05, -0.05]} rotation={[0.2, 0.4, -0.3]}>
          <planeGeometry args={[0.4, 0.5]} /><meshStandardMaterial color={accColor} transparent opacity={0.7} side={THREE.DoubleSide} emissive={accColor} emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }
  return null;
}

function Scene({ topColor, accentColor, hatId, hatColor, accId, accColor }: {
  topColor: string; accentColor: string;
  hatId: string; hatColor: string;
  accId: string; accColor: string;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.4} color="#a78bfa" />
      <pointLight position={[0, 2, 3]} intensity={0.3} color="#fbbf24" />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <group position={[0, -0.85, 0]}>
          <AnimeCharacter topColor={topColor} accentColor={accentColor} />
          <Hat hatId={hatId} hatColor={hatColor} />
          <Accessory accId={accId} accColor={accColor} />
        </group>
      </Float>
      <ContactShadows position={[0, -1.0, 0]} opacity={0.4} scale={3} blur={2.5} />
      <Environment preset="studio" />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} autoRotate autoRotateSpeed={1.5} />
    </>
  );
}

// ── Mini Avatar (for profile icon on header) ─────────────────────────

function MiniCharacter({ topColor }: { topColor: string }) {
  const skinColor = "#fce4c8";
  const hairColor = "#2d1b4e";
  const eyeColor = "#6d28d9";
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.38, 0.28]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-0.12, 0.38, 0.33]}><sphereGeometry args={[0.04, 12, 12]} /><meshStandardMaterial color={eyeColor} /></mesh>
      <mesh position={[-0.1, 0.4, 0.36]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} /></mesh>
      <mesh position={[0.12, 0.38, 0.28]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[0.12, 0.38, 0.33]}><sphereGeometry args={[0.04, 12, 12]} /><meshStandardMaterial color={eyeColor} /></mesh>
      <mesh position={[0.14, 0.4, 0.36]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} /></mesh>
      {/* Smile */}
      <mesh position={[0, 0.28, 0.3]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.05, 0.01, 8, 16, Math.PI]} /><meshStandardMaterial color="#e8677d" /></mesh>
      {/* Hair */}
      <mesh position={[0, 0.55, -0.02]}><sphereGeometry args={[0.35, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color={hairColor} /></mesh>
      {/* Bangs */}
      <mesh position={[-0.08, 0.55, 0.2]} rotation={[0.3, 0.2, 0.1]}><capsuleGeometry args={[0.04, 0.1, 6, 6]} /><meshStandardMaterial color={hairColor} /></mesh>
      <mesh position={[0.1, 0.55, 0.2]} rotation={[0.3, -0.2, -0.1]}><capsuleGeometry args={[0.035, 0.08, 6, 6]} /><meshStandardMaterial color={hairColor} /></mesh>
      {/* Body hint */}
      <mesh position={[0, -0.05, 0]}><capsuleGeometry args={[0.2, 0.15, 8, 8]} /><meshStandardMaterial color={topColor} roughness={0.5} /></mesh>
    </group>
  );
}

export function MiniAvatar3D({ outfit }: { outfit: { top: string; hat: string; accessory: string } }) {
  const currentTop = OUTFIT_CATALOG.find((o) => o.id === outfit.top) || OUTFIT_CATALOG[0];
  return (
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-accent/10 border-2 border-accent/30">
      <Canvas camera={{ position: [0, 0.3, 1.8], fov: 35 }} dpr={[1, 1.5]} style={{ width: "100%", height: "100%" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 3, 3]} intensity={1} />
          <group position={[0, -0.2, 0]}>
            <MiniCharacter topColor={currentTop.colors.body} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

interface Avatar3DProps {
  xp: number;
  selectedOutfit: { top: string; hat: string; accessory: string };
  onOutfitChange: (outfit: { top: string; hat: string; accessory: string }) => void;
}

const CATEGORIES: Array<{ key: "top" | "hat" | "accessory"; label: string; icon: string }> = [
  { key: "top", label: "Top", icon: "👕" },
  { key: "hat", label: "Hat", icon: "🎩" },
  { key: "accessory", label: "Acc", icon: "✨" },
];

export default function Avatar3D({ xp, selectedOutfit, onOutfitChange }: Avatar3DProps) {
  const [activeCategory, setActiveCategory] = useState<"top" | "hat" | "accessory">("top");

  const items = useMemo(
    () => OUTFIT_CATALOG.filter((o) => o.category === activeCategory),
    [activeCategory]
  );

  const currentTop = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.top) || OUTFIT_CATALOG[0];
  const currentHat = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.hat) || OUTFIT_CATALOG.find(o => o.id === "none_hat")!;
  const currentAcc = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.accessory) || OUTFIT_CATALOG.find(o => o.id === "none_acc")!;

  const handleSelect = (item: OutfitItem) => {
    if (xp < item.xpRequired) return;
    onOutfitChange({ ...selectedOutfit, [activeCategory]: item.id });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
      <div className="relative h-[280px] sm:h-[320px] bg-gradient-to-b from-accent/5 to-background">
        <Canvas camera={{ position: [0, 0.5, 2.8], fov: 40 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene
              topColor={currentTop.colors.body}
              accentColor={currentTop.colors.accent}
              hatId={currentHat.id}
              hatColor={currentHat.colors.body}
              accId={currentAcc.id}
              accColor={currentAcc.colors.body}
            />
          </Suspense>
        </Canvas>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/80 glass text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          3D Avatar
        </div>
      </div>

      <div className="flex border-t border-b border-border">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
              activeCategory === cat.key
                ? "bg-accent/10 text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto">
        {items.map((item) => {
          const unlocked = xp >= item.xpRequired;
          const isSelected = selectedOutfit[activeCategory] === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              disabled={!unlocked}
              className={`relative p-2 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-sm"
                  : unlocked
                  ? "border-border hover:border-accent/50 hover:bg-secondary/40"
                  : "border-border/40 opacity-40 cursor-not-allowed"
              }`}
            >
              <div className="text-xl mb-0.5">{item.icon}</div>
              <p className="text-[9px] font-medium text-foreground truncate leading-tight">{item.name}</p>
              {!unlocked && (
                <div className="absolute inset-0 rounded-xl bg-background/60 flex flex-col items-center justify-center">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground">{item.xpRequired} XP</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="px-3 pb-3 text-[10px] text-muted-foreground">
        Earn XP to unlock outfits • Drag to rotate your avatar
      </p>
    </div>
  );
}
