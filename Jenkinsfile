pipeline {
    agent { label 'ubuntu-agent' }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '2', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
        ANSI_COLOR = '\u001B['
    }

    options {
        ansiColor('xterm')  // Enable ANSI color in console
        buildDiscarder(logRotator(numToKeepStr: '10'))  // Keep last 10 builds
    }

    triggers {
        cron('H/2 * * * *')  // Run every 2 minutes
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
                    def persistentFailedTests = []
                    def passedTests = []

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        if (failedTests.isEmpty()) {
                            echo "\u001B[32m✅ All tests passed before reaching retry #${attempt}\u001B[0m"
                            break
                        }

                        echo "\u001B[33m🔁 Retry #${attempt} for: ${failedTests}\u001B[0m"
                        def currentFailures = []

                        for (test in failedTests) {
                            echo "\u001B[34mRunning ${test}...\u001B[0m"
                            def testPassed = (new Random().nextBoolean()) // Replace with actual test execution logic
                            if (testPassed) {
                                echo "\u001B[32m✅ ${test} passed\u001B[0m"
                                passedTests.add(test)
                            } else {
                                echo "\u001B[31m❌ ${test} failed\u001B[0m"
                                currentFailures.add(test)
                            }
                        }

                        failedTests = currentFailures
                    }

                    persistentFailedTests = failedTests

                    // Save results for post actions
                    currentBuild.description = """
                        Passed Tests: ${passedTests}
                        Persistent Failures: ${persistentFailedTests}
                    """

                    // Archive simple HTML report
                    writeFile file: "${REPORT_DIR}/TestSummary.html", text: """
                        <html>
                        <head><title>Test Summary</title></head>
                        <body>
                            <h2>Test Summary</h2>
                            <h3>✅ Passed Tests:</h3>
                            <ul>${passedTests.collect{ "<li>${it}</li>" }.join('')}</ul>
                            <h3>❌ Failed Tests After Retries:</h3>
                            <ul>${persistentFailedTests.collect{ "<li>${it}</li>" }.join('')}</ul>
                        </body>
                        </html>
                    """
                    archiveArtifacts artifacts: "${REPORT_DIR}/**", fingerprint: true

                    // Mark build status
                    if (persistentFailedTests.size() > 0) {
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        currentBuild.result = 'SUCCESS'
                    }

                    // Export persistent failures for post
                    env.PERSISTENT_FAILED_TESTS = persistentFailedTests.join(',')
                }
            }
        }
    }

    post {
        always {
            echo "\u001B[36m🧹 Cleaning up workspace...\u001B[0m"
            cleanWs()
        }

        unstable {
            echo "\u001B[33m⚠️ Build marked as UNSTABLE\u001B[0m"

            script {
                def failedTestsList = env.PERSISTENT_FAILED_TESTS.split(',')
                if (failedTestsList.size() > 0 && failedTestsList[0] != '') {
                    def message = "⚠️ UNSTABLE BUILD: ${env.JOB_NAME} (#${env.BUILD_NUMBER})\n" +
                                  "Persistent test failures after ${params.RETRY_COUNT} retries:\n" +
                                  failedTestsList.collect { "• ${it}" }.join("\n") +
                                  "\nCheck HTML report: ${env.BUILD_URL}artifact/${REPORT_DIR}/TestSummary.html"

                    // Slack notification
                    slackSend channel: '#ci-results', message: message

                    // Email notification
                    emailext (
                        subject: "⚠️ UNSTABLE BUILD: ${env.JOB_NAME} (#${env.BUILD_NUMBER})",
                        body: message,
                        to: 'team@example.com'
                    )
                }
            }
        }

        success {
            echo "\u001B[32m✅ Build SUCCESS! All tests passed within retries\u001B[0m"
        }

        failure {
            echo "\u001B[31m❌ Pipeline encountered a critical error before completion\u001B[0m"
        }
    }
}

