pipeline {
    agent { label 'ubuntu-agent' }

    triggers {
        cron('H/2 * * * *') // run every 2 minutes
    }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
        FAILURES = ''
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
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
                            if (failedTests.isEmpty()) {
                                echo "\u001B[32m✅ All tests passed before reaching retry #${attempt}\u001B[0m"
                                break
                            }

                            echo "\u001B[33m🔁 Retry #${attempt} for: ${failedTests}\u001B[0m"
                            def currentFailures = []

                            for (test in failedTests) {
                                echo "Running ${test}..."
                                // Simulate test execution
                                def passed = (new Random().nextBoolean())  // Replace with actual test command
                                if (passed) {
                                    echo "\u001B[32m✅ ${test} passed\u001B[0m"

