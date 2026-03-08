import { Suspense, useRef, useMemo, useState, lazy } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Lock, ShoppingCart, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Outfit catalog ───────────────────────────────────────────────────
export interface OutfitItem {
  id: string;
  name: string;
  icon: string;
  xpRequired: number;
  xpCost: number; // XP to spend to buy
  category: "top" | "bottom" | "hat" | "accessory";
  colors: { body: string; accent: string; detail?: string };
}

export const OUTFIT_CATALOG: OutfitItem[] = [
  // Tops
  { id: "tshirt_white", name: "Basic Tee", icon: "👕", xpRequired: 0, xpCost: 0, category: "top", colors: { body: "#d4d4d8", accent: "#a1a1aa" } },
  { id: "tshirt_blue", name: "Ocean Blue", icon: "👕", xpRequired: 0, xpCost: 0, category: "top", colors: { body: "#3b82f6", accent: "#2563eb" } },
  { id: "hoodie_purple", name: "Purple Hoodie", icon: "🧥", xpRequired: 100, xpCost: 50, category: "top", colors: { body: "#7c3aed", accent: "#6d28d9", detail: "#a78bfa" } },
  { id: "jacket_tactical", name: "Tactical Jacket", icon: "🧥", xpRequired: 300, xpCost: 150, category: "top", colors: { body: "#365314", accent: "#1a2e05", detail: "#4d7c0f" } },
  { id: "jacket_red", name: "Fire Jacket", icon: "🧥", xpRequired: 500, xpCost: 250, category: "top", colors: { body: "#dc2626", accent: "#991b1b", detail: "#f87171" } },
  { id: "suit_gold", name: "Golden Suit", icon: "🥻", xpRequired: 800, xpCost: 400, category: "top", colors: { body: "#d97706", accent: "#92400e", detail: "#fbbf24" } },
  { id: "armor_diamond", name: "Diamond Armor", icon: "🛡️", xpRequired: 2000, xpCost: 1000, category: "top", colors: { body: "#06b6d4", accent: "#0e7490", detail: "#67e8f9" } },
  // Hats
  { id: "none_hat", name: "No Hat", icon: "❌", xpRequired: 0, xpCost: 0, category: "hat", colors: { body: "none", accent: "none" } },
  { id: "cap_tactical", name: "Tactical Cap", icon: "🧢", xpRequired: 0, xpCost: 0, category: "hat", colors: { body: "#365314", accent: "#1a2e05" } },
  { id: "helmet_combat", name: "Combat Helmet", icon: "⛑️", xpRequired: 400, xpCost: 200, category: "hat", colors: { body: "#44403c", accent: "#292524", detail: "#78716c" } },
  { id: "crown", name: "Royal Crown", icon: "👑", xpRequired: 1500, xpCost: 750, category: "hat", colors: { body: "#f59e0b", accent: "#d97706", detail: "#fcd34d" } },
  { id: "halo", name: "Legendary Halo", icon: "😇", xpRequired: 3000, xpCost: 1500, category: "hat", colors: { body: "#fbbf24", accent: "#f59e0b" } },
  // Accessories
  { id: "none_acc", name: "None", icon: "❌", xpRequired: 0, xpCost: 0, category: "accessory", colors: { body: "none", accent: "none" } },
  { id: "glasses_tactical", name: "Tactical Shades", icon: "🕶️", xpRequired: 50, xpCost: 25, category: "accessory", colors: { body: "#1c1917", accent: "#292524" } },
  { id: "dog_tags", name: "Dog Tags", icon: "🏷️", xpRequired: 150, xpCost: 75, category: "accessory", colors: { body: "#a8a29e", accent: "#78716c" } },
  { id: "headphones", name: "Headphones", icon: "🎧", xpRequired: 200, xpCost: 100, category: "accessory", colors: { body: "#4f46e5", accent: "#3730a3" } },
  { id: "wings", name: "Battle Wings", icon: "🪽", xpRequired: 5000, xpCost: 2500, category: "accessory", colors: { body: "#f0abfc", accent: "#d946ef" } },
];

// ── BGMI-style realistic human character ─────────────────────────────

