# Contributing to DMP 2026: Multi-tenant SaaS LMS

Thank you for your interest in contributing to this project! This guide will help you get started.

## Project Overview

This is an AI-powered Learning Management System with four main modules:

- **Module A**: Intelligent Document Ingestion (PDF/PPT)
- **Module B**: Automated Assessment Suite (Quiz Generation)
- **Module C**: Multimedia Intelligence (Video/Audio Transcription)
- **Module D**: AI Micro-Learning Studio (Content Creation)

## Getting Started

### 1. Setup Your Development Environment

#### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker and Docker Compose
- Git

#### Clone and Setup
```bash
git clone https://github.com/tekdi/shiksha-mfe.git
cd shiksha-mfe

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your configuration

# Start services
docker-compose up -d

# Install Node dependencies
npm install

# Install Python dependencies
cd c4gt-demo/backend
pip install -r requirements.txt
```

#### Verify Setup
```bash
# Check frontend
curl http://localhost:3000

# Check API Gateway
curl http://localhost:8000/health

# Check Ollama
curl http://localhost:11434/api/tags
```

### 2. Choose a Task

Look at `MODULE_CHECKLIST.md` to find incomplete tasks. Priority areas:

**High Priority:**
- [ ] Module C: Whisper transcription integration
- [ ] WebSocket/SSE for real-time updates
- [ ] Unified docker-compose configuration
- [ ] Module D: Micro-lesson builder UI

**Medium Priority:**
- [ ] Performance optimization (Module A)
- [ ] LaTeX/MathJax support (Module B)
- [ ] Moodle/Open edX compatibility testing
- [ ] Comprehensive test suite

**Good for Beginners:**
- [ ] Documentation improvements
- [ ] Bug fixes
- [ ] UI/UX enhancements
- [ ] Configuration updates

### 3. Create an Issue

Before starting work:

```markdown
**Title:** [MODULE] Brief description

**Description:**
- What needs to be done
- Why it's needed
- Acceptance criteria
- Related to issue #7

**Acceptance Criteria:**
- [ ] Specific measurable outcome 1
- [ ] Specific measurable outcome 2
- [ ] Specific measurable outcome 3

**Related:** Issue #7 (DMP 2026)
```

Link your issue to the main project issue #7.

### 4. Work on Your Task

#### Branch Naming
```bash
git checkout -b module-a/feature-name
git checkout -b module-b/fix-assessment-generation
git checkout -b fix/critical-bug
git checkout -b docs/api-reference
```

#### Code Style
- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript/React**: Follow ESLint config, use Prettier
- **Commit Messages**: Use conventional commits

```bash
# Python formatting
black c4gt-demo/backend/

# TypeScript formatting
npm run lint:fix
```

#### Commit Message Template
```
[MODULE] Brief description

Longer explanation of what changed and why.

- Point 1
- Point 2
- Point 3

Fixes #issue-number
Related to #7
```

### 5. Testing

Before submitting a PR, ensure:

```bash
# Python tests
cd c4gt-demo/backend
pytest tests/

# TypeScript tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
python -m pylint c4gt-demo/
```

### 6. Submit a Pull Request

**PR Template:**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Related Issues
Fixes #issue-number
Related to #7

## Changes Made
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Testing Done
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Manual testing completed
- [ ] No breaking changes

## Screenshots/Demos (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] Commit messages are clear
- [ ] No new warnings generated
```

## Development Guidelines

### Module A: Ingestion Service

**Location:** `c4gt-demo/backend/services/ingestion/`

**Key Files:**
- `app.py`: FastAPI routes
- `common/text_processing.py`: PDF/PPT parsing logic
- `common/models.py`: Data schemas

**Common Tasks:**
- Improve PDF/PPT parsing
- Optimize performance (target: ≤ 30s for 50-page docs)
- Add image extraction
- Implement table parsing

**Testing:**
```bash
# Upload a PDF
curl -X POST http://localhost:8001/upload \
  -F "file=@test.pdf"

