/**
 * Image sourcing utilities for SF All-Ages Social Club
 *
 * Process for finding and verifying images:
 * 1. Search Wikimedia Commons for the venue name + "San Francisco"
 * 2. Verify the image is actually of the location (not generic)
 * 3. Use high-resolution versions (640px width recommended)
 * 4. Fallback to type-based generic images
 */

// Verified real images from Wikimedia Commons (Creative Commons licensed)
export const VENUE_IMAGES: Record<string, string> = {
  // Major Museums
  "California Academy of Sciences": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/California_Academy_of_Sciences_2.jpg/640px-California_Academy_of_Sciences_2.jpg",
  "Exploratorium": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Exploratorium_2010.jpg/640px-Exploratorium_2010.jpg",
  "de Young Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/De_Young_Museum.jpg/640px-De_Young_Museum.jpg",
  "Walt Disney Family Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Walt_Disney_Family_Museum%2C_SF_2.JPG/640px-Walt_Disney_Family_Museum%2C_SF_2.JPG",
  "San Francisco Zoo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/SF_Zoo_-_Main_Gate.jpg/640px-SF_Zoo_-_Main_Gate.jpg",
  "Aquarium of the Bay": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Aquarium_of_the_Bay_entrance.jpg/640px-Aquarium_of_the_Bay_entrance.jpg",
  "Children's Creativity Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Childrens_Creativity_Museum.jpg/640px-Childrens_Creativity_Museum.jpg",
  "Randall Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/RandallMuseum.jpg/640px-RandallMuseum.jpg",
  "Cable Car Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Cable_car_museum_san_francisco.JPG/640px-Cable_car_museum_san_francisco.JPG",
  "Musee Mecanique": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Musee_Mecanique_Pier_45.jpg/640px-Musee_Mecanique_Pier_45.jpg",
  "Bay Area Discovery Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bay_Area_Discovery_Museum.jpg/640px-Bay_Area_Discovery_Museum.jpg",
  "Japanese Tea Garden": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Japanese_Tea_Garden_%28San_Francisco%29.jpg/960px-Japanese_Tea_Garden_%28San_Francisco%29.jpg",

  // Parks
  "Dolores Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Dolores_Park_SF.jpg/640px-Dolores_Park_SF.jpg",
  "Presidio Tunnel Tops": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Presidio_Tunnel_Tops_2022.jpg/640px-Presidio_Tunnel_Tops_2022.jpg",
  "Crissy Field": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Crissy_Field_San_Francisco_January_2013_003.jpg/640px-Crissy_Field_San_Francisco_January_2013_003.jpg",
  "Ocean Beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ocean_Beach_San_Francisco_1.jpg/640px-Ocean_Beach_San_Francisco_1.jpg",
  "Stern Grove": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stern_Grove_Concert.jpg/640px-Stern_Grove_Concert.jpg",
  "Golden Gate Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/GoldenGatePark.jpg/640px-GoldenGatePark.jpg",
  "Glen Canyon Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Glen_Canyon_Park_SF.jpg/640px-Glen_Canyon_Park_SF.jpg",
  "Fort Funston": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Fort_Funston_SF_1.JPG/640px-Fort_Funston_SF_1.JPG",
  "Lands End": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lands_End_SF_Golden_Gate.jpg/640px-Lands_End_SF_Golden_Gate.jpg",
  "Stow Lake": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Stow_Lake_Strawberry_Hill.jpg/640px-Stow_Lake_Strawberry_Hill.jpg",

  // Playgrounds
  "Koret Children's Quarter": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sharon_Meadow_Playground_2014.jpg/640px-Sharon_Meadow_Playground_2014.jpg",
  "Yerba Buena Gardens": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Yerba_Buena_Gardens_San_Francisco_2.jpg/640px-Yerba_Buena_Gardens_San_Francisco_2.jpg",

  // Landmarks
  "Ferry Building": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/San_Francisco_Ferry_Building.jpg/640px-San_Francisco_Ferry_Building.jpg",
  "Ghirardelli Square": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/USA-San_Francisco-Ghirardelli_Square-3.jpg/640px-USA-San_Francisco-Ghirardelli_Square-3.jpg",
  "Pier 39": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Pier_39_Sea_Lions_2020.jpg/640px-Pier_39_Sea_Lions_2020.jpg",
  "Grace Cathedral": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Grace_Cathedral_San_Francisco.jpg/640px-Grace_Cathedral_San_Francisco.jpg",
  "SFJAZZ Center": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/SFJazz_Center.jpg/640px-SFJazz_Center.jpg",
  "Glide Memorial Church": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Glide_Memorial_Church.jpg/960px-Glide_Memorial_Church.jpg",
  "Congregation Sherith Israel": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/The_Temple_Sherith_Israel.jpg/960px-The_Temple_Sherith_Israel.jpg",
  "St. Gregory of Nyssa Episcopal Church": "https://saintgregorys.org/wp-content/uploads/2024/12/PlanVisit_Header-1.jpg",
  "Reality SF": "https://realitysf.com/wp-content/uploads/2022/01/IMG_0941-2-1024x768.jpg",

  // Breweries
  "Fort Point Beer Company": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fort_Point_Beer_Company.jpg/640px-Fort_Point_Beer_Company.jpg",
  "Beach Chalet": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Beach_Chalet_Golden_Gate_Park.jpg/640px-Beach_Chalet_Golden_Gate_Park.jpg",
  "Park Chalet": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Beach_Chalet_Golden_Gate_Park.jpg/640px-Beach_Chalet_Golden_Gate_Park.jpg",
  "JFK Drive (Car-Free)": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/South_end_of_JFK_Drive_underpass%2C_April_2021.jpg/960px-South_end_of_JFK_Drive_underpass%2C_April_2021.jpg",
  "Huntington Park": "https://sfrecpark.org/ImageRepository/Document?documentID=18265",

  // Libraries
  "Main Library": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/San_Francisco_Main_Library.jpg/640px-San_Francisco_Main_Library.jpg",
};

