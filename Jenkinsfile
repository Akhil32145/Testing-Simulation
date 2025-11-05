pipeline {
    agent any

    triggers {
        cron('H/3 * * * *')
    }

    environment {
        REPORT_DIR = 'reports'
        SLACK_CHANNEL = '#all-testing-simulation'  // your Slack channel
        SLACK_CREDENTIAL_ID = 'Bot-token-ID'       // Jenkins credential ID for Slack bot token
        MAX_RETRIES = 2
    }

    tools {
        nodejs 'NodeJS-25.1.0'  // Name of NodeJS installation from Global Tool Config
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Start & Checkout') {
            steps {
                slackSend(
                    channel: SLACK_CHANNEL,
                    color: '#439FE0',
                    message: "🚀 *Build Started:* ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
                )
                checkout scm
            }
        }

        stage('Install & Run Tests') {
            steps {
                script {
                    sh 'npm install'
                    sh "mkdir -p ${REPORT_DIR}"

                    def tests = [
                        'LoginTest', 'SignupTest', 'CheckoutTest', 'FilterTest', 'SortTest', 'ReviewTest',
                        'SearchTest', 'ProfileTest', 'CartTest', 'WishlistTest', 'NotificationTest',
                        'LogoutTest', 'SettingsTest', 'PaymentTest', 'FeedbackTest'
                    ]
                    def persistFails = []

                    // Initial run
                    tests.each {
                        if (sh(script: "npx testcafe chromium:headless tests/ -t ${it} --reporter json:${REPORT_DIR}/results.json", returnStatus: true) != 0)
                            persistFails << it
                    }

                    // Retry logic
                    for (i = 1; i <= MAX_RETRIES.toInteger() && persistFails; i++) {
                        echo "🔁 Retry #${i} for: ${persistFails}"
                        def remaining = []
                        persistFails.each {
                            if (sh(script: "npx testcafe chromium:headless tests/ -t ${it} --reporter json:${REPORT_DIR}/results.json", returnStatus: true) != 0)
                                remaining << it
                        }
                        persistFails = remaining
                    }

                    if (persistFails) {
                        echo "🚨 Persistently failed: ${persistFails}"
                        slackSend(
                            channel: SLACK_CHANNEL,
                            color: '#FF0000',
                            message: """🔥 *Persistent Test Failures Detected!*
*Build:* ${env.JOB_NAME} #${env.BUILD_NUMBER}
*Failed after ${MAX_RETRIES} retries:*
${persistFails.join('\n')}
🔗 ${env.BUILD_URL}"""
                        )
                        currentBuild.result = 'UNSTABLE'
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
        success {
            slackSend(channel: SLACK_CHANNEL, color: '#36a64f', message: "✅ *Success:* ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}")
        }
        unstable {
            slackSend(channel: SLACK_CHANNEL, color: '#FFA500', message: "⚠️ *Unstable:* ${env.JOB_NAME} #${env.BUILD_NUMBER}\nSome tests persistently failed.\n${env.BUILD_URL}")
        }
        failure {
            slackSend(channel: SLACK_CHANNEL, color: '#FF0000', message: "❌ *Failed:* ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}")
        }
        always {
            echo "Pipeline done. Reports are in ${REPORT_DIR}."
        }
    }
}

