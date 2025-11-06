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
                    def success = false

                    // Ensure report directory exists
                    sh "mkdir -p ${env.REPORT_DIR}"

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        echo "🔁 Attempt #${attempt}: Running all tests together with concurrency 4"

                        // Run all tests once, collect results
                        def status = sh(
                            script: """
                                npx testcafe chromium:headless tests/flaky-test.js \
                                --concurrency 4 \
                                --reporter junit:${env.REPORT_DIR}/all-tests.xml || true
                            """,
                            returnStatus: true
                        )

                        // Read XML result to check if there were any failures
                        def resultXml = readFile("${env.REPORT_DIR}/all-tests.xml")

                        if (!resultXml.contains('failures="') || resultXml.contains('failures="0"')) {
                            echo "✅ All tests passed on attempt #${attempt}"
                            success = true
                            break
                        } else {
                            echo "⚠️ Some tests failed on attempt #${attempt}, retrying..."
                        }
                    }

                    if (success) {
                        echo "✅ All tests passed after retries"
                        currentBuild.result = 'SUCCESS'
                    } else {
                        echo "⚠️ Tests still failing after ${retries} retries"
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

