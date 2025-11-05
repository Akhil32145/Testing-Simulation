pipeline {
    agent any

    triggers {
        cron('H/3 * * * *') // adjust schedule as needed
    }

    environment {
        REPORT_DIR = 'reports'
        MAX_RETRIES = 2
    }

    options {
        timestamps()
        disableConcurrentBuilds() // prevents overlapping builds
    }

    stages {
        stage('Start & Checkout') {
            steps {
                echo "🚀 Build Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                sh "mkdir -p ${REPORT_DIR}"
            }
        }

        stage('Run & Retry Tests') {
            steps {
                script {
                    // Define test cases
                    def tests = ['LoginTest', 'SignupTest', 'CheckoutTest', 'FilterTest', 'SortTest', 'ReviewTest',
                                 'SearchTest', 'ProfileTest', 'CartTest', 'WishlistTest', 'NotificationTest',
                                 'LogoutTest', 'SettingsTest', 'PaymentTest', 'FeedbackTest']
                    def persistFails = []

                    echo "Running initial test suite..."
                    tests.each { testName ->
                        sh "npx testcafe chromium:headless tests/ -t ${testName} --reporter json:${REPORT_DIR}/${testName}.json || true"
                    }

                    // Retry logic
                    for (i = 1; i <= MAX_RETRIES.toInteger() && tests; i++) {
                        echo "🔁 Retry #${i} for: ${tests}"
                        def remaining = []
                        tests.each { testName ->
                            def status = sh(script: "npx testcafe chromium:headless tests/ -t ${testName} --reporter json:${REPORT_DIR}/${testName}.json || true", returnStatus: true)
                            if (status != 0) {
                                remaining << testName
                            }
                        }
                        tests = remaining
                    }

                    if (tests) {
                        persistFails = tests
                        echo "🚨 Persistently failed tests:"
                        persistFails.each { failTest ->
                            echo "❌ ${failTest}"
                        }
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "✅ All tests passed after retries."
                    }
                }
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: "${REPORT_DIR}/*.json", fingerprint: true
                echo "📂 Test reports archived in '${REPORT_DIR}'"
            }
        }
    }

    post {
        success {
            echo "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        unstable {
            echo "⚠️ Build Unstable: Some tests persistently failed"
        }
        failure {
            echo "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        always {
            echo "Pipeline finished. Check '${REPORT_DIR}' for test results."
        }
    }
}

