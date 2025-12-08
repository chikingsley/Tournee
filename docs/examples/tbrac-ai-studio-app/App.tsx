import { useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ActiveTournament } from "./components/ActiveTournament";
import { BowlerManager } from "./components/BowlerManager";
import { Dashboard } from "./components/Dashboard";
import { EventList } from "./components/EventList";
import { Layout } from "./components/Layout";
import { type Bowler, type Event, EventStatus } from "./types";

// Mock Initial Data
const INITIAL_BOWLERS: Bowler[] = [
  { id: "b1", name: "Jason Belmonte", average: 245, handicap: 0 },
  { id: "b2", name: "EJ Tackett", average: 240, handicap: 0 },
  { id: "b3", name: "Anthony Simonsen", average: 238, handicap: 1 },
  { id: "b4", name: "Kyle Troup", average: 235, handicap: 3 },
  { id: "b5", name: "Local Hero", average: 210, handicap: 18 },
  { id: "b6", name: "Sandbagger Sam", average: 180, handicap: 40 },
  { id: "b7", name: "Lefty Lewis", average: 220, handicap: 5 },
  { id: "b8", name: "Cranker Carl", average: 215, handicap: 9 },
];

const INITIAL_EVENTS: Event[] = [
  {
    id: "evt-1",
    name: "PBA Regional Qualifier",
    date: "2023-11-15",
    location: "Bowlero Kyrene",
    entryFee: 150,
    status: EventStatus.ACTIVE,
    prizeFund: 1200,
    registeredBowlerIds: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"],
    checkedInBowlerIds: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"],
    brackets: [], // Start empty to demonstrate creation flow
  },
  {
    id: "evt-2",
    name: "Sunday Fun Sweeper",
    date: "2023-11-20",
    location: "AMF Chandler",
    entryFee: 40,
    status: EventStatus.UPCOMING,
    prizeFund: 0,
    registeredBowlerIds: ["b5", "b6"],
    checkedInBowlerIds: [],
    brackets: [],
  },
];

function App() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [bowlers, setBowlers] = useState<Bowler[]>(INITIAL_BOWLERS);

  // -- Event Actions --
  const addEvent = (newEvent: Event) => {
    setEvents([newEvent, ...events]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
  };

  // -- Bowler Actions --
  const addBowler = (newBowler: Bowler) => {
    setBowlers([...bowlers, newBowler]);
  };

  const deleteBowler = (id: string) => {
    setBowlers(bowlers.filter((b) => b.id !== id));
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route
            element={<Dashboard bowlers={bowlers} events={events} />}
            path="/"
          />
          <Route
            element={<EventList events={events} onAddEvent={addEvent} />}
            path="/events"
          />
          <Route
            element={
              <ActiveTournament
                bowlers={bowlers}
                events={events}
                updateEvent={updateEvent}
              />
            }
            path="/events/:id"
          />
          <Route
            element={
              <BowlerManager
                bowlers={bowlers}
                onAddBowler={addBowler}
                onDeleteBowler={deleteBowler}
              />
            }
            path="/bowlers"
          />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
