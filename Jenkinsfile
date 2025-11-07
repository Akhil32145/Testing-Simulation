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
        stage('Prepare Workspace') {
            steps {
                // Ensure reports folder exists
                sh "mkdir -p ${env.WORKSPACE}/${REPORT_DIR}"
            }
        }

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

                        // Save failures for Slack
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

                        // Format failed tests for Slack
                        def failedTestsFormatted = isFailure ? failedTestsList.split('\n').collect { it }.join(', ') : "None"

                        slackSend(
                            channel: env.SLACK_CHANNEL,
                            color: isFailure ? '#FFA500' : '#36a64f',
                            message: """${isFailure ? ':warning: Build Unstable — Some Tests Failed' : ':white_check_mark: Build Successful — All Tests Passed'}
• Failed Tests: ${failedTestsFormatted}
• Retries Used: ${params.RETRY_COUNT}
• Duration: ${currentBuild.durationString}
• Report: Open HTML Report
:robot_face: Jenkins CI Bot"""
                        )

                        if (isFailure) {
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }
    }
}

