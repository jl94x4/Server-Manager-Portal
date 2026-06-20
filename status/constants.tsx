
import { Service, ServiceType, Group } from './types';

// Dashboard starts empty per user request. 
// Nodes must be configured in the Admin Panel to appear.
export const INITIAL_SERVICES: Service[] = [];

export const INITIAL_GROUPS: Group[] = [
  { id: 'core', name: 'Core Infrastructure', order: 0 },
  { id: 'media', name: 'Media Stack', order: 1 },
  { id: 'downloads', name: 'Download Clients', order: 2 },
  { id: 'external', name: 'External Services', order: 3 },
];

export const CATEGORIES = [
  'All',
  'Media',
  'Request Management',
  'Metadata Services',
  'Monitoring',
  'Speed Test'
];

export const SERVICE_PRESETS: Partial<Service>[] = [
  {
    name: 'Plex Media Server',
    url: 'http://localhost',
    port: '32400',
    type: ServiceType.LOCAL,
    category: 'Media',
    groupId: 'media',
    description: 'Primary media streaming engine'
  },
  {
    name: 'Overseerr',
    url: 'http://localhost',
    port: '5055',
    type: ServiceType.LOCAL,
    category: 'Request Management',
    groupId: 'media',
    description: 'Media discovery and request tool'
  },
  {
    name: 'The Movie Database (TMDB)',
    url: 'https://api.themoviedb.org',
    type: ServiceType.EXTERNAL,
    category: 'Metadata Services',
    groupId: 'external'
  },
  {
    name: 'Trakt.tv',
    url: 'https://trakt.tv',
    type: ServiceType.EXTERNAL,
    category: 'Metadata Services',
    groupId: 'external'
  },
  {
    name: 'TheTVDB',
    url: 'https://thetvdb.com',
    type: ServiceType.EXTERNAL,
    category: 'Metadata Services',
    groupId: 'external'
  }
];
