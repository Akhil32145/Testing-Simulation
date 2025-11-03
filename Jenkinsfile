pipeline {
    agent any

    environment {
        MAX_RETRIES = 5
        REPORT_PATH = "reports/results.json"
        PERSISTENT_FAIL_FILE = "reports/persistent_failures.json"
        EMAIL_RECIPIENTS = "akhilkhan26202@gmail.com" 
    }

    triggers {
        cron('* * * * *')
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Install & Run Tests') {
            steps {
                sh 'npm install'
                sh 'npx testcafe "chromium:headless" tests/ --reporter json:${REPORT_PATH} || true'
            }
        }

        stage('Retry Failed Tests') {
            steps {
                script {
                    def retries = 0
                    def persistentFails = []

                    while (retries < env.MAX_RETRIES.toInteger() && fileExists(env.REPORT_PATH)) {
                        def results = readJSON(file: env.REPORT_PATH)
                        // Collect only failed tests
                        def failedTests = results?.fixtures?.collectMany { f ->
                            f.tests?.findAll { t -> t?.errs?.size() > 0 }?.collect { it.name } ?: []
                        } ?: []

                        if (failedTests.isEmpty()) break

                        echo "Retry #${retries+1} for failed tests: ${failedTests}"
                        failedTests.each { testName ->
                            sh "npx testcafe 'chromium:headless' tests/ -t '${testName}' --reporter json:${REPORT_PATH} || true"
                        }

                        retries++
                        if (retries == env.MAX_RETRIES.toInteger()) persistentFails = failedTests
                    }

                    if (persistentFails) {
                        writeJSON file: env.PERSISTENT_FAIL_FILE, json: [persistent_failures: persistentFails]
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Notify Persistent Failures') {
            when {
                expression { fileExists(env.PERSISTENT_FAIL_FILE) }
            }
            steps {
                script {
                    def persistentContent = readJSON(file: env.PERSISTENT_FAIL_FILE).persistent_failures
                    def htmlTable = "<table border='1' cellpadding='5'><tr><th>Failed Test Name</th></tr>"
                    persistentContent.each { test ->
                        htmlTable += "<tr><td>${test}</td></tr>"
                    }
                    htmlTable += "</table>"

                    emailext(
                        subject: "Jenkins Build Unstable: Persistent Test Failures Detected",
                        to: "${EMAIL_RECIPIENTS}",
                        body: """<h3>Persistent Failures after ${MAX_RETRIES} retries:</h3>
                                ${htmlTable}
                                <br>Check details at: <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a>""",
                        mimeType: 'text/html',
                        attachLog: true
                    )
                }
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'reports/*.json', fingerprint: true
            }
        }
    }

    post {
        unstable {
            script {
                // Fallback email if persistent fail stage is skipped
                if (!fileExists(env.PERSISTENT_FAIL_FILE)) {
                    emailext(
                        subject: "Jenkins Build Unstable",
                        to: "${EMAIL_RECIPIENTS}",
                        body: "The build finished UNSTABLE. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
    }
}

