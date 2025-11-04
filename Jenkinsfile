pipeline {
    agent any

    triggers {
        cron('* * * * *')           
        pollSCM('H/5 * * * *')      
    }

    environment {
        REPORT_DIR = 'reports'
        SLACK_CHANNEL = '#testing-simulation'
        SLACK_CREDENTIAL_ID = 'Bot-token-ID'
        MAX_RETRIES = 5
    }

    options { timestamps() }

    stages {
        stage('Start & Checkout') {
            steps {
                slackSend(channel: SLACK_CHANNEL, color: '#439FE0', message: "🚀 *Build Started:* ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}")
                checkout scm
            }
        }

        stage('Run & Retry Tests') {
            steps {
                script {
                    sh 'npm install'
                    sh "mkdir -p ${REPORT_DIR}"
                    sh "npx testcafe chromium:headless tests/ --reporter json:${REPORT_DIR}/results.json || true"

                    def tests = ['LoginTest', 'SignupTest', 'CheckoutTest', 'FilterTest', 'SortTest', 'ReviewTest',
                                 'SearchTest', 'ProfileTest', 'CartTest', 'WishlistTest', 'NotificationTest',
                                 'LogoutTest', 'SettingsTest', 'PaymentTest', 'FeedbackTest']
                    def persistFails = []

                    for (i = 1; i <= MAX_RETRIES.toInteger() && tests; i++) {
                        echo "🔁 Retry #${i} for: ${tests}"
                        def remain = []
                        tests.each {
                            if (sh(script: "npx testcafe chromium:headless tests/ -t ${it} --reporter json:${REPORT_DIR}/results.json || true", returnStatus: true) != 0)
                                remain << it
                        }
                        tests = remain
                    }

                    if (tests) {
                        persistFails = tests
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

        stage('Archive') {
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
            echo "Pipeline done. Reports in ${REPORT_DIR}."
        }
    }
}

