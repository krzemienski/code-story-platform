#!/bin/bash
# Code Story Backend - Development Quick Start
# Run: ./scripts/dev.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Code Story Backend - Development Environment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check prerequisites
check_prereqs() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is required${NC}"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not found - Redis will need to run separately${NC}"
    fi

    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ Node.js/npx is required for repomix${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# Setup virtual environment
setup_venv() {
    echo -e "${YELLOW}Setting up virtual environment...${NC}"

    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    fi

    source venv/bin/activate
    pip install -q -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Start Redis (via Docker)
start_redis() {
    echo -e "${YELLOW}Starting Redis...${NC}"

    if docker ps | grep -q redis-code-story; then
        echo -e "${GREEN}✅ Redis already running${NC}"
    else
        docker run -d --name redis-code-story -p 6379:6379 redis:7-alpine 2>/dev/null || \
        docker start redis-code-story 2>/dev/null || true
        echo -e "${GREEN}✅ Redis started on port 6379${NC}"
    fi
}

# Start the API server
start_api() {
    echo -e "${YELLOW}Starting FastAPI server...${NC}"
    source venv/bin/activate

    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}⚠️  No .env file found. Copy .env.example to .env and configure.${NC}"
        exit 1
    fi

    echo -e "${GREEN}🚀 Starting API at http://localhost:8000${NC}"
    echo -e "${BLUE}   Docs: http://localhost:8000/docs${NC}"
    echo ""

    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

# Start Celery worker
start_worker() {
    echo -e "${YELLOW}Starting Celery worker...${NC}"
    source venv/bin/activate

    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}⚠️  No .env file found${NC}"
        exit 1
    fi

    echo -e "${GREEN}🔧 Starting Celery worker...${NC}"
    celery -A app.tasks.celery_app worker --loglevel=info --queues=story_generation --concurrency=2
}

# Start all services with Docker Compose
start_all() {
    echo -e "${YELLOW}Starting all services with Docker Compose...${NC}"

    if [ ! -f ".env" ]; then
        echo -e "${RED}⚠️  No .env file found. Copy .env.example to .env and configure.${NC}"
        exit 1
    fi

    docker compose up -d
    echo -e "${GREEN}✅ All services started${NC}"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo "  - API:    http://localhost:8000"
    echo "  - Docs:   http://localhost:8000/docs"
    echo "  - Redis:  localhost:6379"
    echo ""
    echo -e "${YELLOW}To view logs: docker compose logs -f${NC}"
}

# Stop all services
stop_all() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose down
    docker stop redis-code-story 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Show logs
show_logs() {
    docker compose logs -f
}

# Run validation
validate() {
    echo -e "${YELLOW}Running API validation...${NC}"
    ./scripts/validate.sh "${1:-http://localhost:8000}"
}

# Print usage
usage() {
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Install dependencies in virtual environment"
    echo "  redis     - Start Redis container"
    echo "  api       - Start FastAPI development server"
    echo "  worker    - Start Celery worker"
    echo "  start     - Start all services with Docker Compose"
    echo "  stop      - Stop all services"
    echo "  logs      - Show Docker Compose logs"
    echo "  validate  - Run API validation tests"
    echo "  help      - Show this help message"
    echo ""
    echo "Quick start:"
    echo "  1. cp .env.example .env"
    echo "  2. Configure your API keys in .env"
    echo "  3. ./scripts/dev.sh start"
    echo "  4. ./scripts/dev.sh validate"
}

# Main
print_header

case "${1:-help}" in
    setup)
        check_prereqs
        setup_venv
        ;;
    redis)
        start_redis
        ;;
    api)
        start_api
        ;;
    worker)
        start_worker
        ;;
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    logs)
        show_logs
        ;;
    validate)
        validate "$2"
        ;;
    help|*)
        usage
        ;;
esac