function HumanCharacter({ topColor, accentColor, detailColor }: { topColor: string; accentColor: string; detailColor?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Subtle idle breathing
      groupRef.current.position.y = Math.sin(time.current * 1.2) * 0.008;
    }
    if (armLRef.current) {
      armLRef.current.rotation.z = 0.08 + Math.sin(time.current * 0.8) * 0.03;
      armLRef.current.rotation.x = Math.sin(time.current * 0.6) * 0.02;
    }
    if (armRRef.current) {
      armRRef.current.rotation.z = -0.08 - Math.sin(time.current * 0.8 + 0.3) * 0.03;
      armRRef.current.rotation.x = Math.sin(time.current * 0.6 + 0.5) * 0.02;
    }
  });

  const skin = "#e8c4a0";
  const skinDark = "#d4a574";
  const hair = "#1a1a2e";
  const pants = "#292524";
  const shoes = "#1c1917";
  const detail = detailColor || accentColor;

  return (
    <group ref={groupRef}>
      {/* HEAD - realistic proportions */}
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      {/* Jaw / chin */}
      <mesh position={[0, 1.55, 0.06]}>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* EYES - realistic */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.08, 1.7, 0.17]}>
          <mesh><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color="#f5f5f4" /></mesh>
          <mesh position={[0, 0, 0.025]}><sphereGeometry args={[0.022, 10, 10]} /><meshStandardMaterial color="#44403c" roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.04]}><sphereGeometry args={[0.012, 8, 8]} /><meshStandardMaterial color="#0c0a09" /></mesh>
          {/* Highlight */}
          <mesh position={[side * 0.01, 0.012, 0.045]}><sphereGeometry args={[0.005, 6, 6]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
        </group>
      ))}

      {/* Eyebrows */}
      {[-1, 1].map((side) => (
        <mesh key={`eb${side}`} position={[side * 0.08, 1.75, 0.18]} rotation={[0, 0, side * 0.12]}>
          <boxGeometry args={[0.06, 0.012, 0.015]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      ))}

      {/* Nose */}
      <mesh position={[0, 1.63, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={skinDark} roughness={0.6} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 1.56, 0.2]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.03, 0.006, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#c4756e" />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <mesh key={`ear${side}`} position={[side * 0.22, 1.65, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      ))}

      {/* HAIR - short tactical style */}
      <mesh position={[0, 1.82, -0.02]}>
        <sphereGeometry args={[0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={hair} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.73, -0.12]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={hair} roughness={0.7} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* TORSO - muscular build */}
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.2, 0.32, 10, 12]} />
        <meshStandardMaterial color={topColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Chest detail / pockets */}
      <mesh position={[-0.1, 1.22, 0.18]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshStandardMaterial color={detail} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 1.22, 0.18]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshStandardMaterial color={detail} roughness={0.6} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 1.32, 0.08]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.1, 0.018, 6, 12, Math.PI]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.19, 0.18, 0.06, 12]} />
        <meshStandardMaterial color="#44403c" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.88, 0.18]}>
        <boxGeometry args={[0.05, 0.04, 0.015]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* ARMS */}
      <group ref={armLRef} position={[-0.28, 1.22, 0]}>
        <mesh position={[-0.04, -0.12, 0]}>
          <capsuleGeometry args={[0.065, 0.2, 6, 8]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        <mesh position={[-0.06, -0.34, 0]}>
          <capsuleGeometry args={[0.05, 0.2, 6, 8]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
        <mesh position={[-0.06, -0.5, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
      </group>
      <group ref={armRRef} position={[0.28, 1.22, 0]}>
        <mesh position={[0.04, -0.12, 0]}>
          <capsuleGeometry args={[0.065, 0.2, 6, 8]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.06, -0.34, 0]}>
          <capsuleGeometry args={[0.05, 0.2, 6, 8]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
        <mesh position={[0.06, -0.5, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
      </group>

      {/* LEGS */}
      {[-1, 1].map((side) => (
        <group key={`leg${side}`}>
          <mesh position={[side * 0.1, 0.58, 0]}>
            <capsuleGeometry args={[0.08, 0.3, 6, 8]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[side * 0.1, 0.48, 0.08]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#57534e" roughness={0.5} />
          </mesh>
          <mesh position={[side * 0.1, 0.28, 0]}>
            <capsuleGeometry args={[0.07, 0.16, 6, 8]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          {/* Boots */}
          <mesh position={[side * 0.1, 0.14, 0.03]}>
            <boxGeometry args={[0.12, 0.1, 0.18]} />
            <meshStandardMaterial color={shoes} roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[side * 0.1, 0.09, 0.04]}>
            <boxGeometry args={[0.13, 0.03, 0.2]} />
            <meshStandardMaterial color="#0c0a09" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Hat({ hatId, hatColor, detailColor }: { hatId: string; hatColor: string; detailColor?: string }) {
  if (hatId === "none_hat") return null;
  if (hatId === "cap_tactical") {
    return (
      <group position={[0, 1.88, 0.04]}>
        <mesh><cylinderGeometry args={[0.24, 0.26, 0.08, 16]} /><meshStandardMaterial color={hatColor} roughness={0.6} /></mesh>
        <mesh position={[0, -0.01, 0.2]} rotation={[-0.35, 0, 0]}><boxGeometry args={[0.18, 0.015, 0.16]} /><meshStandardMaterial color={hatColor} roughness={0.6} /></mesh>
      </group>
    );
  }
  if (hatId === "helmet_combat") {
    return (
      <group position={[0, 1.82, 0]}>
        <mesh><sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} /><meshStandardMaterial color={hatColor} roughness={0.4} metalness={0.3} /></mesh>
        {/* Visor */}
        <mesh position={[0, -0.05, 0.22]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.04]} />
          <meshStandardMaterial color={detailColor || "#57534e"} roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    );
  }
  if (hatId === "crown") {
    return (
      <group position={[0, 1.9, 0]}>
        <mesh><cylinderGeometry args={[0.22, 0.25, 0.12, 6]} /><meshStandardMaterial color={hatColor} roughness={0.15} metalness={0.85} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin((i / 5) * Math.PI * 2) * 0.2, 0.1, Math.cos((i / 5) * Math.PI * 2) * 0.2]}>
            <coneGeometry args={[0.03, 0.08, 4]} /><meshStandardMaterial color={detailColor || hatColor} roughness={0.15} metalness={0.85} />
          </mesh>
        ))}
        {/* Gems */}
        {[0, 2, 4].map((i) => (
          <mesh key={`g${i}`} position={[Math.sin((i / 5) * Math.PI * 2) * 0.23, 0.02, Math.cos((i / 5) * Math.PI * 2) * 0.23]}>
            <octahedronGeometry args={[0.02]} /><meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} roughness={0.1} metalness={0.5} />
          </mesh>
        ))}
      </group>
    );
  }
  if (hatId === "halo") {
    return (
      <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.025, 12, 24]} />
        <meshStandardMaterial color={hatColor} emissive={hatColor} emissiveIntensity={0.5} roughness={0.15} metalness={0.5} />
      </mesh>
    );
  }
  return null;
}

