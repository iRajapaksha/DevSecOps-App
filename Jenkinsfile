pipeline {
    agent any

    tools {
    nodejs "NodeJS"
    }
    environment {
        // Docker registry
        DOCKER_REGISTRY = "irajapaksha"
        IMAGE_NAME = "backend"
        // JWT secret (used in docker-compose)
        JWT_SECRET = credentials('jwt-secret')
        POSTGRES_USER = credentials('db-user')
        POSTGRES_PASSWORD = credentials('db-password')
        POSTGRES_DB = credentials('db-name')
        SONAR_TOKEN = credentials('sonar-token')
        SONAR_HOST_URL = "http://13.200.205.49:9000"
        SONAR_PROJECT_KEY = "devsecops-app"
        SONARQUBE = "SonarQube" // Name of Jenkins SonarQube installation
    }


    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/iRajapaksha/DevSecOps-App.git'
            }
        }
        stage('Debug') {
    steps {
        sh 'whoami'
        sh 'echo $PATH'
        sh 'which node'
        sh 'which npm'
        sh 'node -v'
        sh 'npm -v'
    }
    }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci'
                }
            }
        }
        stage('Debug ESLint') {
            steps {
                dir('app') {
                    sh 'cat package.json'
                    sh 'npm list eslint || true'
                }
            }
        }

//         stage('Lint & SAST Scan') {
//             steps {
//                 dir('app'){
//                 sh 'npx eslint . || exit 1'
//                 script {
//             def scannerHome = tool 'SonarScanner'
//             withSonarQubeEnv("${SONARQUBE}") {
//             sh """
// ${scannerHome}/bin/sonar-scanner
// -Dsonar.projectKey=${SONAR_PROJECT_KEY}
// -Dsonar.sources=.
// -Dsonar.host.url=${SONAR_HOST_URL}
// -Dsonar.login=${SONAR_TOKEN}
// """
//             }
//         }

//                 }

//             }
//         }

stage('Dependency Scan') {
    steps {
        sh '''
        mkdir -p dependency-check-report
        docker run --rm \
          -u 0 \
          -v $(pwd):/src \
          -v $(pwd)/dependency-check-report:/report \
          owasp/dependency-check \
          --project "secure-devsecops-app" \
          --scan /src \
          --format ALL \
          --out /report
        '''
    }
}

        stage('Run Unit Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest ./app"
            }
        }

        stage('Docker Scan') {
            steps {
                sh "trivy image --exit-code 1 --severity CRITICAL ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
            }
        }

        stage('Push to Docker Registry') {
            steps {
                withDockerRegistry([credentialsId: 'dockerhub-credentials', url: 'https://index.docker.io/v1/']) {
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy to Staging') {
            steps {
                sh '''
                docker-compose down
                docker-compose up -d
                '''
            }
        }

        stage('DAST Scan') {
            steps {
                sh '''
                zap-baseline.py -t http://localhost:3000 -r dast-report.html
                '''
            }
        }

    }

    post {
        always {
            sh 'docker-compose down'
        }
        success {
            echo 'Pipeline succeeded ✅'
        }
        failure {
            echo 'Pipeline failed ❌'
        }
    }
}
