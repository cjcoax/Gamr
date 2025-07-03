import memoize from "memoizee";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    id: number;
    url: string;
  };
  screenshots?: Array<{
    id: number;
    url: string;
  }>;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  platforms?: Array<{
    id: number;
    name: string;
  }>;
  involved_companies?: Array<{
    company: {
      name: string;
    };
    developer: boolean;
    publisher: boolean;
  }>;
  first_release_date?: number;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
}

interface IGDBSearchResult {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  rating?: number;
}

class IGDBService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Twitch access token: ${response.statusText}`);
    }

    const data: TwitchTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken;
  }

  private async makeIGDBRequest(endpoint: string, body: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  private formatImageUrl(url: string, size: string = 'cover_big'): string {
    if (!url) return '';
    return url.replace('t_thumb', `t_${size}`);
  }

  async searchGames(query: string, limit: number = 20): Promise<IGDBSearchResult[]> {
    const body = `
      search "${query}";
      fields name, cover.url, first_release_date, rating;
      where rating_count > 5 & category = 0;
      limit ${limit};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    return results.map(game => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? {
        url: this.formatImageUrl(game.cover.url)
      } : undefined,
      first_release_date: game.first_release_date,
      rating: game.rating,
    }));
  }

  async getGameDetails(igdbId: number): Promise<IGDBGame | null> {
    const body = `
      fields name, summary, cover.url, screenshots.url, genres.name, 
             platforms.name, involved_companies.company.name, 
             involved_companies.developer, involved_companies.publisher,
             first_release_date, rating, rating_count, 
             aggregated_rating, aggregated_rating_count;
      where id = ${igdbId};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    if (results.length === 0) {
      return null;
    }

    const game = results[0];
    
    // Format image URLs
    if (game.cover?.url) {
      game.cover.url = this.formatImageUrl(game.cover.url);
    }
    
    if (game.screenshots) {
      game.screenshots = game.screenshots.map(screenshot => ({
        ...screenshot,
        url: this.formatImageUrl(screenshot.url, 'screenshot_big'),
      }));
    }

    return game;
  }

  async getTrendingGames(limit: number = 20): Promise<IGDBSearchResult[]> {
    const body = `
      fields name, cover.url, first_release_date, rating, rating_count;
      where rating_count > 50 & rating > 70 & category = 0;
      sort rating_count desc;
      limit ${limit};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    return results.map(game => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? {
        url: this.formatImageUrl(game.cover.url)
      } : undefined,
      first_release_date: game.first_release_date,
      rating: game.rating,
    }));
  }

  async getNewReleases(limit: number = 20): Promise<IGDBSearchResult[]> {
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    const body = `
      fields name, cover.url, first_release_date, rating;
      where first_release_date > ${oneYearAgo} & rating_count > 10 & category = 0;
      sort first_release_date desc;
      limit ${limit};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    return results.map(game => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? {
        url: this.formatImageUrl(game.cover.url)
      } : undefined,
      first_release_date: game.first_release_date,
      rating: game.rating,
    }));
  }

  async getTopRatedGames(limit: number = 20): Promise<IGDBSearchResult[]> {
    const body = `
      fields name, cover.url, first_release_date, rating, rating_count;
      where rating > 80 & rating_count > 100 & category = 0;
      sort rating desc;
      limit ${limit};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    return results.map(game => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? {
        url: this.formatImageUrl(game.cover.url)
      } : undefined,
      first_release_date: game.first_release_date,
      rating: game.rating,
    }));
  }

  async getGamesByGenre(genreName: string, limit: number = 20): Promise<IGDBSearchResult[]> {
    const body = `
      fields name, cover.url, first_release_date, rating;
      where genres.name = "${genreName}" & rating_count > 10 & category = 0;
      sort rating desc;
      limit ${limit};
    `;

    const results: IGDBGame[] = await this.makeIGDBRequest('games', body);
    
    return results.map(game => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? {
        url: this.formatImageUrl(game.cover.url)
      } : undefined,
      first_release_date: game.first_release_date,
      rating: game.rating,
    }));
  }
}

// Memoize the service instance to avoid recreating it
export const igdbService = memoize(() => new IGDBService(), { maxAge: 1000 * 60 * 60 })();

export type { IGDBGame, IGDBSearchResult };