function Accessory({ accId, accColor }: { accId: string; accColor: string }) {
  if (accId === "none_acc") return null;
  if (accId === "glasses_tactical") {
    return (
      <group position={[0, 1.7, 0.2]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.08, 0, 0.02]}>
            <boxGeometry args={[0.07, 0.03, 0.015]} />
            <meshStandardMaterial color={accColor} roughness={0.1} metalness={0.5} transparent opacity={0.85} />
          </mesh>
        ))}
        <mesh><boxGeometry args={[0.03, 0.008, 0.008]} /><meshStandardMaterial color={accColor} /></mesh>
      </group>
    );
  }
  if (accId === "dog_tags") {
    return (
      <group position={[0, 1.3, 0.2]}>
        <mesh><torusGeometry args={[0.12, 0.004, 6, 24]} /><meshStandardMaterial color={accColor} metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0.03, -0.08, 0]}><boxGeometry args={[0.04, 0.06, 0.004]} /><meshStandardMaterial color={accColor} metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[-0.02, -0.1, 0]}><boxGeometry args={[0.035, 0.05, 0.004]} /><meshStandardMaterial color={accColor} metalness={0.8} roughness={0.2} /></mesh>
      </group>
    );
  }
  if (accId === "headphones") {
    return (
      <group position={[0, 1.78, 0]}>
        <mesh><torusGeometry args={[0.24, 0.02, 6, 24, Math.PI]} /><meshStandardMaterial color={accColor} metalness={0.4} roughness={0.3} /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.24, -0.04, 0]}><cylinderGeometry args={[0.045, 0.045, 0.06, 10]} /><meshStandardMaterial color={accColor} metalness={0.4} /></mesh>
        ))}
      </group>
    );
  }
  if (accId === "wings") {
    return (
      <group position={[0, 1.2, -0.2]}>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.25, 0.05, -0.05]} rotation={[0.15, s * -0.35, s * 0.2]}>
              <planeGeometry args={[0.35, 0.45]} />
              <meshStandardMaterial color={accColor} transparent opacity={0.6} side={THREE.DoubleSide} emissive={accColor} emissiveIntensity={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  return null;
}

