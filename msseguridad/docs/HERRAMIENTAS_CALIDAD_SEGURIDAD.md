# 🔒 CONTROL DE CALIDAD Y SEGURIDAD EN EL DESARROLLO DE SOFTWARE

## 📋 ÍNDICE
1. [SonarQube - Instalación y Configuración](#1-sonarqube)
2. [Alternativas Open Source a Veracode](#2-alternativas-a-veracode)
3. [Generación Automática de Tests Unitarios](#3-generación-automática-de-tests)
4. [Frameworks de Pruebas Automatizadas](#4-frameworks-de-pruebas)
5. [Herramientas DevOps para CI/CD](#5-herramientas-devops)
6. [Integración Completa en Pipeline](#6-integración-en-pipeline)

---

## 1. SONARQUBE

### 1.1 ¿Qué es SonarQube?

SonarQube es una plataforma open-source para inspección continua de la calidad del código. Realiza análisis estático para detectar:
- **Bugs** y vulnerabilidades de seguridad
- **Code smells** (malas prácticas)
- **Deuda técnica** estimada
- **Cobertura de tests**
- **Duplicación de código**

### 1.2 Instalación con Docker (Recomendado)

```yaml
# docker-compose.yml
version: "3"

services:
  sonarqube:
    image: sonarqube:community
    depends_on:
      - db
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    ports:
      - "9000:9000"

  db:
    image: postgres:13
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - postgresql_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgresql_data:
```

```bash
# Ejecutar
sudo sysctl -w vm.max_map_count=524288
docker-compose up -d

# Acceder: http://localhost:9000
# Credenciales por defecto: admin / admin
```

### 1.3 Instalación en Kubernetes

```yaml
# sonarqube-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonarqube
  namespace: sonarqube
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sonarqube
  template:
    metadata:
      labels:
        app: sonarqube
    spec:
      containers:
      - name: sonarqube
        image: sonarqube:community
        ports:
        - containerPort: 9000
        env:
        - name: SONAR_JDBC_URL
          value: "jdbc:postgresql://postgres:5432/sonar"
        - name: SONAR_JDBC_USERNAME
          value: "sonar"
        - name: SONAR_JDBC_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sonar-db-secret
              key: password
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: sonarqube
  namespace: sonarqube
spec:
  selector:
    app: sonarqube
  ports:
  - port: 9000
    targetPort: 9000
  type: LoadBalancer
```

### 1.4 Configuración de Proyectos

```bash
# SonarScanner para proyectos Maven
mvn clean verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=TOKEN_AQUI

# SonarScanner CLI
docker run --rm \
  -e SONAR_HOST_URL="http://localhost:9000" \
  -e SONAR_LOGIN="TOKEN_AQUI" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli

# Para Gradle
./gradlew sonarqube \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=TOKEN_AQUI
```

### 1.5 Configuración sonar-project.properties

```properties
# sonar-project.properties
sonar.projectKey=mi-proyecto
sonar.projectName=Mi Proyecto Seguro
sonar.projectVersion=1.0
sonar.sources=src
sonar.language=java
sonar.sourceEncoding=UTF-8

# Exclusiones
sonar.exclusions=**/target/**,**/node_modules/**

# Cobertura de tests
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml

# Análisis de dependencias
sonar.dependencyCheck.reportPath=target/dependency-check-report.xml
```

---

## 2. ALTERNATIVAS OPEN SOURCE A VERACODE

Veracode es una plataforma SAST/DAST/SCA comercial. Estas son las mejores alternativas OSS:

### 2.1 Snyk (Freemium con capa OSS)

```bash
# Instalación
npm install -g snyk

# Autenticación
snyk auth

# Análisis de dependencias
snyk test

# Análisis de container
snyk container test nginx:latest

# Análisis de IaC
snyk iac test terraform/

# Monitor continuo
snyk monitor
```

**Características:**
- ✅ Detección de vulnerabilidades en dependencias
- ✅ Análisis de contenedores
- ✅ SAST básico
- ✅ IaC scanning
- ✅ Integración GitHub/GitLab

### 2.2 OWASP Dependency-Check

```bash
# Instalación CLI
wget https://github.com/jeremylong/DependencyCheck/releases/download/v8.4.0/dependency-check-8.4.0-release.zip
unzip dependency-check-8.4.0-release.zip

# Ejecución
./dependency-check/bin/dependency-check.sh \
  --project "Mi Proyecto" \
  --scan ./target \
  --format ALL \
  --out ./reports

# Docker
docker run --rm \
  -v $(pwd):/src \
  -v $(pwd)/reports:/reports \
  owasp/dependency-check \
  --project "Mi Proyecto" \
  --scan /src \
  --out /reports
```

**Integración Maven:**
```xml
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>8.4.0</version>
  <configuration>
    <failBuildOnCVSS>7</failBuildOnCVSS>
    <suppressionFiles>
      <suppressionFile>owasp-suppressions.xml</suppressionFile>
    </suppressionFiles>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>check</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### 2.3 Semgrep

```bash
# Instalación
pip install semgrep

# Análisis básico
semgrep --config=auto .

# Reglas específicas de seguridad
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .

# Reglas personalizadas
semgrep --config=reglas-personalizadas.yml .

# Salida JSON para CI/CD
semgrep --json --output=semgrep-report.json .
```

**Ejemplo reglas personalizadas (semgrep.yml):**
```yaml
rules:
  - id: no-hardcoded-secrets
    pattern-regex: (?i)(password|passwd|pwd|secret|key|token)\s*=\s*['"][^'"]+['"]
    languages:
      - python
      - java
      - javascript
    message: "Posible secreto hardcodeado detectado"
    severity: ERROR
```

### 2.4 Bandit (Python)

```bash
pip install bandit

# Análisis básico
bandit -r ./src

# Salida detallada
bandit -r ./src -f json -o bandit-report.json

# Incluir tests de baja severidad
bandit -r ./src -ll
```

### 2.5 SpotBugs + FindSecBugs (Java)

```xml
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.7.3.0</version>
  <configuration>
    <plugins>
      <plugin>
        <groupId>com.h3xstream.findsecbugs</groupId>
        <artifactId>findsecbugs-plugin</artifactId>
        <version>1.12.0</version>
      </plugin>
    </plugins>
  </configuration>
</plugin>
```

### 2.6 Trivy (Container & Filesystem)

```bash
# Instalación
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh

# Análisis de imagen Docker
trivy image nginx:latest

# Análisis de filesystem
trivy filesystem .

# Análisis de repositorio Git
trivy repo https://github.com/usuario/repo

# Análisis de infraestructura como código
trivy config terraform/

# Salida SARIF para GitHub
trivy image --format sarif --output trivy-report.sarif nginx:latest
```

### 2.7 Grype (Anchore)

```bash
# Instalación
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh

# Análisis SBOM
grype sbom:sbom.json

# Análisis de imagen Docker
grype nginx:latest

# Análisis con reglas de severidad
grype nginx:latest --fail-on high
```

### 2.8 ZAP (OWASP Zed Attack Proxy) - DAST

```bash
# Docker scan básico
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://mi-aplicacion.com

# Scan completo
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable zap-full-scan.py \
  -t https://mi-aplicacion.com \
  -g gen.conf \
  -r zap-report.html

# API scan
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://mi-api.com/openapi.json \
  -f openapi
```

---

## 3. GENERACIÓN AUTOMÁTICA DE TESTS UNITARIOS

### 3.1 GitHub Copilot / Copilot Chat

**Características:**
- Genera tests basados en código existente
- Soporta JUnit, pytest, Jest, Mocha, etc.
- Integración IDE (VS Code, IntelliJ, Neovim)

```java
// Ejemplo: Seleccionar método y pedir "Generate tests"
// Copilot genera:

@Test
public void testCalculateDiscount_ValidInput_ReturnsDiscountedPrice() {
    // Arrange
    double price = 100.0;
    double discount = 0.2;
    
    // Act
    double result = calculator.calculateDiscount(price, discount);
    
    // Assert
    assertEquals(80.0, result, 0.01);
}

@Test(expected = IllegalArgumentException.class)
public void testCalculateDiscount_NegativePrice_ThrowsException() {
    calculator.calculateDiscount(-100.0, 0.2);
}
```

### 3.2 CodiumAI / Codiumate

```bash
# Instalación VS Code extension
# Comando: Ctrl+Shift+P -> CodiumAI: Generate Tests
```

**Ventajas:**
- Análisis de comportamiento del código
- Sugerencias de edge cases
- Explicación de qué testear

### 3.3 Diffblue Cover (Java)

```bash
# CLI
wget https://www.diffblue.com/wp-content/uploads/diffblue-cover-cli.zip
unzip diffblue-cover-cli.zip

# Generar tests
./dcover create --classpath=target/classes:target/test-classes \
  com.miempresa.mipackage.MiClase

# Para proyecto completo
./dcover create --batch-mode .
```

### 3.4 Ponicode (ahora part of CircleCI)

Extensión VS Code que genera tests unitarios con un click.

### 3.5 EvoSuite (Java - Generación evolutiva)

```bash
# Maven plugin
mvn evosuite:generate
mvn evosuite:export
```

```xml
<plugin>
  <groupId>org.evosuite.plugins</groupId>
  <artifactId>evosuite-maven-plugin</artifactId>
  <version>1.0.6</version>
</plugin>
```

### 3.6 Pynguin (Python)

```bash
pip install pynguin

# Generar tests
pynguin --project-path ./src \
  --module-name mi_modulo \
  --output-path ./tests
```

### 3.7 Randoop (Java)

```bash
java -cp randoop-all.jar randoop.main.Main gentests \
  --testclass=java.util.TreeSet \
  --time-limit=60
```

---

## 4. FRAMEWORKS DE PRUEBAS AUTOMATIZADAS

### 4.1 Java - JUnit 5 + AssertJ + Mockito

```xml
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.24.2</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.5.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.5.0</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void shouldCreateUserSuccessfully() {
        // Given
        UserRequest request = new UserRequest("John", "john@example.com");
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(new User(1L, "John", "john@example.com"));
        
        // When
        User result = userService.createUser(request);
        
        // Then
        assertThat(result.getName()).isEqualTo("John");
        assertThat(result.getEmail()).isEqualTo("john@example.com");
        verify(userRepository).save(any(User.class));
    }
    
    @ParameterizedTest
    @CsvSource({
        "invalid-email, false",
        "valid@email.com, true"
    })
    void shouldValidateEmailFormat(String email, boolean expected) {
        assertThat(userService.isValidEmail(email)).isEqualTo(expected);
    }
}
```

### 4.2 Python - pytest

```bash
pip install pytest pytest-cov pytest-mock pytest-asyncio hypothesis
```

```python
# test_calculator.py
import pytest
from hypothesis import given, strategies as st

class TestCalculator:
    @pytest.fixture
    def calculator(self):
        return Calculator()
    
    def test_add_positive_numbers(self, calculator):
        assert calculator.add(2, 3) == 5
    
    def test_divide_by_zero_raises(self, calculator):
        with pytest.raises(ZeroDivisionError):
            calculator.divide(10, 0)
    
    @pytest.mark.parametrize("a,b,expected", [
        (1, 2, 3),
        (0, 0, 0),
        (-1, 1, 0),
    ])
    def test_add_various_inputs(self, calculator, a, b, expected):
        assert calculator.add(a, b) == expected
    
    # Property-based testing
    @given(st.integers(), st.integers())
    def test_add_commutative(self, calculator, a, b):
        assert calculator.add(a, b) == calculator.add(b, a)

# Ejecución con cobertura
# pytest --cov=src --cov-report=html --cov-report=xml
```

### 4.3 JavaScript/TypeScript - Jest

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.5",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3"
  }
}
```

```javascript
// calculator.test.js
describe('Calculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new Calculator();
  });
  
  test('adds positive numbers correctly', () => {
    expect(calculator.add(2, 3)).toBe(5);
  });
  
  test.each([
    [1, 2, 3],
    [0, 0, 0],
    [-1, 1, 0],
  ])('add(%i, %i) returns %i', (a, b, expected) => {
    expect(calculator.add(a, b)).toBe(expected);
  });
  
  // Snapshot testing
  test('generateReport matches snapshot', () => {
    const report = calculator.generateReport();
    expect(report).toMatchSnapshot();
  });
});

// Mocking
jest.mock('../api/client');

test('fetches data from API', async () => {
  const mockData = { users: [] };
  apiClient.get.mockResolvedValue(mockData);
  
  const result = await service.getUsers();
  
  expect(result).toEqual(mockData);
  expect(apiClient.get).toHaveBeenCalledWith('/users');
});
```

### 4.4 Go - testing + testify

```go
// calculator_test.go
package calculator

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"zeros", 0, 0, 0},
        {"negative", -1, 1, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            assert.Equal(t, tt.expected, result)
        })
    }
}

// Table-driven tests con require
func TestDivide(t *testing.T) {
    result, err := Divide(10, 2)
    require.NoError(t, err)
    assert.Equal(t, 5, result)
    
    _, err = Divide(10, 0)
    assert.ErrorIs(t, err, ErrDivisionByZero)
}
```

### 4.5 BDD - Cucumber

```gherkin
# features/user_management.feature
Feature: User Management
  As an administrator
  I want to manage users
  So that I can control system access

  Scenario: Creating a new user
    Given I am logged in as admin
    When I create a user with email "new@user.com"
    Then the user should exist in the system
    And a welcome email should be sent

  Scenario: Preventing duplicate users
    Given a user with email "exists@user.com" exists
    When I try to create a user with email "exists@user.com"
    Then I should see an error "Email already registered"
```

```java
// Java con Cucumber
public class UserManagementSteps {
    
    @Given("I am logged in as admin")
    public void loginAsAdmin() {
        authService.login("admin", "password");
    }
    
    @When("I create a user with email {string}")
    public void createUser(String email) {
        userService.createUser(new UserRequest(email));
    }
    
    @Then("the user should exist in the system")
    public void verifyUserExists() {
        assertThat(userRepository.findByEmail(email)).isPresent();
    }
}
```

### 4.6 TestContainers (Integration Testing)

```java
@Testcontainers
class DatabaseIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Test
    void shouldSaveAndRetrieveUser() {
        User user = new User("John", "john@example.com");
        User saved = userRepository.save(user);
        
        Optional<User> found = userRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("John");
    }
}
```

### 4.7 Karate (API Testing)

```gherkin
# users.feature
Feature: User API Tests

  Background:
    * url baseUrl
    * header Authorization = 'Bearer ' + authToken

  Scenario: Get all users
    Given path '/users'
    When method GET
    Then status 200
    And match response.users == '#array'
    And match each response.users contains { id: '#number', email: '#string' }

  Scenario: Create user
    Given path '/users'
    And request { name: 'John', email: 'john@test.com' }
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response.name == 'John'

  Scenario: Validate error response
    Given path '/users'
    And request { name: '', email: 'invalid' }
    When method POST
    Then status 400
    And match response.error == 'VALIDATION_ERROR'
```

---

## 5. HERRAMIENTAS DEVOPS PARA CI/CD

### 5.1 GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - quality
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
  DOCKER_DRIVER: overlay2

cache:
  paths:
    - .m2/repository

build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn compile -DskipTests
  artifacts:
    paths:
      - target/

unit-tests:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn test
    - mvn jacoco:report
  coverage: '/Total.*?([0-9]{1,3})%/
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml
      coverage_report:
        coverage_format: cobertura
        path: target/site/jacoco/cobertura.xml
    paths:
      - target/site/jacoco/

integration-tests:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  services:
    - postgres:15
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script:
    - mvn verify -P integration-tests

sonarqube:
  stage: quality
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn sonar:sonar 
        -Dsonar.host.url=$SONAR_HOST 
        -Dsonar.login=$SONAR_TOKEN
  only:
    - merge_requests
    - main

dependency-check:
  stage: security
  image: owasp/dependency-check:latest
  script:
    - /usr/share/dependency-check/bin/dependency-check.sh
        --project "$CI_PROJECT_NAME"
        --scan .
        --format JSON
        --format HTML
        --out reports/
        --failOnCVSS 7
  artifacts:
    paths:
      - reports/
    expire_in: 1 week

sast-semgrep:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep --config=auto --config=p/security-audit --json --output=semgrep-report.json .
  artifacts:
    reports:
      sast: semgrep-report.json
    paths:
      - semgrep-report.json

trivy-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy filesystem --exit-code 1 --severity HIGH,CRITICAL .
    - trivy config .

build-image:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```

### 5.2 GitHub Actions

```yaml
# .github/workflows/pipeline.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      
      - name: Build with Maven
        run: mvn clean compile
      
      - name: Run Unit Tests
        run: mvn test
      
      - name: Generate Coverage Report
        run: mvn jacoco:report
      
      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: target/site/jacoco/jacoco.xml

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: mvn verify -P integration-tests

  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        with:
          scanMetadataReportFile: target/sonar/report-task.txt
        timeout-minutes: 5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/cwe-top-25

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: '${{ github.event.repository.name }}'
          path: '.'
          format: 'JSON'
          args: >
            --failOnCVSS 7
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: dependency-check-report
          path: reports/

  build-and-push:
    needs: [build-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/${{ github.repository }}:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
```

### 5.3 Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        SONAR_TOKEN = credentials('sonar-token')
        DOCKER_REGISTRY = 'registry.example.com'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                    jacoco execPattern: 'target/jacoco.exec'
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Security Scans') {
            parallel {
                stage('OWASP Dependency Check') {
                    steps {
                        sh '''
                            mvn org.owasp:dependency-check-maven:check \
                                -DfailBuildOnCVSS=7
                        '''
                        dependencyCheckPublisher pattern: 'target/dependency-check-report.xml'
                    }
                }
                stage('SpotBugs') {
                    steps {
                        sh 'mvn spotbugs:check'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/app:${env.BUILD_NUMBER}")
                    image.inside {
                        sh 'echo "Running tests in container"'
                    }
                }
            }
        }
        
        stage('Push Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_REGISTRY}/app:${env.BUILD_NUMBER}").push()
                        docker.image("${DOCKER_REGISTRY}/app:${env.BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """<p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                        <p>Check console output at <a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a></p>""",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### 5.4 ArgoCD (GitOps)

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/eugarte/myapp-config.git
    targetRevision: HEAD
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 5.5 Terraform para Infraestructura

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

# SonarQube deployment via Helm
resource "helm_release" "sonarqube" {
  name       = "sonarqube"
  repository = "https://SonarSource.github.io/helm-chart-sonarqube"
  chart      = "sonarqube"
  namespace  = "sonarqube"
  version    = "10.0.0"

  create_namespace = true

  set {
    name  = "persistence.enabled"
    value = "true"
  }

  set {
    name  = "postgresql.enabled"
    value = "true"
  }

  set {
    name  = "resources.requests.memory"
    value = "2Gi"
  }
}
```

---

## 6. INTEGRACIÓN COMPLETA EN PIPELINE

### 6.1 Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRE-COMMIT                                                     │
│  ├── Husky + lint-staged (formato, lint básico)                 │
│  ├── Semgrep (reglas personalizadas)                            │
│  └── Gitleaks (detección de secretos)                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PULL REQUEST                                                   │
│  ├── SonarQube Scan (quality gate)                              │
│  ├── Unit Tests + Coverage (>80%)                               │
│  ├── SAST (Semgrep, SpotBugs, Bandit)                           │
│  ├── Dependency Check (Snyk, OWASP DC)                          │
│  └── IaC Scan (Trivy, Checkov)                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (merge to main)
┌─────────────────────────────────────────────────────────────────┐
│  BUILD & INTEGRATION                                            │
│  ├── Build artifacts                                            │
│  ├── Integration tests (TestContainers)                         │
│  ├── DAST (OWASP ZAP)                                           │
│  └── SBOM generation (Syft)                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONTAINER SECURITY                                             │
│  ├── Image build                                                │
│  ├── Trivy image scan                                           │
│  ├── Grype scan                                                 │
│  └── Sign image (Cosign)                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  DEPLOYMENT (GitOps)                                            │
│  ├── ArgoCD sync                                                │
│  ├── Kubernetes security (OPA, Kyverno)                         │
│  └── Runtime security (Falco)                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Makefile para Desarrollo Local

```makefile
.PHONY: help setup test test-unit test-integration coverage lint security build docker-scan

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Instala dependencias y hooks
	mvn clean install -DskipTests
	pre-commit install

test: test-unit test-integration ## Ejecuta todos los tests

test-unit: ## Tests unitarios
	mvn test

test-integration: ## Tests de integración
	mvn verify -P integration-tests

coverage: ## Genera reporte de cobertura
	mvn jacoco:report
	@echo "Reporte en: target/site/jacoco/index.html"

lint: ## Análisis estático
	mvn spotbugs:check
	mvn checkstyle:check

security: security-dependency security-sast security-secrets ## Escaneos de seguridad completos

security-dependency: ## Análisis de dependencias
	mvn org.owasp:dependency-check-maven:check

security-sast: ## Análisis estático de seguridad
	@which semgrep >/dev/null 2>&1 || pip install semgrep
	semgrep --config=p/security-audit --config=p/owasp-top-ten .

security-secrets: ## Detección de secretos
	@which gitleaks >/dev/null 2>&1 || brew install gitleaks
	gitleaks detect --source . --verbose

sonar: ## Análisis SonarQube
	mvn sonar:sonar -Dsonar.host.url=http://localhost:9000

build: ## Build del proyecto
	mvn clean package -DskipTests

docker-build: ## Build imagen Docker
	docker build -t mi-app:local .

docker-scan: docker-build ## Escanea imagen Docker
	@which trivy >/dev/null 2>&1 || echo "Instala Trivy: https://aquasecurity.github.io/trivy/"
	trivy image mi-app:local

pipeline-local: lint test-unit security sonar ## Ejecuta pipeline completo localmente
	@echo "✅ Pipeline local completado"
```

### 6.3 Dashboard de Métricas

```yaml
# docker-compose.monitoring.yml
version: '3'

services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  sonarqube:
    image: sonarqube:community
    ports:
      - "9000:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://postgres:5432/sonar
      - SONAR_JDBC_USERNAME=sonar
      - SONAR_JDBC_PASSWORD=sonar
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=sonar
      - POSTGRES_PASSWORD=sonar
      - POSTGRES_DB=sonar
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  grafana_data:
  prometheus_data:
  postgres_data:
```

---

## 📚 REFERENCIAS

### Documentación Oficial
- [SonarQube Docs](https://docs.sonarqube.org/)
- [OWASP Dependency Check](https://jeremylong.github.io/DependencyCheck/)
- [Semgrep Docs](https://semgrep.dev/docs/)
- [Trivy Docs](https://aquasecurity.github.io/trivy/)

### Cheatsheets
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)

### Comunidad
- [OWASP](https://owasp.org/)
- [DevSecOps Discord](https://discord.gg/devsecopshq)

---

*Documento generado para el proyecto msseguridad - Última actualización: $(date)*
