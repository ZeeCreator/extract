# ZeroExtract API

REST API untuk ekstraksi dan proxy streaming video HLS dari berbagai provider anime streaming.

## Fitur

- **Ekstraksi** — extract URL m3u8 dari halaman embed StreamWish (eval-packed, JWPlayer)
- **Proxy HLS** — proxy playlist & segment dengan inject header Referer/Origin agar tidak 403
- **Custom Player** — player UI dengan hls.js, quality selector, progress bar, PiP, keyboard shortcuts
- **Embed Player** — player ringan untuk iframe
- **Cache In-Memory** — tanpa Redis, tanpa database
- **Rate Limit** — built-in per IP

## Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/extract?url=` | GET | Extract stream URL dari halaman embed |
| `/proxy?url=` | GET | Proxy HLS playlist & segment |
| `/player?url=` | GET | Custom player UI |
| `/embed?url=` | GET | Embeddable player (iframe) |
| `/health` | GET | Health check |

## Cara Pakai

```bash
# Install

npm install

# Jalankan

cp .env.example .env
npm start

# Buka player

http://localhost:3000/player?url=https://nekowish.my.id/e/CODE

# Embed di iframe

<iframe src="http://localhost:3000/embed?url=https://nekowish.my.id/e/CODE" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Fastify
- **HLS Client:** hls.js
- **HTTP Client:** Axios (keep-alive pool)
- **HTML Parser:** Cheerio

## Struktur

```
src/
├── config/        # Konfigurasi
├── cache/         # In-memory cache
├── middleware/    # Rate limiter dll
├── providers/    # Extractor per-provider (streamwish)
├── proxy/        # HLS proxy dengan header injection
├── routes/       # API routes (extract, proxy, player, embed)
├── utils/        # Unpacker, HLS parser, request helper
└── server.js     # Entry point
```

## Provider Support

- StreamWish (eval-packed + JWPlayer)
- Expandable via `src/providers/`

## License

MIT
