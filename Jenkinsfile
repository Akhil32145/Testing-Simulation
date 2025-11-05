pipeline {
    agent any

    triggers {
        cron('H/3 * * * *')
    }

    environment {
        REPORT_DIR = 'reports'
        MAX_RETRIES = 2
    }

    options {
        timestamps()
        disableConcurrentBuilds() // prevents overlapping builds
    }

    stages {
        stage('Start & Checkout') {
            steps {
                echo "🚀 Build Started: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
                checkout scm
            }
        }

        stage('Run & Retry Tests') {
            steps {
                script {
                    sh 'npm install'
                    sh "mkdir -p ${REPORT_DIR}"

                    // Initial test run
                    sh "npx testcafe chromium:headless tests/ --reporter junit:${REPORT_DIR}/results.xml || true"

                    def tests = ['LoginTest', 'SignupTest', 'CheckoutTest', 'FilterTest', 'SortTest', 'ReviewTest',
                                 'SearchTest', 'ProfileTest', 'CartTest', 'WishlistTest', 'NotificationTest',
                                 'LogoutTest', 'SettingsTest', 'PaymentTest', 'FeedbackTest']
                    def persistFails = []

                    // Retry logic for failing tests
                    for (i = 1; i <= MAX_RETRIES.toInteger() && tests; i++) {
                        echo "🔁 Retry #${i} for: ${tests}"
                        def remain = []
                        tests.each {
                            if (sh(script: "npx testcafe chromium:headless tests/ -t ${it} --reporter junit:${REPORT_DIR}/results.xml || true", returnStatus: true) != 0)
                                remain << it
                        }
                        tests = remain
                    }

                    if (tests) {
                        persistFails = tests
                        echo "🚨 Persistently failed tests: ${persistFails}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Archive & Publish Test Results') {
            steps {
                archiveArtifacts artifacts: "${REPORT_DIR}/*.xml", fingerprint: true
                junit "${REPORT_DIR}/*.xml"
            }
        }
    }

    post {
        success {
            echo "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        unstable {
            echo "⚠️ Build Unstable: ${env.JOB_NAME} #${env.BUILD_NUMBER}\nSome tests failed persistently."
        }
        failure {
            echo "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        always {
            echo "Pipeline done. Reports in ${REPORT_DIR}."
        }
    }
}
