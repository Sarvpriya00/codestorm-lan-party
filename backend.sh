npm install
# or if you prefer bun
# bun install

# Navigate to the backend directory
cd backend

# In the backend directory
npm install

# or if you prefer bun
cd backend

# Generate Prisma client (this is usually done automatically on npm install via postinstall script)
npm run postinstall
# or bun run postinstall

# Run database migrations
npm run migrate
# or bun run migrate

# Optionally, seed the database with initial data
npm run seed
# or bun run seed

# Build the backend TypeScript code
npm run build
# or bun run build

# Start the backend server
npm run start