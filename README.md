# Nexus Ventures Mileage Form

A professional business mileage logbook application for Irish employees and directors.

## 🚀 Deployment Options

### Option 1: Nixpacks (Recommended)

This project is configured for Nixpacks deployment. Nixpacks will automatically detect your Node.js/Vite setup and create an optimized Docker image.

#### Deploy with Nixpacks:

```bash
# Install Nixpacks
npm install -g nixpacks

# Build the image
nixpacks build .

# Run the container
docker run -p 4173:4173 <image-name>
```

### Option 2: VPS Deployment

#### Using Docker Compose:

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your actual values
nano .env

# Deploy with Docker Compose
docker-compose up -d
```

#### Manual VPS Deployment:

```bash
# Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Traditional Hosting

Simply open [Lovable](https://lovable.dev/projects/09dd6b8d-6651-4a29-ad95-825344cc34ea) and click on Share -> Publish.

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_POCKETBASE_URL=http://your-pocketbase-server:8090
RESEND_API_KEY=your-resend-api-key-here
NODE_ENV=production
```

## 🛠️ Technologies Used

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: PocketBase
- **Email**: Resend API
- **Deployment**: Nixpacks/Docker

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security Notes

- The Resend API key is exposed in client-side code for demo purposes
- For production, consider moving email sending to a server-side endpoint
- Configure proper CORS and security headers for your deployment

## 📄 License

This project is private and proprietary to Nexus Ventures.