# Check output
curl http://localhost:8001/job/{job_id}
```

### Module B: Assessment Service

**Location:** `c4gt-demo/backend/services/assessment/`

**Key Files:**
- `app.py`: Assessment API
- `common/text_processing.py`: Question generation
- `common/models.py`: Question schemas

**Recent Improvements:**
- MCQ: 5 → 15 questions
- Fill-in-blanks: 5 → 15 questions
- Match-pairs: 4 → 10 items
- Added semantic variety (5 question types)
- Better distractors from actual keywords

**Common Tasks:**
- Add LaTeX/MathJax support
- Implement question validation
- Test Moodle/Open edX compatibility
- Optimize generation time

**Testing:**
```bash
# Generate assessment
curl -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Assessment",
    "source_text": "Your content here..."
  }'
```

### Module C: Multimedia Service

**Location:** `c4gt-demo/backend/services/multimedia/`

**Key Files:**
- `app.py`: Multimedia API
- Service logic (TODO)

**Needed:**
- Whisper transcription integration
- Speaker diarisation
- Auto-chaptering
- VTT generation
- H5P Interactive Video packaging

**Testing:**
```bash
# Upload video
curl -X POST http://localhost:8003/transcribe \
  -F "file=@video.mp4"
```

### Module D: Micro-Learning Builder

**Location:** `mfes/workspace/src/pages/`

**Key Files:**
- Micro-lesson builder UI (TODO)
- Content publishing workflow (TODO)

**Needed:**
- HTML5/H5P/SCORM export UI
- Tenant branding system (PR #15)
- HITL review workflow
- xAPI tracking

### Frontend (Next.js/Nx)

**Location:** `mfes/workspace/src/`

**Structure:**
```
src/
├── pages/          # Next.js pages
├── components/     # Reusable components
├── utils/          # Utilities
├── hooks/          # Custom hooks
├── types/          # TypeScript types
└── services/       # API services
```

**Style:**
- Use TypeScript
- Functional components with hooks
- Styled components or Tailwind
- Accessibility (WCAG 2.1 AA)

## Code Review Process

1. **Automated Checks:**
   - Linting
   - Type checking
   - Tests must pass
   - No new warnings

2. **Manual Review:**
   - Code clarity and maintainability
   - Architecture alignment
   - Performance impact
   - Security considerations

3. **Approval:**
   - At least one maintainer approval
   - All conversations resolved
   - Ready to merge

## Performance Considerations

### Module A (Ingestion)
- Target: ≤ 30 seconds for 50-page document
- Parallelize chunk processing
- Use streaming for large files

### Module B (Assessment)
- Target MCQ generation: ≤ 5 seconds
- Use cached keyword extraction
- Batch process distractors

### Module C (Multimedia)
- Transcription: Real-time streaming
- Diarisation: Async background task
- Chaptering: Post-processing

### General
- Use async/await patterns
- Implement caching (Redis)
- Monitor memory usage
- Profile before optimization

## Security Guidelines

1. **Input Validation**
   - Validate all user inputs
   - Sanitize file uploads
   - Check file types and sizes

2. **Output Encoding**
   - HTML escape dynamic content
   - Properly encode API responses
   - Use Content-Security-Policy headers

3. **Authentication**
   - Verify JWT tokens
   - Implement rate limiting
   - Log security events

4. **Data Privacy**
   - Encrypt sensitive data
   - Implement access controls
   - Follow GDPR/data regulations

## Documentation

### Code Documentation
- Add docstrings to functions
- Comment complex logic
- Update README for new features

### API Documentation
- Document all endpoints
- Include request/response examples
- Document error codes

### User Documentation
- Setup instructions
- Configuration guide
- Troubleshooting tips

## Asking for Help

- **Discussions**: GitHub Discussions for questions
- **Issues**: Create issues for bugs and features
- **Code Review**: Ask reviewers for guidance

## Community

- Be respectful and inclusive
- Help others learn
- Share knowledge and experience
- Give constructive feedback

## License

All contributions must comply with the project license. By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
