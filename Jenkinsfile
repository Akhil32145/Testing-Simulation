pipeline {
    agent { label 'ubuntu-agent' }
    triggers { cron('H/2 * * * *') } // Every 2 mins
    parameters { string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Retries for failed tests') }

    environment {
        REPORT_DIR = 'reports'
        SLACK_CHANNEL = '#jenkins-notifications'  // ✅ Change to your Slack channel
        FAILURES = ''
    }

    options { ansiColor('xterm'); timestamps() }

    stages {
        stage('Setup') {
            steps {
                checkout scm
                sh 'npm install'
            }
        }

        stage('Run Tests with Retries') {
            steps {
                script {
                    def retries = params.RETRY_COUNT.toInteger()
                    def allTests = ["LoginTest","SignupTest","SearchTest","CheckoutTest","PaymentTest","LogoutTest"]
                    def passed = []; def failed = allTests

                    for (int i = 1; i <= retries && !failed.isEmpty(); i++) {
                        echo "\u001B[33m🔁 Attempt #${i}: Running ${failed}\u001B[0m"
                        def curFail = []
                        for (t in failed) {
                            def ok = (new Random().nextBoolean()) // replace with real test command
                            ok ? echo "\u001B[32m✅ ${t} passed\u001B[0m" : curFail << t
                        }
                        passed += (failed - curFail)
                        failed = curFail
                    }

                    env.FAILURES = failed.join(', ')
                    currentBuild.result = failed ? 'UNSTABLE' : 'SUCCESS'
                    echo failed ? "\u001B[31m❌ Persistent Fails: ${env.FAILURES}\u001B[0m"
                                : "\u001B[32m✅ All tests passed in ${retries} retries\u001B[0m"

                    // HTML summary
                    writeFile file: "${REPORT_DIR}/summary.html", text: """
                    <html><body>
                    <h2>Test Summary</h2>
                    <table border=1 cellpadding=5>
                    ${allTests.collect{t->"<tr><td>${t}</td><td>${passed.contains(t)?'✅ Passed':'❌ Failed'}</td></tr>"}.join('')}
                    </table>
                    </body></html>
                    """
                }
            }
        }

        stage('Archive & Report') {
            steps {
                archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
                publishHTML(target: [reportDir: 'reports', reportFiles: 'summary.html', reportName: 'Test Summary'])
            }
        }

        stage('Slack Notify') {
            steps {
                script {
                    def report = "${env.BUILD_URL}artifact/reports/summary.html"
                    def dur = currentBuild.durationString.replace('and counting', '').trim()

                    def msg = (currentBuild.result == 'UNSTABLE') ?
                        """*⚠️ Build Unstable — Some Tests Failed*
• *Failed:* ${env.FAILURES}
• *Duration:* ${dur}
• *Report:* <${report}|View Report>
🤖 Jenkins CI Bot""" :
                        """*✅ Build Success — All Tests Passed*
• *Retries Used:* ${params.RETRY_COUNT}
• *Duration:* ${dur}
• *Report:* <${report}|View Report>
🤖 Jenkins CI Bot"""

                    slackSend channel: env.SLACK_CHANNEL,
                              color: (currentBuild.result == 'UNSTABLE') ? '#FF0000' : '#36a64f',
                              message: msg
                }
            }
        }
    }

    post {
        always {
            echo "\u001B[36m🧹 Cleanup workspace...\u001B[0m"
            cleanWs()
        }
    }
}

