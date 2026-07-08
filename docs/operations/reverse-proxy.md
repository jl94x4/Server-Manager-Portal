# Reverse Proxy

Run the app on an internal port and proxy HTTPS to it with Caddy, Nginx, Traefik, Cloudflare Tunnel, or a similar reverse proxy.

## Root Hosting

Root hosting is the simplest option.

```txt
portal.example.com {
    reverse_proxy localhost:2121
}
```

Use:

```ini
FORCE_SECURE_COOKIES=true
PUBLIC_BASE_URL=https://portal.example.com
```

## Subpath Hosting

The portal can run under a path such as `https://media.example.com/portal`.

```txt
media.example.com {
    handle /portal/* {
        reverse_proxy localhost:2121
    }
}
```

Use:

```ini
BASE_PATH=/portal
PUBLIC_BASE_URL=https://media.example.com/portal
FORCE_SECURE_COOKIES=true
```

`BASE_PATH` can be omitted when `PUBLIC_BASE_URL` already includes the path. The app derives the path from the public URL.

The proxy should forward requests with the path prefix intact. Do not strip `/portal` before requests reach the app.

## Cookie Notes

Only enable `FORCE_SECURE_COOKIES=true` when the public route is HTTPS. Leaving it enabled for plain HTTP LAN access prevents browsers from sending the session cookie.
