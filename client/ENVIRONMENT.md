# Environment Configuration

This project uses environment variables to manage configuration between different environments (development, production).

## Available Environment Files

- `.env` - Base configuration (not committed to version control)
- `.env.development` - Development environment settings
- `.env.production` - Production environment settings

## Development Setup

1. Copy `.env.example` to `.env` (if you need to override any settings locally)
2. Run the development server:
   ```bash
   npm run dev
   ```

## Production Build

1. The production build will automatically use `.env.production`
2. Build the application:
   ```bash
   npm run build
   ```

## Environment Variables

| Variable | Description | Default (Development) |
|----------|-------------|----------------------|
| VITE_API_BASE_URL | Base URL for API requests | http://localhost:5000/api |
| VITE_APP_NAME | Application name | "Sturdy Memory (Local)" |
| VITE_ENABLE_ANALYTICS | Enable analytics | false |
| VITE_DEBUG_MODE | Enable debug mode | true |
| VITE_LOG_LEVEL | Logging level | debug |
| VITE_CHAPA_PUBLIC_KEY | Chapa payment public key | Test key |

## Adding New Variables

1. Add the variable to both `.env.development` and `.env.production`
2. Update `src/config/env.js` to include the new variable
3. Document the variable in this README

## Security Notes

- Never commit sensitive information in `.env` files
- The `.gitignore` is configured to exclude `.env` and `*.local` files
- Production secrets should be set in your hosting environment, not in version control
