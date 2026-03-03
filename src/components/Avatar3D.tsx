import { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";
import { Lock, Shirt, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Tops
  { id: "tshirt_white", name: "Classic White", icon: "👕", xpRequired: 0, category: "top", colors: { body: "#ffffff", accent: "#e2e8f0" } },
  { id: "tshirt_blue", name: "Ocean Blue", icon: "👕", xpRequired: 0, category: "top", colors: { body: "#3b82f6", accent: "#2563eb" } },
  { id: "hoodie_purple", name: "Purple Hoodie", icon: "🧥", xpRequired: 100, category: "top", colors: { body: "#8b5cf6", accent: "#7c3aed" } },
  { id: "jacket_red", name: "Fire Jacket", icon: "🧥", xpRequired: 300, category: "top", colors: { body: "#ef4444", accent: "#dc2626" } },
  { id: "suit_gold", name: "Golden Suit", icon: "🥻", xpRequired: 800, category: "top", colors: { body: "#f59e0b", accent: "#d97706" } },
  { id: "armor_diamond", name: "Diamond Armor", icon: "🛡️", xpRequired: 2000, category: "top", colors: { body: "#06b6d4", accent: "#0891b2" } },
  // Hats
  { id: "none_hat", name: "No Hat", icon: "❌", xpRequired: 0, category: "hat", colors: { body: "none", accent: "none" } },
  { id: "cap_blue", name: "Study Cap", icon: "🧢", xpRequired: 0, category: "hat", colors: { body: "#3b82f6", accent: "#1d4ed8" } },
  { id: "wizard_hat", name: "Wizard Hat", icon: "🎩", xpRequired: 500, category: "hat", colors: { body: "#6d28d9", accent: "#4c1d95" } },
  { id: "crown", name: "Royal Crown", icon: "👑", xpRequired: 1500, category: "hat", colors: { body: "#f59e0b", accent: "#d97706" } },
  { id: "halo", name: "Angel Halo", icon: "😇", xpRequired: 3000, category: "hat", colors: { body: "#fbbf24", accent: "#f59e0b" } },
  // Accessories
  { id: "none_acc", name: "None", icon: "❌", xpRequired: 0, category: "accessory", colors: { body: "none", accent: "none" } },
  { id: "glasses", name: "Smart Glasses", icon: "👓", xpRequired: 50, category: "accessory", colors: { body: "#1e293b", accent: "#334155" } },
  { id: "headphones", name: "Headphones", icon: "🎧", xpRequired: 200, category: "accessory", colors: { body: "#6366f1", accent: "#4f46e5" } },
  { id: "wings", name: "Study Wings", icon: "🪽", xpRequired: 5000, category: "accessory", colors: { body: "#f0abfc", accent: "#d946ef" } },
];

// ── 3D Character ─────────────────────────────────────────────────────

function CharacterBody({ topColor, accentColor }: { topColor: string; accentColor: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Idle breathing animation
      groupRef.current.position.y = Math.sin(time.current * 2) * 0.02;
    }
  });

  const skinColor = "#ffcc99";
  const pantsColor = "#334155";

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.09, 1.58, 0.23]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.09, 1.58, 0.23]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[-0.08, 1.59, 0.26]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.1, 1.59, 0.26]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>

      {/* Smile */}
      <mesh position={[0, 1.48, 0.24]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.06, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e11d48" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.72, -0.02]}>
        <sphereGeometry args={[0.27, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#4a2c1a" roughness={0.8} />
      </mesh>

      {/* Torso / Top */}
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.22, 0.4, 16, 16]} />
        <meshStandardMaterial color={topColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.35, 1.05, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.5} />
      </mesh>
      <mesh position={[0.35, 1.05, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
        <meshStandardMaterial color={topColor} roughness={0.5} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.42, 0.78, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.42, 0.78, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Pants / Legs */}
      <mesh position={[-0.12, 0.45, 0]}>
        <capsuleGeometry args={[0.1, 0.35, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.45, 0]}>
        <capsuleGeometry args={[0.1, 0.35, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.12, 0.18, 0.04]}>
        <boxGeometry args={[0.14, 0.08, 0.2]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.18, 0.04]}>
        <boxGeometry args={[0.14, 0.08, 0.2]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Hat({ hatId, hatColor }: { hatId: string; hatColor: string }) {
  if (hatId === "none_hat") return null;

  if (hatId === "cap_blue") {
    return (
      <group position={[0, 1.78, 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.3, 0.1, 32]} />
          <meshStandardMaterial color={hatColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.22]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.18]} />
          <meshStandardMaterial color={hatColor} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (hatId === "wizard_hat") {
    return (
      <group position={[0, 1.82, 0]}>
        <mesh>
          <coneGeometry args={[0.25, 0.55, 16]} />
          <meshStandardMaterial color={hatColor} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.03, 8, 32]} />
          <meshStandardMaterial color={hatColor} roughness={0.4} />
        </mesh>
        {/* Star on tip */}
        <mesh position={[0, 0.3, 0.05]}>
          <octahedronGeometry args={[0.05]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  }

  if (hatId === "crown") {
    return (
      <group position={[0, 1.82, 0]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.28, 0.15, 8]} />
          <meshStandardMaterial color={hatColor} roughness={0.2} metalness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin((i / 5) * Math.PI * 2) * 0.22, 0.12, Math.cos((i / 5) * Math.PI * 2) * 0.22]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color={hatColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  if (hatId === "halo") {
    return (
      <mesh position={[0, 1.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 16, 32]} />
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
      <group position={[0, 1.57, 0.26]}>
        <mesh position={[-0.09, 0, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
          <meshStandardMaterial color={accColor} />
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
          <meshStandardMaterial color={accColor} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.008, 0.008]} />
          <meshStandardMaterial color={accColor} />
        </mesh>
      </group>
    );
  }

  if (accId === "headphones") {
    return (
      <group position={[0, 1.65, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.28, 0.025, 8, 32, Math.PI]} />
          <meshStandardMaterial color={accColor} metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[-0.28, -0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          <meshStandardMaterial color={accColor} metalness={0.4} />
        </mesh>
        <mesh position={[0.28, -0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          <meshStandardMaterial color={accColor} metalness={0.4} />
        </mesh>
      </group>
    );
  }

  if (accId === "wings") {
    return (
      <group position={[0, 1.15, -0.2]}>
        {/* Left wing */}
        <mesh position={[-0.3, 0.05, -0.05]} rotation={[0.2, -0.4, 0.3]}>
          <planeGeometry args={[0.4, 0.5]} />
          <meshStandardMaterial color={accColor} transparent opacity={0.7} side={THREE.DoubleSide} emissive={accColor} emissiveIntensity={0.3} />
        </mesh>
        {/* Right wing */}
        <mesh position={[0.3, 0.05, -0.05]} rotation={[0.2, 0.4, -0.3]}>
          <planeGeometry args={[0.4, 0.5]} />
          <meshStandardMaterial color={accColor} transparent opacity={0.7} side={THREE.DoubleSide} emissive={accColor} emissiveIntensity={0.3} />
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.3} color="#a78bfa" />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <group position={[0, -0.8, 0]}>
          <CharacterBody topColor={topColor} accentColor={accentColor} />
          <Hat hatId={hatId} hatColor={hatColor} />
          <Accessory accId={accId} accColor={accColor} />
        </group>
      </Float>
      <ContactShadows position={[0, -0.95, 0]} opacity={0.4} scale={3} blur={2.5} />
      <Environment preset="studio" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={1.5}
      />
    </>
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
      {/* 3D Viewer */}
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

      {/* Category tabs */}
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

      {/* Item grid */}
      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto">
        {items.map((item) => {
          const unlocked = xp >= item.xpRequired;
          const isSelected =
            selectedOutfit[activeCategory] === item.id;
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
