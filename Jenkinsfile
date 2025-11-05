pipeline {
    agent any
    environment {
        REPORTS_DIR = "reports"
        MAX_RETRIES = 3
    }
    triggers {
        // Run every 3 minutes
        cron('H/3 * * * *')
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // List of all tests
                    def tests = [
                        "LoginTest",
                        "SignupTest",
                        "SearchTest",
                        "CheckoutTest",
                        "ProfileUpdateTest",
                        "LogoutTest",
                        "AddToCartTest",
                        "RemoveFromCartTest",
                        "PaymentTest",
                        "OrderHistoryTest",
                        "FilterTest",
                        "SortTest",
                        "WishlistTest",
                        "ReviewTest",
                        "NotificationTest"
                    ]

                    if (!fileExists(REPORTS_DIR)) {
                        sh "mkdir -p ${REPORTS_DIR}"
                    }

                    def persistentFailures = []

                    // Loop through tests
                    tests.each { test ->
                        def success = false
                        def attempt = 1

                        while(attempt <= MAX_RETRIES && !success) {
                            echo "Running ${test} - Attempt ${attempt}"

                            // Run TestCafe for the individual test
                            def result = sh(
                                script: "npx testcafe chromium:headless tests/flaky-test.js -t ${test} --reporter junit:${REPORTS_DIR}/${test}.xml",
                                returnStatus: true
                            )

                            if (result == 0) {
                                success = true
                                echo "${test} PASSED on attempt ${attempt}"
                            } else {
                                echo "${test} FAILED on attempt ${attempt}"
                                attempt++
                            }
                        }

                        if (!success) {
                            persistentFailures.add(test)
                        }
                    }

                    // Save persistent failures to environment variable for post actions
                    env.PERSISTENT_FAILURES = persistentFailures.join(',')
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                junit 'reports/*.xml'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/*.xml', allowEmptyArchive: true
        }
        success {
            script {
                if (env.PERSISTENT_FAILURES?.trim()) {
                    echo "⚠️ Build Succeeded BUT some tests failed persistently: ${env.PERSISTENT_FAILURES}"
                } else {
                    echo "✅ Build Succeeded - All tests passed!"

