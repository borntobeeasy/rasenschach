import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Controls } from "@/components/Controls";
import { Pitch } from "@/components/Pitch";
import { useTacticsStore } from "@/store/useTacticsStore";
import { decodeSnapshot, encodeSnapshot } from "@/utils/share";

export default function HomePage() {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState("");
  const hydrate = useTacticsStore((state) => state.hydrate);
  const shareState = useTacticsStore((state) => ({
    players: state.players,
    arrows: state.arrows,
    zones: state.zones,
    selectedPlayerId: state.selectedPlayerId,
    activeTeam: state.activeTeam,
    toolMode: state.toolMode,
    formation: state.formation,
    name: state.name
  }));

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const encoded = typeof router.query.state === "string" ? router.query.state : "";
    if (!encoded) {
      return;
    }

    const decoded = decodeSnapshot(encoded);
    if (decoded) {
      hydrate(decoded);
    }
  }, [hydrate, router.isReady, router.query.state]);

  const architectureNotes = useMemo(
    () => [
      "Single tactical state lives in Zustand, so drag, draw, save and analysis stay in sync.",
      "Pitch rendering is componentized into players and overlays, keeping the board extensible.",
      "Simulation is isolated in a utility layer for future richer rule sets."
    ],
    []
  );

  const handleShare = async () => {
    const encoded = encodeSnapshot(shareState);
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
    setShareUrl(url);

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <Head>
        <title>Rasenschach</title>
        <meta
          name="description"
          content="Interactive football tactics board inspired by the idea of Rasenschach."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-6 rounded-[32px] border border-white/10 bg-black/20 p-6 shadow-glow">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.38em] text-white/45">Rasenschach</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Football positioning, rebuilt like a tactical strategy game.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
                  The reference site is extremely minimal, so this version keeps the dark focus and brand
                  restraint but turns the idea into a real tactical web app with saved scenes, sharing, presets
                  and a simple analysis engine.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-white/62 sm:grid-cols-3">
                {architectureNotes.map((item) => (
                  <div key={item} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-white/88">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.72fr]">
            <div className="space-y-6">
              <Pitch />
              <AnalysisPanel />
            </div>
            <Controls shareUrl={shareUrl} onShare={handleShare} />
          </div>
        </div>
      </main>
    </>
  );
}
