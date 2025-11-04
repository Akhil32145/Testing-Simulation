pipeline {
    agent any

    triggers {
        cron('H/1 * * * *')
        pollSCM('H/5 * * * *')
    }

    environment {
        REPORT_DIR = 'reports'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install & Run Tests') {
            steps {
                sh 'npm install'
                sh "mkdir -p ${REPORT_DIR}"
                sh "npx testcafe chromium:headless tests/ --reporter json:${REPORT_DIR}/results.json || true"
            }
        }

        stage('Retry Failed Tests') {
            steps {
                script {
                    def maxRetries = 5
                    def failedTests = ['LoginTest', 'SignupTest', 'CheckoutTest', 'FilterTest', 'SortTest', 'ReviewTest']

                    for (int i = 1; i <= maxRetries && failedTests.size() > 0; i++) {
                        echo "Retry #${i} for failed tests: ${failedTests}"
                        def remaining = []
                        for (test in failedTests) {
                            def result = sh(script: "npx testcafe chromium:headless tests/ -t ${test} --reporter json:${REPORT_DIR}/results.json || true", returnStatus: true)
                            if (result != 0) {
                                remaining.add(test)
                            }
                        }
                        failedTests = remaining
                    }
                }
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: "${REPORT_DIR}/*.json", fingerprint: true
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Check reports for details."
        }
    }
}
