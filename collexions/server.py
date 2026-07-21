import os
import sys
import subprocess
import json
import time
import re
import logging
import jwt
from functools import wraps
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import random
import threading
from flask import Flask, request, jsonify, send_from_directory, Response, abort
from flask_cors import CORS
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

# Configure logging for the API
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Patch plexapi BEFORE any PlexServer() so Docker hostname is never the device name.
try:
    from plex_identity import configure_plex_identity, plex_request_headers
    configure_plex_identity()
except ImportError as e:
    logging.error('plex_identity module missing (%s) — Collexions will start but Plex may see Docker hostname as a device', e)

    def configure_plex_identity(force=False):
        return ''

    def plex_request_headers(token='', extra=None):
        headers = {'Accept': 'application/json'}
        if token:
            headers['X-Plex-Token'] = str(token)
        if extra:
            headers.update(extra)
        return headers

app = Flask(__name__)
CORS(app)

# --- Configuration ---
SCRIPT_NAME = "ColleXions.py"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Portal embeds the worker and sets COLLEXIONS_DATA_DIR to persist under the portal config volume.
_DATA_ROOT = os.environ.get('COLLEXIONS_DATA_DIR', '').strip() or BASE_DIR
CONFIG_FILE = os.path.join(_DATA_ROOT, "config", "config.json")
HISTORY_FILE = os.path.join(_DATA_ROOT, "config", "history.json")
MANAGED_COLLECTIONS_FILE = os.path.join(_DATA_ROOT, "config", "managed_collections.json")
LOGS_DIR = os.path.join(_DATA_ROOT, "logs")
LOG_FILE = os.path.join(LOGS_DIR, "collexions.log")
DATA_DIR = os.path.join(_DATA_ROOT, "data")
STATUS_FILE = os.path.join(DATA_DIR, "status.json")
DIST_DIR = os.path.join(BASE_DIR, "dist")  # Built frontend (production only)

# Ensure config and logs directories exist
os.makedirs(os.path.join(_DATA_ROOT, "config"), exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
# Stores the subprocess object of the running script
process = None

# --- Security ---
SECRET_KEY = os.environ.get('COLLEXIONS_SECRET_KEY', 'dev-secret-key-replace-me-in-production')
SERVICE_KEY = os.environ.get('COLLEXIONS_SERVICE_KEY', '').strip()
TRUE_ENV_VALUES = {'1', 'true', 'yes', 'on'}
PORTAL_MODE = os.environ.get('COLLEXIONS_PORTAL_MODE', '').strip().lower() in TRUE_ENV_VALUES

def _service_key_ok():
    """Accept portal BFF service-key auth (no end-user Collexions password)."""
    if not SERVICE_KEY:
        return False
    header = (request.headers.get('X-Collexions-Service-Key') or '').strip()
    return bool(header) and header == SERVICE_KEY

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if _service_key_ok():
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except Exception as e:
            return jsonify({'error': 'Invalid or expired token'}), 401
            
        return f(*args, **kwargs)
    return decorated

# --- Cache System ---
# version bumped by list_collections (3=light, 4=full pin resolve)
GALLERY_CACHE = {
    'data': None,
    'timestamp': 0,
    'ttl': 300, # 5 minutes
    'version': 2,  # bump when thumb shape/fallback changes
}
PRESETS_CACHE = {
    'data': None,
    'timestamp': 0,
    'ttl': 21600 # 6 hours
}
IMAGE_CACHE = {} # Cache for proxied posters: { thumb_path: { 'data': binary, 'mimetype': type } }
SUMMARY_CACHE = {
    'data': None,
    'timestamp': 0,
    'ttl': 120,  # seconds — home widget pinned count
}
TMDB_POSTER_CACHE = {} # Cache for TMDB IDs to poster paths


# --- Helpers ---
def ensure_dir_exists(file_path):
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        logging.info(f"Created directory: {directory}")

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading config: {e}")
            return {}
    return {}

def save_config(new_data, merge=True):
    """
    Saves the configuration atomically.
    If merge is True, it merges new_data into the existing config.
    """
    try:
        config = load_config() if merge else {}
        if merge:
            config.update(new_data)
        else:
            config = new_data
            
        ensure_dir_exists(CONFIG_FILE)
        
        # Atomic write using a temporary file
        import tempfile
        import shutil
        
        fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(CONFIG_FILE) or ".", prefix="config_tmp_")
        try:
            with os.fdopen(fd, 'w') as f:
                json.dump(config, f, indent=4)
            # os.replace is atomic and works on Windows
            os.replace(temp_path, CONFIG_FILE)
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
            
        return True
    except Exception as e:
        logging.error(f"Failed to save config: {e}")
        return False

def env_flag_enabled(name):
    return os.environ.get(name, '').strip().lower() in TRUE_ENV_VALUES

def config_ready_for_background_process():
    """Avoid noisy autostart failures before onboarding has saved Plex details."""
    config = load_config()
    missing = [key for key in ('plex_url', 'plex_token') if not config.get(key)]
    if missing:
        logging.info(
            "Background service autostart skipped; missing config fields: %s",
            ", ".join(missing)
        )
        return False
    return True

