import Link from "next/link";
import Reveal from "@/components/marketing/Reveal";
import StartForm from "@/components/marketing/StartForm";
import CheckInGlimpse from "@/components/marketing/CheckInGlimpse";

const PILLARS = [
  {
    n: "01",
    title: "Attendance in seconds",
    body: "Open a class or the day's resumption and put a rotating code on screen. Students check in from their phone by code or QR — no sheets to pass around, nothing to retype.",
  },
  {
    n: "02",
    title: "Coursework, draft to grade",
    body: "Set assignments per cohort and subject, publish when ready, and handle late-work extensions in the open. Students see exactly what's due and when.",
  },
  {
    n: "03",
    title: "People and permissions",
    body: "Invite facilitators and admins, bring students in with cohort codes, and give each admin only the permissions their job needs.",
  },
  {
    n: "04",
    title: "Records you can stand behind",
    body: "Manual overrides carry a reason. Account and role changes are logged. When someone asks what happened, there's an answer.",
  },
];

const STEPS = [
  { title: "Create your institution", body: "Name it and choose its address. You become its owner." },
  { title: "Invite your team", body: "Add facilitators and admins by email. Each joins with the right role." },
  { title: "Bring in your students", body: "Share a cohort invite code by email or text, and they're in." },
];

const PRINCIPLES = [
  { title: "Your institution, kept separate", body: "Every institution's people and records are isolated from every other's." },
  { title: "Nothing changes quietly", body: "Overrides need a reason; sensitive changes are written to an audit log." },
  { title: "Made for the phone in their pocket", body: "Check-in, coursework and settings work on any modern phone." },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_70%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rise-in">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-blue-600">Academic operations</p>
            <h1 className="mt-5 font-display text-[52px] leading-[1.02] tracking-[-0.01em] text-gray-900 sm:text-[68px] lg:text-[76px]">
              Every class,
              <br />
              <span className="italic text-blue-700">accounted for.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-gray-600">
              Cadence runs the daily rhythm of cohort-based programmes — check-in, class attendance,
              coursework, and the people behind them — in one calm, auditable place.
            </p>
            <div className="mt-10">
              <StartForm />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Already on Cadence?{" "}
              <Link href="/login" className="font-medium text-blue-600 underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </div>
          <div className="rise-in" style={{ animationDelay: "120ms" }}>
            <CheckInGlimpse />
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-[40px] leading-[1.1] text-gray-900 sm:text-[48px]">
              The work of running a programme, in its proper place.
            </h2>
            <p className="mt-4 text-[17px] text-gray-600">
              Four things every cohort needs done well, every day — without the spreadsheets.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.n} delay={i * 80} className="group bg-white p-8 transition-colors duration-300 hover:bg-blue-50/40 sm:p-10">
                <p className="font-display text-[28px] leading-none text-blue-600/70 transition-colors duration-300 group-hover:text-blue-600">{p.n}</p>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-gray-900">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-[40px] leading-[1.1] text-gray-900 sm:text-[48px]">Up and running in an afternoon.</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div className="absolute left-0 right-0 top-[19px] hidden h-px bg-gray-200 sm:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 100} className="relative">
                <span className="relative grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-900 shadow-sm">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-gray-900">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-[#0c1f4a] text-white">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-24">
          <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <Reveal className="relative max-w-2xl">
            <h2 className="font-display text-[40px] leading-[1.1] sm:text-[48px]">
              Built for institutions that take <span className="italic text-blue-300">their records</span> seriously.
            </h2>
          </Reveal>
          <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} className="border-t border-white/15 pt-6">
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-blue-100/70">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <Reveal>
            <h2 className="font-display text-[44px] leading-[1.05] text-gray-900 sm:text-[56px]">Give your programme its rhythm.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] text-gray-600">
              Create your institution, invite your team, and run your first check-in today.
            </p>
            <div className="mt-10">
              <StartForm align="center" />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
