pipeline {
    agent any

    parameters {
        string(
            name: 'MAX_RETRIES',
            defaultValue: '3',
            description: 'Number of times to retry failed tests before marking as persistent failures'
        )
    }

    triggers {
        cron('H/3 * * * *') // runs every 3 minutes
    }

    environment {
        REPORT_DIR = 'reports'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "🚀 Build Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run & Retry Tests') {
            steps {
                script {
                    def maxRetries = params.MAX_RETRIES.toInteger()
                    def tests = [
                        'LoginTest', 'SignupTest', 'SearchTest', 'CheckoutTest', 'ProfileUpdateTest',
                        'LogoutTest', 'AddToCartTest', 'RemoveFromCartTest', 'PaymentTest',
                        'OrderHistoryTest', 'FilterTest', 'SortTest', 'WishlistTest', 'ReviewTest', 'NotificationTest'
                    ]
                    def persistFails = []

                    sh "mkdir -p ${REPORT_DIR}"

                    for (i = 1; i <= maxRetries && tests; i++) {
                        echo "🔁 Retry #${i} for: ${tests}"
                        def remain = []
                        tests.each { testName ->
                            def status = sh(script: "npx testcafe chromium:headless tests/flaky-test.js -t ${testName} --reporter junit:${REPORT_DIR}/${testName}.xml || true", returnStatus: true)
                            if (status != 0) remain << testName
                        }
                        tests = remain
                    }

                    if (tests) {
                        persistFails = tests
                        echo "🚨 Persistent Failures after ${maxRetries} retries: ${persistFails.join(', ')}"
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "✅ All tests passed after retries"
                    }
                }
            }
        }

        stage('Archive & Publish Reports') {
            steps {
                archiveArtifacts artifacts: "${REPORT_DIR}/*.xml", fingerprint: true
                junit allowEmptyResults: true, testResults: "${REPORT_DIR}/*.xml"
            }
        }
    }

    post {
        success {
            echo "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        unstable {
            echo "⚠️ Build Unstable: Persistent test failures detected."
        }
        failure {
            echo "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        always {
            echo "📘 Reports saved under '${REPORT_DIR}'"
        }
    }
}