def load_managed_collections():
    if os.path.exists(MANAGED_COLLECTIONS_FILE):
        try:
            with open(MANAGED_COLLECTIONS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_managed_collections(data):
    try:
        ensure_dir_exists(MANAGED_COLLECTIONS_FILE)
        with open(MANAGED_COLLECTIONS_FILE, 'w') as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        logging.error(f"Failed to save managed collections: {e}")

def fetch_source_items(source_type, source_id, config):
    """Fetches the latest items for a specific source."""
    tmdb_key = config.get('tmdb_api_key')
    trakt_id = config.get('trakt_client_id')
    headers = {'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': trakt_id}
    
    items = []
    try:
        if source_type == 'tmdb_trending_movie':
            # Trending weekly - User wants cap of 30
            for page in range(1, 3): # 2 pages = 40 items total, we slice at 30
                url = f"https://api.themoviedb.org/3/trending/movie/week?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    if not data: break
                    items.extend([{'title': m.get('title'), 'tmdb_id': m.get('id'), 'type': 'movie'} for m in data])
                else: break
            items = items[:30]
        elif source_type == 'tmdb_trending_tv':
            # Trending weekly - User wants cap of 30
            for page in range(1, 3): 
                url = f"https://api.themoviedb.org/3/trending/tv/week?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    if not data: break
                    items.extend([{'title': m.get('name'), 'tmdb_id': m.get('id'), 'type': 'show'} for m in data])
                else: break
            items = items[:30]
        elif source_type == 'tmdb_discover':
            # User wants cap of 500 for "others"
            try:
                params_dict = json.loads(source_id)
                media_type = params_dict.pop('type', 'movie')
                params_dict['api_key'] = tmdb_key
                url = f"https://api.themoviedb.org/3/discover/{media_type}"
                for page in range(1, 26): # 25 pages = 500 items
                    params_dict['page'] = page
                    resp = requests.get(url, params=params_dict, timeout=10)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = data.get('results', [])
                        if not results: break
                        for m in results:
                            items.append({
                                'title': m.get('title') or m.get('name'), 
                                'tmdb_id': m.get('id'), 
                                'type': 'movie' if media_type == 'movie' else 'show'
                            })
                        if page >= data.get('total_pages', 1): break
                    else: break
            except Exception as e:
                logging.error(f"Error parse/fetch tmdb_discover: {e}")
            items = items[:500]
        elif source_type == 'tmdb_tv_popular':
            # Popular - User wants 50
            for page in range(1, 4): 
                url = f"https://api.themoviedb.org/3/tv/popular?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    if not data: break
                    items.extend([{'title': m.get('name'), 'tmdb_id': m.get('id'), 'type': 'show'} for m in data])
                else: break
            items = items[:50]
        elif source_type == 'tmdb_movie_top' or source_type == 'tmdb_movie_top_rated':
            # Top Rated - User wants 100
            for page in range(1, 6): 
                url = f"https://api.themoviedb.org/3/movie/top_rated?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    if not data: break
                    items.extend([{'title': m.get('title'), 'tmdb_id': m.get('id'), 'type': 'movie'} for m in data])
                else: break
            items = items[:100]
        elif source_type in ['tmdb_kids', 'tmdb_horror', 'tmdb_docs', 'tmdb_scifi']:
            # Categorical - User wants 500
            genre_map = {'tmdb_kids': '10751,35', 'tmdb_horror': '27', 'tmdb_docs': '99', 'tmdb_scifi': '878'}
            media_map = {'tmdb_kids': 'movie', 'tmdb_horror': 'movie', 'tmdb_docs': 'movie', 'tmdb_scifi': 'movie'}
            genre_ids = genre_map.get(source_type)
            media_type = media_map.get(source_type)
            for page in range(1, 26): # 500 items
                url = f"https://api.themoviedb.org/3/discover/{media_type}?api_key={tmdb_key}&with_genres={genre_ids}&sort_by=popularity.desc&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    if not data: break
                    items.extend([{'title': m.get('title'), 'tmdb_id': m.get('id'), 'type': 'movie'} for m in data])
                else: break
            items = items[:500]
        elif source_type == 'trakt_trending_movie':
            # Trending - User wants 30
            resp = requests.get("https://api.trakt.tv/movies/trending?limit=30", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['movie']['title'], 'tmdb_id': itm['movie']['ids']['tmdb'], 'type': 'movie'} for itm in resp.json()]
        elif source_type == 'trakt_trending_show':
            # Trending - User wants 30
            resp = requests.get("https://api.trakt.tv/shows/trending?limit=30", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['show']['title'], 'tmdb_id': itm['show']['ids']['tmdb'], 'type': 'show'} for itm in resp.json()]
        elif source_type == 'trakt_anticipated_movie':
            # Other - User wants 500
            resp = requests.get("https://api.trakt.tv/movies/anticipated?limit=500", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['movie']['title'], 'tmdb_id': itm['movie']['ids']['tmdb'], 'type': 'movie'} for itm in resp.json()]
        elif source_type == 'trakt_anticipated_show':
            # Other - User wants 500
            resp = requests.get("https://api.trakt.tv/shows/anticipated?limit=500", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['show']['title'], 'tmdb_id': itm['show']['ids']['tmdb'], 'type': 'show'} for itm in resp.json()]
        elif source_type == 'trakt_recommended_movie':
            # Other - User wants 500
            resp = requests.get("https://api.trakt.tv/movies/recommended/weekly?limit=500", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['movie']['title'], 'tmdb_id': itm['movie']['ids']['tmdb'], 'type': 'movie'} for itm in resp.json()]
        elif source_type == 'trakt_recommended_show':
            # Other - User wants 500
            resp = requests.get("https://api.trakt.tv/shows/recommended/weekly?limit=500", headers=headers, timeout=5)
            if resp.status_code == 200:
                items = [{'title': itm['show']['title'], 'tmdb_id': itm['show']['ids']['tmdb'], 'type': 'show'} for itm in resp.json()]
        elif source_type == 'trakt_list':
            api_path = source_id
            if 'trakt.tv' in source_id:
                parts = source_id.strip().split('/')
                try:
                    u_idx = parts.index('users')
                    username = parts[u_idx + 1]
                    slug = parts[u_idx + 3]
                    api_path = f"{username}/lists/{slug}"
                except Exception:
                    pass
            resp = requests.get(f"https://api.trakt.tv/users/{api_path}/items?limit=1000", headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                for itm in data:
                    if 'movie' in itm: items.append({'title': itm['movie']['title'], 'tmdb_id': itm['movie']['ids']['tmdb'], 'type': 'movie'})
                    elif 'show' in itm: items.append({'title': itm['show']['title'], 'tmdb_id': itm['show']['ids']['tmdb'], 'type': 'show'})
        elif source_type == 'mdblist':
            try:
                api_key = config.get('mdblist_api_key')
                if api_key:
                    parts = [p for p in source_id.strip().split('/') if p]
                    if 'mdblist.com' in source_id.lower() and 'lists' in parts:
                        lists_idx = parts.index('lists')
                        username = parts[lists_idx + 1]
                        list_slug = parts[lists_idx + 2] if len(parts) > lists_idx + 2 else ""
                        if list_slug:
                            api_url = f"https://api.mdblist.com/lists/{username}/{list_slug}/items/?apikey={api_key}"
                            resp = requests.get(api_url, timeout=10)
                            if resp.status_code == 200:
                                for itm in resp.json():
                                    items.append({
                                        'title': itm.get('title'),
                                        'tmdb_id': itm.get('tmdbid'),
                                        'type': 'movie' if itm.get('mediatype') == 'movie' else 'show'
                                    })
            except Exception as e:
                logging.error(f"Error parse/fetch mdblist: {e}")
    except Exception as e:
        logging.error(f"Error fetching source items for {source_type}: {e}")
            
    return items

def run_sync_job(job_id=None):
    """Refreshes managed collections. If job_id is provided, only syncs that specific job."""
    managed = load_managed_collections()
    if not managed:
        return
        
    config = load_config()
    plex_url = config.get('plex_url')
    plex_token = config.get('plex_token')
    
    if not plex_url or not plex_token:
        log_action("Sync failed: Plex URL or Token missing.")
        return

    from plexapi.server import PlexServer
    try:
        configure_plex_identity()
        plex = PlexServer(plex_url, plex_token)
    except Exception as e:
        log_action(f"Sync failed: Plex connection error: {e}")
        return

    jobs_to_run = [job_id] if job_id else list(managed.keys())
    
    for mid in jobs_to_run:
        job = managed.get(mid)
        if not job or (not job_id and not job.get('auto_sync', True)):
            continue
            
        coll_name = job.get('name')
        lib_name = job.get('library')
        source_type = job.get('source_type')
        source_id = job.get('source_id')
        sort_order = job.get('sort_order', 'custom')
        
        # Respect schedule if not run manually
        if not job_id:
            next_run_str = job.get('next_run')
            if next_run_str:
                try:
                    from datetime import datetime
                    next_run_dt = datetime.strptime(next_run_str, "%Y-%m-%d %H:%M:%S")
                    if datetime.now() < next_run_dt:
                        continue # Skip, not time yet
                except Exception:
                    pass # Invalid or missing format, proceed to run
            
        log_action(f"Auto-Sync: Syncing items for '{coll_name}'...")
        
        # Update run stats immediately so they persist even if we exit early
        job['last_run'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        job['next_run'] = (datetime.now() + timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")

        # 1. Fetch latest items
        items = fetch_source_items(source_type, source_id, config)
        if not items:
            log_action(f"Auto-Sync: No items found for '{coll_name}'. Skipping.")
            continue
            
        # 2. Update Plex Collection
        try:
            library = plex.library.section(lib_name)
            # Find collection or create it (it should already exist, but let's be safe)
            collections = library.collections(title=coll_name)
            if not collections:
                log_action(f"Auto-Sync: Collection '{coll_name}' not found in '{lib_name}'. Marking for re-creation next run or just skipping.")
                # We won't re-create here because sorting/labels might be complex.
                continue
                
            coll = collections[0]
            
            # Resolve items in Plex
            plex_items = []
            for itm in items:
                search_type = 'movie' if itm['type'] == 'movie' else 'show'
                results = library.search(title=itm['title'], libtype=search_type)
                if results:
                    plex_items.append(results[0])
            
            if not plex_items:
                log_action(f"Auto-Sync: No matching Plex items found for '{coll_name}'.")
                continue

            # Check if it's a smart collection
            is_smart = getattr(coll, 'smart', False)
            
            if is_smart:
                log_action(f"Auto-Sync: '{coll_name}' is a smart collection. Deleting and recreating to update.")
                coll.delete()
                item_keys = [str(itm.ratingKey) for itm in plex_items]
                new_coll = library.createCollection(
                    title=coll_name,
                    smart=True,
                    sort='random',
                    filters={'id': item_keys}
                )
                
                # Re-apply label
                label = config.get('collexions_label', 'Collexions')
                try:
                    new_coll.addLabel(label)
                except Exception as e:
                    logging.warning(f"Failed to set label on recreated collection: {e}")
                    
                log_action(f"Auto-Sync: Successfully recreated smart collection '{coll_name}'.")
            else:
                current_items = coll.items()
                current_titles = [i.title for i in current_items]
                target_titles = [i.title for i in plex_items]
                
                new_items = [i for i in plex_items if i.title not in current_titles]
                items_to_remove = [i for i in current_items if i.title not in target_titles]
                
                if new_items:
                    coll.addItems(new_items)
                    log_action(f"Auto-Sync: Added {len(new_items)} new items to '{coll_name}'.")
                    
                if items_to_remove:
                    try:
                        coll.removeItems(items_to_remove)
                        log_action(f"Auto-Sync: Removed {len(items_to_remove)} items from '{coll_name}'.")
                    except Exception as e:
                        logging.warning(f"Failed to remove old items from '{coll_name}': {e}")
                        
                if not new_items and not items_to_remove:
                    log_action(f"Auto-Sync: '{coll_name}' is already up to date.")

        except Exception as e:
            log_action(f"Auto-Sync error for '{coll_name}': {e}")
            
    
    save_managed_collections(managed)

def background_sync_loop():
    """Background thread that checks for due jobs every 10 minutes."""
    while True:
        try:
            run_sync_job()
        except Exception as e:
            logging.error(f"Background Sync Loop error: {e}")
        time.sleep(600) # Check every 10 minutes

# Start the background thread
threading.Thread(target=background_sync_loop, daemon=True).start()

def get_tmdb_poster(tmdb_id, media_type='movie'):
    """Resolves a TMDB ID to a full poster URL by fetching the poster_path."""
    if not tmdb_id:
        return None
        
    cache_key = f"{media_type}_{tmdb_id}"
    if cache_key in TMDB_POSTER_CACHE:
        return TMDB_POSTER_CACHE[cache_key]
        
    config = load_config()
    api_key = config.get('tmdb_api_key')
    if not api_key:
        return None
        
    try:
        url = f"https://api.themoviedb.org/3/{media_type}/{tmdb_id}?api_key={api_key}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            poster_path = data.get('poster_path')
            if poster_path:
                full_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
                TMDB_POSTER_CACHE[cache_key] = full_url
                return full_url
    except Exception as e:
        logging.error(f"Error resolving TMDB poster: {e}")
        
    return None

def log_action(message):
    """Logs a message to collexions.log in the standard format."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"{timestamp} - INFO - [WEBUI] {message}\n"
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(log_entry)
        logging.info(f"[WEBUI] {message}")
    except Exception as e:
        logging.error(f"Failed to write to log file: {e}")

def is_script_already_running():
    """Check via psutil if ColleXions.py is running in a process the server didn't start."""
    if not PSUTIL_AVAILABLE:
        return False
    try:
        for proc in psutil.process_iter(['pid', 'cmdline']):
            try:
                cmdline = proc.info.get('cmdline') or []
                if any(SCRIPT_NAME in (arg or '') for arg in cmdline):
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass
    return False

def _check_plex_quick(config, timeout=3):
    """Lightweight Plex reachability check (identity endpoint)."""
    url = str(config.get('plex_url') or '').rstrip('/')
    token = str(config.get('plex_token') or '').strip()
    if not url or not token:
        return False, 'Plex URL/token missing'
    try:
        resp = requests.get(
            f'{url}/identity',
            headers=plex_request_headers(token),
            timeout=timeout,
            verify=False,
        )
        if resp.status_code == 200:
            return True, None
        return False, f'Plex returned HTTP {resp.status_code}'
    except Exception as e:
        return False, str(e)[:200]


@app.route('/api/health')
def health():
    """Worker health for portal diagnostics (config, script, Plex)."""
    global process
    config = load_config()
    libraries = config.get('library_names') or []
    has_url = bool(str(config.get('plex_url') or '').strip())
    has_token = bool(str(config.get('plex_token') or '').strip())

    script_status = 'stopped'
    if process is not None and process.poll() is None:
        script_status = 'running'
    elif is_script_already_running():
        script_status = 'running'

    plex_ok, plex_error = _check_plex_quick(config)
    issues = []
    if not has_url or not has_token:
        issues.append('Plex URL or token is not configured in Collexions.')
    elif not plex_ok:
        issues.append(f'Cannot reach Plex: {plex_error}')
    if not libraries:
        issues.append('No libraries selected — pinning has nothing to process.')
    if script_status == 'stopped':
        issues.append('Pinning service is stopped (Start Service or enable Auto-start).')

    return jsonify({
        'ok': plex_ok and bool(libraries),
        'worker': True,
        'portal_mode': bool(PORTAL_MODE),
        'autostart': env_flag_enabled('COLLEXIONS_AUTOSTART'),
        'config': {
            'plex_url': has_url,
            'plex_token': has_token,
            'library_count': len(libraries),
            'dry_run': bool(config.get('dry_run')),
        },
        'script': script_status,
        'plex': {'ok': plex_ok, 'error': plex_error},
        'issues': issues,
    })


def _read_status_file():
    """Read worker-written status.json (same path ColleXions.py uses under COLLEXIONS_DATA_DIR)."""
    if not os.path.exists(STATUS_FILE):
        return {}
    try:
        with open(STATUS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception as e:
        logging.warning(f"Failed to read status file: {e}")
        return {}


def _next_run_from_logs():
    """Legacy fallback when status.json has no next_run_timestamp."""
    if not os.path.exists(LOG_FILE):
        return 0
    try:
        with open(LOG_FILE, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()[-100:]
        for line in reversed(lines):
            if "Sleeping for approximately" not in line:
                continue
            match = re.search(
                r'(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}).*?Sleeping\sfor\sapproximately\s(\d+(?:\.\d+)?)',
                line,
            )
            if not match:
                continue
            log_time = time.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
            return time.mktime(log_time) + int(float(match.group(2)))
    except Exception as e:
        logging.warning(f"Status log parse error: {e}")
    return 0


@app.route('/api/status')
@require_auth
def get_status():
    global process
    process_alive = False
    if process is not None and process.poll() is None:
        process_alive = True
    elif is_script_already_running():
        process_alive = True

    file_status = _read_status_file()
    file_msg = str(file_status.get('status') or '').strip()

    # Prefer the detailed message from status.json while the pin script is alive
    # (e.g. "Sleeping (30 min)", "Processing: Movies").
    if process_alive and file_msg:
        status = file_msg
    elif process_alive:
        status = "Running"
    elif process is not None and process.poll() is not None and process.returncode not in (0, None):
        status = file_msg or "Error (Check Logs)"
    else:
        status = file_msg if file_msg and file_msg.lower() not in ('running', 'initializing') else "Idle"

    next_run_timestamp = 0
    raw_next = file_status.get('next_run_timestamp')
    try:
        if raw_next is not None:
            next_run_timestamp = float(raw_next)
    except (TypeError, ValueError):
        next_run_timestamp = 0
    if next_run_timestamp <= 0:
        next_run_timestamp = _next_run_from_logs() or 0

    last_run_at = str(file_status.get('last_run_at') or '').strip()
    last_update = last_run_at or str(file_status.get('last_update') or '').strip()
    if not last_update and os.path.exists(LOG_FILE):
        try:
            last_update = time.ctime(os.path.getmtime(LOG_FILE))
        except OSError:
            last_update = ""

    payload = {
        "status": status,
        "last_update": last_update,
        "last_run_at": last_run_at or None,
        "last_run_started_at": file_status.get('last_run_started_at'),
        "last_run_duration_seconds": file_status.get('last_run_duration_seconds'),
        "last_run_pinned": file_status.get('last_run_pinned'),
        "next_run_timestamp": next_run_timestamp,
        "pin_slots": file_status.get('pin_slots'),
        "libraries": file_status.get('libraries') if isinstance(file_status.get('libraries'), list) else [],
        "fairness": file_status.get('fairness') if isinstance(file_status.get('fairness'), dict) else {},
        "process_alive": process_alive,
        "status_source": "status.json" if file_status else ("logs" if next_run_timestamp else "none"),
    }
    return jsonify(payload)


@app.route('/api/summary')
@require_auth
def get_summary():
    """Compact status for the portal home widget (last/next run + labeled pin count)."""
    global SUMMARY_CACHE, GALLERY_CACHE

    now = time.time()
    if SUMMARY_CACHE['data'] is not None and now - SUMMARY_CACHE['timestamp'] < SUMMARY_CACHE['ttl']:
        return jsonify(SUMMARY_CACHE['data'])

    # Reuse status fields
    status_resp = get_status()
    status_payload = status_resp.get_json() if hasattr(status_resp, 'get_json') else {}
    if not isinstance(status_payload, dict):
        status_payload = {}

    config = load_config()
    pin_slots = sum(int(v or 0) for v in (config.get('number_of_collections_to_pin') or {}).values())
    label = str(config.get('collexions_label') or 'Collexions').lower()
    lib_names = config.get('library_names') or []

    pinned_count = None
    labeled_count = 0

    # Prefer a full gallery cache (pins already resolved)
    cache_data = GALLERY_CACHE.get('data')
    cache_ver = GALLERY_CACHE.get('version')
    if isinstance(cache_data, list) and cache_ver == 4:
        pinned_count = sum(1 for c in cache_data if c.get('is_pinned'))
        labeled_count = sum(1 for c in cache_data if c.get('has_label'))
    else:
        plex = get_plex_instance()
        if plex and lib_names:
            pinned = 0
            try:
                for lib_name in lib_names:
                    try:
                        library = plex.library.section(lib_name)
                        for coll in library.collections():
                            has_label = any(
                                getattr(l, 'tag', '').lower() == label
                                for l in getattr(coll, 'labels', []) or []
                            )
                            if not has_label:
                                continue
                            labeled_count += 1
                            if _collection_is_pinned(coll):
                                pinned += 1
                    except Exception as e:
                        logging.warning(f"summary library '{lib_name}' failed: {e}")
                pinned_count = pinned
            except Exception as e:
                logging.warning(f"summary pin count failed: {e}")
                pinned_count = None

    # Prefer slots from the last completed run when present; else config sum.
    status_slots = status_payload.get('pin_slots')
    try:
        status_slots = int(status_slots) if status_slots is not None else None
    except (TypeError, ValueError):
        status_slots = None

    payload = {
        **status_payload,
        "pinned_count": pinned_count,
        "labeled_count": labeled_count,
        "pin_slots": status_slots if status_slots is not None else pin_slots,
        "last_run_at": status_payload.get('last_run_at') or status_payload.get('last_update'),
    }
    SUMMARY_CACHE['data'] = payload
    SUMMARY_CACHE['timestamp'] = time.time()
    return jsonify(payload)


@app.route('/api/logs')
@require_auth
def get_logs():
    if os.path.exists(LOG_FILE):
        try:
            # Efficiently tail the log file
            # We'll return the last ~2000 lines or ~200KB of data
            max_bytes = 200 * 1024 # 200KB limit
            with open(LOG_FILE, 'rb') as f:
                f.seek(0, os.SEEK_END)
                file_size = f.tell()
                
                # Seek backwards from the end
                offset = min(file_size, max_bytes)
                f.seek(file_size - offset)
                
                content = f.read().decode('utf-8', errors='replace')
                # Optional: Split lines to ensure we don't start mid-line
                lines = content.splitlines()
                if len(lines) > 1 and not content.startswith('\n'):
                    # Discard the first (potentially partial) line
                    lines.pop(0)
                return "\n".join(lines)
        except Exception as e:
            return f"Error reading log file: {e}"
    return "No logs found. Run the script to generate logs."

@app.route('/api/logs/clear', methods=['POST'])
@require_auth
def clear_logs():
    try:
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'w') as f:
                f.write(f"Log file cleared at {time.ctime()}\n")
            return jsonify({"success": True})
        return jsonify({"error": "Log file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/config', methods=['GET', 'POST'])
@require_auth
def config_endpoint():
    if request.method == 'POST':
        if save_config(request.json, merge=True):
            return jsonify({"success": True})
        return jsonify({"error": "Failed to save configuration"}), 500
    
    return jsonify(load_config())


@app.route('/api/config/validate', methods=['POST'])
@require_auth
def validate_config_endpoint():
    """Validate a draft config (does not save). Checks fields + live Plex libraries."""
    data = request.json or {}
    errors = []
    warnings = []
    available = []

    url = str(data.get('plex_url') or '').strip()
    token = str(data.get('plex_token') or '').strip()
    if not url:
        errors.append('Plex URL is required.')
    elif not (url.startswith('http://') or url.startswith('https://')):
        warnings.append('Plex URL should start with http:// or https://')
    if not token:
        errors.append('Plex token is required.')

    libs_raw = data.get('library_names') or []
    if not isinstance(libs_raw, list):
        libs_raw = []
    libs = [str(x).strip() for x in libs_raw if str(x).strip()]
    if not libs:
        errors.append('Add at least one Plex library.')

    pins = data.get('number_of_collections_to_pin') or {}
    if not isinstance(pins, dict):
        pins = {}
    total_pins = 0
    for lib in libs:
        try:
            n = int(pins.get(lib, 0))
        except (TypeError, ValueError):
            errors.append(f'Pin limit for "{lib}" must be a whole number ≥ 0.')
            continue
        if n < 0:
            errors.append(f'Pin limit for "{lib}" must be ≥ 0.')
        else:
            total_pins += n
            if n == 0:
                warnings.append(f'"{lib}" has 0 pin slots — nothing will be pinned there.')
    if libs and total_pins == 0:
        warnings.append('All libraries have 0 pin slots. The service will not pin anything.')

    try:
        interval = int(data.get('pinning_interval') or 0)
        if interval < 1:
            errors.append('Check interval must be at least 1 minute.')
    except (TypeError, ValueError):
        errors.append('Check interval must be a number.')

    for pattern in (data.get('regex_exclusion_patterns') or []):
        p = str(pattern or '').strip()
        if not p:
            continue
        try:
            re.compile(p)
        except re.error:
            errors.append(f'Invalid regex exclusion: {p}')

    # Live Plex connection + library existence (draft credentials, not saved config)
    if url and token:
        try:
            configure_plex_identity()
            from plexapi.server import PlexServer
            plex = PlexServer(url, token, timeout=10)
            sections = list(plex.library.sections())
            available = [s.title for s in sections]
            available_set = set(available)
            for lib in libs:
                if lib not in available_set:
                    # Suggest close matches by case
                    lower_map = {a.lower(): a for a in available}
                    hint = lower_map.get(lib.lower())
                    if hint and hint != lib:
                        errors.append(f'Library "{lib}" not found on Plex (did you mean "{hint}"?).')
                    else:
                        errors.append(f'Library "{lib}" was not found on this Plex server.')
        except Exception as e:
            errors.append(f'Cannot connect to Plex with these credentials: {e}')

    # Dedupe while preserving order
    def _uniq(items):
        seen = set()
        out = []
        for x in items:
            if x in seen:
                continue
            seen.add(x)
            out.append(x)
        return out

    errors = _uniq(errors)
    warnings = _uniq(warnings)
    return jsonify({
        'ok': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'available_libraries': available,
    })


def sync_logs_to_history():
    """Parses LOG_FILE and appends new pin events to HISTORY_FILE."""
    if not os.path.exists(LOG_FILE):
        return
        
    logging.debug("Starting auto-sync of logs to history...")
    
    # 1. Load existing history
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
                if not isinstance(history, list):
                    history = []
        except:
            history = []
            
    # Create lookup for deduplication
    existing_keys = set()
    for e in history:
        # Use ISO format for consistency in key
        key = f"{e.get('timestamp')}|{e.get('library')}|{e.get('collectionName')}"
        existing_keys.add(key)
        
    # 2. Parse Logs
    new_events = []
    current_library = "Unknown Library"
    
    # Regex patterns (matching frontend logic)
    lib_regex = re.compile(r'Processing Library:.*?[\'"](.+?)[\'"]')
    # Updated pin regex to be more robust
    pin_regex = re.compile(r'(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{1,2}(?:\.\d+)?).*?(?:Pinning:|Pinned|Processing for pin:)\s+[\'"](.+?)[\'"]')
    
    try:
        with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                # Library match
                lib_match = lib_regex.search(line)
                if lib_match:
                    current_library = lib_match.group(1)
                    continue
                    
                # Pin match
                pin_match = pin_regex.search(line)
                if pin_match:
                    raw_ts = pin_match.group(1).strip().replace(' ', 'T').replace(',', '.')
                    coll_name = pin_match.group(2)
                    
                    # Normalize timestamp for ISO
                    try:
                        # Ensure T separator
                        if 'T' not in raw_ts:
                            raw_ts = raw_ts.replace(' ', 'T')
                        
                        # Basic validation, convert to ISO if possible
                        # We just store the string for now, but ensure consistency
                        ts_key = f"{raw_ts}|{current_library}|{coll_name}"
                        
                        if ts_key not in existing_keys:
                            new_events.append({
                                "timestamp": raw_ts,
                                "collectionName": coll_name,
                                "library": current_library
                            })
                            existing_keys.add(ts_key)
                    except:
                        continue
    except Exception as e:
        logging.error(f"Error parsing logs for sync: {e}")
        return

    # 3. Save if new events found
    if new_events:
        logging.info(f"Auto-sync found {len(new_events)} new events. Archiving to history.json")
        history.extend(new_events)
        # Sort by timestamp decending? history is usually stored ascending or just appended
        # Stats page sorts them, so append is fine.
        try:
            ensure_dir_exists(HISTORY_FILE)
            with open(HISTORY_FILE, 'w') as f:
                json.dump(history, f, indent=4)
        except Exception as e:
            logging.error(f"Error saving history during sync: {e}")

# --- History Endpoint (New) ---
@app.route('/api/history', methods=['GET', 'POST'])
@require_auth
def history_endpoint():
    if request.method == 'POST':
        try:
            data = request.json
            ensure_dir_exists(HISTORY_FILE)
            with open(HISTORY_FILE, 'w') as f:
                json.dump(data, f, indent=4)
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # Auto-sync from logs before returning GET
    sync_logs_to_history()
    
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                return jsonify({"events": [], "total_count": 0, "unique_count": 0})

            total_count = len(data)
            unique_count = len(set(e.get('collectionName') for e in data if 'collectionName' in e))
                
            limit = request.args.get('limit', type=int)
            returned_events = data[-limit:] if limit else data
                
            return jsonify({
                "events": returned_events,
                "total_count": total_count,
                "unique_count": unique_count
            })
        except Exception as e:
            return jsonify({"events": [], "total_count": 0, "unique_count": 0, "error": str(e)})
    return jsonify({"events": [], "total_count": 0, "unique_count": 0})

def start_background_process():
    """Helper to start the background process."""
    global process
    
    # Don't start if already running via managed process
    if process and process.poll() is None:
        return False, "Script is already running"
    
    # Don't start if an external instance is already running (e.g. started before server)
    if is_script_already_running():
        return False, "Script is already running (external process detected)"
    
    # Check if script exists
    script_path = os.path.join(BASE_DIR, SCRIPT_NAME)
    if not os.path.exists(script_path):
        return False, f"Script {SCRIPT_NAME} not found."

    try:
        # Run with data-dir cwd so relative paths and COLLEXIONS_DATA_DIR stay aligned.
        # Script path stays absolute under BASE_DIR (code), while config/logs live in _DATA_ROOT.
        cmd = [sys.executable, "-u", script_path]
        try:
            cfg = load_config()
            if cfg.get('dry_run'):
                cmd.append('--dry-run')
        except Exception:
            pass

        child_env = os.environ.copy()
        if _DATA_ROOT:
            child_env['COLLEXIONS_DATA_DIR'] = _DATA_ROOT

        process = subprocess.Popen(
            cmd,
            cwd=_DATA_ROOT,
            env=child_env,
        )
        logging.info(f"Background process started with PID: {process.pid} (cwd={_DATA_ROOT})")
            
        return True, process.pid
    except Exception as e:
        logging.error(f"Failed to start background process: {e}")
        return False, str(e)

@app.route('/api/run', methods=['POST'])
@require_auth
def run_script():
    success, result = start_background_process()
    if not success:
        return jsonify({"error": result}), 400 if "running" in result else 404 if "not found" in result else 500
    return jsonify({"success": True, "pid": result})

def maybe_autostart_background_process():
    if not env_flag_enabled('COLLEXIONS_AUTOSTART'):
        return

    if not config_ready_for_background_process():
        return

    success, result = start_background_process()
    if success:
        logging.info(f"Background service autostarted with PID: {result}")
    else:
        logging.warning(f"Background service autostart skipped: {result}")

# --- Plex Helpers ---
_plex_cache = None

def get_plex_instance():
    global _plex_cache
    if _plex_cache:
        return _plex_cache
        
    config = load_config()
    url = config.get('plex_url')
    token = config.get('plex_token')
    if not url or not token:
        return None
    try:
        configure_plex_identity()
        from plexapi.server import PlexServer
        _plex_cache = PlexServer(url, token)
        return _plex_cache
    except Exception as e:
        logging.error(f"Plex connection error: {e}")
        return None

# --- Gallery Endpoints ---
def _collection_is_pinned(coll):
    """Resolve home-pin state via Plex hub visibility (expensive — avoid on first paint)."""
    try:
        hubs = coll.visibility()
        if not isinstance(hubs, list):
            hubs = [hubs] if hubs else []
        for h in hubs:
            if not h:
                continue
            if getattr(h, 'promotedToOwnHome', False) or getattr(h, 'promotedToSharedHome', False):
                return True
            if getattr(h, 'context', '') == 'home' and (getattr(h, 'promoted', False) or getattr(h, '_promoted', False)):
                return True
    except Exception:
        pass
    return False


@app.route('/api/collections')
@require_auth
def list_collections():
    global GALLERY_CACHE

    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    # light=true (default): skip per-collection visibility() for fast first paint
    light = request.args.get('light', 'true').lower() != 'false'
    cache_version = 3 if light else 4

    now = time.time()
    if (
        not force_refresh
        and GALLERY_CACHE['data'] is not None
        and GALLERY_CACHE.get('version') == cache_version
        and now - GALLERY_CACHE['timestamp'] < GALLERY_CACHE['ttl']
    ):
        print(f"Serving collections from cache (light={light})")
        return jsonify(GALLERY_CACHE['data'])

    plex = get_plex_instance()
    if not plex:
        return jsonify({"error": "Plex not configured"}), 400

    config = load_config()
    lib_names = config.get('library_names', [])
    collexions_label = config.get('collexions_label', 'Collexions').lower()
    from urllib.parse import quote
    server_id = getattr(plex, 'machineIdentifier', None) or ''

    all_collections = []
    for lib_name in lib_names:
        try:
            library = plex.library.section(lib_name)
            for coll in library.collections():
                has_label = any(l.tag.lower() == collexions_label for l in getattr(coll, 'labels', []))

                if light:
                    is_pinned = False
                    pin_resolved = False
                else:
                    is_pinned = _collection_is_pinned(coll)
                    pin_resolved = True

                thumb = getattr(coll, 'thumb', None)
                if not thumb:
                    thumb = getattr(coll, 'composite', None) or getattr(coll, 'art', None)

                if thumb and isinstance(thumb, str) and thumb.startswith('http'):
                    from urllib.parse import urlparse
                    thumb = urlparse(thumb).path

                if not thumb and getattr(coll, 'ratingKey', None):
                    thumb = f'/library/collections/{coll.ratingKey}/composite'

                meta_key = getattr(coll, 'key', None) or f'/library/metadata/{coll.ratingKey}'
                plex_url = ''
                if server_id and meta_key:
                    plex_url = (
                        f"https://app.plex.tv/desktop/#!/server/{server_id}/details"
                        f"?key={quote(meta_key)}"
                    )

                all_collections.append({
                    "title": coll.title,
                    "library": lib_name,
                    "is_pinned": is_pinned,
                    "pin_resolved": pin_resolved,
                    "has_label": has_label,
                    "thumb": thumb,
                    "ratingKey": str(coll.ratingKey),
                    "key": meta_key,
                    "plexUrl": plex_url,
                })
        except Exception as e:
            print(f"Error fetching collections from {lib_name}: {e}")

    GALLERY_CACHE['data'] = all_collections
    GALLERY_CACHE['timestamp'] = time.time()
    GALLERY_CACHE['version'] = cache_version

    return jsonify(all_collections)


@app.route('/api/collections/resolve-pins', methods=['POST'])
@require_auth
def resolve_collection_pins():
    """Enrich pin state for a batch of collections after a light gallery load."""
    plex = get_plex_instance()
    if not plex:
        return jsonify({"error": "Plex not configured"}), 400

    data = request.json or {}
    items = data.get('items') or []
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"pins": {}})

    # Cap to keep request time bounded
    items = items[:400]
    pins = {}
    by_library = {}
    for item in items:
        lib = str(item.get('library') or '').strip()
        title = str(item.get('title') or '').strip()
        if not lib or not title:
            continue
        by_library.setdefault(lib, []).append(title)

    for lib_name, titles in by_library.items():
        try:
            library = plex.library.section(lib_name)
            for title in titles:
                key = f'{lib_name}\0{title}'
                try:
                    coll = library.collection(title)
                    pins[key] = _collection_is_pinned(coll)
                except Exception:
                    pins[key] = False
        except Exception as e:
            logging.warning(f"resolve-pins library '{lib_name}' failed: {e}")
            for title in titles:
                pins[f'{lib_name}\0{title}'] = False

    return jsonify({"pins": pins})


@app.route('/api/collections/bulk', methods=['POST'])
@require_auth
def bulk_pin_collections():
    """Pin or unpin many collections in one request."""
    global GALLERY_CACHE
    plex = get_plex_instance()
    config = load_config()
    label = config.get('collexions_label', 'Collexions')
    data = request.json or {}
    action = str(data.get('action') or '').lower()
    items = data.get('items') or []

    if action not in ('pin', 'unpin'):
        return jsonify({"success": False, "error": "action must be pin or unpin"}), 400
    if not plex or not isinstance(items, list) or not items:
        return jsonify({"success": False, "error": "Invalid request"}), 400

    items = items[:100]
    results = []
    for item in items:
        title = str(item.get('title') or '').strip()
        library_name = str(item.get('library') or '').strip()
        if not title or not library_name:
            results.append({"title": title, "library": library_name, "ok": False, "error": "Missing title/library"})
            continue
        try:
            library = plex.library.section(library_name)
            collection = library.collection(title)
            hub = collection.visibility()
            if action == 'pin':
                collection.addLabel(label)
                hub.promoteHome()
                hub.promoteShared()
                log_action(f"Pinned '{title}' successfully.")
            else:
                try:
                    collection.removeLabel(label)
                except Exception:
                    pass
                hub.demoteHome()
                hub.demoteShared()
                log_action(f"Unpinned '{title}' successfully.")
            results.append({"title": title, "library": library_name, "ok": True})
        except Exception as e:
            results.append({"title": title, "library": library_name, "ok": False, "error": str(e)})

    GALLERY_CACHE['data'] = None
    GALLERY_CACHE['timestamp'] = 0
    SUMMARY_CACHE['data'] = None
    SUMMARY_CACHE['timestamp'] = 0
    ok_count = sum(1 for r in results if r.get('ok'))
    return jsonify({"success": True, "ok_count": ok_count, "results": results})


@app.route('/api/cache/clear', methods=['POST'])
@require_auth
def clear_cache():
    """Force-clears all server-side caches so the next request re-fetches fresh data."""
    global GALLERY_CACHE, IMAGE_CACHE, SUMMARY_CACHE, _plex_cache
    GALLERY_CACHE['data'] = None
    GALLERY_CACHE['timestamp'] = 0
    SUMMARY_CACHE['data'] = None
    SUMMARY_CACHE['timestamp'] = 0
    IMAGE_CACHE = {}
    _plex_cache = None  # also reset the Plex connection so composite paths reload cleanly
    return jsonify({"success": True, "message": "Gallery, image, and Plex caches cleared."})


@app.route('/api/plex/libraries')
@require_auth
def plex_libraries():
    """Fetches all available library sections from Plex."""
    plex = get_plex_instance()
    if not plex:
        return jsonify({"error": "Plex connection failed"}), 500
        
    try:
        sections = plex.library.sections()
        libraries = []
        for s in sections:
            libraries.append({
                'name': s.title,
                'type': s.type,
                'uuid': getattr(s, 'uuid', s.key)
            })
        return jsonify(libraries)
    except Exception as e:
        logging.error(f"Failed to fetch Plex libraries: {e}")
        return jsonify({"error": str(e)}), 500

# Assuming PRESETS_CACHE is defined globally, similar to GALLERY_CACHE
# PRESETS_CACHE = {'data': None, 'timestamp': 0, 'ttl': 3600} # Cache for 1 hour

@app.route('/api/trending', methods=['GET'])
@require_auth
def get_trending():
    global PRESETS_CACHE
    now = time.time()
    if PRESETS_CACHE['data'] and (now - PRESETS_CACHE['timestamp'] < PRESETS_CACHE['ttl']):
        logging.debug("Returning cached trending presets")
        return jsonify(PRESETS_CACHE['data'])

    logging.info("Fetching fresh trending presets from TMDb and Trakt")
    config = load_config()
    tmdb_key = config.get('tmdb_api_key')
    trakt_id = config.get('trakt_client_id')
    
    presets = []
    
    if tmdb_key:
        try:
            # Trending Movies
            all_data = []
            for page in range(1, 3): # 2 pages = 40 items
                url = f"https://api.themoviedb.org/3/trending/movie/week?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_movie_week',
                'name': 'TMDb Weekly Trending Movies',
                'description': 'The most popular movies on TMDb this week.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data[:30]] # Slice at 30
            })
                
            # Trending Shows
            all_data = []
            for page in range(1, 3):
                url = f"https://api.themoviedb.org/3/trending/tv/week?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_tv_week',
                'name': 'TMDb Weekly Trending Shows',
                'description': 'The most watched TV series on TMDb this week.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('name'),
                    'id': m.get('id'),
                    'year': m.get('first_air_date', '')[:4] if m.get('first_air_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'show'
                } for m in all_data[:30]] # Slice at 30
            })

            # Popular TV Shows
            all_data = []
            for page in range(1, 4): # 3 pages = 60 items
                url = f"https://api.themoviedb.org/3/tv/popular?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_tv_popular',
                'name': 'Popular TV Shows',
                'description': 'The most popular TV shows on TMDb right now.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('name'),
                    'id': m.get('id'),
                    'year': m.get('first_air_date', '')[:4] if m.get('first_air_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'show'
                } for m in all_data[:50]] # Slice at 50
            })

            # Top Rated Movies
            all_data = []
            for page in range(1, 6): # 5 pages = 100 items
                url = f"https://api.themoviedb.org/3/movie/top_rated?api_key={tmdb_key}&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_movie_top',
                'name': 'Top Rated Movies',
                'description': 'All-time highest rated movies on TMDb.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data[:100]] # Slice at 100
            })

            # TMDb Kids & Family
            all_data = []
            for page in range(1, 6):
                url = f"https://api.themoviedb.org/3/discover/movie?api_key={tmdb_key}&with_genres=10751,16&sort_by=popularity.desc&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_kids',
                'name': 'Kids & Family Hits',
                'description': 'Top animated and family-friendly movies.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data]
            })

            # TMDb Horror Hits
            all_data = []
            for page in range(1, 6):
                url = f"https://api.themoviedb.org/3/discover/movie?api_key={tmdb_key}&with_genres=27&sort_by=popularity.desc&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_horror',
                'name': 'Horror Hits',
                'description': 'Top trending horror movies for spooky season.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data]
            })

            # TMDb Documentaries
            all_data = []
            for page in range(1, 6):
                url = f"https://api.themoviedb.org/3/discover/movie?api_key={tmdb_key}&with_genres=99&sort_by=popularity.desc&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_docs',
                'name': 'Top Documentaries',
                'description': 'Highly rated and popular documentaries.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data]
            })

            # TMDb Sci-Fi Classics
            all_data = []
            for page in range(1, 6):
                url = f"https://api.themoviedb.org/3/discover/movie?api_key={tmdb_key}&with_genres=878&sort_by=popularity.desc&page={page}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    results = resp.json().get('results', [])
                    if not results: break
                    all_data.extend(results)
                else: break

            presets.append({
                'id': 'tmdb_scifi',
                'name': 'Sci-Fi Classics',
                'description': 'Out-of-this-world science fiction favorites.',
                'source': 'TMDb',
                'items': [{
                    'title': m.get('title'),
                    'id': m.get('id'),
                    'year': m.get('release_date', '')[:4] if m.get('release_date') else '',
                    'poster': f"https://image.tmdb.org/t/p/w200{m.get('poster_path')}",
                    'type': 'movie'
                } for m in all_data]
            })
        except Exception as e:
            logging.error(f"TMDB Trending error: {e}")
            
    if trakt_id:
        try:
            headers = {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': trakt_id
            }
            # Trakt Trending Movies
            url = "https://api.trakt.tv/movies/trending?limit=30"
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                presets.append({
                    'id': 'trakt_movie_trending',
                    'name': 'Trakt Trending Movies',
                    'description': 'Movies being watched right now across the Trakt community.',
                    'source': 'Trakt',
                    'items': [{
                        'title': itm.get('movie', {}).get('title'),
                        'year': itm.get('movie', {}).get('year'),
                        'id': itm.get('movie', {}).get('ids', {}).get('tmdb'),
                        'poster': get_tmdb_poster(itm.get('movie', {}).get('ids', {}).get('tmdb'), 'movie'),
                        'type': 'movie'
                    } for itm in data] # limit=30 already handled by API
                })

            # Trakt Trending Shows
            url = "https://api.trakt.tv/shows/trending?limit=30"
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                presets.append({
                    'id': 'trakt_show_trending',
                    'name': 'Trakt Trending Shows',
                    'description': 'Most watched TV shows right now.',
                    'source': 'Trakt',
                    'items': [{
                        'title': itm.get('show', {}).get('title'),
                        'year': itm.get('show', {}).get('year'),
                        'id': itm.get('show', {}).get('ids', {}).get('tmdb'),
                        'poster': get_tmdb_poster(itm.get('show', {}).get('ids', {}).get('tmdb'), 'tv'),
                        'type': 'show'
                    } for itm in data]
                })

            # Trakt Anticipated Movies
            url = "https://api.trakt.tv/movies/anticipated?limit=100"
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                presets.append({
                    'id': 'trakt_movie_anticipated',
                    'name': 'Trakt Most Anticipated',
                    'description': 'Movies people are most looking forward to.',
                    'source': 'Trakt',
                    'items': [{
                        'title': itm.get('movie', {}).get('title'),
                        'year': itm.get('movie', {}).get('year'),
                        'id': itm.get('movie', {}).get('ids', {}).get('tmdb'),
                        'poster': get_tmdb_poster(itm.get('movie', {}).get('ids', {}).get('tmdb'), 'movie'),
                        'type': 'movie'
                    } for itm in data]
                })

            # Trakt Anticipated Shows
            url = "https://api.trakt.tv/shows/anticipated?limit=100"
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                presets.append({
                    'id': 'trakt_show_anticipated',
                    'name': 'Most Anticipated Shows',
                    'description': 'Upcoming TV shows with the most hype.',
                    'source': 'Trakt',
                    'items': [{
                        'title': itm.get('show', {}).get('title'),
                        'year': itm.get('show', {}).get('year'),
                        'id': itm.get('show', {}).get('ids', {}).get('tmdb'),
                        'poster': get_tmdb_poster(itm.get('show', {}).get('ids', {}).get('tmdb'), 'tv'),
                        'type': 'show'
                    } for itm in data]
                })
        except Exception as e:
            logging.error(f"Trakt Trending error: {e}")
            
    PRESETS_CACHE['data'] = presets
    PRESETS_CACHE['timestamp'] = now
    return jsonify(presets)

