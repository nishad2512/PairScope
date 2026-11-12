import { GrainGradient } from "@paper-design/shaders-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

export function AuthSectionOne({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-main">
        <Brand />
        <div className="auth-content">{children}</div>
      </section>
      <aside className="auth-aside grain-panel">
        <GrainGradient speed={0} scale={1} softness={0.65} intensity={0.55}
          noise={0.22} shape="corners" colors={["#391c12", "#b55530", "#8b321e", "#1a100c"]}
          colorBack="#21130f" className="absolute inset-0" />
        <div className="auth-aside-content">
          <h2>Good code starts<br />with a conversation.</h2>
          <p>Bring pair programming and technical interviews into one workspace.</p>
          <div className="code-sample" aria-hidden="true">
            <div className="code-tab"><span />pair.ts</div>
            <pre><span>1</span> <b>const</b> session = {"{"}{"\n"}<span>2</span>   mode: <em>"pair programming"</em>,{"\n"}<span>3</span>   language: <em>"TypeScript"</em>,{"\n"}<span>4</span> {"}"};</pre>
          </div>
        </div>
      </aside>
    </main>
  );
}
