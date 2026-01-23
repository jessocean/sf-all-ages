"use client";

import { useState, useEffect } from "react";
import { VenueCard } from "@/components/VenueCard";
import { EventCard } from "@/components/EventCard";
import { FilterBar, Filters, defaultFilters } from "@/components/FilterBar";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Venue, Event } from "@/lib/schema";
import { calculateDistance } from "@/lib/distance";

interface VenueWithDistance extends Venue {
  distance?: number;
}

interface EventWithDistance extends Event {
  distance?: number;
  venueName?: string;
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [venues, setVenues] = useState<VenueWithDistance[]>([]);
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "venues" | "events">("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [venuesRes, eventsRes] = await Promise.all([
          fetch("/api/venues"),
          fetch("/api/events"),
        ]);

        if (venuesRes.ok) {
          const venuesData = await venuesRes.json();
          setVenues(venuesData);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Apply filters and sorting
  const filteredVenues = venues
    .map((venue) => ({
      ...venue,
      distance: filters.location
        ? calculateDistance(
            filters.location.lat,
            filters.location.lng,
            venue.latitude || 0,
            venue.longitude || 0
          )
        : undefined,
    }))
    .filter((venue) => {
      // Filter by venue type
      if (filters.venueTypes.length > 0 && !filters.venueTypes.includes(venue.venueType || "")) {
        return false;
      }

      // Filter by age group
      const { toddlers, youngKids, teens } = filters.ageGroups;
      if (toddlers && !venue.toddlerFriendly) return false;
      if (youngKids && !venue.youngKidFriendly) return false;
      if (teens && !venue.teenFriendly) return false;

      return true;
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  const filteredEvents = events
    .map((event) => {
      const venue = venues.find((v) => v.id === event.venueId);
      return {
        ...event,
        venueName: venue?.name,
        distance:
          filters.location && venue?.latitude && venue?.longitude
            ? calculateDistance(
                filters.location.lat,
                filters.location.lng,
                venue.latitude,
                venue.longitude
              )
            : undefined,
      };
    })
    .filter((event) => {
      // Filter by event type
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType || "")) {
        return false;
      }

      // Filter by age group
      const { toddlers, youngKids, teens } = filters.ageGroups;
      if (toddlers && !event.toddlerFriendly) return false;
      if (youngKids && !event.youngKidFriendly) return false;
      if (teens && !event.teenFriendly) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by date first, then distance
      const dateCompare = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (dateCompare !== 0) return dateCompare;

      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Find places & events where everyone is welcome
          </h1>
          <p className="mt-2 text-gray-600">
            Kid-friendly spots in San Francisco that aren&apos;t just for kids.
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        mode={activeTab}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("venues")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "venues"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Places ({filteredVenues.length})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "events"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Events ({filteredEvents.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main listings */}
            <div className="lg:col-span-2 space-y-4">
              {/* Venues */}
              {(activeTab === "all" || activeTab === "venues") && (
                <>
                  {activeTab === "all" && filteredVenues.length > 0 && (
                    <h2 className="text-lg font-medium text-gray-900 mt-4 first:mt-0">
                      Places
                    </h2>
                  )}
                  {filteredVenues.length === 0 && activeTab === "venues" ? (
                    <p className="text-gray-500 py-8 text-center">
                      No places match your filters. Try adjusting them.
                    </p>
                  ) : (
                    filteredVenues.slice(0, activeTab === "all" ? 4 : undefined).map((venue) => (
                      <VenueCard
                        key={venue.id}
                        venue={venue}
                        distance={venue.distance}
                      />
                    ))
                  )}
                  {activeTab === "all" && filteredVenues.length > 4 && (
                    <button
                      onClick={() => setActiveTab("venues")}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      See all {filteredVenues.length} places →
                    </button>
                  )}
                </>
              )}

              {/* Events */}
              {(activeTab === "all" || activeTab === "events") && (
                <>
                  {activeTab === "all" && filteredEvents.length > 0 && (
                    <h2 className="text-lg font-medium text-gray-900 mt-6">
                      Upcoming Events
                    </h2>
                  )}
                  {filteredEvents.length === 0 && activeTab === "events" ? (
                    <p className="text-gray-500 py-8 text-center">
                      No events match your filters. Try adjusting them.
                    </p>
                  ) : (
                    filteredEvents.slice(0, activeTab === "all" ? 4 : undefined).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        distance={event.distance}
                        venueName={event.venueName}
                      />
                    ))
                  )}
                  {activeTab === "all" && filteredEvents.length > 4 && (
                    <button
                      onClick={() => setActiveTab("events")}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      See all {filteredEvents.length} events →
                    </button>
                  )}
                </>
              )}

              {filteredVenues.length === 0 && filteredEvents.length === 0 && activeTab === "all" && (
                <p className="text-gray-500 py-8 text-center">
                  No places or events found. Check back soon!
                </p>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subscribe */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Get updates in your inbox
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Subscribe to get new kid-friendly places and events delivered to you.
                </p>
                <SubscribeForm />
              </div>

              {/* About */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  What is this?
                </h3>
                <p className="text-sm text-gray-600">
                  SF All-Ages Social Club helps parents find places and events where
                  they can socialize with their kids—without it being all about the kids.
                  Think breweries with play areas, concerts in parks, and community events
                  that welcome everyone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
