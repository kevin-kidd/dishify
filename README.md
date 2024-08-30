# Dishify

![GitHub license](https://img.shields.io/github/license/kevin-kidd/dishify)
![Expo SDK version](https://img.shields.io/badge/Expo%20SDK-49.0.16-blue)
![Next.js version](https://img.shields.io/badge/Next.js-14.2.7-blue)
![React Native version](https://img.shields.io/badge/React%20Native-0.74.3-blue)
![Tailwind CSS version](https://img.shields.io/badge/Tailwind%20CSS-3.0.24-blue)
![tRPC version](https://img.shields.io/badge/tRPC-10.43.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-3.22.3-orange)
![Next.js Deployment](https://github.com/kevin-kidd/dishify/actions/workflows/next.yml/badge.svg)
![Backend Deployment](https://github.com/kevin-kidd/dishify/actions/workflows/backend.yml/badge.svg)
![Expo Deployment](https://github.com/kevin-kidd/dishify/actions/workflows/expo.yml/badge.svg)

Dishify is your AI-powered culinary companion. Enter any dish name for instant recipes, ingredient lists, and smart shopping links. Elevate your cooking with personalized instructions and effortless grocery planning.

## Features

- Instant recipe generation for any dish
- Detailed ingredient lists
- Smart shopping links
- Personalized cooking instructions
- Effortless grocery planning
- Cross-platform support (Web, iOS, Android)

## Tech Stack

- [Next.js](https://nextjs.org/) for web application
- [Expo](https://expo.dev/) for mobile applications
- [React Native](https://reactnative.dev/) for cross-platform development
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [tRPC](https://trpc.io/) for type-safe API communication
- [Cloudflare Workers](https://workers.cloudflare.com/) for serverless backend with [Hono](https://hono.dev/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for database
- [Supabase](https://supabase.com/) for authentication

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) package manager
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kevin-kidd/dishify.git
   cd dishify
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values

4. Run the development server:
   - For web:

     ```bash
     bun run web
     ```

   - For mobile:

     ```bash
     bun run native
     ```

## Project Structure

- `apps/`
  - `expo/`: Expo mobile app
  - `next/`: Next.js web app
- `packages/`
  - `api/`: Backend API and database schema
  - `app/`: Shared application logic
  - `ui/`: Shared UI components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Fernando Rojo](https://twitter.com/fernandotherojo) for Solito
- [Mark Lawlor](https://twitter.com/mark__lawlor) for NativeWind
- [Timothy Miller](https://github.com/timothymiller) for T4 Stack
