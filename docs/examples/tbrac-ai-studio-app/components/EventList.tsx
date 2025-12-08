import { Calendar, ChevronRight, MapPin, Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { suggestSidepots } from "../services/geminiService";
import { type Event, EventStatus } from "../types";

type EventListProps = {
  events: Event[];
  onAddEvent: (e: Event) => void;
};

export const EventList: React.FC<EventListProps> = ({ events, onAddEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    entryFee: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      name: formData.name,
      date: formData.date,
      location: formData.location,
      entryFee: formData.entryFee,
      status: EventStatus.UPCOMING,
      prizeFund: 0,
      registeredBowlerIds: [],
      checkedInBowlerIds: [],
      brackets: [],
    };
    onAddEvent(newEvent);
    setIsModalOpen(false);
    setFormData({ name: "", date: "", location: "", entryFee: 50 });
  };

  const getAiIdeas = async () => {
    setLoadingAi(true);
    const suggestions = await suggestSidepots(formData.entryFee);
    setAiSuggestions(suggestions);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl text-slate-900">Events</h1>
        <button
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-indigo-700"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <Plus size={20} />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
            key={event.id}
            to={`/events/${event.id}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`rounded-full px-3 py-1 font-bold text-xs ${
                  event.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : event.status === "COMPLETED"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {event.status}
              </div>
              <ChevronRight
                className="text-slate-300 transition-colors group-hover:text-indigo-500"
                size={20}
              />
            </div>

            <h3 className="mb-1 font-bold text-lg text-slate-900 transition-colors group-hover:text-indigo-600">
              {event.name}
            </h3>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-slate-500 text-sm">
                <Calendar className="mr-2" size={16} />
                {event.date}
              </div>
              <div className="flex items-center text-slate-500 text-sm">
                <MapPin className="mr-2" size={16} />
                {event.location}
              </div>
            </div>

            <div className="mt-6 flex justify-between border-slate-100 border-t pt-4 text-sm">
              <span className="text-slate-500">
                {event.registeredBowlerIds.length} Bowlers
              </span>
              <span className="font-semibold text-green-600">
                ${event.entryFee} Entry
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="fade-in zoom-in w-full max-w-md animate-in overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
            <div className="flex items-center justify-between border-slate-100 border-b bg-slate-50 p-4">
              <h2 className="font-bold text-lg text-slate-800">
                Create New Event
              </h2>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4 p-6" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-1 block font-medium text-slate-700 text-sm"
                  htmlFor="eventName"
                >
                  Event Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  id="eventName"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Sunday Scratch Sweeper"
                  required
                  type="text"
                  value={formData.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block font-medium text-slate-700 text-sm"
                    htmlFor="eventDate"
                  >
                    Date
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    id="eventDate"
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    type="date"
                    value={formData.date}
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block font-medium text-slate-700 text-sm"
                    htmlFor="entryFee"
                  >
                    Entry Fee ($)
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    id="entryFee"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entryFee: Number.parseInt(e.target.value, 10),
                      })
                    }
                    required
                    type="number"
                    value={formData.entryFee}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1 block font-medium text-slate-700 text-sm"
                  htmlFor="location"
                >
                  Location
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  id="location"
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Bowling Center Name"
                  required
                  type="text"
                  value={formData.location}
                />
              </div>

              {/* Gemini Integration Micro-feature */}
              <div className="rounded-lg bg-indigo-50 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-indigo-800">
                    Need Sidepot Ideas?
                  </span>
                  <button
                    className="rounded bg-white px-2 py-1 text-indigo-600 text-xs shadow-sm"
                    disabled={loadingAi}
                    onClick={getAiIdeas}
                    type="button"
                  >
                    {loadingAi ? "Thinking..." : "Ask AI"}
                  </button>
                </div>
                {aiSuggestions.length > 0 && (
                  <ul className="list-inside list-disc space-y-1 text-indigo-700">
                    {aiSuggestions.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4">
                <button
                  className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
                  type="submit"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