function Scene({ topColor, accentColor, detailColor, hatId, hatColor, hatDetail, accId, accColor }: {
  topColor: string; accentColor: string; detailColor?: string;
  hatId: string; hatColor: string; hatDetail?: string;
  accId: string; accColor: string;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-2, 3, -2]} intensity={0.3} color="#a78bfa" />
      <group position={[0, -0.95, 0]}>
        <HumanCharacter topColor={topColor} accentColor={accentColor} detailColor={detailColor} />
        <Hat hatId={hatId} hatColor={hatColor} detailColor={hatDetail} />
        <Accessory accId={accId} accColor={accColor} />
      </group>
      <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={2.5} blur={2} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3.5} maxPolarAngle={Math.PI / 1.8} autoRotate autoRotateSpeed={1} />
    </>
  );
}

// ── Mini Avatar (CSS-based for performance) ──────────────────────────

export function MiniAvatar3D({ outfit }: { outfit: { top: string; hat: string; accessory: string } }) {
  const currentTop = OUTFIT_CATALOG.find((o) => o.id === outfit.top) || OUTFIT_CATALOG[0];
  return (
    <div
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-accent/40 flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${currentTop.colors.body}, ${currentTop.colors.accent})` }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Simple CSS face */}
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e8c4a0] relative">
          {/* Hair */}
          <div className="absolute -top-1 left-0 right-0 h-3 rounded-t-full" style={{ backgroundColor: "#1a1a2e" }} />
          {/* Eyes */}
          <div className="absolute top-[45%] left-[25%] w-1 h-1 rounded-full bg-[#1a1a2e]" />
          <div className="absolute top-[45%] right-[25%] w-1 h-1 rounded-full bg-[#1a1a2e]" />
          {/* Mouth */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-2 h-[2px] rounded-full bg-[#c4756e]" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

interface Avatar3DProps {
  xp: number;
  selectedOutfit: { top: string; hat: string; accessory: string };
  onOutfitChange: (outfit: { top: string; hat: string; accessory: string }) => void;
  ownedItems?: string[];
  onPurchase?: (itemId: string, cost: number) => void;
}

const CATEGORIES: Array<{ key: "top" | "hat" | "accessory"; label: string; icon: string }> = [
  { key: "top", label: "Top", icon: "👕" },
  { key: "hat", label: "Hat", icon: "🎩" },
  { key: "accessory", label: "Acc", icon: "✨" },
];

export default function Avatar3D({ xp, selectedOutfit, onOutfitChange, ownedItems = [], onPurchase }: Avatar3DProps) {
  const [activeCategory, setActiveCategory] = useState<"top" | "hat" | "accessory">("top");
  const [buying, setBuying] = useState<string | null>(null);

  const items = useMemo(
    () => OUTFIT_CATALOG.filter((o) => o.category === activeCategory),
    [activeCategory]
  );

  const currentTop = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.top) || OUTFIT_CATALOG[0];
  const currentHat = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.hat) || OUTFIT_CATALOG.find(o => o.id === "none_hat")!;
  const currentAcc = OUTFIT_CATALOG.find((o) => o.id === selectedOutfit.accessory) || OUTFIT_CATALOG.find(o => o.id === "none_acc")!;

  const isOwned = (itemId: string) => {
    const item = OUTFIT_CATALOG.find(o => o.id === itemId);
    if (!item || item.xpCost === 0) return true; // Free items are always owned
    return ownedItems.includes(itemId);
  };

  const canAfford = (item: OutfitItem) => xp >= item.xpRequired && xp >= item.xpCost;

  const handleSelect = (item: OutfitItem) => {
    if (xp < item.xpRequired) return;
    
    if (isOwned(item.id)) {
      // Already owned - just equip
      onOutfitChange({ ...selectedOutfit, [activeCategory]: item.id });
      return;
    }

    // Need to buy
    if (!canAfford(item)) {
      toast.error(`Need ${item.xpCost} XP to buy this item. You have ${xp} XP.`);
      return;
    }
  };

  const handleBuy = async (item: OutfitItem) => {
    if (!canAfford(item)) {
      toast.error(`Not enough XP! Need ${item.xpCost} XP.`);
      return;
    }
    setBuying(item.id);
    try {
      if (onPurchase) {
        onPurchase(item.id, item.xpCost);
      }
      onOutfitChange({ ...selectedOutfit, [activeCategory]: item.id });
      toast.success(`🎉 Bought ${item.name}!`);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
      <div className="relative h-[260px] sm:h-[320px] bg-gradient-to-b from-accent/5 to-background">
        <Canvas camera={{ position: [0, 0.4, 2.6], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "low-power" }}>
          <Suspense fallback={null}>
            <Scene
              topColor={currentTop.colors.body}
              accentColor={currentTop.colors.accent}
              detailColor={currentTop.colors.detail}
              hatId={currentHat.id}
              hatColor={currentHat.colors.body}
              hatDetail={currentHat.colors.detail}
              accId={currentAcc.id}
              accColor={currentAcc.colors.body}
            />
          </Suspense>
        </Canvas>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/80 glass text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          3D Avatar
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-card/80 glass text-xs font-bold text-accent">
          {xp} XP
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

      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto">
        {items.map((item) => {
          const meetsLevel = xp >= item.xpRequired;
          const owned = isOwned(item.id);
          const isSelected = selectedOutfit[activeCategory] === item.id;
          const isBuying = buying === item.id;

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-sm"
                  : meetsLevel
                  ? "border-border hover:border-accent/50 hover:bg-secondary/40"
                  : "border-border/40 opacity-40"
              }`}
            >
              <button
                onClick={() => handleSelect(item)}
                disabled={!meetsLevel}
                className="w-full p-2 pb-1"
              >
                <div className="text-xl mb-0.5">{item.icon}</div>
                <p className="text-[9px] font-medium text-foreground truncate leading-tight">{item.name}</p>
              </button>

              {meetsLevel && !owned && item.xpCost > 0 && (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isBuying || !canAfford(item)}
                  className="w-full px-1 pb-1.5 flex items-center justify-center gap-0.5 text-[8px] font-bold text-accent hover:underline disabled:opacity-50"
                >
                  {isBuying ? (
                    <span className="animate-pulse">Buying...</span>
                  ) : (
                    <>
                      <ShoppingCart className="h-2.5 w-2.5" />
                      Buy {item.xpCost} XP
                    </>
                  )}
                </button>
              )}

              {owned && meetsLevel && item.xpCost > 0 && (
                <div className="px-1 pb-1.5 flex items-center justify-center gap-0.5 text-[8px] font-bold text-green-500">
                  <Check className="h-2.5 w-2.5" /> Owned
                </div>
              )}

              {!meetsLevel && (
                <div className="absolute inset-0 rounded-xl bg-background/60 flex flex-col items-center justify-center cursor-not-allowed">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground">{item.xpRequired} XP</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="px-3 pb-3 text-[10px] text-muted-foreground">
        Buy outfits with XP • Drag to rotate • Earn XP by studying
      </p>
    </div>
  );
}