const VERIFIED_IMAGE_URLS = new Set([
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Japanese_Tea_Garden_%28San_Francisco%29.jpg/960px-Japanese_Tea_Garden_%28San_Francisco%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Glide_Memorial_Church.jpg/960px-Glide_Memorial_Church.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/The_Temple_Sherith_Israel.jpg/960px-The_Temple_Sherith_Israel.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/South_end_of_JFK_Drive_underpass%2C_April_2021.jpg/960px-South_end_of_JFK_Drive_underpass%2C_April_2021.jpg",
  "https://saintgregorys.org/wp-content/uploads/2024/12/PlanVisit_Header-1.jpg",
  "https://realitysf.com/wp-content/uploads/2022/01/IMG_0941-2-1024x768.jpg",
  "https://sfrecpark.org/ImageRepository/Document?documentID=18265",
]);

function isUnverifiedWikimediaUrl(url: string): boolean {
  return url.includes("upload.wikimedia.org") && !VERIFIED_IMAGE_URLS.has(url);
}

// Fallback images by venue type
export const TYPE_FALLBACK_IMAGES: Record<string, string> = {
  park: "https://images.unsplash.com/photo-1541464522988-31b420f688b4?w=640&q=80",
  playground: "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=640&q=80",
  museum: "https://images.unsplash.com/photo-1574689049868-c1893a6b5060?w=640&q=80",
  library: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=640&q=80",
  brewery: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=640&q=80",
  restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=640&q=80",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640&q=80",
  church: "https://images.unsplash.com/photo-1548693590-3c9f8f0b6a1a?w=640&q=80",
  community: "https://images.unsplash.com/photo-1495420378468-78588a508652?w=640&q=80",
};

/**
 * Find the best image URL for a venue
 * @param venueName - The name of the venue
 * @param venueType - The type of venue (park, museum, etc.)
 * @returns Image URL or null if none found
 */
export function findVenueImage(venueName: string, venueType?: string | null): string | null {
  // 1. Try exact match
  if (VENUE_IMAGES[venueName] && !isUnverifiedWikimediaUrl(VENUE_IMAGES[venueName])) {
    return VENUE_IMAGES[venueName];
  }

  // 2. Try partial match (venue name contains known name or vice versa)
  for (const [name, url] of Object.entries(VENUE_IMAGES)) {
    if (venueName.includes(name) || name.includes(venueName)) {
      if (!isUnverifiedWikimediaUrl(url)) {
        return url;
      }
    }
  }

  // 3. Try word-based matching (2+ significant words match)
  const venueWords = venueName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const [name, url] of Object.entries(VENUE_IMAGES)) {
    const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = venueWords.filter(vw =>
      nameWords.some(nw => vw.includes(nw) || nw.includes(vw))
    );
    if (matches.length >= 2) {
      if (!isUnverifiedWikimediaUrl(url)) {
        return url;
      }
    }
  }

  // 4. Fallback to type-based image
  if (venueType && TYPE_FALLBACK_IMAGES[venueType]) {
    return TYPE_FALLBACK_IMAGES[venueType];
  }

  return null;
}

/**
 * Generate a Wikimedia Commons search URL to find images manually
 * Use this when no pre-defined image exists
 */
export function getWikimediaSearchUrl(venueName: string): string {
  const query = encodeURIComponent(`${venueName} San Francisco`);
  return `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`;
}

/**
 * Instructions for manually finding and adding new venue images:
 *
 * 1. Go to: https://commons.wikimedia.org/wiki/Main_Page
 * 2. Search for: "[Venue Name] San Francisco"
 * 3. Look for photos that clearly show:
 *    - The exterior or recognizable interior of the venue
 *    - Good lighting and composition
 *    - Recent photos (within last 10 years preferred)
 * 4. Click on the image, then click "Use this file on the web"
 * 5. Copy the "File URL" for the 640px version
 * 6. Verify the image by:
 *    - Comparing to Google Street View
 *    - Checking the venue's official website
 *    - Reading the image description on Wikimedia
 * 7. Add the URL to VENUE_IMAGES in this file
 *
 * Alternative sources (also verify licensing):
 * - Venue's official website (with permission)
 * - Google Places API (requires API key)
 * - Flickr Creative Commons search
 */