@app.route('/api/proxy/image')
def proxy_image():
    """Proxy collection artwork from Plex via photo transcode (small, cacheable)."""
    global IMAGE_CACHE
    from urllib.parse import quote

    thumb = request.args.get('thumb')
    if not thumb:
        return Response(status=404)

    try:
        width = max(40, min(800, int(request.args.get('width') or 320)))
        height = max(40, min(1200, int(request.args.get('height') or 480)))
    except (TypeError, ValueError):
        width, height = 320, 480

    # If thumb is already a full URL, extract only the path
    if thumb.startswith('http'):
        from urllib.parse import urlparse
        parsed = urlparse(thumb)
        thumb = parsed.path

    thumb_path = thumb if thumb.startswith('/') else f'/{thumb}'
    # Drop any leftover querystring for the transcode url= param
    if '?' in thumb_path:
        thumb_path = thumb_path.split('?', 1)[0]

    cache_key = f'{thumb_path}|{width}x{height}'
    if cache_key in IMAGE_CACHE:
        cached = IMAGE_CACHE[cache_key]
        if cached.get('missing'):
            return Response(status=404)
        resp = Response(cached['data'], mimetype=cached['mimetype'], status=200)
        resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp

    config = load_config()
    url = config.get('plex_url')
    token = config.get('plex_token')
    if not url or not token:
        return Response(status=404)

    plex_base = url.rstrip('/')
    # Ask Plex for a resized JPEG — much faster than full-resolution thumbs.
    plex_url = (
        f"{plex_base}/photo/:/transcode"
        f"?url={quote(thumb_path)}"
        f"&width={width}&height={height}&minSize=1&upscale=1"
        f"&X-Plex-Token={token}"
    )

    try:
        headers = plex_request_headers(token, {
            'User-Agent': 'Server Manager Portal',
            'Accept': 'image/*,*/*',
        })
        upstream = requests.get(plex_url, timeout=8, verify=False, headers=headers)

        if upstream.status_code != 200 or not upstream.content:
            logging.warning(f"Plex image proxy miss {upstream.status_code} for: {thumb_path}")
            IMAGE_CACHE[cache_key] = {'missing': True}
            return Response(status=404)

        mimetype = upstream.headers.get('Content-Type', 'image/jpeg')
        data = upstream.content

        if len(IMAGE_CACHE) > 400:
            IMAGE_CACHE = {}

        IMAGE_CACHE[cache_key] = {'data': data, 'mimetype': mimetype}
        resp = Response(data, mimetype=mimetype, status=200)
        resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp
    except Exception as e:
        logging.warning(f"Image proxy exception for {thumb_path}: {e}")
        IMAGE_CACHE[cache_key] = {'missing': True}
        return Response(status=404)

