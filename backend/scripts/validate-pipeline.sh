#!/bin/bash
# =============================================================================
# Code Story Backend - Phase 2: Pipeline Validation Script
# =============================================================================
#
# This script validates the complete 4-agent story generation pipeline using
# a real GitHub repository. It monitors progress through each agent stage
# and verifies the final audio output.
#
# Usage:
#   ./scripts/validate-pipeline.sh [BASE_URL]
#
# Example:
#   ./scripts/validate-pipeline.sh http://localhost:8000
#
# =============================================================================

set -e

BASE_URL="${1:-http://localhost:8000}"
REPO_URL="https://github.com/anthropics/anthropic-cookbook"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_gate() {
    echo -e "\n${CYAN}───────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}  Gate 2.$1: $2${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────${NC}"
}

print_progress() {
    echo -e "${YELLOW}  ⏳ Progress: $1% | Phase: $2${NC}"
}

print_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
}

print_error() {
    echo -e "${RED}  ❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

# =============================================================================
# Main Validation Script
# =============================================================================

print_header "Code Story Pipeline Validation - Phase 2"
echo -e "${BLUE}  Target:     ${NC}${BASE_URL}"
echo -e "${BLUE}  Repository: ${NC}${REPO_URL}"
echo -e "${BLUE}  Started:    ${NC}$(date)"

# -----------------------------------------------------------------------------
# Gate 2.1: Story Creation
# -----------------------------------------------------------------------------
print_gate 1 "Story Creation & Pipeline Initiation"

echo -e "${YELLOW}  🧪 Submitting generation request...${NC}"

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/stories/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"repoUrl\": \"${REPO_URL}\",
    \"style\": \"tutorial\",
    \"durationMinutes\": 3,
    \"voice\": \"Rachel\",
    \"focusAreas\": [\"getting started\", \"examples\"],
    \"technicalDepth\": \"beginner\"
  }")

STORY_ID=$(echo $RESPONSE | jq -r '.storyId // .story_id // empty')

if [ -z "$STORY_ID" ] || [ "$STORY_ID" = "null" ]; then
    print_error "FAILED: No story ID returned"
    echo "Response: $RESPONSE"
    exit 1
fi

print_success "Story created: $STORY_ID"

# -----------------------------------------------------------------------------
# Gate 2.2: Intent Agent
# -----------------------------------------------------------------------------
print_gate 2 "Intent Agent (Extract user intent)"

TIMEOUT=90
ELAPSED=0
TARGET_PROGRESS=15

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(curl -s "${BASE_URL}/api/stories/${STORY_ID}")
    PROGRESS=$(echo $STATUS | jq -r '.progress // 0')
    PHASE=$(echo $STATUS | jq -r '.currentPhase // .current_phase // "unknown"')
    STORY_STATUS=$(echo $STATUS | jq -r '.status // "unknown"')

    print_progress "$PROGRESS" "$PHASE"

    if [ "$STORY_STATUS" = "failed" ]; then
        ERROR=$(echo $STATUS | jq -r '.error // "Unknown error"')
        print_error "Pipeline failed: $ERROR"
        exit 1
    fi

    if [ "$PROGRESS" -ge $TARGET_PROGRESS ]; then
        print_success "Intent extraction complete (${PROGRESS}%)"
        break
    fi

    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    print_error "FAILED: Intent agent timeout (${TIMEOUT}s)"
    exit 1
fi

# -----------------------------------------------------------------------------
# Gate 2.3: Analyzer Agent (RepoMix)
# -----------------------------------------------------------------------------
print_gate 3 "Analyzer Agent (RepoMix repository analysis)"

TIMEOUT=300  # 5 minutes for large repos
ELAPSED=0
TARGET_PROGRESS=50

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(curl -s "${BASE_URL}/api/stories/${STORY_ID}")
    PROGRESS=$(echo $STATUS | jq -r '.progress // 0')
    PHASE=$(echo $STATUS | jq -r '.currentPhase // .current_phase // "unknown"')
    STORY_STATUS=$(echo $STATUS | jq -r '.status // "unknown"')

    print_progress "$PROGRESS" "$PHASE"

    if [ "$STORY_STATUS" = "failed" ]; then
        ERROR=$(echo $STATUS | jq -r '.error // "Unknown error"')
        print_error "Pipeline failed: $ERROR"
        exit 1
    fi

    if [ "$PROGRESS" -ge $TARGET_PROGRESS ]; then
        print_success "Repository analysis complete (${PROGRESS}%)"
        break
    fi

    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    print_error "FAILED: Analyzer agent timeout (${TIMEOUT}s)"
    exit 1
fi

# -----------------------------------------------------------------------------
# Gate 2.4: Architect Agent
# -----------------------------------------------------------------------------
print_gate 4 "Architect Agent (Script creation)"

