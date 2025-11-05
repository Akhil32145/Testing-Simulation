pipeline {
    agent any

    // ⏱️ Run every 3 minutes
    triggers {
        cron('H/3 * * * *')
    }

    // 🧠 Jenkins Parameters (visible on the build page)
    parameters {
        string(
            name: 'MAX_RETRIES',
            defaultValue: '3',
            description: 'Number of times to retry failed tests before marking them as persistent failures.'
        )
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
                    sh "mkdir -p ${REPORT_DIR}"

                    // Define all test names
                    def tests = [
                        'LoginTest', 'SignupTest', 'SearchTest', 'CheckoutTest',
                        'ProfileUpdateTest', 'LogoutTest', 'AddToCartTest', 'RemoveFromCartTest',
                        'PaymentTest', 'OrderHistoryTest', 'FilterTest', 'SortTest',
                        'WishlistTest', 'ReviewTest', 'NotificationTest'
                    ]

                    def failedTests = tests
                    def persistFails = []

                    for (int i = 1; i <= params.MAX_RETRIES.toInteger() && !failedTests.isEmpty(); i++) {
                        echo "🔁 Retry #${i} for: ${failedTests}"
                        def remain = []
                        failedTests.each { testName ->
                            def result = sh(script: "npx testcafe chromium:headless tests/flaky-test.js -t ${testName} --reporter junit:${REPORT_DIR}/${testName}.xml", returnStatus: true)
                            if (result != 0) {
                                remain << testName
                            }
                        }
                        failedTests = remain
                    }

                    if (failedTests) {
                        persistFails = failedTests
                        echo "🚨 Persistent Failures after ${params.MAX_RETRIES} retries: ${persistFails.join(', ')}"
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
                junit "${REPORT_DIR}/*.xml"
            }
        }
    }

    post {
        success {
            echo "🎉 Build Succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
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

