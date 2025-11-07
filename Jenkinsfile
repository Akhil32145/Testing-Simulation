pipeline {
    agent { label 'ubuntu-agent' }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Number of retries for failed tests')
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
                    // -----------------------------
                    // CONFIGURATION
                    // -----------------------------
                    def retries = params.RETRY_COUNT.toInteger()
                    def allTests = [
                        "LoginTest","SignupTest","SearchTest","CheckoutTest","ProfileUpdateTest",
                        "LogoutTest","AddToCartTest","RemoveFromCartTest","PaymentTest",
                        "OrderHistoryTest","FilterTest","SortTest","WishlistTest","ReviewTest","NotificationTest"
                    ]

                    // -----------------------------
                    // STATE TRACKERS
                    // -----------------------------
                    def failedTests = allTests
                    def passedTests = []
                    def persistentFailedTests = []

                    echo """
=====================================================
🚀 STARTING TEST EXECUTION
Total tests: ${allTests.size()}
Max retries allowed for failed tests: ${retries}
=====================================================
"""

                    // -----------------------------
                    // TEST EXECUTION WITH RETRIES
                    // -----------------------------
                    for (int attempt = 1; attempt <= retries; attempt++) {

                        if (failedTests.isEmpty()) {
                            echo "\n✅ All tests passed before reaching retry #${attempt}"
                            break
                        }

                        echo "\n🔁 =============================="
                        echo "🔁 Retry Attempt #${attempt}"
                        echo "🔁 Running ${failedTests.size()} failed tests again"
                        echo "🔁 ==============================\n"

                        def currentFailures = []

                        // Run only failed tests
                        for (test in failedTests) {
                            echo "▶️ Executing ${test}..."
                            // Replace with real test command, e.g.:
                            // sh "npm test -- ${test}"

                            // Simulated random results (for demonstration)
                            if ((test.hashCode() + attempt) % 5 == 0) {
                                echo "❌ ${test} failed on attempt #${attempt}"
                                currentFailures << test
                            } else {
                                echo "✅ ${test} passed on attempt #${attempt}"
                                passedTests << test
                            }
                        }

                        if (currentFailures.isEmpty()) {
                            echo "\n🎉 All remaining tests passed on attempt #${attempt}!"
                            failedTests = []
                            break
                        } else {
                            echo "\n⚠️ Some tests still failing after attempt #${attempt}: ${currentFailures}"
                            failedTests = currentFailures
                            if (attempt == retries) {
                                persistentFailedTests = failedTests
                            }
                        }
                    }

                    // -----------------------------
                    // RESULT SUMMARY
                    // -----------------------------
                    echo "\n====================================================="
                    if (persistentFailedTests.isEmpty()) {
                        echo "✅ BUILD RESULT: SUCCESS"
                        echo "🎯 All tests passed successfully within ${retries} attempt(s)."
                        currentBuild.result = 'SUCCESS'
                    } else {
                        echo "❌ BUILD RESULT: UNSTABLE"
                        echo "🚨 The following tests failed after ${retries} retries:"
                        persistentFailedTests.each { echo "   • ${it}" }
                        echo "====================================================="
                        echo "📘 ACTION: Please check the above tests for potential issues."
                        currentBuild.result = 'UNSTABLE'
                    }
                    echo "=====================================================\n"

                    // -----------------------------
                    // GENERATE A CLEAR SUMMARY REPORT
                    // -----------------------------
                    sh "mkdir -p ${REPORT_DIR}"
                    writeFile file: "${REPORT_DIR}/TestSummary.txt", text: """
================= TEST SUMMARY REPORT =================
Total Tests: ${allTests.size()}
Retries Allowed: ${retries}

✅ Passed Tests (${passedTests.unique().size()}):
${passedTests.unique().join(', ')}

${persistentFailedTests.isEmpty() ? "🎉 All tests passed within retries!" : "❌ Failed Tests (${persistentFailedTests.size()}):\n" + persistentFailedTests.join(', ')}

-------------------------------------------------------
Final Build Status: ${currentBuild.result}
=======================================================
"""

                    echo "📄 Test Summary Report created at: ${REPORT_DIR}/TestSummary.txt"
                }
            }
        }

        stage('Archive & Publish Reports') {
            steps {
                echo "📦 Archiving reports for review..."
                archiveArtifacts artifacts: "${REPORT_DIR}/**", allowEmptyArchive: true
                echo "📢 Reports archived successfully. Check Jenkins 'Artifacts' section."
            }
        }
    }

    // -----------------------------
    // FINAL POST ACTIONS
    // -----------------------------
    post {
        always {
            echo "\n🧹 Cleaning up workspace..."
            cleanWs()
        }
        success {
            echo "\n✅ FINAL RESULT: SUCCESS"
            echo "🎯 All tests passed within retry limits. Great job team!"
        }
        unstable {
            echo "\n⚠️ FINAL RESULT: UNSTABLE"
            echo "🚨 Some tests kept failing after all retries. Please check TestSummary.txt for details."
        }
        failure {
            echo "\n❌ FINAL RESULT: FAILURE"
            echo "💥 Pipeline encountered a critical error before completion."
        }
    }
}

