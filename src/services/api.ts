import apiService from './api.js';

/**
 * Typed API service for Discover feature
 */

// Type definitions
export interface Program {
  id: string;
  title: string;
  coverUrl?: string;
  priceCents: number;
  rating?: number;
  followers?: number;
  description?: string;
  duration?: string;
  weeks?: string;
  coach?: string;
  coachId?: string;
  phases?: Array<unknown>;
  thumbnail?: string;
  media?: {
    hero?: string;
  };
}

export interface Coach {
  id: string;
  name: string;
  avatarUrl?: string;
  followers?: number;
  specialty?: string;
  bio?: string;
  verified?: boolean;
  rating?: number;
}

export interface TrendingResponse {
  items: Program[];
}

export interface CoachesResponse {
  items: Coach[];
  nextPage?: number;
}

export interface ProgramsResponse {
  items: Program[];
  nextPage?: number;
}

/**
 * Get trending programs by region
 * @param region - Region code (e.g., 'US', 'EU', 'global')
 * @returns Promise with trending programs
 */
export async function apiTrending(region: string = 'global'): Promise<TrendingResponse> {
  try {
    const response = await apiService.makeRequest(`/api/trending?region=${encodeURIComponent(region)}&window=7d`);
    
    // Handle different response formats from backend
    const items = Array.isArray(response?.data) 
      ? response.data 
      : response?.items || response?.data?.items || [];
    
    // Normalize program data
    const normalizedItems: Program[] = items.map((item: any) => ({
      id: item._id || item.id,
      title: item.title || item.name,
      coverUrl: item.coverUrl || item.thumbnail || item.media?.hero,
      priceCents: item.priceCents || 0,
      rating: item.rating,
      followers: item.followers,
      description: item.description,
      duration: item.duration || item.estimatedDuration,
      coach: item.coach,
      coachId: item.coachId,
      phases: item.phases,
      thumbnail: item.thumbnail,
      media: item.media,
    }));

    return { items: normalizedItems };
  } catch (error) {
    console.error('apiTrending error:', error);
    throw error;
  }
}

/**
 * Get coaches with pagination
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Promise with coaches list
 */
export async function apiCoaches(page: number = 1, limit: number = 20): Promise<CoachesResponse> {
  try {
    const response = await apiService.makeRequest(`/api/coaches?page=${page}&limit=${limit}`);
    
    // Handle different response formats
    const items = response?.items || response?.data?.items || response?.data || [];
    const nextPage = response?.nextPage || response?.data?.nextPage;
    
    // Normalize coach data
    const normalizedItems: Coach[] = items.map((item: any) => ({
      id: item._id || item.id,
      name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Coach',
      avatarUrl: item.avatarUrl || item.avatar || item.profilePicture?.url || item.user?.profilePicture,
      followers: item.followers || item.followerCount,
      specialty: Array.isArray(item.specialties) 
        ? item.specialties.slice(0, 2).join(' • ')
        : item.specialty,
      bio: item.bio || item.description,
      verified: item.verified || false,
      rating: item.rating,
    }));

    return { 
      items: normalizedItems,
      nextPage: items.length >= limit ? nextPage || page + 1 : undefined 
    };
  } catch (error) {
    console.error('apiCoaches error:', error);
    throw error;
  }
}

/**
 * Get programs with pagination
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Promise with programs list
 */
export async function apiPrograms(page: number = 1, limit: number = 20): Promise<ProgramsResponse> {
  try {
    const response = await apiService.makeRequest(`/api/programs?page=${page}&limit=${limit}`);
    
    // Handle different response formats
    const items = response?.items || response?.data?.items || response?.data || [];
    const nextPage = response?.nextPage || response?.data?.nextPage;
    
    // Normalize program data
    const normalizedItems: Program[] = items.map((item: any) => ({
      id: item._id || item.id,
      title: item.title || item.name,
      coverUrl: item.coverUrl || item.thumbnail || item.media?.hero,
      priceCents: item.priceCents || 0,
      rating: item.rating,
      followers: item.followers || item.studentCount,
      description: item.description,
      duration: item.duration || item.estimatedDuration,
      weeks: item.weeks,
      coach: item.coach,
      coachId: item.coachId,
      phases: item.phases,
      thumbnail: item.thumbnail,
      media: item.media,
    }));

    return { 
      items: normalizedItems,
      nextPage: items.length >= limit ? nextPage || page + 1 : undefined 
    };
  } catch (error) {
    console.error('apiPrograms error:', error);
    throw error;
  }
}

// Re-export the original api service for convenience
export { apiService as api };
export default apiService;

