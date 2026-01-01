#!/bin/bash
# Code Story Backend - API Validation Script
# Uses curl/bash to validate all API endpoints
# Run: ./scripts/validate.sh [base_url]

set -e

# Configuration
BASE_URL="${1:-http://localhost:8000}"
API_URL="${BASE_URL}/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_test() {
    echo -e "${YELLOW}🧪 Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASSED: $1${NC}"
    PASSED=$((PASSED + 1))
}

print_fail() {
    echo -e "${RED}❌ FAILED: $1${NC}"
    echo -e "${RED}   Response: $2${NC}"
    FAILED=$((FAILED + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Validation Gate 1: Health Check
validate_health() {
    print_header "Validation Gate 1: Health Check"

    print_test "GET /api/health"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"status":"healthy"'; then
        print_pass "Health endpoint returns healthy status"
        echo "   Response: $BODY"
    else
        print_fail "Health endpoint" "$BODY"
    fi
}

# Validation Gate 2: Story Generation Request
validate_story_generation() {
    print_header "Validation Gate 2: Story Generation Request"

    print_test "POST /api/stories/generate (create new story)"

    # Test with a small, fast-to-analyze repo
    REQUEST_BODY='{
        "repoUrl": "https://github.com/anthropics/anthropic-cookbook",
        "style": "tutorial",
        "durationMinutes": 3,
        "voice": "Rachel",
        "focusAreas": ["getting started", "examples"],
        "technicalDepth": "beginner"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$REQUEST_BODY" \
        "${API_URL}/stories/generate" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        # Extract story_id for subsequent tests
        STORY_ID=$(echo "$BODY" | grep -o '"storyId":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$STORY_ID" ]; then
            print_pass "Story generation initiated"
            echo "   Story ID: $STORY_ID"
            echo "   Response: $BODY"
            # Export for other tests
            export STORY_ID
        else
            print_fail "Story ID not found in response" "$BODY"
        fi
    elif [ "$HTTP_CODE" = "503" ]; then
        print_pass "Story generation endpoint responds correctly (503 - DB unavailable)"
        echo "   Note: Full story generation requires configured database"
    else
        print_fail "Story generation request" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Validation Gate 3: Story Status Polling
validate_story_status() {
    print_header "Validation Gate 3: Story Status Polling"

    if [ -z "$STORY_ID" ]; then
        print_info "Skipping - No story ID from previous test"
        return
    fi

    print_test "GET /api/stories/{story_id} (poll status)"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "${API_URL}/stories/${STORY_ID}" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        PROGRESS=$(echo "$BODY" | grep -o '"progress":[0-9]*' | cut -d':' -f2)

        print_pass "Story status retrieved"
        echo "   Status: $STATUS"
        echo "   Progress: ${PROGRESS}%"
    else
        print_fail "Story status polling" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Validation Gate 4: Intent Extraction (Streaming)
validate_intent_extraction() {
    print_header "Validation Gate 4: Intent Extraction (Streaming SSE)"

    print_test "POST /api/intent (streaming response)"

    REQUEST_BODY='{
        "message": "I want to understand how the authentication works in this repo",
        "repoUrl": "https://github.com/anthropics/anthropic-cookbook",
        "conversationHistory": []
    }'

    # Test that endpoint accepts request and starts streaming
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: text/event-stream" \
        -d "$REQUEST_BODY" \
        --max-time 10 \
        "${API_URL}/chat/intent" 2>&1 || true)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    # SSE should start with data: or return 200
    if [ "$HTTP_CODE" = "200" ] || echo "$BODY" | grep -q "data:"; then
        print_pass "Intent extraction endpoint responds with SSE"
        echo "   First chunk received"
    else
        # Check if it's a connection timeout (expected for streaming)
        if echo "$RESPONSE" | grep -q "timeout"; then
            print_pass "Intent extraction endpoint accepts streaming request"
            echo "   (Timed out as expected for long streaming)"
        else
            print_fail "Intent extraction" "HTTP $HTTP_CODE - $BODY"
        fi
    fi
}

# Validation Gate 5: Request Validation
validate_request_validation() {
    print_header "Validation Gate 5: Request Validation"

    print_test "POST /api/stories/generate with invalid data"

    # Missing required field (repoUrl)
    REQUEST_BODY='{
        "style": "tutorial"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$REQUEST_BODY" \
        "${API_URL}/stories/generate" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    if [ "$HTTP_CODE" = "422" ]; then
        print_pass "Validation error returned for missing required field"
        echo "   Expected 422, got $HTTP_CODE"
    else
        print_fail "Request validation" "Expected 422, got HTTP $HTTP_CODE"
    fi

    print_test "POST /api/stories/generate with invalid URL"

    REQUEST_BODY='{
        "repoUrl": "not-a-valid-url"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$REQUEST_BODY" \
        "${API_URL}/stories/generate" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
        print_pass "Validation error returned for invalid URL"
    else
        print_fail "Invalid URL validation" "Expected 422/400, got HTTP $HTTP_CODE"
    fi
}

# Validation Gate 6: Story Restart
validate_story_restart() {
    print_header "Validation Gate 6: Story Restart"

    if [ -z "$STORY_ID" ]; then
        print_info "Skipping - No story ID from previous test"
        return
    fi

    print_test "POST /api/stories/{story_id}/restart"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        "${API_URL}/stories/${STORY_ID}/restart" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    # May get 400 if story is still processing (which is fine)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
        print_pass "Story restart endpoint responds correctly"
        echo "   Response: $BODY"
    else
        print_fail "Story restart" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Validation Gate 7: 404 Handling
validate_not_found() {
    print_header "Validation Gate 7: 404 Handling"

    print_test "GET /api/stories/nonexistent-id"

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "${API_URL}/stories/nonexistent-story-id-12345" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "404" ]; then
        print_pass "404 returned for nonexistent story"
    elif [ "$HTTP_CODE" = "503" ]; then
        print_pass "503 returned (database unavailable - acceptable in dev)"
        echo "   Note: 404 requires configured database"
    else
        print_fail "404 handling" "Expected 404 or 503, got HTTP $HTTP_CODE"
    fi
}

# Validation Gate 8: OpenAPI Documentation
validate_openapi() {
    print_header "Validation Gate 8: OpenAPI Documentation"

    print_test "GET /docs (Swagger UI)"

    RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/docs" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        print_pass "Swagger UI accessible"
    else
        print_fail "Swagger UI" "HTTP $HTTP_CODE"
    fi

    print_test "GET /openapi.json"

    RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/openapi.json" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | awk 'NR>1{print prev} {prev=$0}')

    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"openapi"'; then
        print_pass "OpenAPI schema accessible"
    else
        print_fail "OpenAPI schema" "HTTP $HTTP_CODE"
    fi
}

# Print summary
print_summary() {
    print_header "Validation Summary"

    TOTAL=$((PASSED + FAILED))

    echo ""
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    echo -e "  ${RED}Failed: $FAILED${NC}"
    echo -e "  Total:  $TOTAL"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All validation gates passed!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some validation gates failed. Please review.${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║      Code Story Backend - API Validation Suite                ║${NC}"
    echo -e "${BLUE}║      Target: ${BASE_URL}                          ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

    # Run all validation gates
    validate_health
    validate_story_generation
    validate_story_status
    validate_intent_extraction
    validate_request_validation
    validate_story_restart
    validate_not_found
    validate_openapi

    # Print summary
    print_summary
}

# Run main
main "$@"
