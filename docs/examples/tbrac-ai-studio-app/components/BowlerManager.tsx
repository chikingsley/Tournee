import { Plus, Search, Trash2, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Bowler } from "../types";

type BowlerManagerProps = {
  bowlers: Bowler[];
  onAddBowler: (b: Bowler) => void;
  onDeleteBowler: (id: string) => void;
};

export const BowlerManager: React.FC<BowlerManagerProps> = ({
  bowlers,
  onAddBowler,
  onDeleteBowler,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newName, setNewName] = useState("");
  const [newAvg, setNewAvg] = useState("");

  const filtered = bowlers.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newName && newAvg)) {
      return;
    }

    onAddBowler({
      id: `b-${Date.now()}`,
      name: newName,
      average: Number.parseInt(newAvg, 10),
      handicap: Math.max(
        0,
        Math.floor((220 - Number.parseInt(newAvg, 10)) * 0.9)
      ), // Standard calc
    });
    setNewName("");
    setNewAvg("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-bold text-2xl text-slate-900">Bowler Database</h1>
        <p className="text-slate-500">Manage your global list of players.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Add Form */}
        <div className="md:col-span-1">
          <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-lg">
              <Plus className="text-indigo-600" size={20} /> Add Bowler
            </h3>
            <form className="space-y-4" onSubmit={handleAdd}>
              <div>
                <label
                  className="mb-1 block font-bold text-slate-500 text-xs uppercase"
                  htmlFor="bowler-name"
                >
                  Full Name
                </label>
                <input
                  className="w-full rounded border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  id="bowler-name"
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  required
                  type="text"
                  value={newName}
                />
              </div>
              <div>
                <label
                  className="mb-1 block font-bold text-slate-500 text-xs uppercase"
                  htmlFor="bowler-average"
                >
                  Average
                </label>
                <input
                  className="w-full rounded border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  id="bowler-average"
                  max="300"
                  min="0"
                  onChange={(e) => setNewAvg(e.target.value)}
                  placeholder="200"
                  required
                  type="number"
                  value={newAvg}
                />
              </div>
              <button
                className="w-full rounded bg-slate-900 py-2 font-medium text-white transition-colors hover:bg-slate-800"
                type="submit"
              >
                Add to Database
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4 md:col-span-2">
          <div className="relative">
            <Search
              className="absolute top-3 left-3 text-slate-400"
              size={20}
            />
            <input
              className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search database..."
              type="text"
              value={searchTerm}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No bowlers found.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-slate-200 border-b bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Avg</th>
                    <th className="p-4">Hcp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <tr
                      className="group transition-colors hover:bg-slate-50"
                      key={b.id}
                    >
                      <td className="flex items-center gap-3 p-4 font-medium">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                          <User size={14} />
                        </div>
                        {b.name}
                      </td>
                      <td className="p-4 text-slate-600">{b.average}</td>
                      <td className="p-4 text-slate-400">{b.handicap}</td>
                      <td className="p-4 text-right">
                        <button
                          className="text-slate-300 transition-colors hover:text-red-500"
                          onClick={() => onDeleteBowler(b.id)}
                          type="button"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
