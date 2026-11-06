import { GrainGradient } from "@paper-design/shaders-react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthSectionOneProps = {
  children: ReactNode;
};

export function AuthSectionOne({ children }: AuthSectionOneProps) {
  return (
    <main className="min-h-screen bg-[#f6f5f2] p-3 text-stone-950 antialiased sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1600px] overflow-hidden rounded-[26px] border border-stone-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(54,41,26,0.28)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-10 xl:px-16">
          <div className="w-full max-w-[520px]">
            <Link
              to="/signup"
              className="mb-12 inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-stone-900"
              aria-label="PairScope home"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-stone-950 text-white">
                <Sparkles size={18} strokeWidth={1.8} />
              </span>
              PairScope
            </Link>
            {children}
            <p className="mt-12 text-xs text-stone-400">
              © {new Date().getFullYear()} PairScope. Built for better teamwork.
            </p>
          </div>
        </section>

        <aside className="grain-panel relative hidden min-h-[760px] overflow-hidden bg-[#17110e] p-10 text-white sm:p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <GrainGradient
            speed={0.45}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.65}
            intensity={0.55}
            noise={0.22}
            shape="corners"
            colors={["#391c12", "#f18442", "#da4f29", "#1a100c"]}
            colorBack="#17110e"
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/35" />

          <div className="relative z-10 flex items-center justify-between text-sm text-white/75">
            <span>PairScope for teams</span>
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-orange-300" />
              Work better, together
            </span>
          </div>

          <div className="relative z-10 max-w-[600px] py-12">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-orange-100/80">
              Great things happen in sync
            </p>
            <h2 className="text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-white xl:text-[72px]">
              Think together.
              <br />
              Build what&apos;s next.
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-white/70">
              Bring good people and ambitious ideas into the same room. The
              rest is momentum.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-5 text-sm text-white/70">
            <span>Make space for your best work.</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </div>
        </aside>
      </div>
    </main>
  );
}
