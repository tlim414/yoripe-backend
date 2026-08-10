# Clone backend repository
git clone [https://github.com/tlim414/yoripe-backend.git](https://github.com/tlim414/yoripe-backend.git)

cd yoripe-backend

# Install dependencies
pnpm install

# Set up environment variables (.env)
PORT = 5050

FRONTEND_URL="http://localhost:3000"

DATABASE_URL="postgresql://user:password@localhost:5432/yoripe"

DIRECT_URL="postgresql://postgres:password@localhost:5432/yoripe"

CLERK_PUBLISHABLE_KEY="your_clerk_public_key"

CLERK_SECRET_KEY="your_clerk_secret_key"

# Run database migrations
pnpm exec prisma migrate dev

# Start development server
pnpm dev
