pipeline {
    agent any

    environment {
        MAX_RETRIES = 5 
        REPORT_PATH = "reports/results.json"
        PERSISTENT_FAIL_FILE = "reports/persistent_failures.json"
        EMAIL_RECIPIENTS = "akhilkhan26202@gmail.com" 
    }

    triggers {
 
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Initial Test Suite') {
            steps {
                sh 'npx testcafe "chromium:headless" tests/ --reporter json:${REPORT_PATH} || true'
            }
        }

        stage('Parse and Retry Failed Tests') {
            steps {
                script {
                    def maxRetries = env.MAX_RETRIES.toInteger()
                    def retryCount = 0
                    def persistentFails = []

                    while (retryCount < maxRetries) {
                        if (!fileExists(env.REPORT_PATH)) {
                            error "Report file not found: ${env.REPORT_PATH}"
                        }

                        def results = readJSON file: env.REPORT_PATH
                        def failedTests = results.fixtures.collectMany { f ->
                            f.tests.findAll { t -> t.errs && t.errs.size() > 0 }.collect { t.name }
                        }

                        if (failedTests.isEmpty()) {
                            echo "✅ All tests passed!"
                            break
                        }

                        echo "⚠️ Retry #${retryCount+1} for failed tests: ${failedTests}"

                        for (testName in failedTests) {
                            sh "npx testcafe 'chromium:headless' tests/ -t '${testName}' --reporter json:${REPORT_PATH} || true"
                        }

                        retryCount++
                        if (retryCount == maxRetries) {
                            persistentFails = failedTests
                        }
                    }

                    if (persistentFails) {
                        writeJSON file: env.PERSISTENT_FAIL_FILE, json: [persistent_failures: persistentFails]
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Send Email for Persistent Failures') {
            when {
                expression { fileExists(env.PERSISTENT_FAIL_FILE) }
            }
            steps {
                emailext(
                    subject: "Persistent Test Failures Detected",
                    to: "${EMAIL_RECIPIENTS}",
                    body: """
                        <h3>Persistent Failures after ${MAX_RETRIES} retries:</h3>
                        <pre>${readFile(env.PERSISTENT_FAIL_FILE)}</pre>
                        <br>Check details: ${env.BUILD_URL}
                    """,
                    attachLog: true
                )
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'reports/*.json', fingerprint: true
            }
        }
    }
}
