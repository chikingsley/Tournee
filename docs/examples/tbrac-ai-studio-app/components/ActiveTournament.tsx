import {
  ArrowLeft,
  DollarSign,
  GitBranch,
  Play,
  Plus,
  Save,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateTournamentRecap } from "../services/geminiService";
import type { Bowler, Bracket, Event, Match } from "../types";

type ActiveTournamentProps = {
  events: Event[];
  bowlers: Bowler[];
  updateEvent: (updatedEvent: Event) => void;
};

export const ActiveTournament: React.FC<ActiveTournamentProps> = ({
  events,
  bowlers,
  updateEvent,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "checkin" | "bracket" | "scoring" | "payouts"
  >("overview");
  const [geminiRecap, setGeminiRecap] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Find current event
  const event = events.find((e) => e.id === id);

  if (!event) {
    return <div>Event not found</div>;
  }

  // --- Sub-Components/Logic for Tabs ---

  const handleGenerateRecap = async () => {
    setLoadingAi(true);
    const recap = await generateTournamentRecap(event, bowlers);
    setGeminiRecap(recap);
    setLoadingAi(false);
  };

  const OverviewTab = () => (
    <div className="animate-fadeIn space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-slate-500 text-sm">Entries</p>
              <h3 className="font-bold text-3xl text-slate-900">
                {event.checkedInBowlerIds.length}
              </h3>
              <p className="mt-1 text-slate-400 text-xs">
                / {event.registeredBowlerIds.length} Registered
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-slate-500 text-sm">Prize Fund</p>
              <h3 className="font-bold text-3xl text-green-600">
                ${event.prizeFund}
              </h3>
              <p className="mt-1 text-slate-400 text-xs">Projected Payout</p>
            </div>
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-slate-500 text-sm">Status</p>
              <h3 className="font-bold text-3xl text-indigo-900">
                {event.status}
              </h3>
              <p className="mt-1 text-slate-400 text-xs">{event.location}</p>
            </div>
            <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600">
              <Trophy size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-indigo-900 p-6 text-white">
        <div className="relative z-10">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-xl">
            <Sparkles className="text-yellow-400" size={20} />
            Tournament Assistant
          </h3>
          <p className="mb-4 max-w-2xl text-indigo-200">
            {geminiRecap ||
              "Need a quick summary or commentary for the PA system? Ask the assistant to analyze the current tournament state."}
          </p>
          <button
            className="rounded-lg bg-white px-4 py-2 font-semibold text-indigo-900 transition-colors hover:bg-indigo-50 disabled:opacity-50"
            disabled={loadingAi}
            onClick={handleGenerateRecap}
          >
            {loadingAi ? "Analyzing..." : "Generate AI Recap"}
          </button>
        </div>
        <div className="-translate-y-10 absolute top-0 right-0 translate-x-10 transform opacity-10">
          <Trophy size={200} />
        </div>
      </div>
    </div>
  );

  const CheckInTab = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const registeredBowlers = bowlers.filter((b) =>
      event.registeredBowlerIds.includes(b.id)
    );
    const filteredBowlers = registeredBowlers.filter((b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleCheckIn = (bowlerId: string) => {
      const isCheckedIn = event.checkedInBowlerIds.includes(bowlerId);
      const newCheckedIn = isCheckedIn
        ? event.checkedInBowlerIds.filter((id) => id !== bowlerId)
        : [...event.checkedInBowlerIds, bowlerId];

      const newPrizeFund = newCheckedIn.length * event.entryFee; // Simplified calculation

      updateEvent({
        ...event,
        checkedInBowlerIds: newCheckedIn,
        prizeFund: newPrizeFund,
      });
    };

    return (
      <div className="space-y-4">
        <div className="mb-4 flex gap-4">
          <input
            className="flex-1 rounded-lg border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bowler..."
            type="text"
            value={searchTerm}
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="border-slate-200 border-b bg-slate-50">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Name</th>
                <th className="p-4 font-semibold text-slate-600">Avg</th>
                <th className="p-4 text-right font-semibold text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBowlers.map((bowler) => {
                const isCheckedIn = event.checkedInBowlerIds.includes(
                  bowler.id
                );
                return (
                  <tr
                    className={isCheckedIn ? "bg-green-50/50" : ""}
                    key={bowler.id}
                  >
                    <td className="p-4 font-medium">{bowler.name}</td>
                    <td className="p-4 text-slate-500">{bowler.average}</td>
                    <td className="p-4 text-right">
                      <button
                        className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
                          isCheckedIn
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        onClick={() => toggleCheckIn(bowler.id)}
                      >
                        {isCheckedIn ? "Checked In" : "Check In"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredBowlers.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-500" colSpan={3}>
                    No bowlers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BracketTab = () => {
    // Determine if we can create a bracket
    const canCreate = event.checkedInBowlerIds.length >= 2;

    const createBracket = () => {
      if (!canCreate) {
        return;
      }

      const size = 8; // simplified fixed size for demo
      // Grab top 8 checked in bowlers or random 8
      const players = event.checkedInBowlerIds.slice(0, size);

      // Create Matches
      // Round 1 (4 matches)
      const matches: Match[] = [];
      for (let i = 0; i < size / 2; i++) {
        matches.push({
          id: `m-${Date.now()}-${i}`,
          round: 1,
          matchNumber: i + 1,
          player1Id: players[i * 2] || null,
          player2Id: players[i * 2 + 1] || null,
          score1: 0,
          score2: 0,
          winnerId: null,
        });
      }
      // Round 2 (2 matches)
      for (let i = 0; i < size / 4; i++) {
        matches.push({
          id: `m-${Date.now()}-r2-${i}`,
          round: 2,
          matchNumber: i + 1,
          player1Id: null,
          player2Id: null,
          score1: 0,
          score2: 0,
        });
      }
      // Round 3 (1 match)
      matches.push({
        id: `m-${Date.now()}-r3-1`,
        round: 3,
        matchNumber: 1,
        player1Id: null,
        player2Id: null,
        score1: 0,
        score2: 0,
      });

      const newBracket: Bracket = {
        id: `b-${Date.now()}`,
        eventId: event.id,
        name: "Main Scratch Event",
        size,
        matches,
        status: "IN_PROGRESS",
      };

      updateEvent({
        ...event,
        brackets: [...event.brackets, newBracket],
      });
    };

    if (event.brackets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-300 border-dashed bg-white py-20">
          <GitBranch className="mb-4 text-slate-300" size={48} />
          <h3 className="mb-2 font-medium text-lg text-slate-900">
            No Brackets Created
          </h3>
          <p className="mb-6 max-w-sm text-center text-slate-500">
            You need at least 2 checked-in bowlers to start a bracket. Current
            checked-in: {event.checkedInBowlerIds.length}
          </p>
          <button
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
            disabled={!canCreate}
            onClick={createBracket}
          >
            <Plus size={18} />
            Generate 8-Person Bracket
          </button>
        </div>
      );
    }

    const bracket = event.brackets[0]; // Just showing first bracket for demo

    // Helper to get bowler name
    const getName = (id?: string | null) => {
      if (!id) {
        return "TBD";
      }
      return bowlers.find((b) => b.id === id)?.name || "Unknown";
    };

    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[800px] items-center justify-around rounded-xl bg-slate-100 p-8">
          {/* Round 1 */}
          <div className="space-y-8">
            {bracket.matches
              .filter((m) => m.round === 1)
              .map((m) => (
                <div
                  className="w-48 overflow-hidden rounded border border-slate-300 bg-white shadow-sm"
                  key={m.id}
                >
                  <div className="flex justify-between border-slate-100 border-b bg-slate-50 p-2 font-bold text-slate-400 text-xs">
                    <span>Match {m.matchNumber}</span>
                  </div>
                  <div
                    className={`flex justify-between p-2 ${m.winnerId === m.player1Id && m.winnerId ? "bg-green-50 font-bold" : ""}`}
                  >
                    <span className="truncate">{getName(m.player1Id)}</span>
                    <span className="text-slate-500">{m.score1}</span>
                  </div>
                  <div
                    className={`flex justify-between border-slate-100 border-t p-2 ${m.winnerId === m.player2Id && m.winnerId ? "bg-green-50 font-bold" : ""}`}
                  >
                    <span className="truncate">{getName(m.player2Id)}</span>
                    <span className="text-slate-500">{m.score2}</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Connectors (Simulated with text/borders for simplicity in this demo) */}
          <div className="h-full border-slate-300 border-r-2 opacity-50" />

          {/* Round 2 */}
          <div className="space-y-24">
            {bracket.matches
              .filter((m) => m.round === 2)
              .map((m) => (
                <div
                  className="relative w-48 overflow-hidden rounded border border-slate-300 bg-white shadow-sm"
                  key={m.id}
                >
                  <div className="flex justify-between border-slate-100 border-b bg-slate-50 p-2 font-bold text-slate-400 text-xs">
                    <span>Semi {m.matchNumber}</span>
                  </div>
                  <div className="flex justify-between border-slate-100 border-b p-2">
                    <span className="truncate">{getName(m.player1Id)}</span>
                    <span className="text-slate-500">{m.score1}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="truncate">{getName(m.player2Id)}</span>
                    <span className="text-slate-500">{m.score2}</span>
                  </div>
                </div>
              ))}
          </div>

          <div className="h-full border-slate-300 border-r-2 opacity-50" />

          {/* Finals */}
          <div className="space-y-0">
            {bracket.matches
              .filter((m) => m.round === 3)
              .map((m) => (
                <div
                  className="w-56 scale-110 transform overflow-hidden rounded-lg border-2 border-indigo-500 bg-white shadow-md"
                  key={m.id}
                >
                  <div className="flex justify-between border-slate-100 border-b bg-indigo-50 p-2 font-bold text-indigo-800 text-xs">
                    <span className="mx-auto">CHAMPIONSHIP</span>
                  </div>
                  <div className="flex justify-between border-slate-100 border-b p-3">
                    <span className="truncate font-medium">
                      {getName(m.player1Id)}
                    </span>
                    <span className="font-mono text-slate-600">{m.score1}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="truncate font-medium">
                      {getName(m.player2Id)}
                    </span>
                    <span className="font-mono text-slate-600">{m.score2}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="mt-4 text-center text-slate-500 text-sm">
          Tip: Go to the "Scoring" tab to enter results.
        </div>
      </div>
    );
  };

  const ScoringTab = () => {
    // Flatten all matches from all brackets that are ready to be scored (have 2 players)
    // AND don't have a winner yet.
    if (!event.brackets.length) {
      return (
        <div className="p-8 text-center text-slate-500">
          Create a bracket first.
        </div>
      );
    }

    const bracket = event.brackets[0];
    const pendingMatches = bracket.matches.filter(
      (m) => m.player1Id && m.player2Id && !m.winnerId
    );
    const completedMatches = bracket.matches.filter((m) => !!m.winnerId);

    // State for local editing
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [tempScores, setTempScores] = useState({ s1: 0, s2: 0 });

    const startEdit = (m: Match) => {
      setEditingMatchId(m.id);
      setTempScores({ s1: m.score1 || 0, s2: m.score2 || 0 });
    };

    const saveScore = (m: Match) => {
      // Update the match logic
      const winnerId =
        tempScores.s1 > tempScores.s2 ? m.player1Id : m.player2Id;

      const updatedMatch = {
        ...m,
        score1: tempScores.s1,
        score2: tempScores.s2,
        winnerId,
      };

      const updatedMatches = bracket.matches.map((existing) =>
        existing.id === m.id ? updatedMatch : existing
      );

      // Logic to advance winner to next round
      // Find next match where this match feeds into
      // For simplified 8-person bracket:
      // R1 M1, M2 -> R2 M1
      // R1 M3, M4 -> R2 M2
      // R2 M1, M2 -> R3 M1

      let nextMatchIndex = -1;
      let slot = 0; // 1 or 2

      if (m.round === 1) {
        nextMatchIndex = bracket.matches.findIndex(
          (nm) =>
            nm.round === 2 && nm.matchNumber === Math.ceil(m.matchNumber / 2)
        );
        slot = m.matchNumber % 2 !== 0 ? 1 : 2;
      } else if (m.round === 2) {
        nextMatchIndex = bracket.matches.findIndex(
          (nm) => nm.round === 3 && nm.matchNumber === 1
        );
        slot = m.matchNumber % 2 !== 0 ? 1 : 2;
      }

      if (nextMatchIndex !== -1 && winnerId) {
        const nextMatch = updatedMatches[nextMatchIndex];
        if (slot === 1) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
      }

      const updatedBracket = { ...bracket, matches: updatedMatches };

      // Update Event
      const updatedBrackets = event.brackets.map((b) =>
        b.id === bracket.id ? updatedBracket : b
      );
      updateEvent({ ...event, brackets: updatedBrackets });

      setEditingMatchId(null);
    };

    const getName = (id?: string | null) =>
      bowlers.find((b) => b.id === id)?.name || "...";

    return (
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-slate-800">Pending Matches</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingMatches.map((m) => (
            <div
              className={`rounded-xl border bg-white p-4 shadow transition-all ${editingMatchId === m.id ? "border-indigo-500 ring-2 ring-indigo-500" : "border-slate-200"}`}
              key={m.id}
            >
              <div className="mb-2 flex justify-between font-bold text-slate-400 text-xs">
                <span>
                  Round {m.round} - Match {m.matchNumber}
                </span>
              </div>

              {editingMatchId === m.id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-24 truncate font-medium text-sm">
                      {getName(m.player1Id)}
                    </span>
                    <input
                      autoFocus
                      className="w-20 rounded border p-2 text-center font-bold font-mono text-lg"
                      onChange={(e) =>
                        setTempScores({
                          ...tempScores,
                          s1: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                      type="number"
                      value={tempScores.s1}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-24 truncate font-medium text-sm">
                      {getName(m.player2Id)}
                    </span>
                    <input
                      className="w-20 rounded border p-2 text-center font-bold font-mono text-lg"
                      onChange={(e) =>
                        setTempScores({
                          ...tempScores,
                          s2: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                      type="number"
                      value={tempScores.s2}
                    />
                  </div>
                  <button
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 font-medium text-white"
                    onClick={() => saveScore(m)}
                  >
                    <Save size={16} /> Submit Score
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer space-y-3"
                  onClick={() => startEdit(m)}
                >
                  <div className="flex items-center justify-between rounded bg-slate-50 p-2 hover:bg-slate-100">
                    <span className="font-medium">{getName(m.player1Id)}</span>
                    <span className="text-slate-400">--</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-50 p-2 hover:bg-slate-100">
                    <span className="font-medium">{getName(m.player2Id)}</span>
                    <span className="text-slate-400">--</span>
                  </div>
                  <div className="pt-1 text-center font-medium text-indigo-600 text-xs">
                    Tap to Score
                  </div>
                </div>
              )}
            </div>
          ))}
          {pendingMatches.length === 0 && (
            <div className="col-span-3 text-slate-500 italic">
              No matches pending. Check Bracket view for next rounds or
              completion.
            </div>
          )}
        </div>

        {completedMatches.length > 0 && (
          <>
            <h3 className="mt-8 font-bold text-lg text-slate-800">
              Completed Matches
            </h3>
            <div className="grid grid-cols-1 gap-4 opacity-75 md:grid-cols-4">
              {completedMatches.map((m) => (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                  key={m.id}
                >
                  <div className="flex justify-between font-medium">
                    <span
                      className={
                        m.winnerId === m.player1Id ? "text-green-700" : ""
                      }
                    >
                      {getName(m.player1Id)}
                    </span>
                    <span>{m.score1}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span
                      className={
                        m.winnerId === m.player2Id ? "text-green-700" : ""
                      }
                    >
                      {getName(m.player2Id)}
                    </span>
                    <span>{m.score2}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-100px)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          className="rounded-full p-2 transition-colors hover:bg-slate-200"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="text-slate-600" size={20} />
        </button>
        <div>
          <h1 className="font-bold text-2xl text-slate-900">{event.name}</h1>
          <p className="flex items-center gap-2 text-slate-500 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${event.status === "ACTIVE" ? "bg-green-500" : "bg-slate-400"}`}
            />
            {event.date} • {event.location}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="hidden items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-700 md:flex">
            <Play size={16} /> Live View
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex overflow-x-auto border-slate-200 border-b">
        <button
          className={`whitespace-nowrap border-b-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`whitespace-nowrap border-b-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === "checkin" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("checkin")}
        >
          Check-In ({event.checkedInBowlerIds.length})
        </button>
        <button
          className={`whitespace-nowrap border-b-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === "bracket" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("bracket")}
        >
          Brackets
        </button>
        <button
          className={`whitespace-nowrap border-b-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === "scoring" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          onClick={() => setActiveTab("scoring")}
        >
          Match Scoring
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "checkin" && <CheckInTab />}
        {activeTab === "bracket" && <BracketTab />}
        {activeTab === "scoring" && <ScoringTab />}
      </div>
    </div>
  );
};
