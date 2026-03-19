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

// ── Ultra-realistic human character ─────────────────────────────

function HumanCharacter({ topColor, accentColor, detailColor }: { topColor: string; accentColor: string; detailColor?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    time.current += delta;
    const t = time.current;
    if (groupRef.current) {
      // Breathing + micro weight shift
      groupRef.current.position.y = Math.sin(t * 1.4) * 0.005;
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.01;
    }
    if (headRef.current) {
      // Subtle head bob
      headRef.current.rotation.x = Math.sin(t * 0.6) * 0.008;
      headRef.current.rotation.z = Math.sin(t * 0.4) * 0.005;
    }
    if (armLRef.current) {
      armLRef.current.rotation.z = 0.05 + Math.sin(t * 0.6) * 0.02;
      armLRef.current.rotation.x = Math.sin(t * 0.45) * 0.012;
    }
    if (armRRef.current) {
      armRRef.current.rotation.z = -0.05 - Math.sin(t * 0.6 + 0.3) * 0.02;
      armRRef.current.rotation.x = Math.sin(t * 0.45 + 0.5) * 0.012;
    }
  });

  const skin = "#dbb798";
  const skinLight = "#e8cbb4";
  const skinMid = "#cfa07a";
  const skinDark = "#b8896a";
  const lipColor = "#bf6b6b";
  const lipDark = "#a35555";
  const hair = "#1a1510";
  const hairHighlight = "#2a2520";
  const pants = "#262220";
  const shoes = "#1a1714";
  const detail = detailColor || accentColor;
  const eyeColor = "#5a7a4e";

  return (
    <group ref={groupRef}>
      <group ref={headRef}>
        {/* ── HEAD ── Anatomically sculpted */}
        {/* Cranium - main skull shape */}
        <mesh position={[0, 1.72, -0.015]}>
          <sphereGeometry args={[0.215, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.42} metalness={0.02} />
        </mesh>
        {/* Forehead prominence */}
        <mesh position={[0, 1.8, 0.09]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial color={skin} roughness={0.42} />
        </mesh>
        {/* Brow ridge */}
        <mesh position={[0, 1.73, 0.14]} scale={[1.1, 0.35, 0.6]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={skinMid} roughness={0.45} />
        </mesh>
        {/* Mid-face volume */}
        <mesh position={[0, 1.645, 0.09]}>
          <sphereGeometry args={[0.165, 24, 24]} />
          <meshStandardMaterial color={skin} roughness={0.44} />
        </mesh>
        {/* Jaw - strong angular */}
        <mesh position={[0, 1.545, 0.04]} scale={[1.05, 0.8, 0.92]}>
          <sphereGeometry args={[0.155, 20, 20]} />
          <meshStandardMaterial color={skin} roughness={0.46} />
        </mesh>
        {/* Jawline edges */}
        {[-1, 1].map(s => (
          <mesh key={`jaw${s}`} position={[s * 0.12, 1.55, 0.02]} rotation={[0, 0, s * 0.15]}>
            <capsuleGeometry args={[0.025, 0.06, 6, 8]} />
            <meshStandardMaterial color={skinMid} roughness={0.48} />
          </mesh>
        ))}
        {/* Chin - defined */}
        <mesh position={[0, 1.475, 0.11]}>
          <sphereGeometry args={[0.058, 14, 14]} />
          <meshStandardMaterial color={skinMid} roughness={0.46} />
        </mesh>
        {/* Chin cleft */}
        <mesh position={[0, 1.47, 0.155]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color={skinDark} roughness={0.5} />
        </mesh>
        {/* Cheekbones - prominent */}
        {[-1, 1].map(s => (
          <mesh key={`cheek${s}`} position={[s * 0.135, 1.635, 0.115]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={skinLight} roughness={0.4} />
          </mesh>
        ))}
        {/* Cheek hollows */}
        {[-1, 1].map(s => (
          <mesh key={`chhollow${s}`} position={[s * 0.1, 1.58, 0.1]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={skinDark} roughness={0.55} />
          </mesh>
        ))}
        {/* Temple indents */}
        {[-1, 1].map(s => (
          <mesh key={`temple${s}`} position={[s * 0.19, 1.7, 0.04]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={skinMid} roughness={0.5} />
          </mesh>
        ))}

        {/* ── EYES ── Hyper-detailed with depth */}
        {[-1, 1].map(side => (
          <group key={`eye${side}`} position={[side * 0.076, 1.67, 0.16]}>
            {/* Eye socket depth */}
            <mesh position={[0, 0, -0.012]}>
              <sphereGeometry args={[0.044, 14, 14]} />
              <meshStandardMaterial color={skinDark} roughness={0.6} />
            </mesh>
            {/* Sclera (white) */}
            <mesh>
              <sphereGeometry args={[0.037, 18, 18]} />
              <meshStandardMaterial color="#f2f0ec" roughness={0.12} />
            </mesh>
            {/* Iris - multi-layered */}
            <mesh position={[0, 0, 0.024]}>
              <sphereGeometry args={[0.021, 14, 14]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} metalness={0.08} />
            </mesh>
            {/* Iris ring */}
            <mesh position={[0, 0, 0.028]}>
              <ringGeometry args={[0.015, 0.021, 16]} />
              <meshStandardMaterial color="#3d5a30" roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.035]}>
              <circleGeometry args={[0.011, 14]} />
              <meshStandardMaterial color="#080604" roughness={0.08} />
            </mesh>
            {/* Cornea reflection */}
            <mesh position={[side * 0.007, 0.009, 0.039]}>
              <circleGeometry args={[0.005, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} transparent opacity={0.9} />
            </mesh>
            {/* Secondary reflection */}
            <mesh position={[side * -0.004, -0.005, 0.038]}>
              <circleGeometry args={[0.003, 6]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.4} transparent opacity={0.6} />
            </mesh>
            {/* Upper eyelid with crease */}
            <mesh position={[0, 0.022, 0.012]} rotation={[0.28, 0, 0]} scale={[1.2, 0.42, 0.85]}>
              <sphereGeometry args={[0.039, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={skin} roughness={0.45} />
            </mesh>
            {/* Eyelid crease */}
            <mesh position={[0, 0.032, 0.008]} rotation={[0.2, 0, 0]} scale={[1.15, 0.15, 0.5]}>
              <sphereGeometry args={[0.04, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={skinDark} roughness={0.5} />
            </mesh>
            {/* Lower eyelid */}
            <mesh position={[0, -0.022, 0.012]} rotation={[-0.22, 0, 0]} scale={[1.1, 0.32, 0.7]}>
              <sphereGeometry args={[0.037, 10, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
              <meshStandardMaterial color={skinMid} roughness={0.48} />
            </mesh>
            {/* Lash line - upper */}
            <mesh position={[0, 0.028, 0.02]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.068, 0.006, 0.008]} />
              <meshStandardMaterial color={hair} roughness={0.7} />
            </mesh>
            {/* Individual lashes */}
            {[-2, -1, 0, 1, 2].map(l => (
              <mesh key={`lash${side}${l}`} position={[l * 0.012, 0.032, 0.025]} rotation={[0.5 + Math.abs(l) * 0.1, 0, l * 0.05]}>
                <capsuleGeometry args={[0.002, 0.012, 2, 3]} />
                <meshStandardMaterial color={hair} />
              </mesh>
            ))}
          </group>
        ))}

        {/* ── EYEBROWS ── Natural arch with individual hairs */}
        {[-1, 1].map(side => (
          <group key={`brow${side}`} position={[side * 0.076, 1.745, 0.16]}>
            {/* Main brow body */}
            <mesh rotation={[0, 0, side * 0.08]} scale={[1, 0.4, 0.6]}>
              <capsuleGeometry args={[0.01, 0.055, 6, 8]} />
              <meshStandardMaterial color={hair} roughness={0.75} />
            </mesh>
            {/* Brow tail */}
            <mesh position={[side * 0.025, -0.005, 0]} rotation={[0, 0, side * 0.2]} scale={[1, 0.35, 0.5]}>
              <capsuleGeometry args={[0.007, 0.03, 4, 6]} />
              <meshStandardMaterial color={hair} roughness={0.75} />
            </mesh>
            {/* Hair strands */}
            {[-1, 0, 1].map(h => (
              <mesh key={`bh${h}`} position={[h * 0.012, 0.003, 0.002]} rotation={[0, 0, side * (0.05 + h * 0.04)]}>
                <capsuleGeometry args={[0.003, 0.018, 2, 3]} />
                <meshStandardMaterial color={hairHighlight} roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}

        {/* ── NOSE ── Anatomically correct */}
        {/* Bridge */}
        <mesh position={[0, 1.675, 0.195]} rotation={[0.25, 0, 0]}>
          <capsuleGeometry args={[0.013, 0.065, 8, 10]} />
          <meshStandardMaterial color={skin} roughness={0.45} />
        </mesh>
        {/* Nose body */}
        <mesh position={[0, 1.625, 0.2]} rotation={[0.15, 0, 0]}>
          <capsuleGeometry args={[0.018, 0.035, 6, 8]} />
          <meshStandardMaterial color={skin} roughness={0.45} />
        </mesh>
        {/* Tip - rounded */}
        <mesh position={[0, 1.6, 0.225]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial color={skinMid} roughness={0.44} />
        </mesh>
        {/* Nostrils - carved */}
        {[-1, 1].map(s => (
          <group key={`nos${s}`}>
            <mesh position={[s * 0.02, 1.588, 0.218]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color={skinMid} roughness={0.5} />
            </mesh>
            <mesh position={[s * 0.016, 1.585, 0.225]}>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshStandardMaterial color={skinDark} roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* Nasolabial folds */}
        {[-1, 1].map(s => (
          <mesh key={`nlf${s}`} position={[s * 0.04, 1.56, 0.17]} rotation={[0.1, 0, s * 0.05]}>
            <capsuleGeometry args={[0.004, 0.04, 3, 4]} />
            <meshStandardMaterial color={skinDark} roughness={0.55} transparent opacity={0.5} />
          </mesh>
        ))}

        {/* ── MOUTH ── Detailed lip sculpture */}
        {/* Upper lip - cupid's bow */}
        <mesh position={[0, 1.535, 0.175]} rotation={[0.08, 0, 0]} scale={[1, 0.55, 1]}>
          <torusGeometry args={[0.026, 0.009, 8, 16, Math.PI]} />
          <meshStandardMaterial color={lipColor} roughness={0.32} />
        </mesh>
        {/* Cupid's bow peak */}
        <mesh position={[0, 1.543, 0.19]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color={lipColor} roughness={0.3} />
        </mesh>
        {/* Lower lip - fuller */}
        <mesh position={[0, 1.52, 0.175]} rotation={[-0.12, 0, Math.PI]} scale={[1, 0.5, 1]}>
          <torusGeometry args={[0.024, 0.011, 8, 16, Math.PI]} />
          <meshStandardMaterial color={lipColor} roughness={0.3} />
        </mesh>
        {/* Lip crease line */}
        <mesh position={[0, 1.528, 0.19]}>
          <boxGeometry args={[0.042, 0.003, 0.003]} />
          <meshStandardMaterial color={lipDark} roughness={0.4} />
        </mesh>
        {/* Lip corners */}
        {[-1, 1].map(s => (
          <mesh key={`lipc${s}`} position={[s * 0.025, 1.528, 0.18]}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshStandardMaterial color={skinDark} roughness={0.5} />
          </mesh>
        ))}
        {/* Philtrum */}
        <mesh position={[0, 1.555, 0.19]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.012, 0.025, 0.006]} />
          <meshStandardMaterial color={skinMid} roughness={0.5} transparent opacity={0.3} />
        </mesh>

        {/* ── EARS ── Detailed with cartilage */}
        {[-1, 1].map(side => (
          <group key={`ear${side}`} position={[side * 0.215, 1.66, -0.025]}>
            {/* Outer ear */}
            <mesh rotation={[0, side * 0.25, 0]}>
              <capsuleGeometry args={[0.028, 0.05, 8, 10]} />
              <meshStandardMaterial color={skin} roughness={0.5} />
            </mesh>
            {/* Inner ear (concha) */}
            <mesh position={[side * -0.005, 0, 0.006]} rotation={[0, side * 0.2, 0]}>
              <capsuleGeometry args={[0.016, 0.028, 6, 8]} />
              <meshStandardMaterial color={skinDark} roughness={0.55} />
            </mesh>
            {/* Tragus */}
            <mesh position={[side * -0.01, -0.005, 0.012]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshStandardMaterial color={skin} roughness={0.5} />
            </mesh>
            {/* Earlobe */}
            <mesh position={[side * 0.002, -0.032, 0.005]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color={skinLight} roughness={0.45} />
            </mesh>
          </group>
        ))}

        {/* ── HAIR ── Multi-layered realistic style */}
        {/* Main hair volume */}
        <mesh position={[0, 1.83, -0.02]}>
          <sphereGeometry args={[0.235, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
        {/* Side volume */}
        {[-1, 1].map(s => (
          <mesh key={`shair${s}`} position={[s * 0.185, 1.71, -0.05]}>
            <capsuleGeometry args={[0.058, 0.085, 8, 10]} />
            <meshStandardMaterial color={hair} roughness={0.7} />
          </mesh>
        ))}
        {/* Back volume */}
        <mesh position={[0, 1.71, -0.145]}>
          <capsuleGeometry args={[0.115, 0.13, 10, 10]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
        {/* Top texture strands */}
        {[-0.08, -0.02, 0.04, 0.09].map((x, i) => (
          <mesh key={`strand${i}`} position={[x, 1.85, 0.04 + i * 0.01]} rotation={[0.3 + i * 0.08, i * 0.1, (i - 1.5) * 0.06]}>
            <capsuleGeometry args={[0.012, 0.06, 4, 5]} />
            <meshStandardMaterial color={i % 2 === 0 ? hair : hairHighlight} roughness={0.65} />
          </mesh>
        ))}
        {/* Fringe */}
        <mesh position={[-0.05, 1.81, 0.15]} rotation={[0.45, 0.12, 0.08]}>
          <capsuleGeometry args={[0.025, 0.07, 5, 7]} />
          <meshStandardMaterial color={hair} roughness={0.65} />
        </mesh>
        <mesh position={[0.03, 1.82, 0.155]} rotation={[0.38, -0.08, -0.06]}>
          <capsuleGeometry args={[0.022, 0.06, 5, 7]} />
          <meshStandardMaterial color={hairHighlight} roughness={0.65} />
        </mesh>
      </group>

      {/* ── NECK ── Anatomical with Adam's apple */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.078, 0.098, 0.15, 16]} />
        <meshStandardMaterial color={skin} roughness={0.46} />
      </mesh>
      {/* SCM muscles */}
      {[-1, 1].map(s => (
        <mesh key={`scm${s}`} position={[s * 0.055, 1.4, 0.035]} rotation={[0.12, 0, s * 0.08]}>
          <capsuleGeometry args={[0.014, 0.1, 5, 7]} />
          <meshStandardMaterial color={skinMid} roughness={0.5} />
        </mesh>
      ))}
      {/* Adam's apple */}
      <mesh position={[0, 1.42, 0.075]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color={skinMid} roughness={0.48} />
      </mesh>
      {/* Clavicle hints */}
      {[-1, 1].map(s => (
        <mesh key={`clav${s}`} position={[s * 0.12, 1.35, 0.06]} rotation={[0, 0, s * 0.3]}>
          <capsuleGeometry args={[0.012, 0.08, 4, 6]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
      ))}

      {/* ── TORSO ── Athletic build */}
      <mesh position={[0, 1.18, 0]}>
        <capsuleGeometry args={[0.2, 0.3, 14, 16]} />
        <meshStandardMaterial color={topColor} roughness={0.48} metalness={0.03} />
      </mesh>
      {/* Shoulder caps */}
      {[-1, 1].map(s => (
        <mesh key={`shcap${s}`} position={[s * 0.225, 1.3, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color={topColor} roughness={0.48} />
        </mesh>
      ))}
      {/* Chest definition */}
      {[-1, 1].map(s => (
        <mesh key={`pec${s}`} position={[s * 0.08, 1.23, 0.165]} scale={[1, 0.65, 0.45]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
      ))}
      {/* Collar neckline */}
      <mesh position={[0, 1.34, 0.08]} rotation={[0.35, 0, 0]}>
        <torusGeometry args={[0.1, 0.018, 8, 16, Math.PI]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      {/* Chest pocket with stitching */}
      <mesh position={[-0.1, 1.2, 0.19]}>
        <boxGeometry args={[0.065, 0.05, 0.01]} />
        <meshStandardMaterial color={detail} roughness={0.6} />
      </mesh>
      <mesh position={[-0.1, 1.225, 0.197]}>
        <boxGeometry args={[0.065, 0.008, 0.012]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.2, 0.19]}>
        <boxGeometry args={[0.065, 0.05, 0.01]} />
        <meshStandardMaterial color={detail} roughness={0.6} />
      </mesh>
      {/* Zipper line */}
      <mesh position={[0, 1.18, 0.195]}>
        <boxGeometry args={[0.008, 0.2, 0.006]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* ── BELT ── */}
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.19, 0.185, 0.055, 16]} />
        <meshStandardMaterial color="#3d3530" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.92, 0.185]}>
        <boxGeometry args={[0.048, 0.038, 0.014]} />
        <meshStandardMaterial color="#c4c0b8" roughness={0.15} metalness={0.75} />
      </mesh>

      {/* ── ARMS ── Muscular, defined */}
      <group ref={armLRef} position={[-0.3, 1.28, 0]}>
        <mesh><sphereGeometry args={[0.058, 10, 10]} /><meshStandardMaterial color={topColor} roughness={0.48} /></mesh>
        <mesh position={[-0.025, -0.12, 0]}><capsuleGeometry args={[0.058, 0.18, 10, 12]} /><meshStandardMaterial color={topColor} roughness={0.48} /></mesh>
        {/* Sleeve end */}
        <mesh position={[-0.03, -0.22, 0]}><cylinderGeometry args={[0.058, 0.055, 0.02, 10]} /><meshStandardMaterial color={accentColor} roughness={0.45} /></mesh>
        {/* Elbow */}
        <mesh position={[-0.035, -0.25, 0]}><sphereGeometry args={[0.042, 8, 8]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        {/* Forearm */}
        <mesh position={[-0.04, -0.37, 0]}><capsuleGeometry args={[0.042, 0.18, 8, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        {/* Wrist */}
        <mesh position={[-0.045, -0.49, 0]}><cylinderGeometry args={[0.03, 0.036, 0.035, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        {/* Hand */}
        <mesh position={[-0.045, -0.525, 0.01]} scale={[0.8, 1, 0.5]}><sphereGeometry args={[0.038, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        {[0, 1, 2, 3].map(f => (
          <mesh key={`fl${f}`} position={[-0.045 + (f - 1.5) * 0.011, -0.57, 0.015]}>
            <capsuleGeometry args={[0.005, 0.028, 3, 4]} />
            <meshStandardMaterial color={skin} roughness={0.46} />
          </mesh>
        ))}
        {/* Thumb */}
        <mesh position={[-0.02, -0.54, 0.025]} rotation={[0, 0, 0.4]}>
          <capsuleGeometry args={[0.006, 0.022, 3, 4]} />
          <meshStandardMaterial color={skin} roughness={0.46} />
        </mesh>
      </group>

      <group ref={armRRef} position={[0.3, 1.28, 0]}>
        <mesh><sphereGeometry args={[0.058, 10, 10]} /><meshStandardMaterial color={topColor} roughness={0.48} /></mesh>
        <mesh position={[0.025, -0.12, 0]}><capsuleGeometry args={[0.058, 0.18, 10, 12]} /><meshStandardMaterial color={topColor} roughness={0.48} /></mesh>
        <mesh position={[0.03, -0.22, 0]}><cylinderGeometry args={[0.058, 0.055, 0.02, 10]} /><meshStandardMaterial color={accentColor} roughness={0.45} /></mesh>
        <mesh position={[0.035, -0.25, 0]}><sphereGeometry args={[0.042, 8, 8]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        <mesh position={[0.04, -0.37, 0]}><capsuleGeometry args={[0.042, 0.18, 8, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        <mesh position={[0.045, -0.49, 0]}><cylinderGeometry args={[0.03, 0.036, 0.035, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        <mesh position={[0.045, -0.525, 0.01]} scale={[0.8, 1, 0.5]}><sphereGeometry args={[0.038, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.46} /></mesh>
        {[0, 1, 2, 3].map(f => (
          <mesh key={`fr${f}`} position={[0.045 + (f - 1.5) * -0.011, -0.57, 0.015]}>
            <capsuleGeometry args={[0.005, 0.028, 3, 4]} />
            <meshStandardMaterial color={skin} roughness={0.46} />
          </mesh>
        ))}
        <mesh position={[0.02, -0.54, 0.025]} rotation={[0, 0, -0.4]}>
          <capsuleGeometry args={[0.006, 0.022, 3, 4]} />
          <meshStandardMaterial color={skin} roughness={0.46} />
        </mesh>
      </group>

      {/* ── LEGS ── Athletic with realistic details */}
      {[-1, 1].map(side => (
        <group key={`leg${side}`}>
          {/* Thigh */}
          <mesh position={[side * 0.1, 0.63, 0]}>
            <capsuleGeometry args={[0.082, 0.24, 10, 12]} />
            <meshStandardMaterial color={pants} roughness={0.6} />
          </mesh>
          {/* Knee */}
          <mesh position={[side * 0.1, 0.46, 0.035]}>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshStandardMaterial color={pants} roughness={0.55} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[side * 0.1, 0.46, 0.075]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshStandardMaterial color="#4a443e" roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Shin */}
          <mesh position={[side * 0.1, 0.3, 0]}>
            <capsuleGeometry args={[0.062, 0.18, 8, 10]} />
            <meshStandardMaterial color={pants} roughness={0.6} />
          </mesh>
          {/* Ankle */}
          <mesh position={[side * 0.1, 0.18, 0]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial color={pants} roughness={0.55} />
          </mesh>
          {/* Boot - upper */}
          <mesh position={[side * 0.1, 0.14, 0.02]}>
            <cylinderGeometry args={[0.052, 0.058, 0.08, 12]} />
            <meshStandardMaterial color={shoes} roughness={0.3} metalness={0.08} />
          </mesh>
          {/* Boot body */}
          <mesh position={[side * 0.1, 0.09, 0.03]}>
            <boxGeometry args={[0.115, 0.075, 0.165]} />
            <meshStandardMaterial color={shoes} roughness={0.3} metalness={0.08} />
          </mesh>
          {/* Sole */}
          <mesh position={[side * 0.1, 0.05, 0.035]}>
            <boxGeometry args={[0.125, 0.028, 0.185]} />
            <meshStandardMaterial color="#0a0908" roughness={0.9} />
          </mesh>
          {/* Lace detail */}
          <mesh position={[side * 0.1, 0.12, 0.1]}>
            <boxGeometry args={[0.025, 0.055, 0.004]} />
            <meshStandardMaterial color="#3a3530" roughness={0.5} />
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
