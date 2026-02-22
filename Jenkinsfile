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
                sh 'npm ci'
            }
        }

        stage('Lint & SAST Scan') {
            steps {
                sh 'npx eslint . || exit 1'
                withSonarQubeEnv("${SONARQUBE}") {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Dependency Scan') {
            steps {
                sh '''
                mkdir -p dependency-check-report
                dependency-check --project "secure-devsecops-app" --scan . --format ALL --out dependency-check-report
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
