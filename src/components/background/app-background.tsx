import Grainient from "@/components/background/grainient";

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[#202827] bg-[radial-gradient(circle_at_20%_20%,rgba(152,172,168,0.28),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(104,94,118,0.30),transparent_38%),linear-gradient(135deg,#202827_0%,#282435_52%,#11111a_100%)]">
      <Grainient
        color1="#98aca8"
        color2="#685e76"
        color3="#433a59"
        timeSpeed={0.35}
        colorBalance={0}
        warpStrength={1}
        warpFrequency={5}
        warpSpeed={1.2}
        warpAmplitude={50}
        blendAngle={0}
        blendSoftness={0.05}
        rotationAmount={500}
        noiseScale={2}
        grainAmount={0.08}
        grainScale={2}
        grainAnimated={false}
        contrast={1.35}
        gamma={1}
        saturation={0.85}
        centerX={0}
        centerY={0}
        zoom={0.9}
      />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(160,145,190,0.12),transparent_34rem),radial-gradient(circle_at_8%_90%,rgba(90,82,116,0.14),transparent_28rem),radial-gradient(circle_at_92%_82%,rgba(110,120,124,0.1),transparent_30rem)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.14)_58%,rgba(0,0,0,0.48)_100%)]" />
    </div>
  );
}
