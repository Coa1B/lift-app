import { useState } from "react";
import { useLocalUser } from "../hooks/useLocalUser";

export default function OnboardingName() {
  const { setName } = useLocalUser();
  const [draft, setDraft] = useState("");

  const trimmed = draft.trim();
  const canContinue = trimmed.length > 0;

  const submit = (e) => {
    e?.preventDefault?.();
    if (!canContinue) return;
    setName(trimmed);
  };

  return (
    <div className="flex flex-col h-full px-5 pt-safe-lg pb-safe">
      <div className="pt-8 mb-auto">
        <div className="text-2xl font-medium text-ink tracking-tight mb-8">lift.</div>
        <h1 className="text-[34px] leading-none font-medium text-ink tracking-tight mb-3">
          What’s your name?
        </h1>
        <p className="text-sm text-ink-2 leading-relaxed mb-8">
          We’ll use this to greet you on the home screen.
        </p>

        <form onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={40}
            className="w-full bg-bg-2 border border-line rounded-xl px-4 py-3.5 text-[17px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </form>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={submit}
        className="w-full mb-4 bg-accent text-bg rounded-2xl py-3.5 text-[15px] font-medium disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
