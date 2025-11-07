pipeline {
    agent { label 'ubuntu-agent' }

    triggers {
        cron('H/2 * * * *') // every 2 minutes
    }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
        SLACK_CHANNEL = '#jenkins-notifications' // Your Slack channel
        SLACK_USER = 'jenkins-bot'             // Your bot name
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install Dependencies') {
            steps {
                ansiColor('xterm') {
                    sh 'npm install'
                }
            }
        }

        stage('Run & Retry Tests') {
            steps {
                ansiColor('xterm') {
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
                            if (failedTests.isEmpty()) break
                            echo "\u001B[33m🔁 Attempt #${attempt} for tests: ${failedTests}\u001B[0m"

                            def currentFailures = []
                            for (test in failedTests) {
                                def passed = (new Random().nextBoolean()) // Replace with real test command
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

                        // Save failures for Slack report
                        writeFile file: "${REPORT_DIR}/failures.txt", text: failedTests.join('\n')
                    }
                }
            }
        }

        stage('Report & Notify') {
            steps {
                ansiColor('xterm') {
                    script {
                        def failedTestsList = fileExists("${REPORT_DIR}/failures.txt") ? readFile("${REPORT_DIR}/failures.txt").trim() : ""
                        def isFailure = failedTestsList && failedTestsList != ""

                        if (isFailure) {
                            slackSend(
                                channel: env.SLACK_CHANNEL,
                                color: '#FF0000',
                                message: """*🚨 Build #${env.BUILD_NUMBER} - Some Tests Failed After ${params.RETRY_COUNT} Retries*
• Failed Tests: ${failedTestsList.split('\\n').collect { it }.join(', ')}
• Retries Used: ${params.RETRY_COUNT}
"""
                            )
                            currentBuild.result = 'UNSTABLE'
                        } else {
                            slackSend(
                                channel: env.SLACK_CHANNEL,
                                color: '#36a64f',
                                message: """*✅ Build #${env.BUILD_NUMBER} - All Tests Passed Successfully*
• Failed Tests: None
• Retries Used: ${params.RETRY_COUNT}
"""
                            )
                        }
                    }
                }
            }
        }
    }
}