TIMEOUT=180  # 3 minutes
ELAPSED=0
TARGET_PROGRESS=70

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(curl -s "${BASE_URL}/api/stories/${STORY_ID}")
    PROGRESS=$(echo $STATUS | jq -r '.progress // 0')
    PHASE=$(echo $STATUS | jq -r '.currentPhase // .current_phase // "unknown"')
    STORY_STATUS=$(echo $STATUS | jq -r '.status // "unknown"')

    print_progress "$PROGRESS" "$PHASE"

    if [ "$STORY_STATUS" = "failed" ]; then
        ERROR=$(echo $STATUS | jq -r '.error // "Unknown error"')
        print_error "Pipeline failed: $ERROR"
        exit 1
    fi

    if [ "$PROGRESS" -ge $TARGET_PROGRESS ]; then
        print_success "Script creation complete (${PROGRESS}%)"
        break
    fi

    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    print_error "FAILED: Architect agent timeout (${TIMEOUT}s)"
    exit 1
fi

# -----------------------------------------------------------------------------
# Gate 2.5: Voice Agent + Audio Generation
# -----------------------------------------------------------------------------
print_gate 5 "Voice Agent + Audio Generation"

TIMEOUT=300  # 5 minutes for audio synthesis
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(curl -s "${BASE_URL}/api/stories/${STORY_ID}")
    PROGRESS=$(echo $STATUS | jq -r '.progress // 0')
    PHASE=$(echo $STATUS | jq -r '.currentPhase // .current_phase // "unknown"')
    STORY_STATUS=$(echo $STATUS | jq -r '.status // "unknown"')

    print_progress "$PROGRESS" "$PHASE"

    if [ "$STORY_STATUS" = "completed" ]; then
        AUDIO_URL=$(echo $STATUS | jq -r '.audioUrl // .audio_url // empty')
        print_success "Story generation complete!"
        break
    fi

    if [ "$STORY_STATUS" = "failed" ]; then
        ERROR=$(echo $STATUS | jq -r '.error // "Unknown error"')
        print_error "Pipeline failed: $ERROR"
        exit 1
    fi

    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    print_error "FAILED: Audio generation timeout (${TIMEOUT}s)"
    exit 1
fi

# -----------------------------------------------------------------------------
# Audio Verification
# -----------------------------------------------------------------------------
print_header "Audio Verification"

if [ -z "$AUDIO_URL" ] || [ "$AUDIO_URL" = "null" ]; then
    print_error "No audio URL in response"
    exit 1
fi

print_info "Audio URL: $AUDIO_URL"

echo -e "${YELLOW}  🔊 Verifying audio file accessibility...${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$AUDIO_URL")

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Audio file accessible (HTTP 200)"
else
    print_error "Audio not accessible (HTTP $HTTP_CODE)"
    exit 1
fi

# Check content type
echo -e "${YELLOW}  🔊 Verifying audio content type...${NC}"
CONTENT_TYPE=$(curl -sI "$AUDIO_URL" | grep -i "content-type" | head -1)

if echo "$CONTENT_TYPE" | grep -qi "audio"; then
    print_success "Valid audio content type"
    print_info "$CONTENT_TYPE"
else
    print_error "Invalid content type (not audio)"
    print_info "$CONTENT_TYPE"
    exit 1
fi

# Check file size
echo -e "${YELLOW}  🔊 Checking audio file size...${NC}"
CONTENT_LENGTH=$(curl -sI "$AUDIO_URL" | grep -i "content-length" | head -1 | awk '{print $2}' | tr -d '\r')

if [ -n "$CONTENT_LENGTH" ] && [ "$CONTENT_LENGTH" -gt 100000 ]; then
    SIZE_MB=$(echo "scale=2; $CONTENT_LENGTH / 1048576" | bc)
    print_success "Audio file size: ${SIZE_MB} MB"
else
    print_error "Audio file too small or size unknown"
    print_info "Content-Length: $CONTENT_LENGTH"
fi

# =============================================================================
# Summary
# =============================================================================
print_header "🎉 PHASE 2 VALIDATION COMPLETE"

echo -e "${GREEN}  All 5 gates passed successfully!${NC}"
echo ""
echo -e "${BLUE}  Story ID:   ${NC}${STORY_ID}"
echo -e "${BLUE}  Audio URL:  ${NC}${AUDIO_URL}"
echo -e "${BLUE}  Completed:  ${NC}$(date)"
echo ""
echo -e "${CYAN}  Next Steps:${NC}"
echo -e "${NC}    1. Open the Audio URL in a browser to listen${NC}"
echo -e "${NC}    2. Proceed to Phase 3: E2E Browser Validation${NC}"
echo ""
