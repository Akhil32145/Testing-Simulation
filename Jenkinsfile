pipeline {
    agent { label 'ubuntu-agent' }

    options {
        ansiColor('xterm') // Apply ANSI coloring globally
    }

    triggers {
        cron('* * * * *')
    }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
        FAILURES = ''
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
                    def passedTests = []

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        if (failedTests.isEmpty()) {
                            echo "\u001B[32m✅ All tests passed before reaching retry #${attempt}\u001B[0m"
                            break
                        }

                        echo "\u001B[33m🔁 Retry #${attempt} for: ${failedTests}\u001B[0m"
                        def currentFailures = []

                        for (test in failedTests) {
                            echo "Running ${test}..."
                            // Simulate test execution
                            def passed = (new Random().nextBoolean())  // Replace with actual test command
                            if (passed) {
                                echo "\u001B[32m✅ ${test} passed\u001B[0m"
                                passedTests << test
                            } else {
                                echo "\u001B[31m❌ ${test} failed\u001B[0m"
                                currentFailures << test
                            }
                        }
                        failedTests = currentFailures
                    }

                    // Mark build result
                    if (failedTests.size() > 0) {
                        currentBuild.result = 'UNSTABLE'
                        env.FAILURES = failedTests.join(', ')
                        echo "\u001B[31m⚠️ Persistent failures after ${retries} retries: ${env.FAILURES}\u001B[0m"
                    } else {
                        echo "\u001B[32m✅ All tests passed within ${retries} retries\u001B[0m"
                    }

                    // Generate HTML report
                    writeFile file: "${REPORT_DIR}/summary.html", text: """
                    <html>
                    <head><title>Test Summary</title></head>
                    <body>
                    <h2>Test Execution Summary</h2>
                    <table border="1" style="border-collapse:collapse;">
                    <tr><th>Test</th><th>Status</th></tr>
                    ${allTests.collect { test ->
                        "<tr><td>${test}</td><td>${passedTests.contains(test) ? '✅ Passed' : '❌ Failed'}</td></tr>"
                    }.join('')}
                    </table>
                    </body>
                    </html>
                    """
                }
            }
        }

        stage('Archive & Publish') {
            steps {
                archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
                publishHTML(target: [
                    reportDir: 'reports',
                    reportFiles: 'summary.html',
                    reportName: 'Test Summary',
                    allowMissing: false,
                    alwaysLinkToLastBuild: true
                ])
            }
        }

        stage('Node Info') {
            steps {
                script {
                    echo "\u001B[36m🏷️ Running on node: ${env.NODE_NAME}\u001B[0m"
                    echo "\u001B[36m📂 Workspace: ${env.WORKSPACE}\u001B[0m"
                }
            }
        }
    }

    post {
        unstable {
            script {
                // Send Slack or Email only for persistent failures
                echo "\u001B[31m📢 Sending notification for failed tests: ${env.FAILURES}\u001B[0m"
                // Example Slack step:
                // slackSend channel: '#alerts', message: "Persistent failures: ${env.FAILURES}"
                // Example Email step:
                // emailext subject: "Persistent test failures", body: "Failed tests: ${env.FAILURES}", to: "team@example.com"
            }
        }

        success {
            echo "\u001B[32m✅ Build SUCCESS: All tests passed!\u001B[0m"
        }
    }
}

