pipeline {
    agent any

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '2', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
    }

    stages {

        stage('Checkout SCM') {
            steps {
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
                    def retries = params.RETRY_COUNT.toInteger()
                    def allTests = [
                        "LoginTest","SignupTest","SearchTest","CheckoutTest","ProfileUpdateTest",
                        "LogoutTest","AddToCartTest","RemoveFromCartTest","PaymentTest",
                        "OrderHistoryTest","FilterTest","SortTest","WishlistTest","ReviewTest","NotificationTest"
                    ]

                    def failedTests = allTests

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        if (failedTests.isEmpty()) {
                            echo "✅ All tests passed before reaching retry #${attempt}"
                            break
                        }

                        echo "🔁 Retry #${attempt} for: ${failedTests}"
                        def currentFailures = []

                        // Run tests concurrently 2 at a time
                        failedTests.collate(2).each { testBatch ->
                            def batchResults = []
                            testBatch.each { test ->
                                sh(script: "npx testcafe 'chromium:headless' tests/flaky-test.js -t ${test} --concurrency 2 --reporter junit:${env.REPORT_DIR}/${test}.xml || true", returnStatus: true)
                                def resultXml = readFile("${env.REPORT_DIR}/${test}.xml")
                                if (resultXml.contains('failures=\"1\"')) {
                                    batchResults.add(test)
                                }
                            }
                            currentFailures.addAll(batchResults)
                        }

                        failedTests = currentFailures
                    }

                    if (failedTests.isEmpty()) {
                        echo "✅ All tests passed after retries"
                        currentBuild.result = 'SUCCESS'
                    } else {
                        echo "⚠️ Persistent failures after ${retries} retries: ${failedTests}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Archive & Publish Reports') {
            steps {
                archiveArtifacts artifacts: 'reports/*.xml', allowEmptyArchive: true
                junit allowEmptyResults: true, testResults: 'reports/*.xml'

                script {
                    // ✅ Ensure build remains SUCCESS if all retries passed
                    if (currentBuild.result == null || currentBuild.result == 'SUCCESS') {
                        echo "📘 Reports saved under 'reports' — Build marked as SUCCESS"
                        currentBuild.result = 'SUCCESS'
                    } else {
                        echo "📘 Reports saved under 'reports' — Some tests remained unstable"
                    }
                }
            }
        }
    }
}

