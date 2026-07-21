"""
Stable Plex client identity for Collexions.

Without this, plexapi defaults X-Plex-Device-Name to the machine hostname
(Docker container ID) and X-Plex-Device to the OS, which produces Plex
"New Device" alerts like "ca97631ecbb1 (Linux)" on every container recreate.
"""
import logging
import os
import uuid

PRODUCT = 'Server Manager Portal'
DEVICE = 'Server'
DEVICE_NAME = 'Server Manager Portal'
PLATFORM = 'Server Manager Portal'

_configured = False
_client_id = None


def _persist_path():
    data_root = (os.environ.get('COLLEXIONS_DATA_DIR') or '').strip()
    if not data_root:
        data_root = os.path.dirname(os.path.abspath(__file__))
    cfg_dir = os.path.join(data_root, 'config')
    os.makedirs(cfg_dir, exist_ok=True)
    return os.path.join(cfg_dir, 'plex_client_id')


def get_client_id():
    """Stable client identifier shared with the portal when possible."""
    global _client_id
    if _client_id:
        return _client_id

    for key in ('PLEX_CLIENT_IDENTIFIER', 'CLIENT_ID', 'COLLEXIONS_PLEX_CLIENT_ID'):
        val = (os.environ.get(key) or '').strip()
        if val:
            _client_id = val
            return _client_id

    path = _persist_path()
    try:
        if os.path.isfile(path):
            stored = open(path, 'r', encoding='utf-8').read().strip()
            if stored:
                _client_id = stored
                return _client_id
    except OSError:
        pass

    _client_id = str(uuid.uuid4())
    try:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(_client_id)
    except OSError as e:
        logging.warning('Could not persist Collexions plex client id: %s', e)
    return _client_id


def configure_plex_identity(force=False):
    """Patch plexapi globals so every PlexServer() call uses our identity."""
    global _configured
    client_id = get_client_id()
    if _configured and not force:
        return client_id

    try:
        import plexapi

        plexapi.X_PLEX_PRODUCT = PRODUCT
        plexapi.X_PLEX_DEVICE = DEVICE
        plexapi.X_PLEX_DEVICE_NAME = DEVICE_NAME
        plexapi.X_PLEX_PLATFORM = PLATFORM
        plexapi.X_PLEX_IDENTIFIER = client_id
        plexapi.BASE_HEADERS = plexapi.reset_base_headers()
        _configured = True
        logging.info(
            'Plex identity configured: product=%s clientId=%s…',
            PRODUCT,
            client_id[:8],
        )
    except Exception as e:
        logging.warning('Could not configure plexapi identity: %s', e)

    return client_id


def plex_request_headers(token='', extra=None):
    """Headers for raw requests.get/post to PMS (non-plexapi paths)."""
    configure_plex_identity()
    headers = {
        'Accept': 'application/json',
        'X-Plex-Product': PRODUCT,
        'X-Plex-Device': DEVICE,
        'X-Plex-Device-Name': DEVICE_NAME,
        'X-Plex-Platform': PLATFORM,
        'X-Plex-Client-Identifier': get_client_id(),
        'X-Plex-Provides': 'controller',
    }
    if token:
        headers['X-Plex-Token'] = str(token)
    if extra:
        headers.update(extra)
    return headers
