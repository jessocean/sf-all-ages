"use client";

import { useState } from "react";

type VenueForm = {
  name: string;
  address: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  venueType: string;
  hoursJson: string;
  hasPlayArea: boolean;
  hasOutdoorSpace: boolean;
  isEnclosed: boolean;
  hasHighChairs: boolean;
  hasChangingTable: boolean;
  strollerAccessible: boolean;
  loudOk: boolean;
  toddlerFriendly: boolean;
  youngKidFriendly: boolean;
  teenFriendly: boolean;
  description: string;
  websiteUrl: string;
};

type EventForm = {
  name: string;
  description: string;
  venueId: string;
  address: string;
  eventType: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrenceRule: string;
  hasKidsActivities: boolean;
  outdoor: boolean;
  toddlerFriendly: boolean;
  youngKidFriendly: boolean;
  teenFriendly: boolean;
  sourceUrl: string;
  sourcePlatform: string;
};

const defaultVenue: VenueForm = {
  name: "",
  address: "",
  neighborhood: "",
  latitude: "",
  longitude: "",
  venueType: "cafe",
  hoursJson: '{"mon":"9:00-17:00","tue":"9:00-17:00","wed":"9:00-17:00","thu":"9:00-17:00","fri":"9:00-17:00","sat":"10:00-18:00","sun":"10:00-18:00"}',
  hasPlayArea: false,
  hasOutdoorSpace: false,
  isEnclosed: false,
  hasHighChairs: false,
  hasChangingTable: false,
  strollerAccessible: true,
  loudOk: false,
  toddlerFriendly: false,
  youngKidFriendly: false,
  teenFriendly: false,
  description: "",
  websiteUrl: "",
};

const defaultEvent: EventForm = {
  name: "",
  description: "",
  venueId: "",
  address: "",
  eventType: "community",
  startTime: "",
  endTime: "",
  isRecurring: false,
  recurrenceRule: "",
  hasKidsActivities: false,
  outdoor: false,
  toddlerFriendly: false,
  youngKidFriendly: false,
  teenFriendly: false,
  sourceUrl: "",
  sourcePlatform: "manual",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"venue" | "event">("venue");
  const [venueForm, setVenueForm] = useState<VenueForm>(defaultVenue);
  const [eventForm, setEventForm] = useState<EventForm>(defaultEvent);
  const [status, setStatus] = useState<string>("");

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

    try {
      const response = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...venueForm,
          latitude: venueForm.latitude ? parseFloat(venueForm.latitude) : null,
          longitude: venueForm.longitude ? parseFloat(venueForm.longitude) : null,
        }),
      });

      if (response.ok) {
        setStatus("Venue added successfully!");
        setVenueForm(defaultVenue);
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Error submitting venue");
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      });

      if (response.ok) {
        setStatus("Event added successfully!");
        setEventForm(defaultEvent);
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Error submitting event");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin: Add Data</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("venue")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "venue" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
        >
          Add Venue
        </button>
        <button
          onClick={() => setActiveTab("event")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "event" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
        >
          Add Event
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-lg mb-6 ${status.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {status}
        </div>
      )}

      {/* Venue Form */}
      {activeTab === "venue" && (
        <form onSubmit={handleVenueSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={venueForm.name}
                onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={venueForm.venueType}
                onChange={(e) => setVenueForm({ ...venueForm, venueType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="cafe">Cafe</option>
                <option value="brewery">Brewery</option>
                <option value="restaurant">Restaurant</option>
                <option value="park">Park</option>
                <option value="museum">Museum</option>
                <option value="church">Church/Religious</option>
                <option value="community">Community Center</option>
                <option value="library">Library</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={venueForm.address}
              onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
              <input
                type="text"
                value={venueForm.neighborhood}
                onChange={(e) => setVenueForm({ ...venueForm, neighborhood: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                value={venueForm.latitude}
                onChange={(e) => setVenueForm({ ...venueForm, latitude: e.target.value })}
                placeholder="37.7749"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                value={venueForm.longitude}
                onChange={(e) => setVenueForm({ ...venueForm, longitude: e.target.value })}
                placeholder="-122.4194"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={venueForm.description}
              onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="url"
              value={venueForm.websiteUrl}
              onChange={(e) => setVenueForm({ ...venueForm, websiteUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours (JSON)</label>
            <textarea
              value={venueForm.hoursJson}
              onChange={(e) => setVenueForm({ ...venueForm, hoursJson: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "hasPlayArea", label: "Play area" },
                { key: "hasOutdoorSpace", label: "Outdoor space" },
                { key: "isEnclosed", label: "Enclosed outdoor" },
                { key: "hasHighChairs", label: "High chairs" },
                { key: "hasChangingTable", label: "Changing table" },
                { key: "strollerAccessible", label: "Stroller accessible" },
                { key: "loudOk", label: "Loud OK" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={venueForm[key as keyof VenueForm] as boolean}
                    onChange={(e) => setVenueForm({ ...venueForm, [key]: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups</label>
            <div className="flex gap-4">
              {[
                { key: "toddlerFriendly", label: "Toddlers (0-3)" },
                { key: "youngKidFriendly", label: "Young kids (4-8)" },
                { key: "teenFriendly", label: "Teens (9+)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={venueForm[key as keyof VenueForm] as boolean}
                    onChange={(e) => setVenueForm({ ...venueForm, [key]: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Add Venue
          </button>
        </form>
      )}

      {/* Event Form */}
      {activeTab === "event" && (
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="festival">Festival</option>
                <option value="market">Market</option>
                <option value="religious">Religious</option>
                <option value="art">Art</option>
                <option value="community">Community</option>
                <option value="food">Food</option>
                <option value="outdoor">Outdoor</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (if no venue)</label>
            <input
              type="text"
              value={eventForm.address}
              onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
            <input
              type="url"
              value={eventForm.sourceUrl}
              onChange={(e) => setEventForm({ ...eventForm, sourceUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={eventForm.hasKidsActivities}
                  onChange={(e) => setEventForm({ ...eventForm, hasKidsActivities: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Kids activities</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={eventForm.outdoor}
                  onChange={(e) => setEventForm({ ...eventForm, outdoor: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Outdoor</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups</label>
            <div className="flex gap-4">
              {[
                { key: "toddlerFriendly", label: "Toddlers (0-3)" },
                { key: "youngKidFriendly", label: "Young kids (4-8)" },
                { key: "teenFriendly", label: "Teens (9+)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={eventForm[key as keyof EventForm] as boolean}
                    onChange={(e) => setEventForm({ ...eventForm, [key]: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Add Event
          </button>
        </form>
      )}
    </div>
  );
}
