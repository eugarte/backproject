# Security Configuration Files

# GitLeaks Configuration
gitleaks.toml:
  Use default configuration from GitLeaks
  
# Semgrep Configuration
.semgrep.yml:
  Custom rules for Node.js/TypeScript security
  
# Pre-commit hooks for security
.pre-commit-config.yaml:
  hooks:
    - id: gitleaks
    - id: eslint-security
    - id: npm-audit

# SonarQube exclusions
.sonarignore:
  node_modules/
  dist/
  coverage/
  test/
  *.test.ts
  *.spec.ts
  
# Trivy exclusions
.trivyignore:
  # Acceptable risks
  CVE-2023-XXXX  # Development dependency
