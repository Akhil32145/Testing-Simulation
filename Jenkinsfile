pipeline {
    agent any
    environment {
        MAX_RETRIES = 5
        REPORT_PATH = "reports/results.json"
        PERSISTENT_FAIL_FILE = "reports/persistent_failures.json"
        SLACK_CRED_ID = "slack-webhook"
    }
    triggers { cron('* * * * *'); pollSCM('H/5 * * * *') }
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
                    def retries=0; def persistentFails=[]
                    while(retries<env.MAX_RETRIES.toInteger() && fileExists(env.REPORT_PATH)) {
                        def results=readJSON(file: env.REPORT_PATH)
                        def failedTests=results?.fixtures?.collectMany{f->f.tests?.findAll{it?.errs?.size()>0}?.collect{it.name}?:[] }?:[]
                        if(failedTests.isEmpty()) break
                        echo "Retry #${retries+1} for failed: ${failedTests}"
                        failedTests.each{sh "npx testcafe 'chromium:headless' tests/ -t '${it}' --reporter json:${REPORT_PATH} || true"}
                        retries++; if(retries==env.MAX_RETRIES.toInteger()) persistentFails=failedTests
                    }
                    if(persistentFails) writeJSON file: env.PERSISTENT_FAIL_FILE, json:[persistent_failures:persistentFails]
                }
            }
        }
        stage('Archive Reports') { steps { archiveArtifacts artifacts: 'reports/*.json', fingerprint: true } }
    }
    post {
        always {
            script {
                if(fileExists(env.PERSISTENT_FAIL_FILE)) {
                    def msg = "Persistent failures after ${MAX_RETRIES} retries:\n${readFile(env.PERSISTENT_FAIL_FILE)}\n${env.BUILD_URL}"
                    withCredentials([string(credentialsId: env.SLACK_CRED_ID, variable: 'SLACK_URL')]) {
                        sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${msg}\"}' $SLACK_URL"
                    }
                }
            }
        }
    }
}