@app.route('/api/collections/pin', methods=['POST'])
@require_auth
def pin_collection():
    data = request.json
    title = data.get('title')
    library_name = data.get('library')
    
    plex = get_plex_instance()
    config = load_config()
    label = config.get('collexions_label', 'Collexions')
    
    if not plex or not title or not library_name:
        return jsonify({"success": False, "error": "Invalid request"}), 400
        
    try:
        library = plex.library.section(library_name)
        collection = library.collection(title)
        
        # Add label
        collection.addLabel(label)
        
        # Pin
        hub = collection.visibility()
        hub.promoteHome()
        hub.promoteShared()
        
        # Log to collexions.log in the same format as the main script
        log_action(f"Pinned '{title}' successfully.")
        GALLERY_CACHE['data'] = None
        GALLERY_CACHE['timestamp'] = 0
        SUMMARY_CACHE['data'] = None
        SUMMARY_CACHE['timestamp'] = 0
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/jobs', methods=['GET'])
@require_auth
def get_jobs():
    managed = load_managed_collections()
    return jsonify(managed)

@app.route('/api/jobs/run', methods=['POST'])
@require_auth
def run_job_now():
    data = request.json
    job_id = data.get('id')
    if not job_id:
        return jsonify({"success": False, "error": "Missing job ID"}), 400
        
    try:
        run_sync_job(job_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/jobs/delete', methods=['POST'])
@require_auth
def delete_job():
    data = request.json
    job_id = data.get('id')
    if not job_id:
        return jsonify({"success": False, "error": "Missing job ID"}), 400
        
    managed = load_managed_collections()
    if job_id in managed:
        del managed[job_id]
        save_managed_collections(managed)
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Job not found"}), 404

@app.route('/api/collections/unpin', methods=['POST'])
@require_auth
def unpin_collection():
    data = request.json
    title = data.get('title')
    library_name = data.get('library')
    
    plex = get_plex_instance()
    config = load_config()
    label = config.get('collexions_label', 'Collexions')
    
    if not plex or not title or not library_name:
        return jsonify({"success": False, "error": "Invalid request"}), 400
        
    try:
        library = plex.library.section(library_name)
        collection = library.collection(title)
        
        # Remove label
        collection.removeLabel(label)
        
        # Unpin
        hub = collection.visibility()
        hub.demoteHome()
        hub.demoteShared()
        
        # Log to collexions.log in the same format as the main script
        log_action(f"Unpinned '{title}' successfully.")
        GALLERY_CACHE['data'] = None
        GALLERY_CACHE['timestamp'] = 0
        SUMMARY_CACHE['data'] = None
        SUMMARY_CACHE['timestamp'] = 0
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stop', methods=['POST'])
@require_auth
def stop_script():
    global process
    if process and process.poll() is None:
        process.terminate()
        return jsonify({"success": True})
    return jsonify({"error": "Script is not running"}), 400

@app.route('/api/collections/create', methods=['POST'])
@require_auth
def create_custom_collection():
    data = request.json
    library_name = data.get('library')
    title = data.get('title')
    item_keys = data.get('items', []) # List of ratingKeys
    sort_order = data.get('sort_order', 'custom') # 'custom', 'random', 'release'
    
    if not library_name or not title or not item_keys:
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    plex = get_plex_instance()
    config = load_config()
    label = config.get('collexions_label', 'Collexions')
    
    if not plex:
        return jsonify({"success": False, "error": "Plex connection failed"}), 500
        
    try:
        library = plex.library.section(library_name)
        # Fetch actual items by ratingKey
        items = []
        for key in item_keys:
            try:
                item = library.fetchItem(int(key))
                items.append(item)
            except:
                logging.warning(f"Could not find item with key {key} in library {library_name}")
                
        if not items:
            return jsonify({"success": False, "error": "No matching items found in library"}), 404
            
        # Create collection
        if sort_order == 'random':
            # Create a SMART collection for true persistent randomness
            collection = library.createCollection(
                title=title,
                smart=True,
                sort='random',
                filters={'id': item_keys}
            )
        else:
            # Regular collection for custom/release order
            collection = library.createCollection(title, items=items)
            if sort_order == 'release':
                try:
                    collection.sortUpdate('release')
                except Exception as e:
                    logging.warning(f"Failed to set release sort: {e}")
        
        # Add label with soft failure handling
        try:
            collection.addLabel(label)
        except Exception as e:
            logging.warning(f"Failed to set label: {e}")
        
        log_action(f"Created collection '{title}' with {len(items)} items in {library_name} (Sort: {sort_order}).")
        
        # Clear cache since library changed
        GALLERY_CACHE['data'] = None
        
        return jsonify({"success": True})
    except Exception as e:
        logging.error(f"Error creating collection: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/search/local')
@require_auth
def search_local():
    library_name = request.args.get('library')
    query = request.args.get('query', '')
    genre = request.args.get('genre')
    year = request.args.get('year')
    
    if not library_name:
        return jsonify([])
        
    plex = get_plex_instance()
    if not plex:
        return jsonify([])
        
    try:
        library = plex.library.section(library_name)
        
        # Build search params if filters are present
        search_params = {}
        if query: search_params['title'] = query
        if genre: search_params['genre'] = genre
        if year: search_params['year'] = year
        
        results = library.search(**search_params)
        
        items = []
        for item in results[:50]: # Increased limit for better selection
            items.append({
                'title': item.title,
                'year': item.year,
                'ratingKey': item.ratingKey,
                'thumb': item.thumb,
                'type': item.type
            })
            
        return jsonify(items)
    except Exception as e:
        logging.error(f"Local search error: {e}")
        return jsonify([])

@app.route('/api/search/external')
@require_auth
def search_external():
    config = load_config()
    tmdb_key = config.get('tmdb_api_key')
    query = request.args.get('query')
    media_type = request.args.get('type', 'movie') # 'movie' or 'tv'
    
    if not tmdb_key or not query:
        return jsonify([])
        
    try:
        url = f"https://api.themoviedb.org/3/search/{media_type}?api_key={tmdb_key}&query={query}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            results = resp.json().get('results', [])
            return jsonify([{
                'title': r.get('title') or r.get('name'),
                'year': (r.get('release_date') or r.get('first_air_date') or "")[:4],
                'id': r.get('id'),
                'poster': f"https://image.tmdb.org/t/p/w500{r.get('poster_path')}",
                'type': media_type
            } for r in results[:15]])
    except Exception as e:
        logging.error(f"External search error: {e}")
        
    return jsonify([])

@app.route('/api/tmdb/genres')
@require_auth
def get_tmdb_genres():
    config = load_config()
    tmdb_key = config.get('tmdb_api_key')
    media_type = request.args.get('type', 'movie')
    
    if not tmdb_key:
        return jsonify([])
        
    try:
        url = f"https://api.themoviedb.org/3/genre/{media_type}/list?api_key={tmdb_key}&language=en-US"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return jsonify(resp.json().get('genres', []))
    except Exception as e:
        logging.error(f"TMDB genres error: {e}")
        
    return jsonify([])

@app.route('/api/search/discover')
@require_auth
def search_discover():
    config = load_config()
    tmdb_key = config.get('tmdb_api_key')
    
    if not tmdb_key:
        return jsonify([])
        
    media_type = request.args.get('type', 'movie')
    
    year = request.args.get('year')
    year_mode = request.args.get('year_mode', 'exact')
    keywords_text = request.args.get('with_keywords')
    
    params = {
        'api_key': tmdb_key,
        'language': 'en-US',
        'page': request.args.get('page', 1)
    }

    if year:
        if year_mode == 'exact':
            params['primary_release_year' if media_type == 'movie' else 'first_air_date_year'] = year
        elif year_mode == 'before':
            params['primary_release_date.lte' if media_type == 'movie' else 'first_air_date.lte'] = f"{year}-12-31"
        elif year_mode == 'after':
            params['primary_release_date.gte' if media_type == 'movie' else 'first_air_date.gte'] = f"{year}-01-01"

    if keywords_text:
        keyword_ids = []
        for kw in [k.strip() for k in keywords_text.split(',')]:
            # Simple keyword search
            kw_url = f"https://api.themoviedb.org/3/search/keyword?api_key={tmdb_key}&query={kw}"
            try:
                kw_resp = requests.get(kw_url, timeout=5).json()
                if kw_resp.get('results'):
                    keyword_ids.append(str(kw_resp['results'][0]['id']))
            except: pass
        if keyword_ids:
            params['with_keywords'] = '|'.join(keyword_ids) # OR search

    optional_params = [
        'with_genres', 'with_networks', 'with_companies', 
        'vote_average.gte', 'vote_average.lte',
        'vote_count.gte', 'sort_by', 'with_original_language'
    ]
    
    for param in optional_params:
        val = request.args.get(param)
        if val:
            params[param] = val
            
    try:
        url = f"https://api.themoviedb.org/3/discover/{media_type}"
        all_items = []
        for page in range(1, 6): # Fetch up to 5 pages (100 items) for UI preview
            params['page'] = page
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get('results', [])
                for r in results:
                    all_items.append({
                        'title': r.get('title') or r.get('name'),
                        'year': (r.get('release_date') or r.get('first_air_date') or "")[:4],
                        'id': r.get('id'),
                        'poster': f"https://image.tmdb.org/t/p/w500{r.get('poster_path')}",
                        'type': media_type
                    })
                if page >= data.get('total_pages', 1): break
            else: break
            
        return jsonify(all_items)
    except Exception as e:
        logging.error(f"Discover error: {e}")
        
    return jsonify([])

@app.route('/api/collections/create-from-external', methods=['POST'])
@require_auth
def create_from_external():
    data = request.json
    library_name = data.get('library')
    title = data.get('title')
    external_items = data.get('items', []) # List of { id, title, type }
    sort_order = data.get('sort_order', 'custom')
    auto_sync = data.get('auto_sync', False)
    source_type = data.get('source_type') # e.g. 'trakt_trending_movie'
    source_id = data.get('source_id') # e.g. category id or trakt path
    
    if not library_name or not title or not external_items:
        return jsonify({"success": False, "error": "Missing fields"}), 400
        
    # Register for auto-sync if requested
    if auto_sync and source_type:
        managed = load_managed_collections()
        job_id = f"{library_name}_{title}".replace(' ', '_').lower()
        managed[job_id] = {
            "name": title,
            "library": library_name,
            "source_type": source_type,
            "source_id": source_id,
            "sort_order": sort_order,
            "auto_sync": True,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "last_run": "Never",
            "next_run": (datetime.now() + timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")
        }
        save_managed_collections(managed)
        log_action(f"Registered Auto-Sync job for '{title}' (Source: {source_type})")
        
    plex = get_plex_instance()
    if not plex:
        return jsonify({"success": False, "error": "Plex connection failed"}), 500
        
    try:
        library = plex.library.section(library_name)
        matched_items = []
        
        config = load_config()
        if source_type:
            try:
                full_items = fetch_source_items(source_type, source_id, config)
                if full_items:
                    external_items = full_items
                    logging.info(f"Overriding frontend items with full source fetch: got {len(full_items)} items")
            except Exception as e:
                logging.error(f"Failed to fetch upstream source items: {e}")
        
        logging.info(f"Caching library {library_name} for fast matching of {len(external_items)} items...")
        local_items_cache = {}
        for item in library.all():
            try:
                for guid in getattr(item, 'guids', []):
                    if 'tmdb' in guid.id:
                        tid = guid.id.split('tmdb://')[-1]
                        local_items_cache[tid] = item
            except:
                pass
                
        for ext in external_items:
            tmdb_id_val = ext.get('tmdb_id') or ext.get('id')
            if not tmdb_id_val: continue
            tmdb_id = str(tmdb_id_val)
            item_title = ext.get('title')
            
            local_item = local_items_cache.get(tmdb_id)
            if local_item:
                matched_items.append(local_item)
            else:
                logging.warning(f"Could not match external item: {item_title} (ID: {tmdb_id})")
                
        if not matched_items:
            return jsonify({"success": False, "error": "No items matched your local library"}), 404
            
        # Add label and sort with soft failure handling
        try:
            label = config.get('collexions_label', 'Collexions')
            
            if sort_order == 'random':
                # Create a SMART collection for true persistent randomness
                collection = library.createCollection(
                    title=title,
                    smart=True,
                    sort='random',
                    filters={'id': [itm.ratingKey for itm in matched_items]}
                )
            else:
                # Regular collection
                collection = library.createCollection(title, items=matched_items)
                if sort_order == 'release':
                    collection.sortUpdate('release')
            
            collection.addLabel(label)
        except Exception as e:
            logging.warning(f"Failed to create/set label on collection: {e}")
        
        log_action(f"Created external collection '{title}' with {len(matched_items)}/{len(external_items)} items matched (Sort: {sort_order}).")
        GALLERY_CACHE['data'] = None
        
        return jsonify({
            "success": True, 
            "matched": len(matched_items), 
            "total": len(external_items)
        })
    except Exception as e:
        logging.error(f"Error in create-from-external: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/trakt/list')
@require_auth
def get_trakt_list():
    config = load_config()
    trakt_id = config.get('trakt_client_id')
    url = request.args.get('url')
    
    if not trakt_id or not url:
        return jsonify({"error": "Missing Trakt ID or URL"}), 400
        
    try:
        # Simple regex/split to get user and slug from https://trakt.tv/users/[user]/lists/[slug]
        parts = url.strip().split('/')
        # find 'users' index
        try:
            u_idx = parts.index('users')
            username = parts[u_idx + 1]
            slug = parts[u_idx + 3]
        except:
             return jsonify({"error": "Invalid Trakt list URL format"}), 400

        headers = {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': trakt_id
        }
        api_url = f"https://api.trakt.tv/users/{username}/lists/{slug}/items"
        resp = requests.get(api_url, headers=headers, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            items = []
            for itm in data:
                m = itm.get('movie') or itm.get('show')
                if m:
                    tmdb_id = m.get('ids', {}).get('tmdb')
                    items.append({
                        'title': m.get('title'),
                        'year': m.get('year'),
                        'id': tmdb_id or m.get('ids', {}).get('trakt'),
                        'poster': get_tmdb_poster(tmdb_id, itm.get('type', 'movie')),
                        'type': itm.get('type')
                    })
            return jsonify(items)
        else:
            return jsonify({"error": f"Trakt API error: {resp.status_code}"}), 400
            
    except Exception as e:
        logging.error(f"Trakt list error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/mdblist/list')
@require_auth
def get_mdblist():
    config = load_config()
    api_key = config.get('mdblist_api_key')
    url = request.args.get('url')
    
    if not api_key:
        return jsonify({"error": "Missing MDBList API Key in Settings"}), 400
    if not url:
        return jsonify({"error": "Missing MDBList URL"}), 400
        
    try:
        # Example URL: https://mdblist.com/lists/mojoard_pk/super-cool-movies
        parts = [p for p in url.strip().split('/') if p]
        
        # Make sure it's a valid mdblist.com URL
        if 'mdblist.com' not in url.lower():
            return jsonify({"error": "Not a valid MDBList URL. Must be from mdblist.com"}), 400
            
        # Expecting at least 4 parts: ['https:', 'mdblist.com', 'lists', 'username']
        # The API endpoint is: api.mdblist.com/lists/[user]/[list]/items
        try:
            lists_idx = parts.index('lists')
            username = parts[lists_idx + 1]
            list_slug = parts[lists_idx + 2] if len(parts) > lists_idx + 2 else ""
        except ValueError:
            return jsonify({"error": "Could not parse username/list from URL."}), 400
            
        if not list_slug:
            return jsonify({"error": "URL seems to point to a user, not a specific list."}), 400
            
        api_url = f"https://api.mdblist.com/lists/{username}/{list_slug}/items/?apikey={api_key}"
        resp = requests.get(api_url, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            items = []
            for itm in data:
                # MDBList items usually have these fields directly
                items.append({
                    'title': itm.get('title'),
                    'year': str(itm.get('year', '')),
                    'id': itm.get('tmdb_id') or itm.get('id'), # Usually provides tmdb_id directly
                    'poster': get_tmdb_poster(itm.get('tmdb_id'), itm.get('mediatype', 'movie')),
                    'type': itm.get('mediatype', 'movie')
                })
            return jsonify(items)
        else:
            return jsonify({"error": f"MDBList API error: {resp.status_code} - {resp.text}"}), 400
            
    except Exception as e:
        logging.error(f"MDBList fetch error: {e}")
        return jsonify({"error": str(e)}), 500



# --- Auth Endpoints ---

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Checks if any admin password is set yet and if config is complete."""
    logging.debug(f"Loading config from: {CONFIG_FILE}")
    config = load_config()
    # Portal SSO mode: never require Collexions password setup.
    is_setup = True if (PORTAL_MODE or _service_key_ok()) else bool(config.get('admin_password_hash'))
    logging.debug(f"Auth status check: is_setup={is_setup}, has_hash={bool(config.get('admin_password_hash'))}, portal_mode={PORTAL_MODE}")
    
    # Check if Plex config is missing
    plex_url = config.get('plex_url')
    plex_token = config.get('plex_token')
    needs_onboarding = not (plex_url and plex_token)
    
    logging.debug(f"Needs onboarding: {needs_onboarding} (URL: {bool(plex_url)}, Token: {bool(plex_token)})")
    
    return jsonify({
        'is_setup': is_setup,
        'needs_onboarding': needs_onboarding,
        'portal_mode': bool(PORTAL_MODE or _service_key_ok()),
        'version': '1.1.0'
    })

@app.route('/api/auth/setup', methods=['POST'])
def auth_setup():
    """Sets the initial admin password."""
    config = load_config()
    if config.get('admin_password_hash'):
        return jsonify({'error': 'System already setup'}), 400
        
    password = request.json.get('password')
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
    if save_config({'admin_password_hash': generate_password_hash(password)}, merge=True):
        logging.info("Admin password hash set successfully.")
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to save configuration'}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Verifies password and issues JWT."""
    config = load_config()
    password = request.json.get('password')
    
    hash_val = config.get('admin_password_hash')
    if not hash_val:
        return jsonify({'error': 'System not setup'}), 400
        
    if check_password_hash(hash_val, password):
        token = jwt.encode({
            'user': 'admin',
            'exp': datetime.utcnow() + timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'username': 'Admin'
            }
        })
        
    return jsonify({'error': 'Invalid password'}), 401

@app.route('/api/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    """Updates the admin password."""
    config = load_config()
    current_password = request.json.get('currentPassword')
    new_password = request.json.get('newPassword')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Missing password fields'}), 400
        
    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400
        
    hash_val = config.get('admin_password_hash')
    if not check_password_hash(hash_val, current_password):
        return jsonify({'error': 'Current password incorrect'}), 401
        
    if save_config({'admin_password_hash': generate_password_hash(new_password)}, merge=True):
        logging.info("Admin password updated successfully.")
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to save configuration'}), 500

@app.route('/api/auth/verify', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'authenticated': False}), 401
    
    try:
        token = auth_header.split(' ')[1]
        jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({'authenticated': True})
    except:
        return jsonify({'authenticated': False}), 401



maybe_autostart_background_process()

# ─────────────────────────────────────────────────────────────────────────────
# Production static file serving
# When running in Docker, the React app is pre-built into dist/.
# In dev mode (no dist/ folder) the Vite dev server handles the frontend.
# ─────────────────────────────────────────────────────────────────────────────
if os.path.isdir(DIST_DIR):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        # Let Flask serve actual static assets (JS, CSS, images)
        full_path = os.path.join(DIST_DIR, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(DIST_DIR, path)
        # For everything else (client-side routes) return index.html
        return send_from_directory(DIST_DIR, 'index.html')


if __name__ == "__main__":
    print(f"Server starting...")
    print(f"Target Script: {SCRIPT_NAME}")
    print(f"Log File: {LOG_FILE}")
    print("Web UI API available at http://localhost:5000")
    
    # Create empty log file if it doesn't exist
    if not os.path.exists(LOG_FILE):
        ensure_dir_exists(LOG_FILE)
        with open(LOG_FILE, 'w') as f:
            f.write("Log file created.\n")

    # IMPORTANT: use_reloader=False prevents the server from restarting when files change
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
