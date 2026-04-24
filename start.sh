#!/bin/bash

# AI Fitness Coach - Startup Script
# This script cleans up ports, sets up database, seeds data, and starts the application

set -e

echo "========================================"
echo "   AI Fitness Coach - Startup Script   "
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to project directory
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
print_status "Project directory: $PROJECT_DIR"

# Step 1: Clean up ports
echo ""
print_status "Step 1: Cleaning up used ports..."

# Kill processes on port 3000 (React)
if lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Port 3000 is in use, killing process..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    print_success "Port 3000 freed"
else
    print_status "Port 3000 is available"
fi

# Kill processes on port 3001 (Express API)
if lsof -ti:3001 > /dev/null 2>&1; then
    print_warning "Port 3001 is in use, killing process..."
    kill -9 $(lsof -ti:3001) 2>/dev/null || true
    print_success "Port 3001 freed"
else
    print_status "Port 3001 is available"
fi

# Step 2: Check for .env file
echo ""
print_status "Step 2: Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_status "Creating .env file from template..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_fitness_coach
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_fitness_coach
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# JWT Configuration
JWT_SECRET=ai_fitness_coach_secret_key_2024
EOF
    print_warning "Please update .env with your OpenRouter API key!"
else
    print_success ".env file found"
fi

# Step 3: Install dependencies
echo ""
print_status "Step 3: Installing dependencies..."

# Install root dependencies
print_status "Installing server dependencies..."
npm install --silent

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install --silent
cd ..

print_success "All dependencies installed"

# Step 4: Setup database
echo ""
print_status "Step 4: Setting up database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_error "PostgreSQL is not running!"
    print_status "Please start PostgreSQL and run this script again."
    print_status "On macOS: brew services start postgresql"
    print_status "On Linux: sudo systemctl start postgresql"
    exit 1
fi

print_success "PostgreSQL is running"

# Run database setup
print_status "Creating database and tables..."
node server/setupDb.js

print_success "Database setup complete"

# Step 5: Seed data
echo ""
print_status "Step 5: Seeding database with sample data..."

node server/seed.js

print_success "Database seeded with sample data"

# Step 6: Start the application with hot reload
echo ""
print_status "Step 6: Starting application with hot reload..."
echo ""
echo "========================================"
echo "   Application Starting...             "
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "Demo Credentials:"
echo "  Email:    demo@aifitness.com"
echo "  Password: password123"
echo ""
echo "Press Ctrl+C to stop the application"
echo "========================================"
echo ""

# Start both server and client with hot reload using concurrently
npm start
