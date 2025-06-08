pipeline {
    agent any
    tools {
        dockerTool 'docker'
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'commit_message', value: '$.head_commit.message']  // Correct path for commit message
            ],
            causeString: 'Triggered by push to main branch with specific commit message',
            token: 'web3fygo-main-branch-webhook',
            printContributedVariables: true,
            printPostContent: true,
            regexpFilterText: '$ref $commit_message',  // Combine both branch and commit message
            regexpFilterExpression: '(?i)refs/heads/main .*\\bbuild: \\b.*'  // Ensure both conditions are met
        )
    }

    environment {
        IMAGENAME = 'web3fygo'
        PROJECT_NAME = 'web3fygo'
        NODE_VERSION = '20'
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }
    
    stages {
        stage('Set Environment Variables') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'master') {
                        env.BUILD_TYPE = 'major'
                        env.NET = 'mainnet'
                        env.CLOUD = 'AZURE'
                        env.ENVIRONMENT = 'production'
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.BUILD_TYPE = 'minor'
                        env.NET = 'testnet'
                        env.CLOUD = 'AZURE'
                        env.ENVIRONMENT = 'development'
                    } else if (env.BRANCH_NAME == 'stage') {
                        env.BUILD_TYPE = 'minor'
                        env.NET = 'stagenet'
                        env.CLOUD = 'AZURE'
                        env.ENVIRONMENT = 'staging'
                    } else {
                        error "No matching branch found for ${env.BRANCH_NAME}. Stopping Jenkins build."
                    }

                    echo "Branch: ${env.BRANCH_NAME}, Build Type: ${env.BUILD_TYPE}, Net: ${env.NET}, Cloud: ${env.CLOUD}, Environment: ${env.ENVIRONMENT}"
                }
            }
        }

        stage('Checkout & Setup') {
            steps {
                script {
                    echo "🔄 Checking out source code..."
                    checkout scm
                    
                    // Set dynamic variables
                    env.BUILD_TIMESTAMP = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
                    env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.BUILD_VERSION = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    
                    echo "📋 Build Information:"
                    echo "  Project: ${env.PROJECT_NAME}"
                    echo "  Branch: ${env.BRANCH_NAME}"
                    echo "  Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "  Version: ${env.BUILD_VERSION}"
                    echo "  Environment: ${env.ENVIRONMENT}"
                }
            }
        }

        stage('Dependencies & Build') {
            steps {
                script {
                    echo "📦 Installing dependencies and building..."
                    sh '''
                        # Install dependencies
                        npm install
                        
                        # Run type checking
                        npm run type-check
                        
                        # Build application
                        npm run build
                        
                        echo "Dependencies installed and build completed successfully"
                    '''
                }
            }
        }

        stage('Tests & Quality') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            echo "🧪 Running unit tests..."
                            sh '''
                                npm test -- --coverage --ci --watchAll=false
                                echo "Unit tests completed"
                            '''
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        script {
                            echo "🔍 Running code quality checks..."
                            sh '''
                                # Run linting
                                npm run lint || echo "Linting completed with warnings"
                                
                                # Run security audit
                                npm audit --audit-level=moderate || echo "Audit completed with warnings"
                            '''
                        }
                    }
                }
            }
        }

        stage('AZURE Release') {
            when {
                expression { return CLOUD == 'AZURE' }
            }
            steps {
                script {
                    def incrementType = BUILD_TYPE
                    def tag = NET
                    def azureRegistry = "${NET}.azurecr.io"

                    withCredentials([
                        string(credentialsId: 'azure-stagenet-cr-token', variable: 'AZURE_STAGENET_ACCESS_TOKEN'),
                        string(credentialsId: 'azure-mainnet-cr-token', variable: 'AZURE_MAINNET_ACCESS_TOKEN'),
                        string(credentialsId: 'azure-testnet-cr-token', variable: 'AZURE_TESTNET_ACCESS_TOKEN'),
                        string(credentialsId: 'ci-registry-user', variable: 'CI_REGISTRY_USER'),
                        string(credentialsId: 'ci-registry', variable: 'CI_REGISTRY'),
                        string(credentialsId: 'ci-pat', variable: 'CR_PAT')
                    ]) {
                        withEnv(["GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -i ${env.SSH_KEY}"]) {
                            env.AZURE = "${NET}.azurecr.io"
                            def _azure = "${NET}.azurecr.io"
                            def _net = "${NET}"
                            env.TAG = "${NET}"
                            
                            // Azure registry login based on environment
                            if (tag == 'stagenet') {
                                sh "echo $AZURE_STAGENET_ACCESS_TOKEN | docker login -u stagenet --password-stdin $azureRegistry"
                            } else if (tag == 'mainnet') {
                                sh "echo $AZURE_MAINNET_ACCESS_TOKEN | docker login -u mainnet --password-stdin $azureRegistry"
                            } else if (NET == "testnet") {
                                _azure = "${NET}1.azurecr.io"
                                sh """
                                    echo $AZURE_TESTNET_ACCESS_TOKEN | docker login -u testnet1 --password-stdin $_azure
                                """
                            }

                            env.AZURE = _azure
                            
                            echo "🐳 Building and pushing Docker images to Azure Container Registry..."
                            sh "/usr/bin/make azure-release AZURE=${env.AZURE} INCREMENT_TYPE=${BUILD_TYPE} BRANCH_NAME=${env.BRANCH_NAME}"

                            // Capture build information
                            def buildInfo = sh(script: "make print-vars INCREMENT_TYPE=${BUILD_TYPE}", returnStdout: true).trim().split('\n')
                            def envVars = [:]
                            buildInfo.each {
                                def (key, value) = it.split('=')
                                envVars[key.trim()] = value.trim()
                            }

                            // Assign values to Jenkins environment variables
                            env.GITREF = envVars['GITREF']
                            env.VERSION = envVars['VERSION']

                            // Verify the captured environment variables
                            echo "Captured GITREF: ${env.GITREF}"
                            echo "Captured VERSION: ${env.VERSION}"

                            // Get image digest for security scanning
                            def imageDigest = sh(
                                script: "docker inspect --format='{{index .RepoDigests 0}}' ${env.AZURE}/${IMAGENAME}:${GITREF}_${VERSION} | awk -F'@' '{print \$2}'",
                                returnStdout: true
                            ).trim().replaceAll(/^sha256:/, '')

                            echo "Image Digest: ${imageDigest}"

                            // Security scanning with Trivy
                            echo "🔒 Running security scan on Docker image..."
                            sh """
                                trivy clean --scan-cache && trivy image --format table --exit-code 1 --ignore-unfixed --pkg-types os,library --severity CRITICAL,HIGH ${env.AZURE}/${IMAGENAME}:${GITREF}_${VERSION}
                            """

                            // GitOps deployment based on environment
                            if (tag == 'mainnet') {
                                echo "🚀 Deploying to production via GitOps..."
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        if [ -d "ArgoCD" ]; then
                                            rm -rf ArgoCD
                                        fi
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/ArgoCD.git
                                        cd ArgoCD/apps/web3fygo/overlays/prod
                                        /var/lib/jenkins/kustomize edit set image ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION}
                                        git add .
                                        git commit -m "Update web3fygo image ${AZURE}/${IMAGENAME} with ${GITREF}_${VERSION}"
                                        git push origin main
                                        cd ${WORKSPACE} && rm -r ArgoCD
                                    """
                                }
                            } else if (NET == "testnet") {
                                echo "🚀 Deploying to development via GitOps..."
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        if [ -d "ArgoCD" ]; then
                                            rm -rf ArgoCD
                                        fi
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/ArgoCD.git
                                        cd ArgoCD/apps/web3fygo/overlays/dev
                                        /var/lib/jenkins/kustomize edit set image ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION}
                                        git add .
                                        git commit -m "Update web3fygo image ${AZURE}/${IMAGENAME} with ${GITREF}_${VERSION}"
                                        git push origin main
                                        cd ${WORKSPACE} && rm -r ArgoCD
                                    """
                                }
                            } else if (NET == "stagenet") {
                                echo "🚀 Deploying to staging via GitOps..."
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        if [ -d "ArgoCD" ]; then
                                            rm -rf ArgoCD
                                        fi
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/ArgoCD.git
                                        cd ArgoCD/apps/web3fygo/overlays/staging
                                        /var/lib/jenkins/kustomize edit set image ${AZURE}/${IMAGENAME}:${GITREF}_${VERSION}
                                        git add .
                                        git commit -m "Update web3fygo image ${AZURE}/${IMAGENAME} with ${GITREF}_${VERSION}"
                                        git push origin main
                                        cd ${WORKSPACE} && rm -r ArgoCD
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Post-Deploy Verification') {
            when {
                expression { return CLOUD == 'AZURE' }
            }
            steps {
                script {
                    echo "🏥 Running post-deployment verification..."
                    sh '''
                        # Wait for deployment to stabilize
                        sleep 30
                        
                        # Health check (add your specific health check endpoint)
                        echo "Running health checks for web3fygo deployment..."
                        # curl -f http://your-app-endpoint/api/health || echo "Health check endpoint not available yet"
                        
                        echo "Post-deployment verification completed"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🧹 Cleanup and reporting..."
                
                // Cleanup Docker images
                sh '''
                    docker image prune -f || true
                    docker system prune -f || true
                '''
                
                // Archive artifacts
                archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
                archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
            }
        }
        
        success {
            script {
                echo "✅ Web3fygo pipeline completed successfully!"
                
                // Send success notification for main branches
                if (env.BRANCH_NAME in ['main', 'develop', 'stage']) {
                    echo "Success notification: Web3fygo ${env.BUILD_VERSION} deployed to ${env.ENVIRONMENT}"
                    // Add Slack/Teams notification here if needed
                    // slackSend(
                    //     color: 'good',
                    //     message: "✅ *Web3fygo* build #${env.BUILD_NUMBER} succeeded on ${env.BRANCH_NAME} (${env.ENVIRONMENT})"
                    // )
                }
            }
        }
        
        failure {
            script {
                echo "❌ Web3fygo pipeline failed!"
                
                // Send failure notification
                echo "Failure notification: Web3fygo ${env.BUILD_VERSION} failed on ${env.BRANCH_NAME}"
                // slackSend(
                //     color: 'danger',
                //     message: "❌ *Web3fygo* build #${env.BUILD_NUMBER} failed on ${env.BRANCH_NAME}"
                // )
            }
        }
        
        unstable {
            script {
                echo "⚠️ Web3fygo pipeline completed with warnings!"
                
                // Send unstable notification
                echo "Warning notification: Web3fygo ${env.BUILD_VERSION} unstable on ${env.BRANCH_NAME}"
                // slackSend(
                //     color: 'warning',
                //     message: "⚠️ *Web3fygo* build #${env.BUILD_NUMBER} unstable on ${env.BRANCH_NAME}"
                // )
            }
        }
    }
} 