"use client";

import type { Party } from "@/lib/pricing";

interface PartyInputProps {
  party: Party;
  onChange: (party: Party) => void;
}

const PARTY_MEMBERS = [
  { key: "toddlers" as const, label: "Toddlers", sublabel: "0-3", emoji: "👶", max: 5 },
  { key: "kids" as const, label: "Kids", sublabel: "4-8", emoji: "👦", max: 5 },
  { key: "teens" as const, label: "Teens", sublabel: "9-17", emoji: "🧑", max: 5 },
  { key: "adults" as const, label: "Adults", sublabel: "18+", emoji: "👨", max: 5 },
];

export function PartyInput({ party, onChange }: PartyInputProps) {
  const updateCount = (key: keyof Party, delta: number) => {
    const member = PARTY_MEMBERS.find((m) => m.key === key);
    if (!member) return;

    const newValue = Math.max(0, Math.min(member.max, party[key] + delta));
    onChange({ ...party, [key]: newValue });
  };

  const setCount = (key: keyof Party, value: number) => {
    const member = PARTY_MEMBERS.find((m) => m.key === key);
    if (!member) return;

    const newValue = Math.max(0, Math.min(member.max, value));
    onChange({ ...party, [key]: newValue });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Who&apos;s coming?
      </label>
      <div className="flex flex-wrap gap-3">
        {PARTY_MEMBERS.map(({ key, label, sublabel, emoji, max }) => (
          <div
            key={key}
            className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
          >
            <span className="text-lg" aria-hidden="true">
              {emoji}
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-[10px] text-gray-400">{sublabel}</span>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => updateCount(key, -1)}
                disabled={party[key] === 0}
                className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
                aria-label={`Decrease ${label}`}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={max}
                value={party[key]}
                onChange={(e) => setCount(key, parseInt(e.target.value) || 0)}
                className="w-8 text-center text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                aria-label={`${label} count`}
              />
              <button
                type="button"
                onClick={() => updateCount(key, 1)}
                disabled={party[key] === max}
                className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
                aria-label={`Increase ${label}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
